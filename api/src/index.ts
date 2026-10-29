/**
 * TrustForge Research Backend — Node.js / Express Orchestrator.
 * Deployed to Render. Serves REST API for Vercel Frontend.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import express from 'express';
import cors from 'cors';

import authRoute from './routes/auth.js';
import healthRoute from './routes/health.js';
import scansRoute from './routes/scans.js';
import assessmentsRoute from './routes/assessments.js';
import benchmarkRoute from './routes/benchmark.js';
import findingsRoute from './routes/findings.js';
import trustScoreRoute from './routes/trustScore.js';
import reportsRoute from './routes/reports.js';
import ragRoute from './routes/rag.js';
import evaluationRoute from './routes/evaluation.js';

const app = express();
const PORT = parseInt(process.env.PORT || '8000', 10);

// CORS configuration for frontend
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000').split(',').map(s => s.trim());

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps, curl, or same-origin)
    if (!origin) return callback(null, true);
    const isAllowed = allowedOrigins.includes(origin) ||
      origin.startsWith('http://localhost:') ||
      origin.startsWith('http://127.0.0.1:') ||
      origin.endsWith('.vercel.app');

    if (isAllowed) {
      return callback(null, true);
    }
    if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    return callback(new Error(`CORS origin '${origin}' not permitted.`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-anonymous'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Tenant isolation and authentication middleware
import { authMiddleware } from './middleware/authMiddleware.js';
app.use(authMiddleware);

// Route registration
app.use('/api', authRoute);
app.use('/api', healthRoute);
app.use('/api', scansRoute);
app.use('/api', assessmentsRoute);
app.use('/api/benchmark', benchmarkRoute);
app.use('/api', findingsRoute);
app.use('/api', trustScoreRoute);
app.use('/api', reportsRoute);
app.use('/api', ragRoute);
app.use('/api/evaluation', evaluationRoute);

// Root
app.get('/', (req, res) => {
  res.json({
    service: 'TrustForge Research Backend & 10-LLM Orchestrator',
    runtime: 'Node.js + Express',
    deployment_target: 'Render',
    version: '1.0.0-research',
    jurisdiction: 'India (DPDP Act, 2023 & DPDP Rules, 2025)',
  });
});

import { LLMGateway } from './gateway/llmGateway.js';

const isMainModule = process.argv[1] && (process.argv[1].endsWith('index.ts') || process.argv[1].endsWith('index.js'));
if (isMainModule && process.env.NODE_ENV !== 'test') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`================================================================`);
    console.log(`TrustForge Express Research Backend running on port ${PORT}`);
    console.log(`Health check: http://127.0.0.1:${PORT}/api/health`);
    console.log(`10-Model Benchmark: http://127.0.0.1:${PORT}/api/benchmark/models`);
    console.log(`================================================================`);

    // Output model registry and provider startup diagnostics (zero credential leakage)
    try {
      new LLMGateway().printStartupDiagnostics();
    } catch (e) {
      console.warn('[Startup] Diagnostics error:', e);
    }
  });
}

export default app;
