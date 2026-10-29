# TrustForge — Final Known Limitations & Research Boundary Document

**Document Purpose:** Academic Honesty and Research Delimitation  
**Date:** October 22, 2026  
**Audience:** Academic Faculty & Peer Reviewers  

---

## 1. Statutory Retrieval Limitations
- **Corpus Breadth:** The statutory corpus consists of 83 authoritative chunks covering the complete text of the Indian DPDP Act, 2023 and the notified DPDP Rules, 2025. It does not incorporate forthcoming state-level sector notifications (e.g. Reserve Bank of India data localization circulars or SEBI cybersecurity guidelines).
- **Lexical vs Dense Trade-Off:** BM25 achieves superior Hit@1 (68.9%) on verbatim statutory phrases, while dense embeddings (`all-MiniLM-L6-v2`) provide broader semantic coverage (Hit@5 = 84.4% under RRF). A unified sparse-dense reranking model (e.g. ColBERT or BGE-Reranker-Large) could further enhance Top-1 precision at the expense of retrieval latency.

---

## 2. LLM Inference & Provider Availability Limitations
- **Accessible Model Ceiling:** Only 3 of the 10 faculty-mandated models (M01: GPT-OSS-120B, M02: GPT-OSS-20B, M03: Qwen 3.8 27B) are accessible at zero financial cost via Groq's high-speed LPU infrastructure.
- **Credential Requirements for M04–M09:** Models M04–M08 (Google Gemma 4, Meta Llama 3.3 70B, Mistral Small 24B, DeepSeek V4.1) and M09 (Sarvam-105B) require funded developer API keys with OpenRouter or Sarvam AI. In compliance with strict research ethics, TrustForge refuses to fabricate dummy responses.
- **Local Weight Overhead for M10:** M10 (Sarvam-30B) is deprecated on Sarvam's hosted API. Deploying its 60GB+ FP16 weights locally requires dedicated high-VRAM GPU hardware (e.g. NVIDIA A100 / H100) not available in standard workstation environments.

---

## 3. Scientific Ground-Truth Dataset Limitations
- **Review Level:** The current evaluation dataset (`dpdp_obligation_ground_truth_v1.json`, 60 cases) is authored by the research team (`RESEARCH_TEAM_AUTHORED_REFERENCE_LABELS`). It has not undergone formal blind peer review by practicing Supreme Court/High Court data protection attorneys or the Data Protection Board of India (DPBI).
- **Public Evidence Incompleteness:** Website crawling is inherently restricted to publicly visible digital artifacts (privacy notices, cookie consent modals, terms of service). Internal compliance duties (e.g. Data Protection Impact Assessments, employee training logs, data retention purging schedules, and breach management drills) cannot be conclusively evaluated from website inspection alone. Consequently, reasoning models like M01 demonstrate a strong, defensible tendency to output `INSUFFICIENT_EVIDENCE`.

---

## 4. Deployment Environment Limitations
- **Python Embedding Sidecar on Cloud:** Running the Python SentenceTransformers daemon alongside the Node.js Express backend on Render's free tier requires container multi-processing or microservice separation. Under pure serverless configurations, embedding generation defaults to Authoritative BM25 retrieval unless an external embedding API endpoint is provisioned.
- **Legal Non-Certification Disclaimer:** TrustForge outputs a preliminary technical compliance posture assessment to aid privacy engineers and compliance officers. It does not constitute formal legal counsel or a government-issued certification under the Digital Personal Data Protection Act, 2023.
