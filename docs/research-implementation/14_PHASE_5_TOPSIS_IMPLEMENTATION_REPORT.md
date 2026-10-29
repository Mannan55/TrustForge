# TrustForge — Phase 5 Implementation Report: Research-Aligned TOPSIS Model Ranking, Sensitivity Analysis & Dashboard Integration

**Project:** TrustForge — Evidence-Grounded RAG Framework for DPDP Compliance Assessment  
**Workspace:** `C:\TF new V1\TrustForge`  
**Faculty Supervisor:** Dr. Neelam Naik  
**Author:** AI Systems Architect, Senior Full-Stack Engineer & AI Researcher  
**Date:** October 28, 2026  
**Implementation Phase:** Phase 5 (Multi-Criteria LLM Selection via TOPSIS)  
**Algorithm Version:** `5.0.0-research`  
**Current Test Status:** 103/103 API Tests Passing (100%) | 29/29 Pytest Tests Passing | Frontend Production Build Verified (575ms)

---

## 1. Executive Summary & Faculty Alignment

Per Section 4.2.3 of Dr. Neelam Naik's research methodology (*"An Evidence-Grounded RAG Framework for Digital Personal Data Protection Compliance Assessment"*), model selection for high-stakes regulatory compliance auditing cannot rely on naive unweighted heuristics or isolated accuracy scores. Instead, candidate foundation models must be ranked using **Multi-Criteria Decision Analysis (MCDA)** via the **Technique for Order Preference by Similarity to Ideal Solution (TOPSIS)** (Hwang & Yoon, 1981).

Phase 5 delivers a complete, mathematically verified, and fully integrated TOPSIS engine. The implementation strictly adheres to faculty research guidelines:
1. **Mathematical TOPSIS Engine:** Developed in `api/src/research/topsisEngine.ts` with vector normalization, weighting, positive/negative ideal solution determination, Euclidean distance computation, and relative closeness calculation.
2. **Ten Canonical Evaluation Criteria:** Registered with explicit optimization directions (BENEFIT vs. COST), measurement units, and descriptions.
3. **Collinearity Protection & Configurable Weighting Profiles:** A primary 7-criterion weighting profile (summing strictly to 1.00) eliminates collinear distortions between raw accuracy and Macro-F1, while alternative profiles support legal fidelity, sovereign frugality, and provisional live audits.
4. **Scientific Model Eligibility Filtering:** Models lacking verified live credentials or returning provider errors are marked ineligible (rank `-1`), preserving candidate slots without data fabrication.
5. **$\pm 20\%$ Weight Sensitivity Analysis:** Comprehensive stability evaluation evaluating winner invariance and Spearman rank correlation ($\rho$) across 14 perturbation scenarios.
6. **Top-3 Majority Voting Consensus Bridge:** The consensus voting engine now dynamically selects the top 3 models identified by TOPSIS, with safe fallback when empirical data is incomplete.
7. **Durable Persistence & API Integration:** Complete persistence across `DurableStore` (`topsis_runs.json`) and Supabase PostgreSQL (`topsis_runs`), exposed via REST endpoints at `/api/benchmark/topsis/*`.
8. **Frontend Dashboard Integration:** The `ModelBenchmarkPage.tsx` interface now renders real-time TOPSIS podium rankings, closeness scores, sensitivity tables, and research limitations notices.

---

## 2. Mathematical TOPSIS Algorithm & Implementation

The TOPSIS implementation in `api/src/research/topsisEngine.ts` executes the canonical 6-step mathematical optimization process:

### Step 1: Decision Matrix Construction & Vector Normalization
Given an $m \times n$ decision matrix $X$ where $x_{ij}$ represents the performance value of candidate model $i$ on criterion $j$:

$$r_{ij} = \frac{x_{ij}}{\sqrt{\sum_{k=1}^m x_{kj}^2}}$$

