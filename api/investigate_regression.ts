import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
dotenv.config({ path: 'C:/TF new V1/TrustForge/api/.env' });
import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');

import { hybridRAG } from './src/rag/hybridRAG.js';

async function investigate() {
  const datasetPath = path.resolve('C:/TF new V1/TrustForge/docs/research/evaluation/datasets/rag_retrieval_benchmark_v2_authoritative.json');
  const dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf-8'));
  console.log(`Analyzing ${dataset.queries.length} benchmark queries...`);

  let bm25Hit1 = 0;
  let vecHit1 = 0;
  let hybridHit1 = 0;

  const regressions: any[] = [];
  const improvements: any[] = [];

  for (const q of dataset.queries) {
    const expected: string[] = q.expected_chunk_ids || [];

    // 1. BM25
    const bRes = hybridRAG.retrieveBM25(q.query, '', 5);
    const bTop = bRes[0]?.chunk.chunk_id;
    const bHit1 = expected.includes(bTop);
    if (bHit1) bm25Hit1++;

    // 2. Vector
    const vRes = await hybridRAG.retrieveVector(q.query, 5, 0.05);
    const vTop = vRes.results[0]?.chunk_id;
    const vHit1 = expected.includes(vTop);
    if (vHit1) vecHit1++;

    // 3. Hybrid RRF
    const hRes = await hybridRAG.retrieveContextForControl(q.query_id, '', q.query, { topK: 5 });
    const hTop = hRes.chunks[0]?.chunk_id;
    const hHit1 = expected.includes(hTop);
    if (hHit1) hybridHit1++;

    if (bHit1 && !hHit1) {
      regressions.push({
        id: q.query_id,
        query: q.query,
        expected,
        bm25Top: bTop,
        bm25RankOfExpected: bRes.findIndex(r => expected.includes(r.chunk.chunk_id)) + 1,
        vecTop: vTop,
        vecRankOfExpected: vRes.results.findIndex(r => expected.includes(r.chunk_id)) + 1,
        hybridTop: hTop,
        hybridRRFChunks: hRes.chunks.map(c => ({
          chunk_id: c.chunk_id,
          rrf: c.rrf_score,
          bm25_rank: c.bm25_rank,
          vec_rank: c.vector_rank,
        })),
      });
    } else if (!bHit1 && hHit1) {
      improvements.push({
        id: q.query_id,
        query: q.query,
        expected,
        bm25Top: bTop,
        vecTop: vTop,
        hybridTop: hTop,
      });
    }
  }

  const N = dataset.queries.length;
  console.log(`\n======================================================`);
  console.log(`INVESTIGATION RESULTS (${N} Queries)`);
  console.log(`======================================================`);
  console.log(`BM25 Hit@1:   ${bm25Hit1}/${N} (${((bm25Hit1 / N) * 100).toFixed(1)}%)`);
  console.log(`Vector Hit@1: ${vecHit1}/${N} (${((vecHit1 / N) * 100).toFixed(1)}%)`);
  console.log(`Hybrid Hit@1: ${hybridHit1}/${N} (${((hybridHit1 / N) * 100).toFixed(1)}%)`);
  console.log(`\nBM25 Success -> Hybrid Failure (Regressions): ${regressions.length}`);
  console.log(`BM25 Failure -> Hybrid Success (Improvements): ${improvements.length}`);

  console.log(`\nDetailed Regression Queries:`);
  for (const r of regressions) {
    console.log(`\nQuery [${r.id}]: "${r.query}"`);
    console.log(`  Expected: ${r.expected.join(', ')}`);
    console.log(`  BM25 #1:   ${r.bm25Top} (Expected rank in BM25: ${r.bm25RankOfExpected})`);
    console.log(`  Vector #1: ${r.vecTop} (Expected rank in Vector: ${r.vecRankOfExpected})`);
    console.log(`  Hybrid #1: ${r.hybridTop}`);
    console.log(`  Hybrid Top Chunks:`, r.hybridRRFChunks.slice(0, 3));
  }
}

investigate().catch(console.error);
