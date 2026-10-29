/**
 * Production Hybrid RAG Retrieval Engine for TrustForge.
 * Combines Okapi BM25 lexical search with Supabase pgvector semantic search
 * using Reciprocal Rank Fusion (RRF) over the authoritative 83-chunk DPDP corpus.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { db } from '../database/supabaseClient.js';
import { embeddingService } from './embeddingService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export type RetrievalMode = 'HYBRID' | 'BM25_ONLY' | 'VECTOR_ONLY' | 'UNAVAILABLE';

export interface HybridRetrievedChunk {
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
  // Enriched Statutory Metadata (Phase 3)
  source_document?: string;
  section_number?: string | null;
  rule_number?: string | null;
  obligation_category?: string;
  obligation_categories?: string[];
  penalty_reference?: string;
  source_notification?: string;
  applicability?: string;
  // Ranking & Provenance Metadata
  bm25_rank?: number | null;
  bm25_score?: number | null;
  vector_rank?: number | null;
  vector_similarity?: number | null;
  rrf_score: number;
}

export interface HybridLegalContext {
  controlId: string;
  statutoryRef: string;
  query: string;
  retrievalMode: RetrievalMode;
  fusionConstant: number;
  chunks: HybridRetrievedChunk[];
  combinedContextText: string;
  contextHash: string;
  latencyMs: {
    bm25: number;
    embedding: number;
    vectorRpc: number;
    total: number;
  };
}

function tokenize(text: string): string[] {
  const stopwords = new Set([
    'a', 'an', 'the', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'with', 'by',
    'of', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
    'do', 'does', 'did', 'can', 'could', 'should', 'would', 'may', 'might', 'must',
    'shall', 'will', 'it', 'its', 'they', 'their', 'them', 'this', 'that', 'these',
    'those', 'what', 'which', 'who', 'whom', 'how', 'when', 'where', 'why',
    'act', '2023', '2025', 'dpdp', 'digital', 'personal', 'data', 'protection', 'india', 'indian'
  ]);
  return text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1 && !stopwords.has(t));
}

function extractSpecificStatRef(rawRef: string): string {
  const match = rawRef.match(/(Section\s+\d+(\(\d+\))?([a-z])?|Rule\s+\d+(\(\d+\))?)/i);
  return match ? match[0] : rawRef;
}

/**
 * Non-normative chunk registry.
 *
 * These chunks contain cross-references to many normative sections in their
 * body text (penalty tables, rule-making powers, amendment schedules, introductory recitals)
 * causing them to outscore directly applicable provisions in BM25 or pgvector retrieval.
 *
 * Evidence:
 *  - Section 44 (Repeal and savings): embeds penalty schedule table with
 *    verbatim citations of ss. 8(5), 8(6), 9, 10, 15, 32.
 *  - Section 40 (Rule-making power): lists all subjects of rule-making by
 *    cross-referencing ss. 5, 6, 7, 8, 9, 10, 11, 12, 13, 14.
 *  - Section 41 (Schedule amendment) / Section 43 (Difficulties): short
 *    administrative sections with no operative compliance obligations.
 *  - Section 1, Rule 1, Preamble: title recitals containing repetitive name terms.
 *  - Rule 23, Section 27, Fourth Schedule Part B: procedural powers and penalty schedules.
 *  - Commencement notification: operative for commencement dates, not substantive.
 *
 * These receive a BM25 penalty (score multiplier < 1.0) and an RRF rank penalty
 * to prevent them from outranking primary normative compliance provisions.
 *
 * This is NOT a denylist — these chunks remain in the index and may still appear
 * in the final top-K if no better normative chunk is available.
 */
