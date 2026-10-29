# 21. TrustForge Test Execution & Security Verification Report

**Project:** TrustForge — Evidence-Grounded RAG Framework for DPDP Compliance Assessment  
**Faculty Supervisor:** Dr. Neelam Naik  
**Date:** 2026-10-29  
**Branch:** `repair/audit-remediation-stage2-2026-10-29`  
**Base Commit:** `45807e6b7c1f7dd11b747119ff9186441019e066`  
**Node.js Runtime:** v24.14.1  
**Python Runtime:** v3.13.15  

---

## 1. Test Suite Summary

| Component | Test Runner | Files | Total Tests | Passed | Failed | Skipped | Duration |
|---|---|---|---|---|---|---|---|
| **API Backend (TypeScript/Express)** | Node.js Test Runner (`node --test`) | 10 | 154 | 154 | 0 | 0 | 12.01s |
| **Python Research Suite (FastAPI/Core)** | pytest (`pytest TrustForge/backend`) | 3 | 30 | 29 | 0 | 1 | 0.86s |
| **Frontend Production Build (React/Vite)** | Vite v8.2.2 + TypeScript 5.8 | 1910 modules | N/A | Success | 0 | 0 | 1.48s |

---

## 2. Stage 2 Remediation & Security Regression Assertions

```text
✔ P0-1 & P0-2: AuthService authenticates valid credentials and issues signed token (6.89ms)
✔ P0-1: AuthService rejects invalid passwords (8.15ms)
✔ P0-1: AuthService rejects tampered or expired tokens (5.42ms)
✔ P0-1: Header spoofing with x-org-id is strictly rejected from gaining authentication (0.34ms)
✔ P0-1: Unauthenticated request to requireAuth triggers HTTP 401 (0.21ms)
✔ P0-1 & P0-4: Cross-tenant access (IDOR) is rejected with HTTP 403 (0.17ms)
✔ P0-1 & P0-4: Super Admin is authorized for all tenants (0.11ms)
✔ P0-4: Scans and assessments preserve caller org_id without defaulting to org_technova (7090.77ms)
✔ P1-10: Trust score of 0 is preserved as 0 and NOT converted to null (55.98ms)
✔ P0-7 & D1: Legal corpus hash is a genuine SHA-256 computed over authoritative corpus (0.49ms)
✔ P0-7 & D1: ensureAssessmentRAGArtifacts does NOT fabricate fake 120/8/24/18/650ms durations (53.75ms)
✔ P0-5: Evidence items support DOCUMENT_UPLOAD with genuine file hashes (0.30ms)
✔ P0-1: Public signup strictly rejects Super Admin escalation and forces Owner (13.02ms)
✔ P0-2: Production mode validates strong AUTH_SECRET and rejects weak/missing secrets (0.30ms)
✔ P0-4: Supabase user lacking active membership receives zero organizational claims (9.23ms)
✔ P0-6: Domain verification creates expiring cryptographic challenge in durable store (1.95ms)
✔ P0-9: Reports return explicit unrecorded/empty values rather than fabricated default models or demo URL (0.18ms)
✔ P1-12: Historical assessments without telemetry remain NOT_RECORDED without current corpus reconstruction (0.18ms)
✔ P1-14: Evidence uploads use unique per-evidence IDs preventing same-name overwrites (0.15ms)
✔ P1-13: Uploaded document text extraction flags binary files as NOT_PARSED (0.13ms)
✔ P1-17: Token verification enforces length equality before timingSafeEqual and respects token revocation (13.74ms)
✔ SSRF Guard: Rejects loopback, private IPs, and cloud metadata (12.05ms)
✔ SSRF Guard: Permits valid public domain (deterministic mock) (0.82ms)
✔ SSRF Guard: Rejects public domain that resolves to private IP (DNS rebinding) (0.37ms)
✔ Trust Score Engine: All-PASS produces 100 score (2.63ms)
✔ Trust Score Engine: All-FAIL produces 0 score (0.43ms)
✔ Trust Score Engine: All NOT_APPLICABLE produces Not Scorable (0.23ms)
✔ Top-3 Majority Voting Consensus (0.83ms)
✔ Grounding Validator: Rejects hallucinated legal clause (10.02ms)
✔ Trust Score Engine: Pillar scores include canonical names, aliases, and evidence coverage (0.57ms)
✔ Research Scoring 1: All compliant produces 100 score (0.49ms)
✔ Research Scoring 2: All non-compliant produces 0 score (0.41ms)
✔ Research Scoring 3: All partial produces 50 score (0.39ms)
✔ Research Scoring 4: All excluded produces NOT_SCORABLE (0.25ms)
✔ Research Scoring 5: Mixed applicable and excluded categories renormalizes weights correctly (1.06ms)
✔ Research Scoring 6: W1 penalty-proportional weighting accuracy (0.57ms)
✔ Research Scoring 7: W2 equal weighting accuracy (0.22ms)
✔ Research Scoring 8: Critical-failure cap on missing HTTPS (0.27ms)
✔ Research Scoring 9: Critical-failure cap on missing privacy notice (0.22ms)
✔ Research Scoring 10: Six-pillar UI compatibility projection (0.24ms)
✔ Research Scoring 11: Unsupported verdicts and failed grounding treated as NOT_DETERMINABLE (0.35ms)
✔ Research Scoring 12: Scoring determinism across 100 identical runs (3.22ms)
```

