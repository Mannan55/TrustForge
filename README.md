# TrustForge™ - Autonomous DPDP Compliance & Privacy Assurance Platform

[![CI Verification](https://github.com/Mannan55/TrustForge/actions/workflows/ci.yml/badge.svg)](https://github.com/Mannan55/TrustForge/actions/workflows/ci.yml)
[![Release](https://img.shields.io/badge/release-v1.0.0-blue.svg)](https://github.com/Mannan55/TrustForge/releases/tag/v1.0.0-release)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Framework](https://img.shields.io/badge/compliance-DPDP%20Act%202023-indigo.svg)](https://www.meity.gov.in)

**TrustForge** is an automated compliance auditing, risk assessment, and decision-support platform engineered to benchmark enterprise data privacy practices against India's **Digital Personal Data Protection (DPDP) Act 2023** (Act No. 22 of 2023).

The platform bridges the gap between statutory legal mandates and technical engineering implementations, delivering objective Trust Scores, automated perimeter vulnerability scans, structured evidence management, and multi-model benchmark evaluation.

---

## Key Capabilities

### 🏢 Customer Compliance Suite
* **Non-Invasive Domain Scanner:** Evaluates internet-facing web properties for affirmative cookie banners, third-party tracking scripts, SSL/TLS transport configurations, and statutory privacy notice links.
* **14-Step Statutory Assessment Wizard:** Comprehensive questionnaire auditing organizational controls across all chapters of the DPDP Act 2023 (Notice, Consent, Purpose Limitation, Retention, Accuracy, Security, Breach Management, Minor Safeguards, and Data Principal Rights).
* **Deterministic Trust Score Engine:** Computes a normalized compliance posture score in $[0, 100]$ across six canonical statutory pillars, featuring critical failure gating caps (capping scores at $\le 40$ if HTTPS or privacy notices are missing).
* **Vulnerability Findings Vault:** Prioritizes compliance defects, maps each issue to its governing legal citation and statutory penalty exposure, and generates actionable remediation guidance.
* **Cryptographic Evidence Locker:** Ingests organizational policies and architectural proofs with SHA-256 cryptographic hashing to maintain an auditable chain of custody.
* **Data Principal Rights Portal:** Streamlines citizen privacy requests (Access, Correction, Erasure, Nomination) with statutory 30-day SLA resolution countdowns.

### 🛡️ Administrative Governance Console
* **Isolated Role Gate:** Strictly partitions administrative governance from tenant accounts, verifying the `platform_admin` role directly on the backend.
* **Platform Command Center:** Global operational dashboard aggregating cross-tenant compliance metrics, scan queues, and active worker telemetry.
* **Multi-Tenant Organization Management:** Superadmin controls for tenant directory inspection, domain verification token overrides, and Significant Data Fiduciary (SDF) tier assignments.
* **Statutory Rules Matrix:** Allows authorized legal engineers to configure scoring weights, penalty multipliers, and section thresholds dynamically.
* **Forensic Security Audit Ledger:** Append-only audit log capturing actor IP, timestamp, action performed, and HTTP status codes for every administrative touchpoint.

---

## System Architecture

TrustForge is architected as a modular, local-first platform designed for air-gapped enterprise environments and zero recurring API spend:

```mermaid
flowchart TD
    subgraph ClientLayer ["Client Layer"]
        A["React 18 SPA\n(TypeScript + Tailwind)"]
        B["Admin Console\n(/admin/*)"]
    end

    subgraph APILayer ["Application Gateway"]
        C["Express.js REST API\n(Node.js 22 LTS)"]
        D["Auth Middleware\n(PBKDF2 + HMAC-SHA256)"]
        E["Tenant Isolation Gate\n(org_id foreign key)"]
    end

    subgraph ServiceLayer ["Compliance & AI Engine"]
        F["Python 3.12 Backend\n(FastAPI / AsyncIO)"]
        G["Hybrid RAG Pipeline\n(BM25 + Dense Vectors + RRF k=60)"]
        H["Deterministic Scoring\n(6 Pillars + Gating Caps)"]
        I["TOPSIS Decision Engine\n(10 Model Slots M01–M10)"]
    end

    subgraph StorageLayer ["Persistence & Evidence Vault"]
        J["Durable SQLite Engine\n(Multi-Tenant Scoped)"]
        K["Cryptographic Evidence Locker\n(SHA-256 Hashes)"]
    end

    A -->|JWT / Session Token| C
    B -->|Admin Role Gate| C
    C --> D --> E
    E --> J
    E --> K
    C -->|Internal RPC / HTTP| F
    F --> G
    F --> H
    F --> I
```

---

## Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, TypeScript 5, Vite, Tailwind CSS, Lucide Icons, Playwright |
| **API Gateway** | Node.js 22 LTS, Express.js 4, TypeScript, Native Crypto (PBKDF2, HMAC-SHA256) |
| **Compliance Backend** | Python 3.12, PyTest, NumPy, PyDantic, AsyncIO, Scikit-Learn |
| **Information Retrieval** | Dense Semantic Embeddings + Sparse BM25 + Reciprocal Rank Fusion ($k=60$) |
| **Persistence** | Durable SQLite Store with foreign-key isolation, Supabase PostgreSQL adapter |
| **CI / Hardening** | GitHub Actions CI, Secret Scanning & Push Protection, Protected Main Branch |

---

## Quickstart

### Prerequisites
- **Node.js** 20.x or 22.x LTS
- **Python** 3.11 or 3.12
- **Git**

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Mannan55/TrustForge.git
cd TrustForge

# 2. Install API dependencies and build TypeScript
cd api
npm ci && npm run build
cd ..

# 3. Install Frontend dependencies
cd "TrustForge Frontend"
npm ci
cd ..

# 4. Install Python Backend dependencies
pip install -r backend/requirements.txt
```

### Starting the Application

#### Option A: Automated Launcher (Windows)
```cmd
Start_TrustForge.bat
```

#### Option B: Manual Multi-Terminal Startup

* **Terminal 1 (Express API):**
  ```bash
  cd api
  node dist/index.js
  ```
  *Server running at `http://127.0.0.1:8000`*

* **Terminal 2 (React Frontend):**
  ```bash
  cd "TrustForge Frontend"
  npm run dev
  ```
  *Client application running at `http://127.0.0.1:5173`*

---

## Default Access & Demonstration Accounts

When running in local development mode, default demonstration accounts are available:

| Portal | URL | Demo Account | Role Scope |
| :--- | :--- | :--- | :--- |
| **Client Portal** | `http://127.0.0.1:5173/login` | `dpo@acme-corp.in` | Compliance Officer / DPO |
| **Admin Console** | `http://127.0.0.1:5173/admin/login` | `admin@trustforge.internal` | Platform Superadmin |

*(Demo passwords configured via local development environment).*

---

## Testing & Quality Assurance

TrustForge includes complete automated test coverage across all layers:

```bash
# Run Python backend and legal grounding tests (29 tests)
python -m pytest backend

# Run API regression, tenant isolation, and scoring tests (180 tests)
cd api && npm test && cd ..

# Build frontend production bundle
cd "TrustForge Frontend" && npm run build && cd ..
```

---

## Documentation

* 📖 **[Setup & Run Guide](docs/SETUP_AND_RUN.md):** Detailed step-by-step instructions for installation, configuration, environment variables, and troubleshooting.
* 📄 **[System Documentation (PDF)](docs/SYSTEM_DOCUMENTATION.pdf):** Comprehensive technical specification covering the 14-step assessment, 6-pillar formulation, TOPSIS MCDM analysis, and RAG architecture.

---

## Compliance & Legal Disclaimer

> **IMPORTANT NOTICE:**  
> TrustForge is an automated compliance auditing and decision-support platform designed to assist organizations in evaluating privacy risks and readiness. **TrustForge does not provide legal advice, legal opinions, or authoritative certifications issued by the Data Protection Board of India.** Use of this platform does not guarantee exemption from statutory obligations, regulatory inquiries, or penalties under the DPDP Act 2023.

---

## License

This project is licensed under the terms of the [MIT License](LICENSE).
