import type {
  AdminOrg,
  AdminUser,
  AdminScan,
  AiReviewItem,
  ComplianceRule,
  SystemService,
  AuditLog,
} from "@/types";

export const ADMIN_ORGS: AdminOrg[] = [
  {
    id: "org_technova",
    name: "TechNova Solutions Pvt Ltd",
    industry: "Enterprise SaaS",
    userCount: 14,
    trustScore: 89,
    posture: "Strong Alignment",
    assessmentStatus: "Completed",
    lastActivity: "2 hours ago",
    status: "Active",
  },
  {
    id: "org_finedge",
    name: "FinEdge Technologies India",
    industry: "Fintech",
    userCount: 32,
    trustScore: 74,
    posture: "Needs Attention",
    assessmentStatus: "In Progress",
    lastActivity: "1 day ago",
    status: "Active",
  },
  {
    id: "org_aster",
    name: "Aster Health Labs",
    industry: "Healthtech",
    userCount: 21,
    trustScore: 62,
    posture: "Potential Gaps",
    assessmentStatus: "In Progress",
    lastActivity: "3 days ago",
    status: "Active",
  },
  {
    id: "org_payquick",
    name: "PayQuick India",
    industry: "Payments",
    userCount: 48,
    trustScore: 91,
    posture: "Strong Alignment",
    assessmentStatus: "Completed",
    lastActivity: "5 hours ago",
    status: "Active",
  },
  {
    id: "org_eduspark",
    name: "EduSpark Learning Systems",
    industry: "Edtech",
    userCount: 9,
    trustScore: 48,
    posture: "Critical",
    assessmentStatus: "Not Started",
    lastActivity: "2 weeks ago",
    status: "Suspended",
  },
  {
    id: "org_loginext",
    name: "LogiNext India",
    industry: "Logistics SaaS",
    userCount: 27,
    trustScore: 81,
    posture: "Strong Alignment",
    assessmentStatus: "Completed",
    lastActivity: "6 hours ago",
    status: "Active",
  },
];

export const ADMIN_USERS: AdminUser[] = [
  {
    id: "usr_rajesh",
    name: "Rajesh Sharma",
    email: "rajesh@technova.in",
    organization: "TechNova Solutions Pvt Ltd",
    role: "Owner",
    status: "Active",
    lastActive: "2 hours ago",
  },
  {
    id: "usr_ananya",
    name: "Ananya Deshmukh",
    email: "ananya@finedge.in",
    organization: "FinEdge Technologies India",
    role: "Compliance Lead",
    status: "Active",
    lastActive: "1 day ago",
  },
  {
    id: "usr_vikram",
    name: "Vikram Rao",
    email: "vikram@asterhealth.in",
    organization: "Aster Health Labs",
    role: "Owner",
    status: "Active",
    lastActive: "3 days ago",
  },
  {
    id: "usr_priya",
    name: "Priya Nair",
    email: "priya@payquick.in",
    organization: "PayQuick India",
    role: "Compliance Lead",
    status: "Active",
    lastActive: "5 hours ago",
  },
  {
    id: "usr_karan",
    name: "Karan Mehta",
    email: "karan@eduspark.in",
    organization: "EduSpark Learning Systems",
    role: "Owner",
    status: "Suspended",
    lastActive: "2 weeks ago",
  },
  {
    id: "usr_reviewer",
    name: "S. Iyer",
    email: "s.iyer@trustforge.in",
    organization: "TrustForge (Platform)",
    role: "AI Reviewer",
    status: "Active",
    lastActive: "20 minutes ago",
  },
];

export const ADMIN_SCANS: AdminScan[] = [
  { id: "scan-8841", url: "technova.in", organization: "TechNova Solutions Pvt Ltd", state: "Completed", score: 89, startedAt: "09:30 IST" },
  { id: "scan-8840", url: "payquick.in", organization: "PayQuick India", state: "Completed", score: 91, startedAt: "08:12 IST" },
  { id: "scan-8839", url: "asterhealth.in", organization: "Aster Health Labs", state: "Scanning", startedAt: "10:04 IST" },
  { id: "scan-8838", url: "finedge.in", organization: "FinEdge Technologies India", state: "Queued", startedAt: "10:06 IST" },
  {
    id: "scan-8837",
    url: "eduspark.in",
    organization: "EduSpark Learning Systems",
    state: "Failed",
    startedAt: "07:45 IST",
    failureReason: "HTTP 504 Gateway Timeout after 3 retries",
  },
  {
    id: "scan-8836",
    url: "old.loginext.in",
    organization: "LogiNext India",
    state: "Failed",
    startedAt: "07:20 IST",
    failureReason: "Connection refused by WAF (rule: bot-mitigation)",
  },
];

export const AI_REVIEWS: AiReviewItem[] = [
  {
    id: "air-1",
    subject: "Privacy policy analysis",
    organization: "Aster Health Labs",
    confidence: 42,
    status: "Pending",
    rationale:
      "The policy text was ambiguous about health-data retention, so the automated read could not confirm a defined retention period.",
    evidence: "Policy section 6 references retention 'as required' without a stated duration.",
    dpdpRef: "Section 8(7)",
  },
  {
    id: "air-2",
    subject: "Consent mechanism classification",
    organization: "FinEdge Technologies India",
    confidence: 54,
    status: "Pending",
    rationale:
      "Banner markup suggested pre-ticked consent boxes, which conflicts with an explicit-consent classification.",
    evidence: "Two category checkboxes carried a default checked attribute in the served HTML.",
    dpdpRef: "Section 6(1)",
  },
  {
    id: "air-3",
    subject: "Grievance officer detection",
    organization: "LogiNext India",
    confidence: 88,
    status: "Reviewed",
    rationale: "Grievance officer name and contact were clearly published on the contact page.",
    evidence: "Contact page lists a named officer with a dedicated grievance email.",
    dpdpRef: "Section 8(9)",
  },
];

