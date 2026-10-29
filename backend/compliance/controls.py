"""
TrustForge Compliance Control Registry.

Defines the structured compliance controls that map to DPDP Act 2023 obligations.
Each control:
  - belongs to one of the six Trust Pillars
  - references the authoritative DPDP section
  - maps to specific scanner evidence keys and/or assessment wizard answers
  - carries a severity and within-pillar weight
  - specifies the preferred evaluation method

Controls are the core evaluation unit. They are NOT legal advice.
They represent observed-evidence-driven readiness signals.
"""
from __future__ import annotations

from typing import Dict, List

from core.models import (
    ComplianceControl,
    EvaluationMethod,
    Pillar,
    Severity,
)

# ─────────────────────────────────────────────────────────────────────────────
# The 20 core TrustForge compliance controls
# Mapped to DPDP Act 2023 sections
# ─────────────────────────────────────────────────────────────────────────────

CONTROLS: List[ComplianceControl] = [

    # ── PRIVACY PILLAR ────────────────────────────────────────────────────────

    ComplianceControl(
        control_id="TF-PRIV-001",
        pillar=Pillar.PRIVACY,
        title="Privacy Notice Availability",
        description="A privacy notice must be publicly accessible, in clear language, and "
                    "cover what data is collected, why, and how rights can be exercised.",
        severity=Severity.HIGH,
        evidence_required=["privacy_policy_link"],
        legal_mapping="Section 5(1) & Rule 3",
        legal_mapping_detail="Section 5(1) of DPDP Act 2023 read with Rule 3 of DPDP Rules 2025 — Notice requirements for Data Fiduciaries",
        scanner_mapping=["privacy_policy_link"],
        assessment_mapping=[],
        evaluation_method=EvaluationMethod.RAG_GROUNDED,
        weight=2.0,
    ),

    ComplianceControl(
        control_id="TF-PRIV-002",
        pillar=Pillar.PRIVACY,
        title="Notice Language Accessibility",
        description="Privacy notice must be available in English or a language in the "
                    "Eighth Schedule to the Constitution that the user understands.",
        severity=Severity.MEDIUM,
        evidence_required=["notice_languages"],
        legal_mapping="Section 5(3) & Rule 3(3)",
        legal_mapping_detail="Section 5(3) of DPDP Act 2023 read with Rule 3(3) of DPDP Rules 2025 — Notice language accessibility",
        scanner_mapping=[],
        assessment_mapping=["languages"],
        evaluation_method=EvaluationMethod.RAG_GROUNDED,
        weight=1.5,
    ),

    ComplianceControl(
        control_id="TF-PRIV-003",
        pillar=Pillar.PRIVACY,
        title="Consent Mechanism — Free, Specific, Informed",
        description="Consent must be free, specific, informed, unconditional, and obtained "
                    "through a clear affirmative action. Pre-ticked boxes are not valid.",
        severity=Severity.HIGH,
        evidence_required=["consent_banner"],
        legal_mapping="Section 6(1)-(2)",
        legal_mapping_detail="Section 6(1) & 6(2) of DPDP Act 2023 — Validity conditions and unbundled consent",
        scanner_mapping=["consent_banner"],
        assessment_mapping=[],
        evaluation_method=EvaluationMethod.RAG_GROUNDED,
        weight=2.0,
    ),

    ComplianceControl(
        control_id="TF-PRIV-004",
        pillar=Pillar.PRIVACY,
        title="Consent Withdrawal Ease",
        description="Withdrawing consent must be as easy as giving it. "
                    "An imbalance (e.g., one-click accept, multi-step reject) weakens consent validity.",
        severity=Severity.HIGH,
        evidence_required=["consent_banner"],
        legal_mapping="Section 6(4)",
        legal_mapping_detail="Section 6(4) of DPDP Act 2023 — Right to withdraw consent with comparable ease",
        scanner_mapping=["consent_banner"],
        assessment_mapping=[],
        evaluation_method=EvaluationMethod.RAG_GROUNDED,
        weight=1.5,
    ),

    ComplianceControl(
        control_id="TF-PRIV-005",
        pillar=Pillar.PRIVACY,
        title="Lawful Basis for Each Processing Purpose",
        description="Each processing purpose must have a lawful basis — either consent (Section 6) "
                    "or a legitimate use (Section 7). Purposes without a lawful basis are not permitted.",
        severity=Severity.HIGH,
        evidence_required=["processing_purposes"],
        legal_mapping="Section 4, 6 & 7",
        legal_mapping_detail="Section 4, 6, and 7 of DPDP Act 2023 — Grounds and legitimate uses for processing personal data",
        scanner_mapping=[],
        assessment_mapping=["purposes", "collections"],
        evaluation_method=EvaluationMethod.RAG_GROUNDED,
        weight=2.0,
    ),

    # ── SECURITY PILLAR ───────────────────────────────────────────────────────

    ComplianceControl(
        control_id="TF-SEC-001",
        pillar=Pillar.SECURITY,
        title="Transport Security (HTTPS + HSTS)",
        description="All personal data in transit must be encrypted. HTTPS must be enforced. "
                    "HSTS prevents downgrade attacks.",
        severity=Severity.HIGH,
        evidence_required=["https_enforced", "hsts_header"],
        legal_mapping="Section 8(5) & Rule 6",
        legal_mapping_detail="Section 8(5) of DPDP Act 2023 read with Rule 6 of DPDP Rules 2025 — Reasonable security safeguards (encryption in transit)",
        scanner_mapping=["https_enforced", "hsts_header"],
        assessment_mapping=[],
        evaluation_method=EvaluationMethod.DETERMINISTIC,
        weight=2.0,
    ),

    ComplianceControl(
        control_id="TF-SEC-002",
        pillar=Pillar.SECURITY,
        title="Security Response Headers",
        description="HTTP security headers (CSP, X-Content-Type-Options, Referrer-Policy) "
                    "reduce attack surface for web-based data breaches.",
        severity=Severity.MEDIUM,
        evidence_required=["csp_header", "xcto_header", "referrer_policy_header"],
        legal_mapping="Section 8(5) & Rule 6",
        legal_mapping_detail="Section 8(5) of DPDP Act 2023 read with Rule 6 of DPDP Rules 2025 — Technical measures and security safeguards",
        scanner_mapping=["csp_header", "xcto_header", "referrer_policy_header"],
        assessment_mapping=[],
        evaluation_method=EvaluationMethod.DETERMINISTIC,
        weight=1.5,
    ),

    ComplianceControl(
        control_id="TF-SEC-003",
        pillar=Pillar.SECURITY,
        title="Breach Response Readiness",
        description="Data Fiduciaries must have a documented breach response procedure "
                    "and be able to notify the Board and affected Data Principals promptly.",
        severity=Severity.HIGH,
        evidence_required=["breach_plan"],
        legal_mapping="Section 8(6) & Rule 7",
        legal_mapping_detail="Section 8(6) of DPDP Act 2023 read with Rule 7 of DPDP Rules 2025 — Personal data breach intimation obligation",
        scanner_mapping=[],
        assessment_mapping=["breach_plan"],
        evaluation_method=EvaluationMethod.RAG_GROUNDED,
        weight=2.0,
    ),

    ComplianceControl(
        control_id="TF-SEC-004",
        pillar=Pillar.SECURITY,
        title="Third-Party Tracker Pre-Consent Loading",
        description="Analytics and tracking scripts must not execute before consent is given. "
                    "Pre-consent tracking has no lawful basis.",
        severity=Severity.HIGH,
        evidence_required=["third_party_trackers", "consent_banner"],
        legal_mapping="Section 4(1)(a) & Section 6(1)",
        legal_mapping_detail="Section 4(1)(a) and Section 6(1) of DPDP Act 2023 — Processing prior to affirmative consent lacks lawful basis",
        scanner_mapping=["third_party_trackers", "consent_banner"],
        assessment_mapping=[],
        evaluation_method=EvaluationMethod.RAG_GROUNDED,
        weight=1.5,
    ),

    # ── TRANSPARENCY PILLAR ───────────────────────────────────────────────────

    ComplianceControl(
        control_id="TF-TRANS-001",
        pillar=Pillar.TRANSPARENCY,
        title="Grievance Officer Contact Published",
        description="Data Fiduciaries must publish the business contact details of a "
                    "Data Protection Officer or key managerial personnel who responds to Data Principals.",
        severity=Severity.HIGH,
        evidence_required=["grievance_contact_published"],
        legal_mapping="Section 8(9) & Rule 9",
        legal_mapping_detail="Section 8(9) of DPDP Act 2023 read with Rule 9 of DPDP Rules 2025 — Publication of DPO and contact information",
        scanner_mapping=["grievance_contact_published"],
        assessment_mapping=["grievance_officer_named", "grievance_contact_published"],
        evaluation_method=EvaluationMethod.RAG_GROUNDED,
        weight=1.5,
    ),

    ComplianceControl(
        control_id="TF-TRANS-002",
        pillar=Pillar.TRANSPARENCY,
        title="Data Category Disclosure in Privacy Notice",
        description="The privacy notice must identify what categories of personal data are collected "
                    "and for what purposes.",
        severity=Severity.MEDIUM,
        evidence_required=["privacy_policy_link", "data_categories"],
        legal_mapping="Section 5(1)(i) & Rule 3(1)(a)",
        legal_mapping_detail="Section 5(1)(i) of DPDP Act 2023 read with Rule 3(1)(a) of DPDP Rules 2025 — Notice must provide itemised description of personal data and purposes",
        scanner_mapping=["privacy_policy_link"],
        assessment_mapping=["categories"],
        evaluation_method=EvaluationMethod.RAG_GROUNDED,
        weight=1.5,
    ),

    # ── GOVERNANCE PILLAR ─────────────────────────────────────────────────────

    ComplianceControl(
        control_id="TF-GOV-001",
        pillar=Pillar.GOVERNANCE,
        title="Data Processor Contracts",
        description="Every Data Processor engaged to process personal data must operate "
                    "under a valid contract with the Data Fiduciary.",
        severity=Severity.HIGH,
        evidence_required=["processor_contracts"],
        legal_mapping="Section 8(2)",
        legal_mapping_detail="Section 8(2) of DPDP Act 2023 — Engagement of Data Processor only under a valid contract",
        scanner_mapping=[],
        assessment_mapping=["processors"],
        evaluation_method=EvaluationMethod.RAG_GROUNDED,
        weight=2.0,
    ),

    ComplianceControl(
        control_id="TF-GOV-002",
        pillar=Pillar.GOVERNANCE,
        title="Data Accuracy Practices",
        description="Data Fiduciaries must make reasonable efforts to ensure personal data "
                    "is accurate, complete, and consistent.",
        severity=Severity.MEDIUM,
        evidence_required=["accuracy_practices"],
        legal_mapping="Section 8(3)",
        legal_mapping_detail="Section 8(3) of DPDP Act 2023 — Obligation to ensure completeness, accuracy, and consistency",
        scanner_mapping=[],
        assessment_mapping=["rights"],
        evaluation_method=EvaluationMethod.RAG_GROUNDED,
        weight=1.0,
    ),

    # ── DATA LIFECYCLE PILLAR ─────────────────────────────────────────────────

    ComplianceControl(
        control_id="TF-LIFE-001",
        pillar=Pillar.DATA_LIFECYCLE,
        title="Retention Limitation",
        description="Personal data must not be retained for longer than is necessary "
                    "for the specified purpose.",
        severity=Severity.HIGH,
        evidence_required=["retention_policy"],
        legal_mapping="Section 8(7)-(8) & Rule 8",
        legal_mapping_detail="Section 8(7)-(8) of DPDP Act 2023 read with Rule 8 and Third Schedule of DPDP Rules 2025 — Purpose cessation and storage limitation",
        scanner_mapping=[],
        assessment_mapping=["retention"],
        evaluation_method=EvaluationMethod.RAG_GROUNDED,
        weight=2.0,
    ),

    ComplianceControl(
        control_id="TF-LIFE-002",
        pillar=Pillar.DATA_LIFECYCLE,
        title="Data Erasure Process",
        description="When personal data is no longer needed, or when a Data Principal "
                    "exercises their right to erasure, the data must be erased.",
        severity=Severity.HIGH,
        evidence_required=["erasure_automated"],
        legal_mapping="Section 12(1)(d), Section 8(7) & Rule 14(3)",
        legal_mapping_detail="Section 12(1)(d) & Section 8(7) of DPDP Act 2023 read with Rule 14(3) of DPDP Rules 2025 — Right to erasure and duty to cause processor erasure",
        scanner_mapping=[],
        assessment_mapping=["erasure_automated"],
        evaluation_method=EvaluationMethod.RAG_GROUNDED,
        weight=2.0,
    ),

    ComplianceControl(
        control_id="TF-LIFE-003",
        pillar=Pillar.DATA_LIFECYCLE,
        title="Data Minimisation",
        description="Only personal data necessary for the stated purpose should be collected. "
                    "Collecting more data than needed ('data maximisation') is not aligned with the Act.",
        severity=Severity.MEDIUM,
        evidence_required=["data_categories", "processing_purposes"],
        legal_mapping="Section 6(1) & Section 4",
        legal_mapping_detail="Section 6(1) and Section 4 of DPDP Act 2023 — Limitation to personal data necessary for specified purpose",
        scanner_mapping=[],
        assessment_mapping=["categories", "purposes"],
        evaluation_method=EvaluationMethod.RAG_GROUNDED,
        weight=1.0,
    ),

    # ── USER RIGHTS PILLAR ────────────────────────────────────────────────────

    ComplianceControl(
        control_id="TF-RIGHTS-001",
        pillar=Pillar.USER_RIGHTS,
        title="Right to Access Information",
        description="Data Principals must be able to obtain a summary of their personal data "
                    "and a description of the processing activities.",
        severity=Severity.HIGH,
        evidence_required=["rights_access"],
        legal_mapping="Section 11 & Rule 14(1)",
        legal_mapping_detail="Section 11 of DPDP Act 2023 read with Rule 14(1) of DPDP Rules 2025 — Right to access information about personal data",
        scanner_mapping=[],
        assessment_mapping=["rights"],
        evaluation_method=EvaluationMethod.RAG_GROUNDED,
        weight=2.0,
    ),

    ComplianceControl(
        control_id="TF-RIGHTS-002",
        pillar=Pillar.USER_RIGHTS,
        title="Right to Correction and Erasure",
        description="Data Principals must be able to request correction and erasure of their data, "
                    "and the Data Fiduciary must act on such requests.",
        severity=Severity.HIGH,
        evidence_required=["rights_correction", "rights_erasure"],
        legal_mapping="Section 12 & Rule 14(2)-(3)",
        legal_mapping_detail="Section 12 of DPDP Act 2023 read with Rule 14(2)-(3) of DPDP Rules 2025 — Right to correction, completion, and erasure",
        scanner_mapping=[],
        assessment_mapping=["rights"],
        evaluation_method=EvaluationMethod.RAG_GROUNDED,
        weight=2.0,
    ),

    ComplianceControl(
        control_id="TF-RIGHTS-003",
        pillar=Pillar.USER_RIGHTS,
        title="Grievance Redressal Mechanism",
        description="A mechanism must exist for Data Principals to raise grievances with "
                    "the Data Fiduciary and receive responses within a prescribed timeframe.",
        severity=Severity.HIGH,
        evidence_required=["grievance_contact_published"],
        legal_mapping="Section 13, Section 8(10) & Rule 14(4)",
        legal_mapping_detail="Section 13 & Section 8(10) of DPDP Act 2023 read with Rule 14(4) of DPDP Rules 2025 — Grievance redressal mechanism and timelines",
        scanner_mapping=["grievance_contact_published"],
        assessment_mapping=["grievance_officer_named", "grievance_contact_published"],
        evaluation_method=EvaluationMethod.RAG_GROUNDED,
        weight=2.0,
    ),

    ComplianceControl(
        control_id="TF-RIGHTS-004",
        pillar=Pillar.USER_RIGHTS,
        title="Rights Request Process Availability",
        description="Data Principals must be informed of and able to exercise their rights "
                    "(access, correction, erasure, nomination).",
        severity=Severity.MEDIUM,
        evidence_required=["rights_portal"],
        legal_mapping="Section 5(1)(ii) & Rule 3(1)(b)",
        legal_mapping_detail="Section 5(1)(ii) of DPDP Act 2023 read with Rule 3(1)(b) of DPDP Rules 2025 — Notice must inform manner of exercising rights",
        scanner_mapping=["privacy_policy_link"],
        assessment_mapping=["rights"],
        evaluation_method=EvaluationMethod.RAG_GROUNDED,
        weight=1.5,
    ),
]

# Lookup by control_id
CONTROL_MAP: Dict[str, ComplianceControl] = {c.control_id: c for c in CONTROLS}


def get_controls_for_pillar(pillar: Pillar) -> List[ComplianceControl]:
    return [c for c in CONTROLS if c.pillar == pillar]


def get_all_controls() -> List[ComplianceControl]:
    return CONTROLS
