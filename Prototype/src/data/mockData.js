export const MOCK_COMPANY = {
  name: "TechNova Solutions Pvt Ltd",
  website: "https://www.technova.in",
  overallScore: 89,
  tier: "Significant Data Fiduciary Candidate",
  trustGrade: "Level A+ (High Trust)",
  cin: "U72900KA2021PTC145123",
  gstin: "29AAAAA0000A1Z5",
  dpoName: "Rajesh V. Sharma",
  dpoEmail: "grievance@technova.in",
  dpoPhone: "+91 80 4920 1100",
  address: "Block B, Embassy TechVillage, Outer Ring Rd, Devarabeesanahalli, Bengaluru, Karnataka 560103",
  lastScanTime: "August 4, 2026 at 09:30 IST",
  dataPrincipalsCount: "420,000+",
  activeConsentsCount: "385,400",
  tefFrameworkVersion: "TEF v2.4 (DPDP 2023 Aligned)",
};

export const SIX_PILLARS = [
  {
    id: "privacy",
    name: "Privacy Compliance",
    score: 92,
    color: "#2563EB", // Primary Accent
    description: "Multilingual notice, explicit consent management, and purpose limitation enforcement.",
    status: "Excellent",
    trend: "+4%",
    metrics: [
      { label: "Consent Notice Validity", value: "98%" },
      { label: "Withdrawal Redressal Speed", value: "< 24 hrs" },
      { label: "Notice Language Coverage", value: "8 Languages" }
    ]
  },
  {
    id: "security",
    name: "Security Controls",
    score: 88,
    color: "#22C55E", // Success
    description: "TLS 1.3 encryption at rest & transit, zero-trust access control, and vulnerability scanning.",
    status: "Strong",
    trend: "+2%",
    metrics: [
      { label: "Encryption Strength", value: "AES-256 / TLS 1.3" },
      { label: "Unpatched Vulnerabilities", value: "0 Critical" },
      { label: "Access Logging", value: "100% Immutable" }
    ]
  },
  {
    id: "transparency",
    name: "Transparency",
    score: 85,
    color: "#3B82F6",
    description: "Cookie taxonomy, clear data sharing disclosures, and third-party vendor visibility.",
    status: "Good",
    trend: "+5%",
    metrics: [
      { label: "Third-party Disclosures", value: "12 Vendors" },
      { label: "Cookie Categorization", value: "100% Clear" },
      { label: "Public Policy Freshness", value: "42 Days Old" }
    ]
  },
  {
    id: "governance",
    name: "Governance & Policies",
    score: 90,
    color: "#8B5CF6",
    description: "Designated DPO/Grievance Officer, DPIA audits, and internal data protection SOPs.",
    status: "Excellent",
    trend: "Stable",
    metrics: [
      { label: "Grievance Officer Appointed", value: "Verified" },
      { label: "DPIA Audit Cadence", value: "Quarterly" },
      { label: "Staff Training Completion", value: "96%" }
    ]
  },
  {
    id: "lifecycle",
    name: "Data Lifecycle & Storage",
    score: 84,
    color: "#F59E0B", // Warning
    description: "Data retention schedules, automated purge jobs, and cross-border transfer safeguards.",
    status: "Action Needed",
    trend: "-1%",
    metrics: [
      { label: "Retention Policy Adherence", value: "91%" },
      { label: "Auto-Erasure Latency", value: "18 Days" },
      { label: "Local Data Sovereignty", value: "India AWS Mumbai" }
    ]
  },
  {
    id: "rights",
    name: "Data Principal Rights",
    score: 94,
    color: "#10B981",
    description: "Self-serve portal for Data Access, Correction, Erasure, and Grievance filing.",
    status: "Industry Leader",
    trend: "+6%",
    metrics: [
      { label: "Self-Service Portal", value: "Active" },
      { label: "Avg Resolution Time", value: "1.2 Days" },
      { label: "SLA Adherence Rate", value: "99.4%" }
    ]
  }
];