const NON_NORMATIVE_CHUNKS: Record<string, { bm25Multiplier: number; note: string }> = {
  'dpdp-act-2023-section-40': {
    bm25Multiplier: 0.35,
    note: 'Rule-making power: cross-references all normative sections in its enumeration of rule subjects',
  },
  'dpdp-act-2023-section-41': {
    bm25Multiplier: 0.35,
    note: 'Schedule amendment power: no operative compliance obligations',
  },
  'dpdp-act-2023-section-43': {
    bm25Multiplier: 0.30,
    note: 'Difficulties removal clause: no operative compliance obligations',
  },
  'dpdp-act-2023-section-44': {
    bm25Multiplier: 0.30,
    note: 'Repeal/savings + penalty schedule table: cites ss.8(5),8(6),9,10,15,32 verbatim in penalty rows',
  },
  'dpdp-act-commencement-gsr-843e': {
    bm25Multiplier: 0.40,
    note: 'Commencement notification: operative for effective dates, not substantive obligations',
  },
  'dpdp-rules-2025-rule-23': {
    bm25Multiplier: 0.35,
    note: 'Calling for information from Data Fiduciary: procedural powers, not compliance standard',
  },
  'dpdp-rules-2025-fourth-schedule-part-b': {
    bm25Multiplier: 0.35,
    note: 'Child data exemption schedule: special exemptions, not primary obligations',
  },
  'dpdp-act-2023-preamble': {
    bm25Multiplier: 0.30,
    note: 'Preamble and enacting formula: introductory recitals, not operative compliance duties',
  },
  'dpdp-act-2023-section-1': {
    bm25Multiplier: 0.30,
    note: 'Short title and commencement: title recital, not substantive compliance duties',
  },
  'dpdp-rules-2025-rule-1': {
    bm25Multiplier: 0.30,
    note: 'Short title and commencement of rules: title recital, not substantive duties',
  },
  'dpdp-act-2023-section-27': {
    bm25Multiplier: 0.35,
    note: 'Hearing and penalties by Board: adjudicatory penalties, not primary obligations',
  },
};

