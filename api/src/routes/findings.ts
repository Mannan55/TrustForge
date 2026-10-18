import { Router, Request, Response } from 'express';
import { db } from '../database/supabaseClient.js';

const router = Router();

router.get('/findings/:id', async (req: Request, res: Response): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
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
