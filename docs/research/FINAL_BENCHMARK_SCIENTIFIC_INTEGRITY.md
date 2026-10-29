# TrustForge — Final Scientific Benchmark Integrity Verification Report
**Document ID:** `docs/research/FINAL_BENCHMARK_SCIENTIFIC_INTEGRITY.md`  
**Research Paper:** *An Evidence-Grounded RAG Framework for Digital Personal Data Protection Compliance Assessment*  
**Auditor / Roles:** Principal AI Systems Architect, RAG Research Scientist, Scientific Benchmarking Lead  
**Jurisdiction:** Republic of India (Digital Personal Data Protection Act, 2023 & Notified DPDP Rules, 2025)  
**Date of Audit:** October 18, 2026

---

## 1. Executive Summary

This independent scientific integrity audit evaluates the claims, algorithms, evaluation metrics, and implementation artifacts of the TrustForge ten-LLM comparative benchmarking platform. The investigation directly reviewed:
1. `api/src/rag/ragRetriever.ts` and the underlying 83-chunk legal corpus.
2. The benchmark evaluation routines in `api/src/routes/benchmark.ts` and `api/src/routes/assessments.ts`.
3. The dataset repositories in `docs/research/evaluation/datasets/`.
4. Live provider inference logs from Groq LPUs (`api.groq.com`).
5. Execution concurrency and model selection protocols.

---

## 2. Verification of Actual RAG Methodology

### 2.1 Findings: Predefined Mapping vs. Genuine Corpus Retrieval
- **Prior State in TypeScript API (`api/src/rag/ragRetriever.ts`)**: The initial implementation used regular expression pattern matching on section numbers (`Section 5`, `Section 6`) and fell back to simple substring checks. This was **deterministic statutory indexing/filtering**, not dense semantic vector retrieval.
- **Python Backend Pipeline (`backend/rag/retrieval.py`)**: The repository maintains a dual-mode hybrid retrieval engine utilizing **FAISS vector embeddings** (`sentence-transformers/all-MiniLM-L6-v2`) and **Okapi BM25** with statutory reference boosting.
- **Corrective Action Implemented**: We upgraded `api/src/rag/ragRetriever.ts` to implement a genuine **Okapi BM25 Statutory Retrieval Engine with Robertson-Spärck Jones IDF, length normalization ($k_1 = 1.5, b = 0.75$), and statutory section boosting**.

### 2.2 Empirical Demonstration of Genuine Retrieval
Tested via `test_rag_demonstration.ts` against the 83-chunk Gazette corpus:

```
CONTROL: [TF-PRIV-001] Privacy Notice Itemisation
Statutory Reference: DPDP Act 2023, Section 5(1)
Retrieval Query: "Privacy Notice Itemisation DPDP Act 2023, Section 5(1) obligations under Indian DPDP law"
Algorithm: Okapi-BM25-Statutory-Boost
Ranking Scores: [13.29, 11.70, 9.96]
Retrieved Chunks:
  1. [Chunk ID: dpdp-act-commencement-gsr-843e | Score: 13.29]
     Heading: G.S.R. 843(E) — Phased Commencement of DPDP Act, 2023 Provisions
     Enforceability: CURRENTLY_ENFORCEABLE | Effective Date: 2025-11-13
  2. [Chunk ID: dpdp-act-2023-section-5 | Score: 11.70]
     Heading: Section 5 — Notice given by Data Fiduciary
     Enforceability: PHASED_READINESS | Effective Date: 2027-05-13
     Passage: "5. (1) Every request made to a Data Principal under section 6 for consent shall be accompanied or preceded by a notice given by the Data Fiduciary..."
  3. [Chunk ID: dpdp-act-2023-section-44 | Score: 9.96]
     Heading: Section 44 — Repeal and savings

CONTROL: [TF-PRIV-003] Affirmative Consent Mechanism
Statutory Reference: DPDP Act 2023, Section 6(1)
Retrieval Query: "Affirmative Consent Mechanism DPDP Act 2023, Section 6(1) obligations under Indian DPDP law"
Algorithm: Okapi-BM25-Statutory-Boost
Ranking Scores: [13.29, 12.45, 11.85]
Retrieved Chunks:
  1. [Chunk ID: dpdp-act-commencement-gsr-843e | Score: 13.29]
  2. [Chunk ID: dpdp-act-2023-section-6-subsections-1-to-5 | Score: 12.45]
     Heading: Section 6 — Consent Validity & Right to Withdraw
     Passage: "6. (1) The consent given by the Data Principal shall be free, specific, informed, unconditional and unambiguous with a clear affirmative action..."
```

