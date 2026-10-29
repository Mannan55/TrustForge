# TrustForge Research Methodology

**Title:** An Evidence-Grounded RAG Framework for Digital Personal Data Protection Compliance Assessment  
**Document Version:** 1.0  
**Date:** 2026-10-09  

---

## 1. Research Objective

Organizations operating in India face substantial compliance challenges under the **Digital Personal Data Protection Act, 2023 (DPDP Act 2023)**. Existing automated compliance scanners primarily check superficial client-side signals (e.g., cookie banners or HTTPS), lacking statutory contextualization. Conversely, manual legal audits are costly, intermittent, and difficult to scale across fast-evolving web applications.

**TrustForge** investigates a hybrid compliance evaluation paradigm that couples:
1. **Deterministic evidence collection** (HTTP security headers, HTML elements, and self-reported operational practices).
2. **Dense vector retrieval-augmented generation (RAG)** over the authoritative statutory text of the DPDP Act 2023.
3. **Evidence-grounded generative AI interpretation** via the Trust Inference Engine (TIE).
4. **Deterministic mathematical scoring** with dynamic renormalization across statutory trust pillars.

### Fundamental Principle: Non-Certification
TrustForge does **not** provide legal advice, nor does it issue binding legal certifications. It generates reproducible, evidence-backed compliance readiness signals to guide technical and legal remediations.

---

## 2. System Architecture & Component Separation

To maintain strict scientific and regulatory defensibility, TrustForge strictly decouples observation from scoring:

```
[Target Website] ───> [Deterministic Scanner] ───> Evidence Items (High/Medium Confidence)
                                                          │
[Assessment Wizard] ─> [Evidence Mapper] ───────────────> Evidence Items (Self-Reported)
                                                          │
                                                          ▼
[DPDP Act Corpus] ──> [FAISS Vector Store] ────> [TIE Inference Engine]
                                                        │ (Constrained Qualitative Finding)
                                                        ▼
                                                [Control Statuses] (PASS, GAP, FAIL, N/A, INSUF)
                                                        │
                                                        ▼
                                        [Deterministic Scoring Engine] (V1.1)
                                                        │ (Pillar Weights + Dynamic Renorm)
                                                        ▼
                                        [Composite Trust Score (0–100)]
```

### Four Separate Pipeline Stages:
1. **Deterministic Evidence Collection:** Observes technical headers, TLS certificates, tracker scripts, and wizard responses without legal conjecture.
2. **Retrieval-Based Legal Grounding:** Uses FAISS cosine similarity over dense `all-MiniLM-L6-v2` embeddings of the official statute.
3. **Constrained Generative Interpretation (TIE):** Synthesizes observed evidence and retrieved statutory text to classify control status. Emits structured citations strictly validated against retrieved chunk IDs.
4. **Deterministic Scoring Engine:** Mathematical aggregation that computes numerical pillar scores and an overall composite score. The LLM has zero direct influence over numerical scores.

---

## 3. The Canonical Control Registry

TrustForge defines 20 canonical compliance controls mapped to obligations under DPDP Act 2023 across six Trust Pillars:

| Pillar | Control ID | Statutory Reference | Primary Evidence Keys | Method | Weight |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **Privacy** | `TF-PRIV-001` | Section 5 | `privacy_policy_link` | RAG | 2.5 |
| | `TF-PRIV-002` | Section 6 | `cookie_banner_detected`, `notice_languages` | RAG | 2.5 |
| | `TF-PRIV-003` | Section 6(4) | `rights_withdraw` | RAG | 2.0 |
| | `TF-PRIV-004` | Section 5(3) | `notice_languages` | RAG | 1.5 |
| | `TF-PRIV-005` | Section 9 | `children_data_processed`, `parental_consent` | RAG | 2.0 |
| **Security** | `TF-SEC-001` | Section 8(5) | `https_enforced` | Deterministic | 3.0 |
| | `TF-SEC-002` | Section 8(5) | `hsts_header`, `csp_header` | Deterministic | 2.5 |
| | `TF-SEC-003` | Section 8(6) | `breach_plan` | RAG | 2.5 |
| | `TF-SEC-004` | Section 8(5) | `third_party_trackers` | RAG | 2.0 |
| **Transparency** | `TF-TRANS-001` | Section 8(2) | `processor_contracts` | RAG | 2.0 |
| | `TF-TRANS-002` | Section 5(1) | `processing_purposes`, `data_categories` | RAG | 2.0 |
| **Governance** | `TF-GOV-001` | Section 8(9) | `grievance_officer_named` | RAG | 2.5 |
| | `TF-GOV-002` | Section 10 | `data_protection_officer`, `dpia_conducted` | RAG | 2.0 |
| **Data Lifecycle** | `TF-LIFE-001` | Section 8(7) | `retention_policy` | RAG | 2.5 |
| | `TF-LIFE-002` | Section 8(7) | `erasure_automated`, `rights_erasure` | RAG | 2.0 |
| | `TF-LIFE-003` | Section 8(8) | `processor_erasure` | RAG | 1.5 |
| **User Rights** | `TF-RIGHTS-001` | Section 11 | `rights_access` | RAG | 2.0 |
| | `TF-RIGHTS-002` | Section 12 | `rights_correction`, `rights_erasure` | RAG | 2.0 |
| | `TF-RIGHTS-003` | Section 13 | `grievance_contact_published` | RAG | 2.0 |
| | `TF-RIGHTS-004` | Section 5(b) | `rights_portal`, `privacy_policy_link` | RAG | 1.5 |

