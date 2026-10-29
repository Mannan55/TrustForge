/**
 * TrustForge Deterministic Trust Score Engine and Consensus Aggregator.
 * Implements:
 *  1. Faculty Research Methodology C1–C10 Compliance Taxonomy (Protiviti Nov 2025 Summary)
 *  2. Normalized Weighted Mean Trust Score with Renormalization (W1 Penalty-Proportional & W2 Equal)
 *  3. Critical-Failure Gating Caps (min(TS, 40) for missing HTTPS or missing privacy notice)
 *  4. Posture Bands: Low (0–39), Moderate (40–59), Good (60–79), Strong (80–100), NOT_SCORABLE
 *  5. Six-Pillar UI Dashboard Projections (Privacy, Security, Transparency, Governance, Lifecycle, Rights)
 *  6. Top-3 Majority Voting Consensus Aggregator
 */

import {
  ComplianceCategoryCode,
  ObligationVerdict,
  WeightScheme,
  PostureBand,
  C10CategoryScore,
  C10TrustScoreComputation,
  TrustScoreComputation,
  PillarScore,
  ModelFinding,
} from '../types/index.js';
import {
  C10_TAXONOMY,
  ALL_C10_CODES,
  W1_WEIGHTS,
  W2_WEIGHTS,
  getCategoryName,
} from './c10Taxonomy.js';
import {
  C10FindingInput,
  convertLegacyFindingToC10,
  projectC10ToSixPillars,
  CANONICAL_CONTROL_TO_C10,
} from './pillarMappingAdapter.js';

export interface CanonicalControl {
  id: string;
  name: string;
  pillar: string;
  weight: number;
  statutory_ref: string;
}

export const CANONICAL_CONTROLS: CanonicalControl[] = [
  // Pillar 1: Privacy Architecture & Notice (0.20)
  { id: 'TF-PRIV-001', name: 'Privacy Notice Itemisation', pillar: 'privacy', weight: 2.0, statutory_ref: 'DPDP Act 2023, Section 5(1)' },
  { id: 'TF-PRIV-002', name: 'Multilingual Notice Availability', pillar: 'privacy', weight: 1.5, statutory_ref: 'DPDP Act 2023, Section 5(3)' },
  { id: 'TF-PRIV-003', name: 'Affirmative Consent Mechanism', pillar: 'privacy', weight: 2.0, statutory_ref: 'DPDP Act 2023, Section 6(1)' },
  { id: 'TF-PRIV-004', name: 'Consent Withdrawal Accessibility', pillar: 'privacy', weight: 1.5, statutory_ref: 'DPDP Act 2023, Section 6(4)' },
  { id: 'TF-PRIV-005', name: 'Specified Lawful Purpose Limitation', pillar: 'privacy', weight: 1.5, statutory_ref: 'DPDP Act 2023, Section 4(1)' },

  // Pillar 2: Security Safeguards (0.20)
  { id: 'TF-SEC-001', name: 'Transport Layer Security (HTTPS/HSTS)', pillar: 'security', weight: 1.5, statutory_ref: 'DPDP Act 2023, Section 8(5)' },
  { id: 'TF-SEC-002', name: 'Defensive Security Headers', pillar: 'security', weight: 1.0, statutory_ref: 'DPDP Act 2023, Section 8(5)' },
  { id: 'TF-SEC-003', name: 'Breach Incident Notification Protocol', pillar: 'security', weight: 2.0, statutory_ref: 'DPDP Act 2023, Section 8(6)' },
  { id: 'TF-SEC-004', name: 'Third-Party Tracker Controls', pillar: 'security', weight: 1.5, statutory_ref: 'DPDP Act 2023, Section 8(5)' },

  // Pillar 3: Transparency & Openness (0.15)
  { id: 'TF-TRANS-001', name: 'Data Protection Officer Contact', pillar: 'transparency', weight: 2.0, statutory_ref: 'DPDP Act 2023, Section 8(9)' },
  { id: 'TF-TRANS-002', name: 'Third-Party Sharing Disclosures', pillar: 'transparency', weight: 1.5, statutory_ref: 'DPDP Act 2023, Section 5(1)(b)' },

  // Pillar 4: Governance & Accountability (0.15)
  { id: 'TF-GOV-001', name: 'Data Processor Contractual Oversight', pillar: 'governance', weight: 2.0, statutory_ref: 'DPDP Act 2023, Section 8(2)' },
  { id: 'TF-GOV-002', name: 'Children Data Protective Safeguards', pillar: 'governance', weight: 2.0, statutory_ref: 'DPDP Act 2023, Section 9(1)' },
  { id: 'TF-GOV-003', name: 'Internal Compliance Recordkeeping', pillar: 'governance', weight: 1.0, statutory_ref: 'DPDP Rules 2025, Rule 7' },

  // Pillar 5: Data Lifecycle Management (0.15)
  { id: 'TF-LIFE-001', name: 'Data Retention and Purpose Cessation', pillar: 'lifecycle', weight: 2.0, statutory_ref: 'DPDP Act 2023, Section 8(7)' },
  { id: 'TF-LIFE-002', name: 'Automated Data Erasure Workflow', pillar: 'lifecycle', weight: 1.5, statutory_ref: 'DPDP Act 2023, Section 12(3)' },
  { id: 'TF-LIFE-003', name: 'Data Minimisation Enforcement', pillar: 'lifecycle', weight: 1.5, statutory_ref: 'DPDP Act 2023, Section 4(2)' },

  // Pillar 6: Data Principal Rights (0.15)
  { id: 'TF-RIGHTS-001', name: 'Right to Access Summary & Identity', pillar: 'rights', weight: 1.5, statutory_ref: 'DPDP Act 2023, Section 11' },
  { id: 'TF-RIGHTS-002', name: 'Right to Correction and Updating', pillar: 'rights', weight: 1.5, statutory_ref: 'DPDP Act 2023, Section 12(1)' },
  { id: 'TF-RIGHTS-003', name: 'Grievance Redressal Mechanism', pillar: 'rights', weight: 2.0, statutory_ref: 'DPDP Act 2023, Section 13' },
];