export const COMPLIANCE_RULES: ComplianceRule[] = [
  {
    id: "rule-1",
    code: "DPDP-SEC8-07",
    requirement: "Retention limited to purpose",
    category: "Data Lifecycle",
    severity: "HIGH",
    evidenceRequirement: "Documented retention schedule with erasure triggers",
    active: true,
    updatedAt: "12 August 2026",
  },
  {
    id: "rule-2",
    code: "DPDP-SEC5-03",
    requirement: "Multilingual notice availability",
    category: "Transparency",
    severity: "MEDIUM",
    evidenceRequirement: "Notice reachable in an Eighth Schedule language",
    active: true,
    updatedAt: "12 August 2026",
  },
  {
    id: "rule-3",
    code: "DPDP-SEC8-02",
    requirement: "Processor contract in place",
    category: "Governance",
    severity: "HIGH",
    evidenceRequirement: "Executed, in-date processing agreement per vendor",
    active: true,
    updatedAt: "1 September 2026",
  },
  {
    id: "rule-4",
    code: "DPDP-SEC6-01",
    requirement: "Consent as easy to withdraw as to give",
    category: "Privacy",
    severity: "HIGH",
    evidenceRequirement: "Equal-prominence accept and reject controls",
    active: true,
    updatedAt: "28 August 2026",
  },
  {
    id: "rule-5",
    code: "DPDP-SEC8-05",
    requirement: "Reasonable security safeguards",
    category: "Security",
    severity: "HIGH",
    evidenceRequirement: "Encryption at rest and in transit, access control",
    active: true,
    updatedAt: "5 August 2026",
  },
  {
    id: "rule-6",
    code: "DPDP-SEC12-00",
    requirement: "Rights request resolution within stated SLA",
    category: "User Rights",
    severity: "MEDIUM",
    evidenceRequirement: "Rights portal logs showing timely resolution",
    active: false,
    updatedAt: "30 July 2026",
  },
];

export const SYSTEM_SERVICES: SystemService[] = [
  { id: "svc-frontend", name: "Frontend", status: "Operational", latencyMs: 42, uptime: 99.98 },
  { id: "svc-api", name: "API", status: "Operational", latencyMs: 118, uptime: 99.95 },
  { id: "svc-db", name: "Database", status: "Operational", latencyMs: 9, uptime: 99.99 },
  { id: "svc-scan", name: "Scan Engine", status: "Degraded", latencyMs: 640, uptime: 99.21 },
  { id: "svc-analysis", name: "Analysis Service", status: "Operational", latencyMs: 210, uptime: 99.9 },
];

export const AUDIT_LOGS: AuditLog[] = [
  { id: "log-1", timestamp: "04 Sep 2026 · 10:04 IST", actor: "S. Iyer", action: "Reviewed finding", resource: "AI review air-2", organization: "FinEdge Technologies India", result: "Success" },
  { id: "log-2", timestamp: "04 Sep 2026 · 09:32 IST", actor: "Platform Operations", action: "Triggered rescan", resource: "scan-8839", organization: "Aster Health Labs", result: "Success" },
  { id: "log-3", timestamp: "04 Sep 2026 · 08:50 IST", actor: "Platform Operations", action: "Suspended user", resource: "usr_karan", organization: "EduSpark Learning Systems", result: "Success" },
  { id: "log-4", timestamp: "03 Sep 2026 · 18:11 IST", actor: "A. Kapoor", action: "Updated compliance rule", resource: "DPDP-SEC8-02", organization: "TrustForge (Platform)", result: "Success" },
  { id: "log-5", timestamp: "03 Sep 2026 · 17:02 IST", actor: "Unknown", action: "Admin sign-in attempt", resource: "/admin", organization: "-", result: "Denied" },
  { id: "log-6", timestamp: "03 Sep 2026 · 14:20 IST", actor: "Platform Operations", action: "Changed role", resource: "usr_priya to Compliance Lead", organization: "PayQuick India", result: "Success" },
];

// KPI figures for the command center (kept in data, not inline in JSX)
export const PLATFORM_KPIS = {
  organizations: ADMIN_ORGS.length,
  activeUsers: 613,
  assessments: 391,
  websiteScans: 1284,
};

// Analytics series
export const TRUST_DISTRIBUTION = [
  { label: "80-100 · Strong", value: 64, tone: "success" as const },
  { label: "60-79 · Moderate", value: 28, tone: "warning" as const },
  { label: "Below 60 · At risk", value: 8, tone: "danger" as const },
];

export const ASSESSMENT_TREND = [
  { month: "Apr", value: 42 },
  { month: "May", value: 88 },
  { month: "Jun", value: 156 },
  { month: "Jul", value: 254 },
  { month: "Aug", value: 331 },
  { month: "Sep", value: 391 },
];

export const COMMON_GAPS = [
  { label: "Retention triggers (Sec 8(7))", value: 58 },
  { label: "Consent parity (Sec 6)", value: 44 },
  { label: "Processor contracts (Sec 8(2))", value: 37 },
  { label: "Multilingual notice (Sec 5(3))", value: 29 },
  { label: "Breach readiness (Sec 8(6))", value: 21 },
];

export const SCAN_STATUS_SPLIT = [
  { label: "Completed", value: 91, tone: "success" as const },
  { label: "Failed", value: 6, tone: "danger" as const },
  { label: "In progress", value: 3, tone: "warning" as const },
];
