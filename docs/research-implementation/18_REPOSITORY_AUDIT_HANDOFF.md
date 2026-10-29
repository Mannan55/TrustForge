# TrustForge: Repository Reliability Audit Handoff Report

**Project:** TrustForge — Evidence-Grounded RAG Framework for DPDP Compliance Assessment  
**Faculty Supervisor:** Dr. Neelam Naik  
**Research Reference:** *An Evidence-Grounded RAG Framework for Digital Personal Data Protection Compliance Assessment*  
**Date:** 2026-10-29  
**Repository Remote:** `https://github.com/Mannan55/TrustForge`  
**Published Audit Branch:** `audit/reliability-baseline-2026-10-29`  
**Baseline Commit:** `d1d10e121c874e1bbf9a10d2bc7492f845154246` (Initial commit) / amended baseline  

---

## 1. Executive Summary & Audit Baseline Objective

This document serves as the formal handoff specification for an independent, repository-based reliability audit of TrustForge. All working code across Phases 1–7 and the critical reliability repairs (which resolved the `0 / Not Scorable` assessment defect) are included in this published baseline.

Every link in the evidence-grounded compliance pipeline—from crawler and wizard ingestion to frozen legal RAG retrieval, multi-model LLM evaluation, grounding verification, and TOPSIS consensus scoring—is complete, executable, and backed by verifiable automated tests.

---

## 2. Repository Structure & Subsystem Responsibilities

```
TrustForge/
├── api/                           # Node.js / Express Research Orchestrator & LLM Gateway
│   ├── src/
│   │   ├── crawler/               # Playwright crawler & SSRF security guard
│   │   ├── database/              # Supabase PostgreSQL client & local durable store
│   │   ├── evaluation/            # F1 score evaluator & expert ground truth dataset
│   │   ├── gateway/               # 10-model LLM Gateway with bounded parallel dispatch
│   │   ├── middleware/            # Multi-tenant auth, RBAC, and IDOR protection
│   │   ├── rag/                   # Hybrid RAG retriever (BM25 + Dense Vector + RRF)
│   │   ├── research/              # TOPSIS multi-criteria optimization engine
│   │   ├── routes/                # Express API endpoints (/assessments, /benchmark, etc.)
│   │   ├── scoring/               # C1–C10 Trust Score engine, W1/W2 weights, 6-pillar adapter
│   │   ├── tests/                 # 133 automated unit, integration, and scenario tests
│   │   ├── types/                 # Canonical TypeScript data contracts
│   │   └── validator/             # Strict Grounding Validator (statutory & evidence quotes)
│   └── .env.example               # Clean environment configuration template
├── backend/                       # Python / FastAPI Research Backend
│   ├── api/                       # FastAPI router endpoints
│   ├── compliance/                # Reference compliance rules
│   ├── core/                      # Fast embedder & RAG engine
│   ├── knowledge/                 # Official 83-chunk DPDP statutory corpus
│   ├── scanner/                   # Auxiliary heuristic scanner
│   ├── tests/                     # 30 Pytest unit & determinism tests
│   └── requirements.txt           # Python dependencies
├── database/                      # SQL Database Schemas & Migrations
│   └── migrations/                # Clean install & comprehensive schema with pgvector
├── docs/                          # Academic & Technical Documentation
│   ├── evaluation/                # Human annotation workbook & guidelines
│   ├── research/                  # Architectural specs, provider verifications, demo guides
│   └── research-implementation/   # Phase 1 through Phase 7 research reports & audit handoffs
├── scripts/                       # Local embedder daemon & research publication builders
├── TrustDocumentation/            # Architecture diagrams, screenshots, and thesis drafts
└── TrustForge Frontend/           # React 19 / TypeScript / Vite / Tailwind UI Dashboard
    ├── src/
    │   ├── components/            # Reusable UI widgets, ScoreRing, cards, badges
    │   ├── context/               # Multi-tenant organization and toast state
    │   ├── data/                  # Canonical controls, mock fallbacks, demo personas
    │   ├── pages/app/             # Assessment wizard, 10-LLM benchmark, RAG monitor, reports
    │   └── services/              # API client contracts and durable session storage
    └── package.json               # Frontend dependencies
```

