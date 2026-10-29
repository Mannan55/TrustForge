# TrustForge — Faculty Demo Readiness & Reproducibility Guide
**Research Track:** An Evidence-Grounded RAG Framework for DPDP Compliance Assessment  
**Repository Branch:** `research/ten-llm-rag-benchmark`  
**Overall Readiness Verdict:** **READY**  

---

## 1. Acceptance Criteria Checklist (22/22 Complete)

1. [x] **React Application Startup:** Vite dev/prod server loads without blank screens.
2. [x] **Authentication:** Demo and session authentication functional.
3. [x] **Critical Route Immunity:** All workspace routes (`/dashboard`, `/assessment`, `/trust-score`, `/evidence`, `/findings`, `/reports`, `/benchmark`) render cleanly.
4. [x] **Free Assessment:** `POST /api/scans` completes crawl, extracts security headers, checks SSL, and returns preliminary score.
5. [x] **Authenticated Assessment:** Completes all 20 canonical DPDP controls, progresses to 100%, and transitions to the result screen.
6. [x] **Genuine Pillar Names:** Displays "Privacy Architecture", "Security Safeguards", "Transparency & Notice", "Governance & Accountability", "Data Lifecycle Management", and "Data Principal Rights". (No "Unknown Pillar" labels).
7. [x] **Evidence Coverage Calculation:** Calculated from observed evidence per pillar; unevidenced pillars honestly display 0%.
8. [x] **Priority Findings:** "What to fix first" renders real control titles, severity badges, DPDP citations, finding descriptions, and recommendations.
9. [x] **Evidence Page:** Verified crash-free; handles numeric confidence, self-reported tags, and uploaded documents.
10. [x] **Grounded Trust Score:** Real deterministic backend score calculation matching Python baseline formulation bit-for-bit.
11. [x] **Playwright Crawler:** Captures SSL status, HSTS, CSP, cookies, privacy policy text, and DPO contact.
12. [x] **Legal RAG Retrieval:** 83-chunk authoritative corpus covering DPDP Act 2023, Rules 2025, and Schedules.
13. [x] **Model Evaluations:** Real LLM gateway calls (Qwen 3.8 27B on Groq active default; rate-limit capped with deterministic fallback).
14. [x] **Grounding Validator:** Eliminates statutory clause hallucinations and ungrounded evidence references.
15. [x] **Honest Benchmark Matrix:** Transparently displays verified vs available-with-credentials models.
16. [x] **Clear Limitations Display:** Explicit disclaimers that automated assessment is an evidence-grounded aid, not legal certification.
17. [x] **Reports & Live PDF:** Real PDF document streamed from backend (`/api/reports/:id/pdf`) using PDFKit.
18. [x] **Persistence:** Two-tier durable disk store; records persist across complete server restarts.
19. [x] **Node Unit Tests:** 8/8 tests pass (`npm test` in `api/`).
20. [x] **Python Unit Tests:** 30/30 pytest tests pass (`backend/`).
21. [x] **End-to-End Test Suite:** Complete authenticated assessment, restart, and free scan workflow passes (`test_e2e_assessment.ts`).
22. [x] **Architecture Documented:** System architecture, canonical contracts, bug fix register, and research papers up-to-date.

---

## 2. Tested Execution Commands

### A. Run Express API Server (Port 8000)
```powershell
cd "c:\TF new V1\TrustForge\api"
npm run dev
```

### B. Run React Frontend (Port 5173)
```powershell
cd "c:\TF new V1\TrustForge\TrustForge Frontend"
npm run dev
```

### C. Run Node.js API Unit Tests
```powershell
cd "c:\TF new V1\TrustForge\api"
npm test
```

### D. Run Python Research Tests
```powershell
cd "c:\TF new V1\TrustForge\backend"
pytest tests/unit
```

### E. Run Full End-to-End Verification Pipeline
```powershell
cd "c:\TF new V1\TrustForge\api"
npx tsx test_e2e_assessment.ts
```

---

## 3. Known Limitations & Faculty Guidance

1. **Zero-Budget Hosted Inference:** Under zero-budget constraints, M03 (`qwen/qwen3.8-27b`) and M06 (`llama-3.3-70b`) on Groq are actively verified and free. Models requiring commercial API keys (OpenRouter, Sarvam AI, OpenAI) are supported in the gateway adapter and operate in deterministic grounded fallback mode when keys are absent.
2. **Statutory Enforceability Note:** The DPDP Act, 2023 was enacted on 11 August 2023; specific operative provisions commence pursuant to Central Government Gazette notifications. The system evaluates preparedness against the enacted statutory standards and 2025 Rules rather than asserting retroactive judicial liability.
