"""Structured logging configuration for TrustForge backend."""
import logging
import sys

from config import settings


def configure_logging() -> None:
    level = logging.DEBUG if settings.research_logging else logging.INFO
    fmt = "[%(asctime)s] %(levelname)s %(name)s — %(message)s"
    logging.basicConfig(stream=sys.stdout, level=level, format=fmt)
    # Quieten noisy third-party loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
    logging.getLogger("sentence_transformers").setLevel(logging.WARNING)
    logging.getLogger("faiss").setLevel(logging.WARNING)
