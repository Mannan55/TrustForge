import dotenv from 'dotenv';
dotenv.config({ path: 'C:/TF new V1/TrustForge/api/.env' });
import { GroundingValidator } from './dist/validator/groundingValidator.js';
import { computeModelTrustScore } from './dist/scoring/trustScoreEngine.js';
import { ModelFinding, EvidenceItem } from './dist/types/index.js';

const validator = new GroundingValidator();

// Safe observed website evidence
const safeEvidence: EvidenceItem[] = [
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

// Frozen legal contexts supplied to the models
const legalContextMap: Record<string, string> = {
  'TF-PRIV-001': 'DPDP Act 2023 Section 5(1): On or before requesting for personal data, the Data Fiduciary shall give to the Data Principal an itemised notice in such manner as may be prescribed, containing description of personal data sought and purpose of processing.',
  'TF-PRIV-002': 'DPDP Act 2023 Section 5(3): The Data Fiduciary shall give to the Data Principal the option to access the contents of the notice in English or any language specified in the Eighth Schedule to the Constitution.',
  'TF-PRIV-003': 'DPDP Act 2023 Section 6(1): Consent given by the Data Principal shall be free, specific, informed, unconditional and unambiguous with a clear affirmative action.',
};

// Preserved empirical responses from live inference runs
const preservedFindings: Record<string, { provider: string; modelName: string; httpStatus: number; findings: ModelFinding[] }> = {
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
        identified_gaps: ['Missing detailed category breakdown'],
        remediation_steps: ['Itemise all data categories in privacy notice'],
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
        identified_gaps: ['Omission of itemised data fields'],
        remediation_steps: ['Enumerate specific data elements collected'],
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
        identified_gaps: ['Notice lacks itemisation of categories'],
        remediation_steps: ['Update notice to list categories'],
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
        identified_gaps: ['Itemised data categories omitted'],
        remediation_steps: ['Add itemised categories'],
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
        identified_gaps: ['Notice lacks itemised description of personal data'],
        remediation_steps: ['Enumerate categories of personal data in notice'],
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
        identified_gaps: ['Absence of itemised data categories'],
        remediation_steps: ['Provide granular notice of data elements'],
      },
    ],
  },
};

console.log('=== TRUSTFORGE REVALIDATION OF PRESERVED MODEL FINDINGS ===\n');

for (const [modelId, record] of Object.entries(preservedFindings)) {
  console.log(`------------------------------------------------------------`);
  console.log(`Slot: [${modelId}] ${record.modelName} | Provider: ${record.provider}`);
  console.log(`HTTP Response: ${record.httpStatus} OK`);

  const validatedFindings: ModelFinding[] = [];
  let groundedCount = 0;

  for (const f of record.findings) {
    const legalCtxText = legalContextMap[f.control_id] || '';
    const ctrlContext = {
      controlId: f.control_id,
      statutoryRef: 'Section 5(1)',
      combinedContextText: legalCtxText,
      chunks: [],
      retrievedAt: new Date().toISOString(),
    };

    const gRes = validator.validateAndEnforceFinding(f, safeEvidence, ctrlContext as any, { modelId });
    validatedFindings.push(f);
    if (f.is_grounded) groundedCount++;

    console.log(`  Control: ${f.control_id}`);
    console.log(`    Effective Verdict: ${f.verdict} (Raw: ${f.raw_verdict})`);
    console.log(`    Is Grounded: ${f.is_grounded} | Grounding Score: ${f.grounding_score}`);
    console.log(`    Diagnostic Type: ${gRes.diagnosticType}`);
    console.log(`    Rejection Reason: ${f.rejection_reason ?? 'None (Fully Grounded)'}`);
  }

  // Calculate Trust Score across validated findings
  const scoreResult = computeModelTrustScore(modelId, validatedFindings);
  console.log(`  Trust Score Assessment: ${scoreResult.is_scorable ? scoreResult.trust_score.toFixed(1) : 'NOT_SCORABLE'} (Scorable: ${scoreResult.is_scorable})`);
  console.log(`  Grounded Ratio: ${groundedCount}/${record.findings.length} (${Math.round((groundedCount / record.findings.length) * 100)}%)`);
}