---

## 3. Multi-Tenant IDOR Matrix Verification

| Actor Session | Target Resource Owner | Resource Requested | Expected Result | Actual Result | Security Assertion |
|---|---|---|---|---|---|
| Unauthenticated / Anonymous | `org_technova` | `GET /api/assessments` | HTTP 401 UNAUTHORIZED | HTTP 401 UNAUTHORIZED | PASS |
| Spoofed Header `x-org-id: org_technova` | `org_technova` | `GET /api/assessments` | HTTP 401 UNAUTHORIZED | HTTP 401 UNAUTHORIZED | PASS |
| Authenticated `usr_competitor` (`org_competitor`) | `org_technova` | `GET /api/reports/ASM_001/pdf` | HTTP 403 FORBIDDEN | HTTP 403 FORBIDDEN | PASS |
| Authenticated `usr_rajesh` (`org_technova`) | `org_technova` | `GET /api/reports/ASM_001/pdf` | HTTP 200 OK | HTTP 200 OK | PASS |
| Authenticated `usr_admin` (`Super Admin`) | `org_technova` | `GET /api/reports/ASM_001/pdf` | HTTP 200 OK | HTTP 200 OK | PASS |
| Public Signup Injection (`role: 'Super Admin'`) | N/A | `POST /api/auth/signup` | HTTP 201 Created (`role: 'Owner'`) | HTTP 201 Created (`role: 'Owner'`) | PASS |
| Revoked Bearer Token | `org_technova` | `GET /api/auth/me` | HTTP 401 UNAUTHORIZED | HTTP 401 UNAUTHORIZED | PASS |
| Unauthenticated Benchmark Trigger | `org_technova` | `POST /api/benchmark/run` | HTTP 401 UNAUTHORIZED | HTTP 401 UNAUTHORIZED | PASS |

---

## 4. Evidence File Upload & Download Integrity Verification

- **Unique Per-Evidence Path:** Files stored at `path.join(UPLOAD_ROOT, targetId, `${evId}_${safeFilename}`)`. Same-name uploads preserve separate binary blobs and hashes.
- **Text Extraction Status:** Plain text `.txt` files extracted for LLM grounding (`text_extraction_status: 'EXTRACTED'`, `participates_in_grounding: true`). Binary files (`.pdf`, `.docx`, images) safely archived without semantic parsing (`text_extraction_status: 'NOT_PARSED'`, `participates_in_grounding: false`).
- **Download Integrity:** Binary content hash verified against recorded SHA-256 hash before streaming.

---

## 5. Persistence & Durability Verification

- 48 assessments loaded from `assessments.json` without corruption.
- Newly uploaded evidence files in `data/uploads/` retained and download route immediately accessible.
- Atomic file write pattern (`.tmp` + `renameSync`) verified with error propagation.
- Revoked tokens persisted to `revoked_tokens.json`.
- Organization profiles persisted to `organizations.json`.
- Domain challenges persisted to `domain_challenges.json`.
