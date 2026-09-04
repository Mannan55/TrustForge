import { Organization, User, Finding, EvidenceItem, Severity, FindingStatus, EvidenceStatus } from '../types';

export interface AdminOrg extends Organization {
  userCount: number;
  assessmentStatus: 'Completed' | 'In Progress' | 'Not Started' | 'Requires Review';
  createdDate: string;
  status: 'Active' | 'Suspended';
}

export interface AdminUser extends User {
  orgName: string;
  orgId: string;
  adminRole: 'Super Admin' | 'Platform Admin' | 'AI Reviewer' | 'Compliance Lead' | 'Viewer';
  status: 'Active' | 'Suspended';
  lastActive: string;
}

export interface AdminScanItem {
  id: string;
  website: string;
  orgName: string;
  orgId: string;
  status: 'Queued' | 'Scanning' | 'Completed' | 'Failed';
  startedTime: string;
  duration?: string;
  errorReason?: string;
  findingCount?: number;
  trustScore?: number;
}

export interface AIReviewItem {
  id: string;
  findingId: string;
  title: string;
  orgName: string;
  orgId: string;
  confidence: number;
  status: 'Pending Review' | 'Flagged' | 'Reviewed';
  aiRationaleSummary: string;
  evidenceSnippet: string;
  dpdpReference: string;
  targetPolicy: string;
  detectedDate: string;
}

export interface ComplianceRule {
  id: string;
  ruleCode: string;
  title: string;
  category: 'Notice & Consent' | 'Data Retention' | 'Data Principal Rights' | 'Security Practice' | 'Third-Party DPA';
  dpdpSection: string;
  severityWeight: Severity;
  evidenceRequired: string;
  status: 'Active' | 'Inactive';
  lastUpdated: string;
}

export interface SystemServiceHealth {
  name: string;
  status: 'Operational' | 'Degraded' | 'Down';
  latencyMs: number;
  uptimePercentage: number;
  lastChecked: string;
}

export interface AdminAuditLog {
  id: string;
  timestamp: string;
  actorName: string;
  actorEmail: string;
  action: string;
  targetResource: string;
  orgName: string;
  result: 'Success' | 'Warning' | 'Failure';
}

export const MOCK_ADMIN_ORGS: AdminOrg[] = [
  {
    id: 'org_1',
    name: 'TechNova Solutions Pvt Ltd',
    industry: 'Enterprise Software & SaaS',
    size: '100 - 500 employees',
    website: 'technova.in',
    primaryContact: 'Rajesh Sharma (CTO)',
    dataContext: 'Processes customer PII, enterprise billing details, and SaaS user telemetry across India.',
    trustScore: 89,
    postureStatus: 'Strong',
    userCount: 14,
    assessmentStatus: 'Completed',
    createdDate: '2026-01-12',
    status: 'Active',
    lastScanned: '2 hours ago',
    lastAssessed: 'Today, 10:30 AM'
  },
  {
    id: 'org_2',
    name: 'FinEdge Technologies India',
    industry: 'FinTech & Payments',
    size: '50 - 200 employees',
    website: 'finedge.co.in',
    primaryContact: 'Ananya Verma (Head of Compliance)',
    dataContext: 'Handles financial transactions, KYC documents, and UPI payment metadata.',
    trustScore: 74,
    postureStatus: 'Moderate',
    userCount: 8,
    assessmentStatus: 'In Progress',
    createdDate: '2026-02-05',
    status: 'Active',
    lastScanned: 'Yesterday',
    lastAssessed: '3 days ago'
  },
  {
    id: 'org_3',
    name: 'Aster Health Labs',
    industry: 'HealthTech & Diagnostics',
    size: '200 - 1000 employees',
    website: 'asterlabs.in',
    primaryContact: 'Dr. Vikramaditya Malhotra',
    dataContext: 'Processes patient health records, diagnostic reports, and medical billing.',
    trustScore: 62,
    postureStatus: 'Needs Attention',
    userCount: 22,
    assessmentStatus: 'Requires Review',
    createdDate: '2026-03-18',
    status: 'Active',
    lastScanned: '5 days ago',
    lastAssessed: '1 week ago'
  },
  {
    id: 'org_4',
    name: 'PayQuick India Pvt Ltd',
    industry: 'FinTech & Payments',
    size: '11 - 50 employees',
    website: 'payquick.in',
    primaryContact: 'Sanjay Dutt (CISO)',
    dataContext: 'Merchant payment gateway processing customer cards and UPI handles.',
    trustScore: 91,
    postureStatus: 'Strong',
    userCount: 6,
    assessmentStatus: 'Completed',
    createdDate: '2026-04-02',
    status: 'Active',
    lastScanned: '1 day ago',
    lastAssessed: 'Yesterday'
  },
  {
    id: 'org_5',
    name: 'EduSpark Learning Systems',
    industry: 'EdTech & Training',
    size: '51 - 200 employees',
    website: 'eduspark.in',
    primaryContact: 'Pooja Hegde (DPO)',
    dataContext: 'Online learning platform for students and university courses.',
    trustScore: 48,
    postureStatus: 'Critical',
    userCount: 9,
    assessmentStatus: 'In Progress',
    createdDate: '2026-05-14',
    status: 'Suspended',
    lastScanned: '2 weeks ago',
    lastAssessed: '2 weeks ago'
  }
];