export const WEBSITE_SCAN_CARDS = [
  {
    id: "https",
    title: "HTTPS Enforcement",
    status: "pass",
    severity: "low",
    description: "HTTP traffic is automatically redirected to HTTPS with HSTS preloading enabled.",
    recommendation: "Maintain current HSTS max-age setting (31536000 seconds).",
    evidence: "HTTP 301 Redirect to https://www.technova.in confirmed."
  },
  {
    id: "ssl",
    title: "SSL / TLS Certificate",
    status: "pass",
    severity: "low",
    description: "Valid DigiCert TLS 1.3 certificate detected. Key length 2048-bit RSA.",
    recommendation: "Auto-renew scheduled 30 days prior to expiry.",
    evidence: "Issuer: DigiCert Inc. Valid until April 14, 2027."
  },
  {
    id: "headers",
    title: "Security Headers",
    status: "pass",
    severity: "low",
    description: "Content-Security-Policy, X-Frame-Options, X-Content-Type-Options properly set.",
    recommendation: "Periodic audit of CSP whitelist domains.",
    evidence: "CSP header present with nonce restriction."
  },
  {
    id: "privacy_policy",
    title: "Privacy Policy Document",
    status: "pass",
    severity: "low",
    description: "Comprehensive Privacy Policy accessible in footer with DPDP Act references.",
    recommendation: "Ensure notice includes explicit list of 22 scheduled Indian languages.",
    evidence: "Found at /privacy-policy. Last updated June 12, 2026."
  },
  {
    id: "cookie_banner",
    title: "Cookie Consent Banner",
    status: "warning",
    severity: "medium",
    description: "Cookie banner presents 'Accept All' prominently but hides 'Reject Optional' on mobile viewports.",
    recommendation: "Ensure mobile banner presents equal visual weight to 'Reject' button per DPDP Sec 6.",
    evidence: "Mobile CSS query shows display:none for secondary actions."
  },
  {
    id: "terms",
    title: "Terms & Conditions",
    status: "pass",
    severity: "low",
    description: "Terms of Service clearly outline user obligations and limitation of liability.",
    recommendation: "Add explicit governing law clause specifying High Court of Karnataka.",
    evidence: "Found at /terms. Clause 14 specifies jurisdiction."
  },
  {
    id: "robots",
    title: "Robots.txt Configuration",
    status: "pass",
    severity: "low",
    description: "Robots.txt prevents indexing of sensitive admin and API staging endpoints.",
    recommendation: "No change required.",
    evidence: "Disallow: /api/v1/internal/ verified."
  },
  {
    id: "sitemap",
    title: "Sitemap.xml",
    status: "pass",
    severity: "low",
    description: "Valid sitemap available referencing all public legal and privacy landing pages.",
    recommendation: "Include lastmod timestamps on privacy policy updates.",
    evidence: "https://www.technova.in/sitemap.xml returns 200 OK."
  },
  {
    id: "contact_page",
    title: "Contact & Grievance Page",
    status: "pass",
    severity: "low",
    description: "Dedicated Grievance Redressal mechanism listed with contact officer name and email.",
    recommendation: "Add toll-free helpline number for offline grievance support.",
    evidence: "Found at /grievance-redressal with officer details."
  },
  {
    id: "about_us",
    title: "About Us & Legal Entity",
    status: "pass",
    severity: "low",
    description: "Corporate entity verification complete with Ministry of Corporate Affairs CIN number.",
    recommendation: "Maintain registered address sync with MCA records.",
    evidence: "CIN: U72900KA2021PTC145123 verified on MCA portal."
  },
  {
    id: "accessibility",
    title: "Accessibility (WCAG 2.1)",
    status: "warning",
    severity: "medium",
    description: "Consent checkbox labels lack explicit aria-describedby links for screen readers.",
    recommendation: "Add aria-label tags to form controls in consent widget.",
    evidence: "3 form elements failed WCAG 2.1 AA contrast & label test."
  },
  {
    id: "recaptcha",
    title: "Bot Defense / reCAPTCHA",
    status: "pass",
    severity: "low",
    description: "Invisible Google reCAPTCHA v3 active on public forms to prevent automated spam.",
    recommendation: "Disclose reCAPTCHA data collection in privacy notice.",
    evidence: "reCAPTCHA v3 script tag loaded asynchronously."
  },
  {
    id: "cookie_categories",
    title: "Cookie Taxonomy Audit",
    status: "pass",
    severity: "low",
    description: "8 cookies identified: 3 Strictly Necessary, 3 Functional, 2 Analytics.",
    recommendation: "Re-scan monthly for vendor cookie injection.",
    evidence: "Cookie audit engine categorized all 8 cookies."
  },
  {
    id: "privacy_freshness",
    title: "Privacy Policy Freshness",
    status: "pass",
    severity: "low",
    description: "Policy updated 53 days ago. Meets the TEF <90 days freshness standard.",
    recommendation: "Set quarterly review notification in TrustForge.",
    evidence: "Meta timestamp tag indicates 2026-06-12."
  },
  {
    id: "ssl_expiry",
    title: "SSL Expiry Countdown",
    status: "pass",
    severity: "low",
    description: "248 days remaining until certificate renewal requirement.",
    recommendation: "Automated alert configured at 30-day mark.",
    evidence: "Expiration date: 2027-04-14."
  },
  {
    id: "third_party_trackers",
    title: "Third-Party Trackers",
    status: "warning",
    severity: "high",
    description: "Detected script 'analytics-v2.js' transmitting IP headers prior to cookie consent acceptance.",
    recommendation: "Block analytics script execution until explicit consent flag is set to true.",
    evidence: "Network log shows GET request to external CDN before user consent click."
  }
];

