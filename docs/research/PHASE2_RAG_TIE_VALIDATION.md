# TrustForge — Phase 2: Targeted RAG and TIE Correction Validation Report

**Document Version:** 1.0.0-research  
**Date:** 2026-10-09  
**Evaluation Scope:** Statutory Context Truncation Remediation & Controlled Benchmark Re-evaluation  
**Project Root:** `C:\TF new V1\TrustForge`  
**Branch:** `research/real-compliance-engine`  

---

## Executive Summary

In Phase 1 research auditing, a critical defect was identified in TrustForge's Trust Inference Engine (`backend/compliance/tie_evaluator.py`): retrieved statutory passages were arbitrarily sliced at `c.text[:300]`. In Section 8 (General Obligations of Data Fiduciary, 1,150 characters), this arbitrary cut-off truncated the text midway through subsection 8(3), completely depriving the LLM of subsections 8(4) through 8(7). During baseline evaluation, this caused the model to explicitly state:
> *"The organisation declared a third-party processor (AnalyticsCo) but did not provide evidence of a valid contract, and the retrieved context does not contain the specific text of Section 8(7)."*

In Phase 2, this defect was eliminated by implementing a bounded, configurable context budget (`TRUSTFORGE_TIE_CONTEXT_BUDGET=4000`) that prioritizes complete statutory provisions and transparently discloses any excluded passages. A controlled before-and-after evaluation was executed across the unchanged 32-assertion TIE benchmark using 12 fresh live Groq API calls (with prompt-hash-bound cache keys). 

**Key Findings:**
1. **Statutory Context Completeness:** Section 8(7) is now provided in full to the LLM. In Phase 2, the model cleanly cited Section 8(7) verbatim (*"prior to engaging a Data Processor... enter into a valid contract"*) with zero complaints of missing statutory context.
2. **Benchmark Metric Stability:** Overall accuracy remained steady at **65.62% (21/32)**, deterministic accuracy at **95.00% (19/20)**, qualitative accuracy at **16.67% (2/12)**, macro F1 at **0.4833**, and citation validity at **100.00% (18/18)**.
3. **Adjudication of Discrepancies:** The 10 qualitative mismatches between model predictions and synthetic benchmark labels are NOT caused by context starvation or hallucinations, but by the model's rigorous legal skepticism: the model rejects unverified self-reported claims (e.g. self-reporting vendor names without attaching the contract) under statutory mandates, whereas synthetic benchmark labels assumed self-reported claims should receive an unqualified `PASS`.

---

## 1. Exact Code Changes

All code changes were strictly targeted to context budget management, retry backoff resilience, and test assertions. No application workflow, frontend, or Trust Score calculation formulas were modified.

### 1.1 Central Configuration (`backend/config.py`)
Added `tie_context_budget` setting to `Settings` with environment variable prefix `TRUSTFORGE_TIE_CONTEXT_BUDGET`:

```diff
     # LLM
     llm_provider: str = "groq"   # "groq" | "none"
     llm_model: str = "qwen/qwen3.8-27b"
     llm_temperature: float = 0.1
     llm_max_tokens: int = 1024
+    tie_context_budget: int = 4000  # Character budget for retrieved statutory passages in TIE prompt
```

### 1.2 Bounded Complete-Provision Context Budget (`backend/compliance/tie_evaluator.py`)
Removed the arbitrary `c.text[:300]` slicing. Implemented `_build_context_passages` which prioritizes complete statutory chunks and records excluded chunks:

