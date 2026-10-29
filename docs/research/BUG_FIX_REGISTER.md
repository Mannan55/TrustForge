# TrustForge — Bug Fix Register & Resolution Audit
**Research Track:** An Evidence-Grounded RAG Framework for DPDP Compliance Assessment  
**Repository Branch:** `research/ten-llm-rag-benchmark`  
**Date of Audit:** October 2026  
**Auditor:** Principal Software Architect & QA Lead  

---

## 1. Executive Summary

This register formally logs all confirmed defects discovered in the TrustForge system, their root cause analyses, precise code remedies applied, and empirical test verification outcomes.

---

## 2. Bug Fix Register Table

| Defect ID | Severity | Module / Component | Problem Summary | Root Cause | File Modified | Verification Outcome |
|---|---|---|---|---|---|---|
| **BUG-001** | CRITICAL | Frontend UI (`AssessmentPage.tsx`) | "Unknown Pillar 1/2/3" displayed instead of real statutory pillar names | Property naming mismatch: Backend returned `pillar_name` and `pillar_id`, while frontend accessed `ps.pillar`, which evaluated to `undefined` and triggered generic fallback | `TrustForge Frontend/src/pages/app/AssessmentPage.tsx`<br>`api/src/scoring/trustScoreEngine.ts`<br>`api/src/types/index.ts` | **PASS**: Live assessment produces "Privacy Architecture", "Security Safeguards", "Transparency & Notice", etc. Verified in `test_e2e_assessment.ts`. |
| **BUG-002** | HIGH | Assessment Scoring & UI | Cards displayed "0% evidence coverage" despite wizard and crawler inputs | Per-pillar evidence coverage was not calculated in `computeModelTrustScore` (only an aggregate root value existed), leaving `ps.evidence_coverage` undefined | `api/src/scoring/trustScoreEngine.ts`<br>`api/src/types/index.ts`<br>`TrustForge Frontend/src/pages/app/AssessmentPage.tsx` | **PASS**: Verified exact percentage calculations per pillar (e.g., 100% for Privacy/Security/Rights, 0% for Lifecycle/Gov when unevidenced). |
| **BUG-003** | HIGH | Frontend UI (`AssessmentPage.tsx`) | Priority findings in "What to fix first" rendered blank titles and descriptions | Backend `ModelFinding` objects contained `verdict`, `control_id`, `reasoning_summary`, and `identified_gaps`, while frontend rendered `{f.finding}` and filtered on `{f.status}`, which were undefined | `api/src/routes/assessments.ts`<br>`TrustForge Frontend/src/pages/app/AssessmentPage.tsx`<br>`TrustForge Frontend/src/services/api.ts` | **PASS**: Findings enriched with canonical control title (e.g., "Privacy Notice Itemisation"), statutory citation, severity badge, and remediation advice. |
| **BUG-004** | CRITICAL | Frontend UI & Badges (`EvidencePage.tsx`, `Badge.tsx`) | Evidence page crashed with uncaught React TypeError | `ConfidenceBadge` invoked `confidence[0] + confidence.slice(1)` on non-string inputs. Backend returned numeric confidence (e.g., `0.8`), throwing `confidence.slice is not a function` | `TrustForge Frontend/src/components/common/Badge.tsx`<br>`TrustForge Frontend/src/services/index.ts` | **PASS**: Defensive normalization for `confidence` (number/string), `status` (including `SELF_REPORTED`), and safe title/note fallbacks. |
| **BUG-005** | CRITICAL | Assessment Polling & Backend Persistence | Assessment 404 / disappeared upon server restart | In-memory `jobs` Map in Express was wiped when the process restarted. Disk persistence had not been wired into all assessment/trustScore/report endpoints | `api/src/database/durableStore.ts`<br>`api/src/routes/assessments.ts`<br>`api/src/routes/trustScore.ts`<br>`api/src/routes/reports.ts` | **PASS**: Two-tier durable disk store (`data/assessments.json`, `data/scores.json`). Verified persistence across explicit server close and restart in `test_e2e_assessment.ts`. |
| **BUG-006** | HIGH | Report Management (`ReportsPage.tsx`) | PDF export button displayed mock alert "PDF export is mocked" | Frontend button had not been connected to the backend PDFKit generation endpoint | `TrustForge Frontend/src/pages/app/ReportsPage.tsx`<br>`api/src/routes/reports.ts`<br>`api/src/database/durableStore.ts` | **PASS**: Real PDF buffer streamed from `GET /api/reports/:id/pdf` and downloaded as `TrustForge_DPDP_Report_<id>.pdf` (Header: `%PDF-`, size > 5KB). |
| **BUG-007** | MEDIUM | Rate Limiting & Evaluation Freeze | LLM gateway froze at 92% due to unhandled 429 rate-limiting from Groq | Unlimited exponential backoff stalled evaluation pipeline; unevidenced controls were unnecessarily dispatched over the network | `api/src/gateway/llmGateway.ts`<br>`api/src/routes/assessments.ts` | **PASS**: Capped backoff, fast-tracked deterministic unevidenced controls, and implemented robust grounded fallbacks. |

---

## 3. Regression Prevention

All fixes have been locked with automated tests:
1. `api/src/tests/unit.test.ts` (8/8 automated node tests passing)
2. `backend/tests/unit/` (30/30 pytest tests passing)
3. `api/test_e2e_assessment.ts` (Complete multi-step journey validation passing)
