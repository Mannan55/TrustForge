# TrustForge — Research Implementation Roadmap (Phases 1–7)

**Document Reference:** `docs/research-implementation/03_IMPLEMENTATION_ROADMAP.md`  
**Date:** October 28, 2026  
**Project:** TrustForge DPDP Compliance Assessment Platform  
**Supervisor Guideline:** Dr. Neelam Naik ("Research method-given to Mannan.docx")  
**Engineering Policy:** Non-destructive evolution. Preserve existing features. Zero fabrication.

---

## Roadmap Overview

```
Phase 1: Codebase Audit & Baseline Stabilization (Current - Complete)
   │
   ▼
Phase 2: Research-Aligned Trust Score Engine (C1–C10, W1/W2, Critical Caps, 6-Pillar UI Adapter)
   │
   ▼
Phase 3: RAG Corpus, Hybrid Retrieval ($k=5$) & Strict Grounding Enforcement
   │
   ▼
Phase 4: Ten-LLM Standardized Execution & Multi-Model Result Persistence
   │
   ▼
Phase 5: TOPSIS Multi-Criteria Model Selection & Sensitivity Engine
   │
   ▼
Phase 6: Statistical Evaluation (Cohen's κ, Fleiss' κ, Bootstrap CI, McNemar's, Ablations)
   │
   ▼
Phase 7: End-to-End System Validation, Research Deliverables & Demonstration Readiness
```

---

## Phase 1: Existing Codebase Audit & Baseline Stabilization

- **Status:** **COMPLETE (Current Milestone)**
- **Objective:** Establish an accurate, unvarnished technical audit of the existing repository, verify active builds and test suites, document implementation gaps against Dr. Neelam Naik's methodology, and produce the required foundational planning documents without modifying application source code.
- **Key Deliverables:**
  - `docs/research-implementation/01_CURRENT_SYSTEM_AUDIT.md`
  - `docs/research-implementation/02_FACULTY_METHODOLOGY_GAP_ANALYSIS.md`
  - `docs/research-implementation/03_IMPLEMENTATION_ROADMAP.md`
  - `docs/research-implementation/04_RESEARCH_VALIDATION_REQUIREMENTS.md`
  - `docs/research-implementation/05_PHASE_2_TECHNICAL_DESIGN.md`
- **Acceptance Criteria:**
  - Zero application code files modified during audit.
  - All existing automated tests run and verified (Node: 8/8 pass; Python: 29 pass).
  - Frontend (`vite build`) and API (`tsc`) builds verified passing with 0 errors.

---

## Phase 2: Research-Aligned Trust Score Engine (C1–C10)

- **Objective:** Implement the faculty-mandated C1–C10 obligation taxonomy, deterministic scoring formula ($s_i \in \{1, 0.5, 0\}$), weight schemes W1 and W2, critical-failure cap ($\min(TS, 40)$), and a bidirectional adapter mapping C1–C10 to the existing 6 UI dashboard pillars.
- **Existing Files to Modify:**
  - `api/src/scoring/trustScoreEngine.ts` — Implement C1–C10 calculation, W1/W2 weights, gating caps, and UI adapter.
  - `api/src/types/index.ts` — Add `ComplianceCategoryCode`, `ObligationVerdict`, `ScoringWeightScheme`, and `C10TrustScoreResult` interfaces.
  - `api/src/routes/trustScore.ts` — Support C1–C10 score calculation requests alongside legacy formats.
  - `api/src/tests/unit.test.ts` — Add comprehensive unit tests covering all formula edge cases.
- **New Files Required:**
  - `api/src/scoring/c10Taxonomy.ts` — Authoritative definitions of C1–C10 obligations, statutory grounds, and evidence requirements.
  - `api/src/scoring/pillarMappingAdapter.ts` — Lossless projection of C1–C10 scores into the 6 UI pillars (`privacy`, `security`, `transparency`, `governance`, `lifecycle`, `rights`).
