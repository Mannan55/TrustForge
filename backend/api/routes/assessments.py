"""
Assessment endpoints.

POST /api/assessments            — Submit wizard answers + optional scan URL, run evaluation pipeline
GET  /api/assessments/{id}       — Retrieve assessment status + full result
"""
from __future__ import annotations

import json
import logging
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, HTTPException, UploadFile, File
from pydantic import BaseModel

from core.models import AssessmentAnswers, TrustScoreResult, TIEResult
from core.database import get_session
from core.db_models import Organization, Assessment, DBEvidenceItem, DBTIEResult, DBTrustScore

logger = logging.getLogger(__name__)
router = APIRouter()


class AssessmentRequest(BaseModel):
    """Request to create and run an assessment."""
    org_id: str
    website_url: Optional[str] = None   # if provided, scan will be run
    collections: list[str] = []
    categories: list[str] = []
    purposes: list[str] = []
    languages: list[str] = []
    rights: list[str] = []
    processors: list[str] = []
    retention: str = ""
    erasure_automated: bool = False
    breach_plan: bool = False
    grievance_officer_named: bool = False
    grievance_contact_published: bool = False


class AssessmentResponse(BaseModel):
    assessment_id: str
    status: str
    message: str


class AssessmentResultResponse(BaseModel):
    assessment_id: str
    org_id: str
    status: str
    website_url: Optional[str] = None
    trust_score: Optional[float] = None
    posture: Optional[str] = None
    findings: list[dict] = []
    evidence: list[dict] = []
    pillar_scores: list[dict] = []
    total_controls: int = 0
    pass_count: int = 0
    potential_gap_count: int = 0
    fail_count: int = 0
    insufficient_evidence_count: int = 0
    error: Optional[str] = None
    created_at: Optional[str] = None
    completed_at: Optional[str] = None


@router.post("/assessments", response_model=AssessmentResponse)
async def create_assessment(
    req: AssessmentRequest,
    background_tasks: BackgroundTasks,
) -> AssessmentResponse:
    """
    Accept Assessment Wizard answers and trigger the full evaluation pipeline:
      evidence normalization → control mapping → RAG retrieval → TIE → Trust Score → DB persist.

    The pipeline runs asynchronously; poll GET /api/assessments/{id} for status.
    Use status="complete" to know results are ready.
    """
    import uuid
    assessment_id = str(uuid.uuid4())
    logger.info(f"Assessment submitted for org {req.org_id}, id={assessment_id}")

    # Convert request to AssessmentAnswers for pipeline
    answers = AssessmentAnswers(
        org_id=req.org_id,
        collections=req.collections,
        categories=req.categories,
        purposes=req.purposes,
        languages=req.languages,
        rights=req.rights,
        processors=req.processors,
        retention=req.retention,
        erasure_automated=req.erasure_automated,
        breach_plan=req.breach_plan,
        grievance_officer_named=req.grievance_officer_named,
        grievance_contact_published=req.grievance_contact_published,
    )

    # Persist assessment record first (status=pending)
    async with get_session() as session:
        # Ensure org exists (create a default if not found for demo)
        org = await session.get(Organization, req.org_id)
        if org is None:
            org = Organization(
                id=req.org_id,
                legal_name=f"Organization {req.org_id[:8]}",
                display_name=f"Org {req.org_id[:8]}",
            )
            session.add(org)

        assessment = Assessment(
            id=assessment_id,
            org_id=req.org_id,
            status="pending",
            wizard_answers_json=json.dumps(req.dict()),
        )
        session.add(assessment)

    # Run pipeline in background
    background_tasks.add_task(
        _run_evaluation_pipeline,
        assessment_id=assessment_id,
        answers=answers,
        website_url=req.website_url,
    )

    return AssessmentResponse(
        assessment_id=assessment_id,
        status="accepted",
        message="Assessment accepted. Evaluation pipeline started. Poll GET /api/assessments/{id} for results.",
    )


@router.get("/assessments")
async def list_assessments(status: Optional[str] = None):
    """List stored assessments, optionally filtered by status."""
    from sqlalchemy import select, desc
    async with get_session() as session:
        q = select(Assessment).order_by(desc(Assessment.created_at))
        if status:
            q = q.where(Assessment.status == status)
        result = await session.execute(q)
        assessments = result.scalars().all()
        items = []
        for a in assessments:
            score_q = select(DBTrustScore).where(DBTrustScore.assessment_id == a.id)
            score_res = await session.execute(score_q)
            db_score = score_res.scalar_one_or_none()
            items.append({
                "assessment_id": a.id,
                "org_id": a.org_id,
                "status": a.status,
                "trust_score": db_score.trust_score if db_score else None,
                "posture": db_score.posture if db_score else None,
                "created_at": a.created_at.isoformat() if a.created_at else None,
                "completed_at": a.completed_at.isoformat() if a.completed_at else None,
            })
        return items


