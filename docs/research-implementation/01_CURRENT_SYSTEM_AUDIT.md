# TrustForge — Phase 1: Current System Architecture & Codebase Audit

**Document Reference:** `docs/research-implementation/01_CURRENT_SYSTEM_AUDIT.md`  
**Audit Date:** October 28, 2026  
**Repository Location:** `C:\TF new V1\TrustForge`  
**Active Git Branch:** `research/ten-llm-rag-benchmark`  
**Audit Role:** Senior Full-Stack Engineer, AI/RAG Architect, Cybersecurity Researcher, and QA Engineer  
**Faculty Reference:** Dr. Neelam Naik ("Research method-given to Mannan.docx" / Research Methodology)

---

## Executive Summary

TrustForge is an evidence-grounded compliance assessment and benchmarking platform designed to evaluate websites against the **Digital Personal Data Protection (DPDP) Act, 2023** and **DPDP Rules, 2025**. 

This audit establishes the baseline technical reality of the existing codebase prior to Phase 2 implementation. The audit reveals an advanced, dual-runtime architecture consisting of:
1. **A modern TypeScript / React 19 Frontend** (Vite + Tailwind CSS), featuring interactive public scanning, an authenticated compliance wizard, live 6-pillar posture visualization, multi-LLM benchmark comparison dashboards, and native PDF/CSV reporting.
2. **A production Node.js / Express 4.21 API** (`api/`), functioning as the primary cloud orchestrator (configured for Render deployment, Supabase PostgreSQL with `pgvector`, Playwright Chromium crawler, SSRF guard, hybrid BM25 + vector RRF retrieval, and concurrent 10-LLM gateway).
3. **A companion Python 3.13 FastAPI Backend** (`backend/`), which houses the original research baseline (SQLite / FAISS retriever, deterministic trust scoring baseline, and synthetic test suites).
4. **An authoritative 83-chunk DPDP legal corpus** (`backend/knowledge/authoritative_corpus.json`), indexing all 44 sections of the DPDP Act 2023 and 17 notified rules of the DPDP Rules 2025.

All unit tests in both runtimes pass cleanly (Node: 8/8 pass; Python: 29 pass, 1 skipped). Both frontend and API build with zero errors.

---

## 1. Git Repository & Working Tree Status

- **Current Branch:** `research/ten-llm-rag-benchmark`
- **Working Tree State:** The working directory contains unstaged modifications and untracked research assets from recent evaluation sprints.
- **Unstaged Modified Files:**
  - `TrustForge Frontend/src/components/common/Badge.tsx`
  - `TrustForge Frontend/src/pages/app/AssessmentPage.tsx`
  - `TrustForge Frontend/src/pages/app/ModelBenchmarkPage.tsx`
  - `TrustForge Frontend/src/pages/app/ReportsPage.tsx`
  - `TrustForge Frontend/src/services/api.ts`
  - `TrustForge Frontend/src/services/index.ts`
  - `api/src/database/supabaseClient.ts`
  - `api/src/gateway/llmGateway.ts`
  - `api/src/index.ts`
  - `api/src/routes/assessments.ts`
  - `api/src/routes/benchmark.ts`
  - `api/src/routes/findings.ts`
  - `api/src/routes/health.ts`
  - `api/src/routes/reports.ts`
  - `api/src/routes/scans.ts`
  - `api/src/routes/trustScore.ts`
  - `api/src/scoring/trustScoreEngine.ts`
  - `api/src/tests/unit.test.ts`
  - `api/src/types/index.ts`
  - `backend/tests/unit/test_api_endpoints_full.py`
- **Untracked Additions:**
  - Evaluation scripts: `api/scratch_eval_all20.ts`, `api/scratch_test_models.ts`, `api/test_ground_truth_benchmark.ts`, `api/test_e2e_assessment.ts`
  - Ground-truth datasets: `docs/research/evaluation/datasets/dpdp_obligation_ground_truth_v1.json` (60 cases across 20 canonical controls)
  - Research documentation: 24 comprehensive markdown files under `docs/research/`
