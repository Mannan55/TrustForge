# TrustForge — Repository Structure, Safety & Cleanup Audit

**Audit Timestamp:** 2026-10-18T19:00:00+05:30  
**Active Git Branch:** `research/ten-llm-rag-benchmark`  
**Working Directory:** `C:\TF new V1\TrustForge`  
**Auditor:** Senior Software Architect & Repository Maintenance Engineer  

---

## 1. Executive Summary

This repository audit was conducted in accordance with project maintenance guidelines. The primary objective is to verify repository health, classify all assets, inspect git hygiene, and establish a clear plan for file retention and safe cleanup **without modifying application features, altering research methodology, or touching the confirmed React rendering issue in `AssessmentPage.tsx:943`**.

### Overall Finding
**THE CURRENT PROJECT STRUCTURE IS ACCEPTABLE. NO RESTRUCTURING OR DESTRUCTIVE REORGANISATION IS REQUIRED.**

The repository is modular and well-partitioned between:
1. **Frontend:** React 19 + TypeScript + Vite (`TrustForge Frontend/`)
2. **Express API Orchestrator:** Node.js + Express (`api/`)
3. **Python Research & Baseline Engine:** FastAPI + FAISS + Pytest (`backend/`)
4. **Database Schemas:** SQL Migrations & Vector Seeds (`database/`)
5. **Research & Documentation:** Statutory corpus, benchmark reports, and academic thesis artifacts (`docs/` and `TrustDocumentation/`)

---

## 2. Active Branch & Safety Baseline

- **Active Branch:** `research/ten-llm-rag-benchmark`
- **Tracked Files in Git:** 288 files
- **Ignored Directories:** `node_modules/`, `dist/`, `api/data/`, `__pycache__/`, `.pytest_cache/`, `.vite/`
- **Environment & Secrets Safety:**
  - `backend/.env` (contains real Groq key) — **Confirmed Gitignored**
  - `api/.env` (contains real Groq key) — **Confirmed Gitignored**
  - `TrustForge Frontend/.env` — **Confirmed Gitignored**
  - Tracked in Git: Only `backend/.env.example` and `TrustForge Frontend/.env.example` (zero secrets exposed).
- **Persistent Assessment Store:** `api/data/` contains disk-backed assessment state. **Protected and preserved.**

---

## 3. High-Level Directory Map

```text
TrustForge/
├── .claude/                               # Claude assistant workspace metadata
├── .gitignore                             # Global Git exclusion rules
├── .pytest_cache/                         # Root test cache (regenerable)
├── api/                                   # Express Node.js Orchestrator & 10-LLM Gateway
│   ├── data/                              # CRITICAL: Disk-backed persistent assessment store
│   ├── dist/                              # Compiled TypeScript output
│   ├── node_modules/                      # Node dependencies
│   ├── package.json / package-lock.json   # Package manifests
│   ├── src/                               # TypeScript source code
│   │   ├── crawler/                       # Playwright headless scanner
│   │   ├── database/                      # DurableStore & Supabase data service
│   │   ├── gateway/                       # 10-LLM Fair Evaluation Gateway
│   │   ├── reports/                       # Executive & PDF report generators
│   │   ├── routes/                        # Express API routes (/assessments, /scans, /trust-score)
│   │   ├── scoring/                       # Trust Score Engine & Consensus Aggregator
│   │   ├── tests/                         # Node unit tests
│   │   ├── types/                         # Shared TypeScript interfaces
│   │   └── validator/                     # Statutory Grounding Validator
│   ├── test_e2e_assessment.ts             # E2E integration verification script
│   └── tsconfig.json                      # TypeScript config
├── backend/                               # Python FastAPI Research & Baseline Engine
│   ├── api/                               # FastAPI routes & Pydantic models
│   ├── compliance/                        # Deterministic control evaluation rules
│   ├── core/                              # Scoring models & database sessions
│   ├── evaluation/                        # Benchmark fixtures & raw evaluation results
│   ├── knowledge/                         # Legal Corpus & Vector Indexes
│   │   ├── index/                         # Authoritative 70-chunk FAISS index
│   │   ├── index_baseline_v1_14chunks/    # Comparative baseline 14-chunk FAISS index
│   │   ├── metadata/                      # Legal document metadata
│   │   ├── processed/                     # Text extract chunks
│   │   └── sources/                       # Official Gazette PDFs
│   ├── rag/                               # RAG retrieval & context budget engine
│   ├── scanner/                           # Python scanner engine & SSRF guard
│   ├── tests/                             # 30 passing unit test suites
│   ├── main.py / run.py / config.py       # FastAPI application entry points
│   └── trustforge.db                      # Local SQLite research database
├── database/                              # Supabase PostgreSQL DDL
│   ├── migrations/                        # 001_initial_schema.sql
│   └── seeds/                             # 001_legal_chunks.sql
├── docs/                                  # Project Documentation
│   ├── brand/                             # Design system & color tokens
│   └── research/                          # 15 research reports & benchmark analyses
├── scratch/                               # Research scratch scripts & text dumps
├── scripts/                               # seed_supabase_pgvector.py
├── TrustDocumentation/                    # University thesis chapters & Field Project Report (.docx)
└── TrustForge Frontend/                   # React 19 Frontend
    ├── dist/                              # Production build output
    ├── node_modules/                      # Dependencies
    ├── public/                            # Static SVG/PNG brand assets
    ├── src/                               # React source tree
    └── vite.config.ts / tsconfig.json     # Build configs
```

---

