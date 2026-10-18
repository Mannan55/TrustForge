# TrustForge Canonical Control Registry

**Generated from:** `backend/compliance/controls.py` (authoritative source of truth)  
**Generated at:** 2026-10-09  
**Registry version:** This document supersedes all prior control tables in FINAL_VERIFICATION_REPORT.md  

> [!IMPORTANT]
> This document is generated directly from the actual code. Do NOT update this document manually without also updating `controls.py`. If they conflict, `controls.py` is authoritative.

---

## Registry Summary

| Property | Value |
|---|---|
| Total controls | 20 |
| Pillars | 6 |
| Evaluation methods | DETERMINISTIC (2 controls), RAG_GROUNDED (18 controls) |
| Control weight range | 1.0 – 2.0 (NOT 0.6–1.0 as stated in prior report) |
| Weight values used | 1.0, 1.5, 2.0 |

---

## Pillar Summary

| Pillar | Controls | Pillar Weight (global) |
|---|---|---|
| Privacy | 5 | 0.20 |
| Security | 4 | 0.20 |
| Transparency | 2 | 0.15 |
| Governance | 2 | 0.15 |
| Data Lifecycle | 3 | 0.15 |
| User Rights | 4 | 0.15 |

---

## Legal Mapping Verification Notes

The following notes document the legal grounding status of each control's statutory mapping, verified against the embedded DPDP Act 2023 text in `backend/rag/ingest.py` (BUILTIN_DPDP_SECTIONS), which is drawn from the Gazette of India (CG-DL-E-12082023-247997, dated 2023-08-11).

**Legal mapping classification:**
- `DIRECT` — obligation is expressly stated in the mapped section
- `INFERRED` — the control addresses an obligation reasonably implied by the section
- `TECHNICAL_INDICATOR` — the control assesses a technical safeguard that supports the legal obligation but is not itself expressly named in the Act
- `UNVERIFIED` — could not be independently confirmed against the statutory text

---

## Full Control Registry

### PRIVACY PILLAR

---

#### TF-PRIV-001 — Privacy Notice Availability

| Field | Value |
|---|---|
| **Control ID** | `TF-PRIV-001` |
| **Pillar** | Privacy |
| **Title** | Privacy Notice Availability |
| **Severity** | HIGH |
| **Weight** | 2.0 |
| **Evaluation Method** | RAG_GROUNDED |
| **Legal Mapping** | Section 5 |
| **Legal Mapping Detail** | Section 5 of DPDP Act 2023 — Notice requirements for Data Fiduciaries |
| **Legal Grounding** | DIRECT |
| **Description** | A privacy notice must be publicly accessible, in clear language, and cover what data is collected, why, and how rights can be exercised. |
| **Required Evidence Keys** | `privacy_policy_link` |
| **Scanner Mapping** | `privacy_policy_link` |
| **Wizard Mapping** | _(none)_ |

**Legal verification:** Section 5 expressly requires every Data Fiduciary intending to process personal data to give the Data Principal a notice containing a description of the personal data sought to be collected, the purpose, the manner to exercise rights, and the manner to complain to the Board. The existence and accessibility of a privacy notice is a direct Section 5 obligation.

**Note on previous report:** Prior report listed this control as "Consent Architecture" with weight 1.0 — both are incorrect. The control is "Privacy Notice Availability" with weight 2.0.

---

#### TF-PRIV-002 — Notice Language Accessibility

| Field | Value |
|---|---|
| **Control ID** | `TF-PRIV-002` |
| **Pillar** | Privacy |
| **Title** | Notice Language Accessibility |
| **Severity** | MEDIUM |
| **Weight** | 1.5 |
| **Evaluation Method** | RAG_GROUNDED |
| **Legal Mapping** | Section 5 |
| **Legal Mapping Detail** | Section 5 DPDP Act 2023 — Notice language availability |
| **Legal Grounding** | DIRECT |
| **Description** | Privacy notice must be available in English or a language in the Eighth Schedule to the Constitution that the user understands. |
| **Required Evidence Keys** | `notice_languages` |
| **Scanner Mapping** | _(none)_ |
| **Wizard Mapping** | `languages` |

