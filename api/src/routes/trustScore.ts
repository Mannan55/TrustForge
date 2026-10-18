import { Router, Request, Response } from 'express';
import { db } from '../database/supabaseClient.js';

const router = Router();

router.get('/trust-score/:id', async (req: Request, res: Response): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const score = await db.getTrustScore(id) || await db.getTrustScore(id, 'M06');

  if (!score) {
    res.status(404).json({ error: `Trust score for assessment ${id} not found.` });
    return;
  }

  res.json({
    assessment_id: id,
    model_id: score.model_id,
    trust_score: score.trust_score,
    posture: score.posture,
    evidence_coverage: score.evidence_coverage,
    is_consensus: score.is_consensus,
    pillar_scores: Object.values(score.pillar_scores || {}),
  });
});

export default router;
