import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
dotenv.config({ path: 'C:/TF new V1/TrustForge/api/.env' });
import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');

import { hybridRAG } from './src/rag/hybridRAG.js';

async function evaluateFusionAblation() {
  const datasetPath = path.resolve('C:/TF new V1/TrustForge/docs/research/evaluation/datasets/rag_retrieval_benchmark_v2_authoritative.json');
  const dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf-8'));
  const queries = dataset.queries;

  // 50/50 dev / held-out split (even indices dev, odd indices test)
  const devQueries = queries.filter((_: any, i: number) => i % 2 === 0); // 23 queries
  const testQueries = queries.filter((_: any, i: number) => i % 2 === 1); // 22 queries

  console.log(`Dataset size: ${queries.length} queries`);
  console.log(`Development Split: ${devQueries.length} queries`);
  console.log(`Held-Out Test Split: ${testQueries.length} queries\n`);

  // Configurations to evaluate:
  // 1. BM25 alone
  // 2. Vector alone
  // 3. Standard RRF (w_bm25=1.0, w_vec=1.0, k=60)
  // 4. Weighted RRF (w_bm25=1.5, w_vec=1.0, k=60)
  // 5. Weighted RRF (w_bm25=2.0, w_vec=1.0, k=60)
  // 6. RRF with k=20, k=40, k=60

  const configs = [
    { name: 'BM25_ONLY', wBm25: 1.0, wVec: 0.0, k: 60 },
    { name: 'VECTOR_ONLY', wBm25: 0.0, wVec: 1.0, k: 60 },
    { name: 'Standard RRF (k=60)', wBm25: 1.0, wVec: 1.0, k: 60 },
    { name: 'Standard RRF (k=20)', wBm25: 1.0, wVec: 1.0, k: 20 },
    { name: 'Standard RRF (k=40)', wBm25: 1.0, wVec: 1.0, k: 40 },
    { name: 'Weighted RRF (w_b=1.5, w_v=1.0, k=60)', wBm25: 1.5, wVec: 1.0, k: 60 },
    { name: 'Weighted RRF (w_b=2.0, w_v=1.0, k=60)', wBm25: 2.0, wVec: 1.0, k: 60 },
  ];

  async function runSplit(splitQueries: any[], cfg: typeof configs[0]) {
    let hit1 = 0;
    let hit3 = 0;
    let hit5 = 0;
    let mrrSum = 0;

    for (const q of splitQueries) {
      const expected: string[] = q.expected_chunk_ids || [];

      // Get BM25 pool
      const bRes = cfg.wBm25 > 0 ? hybridRAG.retrieveBM25(q.query, '', 25) : [];
      // Get Vector pool
      const vRes = cfg.wVec > 0 ? await hybridRAG.retrieveVector(q.query, 83, 0.05) : { results: [] };

      // Fuse
      const scoreMap = new Map<string, number>();

      if (cfg.wBm25 > 0) {
        for (const item of bRes) {
          scoreMap.set(item.chunk.chunk_id, (scoreMap.get(item.chunk.chunk_id) || 0) + cfg.wBm25 / (cfg.k + item.rank));
        }
      }

      if (cfg.wVec > 0) {
        for (const item of vRes.results) {
          scoreMap.set(item.chunk_id, (scoreMap.get(item.chunk_id) || 0) + cfg.wVec / (cfg.k + item.rank));
        }
      }

      const ranked = Array.from(scoreMap.entries())
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, 5)
        .map(x => x[0]);

      if (expected.includes(ranked[0])) hit1++;
      if (ranked.slice(0, 3).some(id => expected.includes(id))) hit3++;
      if (ranked.slice(0, 5).some(id => expected.includes(id))) hit5++;

      for (let i = 0; i < ranked.length; i++) {
        if (expected.includes(ranked[i])) {
          mrrSum += 1.0 / (i + 1);
          break;
        }
      }
    }

    const n = splitQueries.length;
    return {
      hit1: ((hit1 / n) * 100).toFixed(1) + '%',
      hit3: ((hit3 / n) * 100).toFixed(1) + '%',
      hit5: ((hit5 / n) * 100).toFixed(1) + '%',
      mrr: (mrrSum / n).toFixed(3),
    };
  }

  console.log('--- DEVELOPMENT SPLIT (23 Queries) ---');
  for (const cfg of configs) {
    const res = await runSplit(devQueries, cfg);
    console.log(`${cfg.name.padEnd(38)} | Hit@1: ${res.hit1} | Hit@5: ${res.hit5} | MRR: ${res.mrr}`);
  }

  console.log('\n--- HELD-OUT TEST SPLIT (22 Queries) ---');
  for (const cfg of configs) {
    const res = await runSplit(testQueries, cfg);
    console.log(`${cfg.name.padEnd(38)} | Hit@1: ${res.hit1} | Hit@5: ${res.hit5} | MRR: ${res.mrr}`);
  }
}

evaluateFusionAblation().catch(console.error);
