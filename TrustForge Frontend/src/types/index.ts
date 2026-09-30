// ---------------------------------------------------------------------------
// TrustForge domain types
// These mirror the entity shapes a Supabase backend would eventually expose,
// so the services layer can be swapped from mock to real without touching UI.
// ---------------------------------------------------------------------------

export type AccountMode = "organization" | "personal";

export type UserRole =
  | "Super Admin"
  | "Platform Admin"
  | "AI Reviewer"
  | "Compliance Lead"
  | "Viewer"
  | "Owner"
  | "Member";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  title?: string;
  organizationId?: string;
  accountMode: AccountMode;
  avatarInitials: string;
}

export type PostureLevel =
  | "Strong Alignment"
  | "Needs Attention"
  | "Potential Gaps"
  | "Critical";

export interface Organization {
  id: string;
  legalName: string;
  displayName: string;
  cin: string;
  gstin: string;
  industry: string;
  companySize: string;
  primaryDomain: string;
  appDomain?: string;
  grievanceOfficer: string;
  grievanceEmail: string;
  registeredAddress: string;
  dataRegion: string;
  trustScore: number;
  posture: PostureLevel;
  gstinVerified: boolean;
  domainVerified: boolean;
  authorizationVerified: boolean;
  lastAssessed: string;
}

// --- Trust Score ------------------------------------------------------------

export interface Pillar {
  id: string;
  name: string;
  score: number;
  weight: number;
  description: string;
  evidenceCoverage: number;
  trend: number; // percentage points vs last cycle
  metrics: { label: string; value: string }[];
}

// --- Findings ---------------------------------------------------------------

export type Severity = "HIGH" | "MEDIUM" | "LOW";

export type FindingStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "REMEDIATED"
  | "REQUIRES_REVIEW"
  | "DISMISSED";

export interface Finding {
  id: string;
  title: string;
  severity: Severity;
  status: FindingStatus;
  affectedArea: string;
  pillar: string;
  whyItMatters: string;
  evidenceSnippet: string;
  evidenceUrl?: string;
  dpdpReference: string;
  recommendedAction: string;
  scoreImpact: number;
  detectedDate: string;
}

// --- Evidence ---------------------------------------------------------------

export type EvidenceStatus =
  | "VERIFIED"
  | "DETECTED"
  | "INFERRED"
  | "NOT_FOUND"
  | "NOT_ASSESSED";

export type EvidenceConfidence = "HIGH" | "MEDIUM" | "LOW";

export type EvidenceSource =
  | "Website Scanner"
  | "Document Upload"
  | "Manual Self-Declaration"
  | "System Assessment";

export interface EvidenceItem {
  id: string;
  title: string;
  status: EvidenceStatus;
  confidence: EvidenceConfidence;
  sourceType: EvidenceSource;
  sourceUrl?: string;
  lastChecked: string;
  notes: string;
  findingRefId?: string;
  method: string; // concise, non chain-of-thought rationale
}

// --- Remediation ------------------------------------------------------------

export type Effort = "Low" | "Moderate" | "High";
export type RemediationStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";

export interface RemediationTask {
  id: string;
  findingRefId?: string;
  title: string;
  problem: string;
  why: string;
  recommendedFix: string;
  evidenceNeeded: string;
  priority: Severity;
  effort: Effort;
  status: RemediationStatus;
  assignedTo: string;
  dueDate: string;
}

// --- Website scan -----------------------------------------------------------

export type ScanSignalKind = "technical" | "privacy" | "assessment";
export type ScanResultState = "pass" | "attention" | "gap";

export interface ScanCheck {
  id: string;
  label: string;
  kind: ScanSignalKind;
  state: ScanResultState;
  detail: string;
  recommendation?: string;
  evidence?: string;
}

export interface PublicScanResult {
  url: string;
  score: number;
  posture: PostureLevel;
  scannedAt: string;
  highlights: { label: string; state: ScanResultState; detail: string }[];
}

// --- Documents / uploads ----------------------------------------------------

export type UploadStatus = "Verified" | "Uploaded" | "Processing";

export interface UploadedDocument {
  id: string;
  name: string;
  sizeLabel: string;
  status: UploadStatus;
}

// --- Assessment framework ---------------------------------------------------

export interface AssessmentStepMeta {
  id: string;
  index: number;
  title: string;
  shortTitle: string;
  description: string;
  whyWeAsk: string;
  dpdpContext: string;
  dpdpRef: string;
}

export interface DataCategory {
  id: string;
  name: string;
  description: string;
  sensitivity: "Standard" | "Medium" | "High" | "Critical";
  examples: string[];
}

export interface DetectedIntegration {
  id: string;
  name: string;
  category: string;
  risk: Severity;
}

export interface Language {
  code: string;
  name: string;
  native: string;
}

// --- Admin ------------------------------------------------------------------

export type OrgAccountStatus = "Active" | "Suspended" | "Onboarding";
export type AssessmentProgress = "Completed" | "In Progress" | "Not Started";

export interface AdminOrg {
  id: string;
  name: string;
  industry: string;
  userCount: number;
  trustScore: number;
  posture: PostureLevel;
  assessmentStatus: AssessmentProgress;
  lastActivity: string;
  status: OrgAccountStatus;
}

export type UserAccountStatus = "Active" | "Suspended" | "Invited";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  organization: string;
  role: UserRole;
  status: UserAccountStatus;
  lastActive: string;
}

export type ScanState = "Queued" | "Scanning" | "Completed" | "Failed";

export interface AdminScan {
  id: string;
  url: string;
  organization: string;
  state: ScanState;
  score?: number;
  startedAt: string;
  failureReason?: string;
}

export interface AiReviewItem {
  id: string;
  subject: string;
  organization: string;
  confidence: number;
  status: "Pending" | "Flagged" | "Reviewed";
  rationale: string;
  evidence: string;
  dpdpRef: string;
}

export interface ComplianceRule {
  id: string;
  code: string;
  requirement: string;
  category: string;
  severity: Severity;
  evidenceRequirement: string;
  active: boolean;
  updatedAt: string;
}

export type ServiceStatus = "Operational" | "Degraded" | "Down";

export interface SystemService {
  id: string;
  name: string;
  status: ServiceStatus;
  latencyMs: number;
  uptime: number;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  resource: string;
  organization: string;
  result: "Success" | "Denied" | "Warning";
}
