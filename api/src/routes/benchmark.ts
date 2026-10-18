/**
 * 10-Model Benchmark Endpoints for TrustForge Research Platform.
 * Supports running standardized evaluations across all 10 candidate models,
 * retrieving model registry metadata, and comparing per-model metrics.
 */
import { Router, Request, Response } from 'express';
import { LLMGateway, RESEARCH_MODELS } from '../gateway/llmGateway.js';
import { GroundingValidator } from '../validator/groundingValidator.js';
import { CANONICAL_CONTROLS, computeModelTrustScore, computeTopThreeMajorityVoting } from '../scoring/trustScoreEngine.js';
import { db } from '../database/supabaseClient.js';
import { ModelFinding } from '../types/index.js';

const router = Router();
const gateway = new LLMGateway();
const validator = new GroundingValidator();

// GET /api/benchmark/models — Return metadata and status of the 10 mandated models
router.get('/models', (req: Request, res: Response) => {
  res.json({
    total_models: RESEARCH_MODELS.length,
    models: RESEARCH_MODELS,
  });
});

// POST /api/benchmark/run — Execute evaluation across candidate models for a scan/assessment
router.post('/run', async (req: Request, res: Response): Promise<void> => {
  const { scan_id, target_url, selected_models } = req.body;

  if (!scan_id) {
    res.status(400).json({ error: 'scan_id is required.' });
    return;
  }

  const scan = await db.getScan(scan_id);
  const evidence = scan ? scan.evidence_items || scan.evidence || [] : [];

  console.log(`[Benchmark Run] Initiating 10-model evaluation for scan ${scan_id} with ${evidence.length} evidence items.`);

  // Determine active models (filter by user selection or default to all configured)
  const modelsToRun = selected_models && Array.isArray(selected_models) && selected_models.length > 0
    ? RESEARCH_MODELS.filter(m => selected_models.includes(m.id))
    : RESEARCH_MODELS;

  const allModelFindings: Record<string, ModelFinding[]> = {};
  const perModelTrustScores: Record<string, any> = {};
  const modelMetrics: Record<string, any> = {};

  for (const model of modelsToRun) {
    const findings: ModelFinding[] = [];
    let groundedCount = 0;
    let totalLatency = 0;

    // Evaluate canonical controls
    for (const ctrl of CANONICAL_CONTROLS) {
      // Find relevant evidence for this control
      const relevantEvidence = evidence.filter((e: any) => {
        const k = (e.key || '').toLowerCase();
        if (ctrl.pillar === 'security' && (k.includes('https') || k.includes('hsts') || k.includes('csp') || k.includes('header') || k.includes('cookie'))) return true;
        if (ctrl.pillar === 'privacy' && (k.includes('policy') || k.includes('cmp') || k.includes('form') || k.includes('tracker'))) return true;
        return true;
      });

      const finding = await gateway.evaluateSingleModel(model, {
        controlId: ctrl.id,
        controlName: ctrl.name,
        pillar: ctrl.pillar,
        statutoryRef: ctrl.statutory_ref,
        retrievedLegalContext: `Statutory Provision: ${ctrl.statutory_ref}. Requirements: Data fiduciaries must implement appropriate technical safeguards and notice obligations under Indian DPDP law.`,
        observedEvidence: relevantEvidence,
      });

      // Run independent grounding validation
      const gResult = validator.validateFinding(finding, evidence);
      finding.is_grounded = gResult.isValid;
      finding.grounding_score = gResult.groundingScore;

      if (gResult.isValid) groundedCount++;
      totalLatency += finding.latency_ms || 100;

      findings.push(finding);
    }

    allModelFindings[model.id] = findings;
    await db.saveFindings(scan_id, model.id, findings);

    // Compute per-model Trust Score
    const scoreComp = computeModelTrustScore(model.id, findings);
    perModelTrustScores[model.id] = scoreComp;
    await db.saveTrustScore(scan_id, scoreComp);

    // Compute summary metrics for this model
    const avgLatency = Math.round(totalLatency / CANONICAL_CONTROLS.length);
    const groundingRate = Math.round((groundedCount / CANONICAL_CONTROLS.length) * 100);
    const passCount = findings.filter(f => f.verdict === 'SUPPORTED').length;
    const gapCount = findings.filter(f => f.verdict === 'NOT_SUPPORTED' || f.verdict === 'PARTIALLY_SUPPORTED').length;

    modelMetrics[model.id] = {
      model_id: model.id,
      name: model.name,
      trust_score: scoreComp.trust_score,
      posture: scoreComp.posture,
      grounding_rate_pct: groundingRate,
      pass_count: passCount,
      gap_count: gapCount,
      avg_latency_ms: avgLatency,
      f1_score: Math.round(((2 * passCount) / (2 * passCount + gapCount + 1)) * 100) / 100,
    };
  }

  // Top-Three Majority Voting
  const rankingList = Object.values(modelMetrics).map((m: any) => ({
    model_id: m.model_id,
    f1_score: m.f1_score || 0.5,
    grounding_score: (m.grounding_rate_pct || 50) / 100,
  }));

  const { consensusFindings, consensusScore } = computeTopThreeMajorityVoting(rankingList, allModelFindings);
  await db.saveFindings(scan_id, 'TOP3_CONSENSUS', consensusFindings);
  await db.saveTrustScore(scan_id, consensusScore);

  res.json({
    benchmark_id: `BENCH_${Date.now()}`,
    scan_id,
    target_url: scan ? scan.target_url || scan.url : target_url,
    total_models_evaluated: modelsToRun.length,
    models_evaluated: modelsToRun.map(m => m.id),
    per_model_metrics: modelMetrics,
    per_model_trust_scores: perModelTrustScores,
    top_three_ranking: rankingList.sort((a, b) => (b.f1_score + b.grounding_score) - (a.f1_score + a.grounding_score)).slice(0, 3),
    consensus_result: {
      trust_score: consensusScore.trust_score,
      posture: consensusScore.posture,
      pillar_scores: consensusScore.pillar_scores,
      evidence_coverage: consensusScore.evidence_coverage,
    },
  });
});

export default router;
