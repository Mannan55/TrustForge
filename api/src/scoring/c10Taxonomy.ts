/**
 * TrustForge C1–C10 DPDP Compliance Obligation Taxonomy.
 * Based on the research methodology established by Dr. Neelam Naik
 * and the DPDP Act 2023 / Rules 2025 summary by Protiviti (Nov 2025).
 *
 * Each category defines:
 *  - Canonical code (C1–C10)
 *  - Statutory basis in the DPDP Act 2023 & DPDP Rules 2025 (verified against Official Gazette)
 *  - Observable evidence requirements
 *  - Penalty ceiling under the Schedule to DPDP Act 2023
 *  - Weighting schemes W1 (Penalty-Proportional) and W2 (Equal)
 *  - Mapping to existing 6 UI dashboard pillars
 */

export type ComplianceCategoryCode =
  | 'C1'
  | 'C2'
  | 'C3'
  | 'C4'
  | 'C5'
  | 'C6'
  | 'C7'
  | 'C8'
  | 'C9'
  | 'C10';

export type ObligationVerdict =
  | 'COMPLIANT'
  | 'PARTIAL'
  | 'NON_COMPLIANT'
  | 'NOT_DETERMINABLE'
  | 'NOT_APPLICABLE';

export type WeightScheme = 'W1_PENALTY_PROPORTIONAL' | 'W2_EQUAL';

export type PostureBand = 'Low' | 'Moderate' | 'Good' | 'Strong' | 'NOT_SCORABLE';

export interface ObligationDefinition {
  id: string; // e.g. 'C1-OBL-1' or category code 'C1'
  category_code: ComplianceCategoryCode;
  title: string;
  description: string;
  statutory_ref: string;
  rules_ref: string;
  evidence_required: string[];
}

export interface C10CategoryDefinition {
  code: ComplianceCategoryCode;
  name: string;
  statutory_basis: string;
  rules_basis: string;
  penalty_ceiling_cr: number; // Penalty ceiling in INR Crores under Section 33(1) Schedule
  evidence_checked: string;
  default_weight_w1: number;
  default_weight_w2: number;
  mapped_pillar_id: 'privacy' | 'security' | 'transparency' | 'governance' | 'lifecycle' | 'rights';
  mapped_pillar_name: string;
  obligations: ObligationDefinition[];
}

/**
 * Total penalty ceiling sum across all ten categories = ₹1,000 Crore.
 * W1 (Penalty-Proportional) assigns weights proportional to the statutory ceiling:
 *  - C4 (Security): ₹250 cr / ₹1000 cr = 0.25
 *  - C5 (Breach Notification): ₹200 cr / ₹1000 cr = 0.20
 *  - C9 (Children's Data): ₹200 cr / ₹1000 cr = 0.20
 *  - Remaining 7 categories (C1, C2, C3, C6, C7, C8, C10): ₹50 cr / ₹1000 cr = 0.05 each
 * Total = 0.25 + 0.20 + 0.20 + (7 * 0.05) = 1.00
 */