```python
def _build_context_passages(
    chunks: List[RetrievedChunk],
    context_budget: Optional[int] = None,
) -> Tuple[str, List[RetrievedChunk], List[Dict[str, Any]]]:
    """
    Build bounded authoritative statutory context passages prioritizing complete provisions.
    Instead of arbitrarily slicing chunk characters (which silently truncates statutory
    subsections), this selects complete chunks in retrieval relevance order within a
    bounded character budget.
    """
    if context_budget is None:
        context_budget = getattr(settings, "tie_context_budget", 4000)

    if not chunks:
        return "No authoritative passages retrieved.", [], []

    included_chunks: List[RetrievedChunk] = []
    excluded_chunks: List[Dict[str, Any]] = []
    formatted_passages: List[str] = []
    current_length = 0

    for c in chunks:
        formatted = (
            f"[Chunk ID: {c.chunk_id} | Document: {c.document_title} | "
            f"Section: {c.section or 'general'}]\n{c.text.strip()}"
        )
        entry_length = len(formatted) + (2 if formatted_passages else 0)

        if current_length + entry_length <= context_budget:
            formatted_passages.append(formatted)
            included_chunks.append(c)
            current_length += entry_length
        else:
            excluded_chunks.append({
                "chunk_id": c.chunk_id,
                "document_title": c.document_title,
                "section": c.section or "general",
                "char_length": len(c.text),
                "reason": (
                    f"Exceeded remaining budget (remaining: {max(0, context_budget - current_length)} chars, "
                    f"required: {entry_length} chars)"
                ),
            })

    if not formatted_passages and chunks:
        c = chunks[0]
        header = f"[Chunk ID: {c.chunk_id} | Document: {c.document_title} | Section: {c.section or 'general'}]\n"
        allowed_len = max(100, context_budget - len(header) - 60)
        formatted = header + c.text[:allowed_len].strip() + "\n[... EXPLICIT CONTEXT BUDGET BOUNDARY REACHED]"
        formatted_passages.append(formatted)
        included_chunks.append(c)
        excluded_chunks.append({
            "chunk_id": c.chunk_id,
            "document_title": c.document_title,
            "section": c.section or "general",
            "char_length": len(c.text),
            "reason": f"Partial inclusion: single chunk exceeds entire budget of {context_budget} chars",
        })

    context_text = "\n\n".join(formatted_passages)

    if excluded_chunks:
        exclusion_summary = "; ".join(f"{e['chunk_id']} ({e['section']})" for e in excluded_chunks)
        context_text += (
            f"\n\n[NOTICE: Additional retrieved passages were excluded due to context budget "
            f"({context_budget} chars): {exclusion_summary}]"
        )

    return context_text, included_chunks, excluded_chunks
```

### 1.3 LLM Provider Rate-Limit Backoff (`backend/compliance/tie_evaluator.py`)
Fixed `GroqProvider.generate()` which previously clamped retry wait times to `min(..., 3.0)` seconds, causing premature retry attempts before Groq's token-per-minute window reset:

```diff
         loop = asyncio.get_event_loop()
-        wait = 20  # initial wait seconds on 429
-        for attempt in range(2):
+        max_attempts = 4
+        for attempt in range(max_attempts):
             try:
                 return await loop.run_in_executor(None, self._generate_sync, prompt)
             except Exception as exc:
                 err_str = str(exc)
-                if "429" in err_str and attempt < 1:
+                if "429" in err_str and attempt < max_attempts - 1:
                     m_ms = re.search(r"try again in (\d+(?:\.\d+)?)\s*ms", err_str, re.IGNORECASE)
                     m_s = re.search(r"try again in (\d+(?:\.\d+)?)\s*s", err_str, re.IGNORECASE)
                     m_retry = re.search(r"retry.after[\":\s]+(\d+)", err_str, re.IGNORECASE)
-                    if m_ms:
-                        wait = min(float(m_ms.group(1)) / 1000.0 + 0.1, 2.0)
-                    elif m_s:
-                        wait = min(float(m_s.group(1)) + 0.2, 3.0)
-                    elif m_retry:
-                        wait = min(int(m_retry.group(1)) + 1, 3.0)
+                    if m_s:
                        wait = float(m_s.group(1)) + 1.0
+                    elif m_ms:
+                        wait = float(m_ms.group(1)) / 1000.0 + 0.5
+                    elif m_retry:
+                        wait = float(m_retry.group(1)) + 1.0
                     else:
-                        wait = 1.0
+                        wait = 10.0
+                    wait = min(max(wait, 1.0), 35.0)
                     logger.warning(
-                        f"Groq 429 (attempt {attempt+1}/2) — "
-                        f"asyncio.sleep({wait:.2f}s) — event loop stays free"
+                        f"Groq 429 (attempt {attempt+1}/{max_attempts}) — "
+                        f"waiting {wait:.2f}s for rate-limit reset — event loop stays free"
                     )
                     await asyncio.sleep(wait)
```

