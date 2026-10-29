# TrustForge — Phase 2: Technical Design Document (C1–C10 Research Scoring Engine)

**Document Reference:** `docs/research-implementation/05_PHASE_2_TECHNICAL_DESIGN.md`  
**Date:** October 28, 2026  
**Implementation Phase:** Phase 2 (Research-Aligned Trust Score Engine)  
**Primary Reference:** Dr. Neelam Naik ("Research method-given to Mannan.docx", Table 1, Section 3.2, Section 4.2.2)  
**Engine Architecture:** TypeScript / Node.js in `api/src/scoring/` with Supabase PostgreSQL persistence and React 19 UI Adapter

---

## 1. Overview & Architectural Goals

The primary goal of Phase 2 is to transform the TrustForge compliance scoring engine from the initial 6-pillar proprietary format into the **official 10-category (C1–C10) research framework** established by Dr. Neelam Naik and Protiviti (Nov 2025).

### Key Technical Requirements
1. **Canonical Taxonomy:** Implement C1–C10 compliance obligations with exact statutory references.
2. **Deterministic Formula:** Implement the exact faculty mathematical formula:
   $$TS = 100 \cdot \sum_{k=1}^{10} \tilde{w}_k \cdot \frac{\sum_{i \in O_k} A_i s_i}{\sum_{i \in O_k} A_i}, \quad \tilde{w}_k = \frac{w_k}{\sum_{j: |O_j \cap A| > 0} w_j}$$
3. **Dual Weighting Schemes:**
   - **W1 (Penalty-Proportional):** Derived from statutory penalty caps (₹1,000 cr ceiling sum).
   - **W2 (Equal / Expert AHP):** 0.10 each or practitioner-weighted.
4. **Critical-Failure Gating Rule:** Enforce $TS = \min(TS, 40)$ if HTTPS is absent or if no privacy notice is observed.
5. **Score Bands:** 0–39 Low, 40–59 Moderate, 60–79 Good, 80–100 Strong.
6. **Backward-Compatible UI Adapter:** Map C1–C10 results seamlessly into the existing 6-pillar dashboard format so that no existing frontend pages, radar charts, or audit views break.

---

## 2. Canonical C1–C10 Obligation Taxonomy

Table 1 of the faculty methodology establishes the exact taxonomy:

| Code | Obligation Category | DPDP Act / Rules Basis | Observable Evidence Checked | Severity | W1 Weight | W2 Weight |
|---|---|---|---|---|---|---|
| **C1** | Notice and Transparency | S.5; Rule 3 | Policy exists; standalone; itemised data; purpose; rights; withdrawal; Board complaint route | High | 0.05 | 0.10 |
| **C2** | Consent and Withdrawal | S.6 | Banner before non-essential cookies; opt-in with no pre-ticked boxes; withdrawal as easy as giving consent | High | 0.05 | 0.10 |
| **C3** | Purpose Limitation & Data Minimization | S.6(1) | Form fields proportionate to the stated purpose | Medium | 0.05 | 0.10 |
| **C4** | Reasonable Security Safeguards | S.8(5); Rule 6 | HTTPS/TLS version, HSTS, CSP and other defensive headers, Secure/HttpOnly cookie flags, no mixed content, security statement in policy | High | 0.25 | 0.10 |
| **C5** | Breach Intimation Commitment | S.8(6); Rule 7 | Policy commits to notifying the Board and users | High | 0.20 | 0.10 |
| **C6** | Retention and Erasure | S.8(7); Rule 8 | Retention period or criteria stated | Medium | 0.05 | 0.10 |
| **C7** | Contact Person / DPO and Grievance | S.8(9)–(10); Rule 9 | Contact published and reachable | High | 0.05 | 0.10 |
| **C8** | Data Principal Rights | S.11–14; Rule 14 | Mechanisms for access, correction, erasure and nomination | Medium | 0.05 | 0.10 |
| **C9** | Children's Data | S.9; Rule 10 | Age gate or verifiable parental consent (only where minors may use the site) | High | 0.20 | 0.10 |
| **C10** | Third Parties & Cross-Border Transfer | S.8(2), S.16; Rule 15 | Trackers and processors disclosed; transfer statement | Medium | 0.05 | 0.10 |

---

