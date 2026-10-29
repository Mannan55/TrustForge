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
  verdict: 'SUPPORTED' | 'PARTIALLY_SUPPORTED' | 'NOT_SUPPORTED' | 'INSUFFICIENT_EVIDENCE' | 'NOT_APPLICABLE' | 'NOT_DETERMINABLE';
  confidence: number;
  legal_citations: Citation[];
  evidence_ids: string[];
  reasoning_summary: string;
  identified_gaps: string[];
  remediation_steps: string[];
  is_grounded?: boolean;
  grounding_score?: number;
  latency_ms?: number;
  // Phase 3 Research Grounding & Reproducibility Fields
  raw_verdict?: string;
  rejection_reason?: string | null;
  assessment_id?: string;
  obligation_id?: string;
  obligation_category?: ComplianceCategoryCode;
  quoted_evidence?: string;
  retrieved_chunk_ids?: string[];
  raw_output?: string;
}


export interface PillarScore {
  pillar_id: string;
  pillar_name: string;
  name?: string;
  pillar?: string;
  score: number;
  applicable_controls: number;
  pass_count: number;
  gap_count: number;
  passCount?: number;
  gapCount?: number;
  weight: number;
  evidence_coverage?: number;
}

export type ComplianceCategoryCode =
  | 'C1'
  | 'C2'
  | 'C3'
  | 'C4'
  | 'C5'
  | 'C6'
  | 'C7'
  | 'C8'
  | 'C9'
  | 'C10';

export type ObligationVerdict =
  | 'COMPLIANT'
  | 'PARTIAL'
  | 'NON_COMPLIANT'
  | 'NOT_DETERMINABLE'
  | 'NOT_APPLICABLE';

export type WeightScheme = 'W1_PENALTY_PROPORTIONAL' | 'W2_EQUAL';

export type PostureBand =
  | 'Low'
  | 'Moderate'
  | 'Good'
  | 'Strong'
  | 'NOT_SCORABLE'
  | 'Strong Alignment'
  | 'Needs Attention'
  | 'Potential Gaps'
  | 'Critical'
  | 'Not Scorable';

export interface C10CategoryScore {
  code: ComplianceCategoryCode;
  name: string;
  score: number | null;
  is_applicable: boolean;
  applicable_items_count: number;
  compliant_count: number;
  partial_count: number;
  non_compliant_count: number;
  base_weight: number;
  renormalized_weight: number;
  findings?: any[];
}

export interface C10TrustScoreComputation {
  assessment_id?: string;
  model_id: string;
  trust_score: number | null;
  raw_trust_score: number | null;
  posture: PostureBand;
  weight_scheme: WeightScheme;
  critical_failure_cap_applied: boolean;
  critical_failure_reasons: string[];
  evidence_coverage: number;
  category_scores: Record<ComplianceCategoryCode, C10CategoryScore>;
  pillar_scores: Record<string, PillarScore>;
  is_consensus?: boolean;
  methodology_version: string;
  computed_at: string;
}

export interface TrustScoreComputation {
  model_id: string;
  org_id?: string;
  trust_score: number | null;
  raw_trust_score?: number | null;
  posture: PostureBand;
  pillar_scores: Record<string, PillarScore>;
  category_scores?: Record<ComplianceCategoryCode, C10CategoryScore>;
  weight_scheme?: WeightScheme;
  critical_failure_cap_applied?: boolean;
  critical_failure_reasons?: string[];
  evidence_coverage: number;
  is_consensus?: boolean;
  methodology_version?: string;
  computed_at?: string;
}

export type ModelAvailabilityStatus =
  | 'AVAILABLE'
  | 'AUTH_REQUIRED'
  | 'RATE_LIMITED'
  | 'MODEL_UNAVAILABLE'
  | 'PROVIDER_ERROR'
  | 'LOCAL_ONLY'
  | 'DISABLED';

export interface LLMModelInfo {
  id: string;
  name: string;
  family: string;
  provider: 'groq' | 'openrouter' | 'sarvam' | 'local' | string;
  params: string;
  active_params: string;
  context_window: number;
  hf_repo?: string;
  licence?: string;
  pricing_tier?: string;
  status: ModelAvailabilityStatus | 'VERIFIED_AVAILABLE' | 'AVAILABLE_WITH_LIMITATIONS' | 'REQUIRES_LOCAL_INFERENCE' | 'REQUIRES_CREDITS' | 'UNAVAILABLE';
  availability_status?: ModelAvailabilityStatus;
}

// ==========================================
// Phase 5: TOPSIS Multi-Criteria Ranking Types
// ==========================================

export type CriterionDirection = 'BENEFIT' | 'COST';

export interface TOPSISCriterion {
  id: string;
  name: string;
  direction: CriterionDirection;
  weight: number;
  description: string;
  unit?: string;
  is_primary: boolean;
}

export interface TOPSISWeightProfile {
  profile_id: string;
  name: string;
  version: string;
  description: string;
  weights: Record<string, number>;
  is_default: boolean;
}

export interface ModelDecisionMetrics {
  model_id: string;
  model_name: string;
  provider: string;
  metrics: Record<string, number | null>;
  is_eligible: boolean;
  ineligibility_reason?: string;
  sample_size: number;
  data_completeness_pct: number;
}

export interface TOPSISModelRank {
  rank: number;
  model_id: string;
  model_name: string;
  provider: string;
  closeness_coefficient: number;
  distance_to_ideal: number;
  distance_to_anti_ideal: number;
  raw_metrics: Record<string, number | null>;
  normalized_values: Record<string, number>;
  weighted_values: Record<string, number>;
  is_eligible: boolean;
  ineligibility_reason?: string;
}

export interface SensitivityPerturbationResult {
  criterion_id: string;
  criterion_name: string;
  direction: '+20%' | '-20%';
  perturbed_weight: number;
  renormalized_weights: Record<string, number>;
  ranks: Array<{
    model_id: string;
    original_rank: number;
    new_rank: number;
    rank_delta: number;
    original_closeness: number;
    new_closeness: number;
  }>;
  winner_stable: boolean;
  winner_model_id: string;
  spearman_rho: number;
}

export interface SensitivityAnalysisSummary {
  criteria_tested: string[];
  perturbation_pct: number;
  total_scenarios: number;
  stable_scenarios_count: number;
  winner_stability_pct: number;
  is_overall_winner_stable: boolean;
  scenarios: SensitivityPerturbationResult[];
}

export type TOPSISExecutionMode = 'EMPIRICAL_BENCHMARK' | 'PROVISIONAL_MEASURED' | 'SYNTHETIC_DEMONSTRATION';

export interface TOPSISRunResult {
  run_id: string;
  benchmark_source_id?: string;
  execution_mode: TOPSISExecutionMode;
  algorithm_version: string;
  created_at: string;
  profile_used: TOPSISWeightProfile;
  criteria: TOPSISCriterion[];
  ideal_best: Record<string, number>;
  ideal_worst: Record<string, number>;
  ranked_models: TOPSISModelRank[];
  eligible_models_count: number;
  ineligible_models_count: number;
  top_model_id: string | null;
  top_three_model_ids: string[];
  sensitivity_analysis?: SensitivityAnalysisSummary;
  limitations_statement: string;
}


