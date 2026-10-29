# Research Paper Handoff Document

# An Evidence-Grounded RAG Framework for Digital Personal Data Protection Compliance Assessment

**Authors:** TrustForge Research Team  
**Date:** 2026-10-09  
**Status:** Validated Technical Baseline & Empirical Evaluation Complete  
**Document Purpose:** Academic foundation and experimental handoff for research-paper drafting  

---

## 1. System Overview & Problem Statement

Organizations subject to the **Digital Personal Data Protection Act, 2023 (DPDP Act 2023)** require continuous, auditable, and interpretable compliance verification mechanisms. Existing methods suffer from a dichotomy:
1. **Shallow automated scanners** focus exclusively on external HTTP/DOM artifacts (e.g., cookie banners or HTTPS) and lack statutory reasoning.
2. **Manual human audits** provide deep legal interpretation but are slow, costly, and inherently non-continuous.

**TrustForge** introduces an evidence-grounded framework combining deterministic observation, dense vector retrieval over statutory legal text, constrained Large Language Model (LLM) interpretation, and a mathematically deterministic multi-pillar scoring formula.

---

## 2. Verified Architectural Contributions

1. **Decoupled Evidence and Interpretation Pipelines:**
   Technical observations (HTTP headers, security attributes, tracker scripts) and self-reported operational practices (data retention periods, grievance officer appointments) are maintained as atomic `EvidenceItem` records with explicit confidence and provenance markers.
2. **Authoritative Statutory Grounding:**
   The knowledge base indexes the DPDP Act 2023 into 14 canonical statutory chunks. Dense embeddings (`sentence-transformers/all-MiniLM-L6-v2`) and FAISS vector indexing ensure legal claims are anchored to verified statutory text.
3. **Constrained Trust Inference Engine (TIE):**
   A specialized prompting and validation architecture that forces LLM responses into structured JSON schemas, strictly bounds citations to retrieved chunk IDs, and enforces safe fallback behaviors (`INSUFFICIENT_EVIDENCE`) under uncertainty or service degradation.
4. **Deterministic Multi-Pillar Trust Score Engine (V1.1):**
   A dynamic renormalization scoring model that guarantees mathematical boundedness ($[0.0, 100.0]$), bitwise repeatability, and robust handling of non-applicable statutory obligations.

---

## 3. Canonical Trust Score Formulation (Engine V1.1)

### 3.1 Control Evidence Multipliers
$$M(c) = \begin{cases} 
1.0 & \text{if status}(c) = \text{PASS} \\ 
0.5 & \text{if status}(c) = \text{POTENTIAL\_GAP} \\ 
0.3 & \text{if status}(c) \in \{\text{INSUFFICIENT\_EVIDENCE}, \text{UNKNOWN}\} \\ 
0.0 & \text{if status}(c) = \text{FAIL} \\ 
\text{excluded} & \text{if status}(c) = \text{NOT\_APPLICABLE} 
\end{cases}$$

### 3.2 Within-Pillar Normalization
For pillar $P$ with controls $\mathcal{C}_P$:
$$\text{Score}(P) = \frac{\sum_{c \in \mathcal{C}_P, c \neq \text{N/A}} w_c \cdot M(c)}{\sum_{c \in \mathcal{C}_P, c \neq \text{N/A}} w_c} \times 100$$
Where weights $w_c \in [1.5, 3.0]$ reflect control statutory severity.

### 3.3 Dynamic Multi-Pillar Composite Normalization
$$\text{Trust Score} = \frac{\sum_{P \in \mathcal{P}_{\text{active}}} W_P \cdot \text{Score}(P)}{\sum_{P \in \mathcal{P}_{\text{active}}} W_P}$$
Where $\mathcal{P}_{\text{active}}$ represents pillars with $\ge 1$ applicable control. Global pillar weights $W_P$ are:
- Privacy: $0.20$
- Security: $0.20$
- Transparency: $0.15$
- Governance: $0.15$
- Data Lifecycle: $0.15$
- User Rights: $0.15$

