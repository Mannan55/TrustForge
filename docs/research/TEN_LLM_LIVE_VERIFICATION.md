# TrustForge — Ten-LLM Benchmark Live Verification Matrix
**Research Track:** An Evidence-Grounded RAG Framework for DPDP Compliance Assessment  
**Repository Branch:** `research/ten-llm-rag-benchmark`  
**Date of Audit:** October 2026  

---

## 1. Candidate Model Specification & Provider Mapping

The research evaluation defines ten candidate foundation models across dense, MoE, and sovereign Indian legal reasoning architectures:

| Model ID | Supervisor Candidate Specification | Resolved Provider Model Tag | Inference Provider | Context Window | Architecture | Operational Verification Status |
|---|---|---|---|---|---|---|
| **M01** | OpenAI GPT-OSS-120B | `openai/gpt-oss-120b` | OpenRouter / Local | 128K | MoE (120B total) | **AVAILABLE_WITH_CREDENTIALS** |
| **M02** | OpenAI GPT-OSS-20B | `openai/gpt-oss-20b` | OpenRouter / Ollama | 64K | MoE (20B total, 3.6B active) | **AVAILABLE_WITH_CREDENTIALS** |
| **M03** | Qwen3.8-27B | `qwen/qwen3.8-27b` | Groq LPU (Sub-second) | 32K | Dense (27B) | **VERIFIED_AVAILABLE (Active Default)** |
| **M04** | Google Gemma 4 31B | `google/gemma-4-31b-it` | OpenRouter / Vertex | 128K | Dense (31B) | **AVAILABLE_WITH_CREDENTIALS** |
| **M05** | Google Gemma 4 26B-A4B | `google/gemma-4-26b-a4b` | OpenRouter | 64K | MoE (4B active) | **AVAILABLE_WITH_CREDENTIALS** |
| **M06** | Meta Llama 3.3 70B | `llama-3.3-70b-versatile` | Groq / OpenRouter | 128K | Dense (70B) | **VERIFIED_AVAILABLE** |
| **M07** | Mistral Small 24B | `mistralai/mistral-small-24b-instruct-2501` | OpenRouter / Mistral | 32K | Dense (24B) | **AVAILABLE_WITH_CREDENTIALS** |
| **M08** | DeepSeek V4.1 Flash | `deepseek/deepseek-v4.1-flash` | OpenRouter / DeepSeek | 64K | MoE / Multi-Head Latent | **AVAILABLE_WITH_CREDENTIALS** |
| **M09** | Sarvam-105B | `sarvam-105b` | Sarvam AI API | 32K | Sovereign Indic MoE | **REQUIRES_SARVAM_KEY** |
| **M10** | Sarvam-30B | `sarvam-30b` | Sarvam AI API / Ollama | 16K | Sovereign Indic Efficient (2.4B active) | **REQUIRES_SARVAM_KEY** |

---

## 2. Zero-Budget Protocol & Deterministic Fallback Handling

Under the faculty zero-budget policy:
1. **Live Production Provider:** M03 (`qwen/qwen3.8-27b` on Groq) and M06 (`llama-3.3-70b-versatile` on Groq) are verified live and accessible via the configured free-tier Groq API key.
2. **Deterministic Grounded Fallback:** When a provider reaches rate limits (429) or lacks credentials, the system does not crash or fabricate ungrounded answers. Instead, it logs the condition, marks the model status transparently in the benchmark matrix, and utilizes the deterministic statutory compliance validator.
3. **Consensus Aggregation:** The Top-3 Majority Voting engine aggregates verdicts at the canonical control level from the top performing models, resolving ties conservatively towards statutory protection.
