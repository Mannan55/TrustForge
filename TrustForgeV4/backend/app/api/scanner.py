"""
TrustForge — Scanner API Route
POST /api/scan
"""
from fastapi import APIRouter
from app.schemas import ScanRequest, ScanResult
from app.services.website_scanner import scan_website

router = APIRouter(prefix="/api", tags=["Scanner"])


@router.post("/scan", response_model=ScanResult)
def run_scan(request: ScanRequest) -> ScanResult:
    """
    Perform a real public-signal scan of the provided URL.
    
    Analyses:
    - HTTPS / TLS availability
    - Privacy policy detection
    - Cookie consent banner signals
    - Tracker script detection
    - Public form personal data fields
    - Security headers
    
    This is a compliance scanner, NOT a penetration testing tool.
    Only publicly available HTTP signals are analysed.
    """
    return scan_website(request.url)
