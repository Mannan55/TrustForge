// ---------------------------------------------------------------------------
// TrustForge API Client
//
// Typed HTTP client for the TrustForge Research Backend (FastAPI).
// This module is used by services/index.ts when VITE_API_BASE_URL is set.
//
// Design:
//   - All functions are async and return typed results
//   - API errors are surfaced as typed ApiError objects (not thrown)
//   - The base URL is read from VITE_API_BASE_URL env variable
//   - No caching — each call hits the backend fresh (appropriate for research)
// ---------------------------------------------------------------------------

export class ApiError extends Error {
  readonly status: number;
  readonly detail: string;

  constructor(status: number, detail: string) {
    super(`API error ${status}: ${detail}`);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "";

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem("trustforge.auth_token");
  } catch {
    return null;
  }
}

export function setAuthToken(token: string | null): void {
  try {
    if (token) localStorage.setItem("trustforge.auth_token", token);
    else localStorage.removeItem("trustforge.auth_token");
  } catch {
    // ignore storage error
  }
}

async function _request<T>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  body?: unknown,
): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = getAuthToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const json = await res.json();
      detail = json.detail ?? json.error ?? JSON.stringify(json);
    } catch {
      // ignore JSON parse failure
    }
    throw new ApiError(res.status, detail);
  }

  return res.json() as Promise<T>;
}

// ── Authentication ────────────────────────────────────────────────────────────

export interface AuthUserResponse {
  id: string;
  email: string;
  name: string;
  orgId: string;
  orgName?: string;
  role: string;
}

export interface AuthLoginResponse {
  token: string;
  user: AuthUserResponse;
}

export async function loginApi(email: string, password: string): Promise<AuthLoginResponse> {
  return _request<AuthLoginResponse>("POST", "/api/auth/login", { email, password });
}

export async function signupApi(
  email: string,
  password: string,
  name: string,
  orgName?: string,
  role?: string
): Promise<AuthLoginResponse> {
  return _request<AuthLoginResponse>("POST", "/api/auth/signup", { email, password, name, orgName, role });
}

export async function getMeApi(): Promise<{ user: AuthUserResponse }> {
  return _request<{ user: AuthUserResponse }>("GET", "/api/auth/me");
}

export async function logoutApi(): Promise<{ success: boolean }> {
  return _request<{ success: boolean }>("POST", "/api/auth/logout");
}

// ── Health ───────────────────────────────────────────────────────────────────

export interface BackendHealth {
  status: string;
  llm_provider: string;
  embedding_model: string;
  version: string;
}

export async function checkHealth(): Promise<BackendHealth> {
  return _request<BackendHealth>("GET", "/api/health");
}

// ── Scanner ───────────────────────────────────────────────────────────────────

export interface ApiScanCheck {
  id: string;
  label: string;
  kind: string;
  state: string;
  detail: string;
  recommendation?: string;
  evidence?: string;
}

export interface ApiEvidenceItem {
  evidence_id: string;
  source: string;
  key: string;
  title: string;
  status: string;
  observed: boolean | null;
  value: unknown;
  url?: string;
  timestamp: string;
  confidence: string;
  notes: string;
  method: string;
}

export interface ApiScanResponse {
  scan_id: string;
  url: string;
  checks: ApiScanCheck[];
  evidence: ApiEvidenceItem[];
  score: number;
  posture: string;
  scanned_at: string;
  duration_ms: number;
  error?: string;
}

export async function runPublicScan(url: string): Promise<ApiScanResponse> {
  return _request<ApiScanResponse>("POST", "/api/scans", { url });
}

export async function runOrgScan(
  url: string,
  orgId?: string,
): Promise<ApiScanResponse> {
  return _request<ApiScanResponse>("POST", "/api/scans", { url, org_id: orgId });
}

// ── Assessments ───────────────────────────────────────────────────────────────

