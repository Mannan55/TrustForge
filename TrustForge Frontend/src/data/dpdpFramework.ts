import type {
  AssessmentStepMeta,
  DataCategory,
  DetectedIntegration,
  Language,
} from "@/types";

// ---------------------------------------------------------------------------
// The 14-step TrustForge assessment. Each step carries a plain-language
// "Why we ask" and a concise DPDP context note. Section references are drawn
// from the DPDP Act 2023 and are used consistently across the app.
// ---------------------------------------------------------------------------

export const ASSESSMENT_STEPS: AssessmentStepMeta[] = [
  {
    id: "welcome",
    index: 1,
    title: "Welcome",
    shortTitle: "Welcome",
    description:
      "A short guided assessment of your organization's DPDP posture across six trust pillars.",
    whyWeAsk:
      "This assessment builds an evidence-backed baseline of where your organization stands today, so every later finding traces back to something you told us or we observed.",
    dpdpContext:
      "The DPDP Act 2023 expects Data Fiduciaries to demonstrate accountability, not just claim it. A structured baseline is the starting point.",
    dpdpRef: "TrustForge TEF",
  },
  {
    id: "organization",
    index: 2,
    title: "Organization Context",
    shortTitle: "Organization",
    description: "Confirm the legal identity and accountability contacts for your entity.",
    whyWeAsk:
      "Verifying your legal entity and grievance contact establishes who is accountable for personal data decisions within the organization.",
    dpdpContext:
      "The Act requires Data Fiduciaries to publish the contact details of a person able to answer questions about data processing.",
    dpdpRef: "Section 8(9)",
  },
  {
    id: "infrastructure",
    index: 3,
    title: "Website & Infrastructure",
    shortTitle: "Infrastructure",
    description: "Your public domains, endpoints, and the integrations we detected.",
    whyWeAsk:
      "Knowing where your product runs and which third-party scripts load helps us map every point where personal data may be collected.",
    dpdpContext:
      "Purpose and lawful basis must hold at every collection point, including third-party tags loaded by your site.",
    dpdpRef: "Section 4",
  },
  {
    id: "collection",
    index: 4,
    title: "Data Collection & Processing",
    shortTitle: "Collection",
    description: "How and where personal data enters your systems.",
    whyWeAsk:
      "Mapping collection channels ensures each one has a clear, lawful reason to hold personal data.",
    dpdpContext:
      "Processing is permitted only for a lawful purpose for which the Data Principal has given consent, or for certain legitimate uses.",
    dpdpRef: "Section 4",
  },
  {
    id: "categories",
    index: 5,
    title: "Personal Data Categories",
    shortTitle: "Data Categories",
    description: "Select the categories of personal data your organization processes.",
    whyWeAsk:
      "The categories you handle determine the level of safeguard expected. Financial, health, or biometric data raises the bar.",
    dpdpContext:
      "More sensitive categories attract stronger security and consent expectations under the Act.",
    dpdpRef: "Section 8(5)",
  },
  {
    id: "purpose",
    index: 6,
    title: "Purpose of Processing",
    shortTitle: "Purpose",
    description: "The specific purposes for which you process personal data.",
    whyWeAsk:
      "Stating each purpose prevents scope creep, where data collected for one reason is quietly reused for another.",
    dpdpContext:
      "Processing must stay within the purpose for which consent was given. Fresh purposes need fresh notice and consent.",
    dpdpRef: "Section 4(1)",
  },
  {
    id: "consent",
    index: 7,
    title: "Notice & Consent Mechanisms",
    shortTitle: "Notice & Consent",
    description: "How you present privacy notices and capture consent.",
    whyWeAsk:
      "Data Principals across India should be able to read your notice in a language they understand and give or withdraw consent easily.",
    dpdpContext:
      "Notice must be available in English or any language in the Eighth Schedule to the Constitution, and consent must be as easy to withdraw as to give.",
    dpdpRef: "Section 5",
  },
  {
    id: "retention",
    index: 8,
    title: "Data Retention & Erasure",
    shortTitle: "Retention",
    description: "How long you keep personal data and how you erase it.",
    whyWeAsk:
      "Holding data after its purpose is served increases risk with no benefit. A defined retention and erasure schedule limits exposure.",
    dpdpContext:
      "Personal data should be erased once the purpose is served and retention is no longer necessary for legal reasons.",
    dpdpRef: "Section 8(7)",
  },
  {
    id: "rights",
    index: 9,
    title: "Data Principal Rights",
    shortTitle: "Rights",
    description: "How you handle access, correction, erasure, and grievance requests.",
    whyWeAsk:
      "This checks whether you can actually honour a user's request to see, correct, or erase their data within a reasonable time.",
    dpdpContext:
      "Data Principals have rights to access a summary of their data, seek correction and erasure, nominate, and raise grievances.",
    dpdpRef: "Sections 11-14",
  },
  {
    id: "security",
    index: 10,
    title: "Security Practices",
    shortTitle: "Security",
    description: "The technical and organizational safeguards protecting personal data.",
    whyWeAsk:
      "Encryption, access control, and breach readiness are the practical defences that keep personal data from leaking.",
    dpdpContext:
      "Data Fiduciaries must take reasonable security safeguards to prevent personal data breaches.",
    dpdpRef: "Section 8(5)",
  },
  {
    id: "processors",
    index: 11,
    title: "Third-Party Processors",
    shortTitle: "Processors",
    description: "The vendors and services that process data on your behalf.",
    whyWeAsk:
      "You remain accountable for data even when a vendor handles it, so contracts need to carry your obligations forward.",
    dpdpContext:
      "A Data Fiduciary may engage a Data Processor only under a valid contract.",
    dpdpRef: "Section 8(2)",
  },
  {
    id: "evidence",
    index: 12,
    title: "Policies & Evidence",
    shortTitle: "Evidence",
    description: "Upload the documents that support your compliance claims.",
    whyWeAsk:
      "Attaching your policies and audit documents lets TrustForge verify claims against real evidence rather than self-declaration alone.",
    dpdpContext:
      "Documented policies and records support accountability and are expected during any regulatory review.",
    dpdpRef: "Section 8",
  },
  {
    id: "review",
    index: 13,
    title: "Review & Verification",
    shortTitle: "Review",
    description: "Confirm your responses before running the analysis.",
    whyWeAsk:
      "A final review lets you correct any detail before it shapes your Trust Score and findings.",
    dpdpContext:
      "Accuracy of self-assessment matters. Records you confirm here inform your baseline posture.",
    dpdpRef: "TrustForge TEF",
  },
  {
    id: "result",
    index: 14,
    title: "Assessment Result",
    shortTitle: "Result",
    description: "Your TrustForge Score and the priorities that follow from it.",
    whyWeAsk:
      "The result turns your responses and observed signals into a clear posture and a short list of what to fix first.",
    dpdpContext:
      "A repeatable baseline helps you track progress and reduce exposure over time.",
    dpdpRef: "TrustForge TEF",
  },
];

