/**
 * Supabase PostgreSQL Client & Unified Data Service for TrustForge API.
 * Provides typed repository access for assessments, website_scans, risk_findings,
 * trust_scores, benchmark_runs, and legal_chunks with graceful local fallback.
 */
import dotenv from 'dotenv';
dotenv.config();

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { EvidenceItem, ModelFinding, ScanCheck, TrustScoreComputation, TOPSISRunResult } from '../types/index.js';
import {
  AssessmentRepository,
  ScanRepository,
  FindingRepository,
  TrustScoreRepository,
  BenchmarkRepository,
  TOPSISRepository,
  AssessmentRecord,
  BenchmarkRecord,
} from './repository.js';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
const EXPLICIT_MODE = (process.env.DATABASE_MODE || '').toLowerCase();

export class SupabaseDataService {
  private client: SupabaseClient | null = null;
  private mode: 'supabase' | 'local' = 'local';

  public assessments!: AssessmentRepository;
  public scans!: ScanRepository;
  public findings!: FindingRepository;
  public scores!: TrustScoreRepository;
  public benchmarks!: BenchmarkRepository;
  public topsis!: TOPSISRepository;

  constructor() {
    this.init();
  }

  private init(): void {
    const hasCredentials = Boolean(SUPABASE_URL && SUPABASE_SERVICE_KEY);

    if (EXPLICIT_MODE === 'supabase' && !hasCredentials) {
      console.warn('[Database] DATABASE_MODE is set to "supabase" but SUPABASE_URL / keys are missing. Falling back to local store.');
      this.mode = 'local';
    } else if (hasCredentials && EXPLICIT_MODE !== 'local') {
      try {
        this.client = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
          auth: { persistSession: false, autoRefreshToken: false },
        });
        this.mode = 'supabase';
        console.log(`[Database] Storage Mode: SUPABASE (Connected to ${new URL(SUPABASE_URL).hostname})`);
      } catch (err) {
        console.warn('[Database] Could not initialize Supabase client, using local store:', err);
        this.mode = 'local';
      }
    } else {
      this.mode = 'local';
      console.log('[Database] Storage Mode: LOCAL (Durable Disk Store api/data/*.json)');
    }

    this.assessments = new AssessmentRepository(this.client, this.mode);
    this.scans = new ScanRepository(this.client, this.mode);
    this.findings = new FindingRepository(this.client, this.mode);
    this.scores = new TrustScoreRepository(this.client, this.mode);
    this.benchmarks = new BenchmarkRepository(this.client, this.mode);
    this.topsis = new TOPSISRepository(this.client, this.mode);
  }

  public getMode(): 'supabase' | 'local' {
    return this.mode;
  }

  public getClient(): SupabaseClient | null {
    return this.client;
  }

  // --- Backwards-Compatible Service Methods ---
  public async saveScan(scan: {
    scanId: string;
    url: string;
    checks: ScanCheck[];
    evidence: EvidenceItem[];
    preliminaryScore: number;
    posture: string;
    durationMs: number;
  }): Promise<void> {
    await this.scans.createScan(scan);
  }

  public async getScan(scanId: string): Promise<any | null> {
    return this.scans.getScan(scanId);
  }

  public async saveFindings(scanId: string, modelId: string, findings: ModelFinding[], orgId?: string): Promise<void> {
    await this.findings.saveFindings(scanId, modelId, findings, orgId);
  }

  public async getFindings(scanId: string, modelId?: string): Promise<ModelFinding[]> {
    return this.findings.getFindings(scanId, modelId);
  }

  public async saveTrustScore(scanId: string, score: TrustScoreComputation): Promise<void> {
    await this.scores.saveTrustScore(scanId, score);
  }

  public async getTrustScore(scanId: string, modelId?: string): Promise<TrustScoreComputation | null> {
    return this.scores.getTrustScore(scanId, modelId);
  }

  public async saveAssessment(job: AssessmentRecord): Promise<void> {
    await this.assessments.createAssessment(job);
  }

  public async updateAssessment(id: string, patch: Partial<AssessmentRecord>): Promise<void> {
    await this.assessments.updateAssessment(id, patch);
  }

  public async getAssessment(id: string): Promise<AssessmentRecord | null> {
    return this.assessments.getAssessment(id);
  }

  public async listAssessments(): Promise<AssessmentRecord[]> {
    return this.assessments.listAssessments();
  }

  public async saveBenchmark(benchmark: BenchmarkRecord): Promise<void> {
    await this.benchmarks.saveBenchmark(benchmark);
  }

  public async getBenchmark(id: string, orgId?: string): Promise<BenchmarkRecord | null> {
    return this.benchmarks.getBenchmark(id, orgId);
  }

  public async listBenchmarks(orgId?: string, isSuperAdmin?: boolean): Promise<BenchmarkRecord[]> {
    return this.benchmarks.listBenchmarks(orgId, isSuperAdmin);
  }

  public async saveTOPSISRun(run: TOPSISRunResult): Promise<void> {
    await this.topsis.saveTOPSISRun(run);
  }

  public async getTOPSISRun(id: string, orgId?: string): Promise<TOPSISRunResult | null> {
    return this.topsis.getTOPSISRun(id, orgId);
  }

  public async listTOPSISRuns(orgId?: string, isSuperAdmin?: boolean): Promise<TOPSISRunResult[]> {
    return this.topsis.listTOPSISRuns(orgId, isSuperAdmin);
  }
}

export const db = new SupabaseDataService();
