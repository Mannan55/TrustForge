import type {
  Pillar,
  Finding,
  EvidenceItem,
  RemediationTask,
  ScanCheck,
  PublicScanResult,
  UploadedDocument,
} from "@/types";

// --- Six trust pillars ------------------------------------------------------

export const PILLARS: Pillar[] = [
  {
    id: "privacy",
    name: "Privacy",
    score: 92,
    weight: 20,
    description: "Notice quality, consent capture, and lawful basis for processing.",
    evidenceCoverage: 96,
    trend: 4,
    metrics: [
      { label: "Consent notice validity", value: "98%" },
      { label: "Notice language coverage", value: "4 languages" },
      { label: "Lawful basis mapped", value: "Yes" },
    ],
  },
  {
    id: "security",
    name: "Security",
    score: 88,
    weight: 20,
    description: "Encryption, access control, and breach readiness.",
    evidenceCoverage: 90,
    trend: 2,
    metrics: [
      { label: "Encryption at rest", value: "AES-256" },
      { label: "Encryption in transit", value: "TLS 1.3" },
      { label: "Breach playbook", value: "Documented" },
    ],
  },
  {
    id: "transparency",
    name: "Transparency",
    score: 84,
    weight: 15,
    description: "How clearly you disclose what you collect and why.",
    evidenceCoverage: 82,
    trend: 5,
    metrics: [
      { label: "Policy freshness", value: "Under 60 days" },
      { label: "Cookie disclosure", value: "Partial" },
      { label: "Contact visibility", value: "Published" },
    ],
  },
  {
    id: "governance",
    name: "Governance",
    score: 90,
    weight: 15,
    description: "Accountability structure, roles, and documented policies.",
    evidenceCoverage: 94,
    trend: 0,
    metrics: [
      { label: "Grievance officer", value: "Designated" },
      { label: "Internal policies", value: "6 documented" },
      { label: "Staff training", value: "Annual" },
    ],
  },
  {
    id: "lifecycle",
    name: "Data Lifecycle",
    score: 78,
    weight: 15,
    description: "Retention limits, erasure, and minimisation across systems.",
    evidenceCoverage: 74,
    trend: -1,
    metrics: [
      { label: "Retention policy", value: "Defined" },
      { label: "Inactive erasure trigger", value: "Missing" },
      { label: "Backup retention", value: "18 days" },
    ],
  },
  {
    id: "rights",
    name: "User Rights",
    score: 94,
    weight: 15,
    description: "Ability to honour access, correction, and erasure requests.",
    evidenceCoverage: 92,
    trend: 6,
    metrics: [
      { label: "Rights portal", value: "Live" },
      { label: "Avg resolution time", value: "1.2 days" },
      { label: "Nomination support", value: "Yes" },
    ],
  },
];

// --- Findings ---------------------------------------------------------------

