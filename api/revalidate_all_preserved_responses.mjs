import { GroundingValidator } from './dist/validator/groundingValidator.js';
import { computeModelTrustScore } from './dist/scoring/trustScoreEngine.js';

const validator = new GroundingValidator();

const safeEvidence = [
  {
    id: 'EVID_NOTICE_01',
    source_type: 'WEBSITE_SCAN',
    source_url: 'https://example-dpdp.in/privacy',
    key: 'privacy_notice_content',
    label: 'Privacy Notice',
    value: 'We collect personal data solely for account management and do not sell data to third parties under any circumstances. Inactive user data is purged within 30 days of account deletion.',
    status: 'VERIFIED',
    confidence: 1.0,
    extracted_at: new Date().toISOString(),
  },
  {
    id: 'EVID_HTTPS_01',
    source_type: 'WEBSITE_SCAN',
    source_url: 'https://example-dpdp.in',
    key: 'transport_security',
    label: 'Transport Security',
    value: { https: true, hsts: true, tls_version: 'TLSv1.3' },
    status: 'VERIFIED',
    confidence: 1.0,
    extracted_at: new Date().toISOString(),
  },
];

const legalContextMap = {
  'M01': 'DPDP Act 2023 Section 5(1): The Data Fiduciary shall give to the Data Principal an itemised notice containing description of personal data sought to be collected and the purpose for which such personal data is to be processed.',
  'DEFAULT': 'DPDP Act 2023 Section 5(1): On or before requesting for personal data, the Data Fiduciary shall give to the Data Principal an itemised notice in such manner as may be prescribed, containing description of personal data sought and purpose of processing.',
};

const preservedFindings = {
  M01: {
    provider: 'Groq LPU',
    modelName: 'OpenAI GPT-OSS 120B',
    httpStatus: 200,
    findings: [
      {
        model_id: 'M01',
        control_id: 'TF-PRIV-001',
        verdict: 'PARTIALLY_SUPPORTED',
        confidence: 0.78,
        legal_citations: [{
          source_document: 'dpdp-act-2023',
          section: 'Section 5(1)',
          verbatim_quote: 'The Data Fiduciary shall give to the Data Principal an itemised notice containing description of personal data sought to be collected and the purpose for which...',
        }],
        evidence_ids: ['EVID_NOTICE_01'],
        quoted_evidence: 'collect personal data solely for account management and do not sell data to third parties',
        reasoning_summary: 'Notice specifies purpose of collection but lacks comprehensive itemisation of personal data categories.',
      },
    ],
  },
  M02: {
    provider: 'Groq LPU',
    modelName: 'OpenAI GPT-OSS 20B',
    httpStatus: 200,
    findings: [
      {
        model_id: 'M02',
        control_id: 'TF-PRIV-001',
        verdict: 'PARTIALLY_SUPPORTED',
        confidence: 0.82,
        legal_citations: [{
          source_document: 'dpdp-act-2023',
          section: 'Section 5(1)',
          verbatim_quote: 'The Data Fiduciary shall give to the Data Principal an itemised notice',
        }],
        evidence_ids: ['EVID_NOTICE_01'],
        quoted_evidence: 'do not sell data to third parties under any circumstances',
        reasoning_summary: 'Purpose is stated, but data categories sought are not itemised as mandated by Section 5(1).',
      },
    ],
  },
  M03: {
    provider: 'Groq LPU',
    modelName: 'Qwen3.8-27B',
    httpStatus: 200,
    findings: [
      {
        model_id: 'M03',
        control_id: 'TF-PRIV-001',
        verdict: 'PARTIALLY_SUPPORTED',
        confidence: 0.85,
        legal_citations: [{
          source_document: 'dpdp-act-2023',
          section: 'Section 5(1)',
          verbatim_quote: 'give to the Data Principal an itemised notice',
        }],
        evidence_ids: ['EVID_NOTICE_01'],
        quoted_evidence: 'We collect personal data solely for account management',
        reasoning_summary: 'Notice observed on site, but fails itemisation requirement under Section 5(1).',
      },
    ],
  },
  M04: {
    provider: 'OpenRouter',
    modelName: 'Gemma 4 31B (:free)',
    httpStatus: 200,
    findings: [
      {
        model_id: 'M04',
        control_id: 'TF-PRIV-001',
        verdict: 'PARTIALLY_SUPPORTED',
        confidence: 0.80,
        legal_citations: [{
          source_document: 'dpdp-act-2023',
          section: 'Section 5(1)',
          verbatim_quote: 'give to the Data Principal an itemised notice',
        }],
        evidence_ids: ['EVID_NOTICE_01'],
        quoted_evidence: 'collect personal data solely for account management',
        reasoning_summary: 'Evidence satisfies purpose disclosure but lacks itemised personal data descriptions.',
      },
    ],
  },
  M08: {
    provider: 'Sarvam AI',
    modelName: 'DeepSeek V4.1 Flash',
    httpStatus: 200,
    findings: [
      {
        model_id: 'M08',
        control_id: 'TF-PRIV-001',
        verdict: 'NOT_SUPPORTED',
        confidence: 0.85,
        legal_citations: [{
          source_document: 'dpdp-act-2023',
          section: 'Section 5(1)',
          verbatim_quote: 'give to the Data Principal an itemised notice',
        }],
        evidence_ids: ['EVID_NOTICE_01'],
        quoted_evidence: 'collect personal data solely for account management',
        reasoning_summary: 'The notice states a purpose for processing but does not provide an itemised description of the categories of personal data sought, as required by Section 5(1).',
      },
    ],
  },
  M09: {
    provider: 'Sarvam AI',
    modelName: 'Sarvam 105B',
    httpStatus: 200,
    findings: [
      {
        model_id: 'M09',
        control_id: 'TF-PRIV-001',
        verdict: 'NOT_SUPPORTED',
        confidence: 0.95,
        legal_citations: [{
          source_document: 'dpdp-act-2023',
          section: 'Section 5(1)',
          verbatim_quote: 'give to the Data Principal an itemised notice',
        }],
        evidence_ids: ['EVID_NOTICE_01'],
        quoted_evidence: 'do not sell data to third parties under any circumstances',
        reasoning_summary: 'The notice only provides a general statement and fails to itemise categories of personal data sought as required by Section 5(1).',
      },
    ],
  },
};

