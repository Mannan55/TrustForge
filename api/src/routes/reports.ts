/**
 * Assessment Compliance Reports & PDF Export Routes for TrustForge API.
 * Produces evidence-grounded reports with verified DPDP citations,
 * strict multi-tenant isolation, and zero synthetic score fabrication.
 */
import { Router, Request, Response } from 'express';
import { db } from '../database/supabaseClient.js';
import { durableStore } from '../database/durableStore.js';
import { generatePdfReport } from '../reports/pdfGenerator.js';
import { requireAuth, validateTenantAccess } from '../middleware/authMiddleware.js';
import { AssessmentRecord } from '../database/repository.js';
import { TrustScoreComputation } from '../types/index.js';

const router = Router();

async function resolveAssessment(id: string): Promise<AssessmentRecord | null> {
  if (id.startsWith('BENCH_')) {
    const bench = (await db.benchmarks.getBenchmark?.(id)) || durableStore.getBenchmark(id);
    if (bench?.assessment_id) {
      return (await db.getAssessment(bench.assessment_id)) || durableStore.getAssessment(bench.assessment_id);
    }
  }
  return (await db.getAssessment(id)) || durableStore.getAssessment(id);
}

/**
 * GET /api/reports/:id
 * Returns JSON compliance report for an assessment.
 */
router.get('/reports/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const job = await resolveAssessment(id);

  if (!job) {
    res.status(404).json({ error: `Assessment record '${id}' not found.`, code: 'NOT_FOUND' });
    return;
  }

  if (!validateTenantAccess(job.org_id, req, res)) {
    return;
  }

  if (job.status === 'in_progress') {
    res.status(409).json({
      error: 'Assessment is currently in progress. Complete report will be available once evaluation finishes.',
      code: 'ASSESSMENT_IN_PROGRESS',
      progress: job.progress,
    });
    return;
  }

  if (job.status === 'failed') {
    res.status(422).json({
      error: `Assessment failed: ${job.error || 'Execution encountered an unrecoverable failure.'}`,
      code: 'ASSESSMENT_FAILED',
    });
    return;
  }

  const score = await db.getTrustScore(job.assessment_id);
  const trustScore = job.trust_score !== null && job.trust_score !== undefined ? job.trust_score : (score?.trust_score ?? null);
  const evidenceCoverage = job.evidence_coverage !== null && job.evidence_coverage !== undefined ? job.evidence_coverage : (score?.evidence_coverage ?? 0);
  const posture = job.posture || score?.posture || 'Not Scorable';
  const pillarScores = job.pillar_scores || score?.pillar_scores || {};
  const findings = job.findings || (await db.getFindings(job.assessment_id)) || [];

  res.json({
    assessment_id: job.assessment_id,
    website_url: job.website_url || '',
    status: job.status,
    generated_at: new Date().toISOString(),
    trust_score: trustScore,
    posture,
    evidence_coverage: evidenceCoverage,
    evaluation_engine: score?.is_consensus ? 'Top-3 Majority Voting Consensus' : (score?.model_id || (job.models_evaluated?.length ? job.models_evaluated[0] : 'NOT_EVALUATED')),
    selection_mode: job.selection_mode || null,
    models_evaluated: job.models_evaluated || [],
    pillar_scores: pillarScores,
    findings: findings.slice(0, 20),
    methodology: 'Evidence-grounded statutory RAG evaluation against Indian DPDP Act 2023 and Notified Rules 2025.',
  });
});

/**
 * GET /api/reports/executive/:id
 */
