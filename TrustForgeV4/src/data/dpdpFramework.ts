import type { Finding, UploadedEvidence, TrustScoreBreakdown, WebsiteScanResult } from '../types';

export interface AssessmentStepDetail {
  id: number;
  title: string;
  shortTitle: string;
  description: string;
  whyWeAsk: string;
  dpdpContext: string;
  dpdpSectionRef: string;
}

export const ASSESSMENT_STEPS: AssessmentStepDetail[] = [
  {
    id: 1,
    title: "Organization Context",
    shortTitle: "Org Context",
    description: "Verify corporate entity identity, registration details, and designated Grievance Officer under India DPDP Act.",
    whyWeAsk: "Verifies the legal identity of your Indian entity to ensure governance transparency and legal accountability.",
    dpdpContext: "DPDP Section 8(9) mandates designated Grievance Officers for Data Fiduciaries operating in India.",
    dpdpSectionRef: "DPDP Act 2023 - Section 8(9)"
  },
  {
    id: 2,
    title: "Data Collection & Processing",
    shortTitle: "Data Processing",
    description: "Identify all active data collection channels (web applications, mobile apps, payment gateways, offline counters).",
    whyWeAsk: "Maps data collection channels to ensure every personal data touchpoint has a lawful basis.",
    dpdpContext: "DPDP Section 4 requires purpose specification and explicit lawful basis at every collection point.",
    dpdpSectionRef: "DPDP Act 2023 - Section 4"
  },
  {
    id: 3,
    title: "Personal Data Categories",
    shortTitle: "Data Categories",
    description: "Select all categories of personal data processed across your Indian business operations.",
    whyWeAsk: "Determines the sensitivity tier of data processed to apply appropriate technical and organizational safeguards.",
    dpdpContext: "Processing sensitive categories like financial, health, or biometric identifiers triggers enhanced compliance rules.",
    dpdpSectionRef: "DPDP Act 2023 - Section 8(5)"
  },
  {
    id: 4,
    title: "Purpose of Processing",
    shortTitle: "Purpose",
    description: "Define specified, explicit, and legitimate purposes for processing personal data.",
    whyWeAsk: "Prevents scope creep and unauthorized secondary usage of personal data beyond specified user intent.",
    dpdpContext: "DPDP Section 4(1) restricts processing strictly to the purpose for which consent was explicitly provided.",
    dpdpSectionRef: "DPDP Act 2023 - Section 4(1)"
  },
  {
    id: 5,
    title: "Notice & Consent Mechanisms",
    shortTitle: "Notice & Consent",
    description: "Evaluate itemized notice clarity and language options in English and 8th Schedule Indian languages.",
    whyWeAsk: "Ensures Data Principals across India can comprehend privacy notices in their preferred language.",
    dpdpContext: "DPDP Section 5(3) guarantees right to access notice in English or any of the 22 languages specified in the 8th Schedule.",
    dpdpSectionRef: "DPDP Act 2023 - Section 5(3)"
  },
  {
    id: 6,
    title: "Data Retention & Erasure",
    shortTitle: "Retention",
    description: "Specify retention schedules, purpose completion triggers, and automated erasure protocols.",
    whyWeAsk: "Prevents indefinite retention of inactive user data in primary cloud databases and backups.",
    dpdpContext: "DPDP Section 8(7) mandates erasure when purpose is fulfilled, subject to statutory retention laws.",
    dpdpSectionRef: "DPDP Act 2023 - Section 8(7)"
  },
  {
    id: 7,
    title: "Data Principal Rights",
    shortTitle: "Principal Rights",
    description: "Assess user self-service portals for requesting data summaries, corrections, and erasures.",
    whyWeAsk: "Evaluates your operational capability to honor user data access, correction, or erasure requests within SLA.",
    dpdpContext: "DPDP Sections 11–14 guarantee Data Principal rights to summary, correction, grievance redressal, and nomination.",
    dpdpSectionRef: "DPDP Act 2023 - Sections 11–14"
  },
  {
    id: 8,
    title: "Security Practices",
    shortTitle: "Security",
    description: "Review technical encryption standards, access controls, and CERT-In 6-hour incident response capability.",
    whyWeAsk: "Validates technical encryption controls and readiness for mandatory CERT-In breach reporting timelines.",
    dpdpContext: "DPDP Section 8(5) mandates reasonable security safeguards to prevent personal data breaches.",
    dpdpSectionRef: "DPDP Act 2023 - Section 8(5)"
  },
  {
    id: 9,
    title: "Third-Party Processors",
    shortTitle: "Processors",
    description: "Inventory third-party processors, cloud hosting regions, and Data Processing Agreements (DPAs).",
    whyWeAsk: "Ensures vendor contracts enforce processing boundaries and Indian data residency obligations.",
    dpdpContext: "DPDP Section 8(2) requires formal contracts with all third-party Data Processors with joint liability.",
    dpdpSectionRef: "DPDP Act 2023 - Section 8(2)"
  },
  {
    id: 10,
    title: "Policies & Evidence",
    shortTitle: "Evidence Upload",
    description: "Upload verified compliance policies, SOC 2 reports, ISO certificates, and consent screenshots.",
    whyWeAsk: "Attaches cryptographic evidence to your compliance claims for audit verification.",
    dpdpContext: "Documentary evidence is required for regulatory audits under Data Protection Board oversight.",
    dpdpSectionRef: "DPDP Act 2023 - Section 28"
  },
  {
    id: 11,
    title: "Review & Verification",
    shortTitle: "Review",
    description: "Review all submitted assessment responses and verified evidence prior to executing the Analysis Engine.",
    whyWeAsk: "Allows compliance officers to audit submitted data for accuracy before running the evaluation algorithm.",
    dpdpContext: "Self-assessment integrity is paramount before submitting filings to the Data Protection Board.",
    dpdpSectionRef: "TrustForge TEF Framework"
  },
  {
    id: 12,
    title: "Assessment Result",
    shortTitle: "Results",
    description: "View calculated Trust Score, compliance posture tier, and prioritized gap remediation roadmap.",
    whyWeAsk: "Provides actionable intelligence to eliminate high-risk compliance gaps and achieve baseline readiness.",
    dpdpContext: "Continuous baseline evaluation ensures zero non-compliance penalty exposures (up to ₹250 Cr under DPDP).",
    dpdpSectionRef: "DPDP Act 2023 - Schedule 1"
  }
];

