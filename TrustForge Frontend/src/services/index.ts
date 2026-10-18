// ---------------------------------------------------------------------------
// Services layer — TrustForge Research Backend integration
//
// This layer bridges the React frontend and the TrustForge FastAPI backend.
//
// Strategy:
//   - When VITE_API_BASE_URL is set (backend running), calls are routed to
//     the real research backend API.
//   - When VITE_API_BASE_URL is not set (frontend-only dev), falls back to
//     the original mock data fixtures.
//
// Component signatures are UNCHANGED — no UI code needs to be modified.
//
// Backend: C:\TF new V1\TrustForge\backend
// API docs: http://127.0.0.1:8000/docs (when backend is running)
// ---------------------------------------------------------------------------

import type {
  Organization,
  Finding,
  EvidenceItem,
  RemediationTask,
  Pillar,
  PublicScanResult,
  ScanCheck,
  AdminOrg,
  AdminUser,
  AdminScan,
  AiReviewItem,
  ComplianceRule,
  SystemService,
  AuditLog,
} from "@/types";

import { DEMO_ORG } from "@/data/organization";
import {
  PILLARS,
  FINDINGS,
  EVIDENCE,
  REMEDIATION_TASKS,
  SCAN_CHECKS,
  PUBLIC_SCAN,
} from "@/data/assessmentData";
import {
  ADMIN_ORGS,
  ADMIN_USERS,
  ADMIN_SCANS,
  AI_REVIEWS,
  COMPLIANCE_RULES,
  SYSTEM_SERVICES,
  AUDIT_LOGS,
} from "@/data/adminData";
import { postureForScore } from "@/lib/format";
import * as apiClient from "@/services/api";
import type {
  ApiAssessmentAnswers,
  ApiAssessmentResponse,
  ApiChunk,
} from "@/services/api";

export type {
  ApiAssessmentAnswers,
  ApiAssessmentRequest,
  ApiAssessmentResponse,
  ApiAssessmentResult,
  ApiChunk,
} from "@/services/api";

// API mode: use real backend when VITE_API_BASE_URL is configured
const USE_REAL_API = Boolean(import.meta.env.VITE_API_BASE_URL);

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// --- Identity / verification (mocked) --------------------------------------

export interface GstinVerification {
  found: boolean;
  legalName: string;
  status: "Active" | "Cancelled";
  note: string;
}

export const identityService = {
  /**
   * Mock GSTIN lookup. Returns the registered entity's identity.
   * Note: this proves the *entity exists*, not that the caller represents it.
   */
  async verifyGstin(_gstin: string): Promise<GstinVerification> {
    await delay(900);
    return {
      found: true,
      legalName: DEMO_ORG.legalName,
      status: "Active",
      note: "Confirms the registered entity. It does not prove you are authorized to represent it.",
    };
  },

  /** Mock domain-authorization check via DNS TXT or business email. */
  async verifyDomain(_domain: string): Promise<{ verified: boolean; method: string }> {
    await delay(800);
    return { verified: true, method: "DNS TXT record" };
  },
};

// --- Website scanning -------------------------------------------------------

export const scanService = {
  /** Public, limited scan for anonymous visitors. Routes to real backend when available. */
  async runPublicScan(url: string): Promise<PublicScanResult> {
    if (USE_REAL_API) {
      const result = await apiClient.runPublicScan(url);
      return {
        url: url || result.url,
        score: result.score,
        posture: result.posture as PublicScanResult["posture"],
        scannedAt: result.scanned_at,
        highlights: result.checks.slice(0, 6).map((c) => ({
          label: c.label,
          state: c.state as PublicScanResult["highlights"][0]["state"],
          detail: c.detail,
        })),
      };
    }
    await delay(1400);
    return { ...PUBLIC_SCAN, url: url || PUBLIC_SCAN.url };
  },

  /** Deeper authenticated scan for an organization. Routes to real backend when available. */
  async runOrgScan(orgId: string, url?: string): Promise<ScanCheck[]> {
    const full = await this.runOrgScanFull(orgId, url);
    return full.checks;
  },

  async runOrgScanFull(orgId: string, url?: string): Promise<{
    score: number;
    posture: string;
    url: string;
    checks: ScanCheck[];
  }> {
    if (USE_REAL_API) {
      const targetUrl = url || `https://${DEMO_ORG.primaryDomain}`;
      const result = await apiClient.runOrgScan(targetUrl, orgId);
      return {
        score: result.score,
        posture: result.posture,
        url: result.url,
        checks: result.checks.map((c) => ({
          id: c.id,
          label: c.label,
          kind: c.kind as ScanCheck["kind"],
          state: c.state as ScanCheck["state"],
          detail: c.detail,
          recommendation: c.recommendation,
          evidence: c.evidence,
        })),
      };
    }
    await delay(1500);
    return {
      score: 72,
      posture: "Potential Gaps",
      url: url || `https://${DEMO_ORG.primaryDomain}`,
      checks: SCAN_CHECKS,
    };
  },
};

