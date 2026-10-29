/**
 * 10-Model Benchmark Endpoints for TrustForge Research Platform.
 * Supports running standardized evaluations across all 10 candidate models,
 * retrieving model registry metadata, and comparing per-model metrics.
 */
import { Router, Request, Response } from 'express';
import { LLMGateway, RESEARCH_MODELS } from '../gateway/llmGateway.js';
import { GroundingValidator } from '../validator/groundingValidator.js';
import { CANONICAL_CONTROLS, computeModelTrustScore, computeTopThreeMajorityVoting } from '../scoring/trustScoreEngine.js';
import { CANONICAL_CONTROL_TO_C10 } from '../scoring/pillarMappingAdapter.js';
import { hybridRAG } from '../rag/hybridRAG.js';
import { durableStore } from '../database/durableStore.js';
import { db } from '../database/supabaseClient.js';
import { ModelFinding, TOPSISExecutionMode, ModelDecisionMetrics } from '../types/index.js';
import { requireAuth, validateTenantAccess } from '../middleware/authMiddleware.js';
import {
  topsisEngine,
  CANONICAL_TOPSIS_CRITERIA,
  TOPSIS_WEIGHT_PROFILES,
  SYNTHETIC_RESEARCH_BENCHMARK_FIXTURE,
  extractModelDecisionMetricsFromBenchmark,
} from '../research/topsisEngine.js';

const router = Router();
const gateway = new LLMGateway();
const validator = new GroundingValidator();

// GET /api/benchmark/models — Return metadata and status of the 10 mandated models
router.get('/models', (req: Request, res: Response) => {
  const modelsWithLiveStatus = RESEARCH_MODELS.map(m => {
    const slotStatus = gateway.getModelSlotStatus(m);
    return {
      slot: m.id,
      id: m.id,
      name: m.name,
      family: m.family,
      params: m.params,
      active_params: m.active_params,
      provider: m.provider,
      hf_repo: m.hf_repo,
      licence: m.licence,
      pricing_tier: m.pricing_tier,
      availability_status: slotStatus.status,
      availability: slotStatus.available ? 'AVAILABLE' : slotStatus.status,
      reason: slotStatus.reason,
      isRealInferenceVerified: slotStatus.available,
    };
  });

  res.json({
    total_models: modelsWithLiveStatus.length,
    models: modelsWithLiveStatus,
  });
});

// GET /api/benchmark/diagnostics — Return provider configuration and startup diagnostics
router.get('/diagnostics', (req: Request, res: Response) => {
  const diag = gateway.getStartupDiagnostics();
  res.json(diag);
});

// GET /api/benchmark/latest — Return the most recent benchmark evaluation run
router.get('/latest', requireAuth, (req: Request, res: Response) => {
  const latest = durableStore.getBenchmark('latest');
  if (!latest) {
    res.status(404).json({ error: 'No benchmark run recorded yet.' });
    return;
  }
  res.json(latest);
});

