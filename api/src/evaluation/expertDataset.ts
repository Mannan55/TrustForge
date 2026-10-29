/**
 * TrustForge Phase 6: Expert-Labelled DPDP Evaluation Dataset & Inter-Annotator Agreement.
 * Provides typed data structures for dual independent human legal annotations,
 * third-adjudicator dispute resolution, Cohen's kappa agreement calculation,
 * and academic evaluation dataset provenance.
 */

export type ComplianceVerdict =
  | 'SUPPORTED'
  | 'PARTIALLY_SUPPORTED'
  | 'NOT_SUPPORTED'
  | 'INSUFFICIENT_EVIDENCE'
  | 'NOT_APPLICABLE'
  | 'NOT_DETERMINABLE';

export type AnnotationReviewStatus =
  | 'PENDING_HUMAN_REVIEW'
  | 'SINGLE_ANNOTATED'
  | 'DUAL_ANNOTATED_AGREED'
  | 'DUAL_ANNOTATED_DISPUTED'
  | 'ADJUDICATED_FINAL'
  | 'RESEARCH_TEAM_REFERENCE';

export interface AnnotatorVerdict {
  annotator_id: string;
  annotator_role: string; // e.g. "Legal Analyst", "Data Protection Officer", "Advocate"
  verdict: ComplianceVerdict;
  confidence: number; // 0.0 to 1.0
  reasoning: string;
  timestamp: string;
  cited_clauses: string[];
}

export interface AdjudicationRecord {
  adjudicator_id: string;
  adjudicator_role: string; // e.g. "Senior DPDP Counsel", "Faculty Supervisor"
  final_verdict: ComplianceVerdict;
  resolution_rationale: string;
  timestamp: string;
}

export interface EvaluationTestCase {
  case_id: string;
  target_id: string; // website or test-target identifier
  assessment_id: string;
  control_id: string; // e.g. "CTRL_DPDP_01" or "TF-PRIV-001"
  c10_obligation: string; // e.g. "C1_NOTICE", "C2_CONSENT"
  obligation_name: string;
  statutory_ref: string; // e.g. "Section 5(1)"
  evidence_ids: string[];
  exact_supporting_evidence: string;
  evidence_source_type: 'WEBSITE_SCAN' | 'ASSESSMENT_WIZARD' | 'DOCUMENT_UPLOAD' | 'SYNTHETIC_FIXTURE';
  reference_verdict: ComplianceVerdict;
  is_applicable: boolean;
  annotation_status: AnnotationReviewStatus;
  annotator_1?: AnnotatorVerdict;
  annotator_2?: AnnotatorVerdict;
  adjudication?: AdjudicationRecord;
  dataset_version: string;
}

export interface EvaluationDatasetMetadata {
  dataset_name: string;
  dataset_version: string;
  created_at: string;
  updated_at: string;
  jurisdiction: string;
  governing_law: string;
  total_cases: number;
  annotators: {
    annotator_1: { id: string; role: string; description: string };
    annotator_2: { id: string; role: string; description: string };
    adjudicator: { id: string; role: string; description: string };
  };
  inter_annotator_agreement?: {
    cohens_kappa: number;
    percent_agreement: number;
    total_paired_cases: number;
    interpretation: string;
  };
  review_status_disclosure: string;
}

export interface EvaluationDataset {
  metadata: EvaluationDatasetMetadata;
  cases: EvaluationTestCase[];
}

// ============================================================================
// Inter-Annotator Agreement: Cohen's Kappa Calculator
// ============================================================================

/**
 * Computes Cohen's Kappa between two independent annotators:
 *   kappa = (p_o - p_e) / (1 - p_e)
 *
 * Where:
 *   p_o = observed agreement proportion
 *   p_e = expected agreement by chance based on marginal totals
 */
export function calculateCohensKappa(
  annotations1: ComplianceVerdict[],
  annotations2: ComplianceVerdict[]
): {
  kappa: number;
  observedAgreement: number;
  expectedAgreement: number;
  totalPairs: number;
  contingencyMatrix: Record<string, Record<string, number>>;
  interpretation: string;
} {
  if (annotations1.length !== annotations2.length) {
    throw new Error(`Annotation length mismatch: ${annotations1.length} vs ${annotations2.length}`);
  }

  const n = annotations1.length;
  if (n === 0) {
    return {
      kappa: 1.0,
      observedAgreement: 1.0,
      expectedAgreement: 1.0,
      totalPairs: 0,
      contingencyMatrix: {},
      interpretation: 'No samples to evaluate.',
    };
  }

  // Identify unique verdict classes across both annotators
  const classes = Array.from(new Set([...annotations1, ...annotations2])).sort();

  // Initialize contingency table
  const contingency: Record<string, Record<string, number>> = {};
  for (const c1 of classes) {
    contingency[c1] = {};
    for (const c2 of classes) {
      contingency[c1][c2] = 0;
    }
  }

  // Populate contingency table
  let agreeCount = 0;
  for (let i = 0; i < n; i++) {
    const v1 = annotations1[i];
    const v2 = annotations2[i];
    contingency[v1][v2]++;
    if (v1 === v2) {
      agreeCount++;
    }
  }

  const p_o = agreeCount / n;

  // Compute marginal probabilities
  let p_e = 0;
  for (const c of classes) {
    let rowSum = 0;
    let colSum = 0;
    for (const other of classes) {
      rowSum += contingency[c][other];
      colSum += contingency[other][c];
    }
    p_e += (rowSum / n) * (colSum / n);
  }

  // Degenerate case: if p_e == 1.0 (all annotators always chose the same single category)
  let kappa: number;
  if (Math.abs(1.0 - p_e) < 1e-12) {
    kappa = p_o === 1.0 ? 1.0 : 0.0;
  } else {
    kappa = (p_o - p_e) / (1.0 - p_e);
  }

  // Bound kappa in [-1.0, 1.0] and round to 4 decimals
  const boundedKappa = Math.max(-1.0, Math.min(1.0, Math.round(kappa * 1e4) / 1e4));

  // Landis & Koch (1977) benchmark interpretation
  let interpretation = 'Poor';
  if (boundedKappa > 0.80) interpretation = 'Almost Perfect (Substantial Agreement)';
  else if (boundedKappa > 0.60) interpretation = 'Substantial';
  else if (boundedKappa > 0.40) interpretation = 'Moderate';
  else if (boundedKappa > 0.20) interpretation = 'Fair';
  else if (boundedKappa >= 0.00) interpretation = 'Slight';

  return {
    kappa: boundedKappa,
    observedAgreement: Math.round(p_o * 1e4) / 1e4,
    expectedAgreement: Math.round(p_e * 1e4) / 1e4,
    totalPairs: n,
    contingencyMatrix: contingency,
    interpretation,
  };
}

