"""
TrustForge — Main FastAPI Application

Research-grade compliance assessment backend for the DPDP Act 2023.
All analysis is performed with real implementations — no mock data in the production path.

Architecture:
  Layer A: Deterministic rule checks (0 LLM calls)
  Layer B: RAG retrieval via FAISS + sentence-transformers
  Layer C: Optional AI semantic evaluation (configurable provider)
"""
import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.api import scanner, assessment, evidence, rag, evaluation

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("trustforge")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup/shutdown lifecycle."""
    # Ensure data directories exist
    Path("data/legal").mkdir(parents=True, exist_ok=True)
    Path("data/vectors").mkdir(parents=True, exist_ok=True)
    Path("data").mkdir(parents=True, exist_ok=True)

    logger.info(f"TrustForge backend starting — Scoring Version: {settings.scoring_version}")
    logger.info(f"AI Provider: {settings.ai_provider}")
    logger.info(f"Embedding Model: {settings.embedding_model}")

    yield

    logger.info("TrustForge backend shutting down.")


app = FastAPI(
    title="TrustForge Research API",
    description=(
        "TrustForge — AI-Assisted DPDP Compliance Assessment Platform (Research Prototype). "
        "Implements hybrid deterministic + RAG + optional AI evaluation. "
        "This is a compliance readiness assessment tool, not a legal authority."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS — allow the Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(scanner.router)
app.include_router(assessment.router)
app.include_router(evidence.router)
app.include_router(rag.router)
app.include_router(evaluation.router)


@app.get("/")
def root():
    return {
        "service": "TrustForge Research API",
        "version": "1.0.0",
        "scoring_version": settings.scoring_version,
        "ai_provider": settings.ai_provider,
        "status": "running",
        "disclaimer": (
            "TrustForge is a compliance readiness assessment tool. "
            "It is not a legal authority and does not provide legal certification."
        ),
    }


@app.get("/health")
def health():
    return {"status": "ok"}
