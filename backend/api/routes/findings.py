"""Findings endpoint — returns TIE results for an assessment."""
from __future__ import annotations

import json
import logging
from typing import List

from fastapi import APIRouter, HTTPException
from sqlalchemy import select

from core.database import get_session
from core.db_models import DBTIEResult

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/findings/{assessment_id}")
async def get_findings(assessment_id: str) -> List[dict]:
    """Returns all TIE findings for a given assessment."""
    async with get_session() as session:
        result = await session.execute(
            select(DBTIEResult).where(DBTIEResult.assessment_id == assessment_id)
        )
        findings = result.scalars().all()

        if not findings:
            from core.db_models import Assessment
            assessment = await session.get(Assessment, assessment_id)
            if not assessment:
                raise HTTPException(
                    status_code=404,
                    detail=f"Assessment {assessment_id} not found."
                )
            if assessment.status != "complete":
                raise HTTPException(
                    status_code=404,
                    detail=f"Assessment {assessment_id} is currently {assessment.status}. Findings will be available once evaluation completes."
                )
            return []

    return [
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
            "evaluated_at": f.evaluated_at.isoformat() if f.evaluated_at else None,
        }
        for f in findings
    ]
