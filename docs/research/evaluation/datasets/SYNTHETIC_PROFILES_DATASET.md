# TrustForge Synthetic Organization Benchmark Dataset (P1.1)

**File:** `docs/research/evaluation/datasets/synthetic_org_profiles.json`  
**Dataset Version:** 1.0  
**Generated:** 2026-10-09  
**Total Profiles:** 10  
**Evaluated Controls Per Profile:** 20 canonical controls (`TF-PRIV-001` through `TF-RIGHTS-004`)  
**Total Evaluation Units:** 200 control assertions  

---

## 1. Purpose and Provenance

This benchmark provides a fully reproducible, deterministic evaluation suite for the TrustForge Trust Inference Engine (TIE) and Trust Score scoring system.

### Ground-Truth Provenance & Scientific Integrity:
1. **Rule-Justified Independent Ground Truth:** Ground-truth labels (`PASS`, `FAIL`, `POTENTIAL_GAP`, `NOT_APPLICABLE`, `INSUFFICIENT_EVIDENCE`) are derived independently from the explicit statutory criteria of the **Digital Personal Data Protection Act, 2023 (DPDP Act 2023)** and the documented scanner/wizard input states.
2. **Strict Non-Circular Evaluation:** **Labels were NOT derived by running TIE or copying model outputs.** The expected labels were authored prior to model evaluation based on fixed logical rules (e.g., if children's data is never processed, `TF-PRIV-005` is objectively `NOT_APPLICABLE`; if no privacy notice exists, `TF-PRIV-001` is objectively `FAIL`).
3. **Legal Disclaimer:** These labels represent synthetic benchmark criteria designed to test algorithmic compliance classification against statutory rubrics. They **do not constitute formal legal advice** and have not undergone independent certification by a statutory Data Protection Board or licensed advocate.

---

## 2. Organization Profiles Summary

| Org ID | Organization Name | Primary Scenario Archetype | Key Characteristics & Edge Cases |
| :--- | :--- | :--- | :--- |
| `org_001` | FinTech Apex India | Compliant BFSI Enterprise | High baseline compliance across DPDP Section 4–13; named DPO, strong encryption, full consent mechanism. |
| `org_002` | QuickCart E-Commerce | Commercial Retail with Tracking Gaps | Valid consent notice but third-party ad trackers without prior consent notice; no erasure workflow (`TF-LIFE-002` Gap). |
| `org_003` | EduLearn K-12 EdTech | Children's Data Processing Failure | Processes minor data without verifiable parental consent (`TF-PRIV-005` Fail) and engages in targeted tracking (`TF-SEC-004` Fail). |
| `org_004` | HealthPulse Diagnostics | Health Tech / High Sensitivity | Strong consent and retention, but incomplete DPO public notification and legacy transfer agreement issues. |
| `org_005` | BareBones Local Services | Minimal Startup / Non-Compliant | Zero privacy policy, plain HTTP, no grievance officer, unencrypted data collection. Multiple catastrophic failures. |
| `org_006` | CloudSaaS Enterprise | B2B SaaS with High Cross-Border & DPA | Data processor dynamics; international data transfers (Section 16); strict security certifications (ISO 27001). |
| `org_007` | InternalHR Tech Pvt Ltd | Pure Internal/B2B (Exemption Edge Cases) | No public-facing website, no minor processing (`TF-PRIV-005` NOT_APPLICABLE), internal employment processing under legitimate uses. |
| `org_008` | Legacy Logistics Corp | Partial Adoption / Missing Evidence | Mixed evidence profile; wizard completed but zero scanner telemetry available, triggering `INSUFFICIENT_EVIDENCE` across automated controls. |
| `org_009` | AdVenture Media Network | High Behavioral Profiling / Consent Breaches | Aggressive cross-site tracking cookies without opt-in; no verifiable consent notice, vague retention policy. |
| `org_010` | NonProfit Rural Health Trust | Low-Tech Mission-Driven (Exemptions) | Minimal IT infrastructure, processes beneficiary data; relies on localized consent forms; website absent or incomplete. |

---

## 3. Label Distribution in Ground Truth

Across the 200 ground truth control evaluations:
- **PASS:** 88 (44.0%)
- **FAIL:** 46 (23.0%)
- **POTENTIAL_GAP:** 38 (19.0%)
- **NOT_APPLICABLE:** 14 (7.0%)
- **INSUFFICIENT_EVIDENCE:** 14 (7.0%)

This distribution provides rich coverage of edge cases, including:
- Negative examples (direct statutory breaches)
- Ambiguous cases (partial policies triggering `POTENTIAL_GAP`)
- Renormalization triggers (`NOT_APPLICABLE` for non-minor processors and internal fiduciaries)
- Evidence boundary conditions (`INSUFFICIENT_EVIDENCE` when required scanner or assessment data is absent)
