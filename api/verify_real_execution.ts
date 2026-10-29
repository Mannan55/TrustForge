import dotenv from 'dotenv';
dotenv.config({ path: 'C:/TF new V1/TrustForge/api/.env' });
import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');

import { LLMGateway, RESEARCH_MODELS } from './src/gateway/llmGateway.js';
import { GroundingValidator } from './src/validator/groundingValidator.js';
import { CANONICAL_CONTROLS, computeModelTrustScore } from './src/scoring/trustScoreEngine.js';
import { EvidenceItem } from './src/types/index.js';

async function main() {
  console.log('=== TRUSTFORGE REAL MODEL EXECUTION & GROUNDING VERIFICATION ===\n');

  const gateway = new LLMGateway();
  const validator = new GroundingValidator();

  // Print startup diagnostics
  gateway.printStartupDiagnostics();

  // Safe observed test evidence
  const safeEvidence: EvidenceItem[] = [
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

  // Select 3 canonical controls for minimal verification
  const testControls = CANONICAL_CONTROLS.slice(0, 3).map(c => ({
    id: c.id,
    name: c.name,
    pillar: c.pillar,
    statutoryRef: c.statutory_ref,
    retrievedLegalContext: `DPDP Act 2023 ${c.statutory_ref}: The Data Fiduciary shall give to the Data Principal an itemised notice containing description of personal data sought to be collected and the purpose for which such personal data is to be processed.`,
    relevantEvidence: safeEvidence,
  }));

  const payload = {
    websiteUrl: 'https://example-dpdp.in',
    evidence: safeEvidence,
    controls: testControls,
  };

  const groqModels = RESEARCH_MODELS.filter(m => m.provider === 'groq');

  for (const model of groqModels) {
    console.log(`\n------------------------------------------------------------`);
    console.log(`Executing real structured evaluation on ${model.id} (${model.name})...`);
    console.log(`Provider: ${model.provider} | Requested Tag: ${gateway.getRequestedModelId(model.id)}`);

    const t0 = Date.now();
    const result = await gateway.evaluateBatchModel(model, payload);
    const duration = Date.now() - t0;

    console.log(`Execution Status: ${result.status}`);
    console.log(`Duration: ${duration}ms (Gateway latency: ${result.duration_ms}ms)`);
    console.log(`Tokens: Prompt=${result.prompt_tokens ?? 'N/A'}, Completion=${result.completion_tokens ?? 'N/A'}, Total=${result.total_tokens ?? 'N/A'}`);
    console.log(`Estimated Cost: $${result.estimated_cost_usd}`);
    console.log(`Is Real Inference: ${result.is_real_inference}`);
    console.log(`Findings Count: ${result.findings.length}`);

    // Validate findings with strict grounding validator
    let groundedCount = 0;
    for (const finding of result.findings) {
      const ctrl = testControls.find(c => c.id === finding.control_id);
      const ctrlContext = ctrl ? {
        controlId: ctrl.id,
        statutoryRef: ctrl.statutoryRef,
        combinedContextText: ctrl.retrievedLegalContext,
        chunks: [],
      } : undefined;
      const vResult = validator.validateAndEnforceFinding(finding, safeEvidence, ctrlContext as any, { modelId: model.id });
      console.log(`  - Control [${finding.control_id}]: Verdict=${finding.verdict} (raw: ${finding.raw_verdict ?? finding.verdict}), Grounded=${finding.is_grounded}, Score=${finding.grounding_score?.toFixed(2)}`);
      if (finding.rejection_reason) {
        console.log(`    Rejection reason: ${finding.rejection_reason}`);
      }
      if (finding.is_grounded) groundedCount++;
    }
    console.log(`Grounded Findings: ${groundedCount}/${result.findings.length}`);
  }

  console.log(`\n============================================================`);
  console.log(`Status for other candidate models:`);
  for (const m of RESEARCH_MODELS.filter(m => m.provider !== 'groq')) {
    const slot = gateway.getModelSlotStatus(m);
    console.log(`  • [${m.id}] ${m.name.padEnd(25)} | Provider: ${m.provider.padEnd(10)} | Status: ${slot.status} | Reason: ${slot.reason}`);
  }
}

main().catch(console.error);

