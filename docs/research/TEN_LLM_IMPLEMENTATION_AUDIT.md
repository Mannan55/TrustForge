# TrustForge — Ten-LLM Implementation Audit (Phase 0)
**Research Project:** An Evidence-Grounded RAG Framework for Digital Personal Data Protection Compliance Assessment  
**Repository Branch:** `research/ten-llm-rag-benchmark`  
**Date of Audit:** October 2026  
**Auditor:** Principal AI Systems Architect & Benchmarking Lead  

---

## 1. Current State Assessment

An in-depth inspection of the existing codebase (`api/src/gateway/`, `api/src/routes/`, `api/src/scoring/`, `api/src/validator/`, `backend/rag/`, `TrustForge Frontend/src/pages/app/ModelBenchmarkPage.tsx`) was conducted to evaluate the ten-model benchmarking architecture.

### Critical Findings

1. **Assessment Pipeline Execution Scope:**
   - In `api/src/routes/assessments.ts`, the assessment loop previously only executed **a single model** (`M03: Qwen 3.8 27B`).
   - The faculty requirement explicitly mandates that **all ten candidate models must be attempted for every complete website assessment**, subject to verified availability and transparent reporting of incomplete runs.
2. **Provider Inference Reality:**
   - Groq is currently configured with an active free API key in `api/.env`.
   - Live probe of `https://api.groq.com/openai/v1/models` reveals that **`openai/gpt-oss-120b` (M01), `openai/gpt-oss-20b` (M02), and `qwen/qwen3.8-27b` (M03)** are actively hosted on Groq and execute with low latency (136–650 ms).
   - `llama-3.3-70b-versatile` (M06) returned HTTP 404 on the current Groq free tier endpoint; OpenRouter (`meta-llama/llama-3.3-70b-instruct`) is the candidate host.
   - OpenRouter, Sarvam AI, and Google AI Studio adapters are stubbed in `llmGateway.ts` but lack user-provided API keys in `.env`, triggering unhandled exceptions or rule-based fallbacks.
3. **Concurrency & Rate-Limiting:**
   - Evaluating 20 canonical controls sequentially across 10 models would trigger 200 individual API calls, immediately exhausting free-tier rate limits (429).
   - In accordance with Phase 12, **batching controls into a structured inference request per model** reduces network calls from 200 to 10 (one per model), preserves exact per-control statutory context, and respects zero-cost quotas.
4. **RAG Context Delivery:**
   - The authoritative 83-chunk DPDP corpus is located at `backend/knowledge/authoritative_corpus.json`.
   - The legal context passed to models was previously a short static string rather than genuine retrieved statutory clauses.
   - RAG retrieval must be integrated into every control evaluation using the 83-chunk corpus before models are invoked.
5. **Frontend Benchmark Screen:**
   - `TrustForge Frontend/src/pages/app/ModelBenchmarkPage.tsx` currently displays static default mock data and executes a simulated timer (`setTimeout`) rather than fetching real live benchmark results from `GET /api/benchmark/latest` or `POST /api/benchmark/run`.

---

## 2. Model Availability Matrix (Phase 0 Baseline)

| Model ID | Faculty Candidate Model | Provider Mapped | Probe Result | Real Inference Status | Action Required |
|---|---|---|---|---|---|
| **M01** | OpenAI GPT-OSS-120B | Groq (`openai/gpt-oss-120b`) | HTTP 200 (650 ms) | **LIVE_VERIFIED** | Route through Groq adapter as primary provider. |
| **M02** | OpenAI GPT-OSS-20B | Groq (`openai/gpt-oss-20b`) | HTTP 200 (550 ms) | **LIVE_VERIFIED** | Route through Groq adapter as primary provider. |
| **M03** | Qwen3.8-27B | Groq (`qwen/qwen3.8-27b`) | HTTP 200 (136 ms) | **LIVE_VERIFIED** | Active default provider on Groq. |
| **M04** | Google Gemma 4 31B | OpenRouter (`google/gemma-4-31b-it`) | No API Key | **REQUIRES_CREDENTIALS** | Report unavailable unless `OPENROUTER_API_KEY` provided. |
| **M05** | Google Gemma 4 26B-A4B | OpenRouter (`google/gemma-4-26b-a4b`) | No API Key | **REQUIRES_CREDENTIALS** | Report unavailable unless `OPENROUTER_API_KEY` provided. |
| **M06** | Meta Llama 3.3 70B | OpenRouter (`meta-llama/llama-3.3-70b-instruct`) | No API Key | **REQUIRES_CREDENTIALS** | Report unavailable unless `OPENROUTER_API_KEY` provided. |
| **M07** | Mistral Small 24B | OpenRouter (`mistralai/mistral-small-24b-instruct-2501`) | No API Key | **REQUIRES_CREDENTIALS** | Report unavailable unless `OPENROUTER_API_KEY` provided. |
| **M08** | DeepSeek V4.1 Flash | OpenRouter (`deepseek/deepseek-v4.1-flash`) | No API Key | **REQUIRES_CREDENTIALS** | Report unavailable unless `OPENROUTER_API_KEY` provided. |
| **M09** | Sarvam-105B | Sarvam AI API (`sarvam-105b`) | No API Key | **REQUIRES_CREDENTIALS** | Report unavailable unless `SARVAM_API_KEY` provided. |
| **M10** | Sarvam-30B | Sarvam AI API (`sarvam-30b`) | Deprecated Hosted | **UNAVAILABLE / LOCAL_REQUIRED** | Report unavailable / deprecated unless local weights loaded. |

---

## 3. Required Engineering Plan

1. **Phase 1 & 2:** Document exact official model revisions and build credential probe in `api/src/gateway/llmGateway.ts`.
2. **Phase 3 & 4:** Implement structured batching in `LLMGateway` and integrate all 10 models concurrently into `POST /api/assessments` and `POST /api/benchmark/run`.
3. **Phase 5:** Build `api/src/rag/ragRetriever.ts` to perform automated statutory chunk retrieval from `backend/knowledge/authoritative_corpus.json` and freeze RAG snapshot.
4. **Phase 6 & 7:** Run `GroundingValidator` on each model's output and compute individual per-model Trust Scores.
5. **Phase 8 & 9:** Calculate comparative benchmark metrics and perform Top-3 majority consensus.
6. **Phase 10:** Connect `ModelBenchmarkPage.tsx` to live backend data (`/api/assessments/latest` and `/api/benchmark/run`).
7. **Phase 11–15:** Persist benchmark data, protect against regressions, and verify live.