---

## 4. Ground-Truth Dataset Construction

To eliminate circular evaluation and artificial performance inflation:
1. **Independent Statutory Derivation:** Ground-truth labels were authored by mapping objective technical states and organizational practices directly against statutory requirements, prior to running the AI pipeline.
2. **Synthetic Organization Benchmark (P1.1):** 10 detailed profiles spanning diverse compliance scenarios (BFSI, K-12 EdTech, pure B2B SaaS, non-compliant SME, mission-driven non-profit). Total of 200 ground-truth control assertions.
3. **RAG Retrieval Benchmark (P1.2):** 35 natural-language legal queries referencing verified statutory chunk IDs across 17 distinct compliance topics, including multi-section and out-of-scope distractors.
4. **Scanner Benchmark (P1.3):** 20 controlled HTTP fixtures evaluating binary and categorical observation states without live network variance.

---

## 5. Mathematical Scoring Formulation & Dynamic Renormalization (P0.2)

### 5.1 Outcome Multipliers
Each evaluated control $c$ yields an outcome multiplier $M(c)$:
$$M(c) = \begin{cases} 
1.0 & \text{if } c = \text{PASS} \\ 
0.5 & \text{if } c = \text{POTENTIAL\_GAP} \\ 
0.3 & \text{if } c \in \{\text{INSUFFICIENT\_EVIDENCE}, \text{UNKNOWN}\} \\ 
0.0 & \text{if } c = \text{FAIL} \\ 
\text{excluded} & \text{if } c = \text{NOT\_APPLICABLE} 
\end{cases}$$

### 5.2 Within-Pillar Score
For pillar $P$ with controls $\mathcal{C}_P$:
$$\text{Score}(P) = \frac{\sum_{c \in \mathcal{C}_P, c \neq \text{N/A}} w_c \cdot M(c)}{\sum_{c \in \mathcal{C}_P, c \neq \text{N/A}} w_c} \times 100$$
If all controls in $P$ are $\text{NOT\_APPLICABLE}$, the pillar is excluded from the global aggregation.

### 5.3 Global Composite Trust Score
Letting $\mathcal{P}_{\text{active}}$ be the set of pillars containing at least one applicable control:
$$\text{Trust Score} = \frac{\sum_{P \in \mathcal{P}_{\text{active}}} W_P \cdot \text{Score}(P)}{\sum_{P \in \mathcal{P}_{\text{active}}} W_P}$$
If $\mathcal{P}_{\text{active}} = \emptyset$, the score is undefined (`trust_score = None`, `all_not_applicable = True`, posture = `'Not Scorable'`), preventing false compliance certification.

---

## 6. Threat to Validity & Limitations

1. **Synthetic Fixture Horizon:** Scanner and wizard fixtures evaluate simulated technical environments; real-world single-page applications with complex client-side rendering may present undetected DOM elements.
2. **Free-Tier LLM Rate Limits:** Rate limits on Groq free-tier endpoints necessitate request pacing and budget caps.
3. **Statutory Non-Exhaustiveness:** The indexed knowledge base consists of 14 chunks covering the DPDP Act 2023 statutory core. Delegated legislation (rules and notifications) not yet notified by the Central Government are not included.
