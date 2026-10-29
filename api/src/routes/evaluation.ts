/**
 * TrustForge Phase 6: Scientific Evaluation, Dataset Inspection & Statistical Reporting Routes.
 * Exposes endpoints for expert ground-truth dataset inspection, multi-metric model benchmarks,
 * paired McNemar tests, 3-run consistency metrics, RAG ablation results, and CSV exports.
 */

import { Router, Request, Response } from 'express';
import { evaluationRunner } from '../evaluation/evaluationRunner.js';
import { canonicalEvaluationDataset } from '../evaluation/expertDataset.js';
import { durableStore } from '../database/durableStore.js';
import { requireAuth, validateTenantAccess } from '../middleware/authMiddleware.js';

const router = Router();

// GET /api/evaluation/dataset — Return canonical DPDP reference dataset and inter-annotator kappa
router.get('/dataset', (req: Request, res: Response) => {
  res.json({
    metadata: canonicalEvaluationDataset.metadata,
    total_cases: canonicalEvaluationDataset.cases.length,
    cases: canonicalEvaluationDataset.cases,
  });
});

// GET /api/evaluation/latest — Return latest evaluation run results with statistical CIs
router.get('/latest', requireAuth, (req: Request, res: Response) => {
  const callerOrg = req.authContext?.orgId;
  const latest = durableStore.getEvaluationRun('latest', callerOrg);
  if (!latest) {
    const freshRun = evaluationRunner.runFullEvaluation({
      rejectionPolicy: 'PENALIZE_AS_INCORRECT',
      runBootstrap: true,
      bootstrapIterations: 500,
    });
    (freshRun as any).org_id = callerOrg;
    durableStore.setEvaluationRun(freshRun.evaluation_id, freshRun);
    res.json(freshRun);
    return;
  }
  if (latest.org_id && !validateTenantAccess(latest.org_id, req, res)) {
    return;
  }
  res.json(latest);
});

// GET /api/evaluation/list — Return all completed evaluation runs
router.get('/list', requireAuth, (req: Request, res: Response) => {
  const callerOrg = req.authContext?.orgId;
  const isSuperAdmin = req.authContext?.role === 'Super Admin';
  const runs = durableStore.listEvaluationRuns(callerOrg, isSuperAdmin);
  res.json({
    total_runs: runs.length,
    runs,
  });
});

// GET /api/evaluation/consistency — Return 3-run consistency experiment results
router.get('/consistency', (req: Request, res: Response) => {
  const latest = durableStore.getEvaluationRun('latest') || evaluationRunner.runFullEvaluation();
  const consistencyData: Record<string, any> = {};

  for (const [modelId, evalData] of Object.entries(latest.model_evaluations || {})) {
    if ((evalData as any).consistency_experiment) {
      consistencyData[modelId] = (evalData as any).consistency_experiment;
    }
  }

  res.json({
    total_models: Object.keys(consistencyData).length,
    consistency_results: consistencyData,
  });
});

// GET /api/evaluation/ablation — Return paired RAG ablation experiment results
router.get('/ablation', (req: Request, res: Response) => {
  const latest = durableStore.getEvaluationRun('latest') || evaluationRunner.runFullEvaluation();
  const ablationData: Record<string, any> = {};

  for (const [modelId, evalData] of Object.entries(latest.model_evaluations || {})) {
    if ((evalData as any).rag_ablation_experiment) {
      ablationData[modelId] = (evalData as any).rag_ablation_experiment;
    }
  }

  res.json({
    total_models: Object.keys(ablationData).length,
    ablation_results: ablationData,
  });
});

