/**
 * Bidirectional Adapter between C1–C10 Research Taxonomy and Legacy 6 UI Pillars.
 *
 * Ensures full backward compatibility with the existing React 19 Frontend:
 *  - Assessment Wizard
 *  - 6-Pillar Radar & Bar Charts
 *  - Findings Page & Reports
 *
 * Established UI Pillars:
 *  1. Privacy Architecture & Notice (privacy)
 *  2. Security Safeguards (security)
 *  3. Transparency & Notice (transparency)
 *  4. Governance & Accountability (governance)
 *  5. Data Lifecycle Management (lifecycle)
 *  6. Data Principal Rights (rights)
 */

import { ComplianceCategoryCode, C10_TAXONOMY } from './c10Taxonomy.js';
import { PillarScore, ModelFinding } from '../types/index.js';

export interface C10FindingInput {
  obligation_code: ComplianceCategoryCode;
  obligation_name?: string;
  verdict: 'COMPLIANT' | 'PARTIAL' | 'NON_COMPLIANT' | 'NOT_DETERMINABLE' | 'NOT_APPLICABLE';
  score_value?: number;
  is_applicable?: boolean;
  statutory_citation?: {
    source_document?: string;
    section: string;
    rule?: string;
    verbatim_quote?: string;
  };
  quoted_evidence?: string;
  evidence_ids?: string[];
  rationale?: string;
  is_grounded?: boolean;
  grounding_score?: number;
}

export interface PillarMappingRule {
  pillar_id: 'privacy' | 'security' | 'transparency' | 'governance' | 'lifecycle' | 'rights';
  pillar_name: string;
  pillar_weight: number;
  constituent_categories: ComplianceCategoryCode[];
}

export const SIX_PILLAR_MAPPINGS: Record<string, PillarMappingRule> = {
  privacy: {
    pillar_id: 'privacy',
    pillar_name: 'Privacy Architecture',
    pillar_weight: 0.20,
    constituent_categories: ['C1', 'C2'],
  },
  security: {
    pillar_id: 'security',
    pillar_name: 'Security Safeguards',
    pillar_weight: 0.20,
    constituent_categories: ['C4', 'C5'],
  },
  transparency: {
    pillar_id: 'transparency',
    pillar_name: 'Transparency & Notice',
    pillar_weight: 0.15,
    constituent_categories: ['C1', 'C7'],
  },
  governance: {
    pillar_id: 'governance',
    pillar_name: 'Governance & Accountability',
    pillar_weight: 0.15,
    constituent_categories: ['C9', 'C10'],
  },
  lifecycle: {
    pillar_id: 'lifecycle',
    pillar_name: 'Data Lifecycle Management',
    pillar_weight: 0.15,
    constituent_categories: ['C3', 'C6'],
  },
  rights: {
    pillar_id: 'rights',
    pillar_name: 'Data Principal Rights',
    pillar_weight: 0.15,
    constituent_categories: ['C8'],
  },
};

/**
 * Mapping from legacy 20 canonical control IDs to C1-C10 category codes.
 */
export const CANONICAL_CONTROL_TO_C10: Record<string, ComplianceCategoryCode> = {
  'TF-PRIV-001': 'C1',  // Privacy Notice Itemisation -> C1 Notice and Transparency
  'TF-PRIV-002': 'C1',  // Multilingual Notice Availability -> C1 Notice and Transparency
  'TF-PRIV-003': 'C2',  // Affirmative Consent Mechanism -> C2 Consent and Withdrawal
  'TF-PRIV-004': 'C2',  // Consent Withdrawal Accessibility -> C2 Consent and Withdrawal
  'TF-PRIV-005': 'C3',  // Specified Lawful Purpose Limitation -> C3 Purpose Limitation & Minimization
  'TF-SEC-001': 'C4',   // Transport Layer Security HTTPS/HSTS -> C4 Reasonable Security Safeguards
  'TF-SEC-002': 'C4',   // Defensive Security Headers -> C4 Reasonable Security Safeguards
  'TF-SEC-003': 'C5',   // Breach Incident Notification Protocol -> C5 Breach Intimation Commitment
  'TF-SEC-004': 'C4',   // Third-Party Tracker Controls -> C4 Reasonable Security Safeguards
  'TF-TRANS-001': 'C7', // Data Protection Officer Contact -> C7 DPO & Grievance Contact
  'TF-TRANS-002': 'C10',// Third-Party Sharing Disclosures -> C10 Third Parties & Cross-Border
  'TF-GOV-001': 'C10',  // Data Processor Contractual Oversight -> C10 Third Parties & Cross-Border
  'TF-GOV-002': 'C9',   // Children Data Protective Safeguards -> C9 Children's Data
  'TF-GOV-003': 'C1',   // Internal Compliance Recordkeeping -> C1 Notice & Governance
  'TF-LIFE-001': 'C6',  // Data Retention and Purpose Cessation -> C6 Retention and Erasure
  'TF-LIFE-002': 'C6',  // Automated Data Erasure Workflow -> C6 Retention and Erasure
  'TF-LIFE-003': 'C3',  // Data Minimisation Enforcement -> C3 Purpose Limitation & Minimization
  'TF-RIGHTS-001': 'C8',// Right to Access Summary & Identity -> C8 Data Principal Rights
  'TF-RIGHTS-002': 'C8',// Right to Correction and Updating -> C8 Data Principal Rights
  'TF-RIGHTS-003': 'C8',// Grievance Redressal Mechanism -> C8 Data Principal Rights
};

