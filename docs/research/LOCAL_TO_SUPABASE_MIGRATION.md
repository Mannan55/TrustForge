# TrustForge — Local-to-Supabase Migration Protocol & Audit
**Document ID:** `docs/research/LOCAL_TO_SUPABASE_MIGRATION.md`  
**Phase:** 1G — Data Migration, Idempotency & Recovery  
**Project:** TrustForge Research Platform  
**Date:** October 2026

---

## 1. Migration Overview

To transition from the local disk-backed store (`api/data/*.json`) to Supabase PostgreSQL without data loss or downtime:
1. All local entities are inventoried, validated, and normalized.
2. The migration script [`api/src/database/migrate.ts`](file:///c:/TF%20new%20V1/TrustForge/api/src/database/migrate.ts) executes batch upserts (`ON CONFLICT (id) DO UPDATE`).
3. Running the migration repeatedly produces idempotent results with zero row duplication.

---

## 2. Source Asset Inventory (Local Disk Store)

Audited via `npx tsx src/database/migrate.ts`:

| Entity | Source File | Records on Disk | File Size | Primary Key Format | Target Table |
|---|---|---|---|---|---|
| **Assessments** | `api/data/assessments.json` | 11 | 360,611 bytes | `ASM_<timestamp>_<hash>` | `public.assessments` |
| **Website Scans** | `api/data/scans.json` | 11 | 40,291 bytes | `SCAN_<timestamp>_<hash>` | `public.website_scans` |
| **Risk Findings** | `api/data/findings.json` | 11 | 227,818 bytes | `<scan_id>_<model_id>` | `public.risk_findings` |
| **Trust Scores** | `api/data/scores.json` | 21 | 44,777 bytes | `<scan_id>_<model_id>` | `public.trust_scores` |
| **Benchmark Runs** | `api/data/benchmarks.json` | 2 | 18,761 bytes | `BENCH_<id>` | `public.benchmark_runs` |
| **Legal Knowledge** | `backend/knowledge/authoritative_corpus.json` | 83 | 76,076 bytes | `dpdp-act-2023-...` | `public.legal_chunks` |

**Total Data Volume**: 56 source records, 83 legal chunks, ~768 KB on disk.

---

## 3. Execution Commands & Migration Workflow

### Step 1: Run Dry-Run Inventory
```powershell
cd "c:\TF new V1\TrustForge\api"
npx tsx src/database/migrate.ts
```
*Validates all local JSON records without requiring active credentials.*

### Step 2: Apply SQL Migrations to Supabase Project
1. Log in to the [Supabase Dashboard](https://supabase.com/dashboard).
2. Open the **SQL Editor**.
3. Copy and run [`database/migrations/002_comprehensive_schema_and_rls.sql`](file:///c:/TF%20new%20V1/TrustForge/database/migrations/002_comprehensive_schema_and_rls.sql).
4. Copy and run [`database/seeds/001_legal_chunks.sql`](file:///c:/TF%20new%20V1/TrustForge/database/seeds/001_legal_chunks.sql) (seeds the 83 statutory chunks & embeddings).

### Step 3: Run Cloud Migration
Add credentials to `api/.env`:
```env
DATABASE_MODE=supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJh...
```
Re-run migration:
```powershell
npx tsx src/database/migrate.ts
```
*Inserts and updates all records idempotently into cloud PostgreSQL.*

---

## 4. Rollback & Disaster Recovery Strategy

- **Zero-Deletion Guarantee**: The migration script never deletes or alters local JSON files.
- **Instant Rollback**: If a remote database connection fails, setting `DATABASE_MODE=local` in `api/.env` immediately restores local operations using `durableStore.ts` with 100% of historical data intact.