export const MOCK_ADMIN_USERS: AdminUser[] = [
  {
    id: 'usr_admin_1',
    name: 'Antigravity Platform Lead',
    email: 'admin@trustforge.in',
    role: 'Super Admin',
    adminRole: 'Super Admin',
    orgName: 'TrustForge Platform Governance',
    orgId: 'org_platform',
    status: 'Active',
    lastActive: 'Just now'
  },
  {
    id: 'usr_1',
    name: 'Rajesh Sharma',
    email: 'rajesh@technova.in',
    role: 'Admin / CTO',
    adminRole: 'Compliance Lead',
    orgName: 'TechNova Solutions Pvt Ltd',
    orgId: 'org_1',
    status: 'Active',
    lastActive: '10 mins ago'
  },
  {
    id: 'usr_2',
    name: 'Ananya Verma',
    email: 'ananya@finedge.co.in',
    role: 'Head of Compliance',
    adminRole: 'Compliance Lead',
    orgName: 'FinEdge Technologies India',
    orgId: 'org_2',
    status: 'Active',
    lastActive: '1 hour ago'
  },
  {
    id: 'usr_3',
    name: 'Dr. Vikramaditya Malhotra',
    email: 'vikram@asterlabs.in',
    role: 'Medical Director',
    adminRole: 'Viewer',
    orgName: 'Aster Health Labs',
    orgId: 'org_3',
    status: 'Active',
    lastActive: ' Yesterday'
  },
  {
    id: 'usr_4',
    name: 'Sanjay Dutt',
    email: 'sanjay@payquick.in',
    role: 'CISO',
    adminRole: 'AI Reviewer',
    orgName: 'PayQuick India Pvt Ltd',
    orgId: 'org_4',
    status: 'Active',
    lastActive: '3 hours ago'
  }
];