export const PILLAR_WEIGHTS: Record<string, { name: string; weight: number }> = {
  privacy: { name: 'Privacy Architecture', weight: 0.20 },
  security: { name: 'Security Safeguards', weight: 0.20 },
  transparency: { name: 'Transparency & Notice', weight: 0.15 },
  governance: { name: 'Governance & Accountability', weight: 0.15 },
  lifecycle: { name: 'Data Lifecycle Management', weight: 0.15 },
  rights: { name: 'Data Principal Rights', weight: 0.15 },
};

export const OUTCOME_MULTIPLIERS: Record<string, number> = {
  SUPPORTED: 1.0,
  PASS: 1.0,
  PARTIALLY_SUPPORTED: 0.5,
  POTENTIAL_GAP: 0.5,
  INSUFFICIENT_EVIDENCE: 0.3,
  UNKNOWN: 0.3,
  NOT_SUPPORTED: 0.0,
  FAIL: 0.0,
  NOT_APPLICABLE: -1.0,
};

export interface C10ScoringOptions {
  weightScheme?: WeightScheme;
  hasHttps?: boolean;
  hasPrivacyNotice?: boolean;
  assessmentId?: string;
  enforceGroundingCheck?: boolean;
}

/**
 * Determine Posture Band from Trust Score in [0, 100].
 * Bands per faculty methodology:
 *   0–39: Low
 *   40–59: Moderate
 *   60–79: Good
 *   80–100: Strong
 */
export function determinePostureBand(score: number | null): PostureBand {
  if (score === null || Number.isNaN(score)) return 'NOT_SCORABLE';
  if (score >= 80) return 'Strong';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Moderate';
  return 'Low';
}

/**
 * Normalize and validate an input verdict string.
 * Invalid or unsupported verdicts default to 'NOT_DETERMINABLE' (excluded from scoring).
 * If grounding check failed, verdict is converted to 'NOT_DETERMINABLE'.
 */
function normalizeVerdict(
  rawVerdict: string | undefined,
  isGrounded: boolean | undefined,
  enforceGrounding: boolean = false
): ObligationVerdict {
  // 1. Any finding with failed grounding check (is_grounded === false) is strictly excluded
  if (isGrounded === false) {
    return 'NOT_DETERMINABLE';
  }

  // 2. In strict enforcement mode, missing/undefined grounding cannot enter the scoring engine
  if (enforceGrounding && isGrounded !== true) {
    return 'NOT_DETERMINABLE';
  }

  if (!rawVerdict) return 'NOT_DETERMINABLE';
  const v = rawVerdict.toUpperCase().trim();

  if (v === 'COMPLIANT' || v === 'SUPPORTED' || v === 'PASS') {
    return 'COMPLIANT';
  }
  if (v === 'PARTIAL' || v === 'PARTIALLY_SUPPORTED' || v === 'POTENTIAL_GAP') {
    return 'PARTIAL';
  }
  if (v === 'NON_COMPLIANT' || v === 'NOT_SUPPORTED' || v === 'FAIL') {
    return 'NON_COMPLIANT';
  }
  if (v === 'NOT_APPLICABLE' || v === 'NA') {
    return 'NOT_APPLICABLE';
  }
  if (v === 'NOT_DETERMINABLE' || v === 'INSUFFICIENT_EVIDENCE' || v === 'UNKNOWN') {
    return 'NOT_DETERMINABLE';
  }

  // Unsupported or malformed verdict string -> excluded from scoring
  return 'NOT_DETERMINABLE';
}

