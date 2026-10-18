# TRUSTFORGE — TEN-LLM AVAILABILITY & RESEARCH BENCHMARK MATRIX

**Date:** October 18, 2026  
**Document Version:** 1.0  
**Research Paper:** *An Evidence-Grounded RAG Framework for Digital Personal Data Protection Compliance Assessment*  
**Jurisdiction:** India (DPDP Act, 2023 & Notified DPDP Rules, 2025)  
**Evaluation Harness:** TrustForge 10-Model Comparative Compliance Gateway  

---

## 1. RESEARCH CONTEXT & BENCHMARKING ETHICS

The faculty supervisor has mandated an empirical comparison across ten state-of-the-art open-weights and sovereign LLMs for digital personal data protection compliance assessment. 

### Mandatory Research Integrity Principles:
1. **Zero Fabrication:** Never generate synthetic or simulated model responses. Every benchmark datapoint must originate from genuine API calls or verified local inference runs.
2. **Transparent Classification:** A benchmark run with fewer than ten active models is transparently recorded as an *incomplete benchmark suite* rather than substituting synthetic verdicts.
3. **Identical Evaluative Context:** All active models receive strictly identical RAG-retrieved statutory context, identical captured website evidence, identical canonical control definitions, and identical structured output schemas.
4. **Provider Transparency:** Downloadable open weights do not imply zero-cost hosted inference. Provider APIs (Groq, OpenRouter, Mistral, Sarvam, DeepSeek) are documented with exact rate limits, context windows, and credential requirements.

---

## 2. MODEL AVAILABILITY MATRIX SUMMARY

| Model ID | Candidate Identifier | Official Name | Release Date | Architecture | Active / Total Params | Context Window | Primary Provider(s) | Verification Status |
|:---:|---|---|:---:|:---:|:---:|:---:|---|:---:|
| **M01** | `openai/gpt-oss-120b` | OpenAI GPT-OSS-120B | 2025/2026 | Sparse MoE | 5.1B / 117B | 128K | OpenRouter, Hugging Face, Ollama | **AVAILABLE_WITH_LIMITATIONS** |
| **M02** | `openai/gpt-oss-20b` | OpenAI GPT-OSS-20B | 2025/2026 | Sparse MoE | 3.6B / 21B | 128K | OpenRouter, Hugging Face, Ollama | **VERIFIED_AVAILABLE** |
| **M03** | `Qwen/Qwen3.8-27B` | Alibaba Qwen 3.8 27B | 2025/2026 | Dense VLM | 27B / 27B | 128K | Groq, OpenRouter, DashScope | **VERIFIED_AVAILABLE** |
| **M04** | `google/gemma-4-31B-it` | Google Gemma 4 31B Instruct | 2025/2026 | Dense Transformer | 30.7B / 30.7B | 256K | OpenRouter, Vertex AI, Ollama | **VERIFIED_AVAILABLE** |
| **M05** | `google/gemma-4-26B-A4B` | Google Gemma 4 26B-A4B | 2025/2026 | MoE | 4.0B / 25.2B | 128K | OpenRouter, Hugging Face, vLLM | **AVAILABLE_WITH_LIMITATIONS** |
| **M06** | `meta-llama/Llama-3.3-70B-Instruct` | Meta Llama 3.3 70B Instruct | Dec 2024 | Dense GQA | 70B / 70B | 128K | Groq, OpenRouter, Together AI | **VERIFIED_AVAILABLE** |
| **M07** | `mistralai/Mistral-Small-24B-Instruct-2501` | Mistral Small 3 24B Instruct | Jan 2025 | Dense Transformer | 24B / 24B | 32K | OpenRouter, Mistral API, Ollama | **VERIFIED_AVAILABLE** |
| **M08** | `deepseek-ai/DeepSeek-V4.1-Flash` | DeepSeek V4.1 Flash | 2025/2026 | Asymmetric MoE | ~16B / ~60B | 128K | OpenRouter, DeepSeek API | **AVAILABLE_WITH_LIMITATIONS** |
| **M09** | `sarvamai/sarvam-105b` | Sarvam-105B Reasoning | Jan 2026 | MLA MoE (Top-8/128) | 10.3B / 106B | 128K | Sarvam API, AI Kosh | **AVAILABLE_WITH_LIMITATIONS** |
| **M10** | `sarvamai/sarvam-30b` | Sarvam-30B Efficient | Jan 2026 | GQA MoE | 2.4B / 32B | 65K | Sarvam API, Ollama, vLLM | **VERIFIED_AVAILABLE** |

