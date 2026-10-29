# TrustForge — Statutory Enforceability & Legal Applicability Framework

**Document ID:** `docs/research/LEGAL_APPLICABILITY_VERIFICATION.md`  
**Phase:** 2B / 2G — Legal Applicability & Statutory Provenance Layer  
**Project:** TrustForge Research Platform  
**Research Title:** An Evidence-Grounded RAG Framework for Digital Personal Data Protection Compliance Assessment  
**Jurisdiction:** Republic of India (DPDP Act, 2023 & Notified DPDP Rules, 2025)  
**Date:** October 2026  
**Status:** **AUTHORITATIVE & VERIFIED**  

---

## 1. The Statutory Applicability Problem in Compliance RAG

A critical failure mode of generic LLMs in legal compliance evaluation is **statutory conflation**:
1. Confusing notified, in-force sections with provisions whose commencement has been deferred by Official Gazette notification.
2. Treating transitional readiness guidance as immediate statutory violations.
3. Marking an organisation as "Non-Compliant" (FAIL) on an obligation whose legal enforcement date has not yet arrived.

To eliminate hallucinated enforceability, TrustForge introduces a **Deterministic Statutory Applicability Layer** that attaches immutable legal status metadata to every retrieved chunk.

---

## 2. Authoritative Corpus Taxonomy (83 Chunks)

The authoritative legal corpus (`backend/knowledge/authoritative_corpus.json`) contains 83 chunks categorized across three official gazette publications:

| Source Document | Official Reference | Gazette Date | Chunks | Statutory Role |
|---|---|:---:|:---:|---|
| **The DPDP Act, 2023** | Act No. 22 of 2023 | 11 August 2023 | 52 | Primary Legislation (Sections 1 to 44, Preamble, Schedule) |
| **DPDP Rules, 2025** | G.S.R. 846(E) | 13 November 2025 | 18 | Delegated Legislation (Rules 1 to 18, Notice details, Consent Manager technical specifications) |
| **Rules 2025 Schedules** | First & Second Schedules | 13 November 2025 | 12 | Technical specifications for Consent Managers & Data Breach Formats |
| **Commencement Notification** | G.S.R. 843(E) | 13 November 2025 | 1 | Phased commencement order appointing effective dates |
| **Total Corpus** | — | — | **83** | **Authoritative Statutory Index** |

---

## 3. Statutory Enforceability Classifications

Every statutory chunk in `public."Legal_Chunks"` carries four explicit legal metadata fields:

```typescript
export interface StatutoryMetadata {
  commencement_status: 'IN_FORCE' | 'PHASED_READINESS' | 'TRANSITIONAL' | 'DEFERRED';
  effective_date: string;       // ISO Date format: e.g. "2023-08-11" or "2025-11-13"
  enforceability: 'CURRENTLY_ENFORCEABLE' | 'TRANSITIONAL_COMPLIANCE' | 'FUTURE_ENFORCEMENT';
  authority: string;            // e.g. "MeitY, Government of India"
}
```

### 3.1 Classification Rules Applied by Hybrid RAG

1. **`CURRENTLY_ENFORCEABLE`**:
   - Provisions enacted and notified under G.S.R. 843(E) where immediate adherence is mandatory (e.g., Section 4 Grounds for Processing, Section 5 Notice, Section 6 Consent, Section 8 Data Fiduciary Obligations, Section 9 Processing of Children's Data).
   - *Model Directive*: Failure to provide affirmative evidence of compliance results in `NOT_SUPPORTED` (Potential Gap / Critical Risk).
2. **`TRANSITIONAL_COMPLIANCE`**:
   - Provisions where official notifications provide an operational transition window (e.g., technical registration of Consent Managers under Rule 6 and First Schedule specifications).
   - *Model Directive*: Identified gaps must be labelled `PARTIALLY_SUPPORTED` or flagged with transitional readiness recommendations rather than immediate punitive liability.
3. **`FUTURE_ENFORCEMENT`**:
   - Provisions dependent upon secondary notifications or infrastructure not yet operational (e.g., specific appellate tribunal fee structures under Section 29).
   - *Model Directive*: Must be classified as `NOT_APPLICABLE` or informational advisory.

---

## 4. Citation and Provenance Traceability Contract

When retrieved by the Hybrid RAG engine, every context chunk supplied to the LLMs is formatted with verbatim legal metadata:

```
[dpdp-act-2023-section-5] Section 5 — Notice given by Data Fiduciary (Section 5)
[RRF Score: 0.0328 | BM25 Rank: 1 | Vector Rank: 2]
"5. (1) Every request made to a Data Principal under section 6 for consent shall be accompanied or preceded by a notice given by the Data Fiduciary..."
(Enforceability: CURRENTLY_ENFORCEABLE, Effective Date: 2023-08-11, Source: Act No. 22 of 2023)
```

This guarantees that:
1. The LLM can never claim ignorance of the section's legal enforcement status.
2. The `GroundingValidator` can deterministically verify that all model citations map to actual, active legal provisions.
3. The final PDF compliance report provides the faculty supervisor with court-verifiable statutory provenance.
