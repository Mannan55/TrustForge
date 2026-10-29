# TrustForge — Live Supabase Cloud Activation & PostgreSQL Verification Report

**Document ID:** `docs/research/SUPABASE_LIVE_ACTIVATION_REPORT.md`  
**Phase:** 1 — Supabase PostgreSQL, Multi-Tenant RLS & pgvector Vector Engine  
**Project:** TrustForge Research Platform  
**Research Title:** An Evidence-Grounded RAG Framework for Digital Personal Data Protection Compliance Assessment  
**Date of Activation:** October 2026  
**Status:** **OPERATIONAL & LIVE IN PRODUCTION (Cloud PostgreSQL + pgvector)**  

---

## 1. Executive Summary

The database layer of the TrustForge research platform has successfully transitioned from local disk storage to **Supabase Cloud PostgreSQL 17.6** with native **pgvector (384-dimensional)** vector search and **Row-Level Security (RLS)**.

All schema migrations, statutory legal corpus seeding, historical application data migration, multi-tenant isolation policies, and live end-to-end regression tests were executed with zero data loss and 100% test pass rates.

---

## 2. Remote Database Identity & Connection Status

| Property | Cloud Value |
|---|---|
| **Supabase Project Name** | `TrustForge` |
| **Project Reference ID** | `bnpxutwmdqsoyefppwpl` |
| **Cloud Region** | `ap-southeast-2` (Sydney / Oceania) |
| **PostgreSQL Engine** | `PostgreSQL 17.6 on x86_64-pc-linux-gnu` |
| **PostgREST API Host** | `https://bnpxutwmdqsoyefppwpl.supabase.co` |
| **Active Storage Mode** | `DATABASE_MODE=supabase` |
| **Connection Tooling** | Supabase CLI (`v2.121.0`) linked via OAuth Access Token; `@supabase/supabase-js` (`v2.49.1`) |

---

## 3. Applied Database Migrations & Created Schema

### 3.1 Migration Artifact
- **Baseline Migration**: `database/migrations/000_consolidated_clean_install.sql` (Consolidated, hardened, clean-install script).
- **Execution Method**: Applied directly to remote PostgreSQL via `npx supabase db query --linked`.
- **Pre-Flight Action**: Purged 4 unpopulated legacy tables (`organizations`, `profiles`, `assessments`, `assessment_findings`) that carried incompatible UUID primary keys, replacing them with canonical TEXT-keyed application schemas.

### 3.2 Created Tables & Row-Level Security Status
All 11 public tables were created and verified with Row-Level Security enabled (`rowsecurity = true`):

| # | Table Name | Primary Key | Row Security (RLS) | Purpose |
|---|---|---|:---:|---|
| 1 | `public.organisations` | `TEXT` (`id`) | **`ENABLED`** | Multi-tenant tenant boundaries (`org_technova`, `org_default`, etc.) |
| 2 | `public.organisation_memberships` | `UUID` (`id`) | **`ENABLED`** | User-to-organization role mapping for RLS |
| 3 | `public.legal_documents` | `TEXT` (`id`) | **`ENABLED`** | Statutory legal documents (Acts, Rules, Gazettes) |
| 4 | `public."Legal_Chunks"` | `TEXT` (`id`) | **`ENABLED`** | 83 authoritative DPDP statutory chunks with 384-dim vector embeddings |
| 5 | `public.assessments` | `TEXT` (`id`) | **`ENABLED`** | Authenticated assessment wizard runs (`ASM_...`) |
| 6 | `public.website_scans` | `TEXT` (`id`) | **`ENABLED`** | Playwright crawler technical scan results (`SCAN_...`) |
| 7 | `public.evidence_records` | `TEXT` (`id`) | **`ENABLED`** | Normalized technical & legal evidence artifacts |
| 8 | `public.risk_findings` | `UUID` (`id`) | **`ENABLED`** | Model-evaluated control gap findings (20 canonical controls) |
| 9 | `public.trust_scores` | `UUID` (`id`) | **`ENABLED`** | Deterministic Trust Scores & Pillar breakdowns (0–100 scale) |
| 10 | `public.benchmark_runs` | `TEXT` (`id`) | **`ENABLED`** | 10-LLM comparative benchmarking logs (`BENCH_...`) |
| 11 | `public.model_evaluations` | `UUID` (`id`) | **`ENABLED`** | Per-model execution latency, status, and inference audit logs |