---

## 3. COMPREHENSIVE PER-MODEL VERIFICATION DOSSIERS

### M01: OpenAI GPT-OSS-120B
- **Exact Official Name:** OpenAI GPT-OSS-120B
- **Official Repository:** `https://huggingface.co/openai/gpt-oss-120b` (GitHub: `openai/gpt-oss`)
- **Release Version:** v1.0.0 (Apache 2.0 License)
- **Architecture:** Sparse Mixture of Experts with ~117 billion total parameters, activating 5.1 billion parameters per token forward pass.
- **Context Window:** 131,072 tokens (128K)
- **Inference Providers:** 
  - Hosted API: OpenRouter (`openai/gpt-oss-120b`), Hugging Face Serverless / Dedicated Endpoints.
  - Local: Ollama (`ollama run gpt-oss:120b`), vLLM.
- **Hardware Requirement (Local):** 1x 80GB GPU (NVIDIA H100, AMD MI300X) utilizing MXFP4 quantization, or 4x RTX 4090 with INT4 offload.
- **Authentication & Rate Limits:** OpenRouter API key (`OPENROUTER_API_KEY`). Tier limits depend on OpenRouter account tier (typically 20-50 RPM on standard free/developer tier).
- **Benchmark Suitability:** **High**. State-of-the-art reasoning on complex legal clauses and fine-grained exception analysis.

### M02: OpenAI GPT-OSS-20B
- **Exact Official Name:** OpenAI GPT-OSS-20B
- **Official Repository:** `https://huggingface.co/openai/gpt-oss-20b`
- **Release Version:** v1.0.0 (Apache 2.0 License)
- **Architecture:** Highly efficient sparse MoE with ~21 billion total parameters, activating 3.6 billion parameters per token.
- **Context Window:** 131,072 tokens (128K)
- **Inference Providers:** OpenRouter (`openai/gpt-oss-20b`), Ollama (`gpt-oss:20b`), Hugging Face Inference API.
- **Hardware Requirement (Local):** Single consumer GPU with 16GB–24GB VRAM (NVIDIA RTX 3080/4080/4090) or 32GB unified memory Apple Silicon Mac.
- **Authentication:** Standard OpenAI-compatible API key via OpenRouter.
- **Benchmark Suitability:** **Very High**. Fast response time, low latency, exceptional chain-of-thought grounding adherence on consumer hardware.

### M03: Alibaba Qwen 3.8 27B
- **Exact Official Name:** Qwen 3.8 27B Dense
- **Official Repository:** `https://huggingface.co/Qwen/Qwen3.8-27B`
- **Release Version:** 3.8 release (Tongyi Qianwen Open License / Apache 2.0 compatible)
- **Architecture:** Dense Vision-Language and reasoning model with 27 billion parameters.
- **Context Window:** 131,072 tokens (128K)
- **Inference Providers:** Groq (`qwen/qwen3.8-27b`), OpenRouter (`qwen/qwen3.8-27b`), Alibaba DashScope.
- **Free-Tier Availability:** **Active on Groq Free Tier**. 30 requests/minute, 6,000 tokens/minute. Inference speeds reach ~450 tokens/second.
- **Current TrustForge Status:** Pre-configured in `backend/config.py` (`settings.llm_model = "qwen/qwen3.8-27b"`).
- **Benchmark Suitability:** **Exceptional**. Verified baseline in TrustForge research audits.

