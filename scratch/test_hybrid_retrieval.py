import asyncio
import json
import math
import re
import time
from collections import Counter
from pathlib import Path

# Setup paths
PROJECT_ROOT = Path("C:/TF new V1/TrustForge")
import sys
sys.path.insert(0, str(PROJECT_ROOT / "backend"))

from rag.retrieval import retrieve, reload_index


def tokenize(text: str) -> list[str]:
    """Tokenize and normalize text for legal BM25."""
    text = text.lower()
    # Normalize hyphens and punctuation
    text = re.sub(r"[^\w\s]", " ", text)
    tokens = text.split()
    # Standard English stopwords
    stopwords = {
        "a", "an", "the", "and", "or", "in", "on", "at", "to", "for", "with", "by",
        "of", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had",
        "do", "does", "did", "can", "could", "should", "would", "may", "might", "must",
        "shall", "will", "it", "its", "they", "their", "them", "this", "that", "these",
        "those", "what", "which", "who", "whom", "how", "when", "where", "why"
    }
    return [t for t in tokens if len(t) > 1 and t not in stopwords]


class BM25Retriever:
    """Pure-Python Okapi BM25 with Exact Statutory Reference Matching."""

    def __init__(self, corpus: list[dict], k1: float = 1.5, b: float = 0.75):
        self.corpus = corpus
        self.k1 = k1
        self.b = b
        self.corpus_size = len(corpus)
        self.doc_tokens = []
        self.doc_lens = []
        self.df = Counter()
        self.doc_freq_terms = []

        for c in corpus:
            # Index text + heading + section + document title
            doc_str = f"{c.get('heading', '')} {c.get('section', '')} {c.get('text', '')}"
            tokens = tokenize(doc_str)
            self.doc_tokens.append(tokens)
            self.doc_lens.append(len(tokens))
            term_set = set(tokens)
            for t in term_set:
                self.df[t] += 1
            self.doc_freq_terms.append(Counter(tokens))

        self.avgdl = sum(self.doc_lens) / float(self.corpus_size) if self.corpus_size else 1.0

        # Precompute IDF
        self.idf = {}
        for t, freq in self.df.items():
            self.idf[t] = math.log((self.corpus_size - freq + 0.5) / (freq + 0.5) + 1.0)

    def extract_statutory_references(self, query: str) -> list[str]:
        """Extract explicit statutory signals like 'section 8', 'rule 6', 'schedule'."""
        signals = []
        # Section patterns: section 8, section 8(2), sec 8
        sec_matches = re.findall(r"\b(?:section|sec\.?)\s*(\d+[A-Za-z]?(?:\(\d+\))?)", query, re.IGNORECASE)
        for sm in sec_matches:
            signals.append(f"section {sm.lower()}")
            # base section number
            base_sec = re.match(r"\d+", sm)
            if base_sec:
                signals.append(f"section {base_sec.group(0)}")

        # Rule patterns: rule 6, rule 7, etc.
        rule_matches = re.findall(r"\brule\s*(\d+)", query, re.IGNORECASE)
        for rm in rule_matches:
            signals.append(f"rule {rm.lower()}")

        # Schedule patterns
        if re.search(r"\bfirst\s+schedule\b", query, re.IGNORECASE):
            signals.append("first schedule")
        if re.search(r"\bsecond\s+schedule\b", query, re.IGNORECASE):
            signals.append("second schedule")
        if re.search(r"\bthird\s+schedule\b", query, re.IGNORECASE):
            signals.append("third schedule")
        if re.search(r"\bfourth\s+schedule\b", query, re.IGNORECASE):
            signals.append("fourth schedule")
        if re.search(r"\bcommencement\b", query, re.IGNORECASE):
            signals.append("commencement")

        return signals

    def score(self, query: str) -> list[tuple[int, float]]:
        """Score all documents for the query using BM25 + statutory bonus."""
        q_tokens = tokenize(query)
        if not q_tokens:
            return [(idx, 0.0) for idx in range(self.corpus_size)]

        stat_signals = self.extract_statutory_references(query)
        scores = []

        for idx in range(self.corpus_size):
            doc = self.corpus[idx]
            d_len = self.doc_lens[idx]
            tf_map = self.doc_freq_terms[idx]

            # Standard BM25
            bm25_val = 0.0
            for t in q_tokens:
                if t in tf_map:
                    freq = tf_map[t]
                    idf = self.idf.get(t, 0.1)
                    denom = freq + self.k1 * (1.0 - self.b + self.b * (d_len / self.avgdl))
                    bm25_val += idf * (freq * (self.k1 + 1.0)) / denom

            # Exact statutory reference bonus
            stat_bonus = 0.0
            if stat_signals:
                sec_str = (doc.get("section") or "").lower()
                chunk_id = (doc.get("chunk_id") or "").lower()
                heading_str = (doc.get("heading") or "").lower()

                for sig in stat_signals:
                    if sig in sec_str or sig in chunk_id or sig in heading_str:
                        stat_bonus += 4.0  # Significant but controlled boost for exact statutory mention
                    elif sig.startswith("section ") and f"section-{sig.split()[1]}" in chunk_id:
                        stat_bonus += 4.0

            total_score = bm25_val + stat_bonus
            scores.append((idx, total_score))

        return scores


