# TrustForge — Ground-Truth Dataset & Scientific Evaluation Methodology

**Dataset Version:** 1.0  
**File Location:** `docs/research/evaluation/datasets/dpdp_obligation_ground_truth_v1.json`  
**Total Cases:** 60 controlled statutory obligation test cases  
**Canonical Controls Covered:** 20 canonical DPDP controls (3 cases per control)  
**Authoring Status:** `RESEARCH_TEAM_AUTHORED_REFERENCE_LABELS`  
**Scientific Review Level:** Preliminary research-team reference labels. **Not independently expert-audited.**  

---

## 1. Scientific Principles & Avoidance of Past Errors

The previous scientific audit correctly invalidated reported Macro F1 (>0.90) and accuracy (>90%) scores because no independent reference labels existed. TrustForge adheres to strict research ethics:

1. **Zero LLM Self-Validation:** LLMs were NOT used to generate the reference labels.
2. **Explicit Review Status:** All benchmark metrics derived from this dataset are clearly designated as *Preliminary Research-Team Benchmarks* rather than independent judicial truth.
3. **Multi-Class Evaluation:** Labels reflect realistic real-world compliance outcomes:
   - `COMPLIANT`: Explicit verifiable evidence meets statutory obligation.
   - `NON_COMPLIANT`: Concrete evidence demonstrates direct violation (e.g. tracking without consent).
   - `POTENTIAL_GAP`: Ambiguity or partial disclosure that likely fails legal standards.
   - `INSUFFICIENT_EVIDENCE`: Public digital artifacts do not provide adequate evidence to determine compliance.
4. **Authoritative Statutory Grounding:** Every case references official DPDP Act 2023 sections and DPDP Rules 2025.

---

## 2. Dataset Schema & Structure

Each of the 60 cases conforms to the following strict schema:

```json
{
  "case_id": "CASE_TF_PRIV_001_A",
  "control_id": "TF-PRIV-001",
  "control_title": "Privacy Notice Itemisation",
  "dpdp_reference": "DPDP Act 2023, Section 5(1)",
  "evidence_input": "Full text of website privacy policy or digital artifact...",
  "expected_judgement": "COMPLIANT | NON_COMPLIANT | POTENTIAL_GAP | INSUFFICIENT_EVIDENCE",
  "legal_rationale": "Legal justification derived from authoritative statutory text...",
  "reference_source": "Ministry of Electronics and Information Technology (MeitY) statutory text",
  "reviewer_status": "RESEARCH_TEAM_AUTHORED_REFERENCE_LABELS",
  "dataset_version": "1.0"
}
```

---

## 3. Metric Computation Formulae

Given reference labels $y \in \mathcal{Y}$ and model predictions $\hat{y} \in \mathcal{Y}$:

### Accuracy
$$\text{Accuracy} = \frac{\sum_{i=1}^N \mathbb{I}(y_i = \hat{y}_i)}{N}$$

### Per-Class Precision & Recall
$$\text{Precision}_c = \frac{TP_c}{TP_c + FP_c}, \quad \text{Recall}_c = \frac{TP_c}{TP_c + FN_c}$$

### Per-Class F1 & Macro F1
$$F1_c = \frac{2 \cdot \text{Precision}_c \cdot \text{Recall}_c}{\text{Precision}_c + \text{Recall}_c}, \quad \text{Macro F1} = \frac{1}{|\mathcal{C}|} \sum_{c \in \mathcal{C}} F1_c$$

### Abstention Rate
$$\text{Abstention Rate} = \frac{\sum_{i=1}^N \mathbb{I}(\hat{y}_i = \text{INSUFFICIENT\_EVIDENCE})}{N}$$

Models unavailable due to credentials (`AUTH_REQUIRED`) or deprecation (`UNAVAILABLE`) are strictly excluded from prediction metrics and marked `NOT_EVALUATED`.
