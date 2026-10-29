# TrustForge™ — Complete Setup, Configuration & Execution Guide

This document provides definitive, end-to-end instructions for deploying, configuring, and verifying the TrustForge compliance platform from a clean development or server environment.

---

## 1. System Requirements & Prerequisites

| Component | Minimum Version | Recommended Version | Verification Command |
| :--- | :--- | :--- | :--- |
| **Node.js** | 20.x LTS | 22.x LTS | `node -v` |
| **npm** | 10.x | 10.x+ | `npm -v` |
| **Python** | 3.11 | 3.12 | `python --version` |
| **Git** | 2.40+ | 2.45+ | `git --version` |
| **Operating System** | Windows 10/11, macOS, or Ubuntu 22.04 LTS | Windows 11 / Ubuntu 22.04 | `uname -a` or system info |

---

## 2. Repository Clone & Directory Structure

Clone the TrustForge application repository:

```bash
git clone https://github.com/Mannan55/TrustForge.git
cd TrustForge
```

The core codebase structure is organized into clean functional modules:

```
TrustForge/
├── api/                     # Express.js REST API & Persistence Service
│   ├── src/                 # TypeScript source (routes, middleware, scoring, research)
│   ├── dist/                # Compiled JavaScript target
│   └── package.json
├── backend/                 # Python RAG, Legal Knowledge & Compliance Engine
│   ├── knowledge/           # Statutory DPDP legal sources & corpus
│   ├── rag/                 # Lexical BM25, embeddings & vector search
│   ├── tests/               # Python test suite
│   └── requirements.txt
├── TrustForge Frontend/     # React 18 Single-Page Application (Vite)
│   ├── src/                 # React components, pages, contexts, styles
│   └── package.json
├── docs/                    # Public documentation assets
│   ├── SETUP_AND_RUN.md     # This setup and execution guide
│   └── SYSTEM_DOCUMENTATION.pdf  # Comprehensive architecture documentation
├── Start_TrustForge.bat     # Windows automated startup launcher
└── README.md                # Product homepage and quickstart
```

---

## 3. Dependency Installation & Build

### Step 3.1: Python Backend Environment

Set up a virtual environment and install the required Python dependencies:

```bash
# Optional: create virtual environment
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install requirements
pip install -r backend/requirements.txt
```

Verify that testing packages are installed:

```bash
pip install pytest pytest-asyncio anyio pydantic pydantic-settings numpy
```

### Step 3.2: Express API Installation & TypeScript Compilation

Install Node.js packages and compile the TypeScript backend:

```bash
cd api
npm ci
npm run build
cd ..
```

### Step 3.3: React Frontend Installation

Install frontend dependencies:

```bash
cd "TrustForge Frontend"
npm ci
cd ..
```

---

## 4. Environment Configuration

Copy the example environment configuration into both `api` and `TrustForge Frontend`:

### API Environment (`api/.env`):

```ini
# Application Environment
NODE_ENV=development
PORT=8000

# Authentication & Session Security (Minimum 32 characters)
AUTH_SECRET=trustforge_session_secret_2026_dpdp_audit_secure_token_min32
JWT_SECRET=trustforge_session_secret_2026_dpdp_audit_secure_token_min32

# Model Inference Policies (Strict Zero-Paid-Spend Policy)
ALLOW_PAID_INFERENCE=false
SERVER_PAID_INFERENCE_AUTHORIZED=false

# Optional Database Configurations
# If SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are omitted,
# the platform automatically defaults to the durable SQLite persistence store.
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

### Frontend Environment (`TrustForge Frontend/.env`):

```ini
# API Base Endpoint
VITE_API_URL=http://127.0.0.1:8000/api
```

---

## 5. Starting the Platform Services

### Option A: Automated Windows Launcher

To launch all background services automatically on Windows:

```cmd
Start_TrustForge.bat
```

This script initiates the Express API on port `8000` and the Vite development server on port `5173`.

---

### Option B: Manual Multi-Terminal Startup

#### Terminal 1 — Start the Express API Backend:

```bash
cd api
node dist/index.js
```
*Output: `TrustForge API server listening on http://127.0.0.1:8000`*

#### Terminal 2 — Start the React Frontend:

```bash
cd "TrustForge Frontend"
npm run dev
```
*Output: `Local: http://127.0.0.1:5173/`*

---

## 6. Accessing the User Interfaces

| Interface | URL | Access Requirements |
| :--- | :--- | :--- |
| **Public Landing & Scanner** | `http://127.0.0.1:5173/` | None (Publicly Accessible) |
| **Customer Authentication Portal** | `http://127.0.0.1:5173/login` | Registered Client Credentials |
| **Customer Compliance Dashboard** | `http://127.0.0.1:5173/dashboard` | Client Session Token (`tf_tok_...`) |
| **Administrative Login Gate** | `http://127.0.0.1:5173/admin/login` | Server-Verified Administrator Credentials |
| **Admin Command Center** | `http://127.0.0.1:5173/admin/dashboard` | `platform_admin` / `Super Admin` Role |
| **API Health Endpoint** | `http://127.0.0.1:8000/api/health` | HTTP GET (Returns JSON status) |

### Default Demonstration Accounts (Development Mode):

When running with default seed data in local development mode:
- **Client Account:** `dpo@acme-corp.in` (Password: `Password123!`)
- **Platform Administrator:** `admin@trustforge.internal` (Password: `TrustForgeAdmin2026!`)

> [!NOTE]  
> Submitting client customer credentials to `/admin/login` will result in an immediate rejection error (`Invalid credentials or unauthorized administrative role`). Only accounts assigned the explicit platform administrator role can access the Admin Console.

---

## 7. Running Automated Test Suites

### 7.1: Python Backend Unit & Grounding Tests

Execute the Python pytest suite:

```bash
python -m pytest backend
```
*Expected Result: 29 passed tests verifying legal chunking, grounding validators, and embeddings.*

### 7.2: Full API Regression & Integration Tests

Execute the Node.js test runner against compiled test suites:

```bash
cd api
npm test
cd ..
```
*Expected Result: 180 passed tests verifying authentication, tenant isolation, scoring algorithms, and TOPSIS rankings.*

### 7.3: Frontend Production Build Verification

Verify that the frontend builds cleanly without TypeScript or bundler errors:

```bash
cd "TrustForge Frontend"
npm run build
cd ..
```

---

## 8. Troubleshooting & Common Errors

| Issue | Root Cause | Solution |
| :--- | :--- | :--- |
| `FATAL: A strong AUTH_SECRET must be configured` | `AUTH_SECRET` missing or shorter than 32 characters | Ensure `AUTH_SECRET` in `api/.env` is at least 32 characters long. |
| `Cannot connect to backend API` | API daemon not running on port 8000 | Verify port 8000 is open and start API via `node api/dist/index.js`. |
| `Cross-tenant isolation error (HTTP 403)` | Tenant attempted to access resources of another organization | Verify you are using a token issued for the matching `org_id`. |
| `Commercial model M06-M09 blocked` | Zero-paid inference policy is enforced | By design. TrustForge operates locally without paid commercial API spend. |

---

## 9. Security & Commercial Policy Notice

1. **Zero Commercial Inference Cost:** Commercial LLM API calls are strictly gated by default. TrustForge achieves state-of-the-art compliance reasoning using local weights and free tier LPU endpoints without incurring billing charges.
2. **Disclaimer:** TrustForge is an automated compliance assessment and decision-support auditing platform. It does not constitute official legal advice or an authoritative certification issued by the Data Protection Board of India.
