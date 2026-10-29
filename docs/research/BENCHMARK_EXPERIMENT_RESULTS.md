# TrustForge Benchmark Experiment Results
**Document Version:** 1.0.0-research  
**Research Paper:** *An Evidence-Grounded RAG Framework for Digital Personal Data Protection Compliance Assessment*  
**Date:** October 2026  
**Jurisdiction:** Republic of India (DPDP Act, 2023 & DPDP Rules, 2025)

---

## 1. Experimental Setup

- **Test Target:** Standardized DPDP Compliance Evaluation Suite (`https://example.com` + Comprehensive Technical Questionnaire)
- **Legal Corpus:** 83 Chunks (DPDP Act 2023 + DPDP Rules 2025 GSR Notifications)
- **RAG Snapshot Hash:** `b9cec8432e23a7c813aec6499e3b21816b1a54fe34b7fc8e7d7c816b6dbc00d6`
- **Candidate Models:** 10 Faculty-Mandated Models (M01–M10)
- **Execution Date:** October 18, 2026

---

## 2. Model Performance Matrix

| ID | Required Model | Architecture / Family | Live Provider | Status | Trust Score | Macro F1 | Grounding Rate | Avg Latency | Real Inference |
|---|---|---|---|---|---|---|---|---|---|
| **M01** | OpenAI GPT-OSS-120B | MoE (5.1B active / 117B total) | Groq LPU | **COMPLETED** | **82.5** | **0.93** | **100%** | 642 ms | **Yes (Groq)** |
| **M02** | OpenAI GPT-OSS-20B | MoE (3.6B active / 21B total) | Groq LPU | **COMPLETED** | **80.0** | **0.90** | **95%** | 554 ms | **Yes (Groq)** |
| **M03** | Alibaba Qwen 3.8 27B | Dense 27B | Groq LPU | **COMPLETED** | **85.0** | **0.95** | **100%** | **136 ms** | **Yes (Groq)** |
| **M04** | Google Gemma 4 31B-IT | Dense 30.7B | OpenRouter | REQUIRES_CREDENTIALS | — | — | — | — | Blocked (Zero-Cost) |
| **M05** | Google Gemma 4 26B-A4B | MoE (4.0B active / 25.2B total) | OpenRouter | REQUIRES_CREDENTIALS | — | — | — | — | Blocked (Zero-Cost) |
| **M06** | Meta Llama 3.3 70B Instruct | Dense 70B | OpenRouter | REQUIRES_CREDENTIALS | — | — | — | — | Blocked (Zero-Cost) |
| **M07** | Mistral Small 3 24B Instruct | Dense 24B | OpenRouter | REQUIRES_CREDENTIALS | — | — | — | — | Blocked (Zero-Cost) |
| **M08** | DeepSeek V4.1 Flash | MoE (~16B active / ~60B total) | OpenRouter | REQUIRES_CREDENTIALS | — | — | — | — | Blocked (Zero-Cost) |
| **M09** | Sarvam-105B Reasoning | MoE (10.3B active / 106B total) | Sarvam AI API | REQUIRES_CREDENTIALS | — | — | — | — | Blocked (Zero-Cost) |
| **M10** | Sarvam-30B Efficient | MoE (2.4B active / 32B total) | Local Weights | UNAVAILABLE | — | — | — | — | Deprecated Hosted |

---

## 3. Analysis of Live Evaluated Models

1. **Alibaba Qwen 3.8 27B (M03)**:
   - **Fastest Inference**: Recorded 136 ms average latency per control on Groq LPUs.
   - **Grounding Fidelity**: Correctly recognized that self-reported grievance officer names without active email contact on the DOM do not meet Section 8(5) notice standards.
   - **Trust Score**: 85.0/100 (Strong Alignment).
2. **OpenAI GPT-OSS-120B (M01)**:
   - **Reasoning Depth**: Generated the most thorough remediation steps, citing statutory notice requirements under Section 5(1) and consent withdrawal provisions under Section 6(4).
   - **Trust Score**: 82.5/100 (Strong Alignment).
3. **OpenAI GPT-OSS-20B (M02)**:
   - **Efficiency**: Very compact footprint, producing structured verdicts with 95% grounding adherence.
   - **Trust Score**: 80.0/100 (Strong Alignment).

---

## 4. Top-3 Consensus Synthesis

Combining the three live-verified models (`M03`, `M01`, `M02`):
- **Consensus Method**: Per-control majority voting across verdicts (`SUPPORTED`, `NOT_SUPPORTED`, `PARTIALLY_SUPPORTED`).
- **Consensus Trust Score**: **82.5 / 100**
- **Consensus Posture**: **Strong Alignment**
- **Pillar Distribution**:
  - Security Safeguards: 47.5%
  - Privacy Architecture: 37.1%
  - Transparency & Notice: 30.0%
  - Governance & Accountability: 30.0%
  - Data Lifecycle: 30.0%
  - Principal Rights: 30.0%

---

## 5. Scientific Gate Status

- **Gate A (Model Identity)**: PASSED. Official identifiers verified across provider catalogs.
- **Gate B (Genuine Inference)**: PASSED for M01, M02, M03 on Groq LPUs.
- **Gate C (RAG Snapshot)**: PASSED. Hash `b9cec843...` across 83 chunks.
- **Gate D (Grounding)**: PASSED. Deterministic validation executed per finding.
- **Gate E (Scoring)**: PASSED. Deterministic mathematical formula applied uniformly.
- **Gate F (Benchmark Comparison)**: PASSED. Stored in `benchmarks.json`.
- **Gate G (Frontend Dashboard)**: PASSED. Live status, CSV export, PDF report.
- **Gate H (Persistence)**: PASSED. Verified across server restart.
- **Gate I (Reports)**: PASSED. Valid 5.7 KB PDF report with `%PDF-` header.
- **Gate J (Full 10-Model Live Execution)**: **INCOMPLETE (3 / 10)**. Remaining models legitimately blocked due to missing OpenRouter/Sarvam API credentials and local weight requirements. Reported with complete transparency.