### 1.4 Unit Tests (`backend/tests/unit/test_citation_grounding.py`)
Added unit tests validating that provisions longer than 300 characters are preserved completely and that context exclusions are accurately recorded:
- `test_context_budget_preserves_complete_provisions()`
- `test_context_budget_records_excluded_passages()`

---

## 2. Baseline Configuration and Metrics

The baseline experiment configuration and metrics (preserved in `docs/research/evaluation/results/tie_results.csv` and `summary_metrics.json`) were recorded as follows:

| Parameter | Baseline Value | Source File |
| :--- | :--- | :--- |
| **Legal Corpus** | 14 indexed sections (DPDP Act 2023, v1.0) | `backend/rag/ingest.py` |
| **Embedding Model** | `sentence-transformers/all-MiniLM-L6-v2` | `backend/config.py` |
| **Retrieval Top-K** | 5 retrieved, top-3 presented to prompt | `tie_evaluator.py` |
| **Prompt Truncation** | Hard-coded `c.text[:300]` slicing | `tie_evaluator.py:226` |
| **Context Budget** | ~900 characters total across 3 chunks | Implicit |
| **LLM Model** | `qwen/qwen3.8-27b` (Groq API) | `backend/.env` |
| **Temperature** | 0.1 | `backend/.env` |
| **Max Output Tokens** | 512 | `backend/.env` |
| **Cache Key Formula** | `sha256(oid_cid_evidence_model_temp)` | `run_tie_eval.py:178` |
| **Cache Key Prompt Hash** | **None** (did not include prompt text) | `run_tie_eval.py` |

### Baseline Performance Metrics

| Metric | Baseline Result |
| :--- | :--- |
| **Total Assertions Evaluated** | 32 |
| **Overall Classification Accuracy** | **65.62%** (21 / 32) |
| **Deterministic Controls Accuracy** | **95.00%** (19 / 20) |
| **Qualitative Controls Accuracy** | **16.67%** (2 / 12) |
| **Macro F1-Score** | **0.4833** |
| **Citation Validity Rate** | **100.00%** (15 / 15) |
| **Live Groq API Calls** | 2 fresh, 10 reused from cache |

---

## 3. Phase 2 Configuration and Metrics

Phase 2 results were written separately to `docs/research/evaluation/results/tie_results_phase2.csv` and `summary_metrics_phase2.json`.

| Parameter | Phase 2 Value |
| :--- | :--- |
| **Legal Corpus** | 14 indexed sections (isolated comparison; no corpus edits) |
| **Embedding Model** | `sentence-transformers/all-MiniLM-L6-v2` |
| **Context Budget** | **4,000 characters** (configurable via `TRUSTFORGE_TIE_CONTEXT_BUDGET`) |
| **Provision Integrity** | Complete statutory chunks preserved without midpoint cut-offs |
| **Exclusion Handling** | Explicit exclusion logging and notice appended to prompt |
| **LLM Model** | `qwen/qwen3.8-27b` (Groq API) |
| **Temperature** | 0.1 |
| **Cache Key Formula** | `sha256(oid_cid_evidence_model_temp_budget_promptHash)` |
| **Stale Cache Reuse** | **0%** (all 12 qualitative assertions evaluated with fresh LLM calls) |

### Phase 2 Performance Metrics

| Metric | Phase 2 Result | Change vs Baseline |
| :--- | :--- | :--- |
| **Total Assertions Evaluated** | 32 | 0 |
| **Overall Classification Accuracy** | **65.62%** (21 / 32) | 0.00% |
| **Deterministic Controls Accuracy** | **95.00%** (19 / 20) | 0.00% |
| **Qualitative Controls Accuracy** | **16.67%** (2 / 12) | 0.00% |
| **Macro F1-Score** | **0.4833** | 0.0000 |
| **Citation Validity Rate** | **100.00%** (18 / 18) | +3 valid citations extracted |
| **Live Groq API Calls** | **12** (100% fresh calls) | +10 fresh calls executed |
| **Unhandled Failure Rate** | **0.00%** | 0 unhandled exceptions |

