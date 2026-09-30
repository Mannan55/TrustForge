"""
TrustForge — Trust Score Engine

Computes the weighted, coverage-adjusted Trust Score from evaluated controls.

Formula:
  Pillar Score = Σ(control_value * control_weight) / Σ(evaluated_control_weights)
  where control_value: PASS=1.0, PARTIAL=0.5, FAIL=0.0
  and UNKNOWN/NOT_APPLICABLE controls are excluded from denominator.

  Overall Score = Σ(pillar_score * pillar_weight) / Σ(evaluated_pillar_weights)

  Coverage = evaluated_controls / (total_controls - na_controls)

This is academically defensible: a score of 78/100 at 82% coverage is reported
as such, rather than pretending every control was evaluated.

Scoring Version: v1.0
"""
from __future__ import annotations
import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from app.schemas import (
    ControlEvaluation, ControlStatus, PillarScore, TrustScoreResult, FrugalAIMetrics,
    Finding, Severity, ConfidenceLevel,
)
from app.config import settings

_SCORING_CONFIG_PATH = Path(__file__).parent.parent.parent / "config" / "scoring_v1.json"

CONTROL_VALUES = {
    ControlStatus.PASS: 1.0,
    ControlStatus.PARTIAL: 0.5,
    ControlStatus.FAIL: 0.0,
    ControlStatus.UNKNOWN: None,  # excluded from denominator
    ControlStatus.NOT_APPLICABLE: None,  # excluded from denominator and score
}

STATUS_THRESHOLDS = {
    "Strong Alignment": 80,
    "Needs Attention": 60,
    "Potential Gaps": 0,
}


