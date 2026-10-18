/**
 * Supabase PostgreSQL Client & Local Hybrid Store for TrustForge API.
 * Provides unified interface for Website_Scans, Risk_Findings, Trust_Scores, and Legal_Chunks.
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { EvidenceItem, ModelFinding, ScanCheck, TrustScoreComputation } from '../types/index.js';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

class SupabaseDataService {
  private client: SupabaseClient | null = null;
  private localScans = new Map<string, any>();
  private localFindings = new Map<string, ModelFinding[]>();
  private localScores = new Map<string, TrustScoreComputation>();

  constructor() {
    if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
      try {
        this.client = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
        console.log('Connected to Supabase PostgreSQL cloud database.');
      } catch (err) {
        console.warn('Could not initialize Supabase client:', err);
      }
    } else {
      console.log('Supabase credentials not configured in environment. Using local high-speed state store.');
    }
  }

  public async saveScan(scan: {
    scanId: string;
    url: string;
    checks: ScanCheck[];
    evidence: EvidenceItem[];
    preliminaryScore: number;
    posture: string;
    durationMs: number;
  }): Promise<void> {
    this.localScans.set(scan.scanId, scan);

    if (this.client) {
      try {
        await this.client.from('Website_Scans').upsert({
          id: scan.scanId,
          target_url: scan.url,
          status: 'completed',
          scan_checks: scan.checks,
          evidence_items: scan.evidence,
          preliminary_score: scan.preliminaryScore,
          posture: scan.posture,
          duration_ms: scan.durationMs,
        });
      } catch (err) {
        console.warn('Supabase saveScan failed:', err);
      }
    }
  }

  public async getScan(scanId: string): Promise<any | null> {
    if (this.client) {
      try {
        const { data, error } = await this.client
          .from('Website_Scans')
          .select('*')
          .eq('id', scanId)
          .single();
        if (data && !error) return data;
      } catch (err) {
        console.warn('Supabase getScan failed:', err);
      }
    }
    return this.localScans.get(scanId) || null;
  }

  public async saveFindings(scanId: string, modelId: string, findings: ModelFinding[]): Promise<void> {
    const key = `${scanId}_${modelId}`;
    this.localFindings.set(key, findings);

    if (this.client) {
      try {
        const rows = findings.map(f => ({
          scan_id: scanId,
          control_id: f.control_id,
          model_id: modelId,
          verdict: f.verdict,
          severity: 'MEDIUM',
          finding: f.reasoning_summary,
          explanation: f.reasoning_summary,
          recommendation: f.remediation_steps.join('; '),
          evidence_ids: f.evidence_ids,
          citations: f.legal_citations,
          confidence: f.confidence,
          is_grounded: f.is_grounded ?? true,
        }));
        await this.client.from('Risk_Findings').insert(rows);
      } catch (err) {
        console.warn('Supabase saveFindings failed:', err);
      }
    }
  }

  public async getFindings(scanId: string, modelId?: string): Promise<ModelFinding[]> {
    if (this.client) {
      try {
        let q = this.client.from('Risk_Findings').select('*').eq('scan_id', scanId);
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
            remediation_steps: d.recommendation ? [d.recommendation] : [],
            is_grounded: d.is_grounded,
          }));
        }
      } catch (err) {
        console.warn('Supabase getFindings failed:', err);
      }
    }

    if (modelId) {
      return this.localFindings.get(`${scanId}_${modelId}`) || [];
    }
    // Return all findings for this scanId
    const res: ModelFinding[] = [];
    for (const [k, v] of this.localFindings.entries()) {
      if (k.startsWith(scanId)) res.push(...v);
    }
    return res;
  }

  public async saveTrustScore(scanId: string, score: TrustScoreComputation): Promise<void> {
    this.localScores.set(`${scanId}_${score.model_id}`, score);

    if (this.client) {
      try {
        await this.client.from('Trust_Scores').insert({
          scan_id: scanId,
          model_id: score.model_id,
          trust_score: score.trust_score,
          posture: score.posture,
          pillar_scores: score.pillar_scores,
          evidence_coverage: score.evidence_coverage,
          is_consensus: score.is_consensus ?? false,
        });
      } catch (err) {
        console.warn('Supabase saveTrustScore failed:', err);
      }
    }
  }

  public async getTrustScore(scanId: string, modelId: string = 'TOP3_CONSENSUS'): Promise<TrustScoreComputation | null> {
    if (this.client) {
      try {
        const { data, error } = await this.client
          .from('Trust_Scores')
          .select('*')
          .eq('scan_id', scanId)
          .eq('model_id', modelId)
          .order('calculated_at', { ascending: false })
          .limit(1)
          .single();
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
        console.warn('Supabase getTrustScore failed:', err);
      }
    }

    return this.localScores.get(`${scanId}_${modelId}`) || null;
  }
}

export const db = new SupabaseDataService();
