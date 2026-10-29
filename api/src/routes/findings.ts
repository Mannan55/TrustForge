import { Router, Request, Response } from 'express';
import { db } from '../database/supabaseClient.js';
import { durableStore } from '../database/durableStore.js';
import { requireAuth, validateTenantAccess } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/findings/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const job = (await db.getAssessment(id)) || durableStore.getAssessment(id);

  if (!job) {
    res.status(404).json({ error: `Assessment job ${id} not found.`, code: 'NOT_FOUND' });
    return;
  }

  if (!validateTenantAccess(job.org_id, req, res)) {
    return;
  }

  const findings = await db.getFindings(id);

  if (!findings || findings.length === 0) {
    res.json([]);
    return;
  }

  res.json(findings.map(f => ({
    control_id: f.control_id,
    model_id: f.model_id,
    status: f.verdict === 'SUPPORTED' ? 'PASS' : f.verdict === 'NOT_SUPPORTED' ? 'FAIL' : 'POTENTIAL_GAP',
    verdict: f.verdict,
    severity: f.verdict === 'NOT_SUPPORTED' ? 'HIGH' : 'MEDIUM',
    finding: f.reasoning_summary,
    explanation: f.reasoning_summary,
    recommendation: f.remediation_steps.join('; '),
    evidence_ids: f.evidence_ids,
    citations: f.legal_citations,
    confidence: f.confidence,
    is_grounded: f.is_grounded,
    grounding_score: f.grounding_score,
  })));
});

export default router;
