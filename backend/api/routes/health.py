"""Health / system status endpoint."""
from fastapi import APIRouter
from pydantic import BaseModel
from config import settings

router = APIRouter()


class HealthResponse(BaseModel):
    status: str
    llm_provider: str
    embedding_model: str
    version: str = "1.0.0-research"


@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """Returns backend operational status and configuration summary."""
    return HealthResponse(
        status="ok",
        llm_provider=settings.llm_provider,
        embedding_model=settings.embedding_model,
    )
