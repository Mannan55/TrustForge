-- ============================================================================
-- TRUSTFORGE — CONSOLIDATED SUPABASE POSTGRESQL + PGVECTOR INSTALLATION SCRIPT
-- File: database/migrations/000_consolidated_clean_install.sql
-- Project: TrustForge Research Platform (DPDP Act, 2023 & Rules, 2025)
-- Safe for execution on a fresh Supabase project via Supabase CLI or SQL Editor.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Required Extensions
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 2. Organizations & Multi-Tenant Membership (Tenant Isolation Foundation)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.organisations (
    id TEXT PRIMARY KEY,                       -- e.g. "org_technova", "org_default"
    name TEXT NOT NULL,
    industry TEXT DEFAULT 'Technology',
    jurisdiction TEXT DEFAULT 'India',
    data_protection_officer JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default research organizations
INSERT INTO public.organisations (id, name, industry) VALUES 
    ('org_technova', 'Technova Solutions Private Limited', 'Fintech & Cloud Services'),
    ('org_default', 'TrustForge Research Evaluation Workspace', 'Academic & Research')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

CREATE TABLE IF NOT EXISTS public.organisation_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,                              -- Maps to auth.users.id
    organisation_id TEXT NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('Owner', 'Admin', 'Compliance Officer', 'Auditor', 'Viewer')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (organisation_id, email)
);

CREATE INDEX IF NOT EXISTS idx_memberships_user ON public.organisation_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_org ON public.organisation_memberships(organisation_id);
CREATE INDEX IF NOT EXISTS idx_memberships_email ON public.organisation_memberships(email);