**Legal verification:** Section 5 of the Act explicitly states that the notice "shall be available in English or any language specified in the Eighth Schedule to the Constitution." This is a direct statutory obligation.

---

#### TF-PRIV-003 — Consent Mechanism — Free, Specific, Informed

| Field | Value |
|---|---|
| **Control ID** | `TF-PRIV-003` |
| **Pillar** | Privacy |
| **Title** | Consent Mechanism — Free, Specific, Informed |
| **Severity** | HIGH |
| **Weight** | 2.0 |
| **Evaluation Method** | RAG_GROUNDED |
| **Legal Mapping** | Section 6 |
| **Legal Mapping Detail** | Section 6 DPDP Act 2023 — Validity conditions for consent |
| **Legal Grounding** | DIRECT |
| **Description** | Consent must be free, specific, informed, unconditional, and obtained through a clear affirmative action. Pre-ticked boxes are not valid. |
| **Required Evidence Keys** | `consent_banner` |
| **Scanner Mapping** | `consent_banner` |
| **Wizard Mapping** | _(none)_ |

**Legal verification:** Section 6 directly states that consent "shall be free, specific, informed, unconditional and unambiguous with a clear affirmative action." Pre-ticked boxes or implied consent would violate this standard.

---

#### TF-PRIV-004 — Consent Withdrawal Ease

| Field | Value |
|---|---|
| **Control ID** | `TF-PRIV-004` |
| **Pillar** | Privacy |
| **Title** | Consent Withdrawal Ease |
| **Severity** | HIGH |
| **Weight** | 1.5 |
| **Evaluation Method** | RAG_GROUNDED |
| **Legal Mapping** | Section 6 |
| **Legal Mapping Detail** | Section 6 DPDP Act 2023 — Right to withdraw consent with equal ease |
| **Legal Grounding** | DIRECT |
| **Description** | Withdrawing consent must be as easy as giving it. An imbalance (e.g., one-click accept, multi-step reject) weakens consent validity. |
| **Required Evidence Keys** | `consent_banner` |
| **Scanner Mapping** | `consent_banner` |
| **Wizard Mapping** | _(none)_ |

**Legal verification:** Section 6 of the Act expressly states "The Data Principal shall have the right to withdraw her consent at any time, with the ease of the same standard as giving consent." This is a direct statutory obligation.

---

#### TF-PRIV-005 — Lawful Basis for Each Processing Purpose

| Field | Value |
|---|---|
| **Control ID** | `TF-PRIV-005` |
| **Pillar** | Privacy |
| **Title** | Lawful Basis for Each Processing Purpose |
| **Severity** | HIGH |
| **Weight** | 2.0 |
| **Evaluation Method** | RAG_GROUNDED |
| **Legal Mapping** | Section 4 |
| **Legal Mapping Detail** | Section 4 DPDP Act 2023 — Grounds for processing personal data |
| **Legal Grounding** | DIRECT |
| **Description** | Each processing purpose must have a lawful basis — either consent (Section 6) or a legitimate use (Section 7). Purposes without a lawful basis are not permitted. |
| **Required Evidence Keys** | `processing_purposes` |
| **Scanner Mapping** | _(none)_ |
| **Wizard Mapping** | `purposes`, `collections` |

**Legal verification:** Section 4 directly states that a Data Fiduciary may process personal data "only in accordance with the provisions of this Act for any lawful purpose — (a) for which the Data Principal has given her consent; or (b) for certain legitimate uses specified under this Act."

---

### SECURITY PILLAR

---

#### TF-SEC-001 — Transport Security (HTTPS + HSTS)