// --- Organization / assessment ---------------------------------------------

export const orgService = {
  async getOrganization(_id?: string): Promise<Organization> {
    if (USE_REAL_API) {
      let aid = getLatestAssessmentId();
      if (!aid) {
        aid = await resolveActiveAssessmentId();
      }
      if (aid) {
        try {
          const ts = await apiClient.getTrustScore(aid);
          const assessment = await apiClient.getAssessmentResult(aid);
          if (ts) {
            const orgLegalName = assessment?.org_id
              ? assessment.org_id === "org_technova"
                ? DEMO_ORG.legalName
                : `Organization (${assessment.org_id})`
              : DEMO_ORG.legalName;
            return {
              ...DEMO_ORG,
              id: assessment?.org_id || DEMO_ORG.id,
              legalName: orgLegalName,
              displayName: orgLegalName,
              trustScore: ts.trust_score != null ? Math.round(ts.trust_score) : 0,
              posture: (ts.posture || "Not Scorable") as Organization["posture"],
              lastAssessed: ts.scored_at ? new Date(ts.scored_at).toLocaleDateString() : "Recent",
            };
          }
        } catch {
          const fallbackAid = await resolveActiveAssessmentId();
          if (fallbackAid && fallbackAid !== aid) {
            try {
              const ts = await apiClient.getTrustScore(fallbackAid);
              if (ts) {
                return {
                  ...DEMO_ORG,
                  trustScore: ts.trust_score != null ? Math.round(ts.trust_score) : 0,
                  posture: (ts.posture || "Not Scorable") as Organization["posture"],
                  lastAssessed: "Recent",
                };
              }
            } catch {
              /* fall through */
            }
          }
        }
      }
      // If no completed assessment exists at all in real mode:
      return {
        ...DEMO_ORG,
        trustScore: 0,
        posture: "Not Assessed" as Organization["posture"],
        lastAssessed: "Not assessed yet",
      };
    }
    await delay(120);
    return DEMO_ORG;
  },

  async updateOrganization(patch: Partial<Organization>): Promise<Organization> {
    await delay(300);
    const next = { ...DEMO_ORG, ...patch };
    if (patch.trustScore != null) next.posture = postureForScore(patch.trustScore);
    return next;
  },

  async getPillars(): Promise<Pillar[]> {
    if (USE_REAL_API) {
      let aid = getLatestAssessmentId();
      if (!aid) {
        aid = await resolveActiveAssessmentId();
      }
      if (aid) {
        try {
          const ts = await apiClient.getTrustScore(aid);
          if (ts && ts.pillar_scores && ts.pillar_scores.length > 0) {
            return PILLARS.map((p) => {
              const match = ts.pillar_scores.find(
                (ps) =>
                  ps.pillar.toLowerCase() === p.name.toLowerCase() ||
                  ps.pillar.toLowerCase().replace(/\s+/g, "") ===
                    p.name.toLowerCase().replace(/\s+/g, ""),
              );
              if (!match) return p;
              const score = Math.round(match.score);
              const coverage = match.evidence_coverage > 1 
                ? Math.min(100, Math.round(match.evidence_coverage)) 
                : Math.min(100, Math.round(match.evidence_coverage * 100));
              return {
                ...p,
                score,
                weight: Math.round(match.weight),
                evidenceCoverage: coverage,
                metrics: [
                  { label: "Controls assessed", value: `${match.applicable_control_count} evaluated` },
                  { label: "Evidence coverage", value: `${coverage}% backed` },
                  { label: "Status", value: score >= 80 ? "Aligned" : score >= 65 ? "Fair" : "Gap identified" },
                ],
              };
            });
          }
        } catch {
          /* fall through */
        }
      }
      return PILLARS.map((p) => ({
        ...p,
        score: 0,
        evidenceCoverage: 0,
        metrics: [
          { label: "Controls assessed", value: "0 evaluated" },
          { label: "Evidence coverage", value: "0% backed" },
          { label: "Status", value: "Unassessed" },
        ],
      }));
    }
    await delay(120);
    return PILLARS;
  },
};

// ── Latest assessment ID storage & dynamic discovery ──
const LATEST_AID_KEY = "trustforge.latestAssessmentId";

export function storeLatestAssessmentId(id: string): void {
  try {
    localStorage.setItem(LATEST_AID_KEY, id);
  } catch {
    /* ignore */
  }
}

export function getLatestAssessmentId(): string | null {
  try {
    return localStorage.getItem(LATEST_AID_KEY);
  } catch {
    return null;
  }
}