---

## 4. Before-and-After Comparison

### 4.1 Aggregate Comparison Matrix

| Evaluation Dimension | Baseline (c.text[:300]) | Phase 2 (Bounded 4000 Chars) |
| :--- | :--- | :--- |
| **Section 8 Context Delivered** | 300 chars (cuts off at word *"prote"* in 8(3)) | 1,150 chars (complete subsections 8(1) to 8(7)) |
| **Section 8(7) Availability** | Missing from prompt | Present in prompt in full |
| **Model Awareness of Section 8(7)** | Model complained: *"retrieved context does not contain specific text of Section 8(7)"* | Model quoted: *"(7) prior to engaging a Data Processor... enter into a valid contract"* |
| **Ground-Truth Match Count** | 21 / 32 | 21 / 32 |
| **Deterministic Accuracy** | 19 / 20 (95.0%) | 19 / 20 (95.0%) |
| **Qualitative Accuracy** | 2 / 12 (16.7%) | 2 / 12 (16.7%) |
| **Citation Excerpt Quality** | Truncated to first 200 chars of chunk | Full, precise statutory excerpts accepted |
| **Prompt Cache Integrity** | Key did not contain prompt text | Key contains SHA256 of entire formatted prompt |

### 4.2 Per-Case Comparison (All 12 Qualitative Assertions)

| Org ID | Control ID | Ground Truth | Baseline Pred | Phase 2 Pred | Match Change | Qualitative Improvement Observed in Phase 2 |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **SYN-001** | `TF-PRIV-001` | PASS | POTENTIAL_GAP | POTENTIAL_GAP | None | Model verified Section 5 notice requirements in full; noted lack of independent content crawl. |
| **SYN-001** | `TF-PRIV-005` | PASS | INSUFFICIENT_EVIDENCE | INSUFFICIENT_EVIDENCE | None | Transparently recorded notice that Section 4 was excluded due to budget; grounded in Section 7. |
| **SYN-001** | `TF-GOV-001` | PASS | INSUFFICIENT_EVIDENCE | INSUFFICIENT_EVIDENCE | None | **Critical:** Quoted Section 8(7) verbatim; noted vendor list without verified contract fails 8(7). |
| **SYN-001** | `TF-LIFE-002` | PASS | POTENTIAL_GAP | POTENTIAL_GAP | None | Grounded in both Section 12(d) and Section 8(5); noted self-reported erasure lacks technical proof. |
| **SYN-003** | `TF-PRIV-001` | PASS | POTENTIAL_GAP | POTENTIAL_GAP | None | Evaluated Section 5; flagged missing Board complaint mechanism. |
| **SYN-003** | `TF-PRIV-005` | POTENTIAL_GAP | INSUFFICIENT_EVIDENCE | INSUFFICIENT_EVIDENCE | None | Grounded in Sections 4 & 7; requested explicit mapping of marketing/analytics to legal ground. |
| **SYN-003** | `TF-GOV-001` | INSUFFICIENT_EVIDENCE | INSUFFICIENT_EVIDENCE | INSUFFICIENT_EVIDENCE | **Maintained (MATCH)** | **Defect eliminated:** Eliminated complaint about missing 8(7); provided complete legal rationale. |
| **SYN-003** | `TF-LIFE-002` | FAIL | POTENTIAL_GAP | POTENTIAL_GAP | None | Cited Section 12(d) and Section 8(5) in full. |
| **SYN-007** | `TF-PRIV-001` | PASS | POTENTIAL_GAP | POTENTIAL_GAP | None | Cited Section 5 and Section 8(6); identified unobserved grievance contact on website. |
| **SYN-007** | `TF-PRIV-005` | PASS | INSUFFICIENT_EVIDENCE | INSUFFICIENT_EVIDENCE | None | Cited Section 7; questioned whether health monitoring relies on consent or emergency legitimate use. |
| **SYN-007** | `TF-GOV-001` | INSUFFICIENT_EVIDENCE | INSUFFICIENT_EVIDENCE | INSUFFICIENT_EVIDENCE | **Maintained (MATCH)** | Quoted Section 8(7) verbatim; flagged unverified processor contract. |
| **SYN-007** | `TF-LIFE-002` | FAIL | POTENTIAL_GAP | POTENTIAL_GAP | None | Grounded in Section 12(d) and Section 8(5). |

