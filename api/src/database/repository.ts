/**
 * TrustForge Database Repositories & Data Access Interfaces.
 * Supports both Cloud Supabase PostgreSQL and Durable Local Store with zero data loss.
 */
import { SupabaseClient } from '@supabase/supabase-js';
import { durableStore } from './durableStore.js';
import { EvidenceItem, ModelFinding, ScanCheck, TrustScoreComputation, TOPSISRunResult } from '../types/index.js';

export interface AssessmentRecord {
  assessment_id: string;
  org_id: string;
  website_url: string;
  status: 'in_progress' | 'complete' | 'completed' | 'failed';
  progress: number;
  current_step?: string;
  trust_score?: number | null;
  raw_trust_score?: number | null;
  posture?: string;
  evidence_coverage?: number;
  pillar_scores?: any[];
  category_scores?: any;
  critical_failure_cap_applied?: boolean;
  critical_failure_reasons?: string[];
  methodology_version?: string;
  findings?: any[];
  evidence?: EvidenceItem[];
  rag_execution_trace?: any;
  retrieval_explorer?: any[];
  evidence_to_verdict_trace?: any[];
  model_executions?: any[];
  frozen_snapshot_hash?: string;
  benchmark_id?: string;
  benchmark_status?: string;
  models_evaluated?: string[];
  models_unavailable?: any[];
  selection_mode?: string;
  total_controls?: number;
  pass_count?: number;
  potential_gap_count?: number;
  fail_count?: number;
  insufficient_evidence_count?: number;
  error?: string;
  created_at?: string;
  completed_at?: string;
}

export interface ScanRecord {
  id: string;
  assessment_id?: string;
  organisation_id?: string;
  target_url: string;
  resolved_ip?: string;
  status: string;
  scan_checks: ScanCheck[];
  evidence_items: EvidenceItem[];
  preliminary_score: number;
  posture: string;
  duration_ms: number;
  error_message?: string;
  created_at?: string;
}

export interface BenchmarkRecord {
  benchmark_id: string;
  org_id?: string;
  organisation_id?: string;
  scan_id?: string;
  assessment_id?: string;
  target_url: string;
  status: string;
  total_models_evaluated: number;
  models_evaluated: string[];
  models_unavailable: any[];
  per_model_metrics: Record<string, any>;
  per_model_trust_scores: Record<string, any>;
  top_three_ranking: any[];
  consensus_result: any;
  selection_mode?: string;
  rag_snapshot_hash: string;
  rag_retrieval_algorithm?: string;
  rag_retrieval_mode?: string;
  legal_corpus_version: string;
  parallel_orchestration?: any;
  created_at: string;
}

// ----------------------------------------------------------------------------
// Assessment Repository
// ----------------------------------------------------------------------------
export class AssessmentRepository {
  constructor(private client: SupabaseClient | null, private mode: 'supabase' | 'local') {}

  async createAssessment(job: AssessmentRecord): Promise<void> {
    durableStore.setAssessment(job.assessment_id, job);

    if (this.mode === 'supabase' && this.client) {
      try {
        await this.client.from('assessments').insert({
          id: job.assessment_id,
          organisation_id: job.org_id || null,
          website_url: job.website_url,
          status: job.status,
          progress: job.progress,
          current_step: job.current_step,
          created_at: job.created_at || new Date().toISOString(),
        });
      } catch (err) {
        console.warn('[AssessmentRepository] Supabase insert failed:', err);
      }
    }
  }