export const MOCK_ADMIN_SCANS: AdminScanItem[] = [
  {
    id: 'scan_101',
    website: 'technova.in',
    orgName: 'TechNova Solutions Pvt Ltd',
    orgId: 'org_1',
    status: 'Completed',
    startedTime: 'Today at 09:15 AM',
    duration: '14.2s',
    findingCount: 4,
    trustScore: 78
  },
  {
    id: 'scan_102',
    website: 'finedge.co.in',
    orgName: 'FinEdge Technologies India',
    orgId: 'org_2',
    status: 'Completed',
    startedTime: 'Yesterday at 04:30 PM',
    duration: '18.6s',
    findingCount: 6,
    trustScore: 74
  },
  {
    id: 'scan_103',
    website: 'asterlabs.in',
    orgName: 'Aster Health Labs',
    orgId: 'org_3',
    status: 'Failed',
    startedTime: '5 days ago',
    duration: '45.0s',
    errorReason: 'HTTP 504 Gateway Timeout during SSL certificate validation scan.'
  },
  {
    id: 'scan_104',
    website: 'eduspark.in',
    orgName: 'EduSpark Learning Systems',
    orgId: 'org_5',
    status: 'Failed',
    startedTime: '2 hours ago',
    duration: '30.1s',
    errorReason: 'Connection refused by target web application firewall (WAF).'
  },
  {
    id: 'scan_105',
    website: 'payquick.in',
    orgName: 'PayQuick India Pvt Ltd',
    orgId: 'org_4',
    status: 'Scanning',
    startedTime: 'Just now',
    duration: 'In progress...'
  }
];

export const MOCK_AI_REVIEWS: AIReviewItem[] = [
  {
    id: 'air_1',
    findingId: 'find_1',
    title: 'Data Retention Schedule Ambiguity',
    orgName: 'TechNova Solutions Pvt Ltd',
    orgId: 'org_1',
    confidence: 42,
    status: 'Pending Review',
    aiRationaleSummary: 'Automated policy parser flagged phrase "retained for legitimate business needs" as non-compliant with DPDP Section 8(7). Confidence rated 42% due to ambiguous tax exception wording.',
    evidenceSnippet: '"We retain user profile data for as long as necessary to provide services and comply with statutory laws."',
    dpdpReference: 'DPDP Act 2023, Section 8(7)',
    targetPolicy: 'technova.in/privacy',
    detectedDate: '2026-08-14'
  },
  {
    id: 'air_2',
    findingId: 'find_5',
    title: 'Biometric Consent Gated Access Notice',
    orgName: 'Aster Health Labs',
    orgId: 'org_3',
    confidence: 54,
    status: 'Pending Review',
    aiRationaleSummary: 'Detected biometric login prompt. Verification engine flagged requirement for explicit itemized consent under Section 6(1). Confidence rated 54%.',
    evidenceSnippet: '"Accept biometrics to view medical lab results online."',
    dpdpReference: 'DPDP Act 2023, Section 6(1)',
    targetPolicy: 'asterlabs.in/patient-portal',
    detectedDate: '2026-08-15'
  },
  {
    id: 'air_3',
    findingId: 'find_6',
    title: 'Grievance Response SLA Omission',
    orgName: 'FinEdge Technologies India',
    orgId: 'org_2',
    confidence: 88,
    status: 'Reviewed',
    aiRationaleSummary: 'Verified Grievance Officer email presence but published SLA window missing in disclosure. Human admin approved automated finding.',
    evidenceSnippet: 'Grievance Contact: dpo@finedge.co.in',
    dpdpReference: 'DPDP Act 2023, Section 8(9)',
    targetPolicy: 'finedge.co.in/privacy',
    detectedDate: '2026-08-10'
  }
];

