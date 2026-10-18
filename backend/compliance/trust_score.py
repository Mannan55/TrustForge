"""
TrustForge Deterministic Trust Score Engine.

Computes the Trust Score from TIE control evaluation results.

Formula (documented here for research reproducibility):
  Outcome weights (per control):
    PASS                   = 1.0
    POTENTIAL_GAP          = 0.5
    FAIL                   = 0.0
    INSUFFICIENT_EVIDENCE  = 0.3
    UNKNOWN                = 0.3
    NOT_APPLICABLE         = excluded from denominator (sentinel -1.0)

  Per-pillar score:
    pillar_score = (sum(control_weight * outcome_weight) /
                    sum(control_weight for applicable controls)) * 100
    If ALL controls in a pillar are NOT_APPLICABLE, that pillar is itself
    marked NOT_APPLICABLE and excluded from the global weighted aggregation.

  Overall Trust Score:
    Applicable pillars only (those with >= 1 applicable control).
    trust_score = SUM(pillar_score * pillar_global_weight) /
                  SUM(pillar_global_weight for applicable pillars)
    This renormalizes the denominator when one or more pillars are entirely N/A.

    Edge case: if ALL pillars are NOT_APPLICABLE, trust_score = None and
    posture = "Not Scorable" (no applicable controls were evaluated).

  Rounding:
    Intermediate pillar scores are NOT rounded before aggregation.
    Final trust_score is rounded to 1 decimal place after aggregation.

  Posture bands (only when trust_score is defined):
    >= 80 -> Strong Alignment
    >= 65 -> Needs Attention
    >= 50 -> Potential Gaps
    <  50 -> Critical

  IMPORTANT: Missing evaluations (no TIEResult for a control) are treated as
  UNKNOWN (outcome_weight = 0.3), NOT as NOT_APPLICABLE.

This formula is deterministic: same inputs always produce identical outputs.
"""
from __future__ import annotations

import logging
from typing import Dict, List, Optional

from core.models import (
    ControlStatus,
    OUTCOME_WEIGHTS,
    PILLAR_WEIGHTS,
    Pillar,
    PillarScore,
    TIEResult,
    TrustScoreResult,
)
from compliance.controls import CONTROLS, CONTROL_MAP

logger = logging.getLogger(__name__)


def posture_for_score(score: float) -> str:
    if score >= 80:
        return "Strong Alignment"
    if score >= 65:
        return "Needs Attention"
    if score >= 50:
        return "Potential Gaps"
    return "Critical"


