"""
Report endpoint — returns a structured assessment report from persisted DB data.
GET /api/reports/{assessment_id}
"""
from __future__ import annotations

import json
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from sqlalchemy import select

from core.database import get_session
from core.db_models import Assessment, DBTIEResult, DBTrustScore, DBEvidenceItem, Organization

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/reports/{assessment_id}")
async def get_report(assessment_id: str) -> dict:
    """
    Returns a structured compliance report for a completed assessment.
    Composed entirely from persisted DB data — no fabrication.
    """
    async with get_session() as session:
        assessment = await session.get(Assessment, assessment_id)
        if assessment is None:
            raise HTTPException(status_code=404, detail="Assessment not found")

        if assessment.status != "complete":
            raise HTTPException(
                status_code=409,
                detail=f"Assessment not complete yet (status={assessment.status}). "
                       "Poll GET /api/assessments/{id} until status=complete."
            )

        # Load org
        org = await session.get(Organization, assessment.org_id)
        org_name = org.legal_name if org else assessment.org_id

        # Load trust score
        score_result = await session.execute(
            select(DBTrustScore).where(DBTrustScore.assessment_id == assessment_id)
        )
        db_score = score_result.scalar_one_or_none()

        # Load findings (TIE results)
        findings_result = await session.execute(
            select(DBTIEResult).where(DBTIEResult.assessment_id == assessment_id)
        )
        db_findings = findings_result.scalars().all()

        # Load evidence
        evidence_result = await session.execute(
            select(DBEvidenceItem).where(DBEvidenceItem.assessment_id == assessment_id)
        )
        db_evidence = evidence_result.scalars().all()

    if db_score is None:
        raise HTTPException(
            status_code=404,
            detail="Trust Score not found for this assessment. Pipeline may have failed."
        )

    wizard = json.loads(assessment.wizard_answers_json or "{}")

    # Categorise findings
    critical_findings = []
    gaps = []
    passes = []
    for f in db_findings:
        entry = {
            "control_id": f.control_id,
            "status": f.status,
            "severity": f.severity,
            "finding": f.finding,
            "recommendation": f.recommendation,
            "citations": json.loads(f.citations_json or "[]"),
        }
        if f.status == "FAIL":
            critical_findings.append(entry)
        elif f.status == "POTENTIAL_GAP":
            gaps.append(entry)
        elif f.status == "PASS":
            passes.append(entry)

    pillar_scores = json.loads(db_score.pillar_scores_json or "[]")

    return {
        "report_id": f"RPT-{assessment_id[:8].upper()}",
        "assessment_id": assessment_id,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "org": {
            "id": assessment.org_id,
            "name": org_name,
        },
        "summary": {
            "trust_score": db_score.trust_score,
            "posture": db_score.posture,
            "total_controls": db_score.total_controls,
            "pass_count": db_score.pass_count,
            "potential_gap_count": db_score.potential_gap_count,
            "fail_count": db_score.fail_count,
            "insufficient_evidence_count": db_score.insufficient_evidence_count,
            "scoring_version": db_score.scoring_version,
        },
        "pillar_scores": pillar_scores,
        "critical_findings": critical_findings,
        "gaps": gaps,
        "passes": passes,
        "evidence_count": len(db_evidence),
        "website_url": wizard.get("website_url"),
        "assessment_completed_at": (
            assessment.completed_at.isoformat()
            if assessment.completed_at else None
        ),
        "disclaimer": (
            "This report represents a baseline assessment against the Digital Personal Data "
            "Protection Act, 2023 (India). It is not a legal compliance certificate. "
            "Findings are grounded in observed evidence and retrieved authoritative passages. "
            "Consult a qualified legal expert for regulatory advice."
        ),
    }
