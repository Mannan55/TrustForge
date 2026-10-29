# TrustForge Faculty Benchmark Demonstration Guide
**Project:** TrustForge Research Platform  
**Research Paper:** *An Evidence-Grounded RAG Framework for Digital Personal Data Protection Compliance Assessment*  
**Supervisor / Faculty Demonstration Walkthrough**  
**Date:** October 2026

---

## 1. Quick Launch (Running the System)

Open two PowerShell windows:

### Terminal 1: Backend Express Server
```powershell
cd "c:\TF new V1\TrustForge\api"
npm run dev
# Server listening on http://127.0.0.1:8000
```

### Terminal 2: Frontend Vite Development Server
```powershell
cd "c:\TF new V1\TrustForge\TrustForge Frontend"
npm run dev
# Application active at http://localhost:5173
```

---

## 2. 5-Minute Faculty Demonstration Sequence

### Step 1: Open the Application in Chrome
Navigate to `http://localhost:5173`.
1. The landing page demonstrates the **TrustForge branding and DPDP Act 2023 / Rules 2025 jurisdiction**.
2. Click **"Sign In"** and log in with your credentials (or test credentials `admin@trustforge.ai` / `password123`).

### Step 2: Show Authenticated Assessment with 10-Model Pipeline
1. Click **"New Assessment"** in the sidebar.
2. Complete the technical questionnaire (e.g., target `https://technova-fintech.in`, select processing purposes, notice languages, rights workflows).
3. Click **"Submit Assessment"**.
4. Observe the progress bar advance through:
   - *Crawling website and capturing technical evidence* (0% → 30%)
   - *Freezing RAG legal context snapshot* (`b9cec843...`, 83 chunks)
   - *Dispatching 10 candidate models across LLM gateway* (60%)
   - *Calculating deterministic Trust Score & consensus* (90% → 100%)
5. The assessment reaches 100% without getting stuck, navigating directly to the Trust Score page!

### Step 3: Inspect the 10-LLM Comparative Benchmark Dashboard
1. Click **"10-LLM Benchmark"** (`/benchmark`) in the left navigation sidebar.
2. **Review the Top-3 Majority Voting Consensus Banner**:
   - Demonstrates how outlier hallucinations are neutralized by voting across top-ranked verified models (`M03`, `M01`, `M02`).
3. **Review the 10-Model Empirical Matrix**:
   - Shows all 10 faculty-mandated models (M01 to M10).
   - Shows **M01, M02, M03** marked as **"Verified Active"** with real latency, real Trust Scores, and real Macro F1 scores.
   - Shows **M04–M10** honestly marked as **"Requires Key"** / **"Unavailable"** (Gate J transparency notice).
4. Click on any model row to open the detailed architectural breakdown and grounding adherence notes.

### Step 4: Test Scientific Exports
1. Click **"CSV"**: Downloads `TrustForge_10LLM_Benchmark_Matrix_<timestamp>.csv` containing machine-readable metrics for publication tables.
2. Click **"Export PDF Report"**: Downloads a formal multi-page compliance assessment report generated on the backend.
3. Click **"Re-Run 10-LLM Benchmark"**: Watch the live spinning indicator trigger `POST /api/benchmark/run`, evaluate all candidate models in real time, and dynamically update the benchmark view.

---

## 3. Terminal Verification Commands for Supervisors

The supervisor can run automated test scripts directly from the terminal to verify zero fabrication:

### Command A: Verify Live Groq Inference & Token Optimization (Sub-15s)
```powershell
cd "c:\TF new V1\TrustForge\api"
npx tsx test_20_controls_live.ts
```
*Expected Output:* Shows M01, M02, and M03 returning 20 verified findings on Groq LPUs without exceeding TPM limits.

### Command B: Verify Full System Integration, RAG Snapshots, Scoring & PDF Generation
```powershell
cd "c:\TF new V1\TrustForge\api"
npx tsx test_e2e_assessment.ts
```
*Expected Output:*
```
>>> ALL VERIFICATION TESTS (AUTHENTICATED + RESTART + FREE SCAN) PASSED! <<<
```

---

## 4. Addressing Common Faculty Inquiries

**Q: "Did you substitute different models for the 10 requested?"**  
*Answer:* No. The 10 candidate models strictly match the faculty's candidate list: M01 (GPT-OSS-120B), M02 (GPT-OSS-20B), M03 (Qwen 3.8 27B), M04 (Gemma 4 31B), M05 (Gemma 4 26B), M06 (Llama 3.3 70B), M07 (Mistral Small 24B), M08 (DeepSeek V4.1), M09 (Sarvam-105B), and M10 (Sarvam-30B).

**Q: "Why are some models marked Requires Key instead of completed?"**  
*Answer:* Under the strict zero-cost constraint and scientific research ethics guidelines, TrustForge refuses to fabricate simulated scores or disguise rule-based fallbacks as model outputs. Groq provides legitimate free-tier access for M01, M02, and M03. OpenRouter and Sarvam models require funded account credits. The gateway is fully implemented to run all 10 models the moment API credentials are provided.

**Q: "How does RAG prevent hallucinations?"**  
*Answer:* For every control, the system retrieves official statutory text from an 83-chunk Gazette corpus, creates a frozen SHA-256 snapshot (`b9cec843...`), passes it to each model, and independently validates citations using `GroundingValidator`.
