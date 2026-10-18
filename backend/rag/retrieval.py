"""
TrustForge RAG Retrieval Service.

Loads the FAISS index at startup (lazy singleton) and provides
retrieve() for querying top-K relevant chunks with full provenance.
"""
from __future__ import annotations

import logging
import os
import pickle
from pathlib import Path
from typing import Dict, List, Optional

import numpy as np

from config import settings
from core.models import RetrievedChunk, SourceType

logger = logging.getLogger(__name__)

# ─── Singleton index state ────────────────────────────────────────────────────
_faiss_index = None
_chunks_meta: List[Dict] = []
_model = None
_index_loaded = False
_bm25_retriever: Optional[BM25Retriever] = None


def _tokenize(text: str) -> List[str]:
    """Tokenize and normalize text for legal BM25."""
    import re
    text = text.lower()
    text = re.sub(r"[^\w\s]", " ", text)
    tokens = text.split()
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

    def __init__(self, corpus: List[Dict], k1: float = 1.5, b: float = 0.75):
        import math
        from collections import Counter
        self.corpus = corpus
        self.k1 = k1
        self.b = b
        self.corpus_size = len(corpus)
        self.doc_tokens: List[List[str]] = []
        self.doc_lens: List[int] = []
        self.df = Counter()
        self.doc_freq_terms: List[Counter] = []

        for c in corpus:
            doc_str = f"{c.get('heading', '')} {c.get('section', '')} {c.get('text', '')}"
            tokens = _tokenize(doc_str)
            self.doc_tokens.append(tokens)
            self.doc_lens.append(len(tokens))
            term_set = set(tokens)
            for t in term_set:
                self.df[t] += 1
            self.doc_freq_terms.append(Counter(tokens))

        self.avgdl = sum(self.doc_lens) / float(self.corpus_size) if self.corpus_size else 1.0

        self.idf: Dict[str, float] = {}
        for t, freq in self.df.items():
            self.idf[t] = math.log((self.corpus_size - freq + 0.5) / (freq + 0.5) + 1.0)

    def extract_statutory_references(self, query: str) -> List[str]:
        """Extract explicit statutory signals like 'section 8', 'rule 6', 'schedule'."""
        import re
        signals = []
        sec_matches = re.findall(r"\b(?:section|sec\.?)\s*(\d+[A-Za-z]?(?:\(\d+\))?)", query, re.IGNORECASE)
        for sm in sec_matches:
            signals.append(f"section {sm.lower()}")
            base_sec = re.match(r"\d+", sm)
            if base_sec:
                signals.append(f"section {base_sec.group(0)}")

        rule_matches = re.findall(r"\brule\s*(\d+)", query, re.IGNORECASE)
        for rm in rule_matches:
            signals.append(f"rule {rm.lower()}")

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

    def score(self, query: str) -> List[Tuple[int, float]]:
        """Score all documents for query using BM25 + statutory bonus."""
        q_tokens = _tokenize(query)
        if not q_tokens:
            return [(idx, 0.0) for idx in range(self.corpus_size)]

        stat_signals = self.extract_statutory_references(query)
        scores: List[Tuple[int, float]] = []

        for idx in range(self.corpus_size):
            doc = self.corpus[idx]
            d_len = self.doc_lens[idx]
            tf_map = self.doc_freq_terms[idx]

            bm25_val = 0.0
            for t in q_tokens:
                if t in tf_map:
                    freq = tf_map[t]
                    idf = self.idf.get(t, 0.1)
                    denom = freq + self.k1 * (1.0 - self.b + self.b * (d_len / self.avgdl))
                    bm25_val += idf * (freq * (self.k1 + 1.0)) / denom

            stat_bonus = 0.0
            if stat_signals:
                sec_str = (doc.get("section") or "").lower()
                chunk_id = (doc.get("chunk_id") or "").lower()
                heading_str = (doc.get("heading") or "").lower()

                for sig in stat_signals:
                    if sig in sec_str or sig in chunk_id or sig in heading_str:
                        stat_bonus += 4.0
                    elif sig.startswith("section ") and f"section-{sig.split()[1]}" in chunk_id:
                        stat_bonus += 4.0

            scores.append((idx, bm25_val + stat_bonus))

        return scores


def _ensure_index() -> None:
    """Lazy-load the FAISS index, chunk metadata, BM25 retriever, and embedding model."""
    global _faiss_index, _chunks_meta, _model, _bm25_retriever, _index_loaded

    if _index_loaded:
        return

    import faiss
    from sentence_transformers import SentenceTransformer

    index_dir = settings.knowledge_index_path
    faiss_path = index_dir / "trustforge.faiss"
    meta_path = index_dir / "chunks.pkl"

    if not faiss_path.exists() or not meta_path.exists():
        raise RuntimeError(
            f"Knowledge index not found at {index_dir}. "
            f"Run: cd backend && python -m rag.ingest"
        )

    logger.info(f"Loading FAISS index from {faiss_path}")
    _faiss_index = faiss.read_index(str(faiss_path))

    logger.info(f"Loading chunk metadata from {meta_path}")
    with open(meta_path, "rb") as f:
        _chunks_meta = pickle.load(f)

    logger.info(f"Loading embedding model: {settings.embedding_model}")
    _model = SentenceTransformer(settings.embedding_model)

    logger.info("Initializing BM25 statutory retriever")
    _bm25_retriever = BM25Retriever(_chunks_meta)

    _index_loaded = True
    logger.info(
        f"RAG retrieval ready — index: {_faiss_index.ntotal} vectors, "
        f"chunks: {len(_chunks_meta)}, model: {settings.embedding_model}"
    )


