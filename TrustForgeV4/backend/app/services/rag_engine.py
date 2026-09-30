"""
TrustForge — RAG Engine (Retrieval-Augmented Generation)

Pipeline:
  DPDP legal corpus (text) → Chunking → Embeddings (sentence-transformers)
  → FAISS vector store → Query → Top-K retrieval → Contextual analysis

Model: all-MiniLM-L6-v2 (free, local, ~90MB)
Vector store: FAISS (CPU, local, no paid infrastructure)

Legal sources:
  - Digital Personal Data Protection Act, 2023
  - Digital Personal Data Protection Rules, 2025
  - (Supporting technical material labelled as non-statutory)
"""
from __future__ import annotations

import json
import os
import re
from pathlib import Path
from typing import Optional

import numpy as np

from app.config import settings
from app.schemas import RAGResult, RAGChunk

# Lazy-load heavy deps to avoid startup delay
_embedder = None
_faiss_index = None
_faiss_metadata: list[dict] = []


def _get_embedder():
    global _embedder
    if _embedder is None:
        from sentence_transformers import SentenceTransformer
        _embedder = SentenceTransformer(settings.embedding_model)
    return _embedder


def _get_index_and_metadata():
    global _faiss_index, _faiss_metadata
    if _faiss_index is None:
        import faiss
        index_path = Path(settings.faiss_index_path)
        meta_path = Path(settings.faiss_metadata_path)

        if not index_path.exists():
            raise FileNotFoundError(
                f"FAISS index not found at {index_path}. "
                "Run: POST /api/rag/ingest to build the index."
            )
        _faiss_index = faiss.read_index(str(index_path))
        with open(meta_path, "r", encoding="utf-8") as f:
            _faiss_metadata = json.load(f)
    return _faiss_index, _faiss_metadata


def embed_texts(texts: list[str]) -> np.ndarray:
    """Embed a list of texts using the sentence transformer model."""
    embedder = _get_embedder()
    return embedder.encode(texts, convert_to_numpy=True, show_progress_bar=False)


def build_index_from_corpus(corpus_dir: Optional[str] = None) -> dict:
    """
    Ingest legal corpus documents, chunk them, embed, and build FAISS index.
    
    Corpus directory structure:
      data/legal/
        dpdp_act_2023.txt      — primary statute
        dpdp_rules_2025.txt    — final notified rules
        (any other .txt files)

    Returns a summary of what was ingested.
    """
    import faiss

    if corpus_dir is None:
        corpus_dir = str(Path(__file__).parent.parent.parent / "data" / "legal")

    corpus_path = Path(corpus_dir)
    if not corpus_path.exists():
        return {"error": f"Corpus directory not found: {corpus_dir}"}

    all_chunks: list[dict] = []

    for txt_file in sorted(corpus_path.glob("*.txt")):
        doc_name = txt_file.stem
        text = txt_file.read_text(encoding="utf-8", errors="replace")
        chunks = _chunk_legal_document(text, doc_name)
        all_chunks.extend(chunks)

    if not all_chunks:
        return {"error": "No .txt files found in corpus directory."}

    # Embed all chunks
    texts = [c["text"] for c in all_chunks]
    embedder = _get_embedder()
    embeddings = embedder.encode(texts, convert_to_numpy=True, show_progress_bar=True)

    # Build FAISS index
    dim = embeddings.shape[1]
    index = faiss.IndexFlatIP(dim)  # Inner product (cosine on normalized vecs)

    # Normalize for cosine similarity
    norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
    norms = np.where(norms == 0, 1, norms)
    embeddings_norm = embeddings / norms
    index.add(embeddings_norm.astype(np.float32))

    # Save index and metadata
    index_path = Path(settings.faiss_index_path)
    meta_path = Path(settings.faiss_metadata_path)
    index_path.parent.mkdir(parents=True, exist_ok=True)

    faiss.write_index(index, str(index_path))
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(all_chunks, f, ensure_ascii=False, indent=2)

    # Reset cached index so next query uses new one
    global _faiss_index, _faiss_metadata
    _faiss_index = index
    _faiss_metadata = all_chunks

    return {
        "total_chunks": len(all_chunks),
        "documents_ingested": len(list(corpus_path.glob("*.txt"))),
        "index_path": str(index_path),
        "embedding_model": settings.embedding_model,
    }