router.get('/reports/executive/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const job = await resolveAssessment(id);

  if (!job) {
    res.status(404).json({ error: `Assessment record '${id}' not found.`, code: 'NOT_FOUND' });
    return;
  }

  if (!validateTenantAccess(job.org_id, req, res)) {
    return;
  }

  if (job.status === 'in_progress') {
    res.status(409).json({
      error: 'Assessment is currently in progress. Complete report will be available once evaluation finishes.',
      code: 'ASSESSMENT_IN_PROGRESS',
      progress: job.progress,
    });
    return;
  }

  const score = await db.getTrustScore(job.assessment_id);
  const trustScore = job.trust_score !== null && job.trust_score !== undefined ? job.trust_score : (score?.trust_score ?? null);
  const evidenceCoverage = job.evidence_coverage !== null && job.evidence_coverage !== undefined ? job.evidence_coverage : (score?.evidence_coverage ?? 0);
  const posture = job.posture || score?.posture || 'Not Scorable';
  const pillarScores = job.pillar_scores || score?.pillar_scores || {};
  const findings = job.findings || (await db.getFindings(job.assessment_id)) || [];

  res.json({
    assessment_id: job.assessment_id,
    website_url: job.website_url || '',
    status: job.status,
    generated_at: new Date().toISOString(),
    trust_score: trustScore,
    posture,
    evidence_coverage: evidenceCoverage,
    evaluation_engine: score?.is_consensus ? 'Top-3 Majority Voting Consensus' : (score?.model_id || (job.models_evaluated?.length ? job.models_evaluated[0] : 'NOT_EVALUATED')),
    selection_mode: job.selection_mode || null,
    models_evaluated: job.models_evaluated || [],
    pillar_scores: pillarScores,
    findings: findings.slice(0, 20),
    methodology: 'Evidence-grounded statutory RAG evaluation against Indian DPDP Act 2023 and Notified Rules 2025.',
  });
});

/**
 * PDF Export Handler — Generates and streams PDF assessment report with authentic scores
 */
const handlePdfExport = async (req: Request, res: Response): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  try {
    const job = await resolveAssessment(id);

    if (!job) {
      res.status(404).json({ error: `Assessment record '${id}' not found.`, code: 'NOT_FOUND' });
      return;
    }

    if (!validateTenantAccess(job.org_id, req, res)) {
      return;
    }

    if (job.status === 'in_progress') {
      res.status(409).json({
        error: 'Assessment is currently in progress. PDF export requires completed assessment.',
        code: 'ASSESSMENT_IN_PROGRESS',
      });
      return;
    }

    if (job.status === 'failed') {
      res.status(422).json({
        error: `Assessment failed: ${job.error || 'Execution failed.'}`,
        code: 'ASSESSMENT_FAILED',
      });
      return;
    }

    const effectiveId = job.assessment_id;
    const score = await db.getTrustScore(effectiveId);

    const trustScoreVal = job.trust_score !== null && job.trust_score !== undefined ? job.trust_score : (score?.trust_score ?? null);
    const evidenceCoverage = job.evidence_coverage !== null && job.evidence_coverage !== undefined ? job.evidence_coverage : (score?.evidence_coverage ?? 0);
    const posture = job.posture || score?.posture || 'Not Scorable';

    // Build authentic TrustScoreComputation without fabricated defaults
    const computedScore: TrustScoreComputation = {
      model_id: score?.model_id || (score?.is_consensus ? 'CONSENSUS' : 'NOT_RECORDED'),
      trust_score: trustScoreVal,
      posture: posture as any,
      evidence_coverage: evidenceCoverage,
      is_consensus: score?.is_consensus ?? (job.selection_mode === 'TOP3_CONSENSUS'),
      pillar_scores: (job.pillar_scores as any) || score?.pillar_scores || {},
    };

    const findings = job.findings || (await db.getFindings(effectiveId)) || [];
    const evaluatedModels = job.models_evaluated && job.models_evaluated.length > 0
      ? job.models_evaluated
      : (score?.model_id ? [score.model_id] : []);

    const pdfBuffer = await generatePdfReport({
      scanId: effectiveId,
      websiteUrl: job.website_url || 'Target Website',
      assessmentDate: new Date().toLocaleDateString('en-GB'),
      trustScore: computedScore,
      findings,
      evaluatedModels,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=TrustForge_DPDP_Report_${effectiveId}.pdf`);
    res.send(pdfBuffer);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('PDF report generation error:', msg);
    res.status(500).json({ error: `PDF generation failed: ${msg}`, code: 'PDF_GEN_FAILED' });
  }
};

router.get('/reports/:id/pdf', requireAuth, handlePdfExport);
router.get('/reports/pdf/:id', requireAuth, handlePdfExport);

export default router;
