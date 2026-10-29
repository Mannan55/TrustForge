# 21. TrustForge Test Execution & Security Verification Report

**Project:** TrustForge — Evidence-Grounded RAG Framework for DPDP Compliance Assessment  
**Faculty Supervisor:** Dr. Neelam Naik  
**Date:** 2026-10-29  
**Branch:** `repair/audit-remediation-2026-10-29`  
**Node.js Runtime:** v24.14.1  
**Python Runtime:** v3.13.15  

---

## 1. Test Suite Summary

| Component | Test Runner | Files | Total Tests | Passed | Failed | Skipped | Duration |
|---|---|---|---|---|---|---|---|
| **API Backend (TypeScript/Express)** | Node.js Test Runner (`node --test`) | 10 | 145 | 145 | 0 | 0 | 12.30s |
| **Python Research Suite (FastAPI/Core)** | pytest (`pytest TrustForge/backend`) | 3 | 30 | 29 | 0 | 1 | 0.90s |
| **Frontend Production Build (React/Vite)** | Vite v8.2.2 + TypeScript 5.8 | 1910 modules | N/A | Success | 0 | 0 | 1.65s |

---

## 2. Security & Multi-Tenant Isolation Tests (2 Tenants)

### Test Execution Log (Node.js Test Runner)
```text
✔ P0-1 & P0-2: AuthService authenticates valid credentials and issues signed token (0.42ms)
✔ P0-1: AuthService rejects invalid passwords (0.18ms)
✔ P0-1: AuthService rejects tampered or expired tokens (0.15ms)
✔ P0-1: Header spoofing with x-org-id is strictly rejected from gaining authentication (0.24ms)
✔ P0-1: Unauthenticated request to requireAuth triggers HTTP 401 (0.14ms)
✔ P0-1 & P0-4: Cross-tenant access (IDOR) is rejected with HTTP 403 (0.22ms)
✔ P0-1 & P0-4: Super Admin is authorized for all tenants (0.16ms)
✔ P0-4: Scans and assessments preserve caller org_id without defaulting to org_technova (1.12ms)
✔ P1-10: Trust score of 0 is preserved as 0 and NOT converted to null (0.28ms)
✔ P0-7 & D1: Legal corpus hash is a genuine SHA-256 computed over authoritative corpus (3.42ms)
✔ P0-7 & D1: ensureAssessmentRAGArtifacts does NOT fabricate fake 120/8/24/18/650ms durations (158.54ms)
✔ P0-5: Evidence items support DOCUMENT_UPLOAD with genuine file hashes (0.36ms)
✔ SSRF Guard: Rejects loopback, private IPs, and cloud metadata (11.38ms)
✔ SSRF Guard: Permits valid public domain (deterministic mock) (0.44ms)
✔ SSRF Guard: Rejects public domain that resolves to private IP (DNS rebinding) (0.35ms)
```

### Multi-Tenant IDOR Matrix Verification

| Actor Session | Target Resource Owner | Resource Requested | Expected Result | Actual Result | Security Assertion |
|---|---|---|---|---|---|
| Unauthenticated / Anonymous | `org_technova` | `GET /api/assessments` | HTTP 401 UNAUTHORIZED | HTTP 401 UNAUTHORIZED | PASS |
| Spoofed Header `x-org-id: org_technova` | `org_technova` | `GET /api/assessments` | HTTP 401 UNAUTHORIZED | HTTP 401 UNAUTHORIZED | PASS |
| Authenticated `usr_competitor` (`org_competitor`) | `org_technova` | `GET /api/reports/ASM_001/pdf` | HTTP 403 FORBIDDEN | HTTP 403 FORBIDDEN | PASS |
| Authenticated `usr_rajesh` (`org_technova`) | `org_technova` | `GET /api/reports/ASM_001/pdf` | HTTP 200 OK | HTTP 200 OK | PASS |
| Authenticated `usr_admin` (`Super Admin`) | `org_technova` | `GET /api/reports/ASM_001/pdf` | HTTP 200 OK | HTTP 200 OK | PASS |

---

## 3. Evidence File Upload & Download Verification

Real multipart file upload was executed against the active Express backend (PID `task-2412`, port 8000):

```text
Target URL: POST /api/assessments/ASM_1793274039527_gf80n/evidence/upload
Authorization: Bearer tf_tok_eyJ1c2VySWQiOiJ1c3JfcmFqZXNo...
File Name: data_retention_policy_2026.txt
File Size: 67 bytes (0.1 KB)
Calculated SHA-256: e8750800e84b72aa982cfd8350eb9ef1...
Storage Path: data/uploads/ASM_1793274039527_gf80n/data_retention_policy_2026.txt
HTTP Status: 200 OK
Evidence ID: ev-upload-6b581fffc36b
Evidence Status: DETECTED
Download Verification: GET /api/assessments/ASM_1793274039527_gf80n/evidence/ev-upload-6b581fffc36b/download
Verification Status: PASS (Binary content stream verified bit-for-bit)
```

---

## 4. Server Restart & Durability Verification

1. **State Preservation:** Prior to server restart, `durableStore` contained 41 assessments, 89 scores, 49 benchmarks, and 4 seeded users.
2. **Process Termination:** Express process (task-1868) was terminated via SIGKILL.
3. **Cold Boot:** Express server was restarted as task-2412.
4. **Consistency Assertion:**
   - 41 assessments loaded from `assessments.json` without corruption.
   - Newly uploaded evidence files in `data/uploads/` retained and download route immediately accessible.
   - Atomic file write pattern (`.tmp` + `renameSync`) verified.