export const FINDINGS: Finding[] = [
  {
    id: "TF-041",
    title: "Mobile cookie banner lacks an equal opt-out control",
    severity: "HIGH",
    status: "REQUIRES_REVIEW",
    affectedArea: "Consent · technova.in (mobile)",
    pillar: "Privacy",
    whyItMatters:
      "On the mobile site, accepting cookies is a single tap while rejecting them requires opening a secondary menu. When withdrawing consent is harder than giving it, the consent you collect is weaker and easier to challenge.",
    evidenceSnippet:
      'Mobile banner markup: <button class="accept-all">Accept</button> with reject reachable only via "Manage" overlay.',
    evidenceUrl: "https://technova.in/",
    dpdpReference: "Section 6",
    recommendedAction:
      "Add a visible Reject option to the mobile banner with the same prominence as Accept, so consent can be declined in one tap.",
    scoreImpact: 5,
    detectedDate: "2 September 2026",
  },
  {
    id: "TF-039",
    title: "Vendor data processing agreement renewal is overdue",
    severity: "HIGH",
    status: "IN_PROGRESS",
    affectedArea: "Processors · CloudData Systems Ltd",
    pillar: "Governance",
    whyItMatters:
      "The processing agreement covering a cloud vendor that stores customer records expired and has not been renewed. Without a current contract, your obligations do not clearly carry forward to the vendor.",
    evidenceSnippet:
      "Contract #DPA-2024-99 with CloudData Systems Ltd shows an expiry date of 31 July 2026; no renewal on file.",
    dpdpReference: "Section 8(2)",
    recommendedAction:
      "Execute a renewed processing agreement that includes current DPDP obligations and breach-notification timelines before further processing.",
    scoreImpact: 6,
    detectedDate: "28 August 2026",
  },
  {
    id: "TF-028",
    title: "Analytics script loads before consent is captured",
    severity: "MEDIUM",
    status: "OPEN",
    affectedArea: "Collection · Google Analytics 4",
    pillar: "Transparency",
    whyItMatters:
      "Analytics begins tracking visitors on page load, before they have made any consent choice. Data collected ahead of consent has no lawful basis behind it.",
    evidenceSnippet:
      "Network trace shows gtag/js request firing at document load, prior to any interaction with the consent banner.",
    evidenceUrl: "https://technova.in/",
    dpdpReference: "Section 4",
    recommendedAction:
      "Gate the analytics tag behind the consent signal so it only initialises after the visitor has accepted analytics cookies.",
    scoreImpact: 4,
    detectedDate: "26 August 2026",
  },
  {
    id: "TF-022",
    title: "Erasure requests resolved outside the stated window",
    severity: "MEDIUM",
    status: "OPEN",
    affectedArea: "Lifecycle · Rights portal",
    pillar: "Data Lifecycle",
    whyItMatters:
      "Your published policy commits to resolving erasure requests within 7 days, but recent requests took an average of 18 days. A gap between the stated and actual timeline undermines the commitment.",
    evidenceSnippet:
      "Rights-portal log: average erasure completion 18.4 days across the last 12 requests; policy states 7 days.",
    dpdpReference: "Section 12",
    recommendedAction:
      "Either bring the resolution process within 7 days or update the published commitment to a timeline you can consistently meet.",
    scoreImpact: 3,
    detectedDate: "21 August 2026",
  },
  {
    id: "TF-019",
    title: "Privacy notice not available in a regional language",
    severity: "LOW",
    status: "OPEN",
    affectedArea: "Notice · technova.in/privacy",
    pillar: "Privacy",
    whyItMatters:
      "The privacy notice is published in English only. A meaningful share of your users read primarily in Hindi or a regional language and may not fully understand the notice.",
    evidenceSnippet:
      "Only /privacy (en) returns 200. Locale variants /privacy?lang=hi and others return 404.",
    evidenceUrl: "https://technova.in/privacy",
    dpdpReference: "Section 5(3)",
    recommendedAction:
      "Publish the privacy notice in at least one additional Eighth Schedule language matching your primary user base.",
    scoreImpact: 2,
    detectedDate: "18 August 2026",
  },
  {
    id: "TF-008",
    title: "Access log retention shortened below policy",
    severity: "LOW",
    status: "REMEDIATED",
    affectedArea: "Security · Log pipeline",
    pillar: "Security",
    whyItMatters:
      "Security access logs were being rotated after 90 days, short of the 180-day retention the incident-response policy assumes for investigations.",
    evidenceSnippet:
      "Log retention config set to 90d; InfoSec policy section 4.2 assumes 180d for forensic readiness.",
    dpdpReference: "Section 8(5)",
    recommendedAction:
      "Restore log retention to 180 days in the pipeline configuration to match the incident-response policy.",
    scoreImpact: 0,
    detectedDate: "9 August 2026",
  },
];

// --- Evidence ---------------------------------------------------------------