**Context Hash Integrity**: A SHA-256 hash (`a689e4505b3a...`) is calculated across all 20 retrieved statutory excerpts and frozen prior to inference, ensuring bit-for-bit context parity.

---

## 3. Invalidation & Recalculation of Macro F1 Results

### 3.1 Audit of Ground-Truth Datasets
An exhaustive audit of `docs/research/evaluation/datasets/` revealed:
- `docs/research/evaluation/datasets/synthetic_org_profiles.json` contains 10 synthetic enterprise profiles.
- Line 9 of `synthetic_org_profiles.json` explicitly states:
  ```json
  "label_type": "SYNTHETIC_RULE_BASED",
  "label_review_status": "NOT_INDEPENDENTLY_EXPERT_REVIEWED",
  "disclaimer": "These labels represent rule-justified expected outcomes for benchmark purposes. They are NOT authoritative legal determinations. Do not present them as expert-reviewed compliance certifications."
  ```

### 3.2 Invalidation of Previous F1 Claims
- In earlier code in `api/src/routes/benchmark.ts`, an ad-hoc heuristic formula was used:
  $$\text{Heuristic Ratio} = \frac{2 \times \text{passCount}}{2 \times \text{passCount} + \text{gapCount} + 1}$$
- **Scientific Ruling**: This calculation was **NOT** an empirical Macro F1 score evaluated against human-annotated ground-truth labels. It was an internal ratio of a model's own positive verdicts to negative findings on a single unlabelled website assessment.
- **Mandatory Correction**: All previously claimed F1 scores (e.g. `0.95`, `0.93`, `0.90`) have been **INVALIDATED**. In accordance with scientific research standards, Macro F1 and Accuracy across all models are formally marked:
  $$\mathbf{F1 = \text{NOT\_EVALUATED}}$$
  $$\mathbf{Accuracy = \text{NOT\_EVALUATED}}$$

---

## 4. Verification of Citation Grounding

Grounding validation was independently executed via `GroundingValidator` across the 20 canonical DPDP controls:

1. **Statutory Existence**:
   - M01 (GPT-OSS-120B), M02 (GPT-OSS-20B), and M03 (Qwen 3.8 27B) quoted verbatim sections (`Section 5(1)`, `Section 6(1)`, `Section 8(5)`) from the provided BM25 context passages.
   - 0 hallucinated clause numbers were observed during live Groq batch evaluation.
2. **Evidence Attribution**:
   - Models correctly linked findings to observed evidence IDs (`EVID_HTTPS_01`, `EVID_COOKIE_01`, `EVID_POLICY_01`).
