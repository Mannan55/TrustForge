# 22. TrustForge RAG & Model Execution Provenance

**Project:** TrustForge — Evidence-Grounded RAG Framework for DPDP Compliance Assessment  
**Faculty Supervisor:** Dr. Neelam Naik  
**Date:** 2026-10-29  
**Corpus File:** `backend/knowledge/authoritative_corpus.json`  
**Verified Corpus SHA-256:** `c79c0fb3eb811e69ddc9ee91b9b18360ce01103ad94e01764ebdb7b939fcbc2d`  

---

## 1. 10-Stage RAG Pipeline Provenance

The 10-stage RAG architecture operates under strict measurement standards. Synthetic stage durations (such as the legacy 120ms/8ms/24ms/18ms/650ms placeholders) have been permanently eliminated.

| Stage # | Stage Key | Stage Name | Timing Mechanism | Fallback Behavior |
|---|---|---|---|---|
| **1** | `WEBSITE_EVIDENCE` | Website Evidence Collection | Measured elapsed (`tEnd - tStart`) | Emits self-reported wizard evidence if crawler is unselected |
| **2** | `KNOWLEDGE_ACCESS` | Legal Knowledge-Base Access | Measured elapsed (`Date.now() - tStart`) | Reads 83 chunks with verified SHA-256: `c79c0fb...` |
| **3** | `BM25_RETRIEVAL` | BM25 Keyword Retrieval | Measured latency sum over 20 controls | Okapi BM25 with statutory tokenization & category boosting |
| **4** | `VECTOR_RETRIEVAL` | Dense Vector Retrieval | Measured RPC + embedding latency | **If vector daemon offline: marked `SKIPPED` (BM25 fallback)** |
| **5** | `RRF_FUSION` | Reciprocal Rank Fusion (RRF) | Measured elapsed formula computation | Formula: $RRF(d) = \sum \frac{1}{60 + \text{rank}_i}$ |
| **6** | `PASSAGE_SELECTION` | Top-5 Statutory Passage Selection | Measured elapsed passage selection | Top-5 passages strictly confined to frozen legal context |
| **7** | `FROZEN_CONTEXT` | Frozen Context Generation | Measured elapsed context block hashing | Computes SHA-256 snapshot hash over concatenated contexts |
| **8** | `LLM_ASSESSMENT` | LLM Multi-Model Assessment | Measured per-model HTTP / inference span | Model execution trace records actual latency and token counts |
| **9** | `GROUNDING_VERIFICATION` | Grounding Verification | Measured validator runtime | Confinement to frozen retrieved context; ungrounded $\to$ `NOT_DETERMINABLE` |
| **10** | `TRUST_SCORE_GEN` | Research Trust Score Generation | Measured engine runtime | Penalty-proportional W1 weighting + critical failure caps |

---

## 2. 10-Model Slot Registry & Truthful Execution Status

In compliance with faculty scientific integrity rules, model execution designations are explicitly segregated into **LIVE VERIFIED**, **HISTORICAL / DEMONSTRATION**, and **BLOCKED / UNAVAILABLE**. Model identifiers, providers, and requested model IDs agree bit-for-bit with pi/src/gateway/llmGateway.ts.

| Slot | Model Name | Provider | Requested Model ID | Execution Status | Truthful Designation | Notes |
|---|---|---|---|---|---|---|
| **M01** | OpenAI GPT-OSS 120B | Groq | openai/gpt-oss-120b | Completed | **LIVE VERIFIED** | High parameter frontier model running on Groq LPUs |
| **M02** | OpenAI GPT-OSS 20B | Groq | openai/gpt-oss-20b | Completed | **LIVE VERIFIED** | Fast 20B model running on Groq LPU tier |
| **M03** | Qwen3.8-27B | Groq | qwen/qwen3.8-27b | Completed | **LIVE VERIFIED** | TOPSIS primary model; authentic sub-second inference |
| **M04** | Gemma 4 31B | OpenRouter | google/gemma-4-31b-it:free | Completed | **LIVE VERIFIED** | OpenRouter verified free tier endpoint |
| **M05** | Gemma 4 26B-A4B | OpenRouter | google/gemma-4-26b-a4b-it:free | Rate-Limited | **UNAVAILABLE** | Provider HTTP 429 rate limit reached; paid fallback blocked |
| **M06** | Llama 3.3 70B | OpenRouter | meta-llama/llama-3.3-70b-instruct | Blocked (Credits) | **DEMONSTRATION** | Requires paid credits; paid spend strictly blocked per research protocol |
| **M07** | Mistral Small 24B | OpenRouter | mistralai/mistral-small-3.2-24b-instruct | Blocked (Credits) | **DEMONSTRATION** | Requires paid credits; paid spend strictly blocked per research protocol |
| **M08** | DeepSeek V4.1 Flash | Sarvam AI | deepseekv4.1-flash | Completed | **LIVE VERIFIED** | Authorized bounded execution on Sarvam AI /v2 endpoint within ₹5 budget |
| **M09** | Sarvam 105B | Sarvam AI | sarvam-105b | Completed | **LIVE VERIFIED** | India sovereign flagship model on Sarvam AI /v1 endpoint |
| **M10** | Sarvam 30B | Local Ollama | sarvam-30b | Offline | **UNAVAILABLE** | Local Ollama service offline on host machine; clearly labeled |

---

## 3. Human Annotation & Ground Truth Provenance

The human annotation records (`ANN_LEGAL_01`, `ANN_AUDIT_02`, `ADJ_SUPERVISOR_01`) in `expertDataset.ts` represent **pre-configured demonstrative calibration profiles** created according to the faculty research rubric. They must not be advertised as empirical external human trials until an independent panel of advocates and auditors completes formal double-blind reviews.
