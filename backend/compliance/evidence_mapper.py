"""
TrustForge Evidence Mapper.

Takes normalized EvidenceItems (from scanner + wizard) and maps them
to the compliance controls that they are relevant to.

Also normalizes Assessment Wizard answers into EvidenceItems.
"""
from __future__ import annotations

import logging
from typing import Dict, List

from core.models import (
    AssessmentAnswers,
    ComplianceControl,
    EvidenceConfidence,
    EvidenceItem,
    EvidenceSourceType,
    EvidenceStatus,
)
from compliance.controls import CONTROLS

logger = logging.getLogger(__name__)


def wizard_answers_to_evidence(answers: AssessmentAnswers) -> List[EvidenceItem]:
    """
    Convert Assessment Wizard answers into normalized EvidenceItems.

    All wizard-derived evidence is tagged as SELF_REPORTED via
    EvidenceSourceType.ASSESSMENT_WIZARD. It cannot be independently verified.
    """
    items: List[EvidenceItem] = []

    def add(key: str, title: str, observed: bool, value=None, notes: str = "") -> None:
        status = EvidenceStatus.DETECTED if observed else EvidenceStatus.NOT_FOUND
        items.append(EvidenceItem(
            source=EvidenceSourceType.ASSESSMENT_WIZARD,
            key=key,
            title=title,
            status=status,
            observed=observed,
            value=value,
            notes=notes + " [SELF-REPORTED — not independently verified by TrustForge]",
            method="Self-declared via TrustForge Assessment Wizard.",
            confidence=EvidenceConfidence.MEDIUM,
        ))

    # Retention policy
    has_retention = bool(answers.retention and answers.retention.strip())
    add("retention_policy", "Data retention policy", has_retention,
        value=answers.retention or None,
        notes=f"Declared retention period: {answers.retention or 'not specified'}")

    # Erasure
    add("erasure_automated", "Automated erasure process", answers.erasure_automated,
        notes="Organisation reports automated data erasure when purpose served." if answers.erasure_automated
              else "Organisation does not report automated erasure.")

    # Breach plan
    add("breach_plan", "Breach response plan", answers.breach_plan,
        notes="Organisation reports having a documented breach response plan." if answers.breach_plan
              else "No breach response plan reported.")

    # Grievance officer
    add("grievance_officer_named", "Grievance officer designated",
        answers.grievance_officer_named)
    add("grievance_contact_published", "Grievance contact published",
        answers.grievance_contact_published)

    # Data categories (evidence of what is processed)
    if answers.categories:
        items.append(EvidenceItem(
            source=EvidenceSourceType.ASSESSMENT_WIZARD,
            key="data_categories",
            title="Personal data categories processed",
            status=EvidenceStatus.DETECTED,
            observed=True,
            value=answers.categories,
            notes=f"Self-reported data categories: {', '.join(answers.categories)}. [SELF-REPORTED]",
            method="Self-declared via TrustForge Assessment Wizard.",
            confidence=EvidenceConfidence.MEDIUM,
        ))

    # Processing purposes
    if answers.purposes:
        items.append(EvidenceItem(
            source=EvidenceSourceType.ASSESSMENT_WIZARD,
            key="processing_purposes",
            title="Processing purposes declared",
            status=EvidenceStatus.DETECTED,
            observed=True,
            value=answers.purposes,
            notes=f"Self-reported purposes: {', '.join(answers.purposes)}. [SELF-REPORTED]",
            method="Self-declared via TrustForge Assessment Wizard.",
            confidence=EvidenceConfidence.MEDIUM,
        ))

    # Rights declared
    if answers.rights:
        for right in answers.rights:
            items.append(EvidenceItem(
                source=EvidenceSourceType.ASSESSMENT_WIZARD,
                key=f"rights_{right}",
                title=f"Right supported: {right}",
                status=EvidenceStatus.DETECTED,
                observed=True,
                value=right,
                notes=f"Organisation declares supporting the right to {right}. [SELF-REPORTED]",
                method="Self-declared via TrustForge Assessment Wizard.",
                confidence=EvidenceConfidence.MEDIUM,
            ))

    # Third-party processors
    if answers.processors:
        items.append(EvidenceItem(
            source=EvidenceSourceType.ASSESSMENT_WIZARD,
            key="processor_contracts",
            title="Third-party data processors",
            status=EvidenceStatus.DETECTED,
            observed=True,
            value=answers.processors,
            notes=f"Processors declared: {', '.join(answers.processors)}. Contracts not verified. [SELF-REPORTED]",
            method="Self-declared via TrustForge Assessment Wizard.",
            confidence=EvidenceConfidence.LOW,
        ))

    # Notice languages
    if answers.languages:
        items.append(EvidenceItem(
            source=EvidenceSourceType.ASSESSMENT_WIZARD,
            key="notice_languages",
            title="Privacy notice languages",
            status=EvidenceStatus.DETECTED,
            observed=True,
            value=answers.languages,
            notes=f"Notice languages declared: {', '.join(answers.languages)}. [SELF-REPORTED]",
            method="Self-declared via TrustForge Assessment Wizard.",
            confidence=EvidenceConfidence.MEDIUM,
        ))

    logger.info(f"Wizard answers produced {len(items)} evidence items")
    return items


def get_control_evidence(
    control: ComplianceControl,
    all_evidence: List[EvidenceItem],
) -> List[EvidenceItem]:
    """Return evidence items relevant to a specific control."""
    relevant_keys = set(control.evidence_required)
    # Also include scanner and assessment mappings
    relevant_keys.update(control.scanner_mapping)
    relevant_keys.update(control.assessment_mapping)

    return [e for e in all_evidence if e.key in relevant_keys]