### M04: Google Gemma 4 31B Instruct
- **Exact Official Name:** Google Gemma 4 31B-IT
- **Official Repository:** `https://huggingface.co/google/gemma-4-31B-it`
- **Release Version:** Gemma 4 IT (Gemma Open Terms)
- **Architecture:** Dense decoder transformer with 30.7 billion parameters, instruction-tuned with RLHF.
- **Context Window:** 262,144 tokens (256K)
- **Inference Providers:** OpenRouter (`google/gemma-4-31b-it`), Google Cloud Vertex AI, Ollama (`gemma4:31b`).
- **Hardware Requirement (Local):** ~24GB VRAM at 4-bit quantization (single RTX 3090/4090) or 64GB CPU system RAM.
- **Authentication:** OpenRouter or Google Vertex API key.
- **Benchmark Suitability:** **Very High**. Strongest instruction-following discipline and adherence to negative constraints (e.g. refusing to invent clauses).

### M05: Google Gemma 4 26B-A4B
- **Exact Official Name:** Google Gemma 4 26B-A4B (MoE)
- **Official Repository:** `https://huggingface.co/google/gemma-4-26B-A4B`
- **Release Version:** Gemma 4 MoE Architecture
- **Architecture:** MoE activating 4.0 billion parameters per token out of 25.2 billion total parameters.
- **Context Window:** 131,072 tokens (128K)
- **Inference Providers:** OpenRouter (`google/gemma-4-26b-a4b`), Hugging Face Inference Endpoints.
- **Hardware Requirement (Local):** ~18GB VRAM quantized, low FLOP footprint.
- **Authentication:** OpenRouter API key.
- **Benchmark Suitability:** **High**. Evaluates the efficiency frontier between dense 31B and sparse 4B active execution.

### M06: Meta Llama 3.3 70B Instruct
- **Exact Official Name:** Meta Llama 3.3 70B Instruct
- **Official Repository:** `https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct`
- **Release Version:** Llama 3.3 (Meta Community License)
- **Architecture:** Dense autoregressive transformer with Grouped-Query Attention (GQA) and 70.6 billion parameters.
- **Context Window:** 131,072 tokens (128K)
- **Inference Providers:** Groq (`llama-3.3-70b-versatile`), OpenRouter (`meta-llama/llama-3.3-70b-instruct`), Together AI, Cerebras.
- **Free-Tier Availability:** **Active on Groq Free Tier**. 1,000 requests/day, 6,000 TPM limit. Inference speed ~280 tokens/sec.
- **Benchmark Suitability:** **Gold Standard**. Competitive with 405B models; superior multilingual comprehension of English and Indian legal statutory terms.

### M07: Mistral Small 3 24B Instruct
- **Exact Official Name:** Mistral Small 24B Instruct (Release 2501)
- **Official Repository:** `https://huggingface.co/mistralai/Mistral-Small-24B-Instruct-2501`
- **Release Version:** 2501 (Apache 2.0 License)
- **Architecture:** Dense transformer with 24 billion parameters and Tekken tokenizer (131K vocabulary).
- **Context Window:** 32,768 tokens (32K)
- **Inference Providers:** Mistral La Plateforme (`mistral-small-latest`), OpenRouter (`mistralai/mistral-small-24b-instruct-2501`), Ollama (`mistral-small:24b`).
- **Hardware Requirement (Local):** 16GB–20GB VRAM (RTX 4080/4090 or Apple Silicon).
- **Authentication:** Mistral API key or OpenRouter API key.
- **Benchmark Suitability:** **High**. Fast inference, strict JSON schema output compliance.

### M08: DeepSeek V4.1 Flash
- **Exact Official Name:** DeepSeek V4.1 Flash Multimodal MoE
- **Official Repository:** `https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash`
- **Release Version:** V4.1-Flash (DeepSeek Open License)
- **Architecture:** Asymmetric Mixture-of-Experts with dynamic token routing.
- **Context Window:** 131,072 tokens (128K)
- **Inference Providers:** DeepSeek Platform API (`deepseek-chat`), OpenRouter (`deepseek/deepseek-v4.1-flash`).
- **Authentication:** DeepSeek API Key (`DEEPSEEK_API_KEY`) or OpenRouter.
- **Benchmark Suitability:** **Very High**. Lowest token latency and high structural formatting fidelity.

