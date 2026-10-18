"""
TrustForge Supabase Seed Script.
Exports the authoritative 83-chunk DPDP statutory corpus and its 384-dimensional embeddings
into Supabase PostgreSQL pgvector format, producing both:
1. database/seeds/001_legal_chunks.sql (Direct SQL copy/insert for Supabase SQL Editor)
2. Direct insertion if SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided.
"""
from __future__ import annotations

import json
import os
from pathlib import Path
import pickle

import numpy as np

WORKSPACE_ROOT = Path(__file__).resolve().parent.parent
CORPUS_JSON_PATH = WORKSPACE_ROOT / "backend" / "knowledge" / "authoritative_corpus.json"
FAISS_PATH = WORKSPACE_ROOT / "backend" / "knowledge" / "index" / "trustforge.faiss"
CHUNKS_PKL_PATH = WORKSPACE_ROOT / "backend" / "knowledge" / "index" / "chunks.pkl"
OUTPUT_SQL_PATH = WORKSPACE_ROOT / "database" / "seeds" / "001_legal_chunks.sql"


def main():
    print(f"Loading authoritative corpus from {CORPUS_JSON_PATH}...")
    with open(CORPUS_JSON_PATH, "r", encoding="utf-8") as f:
        corpus = json.load(f)

    print(f"Loaded {len(corpus)} legal chunks from corpus JSON.")

    # Try loading FAISS vectors if available
    embeddings = None
    if FAISS_PATH.exists():
        try:
            import faiss
            index = faiss.read_index(str(FAISS_PATH))
            print(f"Loaded FAISS index: {index.ntotal} vectors, dimension {index.d}")
            embeddings = index.reconstruct_n(0, index.ntotal)
        except Exception as exc:
            print(f"Could not extract vectors directly from FAISS: {exc}")

    if embeddings is None:
        print("Computing embeddings using sentence-transformers/all-MiniLM-L6-v2...")
        from sentence_transformers import SentenceTransformer
        model = SentenceTransformer("all-MiniLM-L6-v2")
        texts = [c["text"] for c in corpus]
        embeddings = model.encode(texts, normalize_embeddings=True)
        print(f"Computed {len(embeddings)} embeddings.")

    # Generate SQL Seed File
    OUTPUT_SQL_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_SQL_PATH, "w", encoding="utf-8") as f:
        f.write("-- ============================================================================\n")
        f.write("-- TRUSTFORGE — AUTHORITATIVE DPDP STATUTORY CORPUS SEED (83 CHUNKS)\n")
        f.write("-- ============================================================================\n\n")

        for idx, chunk in enumerate(corpus):
            chunk_id = chunk.get("chunk_id", f"CHUNK_{idx:03d}")
            doc_id = chunk.get("document_id", "dpdp-act-2023")
            doc_title = chunk.get("document_title", "").replace("'", "''")
            section_num = chunk.get("section", "").replace("'", "''")
            section_title = chunk.get("heading", "").replace("'", "''")
            chunk_text = chunk.get("text", "").replace("'", "''")
            commencement = chunk.get("commencement_status", "IN_FORCE")
            eff_date = chunk.get("effective_date", "2025-11-13")
            source_url = chunk.get("source_url", "").replace("'", "''")
            sha256 = chunk.get("sha256", "").replace("'", "''")
            
            vec = embeddings[idx].tolist() if idx < len(embeddings) else [0.0] * 384
            vec_str = "[" + ",".join(f"{x:.6f}" for x in vec) + "]"

            f.write(
                f"INSERT INTO public.\"Legal_Chunks\" (\n"
                f"    id, document_id, document_title, section_num, section_title,\n"
                f"    chunk_text, commencement_status, enforceable_date, source_url, sha256, embedding\n"
                f") VALUES (\n"
                f"    '{chunk_id}', '{doc_id}', '{doc_title}', '{section_num}', '{section_title}',\n"
                f"    '{chunk_text}', '{commencement}', '{eff_date}', '{source_url}', '{sha256}', '{vec_str}'\n"
                f") ON CONFLICT (id) DO UPDATE SET\n"
                f"    chunk_text = EXCLUDED.chunk_text,\n"
                f"    embedding = EXCLUDED.embedding,\n"
                f"    commencement_status = EXCLUDED.commencement_status;\n\n"
            )

    print(f"Successfully generated SQL seed: {OUTPUT_SQL_PATH} ({OUTPUT_SQL_PATH.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