export interface ApiAssessmentRequest {
  org_id: string;
  website_url?: string;
  collections?: string[];
  categories?: string[];
  purposes?: string[];
  languages?: string[];
  rights?: string[];
  processors?: string[];
  retention?: string;
  erasure_automated?: boolean;
  breach_plan?: boolean;
  grievance_officer_named?: boolean;
  grievance_contact_published?: boolean;
}

/** Kept for backward compat */
export type ApiAssessmentAnswers = ApiAssessmentRequest;

export interface ApiAssessmentResponse {
  assessment_id: string;
  status: string;
  message: string;
}

export interface ApiPillarScoreRaw {
  pillar?: string;
  pillar_id?: string;
  pillar_name?: string;
  name?: string;
  score: number;
  weight: number;
  evidence_coverage?: number;
  control_count?: number;
  applicable_control_count?: number;
}

export interface ApiCitationRaw {
  document_title: string;
  authority: string;
  section?: string;
  chunk_id: string;
  source_url?: string;
  excerpt: string;
}

export interface ApiFindingRaw {
  control_id: string;
  status?: string;
  verdict?: string;
  severity?: string;
  title?: string;
  name?: string;
  control_name?: string;
  finding?: string;
  description?: string;
  explanation?: string;
  recommendation?: string;
  evidence_ids?: string[];
  citations?: ApiCitationRaw[];
  confidence?: number;
  evaluation_method?: string;
  error?: string | null;
  dpdp_reference?: string;
  statutory_ref?: string;
}

export interface ApiEvidenceRaw {
  id?: string;
  evidence_id?: string;
  source?: string;
  source_type?: string;
  key?: string;
  label?: string;
  title?: string;
  status: string;
  observed?: boolean | null;
  value?: unknown;
  url?: string;
  source_url?: string;
  confidence?: string | number;
  notes?: string;
  method?: string;
  extracted_at?: string;
}

export interface ApiAssessmentResult {
  assessment_id: string;
  org_id: string;
  status: "pending" | "running" | "in_progress" | "complete" | "completed" | "error" | "failed" | "timed_out" | "cancelled" | string;
  progress?: number;
  current_step?: string;
  website_url?: string;
  trust_score: number | null;
  posture: string | null;
  evidence_coverage?: number;
  findings: ApiFindingRaw[];
  evidence: ApiEvidenceRaw[];
  pillar_scores: ApiPillarScoreRaw[];
  total_controls: number;
  pass_count: number;
  potential_gap_count: number;
  fail_count: number;
  insufficient_evidence_count: number;
  error?: string | null;
  created_at?: string;
  completed_at?: string;
}

export async function submitAssessment(
  answers: ApiAssessmentRequest,
): Promise<ApiAssessmentResponse> {
  return _request<ApiAssessmentResponse>("POST", "/api/assessments", answers);
}

export async function getAssessmentResult(
  assessmentId: string,
): Promise<ApiAssessmentResult> {
  return _request<ApiAssessmentResult>("GET", `/api/assessments/${assessmentId}`);
}

/** @deprecated use getAssessmentResult */
export async function getAssessment(assessmentId: string): Promise<ApiAssessmentResult> {
  return getAssessmentResult(assessmentId);
}

// ── Findings ─────────────────────────────────────────────────────────────────

export interface ApiCitation {
  document_title: string;
  authority: string;
  section?: string;
  chunk_id: string;
  source_url?: string;
  excerpt: string;
}

export interface ApiFinding {
  control_id: string;
  status: string;
  severity: string;
  finding: string;
  explanation: string;
  recommendation: string;
  evidence_ids: string[];
  citations: ApiCitation[];
  confidence: number;
  evaluation_method: string;
  error?: string;
}

export async function getFindings(assessmentId: string): Promise<ApiFinding[]> {
  return _request<ApiFinding[]>("GET", `/api/findings/${assessmentId}`);
}

// ── Trust Score ───────────────────────────────────────────────────────────────

