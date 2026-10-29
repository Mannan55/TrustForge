"""
TrustForge shared domain models.

These Pydantic models define the canonical shapes of evidence, findings,
controls, and scoring that flow through the system. They are used by:
  - the scanner (produces EvidenceItem)
  - the compliance engine (maps evidence → control → Finding)
  - the RAG retrieval service (produces RetrievedChunk)
  - TIE (produces TIEResult)
  - the Trust Score engine (produces TrustScore)
  - the API routes (serialises to JSON)
"""
from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional
from uuid import uuid4

from pydantic import BaseModel, Field


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _uuid() -> str:
    return str(uuid4())


# ─────────────────────────────────────────────────────────────────────────────
# Evidence
# ─────────────────────────────────────────────────────────────────────────────

class EvidenceSourceType(str, Enum):
    WEBSITE_SCANNER = "website_scanner"
    ASSESSMENT_WIZARD = "assessment_wizard"
    DOCUMENT_UPLOAD = "document_upload"
    SYSTEM_INFERRED = "system_inferred"


class EvidenceStatus(str, Enum):
    VERIFIED = "VERIFIED"
    DETECTED = "DETECTED"
    INFERRED = "INFERRED"
    NOT_FOUND = "NOT_FOUND"
    NOT_ASSESSED = "NOT_ASSESSED"


