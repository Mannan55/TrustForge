"""
TrustForge Backend — Pydantic Schemas
All request/response models shared across API endpoints.
"""
from __future__ import annotations
from pydantic import BaseModel, HttpUrl, field_validator
from typing import Optional, List, Dict, Any, Literal
from datetime import datetime
from enum import Enum


# ─────────────────────────────────────────────────────────────
# ENUMS
# ─────────────────────────────────────────────────────────────

class ControlStatus(str, Enum):
    PASS = "PASS"
    PARTIAL = "PARTIAL"
    FAIL = "FAIL"
    UNKNOWN = "UNKNOWN"
    NOT_APPLICABLE = "NOT_APPLICABLE"


class ConfidenceLevel(str, Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class Severity(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFORMATIONAL = "informational"


class EvidenceStatus(str, Enum):
    UPLOADED = "UPLOADED"
    PARSED = "PARSED"
    ANALYSED = "ANALYSED"
    INSUFFICIENT = "INSUFFICIENT"
    SUPPORTED = "SUPPORTED"
    CONFLICTING = "CONFLICTING"


# ─────────────────────────────────────────────────────────────
# SCANNER SCHEMAS
# ─────────────────────────────────────────────────────────────

class ScanRequest(BaseModel):
    url: str

    @field_validator("url")
    @classmethod
    def validate_url(cls, v: str) -> str:
        v = v.strip()
        if not v.startswith(("http://", "https://")):
            v = "https://" + v
        return v


class HttpsResult(BaseModel):
    has_https: bool
    redirects_to_https: bool
    hsts_present: bool
    evidence: str


class PrivacyPolicyResult(BaseModel):
    found: bool
    url: Optional[str] = None
    has_grievance_contact: bool = False
    has_language_support: bool = False
    last_updated_text: Optional[str] = None
    evidence: str


class CookieConsentResult(BaseModel):
    banner_detected: bool
    has_accept_button: bool
    has_reject_button: bool
    has_preference_button: bool
    trackers_before_consent: List[str] = []
    evidence: str


class TrackerDetection(BaseModel):
    name: str
    script_pattern: str
    detected: bool
    evidence: str


class FormField(BaseModel):
    field_type: str
    name: str
    label: Optional[str] = None


class FormDetection(BaseModel):
    form_count: int
    personal_data_fields: List[FormField] = []
    evidence: str


class SecurityHeadersResult(BaseModel):
    content_security_policy: Optional[str] = None
    strict_transport_security: Optional[str] = None
    x_content_type_options: Optional[str] = None
    referrer_policy: Optional[str] = None
    permissions_policy: Optional[str] = None
    x_frame_options: Optional[str] = None


class ScanResult(BaseModel):
    url: str
    scan_date: str
    scan_duration_ms: int
    https: HttpsResult
    privacy_policy: PrivacyPolicyResult
    cookie_consent: CookieConsentResult
    trackers: List[TrackerDetection]
    forms: FormDetection
    security_headers: SecurityHeadersResult
    observations: List[str]
    evidence: List[str]
    error: Optional[str] = None


# ─────────────────────────────────────────────────────────────
# SCORING SCHEMAS
# ─────────────────────────────────────────────────────────────

class ControlEvaluation(BaseModel):
    control_id: str
    title: str
    pillar: str
    weight: float
    status: ControlStatus
    confidence: ConfidenceLevel
    evidence_used: List[str] = []
    dpdp_reference: Optional[str] = None
    notes: str = ""
    evaluation_method: Literal["deterministic", "rag", "ai", "manual"] = "deterministic"


class PillarScore(BaseModel):
    pillar_id: str
    name: str
    weight: float
    raw_score: float          # 0–100, coverage-adjusted
    evaluated_controls: int
    unknown_controls: int
    na_controls: int
    controls: List[ControlEvaluation]
    description: str
    color: str


class TrustScoreResult(BaseModel):
    assessment_id: str
    scoring_version: str
    overall_score: float
    coverage_percentage: float
    status_label: str
    pillars: List[PillarScore]
    total_controls: int
    evaluated_controls: int
    unknown_controls: int
    na_controls: int
    frugal_ai_metrics: "FrugalAIMetrics"
    computed_at: str


# ─────────────────────────────────────────────────────────────
# FINDINGS SCHEMAS
# ─────────────────────────────────────────────────────────────

class Finding(BaseModel):
    finding_id: str
    title: str
    pillar: str
    category: str
    severity: Severity
    control_id: str
    what_is_wrong: str
    why_it_matters: str
    what_should_we_do: str
    how_to_improve: str
    legal_reference: str
    dpdp_section: str
    score_impact: float
    recommendation: str
    confidence: ConfidenceLevel
    source: str
    status: Literal["open", "in_progress", "resolved"] = "open"


# ─────────────────────────────────────────────────────────────
# RAG SCHEMAS
# ─────────────────────────────────────────────────────────────

class RAGQuery(BaseModel):
    query: str
    top_k: int = 5


class RAGChunk(BaseModel):
    document: str
    section: str
    heading: str
    text: str
    score: float


class RAGResult(BaseModel):
    query: str
    chunks: List[RAGChunk]
    top_k: int


# ─────────────────────────────────────────────────────────────
# EVIDENCE SCHEMAS
# ─────────────────────────────────────────────────────────────

class EvidenceAnalysisResult(BaseModel):
    evidence_id: str
    file_name: str
    file_size: int
    status: EvidenceStatus
    extracted_topics: List[str] = []
    relevant_controls: List[str] = []
    summary: str
    confidence: ConfidenceLevel
    error: Optional[str] = None


# ─────────────────────────────────────────────────────────────
# ASSESSMENT SCHEMAS
# ─────────────────────────────────────────────────────────────

class AssessmentRequest(BaseModel):
    assessment_id: Optional[str] = None
    answers: Dict[str, Any]
    scan_result: Optional[ScanResult] = None
    evidence_ids: List[str] = []


class AssessmentResponse(BaseModel):
    assessment_id: str
    trust_score: TrustScoreResult
    findings: List[Finding]
    evidence_summaries: List[EvidenceAnalysisResult]
    status: str = "completed"


# ─────────────────────────────────────────────────────────────
# FRUGAL AI METRICS
# ─────────────────────────────────────────────────────────────

class FrugalAIMetrics(BaseModel):
    total_controls: int
    deterministic_resolved: int
    rag_resolved: int
    ai_resolved: int
    unknown_unresolved: int
    ai_calls_made: int
    input_tokens_used: int
    output_tokens_used: int
    estimated_cost_usd: float
    total_execution_ms: int
    rule_resolution_rate: float  # percentage


# ─────────────────────────────────────────────────────────────
# EVALUATION SCHEMAS
# ─────────────────────────────────────────────────────────────

class EvaluationCase(BaseModel):
    case_id: str
    description: str
    url: Optional[str] = None
    html_fixture_path: Optional[str] = None
    ground_truth: Dict[str, Any]
    notes: str = ""


class EvaluationMetrics(BaseModel):
    true_positives: int
    false_positives: int
    true_negatives: int
    false_negatives: int
    precision: float
    recall: float
    f1_score: float
    accuracy: float


class EvaluationResult(BaseModel):
    case_id: str
    predictions: Dict[str, Any]
    ground_truth: Dict[str, Any]
    metrics: EvaluationMetrics
    scanner_duration_ms: int


class EvaluationSummary(BaseModel):
    run_id: str
    run_date: str
    total_cases: int
    overall_metrics: EvaluationMetrics
    per_case_results: List[EvaluationResult]
    rag_metrics: Optional[Dict[str, Any]] = None