export async function resolveActiveAssessmentId(): Promise<string | null> {
  if (!USE_REAL_API) return null;
  const stored = getLatestAssessmentId();
  if (stored) {
    try {
      const res = await apiClient.getAssessmentResult(stored);
      if (res && res.status === "complete") return stored;
    } catch {
      // Stored ID is no longer valid, clear it
      try {
        localStorage.removeItem(LATEST_AID_KEY);
      } catch {
        /* ignore */
      }
    }
  }
  try {
    const latest = await apiClient.getLatestAssessment();
    if (latest && latest.assessment_id) {
      storeLatestAssessmentId(latest.assessment_id);
      return latest.assessment_id;
    }
  } catch {
    // No completed assessment exists
  }
  return null;
}

// --- Findings / evidence / remediation --------------------------------------

export const findingsService = {
  async list(): Promise<Finding[]> {
    if (USE_REAL_API) {
      let aid = getLatestAssessmentId();
      if (!aid) {
        aid = await resolveActiveAssessmentId();
      }
      if (aid) {
        try {
          const raw = await apiClient.getFindings(aid);
          const statusMap: Record<string, Finding["status"]> = {
            PASS: "REMEDIATED",
            FAIL: "OPEN",
            POTENTIAL_GAP: "IN_PROGRESS",
            INSUFFICIENT_EVIDENCE: "REQUIRES_REVIEW",
          };

          return raw.map((f) => {
            const pCode = f.control_id.split("-")[1] ?? "";
            const pillar =
              pCode === "PRIV"
                ? "Privacy"
                : pCode === "SEC"
                ? "Security"
                : pCode === "TRANS"
                ? "Transparency"
                : pCode === "GOV"
                ? "Governance"
                : pCode === "LIFE" || pCode === "DL"
                ? "Data Lifecycle"
                : "User Rights";
            const citationSection =
              f.citations && f.citations[0]?.section
                ? `Section ${f.citations[0].section}`
                : "Section 8";

            return {
              id: f.control_id,
              title: f.finding || `${f.control_id} Compliance Check`,
              severity: (f.severity as Finding["severity"]) ?? "MEDIUM",
              status: statusMap[f.status] ?? "OPEN",
              affectedArea: `${pillar} Control`,
              pillar,
              whyItMatters: f.explanation || "Mandated under the DPDP Act 2023.",
              evidenceSnippet:
                f.citations && f.citations[0]?.excerpt
                  ? f.citations[0].excerpt
                  : f.explanation || "No direct snippet observed.",
              evidenceUrl: f.citations?.[0]?.source_url || undefined,
              dpdpReference: citationSection,
              recommendedAction:
                f.recommendation || "Review and remediate according to DPDP provisions.",
              scoreImpact: f.severity === "HIGH" ? 5 : f.severity === "MEDIUM" ? 3 : 2,
              detectedDate: "Latest assessment",
            };
          });
        } catch (err: any) {
          console.warn("Could not load findings for assessment:", aid, err?.message);
          return [];
        }
      }
      return [];
    }
    await delay(120);
    return FINDINGS;
  },
};

export const evidenceService = {
  async list(): Promise<EvidenceItem[]> {
    if (USE_REAL_API) {
      let aid = getLatestAssessmentId();
      if (!aid) {
        aid = await resolveActiveAssessmentId();
      }
      if (aid) {
        try {
          const res = await apiClient.getAssessmentResult(aid);
          if (res && res.evidence && res.evidence.length > 0) {
            const sourceMap: Record<string, EvidenceItem["sourceType"]> = {
              website_scanner: "Website Scanner",
              scanner: "Website Scanner",
              assessment_wizard: "Manual Self-Declaration",
              document_upload: "Document Upload",
              system_inferred: "System Assessment",
            };
            return res.evidence.map((ev, idx) => ({
              id: ev.evidence_id || `ev-${idx}`,
              title: ev.title || ev.key,
              status: (ev.status as EvidenceItem["status"]) || "DETECTED",
              confidence: (ev.confidence as EvidenceItem["confidence"]) || "MEDIUM",
              sourceType: sourceMap[ev.source] || "System Assessment",
              sourceUrl: ev.url || undefined,
              lastChecked: "Recent",
              notes: ev.notes || "",
              method: ev.method || "Observed through assessment pipeline",
            }));
          }
          return [];
        } catch (err) {
          console.warn("Could not load evidence for assessment:", aid, err);
          return [];
        }
      }
      return [];
    }
    await delay(120);
    return EVIDENCE;
  },

  async upload(file: File): Promise<apiClient.ApiUploadEvidenceResponse> {
    if (USE_REAL_API) {
      let aid = getLatestAssessmentId();
      if (!aid) {
        aid = await resolveActiveAssessmentId();
      }
      if (!aid) {
        throw new Error("No completed assessment found to attach evidence to. Please complete an assessment first.");
      }
      return apiClient.uploadEvidenceFile(aid, file);
    }
    throw new Error("Backend connection is required for evidence upload.");
  },
};