| Field | Value |
|---|---|
| **Control ID** | `TF-SEC-001` |
| **Pillar** | Security |
| **Title** | Transport Security (HTTPS + HSTS) |
| **Severity** | HIGH |
| **Weight** | 2.0 |
| **Evaluation Method** | DETERMINISTIC |
| **Legal Mapping** | Section 8(3) |
| **Legal Mapping Detail** | Section 8(3) DPDP Act 2023 — Reasonable security safeguards |
| **Legal Grounding** | TECHNICAL_INDICATOR |
| **Description** | All personal data in transit must be encrypted. HTTPS must be enforced. HSTS prevents downgrade attacks. |
| **Required Evidence Keys** | `https_enforced`, `hsts_header` |
| **Scanner Mapping** | `https_enforced`, `hsts_header` |
| **Wizard Mapping** | _(none)_ |

**Legal verification:** Section 8(3) requires Data Fiduciaries to "protect personal data in its possession or under its control... by taking reasonable security safeguards to prevent personal data breach." HTTPS and HSTS are widely recognized technical safeguards for data in transit. However, the Act does not expressly mandate HTTPS or HSTS by name — these are classified as **TECHNICAL_INDICATOR** checks that demonstrate adherence to the "reasonable security safeguards" standard, not a direct textual mapping. This distinction must be maintained in research claims.

---

#### TF-SEC-002 — Security Response Headers

| Field | Value |
|---|---|
| **Control ID** | `TF-SEC-002` |
| **Pillar** | Security |
| **Title** | Security Response Headers |
| **Severity** | MEDIUM |
| **Weight** | 1.5 |
| **Evaluation Method** | DETERMINISTIC |
| **Legal Mapping** | Section 8(3) |
| **Legal Mapping Detail** | Section 8(3) DPDP Act 2023 — Reasonable security safeguards |
| **Legal Grounding** | TECHNICAL_INDICATOR |
| **Description** | HTTP security headers (CSP, X-Content-Type-Options, Referrer-Policy) reduce attack surface for web-based data breaches. |
| **Required Evidence Keys** | `csp_header`, `xcto_header`, `referrer_policy_header` |
| **Scanner Mapping** | `csp_header`, `xcto_header`, `referrer_policy_header` |
| **Wizard Mapping** | _(none)_ |

**Legal verification:** Same as TF-SEC-001. CSP, X-Content-Type-Options, and Referrer-Policy are **not** expressly named in the DPDP Act. They are established OWASP-recommended security headers that reduce web attack surface and thus serve as observable technical indicators of the "reasonable security safeguards" obligation under Section 8(3). Do not claim the Act mandates these specific headers.

---

#### TF-SEC-003 — Breach Response Readiness

| Field | Value |
|---|---|
| **Control ID** | `TF-SEC-003` |
| **Pillar** | Security |
| **Title** | Breach Response Readiness |
| **Severity** | HIGH |
| **Weight** | 2.0 |
| **Evaluation Method** | RAG_GROUNDED |
| **Legal Mapping** | Section 8(4) |
| **Legal Mapping Detail** | Section 8(4) DPDP Act 2023 — Breach notification obligation |
| **Legal Grounding** | DIRECT |
| **Description** | Data Fiduciaries must have a documented breach response procedure and be able to notify the DPDB and affected Data Principals promptly. |
| **Required Evidence Keys** | `breach_plan` |
| **Scanner Mapping** | _(none)_ |
| **Wizard Mapping** | `breach_plan` |

**Legal verification:** Section 8(4) directly states: "in the event of a personal data breach, give the Board and each affected Data Principal notice of such breach in such manner as may be prescribed." Readiness to execute this notification is a direct statutory obligation.

---

#### TF-SEC-004 — Third-Party Tracker Pre-Consent Loading

