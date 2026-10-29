# TrustForge — Phase 2 Implementation Report: Research-Aligned Trust Score Engine

**Document Reference:** `docs/research-implementation/06_PHASE_2_IMPLEMENTATION_REPORT.md`  
**Date:** October 28, 2026  
**Implementation Phase:** Phase 2 (C1–C10 Compliance Taxonomy, Research Trust Score, Gating Caps, UI Adapter)  
**Primary Research Specification:** Dr. Neelam Naik (*"An Evidence-Grounded RAG Framework for Digital Personal Data Protection Compliance Assessment"*, Table 1, Section 3.2, Section 4.2.2)  
**Engineering Verification Status:** **100% PASS** across all automated test suites and production builds.

---

## 1. Executive Summary

In Phase 2, the TrustForge compliance assessment engine was transformed from the initial 6-pillar proprietary scoring format into the **authoritative 10-category (C1–C10) research framework** defined by Dr. Neelam Naik and Protiviti (Nov 2025).

All requirements were implemented with mathematical precision:
- **Canonical Taxonomy:** C1–C10 obligations defined in `api/src/scoring/c10Taxonomy.ts` with statutory citations verified against the 83-chunk Official Gazette DPDP corpus.
- **Deterministic Research Score:** Implemented in `api/src/scoring/trustScoreEngine.ts` using normalized category weights $\tilde{w}_k$, outcome scores $\{1.0, 0.5, 0.0\}$, and complete exclusion ($A_i = 0$) for `NOT_DETERMINABLE` and `NOT_APPLICABLE`.
- **Weighting Schemes:**
  - **W1 (Penalty-Proportional):** C4 = 0.25 (₹250 cr), C5 = 0.20 (₹200 cr), C9 = 0.20 (₹200 cr), remaining seven = 0.05 each (₹50 cr each), summing to ₹1,000 cr.
  - **W2 (Equal):** 0.10 for each of C1 through C10.
- **Critical-Failure Gating Caps:** Enforces $TS = \min(TS, 40)$ when crawler evidence confirms missing HTTPS or missing privacy notice.
- **Posture Bands:** Low (0–39), Moderate (40–59), Good (60–79), Strong (80–100), and `NOT_SCORABLE` (for all-excluded evaluations).
- **Bidirectional UI Adapter:** `api/src/scoring/pillarMappingAdapter.ts` maps C1–C10 results into the existing 6 UI pillars (`privacy`, `security`, `transparency`, `governance`, `lifecycle`, `rights`), ensuring zero regressions on the frontend dashboard, radar charts, and report pages.
- **REST API Endpoints:** Updated `GET /api/trust-score/:id` and added `POST /api/trust-score/calculate` supporting both C1–C10 research breakdowns and 6-pillar projections.
- **Automated Verification:** 20/20 unit tests pass (100%), frontend builds with 0 errors, and backend Python test suite passes (29 passed, 1 skipped).

---

## 2. Modified & Created Files Summary

| File Path | Action | Description |
|---|---|---|
| `api/src/scoring/c10Taxonomy.ts` | **Created** | Defines canonical C1–C10 compliance categories, statutory bases (DPDP Act 2023 & Rules 2025), penalty ceilings under Section 33(1) Schedule, W1/W2 weight vectors, and observable evidence requirements. |
| `api/src/scoring/pillarMappingAdapter.ts` | **Created** | Bidirectional mapping between C1–C10 research taxonomy and the legacy 6 UI pillars (`privacy`, `security`, `transparency`, `governance`, `lifecycle`, `rights`). Converts legacy findings and projects category scores. |
| `api/src/scoring/trustScoreEngine.ts` | **Modified** | Implemented `computeC10TrustScore()`, weight renormalization $\tilde{w}_k$, critical-failure gating caps, accurate decimal rounding, and updated `computeModelTrustScore()` and `computeTopThreeMajorityVoting()`. |
| `api/src/types/index.ts` | **Modified** | Added `ComplianceCategoryCode`, `ObligationVerdict`, `WeightScheme`, `PostureBand`, `C10CategoryScore`, `C10TrustScoreComputation`, and enriched `TrustScoreComputation`. |
| `api/src/routes/trustScore.ts` | **Modified** | Updated `GET /api/trust-score/:id` to support `?weight_scheme=` and return research score fields; added `POST /api/trust-score/calculate` for direct deterministic scoring. |
| `api/src/routes/assessments.ts` | **Modified** | Passed verified crawler evidence flags (`hasHttps`, `hasPrivacyNotice`) into scoring options; persisted research scores and C1–C10 category breakdowns in assessment records. |
| `api/src/database/repository.ts` | **Modified** | Added optional research score fields (`raw_trust_score`, `category_scores`, `critical_failure_cap_applied`, `critical_failure_reasons`, `methodology_version`) to `AssessmentRecord`. |
| `api/src/tests/unit.test.ts` | **Modified** | Added 12 comprehensive unit test cases covering all 12 research scoring requirements, achieving 20/20 passing tests. |

