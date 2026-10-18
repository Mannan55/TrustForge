/**
 * TrustForge Research Backend — Node.js / Express Orchestrator.
 * Deployed to Render. Serves REST API for Vercel Frontend.
 */
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';

import healthRoute from './routes/health.js';
import scansRoute from './routes/scans.js';
import assessmentsRoute from './routes/assessments.js';
import benchmarkRoute from './routes/benchmark.js';
import findingsRoute from './routes/findings.js';
import trustScoreRoute from './routes/trustScore.js';
import reportsRoute from './routes/reports.js';
import ragRoute from './routes/rag.js';

const app = express();
const PORT = parseInt(process.env.PORT || '8000', 10);

// CORS configuration for frontend
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000').split(',').map(s => s.trim());

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps, curl, or same-origin)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || origin.includes('localhost') || origin.includes('127.0.0.1') || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    return callback(null, true); // Permissive for research demo
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Route registration
app.use('/api', healthRoute);
app.use('/api', scansRoute);
app.use('/api', assessmentsRoute);
app.use('/api/benchmark', benchmarkRoute);
app.use('/api', findingsRoute);
app.use('/api', trustScoreRoute);
app.use('/api', reportsRoute);
app.use('/api', ragRoute);

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

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`================================================================`);
    console.log(`TrustForge Express Research Backend running on port ${PORT}`);
    console.log(`Health check: http://127.0.0.1:${PORT}/api/health`);
    console.log(`10-Model Benchmark: http://127.0.0.1:${PORT}/api/benchmark/models`);
    console.log(`================================================================`);
  });
}

export default app;
