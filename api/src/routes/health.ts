import { Router } from 'express';

const router = Router();

router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'TrustForge Node.js / Express Research Orchestrator',
    version: '1.0.0-research',
    models_configured: 10,
    timestamp: new Date().toISOString(),
    crawler: 'Playwright Headless Chromium (Active)',
    database: process.env.SUPABASE_URL ? 'Supabase PostgreSQL (Connected)' : 'Local Hybrid Store (Active)',
  });
});

export default router;