| Field | Value |
|---|---|
| **Control ID** | `TF-SEC-004` |
| **Pillar** | Security |
| **Title** | Third-Party Tracker Pre-Consent Loading |
| **Severity** | HIGH |
| **Weight** | 1.5 |
| **Evaluation Method** | RAG_GROUNDED |
| **Legal Mapping** | Section 4 |
| **Legal Mapping Detail** | Section 4 DPDP Act 2023 — Processing requires lawful basis |
| **Legal Grounding** | INFERRED |
| **Description** | Analytics and tracking scripts must not execute before consent is given. Pre-consent tracking has no lawful basis. |
| **Required Evidence Keys** | `third_party_trackers`, `consent_banner` |
| **Scanner Mapping** | `third_party_trackers`, `consent_banner` |
| **Wizard Mapping** | _(none)_ |

**Legal verification:** Section 4 requires a lawful basis for processing. If third-party tracking scripts collect personal data before consent is obtained, there is no lawful basis for that processing. This is an **INFERRED** obligation — the Act does not expressly address tracker loading order, but the absence of a lawful basis for data collection is directly prohibited.

---

### TRANSPARENCY PILLAR

---

#### TF-TRANS-001 — Grievance Officer Contact Published

| Field | Value |
|---|---|
| **Control ID** | `TF-TRANS-001` |
| **Pillar** | Transparency |
| **Title** | Grievance Officer Contact Published |
| **Severity** | HIGH |
| **Weight** | 1.5 |
| **Evaluation Method** | RAG_GROUNDED |
| **Legal Mapping** | Section 8(6) |
| **Legal Mapping Detail** | Section 8(6) DPDP Act 2023 — Publication of DPO/contact details |
| **Legal Grounding** | DIRECT |
| **Description** | Data Fiduciaries must publish the business contact details of a Data Protection Officer or key managerial personnel who responds to Data Principals. |
| **Required Evidence Keys** | `grievance_contact_published` |
| **Scanner Mapping** | `grievance_contact_published` |
| **Wizard Mapping** | `grievance_officer_named`, `grievance_contact_published` |

**Legal verification:** Section 8(6) directly states Data Fiduciaries shall "publish the business contact information of a Data Protection Officer or such other key managerial personnel as may be prescribed, who shall respond to any correspondence from Data Principals or the Board." This is a direct statutory obligation.

---

#### TF-TRANS-002 — Data Category Disclosure in Privacy Notice

| Field | Value |
|---|---|
| **Control ID** | `TF-TRANS-002` |
| **Pillar** | Transparency |
| **Title** | Data Category Disclosure in Privacy Notice |
| **Severity** | MEDIUM |
| **Weight** | 1.5 |
| **Evaluation Method** | RAG_GROUNDED |
| **Legal Mapping** | Section 5 |
| **Legal Mapping Detail** | Section 5(a) DPDP Act 2023 — Notice must describe data collected and purpose |
| **Legal Grounding** | DIRECT |
| **Description** | The privacy notice must identify what categories of personal data are collected and for what purposes. |
| **Required Evidence Keys** | `privacy_policy_link`, `data_categories` |
| **Scanner Mapping** | `privacy_policy_link` |
| **Wizard Mapping** | `categories` |

**Legal verification:** Section 5(a) expressly requires notice to contain "a description of the personal data sought to be collected and the purpose of processing of such personal data." Disclosure of data categories is a direct statutory requirement.

---

### GOVERNANCE PILLAR

---

#### TF-GOV-001 — Data Processor Contracts

| Field | Value |
|---|---|
| **Control ID** | `TF-GOV-001` |
| **Pillar** | Governance |
| **Title** | Data Processor Contracts |
| **Severity** | HIGH |
| **Weight** | 2.0 |
| **Evaluation Method** | RAG_GROUNDED |
| **Legal Mapping** | Section 8(7) |
| **Legal Mapping Detail** | Section 8(7) DPDP Act 2023 — Valid contract with Data Processors |
| **Legal Grounding** | DIRECT |
| **Description** | Every Data Processor engaged to process personal data must operate under a valid contract with the Data Fiduciary. |
| **Required Evidence Keys** | `processor_contracts` |
| **Scanner Mapping** | _(none)_ |
| **Wizard Mapping** | `processors` |

