"""
TrustForge — Evidence API Routes
POST /api/evidence/upload    — upload and parse an evidence file
POST /api/evidence/analyze   — re-analyze a previously uploaded file
"""
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.schemas import EvidenceAnalysisResult
from app.services.evidence_processor import analyze_evidence_file

router = APIRouter(prefix="/api", tags=["Evidence"])

# In-memory store for this research prototype
_evidence_store: dict[str, EvidenceAnalysisResult] = {}


@router.post("/evidence/upload", response_model=EvidenceAnalysisResult)
async def upload_evidence(file: UploadFile = File(...)) -> EvidenceAnalysisResult:
    """
    Upload an evidence file (PDF or TXT) for compliance analysis.
    
    - Text is extracted using PyMuPDF (PDF) or plain UTF-8 decoding (TXT)
    - Compliance-relevant topics are identified via keyword matching
    - Topics are mapped to relevant scoring controls
    - Status reflects actual parse/analysis outcome (not auto-verified)
    """
    MAX_SIZE = 20 * 1024 * 1024  # 20MB
    file_bytes = await file.read()

    if len(file_bytes) > MAX_SIZE:
        raise HTTPException(
            status_code=413,
            detail="File too large. Maximum allowed size is 20MB."
        )

    supported_types = {
        "application/pdf", "text/plain",
        "application/octet-stream",  # allow generic type
    }
    file_type = file.content_type or "application/octet-stream"

    # Check extension if MIME is generic
    fname = file.filename or "unknown"
    if not fname.lower().endswith((".pdf", ".txt")) and file_type not in supported_types:
        raise HTTPException(
            status_code=415,
            detail="Unsupported file type. Please upload PDF or TXT files."
        )

    result = analyze_evidence_file(
        file_name=fname,
        file_bytes=file_bytes,
        file_type=file_type,
    )

    _evidence_store[result.evidence_id] = result
    return result


@router.get("/evidence/{evidence_id}", response_model=EvidenceAnalysisResult)
def get_evidence(evidence_id: str) -> EvidenceAnalysisResult:
    """Retrieve a previously analyzed evidence result."""
    ev = _evidence_store.get(evidence_id)
    if not ev:
        raise HTTPException(status_code=404, detail=f"Evidence '{evidence_id}' not found.")
    return ev
