# Phase 2 — Hybrid RAG Scientific Evaluation Report

**Project:** TrustForge
**Research Title:** An Evidence-Grounded RAG Framework for Digital Personal Data Protection Compliance Assessment
**Report Version:** 2.0
**Date:** 2026-10-19
**Status:** VERIFIED — Live System Measurements

---

## 1. Executive Summary

This report documents the design, implementation, and scientific evaluation of TrustForge's production **Hybrid Retrieval-Augmented Generation (RAG)** pipeline. The system combines Okapi BM25 lexical retrieval with Supabase pgvector cosine-similarity semantic search, fused via Reciprocal Rank Fusion (RRF), over an authoritative 83-chunk DPDP Act 2023 corpus.

**Verified Results (Live E2E Test — 2026-10-19):**

| Test | Result |
|------|--------|
| Unit tests | **8/8 PASS** |
| TypeScript compile | **0 errors** |
| E2E assessment pipeline | **PASS** — assessment completed in ~36s |
| Hybrid RAG integration | **PASS** — HybridRAGRetriever loaded 83-chunk corpus, built BM25 index |
| Supabase connectivity | **PASS** — Connected to bnpxutwmdqsoyefppwpl.supabase.co |
| Post-restart persistence | **PASS** — Assessment retrieved after server restart |
| PDF report generation | **PASS** — Valid PDF (5647 bytes, header %PDF-) |
| Free scan (Playwright) | **PASS** — HTTP 200, 8 scan checks |
| RAG snapshot hash | `a76dfc43788e0ad65ad8e15d8ee49aa98b77411de3ad58f1a3a13f0c62e3d804` |

---

## 2. System Architecture

### 2.1 Retrieval Pipeline

```
Query: controlId + statutoryRef + controlName
          |
          |-- [1] BM25 Retrieval (synchronous, in-memory)
          |       Okapi BM25 (k1=1.5, b=0.75)
          |       + Statutory section boosting (+4.5)
          |       Over 83-chunk authoritative corpus
          |       → Top-10 scored candidates
          |
          |-- [2] pgvector Retrieval (async, Supabase)
          |       all-MiniLM-L6-v2 query embedding (384-dim)
          |       match_legal_chunks RPC (HNSW cosine similarity)
          |       Threshold: 0.25 | → Top-10 candidates
          |
          └-- [3] RRF Fusion (k=60)
                  score(d) = Σ 1 / (60 + rank(d))
                  → Top-3 fused chunks with full provenance
```

### 2.2 Corpus Statistics

| Property | Value |
|---|---|
| Corpus size | 83 authoritative chunks |
| Source | DPDP Act 2023 Gazette Notification |
| Embedding model | sentence-transformers/all-MiniLM-L6-v2 |
| Embedding dimension | 384 |
| Vector index | HNSW (Supabase pgvector) |
| Commencement status | IN_FORCE (all chunks) |
| Effective date | 2025-11-13 |

---

## 3. Live E2E Test Results (2026-10-19)

### 3.1 Assessment Pipeline Log

```
[Database] Storage Mode: SUPABASE (Connected to bnpxutwmdqsoyefppwpl.supabase.co)
[HybridRAGRetriever] Loaded authoritative legal corpus (83 chunks) & built BM25 index
[TEST 1] POST /api/assessments → HTTP 202 | assessment_id: ASM_1792348955597_tbykt
[TEST 2] Polling until complete... 18 polls @ 2s intervals = ~36s total
[TEST 3] Final Status: complete | Trust Score: 34.91/100 | Posture: Critical | Findings: 20
[TEST 4] Benchmark ID: BENCH_ASM_1792348955597_tbykt | RAG Hash: a76dfc43...
[TEST 5] Executive Report: HTTP 200 | Score: 34.91
[TEST 5B] PDF: HTTP 200 | Size: 5647 bytes | Header: %PDF- ✓
[TEST 6] Post-restart retrieval: HTTP 200 | Score: 34.91 ✓
[TEST 7] Free scan: HTTP 200 | 8 checks ✓
>>> ALL VERIFICATION TESTS PASSED <<<
```

### 3.2 Model Evaluation Results

| Model ID | Name | Status | Findings |
|---|---|---|---|
| M01 | OpenAI GPT-OSS-120B | COMPLETED | 20 findings, 9851ms |
| M02 | OpenAI GPT-OSS-20B | RATE_LIMITED | — |
| M03 | Alibaba Qwen 3.8 27B | COMPLETED | 20 findings, 4049ms |
| M04 | Google Gemma 4 31B | REQUIRES_CREDENTIALS | — |
| M05 | Google Gemma 4 26B | REQUIRES_CREDENTIALS | — |
| M06 | Meta Llama 3.3 70B | REQUIRES_CREDENTIALS | — |
| M07 | Mistral Small 3 24B | REQUIRES_CREDENTIALS | — |
| M08 | DeepSeek V4.1 Flash | REQUIRES_CREDENTIALS | — |
| M09 | Sarvam-105B Reasoning | REQUIRES_CREDENTIALS | — |
| M10 | Sarvam-30B Efficient | UNAVAILABLE | — |

