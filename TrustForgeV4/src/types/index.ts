export type AccountType = 'organization' | 'personal';

export interface User {
  id: string;
  name: string;
  email: string;
  accountType: AccountType;
  orgId?: string;
  createdAt: string;
}

export interface Organization {
  id: string;
  legalName: string;
  cin?: string;
  gstin?: string;
  industry: string;
  companySize: string;
  primaryDomain: string;
  publicDomain: string;
  endpointConfig?: string;
  detectedIntegrations: string[];
  gstinVerified: boolean;
  domainVerified: boolean;
  grievanceOfficerName?: string;
  grievanceOfficerEmail?: string;
}

export interface AssessmentAnswer {
  questionId: string;
  value: any;
  notes?: string;
}

export interface UploadedEvidence {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadDate: string;
  status: 'verified' | 'pending' | 'needs_update';
  category: string;
  summary?: string;
}

export interface AssessmentSection {
  id: number;
  title: string;
  description: string;
  questionIds: string[];
  whyWeAsk?: string;
  dpdpContext?: string;
}

export interface Finding {
  id: string;
  title: string;
  category: 'Consent' | 'Retention' | 'Rights' | 'Security' | 'Processors' | 'Governance';
  severity: 'critical' | 'high' | 'medium' | 'low';
  scoreImpact: number;
  whatIsWrong: string;
  whyItMatters: string;
  whatShouldWeDo: string;
  howToImprove: string;
  dpdpSection: string;
  status: 'open' | 'in_progress' | 'resolved';
}

export interface WebsiteScanResult {
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
}

export interface TrustScoreBreakdown {
  overallScore: number;
  statusLabel: 'Strong Alignment' | 'Needs Attention' | 'Potential Gaps';
  pillars: {
    id: string;
    name: string;
    score: number;
    weight: number;
    description: string;
    color: string;
  }[];
}