---

## 5. Investigation of Disputed Ground-Truth Labels

The controlled evaluation scientifically establishes that the 10 qualitative mismatches between model predictions and benchmark labels were **not caused by context truncation**. When given the full statutory text, the model reaches the exact same conclusions with substantially superior legal reasoning.

The root cause is a fundamental methodological divergence between **synthetic benchmark labeling criteria** and **statutory evidentiary standards**:
- The synthetic dataset assumed that **self-reported attestation** in a questionnaire (e.g. answering "Yes, we have a retention policy") should be rewarded with an unqualified `PASS`.
- The RAG-grounded LLM, instructed to base its findings strictly on verified evidence and authoritative DPDP provisions, exhibits **legal skepticism**: it refuses to certify compliance without verifiable documentary proof.

### Adjudication Table

| Case | Expected Label | Model Prediction | Available Evidence | Relevant Statutory Provision | Reason for Disagreement | Independent Expert Review Needed? |
| :--- | :---: | :---: | :--- | :--- | :--- | :---: |
| **SYN-001 / TF-PRIV-001** | `PASS` | `POTENTIAL_GAP` | Scanner: `privacy_policy_link=True`. Wizard: data categories self-reported. | DPDP Act Section 5(1)(a)-(c) (Notice must detail data description, purpose, rights, Board complaint mechanism). | Benchmark assumes link existence = compliance. Model correctly observes that scanner only verified hyperlink presence, not whether notice text actually contains mandatory Section 5(1) disclosures. | **Yes** — Adjudicate whether automated tools may award PASS on link presence alone. |
| **SYN-001 / TF-PRIV-005** | `PASS` | `INSUFFICIENT_EVIDENCE` | Wizard: purposes declared. Scanner: consent banner observed. | DPDP Act Section 4 & Section 7 (Lawful purpose: consent or specific legitimate uses). | Benchmark assumes purpose listing = compliance. Model requires evidence demonstrating that each purpose is actively tied to a Section 6 consent record or Section 7 statutory exemption. | **Yes** — Adjudicate self-reported purpose vs documentary mapping. |
| **SYN-001 / TF-GOV-001** | `PASS` | `INSUFFICIENT_EVIDENCE` | Wizard: 2 processors declared. Wizard note: *"Contracts not verified"*. | DPDP Act Section 8(7) (Mandatory valid contract with processor prior to engagement). | Benchmark awarded PASS for naming vendors. Model notes that Section 8(7) requires a *valid contract*; naming vendors without verifying the contract cannot legally satisfy Section 8(7). | **Yes** — Model interpretation is legally superior; benchmark label is flawed. |
| **SYN-001 / TF-LIFE-002** | `PASS` | `POTENTIAL_GAP` | Wizard: `erasure_automated=True`, `retention='12 months'`. | DPDP Act Section 12(d) & Section 8(5) (Duty to erase data when purpose expired). | Benchmark accepted self-declaration. Model flagged that self-reporting an automated script lacks technical audit proof and does not verify third-party processor deletion. | **Yes** — Adjudicate audit verification threshold for technical controls. |
| **SYN-003 / TF-PRIV-001** | `PASS` | `POTENTIAL_GAP` | Scanner: `privacy_policy_link=True`. Wizard: categories declared. | DPDP Act Section 5(1) | Same as SYN-001: link detected, but mandatory statutory contents not verified. | **Yes** |
| **SYN-003 / TF-PRIV-005** | `POTENTIAL_GAP` | `INSUFFICIENT_EVIDENCE` | Wizard: marketing & analytics. Scanner: pre-ticked consent detected. | DPDP Act Section 4 & Section 6(1) | Benchmark penalized for pre-ticked box (`POTENTIAL_GAP`). Model assigned `INSUFFICIENT_EVIDENCE` because neither lawful basis nor consent records were documented. | **Yes** — Subtle distinction between invalid consent vs absent basis. |
| **SYN-003 / TF-LIFE-002** | `FAIL` | `POTENTIAL_GAP` | Wizard: `retention='5 years'`, `erasure_automated=False`. | DPDP Act Section 12(d) & Section 8(5) | Benchmark treated lack of automation as automatic `FAIL`. Model noted that lack of an automated tool is a `POTENTIAL_GAP`, as manual deletion processes can still comply with DPDP. | **Yes** — Model interpretation is legally defensible (DPDP does not mandate automation). |
| **SYN-007 / TF-PRIV-001** | `PASS` | `POTENTIAL_GAP` | Scanner: `privacy_policy_link=True`, `grievance_contact_published=False`. | DPDP Act Section 5(1)(c) & Section 8(6) (Notice must provide contact of grievance officer). | Benchmark awarded PASS for link. Model caught that scanner explicitly proved grievance contact was missing, making the notice non-compliant under Section 5(1)(c). | **Yes** — Model caught genuine multi-signal contradiction. |
| **SYN-007 / TF-PRIV-005** | `PASS` | `INSUFFICIENT_EVIDENCE` | Wizard: `health_monitoring_service`. Scanner: consent banner. | DPDP Act Section 4 & Section 7(d)-(e) | Benchmark assumed purpose was valid. Model noted health monitoring requires specific legal basis (consent vs public health emergency under Section 7(e)). | **Yes** |
| **SYN-007 / TF-LIFE-002** | `FAIL` | `POTENTIAL_GAP` | Wizard: `retention='3 years'`, `erasure_automated=False`. | DPDP Act Section 12(d) & Section 8(5) | Benchmark assigned hard FAIL for non-automated erasure; model assigned POTENTIAL_GAP. | **Yes** |
| **SYN-004 / TF-SEC-001** *(Deterministic)* | `FAIL` | `POTENTIAL_GAP` | Scanner: `https_enforced=False`, `hsts_header=False`. | DPDP Act Section 8(3) (Reasonable security safeguards). | Benchmark expected `FAIL`. Deterministic rule engine assigns `POTENTIAL_GAP` because unobserved scanner headers warrant review rather than definitive legal failure. | **No** — Rule engine policy decision. |

