/**
 * TrustForge — Backend API Client
 * Connects the React frontend to the real FastAPI backend.
 * 
 * Falls back to demo mock data only when explicitly requested
 * (e.g., demo mode or backend unreachable during development).
 */

const BACKEND_URL = (import.meta as any).env?.VITE_BACKEND_URL || 'http://localhost:8000';

export interface BackendScanResult {
  url: string;
  scan_date: string;
  scan_duration_ms: number;
  https: {
    has_https: boolean;
    redirects_to_https: boolean;
    hsts_present: boolean;
    evidence: string;
  };
  privacy_policy: {
    found: boolean;
    url?: string;
    has_grievance_contact: boolean;
    has_language_support: boolean;
    last_updated_text?: string;
    evidence: string;
  };
  cookie_consent: {
    banner_detected: boolean;
    has_accept_button: boolean;
    has_reject_button: boolean;
    has_preference_button: boolean;
    trackers_before_consent: string[];
    evidence: string;
  };
  trackers: Array<{
    name: string;
    script_pattern: string;
    detected: boolean;
    evidence: string;
  }>;
  forms: {
    form_count: number;
    personal_data_fields: Array<{ field_type: string; name: string; label?: string }>;
    evidence: string;
  };
  security_headers: {
    content_security_policy?: string;
    strict_transport_security?: string;
    x_content_type_options?: string;
    referrer_policy?: string;
    permissions_policy?: string;
    x_frame_options?: string;
  };
  observations: string[];
  evidence: string[];
  error?: string;
}

export interface BackendAssessmentResponse {
  assessment_id: string;
  trust_score: {
    assessment_id: string;
    scoring_version: string;
    overall_score: number;
    coverage_percentage: number;
    status_label: string;
    pillars: Array<{
      pillar_id: string;
      name: string;
      weight: number;
      raw_score: number;
      evaluated_controls: number;
      unknown_controls: number;
      na_controls: number;
      controls: Array<{
        control_id: string;
        title: string;
        pillar: string;
        weight: number;
        status: string;
        confidence: string;
        evidence_used: string[];
        dpdp_reference?: string;
        notes: string;
        evaluation_method: string;
      }>;
      description: string;
      color: string;
    }>;
    total_controls: number;
    evaluated_controls: number;
    unknown_controls: number;
    na_controls: number;
    frugal_ai_metrics: {
      total_controls: number;
      deterministic_resolved: number;
      rag_resolved: number;
      ai_resolved: number;
      unknown_unresolved: number;
      ai_calls_made: number;
      input_tokens_used: number;
      output_tokens_used: number;
      estimated_cost_usd: number;
      total_execution_ms: number;
      rule_resolution_rate: number;
    };
    computed_at: string;
  };
  findings: Array<{
    finding_id: string;
    title: string;
    pillar: string;
    category: string;
    severity: string;
    control_id: string;
    what_is_wrong: string;
    why_it_matters: string;
    what_should_we_do: string;
    how_to_improve: string;
    legal_reference: string;
    dpdp_section: string;
    score_impact: number;
    recommendation: string;
    confidence: string;
    source: string;
    status: string;
  }>;
  evidence_summaries: unknown[];
  status: string;
}

export interface RAGResult {
  query: string;
  chunks: Array<{
    document: string;
    section: string;
    heading: string;
    text: string;
    score: number;
  }>;
  top_k: number;
}