**Degeneracy Handling:**
- **Zero-Sum-of-Squares Guard:** If $\sum_{k=1}^m x_{kj}^2 = 0$ (e.g. all models incur zero cost), $r_{ij} = 0.0$ to prevent division-by-zero exceptions.
- **Zero-Variance Guard:** If all models exhibit identical performance on a criterion ($x_{1j} = x_{2j} = \dots = x_{mj}$), each entry normalizes uniformly to $r_{ij} = \frac{1}{\sqrt{m}}$.

### Step 2: Weight Vector Validation & Renormalization
Given a user-specified or profile weight vector $W = [w_1, w_2, \dots, w_n]$:
- Negative weights ($w_j < 0$) and non-finite values (`NaN`, `Infinity`) are rejected with explicit `Error` exceptions.
- Weights are validated and normalized to ensure:

$$\sum_{j=1}^n w_j = 1.00$$

### Step 3: Weighted Normalized Decision Matrix
The weighted normalized decision matrix $V = (v_{ij})$ is computed as:

$$v_{ij} = w_j \cdot r_{ij}$$

### Step 4: Determination of Ideal and Anti-Ideal Solutions
For benefit criteria $J_B$ (where higher values indicate superior performance) and cost criteria $J_C$ (where lower values indicate superior performance):

$$\text{Positive Ideal Solution } A_j^+ = \begin{cases} \max_i v_{ij} & \text{if } j \in J_B \\ \min_i v_{ij} & \text{if } j \in J_C \end{cases}$$

$$\text{Negative Ideal (Anti-Ideal) Solution } A_j^- = \begin{cases} \min_i v_{ij} & \text{if } j \in J_B \\ \max_i v_{ij} & \text{if } j \in J_C \end{cases}$$

### Step 5: Euclidean Distances to Ideal Solutions
The separation of each candidate model from the positive ideal and negative ideal solutions is computed using the Euclidean distance:

$$D_i^+ = \sqrt{\sum_{j=1}^n (v_{ij} - A_j^+)^2}$$

$$D_i^- = \sqrt{\sum_{j=1}^n (v_{ij} - A_j^-)^2}$$

### Step 6: Relative Closeness to the Ideal Solution
The relative closeness coefficient $C_i^*$ for model $i$ is calculated as:

$$C_i^* = \frac{D_i^-}{D_i^+ + D_i^-}, \quad C_i^* \in [0, 1]$$

- $C_i^* = 1.0$ if model $i$ coincides with the positive ideal solution.
- $C_i^* = 0.0$ if model $i$ coincides with the negative anti-ideal solution.
- **Degenerate Distance Guard:** If $D_i^+ + D_i^- \le 10^{-12}$ (e.g. single candidate model or all models perform identically), $C_i^* = 1.0$ for $m=1$ and $C_i^* = 0.5$ for $m > 1$.

### Step 7: Deterministic Preference Ranking & Tie-Breaking
Models are ordered in strict descending order of $C_i^*$. When two models produce identical closeness coefficients within $10^{-6}$:
1. The secondary tie-breaking criterion (default: `citation_precision`) is evaluated.
2. If still tied, models are ordered deterministically by ascending alphabetical `model_id` (`M01` < `M02`).

---

## 3. Ten Canonical Criteria & Weighting Profiles

### Canonical Criteria Catalog

