/**
 * Enhanced Statutory BM25 RAG Retriever for TrustForge.
 * Implements Okapi BM25 with Statutory Reference Boosting over the 83-chunk DPDP corpus.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface LegalChunk {
  chunk_id: string;
  document_id: string;
  document_title: string;
  authority: string;
  source_type: string;
  section: string;
  heading: string;
  subsection?: string | null;
  commencement_status: string;
  effective_date: string;
  enforceability: string;
  text: string;
  source_url: string;
  publication_date: string;
  version: string;
  ranking_score?: number;
}

export interface RetrievedLegalContext {
  controlId: string;
  statutoryRef: string;
  query: string;
  retrievalAlgorithm: string;
  chunks: LegalChunk[];
  rankingScores: number[];
  combinedContextText: string;
  contextHash: string;
}

function tokenize(text: string): string[] {
  const stopwords = new Set([
    'a', 'an', 'the', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'with', 'by',
    'of', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
    'do', 'does', 'did', 'can', 'could', 'should', 'would', 'may', 'might', 'must',
    'shall', 'will', 'it', 'its', 'they', 'their', 'them', 'this', 'that', 'these',
    'those', 'what', 'which', 'who', 'whom', 'how', 'when', 'where', 'why'
  ]);
  return text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1 && !stopwords.has(t));
}

export class StatutoryRAGRetriever {
  private corpus: LegalChunk[] = [];
  private isLoaded = false;
  private idf: Map<string, number> = new Map();
  private docLengths: number[] = [];
  private docFreqMaps: Map<string, number>[] = [];
  private avgDocLength = 1.0;
  private readonly k1 = 1.5;
  private readonly b = 0.75;

  constructor() {
    this.loadCorpus();
  }

  private loadCorpus(): void {
    if (this.isLoaded) return;

    const possiblePaths = [
      path.resolve(__dirname, '../../../backend/knowledge/authoritative_corpus.json'),
      path.resolve(process.cwd(), 'backend/knowledge/authoritative_corpus.json'),
      path.resolve(process.cwd(), '../backend/knowledge/authoritative_corpus.json'),
      path.resolve(__dirname, '../../backend/knowledge/authoritative_corpus.json'),
    ];

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        try {
          const raw = fs.readFileSync(p, 'utf-8');
          this.corpus = JSON.parse(raw);
          this.isLoaded = true;
          this.buildBM25Index();
          console.log(`[StatutoryRAGRetriever] Loaded authoritative legal corpus (${this.corpus.length} chunks) & built BM25 index from ${p}`);
          return;
        } catch (err) {
          console.warn(`[StatutoryRAGRetriever] Failed parsing corpus at ${p}:`, err);
        }
      }
    }

    console.warn('[StatutoryRAGRetriever] Authoritative corpus file not found in search paths.');
  }

  private buildBM25Index(): void {
    const N = this.corpus.length;
    if (N === 0) return;

    const docFreq = new Map<string, number>();
    this.docLengths = [];
    this.docFreqMaps = [];

    let totalLength = 0;

    for (let i = 0; i < N; i++) {
      const c = this.corpus[i];
      const docStr = `${c.heading || ''} ${c.section || ''} ${c.text || ''}`;
      const tokens = tokenize(docStr);
      const len = tokens.length;

      this.docLengths.push(len);
      totalLength += len;

      const tf = new Map<string, number>();
      const seen = new Set<string>();

      for (const t of tokens) {
        tf.set(t, (tf.get(t) || 0) + 1);
        if (!seen.has(t)) {
          seen.add(t);
          docFreq.set(t, (docFreq.get(t) || 0) + 1);
        }
      }

      this.docFreqMaps.push(tf);
    }

    this.avgDocLength = totalLength / N;

    // Calculate Robertson-Spärck Jones IDF
    for (const [term, freq] of docFreq.entries()) {
      const idfVal = Math.log((N - freq + 0.5) / (freq + 0.5) + 1.0);
      this.idf.set(term, Math.max(0.1, idfVal));
    }
  }

  public getCorpusSize(): number {
    return this.corpus.length;
  }

  /**
   * Retrieve authoritative statutory context for a canonical DPDP control using BM25 + Section Boost.
   */
  public retrieveContextForControl(controlId: string, statutoryRef: string, controlName?: string): RetrievedLegalContext {
    this.loadCorpus();

    const query = `${controlName || ''} ${statutoryRef} obligations under Indian DPDP law`.trim();
    const qTokens = tokenize(query);

    // Extract explicit statutory signals (e.g. "section 5", "rule 3")
    const statSignals: string[] = [];
    const secMatches = statutoryRef.match(/section\s+(\d+[a-z]?)/i);
    if (secMatches) statSignals.push(`section ${secMatches[1].toLowerCase()}`);
    const ruleMatches = statutoryRef.match(/rule\s+(\d+)/i);
    if (ruleMatches) statSignals.push(`rule ${ruleMatches[1].toLowerCase()}`);

    const scored: { idx: number; score: number }[] = [];
    const N = this.corpus.length;

    for (let idx = 0; idx < N; idx++) {
      const doc = this.corpus[idx];
      const dLen = this.docLengths[idx] || 1;
      const tfMap = this.docFreqMaps[idx];

      let bm25 = 0;
      for (const t of qTokens) {
        const freq = tfMap ? (tfMap.get(t) || 0) : 0;
        if (freq > 0) {
          const idf = this.idf.get(t) || 0.1;
          const denom = freq + this.k1 * (1.0 - this.b + this.b * (dLen / this.avgDocLength));
          bm25 += idf * ((freq * (this.k1 + 1.0)) / denom);
        }
      }

      // Exact statutory bonus (+4.0 for exact section in metadata)
      let statBonus = 0;
      if (statSignals.length > 0) {
        const secStr = (doc.section || '').toLowerCase();
        const chunkId = (doc.chunk_id || '').toLowerCase();
        const headingStr = (doc.heading || '').toLowerCase();

        for (const sig of statSignals) {
          if (secStr.includes(sig) || chunkId.includes(sig) || headingStr.includes(sig)) {
            statBonus += 4.5;
          }
        }
      }

      scored.push({ idx, score: bm25 + statBonus });
    }

    scored.sort((a, b) => b.score - a.score);
    const topCandidates = scored.slice(0, 3);

    const selectedChunks: LegalChunk[] = topCandidates.map(c => ({
      ...this.corpus[c.idx],
      ranking_score: Math.round(c.score * 100) / 100,
    }));

    const rankingScores = selectedChunks.map(c => c.ranking_score || 0);

    const combinedContextText = selectedChunks.length > 0
      ? selectedChunks.map(c => `[${c.chunk_id}] ${c.heading} (${c.section}) [BM25 Score: ${c.ranking_score}]:\n"${c.text}"\n(Enforceability: ${c.enforceability}, Effective Date: ${c.effective_date})`).join('\n\n')
      : `Statutory Mandate: ${statutoryRef}. Requirements under DPDP Act 2023.`;

    const contextHash = crypto.createHash('sha256').update(combinedContextText).digest('hex').substring(0, 16);

    return {
      controlId,
      statutoryRef,
      query,
      retrievalAlgorithm: 'Okapi-BM25-Statutory-Boost',
      chunks: selectedChunks,
      rankingScores,
      combinedContextText,
      contextHash,
    };
  }

  /**
   * Build a frozen snapshot of legal context across all 20 canonical controls.
   * This guarantees every candidate model receives bit-for-bit identical input.
   */
  public buildFrozenSnapshot(canonicalControls: { id: string; name: string; statutory_ref: string }[]): {
    contexts: Record<string, RetrievedLegalContext>;
    snapshotHash: string;
    algorithm: string;
  } {
    const contexts: Record<string, RetrievedLegalContext> = {};
    let combinedAll = '';

    for (const ctrl of canonicalControls) {
      const ctx = this.retrieveContextForControl(ctrl.id, ctrl.statutory_ref, ctrl.name);
      contexts[ctrl.id] = ctx;
      combinedAll += ctx.combinedContextText + '\n---\n';
    }

    const snapshotHash = crypto.createHash('sha256').update(combinedAll).digest('hex');

    return { contexts, snapshotHash, algorithm: 'Okapi-BM25-Statutory-Boost' };
  }
}

export const ragRetriever = new StatutoryRAGRetriever();
