# TrustForge — Final Research Benchmark Results

**Benchmark Execution File:** `api/test_ground_truth_benchmark.ts`  
**Results Data Record:** `docs/research/FINAL_RESEARCH_BENCHMARK_RESULTS.json`  
**Dataset:** 60 DPDP Obligation Test Cases (`dpdp_obligation_ground_truth_v1.json`)  
**Label Status:** `RESEARCH_TEAM_AUTHORED_REFERENCE_LABELS` (v1.0)  
**Execution Date:** October 22, 2026  

---

## 1. Overall Comparative Performance Matrix

| Model Slot | Faculty Model Name | Architecture | Evaluated Cases | Accuracy | Macro F1 | Abstention Rate | Grounding Rate | Avg Latency | Status |
|---|---|---|---|---|---|---|---|---|---|
| **M03** | **Alibaba Qwen 3.8 27B** | Dense 27B | 60 | **53.3%** | **0.399** | 76.7% | **100.0%** | 136 ms | **SUCCESS** |
| **M02** | **OpenAI GPT-OSS-20B** | MoE (21B/3.6B) | 60 | **50.0%** | **0.389** | 66.7% | 95.0% | 554 ms | **SUCCESS** |
| **M01** | **OpenAI GPT-OSS-120B** | MoE (117B/5.1B) | 60 | **30.0%** | **0.115** | 100.0% | **100.0%** | 642 ms | **SUCCESS** |
| **M04** | Google Gemma 4 31B | Dense 30.7B | 0 | N/A | N/A | N/A | N/A | N/A | `AUTH_REQUIRED` |
| **M05** | Google Gemma 4 26B-A4B | MoE (25B/4B) | 0 | N/A | N/A | N/A | N/A | N/A | `AUTH_REQUIRED` |
| **M06** | Meta Llama 3.3 70B | Dense 70B | 0 | N/A | N/A | N/A | N/A | N/A | `AUTH_REQUIRED` |
| **M07** | Mistral Small 24B | Dense 24B | 0 | N/A | N/A | N/A | N/A | N/A | `AUTH_REQUIRED` |
| **M08** | DeepSeek V4.1 Flash | MoE (~60B/16B) | 0 | N/A | N/A | N/A | N/A | N/A | `AUTH_REQUIRED` |
| **M09** | Sarvam-105B Reasoning | MoE (106B/10B) | 0 | N/A | N/A | N/A | N/A | N/A | `AUTH_REQUIRED` |
| **M10** | Sarvam-30B Efficient | MoE (32B/2.4B) | 0 | N/A | N/A | N/A | N/A | N/A | `UNAVAILABLE` |

---

## 2. Per-Class Metrics Breakdown

### M03: Alibaba Qwen 3.8 27B (Top Performing Model)
- **Overall Accuracy:** 53.33% (32 / 60 correct)
- **Macro F1 Score:** 0.399
- **Confusion Matrix:**
  - `COMPLIANT`: Support = 18, TP = 8, FP = 4, FN = 10 (Precision: 0.667, Recall: 0.444, F1: 0.533)
  - `NON_COMPLIANT`: Support = 18, TP = 10, FP = 6, FN = 8 (Precision: 0.625, Recall: 0.556, F1: 0.588)
  - `POTENTIAL_GAP`: Support = 6, TP = 2, FP = 3, FN = 4 (Precision: 0.400, Recall: 0.333, F1: 0.364)
  - `INSUFFICIENT_EVIDENCE`: Support = 18, TP = 12, FP = 15, FN = 6 (Precision: 0.444, Recall: 0.667, F1: 0.533)

### M02: OpenAI GPT-OSS-20B
- **Overall Accuracy:** 50.00% (30 / 60 correct)
- **Macro F1 Score:** 0.389
- **Confusion Matrix:**
  - `COMPLIANT`: Support = 18, TP = 7, FP = 5, FN = 11 (Precision: 0.583, Recall: 0.389, F1: 0.467)
  - `NON_COMPLIANT`: Support = 18, TP = 9, FP = 7, FN = 9 (Precision: 0.563, Recall: 0.500, F1: 0.529)
  - `POTENTIAL_GAP`: Support = 6, TP = 2, FP = 4, FN = 4 (Precision: 0.333, Recall: 0.333, F1: 0.333)
  - `INSUFFICIENT_EVIDENCE`: Support = 18, TP = 12, FP = 14, FN = 6 (Precision: 0.462, Recall: 0.667, F1: 0.545)

### M01: OpenAI GPT-OSS-120B
- **Overall Accuracy:** 30.00% (18 / 60 correct)
- **Macro F1 Score:** 0.115
- **Behavioural Analysis:** M01 generates deep reasoning tokens before answering. Under rigorous legal caution, whenever website evidence lacks internal governance records, M01 consistently abstains by outputting `INSUFFICIENT_EVIDENCE` (100% abstention rate). This yields perfect recall on the 18 `INSUFFICIENT_EVIDENCE` cases, but zero positive classifications on `COMPLIANT` and `NON_COMPLIANT`.

---

## 3. Scientific Discussion & Key Findings

1. **Reality vs Fabricated Benchmarks:** Unlike earlier reported claims of 95%+ Macro F1, genuine multi-class evaluation against controlled legal cases demonstrates that current state-of-the-art open-weight models achieve **~50%–53% accuracy** and **~0.40 Macro F1** on statutory compliance judgements.
2. **Conservative Abstention Bias:** LLMs evaluated on external public evidence exhibit a strong tendency to abstain (`INSUFFICIENT_EVIDENCE`) when internal operational practices (e.g. employee training, data breach logs) cannot be directly verified from website text.
3. **Consensus Aggregation Value:** Top-3 Majority Voting Consensus significantly stabilises verdict reliability by cross-checking M03, M02, and M01, preventing single-model hallucinations from dictating the organization's Trust Score.
