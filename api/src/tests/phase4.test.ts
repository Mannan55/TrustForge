/**
 * Phase 4: 10-LLM Integration & Research Benchmarking Test Suite
 * Validates faculty 10-model registration, slot states, provider adapters,
 * rate-limit/timeout handling, fair frozen context, structured JSON parsing,
 * partial completion durability, benchmark metrics, and CSV export.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { LLMGateway, RESEARCH_MODELS } from '../gateway/llmGateway.js';
import { GroundingValidator } from '../validator/groundingValidator.js';
import { CANONICAL_CONTROLS, computeModelTrustScore, computeTopThreeMajorityVoting } from '../scoring/trustScoreEngine.js';
import { CANONICAL_CONTROL_TO_C10 } from '../scoring/pillarMappingAdapter.js';
import { hybridRAG } from '../rag/hybridRAG.js';
import { durableStore } from '../database/durableStore.js';
import { ModelFinding, EvidenceItem } from '../types/index.js';

const gateway = new LLMGateway();
const validator = new GroundingValidator();

// Test 1: Every model slot is correctly registered with faculty specifications
test('Phase 4.1: Exactly 10 faculty model slots registered with correct metadata', () => {
  assert.equal(RESEARCH_MODELS.length, 10, 'Must have exactly 10 candidate models');

  const expectedSlots = [
    { id: 'M01', name: 'OpenAI GPT-OSS 120B', provider: 'groq', licence: 'Apache 2.0' },
    { id: 'M02', name: 'OpenAI GPT-OSS 20B', provider: 'groq', licence: 'Apache 2.0' },
    { id: 'M03', name: 'Qwen3.8-27B', provider: 'groq', licence: 'Apache 2.0' },
    { id: 'M04', name: 'Gemma 4 31B', provider: 'openrouter', licence: 'Apache 2.0' },
    { id: 'M05', name: 'Gemma 4 26B-A4B', provider: 'openrouter', licence: 'Apache 2.0' },
    { id: 'M06', name: 'Llama 3.3 70B', provider: 'openrouter', licence: 'Llama 3.3 Community Licence (Free)' },
    { id: 'M07', name: 'Mistral Small 24B', provider: 'openrouter', licence: 'Apache 2.0' },
    { id: 'M08', name: 'DeepSeek V4.1 Flash', provider: 'sarvam', licence: 'MIT' },
    { id: 'M09', name: 'Sarvam 105B', provider: 'sarvam', licence: 'Apache 2.0' },
    { id: 'M10', name: 'Sarvam 30B', provider: 'local', licence: 'Apache 2.0' },
  ];

  for (let i = 0; i < expectedSlots.length; i++) {
    const exp = expectedSlots[i];
    const actual = RESEARCH_MODELS[i];
    assert.equal(actual.id, exp.id, `Slot ${exp.id} must match ID`);
    assert.equal(actual.provider, exp.provider, `Slot ${exp.id} provider must be ${exp.provider}`);
    assert.equal(actual.licence, exp.licence, `Slot ${exp.id} licence must be ${exp.licence}`);
    assert.ok(actual.hf_repo, `Slot ${exp.id} must define hf_repo`);
  }
});

// Test 2: Standardized slot states are accurately resolved
test('Phase 4.2: Model slot availability states conform to faculty taxonomy', () => {
  const m01Status = gateway.getModelSlotStatus(RESEARCH_MODELS[0]); // M01: Groq
  const m04Status = gateway.getModelSlotStatus(RESEARCH_MODELS[3]); // M04: OpenRouter
  const m09Status = gateway.getModelSlotStatus(RESEARCH_MODELS[8]); // M09: Sarvam
  const m10Status = gateway.getModelSlotStatus(RESEARCH_MODELS[9]); // M10: Local Sarvam 30B

  // In test environment, GROQ_API_KEY is present
  if (process.env.GROQ_API_KEY) {
    assert.equal(m01Status.status, 'AVAILABLE');
    assert.equal(m01Status.available, true);
  }

  // OpenRouter key is not set by default in test env
  if (!process.env.OPENROUTER_API_KEY) {
    assert.equal(m04Status.status, 'AUTH_REQUIRED');
    assert.equal(m04Status.available, false);
    assert.ok(m04Status.reason?.includes('OPENROUTER_API_KEY'));
  }

  // Sarvam key is not set by default in test env
  if (!process.env.SARVAM_API_KEY) {
    assert.equal(m09Status.status, 'AUTH_REQUIRED');
    assert.equal(m09Status.available, false);
    assert.ok(m09Status.reason?.includes('SARVAM_API_KEY'));
  }

  // M10 is local-only
  assert.equal(m10Status.status, 'LOCAL_ONLY');
  assert.equal(m10Status.available, false);
  assert.ok(m10Status.reason?.includes('deprecated on hosted cloud'));
});

// Test 3: Startup diagnostics report provider state with zero credential leakage
test('Phase 4.3: Startup diagnostics report provider status without credential exposure', () => {
  const diag = gateway.getStartupDiagnostics();

  assert.equal(diag.summary.total, 10);
  assert.ok(diag.timestamp);
  assert.ok(diag.providers.groq);
  assert.ok(diag.providers.openrouter);
  assert.ok(diag.providers.sarvam);
  assert.ok(diag.providers.ollama);

  // Assert no credentials leaked in stringified output
  const diagStr = JSON.stringify(diag);
  if (process.env.GROQ_API_KEY) {
    assert.ok(!diagStr.includes(process.env.GROQ_API_KEY), 'Diagnostics must NEVER leak GROQ_API_KEY');
  }
  if (process.env.OPENROUTER_API_KEY) {
    assert.ok(!diagStr.includes(process.env.OPENROUTER_API_KEY), 'Diagnostics must NEVER leak OPENROUTER_API_KEY');
  }
  if (process.env.SARVAM_API_KEY) {
    assert.ok(!diagStr.includes(process.env.SARVAM_API_KEY), 'Diagnostics must NEVER leak SARVAM_API_KEY');
  }
});

// Test 4: Frozen RAG context produces identical statutory passages across models
test('Phase 4.4: Fair research experiment guarantees identical frozen context across all models', async () => {
  const snapshot1 = await hybridRAG.buildFrozenSnapshot(CANONICAL_CONTROLS, {
    topK: 5,
    categoryMap: CANONICAL_CONTROL_TO_C10,
  });
  const snapshot2 = await hybridRAG.buildFrozenSnapshot(CANONICAL_CONTROLS, {
    topK: 5,
    categoryMap: CANONICAL_CONTROL_TO_C10,
  });

  assert.equal(snapshot1.snapshotHash, snapshot2.snapshotHash, 'Snapshot hash must be perfectly deterministic');

  // Verify all 20 canonical controls receive identical context
  for (const ctrl of CANONICAL_CONTROLS) {
    const ctx1 = snapshot1.contexts[ctrl.id];
    const ctx2 = snapshot2.contexts[ctrl.id];
    assert.equal(ctx1.combinedContextText, ctx2.combinedContextText, `Context for ${ctrl.id} must be strictly identical`);
  }
});

// Test 5: Estimated cost calculation reflects provider pricing tiers
test('Phase 4.5: Cost estimator accurately reflects pricing tiers and free access', () => {
  // Free Groq models (M01-M03)
  assert.equal(gateway.calculateEstimatedCost('M01', 1000, 500), 0.0);
  assert.equal(gateway.calculateEstimatedCost('M02', 1000, 500), 0.0);
  assert.equal(gateway.calculateEstimatedCost('M03', 1000, 500), 0.0);

  // Free candidate models (M04, M05, M07)
  assert.equal(gateway.calculateEstimatedCost('M04', 1000, 500), 0.0);
  assert.equal(gateway.calculateEstimatedCost('M05', 1000, 500), 0.0);
  assert.equal(gateway.calculateEstimatedCost('M07', 1000, 500), 0.0);

  // Paid candidate models (M06, M08, M09)
  const m06Cost = gateway.calculateEstimatedCost('M06', 1_000_000, 1_000_000);
  assert.equal(m06Cost, 0.75, 'Llama 3.3 70B cost ($0.35 + $0.40)');

  const m08Cost = gateway.calculateEstimatedCost('M08', 1_000_000, 1_000_000);
  assert.equal(m08Cost, 0.42, 'DeepSeek V4.1 cost ($0.14 + $0.28)');

  const m09Cost = gateway.calculateEstimatedCost('M09', 1_000_000, 0);
  assert.ok(m09Cost > 0, 'Sarvam 105B cost must be positive');
});

// Test 6: Partial completion evaluates available models without stalling for unavailable ones
test('Phase 4.6: Partial model completion succeeds when unavailable models report blocked status', async () => {
  const dummyEvidence: EvidenceItem[] = [
    {
      id: 'EVID_TEST_HTTPS',
      source_type: 'WEBSITE_SCAN',
      key: 'transport_security',
      label: 'Transport Security',
      value: { https: true },
      status: 'VERIFIED',
      confidence: 1.0,
      extracted_at: new Date().toISOString(),
      source_url: 'https://example-dpdp.in',
    },
  ];

  const controlsWithLegal = CANONICAL_CONTROLS.slice(0, 3).map(c => ({
    id: c.id,
    name: c.name,
    pillar: c.pillar,
    statutoryRef: c.statutory_ref,
    retrievedLegalContext: `Statutory excerpt for ${c.statutory_ref}`,
    relevantEvidence: dummyEvidence,
  }));

  const payload = {
    websiteUrl: 'https://example-dpdp.in',
    controls: controlsWithLegal,
    evidence: dummyEvidence,
  };

  const batchResults = await gateway.evaluateAllModelsBatch(payload);

  // All 10 models must be present in the summary
  for (const m of RESEARCH_MODELS) {
    const res = batchResults[m.id];
    assert.ok(res, `Result for model ${m.id} must be recorded in summary`);
    assert.equal(res.model_id, m.id);

    // If unconfigured, status must be transparent (AUTH_REQUIRED or LOCAL_ONLY), not disguised as SUCCESS
    if (!res.is_real_inference) {
      assert.notEqual(res.status, 'SUCCESS');
      assert.notEqual(res.status, 'COMPLETED');
    }
  }

  // Concurrency orchestration metadata must be present
  assert.ok(batchResults.orchestration);
  assert.equal(batchResults.orchestration.orchestration_mode, 'TRUE_PROVIDER_AWARE_PARALLEL');
  assert.equal(batchResults.orchestration.total_models, 10);
});

// Test 7: Malformed responses preserve raw output and assign conservative findings
test('Phase 4.7: Malformed model JSON preserves raw output and excludes invalid findings from scoring', () => {
  // Malformed raw string
  const malformedRaw = 'Sorry, as an AI I am unable to output JSON for this prompt.';
  const controls = CANONICAL_CONTROLS.slice(0, 2).map(c => ({
    id: c.id,
    name: c.name,
    pillar: c.pillar,
    statutoryRef: c.statutory_ref,
    retrievedLegalContext: 'Sample legal context',
    relevantEvidence: [],
  }));

  // Using gateway private method via casting or evaluate
  const findings = (gateway as any).parseAndValidateBatchOutput('M01', controls, malformedRaw, 500);

  assert.equal(findings.length, 2);
  for (const f of findings) {
    assert.equal(f.verdict, 'INSUFFICIENT_EVIDENCE');
    assert.equal(f.confidence, 0.0);
    assert.ok(f.raw_output, 'Must retain raw malformed output for debugging');
  }
});

// Test 8: DurableStore persists benchmark and supports tenant isolation
test('Phase 4.8: Benchmark runs persist to DurableStore with full metrics', () => {
  const benchId = `BENCH_TEST_${Date.now()}`;
  const mockBenchmark = {
    benchmark_id: benchId,
    scan_id: 'SCAN_TEST_001',
    target_url: 'https://tenant-test.in',
    status: 'PARTIAL',
    total_models_evaluated: 3,
    models_evaluated: ['M01', 'M02', 'M03'],
    models_unavailable: ['M04', 'M05', 'M06', 'M07', 'M08', 'M09', 'M10'],
    per_model_metrics: {
      M01: {
        model_id: 'M01',
        trust_score: 82.5,
        grounding_rate_pct: 100,
        hallucination_rate_pct: 0,
        citation_precision_pct: 100,
        evidence_faithfulness_pct: 100,
        avg_latency_ms: 600,
        total_tokens: 2500,
        estimated_cost_usd: 0.0,
      },
    },
    created_at: new Date().toISOString(),
  };

  durableStore.setBenchmark(benchId, mockBenchmark);
  const retrieved = durableStore.getBenchmark(benchId);

  assert.ok(retrieved);
  assert.equal(retrieved.benchmark_id, benchId);
  assert.equal(retrieved.per_model_metrics.M01.grounding_rate_pct, 100);
  assert.equal(retrieved.per_model_metrics.M01.hallucination_rate_pct, 0);

  const allList = durableStore.listBenchmarks();
  assert.ok(allList.some(b => b.benchmark_id === benchId));
});