def _chunk_legal_document(text: str, doc_name: str) -> list[dict]:
    """
    Chunk a legal document by section/subsection boundaries.
    Preserves metadata: document, section, heading, text.
    
    Avoids splitting mid-provision.
    """
    chunks = []

    # Try to split by numbered section/rule patterns
    # Covers: "1.", "Section 1", "1. Short title", "Rule 1.", etc.
    section_pattern = re.compile(
        r'(?m)^(?:'
        r'(?:Section|Rule|Clause|Schedule|Chapter)\s+\d+[\.\(]?'
        r'|\d+\.\s+'
        r')',
        re.IGNORECASE
    )

    positions = [m.start() for m in section_pattern.finditer(text)]

    if len(positions) < 2:
        # Fallback: chunk by paragraph/blank line
        paragraphs = re.split(r'\n{2,}', text.strip())
        for i, para in enumerate(paragraphs):
            para = para.strip()
            if len(para) < 50:
                continue
            chunks.append({
                "document": _doc_label(doc_name),
                "section": f"Para {i+1}",
                "heading": para[:60].strip(),
                "text": para[:2000],
                "source": doc_name,
            })
        return chunks

    # Use section positions to extract section text
    for i, pos in enumerate(positions):
        end = positions[i + 1] if i + 1 < len(positions) else len(text)
        section_text = text[pos:end].strip()
        if len(section_text) < 30:
            continue

        # Extract heading from first line
        lines = section_text.splitlines()
        heading = lines[0].strip()[:120] if lines else ""

        # Try to parse section number from heading
        sec_match = re.match(r'^((?:Section|Rule|Clause|Schedule)\s+\d+\w*\.?|\d+\.)', heading, re.IGNORECASE)
        section_id = sec_match.group(0).strip() if sec_match else f"Part {i+1}"

        # Chunk large sections into sub-chunks (max ~800 tokens ≈ 3200 chars)
        MAX_CHARS = 3200
        if len(section_text) <= MAX_CHARS:
            chunks.append({
                "document": _doc_label(doc_name),
                "section": section_id,
                "heading": heading,
                "text": section_text[:MAX_CHARS],
                "source": doc_name,
            })
        else:
            # Sub-chunk by subsection
            sub_parts = re.split(r'\n(?=\s*\(\w\)\s)', section_text)
            for j, part in enumerate(sub_parts):
                part = part.strip()
                if len(part) < 30:
                    continue
                chunks.append({
                    "document": _doc_label(doc_name),
                    "section": f"{section_id}({j+1})" if j > 0 else section_id,
                    "heading": heading if j == 0 else f"{heading} (continued)",
                    "text": part[:MAX_CHARS],
                    "source": doc_name,
                })

    return chunks


def _doc_label(stem: str) -> str:
    labels = {
        "dpdp_act_2023": "Digital Personal Data Protection Act, 2023",
        "dpdp_rules_2025": "Digital Personal Data Protection Rules, 2025",
        "cert_in_guidance": "CERT-In Guidance (Technical Reference)",
        "owasp_guidance": "OWASP Guidance (Technical Reference — Not a DPDP Provision)",
        "nist_guidance": "NIST Guidance (Technical Reference — Not a DPDP Provision)",
    }
    for key, label in labels.items():
        if key in stem.lower():
            return label
    return stem.replace("_", " ").title()


def retrieve(query: str, top_k: int = 5) -> RAGResult:
    """
    Retrieve the top-k most relevant chunks for a query.
    Returns RAGResult with chunks sorted by relevance score.
    """
    import faiss

    embedder = _get_embedder()
    index, metadata = _get_index_and_metadata()

    q_emb = embedder.encode([query], convert_to_numpy=True)
    norm = np.linalg.norm(q_emb, axis=1, keepdims=True)
    norm = np.where(norm == 0, 1, norm)
    q_emb_norm = (q_emb / norm).astype(np.float32)

    k = min(top_k, index.ntotal)
    scores, indices = index.search(q_emb_norm, k)

    chunks = []
    for score, idx in zip(scores[0], indices[0]):
        if idx < 0 or idx >= len(metadata):
            continue
        meta = metadata[idx]
        chunks.append(RAGChunk(
            document=meta.get("document", ""),
            section=meta.get("section", ""),
            heading=meta.get("heading", ""),
            text=meta.get("text", ""),
            score=float(score),
        ))

    return RAGResult(query=query, chunks=chunks, top_k=top_k)


def is_index_built() -> bool:
    """Check whether the FAISS index has been built."""
    return Path(settings.faiss_index_path).exists()