## 3. Data Structures & TypeScript Interfaces

### A. Compliance Taxonomy & Category Codes (`api/src/types/researchTaxonomy.ts`)

```typescript
export type ComplianceCategoryCode =
  | 'C1'
  | 'C2'
  | 'C3'
  | 'C4'
  | 'C5'
  | 'C6'
  | 'C7'
  | 'C8'
  | 'C9'
  | 'C10';

export type ObligationVerdict =
  | 'COMPLIANT'         // s_i = 1.0
  | 'PARTIAL'           // s_i = 0.5
  | 'NON_COMPLIANT'     // s_i = 0.0
  | 'NOT_DETERMINABLE'  // A_i = 0 (Excluded from denominator)
  | 'NOT_APPLICABLE';   // A_i = 0 (Excluded from denominator)

export type PostureBand = 'Low' | 'Moderate' | 'Good' | 'Strong' | 'Not Scorable';

export type WeightScheme = 'W1_PENALTY_PROPORTIONAL' | 'W2_EQUAL' | 'EXPERT_AHP';

export interface CategoryDefinition {
  code: ComplianceCategoryCode;
  name: string;
  statutoryBasis: string;
  rulesBasis: string;
  penaltyCeilingCr: number; // in crores (INR)
  evidenceDescription: string;
  defaultWeightW1: number;
  defaultWeightW2: number;
  mappedPillarId: 'privacy' | 'security' | 'transparency' | 'governance' | 'lifecycle' | 'rights';
}

export interface ObligationFinding {
  obligation_code: ComplianceCategoryCode;
  obligation_name: string;
  verdict: ObligationVerdict;
  score_value: number; // 1.0, 0.5, 0.0, or 0.0 (if excluded)
  is_applicable: boolean; // false if NOT_DETERMINABLE or NOT_APPLICABLE
  statutory_citation: {
    section: string;
    rule?: string;
    gazette_quote?: string;
  };
  quoted_evidence?: string;
  evidence_ids: string[];
  rationale: string;
  is_grounded: boolean;
  grounding_score: number;
  remediation_advice?: string;
}

export interface CategoryScoreResult {
  code: ComplianceCategoryCode;
  name: string;
  score: number | null; // [0, 100] or null if category has zero applicable items
  is_applicable: boolean;
  applicable_items_count: number;
  compliant_count: number;
  partial_count: number;
  non_compliant_count: number;
  base_weight: number;
  renormalized_weight: number;
  findings: ObligationFinding[];
}

export interface C10TrustScoreComputation {
  assessment_id: string;
  model_id: string;
  raw_trust_score: number | null;
  trust_score: number | null; // Final score after critical caps
  posture: PostureBand;
  weight_scheme: WeightScheme;
  critical_failure_cap_applied: boolean;
  critical_failure_reasons: string[];
  evidence_coverage_pct: number;
  hallucination_rejections_count: number;
  category_scores: Record<ComplianceCategoryCode, CategoryScoreResult>;
  // Legacy 6-pillar compatibility layer
  pillar_scores: Record<string, any>;
  computed_at: string;
}
```

---

## 4. Mathematical Engine Specification

### Weight Vectors

```typescript
export const WEIGHT_VECTORS: Record<WeightScheme, Record<ComplianceCategoryCode, number>> = {
  W1_PENALTY_PROPORTIONAL: {
    C1: 0.05,  // ₹50 cr / ₹1000 cr
    C2: 0.05,  // ₹50 cr / ₹1000 cr
    C3: 0.05,  // ₹50 cr / ₹1000 cr
    C4: 0.25,  // ₹250 cr / ₹1000 cr (S.33(1) Schedule penalty for failure to protect)
    C5: 0.20,  // ₹200 cr / ₹1000 cr (S.33(1) Schedule penalty for failure to notify)
    C6: 0.05,  // ₹50 cr / ₹1000 cr
    C7: 0.05,  // ₹50 cr / ₹1000 cr
    C8: 0.05,  // ₹50 cr / ₹1000 cr
    C9: 0.20,  // ₹200 cr / ₹1000 cr (S.33(1) Schedule penalty for children's data breaches)
    C10: 0.05, // ₹50 cr / ₹1000 cr
  },
  W2_EQUAL: {
    C1: 0.10,
    C2: 0.10,
    C3: 0.10,
    C4: 0.10,
    C5: 0.10,
    C6: 0.10,
    C7: 0.10,
    C8: 0.10,
    C9: 0.10,
    C10: 0.10,
  },
  EXPERT_AHP: {
    // Derived from privacy practitioner pairwise comparison matrix (CR < 0.1)
    C1: 0.08,
    C2: 0.12,
    C3: 0.07,
    C4: 0.22,
    C5: 0.14,
    C6: 0.06,
    C7: 0.08,
    C8: 0.07,
    C9: 0.11,
    C10: 0.05,
  },
};
```

