import dotenv from 'dotenv';
dotenv.config({ path: 'c:/TF new V1/TrustForge/api/.env' });

import { LLMGateway } from './src/gateway/llmGateway.js';
import { CANONICAL_CONTROLS } from './src/scoring/trustScoreEngine.js';
import { ragRetriever } from './src/rag/ragRetriever.js';

async function test20() {
  console.log('Testing 20 canonical controls on Groq with token budget optimization...');
  const gateway = new LLMGateway();

  const frozenSnapshot = ragRetriever.buildFrozenSnapshot(CANONICAL_CONTROLS);
  const controlsWithLegal = CANONICAL_CONTROLS.map(ctrl => {
    const ctx = frozenSnapshot.contexts[ctrl.id];
    return {
      id: ctrl.id,
      name: ctrl.name,
      pillar: ctrl.pillar,
      statutoryRef: ctrl.statutory_ref,
      retrievedLegalContext: ctx?.combinedContextText || `Statutory requirement: ${ctrl.statutory_ref}`,
    };
  });

  const dummyEvidence = [
    { id: 'EVID_HTTPS_01', label: 'SSL Enforcement', status: 'PASS', value: { tls_version: 'TLS 1.3', hsts: true } },
    { id: 'EVID_COOKIE_01', label: 'Third-Party Trackers', status: 'GAP', value: { ga4: true, meta_pixel: true, opt_out: false } },
    { id: 'EVID_POLICY_01', label: 'Privacy Policy', status: 'PASS', value: { found: true, mentions_dpdp: true, grievance_officer: true } },
  ];

  console.log(`Starting evaluateAllModelsBatch for ${controlsWithLegal.length} controls...`);
  const results = await gateway.evaluateAllModelsBatch({
    websiteUrl: 'https://example.com',
    controls: controlsWithLegal,
    evidence: dummyEvidence,
  });

  for (const [mId, res] of Object.entries(results)) {
    console.log(`Model ${mId}: Status=${res.status} | Findings=${res.findings.length} | Latency=${res.duration_ms}ms | RealInference=${res.is_real_inference}`);
    if (res.findings.length > 0) {
      console.log(`  Sample Verdict: Control ${res.findings[0].control_id} -> ${res.findings[0].verdict}`);
    }
  }
}

test20().catch(console.error);