-- ----------------------------------------------------------------------------
-- 3. Legal Documents & Statutory Legal_Chunks (pgvector 384-dim Knowledge Base)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.legal_documents (
    id TEXT PRIMARY KEY,                       -- e.g. "dpdp-act-2023", "dpdp-rules-2025"
    title TEXT NOT NULL,
    authority TEXT NOT NULL,
    source_url TEXT,
    gazette_ref TEXT,
    publication_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.legal_documents (id, title, authority, source_url) VALUES 
    ('dpdp-act-2023', 'Digital Personal Data Protection Act, 2023 (Act No. 22 of 2023)', 'Ministry of Law and Justice, Gazette of India', 'https://www.meity.gov.in/writereaddata/files/DPDP_Act_2023.pdf'),
    ('dpdp-rules-2025', 'Digital Personal Data Protection Rules, 2025', 'Ministry of Electronics and Information Technology', 'https://www.meity.gov.in/content/dpdp-rules-2025'),
    ('dpdp-act-commencement-2025', 'DPDP Act, 2023 Commencement Notifications & Phased Enforcement Orders', 'Ministry of Electronics and Information Technology, Gazette of India', 'https://www.meity.gov.in'),
    ('dpdp-act-commencement-gsr-843e', 'Commencement Notification G.S.R. 843(E)', 'Ministry of Electronics and Information Technology', 'https://www.meity.gov.in')
ON CONFLICT (id) DO NOTHING;

-- Base Table: Quoted "Legal_Chunks" for 100% compatibility with seed file
CREATE TABLE IF NOT EXISTS public."Legal_Chunks" (
    id TEXT PRIMARY KEY,                       -- e.g. "dpdp-act-2023-section-1"
    document_id TEXT NOT NULL REFERENCES public.legal_documents(id) ON DELETE CASCADE,
    document_title TEXT NOT NULL,
    authority TEXT DEFAULT 'Government of India',
    source_type TEXT DEFAULT 'STATUTORY_ACT',
    section TEXT,                              -- Canonical column
    section_num TEXT,                          -- Seed compatibility alias
    heading TEXT,                              -- Canonical column
    section_title TEXT,                        -- Seed compatibility alias
    text TEXT,                                 -- Canonical column
    chunk_text TEXT,                           -- Seed compatibility alias
    commencement_status TEXT NOT NULL DEFAULT 'IN_FORCE',
    effective_date DATE DEFAULT '2025-11-13',
    enforceable_date DATE,
    enforceability TEXT DEFAULT 'CURRENTLY_ENFORCEABLE',
    source_url TEXT,
    sha256 TEXT,
    embedding vector(384),                     -- 384-dim from sentence-transformers/all-MiniLM-L6-v2
    corpus_version TEXT DEFAULT '83-chunk-authoritative-v2',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bidirectional column synchronization trigger for Legal_Chunks
CREATE OR REPLACE FUNCTION public.sync_legal_chunk_fields()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
    IF NEW.section IS NULL AND NEW.section_num IS NOT NULL THEN
        NEW.section := NEW.section_num;
    END IF;
    IF NEW.section_num IS NULL AND NEW.section IS NOT NULL THEN
        NEW.section_num := NEW.section;
    END IF;

    IF NEW.heading IS NULL AND NEW.section_title IS NOT NULL THEN
        NEW.heading := NEW.section_title;
    END IF;
    IF NEW.section_title IS NULL AND NEW.heading IS NOT NULL THEN
        NEW.section_title := NEW.heading;
    END IF;

    IF NEW.text IS NULL AND NEW.chunk_text IS NOT NULL THEN
        NEW.text := NEW.chunk_text;
    END IF;
    IF NEW.chunk_text IS NULL AND NEW.text IS NOT NULL THEN
        NEW.chunk_text := NEW.text;
    END IF;

    IF NEW.effective_date IS NULL AND NEW.enforceable_date IS NOT NULL THEN
        NEW.effective_date := NEW.enforceable_date;
    END IF;
    IF NEW.enforceable_date IS NULL AND NEW.effective_date IS NOT NULL THEN
        NEW.enforceable_date := NEW.effective_date;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_legal_chunk_fields ON public."Legal_Chunks";
CREATE TRIGGER trg_sync_legal_chunk_fields
BEFORE INSERT OR UPDATE ON public."Legal_Chunks"
FOR EACH ROW EXECUTE FUNCTION public.sync_legal_chunk_fields();

-- Full text search tsvector column
ALTER TABLE public."Legal_Chunks" ADD COLUMN IF NOT EXISTS fts_tsv tsvector 
GENERATED ALWAYS AS (to_tsvector('english', coalesce(heading, '') || ' ' || coalesce(section, '') || ' ' || coalesce(text, ''))) STORED;

CREATE INDEX IF NOT EXISTS idx_legal_chunks_doc ON public."Legal_Chunks"(document_id);
CREATE INDEX IF NOT EXISTS idx_legal_chunks_sec ON public."Legal_Chunks"(section);
CREATE INDEX IF NOT EXISTS idx_legal_chunks_comm ON public."Legal_Chunks"(commencement_status);
CREATE INDEX IF NOT EXISTS idx_legal_chunks_fts ON public."Legal_Chunks" USING gin(fts_tsv);

-- HNSW Vector Index for pgvector 384-dim Cosine Distance
CREATE INDEX IF NOT EXISTS idx_legal_chunks_vector ON public."Legal_Chunks" 
USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);

-- Compatibility view for lowercase `legal_chunks` queries
CREATE OR REPLACE VIEW public.legal_chunks AS SELECT * FROM public."Legal_Chunks";

-- ----------------------------------------------------------------------------
-- 4. Stored Function: match_legal_chunks (pgvector Semantic Search)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.match_legal_chunks(
    query_embedding vector(384),
    match_threshold float DEFAULT 0.4,
    match_count int DEFAULT 5,
    filter_commencement text DEFAULT NULL
)
RETURNS TABLE (
    id text,
    document_id text,
    section text,
    heading text,
    text text,
    commencement_status text,
    enforceability text,
    similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN QUERY
    SELECT
        lc.id,
        lc.document_id,
        lc.section,
        lc.heading,
        lc.text,
        lc.commencement_status,
        lc.enforceability,
        1 - (lc.embedding <=> query_embedding) AS similarity
    FROM public."Legal_Chunks" lc
    WHERE (filter_commencement IS NULL OR lc.commencement_status = filter_commencement)
      AND (1 - (lc.embedding <=> query_embedding)) >= match_threshold
    ORDER BY lc.embedding <=> query_embedding ASC
    LIMIT match_count;
END;
$$;

REVOKE ALL ON FUNCTION public.match_legal_chunks(vector, float, int, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.match_legal_chunks(vector, float, int, text) TO anon, authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 5. Table: assessments (Authenticated Assessment Lifecycle)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.assessments (
    id TEXT PRIMARY KEY,                       -- e.g. "ASM_1792336043260_r7oip"
    organisation_id TEXT NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
    website_url TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('in_progress', 'complete', 'completed', 'failed')),
    progress INT NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    current_step TEXT,
    trust_score NUMERIC(5,2),
    posture TEXT,
    evidence_coverage NUMERIC(5,2) DEFAULT 0.0,
    pillar_scores JSONB DEFAULT '[]'::jsonb,
    selection_mode TEXT DEFAULT 'BEST_VALIDATED_MODEL',
    benchmark_id TEXT,
    benchmark_status TEXT,
    models_evaluated JSONB DEFAULT '[]'::jsonb,
    models_unavailable JSONB DEFAULT '[]'::jsonb,
    total_controls INT DEFAULT 20,
    pass_count INT DEFAULT 0,
    potential_gap_count INT DEFAULT 0,
    fail_count INT DEFAULT 0,
    insufficient_evidence_count INT DEFAULT 0,
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_assessments_org ON public.assessments(organisation_id);
CREATE INDEX IF NOT EXISTS idx_assessments_status ON public.assessments(status);
CREATE INDEX IF NOT EXISTS idx_assessments_created ON public.assessments(created_at DESC);

-- ----------------------------------------------------------------------------
-- 6. Table: website_scans (Faculty Core Entity 1)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.website_scans (
    id TEXT PRIMARY KEY,                       -- e.g. "SCAN_1792336059427_vvnoy"
    assessment_id TEXT REFERENCES public.assessments(id) ON DELETE CASCADE,
    organisation_id TEXT REFERENCES public.organisations(id) ON DELETE CASCADE,
    target_url TEXT NOT NULL,
    resolved_ip TEXT,
    status TEXT NOT NULL CHECK (status IN ('pending', 'crawling', 'completed', 'failed')),
    scan_checks JSONB NOT NULL DEFAULT '[]'::jsonb,
    evidence_items JSONB NOT NULL DEFAULT '[]'::jsonb,
    preliminary_score INT DEFAULT 0,
    posture TEXT DEFAULT 'Needs Attention',
    duration_ms INT DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_website_scans_org ON public.website_scans(organisation_id);
CREATE INDEX IF NOT EXISTS idx_website_scans_asm ON public.website_scans(assessment_id);
CREATE INDEX IF NOT EXISTS idx_website_scans_url ON public.website_scans(target_url);

-- Compatibility view for PascalCase "Website_Scans"
CREATE OR REPLACE VIEW public."Website_Scans" AS SELECT * FROM public.website_scans;

-- ----------------------------------------------------------------------------
-- 7. Table: evidence_records (Normalized Technical & Legal Evidence Artifacts)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.evidence_records (
    id TEXT PRIMARY KEY,                       -- e.g. "EVID_HTTPS_01", "EVID_COOKIE_01"
    assessment_id TEXT REFERENCES public.assessments(id) ON DELETE CASCADE,
    scan_id TEXT REFERENCES public.website_scans(id) ON DELETE CASCADE,
    organisation_id TEXT REFERENCES public.organisations(id) ON DELETE CASCADE,
    source TEXT NOT NULL,
    label TEXT NOT NULL,
    status TEXT NOT NULL,
    raw_value JSONB NOT NULL DEFAULT '{}'::jsonb,
    content_hash TEXT,
    captured_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evidence_asm ON public.evidence_records(assessment_id);
CREATE INDEX IF NOT EXISTS idx_evidence_scan ON public.evidence_records(scan_id);

-- ----------------------------------------------------------------------------
-- 8. Table: risk_findings (Faculty Core Entity 2)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.risk_findings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id TEXT REFERENCES public.assessments(id) ON DELETE CASCADE,
    scan_id TEXT,
    organisation_id TEXT REFERENCES public.organisations(id) ON DELETE CASCADE,
    control_id TEXT NOT NULL,
    model_id TEXT NOT NULL,
    verdict TEXT NOT NULL CHECK (verdict IN (
        'SUPPORTED', 'PARTIALLY_SUPPORTED', 'NOT_SUPPORTED', 'INSUFFICIENT_EVIDENCE', 'NOT_APPLICABLE'
    )),
    severity TEXT NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    title TEXT NOT NULL,
    finding TEXT NOT NULL,
    explanation TEXT NOT NULL,
    recommendation TEXT,
    statutory_reference TEXT,
    evidence_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    citations JSONB NOT NULL DEFAULT '[]'::jsonb,
    confidence NUMERIC(4,3) DEFAULT 1.0,
    is_grounded BOOLEAN DEFAULT true,
    grounding_score NUMERIC(4,3) DEFAULT 1.0,
    evaluation_method TEXT DEFAULT 'RAG_GROUNDED_LLM',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_risk_findings_asm ON public.risk_findings(assessment_id);
CREATE INDEX IF NOT EXISTS idx_risk_findings_model ON public.risk_findings(model_id);
CREATE INDEX IF NOT EXISTS idx_risk_findings_ctrl ON public.risk_findings(control_id);

-- Compatibility view for PascalCase "Risk_Findings"
CREATE OR REPLACE VIEW public."Risk_Findings" AS SELECT * FROM public.risk_findings;

-- ----------------------------------------------------------------------------
-- 9. Table: trust_scores (Faculty Core Entity 3)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.trust_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id TEXT REFERENCES public.assessments(id) ON DELETE CASCADE,
    scan_id TEXT,
    organisation_id TEXT REFERENCES public.organisations(id) ON DELETE CASCADE,
    model_id TEXT NOT NULL,
    trust_score NUMERIC(5,2),
    posture TEXT NOT NULL,
    pillar_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
    control_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
    evidence_coverage NUMERIC(5,2) DEFAULT 0.0,
    is_consensus BOOLEAN DEFAULT false,
    calculation_version TEXT DEFAULT '2.0.0-canonical',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trust_scores_asm ON public.trust_scores(assessment_id);
CREATE INDEX IF NOT EXISTS idx_trust_scores_model ON public.trust_scores(model_id);

-- Compatibility view for PascalCase "Trust_Scores"
CREATE OR REPLACE VIEW public."Trust_Scores" AS SELECT * FROM public.trust_scores;

-- ----------------------------------------------------------------------------
-- 10. Table: benchmark_runs (10-LLM Evaluation Run Logs)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.benchmark_runs (
    id TEXT PRIMARY KEY,                       -- e.g. "BENCH_ASM_1792336043260_r7oip"
    assessment_id TEXT REFERENCES public.assessments(id) ON DELETE SET NULL,
    organisation_id TEXT REFERENCES public.organisations(id) ON DELETE CASCADE,
    target_url TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('RUNNING', 'COMPLETE_10_OF_10', 'PARTIAL', 'FAILED', 'CANCELLED')),
    total_models_evaluated INT DEFAULT 0,
    models_evaluated JSONB NOT NULL DEFAULT '[]'::jsonb,
    models_unavailable JSONB NOT NULL DEFAULT '[]'::jsonb,
    per_model_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
    per_model_trust_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
    top_three_ranking JSONB NOT NULL DEFAULT '[]'::jsonb,
    consensus_result JSONB NOT NULL DEFAULT '{}'::jsonb,
    selection_mode TEXT,
    rag_snapshot_hash TEXT NOT NULL,
    legal_corpus_version TEXT NOT NULL DEFAULT '83-chunk-authoritative-v2',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_benchmark_runs_asm ON public.benchmark_runs(assessment_id);
CREATE INDEX IF NOT EXISTS idx_benchmark_runs_status ON public.benchmark_runs(status);

-- Compatibility view for PascalCase "Benchmark_Runs"
CREATE OR REPLACE VIEW public."Benchmark_Runs" AS SELECT * FROM public.benchmark_runs;

-- ----------------------------------------------------------------------------
-- 11. Table: model_evaluations (Per-Model Batch Execution Audit Logs)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.model_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    benchmark_id TEXT NOT NULL REFERENCES public.benchmark_runs(id) ON DELETE CASCADE,
    model_id TEXT NOT NULL,
    model_name TEXT NOT NULL,
    provider TEXT NOT NULL,
    status TEXT NOT NULL,
    duration_ms INT DEFAULT 0,
    is_real_inference BOOLEAN DEFAULT false,
    findings_count INT DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_model_evals_bench ON public.model_evaluations(benchmark_id);
CREATE INDEX IF NOT EXISTS idx_model_evals_model ON public.model_evaluations(model_id);

-- ----------------------------------------------------------------------------
-- 12. Row-Level Security (RLS) Configuration
-- ----------------------------------------------------------------------------
ALTER TABLE public.organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organisation_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trust_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.benchmark_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Legal_Chunks" ENABLE ROW LEVEL SECURITY;

-- Helper function: resolve allowed organizations for caller
CREATE OR REPLACE FUNCTION public.get_auth_user_organisations()
RETURNS SETOF text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT organisation_id 
    FROM public.organisation_memberships 
    WHERE user_id = auth.uid() 
       OR email = coalesce(auth.jwt() ->> 'email', '')
    UNION
    SELECT nullif(current_setting('app.current_org_id', true), '');
$$;

REVOKE ALL ON FUNCTION public.get_auth_user_organisations() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_auth_user_organisations() TO authenticated, service_role;

-- RLS: Legal Knowledge Base (Public read for all users, write restricted to service role)
CREATE POLICY "Public Read Legal Documents" ON public.legal_documents
    FOR SELECT USING (true);

CREATE POLICY "Public Read Legal Chunks" ON public."Legal_Chunks"
    FOR SELECT USING (true);

-- RLS: Organizations (Members can read their own organization details)
CREATE POLICY "Users Read Own Organisations" ON public.organisations
    FOR SELECT USING (
        id IN (SELECT public.get_auth_user_organisations())
        OR auth.role() = 'service_role'
    );

-- RLS: Assessments (Strict Tenant Isolation)
CREATE POLICY "Tenant Read Own Assessments" ON public.assessments
    FOR SELECT USING (
        organisation_id IN (SELECT public.get_auth_user_organisations())
        OR auth.role() = 'service_role'
    );

CREATE POLICY "Tenant Insert Own Assessments" ON public.assessments
    FOR INSERT WITH CHECK (
        organisation_id IN (SELECT public.get_auth_user_organisations())
        OR auth.role() = 'service_role'
    );

CREATE POLICY "Tenant Update Own Assessments" ON public.assessments
    FOR UPDATE USING (
        organisation_id IN (SELECT public.get_auth_user_organisations())
        OR auth.role() = 'service_role'
    );

-- RLS: Website Scans (Strict Tenant Isolation, no global anonymous enumeration)
CREATE POLICY "Tenant Read Own Scans" ON public.website_scans
    FOR SELECT USING (
        (organisation_id IS NOT NULL AND organisation_id IN (SELECT public.get_auth_user_organisations()))
        OR auth.role() = 'service_role'
    );

CREATE POLICY "Tenant Insert Own Scans" ON public.website_scans
    FOR INSERT WITH CHECK (
        organisation_id IN (SELECT public.get_auth_user_organisations())
        OR organisation_id IS NULL
        OR auth.role() = 'service_role'
    );

-- RLS: Evidence Records
CREATE POLICY "Tenant Read Own Evidence" ON public.evidence_records
    FOR SELECT USING (
        (organisation_id IS NOT NULL AND organisation_id IN (SELECT public.get_auth_user_organisations()))
        OR auth.role() = 'service_role'
    );

CREATE POLICY "Tenant Insert Own Evidence" ON public.evidence_records
    FOR INSERT WITH CHECK (
        organisation_id IN (SELECT public.get_auth_user_organisations())
        OR organisation_id IS NULL
        OR auth.role() = 'service_role'
    );

-- RLS: Risk Findings
CREATE POLICY "Tenant Read Own Findings" ON public.risk_findings
    FOR SELECT USING (
        (organisation_id IS NOT NULL AND organisation_id IN (SELECT public.get_auth_user_organisations()))
        OR auth.role() = 'service_role'
    );

CREATE POLICY "Tenant Insert Own Findings" ON public.risk_findings
    FOR INSERT WITH CHECK (
        organisation_id IN (SELECT public.get_auth_user_organisations())
        OR organisation_id IS NULL
        OR auth.role() = 'service_role'
    );

-- RLS: Trust Scores
CREATE POLICY "Tenant Read Own Scores" ON public.trust_scores
    FOR SELECT USING (
        (organisation_id IS NOT NULL AND organisation_id IN (SELECT public.get_auth_user_organisations()))
        OR auth.role() = 'service_role'
    );

CREATE POLICY "Tenant Insert Own Scores" ON public.trust_scores
    FOR INSERT WITH CHECK (
        organisation_id IN (SELECT public.get_auth_user_organisations())
        OR organisation_id IS NULL
        OR auth.role() = 'service_role'
    );

-- RLS: Benchmark Runs
CREATE POLICY "Tenant Read Benchmark Runs" ON public.benchmark_runs
    FOR SELECT USING (
        (organisation_id IS NOT NULL AND organisation_id IN (SELECT public.get_auth_user_organisations()))
        OR auth.role() = 'service_role'
    );

CREATE POLICY "Tenant Insert Benchmark Runs" ON public.benchmark_runs
    FOR INSERT WITH CHECK (
        auth.role() = 'service_role'
        OR organisation_id IN (SELECT public.get_auth_user_organisations())
        OR organisation_id IS NULL
    );

-- RLS: Model Evaluations
CREATE POLICY "Tenant Read Model Evaluations" ON public.model_evaluations
    FOR SELECT USING (
        auth.role() = 'service_role'
        OR benchmark_id IN (SELECT id FROM public.benchmark_runs WHERE organisation_id IN (SELECT public.get_auth_user_organisations()))
    );

CREATE POLICY "Tenant Insert Model Evaluations" ON public.model_evaluations
    FOR INSERT WITH CHECK (auth.role() = 'service_role');