export class HybridRAGRetriever {
  private corpus: any[] = [];
  private isLoaded = false;
  private idf: Map<string, number> = new Map();
  private docLengths: number[] = [];
  private docFreqMaps: Map<string, number>[] = [];
  private avgDocLength = 1.0;
  private readonly k1 = 1.5;
  private readonly b = 0.75;
  private readonly defaultRRFK = 60; // Reciprocal Rank Fusion smoothing parameter (faculty research standard k=60)

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
          console.log(`[HybridRAGRetriever] Loaded authoritative legal corpus (${this.corpus.length} chunks) & built BM25 index from ${p}`);
          return;
        } catch (err) {
          console.warn(`[HybridRAGRetriever] Failed parsing corpus at ${p}:`, err);
        }
      }
    }

    console.warn('[HybridRAGRetriever] Authoritative corpus file not found in search paths.');
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

  /**
   * Perform pure BM25 Lexical Retrieval over the 83 statutory chunks.
   * Supports category-aware statutory boosting when a C1-C10 obligation is queried.
   */
  public retrieveBM25(
    query: string,
    statutoryRef?: string,
    topK: number = 5,
    category?: string
  ): { chunk: any; score: number; rank: number }[] {
    this.loadCorpus();
    const qTokens = tokenize(query);
    const N = this.corpus.length;

    const specificRef = extractSpecificStatRef(statutoryRef || '');
    const statSignals: string[] = [];
    if (specificRef) {
      const secMatches = specificRef.match(/section\s+(\d+[a-z]?)/i);
      if (secMatches) statSignals.push(`section ${secMatches[1].toLowerCase()}`);
      const ruleMatches = specificRef.match(/rule\s+(\d+)/i);
      if (ruleMatches) statSignals.push(`rule ${ruleMatches[1].toLowerCase()}`);
    }

    const scored: { idx: number; score: number }[] = [];

    for (let idx = 0; idx < N; idx++) {
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

      let statBonus = 0;
      const doc = this.corpus[idx];
      if (statSignals.length > 0) {
        const secStr = (doc.section || '').toLowerCase();
        const chunkId = (doc.chunk_id || '').toLowerCase();
        const headingStr = (doc.heading || '').toLowerCase();

        for (const sig of statSignals) {
          if (secStr.includes(sig) || chunkId.includes(sig) || headingStr.includes(sig)) {
            statBonus += 7.5;
          }
        }
      }

      // Category-aware statutory boosting for C1-C10 taxonomy alignment
      let categoryBonus = 0;
      if (category) {
        const normCat = category.toUpperCase().trim();
        const docCats: string[] = doc.obligation_categories || (doc.obligation_category ? [doc.obligation_category] : []);
        if (docCats.includes(normCat) || doc.obligation_category === normCat) {
          categoryBonus += 3.5;
        }
      }

      // Apply non-normative penalty: these chunks earn their BM25 scores by
      // cross-referencing normative sections in penalty tables or rule-making
      // enumerations, not by actually containing the compliance obligations.
      // The multiplier reduces but does not eliminate their score.
      const chunkId = (doc?.chunk_id || '') as string;
      const nonNormEntry = NON_NORMATIVE_CHUNKS[chunkId];
      const rawScore = bm25 + statBonus + categoryBonus;
      const finalScore = nonNormEntry ? rawScore * nonNormEntry.bm25Multiplier : rawScore;

      scored.push({ idx, score: finalScore });
    }

    // Deterministic sort: descending score, then ascending chunk_id for tie-breaking
    scored.sort((a, b) => b.score - a.score || (this.corpus[a.idx]?.chunk_id || '').localeCompare(this.corpus[b.idx]?.chunk_id || ''));

    return scored.slice(0, topK).map((item, index) => ({
      chunk: this.corpus[item.idx],
      score: Math.round(item.score * 1000) / 1000,
      rank: index + 1,
    }));
  }

  /**
   * Perform pure pgvector Semantic Retrieval via Supabase match_legal_chunks RPC.
   */
  public async retrieveVector(query: string, topK: number = 5, threshold: number = 0.3): Promise<{
    results: { chunk_id: string; section: string; heading: string; text: string; similarity: number; rank: number }[];
    embeddingLatency: number;
    rpcLatency: number;
  }> {
    const t0 = Date.now();
    let embedding: number[] = [];
    try {
      embedding = await embeddingService.getEmbedding(query);
    } catch (err) {
      console.warn('[HybridRAGRetriever] Vector embedding generation failed:', err);
      return { results: [], embeddingLatency: Date.now() - t0, rpcLatency: 0 };
    }
    const t1 = Date.now();
    const embeddingLatency = t1 - t0;

    const client = db.getClient();
    if (!client) {
      return { results: [], embeddingLatency, rpcLatency: 0 };
    }

    try {
      const { data, error } = await client.rpc('match_legal_chunks', {
        query_embedding: embedding,
        match_threshold: threshold,
        match_count: topK,
      });

      const rpcLatency = Date.now() - t1;

      if (error || !data) {
        console.warn('[HybridRAGRetriever] Supabase match_legal_chunks RPC error:', error?.message);
        return { results: [], embeddingLatency, rpcLatency };
      }

      const results = (data as any[]).map((r, index) => ({
        chunk_id: r.id,
        section: r.section,
        heading: r.heading,
        text: r.text,
        similarity: Math.round(Number(r.similarity) * 10000) / 10000,
        rank: index + 1,
      }));

      return { results, embeddingLatency, rpcLatency };
    } catch (err) {
      console.warn('[HybridRAGRetriever] RPC execution exception:', err);
      return { results: [], embeddingLatency, rpcLatency: Date.now() - t1 };
    }
  }

  /**
   * Master Hybrid Retrieval: BM25 + pgvector + Reciprocal Rank Fusion (RRF).
   */
  public async retrieveContextForControl(
    controlId: string,
    statutoryRef: string,
    controlName?: string,
    options: { topK?: number; rrfK?: number; forcedMode?: RetrievalMode; category?: string } = {}
  ): Promise<HybridLegalContext> {
    const tTotalStart = Date.now();
    const topK = options.topK || 5; // Default top-5 legal provisions
    const rrfK = options.rrfK || this.defaultRRFK; // Documented k=60
    const forcedMode = options.forcedMode;

    const specificRef = extractSpecificStatRef(statutoryRef || '');
    const bm25Query = `${controlName || ''} ${specificRef}`.trim();
    const vecQuery = `${controlName || ''}. Statutory obligation under ${specificRef} compliance requirements`.trim();

    // 1. Execute BM25 with category-aware statutory boosting (candidate pool of 25 for strong recall)
    const tBm25Start = Date.now();
    const bm25Candidates = this.retrieveBM25(bm25Query, statutoryRef, 25, options.category);
    const bm25Latency = Date.now() - tBm25Start;

    // 2. Execute pgvector across full legal corpus (83 chunks) to eliminate artificial rank truncation
    let vectorResults: { chunk_id: string; section: string; heading: string; text: string; similarity: number; rank: number }[] = [];
    let embeddingLatency = 0;
    let rpcLatency = 0;

    if (forcedMode !== 'BM25_ONLY') {
      const vecRes = await this.retrieveVector(vecQuery, 83, 0.05);
      vectorResults = vecRes.results;
      embeddingLatency = vecRes.embeddingLatency;
      rpcLatency = vecRes.rpcLatency;
    }

    // Determine actual operating mode
    let actualMode: RetrievalMode = 'HYBRID';
    if (forcedMode === 'BM25_ONLY' || vectorResults.length === 0) {
      actualMode = 'BM25_ONLY';
    } else if (forcedMode === 'VECTOR_ONLY') {
      actualMode = 'VECTOR_ONLY';
    }

    // 3. Reciprocal Rank Fusion (RRF with documented k=60)
    // Map chunk_id to combined RRF score and provenance
    const rrfMap = new Map<string, {
      bm25_rank: number | null;
      bm25_score: number | null;
      vector_rank: number | null;
      vector_similarity: number | null;
      rrf_score: number;
    }>();

    // Process BM25 rankings
    if (actualMode !== 'VECTOR_ONLY') {
      for (const item of bm25Candidates) {
        const cid = item.chunk.chunk_id;
        const current = rrfMap.get(cid) || {
          bm25_rank: null,
          bm25_score: null,
          vector_rank: null,
          vector_similarity: null,
          rrf_score: 0,
        };
        current.bm25_rank = item.rank;
        current.bm25_score = item.score;
        current.rrf_score += 1.0 / (rrfK + item.rank);
        rrfMap.set(cid, current);
      }
    }

    // Process pgvector rankings
    // Apply non-normative penalty to vector rank before RRF fusion
    // to prevent procedural chunks from dominating via the semantic pathway.
    if (actualMode !== 'BM25_ONLY') {
      for (const item of vectorResults) {
        const cid = item.chunk_id;
        const nonNormEntry = NON_NORMATIVE_CHUNKS[cid];
        const current = rrfMap.get(cid) || {
          bm25_rank: null,
          bm25_score: null,
          vector_rank: null,
          vector_similarity: null,
          rrf_score: 0,
        };
        current.vector_rank = item.rank;
        current.vector_similarity = item.similarity;
        const nonNormPenalty = nonNormEntry ? Math.round((1.0 / nonNormEntry.bm25Multiplier - 1) * rrfK) + 35 : 0;
        current.rrf_score += 1.0 / (rrfK + item.rank + nonNormPenalty);
        rrfMap.set(cid, current);
      }
    }

    // Sort by descending RRF score, with deterministic tie-breaking by chunk_id
    const fusedRanking = Array.from(rrfMap.entries())
      .map(([chunk_id, prov]) => ({ chunk_id, ...prov }))
      .sort((a, b) => (b.rrf_score - a.rrf_score) || a.chunk_id.localeCompare(b.chunk_id))
      .slice(0, topK);

    // Hydrate complete chunk metadata from enriched authoritative corpus
    const selectedChunks: HybridRetrievedChunk[] = fusedRanking.map(item => {
      const baseDoc = this.corpus.find(c => c.chunk_id === item.chunk_id) || {};
      return {
        chunk_id: item.chunk_id,
        document_id: baseDoc.document_id || 'dpdp-act-2023',
        document_title: baseDoc.document_title || 'DPDP Act, 2023',
        authority: baseDoc.authority || 'Government of India',
        source_type: baseDoc.source_type || 'LEGAL_PRIMARY',
        section: baseDoc.section || 'General Provision',
        heading: baseDoc.heading || 'Statutory Requirement',
        subsection: baseDoc.subsection || null,
        commencement_status: baseDoc.commencement_status || 'IN_FORCE',
        effective_date: baseDoc.effective_date || '2025-11-13',
        enforceability: baseDoc.enforceability || 'CURRENTLY_ENFORCEABLE',
        text: baseDoc.text || '',
        source_url: baseDoc.source_url || '',
        publication_date: baseDoc.publication_date || '2023-08-11',
        version: baseDoc.version || 'authoritative-v2',
        source_document: baseDoc.source_document || baseDoc.document_id || 'dpdp-act-2023',
        section_number: baseDoc.section_number || baseDoc.section || null,
        rule_number: baseDoc.rule_number || null,
        obligation_category: baseDoc.obligation_category || 'GENERAL',
        obligation_categories: baseDoc.obligation_categories || [],
        penalty_reference: baseDoc.penalty_reference || '',
        source_notification: baseDoc.source_notification || '',
        applicability: baseDoc.applicability || 'GENERAL',
        bm25_rank: item.bm25_rank,
        bm25_score: item.bm25_score,
        vector_rank: item.vector_rank,
        vector_similarity: item.vector_similarity,
        rrf_score: Math.round(item.rrf_score * 10000) / 10000,
      };
    });

    const combinedContextText = selectedChunks.length > 0
      ? selectedChunks.map(c => `[${c.chunk_id}] ${c.heading} (${c.section}) [RRF: ${c.rrf_score} | BM25 Rank: ${c.bm25_rank || 'N/A'} | Vector Rank: ${c.vector_rank || 'N/A'} | Categories: ${(c.obligation_categories || []).join(', ') || c.obligation_category || 'GENERAL'}]:\n"${c.text}"\n(Enforceability: ${c.enforceability}, Effective Date: ${c.effective_date}, Penalty: ${c.penalty_reference || 'N/A'})`).join('\n\n')
      : `Statutory Mandate: ${statutoryRef}. Requirements under DPDP Act 2023.`;

    const contextHash = crypto.createHash('sha256').update(combinedContextText).digest('hex').substring(0, 16);

    const totalLatency = Date.now() - tTotalStart;

    return {
      controlId,
      statutoryRef,
      query: bm25Query,
      retrievalMode: actualMode,
      fusionConstant: rrfK,
      chunks: selectedChunks,
      combinedContextText,
      contextHash,
      latencyMs: {
        bm25: bm25Latency,
        embedding: embeddingLatency,
        vectorRpc: rpcLatency,
        total: totalLatency,
      },
    };
  }

  /**
   * Build a frozen snapshot of legal context across canonical controls.
   * Guarantees all candidate LLMs receive bit-for-bit identical input context.
   */
  public async buildFrozenSnapshot(
    canonicalControls: { id: string; name: string; statutory_ref: string }[],
    options: { topK?: number; rrfK?: number; forcedMode?: RetrievalMode; categoryMap?: Record<string, string> } = {}
  ): Promise<{
    contexts: Record<string, HybridLegalContext>;
    snapshotHash: string;
    algorithm: string;
    retrievalMode: RetrievalMode;
  }> {
    const contexts: Record<string, HybridLegalContext> = {};
    let combinedAll = '';
    let dominantMode: RetrievalMode = 'HYBRID';

    for (const ctrl of canonicalControls) {
      const category = options.categoryMap ? options.categoryMap[ctrl.id] : undefined;
      const ctx = await this.retrieveContextForControl(ctrl.id, ctrl.statutory_ref, ctrl.name, {
        topK: options.topK || 5,
        rrfK: options.rrfK || this.defaultRRFK,
        forcedMode: options.forcedMode,
        category,
      });
      contexts[ctrl.id] = ctx;
      combinedAll += ctx.combinedContextText + '\n---\n';
      if (ctx.retrievalMode !== 'HYBRID') {
        dominantMode = ctx.retrievalMode;
      }
    }

    const snapshotHash = crypto.createHash('sha256').update(combinedAll).digest('hex');

    return {
      contexts,
      snapshotHash,
      algorithm: 'Hybrid-BM25-pgvector-RRF',
      retrievalMode: dominantMode,
    };
  }

  public getCorpusSize(): number {
    return this.corpus.length;
  }
}

export const hybridRAG = new HybridRAGRetriever();