  async updateAssessment(id: string, patch: Partial<AssessmentRecord>): Promise<void> {
    const existing = durableStore.getAssessment(id) || {};
    const updated = { ...existing, ...patch };
    durableStore.setAssessment(id, updated);

    if (this.mode === 'supabase' && this.client) {
      try {
        await this.client.from('assessments').update({
          status: updated.status,
          progress: updated.progress,
          current_step: updated.current_step,
          trust_score: updated.trust_score,
          posture: updated.posture,
          evidence_coverage: updated.evidence_coverage,
          pillar_scores: updated.pillar_scores,
          selection_mode: updated.selection_mode,
          benchmark_id: updated.benchmark_id,
          benchmark_status: updated.benchmark_status,
          models_evaluated: updated.models_evaluated,
          models_unavailable: updated.models_unavailable,
          total_controls: updated.total_controls,
          pass_count: updated.pass_count,
          potential_gap_count: updated.potential_gap_count,
          fail_count: updated.fail_count,
          insufficient_evidence_count: updated.insufficient_evidence_count,
          error: updated.error,
          completed_at: updated.completed_at,
        }).eq('id', id);
      } catch (err) {
        console.warn('[AssessmentRepository] Supabase update failed:', err);
      }
    }
  }

  async getAssessment(id: string): Promise<AssessmentRecord | null> {
    if (this.mode === 'supabase' && this.client && id !== 'latest') {
      try {
        const { data, error } = await this.client.from('assessments').select('*').eq('id', id).single();
        if (data && !error) {
          const localFallback = durableStore.getAssessment(id) || {};
          return { ...localFallback, ...data, assessment_id: data.id, org_id: data.organisation_id };
        }
      } catch (err) {
        console.warn('[AssessmentRepository] Supabase get failed, falling back to local store:', err);
      }
    }
    return durableStore.getAssessment(id) || null;
  }

  async listAssessments(): Promise<AssessmentRecord[]> {
    if (this.mode === 'supabase' && this.client) {
      try {
        const { data, error } = await this.client.from('assessments').select('*').order('created_at', { ascending: false });
        if (data && !error && data.length > 0) {
          return data.map(d => ({
            assessment_id: d.id,
            org_id: d.organisation_id,
            website_url: d.website_url,
            status: d.status,
            progress: d.progress,
            trust_score: d.trust_score !== null && d.trust_score !== undefined ? parseFloat(d.trust_score) : null,
            posture: d.posture,
            created_at: d.created_at,
            completed_at: d.completed_at,
          }));
        }
      } catch (err) {
        console.warn('[AssessmentRepository] Supabase list failed:', err);
      }
    }
    return durableStore.listAssessments();
  }
}

// ----------------------------------------------------------------------------
// Scan Repository
// ----------------------------------------------------------------------------
export class ScanRepository {
  constructor(private client: SupabaseClient | null, private mode: 'supabase' | 'local') {}

  async createScan(scan: any): Promise<void> {
    durableStore.setScan(scan.scanId || scan.id, scan);

    if (this.mode === 'supabase' && this.client) {
      try {
        await this.client.from('website_scans').upsert({
          id: scan.scanId || scan.id,
          organisation_id: scan.org_id || scan.organisation_id || null,
          target_url: scan.url || scan.target_url,
          status: scan.status || 'completed',
          scan_checks: scan.checks || scan.scan_checks || [],
          evidence_items: scan.evidence || scan.evidence_items || [],
          preliminary_score: scan.preliminaryScore || scan.preliminary_score || 0,
          posture: scan.posture || 'Needs Attention',
          duration_ms: scan.durationMs || scan.duration_ms || 0,
          error_message: scan.error || scan.error_message,
        });
      } catch (err) {
        console.warn('[ScanRepository] Supabase upsert failed:', err);
      }
    }
  }

  async getScan(id: string): Promise<any | null> {
    if (this.mode === 'supabase' && this.client) {
      try {
        const { data, error } = await this.client.from('website_scans').select('*').eq('id', id).single();
        if (data && !error) return data;
      } catch (err) {
        console.warn('[ScanRepository] Supabase get failed:', err);
      }
    }
    return durableStore.getScan(id) || null;
  }
}

// ----------------------------------------------------------------------------
// Findings Repository
// ----------------------------------------------------------------------------
export class FindingRepository {
  constructor(private client: SupabaseClient | null, private mode: 'supabase' | 'local') {}

