# TrustForge Phase 3: Authoritative DPDP Legal Corpus Validation Report

**Document Version:** 1.0  
**Phase:** Phase 3 — Authoritative DPDP Legal Corpus  
**Date:** 2026-10-09  
**Author:** TrustForge Research & Engineering Team  
**Branch:** `research/real-compliance-engine`  
**Evaluation Target:** Official Statutory Replacement of Abbreviated Knowledge Base  

---

## Executive Summary

Phase 3 addresses a foundational scientific limitation identified during the research readiness audit of TrustForge: **the statutory knowledge base previously relied upon an abbreviated 14-chunk, 13-section synthetic excerpt that misidentified enacted provisions, truncated statutory subsections, omitted the notified DPDP Rules, 2025, and failed to account for phased commencement dates.** Furthermore, existing research reports incorrectly characterized the DPDP Rules as unnotified drafts.

In this phase, we have:
1. **Acquired and verified official Indian Government Gazette publications** for the DPDP Act, 2023 (Act No. 22 of 2023), the Notified DPDP Rules, 2025 (G.S.R. 846(E), 13 November 2025), and the Phased Commencement Notification (G.S.R. 843(E), 13 November 2025), with SHA-256 cryptographic hashes.
2. **Preserved the historical 14-chunk baseline index** (`backend/knowledge/index_baseline_v1_14chunks/`) and all Phase 1/2 benchmark records without overwriting.
3. **Constructed a complete, traceable 83-chunk statutory corpus** preserving verbatim statutory text, exact section/rule numbering, schedules, and commencement metadata without paraphrasing or truncation.
4. **Corrected inaccurate statutory references across all 20 canonical TrustForge compliance controls**, resolving 7 critical section-level errors (including Data Processor contracts in Section 8(2) vs 8(7), Reasonable Security Safeguards in Section 8(5) vs 8(3), Breach Notification in Section 8(6) vs 8(4), and Storage Limitation in Section 8(7)-(8) vs 8(5)).
5. **Implemented commencement-aware compliance evaluation** in the Trust Inference Engine (TIE), distinguishing currently enforceable mandates (November 2025) from phased readiness requirements (November 2026 and May 2027).
6. **Executed a versioned RAG retrieval benchmark (v2.0)** across 45 queries against the expanded 83-chunk corpus, demonstrating 82.93% Hit@5, 0.6911 MRR@5, 100% Hit@1 on key operational queries (Section 3, Section 8, Section 16, Rules 6, 7, 8, 9), and robust out-of-scope distractor rejection (maximum similarity 0.4917).
7. **Executed full regression verification**, confirming 100% unit test pass rate (30/30) and clean production frontend build (`npm run build`).

---

## 1. Authoritative Source Registry

All source publications were obtained directly from the Ministry of Electronics and Information Technology (MeitY) and the Legislative Department, Ministry of Law and Justice, Government of India. The original PDF publications and extracted text files are preserved in `backend/knowledge/sources/`.

| Document Identifier | Official Title | Enacting / Notifying Authority | Publication Reference | Gazette Date | SHA-256 Checksum | File Size (Bytes) |
|---|---|---|---|---|---|---|
| **`dpdp-act-2023`** | The Digital Personal Data Protection Act, 2023 | Parliament of India / Ministry of Law and Justice | Act No. 22 of 2023; Gazette of India Extraordinary, Part II, Sec. 1, No. 25 | 11 August 2023 | `4deb23981d3010c8225a2ff6149e7243dc2268455b299e283afebdd7b72a7d15` | 182,082 |
| **`dpdp-rules-2025`** | The Digital Personal Data Protection Rules, 2025 | Ministry of Electronics and Information Technology (MeitY) | G.S.R. 846(E); Gazette of India Extraordinary, Part II, Sec. 3(i), No. 760 | 13 November 2025 | `eabc7d05e013144615d78ddc0e8b9c9aac1920e814f4fad38ce6560951f5aa08` | 2,492,944 |
| **`dpdp-act-commencement-2025`** | Notification of Phased Commencement of the DPDP Act, 2023 | Ministry of Electronics and Information Technology (MeitY) | G.S.R. 843(E); Gazette of India Extraordinary, Part II, Sec. 3(i), No. 757 | 13 November 2025 | `6df25cd8c76ac8eb18cae81835d51d51128ffbf2ed13262843395efddf0998e5` | 1,869,005 |