export const PERSONAL_DATA_CATEGORIES = [
  {
    id: 'cat_identifiers',
    name: 'User Identifiers',
    items: ['Full Name', 'Phone Number', 'Email Address', 'Physical Address'],
    description: 'Basic personal contact and identity attributes.',
    sensitivity: 'standard'
  },
  {
    id: 'cat_financial',
    name: 'Financial & Transaction Data',
    items: ['Bank Account Number', 'UPI ID', 'Payment Card Metadata', 'Transaction History'],
    description: 'Payment routing and transaction telemetry.',
    sensitivity: 'high'
  },
  {
    id: 'cat_device',
    name: 'Device IP & Browser Headers',
    items: ['IP Address', 'User Agent String', 'Device Identifiers', 'Geolocation Coordinates'],
    description: 'Network metadata and system telemetry.',
    sensitivity: 'medium'
  },
  {
    id: 'cat_location',
    name: 'Geographic Location Metrics',
    items: ['GPS Coordinates', 'City/State Region', 'IP-based Location'],
    description: 'Physical location tracking and geofencing data.',
    sensitivity: 'medium'
  },
  {
    id: 'cat_biometric',
    name: 'Biometric / Sensitive Data',
    items: ['Facial Biometrics', 'Fingerprint Templates', 'Government IDs (Aadhaar/PAN)'],
    description: 'Highly sensitive statutory identity records.',
    sensitivity: 'critical'
  },
  {
    id: 'cat_hr',
    name: 'Employee / HR Data',
    items: ['PF Account Details', 'Payroll Records', 'Performance Reviews', 'Emergency Contacts'],
    description: 'Internal workforce personal data records.',
    sensitivity: 'medium'
  }
];

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', native: 'English', isPrimary: true },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', isPrimary: true },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', isPrimary: false },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்', isPrimary: false },
  { code: 'te', name: 'Telugu', native: 'తెలుగు', isPrimary: false },
  { code: 'bn', name: 'Bengali', native: 'বাংলা', isPrimary: false },
  { code: 'mr', name: 'Marathi', native: 'मराठी', isPrimary: false }
];

