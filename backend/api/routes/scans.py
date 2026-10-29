"""
Website scan endpoints.

POST /api/scans        — Run a new website scan (returns structured evidence)
GET  /api/scans/{id}   — Retrieve a stored scan result
"""
from __future__ import annotations

import json
import logging
import time
from typing import List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from core.models import EvidenceItem, ScanRequest
from scanner.engine import run_scan

logger = logging.getLogger(__name__)
router = APIRouter()


class ScanCheck(BaseModel):
    """Scan check result — mirrors the frontend ScanCheck type."""
    id: str
    label: str
    kind: str          # "technical" | "privacy" | "assessment"
    state: str         # "pass" | "attention" | "gap"
    detail: str
    recommendation: Optional[str] = None
    evidence: Optional[str] = None


class ScanResponse(BaseModel):
    scan_id: str
    url: str
    checks: List[ScanCheck]
    evidence: List[EvidenceItem]
    score: int
    posture: str
    scanned_at: str
    duration_ms: int
    error: Optional[str] = None


@router.post("/scans", response_model=ScanResponse)
async def create_scan(req: ScanRequest) -> ScanResponse:
    """
    Run a website scan against the provided URL.

    Returns structured scan checks (for the UI) and normalized evidence items
    (for the compliance engine). The scan is purely observational — it does
    not attempt to log in or probe protected endpoints.
    """
    logger.info(f"Scan requested for URL: {req.url}")
    start = time.time()
    try:
        result = await run_scan(req.url)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        logger.exception(f"Scan failed for {req.url}: {exc}")
        raise HTTPException(status_code=500, detail=f"Scan error: {exc}")
    duration_ms = int((time.time() - start) * 1000)
    result.duration_ms = duration_ms
    logger.info(
        f"Scan complete for {req.url} — {len(result.checks)} checks, "
        f"score={result.score}, {duration_ms}ms"
    )
    return result