async def retrieve(
    query: str,
    top_k: Optional[int] = None,
    source_type_filter: Optional[List[SourceType]] = None,
    mode: Optional[str] = None,
) -> List[RetrievedChunk]:
    """
    Retrieve top-K relevant chunks for the given query.

    Args:
        query: Natural-language retrieval query (should be specific, not generic)
        top_k: Number of results (defaults to settings.retrieval_top_k)
        source_type_filter: Optional list of source types to restrict retrieval to
        mode: Retrieval strategy — "dense" (vector only) or "hybrid" (dense + BM25 + statutory RRF)

    Returns:
        List of RetrievedChunk with text and full provenance metadata.
    """
    _ensure_index()

    k = top_k or settings.retrieval_top_k
    active_mode = mode or getattr(settings, "retrieval_mode", "dense")

    # 1. Embed query (normalised for cosine similarity)
    query_embedding = _model.encode(
        [query],
        normalize_embeddings=True,
    )
    query_np = np.array(query_embedding, dtype=np.float32)

    # Search candidates (retrieve more candidates for hybrid reranking / filtering)
    search_k = max(k * 4, 20) if (source_type_filter or active_mode == "hybrid") else k
    distances, indices = _faiss_index.search(query_np, search_k)

    dense_candidates: List[RetrievedChunk] = []
    dense_id_to_dist: Dict[str, float] = {}

    for dist, idx in zip(distances[0], indices[0]):
        if idx < 0 or idx >= len(_chunks_meta):
            continue
        meta = _chunks_meta[idx]

        if source_type_filter:
            chunk_source_type = meta.get("source_type", "")
            if chunk_source_type not in [st.value for st in source_type_filter]:
                continue

        chunk = RetrievedChunk(
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
            similarity=float(dist),
        )
        dense_candidates.append(chunk)
        dense_id_to_dist[chunk.chunk_id] = float(dist)

    # Mode 1: Dense-only (baseline)
    if active_mode == "dense" or not _bm25_retriever:
        logger.debug(f"Retrieved {len(dense_candidates[:k])} chunks [dense] for: {query[:80]}...")
        return dense_candidates[:k]

    # Mode 2: Hybrid (Dense + BM25 + Exact Statutory RRF)
    bm25_scored = _bm25_retriever.score(query)
    bm25_sorted = sorted(bm25_scored, key=lambda x: x[1], reverse=True)

    dense_weight = 0.6
    bm25_weight = 0.4
    rrf_k = 60

    dense_rank_map = {c.chunk_id: r_idx + 1 for r_idx, c in enumerate(dense_candidates)}
    bm25_rank_map = {}
    for r_idx, (c_idx, b_score) in enumerate(bm25_sorted):
        if b_score > 0:
            cid = _chunks_meta[c_idx]["chunk_id"]
            bm25_rank_map[cid] = (r_idx + 1, b_score)

    all_candidate_ids = set(dense_rank_map.keys()) | set(list(bm25_rank_map.keys())[:15])

    rrf_scores: Dict[str, float] = {}
    for cid in all_candidate_ids:
        d_rank = dense_rank_map.get(cid)
        b_info = bm25_rank_map.get(cid)
        b_rank = b_info[0] if b_info else None

        score = 0.0
        if d_rank is not None:
            score += dense_weight * (1.0 / (rrf_k + d_rank))
        if b_rank is not None:
            score += bm25_weight * (1.0 / (rrf_k + b_rank))
        rrf_scores[cid] = score

    sorted_ids = sorted(rrf_scores.keys(), key=lambda x: rrf_scores[x], reverse=True)

    lookup_chunk = {c.chunk_id: c for c in dense_candidates}
    lookup_meta = {m["chunk_id"]: m for m in _chunks_meta}

    final_results: List[RetrievedChunk] = []
    for cid in sorted_ids[:k]:
        if cid in lookup_chunk:
            c = lookup_chunk[cid]
        else:
            meta = lookup_meta[cid]
            c = RetrievedChunk(
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
                similarity=float(dense_id_to_dist.get(cid, 0.5)),
            )
        final_results.append(c)

    logger.debug(f"Retrieved {len(final_results)} chunks [hybrid] for: {query[:80]}...")
    return final_results


def reload_index() -> None:
    """Force reload of the FAISS index and BM25 retriever (call after rebuilding)."""
    global _index_loaded
    _index_loaded = False
    _ensure_index()
    _index_loaded = False
    _ensure_index()
