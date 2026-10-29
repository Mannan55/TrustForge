# TrustForge — What Is Done & How To Run

## Overview

TrustForge is a research-grade DPDP Act 2023 compliance assessment platform. It performs a complete automated assessment pipeline:

**Assessment Wizard → Evidence Normalization → RAG Retrieval → TIE Evaluation → Trust Score → DB Persistence → Frontend Display**

---

## 1. How To Run

### Prerequisites

- Python 3.11+
- Node.js 20+
- A Groq API key (set in `backend/.env`)

### Step 1 — Start the Backend

```bash
cd "C:\TF new V1\TrustForge\backend"
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

Backend health check: http://127.0.0.1:8000/api/health

### Step 2 — Start the Frontend

```bash
cd "C:\TF new V1\TrustForge\TrustForge Frontend"
npm run dev -- --port 5173
```

Frontend: http://127.0.0.1:5173/

> **Important:** The frontend `.env` file must contain:
> VITE_API_BASE_URL=http://127.0.0.1:8000
>
> This is already set in `TrustForge Frontend/.env`.

### Step 3 — Run the Assessment

1. Open http://127.0.0.1:5173/assessment in the browser
2. Complete all wizard steps (data categories, purposes, languages, rights, processors, retention, breach plan, evidence)
3. Reach the "Review" step and click "Run analysis"
4. The frontend submits to the backend and polls for results (typically 2-5 minutes for 20 LLM evaluations)
5. The real Trust Score, pillar breakdown, and top findings are displayed

---

## 2. Running the Integration Test

```bash
cd "C:\TF new V1\TrustForge\backend"
python tests/test_pipeline.py
```

This test:
- Submits a real assessment with realistic wizard inputs
- Polls until status=complete
- Validates trust score, 20 findings, 404 responses
- Reports pillar scores and evaluation method breakdown

---

## 3. System Architecture

Frontend (React/Vite, port 5173)
  |
  |-> VITE_API_BASE_URL
Backend (FastAPI, port 8000)
  |
  |-- POST /api/assessments       -> Start pipeline
  |-- GET  /api/assessments/{id}  -> Poll / full result
  |-- GET  /api/findings/{id}     -> TIE findings
  |-- GET  /api/trust-score/{id}  -> Trust score
  |-- GET  /api/reports/{id}      -> Structured report
  |-- GET  /api/health            -> Health check
  |-- POST /api/scan              -> Website scanner
      |
      |-- compliance/evidence_mapper.py   Wizard -> Evidence
      |-- compliance/controls.py          20 DPDP controls
      |-- compliance/tie_evaluator.py     TIE (RAG + LLM)
      |-- compliance/trust_score.py       Deterministic scoring
      |-- rag/retrieval.py                FAISS vector search
      |-- core/database.py               SQLite (aiosqlite)

---

## 4. Key Files Modified / Created

### Backend

| File | Status | Purpose |
|------|--------|---------|
| backend/api/routes/assessments.py | Complete | Submit + pipeline + GET result |
| backend/api/routes/findings.py | Complete | GET findings for assessment |
| backend/api/routes/trust_score.py | Complete | GET trust score |
| backend/api/routes/reports.py | Complete | GET structured report |
| backend/compliance/tie_evaluator.py | Fixed | Async 429 retry, token limits, correct model |
| backend/config.py | Fixed | Correct Groq model: qwen/qwen3.8-27b |
| backend/.env | Fixed | Encoding fix, correct model name, max_tokens=512 |
| backend/tests/test_pipeline.py | Created | End-to-end integration test |

### Frontend

| File | Status | Purpose |
|------|--------|---------|
| TrustForge Frontend/src/services/api.ts | Complete | Typed API client for all backend endpoints (health, scans, assessments, findings, trust-score, RAG) |
| TrustForge Frontend/src/services/index.ts | Complete | Wired live API integration for findingsService, evidenceService, orgService, remediationService, assessmentService, and scanService with graceful fallbacks |
| TrustForge Frontend/src/pages/app/AssessmentPage.tsx | Complete | Wizard submission, real-time polling, ResultStep with live Trust Score, and OrgContext synchronization |
| TrustForge Frontend/src/pages/app/WebsiteScanPage.tsx | Complete | Real domain scanning connected to POST /api/scans with SSRF validation and structured checks display |
| TrustForge Frontend/src/pages/app/ReportsPage.tsx | Complete | Dynamic reporting backed by live assessment findings, pillars, and verified evidence |
| TrustForge Frontend/src/pages/app/FindingsPage.tsx | Complete | Renders 20 real TIE findings with DPDP sections, severity, affected areas, and why-it-matters rationales |
| TrustForge Frontend/src/pages/app/EvidencePage.tsx | Complete | Displays normalized evidence items from scanner and assessment wizard |
| TrustForge Frontend/src/pages/app/RemediationPage.tsx | Complete | Derives prioritized remediation tasks directly from open findings |
| TrustForge Frontend/src/pages/app/TrustScorePage.tsx | Complete | Visualizes 6-pillar breakdown with deterministic score calculation and coverage |
| TrustForge Frontend/.env | Complete | VITE_API_BASE_URL=http://127.0.0.1:8000 |

---

## 5. LLM Model Configuration

Working model: qwen/qwen3.8-27b (Groq)

The previously configured model llama-3.1-8b-instant is deprecated/unavailable on this account.
If the model changes, update backend/.env:

TRUSTFORGE_LLM_MODEL=qwen/qwen3.8-27b

### Rate Limits
- Groq free tier: 8000 tokens/min
- 20 controls x ~600 tokens each = ~12,000 tokens total
- The pipeline uses asyncio.sleep on 429 to retry without blocking the server
- Expected pipeline duration: 2-5 minutes (depending on rate limit headroom)

---

## 6. Canonical Trust Score Specification

The Trust Score is 100% deterministic — the LLM has zero involvement in calculating numerical scores.

### Outcome Weights (Per Control)
| Control Outcome | Weight ($w_{outcome}$) | Treatment |
|---|---|---|
| `PASS` | 1.00 | Full credit |
| `POTENTIAL_GAP` | 0.50 | Partial credit (observable discrepancy or partial implementation) |
| `INSUFFICIENT_EVIDENCE` | 0.30 | Baseline floor credit (absence of evidence is not proof of violation) |
| `UNKNOWN` | 0.30 | Treated identically to INSUFFICIENT_EVIDENCE |
| `FAIL` | 0.00 | Zero credit |
| `NOT_APPLICABLE` | -1.00 | Sentinel: Excluded from denominator |

### Per-Pillar Calculation
Each control inside a pillar carries an individual weight $w_{control} \in [1.0, 2.0]$.
$$\text{Pillar Score} = \left(\frac{\sum_{\text{applicable}} w_{control} \times w_{outcome}}{\sum_{\text{applicable}} w_{control}}\right) \times 100$$

### Global Pillar Weights
The six pillars contribute to the overall Trust Score with fixed global weights summing to 1.00:
- **Privacy**: 20% (0.20)
- **Security**: 20% (0.20)
- **Transparency**: 15% (0.15)
- **Governance**: 15% (0.15)
- **Data Lifecycle**: 15% (0.15)
- **User Rights**: 15% (0.15)

$$\text{Trust Score} = \sum_{p=1}^{6} (\text{Pillar Score}_p \times \text{Pillar Weight}_p)$$

Bounded to $[0, 100]$, rounded to 1 decimal place.

### Posture Thresholds
- $\ge 80.0 \rightarrow$ **Strong Alignment**
- $\ge 65.0 \rightarrow$ **Needs Attention**
- $\ge 50.0 \rightarrow$ **Potential Gaps**
- $< 50.0 \rightarrow$ **Critical**

---

## 7. Authoritative DPDP Controls (20 total)

| Pillar | Controls | Count |
|--------|---------|-------|
| Privacy | `TF-PRIV-001` to `TF-PRIV-005` | 5 |
| Security | `TF-SEC-001` to `TF-SEC-004` | 4 |
| Transparency | `TF-TRANS-001` to `TF-TRANS-002` | 2 |
| Governance | `TF-GOV-001` to `TF-GOV-002` | 2 |
| Data Lifecycle | `TF-LIFE-001` to `TF-LIFE-003` | 3 |
| User Rights | `TF-RIGHTS-001` to `TF-RIGHTS-004` | 4 |
| **Total** | | **20** |

---

## 8. Authoritative Legal RAG Corpus

- **Primary Source**: The Digital Personal Data Protection Act, 2023 (MeitY, Government of India)
- **Total Indexed Chunks**: 14 authoritative sections (Preamble, Section 2, Section 4, Section 5, Section 6, Section 7, Section 8, Section 9, Section 10, Section 11, Section 12, Section 13, Section 14, Section 17)
- **Embedding Model**: `all-MiniLM-L6-v2` (Sentence-Transformers)
- **Embedding Dimension**: 384
- **Vector Index**: FAISS Inner Product (Cosine similarity on normalized vectors)
- **Top-K**: 5 (TIE evaluator prompts provide top-3 context passages)

---

## 8. Research Integrity Guarantees

- No mock data in the live pipeline
- No fabricated DPDP sections (citations come only from retrieved RAG chunks)
- Trust Score is computed deterministically, not by the LLM
- Evidence is grounded: wizard answers tagged [SELF-REPORTED], scanner evidence tagged with method
- Every finding has a confidence score (0.0-1.0) and evaluation_method field
- Disclaimer injected in every report: not a legal compliance certificate
