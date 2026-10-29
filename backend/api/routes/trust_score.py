"""Trust Score endpoint."""
from __future__ import annotations

import json
import logging

from fastapi import APIRouter, HTTPException
from sqlalchemy import select

from core.database import get_session
from core.db_models import DBTrustScore, Assessment

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/trust-score/{assessment_id}")
async def get_trust_score(assessment_id: str) -> dict:
    """Returns the deterministic Trust Score for a completed assessment."""
    async with get_session() as session:
        result = await session.execute(
            select(DBTrustScore).where(DBTrustScore.assessment_id == assessment_id)
        )
        db_score = result.scalar_one_or_none()

        if db_score is None:
            # Check if assessment exists and its status
            assessment = await session.get(Assessment, assessment_id)
            if assessment is None:
                raise HTTPException(status_code=404, detail="Assessment not found")
            raise HTTPException(
                status_code=404,
                detail=f"Trust Score not yet computed. Assessment status: {assessment.status}. "
                       "Poll GET /api/assessments/{id} until status=complete."
            )

    return {
        "assessment_id": assessment_id,
        "trust_score": db_score.trust_score,
        "posture": db_score.posture,
        "pillar_scores": json.loads(db_score.pillar_scores_json or "[]"),
        "total_controls": db_score.total_controls,
        "pass_count": db_score.pass_count,
        "potential_gap_count": db_score.potential_gap_count,
        "fail_count": db_score.fail_count,
        "insufficient_evidence_count": db_score.insufficient_evidence_count,
        "scoring_version": db_score.scoring_version,
        "scored_at": db_score.scored_at.isoformat() if db_score.scored_at else None,
    }
