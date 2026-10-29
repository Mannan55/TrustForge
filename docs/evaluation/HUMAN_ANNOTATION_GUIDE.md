# TrustForge — Independent Human Legal Annotation Protocol (DPDP Act, 2023)

## 1. Study Purpose & Academic Context
This document defines the formal double-blind annotation protocol for evaluating foundation models on Digital Personal Data Protection Act, 2023 (DPDP) compliance assessments, adhering to Section 4.2.3 of Dr. Neelam Naik's research methodology.

## 2. Reviewer Roles & Independent Participation
To establish genuine empirical ground truth, reviews must be conducted independently by qualified human practitioners without prior exposure to model predictions:
- **Reviewer 1 (`ANN_LEGAL_01`):** Legal Practitioner, Advocate, or Regulatory Specialist in Indian IT/Data Protection Law.
- **Reviewer 2 (`ANN_AUDIT_02`):** Certified Information Privacy Professional (CIPP/A or equivalent) or ISO 27701 Lead Auditor.
- **Adjudicator (`ADJ_SUPERVISOR_01`):** Senior Data Protection Counsel or Faculty Research Supervisor.

## 3. Standardized Verdict Vocabulary
Annotators must assign exactly one of the six canonical DPDP compliance states:
1. `SUPPORTED`: Clear affirmative evidence demonstrates full compliance with statutory mandate.
2. `PARTIALLY_SUPPORTED`: Evidence satisfies some statutory requirements but omits critical sub-provisions.
3. `NOT_SUPPORTED`: Evidence directly demonstrates non-compliance or statutory violation.
4. `INSUFFICIENT_EVIDENCE`: Available captured evidence is ambiguous or incomplete to establish compliance.
5. `NOT_APPLICABLE`: The statutory obligation does not apply to the entity's processing activities.
6. `NOT_DETERMINABLE`: Reserved for evaluation when statutory citations or evidence are unverified.

## 4. Double-Blind Workflow
1. Annotators 1 and 2 independently complete `HUMAN_ANNOTATION_WORKBOOK.csv` without consulting each other.
2. Software imports the two sets of completed verdicts and computes Cohen's kappa ($\kappa$).
3. Any case where Annotator 1 verdict $\ne$ Annotator 2 verdict is automatically flagged as `DUAL_ANNOTATED_DISPUTED`.
4. Disputed cases are presented to the Senior Adjudicator (`ADJ_SUPERVISOR_01`) for final statutory resolution.
5. Only after formal completion and sign-off can the resulting dataset be designated as `VERIFIED_HUMAN_GROUND_TRUTH`.

## 5. Current Dataset Status Disclosure
As of Phase 6.1 (October 2026), the active benchmark dataset (`canonicalEvaluationDataset`) is classified as **`PROVISIONAL_RESEARCH_FIXTURE`**. The reference annotations represent calibrated research baseline fixtures developed for computational benchmarking and software verification. They do not constitute independent double-blind human reviews. Formal external human reviews remain pending until this workbook is executed.

