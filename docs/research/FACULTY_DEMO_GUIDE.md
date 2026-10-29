# TRUSTFORGE — FACULTY RESEARCH DEMONSTRATION GUIDE

**Academic Project:** TrustForge — Evidence-Grounded DPDP Compliance Assessment & 10-LLM Benchmarking Platform  
**Target Audience:** Faculty Research Supervisor (Neelam Ma'am) & External Evaluators  
**Date:** October 2026  
**Document Version:** 1.0  

---

## 1. DEMO OVERVIEW & RESEARCH SIGNIFICANCE

TrustForge transforms digital privacy compliance assessment from subjective questionnaire self-reporting into an **evidence-grounded, statistically verifiable engineering discipline**. 

The demonstration presents a complete live workflow:
1. Crawling a target website using **Playwright headless automation** with strict SSRF defense.
2. Normalizing captured technical signals into **tamper-evident evidence records**.
3. Performing dense semantic retrieval across the official **83-chunk DPDP statutory knowledge corpus** (DPDP Act 2023 & Notified DPDP Rules 2025).
4. Evaluating **ten candidate foundation models** (M01 through M10) under identical prompts, statutory context, and evaluation rubrics.
5. Executing **independent grounding and hallucination validation** to verify cited sections and verbatim Gazette quotations.
6. Aggregating consensus verdicts via **Top-Three Majority Voting** and calculating deterministic Trust Scores.
7. Generating an **evidence-backed, publication-grade PDF compliance report**.

---

## 2. PREREQUISITES & ENVIRONMENT SETUP

### System Requirements:
- **Node.js:** v20+ or v24+ (tested on Node.js v24.14.1)
- **Python:** v3.11+ or v3.13+ (tested on Python 3.13)
- **Browsers:** Playwright Chromium headless shell (installed via `npx playwright install chromium`)

### Environment Variables Template:

#### Backend (`TrustForge/api/.env`):
```bash
# Server Port
PORT=8000
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# High-Speed Free Tier LLM Provider (Groq LPUs)
GROQ_API_KEY=gsk_...

# Multi-Model OpenRouter Unified Gateway (GPT-OSS, Gemma, Mistral, DeepSeek)
OPENROUTER_API_KEY=sk-or-v1-...

# Indian Sovereign Models (Sarvam AI)
SARVAM_API_KEY=sarvam_...

# Supabase PostgreSQL Cloud Persistence (Optional for local hybrid demo)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-key
```

#### Frontend (`TrustForge/TrustForge Frontend/.env`):
```bash
VITE_API_BASE_URL=http://127.0.0.1:8000
```

---

## 3. HOW TO LAUNCH THE PLATFORM

Open two terminal windows:

### Terminal 1 — Start the Node.js / Express API Backend:
```powershell
cd "C:\TF new V1\TrustForge\api"
npm run dev
```
*Expected terminal output:*
```
TrustForge Express Research Backend running on port 8000
Health check: http://127.0.0.1:8000/api/health
10-Model Benchmark: http://127.0.0.1:8000/api/benchmark/models
```

### Terminal 2 — Start the React / Vite Frontend:
```powershell
cd "C:\TF new V1\TrustForge\TrustForge Frontend"
npm run dev
```
*Expected terminal output:*
```
VITE v8.2.2  ready in 250 ms
➜  Local:   http://localhost:5173/
```

---

## 4. STEP-BY-STEP FACULTY DEMONSTRATION SCRIPT

### Step 1: Open TrustForge Dashboard
1. Open Google Chrome and navigate to `http://localhost:5173/` (or `/dashboard`).
2. Point out the clean, professional **Navy and Beige** research design system conforming to the supervisor's specifications.

### Step 2: Live Website Scan with Playwright
1. In the sidebar, click on **Website Scan** (`/website-scan`).
2. Enter the demonstration URL (e.g., `https://meity.gov.in` or an authorized enterprise test site).
3. Click **Start Scan**.
4. **Point out to supervisor:**
   - The scanner is not a static mockup: it launches a real **Playwright headless browser session**.
   - Show network inspection detecting third-party tracker domains.
   - Show automated detection of Consent Management Platforms (CMP) and cookie attributes (`Secure`, `HttpOnly`).
   - Highlight the **SSRF guard** that protects internal university and cloud infrastructure by blocking private IP ranges (`10.0.0.0/8`, `127.0.0.0/8`, metadata endpoints).

### Step 3: Authoritative DPDP RAG Retrieval
1. Navigate to **Assessment** (`/assessment`).
2. Complete wizard steps (Notice Languages, Processing Purposes, Breach Notification Procedure, Data Protection Officer contact details).
3. Click **Run Analysis**.
4. **Point out to supervisor:**
   - The RAG engine does not rely on abridged summaries; it retrieves from the **authoritative 83-chunk statutory corpus** compiled from official Indian Government Gazettes.
   - Show how Section 5 (Notice), Section 6 (Consent), and Section 8 (Security Safeguards) are retrieved with full Gazette metadata and SHA-256 hashes.

### Step 4: The 10-LLM Benchmark Dashboard
1. In the sidebar, click on **10-LLM Benchmark** (`/benchmark`).
2. **Key research highlights to explain to supervisor:**
   - Display the **10 candidate foundation models** (M01: GPT-OSS-120B, M02: GPT-OSS-20B, M03: Qwen 3.8 27B, M04: Gemma 4 31B-IT, M05: Gemma 4 26B-A4B, M06: Llama 3.3 70B, M07: Mistral Small 24B, M08: DeepSeek V4.1 Flash, M09: Sarvam-105B Reasoning, M10: Sarvam-30B Efficient).
   - Show the **Empirical Comparative Matrix** displaying Trust Scores, Accuracy, Macro F1, Grounding Rates, and Inference Latencies.
   - Highlight the domestic Indian models (**Sarvam-105B** and **Sarvam-30B**) trained on Indian languages and legal statutes under the IndiaAI mission.

### Step 5: Independent Grounding & Hallucination Filter
1. Select any individual model in the comparison table.
2. Explain the **Grounding Validator**:
   - Deterministically verifies whether cited statutory provisions actually exist in the Gazette.
   - Performs verbatim substring matching to prevent LLMs from fabricating or misquoting legal provisions.
   - Enforces statutory skepticism: self-reported questionnaire claims lacking verifiable technical evidence are strictly classified as `INSUFFICIENT_EVIDENCE` rather than false passes.

### Step 6: Top-Three Majority Voting Consensus
1. Point to the top consensus banner: **Consensus Trust Score: 80.5 / 100 (Strong Alignment)**.
2. Explain the voting methodology:
   - Evaluates the top 3 ranked models (e.g., Llama 3.3 70B, Qwen 3.8 27B, Mistral Small 24B).
   - Computes consensus verdicts at the individual control level (`mode`).
   - Resolves ties with conservative postures to prevent unjustified compliance inflation.
   - Recomputes the final Trust Score from the consensus findings.

### Step 7: Export Evidence-Backed PDF Compliance Report
1. Click the **Export PDF Report** button.
2. Open the downloaded PDF:
   - Show the official TrustForge letterhead and metadata block.
   - Review the Trust Score and Pillar Performance breakdown table.
   - Review the verbatim DPDP citations and specific remediation recommendations.
   - Point out the **Mandatory Academic Legal Disclaimer** explaining that automated public website scanning is an observational tool, not a formal legal certification.

---

## 5. TROUBLESHOOTING & KNOWN LIMITATIONS

| Symptom | Cause | Resolution |
|---|---|---|
| Scan returns "Blocked Destination" | Target URL resolves to localhost or private IP | The SSRF guard intentionally blocks internal addresses. Test against a public domain. |
| Model shows "AVAILABLE_WITH_LIMITATIONS" | Cloud API key for that specific model family is not supplied in `.env` | Expected research behavior: platform gracefully operates with active models (Groq/OpenRouter) and transparently marks unconfigured models without fabricating responses. |
| PDF download delayed | PDFKit streaming buffer | Generated within 1–2 seconds. Ensure Express backend is running. |

---
*Prepared for Faculty Review and Evaluation.*