  async saveFindings(scanId: string, modelId: string, findings: ModelFinding[], explicitOrgId?: string): Promise<void> {
    durableStore.setFindings(`${scanId}_${modelId}`, findings);

    if (this.mode === 'supabase' && this.client) {
      try {
        const resolvedOrgId = explicitOrgId ||
          (scanId.startsWith('ASM_') ? durableStore.getAssessment(scanId)?.org_id : null) ||
          (scanId.startsWith('SCAN_') ? durableStore.getScan(scanId)?.org_id : null) ||
          null;

        const rows = findings.map(f => ({
          assessment_id: scanId.startsWith('ASM_') ? scanId : null,
          scan_id: scanId.startsWith('SCAN_') ? scanId : null,
          organisation_id: resolvedOrgId,
          control_id: f.control_id,
          model_id: modelId,
          verdict: f.verdict,
          severity: f.verdict === 'NOT_SUPPORTED' ? 'HIGH' : 'MEDIUM',
          title: f.control_id,
          finding: f.reasoning_summary || 'Compliance check result',
          explanation: f.reasoning_summary || 'Compliance check result',
          recommendation: (f.remediation_steps || []).join('; '),
          statutory_reference: f.legal_citations?.[0]?.section || 'DPDP Act 2023',
          evidence_ids: f.evidence_ids || [],
          citations: f.legal_citations || [],
          confidence: f.confidence || 1.0,
          is_grounded: f.is_grounded ?? true,
          grounding_score: f.grounding_score ?? 1.0,
        }));
        await this.client.from('risk_findings').insert(rows);
      } catch (err) {
        console.warn('[FindingRepository] Supabase insert failed:', err);
      }
    }
  }

  async getFindings(scanId: string, modelId?: string): Promise<ModelFinding[]> {
    if (this.mode === 'supabase' && this.client) {
      try {
        let q = this.client.from('risk_findings').select('*');
        if (scanId.startsWith('ASM_')) q = q.eq('assessment_id', scanId);
        else q = q.eq('scan_id', scanId);
        if (modelId) q = q.eq('model_id', modelId);

        const { data, error } = await q;
        if (data && !error && data.length > 0) {
          return data.map(d => ({
            model_id: d.model_id,
            control_id: d.control_id,
            verdict: d.verdict,
            confidence: d.confidence,
            legal_citations: d.citations,
            evidence_ids: d.evidence_ids,
            reasoning_summary: d.explanation,
            identified_gaps: [],
            remediation_steps: d.recommendation ? d.recommendation.split('; ') : [],
            is_grounded: d.is_grounded,
            grounding_score: d.grounding_score,
          }));
        }
      } catch (err) {
        console.warn('[FindingRepository] Supabase get failed:', err);
      }
    }
    return durableStore.getFindings(scanId, modelId);
  }
}

// ----------------------------------------------------------------------------
// Trust Score Repository
// ----------------------------------------------------------------------------
export class TrustScoreRepository {
  constructor(private client: SupabaseClient | null, private mode: 'supabase' | 'local') {}

  async saveTrustScore(scanId: string, score: TrustScoreComputation): Promise<void> {
    durableStore.setScore(scanId, score.model_id, score);

    if (this.mode === 'supabase' && this.client) {
      try {
        const resolvedOrgId = score.org_id ||
          (scanId.startsWith('ASM_') ? durableStore.getAssessment(scanId)?.org_id : null) ||
          (scanId.startsWith('SCAN_') ? durableStore.getScan(scanId)?.org_id : null) ||
          null;

        await this.client.from('trust_scores').insert({
          assessment_id: scanId.startsWith('ASM_') ? scanId : null,
          scan_id: scanId.startsWith('SCAN_') ? scanId : null,
          organisation_id: resolvedOrgId,
          model_id: score.model_id,
          trust_score: score.trust_score,
          posture: score.posture,
          pillar_scores: score.pillar_scores,
          evidence_coverage: score.evidence_coverage,
          is_consensus: score.is_consensus ?? false,
        });
      } catch (err) {
        console.warn('[TrustScoreRepository] Supabase insert failed:', err);
      }
    }
  }

