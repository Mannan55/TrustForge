# TrustForge — LLM Provider Verification & Registry (2026)
**Research Project:** An Evidence-Grounded RAG Framework for Digital Personal Data Protection Compliance Assessment  
**Repository Branch:** `research/ten-llm-rag-benchmark`  
**Date of Verification:** October 2026  

---

## 1. Candidate Models & Official Endpoints

The ten faculty-designated candidate models were investigated across official inference providers (Groq, OpenRouter, Sarvam AI, Hugging Face):

| Model ID | Required Candidate | Official Revision / Endpoint | Primary Provider | Secondary Provider | Zero-Cost Access | Live Probe Outcome | Verified Limitation |
|---|---|---|---|---|---|---|---|
| **M01** | OpenAI GPT-OSS-120B | `openai/gpt-oss-120b` | Groq LPU | OpenRouter | Free on Groq | **HTTP 200 (650 ms)** | Rate limit capped at 30 RPM on free tier. |
| **M02** | OpenAI GPT-OSS-20B | `openai/gpt-oss-20b` | Groq LPU | OpenRouter | Free on Groq | **HTTP 200 (550 ms)** | Sparse MoE with 3.6B active parameters. |
| **M03** | Qwen3.8-27B | `qwen/qwen3.8-27b` | Groq LPU | HuggingFace | Free on Groq | **HTTP 200 (136 ms)** | Sub-second dense evaluation. |
| **M04** | Google Gemma 4 31B | `google/gemma-4-31b-it` | OpenRouter | Google Studio | Paid / Credits | **REQUIRES_CREDENTIALS** | Blocked without `OPENROUTER_API_KEY`. |
| **M05** | Google Gemma 4 26B-A4B | `google/gemma-4-26b-a4b` | OpenRouter | Vertex AI | Paid / Credits | **REQUIRES_CREDENTIALS** | Blocked without `OPENROUTER_API_KEY`. |
| **M06** | Meta Llama 3.3 70B | `meta-llama/llama-3.3-70b-instruct` | OpenRouter | Groq (Tier-gated) | Paid / Credits | **REQUIRES_CREDENTIALS** | Groq returned 404 on current key; OpenRouter candidate. |
| **M07** | Mistral Small 24B | `mistralai/mistral-small-24b-instruct-2501` | OpenRouter | Mistral API | Paid / Credits | **REQUIRES_CREDENTIALS** | Blocked without `OPENROUTER_API_KEY`. |
| **M08** | DeepSeek V4.1 Flash | `deepseek/deepseek-v4.1-flash` | OpenRouter | DeepSeek API | Paid / Credits | **REQUIRES_CREDENTIALS** | Blocked without `OPENROUTER_API_KEY`. |
| **M09** | Sarvam-105B | `sarvam-105b` | Sarvam AI | Sovereign Cloud | Commercial API | **REQUIRES_SARVAM_KEY** | Indic legal reasoning model; requires Sarvam auth. |
| **M10** | Sarvam-30B | `sarvam-30b` | Sarvam AI | Local Ollama | Deprecated API | **UNAVAILABLE / DEPRECATED** | Deprecated in Sarvam hosted API; requires local weights. |

---

## 2. Zero-Budget Operational Classification

In strict adherence to the supervisor's non-negotiable rules:
1. **Never fabricate responses:** Models M04–M10 without active API credentials will NOT return fabricated verdicts or synthetic scores. They are marked with their explicit operational status (`REQUIRES_CREDENTIALS` or `UNAVAILABLE`).
2. **Transparent reporting:** The benchmark interface reports the exact number of models completed (e.g., 3/10 Completed, 7/10 Unavailable).
3. **Consensus & Best-Model:** The final assessment selects from the highest-ranked *live* models (M01, M02, M03) and documents that candidate models M04–M10 are blocked awaiting third-party credentials.