- **Security Check:** Zero API keys, passwords, or cloud credentials are hardcoded in tracked files. All secrets are loaded through environment variables (`.env`, `.env.example`).

---

## 2. Active Frontend Entry Point & Routing

- **Directory:** `C:\TF new V1\TrustForge\TrustForge Frontend`
- **Framework:** React 19.0.0, Vite 8.2.2, TypeScript 5.8.2, Tailwind CSS 3.4.17
- **Build Status:** Verified passing (`tsc -b && vite build` completed in 932ms, 0 errors).
- **Entry Points:** `src/main.tsx` mounts `src/AppRouter.tsx` with `BrowserRouter`.
- **Active Routes:**
  - **Public Routes:**
    - `/` — Landing page with hero, compliance overview, and interactive feature highlights.
    - `/scan` — Public lightweight website scanner.
    - `/login`, `/signup`, `/onboarding` — User authentication and organization onboarding.
  - **Authenticated Workspace Routes (`/app/*` via `AppLayout`):**
    - `/dashboard` — Executive compliance overview, 6-pillar radar/bar charts, high-priority gaps.
    - `/assessment` — Multi-step wizard capturing fiduciary operations (data categories, purposes, notice languages, DPO, breach notification, retention).
    - `/trust-score` — Deep dive into deterministic Trust Score, pillar breakdown, and formula transparency.
    - `/website-scan` — Dynamic Playwright crawler invocation, live telemetry, and technical header checks.
    - `/findings` — Detailed compliance findings table with statutory citations, evidence provenance, and severity.
    - `/evidence` — Evidence repository showing raw crawl items, self-reported declarations, and confidence scores.
    - `/remediation` — Step-by-step remediation plans with statutory references and implementation priorities.
    - `/reports` — PDF executive summary download, CSV export, and audit log generation.
    - `/benchmark` — Research dashboard displaying 10-model evaluation matrix, consensus scores, latency, and grounding rates.
    - `/rights` — Data principal rights management workflow (access, correction, erasure, grievance).
    - `/settings` — Organization profile, API configurations, and member management.
  - **Admin Routes (`/admin/*` via `AdminLayout`):**
    - 14 management views including `/admin/overview`, `/admin/assessments`, `/admin/findings`, `/admin/rules`, `/admin/system`, and `/admin/audit`.

---

## 3. Express API Gateway & Orchestrator

- **Directory:** `C:\TF new V1\TrustForge\api`
- **Runtime:** Node.js (v22+) with TypeScript (`tsx` for dev, `tsc` for production build).
- **Entry Point:** `src/index.ts` listening on `PORT` (default 8000).
- **Compilation Status:** Verified passing (`tsc` completed with 0 errors).
- **Active Endpoints:**
  | HTTP Method | Route | Handler Module | Purpose |
  |---|---|---|---|
  | `GET` | `/api/health` | `src/routes/health.ts` | Service health, Supabase connection, and model readiness status |
  | `POST` | `/api/scans` | `src/routes/scans.ts` | Triggers Playwright crawler on public website URL |
  | `GET` | `/api/scans/:id` | `src/routes/scans.ts` | Fetches scan results, discovered trackers, and security headers |
  | `POST` | `/api/assessments` | `src/routes/assessments.ts` | Initiates asynchronous end-to-end DPDP assessment |
  | `GET` | `/api/assessments/:id` | `src/routes/assessments.ts` | Polls assessment status, progress percentage, and step |
  | `GET` | `/api/assessments/:id/results` | `src/routes/assessments.ts` | Retrieves final model consensus, Trust Score, and findings |
  | `GET` | `/api/benchmark/models` | `src/routes/benchmark.ts` | Returns 10-model metadata, operational status, and benchmark summary |
  | `POST` | `/api/benchmark/evaluate` | `src/routes/benchmark.ts` | Runs parallel multi-model evaluation against custom evidence |
  | `GET` | `/api/findings` | `src/routes/findings.ts` | Retrieves validated findings filtered by assessment or control |
  | `GET` | `/api/trust-score/:id` | `src/routes/trustScore.ts` | Computes deterministic Trust Score from raw finding inputs |
  | `GET` | `/api/reports/:id/pdf` | `src/routes/reports.ts` | Generates native PDF audit report with `%PDF-` structure |
  | `POST` | `/api/rag/query` | `src/routes/rag.ts` | Tests hybrid BM25 + pgvector legal retrieval directly |