class TrustForgeAPIClient {
  private baseUrl: string;
  private isAvailable: boolean | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async fetch<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Backend error ${res.status}: ${err}`);
    }
    return res.json() as Promise<T>;
  }

  async checkAvailability(): Promise<boolean> {
    if (this.isAvailable !== null) return this.isAvailable;
    try {
      const res = await fetch(`${this.baseUrl}/health`, { signal: AbortSignal.timeout(3000) });
      this.isAvailable = res.ok;
    } catch {
      this.isAvailable = false;
    }
    return this.isAvailable;
  }

  async scanWebsite(url: string): Promise<BackendScanResult> {
    return this.fetch<BackendScanResult>('/api/scan', {
      method: 'POST',
      body: JSON.stringify({ url }),
    });
  }

  async runAssessment(
    answers: Record<string, unknown>,
    scanResult?: BackendScanResult,
  ): Promise<BackendAssessmentResponse> {
    return this.fetch<BackendAssessmentResponse>('/api/assessment/evaluate', {
      method: 'POST',
      body: JSON.stringify({
        answers,
        scan_result: scanResult ?? null,
        evidence_ids: [],
      }),
    });
  }

  async queryRAG(query: string, topK = 5): Promise<RAGResult> {
    return this.fetch<RAGResult>('/api/rag/query', {
      method: 'POST',
      body: JSON.stringify({ query, top_k: topK }),
    });
  }

  async uploadEvidence(file: File): Promise<unknown> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${this.baseUrl}/api/evidence/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error(`Evidence upload failed: ${res.status}`);
    return res.json();
  }

  async ingestRAGCorpus(): Promise<unknown> {
    return this.fetch('/api/rag/ingest', { method: 'POST' });
  }

  async ragStatus(): Promise<{ index_built: boolean; message: string }> {
    return this.fetch('/api/rag/status');
  }
}

export const apiClient = new TrustForgeAPIClient(BACKEND_URL);

/**
 * Convert a BackendScanResult to the legacy WebsiteScanResult format
 * used by the existing TrustForge frontend.
 */
export function adaptScanResult(backend: BackendScanResult): {
  url: string;
  scanDate: string;
  trustScore: number;
  status: 'Strong Alignment' | 'Needs Attention' | 'Potential Gaps';
  sslStatus: {
    enabled: boolean;
    protocol: string;
    issuer: string;
    expiresInDays: number;
  };
  privacyPolicy: {
    found: boolean;
    url?: string;
    lastUpdatedDaysAgo: number;
    hasGrievanceDetails: boolean;
    hasLanguageSupport: boolean;
  };
  cookieConsent: {
    found: boolean;
    hasOptOut: boolean;
    detectedTrackers: string[];
  };
  observations: string[];
  recommendations: string[];
  // Extended real data
  realScanData: BackendScanResult;
} {
  const detectedTrackers = backend.trackers
    .filter(t => t.detected)
    .map(t => t.name);

  // Compute a preliminary score from scan signals
  let signalScore = 0;
  if (backend.https.has_https) signalScore += 25;
  if (backend.privacy_policy.found) signalScore += 25;
  if (backend.privacy_policy.has_grievance_contact) signalScore += 15;
  if (backend.cookie_consent.banner_detected) signalScore += 10;
  if (backend.cookie_consent.has_reject_button) signalScore += 10;
  if (!backend.cookie_consent.trackers_before_consent?.length) signalScore += 15;

  const status: 'Strong Alignment' | 'Needs Attention' | 'Potential Gaps' =
    signalScore >= 80 ? 'Strong Alignment' :
    signalScore >= 55 ? 'Needs Attention' :
    'Potential Gaps';

  return {
    url: backend.url,
    scanDate: backend.scan_date,
    trustScore: signalScore,
    status,
    sslStatus: {
      enabled: backend.https.has_https,
      protocol: backend.https.hsts_present ? 'HTTPS+HSTS' : 'HTTPS',
      issuer: 'Detected via HTTP response',
      expiresInDays: -1, // Not available without TLS inspection
    },
    privacyPolicy: {
      found: backend.privacy_policy.found,
      url: backend.privacy_policy.url,
      lastUpdatedDaysAgo: -1,
      hasGrievanceDetails: backend.privacy_policy.has_grievance_contact,
      hasLanguageSupport: backend.privacy_policy.has_language_support,
    },
    cookieConsent: {
      found: backend.cookie_consent.banner_detected,
      hasOptOut: backend.cookie_consent.has_reject_button || backend.cookie_consent.has_preference_button,
      detectedTrackers,
    },
    observations: backend.observations,
    recommendations: backend.observations
      .filter(o => o.toLowerCase().includes('dpdp') || o.toLowerCase().includes('warning'))
      .slice(0, 3),
    realScanData: backend,
  };
}
