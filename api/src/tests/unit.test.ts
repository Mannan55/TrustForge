/**
 * Unit Test Suite for TrustForge Node.js Research Engine.
 * Tests SSRF Guard, Trust Score Engine, Grounding Validator, and Majority Voting.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { validateTargetUrl, setDnsLookupOverride } from '../crawler/ssrfGuard.js';
import {
  CANONICAL_CONTROLS,
  computeModelTrustScore,
  computeTopThreeMajorityVoting,
  computeC10TrustScore,
} from '../scoring/trustScoreEngine.js';
import { ALL_C10_CODES } from '../scoring/c10Taxonomy.js';
import { C10FindingInput } from '../scoring/pillarMappingAdapter.js';
import { GroundingValidator } from '../validator/groundingValidator.js';
import { ModelFinding } from '../types/index.js';


test('SSRF Guard: Rejects loopback, private IPs, and cloud metadata', async () => {
  const loopback = await validateTargetUrl('http://127.0.0.1:8000');
  assert.equal(loopback.isValid, false);

  const localHost = await validateTargetUrl('http://localhost:5173');
  assert.equal(localHost.isValid, false);

  const privateIp = await validateTargetUrl('http://192.168.1.1/admin');
  assert.equal(privateIp.isValid, false);

  const metadata = await validateTargetUrl('http://169.254.169.254/latest/meta-data/');
  assert.equal(metadata.isValid, false);

  const badProto = await validateTargetUrl('ftp://ftp.example.com');
  assert.equal(badProto.isValid, false);
});

test('SSRF Guard: Permits valid public domain (deterministic mock)', async () => {
  // Use deterministic DNS resolver mock to test public domain validation
  // without external DNS/network dependency
  setDnsLookupOverride(async (hostname: string, opts?: any) => {
    if (hostname === 'example.com') {
      const entry = { address: '93.184.216.34', family: 4 };
      return opts?.all ? [entry] : entry;
    }
    return opts?.all ? [{ address: '93.184.216.34', family: 4 }] : { address: '93.184.216.34', family: 4 };
  });

  try {
    const publicUrl = await validateTargetUrl('https://example.com');
    assert.equal(publicUrl.isValid, true, 'Public domain with non-blocked IP must be permitted');
    assert.ok(publicUrl.resolvedIp, 'Resolved IP must be returned');
    assert.equal(publicUrl.resolvedIp, '93.184.216.34');
  } finally {
    setDnsLookupOverride(null);
  }
});

test('SSRF Guard: Rejects public domain that resolves to private IP (DNS rebinding)', async () => {
  // Validates protection against DNS rebinding attacks where a public hostname
  // resolves to a private/internal IP address.
  setDnsLookupOverride(async (hostname: string, opts?: any) => {
    if (hostname === 'evil-rebind.attacker.com') {
      const entry = { address: '169.254.169.254', family: 4 };
      return opts?.all ? [entry] : entry;
    }
    return opts?.all ? [{ address: '169.254.169.254', family: 4 }] : { address: '169.254.169.254', family: 4 };
  });

  try {
    const rebindUrl = await validateTargetUrl('https://evil-rebind.attacker.com');
    assert.equal(rebindUrl.isValid, false, 'DNS rebinding to cloud metadata IP must be blocked');
    assert.ok(rebindUrl.error?.includes('blocked'), 'Error must mention blocked IP');
  } finally {
    setDnsLookupOverride(null);
  }
});

test('Trust Score Engine: All-PASS produces 100 score', () => {
  const findings: ModelFinding[] = CANONICAL_CONTROLS.map(c => ({
    model_id: 'TEST_MODEL',
    control_id: c.id,
    verdict: 'SUPPORTED',
    confidence: 1.0,
    legal_citations: [],
    evidence_ids: ['EVID_TEST'],
    reasoning_summary: 'Pass',
    identified_gaps: [],
    remediation_steps: [],
  }));

  const res = computeModelTrustScore('TEST_MODEL', findings);
  assert.equal(res.trust_score, 100);
  assert.equal(res.posture, 'Strong Alignment');
});

test('Trust Score Engine: All-FAIL produces 0 score', () => {
  const findings: ModelFinding[] = CANONICAL_CONTROLS.map(c => ({
    model_id: 'TEST_MODEL',
    control_id: c.id,
    verdict: 'NOT_SUPPORTED',
    confidence: 1.0,
    legal_citations: [],
    evidence_ids: ['EVID_TEST'],
    reasoning_summary: 'Fail',
    identified_gaps: [],
    remediation_steps: [],
  }));

  const res = computeModelTrustScore('TEST_MODEL', findings);
  assert.equal(res.trust_score, 0);
  assert.equal(res.posture, 'Critical');
});

test('Trust Score Engine: All NOT_APPLICABLE produces Not Scorable', () => {
  const findings: ModelFinding[] = CANONICAL_CONTROLS.map(c => ({
    model_id: 'TEST_MODEL',
    control_id: c.id,
    verdict: 'NOT_APPLICABLE',
    confidence: 1.0,
    legal_citations: [],
    evidence_ids: [],
    reasoning_summary: 'N/A',
    identified_gaps: [],
    remediation_steps: [],
  }));

  const res = computeModelTrustScore('TEST_MODEL', findings);
  assert.equal(res.trust_score, null);
  assert.equal(res.posture, 'Not Scorable');
});

test('Top-3 Majority Voting Consensus', () => {
  const modelRankings = [
    { model_id: 'M06', f1_score: 0.95, grounding_score: 0.98 },
    { model_id: 'M03', f1_score: 0.92, grounding_score: 0.95 },
    { model_id: 'M07', f1_score: 0.90, grounding_score: 0.91 },
    { model_id: 'M01', f1_score: 0.85, grounding_score: 0.80 },
  ];

  const m06Findings: ModelFinding[] = CANONICAL_CONTROLS.map(c => ({
    model_id: 'M06',
    control_id: c.id,
    verdict: 'SUPPORTED',
    confidence: 0.9,
    legal_citations: [],
    evidence_ids: ['EVID_1'],
    reasoning_summary: 'Pass',
    identified_gaps: [],
    remediation_steps: [],
  }));

  const m03Findings: ModelFinding[] = CANONICAL_CONTROLS.map(c => ({
    model_id: 'M03',
    control_id: c.id,
    verdict: 'SUPPORTED',
    confidence: 0.9,
    legal_citations: [],
    evidence_ids: ['EVID_1'],
    reasoning_summary: 'Pass',
    identified_gaps: [],
    remediation_steps: [],
  }));

  const m07Findings: ModelFinding[] = CANONICAL_CONTROLS.map(c => ({
    model_id: 'M07',
    control_id: c.id,
    verdict: 'NOT_SUPPORTED',
    confidence: 0.8,
    legal_citations: [],
    evidence_ids: ['EVID_1'],
    reasoning_summary: 'Fail',
    identified_gaps: [],
    remediation_steps: [],
  }));

  const { consensusFindings, consensusScore } = computeTopThreeMajorityVoting(
    modelRankings,
    { M06: m06Findings, M03: m03Findings, M07: m07Findings }
  );

  assert.equal(consensusFindings.length, CANONICAL_CONTROLS.length);
  // Since 2/3 voted SUPPORTED, majority must be SUPPORTED
  assert.equal(consensusFindings[0].verdict, 'SUPPORTED');
  assert.equal(consensusScore.trust_score, 100);
  assert.equal(consensusScore.is_consensus, true);
});

test('Grounding Validator: Rejects hallucinated legal clause', () => {
  const validator = new GroundingValidator();
  const finding: ModelFinding = {
    model_id: 'TEST_LLM',
    control_id: 'TF-PRIV-001',
    verdict: 'SUPPORTED',
    confidence: 0.95,
    legal_citations: [
      {
        source_document: 'dpdp-act-2023',
        section: 'Section 999',
        verbatim_quote: 'Data principals shall have absolute right to infinite bandwidth.',
      },
    ],
    evidence_ids: ['EVID_NON_EXISTENT'],
    reasoning_summary: 'Clause cited',
    identified_gaps: [],
    remediation_steps: [],
  };

  const res = validator.validateFinding(finding, []);
  assert.equal(res.isValid, false);
  assert.ok(res.hallucinationFlags.some(f => f.includes('Section 999')));
  assert.ok(res.hallucinationFlags.some(f => f.includes('EVID_NON_EXISTENT')));
});

test('Trust Score Engine: Pillar scores include canonical names, aliases, and evidence coverage', () => {
  const findings: ModelFinding[] = CANONICAL_CONTROLS.map((c, idx) => ({
    model_id: 'TEST_MODEL',
    control_id: c.id,
    verdict: 'SUPPORTED',
    confidence: 0.9,
    legal_citations: [],
    // Give evidence only to the first 2 controls
    evidence_ids: idx < 2 ? ['EVID_TEST'] : [],
    reasoning_summary: 'Pass',
    identified_gaps: [],
    remediation_steps: [],
  }));

  const res = computeModelTrustScore('TEST_MODEL', findings);
  assert.ok(res.pillar_scores);
  for (const [pId, pScore] of Object.entries(res.pillar_scores)) {
    assert.ok(pScore.pillar_name, `Pillar ${pId} missing pillar_name`);
    assert.equal(pScore.pillar, pScore.pillar_name, `Pillar ${pId} missing pillar alias`);
    assert.equal(pScore.name, pScore.pillar_name, `Pillar ${pId} missing name alias`);
    assert.equal(typeof pScore.evidence_coverage, 'number', `Pillar ${pId} missing evidence_coverage`);
  }

  // Privacy pillar has 5 controls, exactly 2 received evidence -> 40% coverage
  const priv = res.pillar_scores['privacy'];
  assert.equal(priv.evidence_coverage, 40);
});

// ─────────────────────────────────────────────────────────────────────────────
// Research Methodology C1–C10 Compliance Tests (Phase 2 Verification)
// ─────────────────────────────────────────────────────────────────────────────

test('Research Scoring 1: All compliant produces 100 score', () => {
  const findings: C10FindingInput[] = ALL_C10_CODES.map(code => ({
    obligation_code: code,
    verdict: 'COMPLIANT',
    evidence_ids: [`EVID_${code}`],
    rationale: 'Fully compliant evidence observed.',
  }));

  const res = computeC10TrustScore('MODEL_TEST', findings, { weightScheme: 'W1_PENALTY_PROPORTIONAL' });
  assert.equal(res.trust_score, 100);
  assert.equal(res.raw_trust_score, 100);
  assert.equal(res.posture, 'Strong');
  assert.equal(res.critical_failure_cap_applied, false);
});

test('Research Scoring 2: All non-compliant produces 0 score', () => {
  const findings: C10FindingInput[] = ALL_C10_CODES.map(code => ({
    obligation_code: code,
    verdict: 'NON_COMPLIANT',
    evidence_ids: [`EVID_${code}`],
    rationale: 'Non-compliant: statutory safeguard missing.',
  }));

  const res = computeC10TrustScore('MODEL_TEST', findings, { weightScheme: 'W1_PENALTY_PROPORTIONAL' });
  assert.equal(res.trust_score, 0);
  assert.equal(res.raw_trust_score, 0);
  assert.equal(res.posture, 'Low');
  assert.equal(res.critical_failure_cap_applied, false);
});

test('Research Scoring 3: All partial produces 50 score', () => {
  const findings: C10FindingInput[] = ALL_C10_CODES.map(code => ({
    obligation_code: code,
    verdict: 'PARTIAL',
    evidence_ids: [`EVID_${code}`],
    rationale: 'Partially compliant: minor gap detected.',
  }));

  const res = computeC10TrustScore('MODEL_TEST', findings, { weightScheme: 'W1_PENALTY_PROPORTIONAL' });
  assert.equal(res.trust_score, 50);
  assert.equal(res.raw_trust_score, 50);
  assert.equal(res.posture, 'Moderate');
});

test('Research Scoring 4: All excluded produces NOT_SCORABLE', () => {
  const findings: C10FindingInput[] = ALL_C10_CODES.map(code => ({
    obligation_code: code,
    verdict: 'NOT_APPLICABLE',
    evidence_ids: [],
    rationale: 'Out of scope.',
  }));

  const res = computeC10TrustScore('MODEL_TEST', findings, { weightScheme: 'W1_PENALTY_PROPORTIONAL' });
  assert.equal(res.trust_score, null);
  assert.equal(res.raw_trust_score, null);
  assert.equal(res.posture, 'NOT_SCORABLE');
});

test('Research Scoring 5: Mixed applicable and excluded categories renormalizes weights correctly', () => {
  // C9 (Children's Data, W1 weight = 0.20) is NOT_APPLICABLE.
  // Active categories: C1..C8, C10. Sum of base weights = 1.00 - 0.20 = 0.80.
  // C4 (Security, base weight = 0.25) is COMPLIANT (100).
  // All other active categories (sum of weights = 0.55) are NON_COMPLIANT (0).
  // Renormalized weight of C4 = 0.25 / 0.80 = 0.3125.
  // Expected Trust Score = 100 * 0.3125 = 31.25 -> rounded to 1 decimal: 31.3.
  const findings: C10FindingInput[] = ALL_C10_CODES.map(code => {
    if (code === 'C9') {
      return { obligation_code: code, verdict: 'NOT_APPLICABLE' };
    }
    if (code === 'C4') {
      return { obligation_code: code, verdict: 'COMPLIANT', evidence_ids: ['EVID_C4'] };
    }
    return { obligation_code: code, verdict: 'NON_COMPLIANT', evidence_ids: [`EVID_${code}`] };
  });

  const res = computeC10TrustScore('MODEL_TEST', findings, { weightScheme: 'W1_PENALTY_PROPORTIONAL' });
  assert.equal(res.trust_score, 31.3);
  assert.equal(res.category_scores.C9.is_applicable, false);
  assert.equal(res.category_scores.C4.renormalized_weight, 0.3125);
  assert.equal(res.posture, 'Low');
});

test('Research Scoring 6: W1 penalty-proportional weighting accuracy', () => {
  // Only C4 (Security, weight 0.25) is COMPLIANT (100), others NON_COMPLIANT (0). All 10 applicable.
  const findingsC4: C10FindingInput[] = ALL_C10_CODES.map(code => ({
    obligation_code: code,
    verdict: code === 'C4' ? 'COMPLIANT' : 'NON_COMPLIANT',
    evidence_ids: [`EVID_${code}`],
  }));
  const resC4 = computeC10TrustScore('MODEL_TEST', findingsC4, { weightScheme: 'W1_PENALTY_PROPORTIONAL' });
  assert.equal(resC4.trust_score, 25.0);

  // Only C5 (Breach, weight 0.20) is COMPLIANT (100), others NON_COMPLIANT (0).
  const findingsC5: C10FindingInput[] = ALL_C10_CODES.map(code => ({
    obligation_code: code,
    verdict: code === 'C5' ? 'COMPLIANT' : 'NON_COMPLIANT',
    evidence_ids: [`EVID_${code}`],
  }));
  const resC5 = computeC10TrustScore('MODEL_TEST', findingsC5, { weightScheme: 'W1_PENALTY_PROPORTIONAL' });
  assert.equal(resC5.trust_score, 20.0);

  // Only C1 (Notice, weight 0.05) is COMPLIANT (100), others NON_COMPLIANT (0).
  const findingsC1: C10FindingInput[] = ALL_C10_CODES.map(code => ({
    obligation_code: code,
    verdict: code === 'C1' ? 'COMPLIANT' : 'NON_COMPLIANT',
    evidence_ids: [`EVID_${code}`],
  }));
  const resC1 = computeC10TrustScore('MODEL_TEST', findingsC1, { weightScheme: 'W1_PENALTY_PROPORTIONAL' });
  assert.equal(resC1.trust_score, 5.0);
});

test('Research Scoring 7: W2 equal weighting accuracy', () => {
  // Under W2, each of the 10 categories has weight 0.10.
  // If only C4 is COMPLIANT (100) and others NON_COMPLIANT (0):
  // Expected score = 100 * 0.10 = 10.0.
  const findingsC4: C10FindingInput[] = ALL_C10_CODES.map(code => ({
    obligation_code: code,
    verdict: code === 'C4' ? 'COMPLIANT' : 'NON_COMPLIANT',
    evidence_ids: [`EVID_${code}`],
  }));

  const res = computeC10TrustScore('MODEL_TEST', findingsC4, { weightScheme: 'W2_EQUAL' });
  assert.equal(res.trust_score, 10.0);
  assert.equal(res.weight_scheme, 'W2_EQUAL');
  assert.equal(res.category_scores.C4.base_weight, 0.10);
});

test('Research Scoring 8: Critical-failure cap on missing HTTPS', () => {
  // All categories are COMPLIANT (raw score 100.0), but crawler verified missing HTTPS.
  const findings: C10FindingInput[] = ALL_C10_CODES.map(code => ({
    obligation_code: code,
    verdict: 'COMPLIANT',
    evidence_ids: [`EVID_${code}`],
  }));

  const res = computeC10TrustScore('MODEL_TEST', findings, {
    weightScheme: 'W1_PENALTY_PROPORTIONAL',
    hasHttps: false,
    hasPrivacyNotice: true,
  });

  assert.equal(res.raw_trust_score, 100);
  assert.equal(res.trust_score, 40);
  assert.equal(res.critical_failure_cap_applied, true);
  assert.equal(res.posture, 'Moderate');
  assert.ok(res.critical_failure_reasons.some(r => r.includes('HTTPS')));
});

test('Research Scoring 9: Critical-failure cap on missing privacy notice', () => {
  // All categories are COMPLIANT (raw score 100.0), but crawler verified missing privacy notice.
  const findings: C10FindingInput[] = ALL_C10_CODES.map(code => ({
    obligation_code: code,
    verdict: 'COMPLIANT',
    evidence_ids: [`EVID_${code}`],
  }));

  const res = computeC10TrustScore('MODEL_TEST', findings, {
    weightScheme: 'W1_PENALTY_PROPORTIONAL',
    hasHttps: true,
    hasPrivacyNotice: false,
  });

  assert.equal(res.raw_trust_score, 100);
  assert.equal(res.trust_score, 40);
  assert.equal(res.critical_failure_cap_applied, true);
  assert.ok(res.critical_failure_reasons.some(r => r.includes('privacy notice')));
});

test('Research Scoring 10: Six-pillar UI compatibility projection', () => {
  const findings: C10FindingInput[] = ALL_C10_CODES.map(code => ({
    obligation_code: code,
    verdict: 'COMPLIANT',
    evidence_ids: [`EVID_${code}`],
  }));

  const res = computeC10TrustScore('MODEL_TEST', findings);
  assert.ok(res.pillar_scores);

  const expectedPillars = ['privacy', 'security', 'transparency', 'governance', 'lifecycle', 'rights'];
  for (const p of expectedPillars) {
    const pScore = res.pillar_scores[p];
    assert.ok(pScore, `Missing pillar projection: ${p}`);
    assert.equal(pScore.score, 100, `Pillar ${p} expected score 100`);
    assert.ok(pScore.weight > 0, `Pillar ${p} missing weight`);
  }
});

test('Research Scoring 11: Unsupported verdicts and failed grounding treated as NOT_DETERMINABLE', () => {
  const findings: C10FindingInput[] = [
    // Valid compliant finding in C1
    { obligation_code: 'C1', verdict: 'COMPLIANT', evidence_ids: ['EVID_1'], is_grounded: true },
    // Malformed string verdict in C2 -> must be excluded from scoring
    { obligation_code: 'C2', verdict: 'BOGUS_GARBAGE' as any, evidence_ids: [], is_grounded: true },
    // Failed grounding check in C3 -> must be excluded from scoring
    { obligation_code: 'C3', verdict: 'COMPLIANT', evidence_ids: [], is_grounded: false },
    // Excluded C4..C10
    ...ALL_C10_CODES.filter(c => !['C1', 'C2', 'C3'].includes(c)).map(code => ({
      obligation_code: code,
      verdict: 'NOT_APPLICABLE' as const,
    })),
  ];

  const res = computeC10TrustScore('MODEL_TEST', findings, { enforceGroundingCheck: true });
  // Only C1 is applicable and COMPLIANT (100).
  // C2 (malformed) and C3 (failed grounding) are excluded (NOT_DETERMINABLE).
  // Therefore, C1 has 100% of applicable weight.
  assert.equal(res.trust_score, 100);
  assert.equal(res.category_scores.C1.is_applicable, true);
  assert.equal(res.category_scores.C2.is_applicable, false);
  assert.equal(res.category_scores.C3.is_applicable, false);
});

test('Research Scoring 12: Scoring determinism across 100 identical runs', () => {
  const mixedFindings: C10FindingInput[] = [
    { obligation_code: 'C1', verdict: 'COMPLIANT', evidence_ids: ['E_1'] },
    { obligation_code: 'C2', verdict: 'PARTIAL', evidence_ids: ['E_2'] },
    { obligation_code: 'C3', verdict: 'NON_COMPLIANT', evidence_ids: ['E_3'] },
    { obligation_code: 'C4', verdict: 'COMPLIANT', evidence_ids: ['E_4'] },
    { obligation_code: 'C5', verdict: 'PARTIAL', evidence_ids: ['E_5'] },
    { obligation_code: 'C6', verdict: 'NOT_DETERMINABLE' },
    { obligation_code: 'C7', verdict: 'COMPLIANT', evidence_ids: ['E_7'] },
    { obligation_code: 'C8', verdict: 'PARTIAL', evidence_ids: ['E_8'] },
    { obligation_code: 'C9', verdict: 'NOT_APPLICABLE' },
    { obligation_code: 'C10', verdict: 'NON_COMPLIANT', evidence_ids: ['E_10'] },
  ];

  const baseline = computeC10TrustScore('MODEL_DET', mixedFindings, {
    weightScheme: 'W1_PENALTY_PROPORTIONAL',
    hasHttps: true,
    hasPrivacyNotice: true,
  });

  for (let i = 0; i < 100; i++) {
    const iter = computeC10TrustScore('MODEL_DET', mixedFindings, {
      weightScheme: 'W1_PENALTY_PROPORTIONAL',
      hasHttps: true,
      hasPrivacyNotice: true,
    });
    assert.equal(iter.trust_score, baseline.trust_score);
    assert.equal(iter.raw_trust_score, baseline.raw_trust_score);
    assert.equal(iter.posture, baseline.posture);
  }
});