### Core Trust Score Calculation Algorithm

```typescript
export function computeC10TrustScore(
  assessmentId: string,
  modelId: string,
  findings: ObligationFinding[],
  options: {
    weightScheme?: WeightScheme;
    hasHttps?: boolean;
    hasPrivacyNotice?: boolean;
  } = {}
): C10TrustScoreComputation {
  const scheme = options.weightScheme || 'W1_PENALTY_PROPORTIONAL';
  const baseWeights = WEIGHT_VECTORS[scheme];

  // 1. Group findings by category C1..C10
  const findingsByCategory = new Map<ComplianceCategoryCode, ObligationFinding[]>();
  for (const f of findings) {
    const list = findingsByCategory.get(f.obligation_code) || [];
    list.push(f);
    findingsByCategory.set(f.obligation_code, list);
  }

  // 2. Calculate category earned scores and identify applicable categories
  let applicableWeightSum = 0;
  const categoryResults: Record<string, CategoryScoreResult> = {};
  const activeCategories: ComplianceCategoryCode[] = [];

  const ALL_CODES: ComplianceCategoryCode[] = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10'];

  for (const code of ALL_CODES) {
    const catFindings = findingsByCategory.get(code) || [];
    let applicableItems = 0;
    let earnedPoints = 0;
    let compliantCount = 0;
    let partialCount = 0;
    let nonCompliantCount = 0;

    for (const item of catFindings) {
      if (item.verdict === 'NOT_DETERMINABLE' || item.verdict === 'NOT_APPLICABLE') {
        item.is_applicable = false;
        item.score_value = 0;
        continue;
      }

      item.is_applicable = true;
      applicableItems++;

      if (item.verdict === 'COMPLIANT') {
        earnedPoints += 1.0;
        item.score_value = 1.0;
        compliantCount++;
      } else if (item.verdict === 'PARTIAL') {
        earnedPoints += 0.5;
        item.score_value = 0.5;
        partialCount++;
      } else {
        // NON_COMPLIANT
        earnedPoints += 0.0;
        item.score_value = 0.0;
        nonCompliantCount++;
      }
    }

    const isCatApplicable = applicableItems > 0;
    const catScore = isCatApplicable ? Math.round((earnedPoints / applicableItems) * 100 * 10) / 10 : null;

    if (isCatApplicable) {
      applicableWeightSum += baseWeights[code];
      activeCategories.push(code);
    }

    categoryResults[code] = {
      code,
      name: getCategoryName(code),
      score: catScore,
      is_applicable: isCatApplicable,
      applicable_items_count: applicableItems,
      compliant_count: compliantCount,
      partial_count: partialCount,
      non_compliant_count: nonCompliantCount,
      base_weight: baseWeights[code],
      renormalized_weight: 0, // Assigned below
      findings: catFindings,
    };
  }

  // Edge case: Zero applicable items across all categories
  if (applicableWeightSum === 0 || activeCategories.length === 0) {
    return {
      assessment_id: assessmentId,
      model_id: modelId,
      raw_trust_score: null,
      trust_score: null,
      posture: 'Not Scorable',
      weight_scheme: scheme,
      critical_failure_cap_applied: false,
      critical_failure_reasons: [],
      evidence_coverage_pct: 0,
      hallucination_rejections_count: 0,
      category_scores: categoryResults as any,
      pillar_scores: buildPillarsFromC10(categoryResults as any),
      computed_at: new Date().toISOString(),
    };
  }

  // 3. Renormalize weights: \tilde{w}_k = w_k / sum_{applicable} w_j
  let weightedScoreSum = 0;
  for (const code of activeCategories) {
    const catRes = categoryResults[code];
    const renormalizedWeight = baseWeights[code] / applicableWeightSum;
    catRes.renormalized_weight = Math.round(renormalizedWeight * 10000) / 10000;
    weightedScoreSum += (catRes.score ?? 0) * renormalizedWeight;
  }

  const rawTrustScore = Math.round(weightedScoreSum * 10) / 10;
  let finalTrustScore = rawTrustScore;

  // 4. Critical-Failure Scoring Cap Rule
  // "For example, if the site has no HTTPS or no privacy notice, TS = min(TS, 40)."
  const criticalReasons: string[] = [];
  let capApplied = false;

  if (options.hasHttps === false) {
    capApplied = true;
    criticalReasons.push('Website lacks active HTTPS transport layer encryption.');
  }
  if (options.hasPrivacyNotice === false) {
    capApplied = true;
    criticalReasons.push('Website does not publish an accessible privacy notice.');
  }

  if (capApplied) {
    finalTrustScore = Math.min(rawTrustScore, 40.0);
  }

  // 5. Posture Determination: 0–39 Low, 40–59 Moderate, 60–79 Good, 80–100 Strong
  let posture: PostureBand;
  if (finalTrustScore >= 80) posture = 'Strong';
  else if (finalTrustScore >= 60) posture = 'Good';
  else if (finalTrustScore >= 40) posture = 'Moderate';
  else posture = 'Low';

  return {
    assessment_id: assessmentId,
    model_id: modelId,
    raw_trust_score: rawTrustScore,
    trust_score: finalTrustScore,
    posture,
    weight_scheme: scheme,
    critical_failure_cap_applied: capApplied,
    critical_failure_reasons: criticalReasons,
    evidence_coverage_pct: calculateEvidenceCoverage(categoryResults as any),
    hallucination_rejections_count: countHallucinations(findings),
    category_scores: categoryResults as any,
    pillar_scores: buildPillarsFromC10(categoryResults as any),
    computed_at: new Date().toISOString(),
  };
}
```