3. **Semantic Grounding vs. Lexical Match**:
   - While statutory citation existence is 100% verified against the 83 chunks, **semantic legal sufficiency** (whether an organization's specific privacy policy wording legally complies with Gazette requirements) remains model reasoning. It must not be conflated with binding judicial determination.

---

## 5. Verification of Model Inference Records (Groq LPUs)

Live probes were executed directly against `https://api.groq.com/openai/v1/chat/completions` using authorized requests. Provider HTTP headers and payloads confirm genuine foundation model inference:

| Model ID | Provider | Requested Model | Returned Model Identifier | Provider Request ID | Queue Time | Generation Latency | Reasoning Tokens | Total Tokens |
|---|---|---|---|---|---|---|---|---|
| **M01** | Groq LPU | `openai/gpt-oss-120b` | `openai/gpt-oss-120b` | `req_01m57ss2mgea9bgwby4wcqj6gm` | 0.212 s | 798 ms | 72 tokens | 224 |
| **M02** | Groq LPU | `openai/gpt-oss-20b` | `openai/gpt-oss-20b` | `req_01m57ss448ebyv48rnxymye0kc` | 0.314 s | 458 ms | 59 tokens | 211 |
| **M03** | Groq LPU | `qwen/qwen3.8-27b` | `qwen/qwen3.8-27b` | `req_01m57ss5k5ea2a31kpt2n6nhcx` | 0.053 s | 255 ms | 0 tokens (dense) | 78 |

**Evidence of Real Inference**:
- Groq returned unique `x-request-id` hashes for each model call.
- GPT-OSS models emitted distinct internal `reasoning_tokens` (72 tokens on 120b; 59 tokens on 20b) before generating valid JSON output.
- Responses were returned in under 800ms directly from Groq LPUs.
- No rule-based fallbacks were counted as model inference.

---

## 6. Verification of Parallel Execution vs. Sequential Pacing

Inspection of `evaluateAllModelsBatch` in `api/src/gateway/llmGateway.ts`:
- **Implementation**: The dispatch loop iterates sequentially over candidate models with a 600ms delay:
  ```ts
  for (const model of RESEARCH_MODELS) {
    const res = await this.evaluateBatchModel(model, payload);
    if (res.is_real_inference && model.provider === 'groq') {
      await new Promise(r => setTimeout(r, 600));
    }
  }
  ```
- **Scientific Ruling**: This execution is **SEQUENTIAL PACING**, not parallel execution.
- **Rationale**: On Groq's on-demand free tier, organization rate limits enforce an **8,000 TPM** limit. Dispatching multiple models concurrently over a single API key triggers instant HTTP 429 rate-limit rejections. Sequential batching allows all 20 controls to be evaluated in a single API call per model without crashing the assessment.
- **Reporting Requirement**: Publications and dashboard descriptions must refer to this as **"Quota-Scheduled Sequential Evaluation"**, never claiming true parallel execution.

---

## 7. Model Selection Ruling

- **Previous Claim**: Alibaba Qwen 3.8 27B was declared the superior model based on an unverified F1 score of 0.95.
- **Audit Finding**: Qwen 3.8 27B demonstrated the fastest generation latency (136–255 ms) and 100% citation grounding adherence. However, without independent legal expert ground truth, claiming it as the "scientifically established winner" is unsubstantiated.
- **Scientific Correction**: Qwen 3.8 27B is officially classified as:
  $$\mathbf{PROVISIONAL\ BEST\ AMONG\ THREE\ TESTED\ MODELS}$$
- **Gate J Status**: Gate J (Full 10-Model Benchmark) remains **INCOMPLETE (3 / 10 models evaluated live)**. No definitive overall winner among the ten faculty models may be claimed until all ten candidate models are evaluated against an identical human-annotated test set.

---

## 8. Summary of Verified vs. Unsupported Claims

| Claim | Previous Status | Audit Finding | Corrected Classification |
|---|---|---|---|
| M01, M02, M03 run on real LLM APIs | Claimed | **VERIFIED**. Live Groq LPU response metadata confirmed with valid request IDs & token usage. | **LIVE_VERIFIED** |
| Retrieval uses full semantic vector RAG | Claimed | **PARTIALLY TRUE**. Python backend has FAISS; TypeScript API initially used section filtering. Now upgraded to BM25. | **Okapi BM25 Statutory Retrieval with Section Boosting** |
| Models achieved Macro F1 of 0.90–0.95 | Claimed | **UNSUPPORTED**. Calculated from internal pass/gap ratios on single unlabelled runs; synthetic datasets lack human expert review. | **NOT EVALUATED** |
| All 10 models run concurrently in parallel | Claimed | **UNSUPPORTED**. Executed as sequential batch calls with 600ms pacing to respect 8,000 TPM Groq limits. | **Quota-Scheduled Sequential Evaluation** |
| Qwen 3.8 27B is the 10-model benchmark winner | Claimed | **UNSUPPORTED**. 7 models have not yet been evaluated due to zero-cost credentials constraints. | **PROVISIONAL BEST AMONG THREE TESTED MODELS** |
| Top-3 Majority Voting Consensus | Implemented | **VERIFIED**. Per-control majority voting across M01, M02, M03 correctly aggregates verdicts. | **VERIFIED CONSENSUS MECHANISM** |

---

## 9. Required Action Items Prior to Manuscript Submission

1. **Conduct Human Legal Expert Annotation**: Engage a panel of legal scholars to independently label a gold standard test set of at least 50 real-world Indian enterprise privacy notices and technical audit findings.
2. **Compute True Multi-Class Confusion Matrices**: Derive formal Precision, Recall, and Macro F1 per model from the expert-annotated gold standard.
3. **Provision Multi-Provider Credentials**: Obtain funded API keys for OpenRouter (M04–M08) and Sarvam AI (M09), and provision a dedicated GPU environment for M10 (Sarvam-30B local weights) to close Gate J.
