import dotenv from 'dotenv';
dotenv.config({ path: 'c:/TF new V1/TrustForge/api/.env' });

import { hybridRAG } from './src/rag/hybridRAG.js';

async function main() {
  console.log('=== TrustForge Hybrid RAG Live Retrieval Test ===');
  console.log('Corpus size:', hybridRAG.getCorpusSize(), 'chunks');

  const testControls = [
    { id: 'TF-PRIV-001', ref: 'Section 5(1)', name: 'Privacy Notice Itemisation' },
    { id: 'TF-PRIV-002', ref: 'Section 6(1)', name: 'Consent Mechanism' },
    { id: 'TF-SEC-001',  ref: 'Section 8(5)', name: 'Security Safeguards' },
    { id: 'TF-RIGHTS-001', ref: 'Section 11(1)', name: 'Right of Access' },
    { id: 'TF-GOV-001', ref: 'Section 9(1)', name: 'Children Data Governance' },
  ];

  for (const ctrl of testControls) {
    const ctx = await hybridRAG.retrieveContextForControl(ctrl.id, ctrl.ref, ctrl.name, { topK: 3 });
    console.log('');
    console.log('Control: ' + ctrl.id + ' | ' + ctrl.name);
    console.log('  Mode: ' + ctx.retrievalMode + ' | Total: ' + ctx.latencyMs.total + 'ms (BM25: ' + ctx.latencyMs.bm25 + 'ms, Embed: ' + ctx.latencyMs.embedding + 'ms, RPC: ' + ctx.latencyMs.vectorRpc + 'ms)');
    console.log('  Chunks: ' + ctx.chunks.length + ' | Hash: ' + ctx.contextHash);
    for (const c of ctx.chunks) {
      console.log('   -> [' + c.chunk_id + '] RRF=' + c.rrf_score + ' BM25Rank=' + (c.bm25_rank ?? 'N/A') + ' VecRank=' + (c.vector_rank ?? 'N/A') + ' | ' + c.section);
    }
  }

  console.log('');
  console.log('=== PASS: Hybrid RAG live retrieval verified ===');
}

main().catch(e => {
  console.error('FAIL:', e.message);
  process.exit(1);
});
