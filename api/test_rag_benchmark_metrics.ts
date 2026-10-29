import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
dotenv.config({ path: 'C:/TF new V1/TrustForge/api/.env' });
import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');

import { hybridRAG } from './src/rag/hybridRAG.js';

interface BenchmarkQuery {
  query_id: string;
  query: string;
  topic: string;
  expected_chunk_ids: string[];
  relevance_grades?: Record<string, number>;
}

interface BenchmarkDataset {
  benchmark_name: string;
  version: string;
  total_queries: number;
  queries: BenchmarkQuery[];
}

interface RunMetrics {
  mode: string;
  totalQueries: number;
  hit1: number;
  hit3: number;
  hit5: number;
  mrr5: number;
  ndcg5: number;
  meanLatencyMs: number;
  p95LatencyMs: number;
  latencies: number[];
  queryResults: Array<{
    id: string;
    query: string;
    topChunk: string;
    expected: string[];
    hit1: boolean;
    hit5: boolean;
    rr: number;
    ndcg: number;
    latencyMs: number;
  }>;
}

function computeDCG(ranks: { chunkId: string; grade: number }[]): number {
  let dcg = 0;
  for (let i = 0; i < ranks.length; i++) {
    const rank = i + 1;
    const rel = ranks[i].grade;
    dcg += (Math.pow(2, rel) - 1) / Math.log2(rank + 1);
  }
  return dcg;
}

function computeIDCG(grades: number[], topK: number = 5): number {
  const sorted = [...grades].sort((a, b) => b - a).slice(0, topK);
  let idcg = 0;
  for (let i = 0; i < sorted.length; i++) {
    idcg += (Math.pow(2, sorted[i]) - 1) / Math.log2(i + 2);
  }
  return idcg;
}

async function evaluateMode(
  dataset: BenchmarkDataset,
  mode: 'BM25_ONLY' | 'VECTOR_ONLY' | 'HYBRID'
): Promise<RunMetrics> {
  const latencies: number[] = [];
  let hits1 = 0;
  let hits3 = 0;
  let hits5 = 0;
  let sumRR = 0;
  let sumNDCG = 0;
  const queryResults: RunMetrics['queryResults'] = [];

  for (const q of dataset.queries) {
    const t0 = Date.now();
    let retrievedIds: string[] = [];

    if (mode === 'BM25_ONLY') {
      const results = hybridRAG.retrieveBM25(q.query, '', 5);
      retrievedIds = results.map(r => r.chunk.chunk_id);
    } else if (mode === 'VECTOR_ONLY') {
      const results = await hybridRAG.retrieveVector(q.query, 5, 0.05);
      retrievedIds = results.results.map(r => r.chunk_id);
    } else {
      // Hybrid RRF
      const ctx = await hybridRAG.retrieveContextForControl(q.query_id, '', q.query, { topK: 5 });
      retrievedIds = ctx.chunks.map(c => c.chunk_id);
    }

    const lat = Date.now() - t0;
    latencies.push(lat);

    const expected = q.expected_chunk_ids || [];
    const hit1 = expected.includes(retrievedIds[0]);
    const hit3 = retrievedIds.slice(0, 3).some(id => expected.includes(id));
    const hit5 = retrievedIds.slice(0, 5).some(id => expected.includes(id));

    if (hit1) hits1++;
    if (hit3) hits3++;
    if (hit5) hits5++;

    // Reciprocal Rank @ 5
    let rr = 0;
    for (let i = 0; i < Math.min(5, retrievedIds.length); i++) {
      if (expected.includes(retrievedIds[i])) {
        rr = 1.0 / (i + 1);
        break;
      }
    }
    sumRR += rr;

    // Graded NDCG @ 5
    const grades = q.relevance_grades || {};
    // Ensure all expected chunks have at least grade 1 if unspecified
    const allExpectedGrades = expected.map(id => grades[id] ?? 1);
    const rankedGrades = retrievedIds.slice(0, 5).map(id => ({
      chunkId: id,
      grade: grades[id] ?? (expected.includes(id) ? 1 : 0),
    }));

    const dcg = computeDCG(rankedGrades);
    const idcg = computeIDCG(allExpectedGrades, 5);
    const ndcg = idcg > 0 ? dcg / idcg : 0;
    sumNDCG += ndcg;

    queryResults.push({
      id: q.query_id,
      query: q.query,
      topChunk: retrievedIds[0] || 'NONE',
      expected,
      hit1,
      hit5,
      rr,
      ndcg,
      latencyMs: lat,
    });
  }

  latencies.sort((a, b) => a - b);
  const total = dataset.queries.length;
  const meanLatency = Math.round(latencies.reduce((a, b) => a + b, 0) / total);
  const p95Index = Math.floor(total * 0.95);
  const p95Latency = latencies[p95Index] || latencies[latencies.length - 1];

  return {
    mode,
    totalQueries: total,
    hit1: Math.round((hits1 / total) * 1000) / 10,
    hit3: Math.round((hits3 / total) * 1000) / 10,
    hit5: Math.round((hits5 / total) * 1000) / 10,
    mrr5: Math.round((sumRR / total) * 1000) / 1000,
    ndcg5: Math.round((sumNDCG / total) * 1000) / 1000,
    meanLatencyMs: meanLatency,
    p95LatencyMs: p95Latency,
    latencies,
    queryResults,
  };
}