  async getTrustScore(scanId: string, modelId?: string): Promise<TrustScoreComputation | null> {
    if (this.mode === 'supabase' && this.client) {
      try {
        let q = this.client.from('trust_scores').select('*');
        if (scanId.startsWith('ASM_')) q = q.eq('assessment_id', scanId);
        else q = q.eq('scan_id', scanId);
        if (modelId) q = q.eq('model_id', modelId);

        const { data, error } = await q.order('created_at', { ascending: false }).limit(1).single();
        if (data && !error) {
          return {
            model_id: data.model_id,
            trust_score: data.trust_score != null ? parseFloat(data.trust_score) : null,
            posture: data.posture,
            pillar_scores: data.pillar_scores,
            evidence_coverage: parseFloat(data.evidence_coverage || 0),
            is_consensus: data.is_consensus,
          };
        }
      } catch (err) {
        console.warn('[TrustScoreRepository] Supabase get failed:', err);
      }
    }
    return durableStore.getScore(scanId, modelId) || null;
  }
}

// ----------------------------------------------------------------------------
// Benchmark Repository
// ----------------------------------------------------------------------------
export class BenchmarkRepository {
  constructor(private client: SupabaseClient | null, private mode: 'supabase' | 'local') {}

  async saveBenchmark(benchmark: BenchmarkRecord): Promise<void> {
    durableStore.setBenchmark(benchmark.benchmark_id, benchmark);

    if (this.mode === 'supabase' && this.client) {
      try {
        const resolvedOrgId = benchmark.org_id || benchmark.organisation_id ||
          (benchmark.assessment_id ? durableStore.getAssessment(benchmark.assessment_id)?.org_id : null) ||
          null;

        await this.client.from('benchmark_runs').upsert({
          id: benchmark.benchmark_id,
          assessment_id: benchmark.assessment_id,
          organisation_id: resolvedOrgId,
          target_url: benchmark.target_url,
          status: benchmark.status,
          total_models_evaluated: benchmark.total_models_evaluated,
          models_evaluated: benchmark.models_evaluated,
          models_unavailable: benchmark.models_unavailable,
          per_model_metrics: benchmark.per_model_metrics,
          per_model_trust_scores: benchmark.per_model_trust_scores,
          top_three_ranking: benchmark.top_three_ranking,
          consensus_result: benchmark.consensus_result,
          selection_mode: benchmark.selection_mode,
          rag_snapshot_hash: benchmark.rag_snapshot_hash,
          legal_corpus_version: benchmark.legal_corpus_version,
          created_at: benchmark.created_at || new Date().toISOString(),
        });
      } catch (err) {
        console.warn('[BenchmarkRepository] Supabase upsert failed:', err);
      }
    }
  }

  async getBenchmark(id: string, orgId?: string): Promise<BenchmarkRecord | null> {
    if (this.mode === 'supabase' && this.client) {
      try {
        if (id === 'latest') {
          let query = this.client.from('benchmark_runs').select('*').order('created_at', { ascending: false });
          if (orgId) {
            query = query.eq('organisation_id', orgId);
          }
          const { data, error } = await query.limit(1).maybeSingle();
          if (data && !error) return { ...data, benchmark_id: data.id, org_id: data.organisation_id };
        } else {
          let query = this.client.from('benchmark_runs').select('*').eq('id', id);
          if (orgId) {
            query = query.eq('organisation_id', orgId);
          }
          const { data, error } = await query.maybeSingle();
          if (data && !error) return { ...data, benchmark_id: data.id, org_id: data.organisation_id };
        }
      } catch (err) {
        console.warn('[BenchmarkRepository] Supabase get failed:', err);
      }
    }
    return durableStore.getBenchmark(id, orgId) || null;
  }

