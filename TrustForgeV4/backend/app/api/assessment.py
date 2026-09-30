"""
TrustForge — Assessment API Routes
POST /api/assessment/evaluate
GET  /api/score/{assessment_id}
GET  /api/findings/{assessment_id}
"""
from fastapi import APIRouter, HTTPException
from app.schemas import AssessmentRequest, AssessmentResponse, TrustScoreResult
from app.services.ai_evaluator import run_full_assessment

router = APIRouter(prefix="/api", tags=["Assessment"])

# In-memory store for this research prototype
# For production: replace with SQLite via sqlite-utils
_assessment_store: dict = {}


@router.post("/assessment/evaluate", response_model=AssessmentResponse)
def evaluate_assessment(request: AssessmentRequest) -> AssessmentResponse:
    """
    Run a full DPDP compliance assessment.
    
    Pipeline:
    1. Deterministic rule evaluation (Layer A)
    2. RAG-assisted resolution for UNKNOWN controls (Layer B)
    3. AI semantic evaluation if configured (Layer C)
    4. Trust Score computation (coverage-adjusted, weighted)
    5. Findings generation from failed/partial controls
    
    Returns TrustScore, Findings, and Frugal AI metrics.
    """
    scan_result = request.scan_result

    result = run_full_assessment(
        request=request,
        scan_result=scan_result,
        evidence_summaries=[],
    )

    # Store for later retrieval
    _assessment_store[result["assessment_id"]] = result

    return AssessmentResponse(
        assessment_id=result["assessment_id"],
        trust_score=result["trust_score"],
        findings=result["findings"],
        evidence_summaries=[],
        status="completed",
    )


@router.get("/score/{assessment_id}", response_model=TrustScoreResult)
def get_score(assessment_id: str) -> TrustScoreResult:
    """Retrieve a previously computed Trust Score by assessment ID."""
    stored = _assessment_store.get(assessment_id)
    if not stored:
        raise HTTPException(status_code=404, detail=f"Assessment '{assessment_id}' not found.")
    return stored["trust_score"]


@router.get("/findings/{assessment_id}")
def get_findings(assessment_id: str) -> list:
    """Retrieve findings for a previously computed assessment."""
    stored = _assessment_store.get(assessment_id)
    if not stored:
        raise HTTPException(status_code=404, detail=f"Assessment '{assessment_id}' not found.")
    return stored["findings"]