class EvidenceConfidence(str, Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class EvidenceItem(BaseModel):
    """A single piece of normalized evidence."""
    evidence_id: str = Field(default_factory=_uuid)
    source: EvidenceSourceType
    key: str                       # machine-readable identifier, e.g. "https_enforced"
    title: str                     # human-readable label
    status: EvidenceStatus
    observed: Optional[bool] = None
    value: Optional[Any] = None    # raw observed value (header text, URL, bool, etc.)
    url: Optional[str] = None
    timestamp: str = Field(default_factory=_now)
    confidence: EvidenceConfidence = EvidenceConfidence.HIGH
    notes: str = ""
    method: str = ""               # how this was established


# ─────────────────────────────────────────────────────────────────────────────
# RAG — retrieved chunks
# ─────────────────────────────────────────────────────────────────────────────

class SourceType(str, Enum):
    LEGAL_PRIMARY = "LEGAL_PRIMARY"
    LEGAL_SECONDARY_OFFICIAL = "LEGAL_SECONDARY_OFFICIAL"
    REGULATORY_GUIDANCE = "REGULATORY_GUIDANCE"
    SECURITY_GUIDANCE = "SECURITY_GUIDANCE"
    TECHNICAL_BEST_PRACTICE = "TECHNICAL_BEST_PRACTICE"


class RetrievedChunk(BaseModel):
    """A chunk returned from the vector index with full provenance."""
    chunk_id: str
    document_id: str
    document_title: str
    authority: str
    source_type: SourceType
    section: Optional[str] = None
    subsection: Optional[str] = None
    heading: Optional[str] = None
    text: str
    source_url: Optional[str] = None
    publication_date: Optional[str] = None
    version: Optional[str] = None
    commencement_status: Optional[str] = None  # "IN_FORCE" | "NOTIFIED_PHASED_1YR" | "NOTIFIED_PHASED_18MO"
    effective_date: Optional[str] = None       # "2025-11-13" | "2026-11-13" | "2027-05-13"
    enforceability: Optional[str] = None       # "CURRENTLY_ENFORCEABLE" | "PHASED_READINESS"
    similarity: float = 0.0        # cosine similarity score from FAISS


class Citation(BaseModel):
    """A traceable reference in a finding."""
    document_title: str
    authority: str
    section: Optional[str] = None
    chunk_id: str
    source_url: Optional[str] = None
    excerpt: str = ""              # short supporting passage (≤300 chars)


# ─────────────────────────────────────────────────────────────────────────────
# Compliance controls
# ─────────────────────────────────────────────────────────────────────────────

class Pillar(str, Enum):
    PRIVACY = "Privacy"
    SECURITY = "Security"
    TRANSPARENCY = "Transparency"
    GOVERNANCE = "Governance"
    DATA_LIFECYCLE = "Data Lifecycle"
    USER_RIGHTS = "User Rights"


class Severity(str, Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class ControlStatus(str, Enum):
    PASS = "PASS"
    POTENTIAL_GAP = "POTENTIAL_GAP"
    FAIL = "FAIL"
    INSUFFICIENT_EVIDENCE = "INSUFFICIENT_EVIDENCE"
    NOT_APPLICABLE = "NOT_APPLICABLE"
    UNKNOWN = "UNKNOWN"


class EvaluationMethod(str, Enum):
    DETERMINISTIC = "deterministic"   # rule-based, no LLM
    RAG_GROUNDED = "rag_grounded"     # evidence + retrieved context + LLM
    SELF_REPORTED = "self_reported"   # from assessment wizard only


class ComplianceControl(BaseModel):
    """A defined compliance control mapped to DPDP obligations."""
    control_id: str
    pillar: Pillar
    title: str
    description: str
    severity: Severity
    evidence_required: List[str]   # list of evidence keys expected
    legal_mapping: str             # primary DPDP section reference
    legal_mapping_detail: str = ""
    scanner_mapping: List[str] = Field(default_factory=list)
    assessment_mapping: List[str] = Field(default_factory=list)
    evaluation_method: EvaluationMethod = EvaluationMethod.RAG_GROUNDED
    weight: float = 1.0            # within-pillar weight


# ─────────────────────────────────────────────────────────────────────────────
# TIE output
# ─────────────────────────────────────────────────────────────────────────────

class TIEResult(BaseModel):
    """Structured output from the TrustForge Intelligent Evaluator."""
    control_id: str
    status: ControlStatus
    severity: Severity
    finding: str                   # concise one-sentence finding
    explanation: str               # grounded explanation (from retrieved context)
    recommendation: str            # actionable next step
    evidence_ids: List[str] = Field(default_factory=list)
    citations: List[Citation] = Field(default_factory=list)
    confidence: float = 0.0        # 0.0–1.0, reflects evidence strength
    evaluation_method: EvaluationMethod = EvaluationMethod.RAG_GROUNDED
    error: Optional[str] = None    # set if evaluation failed


# ─────────────────────────────────────────────────────────────────────────────
# Trust Score
# ─────────────────────────────────────────────────────────────────────────────

PILLAR_WEIGHTS: Dict[str, float] = {
    Pillar.PRIVACY: 0.20,
    Pillar.SECURITY: 0.20,
    Pillar.TRANSPARENCY: 0.15,
    Pillar.GOVERNANCE: 0.15,
    Pillar.DATA_LIFECYCLE: 0.15,
    Pillar.USER_RIGHTS: 0.15,
}

# Outcome weights for scoring (deterministic formula)
OUTCOME_WEIGHTS: Dict[ControlStatus, float] = {
    ControlStatus.PASS: 1.0,
    ControlStatus.POTENTIAL_GAP: 0.5,
    ControlStatus.FAIL: 0.0,
    ControlStatus.INSUFFICIENT_EVIDENCE: 0.3,
    ControlStatus.UNKNOWN: 0.3,
    ControlStatus.NOT_APPLICABLE: -1.0,   # sentinel: excluded from denominator
}


class PillarScore(BaseModel):
    pillar: Pillar
    score: float                           # 0–100 (0.0 placeholder when is_not_applicable=True)
    weight: float                          # pillar weight in overall score
    evidence_coverage: float              # fraction of controls with real evidence
    control_count: int
    applicable_control_count: int
    is_not_applicable: bool = False        # True when ALL controls in pillar are NOT_APPLICABLE


class TrustScoreResult(BaseModel):
    """The deterministic Trust Score with full breakdown."""
    assessment_id: str
    trust_score: Optional[float] = None    # 0–100 (None when all_not_applicable=True)
    posture: str                           # "Strong Alignment" | "Needs Attention" | "Not Scorable"
    pillar_scores: List[PillarScore]
    total_controls: int
    pass_count: int
    potential_gap_count: int
    fail_count: int
    insufficient_evidence_count: int
    all_not_applicable: bool = False       # True when no applicable controls exist at all
    scored_at: str = Field(default_factory=_now)
    scoring_version: str = "1.1"          # bumped for P0.2 renormalization change


# ─────────────────────────────────────────────────────────────────────────────
# API request / response helpers
# ─────────────────────────────────────────────────────────────────────────────

class ScanRequest(BaseModel):
    url: str
    org_id: Optional[str] = None


class AssessmentAnswers(BaseModel):
    """Answers submitted by the Assessment Wizard."""
    org_id: str
    collections: List[str] = Field(default_factory=list)
    categories: List[str] = Field(default_factory=list)
    purposes: List[str] = Field(default_factory=list)
    languages: List[str] = Field(default_factory=list)
    rights: List[str] = Field(default_factory=list)
    processors: List[str] = Field(default_factory=list)
    retention: str = ""
    erasure_automated: bool = False
    breach_plan: bool = False
    grievance_officer_named: bool = False
    grievance_contact_published: bool = False


class RAGQuery(BaseModel):
    query: str
    top_k: int = 5
    source_type_filter: Optional[List[SourceType]] = None