  async listBenchmarks(orgId?: string, isSuperAdmin?: boolean): Promise<BenchmarkRecord[]> {
    if (this.mode === 'supabase' && this.client) {
      try {
        let query = this.client.from('benchmark_runs').select('*').order('created_at', { ascending: false });
        if (orgId && !isSuperAdmin) {
          query = query.eq('organisation_id', orgId);
        }
        const { data, error } = await query;
        if (data && !error && data.length > 0) {
          return data.map(d => ({ ...d, benchmark_id: d.id, org_id: d.organisation_id }));
        }
      } catch (err) {
        console.warn('[BenchmarkRepository] Supabase list failed:', err);
      }
    }
    return durableStore.listBenchmarks(orgId, isSuperAdmin);
  }
}

// ----------------------------------------------------------------------------
// TOPSIS Repository
// ----------------------------------------------------------------------------
export class TOPSISRepository {
  constructor(private client: SupabaseClient | null, private mode: 'supabase' | 'local') {}

  async saveTOPSISRun(run: TOPSISRunResult): Promise<void> {
    durableStore.setTOPSISRun(run.run_id, run);

    if (this.mode === 'supabase' && this.client) {
      try {
        await this.client.from('topsis_runs').upsert({
          id: run.run_id,
          benchmark_id: run.benchmark_source_id || null,
          organisation_id: (run as any).org_id || null,
          profile_id: run.profile_used?.profile_id || 'unknown',
          execution_mode: run.execution_mode,
          top_model_id: run.top_model_id,
          top_three_model_ids: run.top_three_model_ids,
          eligible_models_count: run.eligible_models_count,
          ineligible_models_count: run.ineligible_models_count,
          ranked_models: run.ranked_models,
          sensitivity_analysis: run.sensitivity_analysis,
          created_at: run.created_at || new Date().toISOString(),
        });
      } catch (err) {
        console.warn('[TOPSISRepository] Supabase upsert failed:', err);
      }
    }
  }

  async getTOPSISRun(id: string, orgId?: string): Promise<TOPSISRunResult | null> {
    if (this.mode === 'supabase' && this.client) {
      try {
        if (id === 'latest') {
          let query = this.client.from('topsis_runs').select('*').order('created_at', { ascending: false });
          if (orgId) {
            query = query.eq('organisation_id', orgId);
          }
          const { data, error } = await query.limit(1).maybeSingle();
          if (data && !error) return { ...data, run_id: data.id, org_id: data.organisation_id };
        } else {
          let query = this.client.from('topsis_runs').select('*').eq('id', id);
          if (orgId) {
            query = query.eq('organisation_id', orgId);
          }
          const { data, error } = await query.maybeSingle();
          if (data && !error) return { ...data, run_id: data.id, org_id: data.organisation_id };
        }
      } catch (err) {
        console.warn('[TOPSISRepository] Supabase get failed:', err);
      }
    }
    return durableStore.getTOPSISRun(id, orgId) || null;
  }

  async listTOPSISRuns(orgId?: string, isSuperAdmin?: boolean): Promise<TOPSISRunResult[]> {
    if (this.mode === 'supabase' && this.client) {
      try {
        let query = this.client.from('topsis_runs').select('*').order('created_at', { ascending: false });
        if (orgId && !isSuperAdmin) {
          query = query.eq('organisation_id', orgId);
        }
        const { data, error } = await query;
        if (data && !error && data.length > 0) {
          return data.map(d => ({ ...d, run_id: d.id, org_id: d.organisation_id }));
        }
      } catch (err) {
        console.warn('[TOPSISRepository] Supabase list failed:', err);
      }
    }
    return durableStore.listTOPSISRuns(orgId, isSuperAdmin);
  }
}