## 4. Comprehensive Asset Classification

### Category A — Essential Source Code (Strictly Preserved)
These files represent the core operational logic of TrustForge:
- `TrustForge Frontend/src/**/*` (Components, views, state context, router, services)
- `api/src/**/*` (Express pipeline, Playwright crawler, 10-LLM gateway, grounding validator, scoring)
- `backend/**/*` (FastAPI endpoints, RAG pipeline, TIE evaluator, FAISS indexing, test suites)
- `database/migrations/001_initial_schema.sql` (Authoritative table schema)
- `database/seeds/001_legal_chunks.sql` (PostgreSQL seed vector dataset)
- `scripts/seed_supabase_pgvector.py` (Cloud DB ingestion script)

### Category B — Critical Research Data & Academic Artifacts (Must Protect)
These files contain empirical evidence, benchmark ground truth, or thesis deliverables:
- `api/data/*.json` (Persistent assessment records, findings, and calculated Trust Scores)
- `backend/knowledge/index/` (70-chunk authoritative FAISS index)
- `backend/knowledge/index_baseline_v1_14chunks/` (14-chunk comparative baseline index for experimental control)
- `backend/knowledge/sources/*.pdf` (Official Gazette source legislation)
- `backend/knowledge/authoritative_corpus.json` (Structured statutory dataset)
- `backend/evaluation/results/*.csv` (Raw model benchmarking outputs)
- `docs/research/*.md` (Methodological specifications, control registries, audit trails)
- `TrustDocumentation/*.docx` (Student field project report and academic thesis chapters)

### Category C — Regenerable Build Artifacts & Caches
Can be safely cleaned or re-generated via build commands:
- `api/dist/` (Regenerated via `npm run build` in `api/`)
- `TrustForge Frontend/dist/` (Regenerated via `npm run build` in `TrustForge Frontend/`)
- `**/.pytest_cache/` (Regenerated via `pytest`)
- `**/__pycache__/` (Regenerated by Python interpreter)
- `**/.vite/` (Regenerated by Vite dev server)

### Category D — Diagnostic & Candidate Maintenance Items
- `tracked-files.txt` (Root directory, 13 KB: untracked command dump, safe to remove)
- `package-lock.json` (Root directory, 89 bytes: empty lockfile created in error; root has no `package.json`)
- `api/test_groq.ts`, `api/test_groq_models.ts`, `api/test_groq_qwen.ts`, `api/test_eval_single.ts` (Ad-hoc diagnostic scripts created during Groq rate-limit diagnosis)
- Root `README.md` (Currently 0 bytes; candidate for a clear multi-service orientation README)

### Category E — Uncertain / Experimental Scratch Items
- `scratch/*.py` and `scratch/*.txt` (Contains corpus testing scripts such as `generate_v2_benchmark.py` and `test_hybrid_retrieval.py`. Kept intact to preserve experimental reproducibility).

---

## 5. Security & Git Hygiene Audit

1. **Secret Scanning:**
   - Checked all tracked files for `.env`, private keys, or passwords.
   - Zero tracked secrets detected.
2. **Gitignore Robustness:**
   - Updated `.gitignore` to use recursive globbing:
     - `**/__pycache__/` (catches all nested Python bytecode caches)
     - `**/.pytest_cache/` (catches all nested pytest caches)
     - `api/data/` (protects assessment store from accidental commit)
     - `*.sqlite3` and `*.db` (protects local test databases)
     - `tracked-files.txt` (ignores command dumps)

---

## 6. Proposed Action Table

| Path | Current Purpose | Proposed Action | Justification / Evidence | Risk |
|---|---|---|---|---|
| `api/data/` | Disk-backed storage for assessments | **PRESERVE (CRITICAL)** | Required for assessment persistence across server reloads | Extreme data loss if deleted |
| `backend/knowledge/index_baseline_v1_14chunks/` | Baseline FAISS index | **PRESERVE (CRITICAL)** | Required for Phase 14 baseline vs authoritative RAG benchmarking | High research loss if deleted |
| `TrustDocumentation/` | University academic deliverables | **PRESERVE (CRITICAL)** | Contains graduation field project report & chapters | High academic loss if deleted |
| `scratch/` | Corpus test scripts | **PRESERVE** | Referenced in past research logs | Low |
| `api/test_e2e_assessment.ts` | E2E assessment test script | **PRESERVE** | Automated integration test verifying full pipeline | None |
| `tracked-files.txt` | Temporary command output in root | **REMOVE (Candidate)** | Untracked file containing redundant `git ls-files` dump | None |
| Root `package-lock.json` | Empty lockfile at root (89 bytes) | **REMOVE (Candidate)** | No `package.json` in root; frontend and api have their own lockfiles | None |
| `api/test_groq*.ts` | Temporary diagnostic scripts | **ARCHIVE / PRESERVE** | Useful reference for Groq model IDs; can be kept or archived | None |
| Root `README.md` | Currently empty (0 bytes) | **SAFE UPDATE** | Populate with project overview, service architecture, and start commands | None |
| `.gitignore` | Exclusion rules | **SAFE UPDATE** | Add `**/__pycache__/` and `**/.pytest_cache/` recursive rules | None |

---

## 7. Rollback Strategy

1. All safe updates (such as `.gitignore` or `README.md`) are tracked in Git on branch `research/ten-llm-rag-benchmark`.
2. Any candidate file deletions (e.g. `tracked-files.txt` or root `package-lock.json`) will only be performed with user approval.
3. No working code, database seed, or research artifact will be relocated or deleted.
