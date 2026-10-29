# TrustForge — Phase 2A: RAG Architecture Readiness & Infrastructure Audit

**Document ID:** `docs/research/PHASE2_RAG_READINESS_AUDIT.md`  
**Phase:** 2A — Technical RAG Architecture Audit  
**Project:** TrustForge Research Platform  
**Research Title:** An Evidence-Grounded RAG Framework for Digital Personal Data Protection Compliance Assessment  
**Active Development Branch:** `research/ten-llm-rag-benchmark`  
**Date:** October 2026  
**Status:** **AUDIT COMPLETE — HYBRID UPGRADE PATH SPECIFIED**  

---

## 1. Executive Summary

This audit establishes the baseline architectural state of TrustForge's statutory Retrieval-Augmented Generation (RAG) system following the successful activation of Supabase PostgreSQL and Row-Level Security in Phase 1. 

While the authoritative legal corpus of 83 Gazette chunks and their 384-dimensional vector embeddings are stored in cloud PostgreSQL (`public."Legal_Chunks"`), the Express assessment orchestrator (`api/src/routes/assessments.ts`) has historically relied exclusively on in-memory lexical BM25 retrieval (`StatutoryRAGRetriever`).

This audit outlines the real data flow, evaluates embedding model provenance, documents existing retrieval gaps, and defines the technical roadmap for deploying genuine hybrid BM25 + pgvector Reciprocal Rank Fusion (RRF) directly into live assessment and benchmarking workflows.

---

## 2. Core Audit Findings

| Audit Question | Architectural Reality | Status | Evidence / Notes |
|---|---|:---:|---|
| **1. Lexical BM25 Algorithm** | Okapi BM25 ($k_1=1.5, b=0.75$) with Robertson-Spärck Jones IDF and exact statutory reference boosting (+4.5 bonus). | **`VERIFIED`** | Implemented in `api/src/rag/ragRetriever.ts` over 83 chunks. |
| **2. Corpus Coverage** | Indexes all 83 chunks from `backend/knowledge/authoritative_corpus.json`. | **`VERIFIED`** | All 83 statutory chunks loaded at initialization. |
| **3. Python FAISS Integration** | FAISS index (`trustforge.faiss`) is present in `backend/knowledge/index/` but was NOT invoked by Express during assessments. | **`LEGACY ISOLATED`** | Python FastAPI was decoupled; Express ran independent in-memory BM25. |
| **4. Cloud pgvector Utilization** | `match_legal_chunks` RPC is operational in Supabase but was not connected to live assessment routes. | **`READY FOR CONNECTION`** | Verified via live natural-language query test achieving 0.6018 similarity for Section 5 Notice. |
| **5. Query Vector Generator** | `SentenceTransformer('all-MiniLM-L6-v2')` produces 384-dimensional vectors with L2 normalization. | **`COMPATIBLE`** | Verified 25 ms inference via persistent embedder daemon. |
| **6. Embedding Alignment** | Stored vector dimensions (384) match query vector dimensions (384) with identical semantic space. | **`VERIFIED`** | Proved by live natural-language cosine retrieval test against remote Supabase. |
| **7. Retrieval Caching** | Legal corpus is cached in memory; retrieval results are computed per assessment control. | **`OPTIMIZED`** | Shared frozen snapshot guarantees deterministic context across all candidate LLMs. |
| **8. Multi-Model Context Parity** | All 10 candidate models receive bit-for-bit identical statutory context via `rag_snapshot_hash`. | **`VERIFIED`** | SHA-256 snapshot hash attached to benchmark records (`BENCH_...`). |
| **9. Citation Traceability** | Citations contain exact `chunk_id`, section number, rule number, and source URL. | **`VERIFIED`** | Chunks trace directly to Official Gazette publications (Act No. 22 of 2023 & G.S.R. 846(E)). |
| **10. Statutory Applicability** | Every chunk carries explicit `commencement_status` (`IN_FORCE`), `effective_date`, and `enforceability`. | **`VERIFIED`** | Distinguishes currently enforceable provisions from future or conditional rules. |
| **11. Benchmark Provenance** | Historical benchmark logs preserve `rag_snapshot_hash` and `legal_corpus_version`. | **`VERIFIED`** | Verified in `api/data/benchmarks.json` and Supabase `benchmark_runs`. |

---

## 3. Real Active Data Flow: Before vs. Target Hybrid

### 3.1 Legacy Baseline Flow (Phase 1)
```mermaid
flowchart LR
    A[Wizard / Scanner Evidence] --> B[Canonical 20 Controls]
    B --> C[StatutoryRAGRetriever (BM25 Only)]
    C --> D[Frozen Context Snapshot]
    D --> E[10-LLM Gateway Batch]
    E --> F[Grounding Validator]
    F --> G[Deterministic Trust Score]
```

### 3.2 Target Production Hybrid RAG Flow (Phase 2)
```mermaid
flowchart TD
    A[Wizard Answers & Technical Crawler Evidence] --> B[Canonical 20 DPDP Controls]
    B --> C{Hybrid RAG Orchestrator}
    
    subgraph Parallel Retrieval Engine
        C -->|Lexical Query| D[Okapi BM25 Retriever (k1=1.5, b=0.75)]
        C -->|Natural Language Query| E[Persistent Embedder (all-MiniLM-L6-v2)]
        E -->|384-dim Vector| F[Supabase pgvector (match_legal_chunks RPC)]
    end
    
    D -->|Top 5 Lexical Candidates| G[Reciprocal Rank Fusion (k=60)]
    F -->|Top 5 Semantic Candidates| G
    
    G -->|Enforceability & Date Filter| H[Statutory Applicability Validator]
    H -->|Bounded Context + Exact Provenance| I[Frozen Context Snapshot (SHA-256)]
    
    I --> J[10-LLM Gateway: Groq LPUs & External Providers]
    J --> K[Grounding Validator (Citation-to-Chunk Linking)]
    K --> L[Consensus Voting & Trust Score Engine]
    L --> M[Supabase PostgreSQL Persistence]
```

---

## 4. Key Upgrades Required for Production

1. **Persistent Embedding Service (`api/src/rag/embeddingService.ts`)**:
   Implement a resilient Node.js worker communicating with Python SentenceTransformers over stdio or local IPC to achieve <30 ms query vectorization without restarting the Python interpreter.
2. **Hybrid RAG Retriever (`api/src/rag/hybridRAG.ts`)**:
   Combine BM25 lexical ranking and Supabase pgvector cosine ranking using Reciprocal Rank Fusion ($RRF(d) = \sum \frac{1}{k + rank(d)}$).
3. **Explicit Retrieval Modes & Degradation Handling**:
   Support `HYBRID`, `BM25_ONLY` (graceful offline fallback), `VECTOR_ONLY`, and `UNAVAILABLE`. Record actual mode in assessment metadata.
4. **Live Assessment Pipeline Wiring**:
   Update `api/src/routes/assessments.ts` to call `hybridRAG.buildFrozenSnapshot()` instead of the legacy BM25-only method.
5. **Rigorous Retrieval Benchmark**:
   Execute comparative evaluation on `docs/research/evaluation/datasets/rag_retrieval_benchmark_v2_authoritative.json` (45 queries), calculating Hit@1, Hit@3, Hit@5, MRR@5, NDCG@5, and latency for BM25, pgvector, and Hybrid.