---

## 3. Mathematical Formulation & Scoring Engine

### Category Scoring
For each compliance category $k \in \{C1, C2, \dots, C10\}$:
$$S_k = \frac{\sum_{i \in O_k} A_i s_i}{\sum_{i \in O_k} A_i} \times 100$$
Where:
- $s_i = 1.0$ if verdict is `COMPLIANT`
- $s_i = 0.5$ if verdict is `PARTIAL`
- $s_i = 0.0$ if verdict is `NON_COMPLIANT`
- $A_i = 0$ if verdict is `NOT_DETERMINABLE` or `NOT_APPLICABLE` (excluded from denominator)
- If grounding validation fails (`is_grounded === false`), verdict is strictly converted to `NOT_DETERMINABLE` ($A_i = 0$).

### Weight Renormalization
When one or more categories have zero applicable obligations ($|O_k \cap A| = 0$), weights are renormalized across remaining active categories:
$$W_{\text{active}} = \sum_{j: |O_j \cap A| > 0} w_j, \quad \tilde{w}_k = \frac{w_k}{W_{\text{active}}}$$

### Raw Trust Score
$$TS_{\text{raw}} = \sum_{k: |O_k \cap A| > 0} \tilde{w}_k \cdot S_k = 100 \sum_{k=1}^{10} \tilde{w}_k \frac{\sum_{i \in O_k} A_i s_i}{\sum_{i \in O_k} A_i}$$

### Critical-Failure Gating Rule
Supported by verified crawler evidence (`hasHttps === false` or `hasPrivacyNotice === false`):
$$TS = \min(TS_{\text{raw}}, 40)$$

