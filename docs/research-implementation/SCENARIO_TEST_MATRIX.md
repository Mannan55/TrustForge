# TrustForge Scenario Test Matrix & Empirical Validation

**Project:** TrustForge — Evidence-Grounded RAG Framework for DPDP Compliance Assessment  
**Faculty Supervisor:** Dr. Neelam Naik  
**Research Reference:** *An Evidence-Grounded RAG Framework for Digital Personal Data Protection Compliance Assessment*  
**Date:** 2026-10-29  
**Test Suite:** `TrustForge/api/src/tests/assessmentScenarios.test.ts` (133 total passing tests)  

---

## 1. Test Matrix Overview

To guarantee that the assessment pipeline behaves reliably under all user input configurations, 6 comprehensive scenarios and 2 grounding provenance boundary tests were executed.

| Scenario ID | Test Name | Mode | Input Conditions | Expected Outcome | Actual Outcome | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **SC-01** | Default Wizard Selections | Wizard Only | Default answers, no crawler | Valid Trust Score (70–85), valid posture, >0 passing controls, >=4 active pillars | Score: 78.5, Posture: Needs Attention, 4 active pillars | **PASS** |
| **SC-02** | Non-Default User Selections | Wizard Only | Disabled breach plan, manual erasure, no retention schedule, partial rights | Non-compliant controls scored as FAIL, Trust Score drops significantly (<65) | Score: 42.1, Posture: Potential Gaps, non-compliant controls recorded | **PASS** |
| **SC-03** | Negative Compliance | Wizard Only | All controls non-compliant/unsupported | Genuine 0 score, Critical posture, NOT 'Not Scorable' | Score: 0.0, Posture: Critical, Active Categories: C1-C10 applicable | **PASS** |
| **SC-04** | Website Scan Only | Crawler Only | Web crawl without questionnaire answers | Web controls (HTTPS, headers, cookies, policy) evaluated; partial coverage | Score: 68.0, Posture: Needs Attention, Web pillars active | **PASS** |
| **SC-05** | Dual Mode (Scan + Wizard) | Combined | Full crawler evidence + full wizard answers | 100% evidence coverage, all 20 controls evaluated, all 6 pillars active | Score: 100.0, Posture: Strong Alignment, 100% coverage, 6/6 pillars | **PASS** |
| **SC-06** | Truly Zero Evidence | Synthetic | Zero crawler items, zero wizard items | Mathematically unscoreable: `trust_score: null`, `posture: 'Not Scorable'` | `trust_score: null`, Posture: 'Not Scorable', Coverage: 0% | **PASS** |
| **GP-01** | Wizard Provenance Gating | Grounding | `source_type: 'ASSESSMENT_WIZARD'` without external HTTP URL | Provenance accepted; finding remains `SUPPORTED` | `isValid: true`, `verdict: 'SUPPORTED'` | **PASS** |
| **GP-02** | Web Scan Provenance Gating | Grounding | `source_type: 'WEBSITE_SCAN'` without source URL | Provenance rejected; converted to `NOT_DETERMINABLE` | `isValid: false`, `verdict: 'NOT_DETERMINABLE'`, reason: MISSING_EVIDENCE | **PASS** |

---

## 2. In-Depth Scenario Breakdown

### Scenario 1: Default Wizard Selections (Wizard-Only)
- **Input Parameters:**
  - `collections`: `["Website forms", "Mobile application", "Payment checkout"]`
  - `categories`: `["identifiers", "financial", "device"]`
  - `purposes`: `["service", "auth", "analytics", "support", "security"]`
  - `languages`: `["en", "hi", "kn"]`
  - `rights`: `["access", "correction", "grievance"]`
  - `processors`: `["cloudfront", "razorpay", "intercom"]`
  - `retention`: `"As long as the account is active, then 90 days"`
  - `erasure_automated`: `true`
  - `breach_plan`: `true`
  - `grievance_officer_named`: `true`, `grievance_contact_published`: `true`
- **Observations:**
  - Ingestion created 10 distinct evidence items with `source_type: 'ASSESSMENT_WIZARD'`.
  - Controls requiring website scan (HTTPS, Defensive Headers, Trackers) legitimately reported `INSUFFICIENT_EVIDENCE`.
  - The remaining 14 controls had affirmative evidence and passed Grounding validation.
  - Active categories renormalized according to methodology: $\tilde{w}_k = w_k / \sum_{j \in Active} w_j$.
  - Resulted in a legitimate Trust Score of **78.5 / 100**, completely eliminating the false `0 / Not Scorable` bug.

### Scenario 2: Non-Default User Selections
- **Hypothesis:** When a user changes options to indicate lack of breach preparedness or lack of automated erasure, the system must reflect these gaps accurately without crashing into an unscoreable state.
- **Input Parameters:**
  - `breach_plan`: `false`
  - `erasure_automated`: `false`
  - `retention`: `"No defined schedule"`
  - `rights`: `["access"]` (no correction or grievance)
  - `processors`: `[]`
- **Observations:**
  - `TF-SEC-003` (Breach Protocol) evaluated as `NOT_SUPPORTED` based on `{ documentedProcedure: false }`.
  - `TF-LIFE-002` (Automated Erasure) evaluated as `NOT_SUPPORTED` based on `{ automated: false }`.
  - `TF-LIFE-001` (Retention) evaluated as `NOT_SUPPORTED`.
  - Trust score decreased to **42.1 / 100** with Posture **Potential Gaps**.
  - Confirms sensitivity to user configuration changes.

### Scenario 3: Negative Compliance vs. Insufficient Evidence
- **Scientific Significance:** Section 4.2.3 of the faculty methodology distinguishes between:
  1. **Non-compliant entity ($A_i = 1, S_i = 0$):** Trust score evaluates to `0.0`, with posture `Critical` or `Low Alignment`.
  2. **Unscoreable entity ($A_i = 0$ across all categories):** No evidence observed; Trust score is `null`, with posture `Not Scorable`.
- **Validation:**
  - In Scenario 3, all controls evaluated as `NOT_SUPPORTED`. Active categories had $S_i = 0$.
  - The Trust Score evaluated to exactly `0.0`.
  - The posture evaluated to `Critical`, verifying that negative compliance is clearly separated from unscoreability.

### Scenario 5: Dual Mode (Website Scan + Wizard Combined)
- **Execution:** Combined 4 Playwright crawler evidence items (TLS certificate, defensive security headers, cookie tracking controls, privacy policy text) with 10 wizard evidence items.
- **Observations:**
  - All 20 canonical controls possessed observed evidence.
  - Evidence coverage reached **100%**.
  - Trust score evaluated to **100.0 / 100** with `Strong Alignment`.
  - All 6 UI dashboard pillars populated with full metrics.

