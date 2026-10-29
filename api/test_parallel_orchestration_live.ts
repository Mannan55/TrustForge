/**
 * True Parallel LLM Orchestration Live Verification Suite.
 * Validates Phase C requirements:
 * 1. Bounded concurrent execution across candidate models using Promise.allSettled.
 * 2. Mathematical proof of overlapping inference intervals (concurrency overlap).
 * 3. Wall-clock duration vs sum of individual latencies (speedup factor).
 * 4. Model identity verification (requested vs actual provider model ID, request_id, tokens).
 * 5. Honest non-run statuses (AUTH_REQUIRED) for models lacking external API keys.
 */
import dotenv from 'dotenv';
dotenv.config({ path: 'C:/TF new V1/TrustForge/api/.env' });
import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');

import { LLMGateway, RESEARCH_MODELS, BatchControlPayload } from './src/gateway/llmGateway.js';
import { CANONICAL_CONTROLS } from './src/scoring/trustScoreEngine.js';
import { GroundingValidator } from './src/validator/groundingValidator.js';

async function main() {
  console.log('========================================================================');
  console.log('TrustForge True Parallel LLM Orchestration Verification (Phase C / P0)');
  console.log('========================================================================\n');

  const gateway = new LLMGateway();
  const validator = new GroundingValidator();

  // Pick representative canonical controls for benchmark testing
  const sampleControls = CANONICAL_CONTROLS.slice(0, 3).map(c => ({
    id: c.id,
    name: c.name,
    pillar: c.pillar,
    statutoryRef: c.statutory_ref,
    retrievedLegalContext: `Statutory Mandate: ${c.statutory_ref}. Data Fiduciaries must implement appropriate measures.`,
    relevantEvidence: [
      {
        id: `EVID_${c.id}_01`,
        source_type: 'WEBSITE_SCAN' as const,
        key: 'privacy_policy_published',
        label: 'Privacy Policy Published',
        value: { exists: true, url: 'https://technova.in/privacy' },
        status: 'VERIFIED' as const,
        confidence: 0.95,
        extracted_at: new Date().toISOString(),
      },
    ],
  }));

  const payload: BatchControlPayload = {
    websiteUrl: 'https://technova.in',
    evidence: sampleControls.flatMap(c => c.relevantEvidence),
    controls: sampleControls,
  };

  const t0 = Date.now();
  console.log('Dispatching parallel batch across all 10 candidate model slots...');
  const batchResult = await gateway.evaluateAllModelsBatch(payload);
  const totalWallClock = Date.now() - t0;

  console.log(`\n========================================================================`);
  console.log(`PARALLEL EXECUTION OUTCOME TABLE`);
  console.log(`========================================================================`);
  console.log(`Slot | Model Name              | Provider   | Status         | Start(ms) | End(ms) | Latency | Req ID / Reason`);
  console.log(`-----+-------------------------+------------+----------------+-----------+---------+---------+---------------------`);

  const orch = batchResult.orchestration!;
  const timeline = orch.timeline;

  for (const item of timeline) {
    const res = batchResult[item.model_id];
    const slot = item.model_id.padEnd(4);
    const name = item.name.slice(0, 23).padEnd(23);
    const prov = item.provider.padEnd(10);
    const status = item.status.padEnd(14);
    const sMs = String(item.start_ms).padStart(9);
    const eMs = String(item.end_ms).padStart(7);
    const lat = `${item.duration_ms}ms`.padStart(7);
    const info = (res.request_id || res.error || 'N/A').slice(0, 35);
    console.log(`${slot} | ${name} | ${prov} | ${status} | ${sMs} | ${eMs} | ${lat} | ${info}`);
  }

  console.log(`========================================================================\n`);

  console.log('--- Concurrency & Performance Metrics ---');
  console.log(`Total Models Scheduled     : ${orch.total_models}`);
  console.log(`Started Concurrently       : ${orch.started_concurrently}`);
  console.log(`Completed Real Inferences  : ${orch.completed_models}`);
  console.log(`Wall-Clock Duration        : ${totalWallClock}ms`);
  console.log(`Sum of Model Latencies     : ${orch.sum_latencies_ms}ms`);
  console.log(`Parallel Speedup Factor    : ${orch.speedup_factor}x`);
  console.log(`Concurrency Overlap Status : ${orch.concurrency_overlap_verified ? 'VERIFIED (OVERLAPPING CALLS DETECTED)' : 'SEQUENTIAL'}`);

  console.log('\n--- Model Identity & Provenance Verification ---');
  for (const model of RESEARCH_MODELS) {
    const res = batchResult[model.id];
    if (res.is_real_inference) {
      console.log(`[${model.id}] ${model.name}:`);
      console.log(`      Requested Model Tag : ${res.requested_model_id}`);
      console.log(`      Actual Provider ID  : ${res.actual_model_id}`);
      console.log(`      Request ID          : ${res.request_id}`);
      console.log(`      Token Usage         : Prompt=${res.prompt_tokens}, Completion=${res.completion_tokens}, Total=${res.total_tokens}`);
      console.log(`      Findings Returned   : ${res.findings.length} findings`);
      console.log(`      Context SHA-256 Hash: ${res.context_hash}`);
    }
  }

  if (!orch.concurrency_overlap_verified && orch.completed_models >= 2) {
    console.warn('\nWARNING: Multiple models succeeded but no temporal overlap was detected.');
  } else if (orch.completed_models >= 2) {
    console.log('\nSUCCESS: True parallel orchestration confirmed with overlapping network intervals!');
  }
}

main().catch(console.error);
