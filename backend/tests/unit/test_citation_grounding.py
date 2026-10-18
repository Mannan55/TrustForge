"""
TrustForge Citation Grounding & LLM Failure Tests (P0.3 / P0.4).

Tests:
  P0.3 — Citation resolution:
    - Valid citation (chunk_id matches retrieved chunk) → accepted
    - Invalid citation (chunk_id not in retrieved set) → rejected, not substituted
    - Ambiguous section reference → rejected
    - Unambiguous section reference → accepted
    - Model-provided excerpt verified against chunk text

  P0.4 — LLM failure / RAG failure behavior:
    - RAG-grounded controls return INSUFFICIENT_EVIDENCE on LLM failure
    - Deterministic controls still use deterministic eval on LLM failure
    - Empty LLM response → INSUFFICIENT_EVIDENCE for RAG-grounded
    - JSON parse error → INSUFFICIENT_EVIDENCE for RAG-grounded
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

import pytest
from unittest.mock import patch
from core.models import (
    ComplianceControl,
    ControlStatus,
    EvaluationMethod,
    EvidenceItem,
    EvidenceSourceType,
    EvidenceStatus,
    Pillar,
    RetrievedChunk,
    Severity,
    SourceType,
    TIEResult,
)
from compliance.tie_evaluator import (
    _parse_tie_response,
    _fallback_result,
    _evaluate_deterministically,
    _build_context_passages,
    _build_tie_prompt,
)


# ─── Test fixtures ─────────────────────────────────────────────────────────────

def _make_control(method=EvaluationMethod.RAG_GROUNDED) -> ComplianceControl:
    return ComplianceControl(
        control_id="TF-PRIV-001",
        pillar=Pillar.PRIVACY,
        title="Privacy Notice Availability",
        description="Test control",
        severity=Severity.HIGH,
        evidence_required=["privacy_policy_link"],
        legal_mapping="Section 5",
        legal_mapping_detail="Section 5 DPDP Act 2023",
        scanner_mapping=["privacy_policy_link"],
        assessment_mapping=[],
        evaluation_method=method,
        weight=2.0,
    )


def _make_det_control() -> ComplianceControl:
    return ComplianceControl(
        control_id="TF-SEC-001",
        pillar=Pillar.SECURITY,
        title="Transport Security",
        description="Test deterministic control",
        severity=Severity.HIGH,
        evidence_required=["https_enforced", "hsts_header"],
        legal_mapping="Section 8(3)",
        legal_mapping_detail="Section 8(3) DPDP Act 2023",
        scanner_mapping=["https_enforced", "hsts_header"],
        assessment_mapping=[],
        evaluation_method=EvaluationMethod.DETERMINISTIC,
        weight=2.0,
    )


def _make_chunk(chunk_id: str, section: str = "Section 5") -> RetrievedChunk:
    return RetrievedChunk(
        chunk_id=chunk_id,
        document_id="dpdp-act-2023",
        document_title="DPDP Act 2023",
        authority="MEITY",
        source_type=SourceType.LEGAL_PRIMARY,
        section=section,
        text=f"Text for {section}. Every Data Fiduciary shall provide notice.",
        source_url="https://example.com",
        similarity=0.85,
    )


def _make_evidence(observed: bool = True) -> EvidenceItem:
    return EvidenceItem(
        source=EvidenceSourceType.WEBSITE_SCANNER,
        key="privacy_policy_link",
        title="Privacy Policy Link",
        status=EvidenceStatus.VERIFIED if observed else EvidenceStatus.NOT_FOUND,
        observed=observed,
        notes="Scanner detected privacy policy link" if observed else "Not found",
    )


# ─── P0.3 Citation resolution tests ───────────────────────────────────────────

def test_valid_citation_accepted():
    """P0.3: Citation with chunk_id matching a retrieved chunk is accepted."""
    control = _make_control()
    evidence = [_make_evidence()]
    chunk = _make_chunk("dpdp-act-2023-section-5-0", "Section 5")

    raw = '''{
        "status": "PASS",
        "finding": "Privacy notice is available.",
        "explanation": "Section 5 requires notice.",
        "recommendation": "Continue.",
        "confidence": 0.8,
        "citations": [{"chunk_id": "dpdp-act-2023-section-5-0", "section": "Section 5", "excerpt": "Text for Section 5."}]
    }'''

    result = _parse_tie_response(raw, control, evidence, [chunk])
    assert result.status == ControlStatus.PASS
    assert len(result.citations) == 1
    assert result.citations[0].chunk_id == "dpdp-act-2023-section-5-0"
    # No error about rejected citations
    assert result.error is None or "rejected" not in str(result.error)


def test_invalid_citation_rejected_not_substituted():
    """P0.3 CRITICAL: Citation with fabricated chunk_id NOT in retrieved set must be REJECTED.
    Must NOT silently substitute chunks[0]."""
    control = _make_control()
    evidence = [_make_evidence()]
    chunk = _make_chunk("dpdp-act-2023-section-5-0", "Section 5")

    raw = '''{
        "status": "PASS",
        "finding": "Privacy notice found.",
        "explanation": "Section 5 requires notice.",
        "recommendation": "Continue.",
        "confidence": 0.7,
        "citations": [{"chunk_id": "FABRICATED-ID-ctx_001", "section": "Section 99", "excerpt": "Fake text"}]
    }'''

    result = _parse_tie_response(raw, control, evidence, [chunk])
    # Citation must be rejected — empty citations list
    assert len(result.citations) == 0, (
        f"Expected 0 citations (fabricated rejected), got {len(result.citations)}: "
        f"{[c.chunk_id for c in result.citations]}"
    )
    # Error field must note the rejection
    assert result.error is not None
    assert "rejected" in result.error.lower()


def test_unambiguous_section_citation_accepted():
    """P0.3: Citation with correct section that unambiguously maps to a retrieved chunk is accepted."""
    control = _make_control()
    evidence = [_make_evidence()]
    chunk = _make_chunk("dpdp-act-2023-section-5-0", "Section 5")

    raw = '''{
        "status": "POTENTIAL_GAP",
        "finding": "Notice exists but language unclear.",
        "explanation": "Section 5 requires clear notice.",
        "recommendation": "Improve clarity.",
        "confidence": 0.6,
        "citations": [{"chunk_id": "", "section": "Section 5", "excerpt": "Every Data Fiduciary"}]
    }'''

    result = _parse_tie_response(raw, control, evidence, [chunk])
    # Section 5 unambiguously maps to our chunk
    assert len(result.citations) == 1
    assert result.citations[0].chunk_id == "dpdp-act-2023-section-5-0"


def test_ambiguous_section_citation_rejected():
    """P0.3: If multiple chunks share the same section key, citation is ambiguous and rejected."""
    control = _make_control()
    evidence = [_make_evidence()]
    # Two chunks with the same section key (e.g. two sub-chunks of Section 8)
    chunk1 = _make_chunk("dpdp-act-2023-section-8-0", "Section 8")
    chunk2 = _make_chunk("dpdp-act-2023-section-8-1", "Section 8")

    raw = '''{
        "status": "PASS",
        "finding": "Section 8 obligations met.",
        "explanation": "Section 8 requires safeguards.",
        "recommendation": "Continue.",
        "confidence": 0.7,
        "citations": [{"chunk_id": "", "section": "Section 8", "excerpt": "safeguards"}]
    }'''

    result = _parse_tie_response(raw, control, evidence, [chunk1, chunk2])
    # Section 8 is ambiguous (two chunks) — must be rejected
    assert len(result.citations) == 0, (
        f"Ambiguous section should have 0 citations, got {len(result.citations)}"
    )
    assert result.error is not None
    assert "rejected" in result.error.lower()


def test_excerpt_verified_from_chunk_text():
    """P0.3: When model excerpt IS a substring of chunk text, it is used as-is (bounded)."""
    control = _make_control()
    evidence = [_make_evidence()]
    chunk = _make_chunk("dpdp-act-2023-section-5-0", "Section 5")
    # The chunk text is: "Text for Section 5. Every Data Fiduciary shall provide notice."
    verified_excerpt = "Every Data Fiduciary shall provide notice."

    raw = f'''{{"status": "PASS", "finding": "Found.", "explanation": "OK.", "recommendation": "Continue.",
        "confidence": 0.8,
        "citations": [{{"chunk_id": "dpdp-act-2023-section-5-0", "section": "Section 5",
            "excerpt": "{verified_excerpt}"}}]}}'''

    result = _parse_tie_response(raw, control, evidence, [chunk])
    assert len(result.citations) == 1
    assert result.citations[0].excerpt == verified_excerpt


def test_unverified_excerpt_replaced_with_chunk_text():
    """P0.3: When model excerpt is NOT a substring of chunk text, it is replaced by chunk text."""
    control = _make_control()
    evidence = [_make_evidence()]
    chunk = _make_chunk("dpdp-act-2023-section-5-0", "Section 5")

    raw = '''{
        "status": "PASS", "finding": "Found.", "explanation": "OK.", "recommendation": "Continue.",
        "confidence": 0.8,
        "citations": [{"chunk_id": "dpdp-act-2023-section-5-0", "section": "Section 5",
            "excerpt": "This invented text does not exist in the chunk at all."}]
    }'''

    result = _parse_tie_response(raw, control, evidence, [chunk])
    assert len(result.citations) == 1
    # Excerpt must come from chunk text, not the fabricated model-generated text
    assert "invented" not in result.citations[0].excerpt
    assert result.citations[0].excerpt in chunk.text or chunk.text[:200] == result.citations[0].excerpt


def test_empty_citations_list_acceptable():
    """P0.3: LLM returning empty citations list is valid (no rejection needed)."""
    control = _make_control()
    evidence = [_make_evidence()]
    chunk = _make_chunk("dpdp-act-2023-section-5-0", "Section 5")

    raw = '''{
        "status": "INSUFFICIENT_EVIDENCE",
        "finding": "No evidence found.",
        "explanation": "Insufficient.",
        "recommendation": "Provide evidence.",
        "confidence": 0.1,
        "citations": []
    }'''

    result = _parse_tie_response(raw, control, evidence, [chunk])
    assert result.status == ControlStatus.INSUFFICIENT_EVIDENCE
    assert len(result.citations) == 0
    # No rejection error since there was nothing to reject
    assert result.error is None or "rejected" not in str(result.error)


# ─── P0.4 LLM Failure behavior tests ──────────────────────────────────────────

def test_fallback_rag_grounded_returns_insufficient_evidence():
    """P0.4: _fallback_result for RAG-grounded control must return INSUFFICIENT_EVIDENCE."""
    control = _make_control(EvaluationMethod.RAG_GROUNDED)
    evidence = [_make_evidence(observed=True)]  # evidence IS present

    result = _fallback_result(control, evidence, "Groq returned 500 error")

    # Must NOT be PASS just because evidence is observed
    assert result.status == ControlStatus.INSUFFICIENT_EVIDENCE, (
        f"Expected INSUFFICIENT_EVIDENCE, got {result.status}"
    )
    assert result.error is not None
    assert "Groq" in result.error or "failed" in result.error.lower()
    assert result.confidence == 0.0


def test_fallback_deterministic_uses_deterministic_eval():
    """P0.4: _fallback_result for DETERMINISTIC control correctly uses deterministic eval."""
    control = _make_det_control()
    # Provide VERIFIED evidence for both required keys
    evidence = [
        EvidenceItem(
            source=EvidenceSourceType.WEBSITE_SCANNER,
            key="https_enforced",
            title="HTTPS",
            status=EvidenceStatus.VERIFIED,
            observed=True,
            notes="HTTPS detected",
        ),
        EvidenceItem(
            source=EvidenceSourceType.WEBSITE_SCANNER,
            key="hsts_header",
            title="HSTS",
            status=EvidenceStatus.VERIFIED,
            observed=True,
            notes="HSTS detected",
        ),
    ]

    result = _fallback_result(control, evidence, "Some error")
    # Deterministic control with all required keys present should PASS
    assert result.status == ControlStatus.PASS
    assert result.evaluation_method == EvaluationMethod.DETERMINISTIC


def test_empty_llm_response_rag_grounded_returns_insufficient_evidence():
    """P0.4: Empty LLM response for RAG-grounded control → INSUFFICIENT_EVIDENCE."""
    control = _make_control(EvaluationMethod.RAG_GROUNDED)
    evidence = [_make_evidence(observed=True)]
    chunk = _make_chunk("dpdp-act-2023-section-5-0")

    result = _parse_tie_response(None, control, evidence, [chunk])
    assert result.status == ControlStatus.INSUFFICIENT_EVIDENCE, (
        f"Expected INSUFFICIENT_EVIDENCE, got {result.status}"
    )


def test_json_parse_error_rag_grounded_returns_insufficient_evidence():
    """P0.4: Unparseable JSON from LLM for RAG-grounded control → INSUFFICIENT_EVIDENCE."""
    control = _make_control(EvaluationMethod.RAG_GROUNDED)
    evidence = [_make_evidence(observed=True)]
    chunk = _make_chunk("dpdp-act-2023-section-5-0")

    result = _parse_tie_response("THIS IS NOT JSON AT ALL", control, evidence, [chunk])
    assert result.status == ControlStatus.INSUFFICIENT_EVIDENCE, (
        f"Expected INSUFFICIENT_EVIDENCE, got {result.status}"
    )


def test_one_evidence_key_alone_does_not_make_rag_control_pass():
    """P0.4: A RAG-grounded control must NOT get PASS simply because one evidence key exists.
    Only the LLM evaluation can determine PASS for qualitative controls."""
    control = _make_control(EvaluationMethod.RAG_GROUNDED)
    # Evidence key IS present (observed=True)
    evidence = [_make_evidence(observed=True)]

    # Simulate LLM failure — fallback
    result = _fallback_result(control, evidence, "LLM unavailable")

    # Even though evidence key is present, fallback MUST NOT be PASS
    assert result.status != ControlStatus.PASS, (
        "RAG-grounded control must not be PASS on LLM failure even if evidence key is present"
    )
    assert result.status == ControlStatus.INSUFFICIENT_EVIDENCE



def test_context_budget_preserves_complete_provisions():
    """Phase 2: Verify that statutory provisions longer than 300 characters are preserved completely."""
    # Chunk with 1150 characters (simulating Section 8 with Section 8(7) processor contract mandate at the end)
    sec8_text = (
        "Every Data Fiduciary shall — (1) make reasonable efforts to ensure data accuracy; "
        "(2) implement appropriate technical and organisational measures; "
        "(3) protect personal data in its possession by taking reasonable security safeguards; "
        "(4) in the event of personal data breach, give notice to Board and affected Data Principals; "
        "(5) retain data only for so long as is necessary for the specified purpose; "
        "(6) publish business contact information of Data Protection Officer; "
        "(7) prior to engaging a Data Processor, enter into a valid contract with the Data Processor."
    )
    chunk = _make_chunk("dpdp-act-2023-section-8-0", "Section 8")
    chunk.text = sec8_text

    context_text, included, excluded = _build_context_passages([chunk], context_budget=4000)
    assert len(included) == 1
    assert len(excluded) == 0
    # Crucial: Section 8(7) must NOT be truncated
    assert "enter into a valid contract with the Data Processor" in context_text
    assert len(context_text) >= len(sec8_text)


def test_context_budget_records_excluded_passages():
    """Phase 2: Verify that when context budget is exceeded, complete passages are prioritized and exclusions recorded."""
    chunk1 = _make_chunk("chunk-1", "Section 5")
    chunk1.text = "A" * 600
    chunk2 = _make_chunk("chunk-2", "Section 6")
    chunk2.text = "B" * 600

    # With budget of 800, chunk 1 fits with header, chunk 2 cannot fit completely
    context_text, included, excluded = _build_context_passages([chunk1, chunk2], context_budget=800)
    assert len(included) == 1
    assert included[0].chunk_id == "chunk-1"
    assert len(excluded) == 1
    assert excluded[0]["chunk_id"] == "chunk-2"
    assert "Section 6" in excluded[0]["section"]
    assert "NOTICE: Additional retrieved passages were excluded" in context_text


if __name__ == "__main__":
    test_valid_citation_accepted()
    test_invalid_citation_rejected_not_substituted()
    test_unambiguous_section_citation_accepted()
    test_ambiguous_section_citation_rejected()
    test_excerpt_verified_from_chunk_text()
    test_unverified_excerpt_replaced_with_chunk_text()
    test_empty_citations_list_acceptable()
    test_fallback_rag_grounded_returns_insufficient_evidence()
    test_fallback_deterministic_uses_deterministic_eval()
    test_empty_llm_response_rag_grounded_returns_insufficient_evidence()
    test_json_parse_error_rag_grounded_returns_insufficient_evidence()
    test_one_evidence_key_alone_does_not_make_rag_control_pass()
    test_context_budget_preserves_complete_provisions()
    test_context_budget_records_excluded_passages()
    print("ALL P0.3/P0.4/PHASE2 CITATION & CONTEXT BUDGET TESTS PASSED!")