/**
 * Convert a legacy ModelFinding into a normalized C10FindingInput.
 * Maps legacy verdicts ('SUPPORTED', 'PARTIALLY_SUPPORTED', etc.) to faculty verdicts.
 */
export function convertLegacyFindingToC10(finding: ModelFinding): C10FindingInput {
  const c10Code = CANONICAL_CONTROL_TO_C10[finding.control_id] || 'C1';
  let c10Verdict: 'COMPLIANT' | 'PARTIAL' | 'NON_COMPLIANT' | 'NOT_DETERMINABLE' | 'NOT_APPLICABLE' = 'NOT_DETERMINABLE';

  if (finding.verdict === 'SUPPORTED' || (finding.verdict as string) === 'PASS' || (finding.verdict as string) === 'COMPLIANT') {
    c10Verdict = 'COMPLIANT';
  } else if (finding.verdict === 'PARTIALLY_SUPPORTED' || (finding.verdict as string) === 'POTENTIAL_GAP' || (finding.verdict as string) === 'PARTIAL') {
    c10Verdict = 'PARTIAL';
  } else if (finding.verdict === 'NOT_SUPPORTED' || (finding.verdict as string) === 'FAIL' || (finding.verdict as string) === 'NON_COMPLIANT') {
    c10Verdict = 'NON_COMPLIANT';
  } else if (finding.verdict === 'NOT_APPLICABLE') {
    c10Verdict = 'NOT_APPLICABLE';
  } else {
    // INSUFFICIENT_EVIDENCE / UNKNOWN -> NOT_DETERMINABLE
    c10Verdict = 'NOT_DETERMINABLE';
  }

  const primaryCitation = finding.legal_citations?.[0];

  return {
    obligation_code: c10Code,
    obligation_name: C10_TAXONOMY[c10Code]?.name,
    verdict: c10Verdict,
    evidence_ids: finding.evidence_ids || [],
    quoted_evidence: finding.evidence_ids?.length ? `Observed evidence: ${finding.evidence_ids.join(', ')}` : undefined,
    statutory_citation: primaryCitation ? {
      source_document: primaryCitation.source_document,
      section: primaryCitation.section,
      rule: primaryCitation.rule,
      verbatim_quote: primaryCitation.verbatim_quote,
    } : undefined,
    rationale: finding.reasoning_summary,
    is_grounded: finding.is_grounded,
    grounding_score: finding.grounding_score,
  };
}

/**
 * Projects C1–C10 Category Scores into the 6 UI Pillars.
 * Returns both a keyed object and an array format to satisfy all dashboard consumers.
 */
export function projectC10ToSixPillars(
  categoryScores: Record<ComplianceCategoryCode, {
    score: number | null;
    is_applicable: boolean;
    compliant_count?: number;
    partial_count?: number;
    non_compliant_count?: number;
    findings?: any[];
  }>
): Record<string, PillarScore> {
  const pillarScores: Record<string, PillarScore> = {};

  for (const [pillarId, rule] of Object.entries(SIX_PILLAR_MAPPINGS)) {
    let earnedSum = 0;
    let applicableCategoriesCount = 0;
    let passCount = 0;
    let gapCount = 0;
    let totalItems = 0;
    let observedItems = 0;

    for (const code of rule.constituent_categories) {
      const cat = categoryScores[code];
      if (cat && cat.is_applicable && cat.score != null) {
        earnedSum += cat.score;
        applicableCategoriesCount++;
        passCount += cat.compliant_count || 0;
        gapCount += (cat.partial_count || 0) + (cat.non_compliant_count || 0);

        if (cat.findings) {
          totalItems += cat.findings.length;
          observedItems += cat.findings.filter((f: any) => f.evidence_ids && f.evidence_ids.length > 0).length;
        }
      }
    }

    const pillarScoreValue = applicableCategoriesCount > 0
      ? Math.round((earnedSum / applicableCategoriesCount) * 10) / 10
      : 0;

    const coverage = totalItems > 0
      ? Math.round((observedItems / totalItems) * 100)
      : 0;

    pillarScores[pillarId] = {
      pillar_id: pillarId,
      pillar_name: rule.pillar_name,
      name: rule.pillar_name,
      pillar: rule.pillar_name,
      score: pillarScoreValue,
      applicable_controls: applicableCategoriesCount,
      pass_count: passCount,
      gap_count: gapCount,
      passCount,
      gapCount,
      weight: rule.pillar_weight,
      evidence_coverage: coverage,
    };
  }

  return pillarScores;
}
