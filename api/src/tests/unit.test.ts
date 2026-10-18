/**
 * Unit Test Suite for TrustForge Node.js Research Engine.
 * Tests SSRF Guard, Trust Score Engine, Grounding Validator, and Majority Voting.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { validateTargetUrl } from '../crawler/ssrfGuard.js';
import { CANONICAL_CONTROLS, computeModelTrustScore, computeTopThreeMajorityVoting } from '../scoring/trustScoreEngine.js';
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

test('SSRF Guard: Permits valid public domain', async () => {
  const publicUrl = await validateTargetUrl('https://example.com');
  assert.equal(publicUrl.isValid, true);
  assert.ok(publicUrl.resolvedIp);
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
