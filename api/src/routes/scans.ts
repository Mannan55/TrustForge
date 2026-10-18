import { Router, Request, Response } from 'express';
import { crawlWebsite } from '../crawler/playwrightCrawler.js';
import { db } from '../database/supabaseClient.js';

const router = Router();

router.post('/scans', async (req: Request, res: Response): Promise<void> => {
  const { url } = req.body;
  if (!url || typeof url !== 'string') {
    res.status(400).json({ error: 'Target URL is required.' });
    return;
  }

  try {
    console.log(`[Playwright Crawler] Initiating scan for: ${url}`);
    const scanResult = await crawlWebsite(url);

    if (scanResult.status === 'completed') {
      await db.saveScan({
        scanId: scanResult.scanId,
        url: scanResult.url,
        checks: scanResult.checks,
        evidence: scanResult.evidence,
        preliminaryScore: scanResult.preliminaryScore,
        posture: scanResult.posture,
        durationMs: scanResult.durationMs,
      });
    }

    res.json({
      scan_id: scanResult.scanId,
      url: scanResult.url,
      status: scanResult.status,
      checks: scanResult.checks,
      evidence: scanResult.evidence,
      score: scanResult.preliminaryScore,
      posture: scanResult.posture,
      scanned_at: scanResult.scannedAt,
      duration_ms: scanResult.durationMs,
      error: scanResult.error,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Scan execution error:', msg);
    res.status(500).json({ error: `Internal scanning failure: ${msg}` });
  }
});

router.get('/scans/:id', async (req: Request, res: Response): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const scan = await db.getScan(id);
  if (!scan) {
    res.status(404).json({ error: `Scan ${id} not found.` });
    return;
  }
  res.json(scan);
});

export default router;