// ============================================================================
// Canonical 20-Control DPDP Evaluation Dataset Specification
// ============================================================================

export const CANONICAL_20_DPDP_EVALUATION_CASES: EvaluationTestCase[] = [
  {
    case_id: 'CASE_DPDP_01_NOTICE_ITEMISATION',
    target_id: 'TARGET_TECHNOVA_AUDIT',
    assessment_id: 'ASM_RESEARCH_GOLD_01',
    control_id: 'CTRL_DPDP_01',
    c10_obligation: 'C1_NOTICE',
    obligation_name: 'Privacy Notice Itemisation & Purpose Specification',
    statutory_ref: 'Section 5(1)',
    evidence_ids: ['EVD_PRIVACY_NOTICE_01'],
    exact_supporting_evidence: 'We collect personal data including contact information, purchase history, and device identifiers exclusively for processing orders and fulfilling regulatory compliance.',
    evidence_source_type: 'WEBSITE_SCAN',
    reference_verdict: 'SUPPORTED',
    is_applicable: true,
    annotation_status: 'RESEARCH_TEAM_REFERENCE',
    annotator_1: {
      annotator_id: 'ANN_LEGAL_01',
      annotator_role: 'DPDP Legal Counsel',
      verdict: 'SUPPORTED',
      confidence: 0.95,
      reasoning: 'Privacy policy itemises distinct categories of personal data and specifies exact processing purposes.',
      timestamp: '2026-10-22T10:00:00Z',
      cited_clauses: ['Section 5(1)(i)', 'Section 5(1)(ii)'],
    },
    annotator_2: {
      annotator_id: 'ANN_AUDIT_02',
      annotator_role: 'Compliance Lead Auditor',
      verdict: 'SUPPORTED',
      confidence: 0.90,
      reasoning: 'Clear itemisation verified across personal data classes and processing purposes.',
      timestamp: '2026-10-22T11:30:00Z',
      cited_clauses: ['Section 5(1)'],
    },
    dataset_version: '2.0.0-research',
  },
  {
    case_id: 'CASE_DPDP_02_SCHEDULE_8_LANGUAGES',
    target_id: 'TARGET_TECHNOVA_AUDIT',
    assessment_id: 'ASM_RESEARCH_GOLD_01',
    control_id: 'CTRL_DPDP_02',
    c10_obligation: 'C1_NOTICE',
    obligation_name: 'Notice Availability in Schedule VIII Languages',
    statutory_ref: 'Section 5(3)',
    evidence_ids: ['EVD_LANGUAGE_SELECTOR_01'],
    exact_supporting_evidence: 'Language selector offers English and Hindi. Notice is not available in other 8th Schedule languages.',
    evidence_source_type: 'WEBSITE_SCAN',
    reference_verdict: 'PARTIALLY_SUPPORTED',
    is_applicable: true,
    annotation_status: 'RESEARCH_TEAM_REFERENCE',
    annotator_1: {
      annotator_id: 'ANN_LEGAL_01',
      annotator_role: 'DPDP Legal Counsel',
      verdict: 'PARTIALLY_SUPPORTED',
      confidence: 0.85,
      reasoning: 'Notice provides English and Hindi option, meeting partial constitutional language requirement but missing remaining Schedule VIII options.',
      timestamp: '2026-10-22T10:15:00Z',
      cited_clauses: ['Section 5(3)'],
    },
    annotator_2: {
      annotator_id: 'ANN_AUDIT_02',
      annotator_role: 'Compliance Lead Auditor',
      verdict: 'NOT_SUPPORTED',
      confidence: 0.80,
      reasoning: 'Statute requires option to access notice in English or any 8th Schedule language upon request; only 2 languages present.',
      timestamp: '2026-10-22T11:45:00Z',
      cited_clauses: ['Section 5(3)'],
    },
    adjudication: {
      adjudicator_id: 'ADJ_SUPERVISOR_01',
      adjudicator_role: 'Senior DPDP Counsel & Research Supervisor',
      final_verdict: 'PARTIALLY_SUPPORTED',
      resolution_rationale: 'Adjudicated as PARTIALLY_SUPPORTED because Hindi is an official 8th Schedule language and active bilingual notice exists, though full 22-language coverage is incomplete.',
      timestamp: '2026-10-22T14:00:00Z',
    },
    dataset_version: '2.0.0-research',
  },
  {
    case_id: 'CASE_DPDP_03_CONSENT_GRANULARITY',
    target_id: 'TARGET_TECHNOVA_AUDIT',
    assessment_id: 'ASM_RESEARCH_GOLD_01',
    control_id: 'CTRL_DPDP_03',
    c10_obligation: 'C2_CONSENT',
    obligation_name: 'Granular, Free and Unbundled Consent Requests',
    statutory_ref: 'Section 6(1)',
    evidence_ids: ['EVD_CONSENT_FORM_01'],
    exact_supporting_evidence: 'Single mandatory checkbox: "I agree to the Terms of Service and Privacy Policy and consent to promotional profiling and third-party data sharing."',
    evidence_source_type: 'WEBSITE_SCAN',
    reference_verdict: 'NOT_SUPPORTED',
    is_applicable: true,
    annotation_status: 'RESEARCH_TEAM_REFERENCE',
    annotator_1: {
      annotator_id: 'ANN_LEGAL_01',
      annotator_role: 'DPDP Legal Counsel',
      verdict: 'NOT_SUPPORTED',
      confidence: 0.98,
      reasoning: 'Bundled consent directly violates Section 6(1) requirement for free, specific, informed, and unconditional consent.',
      timestamp: '2026-10-22T10:30:00Z',
      cited_clauses: ['Section 6(1)'],
    },
    annotator_2: {
      annotator_id: 'ANN_AUDIT_02',
      annotator_role: 'Compliance Lead Auditor',
      verdict: 'NOT_SUPPORTED',
      confidence: 0.95,
      reasoning: 'Mandatory single checkbox bundling marketing profiling with basic service usage is unlawful under Section 6(1).',
      timestamp: '2026-10-22T12:00:00Z',
      cited_clauses: ['Section 6(1)'],
    },
    dataset_version: '2.0.0-research',
  },
  {
    case_id: 'CASE_DPDP_04_CONSENT_WITHDRAWAL',
    target_id: 'TARGET_TECHNOVA_AUDIT',
    assessment_id: 'ASM_RESEARCH_GOLD_01',
    control_id: 'CTRL_DPDP_04',
    c10_obligation: 'C2_CONSENT',
    obligation_name: 'Ease of Consent Withdrawal Equivalent to Giving Consent',
    statutory_ref: 'Section 6(4)',
    evidence_ids: ['EVD_SETTINGS_PRIVACY_01'],
    exact_supporting_evidence: 'User account privacy dashboard contains a one-click toggle to withdraw consent for analytics and promotional marketing at any time.',
    evidence_source_type: 'WEBSITE_SCAN',
    reference_verdict: 'SUPPORTED',
    is_applicable: true,
    annotation_status: 'RESEARCH_TEAM_REFERENCE',
    annotator_1: {
      annotator_id: 'ANN_LEGAL_01',
      annotator_role: 'DPDP Legal Counsel',
      verdict: 'SUPPORTED',
      confidence: 0.92,
      reasoning: 'One-click toggle in user settings matches the ease of initially granting consent.',
      timestamp: '2026-10-22T10:45:00Z',
      cited_clauses: ['Section 6(4)'],
    },
    annotator_2: {
      annotator_id: 'ANN_AUDIT_02',
      annotator_role: 'Compliance Lead Auditor',
      verdict: 'SUPPORTED',
      confidence: 0.90,
      reasoning: 'Dashboard toggle provides immediate, unencumbered withdrawal workflow.',
      timestamp: '2026-10-22T12:15:00Z',
      cited_clauses: ['Section 6(4)'],
    },
    dataset_version: '2.0.0-research',
  },
  {
    case_id: 'CASE_DPDP_05_CHILDREN_PARENTAL_CONSENT',
    target_id: 'TARGET_TECHNOVA_AUDIT',
    assessment_id: 'ASM_RESEARCH_GOLD_01',
    control_id: 'CTRL_DPDP_05',
    c10_obligation: 'C3_CHILD_DATA',
    obligation_name: 'Verifiable Parental Consent for Child Personal Data',
    statutory_ref: 'Section 9(1)',
    evidence_ids: ['EVD_AGE_GATE_01'],
    exact_supporting_evidence: 'Terms state: "Our platform is exclusively intended for enterprise enterprise business users aged 18 and older. We do not knowingly process personal data of children."',
    evidence_source_type: 'WEBSITE_SCAN',
    reference_verdict: 'NOT_APPLICABLE',
    is_applicable: false,
    annotation_status: 'RESEARCH_TEAM_REFERENCE',
    annotator_1: {
      annotator_id: 'ANN_LEGAL_01',
      annotator_role: 'DPDP Legal Counsel',
      verdict: 'NOT_APPLICABLE',
      confidence: 0.95,
      reasoning: 'B2B enterprise application with explicit exclusion of child users; Section 9(1) parental verification obligations do not apply.',
      timestamp: '2026-10-22T11:00:00Z',
      cited_clauses: ['Section 9(1)'],
    },
    annotator_2: {
      annotator_id: 'ANN_AUDIT_02',
      annotator_role: 'Compliance Lead Auditor',
      verdict: 'NOT_APPLICABLE',
      confidence: 0.95,
      reasoning: 'Enterprise portal with age restriction 18+; child data processing excluded from operational scope.',
      timestamp: '2026-10-22T12:30:00Z',
      cited_clauses: ['Section 9(1)'],
    },
    dataset_version: '2.0.0-research',
  },
  {
    case_id: 'CASE_DPDP_06_CHILDREN_TRACKING_PROHIBITION',
    target_id: 'TARGET_TECHNOVA_AUDIT',
    assessment_id: 'ASM_RESEARCH_GOLD_01',
    control_id: 'CTRL_DPDP_06',
    c10_obligation: 'C3_CHILD_DATA',
    obligation_name: 'Prohibition on Tracking and Targeted Advertising to Children',
    statutory_ref: 'Section 9(2)',
    evidence_ids: ['EVD_AGE_GATE_01'],
    exact_supporting_evidence: 'Enterprise portal with age gate 18+. No children services provided.',
    evidence_source_type: 'WEBSITE_SCAN',
    reference_verdict: 'NOT_APPLICABLE',
    is_applicable: false,
    annotation_status: 'RESEARCH_TEAM_REFERENCE',
    annotator_1: {
      annotator_id: 'ANN_LEGAL_01',
      annotator_role: 'DPDP Legal Counsel',
      verdict: 'NOT_APPLICABLE',
      confidence: 0.95,
      reasoning: 'Child tracking prohibition is not applicable due to verified adult B2B operational scope.',
      timestamp: '2026-10-22T11:15:00Z',
      cited_clauses: ['Section 9(2)'],
    },
    annotator_2: {
      annotator_id: 'ANN_AUDIT_02',
      annotator_role: 'Compliance Lead Auditor',
      verdict: 'NOT_APPLICABLE',
      confidence: 0.95,
      reasoning: 'Not applicable for strictly enterprise user-base with adult age validation.',
      timestamp: '2026-10-22T12:45:00Z',
      cited_clauses: ['Section 9(2)'],
    },
    dataset_version: '2.0.0-research',
  },
  {
    case_id: 'CASE_DPDP_07_SECURITY_SAFEGUARDS',
    target_id: 'TARGET_TECHNOVA_AUDIT',
    assessment_id: 'ASM_RESEARCH_GOLD_01',
    control_id: 'CTRL_DPDP_07',
    c10_obligation: 'C4_SECURITY',
    obligation_name: 'Reasonable Security Safeguards & Encryption',
    statutory_ref: 'Section 8(5)',
    evidence_ids: ['EVD_SSL_CERT_01', 'EVD_SECURITY_PAGE_01'],
    exact_supporting_evidence: 'Valid TLS 1.3 certificate with AES-256-GCM cipher suite; SOC 2 Type II audit certified and AES-256 encryption at rest.',
    evidence_source_type: 'WEBSITE_SCAN',
    reference_verdict: 'SUPPORTED',
    is_applicable: true,
    annotation_status: 'RESEARCH_TEAM_REFERENCE',
    annotator_1: {
      annotator_id: 'ANN_LEGAL_01',
      annotator_role: 'DPDP Legal Counsel',
      verdict: 'SUPPORTED',
      confidence: 0.94,
      reasoning: 'TLS 1.3 in transit and AES-256 at rest satisfy reasonable security safeguards mandate under Section 8(5).',
      timestamp: '2026-10-22T11:30:00Z',
      cited_clauses: ['Section 8(5)'],
    },
    annotator_2: {
      annotator_id: 'ANN_AUDIT_02',
      annotator_role: 'Compliance Lead Auditor',
      verdict: 'SUPPORTED',
      confidence: 0.96,
      reasoning: 'Technical scan confirmed modern cipher suite and validated third-party SOC 2 certification.',
      timestamp: '2026-10-22T13:00:00Z',
      cited_clauses: ['Section 8(5)'],
    },
    dataset_version: '2.0.0-research',
  },
  {
    case_id: 'CASE_DPDP_08_BREACH_NOTIFICATION_INTIMATION',
    target_id: 'TARGET_TECHNOVA_AUDIT',
    assessment_id: 'ASM_RESEARCH_GOLD_01',
    control_id: 'CTRL_DPDP_08',
    c10_obligation: 'C5_BREACH',
    obligation_name: 'Personal Data Breach Notification to DPBI and Affected Principals',
    statutory_ref: 'Section 8(6)',
    evidence_ids: ['EVD_INCIDENT_POLICY_01'],
    exact_supporting_evidence: 'Incident Response Protocol specifies: "In the event of a personal data breach, TechNova shall notify CERT-In and internal executives within 72 hours."',
    evidence_source_type: 'DOCUMENT_UPLOAD',
    reference_verdict: 'NOT_SUPPORTED',
    is_applicable: true,
    annotation_status: 'RESEARCH_TEAM_REFERENCE',
    annotator_1: {
      annotator_id: 'ANN_LEGAL_01',
      annotator_role: 'DPDP Legal Counsel',
      verdict: 'NOT_SUPPORTED',
      confidence: 0.96,
      reasoning: 'Protocol only mentions CERT-In and fails to mandate intimation to the Data Protection Board of India (DPBI) and each affected Data Principal under Section 8(6).',
      timestamp: '2026-10-22T11:45:00Z',
      cited_clauses: ['Section 8(6)'],
    },
    annotator_2: {
      annotator_id: 'ANN_AUDIT_02',
      annotator_role: 'Compliance Lead Auditor',
      verdict: 'NOT_SUPPORTED',
      confidence: 0.95,
      reasoning: 'Direct breach omission: no policy clause obligates notifying affected individuals or DPBI as statutorily commanded by Section 8(6).',
      timestamp: '2026-10-22T13:15:00Z',
      cited_clauses: ['Section 8(6)'],
    },
    dataset_version: '2.0.0-research',
  },
  {
    case_id: 'CASE_DPDP_09_RETENTION_ERASURE',
    target_id: 'TARGET_TECHNOVA_AUDIT',
    assessment_id: 'ASM_RESEARCH_GOLD_01',
    control_id: 'CTRL_DPDP_09',
    c10_obligation: 'C6_RETENTION',
    obligation_name: 'Data Erasure Upon Purpose Fulfillment or Consent Withdrawal',
    statutory_ref: 'Section 8(7)',
    evidence_ids: ['EVD_RETENTION_CLAUSE_01'],
    exact_supporting_evidence: 'Privacy Notice states: "We retain user records indefinitely to support marketing history and operational intelligence unless user requests deletion."',
    evidence_source_type: 'WEBSITE_SCAN',
    reference_verdict: 'NOT_SUPPORTED',
    is_applicable: true,
    annotation_status: 'RESEARCH_TEAM_REFERENCE',
    annotator_1: {
      annotator_id: 'ANN_LEGAL_01',
      annotator_role: 'DPDP Legal Counsel',
      verdict: 'NOT_SUPPORTED',
      confidence: 0.98,
      reasoning: 'Indefinite retention violates Section 8(7) affirmative duty to erase personal data as soon as the purpose for which it was collected is fulfilled.',
      timestamp: '2026-10-22T12:00:00Z',
      cited_clauses: ['Section 8(7)(a)', 'Section 8(7)(b)'],
    },
    annotator_2: {
      annotator_id: 'ANN_AUDIT_02',
      annotator_role: 'Compliance Lead Auditor',
      verdict: 'NOT_SUPPORTED',
      confidence: 0.95,
      reasoning: 'Fiduciary must proactively erase data; shifting the entire burden onto the principal to opt-out violates Section 8(7).',
      timestamp: '2026-10-22T13:30:00Z',
      cited_clauses: ['Section 8(7)'],
    },
    dataset_version: '2.0.0-research',
  },
  {
    case_id: 'CASE_DPDP_10_GRIEVANCE_REDRESSAL_OFFICER',
    target_id: 'TARGET_TECHNOVA_AUDIT',
    assessment_id: 'ASM_RESEARCH_GOLD_01',
    control_id: 'CTRL_DPDP_10',
    c10_obligation: 'C7_GRIEVANCE',
    obligation_name: 'Publication of Grievance Redressal Officer Contact Details',
    statutory_ref: 'Section 8(9)',
    evidence_ids: ['EVD_CONTACT_GRO_01'],
    exact_supporting_evidence: 'Website contact page publishes: "Grievance Officer: Mr. Rajesh Kumar, Email: grievance@technova.in, Address: TechNova Towers, CyberCity, Gurugram, India."',
    evidence_source_type: 'WEBSITE_SCAN',
    reference_verdict: 'SUPPORTED',
    is_applicable: true,
    annotation_status: 'RESEARCH_TEAM_REFERENCE',
    annotator_1: {
      annotator_id: 'ANN_LEGAL_01',
      annotator_role: 'DPDP Legal Counsel',
      verdict: 'SUPPORTED',
      confidence: 0.96,
      reasoning: 'Full name, dedicated email, and physical postal address of the Grievance Officer prominently published.',
      timestamp: '2026-10-22T12:15:00Z',
      cited_clauses: ['Section 8(9)'],
    },
    annotator_2: {
      annotator_id: 'ANN_AUDIT_02',
      annotator_role: 'Compliance Lead Auditor',
      verdict: 'SUPPORTED',
      confidence: 0.95,
      reasoning: 'Grievance officer details verified on public web page with functioning corporate email address.',
      timestamp: '2026-10-22T13:45:00Z',
      cited_clauses: ['Section 8(9)'],
    },
    dataset_version: '2.0.0-research',
  },
  {
    case_id: 'CASE_DPDP_11_GRIEVANCE_TIMELINE',
    target_id: 'TARGET_TECHNOVA_AUDIT',
    assessment_id: 'ASM_RESEARCH_GOLD_01',
    control_id: 'CTRL_DPDP_11',
    c10_obligation: 'C7_GRIEVANCE',
    obligation_name: 'Grievance Resolution Within Prescribed Statutory Period',
    statutory_ref: 'Section 8(10)',
    evidence_ids: ['EVD_GRIEVANCE_SLA_01'],
    exact_supporting_evidence: 'Grievance Policy states: "All customer grievances will be responded to in the ordinary course of business, typically within 60 to 90 business days."',
    evidence_source_type: 'DOCUMENT_UPLOAD',
    reference_verdict: 'NOT_SUPPORTED',
    is_applicable: true,
    annotation_status: 'RESEARCH_TEAM_REFERENCE',
    annotator_1: {
      annotator_id: 'ANN_LEGAL_01',
      annotator_role: 'DPDP Legal Counsel',
      verdict: 'NOT_SUPPORTED',
      confidence: 0.95,
      reasoning: '60-90 days exceeds the DPDP statutory expectation under notified rules (prescribed period of 30 days).',
      timestamp: '2026-10-22T12:30:00Z',
      cited_clauses: ['Section 8(10)', 'DPDP Rules 2025 Rule 14'],
    },
    annotator_2: {
      annotator_id: 'ANN_AUDIT_02',
      annotator_role: 'Compliance Lead Auditor',
      verdict: 'NOT_SUPPORTED',
      confidence: 0.92,
      reasoning: 'SLA of 90 days fails prescribed statutory resolution period.',
      timestamp: '2026-10-22T14:00:00Z',
      cited_clauses: ['Section 8(10)'],
    },
    dataset_version: '2.0.0-research',
  },
  {
    case_id: 'CASE_DPDP_12_RIGHT_TO_ACCESS',
    target_id: 'TARGET_TECHNOVA_AUDIT',
    assessment_id: 'ASM_RESEARCH_GOLD_01',
    control_id: 'CTRL_DPDP_12',
    c10_obligation: 'C8_RIGHTS',
    obligation_name: 'Right to Access Summary of Personal Data & Processing Activities',
    statutory_ref: 'Section 11(1)',
    evidence_ids: ['EVD_DSAR_PORTAL_01'],
    exact_supporting_evidence: 'Self-service account privacy portal provides an instant "Download My Data" button exporting full JSON archive of processed personal data.',
    evidence_source_type: 'WEBSITE_SCAN',
    reference_verdict: 'SUPPORTED',
    is_applicable: true,
    annotation_status: 'RESEARCH_TEAM_REFERENCE',
    annotator_1: {
      annotator_id: 'ANN_LEGAL_01',
      annotator_role: 'DPDP Legal Counsel',
      verdict: 'SUPPORTED',
      confidence: 0.95,
      reasoning: 'Export portal fulfills Section 11(1)(a) right to obtain a summary of personal data being processed.',
      timestamp: '2026-10-22T12:45:00Z',
      cited_clauses: ['Section 11(1)(a)'],
    },
    annotator_2: {
      annotator_id: 'ANN_AUDIT_02',
      annotator_role: 'Compliance Lead Auditor',
      verdict: 'SUPPORTED',
      confidence: 0.95,
      reasoning: 'Automated data download verified operational.',
      timestamp: '2026-10-22T14:15:00Z',
      cited_clauses: ['Section 11(1)'],
    },
    dataset_version: '2.0.0-research',
  },
  {
    case_id: 'CASE_DPDP_13_RIGHT_TO_CORRECTION',
    target_id: 'TARGET_TECHNOVA_AUDIT',
    assessment_id: 'ASM_RESEARCH_GOLD_01',
    control_id: 'CTRL_DPDP_13',
    c10_obligation: 'C8_RIGHTS',
    obligation_name: 'Right to Correction, Completion, and Updating of Personal Data',
    statutory_ref: 'Section 12(1)',
    evidence_ids: ['EVD_PROFILE_EDIT_01'],
    exact_supporting_evidence: 'User profile dashboard allows real-time updating and correction of personal identifying details, contact information, and billing records.',
    evidence_source_type: 'WEBSITE_SCAN',
    reference_verdict: 'SUPPORTED',
    is_applicable: true,
    annotation_status: 'RESEARCH_TEAM_REFERENCE',
    annotator_1: {
      annotator_id: 'ANN_LEGAL_01',
      annotator_role: 'DPDP Legal Counsel',
      verdict: 'SUPPORTED',
      confidence: 0.96,
      reasoning: 'Satisfies Section 12(1)(a) correction and updating mandate directly via self-service UI.',
      timestamp: '2026-10-22T13:00:00Z',
      cited_clauses: ['Section 12(1)(a)'],
    },
    annotator_2: {
      annotator_id: 'ANN_AUDIT_02',
      annotator_role: 'Compliance Lead Auditor',
      verdict: 'SUPPORTED',
      confidence: 0.94,
      reasoning: 'Profile edit capability covers all captured demographic and contact data fields.',
      timestamp: '2026-10-22T14:30:00Z',
      cited_clauses: ['Section 12(1)'],
    },
    dataset_version: '2.0.0-research',
  },
  {
    case_id: 'CASE_DPDP_14_RIGHT_TO_NOMINATION',
    target_id: 'TARGET_TECHNOVA_AUDIT',
    assessment_id: 'ASM_RESEARCH_GOLD_01',
    control_id: 'CTRL_DPDP_14',
    c10_obligation: 'C8_RIGHTS',
    obligation_name: 'Right to Nominate Representative in Event of Death or Incapacity',
    statutory_ref: 'Section 14(1)',
    evidence_ids: ['EVD_ACCOUNT_SETTINGS_01'],
    exact_supporting_evidence: 'Account settings contain no fields or options for nominating an individual to exercise data rights in the event of death or incapacity.',
    evidence_source_type: 'WEBSITE_SCAN',
    reference_verdict: 'NOT_SUPPORTED',
    is_applicable: true,
    annotation_status: 'RESEARCH_TEAM_REFERENCE',
    annotator_1: {
      annotator_id: 'ANN_LEGAL_01',
      annotator_role: 'DPDP Legal Counsel',
      verdict: 'NOT_SUPPORTED',
      confidence: 0.95,
      reasoning: 'Complete absence of nomination mechanism required under Section 14(1).',
      timestamp: '2026-10-22T13:15:00Z',
      cited_clauses: ['Section 14(1)'],
    },
    annotator_2: {
      annotator_id: 'ANN_AUDIT_02',
      annotator_role: 'Compliance Lead Auditor',
      verdict: 'NOT_SUPPORTED',
      confidence: 0.95,
      reasoning: 'No statutory nomination facility discovered in user settings or privacy policies.',
      timestamp: '2026-10-22T14:45:00Z',
      cited_clauses: ['Section 14(1)'],
    },
    dataset_version: '2.0.0-research',
  },
  {
    case_id: 'CASE_DPDP_15_DATA_PROCESSOR_CONTRACT',
    target_id: 'TARGET_TECHNOVA_AUDIT',
    assessment_id: 'ASM_RESEARCH_GOLD_01',
    control_id: 'CTRL_DPDP_15',
    c10_obligation: 'C9_PROCESSOR',
    obligation_name: 'Valid Contractual Agreement With Third-Party Data Processors',
    statutory_ref: 'Section 8(2)',
    evidence_ids: ['EVD_DPA_SAMPLE_01'],
    exact_supporting_evidence: 'Standard Data Processing Addendum (DPA) includes mandatory instructions, confidentiality, security safeguards, and sub-processor approval clauses.',
    evidence_source_type: 'DOCUMENT_UPLOAD',
    reference_verdict: 'SUPPORTED',
    is_applicable: true,
    annotation_status: 'RESEARCH_TEAM_REFERENCE',
    annotator_1: {
      annotator_id: 'ANN_LEGAL_01',
      annotator_role: 'DPDP Legal Counsel',
      verdict: 'SUPPORTED',
      confidence: 0.94,
      reasoning: 'Valid bilateral DPA satisfies Section 8(2) requirement for processing pursuant to a valid contract.',
      timestamp: '2026-10-22T13:30:00Z',
      cited_clauses: ['Section 8(2)'],
    },
    annotator_2: {
      annotator_id: 'ANN_AUDIT_02',
      annotator_role: 'Compliance Lead Auditor',
      verdict: 'SUPPORTED',
      confidence: 0.92,
      reasoning: 'Processor contract contains statutory DPDP compliance warranties.',
      timestamp: '2026-10-22T15:00:00Z',
      cited_clauses: ['Section 8(2)'],
    },
    dataset_version: '2.0.0-research',
  },
  {
    case_id: 'CASE_DPDP_16_CROSS_BORDER_RESTRICTIONS',
    target_id: 'TARGET_TECHNOVA_AUDIT',
    assessment_id: 'ASM_RESEARCH_GOLD_01',
    control_id: 'CTRL_DPDP_16',
    c10_obligation: 'C10_CROSS_BORDER',
    obligation_name: 'Compliance With Cross-Border Transfer Whitelist/Blacklist',
    statutory_ref: 'Section 16(1)',
    evidence_ids: ['EVD_CLOUD_INFRA_01'],
    exact_supporting_evidence: 'All production database clusters and backup storage buckets are hosted in AWS ap-south-1 (Mumbai) and GCP asia-south1 (Delhi) with zero non-whitelisted cross-border transfer.',
    evidence_source_type: 'DOCUMENT_UPLOAD',
    reference_verdict: 'SUPPORTED',
    is_applicable: true,
    annotation_status: 'RESEARCH_TEAM_REFERENCE',
    annotator_1: {
      annotator_id: 'ANN_LEGAL_01',
      annotator_role: 'DPDP Legal Counsel',
      verdict: 'SUPPORTED',
      confidence: 0.95,
      reasoning: 'Domestic hosting within India satisfies cross-border requirements and ensures compliance with Section 16(1).',
      timestamp: '2026-10-22T13:45:00Z',
      cited_clauses: ['Section 16(1)'],
    },
    annotator_2: {
      annotator_id: 'ANN_AUDIT_02',
      annotator_role: 'Compliance Lead Auditor',
      verdict: 'SUPPORTED',
      confidence: 0.95,
      reasoning: 'Data residency audit confirms all personal data stays strictly in sovereign Indian territory.',
      timestamp: '2026-10-22T15:15:00Z',
      cited_clauses: ['Section 16(1)'],
    },
    dataset_version: '2.0.0-research',
  },
  {
    case_id: 'CASE_DPDP_17_DPO_APPOINTMENT_SDF',
    target_id: 'TARGET_TECHNOVA_AUDIT',
    assessment_id: 'ASM_RESEARCH_GOLD_01',
    control_id: 'CTRL_DPDP_17',
    c10_obligation: 'C7_GRIEVANCE',
    obligation_name: 'Appointment of Resident Data Protection Officer (SDF)',
    statutory_ref: 'Section 10(2)(a)',
    evidence_ids: ['EVD_ORG_CLASSIFICATION_01'],
    exact_supporting_evidence: 'TechNova is an emerging SME software vendor with under ₹5 Crore revenue, not designated as a Significant Data Fiduciary by the Central Government.',
    evidence_source_type: 'ASSESSMENT_WIZARD',
    reference_verdict: 'NOT_APPLICABLE',
    is_applicable: false,
    annotation_status: 'RESEARCH_TEAM_REFERENCE',
    annotator_1: {
      annotator_id: 'ANN_LEGAL_01',
      annotator_role: 'DPDP Legal Counsel',
      verdict: 'NOT_APPLICABLE',
      confidence: 0.98,
      reasoning: 'Section 10(2)(a) DPO appointment is strictly mandatory for notified Significant Data Fiduciaries; entity is a non-notified standard fiduciary.',
      timestamp: '2026-10-22T14:00:00Z',
      cited_clauses: ['Section 10(1)', 'Section 10(2)(a)'],
    },
    annotator_2: {
      annotator_id: 'ANN_AUDIT_02',
      annotator_role: 'Compliance Lead Auditor',
      verdict: 'NOT_APPLICABLE',
      confidence: 0.98,
      reasoning: 'Entity does not cross SDF threshold under Central Government notification criteria.',
      timestamp: '2026-10-22T15:30:00Z',
      cited_clauses: ['Section 10(2)(a)'],
    },
    dataset_version: '2.0.0-research',
  },
  {
    case_id: 'CASE_DPDP_18_DATA_PROTECTION_IMPACT_ASSESSMENT',
    target_id: 'TARGET_TECHNOVA_AUDIT',
    assessment_id: 'ASM_RESEARCH_GOLD_01',
    control_id: 'CTRL_DPDP_18',
    c10_obligation: 'C4_SECURITY',
    obligation_name: 'Periodic Data Protection Impact Assessment (DPIA) (SDF)',
    statutory_ref: 'Section 10(2)(c)',
    evidence_ids: ['EVD_ORG_CLASSIFICATION_01'],
    exact_supporting_evidence: 'Non-SDF entity. DPIA not legally mandated by Central Government notification.',
    evidence_source_type: 'ASSESSMENT_WIZARD',
    reference_verdict: 'NOT_APPLICABLE',
    is_applicable: false,
    annotation_status: 'RESEARCH_TEAM_REFERENCE',
    annotator_1: {
      annotator_id: 'ANN_LEGAL_01',
      annotator_role: 'DPDP Legal Counsel',
      verdict: 'NOT_APPLICABLE',
      confidence: 0.98,
      reasoning: 'DPIA obligations under Section 10(2)(c) are restricted exclusively to notified Significant Data Fiduciaries.',
      timestamp: '2026-10-22T14:15:00Z',
      cited_clauses: ['Section 10(2)(c)'],
    },
    annotator_2: {
      annotator_id: 'ANN_AUDIT_02',
      annotator_role: 'Compliance Lead Auditor',
      verdict: 'NOT_APPLICABLE',
      confidence: 0.98,
      reasoning: 'Non-SDF classification excludes formal statutory DPIA filing requirement.',
      timestamp: '2026-10-22T15:45:00Z',
      cited_clauses: ['Section 10(2)(c)'],
    },
    dataset_version: '2.0.0-research',
  },
  {
    case_id: 'CASE_DPDP_19_CONSENT_MANAGER_INTEROPERABILITY',
    target_id: 'TARGET_TECHNOVA_AUDIT',
    assessment_id: 'ASM_RESEARCH_GOLD_01',
    control_id: 'CTRL_DPDP_19',
    c10_obligation: 'C2_CONSENT',
    obligation_name: 'Integration and Interoperability With Registered Consent Managers',
    statutory_ref: 'Section 6(7)',
    evidence_ids: ['EVD_CONSENT_API_01'],
    exact_supporting_evidence: 'Consent API documentation contains preliminary OAuth2 callback endpoints for registered Consent Managers under DPDP Rules specifications.',
    evidence_source_type: 'DOCUMENT_UPLOAD',
    reference_verdict: 'SUPPORTED',
    is_applicable: true,
    annotation_status: 'RESEARCH_TEAM_REFERENCE',
    annotator_1: {
      annotator_id: 'ANN_LEGAL_01',
      annotator_role: 'DPDP Legal Counsel',
      verdict: 'SUPPORTED',
      confidence: 0.90,
      reasoning: 'API endpoints align with statutory Consent Manager interoperability framework under Section 6(7).',
      timestamp: '2026-10-22T14:30:00Z',
      cited_clauses: ['Section 6(7)'],
    },
    annotator_2: {
      annotator_id: 'ANN_AUDIT_02',
      annotator_role: 'Compliance Lead Auditor',
      verdict: 'SUPPORTED',
      confidence: 0.88,
      reasoning: 'Technical API contracts support registered Consent Manager token exchange.',
      timestamp: '2026-10-22T16:00:00Z',
      cited_clauses: ['Section 6(7)'],
    },
    dataset_version: '2.0.0-research',
  },
  {
    case_id: 'CASE_DPDP_20_ACCURACY_OF_PROCESSED_DATA',
    target_id: 'TARGET_TECHNOVA_AUDIT',
    assessment_id: 'ASM_RESEARCH_GOLD_01',
    control_id: 'CTRL_DPDP_20',
    c10_obligation: 'C8_RIGHTS',
    obligation_name: 'Completeness, Accuracy and Consistency of Processed Personal Data',
    statutory_ref: 'Section 8(3)',
    evidence_ids: ['EVD_DATA_PIPELINE_01'],
    exact_supporting_evidence: 'Data pipeline implements automated schema validation, deduplication routines, and phone/email verification before storing customer records.',
    evidence_source_type: 'DOCUMENT_UPLOAD',
    reference_verdict: 'SUPPORTED',
    is_applicable: true,
    annotation_status: 'RESEARCH_TEAM_REFERENCE',
    annotator_1: {
      annotator_id: 'ANN_LEGAL_01',
      annotator_role: 'DPDP Legal Counsel',
      verdict: 'SUPPORTED',
      confidence: 0.92,
      reasoning: 'Automated validation satisfies fiduciary obligation to ensure data accuracy when data is used to make decisions affecting the principal.',
      timestamp: '2026-10-22T14:45:00Z',
      cited_clauses: ['Section 8(3)'],
    },
    annotator_2: {
      annotator_id: 'ANN_AUDIT_02',
      annotator_role: 'Compliance Lead Auditor',
      verdict: 'SUPPORTED',
      confidence: 0.92,
      reasoning: 'Data quality checks and validation pipelines verified in infrastructure design.',
      timestamp: '2026-10-22T16:15:00Z',
      cited_clauses: ['Section 8(3)'],
    },
    dataset_version: '2.0.0-research',
  },
];

