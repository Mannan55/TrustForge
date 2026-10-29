/**
 * TrustForge: Assessment Scenarios & Reliability Regression Tests.
 *
 * Verifies the end-to-end reliability of the assessment pipeline across:
 *  1. Default wizard selections (wizard-only, no crawler) -> Valid score & posture, NOT_SCORABLE avoided
 *  2. Non-default selections (disabled breach plan, manual erasure, custom retention) -> Sensitively reflects lower score
 *  3. Negative compliance (all non-compliant) -> Genuine 0 score with Low/Critical posture, NOT 'NOT_SCORABLE'
 *  4. Website scan only (crawler evidence without wizard)
 *  5. Dual mode (website scan + wizard combined) -> Complete 20-control coverage
 *  6. Truly zero-evidence edge case -> Returns trust_score: null, posture: 'NOT_SCORABLE'
 *  7. Grounding validation provenance: ASSESSMENT_WIZARD vs WEBSITE_SCAN
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { GroundingValidator } from '../validator/groundingValidator.js';
import {
  CANONICAL_CONTROLS,
  computeModelTrustScore,
  computeTopThreeMajorityVoting,
} from '../scoring/trustScoreEngine.js';
import { convertLegacyFindingToC10, projectC10ToSixPillars } from '../scoring/pillarMappingAdapter.js';
import { EvidenceItem, ModelFinding } from '../types/index.js';

const validator = new GroundingValidator();

// ─────────────────────────────────────────────────────────────────────────────
// Helper to construct synthetic wizard evidence mimicking assessments.ts logic
// ─────────────────────────────────────────────────────────────────────────────
function buildWizardEvidence(options: {
  assessmentId: string;
  websiteUrl?: string;
  languages?: string[];
  purposes?: string[];
  collections?: string[];
  categories?: string[];
  rights?: string[];
  processors?: string[];
  retention?: string;
  erasure_automated?: boolean;
  breach_plan?: boolean;
  grievance_officer_named?: boolean;
  grievance_contact_published?: boolean;
}): EvidenceItem[] {
  const timestamp = new Date().toISOString();
  const evidence: EvidenceItem[] = [];
  const wizardUrl = options.websiteUrl || 'wizard://self-reported-assessment';
  const id = options.assessmentId;

  if (options.languages && options.languages.length > 0) {
    evidence.push({
      id: `EVID_${id}_LANG`,
      source_type: 'ASSESSMENT_WIZARD',
      source_url: wizardUrl,
      key: 'notice_languages',
      label: 'Notice Languages',
      value: options.languages,
      status: 'SELF_REPORTED',
      confidence: 0.85,
      extracted_at: timestamp,
    });
  }

  if (options.purposes && options.purposes.length > 0) {
    evidence.push({
      id: `EVID_${id}_PURP`,
      source_type: 'ASSESSMENT_WIZARD',
      source_url: wizardUrl,
      key: 'specified_purposes',
      label: 'Specified Lawful Purposes',
      value: options.purposes,
      status: 'SELF_REPORTED',
      confidence: 0.85,
      extracted_at: timestamp,
    });
  }

  if (options.collections && options.collections.length > 0) {
    evidence.push({
      id: `EVID_${id}_COLLECTIONS`,
      source_type: 'ASSESSMENT_WIZARD',
      source_url: wizardUrl,
      key: 'collection_channels',
      label: 'Data Collection Channels',
      value: options.collections,
      status: 'SELF_REPORTED',
      confidence: 0.85,
      extracted_at: timestamp,
    });
  }

  if (options.categories && options.categories.length > 0) {
    evidence.push({
      id: `EVID_${id}_CATEGORIES`,
      source_type: 'ASSESSMENT_WIZARD',
      source_url: wizardUrl,
      key: 'personal_data_categories',
      label: 'Personal Data Categories Collected',
      value: options.categories,
      status: 'SELF_REPORTED',
      confidence: 0.85,
      extracted_at: timestamp,
    });
  }

  if (options.rights && options.rights.length > 0) {
    evidence.push({
      id: `EVID_${id}_RIGHTS`,
      source_type: 'ASSESSMENT_WIZARD',
      source_url: wizardUrl,
      key: 'data_principal_rights',
      label: 'Supported Data Principal Rights',
      value: {
        supported_rights: options.rights,
        has_access: options.rights.includes('access'),
        has_correction: options.rights.includes('correction'),
        has_erasure: options.rights.includes('erasure'),
        has_grievance: options.rights.includes('grievance'),
        has_nomination: options.rights.includes('nomination'),
      },
      status: 'SELF_REPORTED',
      confidence: 0.85,
      extracted_at: timestamp,
    });
  }

  if (options.processors && options.processors.length > 0) {
    evidence.push({
      id: `EVID_${id}_PROCESSORS`,
      source_type: 'ASSESSMENT_WIZARD',
      source_url: wizardUrl,
      key: 'data_processors',
      label: 'Data Processors and Third Parties Under Contract',
      value: options.processors,
      status: 'SELF_REPORTED',
      confidence: 0.85,
      extracted_at: timestamp,
    });
  }

  if (options.retention && options.retention.trim().length > 0) {
    evidence.push({
      id: `EVID_${id}_RETENTION`,
      source_type: 'ASSESSMENT_WIZARD',
      source_url: wizardUrl,
      key: 'data_retention_schedule',
      label: 'Data Retention Schedule',
      value: {
        schedule: options.retention,
        hasDefinedSchedule: !options.retention.toLowerCase().includes('no defined schedule'),
      },
      status: 'SELF_REPORTED',
      confidence: 0.85,
      extracted_at: timestamp,
    });
  }

  evidence.push({
    id: `EVID_${id}_ERASURE`,
    source_type: 'ASSESSMENT_WIZARD',
    source_url: wizardUrl,
    key: 'automated_data_erasure',
    label: 'Automated Data Erasure Mechanism',
    value: {
      automated: Boolean(options.erasure_automated),
      hasAutomatedWorkflow: Boolean(options.erasure_automated),
      status: options.erasure_automated ? 'AUTOMATED_SYSTEM_SUPPORTED' : 'MANUAL_OR_UNAVAILABLE',
    },
    status: 'SELF_REPORTED',
    confidence: 0.9,
    extracted_at: timestamp,
  });

  evidence.push({
    id: `EVID_${id}_BREACH`,
    source_type: 'ASSESSMENT_WIZARD',
    source_url: wizardUrl,
    key: 'breach_notification_procedure',
    label: 'Breach Notification Procedure',
    value: {
      documentedProcedure: Boolean(options.breach_plan),
      hasBreachPlan: Boolean(options.breach_plan),
      status: options.breach_plan ? 'DOCUMENTED_AND_ACTIVE' : 'NOT_ESTABLISHED',
    },
    status: 'SELF_REPORTED',
    confidence: 0.9,
    extracted_at: timestamp,
  });

  evidence.push({
    id: `EVID_${id}_DPO`,
    source_type: 'ASSESSMENT_WIZARD',
    source_url: wizardUrl,
    key: 'dpo_grievance_published',
    label: 'Grievance Officer Published',
    value: {
      named: Boolean(options.grievance_officer_named),
      contactPublished: Boolean(options.grievance_contact_published),
      status: (options.grievance_officer_named && options.grievance_contact_published)
        ? 'DESIGNATED_AND_PUBLISHED'
        : (options.grievance_officer_named ? 'DESIGNATED_NOT_PUBLISHED' : 'NOT_DESIGNATED'),
    },
    status: 'SELF_REPORTED',
    confidence: 0.9,
    extracted_at: timestamp,
  });

  return evidence;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Grounding Provenance Tests
// ─────────────────────────────────────────────────────────────────────────────

test('Scenario Test: Grounding Validator accepts ASSESSMENT_WIZARD evidence without external HTTP URL', () => {
  const wizardEvidence: EvidenceItem[] = [
    {
      id: 'EVID_WIZARD_TEST',
      source_type: 'ASSESSMENT_WIZARD',
      key: 'notice_languages',
      label: 'Notice Languages',
      value: ['en', 'hi', 'kn'],
      status: 'SELF_REPORTED',
      confidence: 0.85,
      extracted_at: new Date().toISOString(),
    },
  ];

  const finding: ModelFinding = {
    model_id: 'M01',
    control_id: 'TF-PRIV-002',
    verdict: 'SUPPORTED',
    confidence: 0.9,
    legal_citations: [{
      source_document: 'dpdp-act-2023',
      section: 'Section 5',
      verbatim_quote: '',
    }],
    evidence_ids: ['EVID_WIZARD_TEST'],
    reasoning_summary: 'Notice provided in English and 8th Schedule languages.',
    identified_gaps: [],
    remediation_steps: [],
  };

  const validation = validator.validateAndEnforceFinding(finding, wizardEvidence);
  assert.strictEqual(validation.isValid, true, 'ASSESSMENT_WIZARD evidence must pass provenance check');
  assert.strictEqual(finding.verdict, 'SUPPORTED', 'Verdict must remain SUPPORTED when grounded');
  assert.strictEqual(finding.is_grounded, true);
  assert.strictEqual(finding.rejection_reason, null);
});

test('Scenario Test: Grounding Validator still strictly rejects WEBSITE_SCAN evidence lacking source_url', () => {
  const invalidWebEvidence: EvidenceItem[] = [
    {
      id: 'EVID_WEB_UNVERIFIED',
      source_type: 'WEBSITE_SCAN',
      // source_url intentionally missing
      key: 'transport_security',
      label: 'Transport Security',
      value: { https: true },
      status: 'DETECTED',
      confidence: 0.9,
      extracted_at: new Date().toISOString(),
    },
  ];

  const finding: ModelFinding = {
    model_id: 'M01',
    control_id: 'TF-SEC-001',
    verdict: 'SUPPORTED',
    confidence: 0.9,
    legal_citations: [{
      source_document: 'dpdp-act-2023',
      section: 'Section 8',
      verbatim_quote: '',
    }],
    evidence_ids: ['EVID_WEB_UNVERIFIED'],
    reasoning_summary: 'HTTPS enabled.',
    identified_gaps: [],
    remediation_steps: [],
  };

  const validation = validator.validateAndEnforceFinding(finding, invalidWebEvidence);
  assert.strictEqual(validation.isValid, false, 'WEBSITE_SCAN lacking source_url must fail provenance');
  assert.strictEqual(finding.verdict, 'NOT_DETERMINABLE');
  assert.ok(finding.rejection_reason?.includes('MISSING_EVIDENCE'));
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Scenario 1: Default Selections (Wizard-Only)
// ─────────────────────────────────────────────────────────────────────────────

test('Scenario 1: Default wizard selections produce valid Trust Score and valid posture (NOT_SCORABLE avoided)', () => {
  const evidence = buildWizardEvidence({
    assessmentId: 'TEST_SCENARIO_1',
    collections: ['Website forms', 'Mobile application', 'Payment checkout'],
    categories: ['identifiers', 'financial', 'device'],
    purposes: ['service', 'auth', 'analytics', 'support', 'security'],
    languages: ['en', 'hi', 'kn'],
    rights: ['access', 'correction', 'grievance'],
    processors: ['cloudfront', 'razorpay', 'intercom'],
    retention: 'As long as the account is active, then 90 days',
    erasure_automated: true,
    breach_plan: true,
    grievance_officer_named: true,
    grievance_contact_published: true,
  });

  assert.ok(evidence.length >= 8, `Expected at least 8 evidence items, got ${evidence.length}`);

  // Build model findings for all 20 canonical controls
  const findings: ModelFinding[] = CANONICAL_CONTROLS.map(ctrl => {
    // Determine relevant evidence items
    const relevantEvidence = evidence.filter(e => {
      const k = e.key.toLowerCase();
      if (ctrl.pillar === 'security' && k.includes('breach')) return true;
      if (ctrl.pillar === 'privacy' && (k.includes('lang') || k.includes('purp') || k.includes('category') || k.includes('collection'))) return true;
      if (ctrl.pillar === 'transparency' && (k.includes('dpo') || k.includes('processor'))) return true;
      if (ctrl.pillar === 'governance' && (k.includes('processor') || k.includes('erasure') || k.includes('retention'))) return true;
      if (ctrl.pillar === 'lifecycle' && (k.includes('retention') || k.includes('erasure') || k.includes('purp'))) return true;
      if (ctrl.pillar === 'rights' && (k.includes('right') || k.includes('dpo'))) return true;
      return false;
    });

    const cleanSec = ctrl.statutory_ref.replace(/^DPDP Act 2023, |^DPDP Rules 2025, /, '').split('(')[0].trim();

    if (relevantEvidence.length > 0) {
      return {
        model_id: 'M01',
        control_id: ctrl.id,
        verdict: 'SUPPORTED',
        confidence: 0.9,
        legal_citations: [{
          source_document: 'dpdp-act-2023',
          section: cleanSec,
          verbatim_quote: '',
        }],
        evidence_ids: relevantEvidence.map(e => e.id),
        reasoning_summary: `Observed wizard evidence satisfies ${ctrl.name}.`,
        identified_gaps: [],
        remediation_steps: [],
      };
    } else {
      // Controls requiring website crawl (e.g. HTTPS, Headers, Trackers) legitimately have insufficient evidence
      return {
        model_id: 'M01',
        control_id: ctrl.id,
        verdict: 'INSUFFICIENT_EVIDENCE',
        confidence: 0.5,
        legal_citations: [{
          source_document: 'dpdp-act-2023',
          section: cleanSec,
          verbatim_quote: '',
        }],
        evidence_ids: [],
        reasoning_summary: `No crawler evidence available for ${ctrl.name} in wizard-only mode.`,
        identified_gaps: [`Requires website scan for ${ctrl.name}`],
        remediation_steps: [`Run website scan`],
      };
    }
  });

  // Validate grounding for each finding
  for (const f of findings) {
    validator.validateAndEnforceFinding(f, evidence);
  }

  // Compute Trust Score
  const scoreResult = computeModelTrustScore('M01', findings, {
    assessmentId: 'TEST_SCENARIO_1',
    enforceGroundingCheck: true,
  });

  // Assertions for Scenario 1
  assert.notStrictEqual(scoreResult.trust_score, null, 'Trust Score must NOT be null in Scenario 1');
  assert.notStrictEqual(scoreResult.posture, 'NOT_SCORABLE', 'Posture must NOT be NOT_SCORABLE in Scenario 1');
  assert.ok(scoreResult.trust_score! >= 70, `Expected score >= 70 for default selections, got ${scoreResult.trust_score}`);
  assert.ok(scoreResult.evidence_coverage > 0, `Evidence coverage must be > 0, got ${scoreResult.evidence_coverage}%`);

  const pillars = Object.values(scoreResult.pillar_scores);
  assert.strictEqual(pillars.length, 6, 'Must project all 6 UI pillars');

  const activePillars = pillars.filter(p => p.score > 0);
  assert.ok(activePillars.length >= 4, `At least 4 pillars should have active scores in wizard-only mode, got ${activePillars.length}`);
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Scenario 2: Non-Default Selections (User changes options)
// ─────────────────────────────────────────────────────────────────────────────

test('Scenario 2: Non-default selections (disabled breach plan, manual erasure, custom retention) lower the score', () => {
  // Scenario 2 has: breach_plan = false, erasure_automated = false, retention = 'No defined schedule', partial rights
  const evidence = buildWizardEvidence({
    assessmentId: 'TEST_SCENARIO_2',
    collections: ['Website forms'],
    categories: ['identifiers'],
    purposes: ['service'],
    languages: ['en'],
    rights: ['access'], // No correction or grievance
    processors: [],
    retention: 'No defined schedule',
    erasure_automated: false,
    breach_plan: false,
    grievance_officer_named: false,
    grievance_contact_published: false,
  });

  const findings: ModelFinding[] = CANONICAL_CONTROLS.map(ctrl => {
    // Controls that check breach plan, automated erasure, DPO, or processors will observe non-compliance
    if (ctrl.id === 'TF-SEC-003') {
      return {
        model_id: 'M01',
        control_id: ctrl.id,
        verdict: 'NOT_SUPPORTED',
        confidence: 0.9,
        legal_citations: [{ source_document: 'dpdp-act-2023', section: 'Section 8', verbatim_quote: '' }],
        evidence_ids: [`EVID_TEST_SCENARIO_2_BREACH`],
        reasoning_summary: 'No documented breach notification protocol.',
        identified_gaps: ['No breach plan established'],
        remediation_steps: ['Establish formal breach protocol'],
      };
    }
    if (ctrl.id === 'TF-LIFE-002') {
      return {
        model_id: 'M01',
        control_id: ctrl.id,
        verdict: 'NOT_SUPPORTED',
        confidence: 0.9,
        legal_citations: [{ source_document: 'dpdp-act-2023', section: 'Section 12', verbatim_quote: '' }],
        evidence_ids: [`EVID_TEST_SCENARIO_2_ERASURE`],
        reasoning_summary: 'Erasure is manual and not automated.',
        identified_gaps: ['No automated erasure mechanism'],
        remediation_steps: ['Implement automated deletion workflow'],
      };
    }
    if (ctrl.id === 'TF-LIFE-001') {
      return {
        model_id: 'M01',
        control_id: ctrl.id,
        verdict: 'NOT_SUPPORTED',
        confidence: 0.85,
        legal_citations: [{ source_document: 'dpdp-act-2023', section: 'Section 8', verbatim_quote: '' }],
        evidence_ids: [`EVID_TEST_SCENARIO_2_RETENTION`],
        reasoning_summary: 'No defined data retention schedule.',
        identified_gaps: ['Undefined retention policy'],
        remediation_steps: ['Define clear retention limits'],
      };
    }
    if (ctrl.id === 'TF-TRANS-001') {
      return {
        model_id: 'M01',
        control_id: ctrl.id,
        verdict: 'NOT_SUPPORTED',
        confidence: 0.9,
        legal_citations: [{ source_document: 'dpdp-act-2023', section: 'Section 8', verbatim_quote: '' }],
        evidence_ids: [`EVID_TEST_SCENARIO_2_DPO`],
        reasoning_summary: 'No Grievance Officer designated.',
        identified_gaps: ['No DPO appointed'],
        remediation_steps: ['Appoint DPO and publish contact'],
      };
    }
    if (ctrl.id === 'TF-PRIV-002' || ctrl.id === 'TF-PRIV-005') {
      const cleanSec = ctrl.statutory_ref.replace(/^DPDP Act 2023, |^DPDP Rules 2025, /, '').split('(')[0].trim();
      return {
        model_id: 'M01',
        control_id: ctrl.id,
        verdict: 'SUPPORTED',
        confidence: 0.85,
        legal_citations: [{ source_document: 'dpdp-act-2023', section: cleanSec, verbatim_quote: '' }],
        evidence_ids: [ctrl.id === 'TF-PRIV-002' ? `EVID_TEST_SCENARIO_2_LANG` : `EVID_TEST_SCENARIO_2_PURP`],
        reasoning_summary: 'Affirmative compliance observed.',
        identified_gaps: [],
        remediation_steps: [],
      };
    }

    return {
      model_id: 'M01',
      control_id: ctrl.id,
      verdict: 'INSUFFICIENT_EVIDENCE',
      confidence: 0.5,
      legal_citations: [],
      evidence_ids: [],
      reasoning_summary: 'Insufficient evidence.',
      identified_gaps: [],
      remediation_steps: [],
    };
  });

  for (const f of findings) {
    validator.validateAndEnforceFinding(f, evidence);
  }

  const scoreResult = computeModelTrustScore('M01', findings, {
    assessmentId: 'TEST_SCENARIO_2',
    enforceGroundingCheck: true,
  });

  assert.notStrictEqual(scoreResult.trust_score, null, 'Score must be calculated, not null');
  assert.notStrictEqual(scoreResult.posture, 'NOT_SCORABLE', 'Posture must not be NOT_SCORABLE');
  // Score should be noticeably lower than 70 due to multiple non-compliant findings
  assert.ok(scoreResult.trust_score! < 65, `Expected score < 65 for degraded compliance, got ${scoreResult.trust_score}`);
  assert.ok(scoreResult.trust_score! >= 20, `Expected score >= 20, got ${scoreResult.trust_score}`);
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Scenario 3: Negative Compliance (All Non-Compliant)
// ─────────────────────────────────────────────────────────────────────────────

test('Scenario 3: Negative compliance produces genuine 0 score with Low/Critical posture, NOT "NOT_SCORABLE"', () => {
  const evidence = buildWizardEvidence({
    assessmentId: 'TEST_SCENARIO_3',
    collections: ['Website forms'],
    categories: ['identifiers'],
    purposes: ['service'],
    languages: ['en'],
    rights: [],
    processors: [],
    retention: 'No defined schedule',
    erasure_automated: false,
    breach_plan: false,
    grievance_officer_named: false,
    grievance_contact_published: false,
  });

  // All active controls evaluated as NOT_SUPPORTED
  const findings: ModelFinding[] = CANONICAL_CONTROLS.map(ctrl => {
    const cleanSec = ctrl.statutory_ref.replace(/^DPDP Act 2023, |^DPDP Rules 2025, /, '').split('(')[0].trim();
    return {
      model_id: 'M01',
      control_id: ctrl.id,
      verdict: 'NOT_SUPPORTED',
      confidence: 0.9,
      legal_citations: [{
        source_document: 'dpdp-act-2023',
        section: cleanSec,
        verbatim_quote: '',
      }],
      evidence_ids: evidence.map(e => e.id),
      reasoning_summary: `Entity fails statutory mandate for ${ctrl.name}.`,
      identified_gaps: [`Deficient control ${ctrl.name}`],
      remediation_steps: [`Remediate ${ctrl.name}`],
    };
  });

  for (const f of findings) {
    validator.validateAndEnforceFinding(f, evidence);
  }

  const scoreResult = computeModelTrustScore('M01', findings, {
    assessmentId: 'TEST_SCENARIO_3',
    enforceGroundingCheck: true,
  });

  assert.strictEqual(scoreResult.trust_score, 0, 'All-non-compliant must produce Trust Score of 0.0');
  assert.strictEqual(scoreResult.posture, 'Critical', 'Posture must be Critical, NOT NOT_SCORABLE');
  assert.ok(scoreResult.category_scores?.C1.score === 0);
  assert.ok(scoreResult.category_scores?.C1.is_applicable === true);
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Scenario 4 & 5: Dual Mode (Website Scan + Wizard Combined)
// ─────────────────────────────────────────────────────────────────────────────

test('Scenario 5: Dual mode (Website Scan + Wizard Combined) yields high evidence coverage and all-pillar scores', () => {
  const wizardEvidence = buildWizardEvidence({
    assessmentId: 'TEST_SCENARIO_5',
    websiteUrl: 'https://technova.in',
    collections: ['Website forms', 'Mobile application', 'Payment checkout'],
    categories: ['identifiers', 'financial', 'device'],
    purposes: ['service', 'auth', 'analytics'],
    languages: ['en', 'hi', 'kn'],
    rights: ['access', 'correction', 'erasure', 'grievance'],
    processors: ['AWS', 'Razorpay'],
    retention: 'As long as active then 90 days',
    erasure_automated: true,
    breach_plan: true,
    grievance_officer_named: true,
    grievance_contact_published: true,
  });

  const crawlerEvidence: EvidenceItem[] = [
    {
      id: 'EVID_SCAN_HTTPS',
      source_type: 'WEBSITE_SCAN',
      source_url: 'https://technova.in',
      key: 'transport_security',
      label: 'TLS / HTTPS Transport Security',
      value: { https: true, hsts: true, cert_valid: true },
      status: 'VERIFIED',
      confidence: 1.0,
      extracted_at: new Date().toISOString(),
    },
    {
      id: 'EVID_SCAN_HEADERS',
      source_type: 'WEBSITE_SCAN',
      source_url: 'https://technova.in',
      key: 'security_headers',
      label: 'Defensive Security Headers',
      value: { csp: true, x_frame_options: 'DENY', strict_transport_security: true },
      status: 'VERIFIED',
      confidence: 1.0,
      extracted_at: new Date().toISOString(),
    },
    {
      id: 'EVID_SCAN_COOKIES',
      source_type: 'WEBSITE_SCAN',
      source_url: 'https://technova.in',
      key: 'cookie_consent_tracker',
      label: 'Third-Party Trackers & Cookies',
      value: { trackers_blocked_prior_to_consent: true, total_trackers: 0 },
      status: 'VERIFIED',
      confidence: 1.0,
      extracted_at: new Date().toISOString(),
    },
    {
      id: 'EVID_SCAN_POLICY',
      source_type: 'WEBSITE_SCAN',
      source_url: 'https://technova.in/privacy',
      key: 'privacy_policy_notice',
      label: 'Privacy Notice Content',
      value: 'TechNova Solutions Privacy Notice pursuant to DPDP Act 2023. Notice is itemised.',
      status: 'VERIFIED',
      confidence: 1.0,
      extracted_at: new Date().toISOString(),
    },
  ];

  const fullEvidence = [...wizardEvidence, ...crawlerEvidence];

  // All 20 controls have supporting evidence in dual mode
  const findings: ModelFinding[] = CANONICAL_CONTROLS.map(ctrl => {
    const cleanSec = ctrl.statutory_ref.replace(/^DPDP Act 2023, |^DPDP Rules 2025, /, '').split('(')[0].trim();
    return {
      model_id: 'M01',
      control_id: ctrl.id,
      verdict: 'SUPPORTED',
      confidence: 0.95,
      legal_citations: [{
        source_document: 'dpdp-act-2023',
        section: cleanSec,
        verbatim_quote: '',
      }],
      evidence_ids: fullEvidence.map(e => e.id),
      reasoning_summary: `Observed verified evidence supports ${ctrl.name}.`,
      identified_gaps: [],
      remediation_steps: [],
    };
  });

  for (const f of findings) {
    validator.validateAndEnforceFinding(f, fullEvidence);
  }

  const scoreResult = computeModelTrustScore('M01', findings, {
    assessmentId: 'TEST_SCENARIO_5',
    hasHttps: true,
    hasPrivacyNotice: true,
    enforceGroundingCheck: true,
  });

  assert.strictEqual(scoreResult.trust_score, 100);
  assert.strictEqual(scoreResult.posture, 'Strong Alignment');
  assert.strictEqual(scoreResult.evidence_coverage, 100);
  assert.strictEqual(scoreResult.critical_failure_cap_applied, false);

  const pillars = Object.values(scoreResult.pillar_scores);
  for (const p of pillars) {
    assert.strictEqual(p.score, 100, `Pillar ${p.pillar_name} should score 100`);
    assert.strictEqual(p.evidence_coverage, 100);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Scenario 6: Truly Zero Evidence (Unscoreable Edge Case)
// ─────────────────────────────────────────────────────────────────────────────

test('Scenario 6: Zero evidence across all controls correctly produces trust_score: null and posture: Not Scorable', () => {
  const zeroEvidence: EvidenceItem[] = [];

  const findings: ModelFinding[] = CANONICAL_CONTROLS.map(ctrl => ({
    model_id: 'M01',
    control_id: ctrl.id,
    verdict: 'INSUFFICIENT_EVIDENCE',
    confidence: 0.0,
    legal_citations: [],
    evidence_ids: [],
    reasoning_summary: 'No evidence observed.',
    identified_gaps: ['No evidence'],
    remediation_steps: [],
  }));

  for (const f of findings) {
    validator.validateAndEnforceFinding(f, zeroEvidence);
  }

  const scoreResult = computeModelTrustScore('M01', findings, {
    assessmentId: 'TEST_SCENARIO_6',
    enforceGroundingCheck: true,
  });

  assert.strictEqual(scoreResult.trust_score, null, 'Must be null when zero evidence is available');
  assert.strictEqual(scoreResult.posture, 'Not Scorable', 'Must evaluate to Not Scorable');
  assert.strictEqual(scoreResult.evidence_coverage, 0);
});
