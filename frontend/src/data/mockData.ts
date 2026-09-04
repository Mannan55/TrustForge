import { Organization, Finding, EvidenceItem, PillarScore, RemediationTask, DPDPReport } from '../types';

export const MOCK_ORGANIZATIONS: Organization[] = [
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
    lastScanned: '5 days ago',
    lastAssessed: '1 week ago'
  }
];

export const MOCK_FINDINGS: Finding[] = [
  {
    id: 'find_1',
    title: 'Data Retention & Erasure Schedule Unclear',
    severity: 'HIGH',
    affectedArea: 'Privacy Policy & Data Lifecycle',
    whyItMatters: 'DPDP Section 8(7) mandates that personal data must be erased as soon as the specified purpose is fulfilled. Retaining customer log records indefinitely without explicit statutory retention timelines exposes the organization to regulatory non-compliance.',
    evidenceSnippet: 'Privacy Policy at technova.in/privacy states: "We retain user data for as long as necessary to provide our services and for legitimate business purposes."',
    evidenceUrl: 'https://technova.in/privacy#retention',
    dpdpReference: 'DPDP Act 2023, Section 8(7)',
    recommendedAction: 'Define specific numerical retention schedules per data category (e.g. 30 days post account closure, 8 years for tax invoices) and publish an updated Notice.',
    status: 'REQUIRES_REVIEW',
    detectedDate: '2026-08-14',
    pillar: 'Data Lifecycle'
  },
  {
    id: 'find_2',
    title: 'Grievance Redressal Officer Contact Notice Incomplete',
    severity: 'MEDIUM',
    affectedArea: 'Data Principal Rights',
    whyItMatters: 'DPDP Section 8(9) requires Data Fiduciaries to publish the business contact details (Name, Title, Email, Physical Address) of the Grievance Officer on the website.',
    evidenceSnippet: 'Footer contains generic "support@technova.in" without designated Grievance Officer name or postal address.',
    evidenceUrl: 'https://technova.in/contact',
    dpdpReference: 'DPDP Act 2023, Section 8(9) & Section 13',
    recommendedAction: 'Publish designated Grievance Officer details on privacy page including response SLA (30 days).',
    status: 'OPEN',
    detectedDate: '2026-08-15',
    pillar: 'User Rights'
  },
  {
    id: 'find_3',
    title: 'Third-Party Analytics Cookie Consent Notice Lacks Multilingual Option',
    severity: 'LOW',
    affectedArea: 'Notice & Consent Mechanisms',
    whyItMatters: 'DPDP Section 5(3) specifies that Data Principals have the right to access consent notices in English or any 8th Schedule Indian language.',
    evidenceSnippet: 'Cookie Banner renders solely in English without language switcher option.',
    evidenceUrl: 'https://technova.in',
    dpdpReference: 'DPDP Act 2023, Section 5(3)',
    recommendedAction: 'Add language toggle support (Hindi, Tamil, Marathi, Bengali) to cookie consent banner.',
    status: 'OPEN',
    detectedDate: '2026-08-16',
    pillar: 'Transparency'
  },
  {
    id: 'find_4',
    title: 'CERT-In Incident Response Protocol SLA Unspecified in DPA',
    severity: 'HIGH',
    affectedArea: 'Security Practices & Processor Governance',
    whyItMatters: 'CERT-In Cyber Directions 2022 and DPDP Section 8(6) mandate reporting security breaches to regulatory bodies within 6 hours. Cloud vendor DPAs must reflect this obligation.',
    evidenceSnippet: 'Vendor DPA specifies "72 hours notice" which exceeds mandatory CERT-In 6-hour timeline.',
    evidenceUrl: 'Internal Document: Vendor-DPA-2025.pdf',
    dpdpReference: 'DPDP Act 2023 Sec 8(6) & CERT-In Guidelines',
    recommendedAction: 'Update Cloud Vendor DPA SLA clause to require incident notification within 6 hours of breach detection.',
    status: 'IN_PROGRESS',
    detectedDate: '2026-08-10',
    pillar: 'Security'
  }
];

export const MOCK_EVIDENCE: EvidenceItem[] = [
  {
    id: 'ev_1',
    title: 'Privacy Policy Published Notice',
    status: 'VERIFIED',
    confidence: 'HIGH',
    sourceUrl: 'https://technova.in/privacy',
    sourceType: 'Website Scanner',
    lastChecked: 'Today at 09:15 AM',
    notes: 'Privacy policy detected at standard URL. Section 5 itemized notice structure present.',
    findingRefId: 'find_1',
    aiAssisted: true,
    aiExplanation: 'Evidence-based extraction: Parsed Privacy Policy URL and verified SSL certificate and page availability.'
  },
  {
    id: 'ev_2',
    title: 'Consent Banner Opt-in Mechanism',
    status: 'VERIFIED',
    confidence: 'HIGH',
    sourceUrl: 'https://technova.in',
    sourceType: 'Website Scanner',
    lastChecked: 'Today at 09:15 AM',
    notes: 'Explicit opt-in banner detected. Pre-checked consent boxes were not present.',
    aiAssisted: true,
    aiExplanation: 'AI-assisted analysis confirmed clear affirmative action requirement.'
  },
  {
    id: 'ev_3',
    title: 'Data Principal Rights Self-Serve Portal',
    status: 'DETECTED',
    confidence: 'MEDIUM',
    sourceUrl: 'https://technova.in/account/privacy',
    sourceType: 'System Assessment',
    lastChecked: 'Yesterday',
    notes: 'Account dashboard contains "Export My Data" action button.',
    aiAssisted: true,
    aiExplanation: 'Detected user profile privacy tab during assessment verification.'
  },
  {
    id: 'ev_4',
    title: 'CERT-In Incident Response Playbook',
    status: 'INFERRED',
    confidence: 'MEDIUM',
    sourceType: 'Document Upload',
    lastChecked: '2 days ago',
    notes: 'Document uploaded: IR-Playbook-v2.pdf. Contains breach triage workflow.',
    findingRefId: 'find_4',
    aiAssisted: true,
    aiExplanation: 'AI document review verified presence of incident response matrix.'
  },
  {
    id: 'ev_5',
    title: 'Multilingual Notice Support (8th Schedule Languages)',
    status: 'NOT_FOUND',
    confidence: 'HIGH',
    sourceUrl: 'https://technova.in/privacy',
    sourceType: 'Website Scanner',
    lastChecked: 'Today at 09:15 AM',
    notes: 'Scanner checked for language selector DOM nodes. Only English locale detected.',
    findingRefId: 'find_3',
    aiAssisted: true,
    aiExplanation: 'Automated DOM analysis found no alternative language toggles.'
  }
];

