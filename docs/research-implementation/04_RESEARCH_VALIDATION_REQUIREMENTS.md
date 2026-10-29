# TrustForge — Research Validation & Scientific Rigor Requirements

**Document Reference:** `docs/research-implementation/04_RESEARCH_VALIDATION_REQUIREMENTS.md`  
**Date:** October 28, 2026  
**Project:** TrustForge DPDP Compliance Assessment Platform  
**Supervisor Guideline:** Dr. Neelam Naik ("Research method-given to Mannan.docx", Section 4.2.3 & Section 5)  
**Standard:** Peer-Reviewed Academic Rigor, Reproducibility, and Zero Synthetic Fabrication

---

## 1. Ground Truth Annotation Protocol

To scientifically evaluate LLM compliance judgment against human legal standards, the research framework mandates a dual-annotator ground-truth protocol:

```
                  ┌──────────────────────┐
                  │  Evidence Unit (E)   │
                  │  + Obligation (C_k)  │
                  └──────────┬───────────┘
                             │
              ┌──────────────┴──────────────┐
              ▼                             ▼
     ┌─────────────────┐           ┌─────────────────┐
     │  Annotator A1   │           │  Annotator A2   │
     │  (B.Sc IT / CS) │           │  (Legal / DPDP) │
     └────────┬────────┘           └────────┬────────┘
              │                             │
              └──────────────┬──────────────┘
                             │
                     Compare Verdicts
                     & Citations
                             │
              ┌──────────────┴──────────────┐
              ▼                             ▼
       [A1 == A2]                    [A1 != A2]
     Consensus Label            Disagreement Adjudication
     Recorded in Dataset                    │
                                            ▼
                                   ┌─────────────────┐
                                   │  Lead Reviewer  │
                                   │ (Dr. N. Naik)   │
                                   └────────┬────────┘
                                            │
                                    Final Gold Label
```

### Protocol Specifications
1. **Annotator Independence:** Two annotators independently evaluate each (website, obligation) pair using the official Protiviti (Nov 2025) summary and Official Gazette statutory texts.
2. **Label Space:**
   - `COMPLIANT` ($s=1.0$): Observable evidence completely satisfies the statutory condition.
   - `PARTIAL` ($s=0.5$): Evidence indicates partial adherence, ambiguities, or incomplete implementation.
   - `NON_COMPLIANT` ($s=0.0$): Observable evidence affirmatively contradicts the statutory requirement, or mandatory affirmative safeguards are entirely absent.
   - `NOT_DETERMINABLE` / `NOT_APPLICABLE` ($A_i = 0$): Obligation is out of scope for the website's observed business context (e.g., C9 minor's data on adult enterprise platforms).
