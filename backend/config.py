"""
TrustForge backend — centralized configuration.

All settings are read from environment variables (or .env).
Import `settings` from this module wherever configuration is needed.
"""
from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


_env_path = Path(__file__).parent / ".env"


class Settings(BaseSettings):
    """Application-wide settings, loaded from environment / .env file."""

    model_config = SettingsConfigDict(
        env_file=(_env_path, ".env"),
        env_prefix="TRUSTFORGE_",
        case_sensitive=False,
        extra="ignore",
    )

    # Server
    host: str = "127.0.0.1"
    port: int = 8000
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    # Database
    db_path: str = "./trustforge.db"

    # RAG / Embeddings
    embedding_model: str = "all-MiniLM-L6-v2"
    knowledge_index_dir: str = "./knowledge/index"
    retrieval_top_k: int = 5
    retrieval_mode: str = "dense"   # "dense" | "hybrid"

    # LLM
    llm_provider: str = "groq"   # "groq" | "none"
    llm_model: str = "qwen/qwen3.8-27b"
    llm_temperature: float = 0.1
    llm_max_tokens: int = 1024
    tie_context_budget: int = 4000  # Character budget for retrieved statutory passages in TIE prompt

    # Scanner
    scanner_timeout: int = 15
    scanner_max_redirects: int = 5
    scanner_max_response_bytes: int = 5_242_880

    # Research
    eval_results_dir: str = "./evaluation/results"
    research_logging: bool = True

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def knowledge_index_path(self) -> Path:
        p = Path(self.knowledge_index_dir)
        if not p.is_absolute() and not p.exists():
            backend_p = Path(__file__).parent / self.knowledge_index_dir.lstrip("./")
            if backend_p.exists():
                return backend_p
        return p

    @property
    def db_url(self) -> str:
        return f"sqlite+aiosqlite:///{self.db_path}"


class _GroqSettings(BaseSettings):
    """Reads GROQ_API_KEY without the TRUSTFORGE_ prefix."""
    model_config = SettingsConfigDict(env_file=(_env_path, ".env"), extra="ignore")
    groq_api_key: str = ""


@lru_cache
def get_settings() -> Settings:
    return Settings()


@lru_cache
def get_groq_key() -> str:
    return _GroqSettings().groq_api_key


settings = get_settings()