export const DETECTED_INTEGRATIONS_PRESETS = [
  { id: 'ga4', name: 'Google Analytics 4', category: 'Analytics', riskTier: 'Medium', details: 'Client-side cookie tracking & IP recording' },
  { id: 'cloudfront', name: 'AWS CloudFront CDN', category: 'Infrastructure', riskTier: 'Low', details: 'Edge TLS terminate & access logging' },
  { id: 'razorpay', name: 'Razorpay Payment Gateway', category: 'Payments', riskTier: 'High', details: 'RBI PCI-DSS tokenized transaction processing' },
  { id: 'intercom', name: 'Intercom Support Widget', category: 'Customer Support', riskTier: 'Medium', details: 'Third-party chat script with session storage' }
];

export const MOCK_ORGANIZATION = {
  id: 'org_technova',
  legalName: 'TechNova Solutions Pvt Ltd',
  cin: 'U72900MH2021PTC354912',
  gstin: '27AABCT3549R1ZM',
  industry: 'Enterprise Software & SaaS',
  companySize: '51-200 employees',
  primaryDomain: 'https://www.technova.in',
  publicDomain: 'https://app.technova.in',
  endpointConfig: 'TLS 1.3 / AWS ap-south-1 (Mumbai)',
  detectedIntegrations: ['ga4', 'cloudfront', 'razorpay', 'intercom'],
  gstinVerified: true,
  domainVerified: true,
  grievanceOfficerName: 'Rohan Sharma',
  grievanceOfficerEmail: 'grievance@technova.in'
};

export const MOCK_TRUST_SCORE: TrustScoreBreakdown = {
  overallScore: 89,
  statusLabel: 'Strong Alignment',
  pillars: [
    {
      id: 'p1',
      name: 'Notice & Consent',
      score: 92,
      weight: 20,
      description: 'Itemized consent notice in English and Hindi with explicit opt-in.',
      color: '#10B981'
    },
    {
      id: 'p2',
      name: 'Data Principal Rights',
      score: 85,
      weight: 20,
      description: 'Dedicated Grievance Officer portal with 72-hour response SLA.',
      color: '#10B981'
    },
    {
      id: 'p3',
      name: 'Technical Security',
      score: 95,
      weight: 20,
      description: 'AES-256 at rest, TLS 1.3 in transit, automated daily backups.',
      color: '#10B981'
    },
    {
      id: 'p4',
      name: 'Processor Governance',
      score: 80,
      weight: 15,
      description: 'Indian data residency verified; vendor contracts pending annual review.',
      color: '#F59E0B'
    },
    {
      id: 'p5',
      name: 'Data Retention SLA',
      score: 88,
      weight: 15,
      description: 'Automated account deletion protocol linked with primary database.',
      color: '#10B981'
    },
    {
      id: 'p6',
      name: 'Evidence Verification',
      score: 94,
      weight: 10,
      description: 'Verified Privacy Policy, MCA certificate, and SOC 2 Type II report.',
      color: '#10B981'
    }
  ]
};

