"""
TrustForge — Frugal AI Orchestrator

Implements the Hybrid/Frugal AI Architecture:
  Layer A: Deterministic rule checks (0 LLM calls)
  Layer B: RAG retrieval (local embeddings, 0 LLM calls)
  Layer C: AI semantic evaluation (LLM, only when necessary)

For each assessment run this module:
  1. Runs deterministic controls (Layer A)
  2. Tries to resolve UNKNOWN controls via RAG context (Layer B)
  3. Calls AI only for controls still UNKNOWN after RAG (Layer C)
  4. Records frugal AI metrics for the entire run

Research metric: Rule Resolution Rate = deterministic_resolved / total_controls
"""
from __future__ import annotations

import time
import uuid
from typing import Optional

from app.config import settings
from app.schemas import (
    ControlEvaluation, ControlStatus, ConfidenceLevel, FrugalAIMetrics,
    AssessmentRequest, ScanResult, EvidenceAnalysisResult,
)
from app.services.trust_score_engine import compute_trust_score, generate_findings
from app.services.rule_engine import evaluate_controls_deterministic, load_scoring_config
from app.services.rag_engine import retrieve, is_index_built


def _rag_resolve_control(
    ctrl: ControlEvaluation,
    evidence_summaries: list[EvidenceAnalysisResult],
    answers: dict,
) -> ControlEvaluation:
    """
    Attempt to resolve an UNKNOWN control using RAG retrieval.
    Returns the control (possibly with updated status if RAG provides enough signal).
    
    For research transparency: we do NOT automatically assign PASS/FAIL from RAG alone
    without a clear deterministic signal. RAG here provides context but the final
    evaluation still requires explicit signals.
    """
    if not is_index_built():
        return ctrl

    # Build query from control title and DPDP reference
    query = f"{ctrl.title}. {ctrl.dpdp_reference or ''}"
    try:
        rag_result = retrieve(query, top_k=3)
    except Exception:
        return ctrl

    if not rag_result.chunks:
        return ctrl

    # For evidence-based controls: check if topic appears in evidence + RAG confirms relevance
    if ctrl.control_id in ("C4_03", "C5_03"):
        # Check evidence topics for retention/processor mentions
        ev_topics = set()
        for ev in evidence_summaries:
            ev_topics.update(ev.extracted_topics)

        if ctrl.control_id == "C5_03" and "retention" in ev_topics:
            return ControlEvaluation(
                **{
                    **ctrl.model_dump(),
                    "status": ControlStatus.PARTIAL,
                    "confidence": ConfidenceLevel.LOW,
                    "notes": (
                        "RAG retrieved relevant retention provisions. Evidence contains retention keywords. "
                        "Manual review recommended to confirm adequacy."
                    ),
                    "evaluation_method": "rag",
                }
            )

        if ctrl.control_id == "C4_03" and "processors" in ev_topics:
            return ControlEvaluation(
                **{
                    **ctrl.model_dump(),
                    "status": ControlStatus.PARTIAL,
                    "confidence": ConfidenceLevel.LOW,
                    "notes": (
                        "RAG retrieved relevant processor obligation provisions. Evidence mentions processor terms. "
                        "Manual review of DPA wording recommended."
                    ),
                    "evaluation_method": "rag",
                }
            )

    # Control remains UNKNOWN — cannot resolve without AI or manual review
    return ctrl


def _ai_resolve_control(
    ctrl: ControlEvaluation,
    evidence_summaries: list[EvidenceAnalysisResult],
    answers: dict,
    ai_metrics: dict,
) -> ControlEvaluation:
    """
    Layer C: Attempt AI semantic evaluation.
    Only called if AI_PROVIDER != "none" and control is still UNKNOWN.
    
    Currently implements a placeholder that logs the invocation.
    When AI_PROVIDER is set, this would call the configured provider.
    """
    provider = settings.ai_provider.lower()
    if provider == "none":
        return ctrl  # No AI configured — leave UNKNOWN

    # Increment AI call counter for metrics
    ai_metrics["ai_calls"] = ai_metrics.get("ai_calls", 0) + 1

    # Build prompt for AI evaluation
    # (Actual LLM call would go here when provider is configured)
    # For the research prototype, we return UNKNOWN with a note
    return ControlEvaluation(
        **{
            **ctrl.model_dump(),
            "status": ControlStatus.UNKNOWN,
            "notes": ctrl.notes + f" [AI provider '{provider}' invocation attempted but not yet implemented for this control.]",
            "evaluation_method": "ai",
        }
    )


