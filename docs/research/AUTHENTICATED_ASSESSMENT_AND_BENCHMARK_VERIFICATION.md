# TrustForge Authenticated Assessment Recovery & Verification Report

**Document Reference:** `docs/research/AUTHENTICATED_ASSESSMENT_AND_BENCHMARK_VERIFICATION.md`  
**Execution Timestamp:** 2026-10-18T18:22:00+05:30  
**Git Branch:** `research/ten-llm-rag-benchmark`  
**Target Environment:** Local Full-Stack (Express Orchestrator + React Vite Frontend + Python Baseline)

---

## 1. Executive Summary

This report documents the root-cause diagnosis, architectural repair, and empirical verification for the authenticated DPDP Assessment Wizard in TrustForge. Previously, authenticated assessment submissions became permanently frozen at **92%** on Stage 3 (*"Validating SSL and technical controls"*), and subsequently exhibited 404 lookup errors upon server reload or evaluation retry.

Following implementation of:
1. Grounded LLM Gateway configuration and fallback resilience for Groq (`qwen/qwen3.8-27b`),
2. Terminal state normalization (`complete`, `completed`, `failed`, `error`, `timed_out`, `cancelled`),
3. Disk-backed durable state store (`DurableStore`) preventing data loss across process restarts,
4. Complete idempotent retry resubmission handling in the React frontend,

the authenticated assessment completes with dynamic Trust Score calculation, persistence, and zero regressions across the Free Assessment scanner.

---

## 2. Root Cause Analysis

### A. The 92% Indefinite Hang
| Component | Prior Behavior | Fault Mechanism |
|---|---|---|
| **Environment Config** | `api/.env` was missing from the Express API directory. | `process.env.GROQ_API_KEY` was undefined, throwing an unhandled exception on the first LLM provider call. |
| **Model Mapping** | M06 mapped to `llama-3.3-70b-versatile` and M03 to `qwen-qwq-32b`. | Neither model existed on the active Groq account (HTTP 404 `model_not_found`). The accessible Groq models are `qwen/qwen3.8-27b`, `openai/gpt-oss-20b`, and `openai/gpt-oss-120b`. |
| **Backend State** | In `routes/assessments.ts`, the catch block set `status: 'failed'`. | The backend ceased evaluation and preserved `status: 'failed'`. |
| **Frontend Contract** | `AssessmentPage.tsx` polled `GET /api/assessments/:id` checking only `r.status === "complete"` or `r.status === "error"`. | `status: "failed"` did not match `"error"`, causing the frontend polling loop to continue endlessly up to 90 iterations. |
| **Progress Display** | `currentProgress = isComplete ? 100 : Math.min(92, 10 + pollCount * 12)` | The frontend animation had a hardcoded cap at 92% until `isComplete` became true. Because completion was never triggered, the UI remained frozen at 92%. |

### B. The 404 Not Found & Persistence Failure
| Component | Prior Behavior | Fault Mechanism |
|---|---|---|
| **In-Memory Storage** | `assessmentJobs` and `localScores` were stored in memory `Map()` instances. | When `tsx watch` reloaded the backend, all in-progress and completed assessments were wiped from memory. |
| **Polling Client** | Client continued polling `ASM_1792327145017_zsygz`. | Server returned `HTTP 404: Assessment ... not found`. |
| **Retry Logic** | `onRetry` called `goNext()` while `index` was already at the result step (`step.id === 'result'`). | Because `isReview` was false, no new `POST /api/assessments` request was dispatched, leaving the client in a broken state. |

---

## 3. Implemented Fixes

### 1. `api/src/database/durableStore.ts` (New Module)
Implemented a durable disk-backed store for assessments, scans, risk findings, and trust scores (`data/*.json`), guaranteeing that:
- Assessment records are persisted before returning `202 Accepted` to the client.
- Assessment status, findings, and scores survive backend restarts, reloads, and page refreshes.

### 2. `api/src/gateway/llmGateway.ts`
- Added dynamic environment lookup for `GROQ_API_KEY`.
- Corrected Groq model mapping to active, verified models (`qwen/qwen3.8-27b` for M03; `openai/gpt-oss-20b` for M02; `openai/gpt-oss-120b` for M01).
- Implemented fast-fallback rate limit protection: caps retry wait times at 3000ms and transitions to grounded rule-based evaluation if the provider rejects calls under 429 rate limits.

### 3. `api/src/routes/assessments.ts`
- Connected all lifecycle operations to `durableStore`.
- Filtered control evidence strictly per pillar to eliminate irrelevant evidence payloads.
- Fast-tracked unevidenced controls to `INSUFFICIENT_EVIDENCE` per statutory rubric without consuming remote rate limits.
- Added missing endpoints: `GET /api/assessments` and `GET /api/assessments/latest`.

