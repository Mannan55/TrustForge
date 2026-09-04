import { AssessmentQuestion, AssessmentSection } from '../types';

export const ASSESSMENT_SECTIONS: AssessmentSection[] = [
  { id: 1, title: 'Welcome', description: 'Overview of TrustForge TEF baseline assessment framework.', questionIds: [] },
  { id: 2, title: 'Organization Context', description: 'Legal entity setup, MCA Corporate ID (CIN), and Grievance Officer designation.', questionIds: ['q_cin', 'q_dpo'] },
  { id: 3, title: 'Website & Infrastructure', description: 'Public web endpoints, SSL tls enforcement, and detected cloud integrations.', questionIds: ['q_web', 'q_integrations'] },
  { id: 4, title: 'Data Collection & Processing', description: 'Categories of personal data processed across Indian operations.', questionIds: ['q_channels'] },
  { id: 5, title: 'Personal Data Categories', description: 'Sensitivity of personal identifiers, financial data, and biometric markers.', questionIds: ['q_categories'] },
  { id: 6, title: 'Purpose of Processing', description: 'Lawful basis and specified purpose limitations under DPDP Section 4.', questionIds: ['q_purposes'] },
  { id: 7, title: 'Notice & Consent Mechanisms', description: 'Clear, itemized notice availability in English and 8th Schedule Indian languages.', questionIds: ['q_languages', 'q_optin'] },
  { id: 8, title: 'Data Retention & Erasure', description: 'Retention schedules, purpose completion policies, and erasure protocols (Sec 8(7)).', questionIds: ['q_retention'] },
  { id: 9, title: 'Data Principal Rights', description: 'Right to access, correction, erasure, and grievance redressal mechanism (Sec 11-14).', questionIds: ['q_rights'] },
  { id: 10, title: 'Security Practices', description: 'AES-256 encryption at rest, TLS 1.3 in transit, and CERT-In 6-hour breach reporting.', questionIds: ['q_security'] },
  { id: 11, title: 'Third-Party Processors', description: 'Data Processor contracts, DPDP liability clauses, and Indian cloud data residency.', questionIds: ['q_vendors'] },
  { id: 12, title: 'Policies & Evidence', description: 'Evidence Document Uploader (PDF, DOCX, scan images up to 25MB).', questionIds: [] },
  { id: 13, title: 'Review & Verification', description: 'Review answered statements and verified digital evidence before scoring.', questionIds: [] },
  { id: 14, title: 'Assessment Result', description: 'Final computed posture score and prioritized gap remediation roadmap.', questionIds: [] }
];

export const STEP_EXPLANATIONS: Record<number, { why: string; dpdpContext: string }> = {
  2: {
    why: 'Verifies the legal identity of your Indian entity to ensure governance transparency.',
    dpdpContext: 'DPDP Section 8(9) mandates designated Grievance Officers for Data Fiduciaries operating in India.'
  },
  3: {
    why: 'Audits public endpoint integrations that may inadvertently expose user data to third parties.',
    dpdpContext: 'Data Fiduciaries remain liable for unvetted third-party scripts loaded on public domains.'
  },
  4: {
    why: 'Maps data collection channels (e.g. mobile apps, web forms, offline counters).',
    dpdpContext: 'DPDP Section 4 requires purpose specification at every collection point.'
  },
  5: {
    why: 'Determines the sensitivity tier of data processed to apply appropriate security controls.',
    dpdpContext: 'Processing sensitive categories like financial or biometric identifiers triggers enhanced audit rules.'
  },
  6: {
    why: 'Prevents scope creep and unauthorized secondary usage of personal data.',
    dpdpContext: 'DPDP Section 4(1) restricts processing strictly to the purpose for which consent was given.'
  },
  7: {
    why: 'Ensures Data Principals across India can comprehend privacy terms in their native language.',
    dpdpContext: 'DPDP Section 5(3) guarantees right to access notice in English or any 8th Schedule Indian language.'
  },
  8: {
    why: 'Prevents indefinite retention of inactive user data in cloud databases.',
    dpdpContext: 'DPDP Section 8(7) mandates erasure when purpose is fulfilled, subject to Income Tax Act retention laws.'
  },
  9: {
    why: 'Evaluates your operational capability to fulfill user data access or erasure requests.',
    dpdpContext: 'DPDP Sections 11-14 guarantee Data Principal rights to summary, correction, and grievance resolution.'
  },
  10: {
    why: 'Validates technical encryption controls and incident response SLA.',
    dpdpContext: 'DPDP Section 8(5) requires reasonable security safeguards; CERT-In mandates 6-hour breach reporting.'
  },
  11: {
    why: 'Ensures vendor contracts enforce data processing boundaries and localization.',
    dpdpContext: 'DPDP Section 8(2) requires formal Data Processing Agreements with all third-party vendors.'
  }
};