def run_full_assessment(
    request: AssessmentRequest,
    scan_result: Optional[ScanResult] = None,
    evidence_summaries: Optional[list[EvidenceAnalysisResult]] = None,
) -> dict:
    """
    Main orchestration function for a complete assessment run.
    
    Returns:
        {
            "assessment_id": str,
            "trust_score": TrustScoreResult,
            "findings": list[Finding],
            "frugal_metrics": FrugalAIMetrics,
            "control_evaluations": list[ControlEvaluation],
        }
    """
    start_time = time.time()
    assessment_id = request.assessment_id or f"asmnt_{uuid.uuid4().hex[:8]}"
    evidence_summaries = evidence_summaries or []
    answers = request.answers

    # ── Layer A: Deterministic ────────────────────────────────────────────────
    control_evaluations = evaluate_controls_deterministic(
        answers=answers,
        scan_result=scan_result,
        evidence_summaries=evidence_summaries,
    )

    deterministic_resolved = sum(
        1 for c in control_evaluations
        if c.status in (ControlStatus.PASS, ControlStatus.PARTIAL, ControlStatus.FAIL)
        and c.evaluation_method == "deterministic"
    )

    # ── Layer B: RAG resolution ───────────────────────────────────────────────
    rag_resolved = 0
    for i, ctrl in enumerate(control_evaluations):
        if ctrl.status == ControlStatus.UNKNOWN:
            resolved = _rag_resolve_control(ctrl, evidence_summaries, answers)
            if resolved.status != ControlStatus.UNKNOWN:
                rag_resolved += 1
            control_evaluations[i] = resolved

    # ── Layer C: AI resolution ────────────────────────────────────────────────
    ai_metrics_raw: dict = {"ai_calls": 0}
    ai_resolved = 0
    for i, ctrl in enumerate(control_evaluations):
        if ctrl.status == ControlStatus.UNKNOWN:
            resolved = _ai_resolve_control(ctrl, evidence_summaries, answers, ai_metrics_raw)
            if resolved.status != ControlStatus.UNKNOWN:
                ai_resolved += 1
            control_evaluations[i] = resolved

    # ── Frugal AI Metrics ─────────────────────────────────────────────────────
    total_controls = len(control_evaluations)
    unknown_remaining = sum(1 for c in control_evaluations if c.status == ControlStatus.UNKNOWN)
    total_elapsed_ms = int((time.time() - start_time) * 1000)

    rule_resolution_rate = (
        (deterministic_resolved / total_controls * 100) if total_controls > 0 else 0.0
    )

    frugal_metrics = FrugalAIMetrics(
        total_controls=total_controls,
        deterministic_resolved=deterministic_resolved,
        rag_resolved=rag_resolved,
        ai_resolved=ai_resolved,
        unknown_unresolved=unknown_remaining,
        ai_calls_made=ai_metrics_raw.get("ai_calls", 0),
        input_tokens_used=0,
        output_tokens_used=0,
        estimated_cost_usd=0.0,
        total_execution_ms=total_elapsed_ms,
        rule_resolution_rate=round(rule_resolution_rate, 1),
    )

    # ── Trust Score Computation ───────────────────────────────────────────────
    trust_score = compute_trust_score(
        control_evaluations=control_evaluations,
        frugal_metrics=frugal_metrics,
        assessment_id=assessment_id,
    )

    # ── Findings Generation ───────────────────────────────────────────────────
    config = load_scoring_config()
    findings = generate_findings(trust_score.pillars, config=config)

    return {
        "assessment_id": assessment_id,
        "trust_score": trust_score,
        "findings": findings,
        "frugal_metrics": frugal_metrics,
        "control_evaluations": control_evaluations,
    }