@router.get("/assessments/latest", response_model=AssessmentResultResponse)
async def get_latest_assessment(org_id: Optional[str] = None) -> AssessmentResultResponse:
    """Retrieve the latest completed assessment."""
    from sqlalchemy import select, desc
    async with get_session() as session:
        q = select(Assessment).where(Assessment.status == "complete").order_by(desc(Assessment.completed_at))
        if org_id:
            q = q.where(Assessment.org_id == org_id)
        result = await session.execute(q)
        assessment = result.scalars().first()
        if not assessment:
            raise HTTPException(status_code=404, detail="No completed assessment found")
        aid = assessment.id
    return await get_assessment(aid)


@router.post("/assessments/{assessment_id}/evidence/upload")
async def upload_evidence(
    assessment_id: str,
    file: UploadFile = File(...),
):
    """
    Upload real evidence document attached to an assessment.
    Validates file format and size, associates with assessment, persists to DB.
    """
    import os
    import uuid
    async with get_session() as session:
        assessment = await session.get(Assessment, assessment_id)
        if not assessment:
            raise HTTPException(status_code=404, detail="Assessment not found")

    filename = file.filename or "unknown_file"
    ext = os.path.splitext(filename)[1].lower()
    if ext not in {".pdf", ".docx", ".doc", ".txt", ".png", ".jpg", ".jpeg"}:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Supported types: PDF, DOCX, DOC, TXT, PNG, JPG."
        )

    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File exceeds maximum size of 10 MB.")

    size_kb = round(len(content) / 1024, 1)
    ev_id = f"ev-upload-{uuid.uuid4().hex[:12]}"
    title = f"Uploaded Document: {filename}"
    notes = f"Uploaded document '{filename}' ({size_kb} KB, {file.content_type or 'binary'}). Document metadata registered and attached to assessment."
    method = f"Document upload verified by TrustForge (size: {len(content)} bytes)"

    async with get_session() as session:
        db_ev = DBEvidenceItem(
            id=ev_id,
            assessment_id=assessment_id,
            source="document_upload",
            key=f"doc_{uuid.uuid4().hex[:8]}",
            title=title,
            status="DETECTED",
            observed=True,
            value_json=json.dumps({"filename": filename, "size_bytes": len(content), "content_type": file.content_type}),
            url=None,
            confidence="HIGH",
            notes=notes,
            method=method,
        )
        session.add(db_ev)

    return {
        "evidence_id": ev_id,
        "assessment_id": assessment_id,
        "title": title,
        "source": "document_upload",
        "status": "DETECTED",
        "confidence": "HIGH",
        "notes": notes,
        "method": method,
        "filename": filename,
        "size_kb": size_kb,
        "message": "Evidence successfully uploaded and associated with assessment.",
    }


