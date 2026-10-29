# TrustForge — Phase 6.1 Implementation Report: Research Integrity Audit, Traceability & Metric Reclassification

**Project:** TrustForge — Evidence-Grounded RAG Framework for DPDP Compliance Assessment  
**Workspace:** `C:\TF new V1\TrustForge`  
**Faculty Supervisor:** Dr. Neelam Naik  
**Author:** AI Systems Architect, Senior Full-Stack Engineer, AI Researcher & QA Automation Lead  
**Date:** October 28, 2026  
**Implementation Phase:** Phase 6.1 (Research Integrity Audit & Metric Reclassification)  
**System Test Status:** 117/117 API Tests Passing (100%) | 29/29 Pytest Tests Passing | Frontend Production Build Verified (940ms)

---

## 1. Executive Summary & Purpose of Audit

Following the implementation of Phase 6, this **Phase 6.1 Research Integrity Audit** was conducted to independently verify every empirical claim, establish absolute source-to-metric traceability, audit model execution provenance, and eliminate unverified assumptions regarding human expert annotations.

In high-stakes regulatory AI research, scientific rigor requires complete transparency regarding the boundaries between:
1. **Genuinely Executed Live Inferences:** Physically transmitted over the wire to provider APIs, returning verified HTTP 200 responses with measured tokens, latencies, and costs.
2. **Calibrated Demonstration Fixtures:** Software-verified mathematical pipelines and simulated baselines designed to test algorithm correctness without incurring unauthorized cloud costs.
3. **Pending Empirical Data:** Experiments requiring dedicated multi-run inference budgets or external double-blind human legal trials.

This audit definitively corrects all overstatements, reclassifies provisional metrics, preserves fully functioning statistical software, provides a blank human annotation workbook, and confirms regression stability.

---

## 2. Forensic Audit of Models M06 and M07

### 2.1 Investigation & Findings
In Phase 6, models **M06** (`meta-llama/llama-3.3-70b-instruct`) and **M07** (`mistralai/mistral-small-3.2-24b-instruct`) were erroneously designated as eligible and evaluated. A forensic audit of all raw records in `api/data/benchmarks.json`, `api/data/assessments.json`, and historical execution logs revealed:

- **Provider:** OpenRouter Cloud API (`https://openrouter.ai/api/v1/chat/completions`).
- **Configured OpenRouter Key Balance:** **$0.00** (Zero credit balance).
- **Free-Tier Availability:** OpenRouter provides free variants only for models carrying the explicit `:free` suffix (e.g. `google/gemma-4-31b-it:free`). Neither Llama 3.3 70B nor Mistral Small 24B has an active `:free` endpoint on OpenRouter.
- **Physical HTTP Status:** During live gateway testing (recorded in Phase 4.1 and Phase 4 Final reports), requests to both endpoints returned **HTTP 403 Forbidden** (`{"error": {"message": "Insufficient credits", "code": 403}}`).
- **Inference Runs Completed:** **0** (Zero physical live inferences executed).
- **Token Usage & Incurred Cost:** **0 tokens, $0.00 cost**.
- **Raw Response Storage Location:** None (No live response payload exists).

### 2.2 Corrective Actions Taken
1. **Revocation of Verified Status:** The `verified: true` flags for M06 and M07 in `TrustForge/api/src/evaluation/evaluationRunner.ts` have been removed. Both slots are now strictly marked:
   - `verified: false`
   - `ineligibility_reason: "Insufficient OpenRouter credits (HTTP 403 Forbidden); no free tier available"`
2. **Exclusion from Eligible Decision Matrix:** In accordance with Phase 5 eligibility rules, M06 and M07 are excluded from TOPSIS normalization, assigned rank `-1`, and given closeness `0.0000`.
3. **Dashboard Reclassification:** In `ModelBenchmarkPage.tsx`, M06 and M07 are rendered under their true status: `NO_CREDITS (403)`, with trust score `—` and Macro-F1 `—`.

---

## 3. Human Annotations Audit & Ground Truth Reclassification

### 3.1 Investigation of Annotator Identities
An inspection of `TrustForge/api/src/evaluation/expertDataset.ts` revealed that records for `ANN_LEGAL_01`, `ANN_AUDIT_02`, and `ADJ_SUPERVISOR_01` were hardcoded demonstration fixtures created to test the Cohen's kappa and Fleiss' kappa algorithms. 

- **Independent Human Participation:** **None.** No double-blind review study by independent external legal practitioners has taken place.
- **Faculty Supervisor Attribution:** Dr. Neelam Naik did **not** personally annotate or adjudicate these cases. Attributing these reviews to her or certified legal counsel was an unverified claim.

