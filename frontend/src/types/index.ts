export type Severity = 'HIGH' | 'MEDIUM' | 'LOW';

export type FindingStatus = 'OPEN' | 'IN_PROGRESS' | 'REMEDIATED' | 'REQUIRES_REVIEW' | 'DISMISSED';

export type EvidenceStatus = 'VERIFIED' | 'DETECTED' | 'INFERRED' | 'NOT_FOUND' | 'NOT_ASSESSED';

export type EvidenceConfidence = 'HIGH' | 'MEDIUM' | 'LOW';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
}

export interface Organization {
  id: string;
  name: string;
  industry: string;
  size: string;
  website: string;
  primaryContact: string;
  dataContext: string;
  trustScore: number;
  postureStatus: 'Strong' | 'Moderate' | 'Needs Attention' | 'Critical';
  lastScanned?: string;
  lastAssessed?: string;
}

export interface AssessmentQuestion {
  id: string;
  sectionId: number;
  sectionTitle: string;
  title: string;
  description: string;
  dpdpReference: string;
  type: 'single-choice' | 'multi-choice' | 'text' | 'boolean';
  options?: { value: string; label: string; scoreWeight: number; hint?: string }[];
  explanation: string;
  example: string;
  conditionalField?: { dependsOn: string; showIf: string };
}

export interface AssessmentSection {
  id: number;
  title: string;
  description: string;
  questionIds: string[];
}

export interface Finding {
  id: string;
  title: string;
  severity: Severity;
  affectedArea: string;
  whyItMatters: string;
  evidenceSnippet: string;
  evidenceUrl?: string;
  dpdpReference: string;
  recommendedAction: string;
  status: FindingStatus;
  detectedDate: string;
  pillar: 'Privacy' | 'Security' | 'Transparency' | 'Governance' | 'Data Lifecycle' | 'User Rights';
}

export interface EvidenceItem {
  id: string;
  title: string;
  status: EvidenceStatus;
  confidence: EvidenceConfidence;
  sourceUrl?: string;
  sourceType: 'Website Scanner' | 'Document Upload' | 'Manual Self-Declaration' | 'System Assessment';
  lastChecked: string;
  notes: string;
  findingRefId?: string;
  aiAssisted: boolean;
  aiExplanation?: string;
}

export interface PillarScore {
  name: 'Privacy' | 'Security' | 'Transparency' | 'Governance' | 'Data Lifecycle' | 'User Rights';
  score: number;
  status: 'Strong' | 'Moderate' | 'Needs Attention';
  explanation: string;
  findingCount: number;
  evidenceCoverage: number; // percentage
}

export interface RemediationTask {
  id: string;
  findingId: string;
  title: string;
  problem: string;
  why: string;
  recommendedFix: string;
  evidenceNeeded: string;
  priority: Severity;
  effort: 'Low' | 'Moderate' | 'High';
  status: 'Open' | 'In Progress' | 'In Review' | 'Completed';
  assignedTo?: string;
  dueDate?: string;
}

export interface DPDPReport {
  id: string;
  title: string;
  generatedDate: string;
  trustScore: number;
  postureStatus: string;
  orgName: string;
  executiveSummary: string;
  pillarScores: PillarScore[];
  highPriorityCount: number;
  mediumPriorityCount: number;
  lowPriorityCount: number;
  remediationProgress: number; // percentage
}