### Weight Schemes
- **W1 (Penalty-Proportional):**
  - C4 (Reasonable Security Safeguards): $w = 0.25$ (₹250 cr cap)
  - C5 (Breach Intimation Commitment): $w = 0.20$ (₹200 cr cap)
  - C9 (Children's Data Safeguards): $w = 0.20$ (₹200 cr cap)
  - C1, C2, C3, C6, C7, C8, C10: $w = 0.05$ each (₹50 cr cap each)
  - Total ceiling sum: ₹1,000 crore. Total weight = 1.00.
- **W2 (Equal Weights):**
  - $w = 0.10$ for each category C1 through C10. Total weight = 1.00.

---

## 4. Examples of Deterministic Calculations

### Example A: Full Statutory Adherence (W1 vs W2)
- **Inputs:** All C1–C10 findings `COMPLIANT`, HTTPS=true, Notice=true.
- **Calculation:** Every category scores 100.
  $$TS_{\text{raw}} = 100 \cdot \sum \tilde{w}_k = 100.0$$
- **Output:** `trust_score: 100.0`, `posture: "Strong"`, `critical_failure_cap_applied: false`.

### Example B: Renormalized Weights (Minor's Data Excluded)
- **Inputs:** B2B SaaS website where C9 (Children's Data) is `NOT_APPLICABLE`.
- **Under W1:** Base weight of C9 is 0.20. Active weight sum $W_{\text{active}} = 1.00 - 0.20 = 0.80$.
- **Finding:** C4 (Security Safeguards, base weight 0.25) is `COMPLIANT` ($S_{\text{C4}} = 100$). All other active categories are `NON_COMPLIANT` ($S = 0$).
- **Calculation:**
  $$\tilde{w}_{\text{C4}} = \frac{0.25}{0.80} = 0.3125$$
  $$TS = 100 \times 0.3125 = 31.25 \to 31.3$$
- **Output:** `trust_score: 31.3`, `posture: "Low"`.

### Example C: Critical-Failure Cap Gating
- **Inputs:** Website complies with all legal declarations in privacy notices and policies (C1–C3, C5–C10 all `COMPLIANT`, C4 `COMPLIANT`), yielding $TS_{\text{raw}} = 100.0$.
- **Crawler Observation:** Crawler verifies `hasHttps: false` (unencrypted HTTP connection).
- **Calculation:**
  $$TS = \min(100.0, 40.0) = 40.0$$
- **Output:** `raw_trust_score: 100.0`, `trust_score: 40.0`, `critical_failure_cap_applied: true`, `posture: "Moderate"`.

---

## 5. Automated Verification & Test Results

### 1. API TypeScript Build
```bash
npm run build (in api/)
-> Exit Code 0 (tsc clean, 0 errors)
```

### 2. API Automated Unit Tests (20/20 PASS)
```bash
npm test (in api/)
-> Exit Code 0 (20 passed, 0 failed, duration: 4021ms)

✔ SSRF Guard: Rejects loopback, private IPs, and cloud metadata (2723ms)
✔ SSRF Guard: Permits valid public domain (61ms)
✔ Trust Score Engine: All-PASS produces 100 score (6.1ms)
✔ Trust Score Engine: All-FAIL produces 0 score (1.1ms)
✔ Trust Score Engine: All NOT_APPLICABLE produces Not Scorable (0.8ms)
✔ Top-3 Majority Voting Consensus (2.9ms)
✔ Grounding Validator: Rejects hallucinated legal clause (5.1ms)
✔ Trust Score Engine: Pillar scores include canonical names, aliases, and evidence coverage (1.3ms)
✔ Research Scoring 1: All compliant produces 100 score (1.0ms)
✔ Research Scoring 2: All non-compliant produces 0 score (1.1ms)
✔ Research Scoring 3: All partial produces 50 score (0.7ms)
✔ Research Scoring 4: All excluded produces NOT_SCORABLE (0.4ms)
✔ Research Scoring 5: Mixed applicable and excluded categories renormalizes weights correctly (0.6ms)
✔ Research Scoring 6: W1 penalty-proportional weighting accuracy (1.0ms)
✔ Research Scoring 7: W2 equal weighting accuracy (0.4ms)
✔ Research Scoring 8: Critical-failure cap on missing HTTPS (0.4ms)
✔ Research Scoring 9: Critical-failure cap on missing privacy notice (0.3ms)
✔ Research Scoring 10: Six-pillar UI compatibility projection (0.4ms)
✔ Research Scoring 11: Unsupported verdicts and failed grounding treated as NOT_DETERMINABLE (0.7ms)
✔ Research Scoring 12: Scoring determinism across 100 identical runs (11.0ms)
```

### 3. Frontend Production Build
```bash
npm run build (in TrustForge Frontend/)
-> Exit Code 0 (vite build in 1.44s, 0 errors, 1909 modules transformed)
```

### 4. Backend Python Test Suite
```bash
pytest (in backend/)
-> Exit Code 0 (29 passed, 1 skipped in 3.24s)
   tests/unit/test_citation_grounding.py: 14 passed
   tests/unit/test_trust_score_determinism.py: 15 passed
```

### 5. Multi-Tenant Security & Regression Suite
```bash
npx tsx test_security_multitenant_rls.ts (in api/)
-> Exit Code 0 (10/10 PASS, 0 security regressions)
```

---

## 6. Dashboard & API Backward Compatibility

1. **Established UI Views Maintained:** All responses continue to return `pillar_scores` containing the 6 canonical pillars (`privacy`, `security`, `transparency`, `governance`, `lifecycle`, `rights`). Frontend radar charts, bar charts, and wizard summaries render without modification.
2. **Research Extensions Added:** Responses include `category_scores` (C1–C10), `raw_trust_score`, `critical_failure_cap_applied`, `critical_failure_reasons`, and `methodology_version: "DPDP-2023-RAG-C10-V1"`.
3. **API Contract Integrity:** `GET /api/trust-score/:id` supports both array and object formats for `pillar_scores` and provides dynamic recalculation under `?weight_scheme=`. `POST /api/trust-score/calculate` enables stateless verification.

---

## 7. Known Limitations & Recommendations for Phase 3

1. **Corpus Metadata Augmentation (Phase 3):** The 83 chunks in `authoritative_corpus.json` contain full statutory text but currently lack explicit `obligation_category` (C1–C10) and `penalty_reference` in their JSON properties. Phase 3 will enrich chunk metadata directly.
2. **Retrieval Depth Adjustment (Phase 3):** `hybridRAG.ts` will be updated to default to $top\_k = 5$ as mandated by the research methodology.
3. **Strict In-Pipeline Hallucination Rejection (Phase 3):** Grounding checks in `assessments.ts` will automatically drop ungrounded LLM findings from the active scoring pool ($A_i = 0$).

---

**Phase 2 Implementation Complete.** All tests verified. System ready for Phase 3 review.
