# TrustForge — Faculty Demonstration Guide & Step-by-Step Script

**Demonstration Audience:** Faculty Evaluation Committee  
**Target Duration:** 10–15 Minutes  
**Demonstration Mode:** Live Interactive System Walkthrough  
**System Location:** `http://localhost:5173` (Frontend) & `http://127.0.0.1:8000` (Backend API)  

---

## Pre-Demonstration Quick Start

Ensure the two required services are running in separate terminals:

```powershell
# Terminal 1: Python Embedding Daemon (Port 8008)
cd "C:\TF new V1\TrustForge"
python scripts/embedding_server.py

# Terminal 2: Node.js Express Backend (Port 8000)
cd "C:\TF new V1\TrustForge\api"
npm run dev

# Terminal 3: Vite React Frontend (Port 5173)
cd "C:\TF new V1\TrustForge\TrustForge Frontend"
npm run dev
```

---

## Demonstration Script & Talking Points

### Step 1: Login & Tenant Security
1. Open browser to `http://localhost:5173/`.
2. Click **Sign In** and authenticate as an organization tenant (e.g. `Technova Healthcare` / `org_technova`).
3. **Faculty Talking Point:** Point out that all subsequent actions are tenant-isolated. Demonstrate that attempting to query another organization's assessment returns HTTP 403 Forbidden with `CROSS_ORGANISATION_ACCESS_DENIED`.

### Step 2: Website Crawling & Public Artifact Capture
1. Navigate to **New Assessment**.
2. Enter target domain: `https://example.com` (or enterprise domain).
3. Click **Start Assessment**.
4. **Faculty Talking Point:** Explain the Playwright headless crawler pipeline. It checks `robots.txt` compliance, extracts cookie banners, privacy policy text, and header metadata, normalizing them into 8 automated evidence checks.

### Step 3: Hybrid Statutory RAG
1. Observe the live assessment progress bar advancing from 10% to 50%.
2. **Faculty Talking Point:** Highlight the 83-chunk authoritative legal corpus (DPDP Act 2023 + DPDP Rules 2025). Explain the Reciprocal Rank Fusion ($k=60$) combining BM25 statutory lexical matching with 384d `pgvector` dense embeddings. Show that marginal-note penalty bleeding (Section 40/44) was fixed with non-normative dampening and token boosting.

### Step 4: True Parallel 10-LLM Orchestration
1. Watch the terminal or dashboard as all 10 model slots are processed concurrently.
2. **Faculty Talking Point:** Show that rather than a sequential loop, models are concurrently dispatched via `Promise.allSettled`. M01, M02, and M03 execute simultaneously on Groq LPUs in under 7 seconds (achieving 2.48x speedup). Highlight that models M04–M09 honestly display `AUTH_REQUIRED` and M10 displays `UNAVAILABLE` without fake synthetic numbers.

### Step 5: Grounding Validation & Per-Model Scoring
1. Observe findings generation across the 6 compliance pillars (Privacy Architecture, Security Safeguards, Transparency & Notice, Governance, Lifecycle, Principal Rights).
2. **Faculty Talking Point:** The Grounding Validator verifies that every finding references authoritative statutory sections. Each active model receives an independent Trust Score ($[0, 100]$).

### Step 6: Top-3 Consensus & Transparent Score Selection
1. Review the final Trust Score banner (e.g. `33.5 / 100 — Critical Posture`).
2. **Faculty Talking Point:** Explain the Top-3 Majority Voting Consensus. Single-model hallucination or conservative bias is mitigated by aggregating verdicts across M03, M02, and M01.

### Step 7: Executive Report & Native PDF Export
1. Click **Export PDF Report**.
2. Save and open the generated PDF (`TrustForge_Executive_Assessment_Report.pdf`).
3. **Faculty Talking Point:** Show that the PDF is natively generated with valid `%PDF-` structure, containing executive summaries, pillar breakdowns, high-priority statutory gaps, and structured remediation timelines.

### Step 8: Database Persistence Proof
1. Open Supabase Dashboard (`bnpxutwmdqsoyefppwpl.supabase.co`).
2. Show the newly created records in the `assessments`, `findings`, and `benchmark_runs` tables.
3. Show that restarting the Express server allows instant retrieval of the assessment without state loss.