- **Functional Requirements:**
  - Support C1–C10 obligations: Notice (C1), Consent (C2), Purpose (C3), Security (C4), Breach (C5), Retention (C6), DPO (C7), Rights (C8), Children (C9), Third Parties (C10).
  - Verdict scoring: Compliant = 1.0, Partial = 0.5, Non-compliant = 0.0.
  - Exclude Not Determinable / Not Applicable ($A_i = 0$) from denominator and renormalize weights:
    $$\tilde{w}_k = \frac{w_k}{\sum_{j: |O_j \cap A| > 0} w_j}, \quad TS = 100 \sum_{k=1}^{10} \tilde{w}_k \frac{\sum_{i \in O_k} A_i s_i}{\sum_{i \in O_k} A_i}$$
  - Implement Weight Scheme W1: Penalty-proportional (C4=0.25, C5=0.20, C9=0.20, others 0.05 each; ₹1,000 cr ceiling sum).
  - Implement Weight Scheme W2: Equal weights (0.10 each) and configurable AHP weights.
  - Critical-failure cap: If `has_https === false` or `has_privacy_notice === false`, enforce $TS = \min(TS, 40)$.
  - Posture bands: 0–39 Low, 40–59 Moderate, 60–79 Good, 80–100 Strong.
  - Adapter converts C1–C10 into 6-pillar format so existing Frontend views render without breaking.
- **Dependencies:** Node.js, TypeScript. No external libraries required.
- **Unit & Integration Tests:**
  - Test 1: All-Compliant returns 100 on both W1 and W2.
  - Test 2: All-Non-compliant returns 0.
  - Test 3: All-Not-Applicable returns `Not Scorable` with `null` score.
  - Test 4: Renormalization math matches Protiviti / faculty formulation exactly when C9 is N/A.
  - Test 5: Critical failure cap forces $TS \le 40$ even when remaining categories are fully compliant.
  - Test 6: UI adapter generates valid 6-pillar scores matching previous frontend contract.
- **Measurable Acceptance Criteria:**
  - Mathematical parity with Dr. Neelam Naik's formula verified across 10 deterministic test vectors.
  - Zero regression in existing frontend dashboard rendering.
- **Risks & Limitations:**
  - Risk: Modifying score scale could alter historical assessment records.
  - Mitigation: Maintain backward compatibility via versioned API responses (`format: "c10" | "legacy_pillars"`).

---

## Phase 3: RAG Corpus, Hybrid Retrieval ($k=5$) & Strict Grounding Enforcement

- **Objective:** Enrich the 83-chunk DPDP corpus with mandatory metadata fields, configure the default retrieval depth to $k=5$, and enforce the two-tier grounding rule (rewriting ungrounded verdicts to `Not determinable`).
- **Existing Files to Modify:**
  - `backend/knowledge/authoritative_corpus.json` — Add `obligation_category` (C1–C10) and `penalty_reference` to each chunk.
  - `api/src/rag/hybridRAG.ts` — Update default retrieval cutoff to $k=5$; support runtime $k \in \{3, 5, 8\}$ for ablations.
  - `api/src/validator/groundingValidator.ts` — Implement strict two-tier verification:
    1. Cited provision must exist in the retrieved candidate passages $C$.
    2. Quoted evidence must exist verbatim/fuzzy in crawled evidence $E$.
  - `api/src/routes/assessments.ts` — Integrate validator mutation: failed verdicts are changed to `Not determinable` and excluded from Trust Score calculation ($A_i = 0$).
- **New Files Required:**
  - `scripts/enrich_corpus_metadata.py` — Automated script to validate and map C1–C10 and penalty references across all 83 chunks.
  - `api/src/tests/groundingEnforcement.test.ts` — Tests verifying that ungrounded verdicts are strictly converted and excluded.
- **Functional Requirements:**
  - Chunks contain all 5 faculty metadata fields: source document, section number, rule number, obligation category (C1–C10), penalty reference.
  - Hybrid RRF retriever returns top 5 provisions by default.
  - Grounding validator logs exact hallucination reasons and reports per-model hallucination rate:
    $$\text{Hallucination Rate} = \frac{\text{Rejected Verdicts}}{\text{Total Evaluated Verdicts}} \times 100\%$$