def compute_trust_score(
    assessment_id: str,
    tie_results: List[TIEResult],
) -> TrustScoreResult:
    """
    Compute the deterministic Trust Score from a list of TIE results.

    NOT_APPLICABLE handling (P0.2 corrected behavior):
      - Controls marked NOT_APPLICABLE are excluded from per-pillar denominator.
      - If an entire pillar has zero applicable controls, that pillar is excluded
        from the global weighted aggregation and its weight is redistributed to
        the remaining applicable pillars (renormalization).
      - If ALL pillars have zero applicable controls, trust_score = None and
        posture = "Not Scorable".
      - Missing TIEResult entries are treated as UNKNOWN (weight 0.3), not N/A.

    Args:
        assessment_id: The assessment this score belongs to
        tie_results: All TIE evaluation results for this assessment

    Returns:
        TrustScoreResult with overall score, pillar breakdown, and counts.
    """
    # Build lookup of results by control_id
    result_map: Dict[str, TIEResult] = {r.control_id: r for r in tie_results}

    pillar_scores: List[PillarScore] = []

    # Aggregate outcome counts (across all controls, including N/A)
    pass_count = 0
    potential_gap_count = 0
    fail_count = 0
    insufficient_count = 0
    total_controls = len(CONTROLS)

    for r in tie_results:
        if r.status == ControlStatus.PASS:
            pass_count += 1
        elif r.status == ControlStatus.POTENTIAL_GAP:
            potential_gap_count += 1
        elif r.status == ControlStatus.FAIL:
            fail_count += 1
        elif r.status in (ControlStatus.INSUFFICIENT_EVIDENCE, ControlStatus.UNKNOWN):
            insufficient_count += 1
        # NOT_APPLICABLE is deliberately excluded from counts above

    # ── Per-pillar computation ────────────────────────────────────────────────
    # We collect (pillar_score, pillar_global_weight) for applicable pillars only.
    applicable_pillar_contributions: List[tuple[float, float]] = []

    for pillar in Pillar:
        pillar_global_weight = PILLAR_WEIGHTS.get(pillar, 0.0)
        if pillar_global_weight <= 0:
            continue

        controls_in_pillar = [c for c in CONTROLS if c.pillar == pillar]
        if not controls_in_pillar:
            continue

        earned_weight = 0.0
        total_applicable_weight = 0.0
        evidence_backed = 0
        applicable_count = 0

        for control in controls_in_pillar:
            tie = result_map.get(control.control_id)
            if tie is None:
                # Not evaluated — treat as UNKNOWN (not NOT_APPLICABLE)
                status = ControlStatus.UNKNOWN
            else:
                status = tie.status

            outcome_w = OUTCOME_WEIGHTS.get(status, 0.3)
            if outcome_w < 0:
                # NOT_APPLICABLE sentinel — exclude from denominator
                continue

            applicable_count += 1
            total_applicable_weight += control.weight
            earned_weight += control.weight * outcome_w

            if tie and tie.confidence > 0.5:
                evidence_backed += 1

        if applicable_count == 0:
            # Entire pillar is NOT_APPLICABLE — record but exclude from scoring
            pillar_scores.append(PillarScore(
                pillar=pillar,
                score=0.0,           # placeholder; not used in aggregation
                weight=round(pillar_global_weight * 100, 0),
                evidence_coverage=0.0,
                control_count=len(controls_in_pillar),
                applicable_control_count=0,
                is_not_applicable=True,
            ))
            logger.info(
                f"Pillar '{pillar.value}' fully NOT_APPLICABLE — excluded from scoring."
            )
            continue

        # Do NOT round before aggregation — only round final result
        pillar_raw_score = (earned_weight / total_applicable_weight) * 100.0
        evidence_coverage = (evidence_backed / applicable_count * 100.0)

        pillar_scores.append(PillarScore(
            pillar=pillar,
            score=round(pillar_raw_score, 1),
            weight=round(pillar_global_weight * 100, 0),
            evidence_coverage=round(evidence_coverage, 1),
            control_count=len(controls_in_pillar),
            applicable_control_count=applicable_count,
            is_not_applicable=False,
        ))

        applicable_pillar_contributions.append((pillar_raw_score, pillar_global_weight))

    # ── Global Trust Score aggregation with renormalization ───────────────────
    if not applicable_pillar_contributions:
        # All pillars are NOT_APPLICABLE — undefined score
        final_trust_score: Optional[float] = None
        posture = "Not Scorable"
        logger.warning(
            f"All pillars NOT_APPLICABLE for assessment {assessment_id} — "
            "Trust Score is undefined."
        )
    else:
        total_applicable_pillar_weight = sum(w for _, w in applicable_pillar_contributions)
        # Renormalized weighted sum
        raw_total = sum(s * w for s, w in applicable_pillar_contributions) / total_applicable_pillar_weight
        final_trust_score = round(raw_total, 1)
        # Clamp to [0.0, 100.0] for safety (should be guaranteed by formula)
        final_trust_score = max(0.0, min(100.0, final_trust_score))
        posture = posture_for_score(final_trust_score)

    return TrustScoreResult(
        assessment_id=assessment_id,
        trust_score=final_trust_score,
        posture=posture,
        pillar_scores=pillar_scores,
        total_controls=total_controls,
        pass_count=pass_count,
        potential_gap_count=potential_gap_count,
        fail_count=fail_count,
        insufficient_evidence_count=insufficient_count,
        all_not_applicable=(final_trust_score is None),
    )
