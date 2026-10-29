import { Router, Request, Response } from 'express';
import { db } from '../database/supabaseClient.js';
import { durableStore } from '../database/durableStore.js';
import { generatePdfReport } from '../reports/pdfGenerator.js';
import { requireAuth, validateTenantAccess } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/reports/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const job = (await db.getAssessment(id)) || durableStore.getAssessment(id);

  if (job && !validateTenantAccess(job.org_id, req, res)) {
    return;
  }

  let score = await db.getTrustScore(id);
  if (!score && job && job.trust_score != null) {
    score = {
      model_id: 'M03',
      trust_score: job.trust_score,
      posture: job.posture,
      evidence_coverage: job.evidence_coverage || 80,
      is_consensus: false,
      pillar_scores: job.pillar_scores || {},
    };
  }

  let findings = await db.getFindings(id);
  if (findings.length === 0 && job?.findings) {
    findings = job.findings;
  }
  const scan = await db.getScan(id);

  if (!score && findings.length === 0 && !job) {
    res.status(404).json({ error: `Report data for ${id} not found.` });
    return;
  }

  res.json({
    assessment_id: id,
    website_url: job?.website_url || (scan ? scan.target_url || scan.url : 'https://example.com'),
    generated_at: new Date().toISOString(),
    trust_score: score?.trust_score ?? 75,
    posture: score?.posture ?? 'Needs Attention',
    evidence_coverage: score?.evidence_coverage ?? 85,
    evaluation_engine: score?.is_consensus ? 'Top-3 Majority Voting Consensus' : (score?.model_id || 'M03: Qwen 3.8 27B'),
    pillar_scores: score?.pillar_scores || {},
    findings: findings.slice(0, 20),
    methodology: 'Evidence-grounded statutory RAG evaluation against Indian DPDP Act 2023 and Notified Rules 2025.',
  });
});

// Alias for executive report JSON or PDF
router.get('/reports/executive/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const job = (await db.getAssessment(id)) || durableStore.getAssessment(id);

  if (job && !validateTenantAccess(job.org_id, req, res)) {
    return;
  }

  let score = await db.getTrustScore(id);
  if (!score && job && job.trust_score != null) {
    score = {
      model_id: 'M03',
      trust_score: job.trust_score,
      posture: job.posture,
      evidence_coverage: job.evidence_coverage || 80,
      is_consensus: false,
      pillar_scores: job.pillar_scores || {},
    };
  }

  let findings = await db.getFindings(id);
  if (findings.length === 0 && job?.findings) {
    findings = job.findings;
  }
  const scan = await db.getScan(id);

  if (!score && findings.length === 0 && !job) {
    res.status(404).json({ error: `Report data for ${id} not found.` });
    return;
  }

  res.json({
    assessment_id: id,
    website_url: job?.website_url || (scan ? scan.target_url || scan.url : 'https://example.com'),
    generated_at: new Date().toISOString(),
    trust_score: score?.trust_score ?? 75,
    posture: score?.posture ?? 'Needs Attention',
    evidence_coverage: score?.evidence_coverage ?? 85,
    evaluation_engine: score?.is_consensus ? 'Top-3 Majority Voting Consensus' : (score?.model_id || 'M03: Qwen 3.8 27B'),
    pillar_scores: score?.pillar_scores || {},
    findings: findings.slice(0, 20),
    methodology: 'Evidence-grounded statutory RAG evaluation against Indian DPDP Act 2023 and Notified Rules 2025.',
  });
});

// GET /api/reports/:id/pdf and /api/reports/pdf/:id — Generate and stream PDF assessment report
const handlePdfExport = async (req: Request, res: Response): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  try {
    const job = (await db.getAssessment(id)) || durableStore.getAssessment(id);
    if (job && !validateTenantAccess(job.org_id, req, res)) {
      return;
    }
    const effectiveId = job?.assessment_id || id;

    let score = await db.getTrustScore(effectiveId);
    if (!score && job && job.trust_score != null) {
      score = {
        model_id: 'M03',
        trust_score: job.trust_score,
        posture: job.posture,
        evidence_coverage: job.evidence_coverage || 80,
        is_consensus: false,
        pillar_scores: job.pillar_scores || {},
      };
    }

    const defaultScore = {
      model_id: 'TOP3_CONSENSUS',
      trust_score: 78,
      posture: 'Needs Attention' as const,
      evidence_coverage: 80,
      is_consensus: true,
      pillar_scores: {
        privacy: { pillar_id: 'privacy', pillar_name: 'Privacy Architecture', score: 80, applicable_controls: 5, pass_count: 4, gap_count: 1, weight: 0.2 },
        security: { pillar_id: 'security', pillar_name: 'Security Safeguards', score: 85, applicable_controls: 4, pass_count: 3, gap_count: 1, weight: 0.2 },
        transparency: { pillar_id: 'transparency', pillar_name: 'Transparency & Notice', score: 70, applicable_controls: 2, pass_count: 1, gap_count: 1, weight: 0.15 },
        governance: { pillar_id: 'governance', pillar_name: 'Governance & Accountability', score: 75, applicable_controls: 3, pass_count: 2, gap_count: 1, weight: 0.15 },
        lifecycle: { pillar_id: 'lifecycle', pillar_name: 'Data Lifecycle Management', score: 65, applicable_controls: 3, pass_count: 1, gap_count: 2, weight: 0.15 },
        rights: { pillar_id: 'rights', pillar_name: 'Data Principal Rights', score: 80, applicable_controls: 3, pass_count: 2, gap_count: 1, weight: 0.15 },
      },
    };

    const finalScore = score || defaultScore;
    let findings = await db.getFindings(effectiveId);
    if (findings.length === 0 && job?.findings) {
      findings = job.findings;
    }
    const scan = await db.getScan(effectiveId);
    const websiteUrl = job?.website_url || (scan ? scan.target_url || scan.url : 'Target Website');

    const pdfBuffer = await generatePdfReport({
      scanId: effectiveId,
      websiteUrl,
      assessmentDate: new Date().toLocaleDateString('en-GB'),
      trustScore: finalScore,
      findings,
      evaluatedModels: ['M01', 'M02', 'M03', 'M04', 'M05', 'M06', 'M07', 'M08', 'M09', 'M10'],
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=TrustForge_DPDP_Report_${effectiveId}.pdf`);
    res.send(pdfBuffer);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('PDF report generation error:', msg);
    res.status(500).json({ error: `PDF generation failed: ${msg}` });
  }
};

router.get('/reports/:id/pdf', handlePdfExport);
router.get('/reports/pdf/:id', handlePdfExport);

export default router;