export const EVIDENCE: EvidenceItem[] = [
  {
    id: "ev-privacy-policy",
    title: "Privacy Policy document",
    status: "VERIFIED",
    confidence: "HIGH",
    sourceType: "Document Upload",
    sourceUrl: "https://technova.in/privacy",
    lastChecked: "4 September 2026",
    notes:
      "Uploaded policy v4.2 matches the live published page and covers purpose, retention, and rights.",
    method:
      "Uploaded PDF text compared against the live /privacy page; key clauses matched on both sources.",
  },
  {
    id: "ev-consent-banner",
    title: "Consent banner presence",
    status: "VERIFIED",
    confidence: "HIGH",
    sourceType: "Website Scanner",
    sourceUrl: "https://technova.in/",
    lastChecked: "4 September 2026",
    notes: "Consent banner detected on first load of the desktop site with granular categories.",
    method: "Scanner observed a consent management script and banner element on initial page load.",
  },
  {
    id: "ev-rights-portal",
    title: "Data principal rights portal",
    status: "DETECTED",
    confidence: "MEDIUM",
    sourceType: "Website Scanner",
    sourceUrl: "https://technova.in/privacy/requests",
    lastChecked: "4 September 2026",
    findingRefId: "TF-022",
    notes: "A rights-request form was found, but resolution timelines could not be verified by scan.",
    method: "Scanner located a request form; SLA performance is self-declared and not observable externally.",
  },
  {
    id: "ev-certin-playbook",
    title: "Breach response playbook",
    status: "INFERRED",
    confidence: "MEDIUM",
    sourceType: "Document Upload",
    lastChecked: "4 September 2026",
    notes:
      "An InfoSec governance SOP references breach handling, but a standalone tested playbook was not provided.",
    method: "Inferred from a section within the uploaded governance SOP; no dedicated playbook document on file.",
  },
  {
    id: "ev-vendor-dpa",
    title: "Vendor processing agreement (CloudData)",
    status: "NOT_FOUND",
    confidence: "HIGH",
    sourceType: "Document Upload",
    lastChecked: "4 September 2026",
    findingRefId: "TF-039",
    notes: "No current processing agreement for CloudData Systems Ltd was located in the evidence set.",
    method: "Searched uploaded documents for an in-date processing agreement for this vendor; none found.",
  },
  {
    id: "ev-multilingual-notice",
    title: "Multilingual privacy notice",
    status: "NOT_FOUND",
    confidence: "HIGH",
    sourceType: "Website Scanner",
    sourceUrl: "https://technova.in/privacy",
    lastChecked: "4 September 2026",
    findingRefId: "TF-019",
    notes: "Only the English notice resolved. Regional-language variants were not found.",
    method: "Scanner requested known locale variants of the privacy URL; only the English variant returned content.",
  },
];

// --- Remediation ------------------------------------------------------------

export const REMEDIATION_TASKS: RemediationTask[] = [
  {
    id: "rem-039",
    findingRefId: "TF-039",
    title: "Renew the CloudData processing agreement",
    problem: "The processing agreement with CloudData Systems Ltd expired on 31 July 2026.",
    why: "Without a current contract, your DPDP obligations do not clearly bind the vendor handling customer records.",
    recommendedFix:
      "Sign a renewed agreement covering current DPDP obligations, sub-processing limits, and breach-notification timelines.",
    evidenceNeeded: "Executed, in-date processing agreement uploaded to the Evidence vault.",
    priority: "HIGH",
    effort: "Moderate",
    status: "IN_PROGRESS",
    assignedTo: "Legal Team",
    dueDate: "20 September 2026",
  },
  {
    id: "rem-041",
    findingRefId: "TF-041",
    title: "Add an equal opt-out to the mobile cookie banner",
    problem: "Rejecting cookies on mobile takes more steps than accepting them.",
    why: "Consent is weaker when withdrawing it is harder than giving it.",
    recommendedFix:
      "Place a Reject control alongside Accept on the mobile banner with equal visual weight.",
    evidenceNeeded: "Updated mobile banner screenshot and markup showing both controls.",
    priority: "HIGH",
    effort: "Low",
    status: "NOT_STARTED",
    assignedTo: "Web Operations",
    dueDate: "15 September 2026",
  },
  {
    id: "rem-028",
    findingRefId: "TF-028",
    title: "Gate analytics behind consent",
    problem: "Google Analytics initialises before the visitor makes a consent choice.",
    why: "Data collected before consent has no lawful basis supporting it.",
    recommendedFix:
      "Load the analytics tag only after the visitor accepts analytics cookies via the consent signal.",
    evidenceNeeded: "Network trace showing the tag fires only post-consent.",
    priority: "MEDIUM",
    effort: "Moderate",
    status: "NOT_STARTED",
    assignedTo: "Web Operations",
    dueDate: "25 September 2026",
  },
  {
    id: "rem-019",
    findingRefId: "TF-019",
    title: "Publish the privacy notice in a regional language",
    problem: "The privacy notice is available in English only.",
    why: "Users who read primarily in a regional language may not understand the notice.",
    recommendedFix:
      "Translate and publish the notice in at least one additional Eighth Schedule language.",
    evidenceNeeded: "Live regional-language notice URL returning content.",
    priority: "LOW",
    effort: "Moderate",
    status: "NOT_STARTED",
    assignedTo: "Content & Legal",
    dueDate: "5 October 2026",
  },
];

