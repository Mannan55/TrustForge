"""
TrustForge Backend — Application Settings
Centralizes all configuration via pydantic-settings + .env file.
"""
from pydantic_settings import BaseSettings
from pydantic import field_validator
from pydantic import ConfigDict
from typing import List
import os


class Settings(BaseSettings):
    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = True

    # CORS
    cors_origins: str = "http://localhost:5173,http://localhost:5174"

    # Scoring
    scoring_version: str = "v1.0"

    # RAG / Embeddings
    embedding_model: str = "all-MiniLM-L6-v2"
    faiss_index_path: str = "./data/vectors/dpdp_faiss.index"
    faiss_metadata_path: str = "./data/vectors/dpdp_metadata.json"

    # AI Provider — "none" | "groq" | "openai"
    ai_provider: str = "none"
    openai_api_key: str = ""
    groq_api_key: str = ""
    groq_model: str = "llama3-8b-8192"

    # Database
    database_path: str = "./data/trustforge.db"

    # Scanner safety
    scanner_timeout_seconds: int = 15
    scanner_max_redirects: int = 5
    scanner_max_response_bytes: int = 5_000_000
    scanner_user_agent: str = (
        "TrustForge-ComplianceScanner/1.0 (research; not-a-crawler)"
    )

    # Research
    evaluation_cases_path: str = "./evaluation/cases"
    research_results_path: str = "../research/results"

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    model_config = ConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