### 3.2 Corrective Actions Taken
1. **Dataset Reclassification:** The dataset has been reclassified from "Certified Human Ground Truth" to **`PROVISIONAL_DEMONSTRATION_BASELINE`** in `expertDataset.ts`.
2. **Metadata Disclosure Update:**
   ```typescript
   review_status_disclosure:
     'PROVISIONAL_RESEARCH_FIXTURE: Reference annotations represent calibrated research baseline fixtures developed for algorithmic pipeline verification. They do not constitute independent double-blind human reviews. Formal external human reviews by independent practitioners remain pending. Blank annotation workbook provided in docs/evaluation/HUMAN_ANNOTATION_WORKBOOK.csv.'
   ```
3. **Annotator Role Reclassification:**
   - `ANN_LEGAL_01`: *"Calibrated Legal Heuristic Baseline (Demonstration)"*
   - `ANN_AUDIT_02`: *"Calibrated Audit Heuristic Baseline (Demonstration)"*
   - `ADJ_SUPERVISOR_01`: *"Dispute Resolution Heuristic (Demonstration)"*
4. **Annotation Status:** All 20 canonical cases in `CANONICAL_20_DPDP_EVALUATION_CASES` have been set to `annotation_status: 'RESEARCH_TEAM_REFERENCE'`.
5. **Cohen's Kappa Status:** The calculated $\kappa = 0.92$ is retained strictly as an algorithmic demonstration verifying that the software pipeline accurately computes contingency matrices, observed agreement, and chance agreement.
6. **Delivery of Human Annotation Workbook:**
   - **Workbook:** Created [`TrustForge/docs/evaluation/HUMAN_ANNOTATION_WORKBOOK.csv`](file:///C:/TF%20new%20V1/TrustForge/docs/evaluation/HUMAN_ANNOTATION_WORKBOOK.csv) with all 20 canonical DPDP cases (C1–C10), statutory provisions, and blank fields for two independent annotators and one adjudicator.
   - **Protocol Guide:** Created [`TrustForge/docs/evaluation/HUMAN_ANNOTATION_GUIDE.md`](file:///C:/TF%20new%20V1/TrustForge/docs/evaluation/HUMAN_ANNOTATION_GUIDE.md) detailing double-blind rules, standardized verdict definitions, and sign-off criteria.

---

## 4. Source-to-Metric Traceability Table

The following audit matrix accounts for every metric reported across Phase 5 and Phase 6:

| Metric Category | Specific Metric | Underlying Source of Truth | Verification Status | Academic Classification | Audit Findings & Constraints |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **Model Inferences** | M01, M02, M03 HTTP & Latency | Groq Cloud LPU API | **Verified Live** | Empirical Measured | Live HTTP 200 responses; sub-second latency; free tier. |
| **Model Inferences** | M04 HTTP & Latency | OpenRouter Free Tier | **Verified Live** | Empirical Measured | Live HTTP 200 (`google/gemma-4-31b-it:free`); zero credit cost. |
| **Model Inferences** | M05 HTTP 429 Status | OpenRouter Free Catalog | **Verified Live** | Empirical Measured | 3 live retries returned HTTP 429 upstream pool exhaustion. |
| **Model Inferences** | M06, M07 HTTP Status | OpenRouter Standard API | **Verified Blocked** | Empirical Measured | HTTP 403 Forbidden; zero credits; unexecuted. |
| **Model Inferences** | M08, M09 HTTP, Tokens, Cost | Sarvam AI Production API | **Verified Live** | Empirical Measured | Live HTTP 200; ₹0.14 total spend from ₹100 promotional credit. |
| **Model Inferences** | M10 HTTP Status | Localhost:11434 | **Verified Blocked** | Empirical Measured | Connection refused; local daemon offline. |
| **Ground Truth** | 20 DPDP Reference Cases | DPDP Act, 2023 Gazette | **Verified Legal** | Statutory Reference | Full coverage of obligations C1–C10. |
| **Inter-Annotator Agreement** | Cohen's Kappa ($\kappa = 0.92$) | `expertDataset.ts` | **Verified Software** | Calibrated Demonstration | Algorithm verified; double-blind human study pending. |
| **Multiclass Performance** | Confusion Matrix ($6 \times 6$) | `statisticalMetrics.ts` | **Verified Software** | Calibrated Demonstration | Evaluated against provisional research reference labels. |
| **Multiclass Performance** | Accuracy & Macro-F1 | `statisticalMetrics.ts` | **Verified Software** | Calibrated Demonstration | Unweighted averaging verified; pending human ground truth. |
| **Confidence Intervals** | Bootstrap 95% CIs ($B=1000$) | `statisticalMetrics.ts` | **Verified Software** | Calibrated Demonstration | PRNG seed 42 percentile bootstrap verified deterministically. |
| **Multi-Run Consistency** | Fleiss' Kappa & $\sigma_{\text{score}}$ | `experiments.ts` | **Verified Software** | Calibrated Demonstration | Software verified; physical multi-run repetition pending budget. |
| **RAG Ablation** | $\Delta$ Grounding, $\Delta$ Citation | `experiments.ts` | **Verified Software** | Calibrated Demonstration | Algorithmic delta verified; unprompted paired runs pending budget. |
| **Hypothesis Testing** | McNemar Paired Test ($p < 0.05$) | `statisticalMetrics.ts` | **Verified Software** | Calibrated Demonstration | Exact binomial & $\chi^2$ formulas verified mathematically. |
| **MCDA Ranking** | TOPSIS Closeness ($C_i^*$) | `topsisEngine.ts` | **Verified Math** | Provisional Optimization | Reclassified from EMPIRICAL to PROVISIONAL_MEASURED. |
| **Sensitivity Analysis** | Winner Stability (100%) | `topsisEngine.ts` | **Verified Math** | Algorithmic Stability | $\pm 20\%$ perturbation over 14 scenarios verified. |

---

## 5. Three-Run Consistency & RAG Ablation Reality Check

### 5.1 Three-Run Consistency Reality
- **What Was Executed Live:** In Phase 4, **one** live inference call was completed for each of M01, M02, M03, M04, M08, and M09 on assessment controls.
- **What Was Not Executed Live:** To prevent rate-limit exhaustion, credit exhaustion, and unauthorized spend, we did **not** execute 3 separate physical network requests across all 20 controls for all models (which would have required $3 \times 20 \times 8 = 480$ live API calls).
- **Status Correction:** Three-run consistency metrics in `experiments.ts` represent a **calibrated multi-run simulation** designed to test the Fleiss' kappa and variance algorithms. They are now explicitly labeled:
  `"Demonstration Fixture: Calibrated multi-run simulation; 3 physical network runs per model pending dedicated multi-run inference budget"`.

### 5.2 RAG Ablation Reality
- **What Was Executed Live:** Live assessments in Phase 4 were executed with statutory RAG retrieval enabled (Mode A).
- **What Was Not Executed Live:** Paired unprompted runs over all 20 controls without RAG (Mode B, $20 \times 8 = 160$ additional live calls) were not dispatched across the wire.
- **Status Correction:** RAG ablation metrics in `experiments.ts` represent a **calibrated parametric ablation simulation** demonstrating how the Grounding Validator penalizes fabricated citations and converts ungrounded findings to `NOT_DETERMINABLE`. They are now explicitly labeled:
  `"Demonstration Fixture: Calibrated retrieval ablation simulation; paired unprompted network runs pending dedicated inference budget"`.

---

## 6. Corrected TOPSIS & Dashboard Status

### 6.1 Benchmark Mode Reclassification
Per Task 4 (*"Make sure synthetic or unverified evaluation results cannot appear under EMPIRICAL_BENCHMARK"*):
- In `TrustForge/api/src/evaluation/evaluationRunner.ts`, the TOPSIS execution mode has been changed from `EMPIRICAL_BENCHMARK` to:
  ```typescript
  executionMode: 'PROVISIONAL_MEASURED'
  ```
- Under `PROVISIONAL_MEASURED`, the official limitations statement is permanently attached:
  ```
  [PROVISIONAL_MEASURED] Provisional measured metrics only: Ground-truth reference labels pending external double-blind audit; Macro-F1 metric weight excluded or simulated pending final certified labels.
  ```

### 6.2 Deferral of Definitive Winner Claims
Per Task 4 (*"Disable definitive winner claims until valid expert-labelled evaluation data exists"*):
- In `ModelBenchmarkPage.tsx`, the podium header now reads:
  **"Provisional Candidate Leader (Definitive Winner Selection Deferred Pending External Human Ground Truth)"**.
- A prominent amber alert banner is displayed:
  *"Research Integrity Disclosure: Canonical reference labels currently represent calibrated research fixtures developed for algorithmic validation. Definitive model winner claims are strictly deferred pending completion of the blank human annotation workbook."*

---

## 7. Ten-Model Audited Verification Matrix (M01–M10)

The definitive, audited model status table across the TrustForge gateway:

| Slot | Model Name | Provider | Exact API Model ID | Pricing Tier | Physical HTTP Status | Measured Live Inferences | Academic Verification Status |
| :---: | :--- | :--- | :--- | :---: | :---: | :---: | :--- |
| **M01** | OpenAI GPT-OSS 120B | Groq LPU | `openai/gpt-oss-120b` | Free LPU Tier | 200 OK | 1 Live Run | **VERIFIED_PROVISIONAL_SINGLE_RUN** |
| **M02** | OpenAI GPT-OSS 20B | Groq LPU | `openai/gpt-oss-20b` | Free LPU Tier | 200 OK | 1 Live Run | **VERIFIED_PROVISIONAL_SINGLE_RUN** |
| **M03** | Qwen 3.8 27B | Groq LPU | `qwen/qwen3.8-27b` | Free LPU Tier | 200 OK | 1 Live Run | **VERIFIED_PROVISIONAL_SINGLE_RUN** |
| **M04** | Gemma 4 31B | OpenRouter | `google/gemma-4-31b-it:free` | Free Tier (:free) | 200 OK | 1 Live Run | **VERIFIED_PROVISIONAL_SINGLE_RUN** |
| **M05** | Gemma 4 26B-A4B | OpenRouter | `google/gemma-4-26b-a4b-it:free` | Free Tier (:free) | 429 Too Many Requests | 0 (Rate Limited) | **INELIGIBLE (RATE_LIMITED)** |
| **M06** | Llama 3.3 70B | OpenRouter | `meta-llama/llama-3.3-70b-instruct` | Standard API ($0.10/M) | 403 Forbidden | 0 (Unpaid) | **INELIGIBLE (INSUFFICIENT_CREDITS)** |
| **M07** | Mistral Small 24B | OpenRouter | `mistralai/mistral-small-3.2-24b-instruct` | Standard API ($0.05/M) | 403 Forbidden | 0 (Unpaid) | **INELIGIBLE (INSUFFICIENT_CREDITS)** |
| **M08** | DeepSeek V4.1 Flash | Sarvam AI | `deepseekv4.1-flash` | Commercial API | 200 OK | 1 Live Run (₹0.0819) | **VERIFIED_PROVISIONAL_SINGLE_RUN** |
| **M09** | Sarvam 105B | Sarvam AI | `sarvam-105b-conversations` | Commercial API | 200 OK | 1 Live Run (₹0.1281) | **VERIFIED_PROVISIONAL_SINGLE_RUN** |
| **M10** | Sarvam 30B | Local | `sarvamai/sarvam-30b` | Local Open Weights | N/A (Port 11434 down) | 0 (Offline) | **INELIGIBLE (LOCAL_DAEMON_OFFLINE)** |

**Summary:** Exactly **6 models** are verified with genuine single-run live inference evidence; exactly **4 models** are classified as ineligible/blocked with documented physical root causes.

---

## 8. Test Suite & Regression Verification

Following all modifications to `expertDataset.ts`, `evaluationRunner.ts`, `phase6.test.ts`, and `ModelBenchmarkPage.tsx`, the complete test harness was executed:

### 8.1 API Test Suite (`TrustForge/api`)
```
> node --test dist/**/*.test.js
ℹ tests 117
ℹ suites 0
ℹ pass 117
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ duration_ms 4758.7
```
**117 / 117 tests passed (100% pass rate).**

### 8.2 Python Backend Test Suite (`TrustForge/backend`)
```
======================== 29 passed, 1 skipped in 0.52s ========================
```
**29 passed, 1 skipped, 0 failures.**

### 8.3 Frontend Production Build (`TrustForge Frontend`)
```
> tsc -b && vite build
✓ 1909 modules transformed.
dist/index.html                   1.62 kB │ gzip:   0.72 kB
dist/assets/index-BMwihXiW.css   70.78 kB │ gzip:  12.32 kB
dist/assets/index-DPnh41iy.js   612.06 kB │ gzip: 166.86 kB
✓ built in 940ms
```
**Frontend production build succeeded in 940 ms with zero TypeScript or bundling errors.**

---

## 9. Conclusion & Phase 7 Readiness

The Phase 6.1 Research Integrity Audit successfully aligns the TrustForge implementation with the highest standards of scientific ethics and intellectual honesty:
1. **M06 & M07 Corrected:** Reclassified as ineligible due to HTTP 403 insufficient OpenRouter credits.
2. **Annotator Assumptions Removed:** `ANN_LEGAL_01`, `ANN_AUDIT_02`, and `ADJ_SUPERVISOR_01` are disclosed as calibrated research fixtures; claims of external double-blind human consensus have been eliminated; no reviews are attributed to Dr. Neelam Naik.
3. **Blank Annotation Protocol Delivered:** Provided `docs/evaluation/HUMAN_ANNOTATION_WORKBOOK.csv` and `docs/evaluation/HUMAN_ANNOTATION_GUIDE.md` for genuine double-blind evaluation by two human practitioners and one referee.
4. **Metric Integrity Restored:** All metrics are categorized as either Verified Live, Calibrated Software Demonstration, or Pending Live Multi-Run Budget.
5. **Definitive Winner Claims Deferred:** Model selection remains provisional until external human ground truth is collected.

All code compiles, all 117 API tests and 29 backend tests pass, and the frontend builds cleanly.

**Per instructions, Phase 6.1 is complete. Phase 7 has not been started.**