- **Middleware:** `src/middleware/authMiddleware.ts` enforces multi-tenant organization isolation (`x-org-id`, Bearer token) and role verification.

---

## 4. Companion Python FastAPI Research Backend

- **Directory:** `C:\TF new V1\TrustForge\backend`
- **Runtime:** Python 3.13 (`uvicorn main:app --reload --port 8000`)
- **Key Modules:**
  - `compliance/controls.py`: Defines 20 compliance controls grouped into 6 pillars.
  - `compliance/trust_score.py`: Python implementation of deterministic trust scoring.
  - `compliance/tie_evaluator.py`: Rule-based deterministic assessment engine.
  - `rag/retriever.py`: FAISS-based vector search and BM25 baseline.
  - `scanner/engine.py`: Lightweight HTTP/HTML crawler (httpx + BeautifulSoup).
  - `core/database.py`: SQLite persistence (`trustforge.db`).
- **Test Status:** Verified passing (`pytest` completed: 29 passed, 1 skipped).

---

## 5. Website Crawler Implementations

The project contains two distinct crawlers:

1. **Production Playwright Chromium Crawler (`api/src/crawler/playwrightCrawler.ts`):**
   - Headless Chromium browser automation.
   - Enforces SSRF defense via `ssrfGuard.ts` (resolves DNS, rejects IPv4/IPv6 private ranges `127.0.0.0/8`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, AWS metadata `169.254.169.254`, and non-HTTP protocols).
   - Real-time network request interception detecting 10+ tracking domains (`google-analytics.com`, `googletagmanager.com`, `doubleclick.net`, `facebook.net`, `hotjar.com`, `clarity.ms`, etc.).
   - Header inspection: TLS protocol, HSTS (`Strict-Transport-Security`), CSP (`Content-Security-Policy`), `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`.
   - Cookie security analysis: inspects `Secure`, `HttpOnly`, and `SameSite` flags.
   - Page DOM inspection: searches for cookie consent banners, CMP indicators, privacy policy hyperlinks in navigation/footers, and extracts policy text snippet.
   - Normalizes raw signals into structured `EvidenceItem` records.

2. **Python Lightweight Scanner (`backend/scanner/engine.py`):**
   - Asynchronous HTTP crawler based on `httpx` and `BeautifulSoup`.
   - Used for quick headless checks without browser rendering overhead.

---

## 6. DPDP Legal Corpus & Storage

- **Corpus Location:** `backend/knowledge/authoritative_corpus.json`
- **Total Chunks:** Exactly **83 statutory chunks**.
  - **DPDP Act 2023:** 44 sections, Preamble, and Schedule of Penalties.
  - **DPDP Rules 2025:** 17 notified procedural rules.
- **Chunk Metadata Schema:** Each chunk currently contains 15 fields:
  `chunk_id`, `document_id`, `document_title`, `authority`, `source_type`, `section`, `heading`, `subsection`, `commencement_status`, `effective_date`, `enforceability`, `text`, `source_url`, `publication_date`, `version`.
- **Vector Storage:**
  - Supabase PostgreSQL with `pgvector` extension (`bnpxutwmdqsoyefppwpl.supabase.co`).
  - Table: `dpdp_chunks` with 384-dimensional vector column (`embedding`).
  - Embeddings generated via HuggingFace `all-MiniLM-L6-v2`.

---

## 7. Hybrid RAG Retrieval Pipeline

