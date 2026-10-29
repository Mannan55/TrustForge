"""
TrustForge Research Backend — FastAPI application.

Start with:
    cd backend
    uvicorn main:app --reload --host 127.0.0.1 --port 8000
"""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from core.database import init_db
from core.logging_config import configure_logging
from api.routes import health, scans, assessments, findings, trust_score, rag, reports

configure_logging()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):  # type: ignore[type-arg]
    """Startup: initialise DB. Shutdown: nothing needed."""
    logger.info("TrustForge backend starting — initialising database")
    await init_db()
    logger.info("Database ready")
    yield
    logger.info("TrustForge backend shutting down")


app = FastAPI(
    title="TrustForge Research Backend",
    description=(
        "Evidence-grounded DPDP readiness assessment API. "
        "Implements RAG-based compliance evaluation for the TrustForge research framework."
    ),
    version="1.0.0-research",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register route groups
app.include_router(health.router, prefix="/api", tags=["System"])
app.include_router(scans.router, prefix="/api", tags=["Scanner"])
app.include_router(assessments.router, prefix="/api", tags=["Assessment"])
app.include_router(findings.router, prefix="/api", tags=["Findings"])
app.include_router(trust_score.router, prefix="/api", tags=["Trust Score"])
app.include_router(rag.router, prefix="/api", tags=["RAG"])
app.include_router(reports.router, prefix="/api", tags=["Reports"])


@app.get("/", include_in_schema=False)
async def root():
    return {"service": "TrustForge Research Backend", "version": "1.0.0-research"}