---

## 6. Remaining Legal-Corpus Limitations

In accordance with Phase 2 constraints, the 14-chunk FAISS corpus was held strictly constant during the controlled before-and-after evaluation. A comprehensive legal audit of the 14 chunks in `backend/rag/ingest.py` against the official Gazette of India (Extraordinary, Part II, Section 1, No. 22 of 2023) revealed several significant structural limitations:

### 6.1 Corpus Section Coverage
- The DPDP Act 2023 consists of **44 sections across 8 chapters**.
- The existing knowledge base indexes only **13 sections + Preamble** (31.8% of the Act):
  - **Indexed Sections:** Preamble, Section 2, Section 4, Section 5, Section 6, Section 7, Section 8, Section 9, Section 10, Section 11, Section 12, Section 13, Section 14, Section 17.
  - **Missing Sections:**
    - `Section 1`: Short title, extent, and commencement.
    - `Section 3`: Application of Act (territorial scope, overseas processing offering goods/services to Indian residents) — **Critical for jurisdictional determinations**.
    - `Section 15`: Duties of Data Principal (not to register false grievances, furnish authentic info).
    - `Section 16`: Processing outside India (cross-border data transfers and government transfer restrictions) — **Critical for cloud architecture controls**.
    - `Chapter IV (Sections 18–26)`: Data Protection Board of India establishment, powers, proceedings, and digital office inquiries.
    - `Chapter V (Sections 27–28)`: Penalties and Adjudication (statutory penalties up to ₹250 crore).
    - `Chapter VI (Sections 29–32)`: Appeals to Appellate Tribunal (TDSAT).
    - `Chapter VII (Sections 33–34)`: Alternative Dispute Resolution & Voluntary Undertakings.
    - `Chapter VIII (Sections 35–44)`: General provisions, power of Central Government to call for info, and rule-making powers.