- **Dependencies:** Supabase `pgvector`, Playwright, TypeScript.
- **Unit & Integration Tests:**
  - Test hallucinated clause rejection: Model cites "Section 99" -> Verdict mutated to `Not determinable`.
  - Test fabricated quote rejection: Model cites real Section 5 but fabricates text -> Mutated to `Not determinable`.
  - Test verified valid verdict: Authentic clause + real quote -> Verdict accepted and scored.
- **Measurable Acceptance Criteria:**
  - 100% of ungrounded verdicts prevented from contributing to Trust Score.
  - Retrieval hit rate at $k=5$ maintains $\ge 84\%$ on canonical test queries.
- **Risks & Limitations:**
  - Higher $k$ slightly increases prompt token count; batch execution mitigates overhead.

---

## Phase 4: Ten-LLM Standardized Execution & Multi-Model Persistence

- **Objective:** Align the LLM evaluation gateway to use standardized prompts and output schemas structured around C1–C10 obligations, executing all 10 faculty-defined model slots honestly and concurrently.
- **Existing Files to Modify:**
  - `api/src/gateway/llmGateway.ts` — Update prompts and JSON schemas to use faculty keys (`verdict`, `cited_clause`, `evidence_quote`, `rationale`).
  - `api/src/routes/benchmark.ts` — Expose C1–C10 evaluation results, provider latency, token metrics, and operational status.
  - `TrustForge Frontend/src/pages/app/ModelBenchmarkPage.tsx` — Display C1–C10 findings matrix across models.
- **New Files Required:**
  - `api/src/gateway/promptTemplates.ts` — Standardized, frozen prompt template used across all 10 candidate models.
- **Functional Requirements:**
  - Prompt, retrieved passages ($k=5$), and JSON output schema must be identical across all 10 models.
  - Concurrently dispatch models using `Promise.allSettled`.
  - Honest status logging: Record exact provider model ID, token usage, latency (ms), and authentic error states (`AUTH_REQUIRED`, `UNAVAILABLE`) for unconfigured slots. Zero fabrication.
  - Persist multi-model findings and per-model Trust Scores in Supabase PostgreSQL and local durable cache.
- **Dependencies:** Groq SDK / OpenAI-compatible API, OpenRouter API, Sarvam AI API.
- **Unit & Integration Tests:**
  - Test schema parsing: Valid JSON parsed correctly into typed finding.
  - Test error resilience: One failing model does not crash the 9 other model evaluations.
  - Test concurrency speedup: Verify overlapping execution intervals.
- **Measurable Acceptance Criteria:**
  - Context hash identical across all 10 model dispatches for a given website.
  - Honest transparency: live status indicators accurately distinguish active vs credential-pending models.

---

## Phase 5: TOPSIS Multi-Criteria Model Selection Engine

- **Objective:** Implement the Technique for Order Preference by Similarity to Ideal Solution (TOPSIS) to rank all candidate LLMs based on multi-dimensional criteria, including weight sensitivity analysis ($\pm 20\%$).
- **Existing Files to Modify:**
  - `api/src/scoring/trustScoreEngine.ts` — Replace heuristic ranking with TOPSIS-recommended best model selection.
  - `TrustForge Frontend/src/pages/app/ModelBenchmarkPage.tsx` — Visualize TOPSIS score rankings, radar comparison, and sensitivity ranges.
- **New Files Required:**
  - `api/src/evaluation/topsisRanking.ts` — Core TOPSIS mathematical engine:
    - Vector normalization of decision matrix
    - Weighted normalized matrix computation
    - Determination of Ideal Best ($A^+$) and Ideal Worst ($A^-$) solutions
    - Euclidean distance calculation ($S_i^+, S_i^-$)
    - Relative closeness score calculation ($C_i^* = \frac{S_i^-}{S_i^+ + S_i^-}$)
    - Sensitivity analysis perturbations ($\pm 20\%$)
  - `api/src/tests/topsis.test.ts` — Verification against established numerical examples.