/**
 * Core Research Trust Score Engine (C1–C10 Obligation Taxonomy).
 * Implements the normalized weighted mean formula from Section 3.2:
 *
 *   TS = 100 * \sum_{k=1}^{10} \tilde{w}_k * \frac{\sum_{i \in O_k} A_i s_i}{\sum_{i \in O_k} A_i}
 *   \tilde{w}_k = \frac{w_k}{\sum_{j: |O_j \cap A| > 0} w_j}
 *
 * Gating rule:
 *   If site has no HTTPS or no privacy notice: TS = min(TS, 40)
 */
export function computeC10TrustScore(
  modelId: string,
  findings: Array<C10FindingInput | ModelFinding>,
  options: C10ScoringOptions = {}
): C10TrustScoreComputation {
  const scheme: WeightScheme = options.weightScheme || 'W1_PENALTY_PROPORTIONAL';
  const baseWeights = scheme === 'W2_EQUAL' ? W2_WEIGHTS : W1_WEIGHTS;
  const enforceGrounding = options.enforceGroundingCheck ?? false;

  // 1. Normalize findings to C10FindingInput
  const normalizedFindings: C10FindingInput[] = findings.map(f => {
    if ('obligation_code' in f && f.obligation_code) {
      const v = normalizeVerdict(f.verdict, f.is_grounded, enforceGrounding);
      return {
        ...f,
        obligation_code: f.obligation_code as ComplianceCategoryCode,
        verdict: v,
      };
    } else {
      // Legacy ModelFinding
      const c10Adapted = convertLegacyFindingToC10(f as ModelFinding);
      const v = normalizeVerdict(c10Adapted.verdict, f.is_grounded, enforceGrounding);
      return {
        ...c10Adapted,
        verdict: v,
      };
    }
  });

  // 2. Group findings by C1..C10 category
  const findingsByCategory = new Map<ComplianceCategoryCode, C10FindingInput[]>();
  for (const code of ALL_C10_CODES) {
    findingsByCategory.set(code, []);
  }
  for (const f of normalizedFindings) {
    const list = findingsByCategory.get(f.obligation_code);
    if (list) {
      list.push(f);
    }
  }

  // 3. Evaluate each category: calculate \sum A_i s_i / \sum A_i
  let sumActiveWeights = 0;
  const categoryScores: Record<ComplianceCategoryCode, C10CategoryScore> = {} as any;
  const activeCategories: ComplianceCategoryCode[] = [];

  let totalApplicableItemsCount = 0;
  let itemsWithObservedEvidenceCount = 0;

  for (const code of ALL_C10_CODES) {
    const catFindings = findingsByCategory.get(code) || [];
    let applicableItems = 0;
    let earnedScoreSum = 0;
    let compliantCount = 0;
    let partialCount = 0;
    let nonCompliantCount = 0;

    for (const item of catFindings) {
      if (item.verdict === 'NOT_DETERMINABLE' || item.verdict === 'NOT_APPLICABLE') {
        item.is_applicable = false;
        item.score_value = 0;
        continue;
      }

      item.is_applicable = true;
      applicableItems++;
      totalApplicableItemsCount++;

      if (item.evidence_ids && item.evidence_ids.length > 0) {
        itemsWithObservedEvidenceCount++;
      }

      if (item.verdict === 'COMPLIANT') {
        earnedScoreSum += 1.0;
        item.score_value = 1.0;
        compliantCount++;
      } else if (item.verdict === 'PARTIAL') {
        earnedScoreSum += 0.5;
        item.score_value = 0.5;
        partialCount++;
      } else if (item.verdict === 'NON_COMPLIANT') {
        earnedScoreSum += 0.0;
        item.score_value = 0.0;
        nonCompliantCount++;
      }
    }

    const isApplicable = applicableItems > 0;
    const catScore = isApplicable
      ? Math.round(((earnedScoreSum / applicableItems) * 100 + Number.EPSILON) * 10) / 10
      : null;

    if (isApplicable) {
      sumActiveWeights += baseWeights[code];
      activeCategories.push(code);
    }

    categoryScores[code] = {
      code,
      name: getCategoryName(code),
      score: catScore,
      is_applicable: isApplicable,
      applicable_items_count: applicableItems,
      compliant_count: compliantCount,
      partial_count: partialCount,
      non_compliant_count: nonCompliantCount,
      base_weight: baseWeights[code],
      renormalized_weight: 0, // Assigned below
      findings: catFindings,
    };
  }

  // Clean up floating point accumulation drift on weight sum (e.g. 0.8000000000000003 -> 0.8)
  sumActiveWeights = Math.round(sumActiveWeights * 10000) / 10000;

  // Edge case: All items excluded / zero applicable categories
  if (sumActiveWeights === 0 || activeCategories.length === 0) {
    const emptyPillars = projectC10ToSixPillars(categoryScores);
    return {
      assessment_id: options.assessmentId,
      model_id: modelId,
      raw_trust_score: null,
      trust_score: null,
      posture: 'NOT_SCORABLE',
      weight_scheme: scheme,
      critical_failure_cap_applied: false,
      critical_failure_reasons: [],
      evidence_coverage: 0,
      category_scores: categoryScores,
      pillar_scores: emptyPillars,
      methodology_version: 'DPDP-2023-RAG-C10-V1',
      computed_at: new Date().toISOString(),
    };
  }

  // 4. Renormalize weights over active categories: \tilde{w}_k = w_k / \sum_{j \in Active} w_j
  let weightedScoreSum = 0;
  for (const code of activeCategories) {
    const cat = categoryScores[code];
    const reweight = baseWeights[code] / sumActiveWeights;
    cat.renormalized_weight = Math.round(reweight * 10000) / 10000;
    weightedScoreSum += (cat.score ?? 0) * reweight;
  }

  // Round raw Trust Score to 1 decimal place using accurate arithmetic
  const rawTrustScore = Math.round((weightedScoreSum + 1e-6) * 10) / 10;
  let finalTrustScore = rawTrustScore;



  // 5. Critical-failure scoring cap
  // "For example, if the site has no HTTPS or no privacy notice, TS = min(TS, 40)."
  let capApplied = false;
  const capReasons: string[] = [];

  // Check verified crawler evidence
  if (options.hasHttps === false) {
    capApplied = true;
    capReasons.push('Verified website evidence confirms lack of active HTTPS transport encryption.');
  }

  if (options.hasPrivacyNotice === false) {
    capApplied = true;
    capReasons.push('Verified website evidence confirms absence of an accessible privacy notice.');
  }

  if (capApplied) {
    finalTrustScore = Math.min(rawTrustScore, 40.0);
  }

  // 6. Posture determination
  const posture = determinePostureBand(finalTrustScore);

  // 7. Evidence coverage calculation
  const evidenceCoveragePct = totalApplicableItemsCount > 0
    ? Math.round((itemsWithObservedEvidenceCount / totalApplicableItemsCount) * 100)
    : 0;

  // 8. Generate 6-pillar projections for UI compatibility
  const pillarScores = projectC10ToSixPillars(categoryScores);

  return {
    assessment_id: options.assessmentId,
    model_id: modelId,
    raw_trust_score: rawTrustScore,
    trust_score: finalTrustScore,
    posture,
    weight_scheme: scheme,
    critical_failure_cap_applied: capApplied,
    critical_failure_reasons: capReasons,
    evidence_coverage: evidenceCoveragePct,
    category_scores: categoryScores,
    pillar_scores: pillarScores,
    methodology_version: 'DPDP-2023-RAG-C10-V1',
    computed_at: new Date().toISOString(),
  };
}