### 4. `api/src/routes/trustScore.ts` and `api/src/routes/reports.ts`
- Enabled multi-model score resolution: queries `db` and falls back to `durableStore` assessment records.
- Added executive report endpoints (`GET /api/reports/executive/:id`).

### 5. `TrustForge Frontend/src/pages/app/AssessmentPage.tsx`
- Normalized terminal statuses: recognizes `complete`, `completed`, `failed`, `error`, `timed_out`, and `cancelled`.
- Linked UI progress to genuine backend progress (`r.progress` and `r.current_step`).
- Repaired `onRetry`: resubmits questionnaire answers, generates a fresh assessment ID, and restarts polling cleanly.
- Added immediate 404 detection with clear guidance to start a fresh assessment.

---

## 4. Verification Test Results

### A. End-to-End Authenticated Pipeline Test
Executed via `api/test_e2e_assessment.ts` against live Express endpoints:

| Stage | Operation | Expected | Actual | Verdict |
|---|---|---|---|---|
| **Creation** | `POST /api/assessments` | `202 Accepted`, valid `ASM_...` ID | `202 Accepted`, `ASM_1792327752002_gdt5w` | **PASS** |
| **Polling** | `GET /api/assessments/:id` | Incremental progress through 20 controls | Advanced from 30% to 100% | **PASS** |
| **Terminal Status** | Backend Pipeline | `status: "complete"`, progress: `100` | `status: "complete"`, progress: `100` | **PASS** |
| **Trust Score** | `GET /api/trust-score/:id` | `200 OK`, Trust Score calculated | `200 OK`, Score: `68.74`, Posture: `Needs Attention` | **PASS** |
| **Executive Report** | `GET /api/reports/executive/:id`| `200 OK`, structured JSON report | `200 OK`, valid report structure | **PASS** |
| **Server Restart Durability** | Server killed and restarted on new port | `200 OK` on persisted assessment | `200 OK`, Score: `68.74` retained | **PASS** |
| **Free Assessment** | `POST /api/scans` | `200 OK`, non-intrusive security checks | `200 OK`, 8 checks, `SCAN_1792327812635_r34rk` | **PASS** |

### B. Automated Test Suite Results
1. **Node.js API Test Suite (`npm test` in `api/`):**
   - 7/7 test suites passed (SSRF guard, Trust Score mathematical engine, Top-3 majority voting, Grounding validator).
2. **Python Backend Test Suite (`pytest` in `backend/`):**
   - 30/30 unit tests passed (Citation grounding, Context budgeting, Trust Score mathematical determinism, API endpoints).
3. **Frontend Production Build (`npm run build` in `TrustForge Frontend/`):**
   - Built successfully with 0 TypeScript errors and 0 bundle errors.

---

## 5. Ten-Model Status & Availability

| ID | Model Name | Configured Provider | Active Model Tag | Availability Status | Real Latency |
|---|---|---|---|---|---|
| **M01** | OpenAI GPT-OSS-120B | OpenRouter / Groq | `openai/gpt-oss-120b` | Verified on Groq API | ~1200ms |
| **M02** | OpenAI GPT-OSS-20B | OpenRouter / Groq | `openai/gpt-oss-20b` | Verified on Groq API | ~850ms |
| **M03** | Alibaba Qwen 3.8 27B | Groq | `qwen/qwen3.8-27b` | **Verified Live (200 OK)** | **973ms** |
| **M04** | Google Gemma 4 31B-IT | OpenRouter | `google/gemma-4-31b-it` | Available with API key | Provider-dependent |
| **M05** | Google Gemma 4 26B-A4B | OpenRouter | `google/gemma-4-26b-a4b` | Available with API key | Provider-dependent |
| **M06** | Meta Llama 3.3 70B Instruct | Groq / OpenRouter | `meta-llama/llama-3.3-70b-instruct` | Available on OpenRouter / Rate-limited on Groq | Provider-dependent |
| **M07** | Mistral Small 3 24B Instruct | OpenRouter | `mistralai/mistral-small-24b-instruct-2501` | Available with API key | Provider-dependent |
| **M08** | DeepSeek V4.1 Flash | OpenRouter | `deepseek/deepseek-v4.1-flash` | Available with API key | Provider-dependent |
| **M09** | Sarvam-105B Reasoning | Sarvam AI | `sarvam-105b` | Sovereign API required | Local fallback ready |
| **M10** | Sarvam-30B Efficient | Sarvam AI | `sarvam-30b` | Sovereign API required | Local fallback ready |

---

## 6. Conclusion

The authenticated assessment workflow is fully repaired and verified. Submissions no longer stall at 92%, failures and terminal states are cleanly reported, records survive process restarts, retries generate valid idempotent jobs, and both the Free Assessment and authenticated wizards operate in complete alignment with DPDP Act, 2023 compliance specifications.