- **File:** `api/src/rag/hybridRAG.ts`
- **Retrieval Architecture:**
  1. **Lexical Retrieval:** Custom in-memory Okapi BM25 implementation indexing all 83 statutory chunks with domain-specific tokenization and stopword filtering.
  2. **Dense Semantic Retrieval:** Supabase PostgreSQL `pgvector` RPC (`match_dpdp_chunks`) calculating cosine similarity ($1 - \text{cosine\_distance}$).
  3. **Reciprocal Rank Fusion (RRF):**
     $$\text{RRF}(d) = \sum_{r \in \{\text{BM25}, \text{dense}\}} \frac{1}{k_{\text{rrf}} + \text{rank}_r(d)}, \quad k_{\text{rrf}} = 60$$
  4. **Non-Normative Dampening:** Sections 40 (Rule-making power), 44 (Repeal and savings / embedded penalty schedule), and administrative recitals receive dampening factors ($0.35\times$) to prevent procedural chunks from crowding out substantive obligations.
- **Empirical Retrieval Performance (Evaluated across 45 canonical queries):**
  - Hit@1: 57.8%
  - Hit@3: 68.9%
  - **Hit@5: 84.4%**
  - MRR@5: 0.656
  - NDCG@5: 0.653
  - Mean Latency: 512 ms

---

## 8. LLM Gateway & 10-Model Registry

- **File:** `api/src/gateway/llmGateway.ts`
- **Model Slots & Current Operational State:**
  | Slot | Model Name | Architecture | Target Provider | Operational Status | Verified Active? |
  |---|---|---|---|---|---|
  | **M01** | OpenAI GPT-OSS-120B | 117B MoE / 5.1B active | Groq LPU | `SUCCESS` | **YES (Live)** |
  | **M02** | OpenAI GPT-OSS-20B | 21B MoE / 3.6B active | Groq LPU | `SUCCESS` | **YES (Live)** |
  | **M03** | Alibaba Qwen 3.8 27B | 27B Dense | Groq LPU | `SUCCESS` | **YES (Live)** |
  | **M04** | Google Gemma 4 31B-IT | 30.7B Dense | OpenRouter | `AUTH_REQUIRED` | Awaiting key |
  | **M05** | Google Gemma 4 26B-A4B | 25.2B MoE / 4.0B active | OpenRouter | `AUTH_REQUIRED` | Awaiting key |
  | **M06** | Meta Llama 3.3 70B Instruct | 70B Dense | OpenRouter | `AUTH_REQUIRED` | Awaiting key |
  | **M07** | Mistral Small 3 24B Instruct | 24B Dense | OpenRouter | `AUTH_REQUIRED` | Awaiting key |
  | **M08** | DeepSeek V4.1 Flash | ~60B MoE / ~16B active | OpenRouter | `AUTH_REQUIRED` | Awaiting key |
  | **M09** | Sarvam-105B Reasoning | 106B MoE / 10.3B active | Sarvam AI API | `AUTH_REQUIRED` | Awaiting key |
  | **M10** | Sarvam-30B Efficient | 32B MoE / 2.4B active | Local Weights | `UNAVAILABLE` | Weights required |
- **Orchestration:** `evaluateAllModelsBatch` executes concurrent calls using `Promise.allSettled`, achieving a measured 2.48x concurrency wall-clock speedup.

---

## 9. Grounding Validation Implementation

- **File:** `api/src/validator/groundingValidator.ts`
- **Validation Mechanics:**
  1. **Statutory Provision Check:** Verifies that the cited section/rule actually exists in the authoritative DPDP corpus.
  2. **Verbatim Quote Check:** Performs fuzzy substring matching ($\ge 80\%$ token overlap) against the Gazette text of the cited provision.
  3. **Evidence ID Check:** Verifies that cited evidence IDs (`EVID_...`) exist in the captured crawl or questionnaire evidence set.
  4. **Grounding Score:** Calculates ratio of valid assertions to total assertions $[0, 1]$.
- **Current Limitation:** When a finding fails grounding validation, `f.is_grounded` is set to `false`, but the verdict is **not** currently rewritten to `Not determinable` / dropped from scoring. This is a critical gap against faculty Step 5.

---

## 10. Existing Trust Score Engine

- **File:** `api/src/scoring/trustScoreEngine.ts`
- **Taxonomy:** 6 pillars, 20 canonical controls (`TF-PRIV-001` through `TF-RIGHTS-003`).
- **Pillars & Weights:**
  - Privacy Architecture (0.20)
  - Security Safeguards (0.20)
  - Transparency & Notice (0.15)
  - Governance & Accountability (0.15)
  - Data Lifecycle Management (0.15)
  - Data Principal Rights (0.15)