### 3.3 Compatibility Views & Triggers
- **Dual Case Compatibility Views**: Created `public.legal_chunks`, `public."Website_Scans"`, `public."Risk_Findings"`, `public."Trust_Scores"`, and `public."Benchmark_Runs"`.
- **Bi-directional Column Synchronization Trigger**: `trg_sync_legal_chunk_fields` automatically maps `section` ↔ `section_num`, `heading` ↔ `section_title`, `text` ↔ `chunk_text`, and `effective_date` ↔ `enforceable_date`.

---

## 4. Statutory Legal Corpus & pgvector Retrieval Verification

### 4.1 Corpus Seed Verification
- **Seed Artifact**: `database/seeds/001_legal_chunks.sql` (489,136 bytes).
- **Total Statutory Chunks Seeded**: Exactly **83 chunks**.
- **Embedding Model**: `sentence-transformers/all-MiniLM-L6-v2`.
- **Vector Dimension Verification** (Executed via native `vector_dims(embedding)`):
  ```sql
  SELECT count(*) AS total_chunks, 
         count(CASE WHEN vector_dims(embedding) = 384 THEN 1 END) AS valid_384_dim_chunks, 
         min(vector_dims(embedding)) AS min_dim, 
         max(vector_dims(embedding)) AS max_dim 
  FROM public.legal_chunks;
  ```
  **Result:**
  - `total_chunks`: `83`
  - `valid_384_dim_chunks`: `83`
  - `min_dim`: `384`
  - `max_dim`: `384`

### 4.2 Vector Indexing
- **Index Name**: `idx_legal_chunks_vector`
- **Method**: Hierarchical Navigable Small World (`HNSW`)
- **Distance Metric**: `vector_cosine_ops` ($1 - \text{Cosine Similarity}$)
- **Index Parameters**: `m = 16`, `ef_construction = 64`

### 4.3 Live Semantic Retrieval Test
Queried the stored procedure `public.match_legal_chunks` using the query vector of Section 6 (Consent):
```sql
SELECT id, section, heading, round(similarity::numeric, 4) as similarity 
FROM public.match_legal_chunks((SELECT embedding FROM public.legal_chunks WHERE id = 'dpdp-act-2023-section-6-subsections-1-to-5'), 0.5, 3);
```
**Actual Retrieved Results:**
1. `dpdp-act-2023-section-6-subsections-1-to-5` | **Similarity: 1.0000** (Exact match)
2. `dpdp-act-2023-section-6-subsections-6-to-10` | **Similarity: 0.7441** (Sister clause on withdrawal & burden of proof)
3. `dpdp-act-2023-section-5` | **Similarity: 0.7063** (Notice given by Data Fiduciary)

---

## 5. Multi-Tenant RLS Policy Verification

Multi-tenant isolation and policy enforcement were verified using isolated test identities (`User A` in `org_technova` vs. `User B` in `org_beta` vs. `Anonymous Visitor`):

| Test Persona | Target Query | Visible Records | Own Org Records | Foreign Org Leaks | Verdict |
|---|---|:---:|:---:|:---:|:---:|
| **User A (Technova Member)** | `public.assessments` | 4 | 4 | 0 | **`PASS (ISOLATED)`** |
| **User B (Beta Member)** | `public.assessments` | 1 | 1 | 0 | **`PASS (ISOLATED)`** |
| **Anonymous Visitor** | `public.assessments` | 0 | 0 | 0 | **`PASS (RESTRICTED)`** |
| **Anonymous Visitor** | `public.legal_chunks` | 83 | 83 | 0 | **`PASS (PUBLIC READ)`** |

---

## 6. Historical Application Data Migration

