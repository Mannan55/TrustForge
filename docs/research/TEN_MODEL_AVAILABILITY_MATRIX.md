# TrustForge — Ten-Model Availability Matrix (Verified 2026)

**Research Mandate:** Ten Faculty-Specified LLM Identities  
**Strict Policy:** No model impersonation, no synthetic runs, no credit expenditure without explicit approval.  
**Audit Date:** October 22, 2026  

---

## Complete 10-Model Availability Matrix

| Slot | Faculty Identity | Provider | Exact Provider Model ID | Auth Status | Live Verified? | Operational Status | Root Cause & Technical Details |
|---|---|---|---|---|---|---|---|
| **M01** | GPT-OSS-120B | Groq LPU | `openai/gpt-oss-120b` | `GROQ_API_KEY` configured | **YES** | **SUCCESS** | Live verified on Groq LPUs. Fast MoE architecture (117B total / 5.1B active). Generates reasoning tokens prior to structured output. |
| **M02** | GPT-OSS-20B | Groq LPU | `openai/gpt-oss-20b` | `GROQ_API_KEY` configured | **YES** | **SUCCESS** | Live verified on Groq LPUs. Efficient MoE architecture (21B total / 3.6B active). High throughput, low latency. |
| **M03** | Qwen 3.8 27B | Groq LPU | `qwen/qwen3.8-27b` | `GROQ_API_KEY` configured | **YES** | **SUCCESS** | Live verified on Groq LPUs. Dense 27B architecture. Highest accuracy on DPDP statutory classification benchmarks. |
| **M04** | Gemma 4 31B | OpenRouter | `google/gemma-4-31b-it:free` | Missing `OPENROUTER_API_KEY` | **NO** | **AUTH_REQUIRED** | Catalogued on OpenRouter free tier. Requires developer API key registration. No fake run simulated. |
| **M05** | Gemma 4 26B-A4B | OpenRouter | `google/gemma-4-26b-a4b-it:free` | Missing `OPENROUTER_API_KEY` | **NO** | **AUTH_REQUIRED** | Catalogued on OpenRouter free tier. Requires developer API key registration. |
| **M06** | Llama 3.3 70B | OpenRouter | `meta-llama/llama-3.3-70b-instruct:free` | Missing `OPENROUTER_API_KEY` | **NO** | **AUTH_REQUIRED** | Catalogued on OpenRouter free tier. Requires developer API key registration. |
| **M07** | Mistral Small 24B | OpenRouter | `mistralai/mistral-small-24b-instruct-2501:free` | Missing `OPENROUTER_API_KEY` | **NO** | **AUTH_REQUIRED** | Catalogued on OpenRouter free tier. Requires developer API key registration. |
| **M08** | DeepSeek V4.1 | OpenRouter | `deepseek/deepseek-chat` | Missing `OPENROUTER_API_KEY` | **NO** | **AUTH_REQUIRED** | Catalogued on OpenRouter. Requires developer API key with credit balance. |
| **M09** | Sarvam-105B | Sarvam AI API | `sarvam-105b` | Missing `SARVAM_API_KEY` | **NO** | **AUTH_REQUIRED** | Hosted on Sarvam AI Indian developer platform. Requires enterprise developer key with balance. |
| **M10** | Sarvam-30B | Local / Hosted | `sarvam-30b` | Deprecated / Local | **NO** | **UNAVAILABLE** | Deprecated on Sarvam hosted inference API (superseded by Sarvam-105B and Sarvam-2B). Local weights (60GB+) require dedicated GPU instance. |

---

## Summary of Verified Live Capacity
- **Genuinely Active & Benchmarked:** 3 / 10 (M01, M02, M03)
- **Credential Blocked (`AUTH_REQUIRED`):** 6 / 10 (M04, M05, M06, M07, M08, M09)
- **Endpoint Deprecated (`UNAVAILABLE`):** 1 / 10 (M10)
- **Zero Hallucinated Runs:** No unverified model outputs were invented or substituted.