export const MOCK_COMPLIANCE_RULES: ComplianceRule[] = [
  {
    id: 'rule_1',
    ruleCode: 'DPDP-SEC5-01',
    title: 'Itemized Notice & Consent Mechanism',
    category: 'Notice & Consent',
    dpdpSection: 'DPDP Act 2023, Section 5(1)',
    severityWeight: 'HIGH',
    evidenceRequired: 'Website scanner DOM check for unbundled checkboxes.',
    status: 'Active',
    lastUpdated: '2026-08-01'
  },
  {
    id: 'rule_2',
    ruleCode: 'DPDP-SEC8-07',
    title: 'Specified Data Retention Schedule',
    category: 'Data Retention',
    dpdpSection: 'DPDP Act 2023, Section 8(7)',
    severityWeight: 'HIGH',
    evidenceRequired: 'Privacy policy explicit numerical retention schedule text.',
    status: 'Active',
    lastUpdated: '2026-08-01'
  },
  {
    id: 'rule_3',
    ruleCode: 'DPDP-SEC8-09',
    title: 'Published Grievance Officer Contact Details',
    category: 'Data Principal Rights',
    dpdpSection: 'DPDP Act 2023, Section 8(9)',
    severityWeight: 'MEDIUM',
    evidenceRequired: 'Published DPO Name, Email, and physical address in India.',
    status: 'Active',
    lastUpdated: '2026-08-01'
  },
  {
    id: 'rule_4',
    ruleCode: 'CERT-IN-SLA',
    title: '6-Hour Mandatory Cyber Breach Notification',
    category: 'Security Practice',
    dpdpSection: 'CERT-In Directions 2022 & Sec 8(6)',
    severityWeight: 'HIGH',
    evidenceRequired: 'Incident Response Playbook / Vendor DPA SLA clause.',
    status: 'Active',
    lastUpdated: '2026-08-01'
  },
  {
    id: 'rule_5',
    ruleCode: 'DPDP-SEC5-03',
    title: '8th Schedule Language Notice Accessibility',
    category: 'Notice & Consent',
    dpdpSection: 'DPDP Act 2023, Section 5(3)',
    severityWeight: 'LOW',
    evidenceRequired: 'Language selector element providing regional Indian language notices.',
    status: 'Active',
    lastUpdated: '2026-08-01'
  }
];

export const MOCK_SYSTEM_HEALTH: SystemServiceHealth[] = [
  { name: 'Frontend Edge CDN', status: 'Operational', latencyMs: 14, uptimePercentage: 99.99, lastChecked: 'Just now' },
  { name: 'API Gateway Cluster', status: 'Operational', latencyMs: 38, uptimePercentage: 99.95, lastChecked: 'Just now' },
  { name: 'Database Primary Node', status: 'Operational', latencyMs: 18, uptimePercentage: 99.98, lastChecked: 'Just now' },
  { name: 'Website Scanner Engine', status: 'Operational', latencyMs: 240, uptimePercentage: 99.85, lastChecked: '1 min ago' },
  { name: 'AI Compliance Model Service', status: 'Operational', latencyMs: 310, uptimePercentage: 99.90, lastChecked: 'Just now' }
];

export const MOCK_ADMIN_AUDIT_LOGS: AdminAuditLog[] = [
  {
    id: 'log_1',
    timestamp: 'Today, 11:20 AM',
    actorName: 'Antigravity Platform Lead',
    actorEmail: 'admin@trustforge.in',
    action: 'Approved AI Review Finding',
    targetResource: 'Finding #find_1 (Retention Policy)',
    orgName: 'TechNova Solutions Pvt Ltd',
    result: 'Success'
  },
  {
    id: 'log_2',
    timestamp: 'Today, 10:45 AM',
    actorName: 'Antigravity Platform Lead',
    actorEmail: 'admin@trustforge.in',
    action: 'Triggered Website Rescan',
    targetResource: 'technova.in',
    orgName: 'TechNova Solutions Pvt Ltd',
    result: 'Success'
  },
  {
    id: 'log_3',
    timestamp: 'Yesterday, 03:15 PM',
    actorName: 'Sanjay Dutt',
    actorEmail: 'sanjay@payquick.in',
    action: 'Updated User Permission Role',
    targetResource: 'User #usr_4 to AI Reviewer',
    orgName: 'PayQuick India Pvt Ltd',
    result: 'Success'
  },
  {
    id: 'log_4',
    timestamp: '2 days ago',
    actorName: 'System Engine',
    actorEmail: 'system@trustforge.in',
    action: 'Scan Connection Failed',
    targetResource: 'asterlabs.in',
    orgName: 'Aster Health Labs',
    result: 'Warning'
  }
];
