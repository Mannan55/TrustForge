"""
RAG Query Builder.

Constructs focused retrieval queries from a compliance control and
associated evidence. A focused query produces better retrieval than
a generic "is this company DPDP compliant?" query.
"""
from __future__ import annotations

from typing import List
from core.models import ComplianceControl, EvidenceItem


def build_retrieval_query(
    control: ComplianceControl,
    evidence: List[EvidenceItem],
) -> str:
    """
    Build a specific retrieval query for a control + evidence combination.

    The query focuses on what the law says about the specific obligation
    mapped to this control, informed by what evidence was (or was not) found.
    """
    # Gather relevant evidence observations
    observed_positive = [e for e in evidence if e.observed is True]
    observed_negative = [e for e in evidence if e.observed is False]

    query_parts = [
        f"Control: {control.title}",
        f"Legal reference: {control.legal_mapping}",
    ]

    if observed_negative:
        missing = ", ".join(e.title for e in observed_negative[:3])
        query_parts.append(f"Not found: {missing}")

    if observed_positive:
        found = ", ".join(e.title for e in observed_positive[:3])
        query_parts.append(f"Observed: {found}")

    query_parts.append(
        f"Question: What DPDP requirements apply to '{control.title}'? "
        f"What does the law require a Data Fiduciary to do? "
        f"What are the consequences of non-compliance?"
    )

    return " ".join(query_parts)


def build_public_scan_query(url: str, missing_checks: List[str]) -> str:
    """Build a retrieval query for a public scan result."""
    if missing_checks:
        missing_str = ", ".join(missing_checks[:4])
        return (
            f"Website scan of {url} detected missing compliance signals: {missing_str}. "
            f"What DPDP Act obligations are relevant to privacy notices, "
            f"consent mechanisms, and technical security safeguards for websites?"
        )
    return (
        f"Website scan of {url} appears to have basic privacy signals. "
        f"What are the key DPDP Act requirements for a Data Fiduciary's website?"
    )