/**
 * Legacy wrapper: Computes Trust Score and bridges both the 6-pillar UI format
 * and the research-aligned C1–C10 score.
 */
export function computeModelTrustScore(
  modelId: string,
  findings: ModelFinding[],
  options: C10ScoringOptions = {}
): TrustScoreComputation {
  // Compute official C10 score
  const c10Result = computeC10TrustScore(modelId, findings, options);

  // Legacy posture compatibility string mapping
  let legacyPosture: 'Strong Alignment' | 'Needs Attention' | 'Potential Gaps' | 'Critical' | 'Not Scorable';
  if (c10Result.trust_score === null) {
    legacyPosture = 'Not Scorable';
  } else if (c10Result.trust_score >= 80) {
    legacyPosture = 'Strong Alignment';
  } else if (c10Result.trust_score >= 65) {
    legacyPosture = 'Needs Attention';
  } else if (c10Result.trust_score >= 50) {
    legacyPosture = 'Potential Gaps';
  } else {
    legacyPosture = 'Critical';
  }

  return {
    model_id: modelId,
    trust_score: c10Result.trust_score,
    raw_trust_score: c10Result.raw_trust_score,
    posture: legacyPosture,
    pillar_scores: c10Result.pillar_scores,
    category_scores: c10Result.category_scores,
    weight_scheme: c10Result.weight_scheme,
    critical_failure_cap_applied: c10Result.critical_failure_cap_applied,
    critical_failure_reasons: c10Result.critical_failure_reasons,
    evidence_coverage: c10Result.evidence_coverage,
    methodology_version: c10Result.methodology_version,
    computed_at: c10Result.computed_at,
  };
}