**Legal verification:** Section 8(7) directly states: "prior to engaging a Data Processor for the processing of personal data on behalf of the Data Fiduciary, the Data Fiduciary shall enter into a valid contract with the Data Processor." This is a direct statutory obligation.

---

#### TF-GOV-002 — Data Accuracy Practices

| Field | Value |
|---|---|
| **Control ID** | `TF-GOV-002` |
| **Pillar** | Governance |
| **Title** | Data Accuracy Practices |
| **Severity** | MEDIUM |
| **Weight** | 1.0 |
| **Evaluation Method** | RAG_GROUNDED |
| **Legal Mapping** | Section 8(1) |
| **Legal Mapping Detail** | Section 8(1) DPDP Act 2023 — Data accuracy obligation |
| **Legal Grounding** | DIRECT |
| **Description** | Data Fiduciaries must make reasonable efforts to ensure personal data is accurate, complete, and consistent. |
| **Required Evidence Keys** | `accuracy_practices` |
| **Scanner Mapping** | _(none)_ |
| **Wizard Mapping** | `rights` |

**Legal verification:** Section 8(1) directly states Data Fiduciaries shall "make reasonable efforts to ensure that the personal data of the Data Principal, that is processed, is accurate and complete."

---

### DATA LIFECYCLE PILLAR

---

#### TF-LIFE-001 — Retention Limitation

| Field | Value |
|---|---|
| **Control ID** | `TF-LIFE-001` |
| **Pillar** | Data Lifecycle |
| **Title** | Retention Limitation |
| **Severity** | HIGH |
| **Weight** | 2.0 |
| **Evaluation Method** | RAG_GROUNDED |
| **Legal Mapping** | Section 8(5) |
| **Legal Mapping Detail** | Section 8(5) DPDP Act 2023 — Storage limitation |
| **Legal Grounding** | DIRECT |
| **Description** | Personal data must not be retained for longer than is necessary for the specified purpose. |
| **Required Evidence Keys** | `retention_policy` |
| **Scanner Mapping** | _(none)_ |
| **Wizard Mapping** | `retention` |

**Legal verification:** Section 8(5) directly states Data Fiduciaries shall "retain data only for so long as is necessary for the specified purpose."

---

#### TF-LIFE-002 — Data Erasure Process

| Field | Value |
|---|---|
| **Control ID** | `TF-LIFE-002` |
| **Pillar** | Data Lifecycle |
| **Title** | Data Erasure Process |
| **Severity** | HIGH |
| **Weight** | 2.0 |
| **Evaluation Method** | RAG_GROUNDED |
| **Legal Mapping** | Section 12(d) |
| **Legal Mapping Detail** | Section 12(d) DPDP Act 2023 — Right to erasure |
| **Legal Grounding** | DIRECT |
| **Description** | When personal data is no longer needed, or when a Data Principal exercises their right to erasure, the data must be erased. |
| **Required Evidence Keys** | `erasure_automated` |
| **Scanner Mapping** | _(none)_ |
| **Wizard Mapping** | `erasure_automated` |

**Legal verification:** Section 12(d) directly grants Data Principals the right to "erasure of personal data, the retention of which is no longer necessary for the purpose for which it was collected." The Data Fiduciary's obligation to fulfill this right is the basis for this control.

---

#### TF-LIFE-003 — Data Minimisation

| Field | Value |
|---|---|
| **Control ID** | `TF-LIFE-003` |
| **Pillar** | Data Lifecycle |
| **Title** | Data Minimisation |
| **Severity** | MEDIUM |
| **Weight** | 1.0 |
| **Evaluation Method** | RAG_GROUNDED |
| **Legal Mapping** | Section 4 |
| **Legal Mapping Detail** | Section 4 DPDP Act 2023 — Lawful purpose limitation |
| **Legal Grounding** | INFERRED |
| **Description** | Only personal data necessary for the stated purpose should be collected. Collecting more data than needed ('data maximisation') is not aligned with the Act. |
| **Required Evidence Keys** | `data_categories`, `processing_purposes` |
| **Scanner Mapping** | _(none)_ |
| **Wizard Mapping** | `categories`, `purposes` |

