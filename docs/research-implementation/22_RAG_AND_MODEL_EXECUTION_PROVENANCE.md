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

In compliance with faculty scientific integrity rules, model execution designations are explicitly segregated into **LIVE VERIFIED**, **HISTORICAL / DEMONSTRATION**, and **BLOCKED / UNAVAILABLE**.

| Slot | Model Identifier | Provider | Requested Model ID | Execution Status | Truthful Designation | Notes |
|---|---|---|---|---|---|---|
| **M01** | `deepseek/deepseek-chat` | OpenRouter | `deepseek/deepseek-chat` | Completed | **LIVE VERIFIED** | Executed in Phase 4; authentic HTTP 200 response |
| **M02** | `meta-llama/llama-3.3-70b-instruct:free` | OpenRouter | `meta-llama/llama-3.3-70b-instruct:free` | Completed | **LIVE VERIFIED** | Free endpoint; authentic inference execution |
| **M03** | `qwen/qwen-2.5-72b-instruct` | OpenRouter | `qwen/qwen-2.5-72b-instruct` | Completed | **LIVE VERIFIED** | TOPSIS primary model; authentic execution |
| **M04** | `mistralai/mistral-small-24b-instruct-2501:free` | OpenRouter | `mistralai/mistral-small-24b-instruct-2501:free` | Completed | **LIVE VERIFIED** | Free endpoint; authentic execution |
| **M05** | `google/gemma-4-26b-a4b-it:free` | OpenRouter | `google/gemma-4-26b-a4b-it:free` | Rate-Limited | **UNAVAILABLE** | Provider HTTP 429 rate limit reached; paid fallback blocked |
| **M06** | `google/gemini-2.5-flash` | OpenRouter | `google/gemini-2.5-flash` | Blocked (Credits) | **DEMONSTRATION** | HTTP 402/403 credit exhaustion; synthetic results marked |
| **M07** | `anthropic/claude-3.5-haiku` | OpenRouter | `anthropic/claude-3.5-haiku` | Blocked (Credits) | **DEMONSTRATION** | HTTP 402/403 credit exhaustion; synthetic results marked |
| **M08** | `deepseekv4.1-flash` | Sarvam AI | `deepseekv4.1-flash` | Completed | **LIVE VERIFIED** | Authorized bounded execution within ₹5 budget |
| **M09** | `google/gemini-2.0-flash` | OpenRouter | `google/gemini-2.0-flash` | Completed | **LIVE VERIFIED** | Single bounded run; authentic response |
| **M10** | `llama3.2:3b` | Local Ollama | `llama3.2:3b` | Offline | **UNAVAILABLE** | Local Ollama service offline on host; clearly labeled |

---

## 3. Human Annotation & Ground Truth Provenance

The human annotation records (`ANN_LEGAL_01`, `ANN_AUDIT_02`, `ADJ_SUPERVISOR_01`) in `expertDataset.ts` represent **pre-configured demonstrative calibration profiles** created according to the faculty research rubric. They must not be advertised as empirical external human trials until an independent panel of advocates and auditors completes formal double-blind reviews.