| Criterion ID | Criterion Name | Direction | Primary Profile Weight | Unit | Collinearity Status |
|---|---|---|---|---|---|
| `macro_f1` | Macro-F1 Score | **BENEFIT** | **0.30** | Score [0–100] | Active Primary |
| `citation_precision` | Statutory Citation Precision | **BENEFIT** | **0.15** | % | Active Primary |
| `evidence_faithfulness` | Evidence Faithfulness | **BENEFIT** | **0.15** | % | Active Primary |
| `consistency` | Inter-Run Consistency | **BENEFIT** | **0.10** | Score [0–100] | Active Primary |
| `median_latency` | Median Latency | **COST** | **0.10** | Milliseconds | Active Primary |
| `cost_inr` | Estimated Inference Cost | **COST** | **0.10** | INR (₹) | Active Primary |
| `deployment_feasibility` | Sovereign Deployability | **BENEFIT** | **0.10** | Feasibility [0–100] | Active Primary |
| `accuracy` | Simple Percentage Accuracy | BENEFIT | 0.00 | % | Excluded (collinear with Macro-F1) |
| `grounding_rate` | Grounding Verification Rate | BENEFIT | 0.00 | % | Excluded (collinear with Citation Precision) |
| `token_usage` | Average Token Consumption | COST | 0.00 | Tokens | Excluded (collinear with Latency/Cost) |

### Registered Weighting Profiles

1. **`PRIMARY_FACULTY_PROPOSED` (Default):** Balanced research profile ($0.30, 0.15, 0.15, 0.10, 0.10, 0.10, 0.10$). Total weight = 1.00.
2. **`PROVISIONAL_MEASURED`:** Optimized for live audits where reference ground-truth labels are pending ($F_1 = 0.00$, Citation Precision = 0.25, Faithfulness = 0.25, Grounding Rate = 0.15, Latency = 0.15, Cost = 0.05, Feasibility = 0.10, Consistency = 0.05).
3. **`LEGAL_FIDELITY`:** Maximizes statutory accuracy ($F_1 = 0.35$, Citation Precision = 0.25, Faithfulness = 0.20, Grounding Rate = 0.10).
4. **`SOVEREIGN_FRUGAL`:** Emphasizes India-hosted LPU inference and minimal INR expenditure (Cost = 0.25, Latency = 0.20, Feasibility = 0.15, $F_1 = 0.15$, Citations = 0.10, Faithfulness = 0.10, Consistency = 0.05).
5. **`EQUAL_WEIGHTS`:** Neutral mathematical baseline assigning $w_j = \frac{1}{7} \approx 0.142857$ across the seven primary dimensions.

---

## 4. Sensitivity Analysis ($\pm 20\%$ Weight Perturbation)

To evaluate the mathematical robustness of the model ranking, the engine performs $\pm 20\%$ perturbation analysis across each active criterion $j \in \{1, \dots, k\}$:

1. **Perturbation Factor:** $w_j' = w_j \cdot (1 \pm 0.20)$.
2. **Proportional Renormalization:** The remaining $k-1$ weights are adjusted proportionally such that $\sum_{l=1}^k w_l' = 1.00$:

$$w_l' = w_l \cdot \frac{1.0 - w_j'}{1.0 - w_j}, \quad \forall l \neq j$$

3. **Winner Stability Index:** Across all $2k = 14$ perturbation scenarios, the winner stability percentage is defined as:

$$\text{Stability} = \frac{\sum_{s=1}^{14} \mathbb{I}(\text{Winner}_s = \text{Winner}_{\text{baseline}})}{14} \times 100\%$$

If $\text{Stability} \ge 80\%$, the winner is certified as **STABLE**; otherwise, it is flagged as **SENSITIVE**.
4. **Spearman Rank Correlation Coefficient ($\rho$):** For each scenario, rank concordance across all eligible models is computed:

$$\rho = 1 - \frac{6 \sum_{i=1}^m d_i^2}{m(m^2 - 1)}$$

---

## 5. Model Eligibility & Scientific Transparency Policy

In strict accordance with faculty research ethics, TrustForge enforces clear boundary separation across evaluation modes:

```mermaid
flowchart TD
    A[Benchmark Invocations] --> B{Model Slot State}
    B -- Live Execution Success --> C[Eligible Candidate Matrix]
    B -- Unconfigured / Rate-Limited / Offline --> D[Ineligible Slot: Rank -1]
    D --> E[Explicit Reason Preserved]
    
    C --> F{Expert Ground-Truth Available?}
    F -- Yes --> G[EMPIRICAL_BENCHMARK Mode]
    F -- Pending Audit --> H[PROVISIONAL_MEASURED Mode]
    
    I[Reference Validation Fixture] --> J[SYNTHETIC_DEMONSTRATION Mode]
    
    G --> K[TOPSIS Optimization Engine]
    H --> K
    J --> K
    
    K --> L[Ranked Output + Sensitivity + Provenance]
```