export interface ApiPillarScore {
  pillar: string;
  score: number;
  weight: number;
  evidence_coverage: number;
  control_count: number;
  applicable_control_count: number;
}

export interface ApiTrustScore {
  assessment_id: string;
  trust_score: number;
  posture: string;
  pillar_scores: ApiPillarScore[];
  total_controls: number;
  pass_count: number;
  potential_gap_count: number;
  fail_count: number;
  insufficient_evidence_count: number;
  scored_at: string;
  scoring_version: string;
}

export async function getTrustScore(assessmentId: string): Promise<ApiTrustScore> {
  return _request<ApiTrustScore>("GET", `/api/trust-score/${assessmentId}`);
}

// ── RAG Retrieval ─────────────────────────────────────────────────────────────

export interface ApiChunk {
  chunk_id: string;
  document_id: string;
  document_title: string;
  authority: string;
  source_type: string;
  section?: string;
  heading?: string;
  text: string;
  source_url?: string;
  publication_date?: string;
  similarity: number;
}

export async function ragRetrieve(
  query: string,
  topK = 5,
): Promise<ApiChunk[]> {
  return _request<ApiChunk[]>("POST", "/api/rag/retrieve", {
    query,
    top_k: topK,
  });
}

// ── Assessment Listing & Evidence Upload ─────────────────────────────────────

export interface ApiAssessmentSummary {
  assessment_id: string;
  org_id: string;
  status: string;
  trust_score?: number | null;
  posture?: string | null;
  created_at?: string;
  completed_at?: string;
}

export async function listAssessments(status?: string): Promise<ApiAssessmentSummary[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return _request<ApiAssessmentSummary[]>("GET", `/api/assessments${query}`);
}

export async function getLatestAssessment(): Promise<ApiAssessmentResult> {
  return _request<ApiAssessmentResult>("GET", "/api/assessments/latest");
}

export interface ApiUploadEvidenceResponse {
  evidence_id: string;
  assessment_id: string;
  title: string;
  source: string;
  status: string;
  confidence: string;
  notes: string;
  method: string;
  filename: string;
  size_kb: number;
  message: string;
}

export async function uploadEvidenceFile(
  assessmentId: string,
  file: File,
): Promise<ApiUploadEvidenceResponse> {
  const url = `${BASE_URL}/api/assessments/${encodeURIComponent(assessmentId)}/evidence/upload`;
  const formData = new FormData();
  formData.append("file", file);

  const headers: Record<string, string> = {};
  const token = getAuthToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const json = await res.json();
      detail = json.detail ?? JSON.stringify(json);
    } catch {
      // ignore
    }
    throw new ApiError(res.status, detail);
  }

  return res.json() as Promise<ApiUploadEvidenceResponse>;
}

// ── Phase 7: RAG Framework Monitor & Retrieval Explorer ────────────────────────

export interface ApiRAGStageEvent {
  stage_id: number;
  stage_name: string;
  stage_key: string;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "SKIPPED";
  started_at: string;
  completed_at?: string;
  duration_ms: number;
  details: Record<string, any>;
  error?: string;
}

export interface ApiRAGExecutionTrace {
  assessment_id: string;
  target_url: string;
  status: "IN_PROGRESS" | "COMPLETED" | "FAILED";
  started_at: string;
  completed_at?: string;
  total_duration_ms: number;
  corpus_version: string;
  corpus_hash: string;
  frozen_snapshot_hash: string;
  stages: ApiRAGStageEvent[];
}

export interface ApiLegalRetrievalPassage {
  rank: number;
  chunk_id: string;
  section: string;
  heading: string;
  source_document: string;
  enforceability: string;
  effective_date: string;
  penalty_reference: string;
  bm25_rank: number | null;
  bm25_score: number | null;
  vector_rank: number | null;
  vector_similarity: number | null;
  rrf_score: number;
  text: string;
  retrieval_rationale: string;
}

