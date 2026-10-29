import dotenv from 'dotenv';
dotenv.config({ path: 'C:/TF new V1/TrustForge/api/.env' });
import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');

import { LLMGateway, RESEARCH_MODELS } from './src/gateway/llmGateway.js';
import { GroundingValidator } from './src/validator/groundingValidator.js';
import { CANONICAL_CONTROLS, computeModelTrustScore } from './src/scoring/trustScoreEngine.js';
import { EvidenceItem } from './src/types/index.js';

async function main() {
  console.log('=== PHASE 4.3 COMPREHENSIVE LIVE EXECUTION VERIFICATION ===\n');

  const gateway = new LLMGateway();
  const validator = new GroundingValidator();

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
  ];

  const testControls = [
    {
      id: CANONICAL_CONTROLS[0].id,
      name: CANONICAL_CONTROLS[0].name,
      pillar: CANONICAL_CONTROLS[0].pillar,
      statutoryRef: CANONICAL_CONTROLS[0].statutory_ref,
      retrievedLegalContext: `DPDP Act 2023 ${CANONICAL_CONTROLS[0].statutory_ref}: The Data Fiduciary shall give to the Data Principal an itemised notice containing description of personal data sought to be collected and the purpose for which such personal data is to be processed.`,
      relevantEvidence: safeEvidence,
    }
  ];

  const payload = {
    websiteUrl: 'https://example-dpdp.in',
    evidence: safeEvidence,
    controls: testControls,
  };

  // Test M04 (OpenRouter Gemma 4 31B :free)
  const m04 = RESEARCH_MODELS.find(m => m.id === 'M04')!;
  console.log(`\nEvaluating [M04] ${m04.name} via ${m04.provider}...`);
  try {
    const t0 = Date.now();
    const resM04 = await gateway.evaluateBatchModel(m04, payload);
    const durationMs = Date.now() - t0;
    console.log(`M04 Status: ${resM04.status} (${durationMs}ms) | Tokens: P=${resM04.prompt_tokens}, C=${resM04.completion_tokens}, Total=${resM04.total_tokens}`);
    if (resM04.findings?.length > 0) {
      const f = resM04.findings[0];
      const ctrlContext = {
        controlId: f.control_id,
        statutoryRef: 'Section 5(1)',
        combinedContextText: testControls[0].retrievedLegalContext,
        chunks: [],
      };
      const gRes = validator.validateAndEnforceFinding(f, safeEvidence, ctrlContext as any, { modelId: 'M04' });
      console.log(`M04 Finding: Verdict=${f.verdict} (raw: ${f.raw_verdict}), Grounded=${f.is_grounded}, Score=${f.grounding_score}`);
    }
  } catch (err: any) {
    console.error('M04 Error:', err.message);
  }

  // Test M08 (Sarvam DeepSeek V4.1 Flash)
  const m08 = RESEARCH_MODELS.find(m => m.id === 'M08')!;
  console.log(`\nEvaluating [M08] ${m08.name} via ${m08.provider}...`);
  try {
    const t0 = Date.now();
    const resM08 = await gateway.evaluateBatchModel(m08, payload);
    const durationMs = Date.now() - t0;
    console.log(`M08 Status: ${resM08.status} (${durationMs}ms) | Tokens: P=${resM08.prompt_tokens}, C=${resM08.completion_tokens}, Total=${resM08.total_tokens}`);
    if (resM08.findings?.length > 0) {
      const f = resM08.findings[0];
      const ctrlContext = {
        controlId: f.control_id,
        statutoryRef: 'Section 5(1)',
        combinedContextText: testControls[0].retrievedLegalContext,
        chunks: [],
      };
      const gRes = validator.validateAndEnforceFinding(f, safeEvidence, ctrlContext as any, { modelId: 'M08' });
      console.log(`M08 Finding: Verdict=${f.verdict} (raw: ${f.raw_verdict}), Grounded=${f.is_grounded}, Score=${f.grounding_score}`);
    }
  } catch (err: any) {
    console.error('M08 Error:', err.message);
  }

  // Test M09 (Sarvam 105B)
  const m09 = RESEARCH_MODELS.find(m => m.id === 'M09')!;
  console.log(`\nEvaluating [M09] ${m09.name} via ${m09.provider}...`);
  try {
    const t0 = Date.now();
    const resM09 = await gateway.evaluateBatchModel(m09, payload);
    const durationMs = Date.now() - t0;
    console.log(`M09 Status: ${resM09.status} (${durationMs}ms) | Tokens: P=${resM09.prompt_tokens}, C=${resM09.completion_tokens}, Total=${resM09.total_tokens}`);
    if (resM09.findings?.length > 0) {
      const f = resM09.findings[0];
      const ctrlContext = {
        controlId: f.control_id,
        statutoryRef: 'Section 5(1)',
        combinedContextText: testControls[0].retrievedLegalContext,
        chunks: [],
      };
      const gRes = validator.validateAndEnforceFinding(f, safeEvidence, ctrlContext as any, { modelId: 'M09' });
      console.log(`M09 Finding: Verdict=${f.verdict} (raw: ${f.raw_verdict}), Grounded=${f.is_grounded}, Score=${f.grounding_score}`);
    }
  } catch (err: any) {
    console.error('M09 Error:', err.message);
  }
}

main().catch(console.error);