---

## 5. Bidirectional 6-Pillar UI Adapter

To preserve all existing dashboard visualizations (radar charts, pillar bars, and findings views), the engine projects C1–C10 category scores into the legacy 6 pillars:

| 6-Pillar ID | Pillar Name | Constituent C1–C10 Categories | Mathematical Aggregation |
|---|---|---|---|
| `privacy` | Privacy Architecture & Notice | C1 (Notice), C2 (Consent) | Weighted mean of C1 and C2 scores |
| `security` | Security Safeguards | C4 (Security), C5 (Breach Intimation) | Weighted mean of C4 and C5 scores |
| `transparency` | Transparency & Notice | C1 (Notice), C7 (DPO / Grievance), C10 (Third Parties) | Weighted mean of C1, C7, and C10 |
| `governance` | Governance & Accountability | C7 (DPO), C9 (Children's Data) | Weighted mean of C7 and C9 |
| `lifecycle` | Data Lifecycle Management | C3 (Minimization), C6 (Retention & Erasure) | Weighted mean of C3 and C6 |
| `rights` | Data Principal Rights | C8 (Rights), C2 (Withdrawal) | Weighted mean of C8 and C2 |

This adapter ensures that any call expecting `pillar_scores.privacy.score` receives a mathematically consistent, valid score without breaking the UI.

---

## 6. Database Persistence & Migration Plan

### Schema Upgrades (`database/migrations/003_c10_research_schema.sql`)
1. Create table `c10_category_scores`:
   - `id`: UUID (Primary Key)
   - `assessment_id`: VARCHAR(64) REFERENCES `assessments(assessment_id)`
   - `model_id`: VARCHAR(32)
   - `category_code`: VARCHAR(8) (C1..C10)
   - `category_score`: NUMERIC(5, 2)
   - `is_applicable`: BOOLEAN
   - `weight_scheme`: VARCHAR(32)
   - `renormalized_weight`: NUMERIC(6, 4)
   - `created_at`: TIMESTAMPTZ DEFAULT NOW()
2. Update table `trust_scores`:
   - Add column `weight_scheme` (VARCHAR(32) DEFAULT 'W1_PENALTY_PROPORTIONAL')
   - Add column `critical_cap_applied` (BOOLEAN DEFAULT FALSE)
   - Add column `raw_score` (NUMERIC(5, 2))
   - Add column `category_breakdown` (JSONB)
3. Zero Downtime Migration:
   - Existing records retain their historical values.
   - New evaluations populate both `category_breakdown` and `pillar_scores`.

---

## 7. API Contracts

### `POST /api/trust-score`
**Request Payload:**
```json
{
  "assessment_id": "ASM_1730100000_abcde",
  "model_id": "M03",
  "weight_scheme": "W1_PENALTY_PROPORTIONAL",
  "has_https": true,
  "has_privacy_notice": true,
  "findings": [
    {
      "obligation_code": "C1",
      "verdict": "COMPLIANT",
      "evidence_ids": ["EVID_01"],
      "statutory_citation": { "section": "Section 5", "rule": "Rule 3" },
      "quoted_evidence": "We process name and email for service fulfillment.",
      "rationale": "Clear itemisation of collected data categories and purpose."
    }
  ]
}
```

**Response Payload (HTTP 200 OK):**
```json
{
  "assessment_id": "ASM_1730100000_abcde",
  "model_id": "M03",
  "trust_score": 85.5,
  "raw_trust_score": 85.5,
  "posture": "Strong",
  "weight_scheme": "W1_PENALTY_PROPORTIONAL",
  "critical_failure_cap_applied": false,
  "critical_failure_reasons": [],
  "category_scores": {
    "C1": { "score": 100, "renormalized_weight": 0.05, "compliant_count": 1, "is_applicable": true }
  },
  "pillar_scores": {
    "privacy": { "score": 100, "weight": 0.20, "pillar_name": "Privacy Architecture" }
  }
}
```

---

## 8. Unit Test Plan

| Test ID | Test Scenario | Input Conditions | Expected Output |
|---|---|---|---|
| **UT-TS-01** | Full Statutory Compliance | All C1–C10 findings `COMPLIANT`, HTTPS=true, Notice=true | `trust_score: 100.0`, `posture: "Strong"`, both W1 and W2 |
| **UT-TS-02** | Complete Statutory Breach | All C1–C10 findings `NON_COMPLIANT`, HTTPS=true, Notice=true | `trust_score: 0.0`, `posture: "Low"`, both W1 and W2 |
| **UT-TS-03** | Partial Compliance | All C1–C10 findings `PARTIAL`, HTTPS=true, Notice=true | `trust_score: 50.0`, `posture: "Moderate"` |
| **UT-TS-04** | Category Exclusion & Renormalization | C9 marked `NOT_APPLICABLE` (applicable weight sum = 0.80 under W1). C4 compliant (0.25), rest partial (0.55). | $TS = 100 \times [ (0.25/0.80)\times 1.0 + (0.55/0.80)\times 0.5 ] = 100 \times [0.3125 + 0.34375] = 65.6$. |
| **UT-TS-05** | Critical Cap: Missing HTTPS | C1–C10 all `COMPLIANT` (raw score 100.0), but `has_https: false` | `trust_score: 40.0`, `raw_trust_score: 100.0`, `cap_applied: true`, `posture: "Moderate"` |
| **UT-TS-06** | Critical Cap: Missing Notice | C1–C10 all `COMPLIANT` (raw score 100.0), but `has_privacy_notice: false` | `trust_score: 40.0`, `cap_applied: true` |
| **UT-TS-07** | Double Critical Cap + Low Raw Score | Raw score evaluates to 25.0, `has_https: false` | `trust_score: 25.0` (remains $\min(25, 40) = 25$), `posture: "Low"` |
| **UT-TS-08** | All Not Applicable Edge Case | All C1–C10 marked `NOT_APPLICABLE` | `trust_score: null`, `posture: "Not Scorable"` |
| **UT-TS-09** | UI Pillar Adapter Parity | Compute C1–C10 score -> verify `pillar_scores` contains all 6 keys (`privacy`, `security`, `transparency`, `governance`, `lifecycle`, `rights`) with valid scores | All 6 pillar keys present and populated |
| **UT-TS-10** | W1 vs W2 Sensitivity | Compare scores when C4 is 100 and others are 0: W1 (weight 0.25) vs W2 (weight 0.10) | W1 score = 25.0, W2 score = 10.0 |