def _load_config() -> dict:
    with open(_SCORING_CONFIG_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def compute_trust_score(
    control_evaluations: list[ControlEvaluation],
    frugal_metrics: FrugalAIMetrics,
    assessment_id: Optional[str] = None,
) -> TrustScoreResult:
    """
    Compute the full Trust Score breakdown from a flat list of ControlEvaluations.
    """
    config = _load_config()
    assessment_id = assessment_id or f"asmnt_{uuid.uuid4().hex[:8]}"

    # Index evaluations by control_id
    eval_by_id: dict[str, ControlEvaluation] = {e.control_id: e for e in control_evaluations}

    pillar_scores: list[PillarScore] = []
    total_controls = 0
    total_evaluated = 0
    total_unknown = 0
    total_na = 0

    weighted_score_sum = 0.0
    effective_weight_sum = 0.0

    for pillar_cfg in config["pillars"]:
        p_id = pillar_cfg["id"]
        p_weight = pillar_cfg["weight"]
        p_controls_cfg = pillar_cfg["controls"]

        pillar_control_evals: list[ControlEvaluation] = []
        for c_cfg in p_controls_cfg:
            ev = eval_by_id.get(c_cfg["id"])
            if ev:
                pillar_control_evals.append(ev)
            # If somehow missing, skip (shouldn't happen)

        total_controls += len(pillar_control_evals)

        # Calculate pillar score
        p_weighted_sum = 0.0
        p_weight_denominator = 0.0
        p_evaluated = 0
        p_unknown = 0
        p_na = 0

        for ev in pillar_control_evals:
            val = CONTROL_VALUES.get(ev.status)
            if ev.status == ControlStatus.NOT_APPLICABLE:
                p_na += 1
                total_na += 1
            elif val is None:  # UNKNOWN
                p_unknown += 1
                total_unknown += 1
            else:  # PASS, PARTIAL, FAIL
                p_evaluated += 1
                total_evaluated += 1
                p_weighted_sum += val * ev.weight
                p_weight_denominator += ev.weight

        if p_weight_denominator > 0:
            raw_pillar_score = (p_weighted_sum / p_weight_denominator) * 100
        else:
            raw_pillar_score = 0.0  # No evaluatable controls in this pillar

        # This pillar contributes to overall score only if it has evaluated controls
        if p_weight_denominator > 0:
            weighted_score_sum += raw_pillar_score * p_weight
            effective_weight_sum += p_weight

        pillar_scores.append(PillarScore(
            pillar_id=p_id,
            name=pillar_cfg["name"],
            weight=p_weight,
            raw_score=round(raw_pillar_score, 1),
            evaluated_controls=p_evaluated,
            unknown_controls=p_unknown,
            na_controls=p_na,
            controls=pillar_control_evals,
            description=pillar_cfg.get("description", ""),
            color=pillar_cfg.get("color", "#10B981"),
        ))

    # Overall score
    if effective_weight_sum > 0:
        overall_score = weighted_score_sum / effective_weight_sum
    else:
        overall_score = 0.0

    # Coverage
    evaluatable = total_controls - total_na
    coverage = (total_evaluated / evaluatable * 100) if evaluatable > 0 else 0.0

    # Status label
    status_label = "Potential Gaps"
    for label, threshold in STATUS_THRESHOLDS.items():
        if overall_score >= threshold:
            status_label = label
            break

    return TrustScoreResult(
        assessment_id=assessment_id,
        scoring_version=settings.scoring_version,
        overall_score=round(overall_score, 1),
        coverage_percentage=round(coverage, 1),
        status_label=status_label,
        pillars=pillar_scores,
        total_controls=total_controls,
        evaluated_controls=total_evaluated,
        unknown_controls=total_unknown,
        na_controls=total_na,
        frugal_ai_metrics=frugal_metrics,
        computed_at=datetime.now(timezone.utc).isoformat(),
    )


def generate_findings(
    pillar_scores: list[PillarScore],
    config: Optional[dict] = None,
) -> list[Finding]:
    """
    Generate findings from evaluated controls with FAIL or PARTIAL status.
    Severity is assigned based on the control's severity_if_fail field in config,
    not randomly.
    """
    if config is None:
        config = _load_config()

    # Build control config lookup
    ctrl_config_map = {}
    for pillar in config["pillars"]:
        for c in pillar["controls"]:
            ctrl_config_map[c["id"]] = {"pillar": pillar["name"], **c}

    findings: list[Finding] = []
    for pillar in pillar_scores:
        for ctrl in pillar.controls:
            if ctrl.status not in (ControlStatus.FAIL, ControlStatus.PARTIAL):
                continue

            c_cfg = ctrl_config_map.get(ctrl.control_id, {})
            severity_str = c_cfg.get("severity_if_fail", "medium")

            # Map severity string to enum
            severity_map = {
                "critical": Severity.CRITICAL,
                "high": Severity.HIGH,
                "medium": Severity.MEDIUM,
                "low": Severity.LOW,
                "informational": Severity.INFORMATIONAL,
            }
            severity = severity_map.get(severity_str, Severity.MEDIUM)

            # Downgrade severity if PARTIAL (not complete failure)
            if ctrl.status == ControlStatus.PARTIAL and severity == Severity.CRITICAL:
                severity = Severity.HIGH

            # Score impact: based on weight and status
            val = CONTROL_VALUES.get(ctrl.status, 0.0)
            score_impact = round(-(1.0 - val) * ctrl.weight * pillar.weight / 1000, 2)

            what_wrong, why_matters, what_do, how_improve = _finding_texts(ctrl.control_id, ctrl.status)

            findings.append(Finding(
                finding_id=f"F_{ctrl.control_id}_{ctrl.status.value[:2]}",
                title=ctrl.title,
                pillar=pillar.name,
                category=_control_category(ctrl.control_id),
                severity=severity,
                control_id=ctrl.control_id,
                what_is_wrong=what_wrong,
                why_it_matters=why_matters,
                what_should_we_do=what_do,
                how_to_improve=how_improve,
                legal_reference=ctrl.dpdp_reference or "",
                dpdp_section=_extract_section(ctrl.dpdp_reference or ""),
                score_impact=score_impact,
                recommendation=what_do,
                confidence=ctrl.confidence,
                source="rule_engine",
            ))

    return findings


def _control_category(ctrl_id: str) -> str:
    prefix = ctrl_id[:2]
    return {
        "C1": "Consent",
        "C2": "Rights",
        "C3": "Security",
        "C4": "Processors",
        "C5": "Retention",
        "C6": "Evidence",
    }.get(prefix, "Governance")


def _extract_section(reference: str) -> str:
    """Pull section number from a reference string."""
    import re
    m = re.search(r"Section\s+([\d\(\)–\-]+)", reference, re.IGNORECASE)
    return f"Section {m.group(1)}" if m else reference[:30]


def _finding_texts(ctrl_id: str, status: ControlStatus) -> tuple[str, str, str, str]:
    """Return (what_wrong, why_matters, what_do, how_improve) per control."""
    texts = {
        "C1_01": (
            "No publicly accessible privacy notice/policy was detected on your website.",
            "DPDP Act Section 5 requires a clear privacy notice before collecting personal data. Absence may lead to non-compliance penalties.",
            "Publish a DPDP-compliant privacy policy at a clear URL (e.g., /privacy).",
            "Draft a notice covering purpose, data categories, retention period, and Grievance Officer details. Link it prominently in your website footer."
        ),
        "C1_02": (
            "Grievance Officer/DPO contact information was not detected in the privacy policy.",
            "DPDP Act Section 8(9) mandates a designated Grievance Officer with accessible contact details.",
            "Add Grievance Officer name, email, and address to the privacy policy.",
            "Update the 'Contact Us' or 'Grievance Redressal' section of your privacy policy with the officer's official email."
        ),
        "C1_03": (
            "A clear consent withdrawal (reject/opt-out) mechanism was not detected in the cookie consent interface.",
            "DPDP Act Section 6(4) requires that consent withdrawal must be as easy as giving consent. Absence may indicate pre-consent data collection.",
            "Add a clearly labeled 'Reject All' or 'Manage Preferences' button to your consent banner.",
            "Update your cookie management script (e.g., CookieYes, Osano) to display a reject option alongside the accept button on all device sizes."
        ),
        "C1_04": (
            "Third-party tracker scripts appear to execute before a consent gate is detected.",
            "DPDP Act Section 6(1) requires explicit consent before personal data is processed. Pre-consent tracking may constitute unlawful processing.",
            "Implement a consent management platform that blocks non-essential scripts until explicit opt-in.",
            "Configure script blockers (e.g., Google Tag Manager's consent mode) to defer analytics and marketing scripts until the user actively accepts."
        ),
        "C2_01": (
            "Data Principal right to access/summary was not declared as implemented.",
            "DPDP Act Section 11 guarantees Data Principals the right to obtain a summary of their personal data.",
            "Implement a self-service data access request portal or email workflow with a defined response SLA.",
            "Build a 'My Data' section in your user portal where Data Principals can download or view their data summary."
        ),
        "C2_04": (
            "Grievance Officer details were not provided in the assessment.",
            "DPDP Act Section 13 requires Data Fiduciaries to designate a Grievance Officer and publish their contact.",
            "Designate a Grievance Officer and publish their contact in your privacy policy.",
            "Register the Grievance Officer's name and contact with your privacy policy and internal DPB registration."
        ),
        "C3_01": (
            "Website is not served over HTTPS.",
            "DPDP Act Section 8(5) requires reasonable security safeguards. Serving over HTTP exposes personal data in transit to interception.",
            "Obtain a TLS certificate (e.g., via Let's Encrypt) and configure HTTPS on your web server.",
            "Enable HTTPS on your hosting platform (AWS, GCP, Cloudflare) and configure automatic HTTP→HTTPS redirects."
        ),
        "C3_03": (
            "HSTS (HTTP Strict Transport Security) header is absent.",
            "Without HSTS, browsers may allow HTTP downgrade attacks. This is a supporting technical security signal.",
            "Add the HSTS response header: Strict-Transport-Security: max-age=31536000; includeSubDomains.",
            "Configure HSTS in your web server (nginx/Apache) or CDN settings."
        ),
        "C4_02": (
            "Data Processing Agreements (DPAs) with third-party processors are not confirmed.",
            "DPDP Act Section 8(2) requires formal contracts with all Data Processors establishing liability boundaries.",
            "Execute DPAs with all significant third-party processors handling Indian personal data.",
            "Request DPDP-compliant DPA addenda from your SaaS vendors and cloud providers."
        ),
        "C4_03": (
            "DPAs may not reference DPDP Act 2023 obligations.",
            "Processor contracts referencing only GDPR may be insufficient for DPDP Act compliance, which has distinct Indian requirements.",
            "Update all processor contracts with a DPDP Act 2023 addendum.",
            "Use TrustForge's DPA template to add DPDP-specific clauses to existing GDPR-compliant agreements."
        ),
        "C5_01": (
            "No data retention schedule was provided in the assessment.",
            "DPDP Act Section 8(7) mandates erasure when purpose is fulfilled. Without a defined schedule, indefinite retention may occur.",
            "Define and document a data retention schedule with purpose-based triggers.",
            "Classify data by purpose and set maximum retention periods. Automate deletion in your data warehouse."
        ),
        "C5_02": (
            "No automated erasure mechanism for inactive accounts was confirmed.",
            "DPDP Act Section 8(7) requires erasure upon purpose completion. Manual processes may lead to non-compliance.",
            "Implement an automated data erasure workflow triggered by account inactivity or purpose expiry.",
            "Create a cron job or serverless function to soft-delete user data after the defined retention period."
        ),
        "C5_03": (
            "Retention policy may not be clearly referenced in the privacy notice.",
            "DPDP Act Section 5(1)(c) requires the privacy notice to include retention criteria.",
            "Add a 'Data Retention' section to your privacy policy specifying retention periods or criteria.",
            "State specific retention timeframes (e.g., '3 years after account closure') or reference applicable law."
        ),
        "C6_01": (
            "Privacy Policy document was not uploaded or could not be parsed.",
            "Documentary evidence is required for regulatory audit readiness.",
            "Upload your current Privacy Policy PDF to the Evidence Vault.",
            "Export your privacy policy as a PDF and upload it in the Evidence section."
        ),
    }

    status_prefix = "Not fully implemented: " if status == ControlStatus.PARTIAL else "Not implemented: "
    defaults = (
        f"{status_prefix}{ctrl_id} control not met.",
        "This control is required for DPDP Act baseline compliance.",
        "Review and implement this control in your compliance programme.",
        "Consult the DPDP Act text and TrustForge guidance for implementation steps."
    )

    return texts.get(ctrl_id, defaults)
