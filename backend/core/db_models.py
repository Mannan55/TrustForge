"""
SQLAlchemy ORM models for TrustForge SQLite database.

Tables:
  organizations    — registered organizations
  assessments      — one per assessment run
  scan_results     — website scan results (keyed to assessment)
  evidence_items   — normalized evidence (from scanner + wizard)
  tie_results      — TIE finding per control per assessment
  trust_scores     — deterministic trust score per assessment
  eval_runs        — research evaluation run logs
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.database import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _uuid() -> str:
    return str(uuid.uuid4())


class Organization(Base):
    __tablename__ = "organizations"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    legal_name: Mapped[str] = mapped_column(String, nullable=False)
    display_name: Mapped[str] = mapped_column(String, nullable=False)
    cin: Mapped[str] = mapped_column(String, default="")
    gstin: Mapped[str] = mapped_column(String, default="")
    industry: Mapped[str] = mapped_column(String, default="")
    primary_domain: Mapped[str] = mapped_column(String, default="")
    grievance_officer: Mapped[str] = mapped_column(String, default="")
    grievance_email: Mapped[str] = mapped_column(String, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    assessments: Mapped[list["Assessment"]] = relationship(
        back_populates="organization", cascade="all, delete-orphan"
    )


class Assessment(Base):
    __tablename__ = "assessments"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    org_id: Mapped[str] = mapped_column(ForeignKey("organizations.id"), nullable=False)
    status: Mapped[str] = mapped_column(String, default="pending")   # pending|running|complete|error
    wizard_answers_json: Mapped[str] = mapped_column(Text, default="{}")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    organization: Mapped["Organization"] = relationship(back_populates="assessments")
    scan_results: Mapped[list["ScanResult"]] = relationship(
        back_populates="assessment", cascade="all, delete-orphan"
    )
    evidence_items: Mapped[list["DBEvidenceItem"]] = relationship(
        back_populates="assessment", cascade="all, delete-orphan"
    )
    tie_results: Mapped[list["DBTIEResult"]] = relationship(
        back_populates="assessment", cascade="all, delete-orphan"
    )
    trust_score: Mapped["DBTrustScore | None"] = relationship(
        back_populates="assessment", cascade="all, delete-orphan", uselist=False
    )


class ScanResult(Base):
    __tablename__ = "scan_results"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    assessment_id: Mapped[str] = mapped_column(ForeignKey("assessments.id"), nullable=False)
    url: Mapped[str] = mapped_column(String, nullable=False)
    checks_json: Mapped[str] = mapped_column(Text, default="[]")  # serialized list[ScanCheck]
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    scanned_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
    duration_ms: Mapped[int] = mapped_column(Integer, default=0)

    assessment: Mapped["Assessment"] = relationship(back_populates="scan_results")


class DBEvidenceItem(Base):
    __tablename__ = "evidence_items"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    assessment_id: Mapped[str] = mapped_column(ForeignKey("assessments.id"), nullable=False)
    source: Mapped[str] = mapped_column(String, nullable=False)   # EvidenceSourceType value
    key: Mapped[str] = mapped_column(String, nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False)   # EvidenceStatus value
    observed: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    value_json: Mapped[str] = mapped_column(Text, default="null")
    url: Mapped[str | None] = mapped_column(String, nullable=True)
    confidence: Mapped[str] = mapped_column(String, default="HIGH")
    notes: Mapped[str] = mapped_column(Text, default="")
    method: Mapped[str] = mapped_column(Text, default="")
    collected_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    assessment: Mapped["Assessment"] = relationship(back_populates="evidence_items")


class DBTIEResult(Base):
    __tablename__ = "tie_results"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    assessment_id: Mapped[str] = mapped_column(ForeignKey("assessments.id"), nullable=False)
    control_id: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False)   # ControlStatus value
    severity: Mapped[str] = mapped_column(String, nullable=False)
    finding: Mapped[str] = mapped_column(Text, default="")
    explanation: Mapped[str] = mapped_column(Text, default="")
    recommendation: Mapped[str] = mapped_column(Text, default="")
    evidence_ids_json: Mapped[str] = mapped_column(Text, default="[]")
    citations_json: Mapped[str] = mapped_column(Text, default="[]")
    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    evaluation_method: Mapped[str] = mapped_column(String, default="rag_grounded")
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    evaluated_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    assessment: Mapped["Assessment"] = relationship(back_populates="tie_results")


class DBTrustScore(Base):
    __tablename__ = "trust_scores"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    assessment_id: Mapped[str] = mapped_column(
        ForeignKey("assessments.id"), nullable=False, unique=True
    )
    trust_score: Mapped[float] = mapped_column(Float, nullable=False)
    posture: Mapped[str] = mapped_column(String, nullable=False)
    pillar_scores_json: Mapped[str] = mapped_column(Text, default="[]")
    total_controls: Mapped[int] = mapped_column(Integer, default=0)
    pass_count: Mapped[int] = mapped_column(Integer, default=0)
    potential_gap_count: Mapped[int] = mapped_column(Integer, default=0)
    fail_count: Mapped[int] = mapped_column(Integer, default=0)
    insufficient_evidence_count: Mapped[int] = mapped_column(Integer, default=0)
    scoring_version: Mapped[str] = mapped_column(String, default="1.0")
    scored_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    assessment: Mapped["Assessment"] = relationship(back_populates="trust_score")


class EvalRun(Base):
    """Research evaluation run log — stores inputs/outputs for reproducibility."""
    __tablename__ = "eval_runs"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    run_type: Mapped[str] = mapped_column(String, nullable=False)  # scanner|retrieval|scoring
    config_json: Mapped[str] = mapped_column(Text, default="{}")
    input_json: Mapped[str] = mapped_column(Text, default="{}")
    output_json: Mapped[str] = mapped_column(Text, default="{}")
    metrics_json: Mapped[str] = mapped_column(Text, default="{}")
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    duration_ms: Mapped[int] = mapped_column(Integer, default=0)
    run_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
