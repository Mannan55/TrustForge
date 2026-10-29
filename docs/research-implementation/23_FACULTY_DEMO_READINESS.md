# 23. TrustForge Faculty Demonstration Readiness Runbook

**Project:** TrustForge — Evidence-Grounded RAG Framework for DPDP Compliance Assessment  
**Faculty Supervisor:** Dr. Neelam Naik  
**Author:** TrustForge Engineering Team  
**Date:** 2026-10-29  
**Verified Assessment Reference:** `ASM_1793274039527_gf80n`  
**Repository Branch:** `repair/audit-remediation-2026-10-29`  

---

## 1. Quick Launch Instructions (Under 60 Seconds)

### Step 1: Start Express API Backend (Port 8000)
```powershell
cd "C:\TF new V1\TrustForge"
node api/dist/index.js
```
*Health Check:* `http://127.0.0.1:8000/api/health` $\to$ `{"status":"healthy"}`

### Step 2: Start Vite Frontend (Port 5173)
```powershell
cd "C:\TF new V1\TrustForge"
npx --prefix "TrustForge Frontend" vite "TrustForge Frontend" --host 127.0.0.1 --port 5173
```
*App URL:* `http://127.0.0.1:5173`

---

## 2. 15-Minute Faculty Demonstration Walkthrough

### Act 1: Public Landing & Anonymous Scanner (Minutes 0–3)
1. Open `http://127.0.0.1:5173/`.
2. Inspect the SSRF-protected website scan bar.
3. Enter `https://technova.in` and click **Run Public Scan**.
4. Observe real-time checks: TLS encryption, HSTS header, Cookie security attributes, Third-party analytics trackers, and Privacy Policy discovery.
5. Emphasize to the supervisor: The scanner operates on **pure external observations** without fabricating operational compliance.

### Act 2: Authenticated Sign-In & Multi-Tenant Isolation (Minutes 3–5)
1. Navigate to `/login`.
2. Sign in with standard research credentials:
   - **Email:** `rajesh@technova.in`
   - **Password:** `DemoPassword123!`
3. Show the supervisor that the backend generates a cryptographically signed HMAC-SHA256 bearer token (`tf_tok_...`) with automatic 24-hour expiration.
4. Show that header spoofing (`x-org-id`) is rejected with HTTP 401/403.

### Act 3: Guided Compliance Assessment & Native Evidence Upload (Minutes 5–9)
1. Click **New Assessment** (`/assessment`).
2. Configure company practices:
   - Personal Data Collections: *Name, Contact Phone, Financial Card details, Location*.
   - Processing Purposes: *Service delivery, Targeted marketing, Customer support*.
   - Security Safeguards: Enable encryption at rest and incident response breach plan.
3. **Upload Real Evidence Document:**
   - Attach `data_retention_policy_2026.txt` (or any policy `.pdf`/`.txt`).
   - Observe native Express upload: binary stored in `data/uploads/`, SHA-256 computed (`e8750800...`), registered as `DOCUMENT_UPLOAD` evidence item.
   - Click **Download Document** to prove round-trip binary durability.
4. Submit the assessment.

### Act 4: Live 10-Stage RAG Monitor & Retrieval Explorer (Minutes 9–12)
1. Open the **Live RAG Framework Monitor** (`/rag-monitor`).
2. Demonstrate the 10 sequential execution stages:
   - **Stage 1 (Evidence Extraction):** Extracted evidence items from wizard + uploaded documents.
   - **Stage 2 (Statutory Corpus):** 83 chunks with verified SHA-256 hash `c79c0fb3eb811e69...`.
   - **Stage 3 & 4 (Hybrid Retrieval):** Okapi BM25 keyword matching + pgvector dense retrieval.
   - **Stage 5 (Reciprocal Rank Fusion):** $RRF(d) = \sum \frac{1}{60 + \text{rank}_i}$.
   - **Stage 6 & 7 (Top-5 Selection & Frozen Snapshot):** Confined context snapshot hash ensuring bit-for-bit identical input across models.
   - **Stage 8 & 9 (LLM Assessment & Grounding Validator):** Strict grounding enforcement converting ungrounded claims into `NOT_DETERMINABLE`.
   - **Stage 10 (Research Trust Score):** Penalty-proportional W1 weighting and critical caps.

### Act 5: Model Benchmark, TOPSIS & Authentic PDF Export (Minutes 12–15)
1. Navigate to **Model Benchmark** (`/benchmark`).
2. Review the verified model slots (M01, M02, M03, M04, M08, M09 verified live; M05 rate-limited; M06/M07 demonstration credits blocked; M10 local offline).
3. Demonstrate **TOPSIS Multi-Criteria Decision Making**:
   - Compare W1, Equal, Cost-Sensitive, and Accuracy-First weight profiles.
   - Observe rank stability and sensitivity analysis.
4. Navigate to **Reports** (`/reports`) and click **Export PDF Report**.
   - Show the supervisor the authentic publication-ready PDF.
   - Confirm: Trust Score, Evidence Coverage, and Evaluated Models list match persisted database records bit-for-bit with zero fabricated fallback scores.

---

## 3. Disclosed Limitations & Integrity Notes

1. **Model Slots M06 & M07:** Gated by OpenRouter paid credits; marked as demonstration fixtures until further credit budget is granted.
2. **Model Slot M05:** Gated by OpenRouter free endpoint rate limits (HTTP 429).
3. **Model Slot M10:** Requires local Ollama service running on the host machine.
4. **GSTIN Registry Lookup:** Format is CBIC validated; direct automated real-time GSTN lookups require production GST portal API credentials.