def hybrid_search(
    query: str,
    dense_results: list,
    bm25_retriever: BM25Retriever,
    top_k: int = 5,
    rrf_k: int = 60,
    dense_weight: float = 0.6,
    bm25_weight: float = 0.4,
) -> list:
    """
    Combine dense semantic results with BM25 + statutory reference ranking using
    Reciprocal Rank Fusion (RRF).
    """
    # 1. Dense ranks
    dense_rank_map = {}
    for r_idx, c in enumerate(dense_results):
        dense_rank_map[c.chunk_id] = r_idx + 1

    # 2. BM25 scores and ranks
    bm25_scored = bm25_retriever.score(query)
    bm25_sorted = sorted(bm25_scored, key=lambda x: x[1], reverse=True)

    bm25_rank_map = {}
    for r_idx, (c_idx, score) in enumerate(bm25_sorted):
        if score > 0:
            cid = bm25_retriever.corpus[c_idx]["chunk_id"]
            bm25_rank_map[cid] = (r_idx + 1, score)

    # 3. Reciprocal Rank Fusion
    all_candidates = set(dense_rank_map.keys()) | set(list(bm25_rank_map.keys())[:15])

    rrf_scores = {}
    for cid in all_candidates:
        d_rank = dense_rank_map.get(cid)
        b_info = bm25_rank_map.get(cid)
        b_rank = b_info[0] if b_info else None

        score = 0.0
        if d_rank is not None:
            score += dense_weight * (1.0 / (rrf_k + d_rank))
        if b_rank is not None:
            score += bm25_weight * (1.0 / (rrf_k + b_rank))

        rrf_scores[cid] = score

    # Sort candidates by combined RRF score
    sorted_cids = sorted(rrf_scores.keys(), key=lambda x: rrf_scores[x], reverse=True)

    # Build final result list using dense objects when available, or looking up in corpus
    id_to_chunk_obj = {c.chunk_id: c for c in dense_results}
    corpus_lookup = {c["chunk_id"]: c for c in bm25_retriever.corpus}

    final_results = []
    for cid in sorted_cids[:top_k]:
        if cid in id_to_chunk_obj:
            chunk_obj = id_to_chunk_obj[cid]
        else:
            meta = corpus_lookup[cid]
            from core.models import RetrievedChunk, SourceType
            chunk_obj = RetrievedChunk(
                chunk_id=meta["chunk_id"],
                document_id=meta["document_id"],
                document_title=meta["document_title"],
                authority=meta["authority"],
                source_type=SourceType(meta["source_type"]),
                section=meta.get("section"),
                subsection=meta.get("subsection"),
                heading=meta.get("heading"),
                text=meta["text"],
                source_url=meta.get("source_url"),
                publication_date=meta.get("publication_date"),
                version=meta.get("version"),
                commencement_status=meta.get("commencement_status"),
                effective_date=meta.get("effective_date"),
                enforceability=meta.get("enforceability"),
                similarity=float(rrf_scores[cid] * 10),  # scaled RRF representation
            )
        final_results.append(chunk_obj)

    return final_results