export const FINDINGS_LIST = [
  {
    id: "TF-DPDP-041",
    severity: "high",
    title: "Mobile Cookie Banner Lacks Equal Opt-Out Visibility",
    pillar: "Privacy Compliance",
    whyItMatters: "Under DPDP Act 2023 Section 6(1), consent must be free, specific, informed, unconditional, and unambiguous with equal ease of refusal.",
    recommendation: "Update CSS breakpoints on technova.in banner to display 'Reject Non-Essential' with equal button prominence alongside 'Accept All'.",
    evidence: "Viewport width < 768px hides rejection button under sub-menu.",
    dpdpReference: "DPDP Act 2023 - Section 6(1) & Section 6(3)",
    status: "open",
    assignedTo: "UI Engineering Team",
    dateFound: "Aug 02, 2026"
  },
  {
    id: "TF-DPDP-039",
    severity: "high",
    title: "Third-Party Cloud Vendor DPA Renewal Pending",
    pillar: "Data Lifecycle",
    whyItMatters: "Section 8(4) mandates that Data Fiduciaries ensure Data Processors adhere to equal security safeguards under a binding legal contract.",
    recommendation: "Execute updated Data Processing Addendum (DPA) with CloudData Systems Ltd including mandatory breach notification clauses within 6 hours.",
    evidence: "Contract #DPA-2024-99 expired on July 31, 2026.",
    dpdpReference: "DPDP Act 2023 - Section 8(4)",
    status: "in_progress",
    assignedTo: "Legal & Compliance",
    dateFound: "Aug 01, 2026"
  },
  {
    id: "TF-DPDP-028",
    severity: "medium",
    title: "Pre-Consent Script Execution on Analytics Endpoint",
    pillar: "Transparency",
    whyItMatters: "Loading tracking scripts before obtaining Data Principal consent violates the prior-notice requirement.",
    recommendation: "Wrap analytics script loading logic inside your Cookie Consent Manager callback function.",
    evidence: "Script URL: https://cdn.analytics-v2.js executed at DOMContentLoaded.",
    dpdpReference: "DPDP Act 2023 - Section 5(1)",
    status: "open",
    assignedTo: "Frontend Engineering",
    dateFound: "Jul 28, 2026"
  },
  {
    id: "TF-DPDP-022",
    severity: "medium",
    title: "Automated Data Erasure SLA Exceeds Target",
    pillar: "User Rights",
    whyItMatters: "Data Principals have the right to erasure under Section 12(3). Current manual fulfillment takes 18 days vs TEF best practice of < 7 days.",
    recommendation: "Enable automated database purge triggers in TechNova's admin portal to process erasure requests within 72 hours.",
    evidence: "Average ticket closure time for erasure requests is 18.4 days.",
    dpdpReference: "DPDP Act 2023 - Section 12(3)",
    status: "in_progress",
    assignedTo: "Backend & Ops",
    dateFound: "Jul 25, 2026"
  },
  {
    id: "TF-DPDP-019",
    severity: "medium",
    title: "Consent Notice Lacks Vernacular Language Options",
    pillar: "Privacy Compliance",
    whyItMatters: "Section 5(3) requires giving Data Principals the option to access consent notices in English or any of the 22 languages specified in the 8th Schedule.",
    recommendation: "Add Hindi, Kannada, and Tamil translation toggles to consent notices using TrustForge Multilingual Widget.",
    evidence: "Current notice presented in English only.",
    dpdpReference: "DPDP Act 2023 - Section 5(3)",
    status: "open",
    assignedTo: "Product Design",
    dateFound: "Jul 20, 2026"
  },
  {
    id: "TF-DPDP-012",
    severity: "low",
    title: "Annual Staff DPDP Awareness Training Refresh Due",
    pillar: "Governance",
    whyItMatters: "4 engineering team members hired in Q2 2026 have not completed mandatory DPDP data handling onboarding.",
    recommendation: "Assign TrustForge 15-minute DPDP interactive training module to new employees.",
    evidence: "HR Training LMS log indicates 96% completion rate.",
    dpdpReference: "DPDP Rules 2024 - Governance Rule 7",
    status: "open",
    assignedTo: "HR & Operations",
    dateFound: "Jul 15, 2026"
  },
  {
    id: "TF-DPDP-008",
    severity: "low",
    title: "Secondary Database Backup Log Retention Verification",
    pillar: "Security Controls",
    whyItMatters: "Security logs should be maintained for a minimum of 180 days to support CERT-In incident reporting requirements.",
    recommendation: "Update CloudWatch log group retention policy from 90 days to 180 days.",
    evidence: "AWS LogGroup /aws/rds/technova-prod retention set to 90 days.",
    dpdpReference: "CERT-In Cyber Security Directions 2022",
    status: "resolved",
    assignedTo: "DevOps Team",
    dateFound: "Jul 05, 2026"
  }
];