/**
 * Top-Three Majority Voting Consensus Algorithm.
 * Aggregates findings at the canonical control / category level from the 3 top-ranked models.
 */
export function computeTopThreeMajorityVoting(
  modelRankings: { model_id: string; f1_score?: number | null; grounding_score: number }[],
  allModelFindings: Record<string, ModelFinding[]>,
  options: C10ScoringOptions = {}
): { consensusFindings: ModelFinding[]; consensusScore: TrustScoreComputation } {
  // Sort models by verified grounding score, with F1 as secondary tie-breaker if available
  const sorted = [...modelRankings].sort((a, b) => (b.grounding_score + (b.f1_score ?? 0)) - (a.grounding_score + (a.f1_score ?? 0)));
  const topThree = sorted.slice(0, 3).map(m => m.model_id);

  const consensusFindings: ModelFinding[] = [];

  for (const ctrl of CANONICAL_CONTROLS) {
    const verdicts: ModelFinding['verdict'][] = [];
    const collectedCitations = [];
    const collectedEvidenceIds = new Set<string>();
    const reasons: string[] = [];

    for (const mId of topThree) {
      const fList = allModelFindings[mId] || [];
      const f = fList.find(x => x.control_id === ctrl.id);
      if (f) {
        verdicts.push(f.verdict);
        if (f.legal_citations) collectedCitations.push(...f.legal_citations);
        if (f.evidence_ids) f.evidence_ids.forEach(id => collectedEvidenceIds.add(id));
        if (f.reasoning_summary) reasons.push(`[${mId}] ${f.reasoning_summary}`);
      } else {
        verdicts.push('INSUFFICIENT_EVIDENCE');
      }
    }

    // Determine majority verdict
    const freq: Record<string, number> = {};
    for (const v of verdicts) {
      freq[v] = (freq[v] || 0) + 1;
    }

    let consensusVerdict: 'SUPPORTED' | 'PARTIALLY_SUPPORTED' | 'NOT_SUPPORTED' | 'INSUFFICIENT_EVIDENCE' | 'NOT_APPLICABLE' = 'INSUFFICIENT_EVIDENCE';
    let maxVotes = 0;
    for (const [v, count] of Object.entries(freq)) {
      if (count > maxVotes) {
        maxVotes = count;
        consensusVerdict = v as any;
      }
    }

    // If 3-way tie, choose the more conservative assessment
    if (maxVotes === 1 && verdicts.length === 3) {
      if (verdicts.includes('NOT_SUPPORTED')) consensusVerdict = 'NOT_SUPPORTED';
      else if (verdicts.includes('PARTIALLY_SUPPORTED')) consensusVerdict = 'PARTIALLY_SUPPORTED';
      else consensusVerdict = 'INSUFFICIENT_EVIDENCE';
    }

    consensusFindings.push({
      model_id: 'TOP3_CONSENSUS',
      control_id: ctrl.id,
      verdict: consensusVerdict,
      confidence: Math.round((maxVotes / Math.max(1, topThree.length)) * 100) / 100,
      legal_citations: collectedCitations.slice(0, 3),
      evidence_ids: Array.from(collectedEvidenceIds),
      reasoning_summary: reasons.join(' | ') || 'Consensus reached across top 3 benchmarked models.',
      identified_gaps: [],
      remediation_steps: [
        `Align policies with ${ctrl.statutory_ref} requirements.`
      ],
      is_grounded: true,
      grounding_score: 1.0,
    });
  }

  const consensusScore = computeModelTrustScore('TOP3_CONSENSUS', consensusFindings, options);
  consensusScore.is_consensus = true;

  return { consensusFindings, consensusScore };
}