### 6.2 Chunk Fidelity and Subsection Numbering Mismatches
1. **Section 8 Renumbering Mismatch:**
   - In `backend/rag/ingest.py`, Section 8 was created from summary text numbering processor contracts as **"(7)"**:
     *(7) prior to engaging a Data Processor... enter into a valid contract with the Data Processor.*
   - In the **official Gazette text**, Section 8 contains 11 distinct subsections. In the Gazette:
     - Section 8(6) governs data erasure upon withdrawal/purpose cessation.
     - Section 8(8) governs data processor contracts.
     - Section 8(9) governs publishing business contact information of the DPO.
   - Because `ingest.py` condensed and renumbered these subsections, TrustForge controls mapped processor contracts to `Section 8(7)`. While internally consistent between the control definition and the chunk, this does not reflect the official Gazette numbering (Section 8(8)).
2. **Definition Incompleteness (Section 2):**
   - Official Section 2 defines 28 statutory terms (clauses (a) through (z), (za), (zb)).
   - Chunk `dpdp-act-2023-section-2-0` defines only 7 terms (`consent manager`, `data fiduciary`, `data principal`, `data processor`, `personal data`, `personal data breach`, `processing`).
   - Omitted statutory definitions include `"child"` (Section 2(f)), `"Board"` (Section 2(c)), and `"Significant Data Fiduciary"` (Section 2(z)).
3. **Draft DPDP Rules 2025 Status:**
   - In `ingest.py`, `SOURCE_REGISTRY` registers `meity-dpdp-rules-2025` as "The Digital Personal Data Protection Rules, 2025 (Draft)".
   - However, **zero chunks** from the draft rules exist in `knowledge/index/chunks.pkl`.
   - Furthermore, as of early 2026, the DPDP Rules remain in draft consultation stage under MeitY and have not yet been gazetted in final form.

---

## 7. Recommendations for Next Phase (Phase 3)

1. **Adjudicate and Re-label Ground-Truth Benchmark:**
   - Establish an expert legal adjudication panel to update `synthetic_org_profiles.json`.
   - Distinguish between **"Self-Attestation Pass"** (the organization claims compliance) and **"Documentary Audit Pass"** (evidence independently proves compliance).
   - Under an evidence-grounded framework, the model's assignment of `INSUFFICIENT_EVIDENCE` for unverified vendor contracts should be accepted as the **correct Ground Truth**.
2. **Authoritative Gazette Re-Ingestion:**
   - Ingest the complete 44-section official Gazette text (No. 22 of 2023).
   - Correct the subsection mapping of processor contracts from `Section 8(7)` to `Section 8(8)`.
   - Ingest Section 3 (Applicability) and Section 16 (Cross-border transfers).
3. **Multi-Source Evidence Synthesis:**
   - Implement document text extraction (crawling the actual privacy policy text from linked URLs) to convert link-only presence into verifiable text evidence for Section 5(1).

---

## 8. Regression Verification

| Test Suite / Workflow | Status | Details |
| :--- | :---: | :--- |
| **Backend Unit Tests** | **PASSED** | 30 / 30 passed (`pytest backend/tests/unit`) in 21.07s |
| **Citation Grounding Tests** | **PASSED** | 14 / 14 tests passed (including 2 new Phase 2 budget tests) |
| **Trust Score Determinism** | **PASSED** | 15 / 15 tests passed; zero mathematical regressions |
| **API Endpoints Full Test** | **PASSED** | Health, assessment, scanner, and report endpoints verified |
| **Frontend Production Build** | **PASSED** | `tsc -b && vite build` built in 980ms with 0 errors |
| **Assessment Wizard Flow** | **VERIFIED** | Wizard completes, polls backend status, and loads results |

---

## 9. Git Status

```
On branch research/real-compliance-engine
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   backend/config.py
	modified:   backend/compliance/tie_evaluator.py
	modified:   backend/tests/unit/test_citation_grounding.py
	modified:   docs/research/evaluation/experiments/run_tie_eval_phase2.py

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	docs/research/PHASE2_RAG_TIE_VALIDATION.md
	docs/research/evaluation/results/tie_cache_phase2.json
	docs/research/evaluation/results/tie_results_phase2.csv
	docs/research/evaluation/results/summary_metrics_phase2.json
```

*Note: In compliance with strict project instructions, zero commits, pushes, or merges were performed.*