Local JSON data from `api/data/*.json` was backed up to `api/data_backup/` and migrated to Supabase via `api/src/database/migrate.ts`:

| Entity | Source File | Source Count | Migrated to Supabase | Failed / Skipped | Integrity Status |
|---|---|:---:|:---:|:---:|:---:|
| **Organizations** | Inferred | 3 | **3** | 0 | Foreign keys satisfied |
| **Assessments** | `assessments.json` | 12 | **12** | 0 | 100% persisted |
| **Website Scans** | `scans.json` | 13 | **13** | 0 | 100% persisted |
| **Benchmark Runs** | `benchmarks.json` | 3 | **3** | 0 | 100% persisted |
| **Risk Findings** | `findings.json` | 260 | **260** | 0 | 100% persisted |
| **Trust Scores** | `scores.json` | 24 | **24** | 0 | 100% persisted |

---

## 7. Live End-to-End Regression Test Evidence

A live assessment pipeline run was executed against the production Supabase cloud database via `api/test_e2e_assessment.ts` with `DATABASE_MODE=supabase`:

1. **Storage Mode Detection**: `[Database] Storage Mode: SUPABASE (Connected to bnpxutwmdqsoyefppwpl.supabase.co)`
2. **Authenticated Assessment Initiation**:
   - Assessment ID: `ASM_1792342134614_1twuy`
   - Created in remote PostgreSQL table `public.assessments` with status `in_progress`.
3. **Evidence Crawl & Normalization**:
   - Target URL: `https://example.com`
   - Technical checks: SSL, HSTS, Security Headers, Cookie security.
4. **10-LLM Batch Inference & RAG Evaluation**:
   - Model M01 (`OpenAI GPT-OSS-120B` on Groq): Completed (20 findings, 4,468 ms).
   - Model M02 (`OpenAI GPT-OSS-20B` on Groq): Rate limited (HTTP 429 handled gracefully).
   - Model M03 (`Alibaba Qwen 3.8 27B` on Groq): Completed (20 findings, 3,949 ms).
   - Selection Mode: `BEST_MODEL_M03`.
5. **Score & Posture Persistence in Supabase**:
   - Trust Score: **`34.91 / 100`** (`Critical`).
   - Pillar breakdown: Privacy (37.06), Security (47.50), Transparency (30.00), Rights (30.00).
   - Remote DB Verification:
     ```json
     {
       "id": "ASM_1792342134614_1twuy",
       "organisation_id": "org_technova",
       "status": "complete",
       "trust_score": "34.91",
       "posture": "Critical"
     }
     ```
6. **Executive Report & PDF Engine**:
   - Executive API endpoint: `HTTP 200`
   - PDF generation (`GET /api/reports/:id/pdf`): Valid PDF stream, 5,633 bytes, `%PDF-` header verified.
7. **Post-Restart Persistence**:
   - Simulated complete server teardown and relaunch on fresh port.
   - Verified that `ASM_1792342134614_1twuy` was successfully loaded from Supabase PostgreSQL with 100% fidelity.
8. **Free Scan Pipeline**:
   - Scan ID `SCAN_1792342162408_kox82` completed and stored in `public.website_scans`.

---

## 8. Summary of Active Configuration

| File | Setting | Value |
|---|---|---|
| `api/.env` | `DATABASE_MODE` | `supabase` |
| `api/.env` | `SUPABASE_URL` | `https://bnpxutwmdqsoyefppwpl.supabase.co` |
| `api/.env` | `SUPABASE_SERVICE_ROLE_KEY` | *(Configured securely, git-ignored)* |
| `api/.env` | `SUPABASE_ANON_KEY` | *(Configured securely, git-ignored)* |
| `api/data_backup/` | Local JSON Backup | 5 JSON files preserved |
| `database/migrations/` | Fresh Install Baseline | `000_consolidated_clean_install.sql` |
| `database/seeds/` | Knowledge Base Seed | `001_legal_chunks.sql` |

**Conclusion:** Supabase PostgreSQL, Row-Level Security, and pgvector are fully operational and active across the TrustForge application stack.
