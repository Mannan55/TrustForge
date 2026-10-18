/**
 * Deterministic Trust Score Engine and Top-3 Majority Voting Consensus Aggregator.
 * Implements the verified mathematical formulation bit-for-bit with the Python baseline.
 */
import { ControlStatus, ModelFinding, PillarScore, TrustScoreComputation } from '../types/index.js';

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
  NOT_APPLICABLE: -1.0, // Excluded sentinel
};

export function computeModelTrustScore(
  modelId: string,
  findings: ModelFinding[]
): TrustScoreComputation {
  const findingMap = new Map<string, ModelFinding>();
  for (const f of findings) {
    findingMap.set(f.control_id, f);
  }

  const pillarScores: Record<string, PillarScore> = {};
  let totalEffectiveWeight = 0;
  let weightedScoreSum = 0;
  let assessableControlsCount = 0;
  let observedEvidenceCount = 0;

  for (const [pillarId, meta] of Object.entries(PILLAR_WEIGHTS)) {
    const controlsInPillar = CANONICAL_CONTROLS.filter(c => c.pillar === pillarId);
    let pillarApplicableWeight = 0;
    let pillarEarnedWeight = 0;
    let passCount = 0;
    let gapCount = 0;

    for (const ctrl of controlsInPillar) {
      const finding = findingMap.get(ctrl.id);
      const verdict = finding ? finding.verdict : 'INSUFFICIENT_EVIDENCE';
      const multiplier = OUTCOME_MULTIPLIERS[verdict] ?? 0.3;

      if (verdict !== 'NOT_APPLICABLE' && multiplier >= 0) {
        pillarApplicableWeight += ctrl.weight;
        pillarEarnedWeight += ctrl.weight * multiplier;
        assessableControlsCount++;

        if (multiplier >= 1.0) passCount++;
        else if (multiplier <= 0.5) gapCount++;

        if (finding && finding.evidence_ids && finding.evidence_ids.length > 0) {
          observedEvidenceCount++;
        }
      }
    }

    if (pillarApplicableWeight > 0) {
      const score = Math.round((pillarEarnedWeight / pillarApplicableWeight) * 100 * 100) / 100;
      pillarScores[pillarId] = {
        pillar_id: pillarId,
        pillar_name: meta.name,
        score,
        applicable_controls: controlsInPillar.length,
        pass_count: passCount,
        gap_count: gapCount,
        passCount,
        gapCount,
        weight: meta.weight,
      };
      weightedScoreSum += score * meta.weight;
      totalEffectiveWeight += meta.weight;
    } else {
      pillarScores[pillarId] = {
        pillar_id: pillarId,
        pillar_name: meta.name,
        score: 0,
        applicable_controls: 0,
        pass_count: 0,
        gap_count: 0,
        passCount: 0,
        gapCount: 0,
        weight: 0,
      };
    }
  }

  // Edge case: All controls are NOT_APPLICABLE
  if (totalEffectiveWeight === 0 || assessableControlsCount === 0) {
    return {
      model_id: modelId,
      trust_score: null,
      posture: 'Not Scorable',
      pillar_scores: pillarScores,
      evidence_coverage: 0,
    };
  }

  // Renormalize if some pillars were entirely N/A
  const normalizedTrustScore = Math.round((weightedScoreSum / totalEffectiveWeight) * 100) / 100;

  let posture: 'Strong Alignment' | 'Needs Attention' | 'Potential Gaps' | 'Critical';
  if (normalizedTrustScore >= 80) posture = 'Strong Alignment';
  else if (normalizedTrustScore >= 65) posture = 'Needs Attention';
  else if (normalizedTrustScore >= 50) posture = 'Potential Gaps';
  else posture = 'Critical';

  const evidenceCoverage = Math.round((observedEvidenceCount / assessableControlsCount) * 100 * 100) / 100;

  return {
    model_id: modelId,
    trust_score: normalizedTrustScore,
    posture,
    pillar_scores: pillarScores,
    evidence_coverage: evidenceCoverage,
  };
}

/**
 * Top-Three Majority Voting Consensus Algorithm
 * Aggregates verdicts at the canonical control level from the 3 top-ranked models.
 */
export function computeTopThreeMajorityVoting(
  modelRankings: { model_id: string; f1_score: number; grounding_score: number }[],
  allModelFindings: Record<string, ModelFinding[]>
): { consensusFindings: ModelFinding[]; consensusScore: TrustScoreComputation } {
  // Sort models by F1 score, then grounding score
  const sorted = [...modelRankings].sort((a, b) => (b.f1_score + b.grounding_score) - (a.f1_score + a.grounding_score));
  const topThree = sorted.slice(0, 3).map(m => m.model_id);

  const consensusFindings: ModelFinding[] = [];

  for (const ctrl of CANONICAL_CONTROLS) {
    const verdicts: ('SUPPORTED' | 'PARTIALLY_SUPPORTED' | 'NOT_SUPPORTED' | 'INSUFFICIENT_EVIDENCE' | 'NOT_APPLICABLE')[] = [];
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
      confidence: Math.round((maxVotes / 3) * 100) / 100,
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

  const consensusScore = computeModelTrustScore('TOP3_CONSENSUS', consensusFindings);
  consensusScore.is_consensus = true;

  return { consensusFindings, consensusScore };
}