- **Criteria Evaluated in TOPSIS:**
  1. Verdict Macro-F1 (Benefit criterion) — Weight: 0.30
  2. Grounding Rate (Benefit criterion) — Weight: 0.25
  3. Consistency / Fleiss' $\kappa$ (Benefit criterion) — Weight: 0.15
  4. Median Latency (Cost criterion) — Weight: 0.15
  5. Cost per Website in INR (Cost criterion) — Weight: 0.15
- **Unit & Integration Tests:**
  - Test with known benchmark matrix: verify closeness scores $C_i^* \in [0, 1]$.
  - Test sensitivity analysis: perturb each weight by $\pm 20\%$, re-normalize, and verify ranking stability.
- **Measurable Acceptance Criteria:**
  - TOPSIS engine deterministically identifies the optimal sovereign/frugal LLM.
  - Sensitivity analysis confirms whether the top-ranked model remains stable under $\pm 20\%$ weight variation.

---

## Phase 6: Statistical Evaluation, Expert Labels & Experimental Benchmarking

- **Objective:** Implement formal scientific evaluation routines: expert ground-truth curation protocol, inter-annotator Cohen's kappa, classification Macro-F1, repeat-run Fleiss' kappa, bootstrap confidence intervals, McNemar's paired test, and RAG ablation experiments.
- **Existing Files to Modify:**
  - `docs/research/evaluation/datasets/dpdp_obligation_ground_truth_v1.json` — Structure 60+ ground-truth cases with 2 annotator fields + adjudication.
  - `api/test_ground_truth_benchmark.ts` — Update benchmark runner to compute full statistical metrics.
- **New Files Required:**
  - `api/src/evaluation/statisticalMetrics.ts` — TypeScript statistical library:
    - Cohen's kappa ($\kappa$) for inter-annotator agreement
    - Fleiss' kappa for multi-run consistency (3 runs per model)
    - Macro-F1, Precision, Recall, and Accuracy
    - Spearman's rank correlation ($\rho$) between model Trust Scores and Expert Trust Scores
    - Non-parametric Bootstrap Confidence Intervals (1,000 resamples)
    - McNemar's test ($\chi^2 = \frac{(|b - c| - 1)^2}{b + c}$) for paired model comparison
  - `scripts/run_rag_ablation_experiment.ts` — CLI to execute RAG vs No-RAG ablation across models and output comparison tables.
- **Functional Requirements:**
  - Calculate inter-annotator agreement: target $\kappa \ge 0.70$.
  - Run 3 repeated inferences per active model to measure consistency.
  - Execute RAG ablation: compare Macro-F1 and grounding rate with retrieval vs zero-retrieval.
  - Calculate 95% bootstrap confidence intervals for all primary metrics.
- **Dependencies:** Node.js / Python scientific libraries (`scipy`, `numpy`).
- **Measurable Acceptance Criteria:**
  - Statistical significance of RAG performance boost validated ($p < 0.05$ on McNemar's test).
  - All empirical results exported to structured JSON and CSV for thesis publication.

---

## Phase 7: Integration Tests, Research Outputs & Final Validation

- **Objective:** Perform complete end-to-end regression testing, generate camera-ready research figures and data tables, ensure seamless frontend-backend alignment, and verify production deployment readiness.
- **Existing Files to Modify:**
  - `api/test_e2e_assessment.ts` — Update full E2E assessment test to validate the complete C1–C10 -> RAG -> 10-LLM -> Grounding -> TOPSIS lifecycle.
  - `TrustForge Frontend/src/pages/app/ReportsPage.tsx` — Add research evaluation summary export.
- **New Files Required:**
  - `scripts/generate_research_tables.py` — Formats empirical results into LaTeX / Markdown tables matching thesis sections 5–7.
  - `docs/research-implementation/FINAL_RESEARCH_VALIDATION_REPORT.md` — Final sign-off report for Dr. Neelam Naik.
- **Acceptance Criteria:**
  - Complete E2E assessment test runs from website URL to PDF report with exit code 0.
  - Frontend builds and runs without console errors.
  - Zero simulated or synthetic benchmarks: all reported metrics clearly cite real executions or disclose unauthenticated statuses.
  - Full adherence to Dr. Neelam Naik's research methodology achieved.
