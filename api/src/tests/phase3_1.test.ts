/**
 * Phase 3.1: Research Quality Correction Tests
 * Comprehensive regression tests for:
 *  1. Exact evidence quote verification (preserves punctuation, negation, numbers, Unicode NFKC, HTML entities)
 *  2. Rejection of partial or fabricated quotes (negation flips, word alteration)
 *  3. Evidence provenance gating (valid evidence ID, source URL, captured content, timestamp)
 *  4. Strict enforcement: Failed verdicts convert to NOT_DETERMINABLE with raw_verdict preserved
 *  5. Scoring exclusion: NOT_DETERMINABLE excluded from denominator (A_i = 0)
 *  6. Evidence coverage calculation alongside Trust Score
 *  7. Corpus completeness and legal status distinction
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GroundingValidator, normalizeGroundingText } from '../validator/groundingValidator.js';
import { computeModelTrustScore, CANONICAL_CONTROLS } from '../scoring/trustScoreEngine.js';
import { EvidenceItem, ModelFinding } from '../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─────────────────────────────────────────────────────────────────────────────
// 1. Text Normalization: Punctuation, Negation, Numeric Preservation
// ─────────────────────────────────────────────────────────────────────────────

test('Phase 3.1: Normalization decodes HTML entities and normalizes Unicode NFKC', () => {
  const input = 'We&nbsp;do&nbsp;not&nbsp;share&amp;sell&quot;personal data&#39;.';
  const norm = normalizeGroundingText(input);
  assert.strictEqual(norm, 'we do not share&sell"personal data\'.');
});

test('Phase 3.1: Normalization preserves punctuation, numbers, and critical negations', () => {
  const text = 'Data is NOT retained beyond 30 days; exceptions apply under Section 8(7).';
  const norm = normalizeGroundingText(text);

  // Must preserve negation
  assert.ok(norm.includes('not'), 'Negation "not" must be preserved');
  // Must preserve numeric values
  assert.ok(norm.includes('30 days'), 'Number "30 days" must be preserved');
  assert.ok(norm.includes('8(7)'), 'Section number "8(7)" must be preserved');
  // Must preserve punctuation
  assert.ok(norm.includes(';'), 'Semicolon must be preserved');
  assert.ok(norm.includes('.'), 'Period must be preserved');
  assert.ok(norm.includes('(') && norm.includes(')'), 'Parentheses must be preserved');
});

test('Phase 3.1: Normalization standardizes typographic curly quotes and dashes', () => {
  const curly = '“Personal Data”—defined under Rule 2—shall not be shared.';
  const norm = normalizeGroundingText(curly);
  assert.strictEqual(norm, '"personal data"-defined under rule 2-shall not be shared.');
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Exact Supporting Evidence Matching vs Fabricated / Partial Quotes
// ─────────────────────────────────────────────────────────────────────────────

test('Phase 3.1: Exact verbatim quote from captured website evidence passes validation', () => {
  const validator = new GroundingValidator();

  const evidence: EvidenceItem[] = [
    {
      id: 'EVID_NOTICE_01',
      source_type: 'WEBSITE_SCAN',
      source_url: 'https://example.org/privacy',
      key: 'privacy_notice_content',
      label: 'Privacy Notice',
      value: 'We collect personal data solely for account management and do not sell data to third parties under any circumstances.',
      status: 'VERIFIED',
      confidence: 1.0,
      extracted_at: new Date().toISOString(),
    },
  ];

  const finding: ModelFinding = {
    model_id: 'M01',
    control_id: 'TF-PRIV-001',
    verdict: 'SUPPORTED',
    confidence: 0.95,
    legal_citations: [{ source_document: 'dpdp-act-2023', section: 'Section 5', verbatim_quote: '' }],
    evidence_ids: ['EVID_NOTICE_01'],
    quoted_evidence: 'do not sell data to third parties under any circumstances',
    reasoning_summary: 'Verified clear commitment against data sales.',
    identified_gaps: [],
    remediation_steps: [],
  };

  const result = validator.validateAndEnforceFinding(finding, evidence);
  assert.strictEqual(result.isValid, true, 'Verbatim quote must pass validation');
  assert.strictEqual(finding.is_grounded, true);
  assert.strictEqual(finding.verdict, 'SUPPORTED');
  assert.strictEqual(finding.rejection_reason, null);
});

test('Phase 3.1: Negation flip in quote fails validation and converts to NOT_DETERMINABLE', () => {
  const validator = new GroundingValidator();

  const evidence: EvidenceItem[] = [
    {
      id: 'EVID_NOTICE_02',
      source_type: 'WEBSITE_SCAN',
      source_url: 'https://example.org/privacy',
      key: 'privacy_notice_content',
      label: 'Privacy Notice',
      value: 'We do not sell personal data to third parties under any circumstances.',
      status: 'VERIFIED',
      confidence: 1.0,
      extracted_at: new Date().toISOString(),
    },
  ];

  // Model quote omits the word "not" (flipping the meaning)
  const finding: ModelFinding = {
    model_id: 'M02',
    control_id: 'TF-PRIV-001',
    verdict: 'SUPPORTED',
    confidence: 0.9,
    legal_citations: [{ source_document: 'dpdp-act-2023', section: 'Section 5', verbatim_quote: '' }],
    evidence_ids: ['EVID_NOTICE_02'],
    quoted_evidence: 'We sell personal data to third parties under any circumstances',
    reasoning_summary: 'Model misquoted negation.',
    identified_gaps: [],
    remediation_steps: [],
  };

  const result = validator.validateAndEnforceFinding(finding, evidence);
  assert.strictEqual(result.isValid, false, 'Quote with omitted negation must fail');
  assert.strictEqual(finding.is_grounded, false);
  assert.strictEqual(finding.raw_verdict, 'SUPPORTED');
  assert.strictEqual(finding.verdict, 'NOT_DETERMINABLE');
  assert.ok(finding.rejection_reason?.includes('FABRICATED_QUOTE'));
});

test('Phase 3.1: Numeric value alteration in quote fails validation', () => {
  const validator = new GroundingValidator();

  const evidence: EvidenceItem[] = [
    {
      id: 'EVID_RETENTION_01',
      source_type: 'WEBSITE_SCAN',
      source_url: 'https://example.org/policy',
      key: 'data_retention_period',
      label: 'Retention Policy',
      value: 'Inactive user data is purged within 30 days of account deletion.',
      status: 'VERIFIED',
      confidence: 1.0,
      extracted_at: new Date().toISOString(),
    },
  ];

  // Model quote alters the number 30 to 90
  const finding: ModelFinding = {
    model_id: 'M03',
    control_id: 'TF-LIFE-001',
    verdict: 'SUPPORTED',
    confidence: 0.9,
    legal_citations: [{ source_document: 'dpdp-act-2023', section: 'Section 8', verbatim_quote: '' }],
    evidence_ids: ['EVID_RETENTION_01'],
    quoted_evidence: 'Inactive user data is purged within 90 days of account deletion.',
    reasoning_summary: 'Retention period check.',
    identified_gaps: [],
    remediation_steps: [],
  };

  const result = validator.validateAndEnforceFinding(finding, evidence);
  assert.strictEqual(result.isValid, false, 'Quote with altered number must fail');
  assert.strictEqual(finding.verdict, 'NOT_DETERMINABLE');
  assert.ok(finding.rejection_reason?.includes('FABRICATED_QUOTE'));
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Evidence Provenance Gating
// ─────────────────────────────────────────────────────────────────────────────

test('Phase 3.1: Evidence lacking source_url fails validation', () => {
  const validator = new GroundingValidator();

  const evidenceWithoutUrl: EvidenceItem[] = [
    {
      id: 'EVID_NO_URL',
      source_type: 'WEBSITE_SCAN',
      // source_url intentionally omitted
      key: 'cookie_disclosure',
      label: 'Cookies',
      value: 'We use strictly necessary cookies only.',
      status: 'VERIFIED',
      confidence: 0.9,
      extracted_at: new Date().toISOString(),
    },
  ];

  const finding: ModelFinding = {
    model_id: 'M04',
    control_id: 'TF-PRIV-002',
    verdict: 'SUPPORTED',
    confidence: 0.85,
    legal_citations: [{ source_document: 'dpdp-act-2023', section: 'Section 6', verbatim_quote: '' }],
    evidence_ids: ['EVID_NO_URL'],
    reasoning_summary: 'Cookie check.',
    identified_gaps: [],
    remediation_steps: [],
  };

  const result = validator.validateAndEnforceFinding(finding, evidenceWithoutUrl);
  assert.strictEqual(result.isValid, false, 'Evidence lacking source_url must fail provenance check');
  assert.strictEqual(finding.verdict, 'NOT_DETERMINABLE');
  assert.ok(finding.rejection_reason?.includes('MISSING_EVIDENCE'));
});

test('Phase 3.1: Evidence containing empty captured content fails validation', () => {
  const validator = new GroundingValidator();

  const emptyEvidence: EvidenceItem[] = [
    {
      id: 'EVID_EMPTY',
      source_type: 'WEBSITE_SCAN',
      source_url: 'https://example.org/empty',
      key: 'dpo_contact',
      label: 'DPO',
      value: '   ', // whitespace only
      status: 'VERIFIED',
      confidence: 0.5,
      extracted_at: new Date().toISOString(),
    },
  ];

  const finding: ModelFinding = {
    model_id: 'M05',
    control_id: 'TF-TRANS-001',
    verdict: 'SUPPORTED',
    confidence: 0.8,
    legal_citations: [{ source_document: 'dpdp-act-2023', section: 'Section 8', verbatim_quote: '' }],
    evidence_ids: ['EVID_EMPTY'],
    reasoning_summary: 'DPO contact found.',
    identified_gaps: [],
    remediation_steps: [],
  };

  const result = validator.validateAndEnforceFinding(finding, emptyEvidence);
  assert.strictEqual(result.isValid, false, 'Empty captured content must fail');
  assert.strictEqual(finding.verdict, 'NOT_DETERMINABLE');
  assert.ok(finding.rejection_reason?.includes('MISSING_EVIDENCE'));
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Scoring Isolation: Excluded from Denominator (A_i = 0)
// ─────────────────────────────────────────────────────────────────────────────

test('Phase 3.1: NOT_DETERMINABLE verdict does not artificially reduce or inflate score', () => {
  // Construct 16 controls: 15 COMPLIANT, 1 NOT_DETERMINABLE
  const findings: ModelFinding[] = CANONICAL_CONTROLS.map((c, i) => ({
    model_id: 'M_TEST',
    control_id: c.id,
    verdict: i === 0 ? 'NOT_DETERMINABLE' : 'SUPPORTED',
    confidence: 0.9,
    legal_citations: [],
    evidence_ids: ['EVID_VALID'],
    reasoning_summary: 'Evaluation',
    identified_gaps: [],
    remediation_steps: [],
    is_grounded: i !== 0,
  }));

  const res = computeModelTrustScore('M_TEST', findings);
  assert.strictEqual(res.trust_score, 100, 'Excluded item must not penalize remaining compliant controls');
  assert.ok(res.category_scores);
});

test('Phase 3.1: Evidence coverage is exposed alongside Trust Score', () => {
  const findings: ModelFinding[] = CANONICAL_CONTROLS.map((c, i) => ({
    model_id: 'M_TEST_COV',
    control_id: c.id,
    verdict: 'SUPPORTED',
    confidence: 0.9,
    legal_citations: [],
    // Only first 8 controls have observed evidence
    evidence_ids: i < 8 ? ['EVID_OBS'] : [],
    reasoning_summary: 'Evaluation',
    identified_gaps: [],
    remediation_steps: [],
    is_grounded: true,
  }));

  const res = computeModelTrustScore('M_TEST_COV', findings);
  assert.strictEqual(typeof res.evidence_coverage, 'number');
  // 8 out of 20 C10 obligation items have observed evidence = 40%
  assert.strictEqual(res.evidence_coverage, 40, 'Evidence coverage should be exactly 40% (8 out of 20 items)');
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Corpus Legal Status Disambiguation
// ─────────────────────────────────────────────────────────────────────────────

test('Phase 3.1: Authoritative corpus contains all 23 rules and 4 schedules with accurate legal status', () => {
  const possiblePaths = [
    path.resolve(process.cwd(), '../backend/knowledge/authoritative_corpus.json'),
    path.resolve(process.cwd(), 'backend/knowledge/authoritative_corpus.json'),
    path.resolve(__dirname, '../../../../backend/knowledge/authoritative_corpus.json'),
  ];
  let corpusRaw = '';
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      corpusRaw = fs.readFileSync(p, 'utf-8');
      break;
    }
  }
  assert.ok(corpusRaw, 'authoritative_corpus.json must be loaded');
  const corpus = JSON.parse(corpusRaw);

  assert.strictEqual(corpus.length, 83, 'Authoritative corpus must contain exactly 83 statutory chunks');

  // Verify all 23 rules are present
  for (let r = 1; r <= 23; r++) {
    const ruleChunk = corpus.find((c: any) => c.rule_number === `Rule ${r}`);
    assert.ok(ruleChunk, `Rule ${r} must be present in corpus`);
  }

  // Verify all 4 schedules are represented
  const schedules = ['First Schedule', 'Second Schedule', 'Third Schedule', 'Fourth Schedule'];
  for (const s of schedules) {
    const hasSched = corpus.some((c: any) => (c.section || '').includes(s) || (c.heading || '').includes(s));
    assert.ok(hasSched, `${s} must be represented in corpus`);
  }

  // Verify legal status distinction: Rules 1, 2, 17-21 are IN_FORCE; substantive rules are NOTIFIED_PHASED
  const inForceRules = [1, 2, 17, 18, 19, 20, 21];
  for (const r of inForceRules) {
    const chunk = corpus.find((c: any) => c.rule_number === `Rule ${r}`);
    assert.strictEqual(chunk?.commencement_status, 'IN_FORCE', `Rule ${r} should have commencement_status IN_FORCE`);
  }

  const phasedRules = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 22, 23];
  for (const r of phasedRules) {
    const chunk = corpus.find((c: any) => c.rule_number === `Rule ${r}`);
    assert.ok(
      chunk?.commencement_status?.startsWith('NOTIFIED_PHASED'),
      `Rule ${r} must be tagged as NOTIFIED_PHASED (found: ${chunk?.commencement_status})`
    );
  }
});
