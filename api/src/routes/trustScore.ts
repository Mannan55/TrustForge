/**
 * TrustForge Trust Score Routes.
 * Serves deterministic C1–C10 Research Trust Scores and 6-Pillar Dashboard Projections.
 */
import { Router, Request, Response } from 'express';
import { db } from '../database/supabaseClient.js';
import { durableStore } from '../database/durableStore.js';
import { requireAuth, validateTenantAccess } from '../middleware/authMiddleware.js';
import { computeC10TrustScore } from '../scoring/trustScoreEngine.js';
import { WeightScheme } from '../types/index.js';

const router = Router();

/**
 * GET /api/trust-score/:id
 * Retrieve the calculated Trust Score for an assessment or scan.
 * Supports optional ?weight_scheme=W1_PENALTY_PROPORTIONAL | W2_EQUAL query parameter.
 */
router.get('/trust-score/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const requestedScheme = (req.query.weight_scheme as string)?.toUpperCase();
  const scheme: WeightScheme = requestedScheme === 'W2_EQUAL' ? 'W2_EQUAL' : 'W1_PENALTY_PROPORTIONAL';

  const job = (await db.getAssessment(id)) || durableStore.getAssessment(id);

  if (!job) {
    res.status(404).json({ error: `Assessment ${id} not found.`, code: 'NOT_FOUND' });
    return;
  }

  if (!validateTenantAccess(job.org_id, req, res)) {
    return;
  }

  let score = await db.getTrustScore(id);

  if (!score && job && job.trust_score != null) {
    score = {
      model_id: job.models_evaluated?.[0] || 'TOP3_CONSENSUS',
      trust_score: job.trust_score,
      raw_trust_score: (job as any).raw_trust_score ?? job.trust_score,
      posture: job.posture as any,
      // Zero coverage is a genuine value; never replace missing evidence with a fabricated 80%.
      evidence_coverage: job.evidence_coverage ?? 0,
      is_consensus: job.selection_mode === 'TOP3_MAJORITY_VOTING',
      pillar_scores: job.pillar_scores || [],
      category_scores: (job as any).category_scores,
      weight_scheme: (job as any).weight_scheme || 'W1_PENALTY_PROPORTIONAL',
      critical_failure_cap_applied: (job as any).critical_failure_cap_applied || false,
      critical_failure_reasons: (job as any).critical_failure_reasons || [],
      methodology_version: (job as any).methodology_version || 'DPDP-2023-RAG-C10-V1',
      computed_at: (job as any).completed_at || new Date().toISOString(),
    };
  }

  // If score is found but client requested a different weight scheme or recalculation from findings
  if (job && job.findings && job.findings.length > 0 && requestedScheme) {
    const findingsList = job.findings;
    const hasHttps = job.evidence?.some((e: any) => e.key === 'transport_security' && (e.value as any)?.https === true);
    const hasNoHttps = job.evidence?.some((e: any) => e.key === 'transport_security' && (e.value as any)?.https === false);
    const hasNoNotice = job.evidence?.some((e: any) => e.key === 'privacy_notice' && (e.value as any)?.policyFound === false);


    const recomputed = computeC10TrustScore(score?.model_id || 'M03', findingsList, {
      weightScheme: scheme,
      hasHttps: hasNoHttps ? false : (hasHttps ? true : undefined),
      hasPrivacyNotice: hasNoNotice ? false : undefined,
      assessmentId: id,
    });

    score = {
      ...score,
      ...recomputed,
    };
  }

  if (!score) {
    res.status(404).json({ error: `Trust score for assessment ${id} not found.` });
    return;
  }

  const rawPillars = score.pillar_scores || {};
  const pillarArray = Array.isArray(rawPillars) ? rawPillars : Object.values(rawPillars);
  const pillarMap = Array.isArray(rawPillars)
    ? rawPillars.reduce((acc, p) => ({ ...acc, [p.pillar_id || p.pillar]: p }), {})
    : rawPillars;

  res.json({
    assessment_id: id,
    model_id: score.model_id,
    trust_score: score.trust_score,
    raw_trust_score: score.raw_trust_score ?? score.trust_score,
    posture: score.posture,
    weight_scheme: score.weight_scheme || scheme,
    critical_failure_cap_applied: score.critical_failure_cap_applied ?? false,
    critical_failure_reasons: score.critical_failure_reasons ?? [],
    evidence_coverage: score.evidence_coverage,
    is_consensus: score.is_consensus ?? false,
    category_scores: score.category_scores ?? null,
    pillar_scores: pillarArray,
    pillar_breakdown: pillarMap,
    methodology_version: score.methodology_version || 'DPDP-2023-RAG-C10-V1',
    computed_at: score.computed_at || new Date().toISOString(),
  });
});

/**
 * POST /api/trust-score/calculate
 * Direct deterministic calculation endpoint for research validation and testing.
 * Enforces grounding checks: ungrounded verdicts are strictly converted to NOT_DETERMINABLE.
 */
router.post('/trust-score/calculate', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const {
    model_id = 'BENCHMARK_MODEL',
    findings = [],
    weight_scheme = 'W1_PENALTY_PROPORTIONAL',
    has_https,
    has_privacy_notice,
    assessment_id,
    enforce_grounding = true,
  } = req.body;

  if (!Array.isArray(findings)) {
    res.status(400).json({ error: 'findings must be an array of obligation evaluation records.' });
    return;
  }

  const scheme: WeightScheme = weight_scheme === 'W2_EQUAL' ? 'W2_EQUAL' : 'W1_PENALTY_PROPORTIONAL';

  const computation = computeC10TrustScore(model_id, findings, {
    weightScheme: scheme,
    hasHttps: typeof has_https === 'boolean' ? has_https : undefined,
    hasPrivacyNotice: typeof has_privacy_notice === 'boolean' ? has_privacy_notice : undefined,
    assessmentId: assessment_id,
    enforceGroundingCheck: enforce_grounding,
  });

  res.json({
    assessment_id: computation.assessment_id,
    model_id: computation.model_id,
    trust_score: computation.trust_score,
    raw_trust_score: computation.raw_trust_score,
    posture: computation.posture,
    weight_scheme: computation.weight_scheme,
    critical_failure_cap_applied: computation.critical_failure_cap_applied,
    critical_failure_reasons: computation.critical_failure_reasons,
    evidence_coverage: computation.evidence_coverage,
    category_scores: computation.category_scores,
    pillar_scores: Object.values(computation.pillar_scores),
    pillar_breakdown: computation.pillar_scores,
    methodology_version: computation.methodology_version,
    computed_at: computation.computed_at,
  });
});

export default router;