**Legal verification:** The DPDP Act 2023 does not contain an explicit "data minimisation" clause using that terminology (unlike GDPR Article 5(1)(c)). However, Section 4 requires processing "for any lawful purpose" and Section 5 requires disclosure of purposes. Collecting data beyond what serves the stated lawful purpose is an **INFERRED** violation. This distinction must be maintained in research claims — do not assert a direct data minimisation mandate equivalent to GDPR.

---

### USER RIGHTS PILLAR

---

#### TF-RIGHTS-001 — Right to Access Information

| Field | Value |
|---|---|
| **Control ID** | `TF-RIGHTS-001` |
| **Pillar** | User Rights |
| **Title** | Right to Access Information |
| **Severity** | HIGH |
| **Weight** | 2.0 |
| **Evaluation Method** | RAG_GROUNDED |
| **Legal Mapping** | Section 11 |
| **Legal Mapping Detail** | Section 11 DPDP Act 2023 — Right to access information |
| **Legal Grounding** | DIRECT |
| **Description** | Data Principals must be able to obtain a summary of their personal data and a description of the processing activities. |
| **Required Evidence Keys** | `rights_access` |
| **Scanner Mapping** | _(none)_ |
| **Wizard Mapping** | `rights` |

**Legal verification:** Section 11 directly grants Data Principals the right to obtain from the Data Fiduciary a summary of personal data being processed, identities of other Data Fiduciaries/Processors with whom data was shared, and any other prescribed information.

---

#### TF-RIGHTS-002 — Right to Correction and Erasure

| Field | Value |
|---|---|
| **Control ID** | `TF-RIGHTS-002` |
| **Pillar** | User Rights |
| **Title** | Right to Correction and Erasure |
| **Severity** | HIGH |
| **Weight** | 2.0 |
| **Evaluation Method** | RAG_GROUNDED |
| **Legal Mapping** | Section 12 |
| **Legal Mapping Detail** | Section 12 DPDP Act 2023 — Right to correction and erasure |
| **Legal Grounding** | DIRECT |
| **Description** | Data Principals must be able to request correction and erasure of their data, and the Data Fiduciary must act on such requests. |
| **Required Evidence Keys** | `rights_correction`, `rights_erasure` |
| **Scanner Mapping** | _(none)_ |
| **Wizard Mapping** | `rights` |

**Legal verification:** Section 12 directly grants rights to correction of inaccurate data, completion of incomplete data, updating of out-of-date data, and erasure. The Data Fiduciary's obligation to respond to and act on these requests is the basis for this control.

---

#### TF-RIGHTS-003 — Grievance Redressal Mechanism

| Field | Value |
|---|---|
| **Control ID** | `TF-RIGHTS-003` |
| **Pillar** | User Rights |
| **Title** | Grievance Redressal Mechanism |
| **Severity** | HIGH |
| **Weight** | 2.0 |
| **Evaluation Method** | RAG_GROUNDED |
| **Legal Mapping** | Section 13 |
| **Legal Mapping Detail** | Section 13 DPDP Act 2023 — Right to grievance redressal |
| **Legal Grounding** | DIRECT |
| **Description** | A mechanism must exist for Data Principals to raise grievances with the Data Fiduciary and receive responses within a prescribed timeframe. |
| **Required Evidence Keys** | `grievance_contact_published` |
| **Scanner Mapping** | `grievance_contact_published` |
| **Wizard Mapping** | `grievance_officer_named`, `grievance_contact_published` |

**Legal verification:** Section 13 directly grants Data Principals the right to have grievances redressed and to register grievances with the Data Fiduciary. The Data Fiduciary must respond "within such period and in such manner as may be prescribed."

---

#### TF-RIGHTS-004 — Rights Request Process Availability