// GET /api/benchmark/export/csv — Download latest benchmark matrix as RFC 4180 CSV
router.get('/export/csv', requireAuth, (req: Request, res: Response) => {
  const latest = durableStore.getBenchmark('latest');
  if (!latest) {
    res.status(404).send('No benchmark run recorded yet.');
    return;
  }
  const csv = formatBenchmarkCsv(latest);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="trustforge_10llm_benchmark_${latest.benchmark_id}.csv"`);
  res.send(csv);
});

// GET /api/benchmark/list — List all completed benchmark runs
router.get('/list', requireAuth, (req: Request, res: Response) => {
  const benchmarks = durableStore.listBenchmarks();
  res.json({
    total_runs: benchmarks.length,
    benchmarks,
  });
});

// ============================================================================
// Phase 5: TOPSIS Multi-Criteria Decision Analysis Endpoints
// ============================================================================

// GET /api/benchmark/topsis/criteria — List canonical evaluation criteria & standard profiles
router.get('/topsis/criteria', (req: Request, res: Response) => {
  res.json({
    total_criteria: CANONICAL_TOPSIS_CRITERIA.length,
    criteria: CANONICAL_TOPSIS_CRITERIA,
    available_profiles: Object.values(TOPSIS_WEIGHT_PROFILES).map(p => ({
      profile_id: p.profile_id,
      name: p.name,
      version: p.version,
      description: p.description,
      weights: p.weights,
      is_default: p.is_default,
    })),
  });
});

// GET /api/benchmark/topsis/profiles — Return full profile dictionary
router.get('/topsis/profiles', (req: Request, res: Response) => {
  res.json({
    profiles: TOPSIS_WEIGHT_PROFILES,
  });
});

// GET /api/benchmark/topsis/latest — Return latest TOPSIS run result
router.get('/topsis/latest', requireAuth, async (req: Request, res: Response) => {
  const latest = (await db.getTOPSISRun('latest')) || durableStore.getTOPSISRun('latest');
  if (!latest) {
    // If no run recorded yet, execute demonstration run on synthetic fixture
    const syntheticRun = topsisEngine.executeFullTOPSISRun(
      SYNTHETIC_RESEARCH_BENCHMARK_FIXTURE,
      {
        profile: TOPSIS_WEIGHT_PROFILES.PRIMARY_FACULTY_PROPOSED,
        benchmarkSourceId: 'SYNTHETIC_RESEARCH_FIXTURE',
        executionMode: 'SYNTHETIC_DEMONSTRATION',
        runSensitivity: true,
      }
    );
    res.json(syntheticRun);
    return;
  }
  res.json(latest);
});

// GET /api/benchmark/topsis/list — List all historical TOPSIS ranking runs
router.get('/topsis/list', requireAuth, async (req: Request, res: Response) => {
  const runs = (await db.listTOPSISRuns()) || durableStore.listTOPSISRuns();
  res.json({
    total_runs: runs.length,
    runs,
  });
});

// GET /api/benchmark/topsis/:runId/sensitivity — Get sensitivity analysis for a specific run
router.get('/topsis/:runId/sensitivity', requireAuth, async (req: Request, res: Response) => {
  const runId = Array.isArray(req.params.runId) ? req.params.runId[0] : req.params.runId;
  const run = (await db.getTOPSISRun(runId)) || durableStore.getTOPSISRun(runId);
  if (!run) {
    res.status(404).json({ error: `TOPSIS run ${runId} not found.` });
    return;
  }
  res.json({
    run_id: run.run_id,
    sensitivity_analysis: run.sensitivity_analysis || null,
  });
});

// GET /api/benchmark/topsis/:runId — Get specific TOPSIS run by ID
router.get('/topsis/:runId', requireAuth, async (req: Request, res: Response) => {
  const runId = Array.isArray(req.params.runId) ? req.params.runId[0] : req.params.runId;
  const run = (await db.getTOPSISRun(runId)) || durableStore.getTOPSISRun(runId);
  if (!run) {
    res.status(404).json({ error: `TOPSIS run ${runId} not found.` });
    return;
  }
  res.json(run);
});

// POST /api/benchmark/topsis/run — Execute TOPSIS multi-criteria ranking and sensitivity analysis
router.post('/topsis/run', requireAuth, async (req: Request, res: Response) => {
  try {
    const {
      benchmark_id,
      profile_id = 'PRIMARY_FACULTY_PROPOSED',
      custom_weights,
      execution_mode,
      use_synthetic_fixture,
      metrics: directMetrics,
    } = req.body || {};

    let candidateMetrics: ModelDecisionMetrics[] = [];
    let sourceId: string | undefined = benchmark_id;
    let mode: TOPSISExecutionMode = execution_mode || 'PROVISIONAL_MEASURED';

    if (use_synthetic_fixture || directMetrics) {
      candidateMetrics = directMetrics || SYNTHETIC_RESEARCH_BENCHMARK_FIXTURE;
      sourceId = sourceId || (use_synthetic_fixture ? 'SYNTHETIC_RESEARCH_FIXTURE' : undefined);
      if (!execution_mode) {
        mode = use_synthetic_fixture ? 'SYNTHETIC_DEMONSTRATION' : 'PROVISIONAL_MEASURED';
      }
    } else {
      const bId = benchmark_id || 'latest';
      const benchmark = (await db.getBenchmark(bId)) || durableStore.getBenchmark(bId);
      if (!benchmark) {
        candidateMetrics = SYNTHETIC_RESEARCH_BENCHMARK_FIXTURE;
        sourceId = 'SYNTHETIC_RESEARCH_FIXTURE';
        mode = 'SYNTHETIC_DEMONSTRATION';
      } else {
        sourceId = benchmark.benchmark_id;
        candidateMetrics = extractModelDecisionMetricsFromBenchmark(benchmark);
      }
    }

        if (custom_weights) {
      if (typeof custom_weights !== 'object' || Array.isArray(custom_weights)) {
        res.status(400).json({ error: 'custom_weights must be a key-value object of numbers.', code: 'INVALID_WEIGHTS' });
        return;
      }
      for (const [k, v] of Object.entries(custom_weights)) {
        if (typeof v !== 'number' || isNaN(v) || (v as number) < 0) {
          res.status(400).json({ error: `Invalid weight for criterion '${k}': must be a non-negative number.`, code: 'INVALID_WEIGHTS' });
          return;
        }
      }
    }

    let profile = TOPSIS_WEIGHT_PROFILES[profile_id] || TOPSIS_WEIGHT_PROFILES.PRIMARY_FACULTY_PROPOSED;
    if (custom_weights && typeof custom_weights === 'object') {
      profile = {
        profile_id: 'CUSTOM_USER_PROFILE',
        name: 'Custom User-Specified Weights',
        version: '1.0.0',
        description: 'User-customized criteria weights for MCDA sensitivity testing.',
        weights: custom_weights,
        is_default: false,
      };
    }

    if (mode !== 'SYNTHETIC_DEMONSTRATION' && profile.weights['macro_f1'] > 0) {
      const hasEmpiricalF1 = candidateMetrics.some(m => m.metrics.macro_f1 !== null && m.metrics.macro_f1 !== undefined);
      if (!hasEmpiricalF1 && !custom_weights) {
        profile = TOPSIS_WEIGHT_PROFILES.PROVISIONAL_MEASURED;
        mode = 'PROVISIONAL_MEASURED';
      }
    }

        const runResult = topsisEngine.executeFullTOPSISRun(
      candidateMetrics,
      {
        profile,
        benchmarkSourceId: sourceId,
        executionMode: mode,
        runSensitivity: true,
      }
    );

    if (mode === 'SYNTHETIC_DEMONSTRATION' || sourceId === 'SYNTHETIC_RESEARCH_FIXTURE') {
      (runResult as any).is_synthetic = true;
      (runResult as any).quarantine_status = 'SYNTHETIC_EXCLUDED_FROM_EMPIRICAL_METRICS';
    }

    durableStore.setTOPSISRun(runResult.run_id, runResult);
    await db.saveTOPSISRun(runResult);

    res.json(runResult);
  } catch (err: any) {
    console.error('[TOPSIS Run Endpoint] Error:', err);
    res.status(500).json({ error: err.message || 'Failed to execute TOPSIS ranking' });
  }
});

// GET /api/benchmark/:id/csv — Download benchmark run as CSV
router.get('/:id/csv', requireAuth, async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const benchmark = (await db.getBenchmark(id)) || durableStore.getBenchmark(id);
  if (!benchmark) {
    res.status(404).send(`Benchmark run ${id} not found.`);
    return;
  }

  const csv = formatBenchmarkCsv(benchmark);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="trustforge_10llm_benchmark_${id}.csv"`);
  res.send(csv);
});