@router.get("/assessments/{assessment_id}", response_model=AssessmentResultResponse)
async def get_assessment(assessment_id: str) -> AssessmentResultResponse:
    """Retrieve assessment status and full results."""
    async with get_session() as session:
        assessment = await session.get(Assessment, assessment_id)
        if assessment is None:
            raise HTTPException(status_code=404, detail="Assessment not found")

        # Gather findings (TIE results)
        from sqlalchemy import select
        findings_query = select(DBTIEResult).where(DBTIEResult.assessment_id == assessment_id)
        findings_result = await session.execute(findings_query)
        db_findings = findings_result.scalars().all()

        # Gather evidence
        evidence_query = select(DBEvidenceItem).where(DBEvidenceItem.assessment_id == assessment_id)
        evidence_result = await session.execute(evidence_query)
        db_evidence = evidence_result.scalars().all()

        # Gather trust score
        score_query = select(DBTrustScore).where(DBTrustScore.assessment_id == assessment_id)
        score_result = await session.execute(score_query)
        db_score = score_result.scalar_one_or_none()

        findings_list = [
            {
                "control_id": f.control_id,
                "status": f.status,
                "severity": f.severity,
                "finding": f.finding,
                "explanation": f.explanation,
                "recommendation": f.recommendation,
                "evidence_ids": json.loads(f.evidence_ids_json or "[]"),
                "citations": json.loads(f.citations_json or "[]"),
                "confidence": f.confidence,
                "evaluation_method": f.evaluation_method,
                "error": f.error,
            }
            for f in db_findings
        ]

        evidence_list = [
            {
                "evidence_id": e.id,
                "source": e.source,
                "key": e.key,
                "title": e.title,
                "status": e.status,
                "observed": e.observed,
                "value": json.loads(e.value_json) if e.value_json else None,
                "url": e.url,
                "confidence": e.confidence,
                "notes": e.notes,
                "method": e.method,
            }
            for e in db_evidence
        ]

        pillar_scores = []
        trust_score_val = None
        posture = None
        total_controls = 0
        pass_count = 0
        potential_gap_count = 0
        fail_count = 0
        insufficient_count = 0

        if db_score:
            trust_score_val = db_score.trust_score
            posture = db_score.posture
            pillar_scores = json.loads(db_score.pillar_scores_json or "[]")
            total_controls = db_score.total_controls
            pass_count = db_score.pass_count
            potential_gap_count = db_score.potential_gap_count
            fail_count = db_score.fail_count
            insufficient_count = db_score.insufficient_evidence_count

        wizard = json.loads(assessment.wizard_answers_json or "{}")

        return AssessmentResultResponse(
            assessment_id=assessment_id,
            org_id=assessment.org_id,
            status=assessment.status,
            website_url=wizard.get("website_url"),
            trust_score=trust_score_val,
            posture=posture,
            findings=findings_list,
            evidence=evidence_list,
            pillar_scores=pillar_scores,
            total_controls=total_controls,
            pass_count=pass_count,
            potential_gap_count=potential_gap_count,
            fail_count=fail_count,
            insufficient_evidence_count=insufficient_count,
            created_at=assessment.created_at.isoformat() if assessment.created_at else None,
            completed_at=assessment.completed_at.isoformat() if assessment.completed_at else None,
        )


# ─── Pipeline implementation ──────────────────────────────────────────────────