export const MOCK_FINDINGS: Finding[] = [
  {
    id: 'f1',
    title: 'Mobile Web Cookie Opt-Out Interface Missing Itemized Toggle',
    category: 'Consent',
    severity: 'medium',
    scoreImpact: -5,
    whatIsWrong: 'The cookie consent banner on mobile screens auto-accepts analytics cookies before the user selects preference.',
    whyItMatters: 'DPDP Section 6 requires explicit affirmative action (opt-in) before tracking scripts execute.',
    whatShouldWeDo: 'Update the cookie banner script to block non-essential trackers until explicit button click.',
    howToImprove: 'Implement client-side script blocking for Google Analytics script execution until opt-in state is true.',
    dpdpSection: 'Section 6(1)',
    status: 'open'
  },
  {
    id: 'f2',
    title: 'Data Retention Schedule Missing Explicit Inactive Account Erasure Trigger',
    category: 'Retention',
    severity: 'high',
    scoreImpact: -8,
    whatIsWrong: 'Customer account logs remain in secondary database backups beyond 3 years after account closure.',
    whyItMatters: 'DPDP Section 8(7) mandates erasure of personal data as soon as the specified purpose is no longer served.',
    whatShouldWeDo: 'Configure an automated cron workflow to purge user records 180 days post-account deletion.',
    howToImprove: 'Set up an AWS Lambda lifecycle policy to prune soft-deleted user records from database backups.',
    dpdpSection: 'Section 8(7)',
    status: 'open'
  },
  {
    id: 'f3',
    title: 'Intercom Chat Widget Vendor Contract Missing DPDP Liabilities Clause',
    category: 'Processors',
    severity: 'low',
    scoreImpact: -3,
    whatIsWrong: 'The Data Processing Agreement with Intercom references GDPR terms but omits DPDP Act 2023 indemnity clauses.',
    whyItMatters: 'Data Fiduciaries remain directly liable under DPDP Section 8(2) for data leaks originating at processor endpoints.',
    whatShouldWeDo: 'Execute standard Indian DPDP addendum with Intercom legal team.',
    howToImprove: 'Download TrustForge DPA template for SaaS vendors and execute updated agreement.',
    dpdpSection: 'Section 8(2)',
    status: 'open'
  }
];

export const MOCK_EVIDENCE_FILES: UploadedEvidence[] = [
  {
    id: 'ev1',
    fileName: 'TechNova_Privacy_Policy_v4.2.pdf',
    fileSize: 2450000,
    fileType: 'application/pdf',
    uploadDate: '2026-08-10',
    status: 'verified',
    category: 'Privacy Policy',
    summary: 'Updated privacy notice with Grievance Officer details and multi-language support.'
  },
  {
    id: 'ev2',
    fileName: 'MCA_Certificate_of_Incorporation.pdf',
    fileSize: 1800000,
    fileType: 'application/pdf',
    uploadDate: '2026-08-11',
    status: 'verified',
    category: 'Corporate Identity',
    summary: 'Official incorporation document verifying CIN U72900MH2021PTC354912.'
  },
  {
    id: 'ev3',
    fileName: 'SOC2_TypeII_Audit_Report_2026.pdf',
    fileSize: 14200000,
    fileType: 'application/pdf',
    uploadDate: '2026-08-15',
    status: 'verified',
    category: 'Security Controls',
    summary: 'Third-party security audit report validating AES-256 encryption and incident response.'
  },
  {
    id: 'ev4',
    fileName: 'Razorpay_Vendor_DPA_Addendum.pdf',
    fileSize: 3100000,
    fileType: 'application/pdf',
    uploadDate: '2026-08-18',
    status: 'pending',
    category: 'Vendor Contracts',
    summary: 'Signed Data Processing Agreement addendum with payment processor.'
  }
];

export const MOCK_PUBLIC_SCAN: WebsiteScanResult = {
  url: 'https://www.technova.in',
  scanDate: '2026-08-25',
  trustScore: 89,
  status: 'Strong Alignment',
  sslStatus: {
    enabled: true,
    protocol: 'TLS 1.3',
    issuer: 'DigiCert Global TLS CA',
    expiresInDays: 240
  },
  privacyPolicy: {
    found: true,
    url: 'https://www.technova.in/privacy',
    lastUpdatedDaysAgo: 15,
    hasGrievanceDetails: true,
    hasLanguageSupport: true
  },
  cookieConsent: {
    found: true,
    hasOptOut: true,
    detectedTrackers: ['Google Analytics 4', 'Intercom', 'Meta Pixel']
  },
  observations: [
    'HTTPS & TLS 1.3 enforced across all web routes.',
    'Grievance Officer contact info detected in privacy statement.',
    'Cookie banner detects desktop opt-in, mobile interface requires minor tuning.'
  ],
  recommendations: [
    'Update mobile cookie consent opt-out toggle for full DPDP Section 6 compliance.',
    'Schedule automated annual vendor DPA audit.'
  ]
};