export const remediationService = {
  async list(): Promise<RemediationTask[]> {
    if (USE_REAL_API) {
      let aid = getLatestAssessmentId();
      if (!aid) {
        aid = await resolveActiveAssessmentId();
      }
      if (aid) {
        try {
          const raw = await apiClient.getFindings(aid);
          const openFindings = raw.filter((f) => f.status !== "PASS");
          return openFindings.map((f, idx) => ({
            id: `rem-${f.control_id}`,
            findingRefId: f.control_id,
            title: f.recommendation
              ? f.recommendation.length > 80
                ? f.recommendation.slice(0, 80) + "…"
                : f.recommendation
              : `Remediate ${f.control_id} gap`,
            problem: f.finding || `Compliance gap identified under ${f.control_id}.`,
            why: f.explanation || "Statutory obligation under the DPDP Act 2023.",
            recommendedFix:
              f.recommendation || "Implement required technical and organizational measures.",
            evidenceNeeded:
              f.citations && f.citations[0]?.section
                ? `Evidence of alignment with Section ${f.citations[0].section}`
                : "Formal compliance artifact or verified policy",
            priority: (f.severity as RemediationTask["priority"]) || "MEDIUM",
            effort: f.severity === "HIGH" ? "High" : f.severity === "MEDIUM" ? "Moderate" : "Low",
            status: f.status === "POTENTIAL_GAP" ? "IN_PROGRESS" : "NOT_STARTED",
            assignedTo: idx % 2 === 0 ? "Compliance Lead" : "DPO / Legal Counsel",
            dueDate: "In 14 days",
          }));
        } catch (err: any) {
          console.warn("Could not load remediation tasks for assessment:", aid, err?.message);
          return [];
        }
      }
      return [];
    }
    await delay(120);
    return REMEDIATION_TASKS;
  },
};

// --- Assessment submission (real backend) -----------------------------------

export const assessmentService = {
  async submit(answers: ApiAssessmentAnswers): Promise<ApiAssessmentResponse> {
    if (USE_REAL_API) {
      return apiClient.submitAssessment(answers);
    }
    await delay(2000);
    return {
      assessment_id: `mock-${Date.now()}`,
      status: "mock",
      message: "Assessment submitted (mock mode). Set VITE_API_BASE_URL for real evaluation.",
    };
  },
};

// --- RAG retrieval (real backend) ------------------------------------------

export const ragService = {
  async retrieve(query: string, topK = 5): Promise<ApiChunk[]> {
    if (USE_REAL_API) {
      return apiClient.ragRetrieve(query, topK);
    }
    return [];
  },
};

// --- Admin ------------------------------------------------------------------

export const adminService = {
  async orgs(): Promise<AdminOrg[]> {
    await delay(150);
    return ADMIN_ORGS;
  },
  async org(id: string): Promise<AdminOrg | undefined> {
    await delay(150);
    return ADMIN_ORGS.find((o) => o.id === id);
  },
  async users(): Promise<AdminUser[]> {
    await delay(150);
    return ADMIN_USERS;
  },
  async user(id: string): Promise<AdminUser | undefined> {
    await delay(150);
    return ADMIN_USERS.find((u) => u.id === id);
  },
  async scans(): Promise<AdminScan[]> {
    await delay(150);
    return ADMIN_SCANS;
  },
  async aiReviews(): Promise<AiReviewItem[]> {
    await delay(150);
    return AI_REVIEWS;
  },
  async rules(): Promise<ComplianceRule[]> {
    await delay(150);
    return COMPLIANCE_RULES;
  },
  async systemHealth(): Promise<SystemService[]> {
    if (USE_REAL_API) {
      try {
        const health = await apiClient.checkHealth();
        const backendSvc: SystemService = {
          id: "trustforge-backend",
          name: "TrustForge Research Backend",
          status: health.status === "ok" ? "Operational" : "Degraded",
          latencyMs: 0,
          uptime: 100,
        };
        return [backendSvc, ...SYSTEM_SERVICES.slice(1)];
      } catch {
        const downSvc: SystemService = {
          id: "trustforge-backend",
          name: "TrustForge Research Backend",
          status: "Down",
          latencyMs: 0,
          uptime: 0,
        };
        return [downSvc, ...SYSTEM_SERVICES.slice(1)];
      }
    }
    await delay(150);
    return SYSTEM_SERVICES;
  },
  async auditLogs(): Promise<AuditLog[]> {
    await delay(150);
    return AUDIT_LOGS;
  },
};