async def _run_evaluation_pipeline(
    assessment_id: str,
    answers: AssessmentAnswers,
    website_url: Optional[str],
) -> None:
    """
    Full TrustForge evaluation pipeline:
      1. Run website scan (if URL provided)
      2. Normalize wizard answers to evidence
      3. Combine scanner + wizard evidence
      4. For each of the 20 controls:
         a. Gather relevant evidence
         b. Evaluate via TIE (deterministic or RAG-grounded)
      5. Compute deterministic Trust Score
      6. Persist everything to DB
    """
    import json
    from datetime import datetime, timezone
    from core.database import get_session
    from core.db_models import Assessment, DBEvidenceItem, DBTIEResult, DBTrustScore
    from core.models import EvidenceItem
    from compliance.controls import CONTROLS
    from compliance.evidence_mapper import wizard_answers_to_evidence, get_control_evidence
    from compliance.tie_evaluator import evaluate_control
    from compliance.trust_score import compute_trust_score

    logger.info(f"[Pipeline] Starting evaluation for assessment {assessment_id}")

    # Update status to running
    async with get_session() as session:
        assessment = await session.get(Assessment, assessment_id)
        if assessment:
            assessment.status = "running"

    try:
        # ── Step 1: Website scan (optional) ───────────────────────────────────
        scanner_evidence: list[EvidenceItem] = []
        if website_url:
            try:
                from scanner.engine import run_scan
                logger.info(f"[Pipeline] Scanning {website_url}")
                scan_result = await run_scan(website_url)
                scanner_evidence = scan_result.evidence
                logger.info(f"[Pipeline] Scan complete: {len(scanner_evidence)} evidence items")
            except Exception as exc:
                logger.warning(f"[Pipeline] Scan failed for {website_url}: {exc}")

        # ── Step 2: Normalize wizard answers ──────────────────────────────────
        wizard_evidence = wizard_answers_to_evidence(answers)
        logger.info(f"[Pipeline] Wizard produced {len(wizard_evidence)} evidence items")

        # ── Step 3: Combine evidence ──────────────────────────────────────────
        all_evidence: list[EvidenceItem] = scanner_evidence + wizard_evidence

        # ── Step 4: Persist evidence to DB ────────────────────────────────────
        async with get_session() as session:
            for ev in all_evidence:
                db_ev = DBEvidenceItem(
                    id=ev.evidence_id,
                    assessment_id=assessment_id,
                    source=ev.source.value,
                    key=ev.key,
                    title=ev.title,
                    status=ev.status.value,
                    observed=ev.observed,
                    value_json=json.dumps(ev.value) if ev.value is not None else "null",
                    url=ev.url,
                    confidence=ev.confidence.value,
                    notes=ev.notes,
                    method=ev.method,
                )
                session.add(db_ev)

        # ── Steps 5–8: Evaluate each control via TIE ─────────────────────────
        tie_results = []
        for control in CONTROLS:
            control_evidence = get_control_evidence(control, all_evidence)
            logger.info(
                f"[Pipeline] Evaluating {control.control_id} "
                f"({len(control_evidence)} evidence items)"
            )
            try:
                result = await evaluate_control(control, control_evidence)
                # Brief pause only between LLM calls to respect rate limits
                from core.models import EvaluationMethod
                if result.evaluation_method != EvaluationMethod.DETERMINISTIC:
                    import asyncio
                    await asyncio.sleep(0.5)
            except Exception as exc:
                logger.error(f"[Pipeline] TIE failed for {control.control_id}: {exc}")
                from core.models import TIEResult, ControlStatus, EvaluationMethod
                result = TIEResult(
                    control_id=control.control_id,
                    status=ControlStatus.INSUFFICIENT_EVIDENCE,
                    severity=control.severity,
                    finding=f"Evaluation failed: {exc}",
                    explanation="An error occurred during evaluation. Manual review required.",
                    recommendation="Check system logs and retry the assessment.",
                    evidence_ids=[e.evidence_id for e in control_evidence],
                    citations=[],
                    confidence=0.0,
                    evaluation_method=EvaluationMethod.DETERMINISTIC,
                    error=str(exc),
                )
            tie_results.append(result)

        # ── Step 9: Persist TIE results ───────────────────────────────────────
        async with get_session() as session:
            for result in tie_results:
                db_tie = DBTIEResult(
                    assessment_id=assessment_id,
                    control_id=result.control_id,
                    status=result.status.value,
                    severity=result.severity.value,
                    finding=result.finding,
                    explanation=result.explanation,
                    recommendation=result.recommendation,
                    evidence_ids_json=json.dumps(result.evidence_ids),
                    citations_json=json.dumps([c.dict() for c in result.citations]),
                    confidence=result.confidence,
                    evaluation_method=result.evaluation_method.value,
                    error=result.error,
                )
                session.add(db_tie)

        # ── Step 10: Compute Trust Score ──────────────────────────────────────
        trust_score = compute_trust_score(assessment_id, tie_results)
        logger.info(
            f"[Pipeline] Trust Score: {trust_score.trust_score} ({trust_score.posture}) "
            f"for assessment {assessment_id}"
        )

        # ── Step 11: Persist Trust Score ──────────────────────────────────────
        async with get_session() as session:
            db_score = DBTrustScore(
                assessment_id=assessment_id,
                trust_score=trust_score.trust_score,
                posture=trust_score.posture,
                pillar_scores_json=json.dumps(
                    [
                        {
                            "pillar": ps.pillar.value,
                            "score": ps.score,
                            "weight": ps.weight,
                            "evidence_coverage": ps.evidence_coverage,
                            "control_count": ps.control_count,
                            "applicable_control_count": ps.applicable_control_count,
                            "is_not_applicable": ps.is_not_applicable,
                        }
                        for ps in trust_score.pillar_scores
                    ]
                ),
                total_controls=trust_score.total_controls,
                pass_count=trust_score.pass_count,
                potential_gap_count=trust_score.potential_gap_count,
                fail_count=trust_score.fail_count,
                insufficient_evidence_count=trust_score.insufficient_evidence_count,
                scoring_version=trust_score.scoring_version,
            )
            session.add(db_score)

        # ── Step 12: Mark assessment complete ─────────────────────────────────
        async with get_session() as session:
            assessment = await session.get(Assessment, assessment_id)
            if assessment:
                assessment.status = "complete"
                assessment.completed_at = datetime.now(timezone.utc)

        logger.info(f"[Pipeline] Assessment {assessment_id} complete. Score: {trust_score.trust_score}")

    except Exception as exc:
        logger.exception(f"[Pipeline] Fatal error for assessment {assessment_id}: {exc}")
        async with get_session() as session:
            assessment = await session.get(Assessment, assessment_id)
            if assessment:
                assessment.status = "error"
