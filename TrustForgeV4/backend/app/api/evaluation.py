"""
TrustForge — Evaluation API Routes
POST /api/evaluation/run     — run evaluation harness
GET  /api/evaluation/results — retrieve last evaluation summary
"""
from fastapi import APIRouter
from app.services.metrics_service import run_evaluation_harness, load_last_results

router = APIRouter(prefix="/api", tags=["Evaluation"])


@router.post("/evaluation/run")
def run_evaluation() -> dict:
    """
    Execute the research evaluation harness.
    
    Loads evaluation cases from evaluation/cases/*.json,
    runs TrustForge scanner on each case/fixture,
    compares predictions to ground truth,
    computes Precision, Recall, F1, Accuracy.
    
    Results are saved to research/results/.
    """
    return run_evaluation_harness()


@router.get("/evaluation/results")
def get_results() -> dict:
    """Retrieve the most recently computed evaluation results."""
    return load_last_results()
