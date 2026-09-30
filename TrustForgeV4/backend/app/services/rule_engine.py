"""
TrustForge — Rule Engine (Layer A: Deterministic Checks)

Evaluates compliance controls deterministically from:
  - Website scan results
  - Assessment questionnaire answers
  - Uploaded evidence metadata

This layer costs 0 LLM calls.
Controls that cannot be resolved here are passed to RAG or AI layers.
"""
from __future__ import annotations
import json
from pathlib import Path
from typing import Optional

from app.schemas import (
    ControlEvaluation, ControlStatus, ConfidenceLevel, ScanResult,
)

# Load scoring config from disk
_SCORING_CONFIG_PATH = Path(__file__).parent.parent.parent / "config" / "scoring_v1.json"


def load_scoring_config() -> dict:
    with open(_SCORING_CONFIG_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def _status(cond: Optional[bool]) -> ControlStatus:
    """Convert a boolean condition to a control status. None = UNKNOWN."""
    if cond is True:
        return ControlStatus.PASS
    if cond is False:
        return ControlStatus.FAIL
    return ControlStatus.UNKNOWN


def evaluate_controls_deterministic(
    answers: dict,
    scan_result: Optional[ScanResult],
    evidence_summaries: list,
) -> list[ControlEvaluation]:
    """
    Evaluate all controls that can be determined without AI/RAG.
    Returns a list of ControlEvaluation objects.
    Controls requiring RAG or AI are returned with status UNKNOWN.
    """
    config = load_scoring_config()
    evaluations: list[ControlEvaluation] = []

    # Build an evidence topic set for quick lookup
    evidence_topics: set[str] = set()
    evidence_categories: set[str] = set()
    for ev in evidence_summaries:
        evidence_topics.update(t.lower() for t in getattr(ev, "extracted_topics", []))
        evidence_categories.add(getattr(ev, "status", "").lower())

    for pillar in config["pillars"]:
        for ctrl in pillar["controls"]:
            ctrl_id = ctrl["id"]
            method = ctrl["evaluation_method"]

            # Only evaluate controls that can be done deterministically here
            status = ControlStatus.UNKNOWN
            confidence = ConfidenceLevel.LOW
            evidence_used = []
            notes = ""

            # ── P1: Notice & Consent ──────────────────────────────
            if ctrl_id == "C1_01":
                if scan_result:
                    status = _status(scan_result.privacy_policy.found)
                    confidence = ConfidenceLevel.HIGH
                    evidence_used = [scan_result.privacy_policy.evidence]
                    notes = (
                        f"Privacy policy URL: {scan_result.privacy_policy.url or 'not found'}."
                    )

            elif ctrl_id == "C1_02":
                if scan_result:
                    status = _status(scan_result.privacy_policy.has_grievance_contact)
                    confidence = ConfidenceLevel.HIGH
                    evidence_used = [scan_result.privacy_policy.evidence]
                    notes = "Grievance contact detected in privacy policy." if scan_result.privacy_policy.has_grievance_contact else "Grievance contact not detected."

            elif ctrl_id == "C1_03":
                if scan_result:
                    has_reject = scan_result.cookie_consent.has_reject_button
                    has_pref = scan_result.cookie_consent.has_preference_button
                    if has_reject or has_pref:
                        status = ControlStatus.PASS
                    elif scan_result.cookie_consent.banner_detected:
                        status = ControlStatus.PARTIAL  # banner present but no clear opt-out
                    else:
                        status = ControlStatus.FAIL
                    confidence = ConfidenceLevel.MEDIUM
                    evidence_used = [scan_result.cookie_consent.evidence]

            elif ctrl_id == "C1_04":
                if scan_result:
                    trackers_before = scan_result.cookie_consent.trackers_before_consent
                    if trackers_before:
                        status = ControlStatus.FAIL
                        notes = f"Trackers before consent: {', '.join(trackers_before)}"
                    elif scan_result.cookie_consent.banner_detected:
                        status = ControlStatus.PASS
                        notes = "Consent banner detected; no trackers clearly before consent gate."
                    else:
                        status = ControlStatus.UNKNOWN
                        notes = "No consent gate detected — cannot confirm pre-consent tracking."
                    confidence = ConfidenceLevel.MEDIUM
                    evidence_used = [scan_result.cookie_consent.evidence]

            # ── P2: Data Principal Rights ──────────────────────────
            elif ctrl_id == "C2_01":
                rights = answers.get("dataRights", {})
                has_access = rights.get("access", False) if isinstance(rights, dict) else False
                # Also accept simple boolean in answers
                if not has_access:
                    has_access = bool(answers.get("rightToAccess", False))
                status = _status(has_access if has_access is not None else None)
                confidence = ConfidenceLevel.MEDIUM
                notes = "Self-declared by organization in assessment."

            elif ctrl_id == "C2_02":
                rights = answers.get("dataRights", {})
                has_correction = rights.get("correction", False) if isinstance(rights, dict) else False
                if not has_correction:
                    has_correction = bool(answers.get("rightToCorrection", False))
                status = _status(has_correction if has_correction is not None else None)
                confidence = ConfidenceLevel.MEDIUM
                notes = "Self-declared in assessment."

            elif ctrl_id == "C2_03":
                rights = answers.get("dataRights", {})
                has_erasure = rights.get("erasure", False) if isinstance(rights, dict) else False
                if not has_erasure:
                    has_erasure = bool(answers.get("rightToErasure", False))
                status = _status(has_erasure if has_erasure is not None else None)
                confidence = ConfidenceLevel.MEDIUM

            elif ctrl_id == "C2_04":
                go_name = answers.get("grievanceOfficerName", "")
                go_email = answers.get("grievanceOfficerEmail", "")
                has_go = bool(go_name and go_email)
                status = _status(has_go)
                confidence = ConfidenceLevel.HIGH if has_go else ConfidenceLevel.MEDIUM
                notes = f"Grievance Officer: {go_name or 'not provided'}, {go_email or 'not provided'}."

            # ── P3: Technical Security ──────────────────────────────
            elif ctrl_id == "C3_01":
                if scan_result:
                    status = _status(scan_result.https.has_https)
                    confidence = ConfidenceLevel.HIGH
                    evidence_used = [scan_result.https.evidence]

            elif ctrl_id == "C3_02":
                sec = answers.get("securityControls", {})
                enc = sec.get("encryptionAtRest", "") if isinstance(sec, dict) else ""
                if enc and enc.lower() not in ("", "none", "no"):
                    status = ControlStatus.PASS
                    notes = f"Declared: {enc}"
                else:
                    status = ControlStatus.UNKNOWN
                    notes = "Encryption at rest not declared in assessment."
                confidence = ConfidenceLevel.MEDIUM

            elif ctrl_id == "C3_03":
                if scan_result:
                    status = _status(scan_result.https.hsts_present)
                    confidence = ConfidenceLevel.HIGH
                    evidence_used = [scan_result.https.evidence]

            elif ctrl_id == "C3_04":
                has_ir = bool(answers.get("incidentResponseProcedure", False))
                status = _status(has_ir if has_ir else None)
                confidence = ConfidenceLevel.MEDIUM
                notes = "Self-declared in assessment."

            # ── P4: Processor Governance ────────────────────────────
            elif ctrl_id == "C4_01":
                processors = answers.get("processors", [])
                has_inventory = bool(processors) or bool(answers.get("processorInventory", False))
                status = _status(has_inventory if isinstance(has_inventory, bool) else None)
                confidence = ConfidenceLevel.MEDIUM

            elif ctrl_id == "C4_02":
                dpa_executed = answers.get("dpaExecuted", None)
                if dpa_executed is True:
                    status = ControlStatus.PASS
                elif dpa_executed is False:
                    status = ControlStatus.FAIL
                else:
                    # Check evidence
                    has_vendor_evidence = any(
                        "vendor" in t or "dpa" in t or "processor" in t
                        for t in evidence_topics
                    )
                    status = ControlStatus.PARTIAL if has_vendor_evidence else ControlStatus.UNKNOWN
                confidence = ConfidenceLevel.MEDIUM

            elif ctrl_id == "C4_03":
                # Requires RAG — mark UNKNOWN for now, RAG engine will resolve
                status = ControlStatus.UNKNOWN
                notes = "Requires document analysis via RAG."

            # ── P5: Data Retention ──────────────────────────────────
            elif ctrl_id == "C5_01":
                retention_days = answers.get("retentionDays", None)
                retention_policy = answers.get("retentionPolicy", None)
                has_retention = bool(retention_days or retention_policy)
                status = _status(has_retention)
                confidence = ConfidenceLevel.MEDIUM
                notes = f"Retention period declared: {retention_days} days." if retention_days else "Retention schedule not explicitly specified."

            elif ctrl_id == "C5_02":
                auto_erase = answers.get("automatedErasure", None)
                if auto_erase is True:
                    status = ControlStatus.PASS
                elif auto_erase is False:
                    status = ControlStatus.FAIL
                else:
                    retention_days = answers.get("retentionDays", 0)
                    status = ControlStatus.PARTIAL if int(retention_days or 0) > 0 else ControlStatus.UNKNOWN
                confidence = ConfidenceLevel.MEDIUM

            elif ctrl_id == "C5_03":
                # Requires RAG or evidence parsing — mark UNKNOWN
                status = ControlStatus.UNKNOWN
                notes = "Requires privacy policy document analysis via RAG."

            # ── P6: Evidence Verification ───────────────────────────
            elif ctrl_id == "C6_01":
                has_pp = any("privacy" in t for t in evidence_topics)
                if not has_pp:
                    # Check if any evidence was uploaded with PARSED/ANALYSED status
                    has_pp = any(
                        hasattr(ev, "status") and ev.status.value in ("PARSED", "ANALYSED", "SUPPORTED")
                        and "privacy" in (getattr(ev, "file_name", "") or "").lower()
                        for ev in evidence_summaries
                    )
                status = _status(has_pp)
                confidence = ConfidenceLevel.MEDIUM

            elif ctrl_id == "C6_02":
                has_corp = any(
                    t in evidence_topics for t in ("corporate", "identity", "cin", "incorporation")
                )
                status = _status(has_corp)
                confidence = ConfidenceLevel.MEDIUM

            elif ctrl_id == "C6_03":
                has_sec = any(
                    t in evidence_topics for t in ("security", "soc", "iso", "audit")
                )
                status = _status(has_sec)
                confidence = ConfidenceLevel.MEDIUM

            evaluations.append(ControlEvaluation(
                control_id=ctrl_id,
                title=ctrl["title"],
                pillar=pillar["id"],
                weight=ctrl["weight"],
                status=status,
                confidence=confidence,
                evidence_used=evidence_used,
                dpdp_reference=ctrl.get("dpdp_reference"),
                notes=notes,
                evaluation_method=(
                    method if status not in (ControlStatus.UNKNOWN,) else
                    ("rag" if "rag" in method else "deterministic")
                ),
            ))

    return evaluations