---

## 3. Environment Setup & Runtime Requirements

### 3.1 Supported Runtimes
- **Node.js:** `v22.x` or `v24.x` (LTS recommended; tested with Node.js `v24.14.1`)
- **Python:** `3.11.x` – `3.13.x` (tested with Python `3.13.15`)
- **Package Managers:** `npm` (v10+ / v11+) and `pip`

### 3.2 Dependency Installation

```powershell
# 1. Clone repository and checkout the audit branch
git clone https://github.com/Mannan55/TrustForge.git
cd TrustForge
git checkout audit/reliability-baseline-2026-10-29

# 2. Install Express API dependencies & build TypeScript
cd api
npm install
npm run build
cd ..

# 3. Install Frontend dependencies
cd "TrustForge Frontend"
npm install
cd ..

# 4. Install Python Backend dependencies (optional for Python standalone tests)
cd backend
pip install -r requirements.txt
cd ..
```

---

## 4. Environment Variables Configuration

A configuration template is provided in [`api/.env.example`](file:///C:/TF%20new%20V1/TrustForge/api/.env.example). Copy to `api/.env`:

```ini
# Service Port
PORT=8000

# Persistence Mode: 'local' (Durable JSON Store) or 'supabase' (Cloud PostgreSQL)
DATABASE_MODE=local

# Supabase PostgreSQL (Required only when DATABASE_MODE=supabase)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Model Provider Credentials (Optional: System operates in local deterministic mode if unset)
GROQ_API_KEY=your_groq_api_key_here
OPENROUTER_API_KEY=your_openrouter_api_key_here
SARVAM_API_KEY=your_sarvam_api_key_here
OLLAMA_API_KEY=your_ollama_api_key_here
OLLAMA_BASE_URL=http://127.0.0.1:11434/v1

# CORS Origins
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000
```

> [!NOTE]
> When `DATABASE_MODE=local` (default), the API operates with zero external database dependencies, storing records durably under `api/data/`.

---

## 5. Database Setup, Migrations & Local Reset

### Local Durable Store Mode
- No database installation or Docker container required.
- The `durableStore` subsystem automatically serializes state to JSON files in `api/data/`.
- **Reset Procedure:** Delete files in `api/data/` or set `DATABASE_MODE=local` with clean directories.

### Supabase PostgreSQL Mode
If using Supabase PostgreSQL:
1. Create a PostgreSQL 15+ database with the `pgvector` extension enabled (`CREATE EXTENSION IF NOT EXISTS vector;`).
2. Run migration scripts located in [`database/migrations/`](file:///C:/TF%20new%20V1/TrustForge/database/migrations/):
   - `000_consolidated_clean_install.sql` (Creates all tables: scans, assessments, findings, trust scores, benchmarks, TOPSIS runs, evaluation runs).
   - `002_comprehensive_schema_and_rls.sql` (Applies multi-tenant Row-Level Security policies).

---

## 6. Safe Baseline Verification Results

All automated checks were executed locally against the clean audit tree:

### 6.1 Express API Test Suite (`node --test dist/**/*.test.js`)
- **Total Tests:** 133
- **Passed:** 133 (100%)
- **Failed:** 0
- **Duration:** 4.98 seconds
- **Covered Subsystems:**
  - Mandatory C1–C10 legal metadata mapping (83 chunks).
  - BM25 statutory retrieval and Reciprocal Rank Fusion (RRF).
  - Frozen context bit-for-bit snapshot determinism.
  - Strict Grounding Validator (rejection of fabricated quotes, missing evidence, hallucinated clauses).
  - C1–C10 Deterministic Trust Score calculation under W1 (penalty-proportional) and W2 (equal) weights.
  - Critical failure gating caps (missing HTTPS or privacy notice $\to \min(TS, 40)$).
  - TOPSIS multi-criteria ranking engine with sensitivity analysis.
  - Multi-tenant tenant isolation and SSRF guards.
  - **All 7 comprehensive assessment scenarios** in `assessmentScenarios.test.ts`.

### 6.2 Python Backend Test Suite (`pytest TrustForge/backend`)
- **Total Tests:** 30
- **Passed:** 29
- **Skipped:** 1 (`test_api_endpoints_full.py`, requires live FastAPI server on port 8000).
- **Failed:** 0
- **Duration:** 0.38 seconds

### 6.3 Frontend Production Build (`npm run build`)
- **Tool:** Vite + Rollup + TypeScript Compiler (`tsc -b && vite build`)
- **Modules Transformed:** 1,910 modules
- **Build Output:**
  - `dist/index.html` (1.62 kB)
  - `dist/assets/index.css` (73.67 kB)
  - `dist/assets/index.js` (636.31 kB)
- **Status:** **Zero compilation or TypeScript errors (Clean Build in 815ms)**.

---

## 7. Known Environment Limitations & Audit Notes

1. **Local Embedding Daemon:**
   - Dense vector embedding for hybrid retrieval runs through `scripts/embedder_daemon.py` on port 8001. If the daemon is offline, `HybridRAGRetriever` automatically falls back to authoritative BM25 lexical retrieval, guaranteeing zero assessment interruption.
2. **OpenRouter Free Tier (M04 / M05):**
   - Models `google/gemma-4-31b-it:free` and `google/gemma-4-26b-a4b-it:free` are subject to upstream provider rate limits (HTTP 429). The system includes exponential backoff and safely records unavailable slots without crashing.
3. **M06 and M07 Paid Model Boundary:**
   - Models M06 (Llama 3.3 70B) and M07 (Mistral Small 24B) require paid OpenRouter credits. Pursuant to research integrity guidelines, paid requests are blocked unless credits are pre-authorized.
4. **M10 Local-Only Model:**
   - Model M10 (Sarvam 30B) is configured for on-premise execution and correctly marked as `LOCAL_ONLY`.

---

## 8. Application Routes & Key Features Checklist for Auditing

| Route / Feature | Method / URL | Primary Function | Audit Verification Step |
| :--- | :--- | :--- | :--- |
| **API Health** | `GET /api/health` | Service status, database mode, provider readiness | Inspect configured providers and database mode. |
| **Public Scan** | `POST /api/scans` | Playwright crawl, TLS, defensive headers, cookies | Submit target URL (e.g. `https://technova.in`). |
| **Assessment Submission** | `POST /api/assessments` | Ingests 10 wizard categories + triggers 10-LLM RAG | Submit full wizard answers with domain. |
| **Assessment Polling** | `GET /api/assessments/:id` | Real-time progress, scores, findings, trace | Poll until `status === 'complete'`, verify Trust Score > 0. |
| **RAG Artifacts** | `GET /api/assessments/:id/rag` | 10-stage execution trace, frozen snapshot, retrieval | Verify bit-for-bit identical snapshot across models. |
| **10-LLM Benchmark** | `GET /api/benchmark/latest` | Per-model metrics, latency, grounding rate, cost | Inspect 10 model slots and execution statuses. |
| **TOPSIS Ranking** | `GET /api/benchmark/topsis/latest` | Multi-criteria ranking, closeness coefficient $C_i$ | Verify sensitivity analysis across 4 weight profiles. |
| **Executive PDF Report** | `GET /api/reports/:id/pdf` | PDFKit-generated compliance summary report | Download and verify PDF rendering and score accuracy. |
| **Frontend Wizard** | `GET /app/assessment` | React step-by-step assessment workflow | Complete all 6 steps, submit, verify Result step display. |
| **Frontend Benchmark** | `GET /app/benchmark` | Interactive 10-model comparison dashboard | Inspect model cards, latency charts, and TOPSIS rankings. |
| **Frontend RAG Monitor** | `GET /app/rag-monitor` | Live 10-stage visualization & retrieval explorer | Inspect retrieved statutory passages and grounding audit. |