// Helper: Format benchmark matrix into RFC 4180 compliant CSV
function formatBenchmarkCsv(benchmark: any): string {
  const headers = [
    'Slot',
    'Model Name',
    'Provider',
    'Requested Model ID',
    'Actual Model ID',
    'Execution Status',
    'Trust Score',
    'Posture',
    'Grounding Rate (%)',
    'Hallucination Rate (%)',
    'Citation Precision (%)',
    'Evidence Faithfulness (%)',
    'Average Latency (ms)',
    'Total Latency (ms)',
    'Prompt Tokens',
    'Completion Tokens',
    'Total Tokens',
    'Estimated Cost (USD)',
    'Macro F1 Status',
  ];

  const rows: string[][] = [];
  const metrics = benchmark.per_model_metrics || {};

  for (const m of RESEARCH_MODELS) {
    const met = metrics[m.id] || {};
    rows.push([
      m.id,
      `"${m.name}"`,
      `"${m.provider}"`,
      `"${met.requested_model_id || gateway.getRequestedModelId(m.id)}"`,
      `"${met.actual_model_id || 'N/A'}"`,
      met.status || 'NOT_TESTED',
      met.trust_score !== null && met.trust_score !== undefined ? String(met.trust_score) : 'N/A',
      `"${met.posture || 'N/A'}"`,
      met.grounding_rate_pct !== undefined ? String(met.grounding_rate_pct) : '0',
      met.hallucination_rate_pct !== undefined ? String(met.hallucination_rate_pct) : '100',
      met.citation_precision_pct !== undefined ? String(met.citation_precision_pct) : '0',
      met.evidence_faithfulness_pct !== undefined ? String(met.evidence_faithfulness_pct) : '0',
      met.avg_latency_ms !== undefined ? String(met.avg_latency_ms) : '0',
      met.duration_ms !== undefined ? String(met.duration_ms) : '0',
      met.prompt_tokens !== undefined ? String(met.prompt_tokens) : '0',
      met.completion_tokens !== undefined ? String(met.completion_tokens) : '0',
      met.total_tokens !== undefined ? String(met.total_tokens) : '0',
      met.estimated_cost_usd !== undefined ? `$${Number(met.estimated_cost_usd).toFixed(6)}` : '$0.000000',
      `"${met.f1_status || 'NOT_EVALUATED'}"`,
    ]);
  }

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
}