| Field | Value |
|---|---|
| **Control ID** | `TF-RIGHTS-004` |
| **Pillar** | User Rights |
| **Title** | Rights Request Process Availability |
| **Severity** | MEDIUM |
| **Weight** | 1.5 |
| **Evaluation Method** | RAG_GROUNDED |
| **Legal Mapping** | Section 5(b) |
| **Legal Mapping Detail** | Section 5(b) DPDP Act 2023 — Notice must inform how to exercise rights |
| **Legal Grounding** | DIRECT |
| **Description** | Data Principals must be informed of and able to exercise their rights (access, correction, erasure, nomination). |
| **Required Evidence Keys** | `rights_portal` |
| **Scanner Mapping** | `privacy_policy_link` |
| **Wizard Mapping** | `rights` |

**Legal verification:** Section 5(b) directly requires the notice to contain "the manner in which the Data Principal may exercise her rights under the provisions of this Act." Informing users of their rights and providing a mechanism to exercise them is a direct statutory obligation.

---

## Corrections to Previous Report

The control table in `FINAL_VERIFICATION_REPORT.md` (Section 5) contained **significant errors** compared to the actual code:

| Field | Previous Report (Incorrect) | Actual Code (Correct) |
|---|---|---|
| TF-PRIV-001 Title | "Consent Architecture" | "Privacy Notice Availability" |
| TF-PRIV-001 Weight | 1.0 | 2.0 |
| TF-PRIV-001 Legal ref | "Section 6(1), 6(2)" | Section 5 |
| TF-PRIV-002 Title | "Notice Requirements" | "Notice Language Accessibility" |
| TF-PRIV-002 Weight | 1.0 | 1.5 |
| TF-PRIV-003 Title | "Purpose Limitation" | "Consent Mechanism — Free, Specific, Informed" |
| TF-PRIV-003 Severity | MEDIUM | HIGH |
| TF-PRIV-003 Weight | 0.8 | 2.0 |
| TF-PRIV-004 Title | "Parental Consent for Minors" | "Consent Withdrawal Ease" |
| TF-PRIV-004 Severity | CRITICAL | HIGH |
| TF-SEC-001 Legal ref | "Section 8(5)" | Section 8(3) |
| TF-SEC-002 Legal ref | "Section 8(5)" | Section 8(3) |
| TF-SEC-003 Legal ref | "Section 8(5)" | Section 8(4) |
| TF-SEC-004 Legal ref | "Section 8(6)" | Section 4 |
| TF-GOV-001 Legal ref | "Section 10(2)(a)" | Section 8(7) |
| TF-LIFE-001 Legal ref | "Section 8(7)(a)" | Section 8(5) |
| Weight range | "0.6–1.0" | 1.0, 1.5, 2.0 |
| TF-LIFE-002 Title | "Data Processing Agreements" | "Data Erasure Process" |
| TF-LIFE-002 Legal ref | "Section 8(2)" | Section 12(d) |
| TF-RIGHTS-004 Title | "Right of Nomination" | "Rights Request Process Availability" |
| TF-RIGHTS-004 Legal ref | "Section 14" | Section 5(b) |

**The actual code (`controls.py`) is the canonical authority. This document is derived from the code.**

---

## Research Integrity Notes

1. **HTTPS/HSTS/CSP/Cookie checks** are classified as `TECHNICAL_INDICATOR` — they represent observable security posture signals that support Section 8(3)'s "reasonable security safeguards" obligation. The DPDP Act does not expressly mandate these specific protocols by name.

2. **Data minimisation** (TF-LIFE-003) is an `INFERRED` obligation from Section 4's lawful purpose requirement. The DPDP Act 2023 does not contain an explicit data minimisation provision.

3. **Pre-consent tracker loading** (TF-SEC-004) is `INFERRED` from the Section 4 lawful basis requirement, not expressly addressed in the Act.

4. All `DIRECT` mappings reference obligations expressly stated in the mapped section.

5. TrustForge assessments are **readiness signals**, not legal compliance certifications. TIE evaluation outputs must not be presented as authoritative legal determinations.