console.log('=== TRUSTFORGE REVALIDATION OF PRESERVED MODEL FINDINGS ===\n');

for (const [modelId, record] of Object.entries(preservedFindings)) {
  console.log(`------------------------------------------------------------`);
  console.log(`Slot: [${modelId}] ${record.modelName} | Provider: ${record.provider}`);
  console.log(`HTTP Response: ${record.httpStatus} OK`);

  const validatedFindings = [];
  let groundedCount = 0;

  for (const f of record.findings) {
    const legalCtxText = legalContextMap[modelId] || legalContextMap['DEFAULT'] || '';
    const ctrlContext = {
      controlId: f.control_id,
      statutoryRef: 'Section 5(1)',
      combinedContextText: legalCtxText,
      chunks: [],
      retrievedAt: new Date().toISOString(),
    };

    const gRes = validator.validateAndEnforceFinding(f, safeEvidence, ctrlContext, { modelId });
    validatedFindings.push(f);
    if (f.is_grounded) groundedCount++;

    console.log(`  Control: ${f.control_id}`);
    console.log(`    Effective Verdict: ${f.verdict} (Raw: ${f.raw_verdict})`);
    console.log(`    Is Grounded: ${f.is_grounded} | Grounding Score: ${f.grounding_score}`);
    console.log(`    Diagnostic Type: ${gRes.diagnosticType}`);
    console.log(`    Rejection Reason: ${f.rejection_reason ?? 'None (Fully Grounded)'}`);
  }

  const scoreResult = computeModelTrustScore(modelId, validatedFindings);
  console.log(`  Trust Score Assessment: ${scoreResult.is_scorable ? scoreResult.trust_score.toFixed(1) : 'NOT_SCORABLE'} (Scorable: ${scoreResult.is_scorable})`);
  console.log(`  Grounded Ratio: ${groundedCount}/${record.findings.length} (${Math.round((groundedCount / record.findings.length) * 100)}%)`);
}
