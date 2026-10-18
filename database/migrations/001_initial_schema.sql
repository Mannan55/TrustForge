-- ============================================================================
-- TRUSTFORGE — SUPABASE POSTGRESQL + PGVECTOR INITIAL SCHEMA MIGRATION
-- Project: TrustForge Research-Grade DPDP Compliance Platform
-- ============================================================================

-- Enable essential extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ----------------------------------------------------------------------------
-- 1. Table: Legal_Chunks (Statutory Knowledge Base & Vector Store)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public."Legal_Chunks" (
    id TEXT PRIMARY KEY,                       -- e.g. "ACT2023_SEC_005_001"
    document_id TEXT NOT NULL,                 -- e.g. "dpdp-act-2023", "dpdp-rules-2025"
    document_title TEXT NOT NULL,
    chapter_num INT,
    chapter_title TEXT,
    section_num TEXT,                          -- e.g. "Section 5", "Rule 3"
    section_title TEXT,
    chunk_text TEXT NOT NULL,
    token_count INT,
    commencement_status TEXT NOT NULL,         -- "ENFORCEABLE", "PHASED_2026", "PHASED_2027"
    enforceable_date DATE,
    source_url TEXT,
    sha256 TEXT,
    embedding vector(384),                     -- 384-dimensional vector from all-MiniLM-L6-v2
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for Legal_Chunks
CREATE INDEX IF NOT EXISTS idx_legal_chunks_doc ON public."Legal_Chunks"(document_id);
CREATE INDEX IF NOT EXISTS idx_legal_chunks_commencement ON public."Legal_Chunks"(commencement_status);
CREATE INDEX IF NOT EXISTS idx_legal_chunks_vector ON public."Legal_Chunks" 
USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);

-- Full-text search index for hybrid retrieval
ALTER TABLE public."Legal_Chunks" ADD COLUMN IF NOT EXISTS fts_tsv tsvector 
GENERATED ALWAYS AS (to_tsvector('english', chunk_text)) STORED;
CREATE INDEX IF NOT EXISTS idx_legal_chunks_fts ON public."Legal_Chunks" USING gin(fts_tsv);


-- ----------------------------------------------------------------------------
-- 2. Table: Website_Scans (Core Paper Entity)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public."Website_Scans" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    target_url TEXT NOT NULL,
    resolved_ip TEXT,
    status TEXT NOT NULL CHECK (status IN ('pending', 'crawling', 'completed', 'failed')),
    scan_checks JSONB NOT NULL DEFAULT '[]'::jsonb,
    evidence_items JSONB NOT NULL DEFAULT '[]'::jsonb,
    preliminary_score INT DEFAULT 0,
    posture TEXT DEFAULT 'Needs Attention',
    scanned_at TIMESTAMPTZ DEFAULT NOW(),
    duration_ms INT DEFAULT 0,
    error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_website_scans_user ON public."Website_Scans"(user_id);
CREATE INDEX IF NOT EXISTS idx_website_scans_url ON public."Website_Scans"(target_url);


-- ----------------------------------------------------------------------------
-- 3. Table: Risk_Findings (Core Paper Entity)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public."Risk_Findings" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_id UUID REFERENCES public."Website_Scans"(id) ON DELETE CASCADE,
    assessment_id UUID,
    control_id TEXT NOT NULL,
    model_id TEXT NOT NULL,                    -- "M01" through "M10" or "CONSENSUS"
    verdict TEXT NOT NULL CHECK (verdict IN (
        'SUPPORTED', 'PARTIALLY_SUPPORTED', 'NOT_SUPPORTED', 'INSUFFICIENT_EVIDENCE', 'NOT_APPLICABLE'
    )),
    severity TEXT NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    finding TEXT NOT NULL,
    explanation TEXT NOT NULL,
    recommendation TEXT,
    evidence_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    citations JSONB NOT NULL DEFAULT '[]'::jsonb,
    confidence NUMERIC(4,3) DEFAULT 1.0,
    is_grounded BOOLEAN DEFAULT true,
    evaluation_method TEXT DEFAULT 'RAG_GROUNDED_LLM',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_risk_findings_scan ON public."Risk_Findings"(scan_id);
CREATE INDEX IF NOT EXISTS idx_risk_findings_model ON public."Risk_Findings"(model_id);
CREATE INDEX IF NOT EXISTS idx_risk_findings_control ON public."Risk_Findings"(control_id);


-- ----------------------------------------------------------------------------
-- 4. Table: Trust_Scores (Core Paper Entity)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public."Trust_Scores" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_id UUID REFERENCES public."Website_Scans"(id) ON DELETE CASCADE,
    assessment_id UUID,
    model_id TEXT NOT NULL,                    -- "M01" through "M10" or "TOP3_MAJORITY_VOTE"
    trust_score NUMERIC(5,2),
    posture TEXT NOT NULL,
    pillar_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
    control_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
    evidence_coverage NUMERIC(5,2) DEFAULT 0.0,
    is_consensus BOOLEAN DEFAULT false,
    calculated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trust_scores_scan ON public."Trust_Scores"(scan_id);
CREATE INDEX IF NOT EXISTS idx_trust_scores_model ON public."Trust_Scores"(model_id);


-- ----------------------------------------------------------------------------
-- 5. Table: Benchmark_Runs (10-LLM Evaluation Run Logs)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public."Benchmark_Runs" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_name TEXT NOT NULL,
    dataset_version TEXT NOT NULL,
    legal_corpus_version TEXT NOT NULL,
    total_models INT DEFAULT 10,
    active_models JSONB NOT NULL DEFAULT '[]'::jsonb,
    status TEXT NOT NULL CHECK (status IN ('in_progress', 'completed', 'partial', 'failed')),
    per_model_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
    top_three_ranking JSONB DEFAULT '[]'::jsonb,
    consensus_score NUMERIC(5,2),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    error_summary TEXT
);


-- ----------------------------------------------------------------------------
-- 6. Row-Level Security (RLS) Policies
-- ----------------------------------------------------------------------------
ALTER TABLE public."Website_Scans" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Risk_Findings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Trust_Scores" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Benchmark_Runs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Legal_Chunks" ENABLE ROW LEVEL SECURITY;

-- Legal chunks: Publicly readable by all authenticated users and anon clients
CREATE POLICY "Public Read Legal Chunks" ON public."Legal_Chunks"
    FOR SELECT USING (true);

-- Website scans: Users can read and insert their own scans; anon can read public scans
CREATE POLICY "Users Read Own Scans" ON public."Website_Scans"
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users Create Own Scans" ON public."Website_Scans"
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users Update Own Scans" ON public."Website_Scans"
    FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

-- Risk findings & Trust scores: Readable if the parent scan is accessible
CREATE POLICY "Users Read Own Findings" ON public."Risk_Findings"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public."Website_Scans" s 
            WHERE s.id = "Risk_Findings".scan_id 
            AND (s.user_id = auth.uid() OR s.user_id IS NULL)
        )
    );

CREATE POLICY "Users Read Own Scores" ON public."Trust_Scores"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public."Website_Scans" s 
            WHERE s.id = "Trust_Scores".scan_id 
            AND (s.user_id = auth.uid() OR s.user_id IS NULL)
        )
    );

-- Benchmark runs: Read-only for authenticated research users
CREATE POLICY "Research Read Benchmark Runs" ON public."Benchmark_Runs"
    FOR SELECT USING (true);