export interface ApiLegalRetrievalExplorerRecord {
  control_id: string;
  c10_obligation_id: string;
  c10_obligation_name: string;
  statutory_ref: string;
  query: string;
  retrieval_mode: string;
  fusion_constant: number;
  retrieval_latency_ms: {
    bm25: number;
    vector_embedding: number;
    vector_rpc: number;
    total: number;
  };
  context_hash: string;
  corpus_version: string;
  retrieved_passages: ApiLegalRetrievalPassage[];
}

export interface ApiEvidenceSnippet {
  id: string;
  source_type: string;
  source_url?: string;
  captured_at: string;
  snippet: string;
}

export interface ApiEvidenceToVerdictTraceItem {
  control_id: string;
  control_name: string;
  c10_obligation_id: string;
  c10_obligation_name: string;
  statutory_ref: string;
  statutory_chunk_id: string;
  evidence_ids: string[];
  evidence_snippets: ApiEvidenceSnippet[];
  model_id: string;
  model_verdict: string;
  confidence: number;
  is_grounded: boolean;
  grounding_reason?: string;
  effective_verdict: string;
  control_weight: number;
  raw_score: number;
  weighted_score_contribution: number;
  remediation_advice: string;
}

export interface ApiModelExecutionTraceItem {
  model_id: string;
  name: string;
  provider: string;
  requested_model_id: string;
  actual_model_id?: string;
  request_id?: string;
  status: "COMPLETED" | "RATE_LIMITED" | "INSUFFICIENT_CREDITS" | "LOCAL_OFFLINE" | "UNAVAILABLE";
  is_verified_live: boolean;
  latency_ms: number;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  estimated_cost_usd: number;
  trust_score: number | null;
  posture: string;
  grounding_rate_pct: number;
  hallucination_rate_pct: number;
  citation_precision_pct: number;
  evidence_faithfulness_pct: number;
  blocker_reason?: string;
}

export async function getAssessmentRAGTrace(id = "latest"): Promise<{
  assessment_id: string;
  target_url: string;
  rag_execution_trace: ApiRAGExecutionTrace;
}> {
  return _request<{
    assessment_id: string;
    target_url: string;
    rag_execution_trace: ApiRAGExecutionTrace;
  }>("GET", `/api/assessments/${encodeURIComponent(id)}/rag-trace`);
}

export async function getAssessmentRetrievalExplorer(id = "latest"): Promise<{
  assessment_id: string;
  target_url: string;
  total_obligations: number;
  corpus_version: string;
  frozen_snapshot_hash: string;
  retrieval_explorer: ApiLegalRetrievalExplorerRecord[];
}> {
  return _request<{
    assessment_id: string;
    target_url: string;
    total_obligations: number;
    corpus_version: string;
    frozen_snapshot_hash: string;
    retrieval_explorer: ApiLegalRetrievalExplorerRecord[];
  }>("GET", `/api/assessments/${encodeURIComponent(id)}/retrieval-explorer`);
}

export async function getAssessmentEvidenceTrace(id = "latest"): Promise<{
  assessment_id: string;
  target_url: string;
  total_findings: number;
  evidence_to_verdict_trace: ApiEvidenceToVerdictTraceItem[];
}> {
  return _request<{
    assessment_id: string;
    target_url: string;
    total_findings: number;
    evidence_to_verdict_trace: ApiEvidenceToVerdictTraceItem[];
  }>("GET", `/api/assessments/${encodeURIComponent(id)}/evidence-trace`);
}

export async function getAssessmentModelExecutions(id = "latest"): Promise<{
  assessment_id: string;
  target_url: string;
  total_slots: number;
  verified_models_count: number;
  model_executions: ApiModelExecutionTraceItem[];
}> {
  return _request<{
    assessment_id: string;
    target_url: string;
    total_slots: number;
    verified_models_count: number;
    model_executions: ApiModelExecutionTraceItem[];
  }>("GET", `/api/assessments/${encodeURIComponent(id)}/model-executions`);
}