3. **Inter-Annotator Agreement (Cohen's Kappa):**
   $$\kappa = \frac{P_o - P_e}{1 - P_e}$$
   - $P_o$: Observed proportional agreement across all cases.
   - $P_e$: Expected hypothetical probability of chance agreement.
   - **Acceptance Threshold:** $\kappa \ge 0.70$ required for dataset validity before benchmarking candidate LLMs.
4. **Disagreement Settlement:** A third senior reviewer (faculty supervisor) reviews cases where $A_1 \neq A_2$ to establish the definitive gold label.

---

## 2. Verdict Accuracy & Classification Metrics

Because compliance classes in real-world evaluations are frequently imbalanced (e.g., compliant notices are more common than compliant grievance contacts), **plain accuracy is insufficient and misleading**. The framework evaluates models using:

### Macro-Averaged F1-Score (Primary Metric)
$$\text{Macro-F1} = \frac{1}{|C|} \sum_{c \in C} F1_c, \quad F1_c = \frac{2 \cdot P_c \cdot R_c}{P_c + R_c}$$
- Where $C = \{\text{Compliant}, \text{Partial}, \text{Non-compliant}\}$.
- Prevents a trivial majority-class classifier from appearing competent.

### Accuracy
$$\text{Accuracy} = \frac{\sum_{c \in C} \text{TP}_c}{\text{Total Evaluated Cases}}$$

### Trust Score Prediction Error
$$\text{MAE}_{\text{TS}} = \frac{1}{N} \sum_{j=1}^N \left| \text{TS}_{\text{model}}(j) - \text{TS}_{\text{gold}}(j) \right|$$
$$\text{RMSE}_{\text{TS}} = \sqrt{\frac{1}{N} \sum_{j=1}^N \left( \text{TS}_{\text{model}}(j) - \text{TS}_{\text{gold}}(j) \right)^2}$$

### Spearman's Rank Correlation ($\rho$)
Evaluates whether the candidate LLM ranks websites in the same ordinal compliance order as human experts:
$$\rho = 1 - \frac{6 \sum d_i^2}{N(N^2 - 1)}$$
- Where $d_i = \text{rank}(\text{TS}_{\text{model}, i}) - \text{rank}(\text{TS}_{\text{gold}, i})$.

---

## 3. Grounding Verification Metrics

A core contribution of TrustForge is **evidence-grounded RAG**, preventing models from inventing statutory provisions or evidence sentences.

### Citation Precision
$$\text{Citation Precision} = \frac{|\text{Retrieved Legal Clauses Cited Correctly}|}{|\text{Total Legal Citations Output by Model}|}$$
- Measures whether the legal section cited by the model actually appeared in the top-$k$ retrieved chunks $C$.

### Evidence Faithfulness
$$\text{Evidence Faithfulness} = \frac{|\text{Verbatim Evidence Quotes Verified in Crawl } E|}{|\text{Total Evidence Quotations Output by Model}|}$$
- Measures whether quoted website evidence exists in the raw crawled DOM/headers.

### Hallucination (Rejection) Rate
$$\text{Hallucination Rate} = \frac{\text{Number of Verdicts Overruled by Validator}}{\text{Total Evaluated Verdicts}} \times 100\%$$
- Under Step 5, any verdict failing either Citation Precision or Evidence Faithfulness is converted to `NOT_DETERMINABLE` and logged as a hallucination.

---

## 4. Operational Efficiency & Consistency Metrics

### Consistency (Fleiss' Kappa Across Repeated Runs)
Each model is executed across **three identical runs** on the benchmark dataset using identical temperature ($T=0.0$) and fixed retrieved context:
$$\kappa_{\text{Fleiss}} = \frac{\bar{P} - \bar{P}_e}{1 - \bar{P}_e}$$
- Measures multi-run output determinism and stability. High consistency ($\kappa \ge 0.85$) is essential for legally defensible automated compliance.

### Operational Efficiency
- **Median Latency:** Median wall-clock processing time per website (ms).
- **Token Efficiency:** Average prompt, completion, and total tokens consumed per assessed website.
- **Cost in INR (₹) per Site:**
  $$\text{Cost}_{\text{INR}} = \left( \frac{\text{Tokens}_{\text{in}}}{10^6} \cdot P_{\text{in}} + \frac{\text{Tokens}_{\text{out}}}{10^6} \cdot P_{\text{out}} \right) \times \text{FX}_{\text{USD}\to\text{INR}}$$
  - Groq and open-weights hosted on free tiers evaluate to ₹0.00 direct API cost, underscoring the "frugal AI" objective.

---

## 5. Experimental Ablation Study Design

The research methodology requires empirical proof that RAG is performing meaningful legal grounding rather than relying on parametric memorization.

### Experiment 1: RAG vs. Zero-Context Ablation
- **Condition A (With RAG):** Model receives the top-5 retrieved legal provisions from the Gazette along with observed website evidence.
- **Condition B (No-RAG Ablation):** Model receives only the obligation prompt and website evidence, with retrieved legal context omitted.
- **Hypothesis:** Macro-F1 and citation precision drop significantly without RAG ($p < 0.01$).

### Experiment 2: Retrieval Depth Ablation ($k \in \{3, 5, 8\}$)
- Evaluates retrieval depth trade-offs:
  - $k=3$: Minimal token overhead, risk of omitting secondary relevant sub-clauses.
  - $k=5$: Prescribed research baseline.
  - $k=8$: High recall, potential distractor noise affecting reasoning.

---

## 6. Inferential Statistical Testing

To prove that performance differences between models are statistically significant and not artifacts of random sample selection:

### Non-Parametric Bootstrap Confidence Intervals
- 1,000 bootstrap resamples with replacement drawn from the evaluation dataset.
- 95% Confidence Intervals $[\text{CI}_{\text{lower}}, \text{CI}_{\text{upper}}]$ reported for Macro-F1, Accuracy, and Hallucination Rate.

### McNemar's Paired Test
Used to test whether the top-ranked model significantly outperforms the runner-up:
$$\chi^2 = \frac{(|b - c| - 1)^2}{b + c}, \quad \text{df} = 1$$
- $b$: Cases correct in Model 1, incorrect in Model 2.
- $c$: Cases incorrect in Model 1, correct in Model 2.
- Significance established at $\alpha = 0.05$ ($p < 0.05$).

---

## 7. TOPSIS Multi-Criteria Ranking & Sensitivity Analysis

The faculty framework employs TOPSIS to determine the best overall LLM for deployment in TrustForge, balancing legal accuracy with sovereign cost constraints.

### Criteria & Weights Matrix
| Criterion | Code | Type | Default Weight ($w_j$) | Justification |
|---|---|---|---|---|
| **Macro-F1 Score** | $C_1$ | Benefit ($\max$) | 0.30 | Primary compliance classification quality |
| **Grounding Rate** | $C_2$ | Benefit ($\max$) | 0.25 | Evidence verification and hallucination resistance |
| **Consistency ($\kappa_{\text{Fleiss}}$)** | $C_3$ | Benefit ($\max$) | 0.15 | Output repeatability across repeated runs |
| **Median Latency** | $C_4$ | Cost ($\min$) | 0.15 | Audit pipeline turnaround and responsiveness |
| **Cost per Site (₹)** | $C_5$ | Cost ($\min$) | 0.15 | Frugal, sovereign deployability on zero budget |

### Mathematical Formulation
1. **Decision Matrix Normalization:**
   $$r_{ij} = \frac{x_{ij}}{\sqrt{\sum_{k=1}^m x_{kj}^2}}$$
2. **Weighted Normalized Matrix:**
   $$v_{ij} = w_j \cdot r_{ij}$$
3. **Ideal Best ($A^+$) and Ideal Worst ($A^-$) Solutions:**
   $$A^+ = \{ \max_i v_{ij} \mid j \in J_{\text{benefit}} \} \cup \{ \min_i v_{ij} \mid j \in J_{\text{cost}} \}$$
   $$A^- = \{ \min_i v_{ij} \mid j \in J_{\text{benefit}} \} \cup \{ \max_i v_{ij} \mid j \in J_{\text{cost}} \}$$
4. **Euclidean Distance to Ideals:**
   $$S_i^+ = \sqrt{\sum_{j=1}^n (v_{ij} - v_j^+)^2}, \quad S_i^- = \sqrt{\sum_{j=1}^n (v_{ij} - v_j^-)^2}$$
5. **Relative Closeness to Ideal:**
   $$C_i^* = \frac{S_i^-}{S_i^+ + S_i^-}, \quad C_i^* \in [0, 1]$$
   - Highest $C_i^*$ designates the recommended model.

### Sensitivity Analysis Protocol
To verify that the chosen model does not depend on arbitrary weight selection, the ranking is recalculated under ten separate perturbation scenarios:
- Each criterion weight $w_j$ is raised by $+20\%$ and lowered by $-20\%$ ($w_j' = w_j \times 1.20$ and $w_j' = w_j \times 0.80$).
- Remaining weights are proportionally renormalized so $\sum w = 1.0$.
- Rank stability is verified: if the top-ranked model maintains position across all perturbations, the selection is confirmed robust.

---

## 8. Research Integrity & Zero-Fabrication Rules

1. **No Simulated LLM Execution:** Unauthenticated models (M04–M10) must be reported as `AUTH_REQUIRED` or `UNAVAILABLE`. Never generate synthetic or random verdict outputs to fill matrix slots.
2. **Provenance Tracking:** Every benchmark finding must store the exact `request_id`, provider model string, timestamp, and context hash (`context_hash`).
3. **Distinction of Status:** Distinguish research reference labels authored by the research team from independent expert double-blind audits.
4. **Transparent Disclaimers:** Public scores must state clearly that external website posture is not an exhaustive statutory audit of internal fiduciaries.