export const ASSESSMENT_STEPS = [
  { id: 1, name: "Welcome", description: "Overview of TEF Framework & DPDP Scope" },
  { id: 2, name: "Company Details", description: "Entity structure, MCA registration & DPO setup" },
  { id: 3, name: "Website Info", description: "Domain, public endpoints & third-party integrations" },
  { id: 4, name: "Data Collection", description: "Categories of Personal Data processed" },
  { id: 5, name: "Privacy Practices", description: "Consent notices, multilingual support & retention" },
  { id: 6, name: "Security Controls", description: "Encryption, access controls & vulnerability audits" },
  { id: 7, name: "Document Upload", description: "Privacy policy, InfoSec policy & DPA contracts" },
  { id: 8, name: "Review", description: "Verification of submitted compliance parameters" },
  { id: 9, name: "AI Analysis", description: "Trust Intelligence Core (TIC) evaluation engine" },
];

export const TESTIMONIALS = [
  {
    quote: "TrustForge allowed us to go from zero DPDP preparation to enterprise-ready compliance in less than two weeks. VCs and enterprise buyers immediately saw our commitment to trust.",
    author: "Ananya Deshmukh",
    role: "Co-Founder & CEO",
    company: "FinFlow Analytics",
    score: "94/100 Trust Score"
  },
  {
    quote: "The Website Scan and TEF framework gave us actionable code fixes that saved us months of legal consulting fees. It feels like Linear for Digital Compliance.",
    author: "Vikramaditya Rao",
    role: "VP of Engineering",
    company: "HealthPulse Tech",
    score: "91/100 Trust Score"
  },
  {
    quote: "As a Significant Data Fiduciary candidate, we needed evidence-backed assurance. TrustForge's PDF reports were accepted without hesitation by our enterprise partners.",
    author: "Priya Nair",
    role: "Chief Information Security Officer",
    company: "LogiNext India",
    score: "96/100 Trust Score"
  }
];
