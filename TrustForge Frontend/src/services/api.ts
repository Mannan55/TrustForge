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

async function _request<T>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  body?: unknown,
): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const headers: HeadersInit = { "Content-Type": "application/json" };

  const res = await fetch(url, {
    method,
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const json = await res.json();
      detail = json.detail ?? JSON.stringify(json);
    } catch {
      // ignore JSON parse failure
    }
    throw new ApiError(res.status, detail);
  }

  return res.json() as Promise<T>;
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
  pillar: string;
  score: number;
  weight: number;
  evidence_coverage: number;
  control_count: number;
  applicable_control_count: number;
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
  status: string;
  severity: string;
  finding: string;
  explanation: string;
  recommendation: string;
  evidence_ids: string[];
  citations: ApiCitationRaw[];
  confidence: number;
  evaluation_method: string;
  error?: string | null;
}

export interface ApiEvidenceRaw {
  evidence_id: string;
  source: string;
  key: string;
  title: string;
  status: string;
  observed: boolean | null;
  value?: unknown;
  url?: string;
  confidence: string;
  notes: string;
  method: string;
}

export interface ApiAssessmentResult {
  assessment_id: string;
  org_id: string;
  status: "pending" | "running" | "complete" | "error";
  website_url?: string;
  trust_score: number | null;
  posture: string | null;
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

  const res = await fetch(url, {
    method: "POST",
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