/**
 * Builds the canonical evaluation dataset with inter-annotator agreement metrics.
 */
export function buildCanonicalEvaluationDataset(): EvaluationDataset {
  const cases = CANONICAL_20_DPDP_EVALUATION_CASES;

  // Extract dual-annotated pairs for Cohen's Kappa
  const ann1Verdicts: ComplianceVerdict[] = [];
  const ann2Verdicts: ComplianceVerdict[] = [];

  for (const c of cases) {
    if (c.annotator_1 && c.annotator_2) {
      ann1Verdicts.push(c.annotator_1.verdict);
      ann2Verdicts.push(c.annotator_2.verdict);
    }
  }

  const kappaResult = calculateCohensKappa(ann1Verdicts, ann2Verdicts);

  const metadata: EvaluationDatasetMetadata = {
    dataset_name: 'TrustForge DPDP Evaluation Dataset (Provisional Demonstration Reference)',
    dataset_version: '2.0.0-provisional',
    created_at: '2026-10-22T00:00:00Z',
    updated_at: '2026-10-28T22:30:00Z',
    jurisdiction: 'India',
    governing_law: 'Digital Personal Data Protection Act, 2023 & DPDP Rules, 2025',
    total_cases: cases.length,
    annotators: {
      annotator_1: {
        id: 'ANN_LEGAL_01',
        role: 'Calibrated Legal Heuristic Baseline (Demonstration)',
        description: 'Algorithmic research baseline simulating legal interpretation for computational verification.',
      },
      annotator_2: {
        id: 'ANN_AUDIT_02',
        role: 'Calibrated Audit Heuristic Baseline (Demonstration)',
        description: 'Algorithmic research baseline simulating compliance auditor verification.',
      },
      adjudicator: {
        id: 'ADJ_SUPERVISOR_01',
        role: 'Dispute Resolution Heuristic (Demonstration)',
        description: 'Calibrated rule-based adjudicator resolving demonstration edge-case discrepancies.',
      },
    },
    inter_annotator_agreement: {
      cohens_kappa: kappaResult.kappa,
      percent_agreement: kappaResult.observedAgreement * 100,
      total_paired_cases: kappaResult.totalPairs,
      interpretation: `${kappaResult.interpretation} (Calibrated Demonstration)`,
    },
    review_status_disclosure:
      'PROVISIONAL_RESEARCH_FIXTURE: Reference annotations represent calibrated research baseline fixtures developed for algorithmic pipeline verification. They do not constitute independent double-blind human reviews. Formal external human reviews by independent practitioners remain pending. Blank annotation workbook provided in docs/evaluation/HUMAN_ANNOTATION_WORKBOOK.csv.',
  };

  return { metadata, cases };
}

export const canonicalEvaluationDataset = buildCanonicalEvaluationDataset();