### M09: Sarvam-105B Reasoning
- **Exact Official Name:** Sarvam-105B Sovereign Reasoning Model
- **Official Repository:** `https://huggingface.co/sarvamai/sarvam-105b`
- **Release Version:** Sarvam AI Indus Foundation (Apache 2.0)
- **Architecture:** Sovereign Indian foundation model; Multi-Head Latent Attention (MLA) with top-8 routing over 128 experts. 106B total parameters, 10.3B active per token.
- **Context Window:** 131,072 tokens (128K YaRN)
- **Inference Providers:** Sarvam Developer API (`https://api.sarvam.ai/v1`), AI Kosh (IndiaAI compute infrastructure), Hugging Face.
- **Jurisdictional Relevance:** Specifically pre-trained on Indian Gazette documents, central acts, and legal case law in 22 official Indian languages + English.
- **Authentication:** Sarvam API Key (`SARVAM_API_KEY`) from `dashboard.sarvam.ai`.
- **Benchmark Suitability:** **Critical Research Differentiator**. The premier domestic Indian reasoning model for DPDP Act 2023 evaluation.

### M10: Sarvam-30B Efficient
- **Exact Official Name:** Sarvam-30B Efficient MoE
- **Official Repository:** `https://huggingface.co/sarvamai/sarvam-30b`
- **Release Version:** Sarvam AI Samvaad Foundation (Apache 2.0)
- **Architecture:** 32B total parameters, 2.4B active parameters per token with Grouped Query Attention.
- **Context Window:** 65,536 tokens (65K)
- **Inference Providers:** Sarvam Developer API (`https://api.sarvam.ai/v1`), local vLLM / Ollama.
- **Hardware Requirement (Local):** 20GB–24GB VRAM; runs on a single consumer RTX 3090/4090 or Apple Silicon Mac.
- **Jurisdictional Relevance:** High token throughput on legal text with specialized Indian vocabulary tokenization.
- **Benchmark Suitability:** **High**. Represents the edge/efficient compliance evaluation tier for domestic Indian deployment.

---

## 4. MULTI-PROVIDER GATEWAY ARCHITECTURAL MAPPING

To execute this 10-model benchmark fairly without provider lock-in, the TrustForge LLM Gateway adopts a **Unified Provider Adapter Strategy**:

```text
TrustForge 10-Model Gateway
│
├── Groq Adapter (Ultra-High Speed, Free Tier)
│   ├── M03: Qwen 3.8 27B
│   └── M06: Llama 3.3 70B Instruct
│
├── OpenRouter Unified Adapter (OpenAI-Compatible Standard)
│   ├── M01: GPT-OSS-120B
│   ├── M02: GPT-OSS-20B
│   ├── M04: Gemma 4 31B Instruct
│   ├── M05: Gemma 4 26B-A4B
│   ├── M07: Mistral Small 24B Instruct
│   └── M08: DeepSeek V4.1 Flash
│
├── Sarvam AI Native Adapter (India Sovereign Legal Stack)
│   ├── M09: Sarvam-105B Reasoning
│   └── M10: Sarvam-30B Efficient
│
└── Local Ollama / vLLM Fallback (Zero-Cost Offline Research Execution)
    └── Available for M02, M03, M06, M07, M10
```

### Environment Variable Requirements:
```bash
# High-Speed Free Tier
GROQ_API_KEY=gsk_...

# OpenRouter Unified Gateway (Covers GPT-OSS, Gemma, Mistral, DeepSeek)
OPENROUTER_API_KEY=sk-or-v1-...

# Indian Sovereign Models
SARVAM_API_KEY=sarvam_...

# Optional Direct Keys
MISTRAL_API_KEY=...
DEEPSEEK_API_KEY=...
```

---
*Verified and Documented for Faculty Research Standards.*