export const MOCK_PILLAR_SCORES: PillarScore[] = [
  { name: 'Privacy', score: 92, status: 'Strong', explanation: 'Itemized consent notice and purpose specification implemented clearly.', findingCount: 0, evidenceCoverage: 95 },
  { name: 'Security', score: 88, status: 'Strong', explanation: 'TLS 1.3 enforced, AES-256 encryption active, CERT-In response plan present.', findingCount: 1, evidenceCoverage: 90 },
  { name: 'Transparency', score: 84, status: 'Strong', explanation: 'Clear privacy notice published; multilingual support pending.', findingCount: 1, evidenceCoverage: 85 },
  { name: 'Governance', score: 90, status: 'Strong', explanation: 'DPO assigned, annual compliance audit scheduled.', findingCount: 0, evidenceCoverage: 92 },
  { name: 'Data Lifecycle', score: 78, status: 'Moderate', explanation: 'Retention timelines require explicit schedule documentation under Sec 8(7).', findingCount: 1, evidenceCoverage: 75 },
  { name: 'User Rights', score: 85, status: 'Strong', explanation: 'Data export portal active; Grievance officer contact details need update.', findingCount: 1, evidenceCoverage: 88 }
];

export const MOCK_REMEDIATION_TASKS: RemediationTask[] = [
  {
    id: 'rem_1',
    findingId: 'find_1',
    title: 'Update Privacy Policy with Explicit Data Retention Schedule',
    problem: 'Privacy Policy uses vague retention language ("retained as long as necessary").',
    why: 'DPDP Section 8(7) requires erasure once purpose is fulfilled, subject to Indian statutory retention laws.',
    recommendedFix: 'Amend section 4 of Privacy Policy to specify: "User profile data deleted 30 days after account termination. Financial invoices retained for 8 years per Income Tax Act."',
    evidenceNeeded: 'Updated Privacy Policy link or document draft showing explicit retention schedules.',
    priority: 'HIGH',
    effort: 'Low',
    status: 'In Review',
    assignedTo: 'Legal Team',
    dueDate: '2026-08-25'
  },
  {
    id: 'rem_2',
    findingId: 'find_2',
    title: 'Publish Grievance Officer Contact Information on Website',
    problem: 'Grievance officer contact details not explicitly designated on website footer.',
    why: 'DPDP Section 8(9) mandates published DPO/Grievance contact to enable Data Principal grievance escalation.',
    recommendedFix: 'Add dedicated Grievance Officer section to /privacy page listing Name, Email, Phone, and Address.',
    evidenceNeeded: 'Screenshot or URL of published Grievance Officer contact section.',
    priority: 'MEDIUM',
    effort: 'Low',
    status: 'Open',
    assignedTo: 'Web Operations',
    dueDate: '2026-08-28'
  },
  {
    id: 'rem_3',
    findingId: 'find_4',
    title: 'Amend Cloud Vendor DPA to Require 6-Hour CERT-In Breach Notification',
    problem: 'Existing vendor DPA allows 72-hour breach reporting window.',
    why: 'CERT-In guidelines mandate 6-hour incident reporting window for Indian entities.',
    recommendedFix: 'Execute updated DPA Addendum with primary cloud processor reducing breach reporting window to 6 hours.',
    evidenceNeeded: 'Signed DPA Addendum document copy.',
    priority: 'HIGH',
    effort: 'Moderate',
    status: 'In Progress',
    assignedTo: 'CTO & Legal',
    dueDate: '2026-09-05'
  }
];

export const MOCK_REPORT: DPDPReport = {
  id: 'rep_2026_08',
  title: 'DPDP Compliance Baseline & Digital Trust Assessment Report',
  generatedDate: '16 August 2026',
  trustScore: 89,
  postureStatus: 'Strong Posture',
  orgName: 'TechNova Solutions Pvt Ltd',
  executiveSummary: 'TechNova Solutions demonstrates a robust digital trust baseline under the Indian Digital Personal Data Protection (DPDP) Act 2023. Key strengths include explicit consent notice mechanisms, robust encryption safeguards, and active Data Principal request capabilities. Primary remediation focus areas include establishing explicit data retention schedules under Section 8(7) and aligning vendor DPA breach notification SLAs with CERT-In 6-hour directives.',
  pillarScores: MOCK_PILLAR_SCORES,
  highPriorityCount: 1,
  mediumPriorityCount: 2,
  lowPriorityCount: 1,
  remediationProgress: 66
};
