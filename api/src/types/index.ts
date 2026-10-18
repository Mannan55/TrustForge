/**
 * TrustForge API & Research Engine — Canonical Type Definitions
 */

export type ControlStatus = 
  | 'PASS'
  | 'POTENTIAL_GAP'
  | 'FAIL'
  | 'INSUFFICIENT_EVIDENCE'
  | 'NOT_APPLICABLE'
  | 'UNKNOWN';

export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type EvidenceStatus = 'VERIFIED' | 'DETECTED' | 'SELF_REPORTED' | 'NOT_FOUND';

export type EvidenceSourceType = 'WEBSITE_SCAN' | 'ASSESSMENT_WIZARD' | 'DOCUMENT_UPLOAD';

export interface EvidenceItem {
  id: string;
  source_type: EvidenceSourceType;
  key: string;
  label: string;
  value: unknown;
  status: EvidenceStatus;
  confidence: number;
  extracted_at: string;
  source_url?: string;
  content_hash?: string;
  notes?: string;
}

export interface ScanCheck {
  id: string;
  label: string;
  kind: 'technical' | 'privacy' | 'assessment';
  state: 'pass' | 'attention' | 'gap';
  detail: string;
  recommendation?: string;
  evidence?: string;
}

export interface Citation {
  source_document: string;
  section: string;
  rule?: string;
  verbatim_quote: string;
  chunk_id?: string;
}

export interface ModelFinding {
  model_id: string;
  control_id: string;
  verdict: 'SUPPORTED' | 'PARTIALLY_SUPPORTED' | 'NOT_SUPPORTED' | 'INSUFFICIENT_EVIDENCE' | 'NOT_APPLICABLE';
  confidence: number;
  legal_citations: Citation[];
  evidence_ids: string[];
  reasoning_summary: string;
  identified_gaps: string[];
  remediation_steps: string[];
  is_grounded?: boolean;
  grounding_score?: number;
  latency_ms?: number;
}

export interface PillarScore {
  pillar_id: string;
  pillar_name: string;
  score: number;
  applicable_controls: number;
  pass_count: number;
  gap_count: number;
  passCount?: number;
  gapCount?: number;
  weight: number;
}

export interface TrustScoreComputation {
  model_id: string;
  trust_score: number | null;
  posture: 'Strong Alignment' | 'Needs Attention' | 'Potential Gaps' | 'Critical' | 'Not Scorable';
  pillar_scores: Record<string, PillarScore>;
  evidence_coverage: number;
  is_consensus?: boolean;
}

export interface LLMModelInfo {
  id: string;
  name: string;
  family: string;
  provider: string;
  params: string;
  active_params: string;
  context_window: number;
  status: 'VERIFIED_AVAILABLE' | 'AVAILABLE_WITH_LIMITATIONS' | 'REQUIRES_LOCAL_INFERENCE' | 'REQUIRES_CREDITS' | 'UNAVAILABLE';
}