export const PERSONAL_DATA_CATEGORIES: DataCategory[] = [
  {
    id: "identifiers",
    name: "User Identifiers",
    description: "Name, phone number, and email address",
    sensitivity: "Standard",
    examples: ["Full name", "Phone", "Email"],
  },
  {
    id: "financial",
    name: "Financial & Transaction Data",
    description: "Payment details and transaction history",
    sensitivity: "High",
    examples: ["Card metadata", "UPI ID", "Invoices"],
  },
  {
    id: "device",
    name: "Device IP & Browser Headers",
    description: "Technical identifiers gathered automatically",
    sensitivity: "Medium",
    examples: ["IP address", "User agent", "Cookies"],
  },
  {
    id: "location",
    name: "Geographic Location",
    description: "Coarse or precise location signals",
    sensitivity: "Medium",
    examples: ["City", "GPS", "Region"],
  },
  {
    id: "sensitive",
    name: "Biometric / Sensitive Data",
    description: "Aadhaar, PAN, health, or biometric identifiers",
    sensitivity: "Critical",
    examples: ["Aadhaar", "PAN", "Health records"],
  },
  {
    id: "hr",
    name: "Employee / HR Data",
    description: "Records relating to your workforce",
    sensitivity: "Medium",
    examples: ["Payroll", "Attendance", "Reviews"],
  },
];

export const PROCESSING_PURPOSES = [
  { id: "service", name: "Service Delivery", description: "Core product functionality" },
  { id: "auth", name: "Authentication", description: "Sign-in and account security" },
  { id: "analytics", name: "Analytics", description: "Product usage measurement" },
  { id: "marketing", name: "Marketing", description: "Campaigns and communication" },
  { id: "security", name: "Security", description: "Fraud and abuse prevention" },
  { id: "support", name: "Customer Support", description: "Helping users with issues" },
  { id: "hr", name: "Employee Management", description: "Workforce administration" },
];

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: "en", name: "English", native: "English" },
  { code: "hi", name: "Hindi", native: "हिन्दी" },
  { code: "mr", name: "Marathi", native: "मराठी" },
  { code: "kn", name: "Kannada", native: "ಕನ್ನಡ" },
  { code: "ta", name: "Tamil", native: "தமிழ்" },
  { code: "te", name: "Telugu", native: "తెలుగు" },
  { code: "bn", name: "Bengali", native: "বাংলা" },
];

export const DETECTED_INTEGRATIONS: DetectedIntegration[] = [
  { id: "ga4", name: "Google Analytics 4", category: "Analytics", risk: "MEDIUM" },
  { id: "cloudfront", name: "AWS CloudFront CDN", category: "Infrastructure", risk: "LOW" },
  { id: "razorpay", name: "Razorpay Payment Gateway", category: "Payments", risk: "HIGH" },
  { id: "intercom", name: "Intercom Support Widget", category: "Support", risk: "MEDIUM" },
];

export const DATA_RIGHTS = [
  { id: "access", name: "Right to Access", detail: "Summary of personal data processed" },
  { id: "correction", name: "Right to Correction", detail: "Update inaccurate data" },
  { id: "erasure", name: "Right to Erasure", detail: "Delete data no longer needed" },
  { id: "grievance", name: "Right to Grievance Redressal", detail: "Escalate concerns" },
  { id: "nominate", name: "Right to Nominate", detail: "Nominate another individual" },
];

export const SECURITY_CONTROLS = [
  { id: "rest", label: "Encryption at Rest", value: "AES-256 Verified" },
  { id: "transit", label: "Encryption in Transit", value: "TLS 1.3 Enforced" },
  { id: "backup", label: "Backup Frequency", value: "Automated Daily Snapshot" },
  { id: "access", label: "Access Control", value: "Role-based, MFA Enforced" },
];

// The staged copy shown by the TrustForge processing visual. Deliberately
// technical and calm. No "AI magic" language.
export const ANALYSIS_STAGES = [
  "Preparing assessment framework",
  "Reviewing submitted responses",
  "Scanning website signals",
  "Validating SSL and technical controls",
  "Processing uploaded evidence",
  "Evaluating TrustForge controls",
  "Calculating Trust Score",
  "Preparing findings",
];