If $\mathcal{P}_{\text{active}} = \emptyset$, $\text{Trust Score} = \text{None}$, `all_not_applicable = True`, posture = `'Not Scorable'`.

---

## 4. Empirical Evaluation Summary

All figures and numerical metrics are verifiable from experiment artifacts in `docs/research/evaluation/`:

### 4.1 Scanner Technical Benchmark (N=59 Assertions, 20 Fixtures)
- **Accuracy:** 98.31% (58/59)
- **Precision:** 97.50%
- **Recall:** 100.00%
- **F1-Score:** 0.9873
- *Artifact:* `docs/research/evaluation/figures/fig1_scanner_confusion_matrix.png`

### 4.2 Statutory RAG Retrieval Benchmark (N=35 Queries)
- **Hit@1:** 70.97%
- **Hit@3:** 96.77%
- **Hit@5:** 100.00%
- **MRR@5:** 0.8306
- **NDCG@5:** 0.8484
- **Mean Retrieval Latency:** 582.14 ms
- **Out-of-Scope Distractor Rejection:** Mean cosine similarity 0.2928 (vs 0.6120 for in-scope queries)
- *Artifact:* `docs/research/evaluation/figures/fig2_rag_performance_k.png`

### 4.3 TIE Compliance Classification Benchmark (N=32 Assertions)
- **Overall Classification Accuracy:** 65.62%
- **Deterministic Control Accuracy:** 95.00% (19/20)
- **Macro F1-Score:** 0.4833
- **Citation Validity Rate:** 100.00% (Zero hallucinated statutory chunks)
- **Execution Failure Rate:** 0.00%
- *Key Finding:* When evaluating self-reported evidence without third-party proof, the LLM safely assigns `POTENTIAL_GAP` rather than `PASS`, reflecting necessary regulatory caution.
- *Artifacts:* 
  - `docs/research/evaluation/figures/fig3_tie_confusion_matrix.png`
  - `docs/research/evaluation/figures/fig4_tie_per_class_f1.png`

### 4.4 Trust Score Determinism Verification (12 Scenarios, 100 Repetitions)
- **Mathematical Invariant Test Pass Rate:** 100% (12/12)
- **Bitwise Repeatability:** 100/100 identical outputs
- *Artifact:* `docs/research/evaluation/figures/fig5_trust_score_determinism.png`

---

## 5. Experimental Reproducibility Guide

To reproduce all experiments and regenerate results:
```powershell
# 1. Run Unit & Regression Tests
python -m pytest backend/tests/unit/test_trust_score_determinism.py backend/tests/unit/test_citation_grounding.py -v

# 2. Run Scanner Benchmark (P2.1)
python docs/research/evaluation/experiments/run_scanner_eval.py

# 3. Run RAG Retrieval Benchmark (P2.2)
python docs/research/evaluation/experiments/run_rag_eval.py

# 4. Run TIE Compliance Benchmark (P2.3)
python docs/research/evaluation/experiments/run_tie_eval.py

# 5. Run Trust Score Determinism Benchmark (P2.4)
python docs/research/evaluation/experiments/run_trust_score_eval.py

# 6. Regenerate High-Resolution Research Figures (P3.2)
python docs/research/evaluation/figures/generate_figures.py
```

---

## 6. Known Research Limitations & Future Directions

1. **Synthetic Organization Ground Truth:** The evaluation dataset was synthetically derived by mapping statutory rules against hypothetical organization profiles. Human-annotated legal opinions by constitutional advocates represent the next validation stage.
2. **Statutory Corpus Scope:** Current corpus contains primary parliamentary legislation (DPDP Act 2023). Secondary rules and Data Protection Board notifications will need to be indexed as they are gazetted.
3. **Single-Page Application DOM Introspection:** Headless browser rendering for deeply nested JavaScript web apps is an active area for technical expansion.
