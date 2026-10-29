/**
 * Durable Local Store for TrustForge API.
 * Ensures zero data loss across server restarts, tsx watch reloads, or process crashes.
 * Automatically persists assessments, scans, findings, and scores to disk.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Candidate paths for data dir (searches relative to module location and CWD)
const candidateDataDirs = [
  path.resolve(__dirname, '../../data'),
  path.resolve(process.cwd(), 'TrustForge/api/data'),
  path.resolve(process.cwd(), 'api/data'),
  path.resolve(process.cwd(), 'data'),
];

let DATA_DIR = candidateDataDirs[0];
for (const dir of candidateDataDirs) {
  if (fs.existsSync(dir) && fs.existsSync(path.join(dir, 'assessments.json'))) {
    DATA_DIR = dir;
    break;
  }
}

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (err) {
    console.warn('Could not create data dir:', err);
  }
}

function loadJsonFile<T>(filename: string, defaultValue: T): T {
  const filepath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filepath)) return defaultValue;
  try {
    const raw = fs.readFileSync(filepath, 'utf-8');
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`Error reading ${filename}, using default:`, err);
    return defaultValue;
  }
}

function saveJsonFile(filename: string, data: any): void {
  const filepath = path.join(DATA_DIR, filename);
  const tmpPath = `${filepath}.tmp.${process.pid}.${Date.now()}.${Math.random().toString(36).substring(2, 7)}`;
  try {
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
    let renamed = false;
    let lastErr: any = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        fs.renameSync(tmpPath, filepath);
        renamed = true;
        break;
      } catch (err: any) {
        lastErr = err;
        if (err.code === 'EPERM' || err.code === 'EBUSY') {
          try {
            fs.copyFileSync(tmpPath, filepath);
            fs.unlinkSync(tmpPath);
            renamed = true;
            break;
          } catch {
            const start = Date.now();
            while (Date.now() - start < 15) {}
          }
        } else {
          throw err;
        }
      }
    }
    if (!renamed && lastErr) {
      throw lastErr;
    }
  } catch (err) {
    console.error(`[DurableStore] Error saving ${filename}:`, err);
    try {
      if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    } catch {
      // ignore cleanup failure
    }
    throw err;
  }
}

export class DurableStore {
  private assessments: Map<string, any>;
  private scans: Map<string, any>;
  private findings: Map<string, any[]>;
  private scores: Map<string, any>;
  private benchmarks: Map<string, any>;
  private topsisRuns: Map<string, any>;
  private evaluationRuns: Map<string, any>;
  private users: Map<string, any>;
  private revokedTokens: Set<string>;
  private organizations: Map<string, any>;
  private domainChallenges: Map<string, any>;

  constructor() {
    const loadedAssessments = loadJsonFile<Record<string, any>>('assessments.json', {});
    const loadedScans = loadJsonFile<Record<string, any>>('scans.json', {});
    const loadedFindings = loadJsonFile<Record<string, any[]>>('findings.json', {});
    const loadedScores = loadJsonFile<Record<string, any>>('scores.json', {});
    const loadedBenchmarks = loadJsonFile<Record<string, any>>('benchmarks.json', {});
    const loadedTopsisRuns = loadJsonFile<Record<string, any>>('topsis_runs.json', {});
    const loadedEvaluationRuns = loadJsonFile<Record<string, any>>('evaluation_runs.json', {});
    const loadedUsers = loadJsonFile<Record<string, any>>('users.json', {});
    const loadedRevoked = loadJsonFile<string[]>('revoked_tokens.json', []);
    const loadedOrgs = loadJsonFile<Record<string, any>>('organizations.json', {});
    const loadedChallenges = loadJsonFile<Record<string, any>>('domain_challenges.json', {});

    this.assessments = new Map(Object.entries(loadedAssessments));
    this.scans = new Map(Object.entries(loadedScans));
    this.findings = new Map(Object.entries(loadedFindings));
    this.scores = new Map(Object.entries(loadedScores));
    this.benchmarks = new Map(Object.entries(loadedBenchmarks));
    this.topsisRuns = new Map(Object.entries(loadedTopsisRuns));
    this.evaluationRuns = new Map(Object.entries(loadedEvaluationRuns));
    this.users = new Map(Object.entries(loadedUsers));
    this.revokedTokens = new Set(Array.isArray(loadedRevoked) ? loadedRevoked : []);
    this.organizations = new Map(Object.entries(loadedOrgs));
    this.domainChallenges = new Map(Object.entries(loadedChallenges));

    console.log(`[DurableStore] Initialized. Loaded ${this.assessments.size} assessments, ${this.scores.size} scores, ${this.benchmarks.size} benchmarks, ${this.topsisRuns.size} topsis runs, ${this.evaluationRuns.size} evaluation runs, ${this.users.size} users, ${this.organizations.size} orgs, ${this.revokedTokens.size} revoked tokens from disk.`);
  }

  // --- Assessments ---
  public setAssessment(id: string, job: any): void {
    this.assessments.set(id, job);
    this.persistAssessments();
  }

  public getAssessment(id: string): any | undefined {
    if (id === 'latest') {
      const all = Array.from(this.assessments.values());
      const completed = all.filter(a => a.status === 'complete' || a.status === 'completed');
      return completed.length > 0 ? completed[completed.length - 1] : all[all.length - 1];
    }
    return this.assessments.get(id);
  }

  public listAssessments(): any[] {
    return Array.from(this.assessments.values());
  }

  private persistAssessments(): void {
    const obj = Object.fromEntries(this.assessments);
    saveJsonFile('assessments.json', obj);
  }

  // --- Scans ---
  public setScan(id: string, scan: any): void {
    this.scans.set(id, scan);
    saveJsonFile('scans.json', Object.fromEntries(this.scans));
  }

  public getScan(id: string): any | undefined {
    return this.scans.get(id);
  }

  // --- Findings ---
  public setFindings(key: string, findings: any[]): void {
    this.findings.set(key, findings);
    saveJsonFile('findings.json', Object.fromEntries(this.findings));
  }

  public getFindings(scanId: string, modelId?: string): any[] {
    if (modelId) {
      return this.findings.get(`${scanId}_${modelId}`) || [];
    }
    const res: any[] = [];
    for (const [k, v] of this.findings.entries()) {
      if (k.startsWith(scanId)) res.push(...v);
    }
    return res;
  }

  // --- Scores ---
  public setScore(scanId: string, modelId: string, score: any): void {
    this.scores.set(scanId, score);
    this.scores.set(`${scanId}_${modelId}`, score);
    saveJsonFile('scores.json', Object.fromEntries(this.scores));
  }

  public getScore(scanId: string, modelId?: string): any | undefined {
    if (modelId) {
      return this.scores.get(`${scanId}_${modelId}`) || this.scores.get(scanId);
    }
    return this.scores.get(scanId) || this.scores.get(`${scanId}_M03`) || this.scores.get(`${scanId}_M06`);
  }

  // --- Benchmarks ---
  public setBenchmark(id: string, benchmark: any): void {
    this.benchmarks.set(id, benchmark);
    saveJsonFile('benchmarks.json', Object.fromEntries(this.benchmarks));
  }

  public getBenchmark(id: string, orgId?: string): any | undefined {
    if (id === 'latest') {
      const all = Array.from(this.benchmarks.values());
      if (orgId) {
        const orgBenchmarks = all.filter(b => b.org_id === orgId);
        return orgBenchmarks.length > 0 ? orgBenchmarks[orgBenchmarks.length - 1] : undefined;
      }
      return all.length > 0 ? all[all.length - 1] : undefined;
    }
    const bench = this.benchmarks.get(id);
    if (bench && orgId && bench.org_id && bench.org_id !== orgId) {
      return undefined;
    }
    return bench;
  }

  public listBenchmarks(orgId?: string, isSuperAdmin?: boolean): any[] {
    const all = Array.from(this.benchmarks.values());
    if (orgId && !isSuperAdmin) {
      return all.filter(b => b.org_id === orgId);
    }
    return all;
  }

  // --- TOPSIS Runs ---
  public setTOPSISRun(id: string, run: any): void {
    this.topsisRuns.set(id, run);
    saveJsonFile('topsis_runs.json', Object.fromEntries(this.topsisRuns));
  }

  public getTOPSISRun(id: string, orgId?: string): any | undefined {
    if (id === 'latest') {
      const all = Array.from(this.topsisRuns.values());
      if (orgId) {
        const orgRuns = all.filter(r => r.org_id === orgId);
        return orgRuns.length > 0 ? orgRuns[orgRuns.length - 1] : undefined;
      }
      return all.length > 0 ? all[all.length - 1] : undefined;
    }
    const run = this.topsisRuns.get(id);
    if (run && orgId && run.org_id && run.org_id !== orgId) {
      return undefined;
    }
    return run;
  }

  public listTOPSISRuns(orgId?: string, isSuperAdmin?: boolean): any[] {
    const all = Array.from(this.topsisRuns.values());
    if (orgId && !isSuperAdmin) {
      return all.filter(r => r.org_id === orgId);
    }
    return all;
  }

  // --- Phase 6 Evaluation Runs ---
  public setEvaluationRun(id: string, run: any): void {
    this.evaluationRuns.set(id, run);
    saveJsonFile('evaluation_runs.json', Object.fromEntries(this.evaluationRuns));
  }

  public getEvaluationRun(id: string, orgId?: string): any | undefined {
    if (id === 'latest') {
      const all = Array.from(this.evaluationRuns.values());
      if (orgId) {
        const orgRuns = all.filter(r => r.org_id === orgId);
        return orgRuns.length > 0 ? orgRuns[orgRuns.length - 1] : undefined;
      }
      return all.length > 0 ? all[all.length - 1] : undefined;
    }
    const run = this.evaluationRuns.get(id);
    if (run && orgId && run.org_id && run.org_id !== orgId) {
      return undefined;
    }
    return run;
  }

  public listEvaluationRuns(orgId?: string, isSuperAdmin?: boolean): any[] {
    const all = Array.from(this.evaluationRuns.values());
    if (orgId && !isSuperAdmin) {
      return all.filter(r => r.org_id === orgId);
    }
    return all;
  }

  // --- Users ---
  public setUser(id: string, user: any): void {
    this.users.set(id, user);
    saveJsonFile('users.json', Object.fromEntries(this.users));
  }

  public getUser(id: string): any | undefined {
    return this.users.get(id);
  }

  public getUserByEmail(email: string): any | undefined {
    const norm = email.toLowerCase().trim();
    for (const u of this.users.values()) {
      if (u.email && u.email.toLowerCase().trim() === norm) return u;
    }
    return undefined;
  }

  public listUsers(): any[] {
    return Array.from(this.users.values());
  }

  // --- Token Revocation ---
  public revokeToken(token: string): void {
    if (!token) return;
    this.revokedTokens.add(token);
    saveJsonFile('revoked_tokens.json', Array.from(this.revokedTokens));
  }

  public isTokenRevoked(token: string): boolean {
    if (!token) return false;
    return this.revokedTokens.has(token);
  }

  // --- Organizations ---
  public setOrganization(id: string, org: any): void {
    this.organizations.set(id, org);
    saveJsonFile('organizations.json', Object.fromEntries(this.organizations));
  }

  public getOrganization(id: string): any | undefined {
    return this.organizations.get(id);
  }

  public listOrganizations(): any[] {
    return Array.from(this.organizations.values());
  }

  // --- Domain Verification Challenges ---
  public setDomainChallenge(domain: string, challenge: any, orgId?: string): void {
    const key = orgId ? `${orgId.toLowerCase().trim()}:${domain.toLowerCase().trim()}` : domain.toLowerCase().trim();
    this.domainChallenges.set(key, challenge);
    saveJsonFile('domain_challenges.json', Object.fromEntries(this.domainChallenges));
  }

  public getDomainChallenge(domain: string, orgId?: string): any | undefined {
    if (orgId) {
      const scopedKey = `${orgId.toLowerCase().trim()}:${domain.toLowerCase().trim()}`;
      if (this.domainChallenges.has(scopedKey)) {
        return this.domainChallenges.get(scopedKey);
      }
    }
    const legacyKey = domain.toLowerCase().trim();
    return this.domainChallenges.get(legacyKey);
  }

  public invalidateDomainChallenge(domain: string, orgId?: string): void {
    if (orgId) {
      const scopedKey = `${orgId.toLowerCase().trim()}:${domain.toLowerCase().trim()}`;
      this.domainChallenges.delete(scopedKey);
    }
    const legacyKey = domain.toLowerCase().trim();
    this.domainChallenges.delete(legacyKey);
    saveJsonFile('domain_challenges.json', Object.fromEntries(this.domainChallenges));
  }
}

export const durableStore = new DurableStore();