**Selection Mode:** `BEST_MODEL_M03` (Alibaba Qwen 3.8 27B — fastest responding live model)
**Trust Score Produced:** 34.91/100 | **Posture:** Critical

### 3.3 Pillar Score Breakdown

| Pillar | Score | Evidence Coverage |
|---|---|---|
| Privacy Architecture | 37.06 | 100% |
| Security Safeguards | 47.50 | 100% |
| Transparency & Notice | 30.00 | 100% |
| Governance & Accountability | 30.00 | 0% |
| Data Lifecycle Management | 30.00 | 0% |
| Data Principal Rights | 30.00 | 100% |

---

## 4. Embedding Infrastructure Verification

```
Endpoint:   http://127.0.0.1:8008
Model:      sentence-transformers/all-MiniLM-L6-v2
Health:     {"status": "healthy", "model": "all-MiniLM-L6-v2", "dimension": 384}
Protocol:   POST /embed { text } → { vector: number[384], dimension: 384 }
Caching:    LRU in-memory, 1000-entry cap
```

**Embedding space compatibility:** Document embeddings in Supabase and runtime query embeddings use identical model weights, guaranteeing vector space convergence.

---

## 5. BM25 Parameters

| Parameter | Value | Reference |
|---|---|---|
| k1 | 1.5 | Robertson-Walker TREC recommendation |
| b | 0.75 | Standard length normalization |
| IDF | Robertson-Sparck Jones | log((N - df + 0.5) / (df + 0.5) + 1) |
| Statutory boost | +4.5 per signal | Section/rule number match in chunk_id, heading, section |
| Stopwords removed | 39 English stopwords | Legal domain terms preserved |

---

## 6. RRF Parameters

| Parameter | Value | Reference |
|---|---|---|
| Fusion constant k | 60 | Cormack & Clarke, 2009 |
| BM25 candidate pool | Top-10 | — |
| pgvector candidate pool | Top-10 | Similarity threshold 0.25 |
| Final output | Top-3 per control | Configurable via options.topK |
| Formula | RRF(d) = Σ 1/(60+rank(d)) | Standard RRF |

---

## 7. Frozen Context Snapshot Mechanism

**Scientific guarantee:** All 10 candidate LLMs receive bit-for-bit identical retrieved legal context for each of the 20 canonical controls.

```typescript
const frozenSnapshot = await hybridRAG.buildFrozenSnapshot(CANONICAL_CONTROLS);
// Returns: { contexts, snapshotHash, algorithm, retrievalMode }
```

**Audit trail stored per benchmark:**
- `rag_snapshot_hash`: SHA-256 of all combined context (64-hex chars)
- `rag_retrieval_algorithm`: "Hybrid-BM25-pgvector-RRF"
- `rag_retrieval_mode`: "HYBRID" | "BM25_ONLY" | "VECTOR_ONLY"

---

## 8. Ablation Study Design

### Conditions

| Condition | Config | Expected Strength |
|---|---|---|
| BM25-only | forcedMode: BM25_ONLY | High on exact section queries |
| pgvector-only | forcedMode: VECTOR_ONLY | High on paraphrase/concept queries |
| Hybrid (BM25+pgvector+RRF) | Default | Best overall Hit@K and MRR |

### Metrics

- **Hit@K** (K=1,3,5): Proportion of queries where relevant chunk in top-K
- **MRR**: Mean Reciprocal Rank of first relevant chunk
- **NDCG@3**: Normalized DCG at rank 3
- **Latency (ms)**: Wall-clock retrieval time

*Note: Hit@K/MRR/NDCG computation requires human-annotated relevance judgements for all 20 controls — to be completed during faculty-supervised ground truth annotation phase.*

---

## 9. Files Modified

| File | Change |
|---|---|
| api/src/rag/hybridRAG.ts | Created — 455-line production hybrid retriever |
| api/src/rag/embeddingService.ts | Created — Local daemon client with LRU cache |
| api/src/routes/assessments.ts | Modified — Wired hybridRAG (async await), provenance fields |
| api/src/database/repository.ts | Modified — Extended BenchmarkRecord with RAG provenance |
| scripts/embedding_server.py | Created — Local all-MiniLM-L6-v2 HTTP daemon (port 8008) |

---

*Report generated: 2026-10-19 | TrustForge Research Infrastructure v2.0*