async function main() {
  const datasetPath = path.resolve(
    'C:/TF new V1/TrustForge/docs/research/evaluation/datasets/rag_retrieval_benchmark_v2_authoritative.json'
  );
  const dataset: BenchmarkDataset = JSON.parse(fs.readFileSync(datasetPath, 'utf-8'));

  console.log(`========================================================================`);
  console.log(`TrustForge RAG Retrieval Relevance Benchmark (Authoritative 45 Queries)`);
  console.log(`Corpus: 83 statutory chunks (DPDP Act 2023 & DPDP Rules 2025)`);
  console.log(`========================================================================\n`);

  console.log('--- Evaluating BM25-Only ---');
  const bm25Metrics = await evaluateMode(dataset, 'BM25_ONLY');

  console.log('--- Evaluating Vector-Only (pgvector via Supabase RPC) ---');
  const vectorMetrics = await evaluateMode(dataset, 'VECTOR_ONLY');

  console.log('--- Evaluating Hybrid RRF (BM25 + pgvector + RRF) ---');
  const hybridMetrics = await evaluateMode(dataset, 'HYBRID');

  console.log(`\n========================================================================`);
  console.log(`FINAL COMPARATIVE RETRIEVAL BENCHMARK RESULTS`);
  console.log(`========================================================================`);
  console.log(`Metric           | BM25-Only | Vector-Only | Hybrid RRF`);
  console.log(`-----------------+-----------+-------------+-----------`);
  console.log(`Hit@1 (%)        | ${bm25Metrics.hit1.toFixed(1).padStart(9)}% | ${vectorMetrics.hit1.toFixed(1).padStart(11)}% | ${hybridMetrics.hit1.toFixed(1).padStart(9)}%`);
  console.log(`Hit@3 (%)        | ${bm25Metrics.hit3.toFixed(1).padStart(9)}% | ${vectorMetrics.hit3.toFixed(1).padStart(11)}% | ${hybridMetrics.hit3.toFixed(1).padStart(9)}%`);
  console.log(`Hit@5 (%)        | ${bm25Metrics.hit5.toFixed(1).padStart(9)}% | ${vectorMetrics.hit5.toFixed(1).padStart(11)}% | ${hybridMetrics.hit5.toFixed(1).padStart(9)}%`);
  console.log(`MRR@5            | ${bm25Metrics.mrr5.toFixed(3).padStart(9)}  | ${vectorMetrics.mrr5.toFixed(3).padStart(11)}  | ${hybridMetrics.mrr5.toFixed(3).padStart(9)} `);
  console.log(`NDCG@5           | ${bm25Metrics.ndcg5.toFixed(3).padStart(9)}  | ${vectorMetrics.ndcg5.toFixed(3).padStart(11)}  | ${hybridMetrics.ndcg5.toFixed(3).padStart(9)} `);
  console.log(`Mean Latency     | ${(bm25Metrics.meanLatencyMs + 'ms').padStart(9)}  | ${(vectorMetrics.meanLatencyMs + 'ms').padStart(11)}  | ${(hybridMetrics.meanLatencyMs + 'ms').padStart(9)} `);
  console.log(`P95 Latency      | ${(bm25Metrics.p95LatencyMs + 'ms').padStart(9)}  | ${(vectorMetrics.p95LatencyMs + 'ms').padStart(11)}  | ${(hybridMetrics.p95LatencyMs + 'ms').padStart(9)} `);
  console.log(`========================================================================\n`);

  // Write results to JSON artifact for reproducibility
  const outPath = path.resolve('C:/TF new V1/TrustForge/docs/research/RETRIEVAL_BENCHMARK_RESULTS_RECORD.json');
  fs.writeFileSync(
    outPath,
    JSON.stringify(
      {
        benchmark_timestamp: new Date().toISOString(),
        dataset_version: dataset.version,
        corpus_chunks: hybridRAG.getCorpusSize(),
        results: {
          bm25: bm25Metrics,
          vector: vectorMetrics,
          hybrid: hybridMetrics,
        },
      },
      null,
      2
    )
  );
  console.log(`Results written to: ${outPath}`);
}

main().catch(console.error);
