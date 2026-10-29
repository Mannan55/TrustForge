# TrustForge: Evidence-Grounded DPDP Compliance Platform

**TrustForge** is a research-grade automated compliance assessment and comparative LLM evaluation platform for the Indian Digital Personal Data Protection Act, 2023 (DPDP Act) and the DPDP Notified Rules, 2025.

---

## Architecture Overview

```
                      ┌────────────────────────────────────────┐
                      │    TrustForge Frontend (React 19)      │
                      │     http://127.0.0.1:5173              │
                      └──────────────────┬─────────────────────┘
                                         │
                         REST API Requests (VITE_API_BASE_URL)
                                         │
                      ┌──────────────────▼─────────────────────┐
                      │    Express API Orchestrator (Node.js)  │
                      │     http://127.0.0.1:8000              │
                      │  - Playwright Headless Web Scanner     │
                      │  - 10-LLM Evaluation Gateway           │
                      │  - Statutory Grounding Validator       │
                      │  - Deterministic Trust Score Engine    │
                      │  - Durable Disk-Backed State Store     │
                      └──────────────────┬─────────────────────┘
                                         │
                         Retrieval / Baseline Verification
                                         │
                      ┌──────────────────▼─────────────────────┐
                      │    Python Research Engine (FastAPI)    │
                      │  - 70-Chunk Gazette Corpus (FAISS)     │
                      │  - Comparative RAG Baseline            │
                      │  - Context Budget Manager (2,048 tok)  │
                      │  - 30-Suite Pytest Verification        │
                      └────────────────────────────────────────┘
```

---

## Directory Structure

| Path | Purpose | Technologies |
|---|---|---|
| `TrustForge Frontend/` | Interactive compliance assessment wizard, dashboard, trust score ring, findings, and scanner | React 19, TypeScript, TailwindCSS, Vite |
| `api/` | Express REST orchestrator, 10-LLM gateway, grounding validator, and PDF reporting | Node.js, Express, TypeScript, Playwright |
| `backend/` | Legal RAG retrieval engine, statutory FAISS vector index, and baseline research evaluators | Python 3.11+, FastAPI, FAISS, Pytest |
| `database/` | Supabase / PostgreSQL DDL migrations and vector embeddings seed files | SQL, pgvector |
| `docs/research/` | 15 empirical research reports, faculty demo guides, and canonical control registry | Markdown |
| `TrustDocumentation/` | University academic thesis chapters and field project report | Microsoft Word (.docx) |

---

## Quick Start Guide

### 1. Start the Express API Backend
```bash
cd "C:\TF new V1\TrustForge\api"
npm install
npm run dev
```
Health Check: `http://127.0.0.1:8000/api/health`

### 2. Start the React Frontend
```bash
cd "C:\TF new V1\TrustForge\TrustForge Frontend"
npm install
npm run dev
```
Frontend URL: `http://127.0.0.1:5173/`

### 3. Alternative Python Research Engine
```bash
cd "C:\TF new V1\TrustForge\backend"
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

---

## Testing & Verification

- **Node API Test Suite:** `npm test` inside `api/` (7/7 tests passing)
- **Python Research Test Suite:** `pytest` inside `backend/` (30/30 unit tests passing)
- **Frontend Production Build:** `npm run build` inside `TrustForge Frontend/` (0 errors)
- **End-to-End Pipeline Verification:** `npx tsx test_e2e_assessment.ts` inside `api/`