### Execution Modes
1. **`EMPIRICAL_BENCHMARK`:** Used only when models are executed live against expert double-annotated ground-truth labels.
2. **`PROVISIONAL_MEASURED`:** Used for live scans when ground-truth labels are pending external audit. Macro-F1 is set to 0.00 weight, and rankings rely on verified citation precision, evidence faithfulness, latency, and cost.
3. **`SYNTHETIC_DEMONSTRATION`:** Evaluated on the reference fixture (`SYNTHETIC_RESEARCH_BENCHMARK_FIXTURE`) representing all 10 faculty models for algorithm verification.

Ineligible models (e.g. M05 when rate-limited, M10 when Ollama is offline) are assigned `rank = -1` and `closeness = 0.00`, accompanied by an explicit ineligibility reason string. **Metrics are never fabricated for unavailable models.**

---

## 6. System Architecture & Persistence

### 1. Durable Store Integration (`durableStore.ts`)
- Added internal map: `private topsisRuns: Map<string, any>`.
- Added persistence file: `api/data/topsis_runs.json`.
- Methods implemented: `setTOPSISRun()`, `getTOPSISRun()`, `listTOPSISRuns()`.

### 2. Supabase Repository Layer (`repository.ts` & `supabaseClient.ts`)
- Added `TOPSISRepository` class supporting upsert and retrieval against Supabase `topsis_runs` table with automatic fallback to `durableStore`.
- Exposed through unified client: `db.saveTOPSISRun()`, `db.getTOPSISRun()`, `db.listTOPSISRuns()`.

### 3. REST API Routes (`routes/benchmark.ts`)
- `GET /api/benchmark/topsis/criteria`: Returns canonical criteria catalog and profile metadata.
- `GET /api/benchmark/topsis/profiles`: Returns complete profile dictionary.
- `GET /api/benchmark/topsis/latest`: Retrieves latest persisted TOPSIS run.
- `GET /api/benchmark/topsis/list`: Returns all historical runs.
- `GET /api/benchmark/topsis/:runId`: Retrieves specific run by ID.
- `GET /api/benchmark/topsis/:runId/sensitivity`: Returns sensitivity analysis details.
- `POST /api/benchmark/topsis/run`: Executes on-demand TOPSIS ranking across live benchmark data or custom metrics.

### 4. Consensus Engine Linkage (`routes/assessments.ts` & `routes/benchmark.ts`)
When $\ge 3$ eligible models are evaluated, the Top-3 Majority Voting consensus engine now selects the **top 3 ranked models from TOPSIS** rather than a simple 2-variable heuristic. If fewer than 3 models are eligible, the system safely falls back with explicit logging.

### 5. Frontend Dashboard Integration (`ModelBenchmarkPage.tsx`)
- Interactive profile switcher with instant re-computation.
- Gold/Silver/Bronze podium for the top 3 optimal models.
- Closeness ranking table with visual closeness score bars ($C_i^*$), $D_i^+$, $D_i^-$, and eligibility status.
- Sensitivity analysis matrix displaying stability index and scenario rank deltas.
- Research transparency banner detailing methodology and limitations.

---

## 7. Verification & Test Suite Summary

### Phase 5 Test Suite (`api/src/tests/phase5.test.ts`)
Covering all 25 mandatory mathematical, algorithmic, persistence, and regression scenarios:

| # | Test Scenario | Verified Behavior | Status |
|---|---|---|---|
| 1 | Vector Normalization | $r_{ij} = x_{ij} / \sqrt{\sum x^2}$ calculated accurately | **PASS** |
| 2 | Zero-Vector Guard | Zero column normalizes to 0 without division by zero | **PASS** |
| 3 | Zero-Variance Guard | Constant column normalizes uniformly ($1/\sqrt{m}$) | **PASS** |
| 4 | Weight Validation | Weights validated and renormalized so $\sum w_j = 1.00$ | **PASS** |
| 5 | Weight Rejection | Negative and non-finite weights rejected with explicit errors | **PASS** |
| 6 | Weighted Matrix | $v_{ij} = w_j \cdot r_{ij}$ correctly applies weights | **PASS** |
| 7 | Benefit Ideal Solutions | $A^+ = \max(v_{ij})$ and $A^- = \min(v_{ij})$ | **PASS** |
| 8 | Cost Ideal Solutions | $A^+ = \min(v_{ij})$ and $A^- = \max(v_{ij})$ | **PASS** |
| 9 | Euclidean Distances | $D_i^+$ and $D_i^-$ computed with mathematical fidelity | **PASS** |
| 10 | Relative Closeness | $C_i^* = D_i^- / (D_i^+ + D_i^-)$ bounded in $[0, 1]$ | **PASS** |
| 11 | Degenerate Distances | $D^+ + D^- = 0$ returns neutral 0.5 or 1.0 without `NaN` | **PASS** |
| 12 | Single-Model Ranking | Single candidate produces $C_1^* = 1.0$ and rank 1 | **PASS** |
| 13 | Descending Order | Models ordered strictly descending by closeness | **PASS** |
| 14 | Deterministic Tie-Break | Secondary criterion then alphabetical `model_id` break ties | **PASS** |
| 15 | Eligibility Filtering | Ineligible models excluded from decision matrix | **PASS** |
| 16 | Ineligible Assignment | Ineligible models assigned rank -1 with explicit reasons | **PASS** |
| 17 | Synthetic Fixture | Reference fixture ranks all 10 candidate models | **PASS** |
| 18 | $\pm 20\%$ Perturbation | 14 perturbation scenarios executed across active criteria | **PASS** |
| 19 | Weight Renormalization | Perturbed weights renormalize proportionally to sum 1.00 | **PASS** |
| 20 | Winner Stability | Stability percentage correctly computed | **PASS** |
| 21 | Spearman Correlation | Rank concordance $\rho \in [-1, 1]$ computed accurately | **PASS** |
| 22 | Store Persistence | Runs persist to and load from `durableStore` | **PASS** |
| 23 | Metrics Adapter | `extractModelDecisionMetricsFromBenchmark` maps live records | **PASS** |
| 24 | Top-3 Consensus Link | Consensus voting correctly consumes TOPSIS rankings | **PASS** |
| 25 | System Regression | Phase 2 Trust Score, Phase 3 Grounding, Phase 4 Gateway pass 100% | **PASS** |

### Comprehensive Regression Baseline
- **API Test Suite:** **103 / 103 tests passing** (0 failures, duration: 4.5s).
- **Backend Test Suite:** **29 / 29 tests passing** (1 skipped intentionally, duration: 0.34s).
- **Frontend Production Build:** **Built successfully in 575ms** (Vite + TypeScript).

---

## 8. Compliance with Commitments & Boundaries

1. **Zero Credit Spending:** No paid credits were spent; all tests were conducted locally or using synthetic demonstration fixtures.
2. **Methodology Preservation:** The C1–C10 DPDP Trust Score taxonomy and penalty-weighted mathematical formulation were completely preserved without alteration.
3. **Zero Data Fabrication:** Unauthenticated or offline models are never presented as successfully executed; scientific transparency notices are enforced across API responses and UI dashboards.
4. **Phase Boundary Respected:** Phase 5 is fully implemented, verified, and complete. Work on Phase 6 has not been initiated.

Phase 5 is complete, robust, mathematically sound, and ready for review.

