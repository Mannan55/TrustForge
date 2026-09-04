// ---------------------------------------------------------------------------
// Services layer.
//
// Every screen talks to the app through these functions, never to mock data
// directly. Today each one resolves a Promise from an in-memory fixture with a
// small artificial delay. To move to a real backend (Supabase is the intended
// target), swap the body of each function for a query. The signatures, and
// therefore every caller, stay unchanged.
//
// Entities mirror the planned Supabase schema: users, organizations,
// organization_members, assessments, assessment_answers, website_scans,
// findings, evidence, reports, audit_logs.
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
  /** Public, limited scan for anonymous visitors. */
  async runPublicScan(url: string): Promise<PublicScanResult> {
    await delay(1400);
    return { ...PUBLIC_SCAN, url: url || PUBLIC_SCAN.url };
  },

  /** Deeper authenticated scan for an organization. */
  async runOrgScan(_orgId: string): Promise<ScanCheck[]> {
    await delay(1500);
    return SCAN_CHECKS;
  },
};

// --- Organization / assessment ---------------------------------------------

export const orgService = {
  async getOrganization(_id?: string): Promise<Organization> {
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
    await delay(120);
    return PILLARS;
  },
};

// --- Findings / evidence / remediation --------------------------------------

export const findingsService = {
  async list(): Promise<Finding[]> {
    await delay(120);
    return FINDINGS;
  },
};

export const evidenceService = {
  async list(): Promise<EvidenceItem[]> {
    await delay(120);
    return EVIDENCE;
  },
};

export const remediationService = {
  async list(): Promise<RemediationTask[]> {
    await delay(120);
    return REMEDIATION_TASKS;
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
    await delay(150);
    return SYSTEM_SERVICES;
  },
  async auditLogs(): Promise<AuditLog[]> {
    await delay(150);
    return AUDIT_LOGS;
  },
};