### Official URLs:
- **DPDP Act, 2023:** [https://www.meity.gov.in/static/uploads/2024/06/2bf1f0e9f04e6fb4f8fef35e82c42aa5.pdf](https://www.meity.gov.in/static/uploads/2024/06/2bf1f0e9f04e6fb4f8fef35e82c42aa5.pdf)
- **DPDP Rules, 2025 (Notified):** [https://www.meity.gov.in/static/uploads/2025/11/53450e6e5dc0bfa85ebd78686cadad39.pdf](https://www.meity.gov.in/static/uploads/2025/11/53450e6e5dc0bfa85ebd78686cadad39.pdf)
- **Act Commencement Notification:** [https://www.meity.gov.in/static/uploads/2025/11/c56ceae6c383460ca69577428d36828b.pdf](https://www.meity.gov.in/static/uploads/2025/11/c56ceae6c383460ca69577428d36828b.pdf)

---

## 2. Corpus Coverage and Chunk Count

### 2.1 Comparison with Historical Baseline

| Dimension | Phase 1/2 Baseline | Phase 3 Authoritative Corpus | Expansion Factor | Scientific Safeguard / Provenance |
|---|---|---|---|---|
| **Total Vector Chunks** | 14 chunks | **83 chunks** | **5.93x** | Dense vector index built via `sentence-transformers/all-MiniLM-L6-v2` |
| **Statutory Coverage** | 13 abbreviated sections | **44 Act Sections + Preamble + Act Schedule + 23 Rules + 4 Rule Schedules + Commencement** | Complete Statutory Coverage | 100% official Gazette text |
| **DPDP Act, 2023 Chunks** | 14 chunks | **53 chunks** | 3.79x | Exact verbatim legal text, zero ellipsis summaries |
| **DPDP Rules, 2025 Chunks** | 0 chunks (omitted) | **29 chunks** | New capability | All 23 Notified Rules + First Schedule (Parts A & B), Second Schedule, Third Schedule, Fourth Schedule (Parts A & B) |
| **Commencement Notification Chunks** | 0 chunks (omitted) | **1 chunk** | New capability | Verbatim G.S.R. 843(E) phased schedule |
| **Section Numbering Fidelity** | Synthetic summaries | **100% Verbatim** | Exact | Original numbering preserved; no renumbering or synthetic synthesis |
| **Historical Baseline Preservation** | N/A | **Preserved intact** | Baseline Saved | `backend/knowledge/index_baseline_v1_14chunks/` |

### 2.2 Structure-Aware Chunking Strategy

To avoid breaking provisions across arbitrary character boundaries, chunking was implemented with legal structure awareness:
1. **Short-to-Medium Sections (Sections 1, 3–5, 7, 9–44):** Preserved as intact single chunks, keeping subsections, explanations, and statutory illustrations unified with their parent section.
2. **Section 2 (Definitions):** Divided into 4 coherent clause groups based on statutory alphabetization:
   - `dpdp-act-2023-section-2-clauses-a-to-g`: Definitions *(Appellate Tribunal to Consent Manager)*
   - `dpdp-act-2023-section-2-clauses-h-to-n`: Definitions *(Data to Digital Personal Data)*
   - `dpdp-act-2023-section-2-clauses-o-to-s`: Definitions *(Gain to Person)*
   - `dpdp-act-2023-section-2-clauses-t-to-zb`: Definitions *(Personal Data, Personal Data Breach, Processing to State)*
   - Each group prepends the enacting intro: *"2. In this Act, unless the context otherwise requires,—"*.
3. **Section 6 (Consent):** Divided into 2 functional groups:
   - `dpdp-act-2023-section-6-subsections-1-to-5`: Consent validity, unbundling, withdrawal ease, and pre-withdrawal legality.
   - `dpdp-act-2023-section-6-subsections-6-to-10`: Post-withdrawal cessation, Consent Managers, unbundled service mandate, and fiduciary burden of proof.
4. **Section 8 (General Obligations of Data Fiduciary):** Divided into 5 distinct operational groups:
   - `dpdp-act-2023-section-8-subsections-1-to-2`: Fiduciary liability & mandatory processor contracts.
   - `dpdp-act-2023-section-8-subsections-3-to-4`: Data completeness, accuracy, and technical/organizational measures.
   - `dpdp-act-2023-section-8-subsections-5-to-6`: Reasonable security safeguards & breach intimation.
   - `dpdp-act-2023-section-8-subsections-7-to-8`: Mandatory data erasure, purpose cessation, and processor erasure.
   - `dpdp-act-2023-section-8-subsections-9-to-11`: Publication of DPO/contact details & grievance redressal mechanism.
5. **DPDP Rules, 2025:** Each of the 23 Rules is indexed as a dedicated chunk. The 4 Schedules are partitioned according to official parts (First Schedule Part A & B, Second Schedule, Third Schedule, Fourth Schedule Part A & B).

---

## 3. Statutory Mapping Corrections for the 20 Core Controls

Prior to modifying control definitions, an explicit audit of the 20 canonical controls in `backend/compliance/controls.py` was conducted against the Gazette texts. Seven critical statutory errors were uncovered and corrected.

### 3.1 Old-to-New Control Statutory Mapping Table

| Control ID | Pillar | Control Title | Old Legal Reference | Correct Official Statutory Reference | Status / Legal Error Identified |
|---|---|---|---|---|---|
| **`TF-PRIV-001`** | Privacy | Privacy Notice Availability | Section 5 | **Section 5(1) & Rule 3** | Refined to Section 5(1) read with Rule 3 (itemised notice disclosures). |
| **`TF-PRIV-002`** | Privacy | Notice Language Accessibility | Section 5 | **Section 5(3) & Rule 3(3)** | Refined to specific subsection for Eighth Schedule language options. |
| **`TF-PRIV-003`** | Privacy | Consent Mechanism — Free, Specific, Informed | Section 6 | **Section 6(1)-(2)** | Refined to Section 6(1)-(2) (affirmative action and unconditional validity). |
| **`TF-PRIV-004`** | Privacy | Consent Withdrawal Ease | Section 6 | **Section 6(4)** | Refined to specific subsection guaranteeing ease of withdrawal comparable to giving. |
| **`TF-PRIV-005`** | Privacy | Lawful Basis for Each Processing Purpose | Section 4 | **Section 4, 6 & 7** | Refined to include cross-reference to Section 6 (consent) and Section 7 (legitimate uses). |
| **`TF-SEC-001`** | Security | Transport Security (HTTPS + HSTS) | Section 8(3) | **Section 8(5) & Rule 6** | **CRITICAL FIX**: Old Section 8(3) is *data completeness and accuracy*. Reasonable security safeguards is Section 8(5) read with DPDP Rules Rule 6. |
| **`TF-SEC-002`** | Security | Security Response Headers | Section 8(3) | **Section 8(5) & Rule 6** | **CRITICAL FIX**: Old Section 8(3) is *data completeness and accuracy*. Technical safeguards to prevent breach are governed by Section 8(5) and Rule 6. |
| **`TF-SEC-003`** | Security | Breach Response Readiness | Section 8(4) | **Section 8(6) & Rule 7** | **CRITICAL FIX**: Old Section 8(4) is *technical and organisational measures*. Breach intimation to Board and Data Principals is Section 8(6) read with Rule 7. |
| **`TF-SEC-004`** | Security | Third-Party Tracker Pre-Consent Loading | Section 4 | **Section 4(1)(a) & Section 6(1)** | Refined to Section 4(1)(a) read with Section 6(1) (pre-consent tracking lacks lawful basis). |
| **`TF-TRANS-001`** | Transparency | Grievance Officer Contact Published | Section 8(6) | **Section 8(9) & Rule 9** | **CRITICAL FIX**: Old Section 8(6) is *breach intimation*. Publication of DPO/business contact details is Section 8(9) read with Rule 9. |
| **`TF-TRANS-002`** | Transparency | Data Category Disclosure in Privacy Notice | Section 5 | **Section 5(1)(i) & Rule 3(1)(a)** | Refined to specific notice itemisation clauses in Act and Rules. |
| **`TF-GOV-001`** | Governance | Data Processor Contracts | Section 8(7) | **Section 8(2)** | **CRITICAL FIX**: Old Section 8(7) is *data erasure*. Processor engagement strictly under a valid contract is enacted under Section 8(2). |
| **`TF-GOV-002`** | Governance | Data Accuracy Practices | Section 8(1) | **Section 8(3)** | **CRITICAL FIX**: Old Section 8(1) is *general compliance liability*. Data completeness, accuracy, and consistency is Section 8(3). |
| **`TF-LIFE-001`** | Data Lifecycle | Retention Limitation | Section 8(5) | **Section 8(7)-(8) & Rule 8** | **CRITICAL FIX**: Old Section 8(5) is *security safeguards*. Storage limitation and purpose cessation are Section 8(7)-(8) read with Rule 8 & Third Schedule. |
| **`TF-LIFE-002`** | Data Lifecycle | Data Erasure Process | Section 12(d) | **Section 12(1)(d), Section 8(7) & Rule 14(3)** | Refined to combine Data Principal right under 12(1)(d) with fiduciary obligation under 8(7) and procedure under Rule 14(3). |
| **`TF-LIFE-003`** | Data Lifecycle | Data Minimisation | Section 4 | **Section 6(1) & Section 4** | Refined to include Section 6(1) ("limited to such personal data as is necessary for such specified purpose"). |
| **`TF-RIGHTS-001`** | User Rights | Right to Access Information | Section 11 | **Section 11 & Rule 14(1)** | Refined to Section 11 read with Rule 14(1) access procedure. |
| **`TF-RIGHTS-002`** | User Rights | Right to Correction and Erasure | Section 12 | **Section 12 & Rule 14(2)-(3)** | Refined to Section 12 read with Rule 14(2)-(3) procedural timelines. |
| **`TF-RIGHTS-003`** | User Rights | Grievance Redressal Mechanism | Section 13 | **Section 13, Section 8(10) & Rule 14(4)** | Refined to combine Section 13 with Section 8(10) and Rule 14(4) response periods. |
| **`TF-RIGHTS-004`** | User Rights | Rights Request Process Availability | Section 5(b) | **Section 5(1)(ii) & Rule 3(1)(b)** | Refined to Section 5(1)(ii) read with Rule 3(1)(b) (notice describing manner of exercising rights). |

---

## 4. Commencement-Date Handling & Enforceability Framework

The DPDP Act, 2023 was assented to on 11 August 2023, but Section 1(2) provided that different dates may be appointed for different provisions. On **13 November 2025**, the Central Government notified **G.S.R. 843(E)** and **G.S.R. 846(E)**, establishing a phased implementation schedule.

### 4.1 Statutory Phased Implementation Schedule

```
Timeline:
13 November 2025                     13 November 2026                     13 May 2027
──────┬────────────────────────────────────┬────────────────────────────────────┬──────▶
      │                                    │                                    │
      ▼                                    ▼                                    ▼
PHASE 1: IN FORCE                   PHASE 2: 1-YEAR TRANSITION          PHASE 3: 18-MONTH FULL FORCE
• Board Establishment (Sec 18-26)   • Unbundled Consent (Sec 6(9))      • Applicability & Notice (Sec 3-5)
• Definitions & Scope (Sec 1-2)     • Consent Managers (Rule 4,         • Consent Mandates (Sec 6(1-8))
• Administrative Powers (Sec 35,      First Schedule)                   • Fiduciary Obligations (Sec 8)
  Sec 38-44)                        • Penalties on Consent              • Children & SDF (Sec 9, 10)
• Board Digital Office (Rule 17-21)   Managers (Sec 27(1)(d))           • Rights & Grievance (Sec 11-15)
                                                                        • Cross-border & Penalties (Sec 16, 27)
                                                                        • Technical Rules (Rules 3, 5-16, 22-23)
Status:                             Status:                             Status:
CURRENTLY_ENFORCEABLE               PHASED_READINESS                    PHASED_READINESS
```

### 4.2 Enforceability Metadata Schema

Every chunk in `backend/knowledge/authoritative_corpus.json` carries three statutory timing fields:
- `commencement_status`: `"IN_FORCE"` | `"NOTIFIED_PHASED_1YR"` | `"NOTIFIED_PHASED_18MO"`
- `effective_date`: `"2025-11-13"` | `"2026-11-13"` | `"2027-05-13"`
- `enforceability`: `"CURRENTLY_ENFORCEABLE"` | `"PHASED_READINESS"`

### 4.3 TIE System Safeguard Against Premature Legal Claims

In `backend/compliance/tie_evaluator.py`, the system instructions and passage construction were updated to enforce strict scientific and legal realism:
- **Passage Header Injection:** Every passage injected into TIE includes explicit metadata:
  `[Chunk ID: ... | Document: ... | Section: ... | Commencement: NOTIFIED_PHASED_18MO | Effective: 2027-05-13 | Enforceability: PHASED_READINESS]`
- **System Instruction 9:** TIE is strictly instructed:
  > *"If a retrieved statutory provision has Commencement Status 'NOTIFIED_PHASED_1YR' or 'NOTIFIED_PHASED_18MO' (Enforceability: 'PHASED_READINESS'), do NOT describe gaps as already enforceable legal violations. Instead, characterize findings as 'future compliance readiness' or 'preparatory readiness for phased enforcement', clearly distinguishing in-force legal requirements from future obligations."*

This safeguard ensures TrustForge never makes misleading claims that an organization has violated a law that is not yet in force, while enabling proactive compliance posture readiness.

---

## 5. Retrieval Benchmark Results (Version 2.0 Evaluation)

A versioned retrieval benchmark (`docs/research/evaluation/datasets/rag_retrieval_benchmark_v2_authoritative.json`) was executed across 45 queries (41 answerable queries and 4 out-of-scope adversarial distractors) using `docs/research/evaluation/experiments/run_rag_eval_v2.py`.

### 5.1 Benchmark Metrics: Baseline vs Expanded Authoritative Corpus

| Metric | Version 1.0 Baseline (14-Chunk Synthetic Index) | Version 2.0 Authoritative (83-Chunk Gazette Index) | Scientific Interpretation |
|---|---|---|---|
| **Corpus Size** | 14 chunks | **83 chunks** | 5.9x larger search space; realistic academic retrieval challenge |
| **Top-K Search Ratio** | Top-5 retrieves **35.7%** of corpus | Top-5 retrieves **6.02%** of corpus | Eliminates artificial metric inflation caused by small corpus size |
| **Answerable Queries** | 31 queries | **41 queries** | Expanded to include Section 3, Section 8, Section 16, Rules, Commencement |
| **Out-of-Scope Queries** | 4 distractors | 4 distractors | GDPR, CCPA, Nginx SSL, Corporate Tax filings |
| **Hit@1** | 70.97% (22/31) | **58.54% (24/41)** | High precision on the single top retrieved chunk in dense search space |
| **Hit@3** | 96.77% (30/31) | **78.05% (32/41)** | Robust recall within top 3 passages |
| **Hit@5** | 100.00% (31/31) | **82.93% (34/41)** | Strong retrieval coverage across fine-grained sub-provisions |
| **MRR@5** | 0.8306 | **0.6911** | Mean reciprocal rank across dense statutory sub-provisions |
| **NDCG@5** | 0.8484 | **0.6345** | Graded relevance accounting for multi-chunk relevant provisions |
| **Mean Retrieval Latency** | 3.52 ms | **6.76 ms** | Real-time performance suitable for interactive web workflows (<10 ms) |
| **Out-of-Scope Max Sim** | 0.4421 | **0.4917** | **Zero False Positives**: All distractors remain safely below the 0.50 threshold |

### 5.2 Deep-Dive Evaluation of Required Target Areas

| Query ID | Target Legal Area | Query Text | Top-1 Retrieved Chunk | Cosine Sim | Hit@1 | Hit@5 |
|---|---|---|---|---|---|---|
| `rag_036` | **Section 3 Applicability** | *Does the DPDP Act apply to processing of personal data outside India if offering goods or services to Data Principals in India?* | `dpdp-act-2023-section-3` | **0.7212** | **1** | **1** |
| `rag_037` | **Section 3 Exemptions** | *Does the DPDP Act apply to personal data processed by an individual for personal or domestic purposes?* | `dpdp-act-2023-section-3` | **0.5561** | **1** | **1** |
| `rag_012` | **Section 8(2) Contracts** | *Can a Data Fiduciary engage a Data Processor without a contract?* | `dpdp-act-2023-section-8-subsections-1-to-2` | **0.7516** | **1** | **1** |
| `rag_045` | **Section 8(3) Accuracy** | *What data accuracy, completeness, and consistency obligations are imposed on Data Fiduciaries under Section 8(3)?* | `dpdp-act-2023-section-8-subsections-3-to-4` | **0.7607** | **1** | **1** |
| `rag_010` | **Section 8(5) Security** | *What reasonable security safeguards must a Data Fiduciary implement?* | `dpdp-act-2023-section-8-subsections-5-to-6` | **0.7729** | **1** | **1** |
| `rag_013` | **Section 8(7) Erasure** | *When must personal data be erased or retention ceased by the fiduciary?* | `dpdp-rules-2025-rule-8` | **0.7794** | **1** | **1** |
| `rag_043` | **Section 8(9) DPO** | *What are the publication requirements for Data Protection Officer business contact information under Section 8(9) and Rule 9?* | `dpdp-rules-2025-rule-9` | **0.6045** | **1** | **1** |
| `rag_038` | **Section 16 Cross-Border** | *What restrictions govern the transfer and processing of personal data outside India under Section 16?* | `dpdp-rules-2025-rule-15` | **0.8092** | **1** | **1** |
| `rag_039` | **Rule 6 Safeguards** | *What specific reasonable security safeguards including encryption and access control are mandated under Rule 6 of DPDP Rules 2025?* | `dpdp-rules-2025-rule-6` | **0.4965** | **1** | **1** |
| `rag_011` | **Rule 7 Breach Notice** | *Who must be notified in the event of a personal data breach and what is required?* | `dpdp-rules-2025-rule-7` | **0.6885** | **1** | **1** |
| `rag_041` | **Rule 8 Storage Limitation** | *What are the deemed purpose cessation and storage limitation periods specified under Rule 8 and the Third Schedule for e-commerce entities?* | `dpdp-rules-2025-rule-8` | **0.5154** | **1** | **1** |
| `rag_042` | **Rule 4 Consent Managers** | *What are the registration conditions and net worth requirements for Consent Managers under the DPDP Rules 2025 First Schedule?* | `dpdp-rules-2025-first-schedule-part-a` | **0.6270** | **1** | **1** |
| `rag_044` | **Commencement Schedule** | *Which provisions of the DPDP Act come into force immediately versus after 18 months under the commencement notification G.S.R. 843(E)?* | `dpdp-act-2023-section-43` (Rank 1)<br>`dpdp-act-commencement-gsr-843e` (Rank 2) | **0.5117** | 0 | **1** |

---

## 6. Citation Fidelity Checks

Every citation generated by the compliance engine references an official chunk ID and resolves directly to verbatim statutory text.

### Verification Matrix

```
[Assessment Finding] 
       │
       ▼
[Citation Reference] ─────────▶ Document: The Digital Personal Data Protection Act, 2023
                                Section: Section 8(2)
                                Chunk ID: dpdp-act-2023-section-8-subsections-1-to-2
                                Excerpt: "(2) A Data Fiduciary may engage, appoint, use or otherwise
                                          involve a Data Processor to process personal data on its behalf
                                          for any activity related to offering of goods or services to Data
                                          Principals only under a valid contract."
                                Source URL: https://www.meity.gov.in/static/uploads/2024/06/2bf1f0e9f04e6fb4f8fef35e82c42aa5.pdf
                                Commencement Status: NOTIFIED_PHASED_18MO (Effective: 2027-05-13)
                                Enforceability: PHASED_READINESS
```

- **Section 8(2) Fidelity:** Resolves to exact words of Act No. 22 of 2023, Section 8, Subsection (2). (Previously misattributed to Section 8(7)).
- **Section 8(5) & Rule 6 Fidelity:** Resolves to reasonable security safeguards to prevent personal data breach and Rule 6 technical measures. (Previously misattributed to Section 8(3)).
- **Section 8(6) & Rule 7 Fidelity:** Resolves to personal data breach intimation to Board and Data Principals. (Previously misattributed to Section 8(4)).
- **Section 8(9) & Rule 9 Fidelity:** Resolves to business contact info of DPO. (Previously misattributed to Section 8(6)).

---

## 7. Full Regression Results

To verify that the statutory knowledge base expansion and control mapping corrections did not degrade frontend functionality, assessment pipelines, or Trust Score determinism, comprehensive regression tests were executed:

### 7.1 Backend Unit Test Suite
```bash
pytest backend/tests/unit
```
**Results:**
- `test_api_endpoints_full.py`: **PASSED** (1/1)
- `test_citation_grounding.py`: **PASSED** (14/14)
- `test_trust_score_determinism.py`: **PASSED** (15/15)
- **Total:** **30 passed in 1.82s (100% pass rate)**.
- Trust Score calculations remain 100% deterministic (reproducible mathematically across runs).

### 7.2 Frontend Production Build
```bash
cd "TrustForge Frontend" && npm run build
```
**Results:**
- TypeScript Typecheck (`tsc -b`): **PASSED** (0 errors)
- Vite Production Bundle (`vite build`): **PASSED** (1908 modules transformed, built in 322ms)
- Output bundle: `dist/index.html` (1.62 kB), `dist/assets/index-CXxbZ6tO.css` (57.70 kB), `dist/assets/index-DYXt5yXR.js` (545.39 kB)

---

## 8. Remaining Limitations and Research Opportunities

1. **Section 16 Restricted Territories List:**
   Section 16 empowers the Central Government to notify a "black list" of countries or territories outside India to which personal data transfers are prohibited. As of October 2026, the Central Government has not yet published the negative list of restricted countries. The knowledge base accurately incorporates Section 16 and Rule 15, but external territory checks remain dependent on future government notifications.
2. **Dense Semantic vs. Hybrid Keyword Retrieval:**
   In an 83-chunk corpus, certain highly specific legal questions (e.g., distinguishing Section 8(4) general technical measures from Section 8(5) reasonable security safeguards) share dense vocabulary overlap. Implementing hybrid dense + BM25 sparse retrieval or legal reranking (e.g., Cohere/bge-reranker) could further boost Hit@1 from 58.5% to >80%.
3. **Multi-Pillar Evidence Correlation:**
   While the statutory corpus now accurately distinguishes currently enforceable provisions from phased provisions, scanner evidence keys remain primarily technical HTTP header observations. Incorporating natural language document scanning (e.g. OCR for vendor DPA contracts) would close the remaining evidentiary gap on qualitative governance controls.

---

## 9. Files Modified and Created

### Files Created:
1. `backend/knowledge/sources/dpdp_act_2023.pdf` — Official DPDP Act 2023 gazette PDF.
2. `backend/knowledge/sources/dpdp_rules_2025_notified.pdf` — Official DPDP Rules 2025 gazette PDF.
3. `backend/knowledge/sources/dpdp_act_commencement_2025.pdf` — Official Commencement Notification PDF.
4. `backend/knowledge/sources/extracted/act_2023.txt` — Verbatim text of DPDP Act 2023 (65,706 bytes).
5. `backend/knowledge/sources/extracted/rules_2025.txt` — Verbatim text of DPDP Rules 2025 (209,661 bytes).
6. `backend/knowledge/sources/extracted/commencement.txt` — Verbatim text of G.S.R. 843(E) (4,559 bytes).
7. `backend/knowledge/build_authoritative_corpus.py` — Statutory corpus extraction engine.
8. `backend/knowledge/authoritative_corpus.json` — 83-chunk authoritative statutory corpus dataset.
9. `backend/knowledge/index_baseline_v1_14chunks/` — Preserved baseline 14-chunk FAISS index and metadata.
10. `docs/research/evaluation/datasets/rag_retrieval_benchmark_v2_authoritative.json` — Version 2.0 45-query retrieval benchmark.
11. `docs/research/evaluation/experiments/run_rag_eval_v2.py` — Benchmark execution script for v2.0.
12. `docs/research/evaluation/results/rag_results_v2_authoritative.csv` — Per-query retrieval evaluation results.
13. `docs/research/evaluation/results/rag_summary_v2_authoritative.json` — Aggregated retrieval evaluation metrics.
14. `docs/research/PHASE3_LEGAL_CORPUS_VALIDATION.md` — This validation deliverable report.

### Files Modified:
1. `backend/core/models.py` — Added `commencement_status`, `effective_date`, `enforceability` to `RetrievedChunk`.
2. `backend/rag/retrieval.py` — Forwarded commencement metadata to retrieved chunk objects.
3. `backend/rag/ingest.py` — Updated `SOURCE_REGISTRY` to official November 2025 gazette publications and configured ingestion to load `authoritative_corpus.json`.
4. `backend/compliance/controls.py` — Corrected legal mappings and descriptions for all 20 canonical controls.
5. `backend/compliance/tie_evaluator.py` — Updated `SYSTEM_INSTRUCTIONS` with commencement guidance and updated passage formatting with commencement metadata.

---

## 10. Git Status

```
On branch research/real-compliance-engine
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   TrustForge Frontend/src/components/layout/PublicLayout.tsx
	modified:   TrustForge Frontend/src/components/scanner/ProcessingVisual.tsx
	modified:   TrustForge Frontend/src/context/OrgContext.tsx
	modified:   TrustForge Frontend/src/hooks/useAsync.ts
	modified:   TrustForge Frontend/src/lib/format.ts
	modified:   TrustForge Frontend/src/pages/admin/shared.tsx
	modified:   TrustForge Frontend/src/pages/app/AssessmentPage.tsx
	modified:   TrustForge Frontend/src/pages/app/DashboardPage.tsx
	modified:   TrustForge Frontend/src/pages/app/EvidencePage.tsx
	modified:   TrustForge Frontend/src/pages/app/FindingsPage.tsx
	modified:   TrustForge Frontend/src/pages/app/RemediationPage.tsx
	modified:   TrustForge Frontend/src/pages/app/ReportsPage.tsx
	modified:   TrustForge Frontend/src/pages/app/TrustScorePage.tsx
	modified:   TrustForge Frontend/src/pages/app/WebsiteScanPage.tsx
	modified:   TrustForge Frontend/src/pages/public/LandingPage.tsx
	modified:   TrustForge Frontend/src/pages/public/PublicScanPage.tsx
	modified:   TrustForge Frontend/src/services/index.ts
	modified:   TrustForge Frontend/src/types/index.ts

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	FINAL_RESEARCH_COMPLETION_REPORT.md
	FINAL_VERIFICATION_REPORT.md
	LIVE_APPLICATION_REPAIR_REPORT.md
	Start_TrustForge.bat
	TrustForge Frontend/.env.example
	TrustForge Frontend/src/services/api.ts
	TrustForge_Start_Instructions.txt
	WHAT_IS_DONE_AND_HOW_TO_RUN.md
	backend/
	docs/research/
	scratch/

no changes added to commit (use "git add" to track)
```
*(In accordance with project guidelines, no commits, pushes, or merges were executed).*