async def test_comparison():
    reload_index()

    # Load corpus
    with open(PROJECT_ROOT / "backend" / "knowledge" / "authoritative_corpus.json", "r", encoding="utf-8") as f:
        corpus = json.load(f)

    bm25 = BM25Retriever(corpus)

    # Load 45 benchmark queries
    bench_path = PROJECT_ROOT / "docs" / "research" / "evaluation" / "datasets" / "rag_retrieval_benchmark_v2_authoritative.json"
    with open(bench_path, "r", encoding="utf-8") as f:
        bench_data = json.load(f)

    queries = bench_data["queries"]

    dense_hits = {1: 0, 3: 0, 5: 0}
    hybrid_hits = {1: 0, 3: 0, 5: 0}
    dense_mrr = 0.0
    hybrid_mrr = 0.0
    ans_count = 0

    improvements = []
    regressions = []

    for q in queries:
        if not q["is_answerable"]:
            continue
        ans_count += 1
        qtext = q["query"]
        expected = set(q["expected_chunk_ids"])

        # Dense-only
        dense_res = await retrieve(qtext, top_k=5)
        dense_ids = [c.chunk_id for c in dense_res]

        d_h1 = 1 if dense_ids and dense_ids[0] in expected else 0
        d_h3 = 1 if any(cid in expected for cid in dense_ids[:3]) else 0
        d_h5 = 1 if any(cid in expected for cid in dense_ids[:5]) else 0
        dense_hits[1] += d_h1
        dense_hits[3] += d_h3
        dense_hits[5] += d_h5

        d_rank = next((idx + 1 for idx, cid in enumerate(dense_ids) if cid in expected), 0)
        dense_mrr += (1.0 / d_rank) if d_rank else 0.0

        # Hybrid
        hybrid_res = hybrid_search(qtext, dense_res, bm25, top_k=5)
        hybrid_ids = [c.chunk_id for c in hybrid_res]

        h_h1 = 1 if hybrid_ids and hybrid_ids[0] in expected else 0
        h_h3 = 1 if any(cid in expected for cid in hybrid_ids[:3]) else 0
        h_h5 = 1 if any(cid in expected for cid in hybrid_ids[:5]) else 0
        hybrid_hits[1] += h_h1
        hybrid_hits[3] += h_h3
        hybrid_hits[5] += h_h5

        h_rank = next((idx + 1 for idx, cid in enumerate(hybrid_ids) if cid in expected), 0)
        hybrid_mrr += (1.0 / h_rank) if h_rank else 0.0

        # Track diff
        if h_h1 > d_h1 or (h_rank > 0 and (d_rank == 0 or h_rank < d_rank)):
            improvements.append({
                "qid": q["query_id"],
                "query": qtext,
                "dense_rank": d_rank,
                "hybrid_rank": h_rank,
                "expected": list(expected),
                "dense_top": dense_ids[0] if dense_ids else None,
                "hybrid_top": hybrid_ids[0] if hybrid_ids else None,
            })
        elif d_h1 > h_h1 or (d_rank > 0 and (h_rank == 0 or d_rank < h_rank)):
            regressions.append({
                "qid": q["query_id"],
                "query": qtext,
                "dense_rank": d_rank,
                "hybrid_rank": h_rank,
                "expected": list(expected),
            })

    print("=" * 60)
    print("CONTROLLED EXPERIMENT: DENSE-ONLY vs HYBRID RETRIEVAL")
    print("=" * 60)
    print(f"Answerable Queries: {ans_count}")
    print(f"Dense Hit@1:  {dense_hits[1]/ans_count*100:.2f}% ({dense_hits[1]}/{ans_count})")
    print(f"Hybrid Hit@1: {hybrid_hits[1]/ans_count*100:.2f}% ({hybrid_hits[1]}/{ans_count})")
    print(f"Dense Hit@3:  {dense_hits[3]/ans_count*100:.2f}% ({dense_hits[3]}/{ans_count})")
    print(f"Hybrid Hit@3: {hybrid_hits[3]/ans_count*100:.2f}% ({hybrid_hits[3]}/{ans_count})")
    print(f"Dense Hit@5:  {dense_hits[5]/ans_count*100:.2f}% ({dense_hits[5]}/{ans_count})")
    print(f"Hybrid Hit@5: {hybrid_hits[5]/ans_count*100:.2f}% ({hybrid_hits[5]}/{ans_count})")
    print(f"Dense MRR@5:  {dense_mrr/ans_count:.4f}")
    print(f"Hybrid MRR@5: {hybrid_mrr/ans_count:.4f}")
    print(f"\nTotal Improvements (Rank improved): {len(improvements)}")
    for imp in improvements[:5]:
        print(f"  + {imp['qid']}: Rank {imp['dense_rank']} -> {imp['hybrid_rank']} | {imp['query'][:60]}...")
    print(f"\nTotal Regressions (Rank worsened): {len(regressions)}")
    for reg in regressions[:5]:
        print(f"  - {reg['qid']}: Rank {reg['dense_rank']} -> {reg['hybrid_rank']} | {reg['query'][:60]}...")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(test_comparison())