// GET /api/benchmark/:id — Return a specific benchmark run by ID
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (id === 'latest') {
    const latest = durableStore.getBenchmark('latest');
    if (!latest) {
      res.status(404).json({ error: 'No benchmark run recorded yet.' });
      return;
    }
    if (latest.org_id && !validateTenantAccess(latest.org_id, req, res)) {
      return;
    }
    res.json(latest);
    return;
  }

  const benchmark = (await db.getBenchmark(id)) || durableStore.getBenchmark(id);
  if (!benchmark) {
    res.status(404).json({ error: `Benchmark run ${id} not found.` });
    return;
  }

  // If benchmark is linked to an assessment, enforce tenant isolation
  if (benchmark.assessment_id) {
    const assessment = (await db.getAssessment(benchmark.assessment_id)) || durableStore.getAssessment(benchmark.assessment_id);
    if (assessment && !validateTenantAccess(assessment.org_id, req, res)) {
      return;
    }
  }

  res.json(benchmark);
});

// POST /api/benchmark/run — Execute evaluation across candidate models for a scan/assessment
router.post('/run', requireAuth, async (req: Request, res: Response): Promise<void> => {
    const { scan_id, assessment_id, target_url, selected_models } = req.body;
  const callerOrg = req.authContext!.orgId;

  let evidence: any[] = [];
  let resolvedUrl = target_url || 'https://example.com';

  if (assessment_id) {
    const assessment = durableStore.getAssessment(assessment_id);
    if (assessment) {
      if (!validateTenantAccess(assessment.org_id, req, res)) return;
      evidence = assessment.evidence || [];
      resolvedUrl = assessment.website_url || resolvedUrl;
    }
  }

  if (scan_id && evidence.length === 0) {
    const scan = await db.getScan(scan_id);
    if (scan) {
      evidence = scan.evidence_items || scan.evidence || [];
      resolvedUrl = scan.target_url || scan.url || resolvedUrl;
    }
  }

  if (evidence.length === 0) {
    // Check if there is any evidence in durable store scans
    if (scan_id) {
      const dScan = durableStore.getScan(scan_id);
      if (dScan) {
        evidence = dScan.evidence_items || dScan.evidence || [];
      }
    }
  }

  console.log(`[Benchmark Run] Initiating 10-model evaluation for ${resolvedUrl} with ${evidence.length} evidence items.`);

  // Step 1: Freeze RAG context across all canonical controls
  const frozenSnapshot = await hybridRAG.buildFrozenSnapshot(CANONICAL_CONTROLS, {
    topK: 5,
    categoryMap: CANONICAL_CONTROL_TO_C10,
  });
  const controlsWithLegal = CANONICAL_CONTROLS.map(ctrl => {
    const legalCtx = frozenSnapshot.contexts[ctrl.id];
    return {
      id: ctrl.id,
      name: ctrl.name,
      pillar: ctrl.pillar,
      statutoryRef: ctrl.statutory_ref,
      retrievedLegalContext: legalCtx?.combinedContextText || `Statutory Provision: ${ctrl.statutory_ref}`,
      relevantEvidence: evidence,
    };
  });

  // Step 2: Dispatch batch evaluation across all 10 candidate models
  const batchPayload = {
    websiteUrl: resolvedUrl,
    controls: controlsWithLegal,
    evidence,
  };
  const batchOutputs = await gateway.evaluateAllModelsBatch(batchPayload);

  const benchmarkId = `BENCH_${Date.now()}`;
  const allModelFindings: Record<string, ModelFinding[]> = {};
  const perModelTrustScores: Record<string, any> = {};
  const modelMetrics: Record<string, any> = {};
  const completedModels: string[] = [];
  const unavailableModels: string[] = [];

  for (const [modelId, batch] of Object.entries(batchOutputs)) {
    if (modelId === 'orchestration') continue;
    const isSuccess = (batch.status === 'COMPLETED' || batch.status === 'SUCCESS') && batch.findings && batch.findings.length > 0;

    if (isSuccess) {
      // Validate Grounding using strict enforcement policy
      let groundedCount = 0;
      let totalLatency = 0;

      const validatedFindings = batch.findings.map((f: ModelFinding) => {
        const legalCtx = frozenSnapshot.contexts[f.control_id];
        const gResult = validator.validateAndEnforceFinding(f, evidence, legalCtx, { modelId });
        if (f.is_grounded) groundedCount++;
        totalLatency += f.latency_ms || 100;
        return f;
      });

      allModelFindings[modelId] = validatedFindings;
      completedModels.push(modelId);

      // Compute per-model Trust Score
      const scoreComp = computeModelTrustScore(modelId, validatedFindings);
      perModelTrustScores[modelId] = scoreComp;

      // Performance summary counts
      const passCount = validatedFindings.filter((f: ModelFinding) => f.verdict === 'SUPPORTED').length;
      const gapCount = validatedFindings.filter((f: ModelFinding) => f.verdict === 'NOT_SUPPORTED' || f.verdict === 'PARTIALLY_SUPPORTED').length;
      const groundingRate = Math.round((groundedCount / CANONICAL_CONTROLS.length) * 100);
      const hallucinationRate = Math.max(0, 100 - groundingRate);
      const avgLatency = Math.round(totalLatency / CANONICAL_CONTROLS.length);

      // Statutory citation precision and evidence faithfulness
      let citationMatchCount = 0;
      let evidenceMatchCount = 0;
      for (const f of validatedFindings) {
        if (f.legal_citations && f.legal_citations.length > 0 && f.legal_citations[0].section) citationMatchCount++;
        if (f.evidence_ids && f.evidence_ids.length > 0) evidenceMatchCount++;
      }
      const citationPrecision = Math.round((citationMatchCount / CANONICAL_CONTROLS.length) * 100);
      const evidenceFaithfulness = Math.round((evidenceMatchCount / CANONICAL_CONTROLS.length) * 100);
      const estimatedCost = batch.estimated_cost_usd !== undefined
        ? batch.estimated_cost_usd
        : gateway.calculateEstimatedCost(modelId, batch.prompt_tokens, batch.completion_tokens);

      modelMetrics[modelId] = {
        model_id: modelId,
        name: batch.model_name,
        provider: batch.provider,
        requested_model_id: batch.requested_model_id,
        actual_model_id: batch.actual_model_id,
        request_id: batch.request_id,
        status: 'COMPLETED',
        trust_score: scoreComp.trust_score,
        posture: scoreComp.posture,
        evidence_coverage: scoreComp.evidence_coverage,
        grounding_rate_pct: groundingRate,
        hallucination_rate_pct: hallucinationRate,
        citation_precision_pct: citationPrecision,
        evidence_faithfulness_pct: evidenceFaithfulness,
        pass_count: passCount,
        gap_count: gapCount,
        avg_latency_ms: avgLatency,
        f1_score: null,
        f1_status: 'NOT_EVALUATED_PENDING_EXPERT_GROUND_TRUTH',
        latency_ms: batch.duration_ms,
        prompt_tokens: batch.prompt_tokens,
        completion_tokens: batch.completion_tokens,
        total_tokens: batch.total_tokens,
        estimated_cost_usd: estimatedCost,
        context_hash: batch.context_hash,
      };
    } else {
      unavailableModels.push(modelId);
      modelMetrics[modelId] = {
        model_id: modelId,
        name: batch.model_name,
        provider: batch.provider,
        requested_model_id: batch.requested_model_id || gateway.getRequestedModelId(modelId),
        status: batch.status,
        error: batch.error || 'Provider credentials not configured or model unavailable.',
        trust_score: null,
        posture: 'UNAVAILABLE',
        grounding_rate_pct: 0,
        hallucination_rate_pct: 100,
        citation_precision_pct: 0,
        evidence_faithfulness_pct: 0,
        avg_latency_ms: 0,
        estimated_cost_usd: 0,
        f1_score: null,
        f1_status: 'NOT_EVALUATED',
      };
    }
  }

  // Step 3: Top-Three Majority Voting Consensus via Research-Aligned TOPSIS
  let rankingList: Array<{ model_id: string; grounding_score: number; latency_ms: number; closeness?: number }> = [];
  let topsisRun: any = null;

  try {
    const candidateMetrics = extractModelDecisionMetricsFromBenchmark({
      per_model_metrics: modelMetrics,
      total_models_evaluated: completedModels.length,
    } as any);

    const eligibleCount = candidateMetrics.filter(m => m.is_eligible).length;
    if (eligibleCount >= 3) {
      topsisRun = topsisEngine.executeFullTOPSISRun(
        candidateMetrics,
        {
          profile: TOPSIS_WEIGHT_PROFILES.PROVISIONAL_MEASURED,
          benchmarkSourceId: benchmarkId,
          executionMode: 'PROVISIONAL_MEASURED',
          runSensitivity: true,
        }
      );
      durableStore.setTOPSISRun(topsisRun.run_id, topsisRun);
      db.saveTOPSISRun(topsisRun).catch(e => console.warn('[Benchmark Run] DB save TOPSIS error:', e));

      rankingList = topsisRun.ranked_models
        .filter((r: any) => r.is_eligible)
        .map((r: any) => ({
          model_id: r.model_id,
          grounding_score: (r.raw_metrics.grounding_rate ?? 50) / 100,
          latency_ms: r.raw_metrics.median_latency ?? 1000,
          closeness: r.closeness_coefficient,
        }));
    }
  } catch (topsisErr) {
    console.warn('[Benchmark Run] TOPSIS computation warning, falling back to heuristic ranking:', topsisErr);
  }

  // Safe fallback if TOPSIS yielded fewer than 3 eligible models
  if (rankingList.length < 3) {
    rankingList = completedModels.map(mId => ({
      model_id: mId,
      grounding_score: (modelMetrics[mId]?.grounding_rate_pct || 50) / 100,
      latency_ms: modelMetrics[mId]?.avg_latency_ms || 1000,
      closeness: undefined,
    })).sort((a, b) => b.grounding_score - a.grounding_score || a.latency_ms - b.latency_ms);
  }

  const { consensusFindings, consensusScore } = computeTopThreeMajorityVoting(rankingList, allModelFindings);

  const benchmarkRecord = {
    benchmark_id: benchmarkId,
    scan_id: scan_id || assessment_id || `SCAN_${Date.now()}`,
    target_url: resolvedUrl,
    status: completedModels.length === 10 ? 'COMPLETE_10_OF_10' : 'PARTIAL',
    total_models_evaluated: completedModels.length,
    models_evaluated: completedModels,
    models_unavailable: unavailableModels,
    per_model_metrics: modelMetrics,
    per_model_trust_scores: perModelTrustScores,
    top_three_ranking: rankingList,
    consensus_result: consensusScore,
    topsis_run_id: topsisRun?.run_id || null,
    topsis_summary: topsisRun ? {
      winner_model_id: topsisRun.top_model_id,
      top_three: topsisRun.top_three_model_ids,
      profile: topsisRun.profile_used?.profile_id,
    } : null,
    rag_snapshot_hash: frozenSnapshot.snapshotHash,
    legal_corpus_version: '83-chunk-authoritative-v2',
    parallel_orchestration: (batchOutputs as any).orchestration,
    created_at: new Date().toISOString(),
  };

  durableStore.setBenchmark(benchmarkId, benchmarkRecord);
  try {
    await db.saveBenchmark(benchmarkRecord as any);
  } catch (dbErr) {
    console.warn(`[Benchmark Run] DB persistence warning (persisted in durableStore):`, dbErr);
  }

  res.json(benchmarkRecord);
});

export default router;
