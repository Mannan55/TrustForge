import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
dotenv.config({ path: 'C:/TF new V1/TrustForge/api/.env' });
import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');

import { hybridRAG } from './src/rag/hybridRAG.js';

async function runDepthAblation() {
  const datasetPath = path.resolve(
    'C:/TF new V1/TrustForge/docs/research/evaluation/datasets/rag_retrieval_benchmark_v2_authoritative.json'
  );
  const dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf-8'));
  const depths = [3, 5, 8];
  const depthResults: Record<number, { hit1: number; hitK: number; mrr: number }> = {};

  for (const k of depths) {
    let hits1 = 0;
    let hitsK = 0;
    let sumRR = 0;

    for (const q of dataset.queries) {
      const results = hybridRAG.retrieveBM25(q.query, '', k);
      const retrievedIds = results.map(r => r.chunk.chunk_id);
      const expected: string[] = q.expected_chunk_ids || [];

      if (expected.includes(retrievedIds[0])) hits1++;
      if (retrievedIds.some(id => expected.includes(id))) hitsK++;

      let rr = 0;
      for (let i = 0; i < retrievedIds.length; i++) {
        if (expected.includes(retrievedIds[i])) {
          rr = 1.0 / (i + 1);
          break;
        }
      }
      sumRR += rr;
    }

    const total = dataset.queries.length;
    depthResults[k] = {
      hit1: Math.round((hits1 / total) * 1000) / 10,
      hitK: Math.round((hitsK / total) * 1000) / 10,
      mrr: Math.round((sumRR / total) * 1000) / 1000,
    };
  }

  console.log('DEPTH ABLATION EVALUATION (k=3, 5, 8):');
  console.log(JSON.stringify(depthResults, null, 2));
}

runDepthAblation().catch(console.error);
