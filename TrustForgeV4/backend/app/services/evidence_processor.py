"""
TrustForge — Evidence Processor Service

Parses uploaded documents (PDF, TXT) and extracts compliance-relevant topics.
Does NOT claim "Verified" merely because a file was uploaded.

Status progression:
  UPLOADED → PARSED → ANALYSED → SUPPORTED / INSUFFICIENT / CONFLICTING
"""
from __future__ import annotations

import io
import re
import uuid
from pathlib import Path
from typing import Optional

from app.schemas import EvidenceAnalysisResult, EvidenceStatus, ConfidenceLevel

# Topic keyword mapping — presence signals relevance to that control area
TOPIC_KEYWORDS = {
    "privacy": ["privacy policy", "personal data", "data protection", "privacy notice", "privacy statement"],
    "consent": ["consent", "opt-in", "opt-out", "withdrawal of consent", "affirmative action"],
    "grievance": ["grievance officer", "grievance", "redressal", "data protection officer", "dpo", "complaint mechanism"],
    "retention": ["retention", "retention period", "data retention", "erasure", "deletion", "purge", "storage period"],
    "deletion": ["delete", "erase", "erasure", "right to erasure", "data deletion"],
    "security": ["encryption", "aes", "tls", "ssl", "security safeguards", "access control", "incident response", "breach"],
    "data_sharing": ["third party", "data sharing", "data transfer", "processor", "controller", "sub-processor"],
    "processors": ["data processor", "third-party vendor", "dpa", "data processing agreement", "vendor contract"],
    "user_rights": ["right to access", "right to correction", "right to erasure", "data principal", "data subject rights"],
    "notice": ["notice", "privacy notice", "transparent", "itemised notice", "8th schedule"],
    "children": ["child", "minor", "parental consent", "children's data"],
    "breach": ["breach notification", "incident", "data breach", "cyber incident"],
    "identity": ["cin", "gstin", "incorporation", "registration", "certificate", "pan"],
    "audit": ["soc 2", "iso 27001", "audit report", "third party audit", "compliance certificate"],
}


def _extract_text_from_pdf(file_bytes: bytes) -> Optional[str]:
    """Extract text from PDF using PyMuPDF."""
    try:
        import fitz  # PyMuPDF
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        text_parts = []
        for page in doc:
            text_parts.append(page.get_text())
        doc.close()
        return "\n".join(text_parts)
    except Exception as e:
        return None


def _extract_text_from_txt(file_bytes: bytes) -> Optional[str]:
    """Decode plain text file."""
    try:
        return file_bytes.decode("utf-8", errors="replace")
    except Exception:
        return None


def _identify_topics(text: str) -> list[str]:
    """Identify compliance-relevant topics present in the document text."""
    text_lower = text.lower()
    found_topics = []
    for topic, keywords in TOPIC_KEYWORDS.items():
        if any(kw in text_lower for kw in keywords):
            found_topics.append(topic)
    return found_topics


def _map_topics_to_controls(topics: list[str]) -> list[str]:
    """Map extracted topics to relevant control IDs."""
    control_map = {
        "privacy": ["C1_01", "C6_01"],
        "consent": ["C1_01", "C1_03", "C1_04"],
        "grievance": ["C1_02", "C2_04"],
        "retention": ["C5_01", "C5_02", "C5_03"],
        "deletion": ["C5_02"],
        "security": ["C3_02", "C3_04"],
        "data_sharing": ["C4_01", "C4_02"],
        "processors": ["C4_02", "C4_03"],
        "user_rights": ["C2_01", "C2_02", "C2_03"],
        "notice": ["C1_01", "C5_03"],
        "children": [],
        "breach": ["C3_04"],
        "identity": ["C6_02"],
        "audit": ["C6_03"],
    }
    controls = set()
    for topic in topics:
        controls.update(control_map.get(topic, []))
    return sorted(controls)


def _generate_summary(topics: list[str], file_name: str) -> str:
    """Generate a plain-English summary of what was found."""
    if not topics:
        return f"{file_name}: No recognisable compliance-relevant content detected."

    topic_labels = {
        "privacy": "privacy notice content",
        "consent": "consent mechanisms",
        "grievance": "grievance/DPO contact information",
        "retention": "data retention schedule",
        "deletion": "erasure/deletion procedures",
        "security": "security controls",
        "data_sharing": "data sharing/transfer provisions",
        "processors": "data processor obligations",
        "user_rights": "data principal rights provisions",
        "notice": "notice requirements",
        "children": "children's data protection provisions",
        "breach": "breach response provisions",
        "identity": "corporate identity information",
        "audit": "security audit evidence",
    }
    found_labels = [topic_labels.get(t, t) for t in topics]
    return (
        f"{file_name}: Document contains relevant content covering: "
        + ", ".join(found_labels) + "."
    )


def analyze_evidence_file(
    file_name: str,
    file_bytes: bytes,
    file_type: str,
    evidence_id: Optional[str] = None,
) -> EvidenceAnalysisResult:
    """
    Analyze an uploaded evidence file.
    Returns a structured analysis result without claiming verification
    beyond what was actually performed.
    """
    evidence_id = evidence_id or f"ev_{uuid.uuid4().hex[:8]}"

    # Extract text based on file type
    text: Optional[str] = None
    if file_type in ("application/pdf", "pdf") or file_name.lower().endswith(".pdf"):
        text = _extract_text_from_pdf(file_bytes)
    elif file_type in ("text/plain", "txt") or file_name.lower().endswith(".txt"):
        text = _extract_text_from_txt(file_bytes)

    if text is None:
        return EvidenceAnalysisResult(
            evidence_id=evidence_id,
            file_name=file_name,
            file_size=len(file_bytes),
            status=EvidenceStatus.UPLOADED,
            extracted_topics=[],
            relevant_controls=[],
            summary=f"{file_name}: Text extraction failed — file may be corrupted, password-protected, or an unsupported format.",
            confidence=ConfidenceLevel.LOW,
            error="Text extraction failed.",
        )

    if len(text.strip()) < 50:
        return EvidenceAnalysisResult(
            evidence_id=evidence_id,
            file_name=file_name,
            file_size=len(file_bytes),
            status=EvidenceStatus.PARSED,
            extracted_topics=[],
            relevant_controls=[],
            summary=f"{file_name}: Parsed successfully but contains very little text. May be an image-based PDF.",
            confidence=ConfidenceLevel.LOW,
        )

    # Identify topics
    topics = _identify_topics(text)
    controls = _map_topics_to_controls(topics)
    summary = _generate_summary(topics, file_name)

    # Determine status
    if topics:
        status = EvidenceStatus.ANALYSED
        confidence = ConfidenceLevel.MEDIUM
    else:
        status = EvidenceStatus.PARSED
        confidence = ConfidenceLevel.LOW

    return EvidenceAnalysisResult(
        evidence_id=evidence_id,
        file_name=file_name,
        file_size=len(file_bytes),
        status=status,
        extracted_topics=topics,
        relevant_controls=controls,
        summary=summary,
        confidence=confidence,
    )