// POST /api/evaluation/run — Execute evaluation benchmark with configurable options
router.post('/run', requireAuth, (req: Request, res: Response) => {
  try {
    if (req.authContext?.role === 'Viewer') {
      res.status(403).json({ error: 'Viewers are not permitted to execute evaluation runs.', code: 'FORBIDDEN' });
      return;
    }
    const callerOrg = req.authContext!.orgId;
    const { rejection_policy = 'PENALIZE_AS_INCORRECT', run_bootstrap = true, bootstrap_iterations = 500 } = req.body || {};
    const runResult = evaluationRunner.runFullEvaluation({
      rejectionPolicy: rejection_policy,
      runBootstrap: run_bootstrap,
      bootstrapIterations: bootstrap_iterations,
    });
    (runResult as any).org_id = callerOrg;
    durableStore.setEvaluationRun(runResult.evaluation_id, runResult);
    res.json(runResult);
  } catch (err: any) {
    console.error('[Evaluation Route Error]:', err);
    res.status(500).json({ error: err.message || 'Failed to execute evaluation' });
  }
});

// GET /api/evaluation/export/csv — Download evaluation matrix as RFC 4180 CSV
router.get('/export/csv', requireAuth, (req: Request, res: Response) => {
  const callerOrg = req.authContext?.orgId;
  const latest = durableStore.getEvaluationRun('latest', callerOrg) || evaluationRunner.runFullEvaluation();
  if (latest.org_id && !validateTenantAccess(latest.org_id, req, res)) {
    return;
  }

  const headers = [
    'Model ID',
    'Model Name',
    'Provider',
    'Eligibility',
    'Overall Accuracy (%)',
    'Macro-F1 (0-1)',
    'Weighted-F1 (0-1)',
    'Citation Precision (%)',
    'Evidence Faithfulness (%)',
    'Grounding Rejection Rate (%)',
    'Trust Score MAE',
    '3-Run Agreement (%)',
    'Fleiss Kappa',
    'RAG Ablation Delta Grounding (%)',
    'RAG Ablation Delta Citation (%)',
  ];

  const rows: string[][] = [];

  for (const [mId, evalData] of Object.entries(latest.model_evaluations || {})) {
    const m = evalData as any;
    const met = m.metrics || {};
    const cons = m.consistency_experiment || {};
    const abl = m.rag_ablation_experiment || {};

    rows.push([
      mId,
      `"${m.model_name}"`,
      `"${m.provider}"`,
      m.is_eligible ? 'ELIGIBLE' : 'INELIGIBLE',
      met.overall_accuracy !== undefined ? String(Math.round(met.overall_accuracy * 1000) / 10) : '0',
      met.macro_f1 !== undefined ? String(met.macro_f1) : '0',
      met.weighted_f1 !== undefined ? String(met.weighted_f1) : '0',
      met.citation_precision_pct !== undefined ? String(met.citation_precision_pct) : '0',
      met.evidence_faithfulness_pct !== undefined ? String(met.evidence_faithfulness_pct) : '0',
      met.grounding_rejection_rate_pct !== undefined ? String(met.grounding_rejection_rate_pct) : '0',
      met.trust_score_mae !== undefined ? String(met.trust_score_mae) : '0',
      cons.verdict_agreement_pct !== undefined ? String(cons.verdict_agreement_pct) : 'N/A',
      cons.fleiss_kappa !== undefined ? String(cons.fleiss_kappa) : 'N/A',
      abl.delta_grounding_rate_pct !== undefined ? String(abl.delta_grounding_rate_pct) : 'N/A',
      abl.delta_citation_precision_pct !== undefined ? String(abl.delta_citation_precision_pct) : 'N/A',
    ]);
  }

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="trustforge_phase6_evaluation_${latest.evaluation_id}.csv"`);
  res.send(csv);
});

// GET /api/evaluation/:id — Return specific evaluation run by ID
router.get('/:id', requireAuth, (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const callerOrg = req.authContext?.orgId;
  const run = durableStore.getEvaluationRun(id, callerOrg);
  if (!run) {
    res.status(404).json({ error: `Evaluation run ${id} not found.` });
    return;
  }
  if (run.org_id && !validateTenantAccess(run.org_id, req, res)) {
    return;
  }
  res.json(run);
});

export default router;