- **Outcome Multipliers:**
  - `SUPPORTED` / `PASS`: 1.0
  - `PARTIALLY_SUPPORTED` / `POTENTIAL_GAP`: 0.5
  - `INSUFFICIENT_EVIDENCE` / `UNKNOWN`: 0.3
  - `NOT_SUPPORTED` / `FAIL`: 0.0
  - `NOT_APPLICABLE`: -1.0 (excluded from denominator)
- **Aggregation:** Two-tier hierarchical weighted average with denominator renormalization.
- **Consensus:** Top-3 Majority Voting across verified models.
- **Contrast with Faculty:** The faculty methodology mandates a 10-category obligation taxonomy (C1–C10), outcome scores $\{1, 0.5, 0\}$, zero weight for `Not determinable`, two explicit weighting schemes (W1 penalty-proportional and W2 equal/AHP), and a critical-failure scoring cap ($\min(TS, 40)$).

---

## 11. Database & Persistence Architecture

- **Supabase PostgreSQL:** Cloud database storing assessments, scan records, findings, model benchmark runs, and 83 vector embeddings.
- **Local Durable Store (`api/src/database/durableStore.ts`):** Write-through disk cache (`api/data/store.json`) ensuring 100% data durability and instant recovery across process restarts if the network is interrupted.
- **SQLite Database (`backend/trustforge.db`):** 1.7 MB database containing historical scan results, assessment runs, and control definitions for the Python backend.

---

## 12. Automated Test & Build Verification

All builds and tests were executed in clean read-only audit mode:

```bash
# 1. API TypeScript Build
npm run build (in api/) -> Exit Code 0 (tsc clean, 0 errors)

# 2. API Test Suite
npm test (in api/) -> Exit Code 0 (8 passed, 0 failed, 3272ms)
  ✔ SSRF Guard: Rejects loopback, private IPs, and cloud metadata
  ✔ SSRF Guard: Permits valid public domain
  ✔ Trust Score Engine: All-PASS produces 100 score
  ✔ Trust Score Engine: All-FAIL produces 0 score
  ✔ Trust Score Engine: All NOT_APPLICABLE produces Not Scorable
  ✔ Top-3 Majority Voting Consensus
  ✔ Grounding Validator: Rejects hallucinated legal clause
  ✔ Trust Score Engine: Pillar scores include canonical names, aliases, evidence coverage

# 3. Frontend Build
npm run build (in TrustForge Frontend/) -> Exit Code 0 (vite build in 932ms, 0 errors)

# 4. Backend Python Tests
pytest (in backend/) -> Exit Code 0 (29 passed, 1 skipped in 3.00s)
  tests/unit/test_citation_grounding.py: 14 passed
  tests/unit/test_trust_score_determinism.py: 15 passed
```

---

## 13. Codebase Cleanliness & Module Health

| Module | Health Status | Assessment |
|---|---|---|
| `TrustForge Frontend/` | **Excellent** | Clean component hierarchy, unified theme, functional layouts, production-ready routing. |
| `api/src/crawler/` | **Excellent** | Robust Playwright crawler with strict SSRF defense. |
| `api/src/rag/` | **Strong** | High-performance hybrid RRF retriever. Needs top-5 default and C1-C10 metadata. |
| `api/src/gateway/` | **Strong** | Parallel dispatch operational. Honest handling of unauthenticated model slots. |
| `api/src/scoring/` | **Functional (Needs Alignment)** | Operates on 6-pillar 20-control schema. Needs Phase 2 upgrade to C1–C10 engine. |
| `api/src/validator/` | **Functional (Needs Enforcement)** | Checks quotes and sections. Must enforce verdict dropping to `Not determinable`. |
| `backend/` | **Baseline Functional** | Fully passing test suite. Serves as secondary validation reference. |
| `docs/research/` | **Comprehensive** | Exhaustive documentation of empirical benchmarks and security audits. |

Audit concluded cleanly. Zero source files modified.
