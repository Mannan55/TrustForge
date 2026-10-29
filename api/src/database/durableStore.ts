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
    fs.renameSync(tmpPath, filepath);
  } catch (err) {
    console.warn(`Error saving ${filename}:`, err);
    try {
      if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    } catch {
      // ignore cleanup failure
    }
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

  constructor() {
    const loadedAssessments = loadJsonFile<Record<string, any>>('assessments.json', {});
    const loadedScans = loadJsonFile<Record<string, any>>('scans.json', {});
    const loadedFindings = loadJsonFile<Record<string, any[]>>('findings.json', {});
    const loadedScores = loadJsonFile<Record<string, any>>('scores.json', {});
    const loadedBenchmarks = loadJsonFile<Record<string, any>>('benchmarks.json', {});
    const loadedTopsisRuns = loadJsonFile<Record<string, any>>('topsis_runs.json', {});
    const loadedEvaluationRuns = loadJsonFile<Record<string, any>>('evaluation_runs.json', {});
    const loadedUsers = loadJsonFile<Record<string, any>>('users.json', {});

    this.assessments = new Map(Object.entries(loadedAssessments));
    this.scans = new Map(Object.entries(loadedScans));
    this.findings = new Map(Object.entries(loadedFindings));
    this.scores = new Map(Object.entries(loadedScores));
    this.benchmarks = new Map(Object.entries(loadedBenchmarks));
    this.topsisRuns = new Map(Object.entries(loadedTopsisRuns));
    this.evaluationRuns = new Map(Object.entries(loadedEvaluationRuns));
    this.users = new Map(Object.entries(loadedUsers));

    console.log(`[DurableStore] Initialized. Loaded ${this.assessments.size} assessments, ${this.scores.size} scores, ${this.benchmarks.size} benchmarks, ${this.topsisRuns.size} topsis runs, ${this.evaluationRuns.size} evaluation runs, ${this.users.size} users from disk.`);
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

  public getBenchmark(id: string): any | undefined {
    if (id === 'latest') {
      const all = Array.from(this.benchmarks.values());
      return all.length > 0 ? all[all.length - 1] : undefined;
    }
    return this.benchmarks.get(id);
  }

  public listBenchmarks(): any[] {
    return Array.from(this.benchmarks.values());
  }

  // --- TOPSIS Runs ---
  public setTOPSISRun(id: string, run: any): void {
    this.topsisRuns.set(id, run);
    saveJsonFile('topsis_runs.json', Object.fromEntries(this.topsisRuns));
  }

  public getTOPSISRun(id: string): any | undefined {
    if (id === 'latest') {
      const all = Array.from(this.topsisRuns.values());
      return all.length > 0 ? all[all.length - 1] : undefined;
    }
    return this.topsisRuns.get(id);
  }

  public listTOPSISRuns(): any[] {
    return Array.from(this.topsisRuns.values());
  }

  // --- Phase 6 Evaluation Runs ---
  public setEvaluationRun(id: string, run: any): void {
    this.evaluationRuns.set(id, run);
    saveJsonFile('evaluation_runs.json', Object.fromEntries(this.evaluationRuns));
  }

  public getEvaluationRun(id: string): any | undefined {
    if (id === 'latest') {
      const all = Array.from(this.evaluationRuns.values());
      return all.length > 0 ? all[all.length - 1] : undefined;
    }
    return this.evaluationRuns.get(id);
  }

  public listEvaluationRuns(): any[] {
    return Array.from(this.evaluationRuns.values());
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
}

export const durableStore = new DurableStore();