// --- Website scan (authenticated, deeper) -----------------------------------

export const SCAN_CHECKS: ScanCheck[] = [
  { id: "https", label: "HTTPS enforcement", kind: "technical", state: "pass", detail: "All HTTP requests redirect to HTTPS." },
  { id: "ssl", label: "SSL / TLS certificate", kind: "technical", state: "pass", detail: "Valid certificate, TLS 1.3 active." },
  { id: "headers", label: "Security headers", kind: "technical", state: "pass", detail: "HSTS, X-Content-Type-Options, and CSP present." },
  {
    id: "ssl-expiry",
    label: "SSL expiry window",
    kind: "technical",
    state: "attention",
    detail: "Certificate renews in 21 days.",
    recommendation: "Confirm auto-renewal is enabled to avoid a lapse.",
    evidence: "notAfter: 2026-09-25 (21 days remaining).",
  },
  { id: "privacy", label: "Privacy policy document", kind: "privacy", state: "pass", detail: "Reachable and updated within 60 days." },
  {
    id: "cookie",
    label: "Cookie consent banner",
    kind: "privacy",
    state: "attention",
    detail: "Present, but mobile opt-out is not equal to opt-in.",
    recommendation: "Add an equal Reject control on mobile (see finding TF-041).",
    evidence: "Mobile banner exposes Accept directly; Reject is nested under Manage.",
  },
  { id: "terms", label: "Terms & conditions", kind: "privacy", state: "pass", detail: "Published and linked in the footer." },
  { id: "robots", label: "robots.txt", kind: "technical", state: "pass", detail: "Present and well-formed." },
  { id: "sitemap", label: "sitemap.xml", kind: "technical", state: "pass", detail: "Present with 142 URLs." },
  { id: "contact", label: "Contact & grievance page", kind: "privacy", state: "pass", detail: "Grievance officer contact published." },
  { id: "about", label: "About & legal entity", kind: "assessment", state: "pass", detail: "Registered entity name disclosed." },
  {
    id: "a11y",
    label: "Accessibility indicators",
    kind: "assessment",
    state: "attention",
    detail: "Several images are missing alt text.",
    recommendation: "Add descriptive alt text to key marketing images.",
    evidence: "12 of 34 images on the homepage lack an alt attribute.",
  },
  { id: "recaptcha", label: "Bot defence / reCAPTCHA", kind: "technical", state: "pass", detail: "reCAPTCHA present on forms." },
  { id: "cookie-tax", label: "Cookie taxonomy", kind: "privacy", state: "pass", detail: "Cookies categorised by purpose." },
  { id: "policy-fresh", label: "Privacy policy freshness", kind: "privacy", state: "pass", detail: "Last updated 41 days ago." },
  {
    id: "trackers",
    label: "Third-party trackers",
    kind: "privacy",
    state: "gap",
    detail: "Analytics tracker fires before consent.",
    recommendation: "Gate all trackers behind the consent signal (see finding TF-028).",
    evidence: "gtag/js observed firing at page load prior to consent.",
  },
];

// --- Public (unauthenticated) scan result -----------------------------------

export const PUBLIC_SCAN: PublicScanResult = {
  url: "https://www.technova.in",
  score: 89,
  posture: "Strong Alignment",
  scannedAt: "4 September 2026",
  highlights: [
    { label: "HTTPS & transport security", state: "pass", detail: "TLS 1.3 active, valid certificate." },
    { label: "Privacy policy", state: "pass", detail: "Reachable and recently updated." },
    { label: "Cookie consent", state: "attention", detail: "Mobile opt-out could be clearer." },
  ],
};

export const UPLOADED_DOCUMENTS: UploadedDocument[] = [
  { id: "doc-1", name: "TechNova_Privacy_Policy_2026.pdf", sizeLabel: "2.4 MB", status: "Verified" },
  { id: "doc-2", name: "InfoSec_Governance_SOP.pdf", sizeLabel: "1.8 MB", status: "Verified" },
];

// Report metadata
export const REPORT_META = {
  reportId: "TF-2026-DPDP-0904",
  issuedOn: "4 September 2026",
  framework: "TrustForge TEF (DPDP Act 2023 aligned)",
  documentHash: "8f9a2b4e6c1d7a90",
};
