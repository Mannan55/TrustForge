/**
 * Phase 5: Research-Aligned TOPSIS Multi-Criteria LLM Ranking & Sensitivity Test Suite.
 * Validates vector normalization, ideal solutions, Euclidean distances, relative closeness,
 * degeneracy guards, tie-breaking, model eligibility filtering, +/-20% sensitivity analysis,
 * Spearman rank correlation, durable persistence, API routes, and regression.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TOPSISEngine,
  topsisEngine,
  CANONICAL_TOPSIS_CRITERIA,
  TOPSIS_WEIGHT_PROFILES,
  SYNTHETIC_RESEARCH_BENCHMARK_FIXTURE,
  extractModelDecisionMetricsFromBenchmark,
} from '../research/topsisEngine.js';
import { durableStore } from '../database/durableStore.js';
import { db } from '../database/supabaseClient.js';
import { CANONICAL_CONTROLS, computeModelTrustScore, computeTopThreeMajorityVoting } from '../scoring/trustScoreEngine.js';
import { GroundingValidator } from '../validator/groundingValidator.js';
import { LLMGateway, RESEARCH_MODELS } from '../gateway/llmGateway.js';
import { ModelDecisionMetrics, TOPSISCriterion, TOPSISWeightProfile, ModelFinding, CriterionDirection, EvidenceItem } from '../types/index.js';

const engine = new TOPSISEngine();
const gateway = new LLMGateway();
const validator = new GroundingValidator();

// ----------------------------------------------------------------------------
// Test 1: Vector normalization correctness
// ----------------------------------------------------------------------------
test('Phase 5.1: Vector normalization computes r_ij = x_ij / sqrt(sum x^2) accurately', () => {
  const matrix = [
    [3, 4],
    [4, 3],
  ];
  // Norms: col 0 = sqrt(9 + 16) = 5; col 1 = sqrt(16 + 9) = 5
  const norm = engine.normalizeMatrix(matrix);
  assert.equal(norm.length, 2);
  assert.equal(norm[0].length, 2);
  assert.ok(Math.abs(norm[0][0] - 0.6) < 1e-6, `Expected 0.6, got ${norm[0][0]}`);
  assert.ok(Math.abs(norm[0][1] - 0.8) < 1e-6, `Expected 0.8, got ${norm[0][1]}`);
  assert.ok(Math.abs(norm[1][0] - 0.8) < 1e-6, `Expected 0.8, got ${norm[1][0]}`);
  assert.ok(Math.abs(norm[1][1] - 0.6) < 1e-6, `Expected 0.6, got ${norm[1][1]}`);
});

// ----------------------------------------------------------------------------
// Test 2: Zero-vector normalization guard
// ----------------------------------------------------------------------------
test('Phase 5.2: Zero-vector normalization guard prevents division by zero (sum x^2 = 0 -> 0)', () => {
  const matrix = [
    [0, 5],
    [0, 10],
  ];
  const norm = engine.normalizeMatrix(matrix);
  assert.equal(norm[0][0], 0, 'Zero column must normalize to 0');
  assert.equal(norm[1][0], 0, 'Zero column must normalize to 0');
  assert.ok(norm[0][1] > 0, 'Non-zero column must normalize positively');
});

// ----------------------------------------------------------------------------
// Test 3: Zero-variance normalization guard
// ----------------------------------------------------------------------------
test('Phase 5.3: Zero-variance column with identical values normalizes uniformly', () => {
  const matrix = [
    [10, 2],
    [10, 4],
    [10, 6],
  ];
  // col 0 norm = sqrt(100 + 100 + 100) = sqrt(300) = 10*sqrt(3)
  // each entry = 10 / (10*sqrt(3)) = 1 / sqrt(3) ~ 0.57735
  const norm = engine.normalizeMatrix(matrix);
  const expected = 1 / Math.sqrt(3);
  for (let i = 0; i < 3; i++) {
    assert.ok(Math.abs(norm[i][0] - expected) < 1e-5, `Row ${i} col 0 must equal 1/sqrt(3)`);
  }
});

// ----------------------------------------------------------------------------
// Test 4: Weight validation & renormalization
// ----------------------------------------------------------------------------
test('Phase 5.4: Weight validation renormalizes weights so sum equals 1.00', () => {
  const unnormalizedWeights = [6, 4];
  const normWeights = engine.validateAndRenormalizeWeights(unnormalizedWeights);
  assert.ok(Math.abs(normWeights[0] - 0.6) < 1e-6);
  assert.ok(Math.abs(normWeights[1] - 0.4) < 1e-6);
  const sum = normWeights[0] + normWeights[1];
  assert.ok(Math.abs(sum - 1.0) < 1e-6, `Sum must be 1.0, got ${sum}`);
});

// ----------------------------------------------------------------------------
// Test 5: Rejection of negative / non-finite weights
// ----------------------------------------------------------------------------
test('Phase 5.5: Weight validation rejects negative or non-finite weights with explicit errors', () => {
  assert.throws(() => {
    engine.validateAndRenormalizeWeights([-0.2]);
  }, /Criteria weights must be >= 0/);

  assert.throws(() => {
    engine.validateAndRenormalizeWeights([NaN]);
  }, /Invalid non-finite weight/);
});

// ----------------------------------------------------------------------------
// Test 6: Weighted matrix computation
// ----------------------------------------------------------------------------
test('Phase 5.6: Weighted matrix computation v_ij = w_j * r_ij applies weights correctly', () => {
  const normalized = [
    [0.6, 0.8],
    [0.8, 0.6],
  ];
  const weights = [0.7, 0.3];
  const weighted = engine.applyWeights(normalized, weights);
  assert.ok(Math.abs(weighted[0][0] - (0.6 * 0.7)) < 1e-6);
  assert.ok(Math.abs(weighted[0][1] - (0.8 * 0.3)) < 1e-6);
  assert.ok(Math.abs(weighted[1][0] - (0.8 * 0.7)) < 1e-6);
  assert.ok(Math.abs(weighted[1][1] - (0.6 * 0.3)) < 1e-6);
});

// ----------------------------------------------------------------------------
// Test 7: Benefit-criterion ideal solutions
// ----------------------------------------------------------------------------
test('Phase 5.7: Benefit criteria set A^+ = max(v_ij) and A^- = min(v_ij)', () => {
  const weighted = [
    [0.2, 0.5],
    [0.7, 0.1],
  ];
  const directions: CriterionDirection[] = ['BENEFIT', 'BENEFIT'];
  const { idealBest, idealWorst } = engine.determineIdealSolutions(weighted, directions);
  assert.equal(idealBest[0], 0.7, 'Benefit ideal best must be maximum');
  assert.equal(idealWorst[0], 0.2, 'Benefit ideal worst must be minimum');
  assert.equal(idealBest[1], 0.5, 'Benefit ideal best must be maximum');
  assert.equal(idealWorst[1], 0.1, 'Benefit ideal worst must be minimum');
});

// ----------------------------------------------------------------------------
// Test 8: Cost-criterion ideal solutions
// ----------------------------------------------------------------------------
test('Phase 5.8: Cost criteria set A^+ = min(v_ij) and A^- = max(v_ij)', () => {
  const weighted = [
    [100, 20],
    [300, 50],
  ];
  const directions: CriterionDirection[] = ['COST', 'COST'];
  const { idealBest, idealWorst } = engine.determineIdealSolutions(weighted, directions);
  assert.equal(idealBest[0], 100, 'Cost ideal best must be minimum');
  assert.equal(idealWorst[0], 300, 'Cost ideal worst must be maximum');
  assert.equal(idealBest[1], 20, 'Cost ideal best must be minimum');
  assert.equal(idealWorst[1], 50, 'Cost ideal worst must be maximum');
});

// ----------------------------------------------------------------------------
// Test 9: Euclidean distances calculation
// ----------------------------------------------------------------------------
test('Phase 5.9: Euclidean distances D_i^+ and D_i^- computed with mathematical fidelity', () => {
  const weightedMatrix = [[3, 4]];
  const idealBest = [0, 0];
  const idealWorst = [6, 8];
  const { distanceBest, distanceWorst } = engine.calculateEuclideanDistances(weightedMatrix, idealBest, idealWorst);
  // distBest = sqrt((3-0)^2 + (4-0)^2) = sqrt(9 + 16) = 5
  // distWorst = sqrt((3-6)^2 + (4-8)^2) = sqrt(9 + 16) = 5
  assert.ok(Math.abs(distanceBest[0] - 5) < 1e-6);
  assert.ok(Math.abs(distanceWorst[0] - 5) < 1e-6);
});

// ----------------------------------------------------------------------------
// Test 10: Relative closeness computation
// ----------------------------------------------------------------------------
test('Phase 5.10: Relative closeness C_i = D_i^- / (D_i^+ + D_i^-) bounded in [0, 1]', () => {
  const c1 = engine.calculateRelativeCloseness([5], [5]);
  assert.equal(c1[0], 0.5);

  const c2 = engine.calculateRelativeCloseness([0], [10]);
  assert.equal(c2[0], 1.0, 'When at ideal best, closeness must be 1.0');

  const c3 = engine.calculateRelativeCloseness([10], [0]);
  assert.equal(c3[0], 0.0, 'When at ideal worst, closeness must be 0.0');
});

// ----------------------------------------------------------------------------
// Test 11: Degenerate distance handling
// ----------------------------------------------------------------------------
test('Phase 5.11: Degenerate distance (D^+ + D^- = 0) returns neutral 0.5 or 1.0 without NaN', () => {
  // Single model degenerate: m=1 returns 1.0
  const cSingle = engine.calculateRelativeCloseness([0], [0]);
  assert.equal(cSingle[0], 1.0);
  assert.ok(!Number.isNaN(cSingle[0]));

  // Multiple models degenerate (m=2) returns 0.5
  const cMulti = engine.calculateRelativeCloseness([0, 0], [0, 0]);
  assert.equal(cMulti[0], 0.5);
  assert.equal(cMulti[1], 0.5);
});

// ----------------------------------------------------------------------------
// Test 12: Single-model ranking
// ----------------------------------------------------------------------------
test('Phase 5.12: Single eligible model ranking produces closeness 1.0 and rank 1', () => {
  const singleCandidate: ModelDecisionMetrics[] = [
    {
      model_id: 'M01',
      model_name: 'Solo Model',
      provider: 'groq',
      metrics: {
        macro_f1: 85.0,
        accuracy: 90.0,
        citation_precision: 95.0,
        evidence_faithfulness: 92.0,
        grounding_rate: 100.0,
        consistency: 90.0,
        median_latency: 2000,
        token_usage: 1500,
        cost_inr: 0.0,
        deployment_feasibility: 90.0,
      },
      is_eligible: true,
      sample_size: 20,
      data_completeness_pct: 100,
    },
  ];
  const result = engine.rankModels(singleCandidate, CANONICAL_TOPSIS_CRITERIA, TOPSIS_WEIGHT_PROFILES.PRIMARY_FACULTY_PROPOSED);
  assert.equal(result.rankedModels.length, 1);
  assert.equal(result.rankedModels[0].rank, 1);
  assert.equal(result.rankedModels[0].closeness_coefficient, 1.0);
});

// ----------------------------------------------------------------------------
// Test 13: Deterministic descending ranking
// ----------------------------------------------------------------------------
test('Phase 5.13: Multi-model ranking orders strictly descending by closeness coefficient', () => {
  const candidates: ModelDecisionMetrics[] = [
    {
      model_id: 'M_WEAK',
      model_name: 'Weak Model',
      provider: 'test',
      metrics: {
        macro_f1: 40.0,
        accuracy: 50.0,
        citation_precision: 40.0,
        evidence_faithfulness: 30.0,
        grounding_rate: 40.0,
        consistency: 50.0,
        median_latency: 9000,
        token_usage: 5000,
        cost_inr: 50.0,
        deployment_feasibility: 30.0,
      },
      is_eligible: true,
      sample_size: 20,
      data_completeness_pct: 100,
    },
    {
      model_id: 'M_STRONG',
      model_name: 'Strong Model',
      provider: 'test',
      metrics: {
        macro_f1: 95.0,
        accuracy: 98.0,
        citation_precision: 98.0,
        evidence_faithfulness: 96.0,
        grounding_rate: 100.0,
        consistency: 95.0,
        median_latency: 1200,
        token_usage: 1200,
        cost_inr: 0.0,
        deployment_feasibility: 95.0,
      },
      is_eligible: true,
      sample_size: 20,
      data_completeness_pct: 100,
    },
  ];

  const result = engine.rankModels(candidates, CANONICAL_TOPSIS_CRITERIA, TOPSIS_WEIGHT_PROFILES.PRIMARY_FACULTY_PROPOSED);
  assert.equal(result.rankedModels[0].model_id, 'M_STRONG');
  assert.equal(result.rankedModels[0].rank, 1);
  assert.equal(result.rankedModels[1].model_id, 'M_WEAK');
  assert.equal(result.rankedModels[1].rank, 2);
  assert.ok(result.rankedModels[0].closeness_coefficient > result.rankedModels[1].closeness_coefficient);
});

// ----------------------------------------------------------------------------
// Test 14: Deterministic tie-breaking behavior
// ----------------------------------------------------------------------------
test('Phase 5.14: Tie-breaking uses secondary criterion then model_id deterministically', () => {
  const candidates: ModelDecisionMetrics[] = [
    {
      model_id: 'M02',
      model_name: 'Model B',
      provider: 'test',
      metrics: {
        macro_f1: 80.0,
        accuracy: 80.0,
        citation_precision: 80.0,
        evidence_faithfulness: 80.0,
        grounding_rate: 80.0,
        consistency: 80.0,
        median_latency: 2000,
        token_usage: 1000,
        cost_inr: 0.0,
        deployment_feasibility: 80.0,
      },
      is_eligible: true,
      sample_size: 20,
      data_completeness_pct: 100,
    },
    {
      model_id: 'M01',
      model_name: 'Model A',
      provider: 'test',
      metrics: {
        macro_f1: 80.0,
        accuracy: 80.0,
        citation_precision: 80.0,
        evidence_faithfulness: 80.0,
        grounding_rate: 80.0,
        consistency: 80.0,
        median_latency: 2000,
        token_usage: 1000,
        cost_inr: 0.0,
        deployment_feasibility: 80.0,
      },
      is_eligible: true,
      sample_size: 20,
      data_completeness_pct: 100,
    },
  ];

  const result = engine.rankModels(candidates, CANONICAL_TOPSIS_CRITERIA, TOPSIS_WEIGHT_PROFILES.PRIMARY_FACULTY_PROPOSED);
  assert.equal(result.rankedModels[0].closeness_coefficient, result.rankedModels[1].closeness_coefficient);
  // Deterministic tie-break by model_id ascending
  assert.equal(result.rankedModels[0].model_id, 'M01');
  assert.equal(result.rankedModels[1].model_id, 'M02');
});

// ----------------------------------------------------------------------------
// Test 15: Model eligibility filtering
// ----------------------------------------------------------------------------
test('Phase 5.15: Model eligibility filtering excludes ineligible models from decision matrix', () => {
  const candidates: ModelDecisionMetrics[] = [
    {
      model_id: 'M01',
      model_name: 'Eligible A',
      provider: 'groq',
      metrics: {
        macro_f1: 85.0,
        accuracy: 85.0,
        citation_precision: 90.0,
        evidence_faithfulness: 90.0,
        grounding_rate: 100.0,
        consistency: 90.0,
        median_latency: 2000,
        token_usage: 1000,
        cost_inr: 0.0,
        deployment_feasibility: 80.0,
      },
      is_eligible: true,
      sample_size: 20,
      data_completeness_pct: 100,
    },
    {
      model_id: 'M05',
      model_name: 'Rate Limited Model',
      provider: 'openrouter',
      metrics: {
        macro_f1: null,
        accuracy: null,
        citation_precision: null,
        evidence_faithfulness: null,
        grounding_rate: null,
        consistency: null,
        median_latency: null,
        token_usage: null,
        cost_inr: null,
        deployment_feasibility: 60.0,
      },
      is_eligible: false,
      ineligibility_reason: 'Provider rate-limited (HTTP 429)',
      sample_size: 0,
      data_completeness_pct: 10,
    },
  ];

  const result = engine.rankModels(candidates, CANONICAL_TOPSIS_CRITERIA, TOPSIS_WEIGHT_PROFILES.PRIMARY_FACULTY_PROPOSED);
  const eligible = result.rankedModels.filter(m => m.is_eligible);
  const ineligible = result.rankedModels.filter(m => !m.is_eligible);
  assert.equal(eligible.length, 1);
  assert.equal(ineligible.length, 1);
  assert.equal(eligible[0].model_id, 'M01');
  assert.equal(eligible[0].rank, 1);
});

// ----------------------------------------------------------------------------
// Test 16: Ineligible models assigned rank -1 with explicit reasons
// ----------------------------------------------------------------------------
test('Phase 5.16: Ineligible models assigned rank -1 with closeness 0.0 and explicit reason', () => {
  const candidate: ModelDecisionMetrics = {
    model_id: 'M10',
    model_name: 'Local Ollama Model',
    provider: 'local',
    metrics: {
      macro_f1: null,
      accuracy: null,
      citation_precision: null,
      evidence_faithfulness: null,
      grounding_rate: null,
      consistency: null,
      median_latency: null,
      token_usage: null,
      cost_inr: null,
      deployment_feasibility: 70.0,
    },
    is_eligible: false,
    ineligibility_reason: 'Ollama daemon not reachable at localhost:11434',
    sample_size: 0,
    data_completeness_pct: 0,
  };

  const result = engine.rankModels([candidate], CANONICAL_TOPSIS_CRITERIA, TOPSIS_WEIGHT_PROFILES.PRIMARY_FACULTY_PROPOSED);
  assert.equal(result.rankedModels[0].rank, -1);
  assert.equal(result.rankedModels[0].closeness_coefficient, 0.0);
  assert.equal(result.rankedModels[0].ineligibility_reason, 'Ollama daemon not reachable at localhost:11434');
});

// ----------------------------------------------------------------------------
// Test 17: Synthetic demonstration fixture ranking validity
// ----------------------------------------------------------------------------
test('Phase 5.17: Synthetic demonstration fixture ranks all 10 candidate models mathematically', () => {
  assert.equal(SYNTHETIC_RESEARCH_BENCHMARK_FIXTURE.length, 10);
  const runResult = engine.executeFullTOPSISRun(SYNTHETIC_RESEARCH_BENCHMARK_FIXTURE, {
    profile: TOPSIS_WEIGHT_PROFILES.PRIMARY_FACULTY_PROPOSED,
    executionMode: 'SYNTHETIC_DEMONSTRATION',
    benchmarkSourceId: 'SYNTHETIC_DEMO',
    runSensitivity: true,
  });

  assert.equal(runResult.execution_mode, 'SYNTHETIC_DEMONSTRATION');
  assert.equal(runResult.ranked_models.length, 10);
  assert.ok(runResult.top_model_id !== null);
  assert.equal(runResult.top_three_model_ids.length, 3);
  assert.ok(runResult.sensitivity_analysis !== undefined);
  assert.ok(runResult.limitations_statement.includes('SYNTHETIC_DEMONSTRATION'));
});

// ----------------------------------------------------------------------------
// Test 18: +/- 20% weight perturbation calculation
// ----------------------------------------------------------------------------
test('Phase 5.18: Sensitivity analysis executes +/-20% perturbations for all active criteria', () => {
  const summary = engine.runSensitivityAnalysis(
    SYNTHETIC_RESEARCH_BENCHMARK_FIXTURE,
    CANONICAL_TOPSIS_CRITERIA,
    TOPSIS_WEIGHT_PROFILES.PRIMARY_FACULTY_PROPOSED,
    0.20
  );

  // Active criteria in PRIMARY_FACULTY_PROPOSED have weight > 0 (7 criteria)
  // Each active criterion tested at +20% and -20% -> 7 * 2 = 14 scenarios
  assert.equal(summary.perturbation_pct, 0.20);
  assert.equal(summary.criteria_tested.length, 7);
  assert.equal(summary.total_scenarios, 14);
  assert.equal(summary.scenarios.length, 14);
});

// ----------------------------------------------------------------------------
// Test 19: Proportional weight renormalization under perturbation
// ----------------------------------------------------------------------------
test('Phase 5.19: Perturbed weights renormalize proportionally so sum strictly equals 1.00', () => {
  const summary = engine.runSensitivityAnalysis(
    SYNTHETIC_RESEARCH_BENCHMARK_FIXTURE,
    CANONICAL_TOPSIS_CRITERIA,
    TOPSIS_WEIGHT_PROFILES.PRIMARY_FACULTY_PROPOSED,
    0.20
  );

  for (const scenario of summary.scenarios) {
    const weights = Object.values(scenario.renormalized_weights);
    const sum = weights.reduce((acc, w) => acc + w, 0);
    assert.ok(Math.abs(sum - 1.0) < 1e-4, `Scenario ${scenario.criterion_id} ${scenario.direction} weight sum must be 1.0, got ${sum}`);
  }
});

// ----------------------------------------------------------------------------
// Test 20: Winner stability computation and metric
// ----------------------------------------------------------------------------
test('Phase 5.20: Winner stability percentage computed across all perturbation scenarios', () => {
  const summary = engine.runSensitivityAnalysis(
    SYNTHETIC_RESEARCH_BENCHMARK_FIXTURE,
    CANONICAL_TOPSIS_CRITERIA,
    TOPSIS_WEIGHT_PROFILES.PRIMARY_FACULTY_PROPOSED,
    0.20
  );

  assert.ok(summary.winner_stability_pct >= 0 && summary.winner_stability_pct <= 100);
  assert.equal(typeof summary.is_overall_winner_stable, 'boolean');
  assert.equal(summary.stable_scenarios_count + (summary.total_scenarios - summary.stable_scenarios_count), summary.total_scenarios);
});

// ----------------------------------------------------------------------------
// Test 21: Spearman rank correlation (rho) calculation
// ----------------------------------------------------------------------------
test('Phase 5.21: Spearman rank correlation rho correctly computes rank concordance', () => {
  // Identical ranks -> rho = 1.0
  const rhoIdentical = engine.calculateSpearmanRho([1, 2, 3, 4], [1, 2, 3, 4]);
  assert.ok(Math.abs(rhoIdentical - 1.0) < 1e-6, `Expected 1.0, got ${rhoIdentical}`);

  // Reversed ranks -> rho = -1.0
  const rhoReversed = engine.calculateSpearmanRho([1, 2, 3, 4], [4, 3, 2, 1]);
  assert.ok(Math.abs(rhoReversed - (-1.0)) < 1e-6, `Expected -1.0, got ${rhoReversed}`);

  // Degenerate single model -> rho = 1.0
  const rhoSingle = engine.calculateSpearmanRho([1], [1]);
  assert.equal(rhoSingle, 1.0);
});

// ----------------------------------------------------------------------------
// Test 22: TOPSIS run persistence to durable store
// ----------------------------------------------------------------------------
test('Phase 5.22: TOPSIS run correctly persists to and loads from DurableStore', () => {
  const runResult = engine.executeFullTOPSISRun(SYNTHETIC_RESEARCH_BENCHMARK_FIXTURE, {
    profile: TOPSIS_WEIGHT_PROFILES.PRIMARY_FACULTY_PROPOSED,
    executionMode: 'SYNTHETIC_DEMONSTRATION',
    benchmarkSourceId: 'TEST_PERSISTENCE',
    runSensitivity: false,
  });

  durableStore.setTOPSISRun(runResult.run_id, runResult);
  const loaded = durableStore.getTOPSISRun(runResult.run_id);
  assert.ok(loaded !== undefined, 'Loaded run must exist');
  assert.equal(loaded.run_id, runResult.run_id);
  assert.equal(loaded.top_model_id, runResult.top_model_id);

  const latest = durableStore.getTOPSISRun('latest');
  assert.ok(latest !== undefined);
  assert.equal(latest.run_id, runResult.run_id);
});

// ----------------------------------------------------------------------------
// Test 23: Benchmark data metrics adapter
// ----------------------------------------------------------------------------
test('Phase 5.23: extractModelDecisionMetricsFromBenchmark extracts valid decision metrics', () => {
  const benchmarkRecord = {
    benchmark_id: 'BENCH_TEST',
    total_models_evaluated: 2,
    per_model_metrics: {
      M01: {
        model_id: 'M01',
        name: 'OpenAI GPT-OSS 120B',
        provider: 'groq',
        status: 'COMPLETED',
        trust_score: 91.2,
        grounding_rate_pct: 100,
        citation_precision_pct: 95,
        evidence_faithfulness_pct: 95,
        avg_latency_ms: 2500,
        total_tokens: 1800,
        estimated_cost_usd: 0.0,
      },
      M05: {
        model_id: 'M05',
        name: 'Gemma 4 26B-A4B',
        provider: 'openrouter',
        status: 'RATE_LIMITED',
        error: 'HTTP 429 quota exceeded',
      },
    },
  };

  const candidateMetrics = extractModelDecisionMetricsFromBenchmark(benchmarkRecord as any);
  assert.equal(candidateMetrics.length, 10, 'Must produce records for all 10 slots');
  const m01 = candidateMetrics.find(m => m.model_id === 'M01')!;
  const m05 = candidateMetrics.find(m => m.model_id === 'M05')!;

  assert.equal(m01.is_eligible, true);
  assert.equal(m01.metrics.grounding_rate, 100);
  assert.equal(m05.is_eligible, false);
  assert.ok(m05.ineligibility_reason?.includes('HTTP 429') || m05.ineligibility_reason?.includes('RATE_LIMITED'));
});

// ----------------------------------------------------------------------------
// Test 24: Top-3 consensus linkage with fallback on incomplete data
// ----------------------------------------------------------------------------
test('Phase 5.24: Top-3 consensus voting correctly links with TOPSIS or falls back safely', () => {
  // Scenario A: >= 3 models eligible
  const threeModelsRanking = [
    { model_id: 'M01', grounding_score: 1.0, latency_ms: 1000 },
    { model_id: 'M02', grounding_score: 0.95, latency_ms: 1200 },
    { model_id: 'M03', grounding_score: 0.90, latency_ms: 1500 },
  ];

  const dummyFindings: Record<string, ModelFinding[]> = {
    M01: CANONICAL_CONTROLS.map(c => ({
      model_id: 'M01',
      control_id: c.id,
      pillar: c.pillar,
      statutory_reference: c.statutory_ref,
      verdict: 'SUPPORTED',
      confidence: 0.9,
      reasoning_summary: 'Grounded in Section 4(1)',
      identified_gaps: [],
      remediation_steps: [],
      is_grounded: true,
      legal_citations: [{ source_document: 'DPDP_Act_2023.pdf', section: '4(1)', verbatim_quote: 'Notice' }],
      evidence_ids: ['EVD_01'],
      latency_ms: 100,
    })),
    M02: CANONICAL_CONTROLS.map(c => ({
      model_id: 'M02',
      control_id: c.id,
      pillar: c.pillar,
      statutory_reference: c.statutory_ref,
      verdict: 'SUPPORTED',
      confidence: 0.85,
      reasoning_summary: 'Grounded in Section 4(1)',
      identified_gaps: [],
      remediation_steps: [],
      is_grounded: true,
      legal_citations: [{ source_document: 'DPDP_Act_2023.pdf', section: '4(1)', verbatim_quote: 'Notice' }],
      evidence_ids: ['EVD_01'],
      latency_ms: 120,
    })),
    M03: CANONICAL_CONTROLS.map(c => ({
      model_id: 'M03',
      control_id: c.id,
      pillar: c.pillar,
      statutory_reference: c.statutory_ref,
      verdict: 'SUPPORTED',
      confidence: 0.80,
      reasoning_summary: 'Grounded in Section 4(1)',
      identified_gaps: [],
      remediation_steps: [],
      is_grounded: true,
      legal_citations: [{ source_document: 'DPDP_Act_2023.pdf', section: '4(1)', verbatim_quote: 'Notice' }],
      evidence_ids: ['EVD_01'],
      latency_ms: 150,
    })),
  };

  const { consensusFindings, consensusScore } = computeTopThreeMajorityVoting(threeModelsRanking, dummyFindings);
  assert.equal(consensusFindings.length, CANONICAL_CONTROLS.length);
  assert.ok(consensusScore.trust_score !== null);
  assert.equal(consensusScore.is_consensus, true);

  // Scenario B: < 3 models falls back cleanly
  const oneModelRanking = [
    { model_id: 'M01', grounding_score: 1.0, latency_ms: 1000 },
  ];
  const fallbackRes = computeTopThreeMajorityVoting(oneModelRanking, dummyFindings);
  assert.equal(fallbackRes.consensusFindings.length, CANONICAL_CONTROLS.length);
  assert.equal(fallbackRes.consensusScore.is_consensus, true);
});

// ----------------------------------------------------------------------------
// Test 25: Regression verification (Phase 2 Trust Score, Phase 3 Grounding, Phase 4 Gateway)
// ----------------------------------------------------------------------------
test('Phase 5.25: System regression check confirms Phase 2, Phase 3, and Phase 4 continue to pass', () => {
  // Phase 2: Compute Trust Score
  const sampleFindings: ModelFinding[] = CANONICAL_CONTROLS.map(c => ({
    model_id: 'M01',
    control_id: c.id,
    pillar: c.pillar,
    statutory_reference: c.statutory_ref,
    verdict: 'SUPPORTED',
    confidence: 0.95,
    reasoning_summary: 'Verified DPDP statutory compliance.',
    identified_gaps: [],
    remediation_steps: [],
    is_grounded: true,
    legal_citations: [{ source_document: 'DPDP_Act_2023.pdf', section: c.statutory_ref, verbatim_quote: 'Mandatory provision' }],
    evidence_ids: ['EVD_01'],
    latency_ms: 150,
  }));
  const score = computeModelTrustScore('M01', sampleFindings);
  assert.ok(score.trust_score !== null && score.trust_score > 0);
  assert.ok(score.posture !== undefined);

  // Phase 3: Grounding Validator quotation cleaning and matching
  const testFinding: ModelFinding = {
    model_id: 'M01',
    control_id: 'CTRL_DPDP_01',
    verdict: 'SUPPORTED',
    confidence: 0.9,
    reasoning_summary: 'Grounded analysis.',
    identified_gaps: [],
    remediation_steps: [],
    is_grounded: false,
    legal_citations: [{ source_document: 'DPDP_Act_2023.pdf', section: 'Section 5(1)', verbatim_quote: 'Notice' }],
    evidence_ids: ['EVD_01'],
    quoted_evidence: 'We collect personal data for specified purposes...',
  };
  const mockEvidence: EvidenceItem[] = [
    {
      id: 'EVD_01',
      source_type: 'WEBSITE_SCAN',
      key: 'privacy_policy',
      label: 'Privacy Policy',
      value: 'We collect personal data for specified purposes with user consent.',
      status: 'VERIFIED',
      confidence: 1.0,
      extracted_at: new Date().toISOString(),
      source_url: 'https://example.com/privacy',
    },
  ];
  const validatedResult = validator.validateAndEnforceFinding(testFinding, mockEvidence, {
    controlId: 'CTRL_DPDP_01',
    statutoryRef: 'Section 5(1)',
    query: 'Notice',
    retrievalMode: 'HYBRID',
    fusionConstant: 60,
    chunks: [],
    combinedContextText: 'Section 5(1) Notice of personal data collection required.',
    contextHash: 'test_hash',
    latencyMs: { bm25: 1, embedding: 1, vectorRpc: 1, total: 3 },
  });
  assert.equal(validatedResult.isValid, true, 'Quotation cleaning must successfully match verbatim excerpt');
  assert.equal(testFinding.is_grounded, true);

  // Phase 4: Model Registry integrity
  assert.equal(RESEARCH_MODELS.length, 10);
  const m08 = RESEARCH_MODELS.find(m => m.id === 'M08')!;
  assert.equal(m08.name, 'DeepSeek V4.1 Flash');
  assert.equal(m08.provider, 'sarvam');
});