export const C10_TAXONOMY: Record<ComplianceCategoryCode, C10CategoryDefinition> = {
  C1: {
    code: 'C1',
    name: 'Notice and Transparency',
    statutory_basis: 'DPDP Act 2023, Section 5',
    rules_basis: 'DPDP Rules 2025, Rule 3',
    penalty_ceiling_cr: 50,
    evidence_checked: 'Privacy policy exists; standalone; itemised personal data collected; specified purpose; rights described; withdrawal mechanism stated; Board complaint route indicated.',
    default_weight_w1: 0.05,
    default_weight_w2: 0.10,
    mapped_pillar_id: 'privacy',
    mapped_pillar_name: 'Privacy Architecture & Notice',
    obligations: [
      {
        id: 'C1-OBL-1',
        category_code: 'C1',
        title: 'Privacy Notice Availability & Standalone Notice',
        description: 'A privacy notice must be publicly accessible, standalone, and easily discoverable before or at the time of data collection.',
        statutory_ref: 'DPDP Act 2023, Section 5(1)',
        rules_ref: 'DPDP Rules 2025, Rule 3(1)',
        evidence_required: ['privacy_policy_link', 'privacy_policy_accessible'],
      },
      {
        id: 'C1-OBL-2',
        category_code: 'C1',
        title: 'Itemised Data Categories & Purpose Specification',
        description: 'Notice must explicitly itemise categories of personal data processed and specific lawful purposes.',
        statutory_ref: 'DPDP Act 2023, Section 5(1)(a)',
        rules_ref: 'DPDP Rules 2025, Rule 3(2)',
        evidence_required: ['itemised_data_categories', 'processing_purposes'],
      },
      {
        id: 'C1-OBL-3',
        category_code: 'C1',
        title: 'Rights, Withdrawal & Board Complaint Route',
        description: 'Notice must inform Data Principals of rights, withdrawal mechanism, and right to lodge a complaint with the Data Protection Board of India.',
        statutory_ref: 'DPDP Act 2023, Section 5(1)(b)-(c)',
        rules_ref: 'DPDP Rules 2025, Rule 3(3)',
        evidence_required: ['rights_statement', 'board_complaint_route'],
      },
    ],
  },
  C2: {
    code: 'C2',
    name: 'Consent and Withdrawal',
    statutory_basis: 'DPDP Act 2023, Section 6',
    rules_basis: 'DPDP Rules 2025, Rule 3(3), Rule 4',
    penalty_ceiling_cr: 50,
    evidence_checked: 'Banner appears before non-essential cookies are set; affirmative opt-in with no pre-ticked boxes; consent withdrawal mechanism is as easy as giving consent.',
    default_weight_w1: 0.05,
    default_weight_w2: 0.10,
    mapped_pillar_id: 'privacy',
    mapped_pillar_name: 'Privacy Architecture & Notice',
    obligations: [
      {
        id: 'C2-OBL-1',
        category_code: 'C2',
        title: 'Prior Consent for Non-Essential Cookies & Trackers',
        description: 'No non-essential cookies, trackers, or beacons set prior to unambiguous affirmative consent.',
        statutory_ref: 'DPDP Act 2023, Section 6(1)',
        rules_ref: 'DPDP Rules 2025, Rule 4',
        evidence_required: ['pre_consent_cookies', 'consent_banner_observed'],
      },
      {
        id: 'C2-OBL-2',
        category_code: 'C2',
        title: 'Affirmative Action Without Pre-Ticked Defaults',
        description: 'Consent must be free, specific, informed, and unconditional via clear affirmative action with no pre-selected options.',
        statutory_ref: 'DPDP Act 2023, Section 6(2)',
        rules_ref: 'DPDP Rules 2025, Rule 4',
        evidence_required: ['consent_banner_defaults', 'pre_ticked_boxes'],
      },
      {
        id: 'C2-OBL-3',
        category_code: 'C2',
        title: 'Comparable Ease of Consent Withdrawal',
        description: 'Data Principals must be enabled to withdraw consent with the same ease as giving it.',
        statutory_ref: 'DPDP Act 2023, Section 6(4)',
        rules_ref: 'DPDP Rules 2025, Rule 4(3)',
        evidence_required: ['withdrawal_mechanism', 'cookie_preferences_revisit'],
      },
    ],
  },
  C3: {
    code: 'C3',
    name: 'Purpose Limitation and Data Minimization',
    statutory_basis: 'DPDP Act 2023, Section 6(1), Section 4(1)-(2)',
    rules_basis: 'DPDP Rules 2025, Rule 3(2)',
    penalty_ceiling_cr: 50,
    evidence_checked: 'Form fields and data collected are strictly proportionate and necessary to the stated processing purpose.',
    default_weight_w1: 0.05,
    default_weight_w2: 0.10,
    mapped_pillar_id: 'lifecycle',
    mapped_pillar_name: 'Data Lifecycle Management',
    obligations: [
      {
        id: 'C3-OBL-1',
        category_code: 'C3',
        title: 'Form Field Proportionality & Data Minimization',
        description: 'Registration, contact, and checkout input forms must collect only data strictly necessary for the transaction.',
        statutory_ref: 'DPDP Act 2023, Section 6(1)',
        rules_ref: 'DPDP Rules 2025, Rule 3(2)',
        evidence_required: ['form_fields_observed', 'mandatory_fields_ratio'],
      },
    ],
  },
  C4: {
    code: 'C4',
    name: 'Reasonable Security Safeguards',
    statutory_basis: 'DPDP Act 2023, Section 8(5)',
    rules_basis: 'DPDP Rules 2025, Rule 6',
    penalty_ceiling_cr: 250, // Section 33(1) Schedule, Item 1: Up to ₹250 cr for breach of duty to protect
    evidence_checked: 'HTTPS/TLS version, HSTS, CSP and defensive security headers, Secure/HttpOnly/SameSite cookie flags, no mixed content, published security safeguards statement.',
    default_weight_w1: 0.25,
    default_weight_w2: 0.10,
    mapped_pillar_id: 'security',
    mapped_pillar_name: 'Security Safeguards',
    obligations: [
      {
        id: 'C4-OBL-1',
        category_code: 'C4',
        title: 'Transport Encryption & HSTS Enforcement',
        description: 'Enforce HTTPS everywhere with modern TLS (TLS 1.2+) and Strict-Transport-Security header.',
        statutory_ref: 'DPDP Act 2023, Section 8(5)',
        rules_ref: 'DPDP Rules 2025, Rule 6',
        evidence_required: ['https_active', 'hsts_header', 'tls_version'],
      },
      {
        id: 'C4-OBL-2',
        category_code: 'C4',
        title: 'Defensive HTTP Security Headers & Cookie Flags',
        description: 'Deploy defensive headers (CSP, X-Content-Type-Options, X-Frame-Options) and secure cookie attributes (Secure, HttpOnly, SameSite).',
        statutory_ref: 'DPDP Act 2023, Section 8(5)',
        rules_ref: 'DPDP Rules 2025, Rule 6',
        evidence_required: ['security_headers', 'cookie_attributes'],
      },
    ],
  },
  C5: {
    code: 'C5',
    name: 'Breach Intimation Commitment',
    statutory_basis: 'DPDP Act 2023, Section 8(6)',
    rules_basis: 'DPDP Rules 2025, Rule 7',
    penalty_ceiling_cr: 200, // Section 33(1) Schedule, Item 2: Up to ₹200 cr for failure to notify breach
    evidence_checked: 'Published policy commits to notifying the Data Protection Board of India and affected Data Principals without undue delay upon discovery of a personal data breach.',
    default_weight_w1: 0.20,
    default_weight_w2: 0.10,
    mapped_pillar_id: 'security',
    mapped_pillar_name: 'Security Safeguards',
    obligations: [
      {
        id: 'C5-OBL-1',
        category_code: 'C5',
        title: 'Personal Data Breach Notification Commitment',
        description: 'Formal policy commitment and procedure to intimate both the Data Protection Board and affected users in the event of a breach.',
        statutory_ref: 'DPDP Act 2023, Section 8(6)',
        rules_ref: 'DPDP Rules 2025, Rule 7',
        evidence_required: ['breach_notification_policy', 'breach_plan_declared'],
      },
    ],
  },
  C6: {
    code: 'C6',
    name: 'Retention and Erasure',
    statutory_basis: 'DPDP Act 2023, Section 8(7)',
    rules_basis: 'DPDP Rules 2025, Rule 8',
    penalty_ceiling_cr: 50,
    evidence_checked: 'Retention period or objective retention criteria explicitly stated; commitment to erase data when specified purpose ceases or consent is withdrawn.',
    default_weight_w1: 0.05,
    default_weight_w2: 0.10,
    mapped_pillar_id: 'lifecycle',
    mapped_pillar_name: 'Data Lifecycle Management',
    obligations: [
      {
        id: 'C6-OBL-1',
        category_code: 'C6',
        title: 'Defined Retention Criteria & Purpose Cessation Erasure',
        description: 'Personal data must be erased as soon as the purpose of collection is no longer served or upon consent withdrawal.',
        statutory_ref: 'DPDP Act 2023, Section 8(7)',
        rules_ref: 'DPDP Rules 2025, Rule 8',
        evidence_required: ['retention_policy_stated', 'erasure_mechanism'],
      },
    ],
  },
  C7: {
    code: 'C7',
    name: 'Contact Person / DPO and Grievance',
    statutory_basis: 'DPDP Act 2023, Section 8(9)–(10)',
    rules_basis: 'DPDP Rules 2025, Rule 9',
    penalty_ceiling_cr: 50,
    evidence_checked: 'Business identity and contact person or Data Protection Officer (DPO) contact details are published, functioning, and reachable.',
    default_weight_w1: 0.05,
    default_weight_w2: 0.10,
    mapped_pillar_id: 'transparency',
    mapped_pillar_name: 'Transparency & Notice',
    obligations: [
      {
        id: 'C7-OBL-1',
        category_code: 'C7',
        title: 'Data Protection Officer / Grievance Officer Reachability',
        description: 'Publish the business name, address, email, or digital contact channel of the officer responsible for responding to communications.',
        statutory_ref: 'DPDP Act 2023, Section 8(9)-(10)',
        rules_ref: 'DPDP Rules 2025, Rule 9',
        evidence_required: ['dpo_contact_published', 'grievance_officer_named'],
      },
    ],
  },
  C8: {
    code: 'C8',
    name: 'Data Principal Rights',
    statutory_basis: 'DPDP Act 2023, Sections 11–14',
    rules_basis: 'DPDP Rules 2025, Rule 14',
    penalty_ceiling_cr: 50,
    evidence_checked: 'Publish clear mechanisms and procedures for exercising rights: Right to Access Summary & Identity (S.11), Correction & Updating (S.12), Erasure (S.12), Grievance Redressal (S.13), and Nomination (S.14).',
    default_weight_w1: 0.05,
    default_weight_w2: 0.10,
    mapped_pillar_id: 'rights',
    mapped_pillar_name: 'Data Principal Rights',
    obligations: [
      {
        id: 'C8-OBL-1',
        category_code: 'C8',
        title: 'Right to Access Summary, Correction & Erasure Mechanisms',
        description: 'Provide an accessible workflow for Data Principals to request access, correction, completion, updating, and erasure of personal data.',
        statutory_ref: 'DPDP Act 2023, Sections 11, 12',
        rules_ref: 'DPDP Rules 2025, Rule 14',
        evidence_required: ['rights_workflow_published', 'dpar_request_channel'],
      },
      {
        id: 'C8-OBL-2',
        category_code: 'C8',
        title: 'Grievance Redressal Mechanism & Nomination',
        description: 'Maintain readily available grievance redressal mechanisms with response timelines, and support nomination upon death or incapacity.',
        statutory_ref: 'DPDP Act 2023, Sections 13, 14',
        rules_ref: 'DPDP Rules 2025, Rule 14',
        evidence_required: ['grievance_procedure', 'nomination_provision'],
      },
    ],
  },
  C9: {
    code: 'C9',
    name: "Children's Data Safeguards",
    statutory_basis: 'DPDP Act 2023, Section 9',
    rules_basis: 'DPDP Rules 2025, Rule 10',
    penalty_ceiling_cr: 200, // Section 33(1) Schedule, Item 3: Up to ₹200 cr for breach of duties in respect of children
    evidence_checked: 'Age gate, verifiable parental consent mechanism, no tracking or behavioral monitoring of children, and no targeted advertising directed at children (applicable where minors may use the service).',
    default_weight_w1: 0.20,
    default_weight_w2: 0.10,
    mapped_pillar_id: 'governance',
    mapped_pillar_name: 'Governance & Accountability',
    obligations: [
      {
        id: 'C9-OBL-1',
        category_code: 'C9',
        title: 'Verifiable Parental Consent & Child Protection',
        description: 'Obtain verifiable consent of parent/lawful guardian prior to processing child personal data. Prohibit tracking, behavioral monitoring, and targeted ads.',
        statutory_ref: 'DPDP Act 2023, Section 9(1)-(3)',
        rules_ref: 'DPDP Rules 2025, Rule 10',
        evidence_required: ['age_gate_observed', 'parental_consent_mechanism'],
      },
    ],
  },
  C10: {
    code: 'C10',
    name: 'Third Parties and Cross-Border Transfer',
    statutory_basis: 'DPDP Act 2023, Section 8(2), Section 16',
    rules_basis: 'DPDP Rules 2025, Rule 15',
    penalty_ceiling_cr: 50,
    evidence_checked: 'Trackers and third-party data processors disclosed; valid contractual oversight statement; cross-border data transfer disclosures complying with Central Government blacklists/restrictions.',
    default_weight_w1: 0.05,
    default_weight_w2: 0.10,
    mapped_pillar_id: 'governance',
    mapped_pillar_name: 'Governance & Accountability',
    obligations: [
      {
        id: 'C10-OBL-1',
        category_code: 'C10',
        title: 'Processor Engagement & Third-Party Disclosure',
        description: 'Disclose third-party data processors and trackers, ensuring processing occurs only under a valid data processing agreement.',
        statutory_ref: 'DPDP Act 2023, Section 8(2)',
        rules_ref: 'DPDP Rules 2025, Rule 15',
        evidence_required: ['processors_disclosed', 'third_party_trackers_declared'],
      },
      {
        id: 'C10-OBL-2',
        category_code: 'C10',
        title: 'Cross-Border Personal Data Transfer Adherence',
        description: 'Transfer personal data outside India only in accordance with Central Government terms and non-restricted territories.',
        statutory_ref: 'DPDP Act 2023, Section 16',
        rules_ref: 'DPDP Rules 2025, Rule 15',
        evidence_required: ['cross_border_statement', 'data_localization_disclosure'],
      },
    ],
  },
};

export const ALL_C10_CODES: ComplianceCategoryCode[] = [
  'C1',
  'C2',
  'C3',
  'C4',
  'C5',
  'C6',
  'C7',
  'C8',
  'C9',
  'C10',
];

export const W1_WEIGHTS: Record<ComplianceCategoryCode, number> = {
  C1: 0.05,
  C2: 0.05,
  C3: 0.05,
  C4: 0.25,
  C5: 0.20,
  C6: 0.05,
  C7: 0.05,
  C8: 0.05,
  C9: 0.20,
  C10: 0.05,
};

export const W2_WEIGHTS: Record<ComplianceCategoryCode, number> = {
  C1: 0.10,
  C2: 0.10,
  C3: 0.10,
  C4: 0.10,
  C5: 0.10,
  C6: 0.10,
  C7: 0.10,
  C8: 0.10,
  C9: 0.10,
  C10: 0.10,
};

/**
 * Returns the human-readable name of any category code.
 */
export function getCategoryName(code: ComplianceCategoryCode): string {
  return C10_TAXONOMY[code]?.name || code;
}
