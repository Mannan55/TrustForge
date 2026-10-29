process.env.NODE_ENV = 'test';
import dotenv from 'dotenv';
dotenv.config({ path: 'c:/TF new V1/TrustForge/api/.env' });

import express from 'express';
import cors from 'cors';
import assessmentsRoute from './src/routes/assessments.js';
import trustScoreRoute from './src/routes/trustScore.js';
import reportsRoute from './src/routes/reports.js';
import findingsRoute from './src/routes/findings.js';
import scansRoute from './src/routes/scans.js';
import benchmarkRoute from './src/routes/benchmark.js';

import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');

import app from './src/index.js';

async function runE2E() {
  let server = app.listen(8002);
  console.log('Production app listening on port 8002 for E2E verification...');

  let assessmentId = '';

  try {
    // 1. Submit Authenticated Assessment
    const payload = {
      org_id: 'org_technova',
      website_url: 'https://example.com',
      collections: ['Website forms', 'Mobile application', 'Payment checkout'],
      categories: ['identifiers', 'financial', 'device'],
      purposes: ['service', 'auth', 'analytics'],
      languages: ['en', 'hi', 'kn'],
      rights: ['access', 'correction', 'grievance'],
      processors: ['cloudfront', 'razorpay'],
      retention: '90 days post termination',
      erasure_automated: true,
      breach_plan: true,
      grievance_officer_named: true,
      grievance_contact_published: true,
    };

    console.log('\n[TEST 1] Submitting authenticated assessment to POST /api/assessments...');
    const createRes = await fetch('http://127.0.0.1:8002/api/assessments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    console.log(`Creation HTTP Status: ${createRes.status}`);
    const createData = await createRes.json() as any;
    console.log('Creation Response:', JSON.stringify(createData, null, 2));

    assessmentId = createData.assessment_id;
    if (!assessmentId) throw new Error('No assessment_id returned!');

    // 2. Poll GET /api/assessments/:id until complete
    console.log(`\n[TEST 2] Polling GET /api/assessments/${assessmentId}...`);
    let finalJob: any = null;
    let pollCount = 0;

    while (pollCount < 60) {
      pollCount++;
      await new Promise(r => setTimeout(r, 2000));

      const pollRes = await fetch(`http://127.0.0.1:8002/api/assessments/${assessmentId}`);
      if (!pollRes.ok) {
        console.error(`Poll failed HTTP ${pollRes.status}:`, await pollRes.text());
        continue;
      }

      const job = await pollRes.json() as any;
      console.log(`[Poll #${pollCount}] Status: ${job.status} | Progress: ${job.progress}% | Step: ${job.current_step || ''}`);

      if (job.status === 'complete' || job.status === 'completed') {
        finalJob = job;
        break;
      }
      if (job.status === 'failed' || job.status === 'error') {
        throw new Error(`Assessment failed in background: ${job.error}`);
      }
    }

    if (!finalJob) {
      throw new Error('Assessment did not complete within timeout!');
    }

    console.log('\n[TEST 3] Assessment Successfully Completed!');
    console.log(`- Final Status: ${finalJob.status}`);
    console.log(`- Progress: ${finalJob.progress}%`);
    console.log(`- Trust Score: ${finalJob.trust_score}/100`);
    console.log(`- Posture: ${finalJob.posture}`);
    console.log(`- Findings Count: ${finalJob.findings?.length}`);

    // Validate Pillar Scores
    console.log('\n[VALIDATION] Validating Pillar Scores contract...');
    if (!finalJob.pillar_scores || finalJob.pillar_scores.length === 0) {
      throw new Error('No pillar_scores returned in completed job!');
    }
    for (const p of finalJob.pillar_scores) {
      console.log(`  - Pillar: "${p.pillar_name}" (id: ${p.pillar_id}, coverage: ${p.evidence_coverage}%, score: ${p.score})`);
      if (!p.pillar_name || p.pillar_name.includes('Unknown')) {
        throw new Error(`Pillar has invalid name: "${p.pillar_name}"`);
      }
      if (typeof p.evidence_coverage !== 'number') {
        throw new Error(`Pillar ${p.pillar_name} missing evidence_coverage number`);
      }
    }

    // Validate Priority Findings
    console.log('\n[VALIDATION] Validating Findings contract...');
    if (!finalJob.findings || finalJob.findings.length === 0) {
      throw new Error('No findings returned in completed job!');
    }
    const sampleFinding = finalJob.findings[0];
    console.log(`  - Sample Finding: "${sampleFinding.title}" (${sampleFinding.control_id})`);
    console.log(`    Severity: ${sampleFinding.severity} | Status: ${sampleFinding.status}`);
    console.log(`    Finding Text: "${sampleFinding.finding?.substring(0, 60)}..."`);
    console.log(`    Statutory Ref: "${sampleFinding.dpdp_reference || sampleFinding.statutory_ref}"`);

    if (!sampleFinding.title || sampleFinding.title === sampleFinding.control_id) {
      throw new Error(`Finding title missing or not enriched: "${sampleFinding.title}"`);
    }
    if (!sampleFinding.finding) {
      throw new Error('Finding text is blank!');
    }

    // 4. Validate 10-Model Benchmark Integration
    console.log('\n[TEST 4] Validating 10-Model Benchmark integration...');
    console.log(`- Benchmark ID: ${finalJob.benchmark_id}`);
    console.log(`- Benchmark Status: ${finalJob.benchmark_status}`);
    console.log(`- Models Evaluated: ${finalJob.models_evaluated?.join(', ')}`);
    console.log(`- Selection Mode: ${finalJob.selection_mode}`);

    if (!finalJob.benchmark_id) throw new Error('No benchmark_id attached to assessment!');
    if (!finalJob.models_evaluated || finalJob.models_evaluated.length === 0) {
      throw new Error('No models were evaluated in benchmark run!');
    }

    const benchModelsRes = await fetch('http://127.0.0.1:8002/api/benchmark/models');
    if (benchModelsRes.status !== 200) throw new Error(`Benchmark /models returned HTTP ${benchModelsRes.status}`);
    const benchModelsData = await benchModelsRes.json() as any;
    console.log(`- Total candidate models in registry: ${benchModelsData.total_models}`);
    if (benchModelsData.total_models !== 10) {
      throw new Error(`Expected 10 candidate models, found ${benchModelsData.total_models}`);
    }

    const benchLatestRes = await fetch('http://127.0.0.1:8002/api/benchmark/latest');
    if (benchLatestRes.status !== 200) throw new Error(`Benchmark /latest returned HTTP ${benchLatestRes.status}`);
    const benchLatestData = await benchLatestRes.json() as any;
    console.log(`- Latest Benchmark Run ID: ${benchLatestData.benchmark_id}`);
    console.log(`- RAG Snapshot Hash: ${benchLatestData.rag_snapshot_hash}`);
    console.log(`- Evaluated Count: ${benchLatestData.total_models_evaluated}`);

    // 5. Verify /api/reports/executive/:id
    console.log('\n[TEST 5] Verifying GET /api/reports/executive/:id...');
    const repRes = await fetch(`http://127.0.0.1:8002/api/reports/executive/${assessmentId}`);
    console.log(`Executive Report HTTP Status: ${repRes.status}`);
    const repData = await repRes.json() as any;
    console.log(`- Report Assessment ID: ${repData.assessment_id}`);
    console.log(`- Report Score: ${repData.trust_score}`);
    if (repRes.status !== 200) throw new Error(`Report returned HTTP ${repRes.status}`);

    // 5B. Verify PDF Report Generation: GET /api/reports/:id/pdf
    console.log('\n[TEST 5B] Verifying PDF Report Generation (GET /api/reports/:id/pdf)...');
    const pdfRes = await fetch(`http://127.0.0.1:8002/api/reports/${assessmentId}/pdf`);
    console.log(`PDF HTTP Status: ${pdfRes.status}`);
    console.log(`PDF Content-Type: ${pdfRes.headers.get('content-type')}`);
    if (pdfRes.status !== 200) throw new Error(`PDF endpoint returned HTTP ${pdfRes.status}`);
    const pdfBuf = Buffer.from(await pdfRes.arrayBuffer());
    console.log(`- PDF Size: ${pdfBuf.length} bytes`);
    const pdfHeader = pdfBuf.subarray(0, 5).toString('ascii');
    console.log(`- PDF Header: ${pdfHeader}`);
    if (!pdfHeader.startsWith('%PDF-')) {
      throw new Error(`Invalid PDF header: ${pdfHeader}`);
    }
    if (pdfBuf.length < 1000) {
      throw new Error(`PDF suspiciously small: ${pdfBuf.length} bytes`);
    }
    console.log('  PDF generation validated successfully.');

    // 6. SIMULATE SERVER RESTART
    console.log('\n[TEST 6] Simulating Server Restart (Closing server 1, launching fresh server 2)...');
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });

    server = app.listen(8003);
    console.log('Test server 2 listening on port 8003 (Post-Restart)...');

    console.log(`Testing retrieval of ${assessmentId} after backend restart...`);
    const postRestartPoll = await fetch(`http://127.0.0.1:8003/api/assessments/${assessmentId}`);
    console.log(`Post-Restart Assessment Retrieval Status: ${postRestartPoll.status}`);
    if (postRestartPoll.status !== 200) {
      throw new Error(`Assessment ${assessmentId} 404ed after backend restart!`);
    }
    const postRestartJob = await postRestartPoll.json() as any;
    console.log(`- Post-Restart Status: ${postRestartJob.status}`);
    console.log(`- Post-Restart Score: ${postRestartJob.trust_score}`);

    const postRestartTs = await fetch(`http://127.0.0.1:8003/api/trust-score/${assessmentId}`);
    console.log(`Post-Restart Trust Score Status: ${postRestartTs.status}`);
    if (postRestartTs.status !== 200) {
      throw new Error(`Trust score for ${assessmentId} 404ed after backend restart!`);
    }

    // 7. Test Free Assessment (POST /api/scans)
    console.log('\n[TEST 7] Verifying Free Assessment (POST /api/scans)...');
    const freeScanRes = await fetch('http://127.0.0.1:8003/api/scans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'https://example.com' }),
    });
    console.log(`Free Scan HTTP Status: ${freeScanRes.status}`);
    const freeScanData = await freeScanRes.json() as any;
    console.log(`- Free Scan ID: ${freeScanData.scan_id}`);
    console.log(`- Preliminary Readiness Score: ${freeScanData.preliminary_readiness_score}`);
    console.log(`- Checks count: ${freeScanData.checks?.length}`);
    if (freeScanRes.status !== 200) throw new Error(`Free scan returned HTTP ${freeScanRes.status}`);

    console.log('\n=============================================================');
    console.log('>>> ALL VERIFICATION TESTS (AUTHENTICATED + RESTART + FREE SCAN) PASSED! <<<');
    console.log('=============================================================');
  } finally {
    server.close();
  }
}

runE2E().catch(err => {
  console.error('\nE2E Test Failed:', err);
  process.exit(1);
});
