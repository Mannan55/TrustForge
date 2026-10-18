"""
TrustForge Knowledge Ingestion Pipeline.

Reads source documents from knowledge/sources/, cleans the text,
applies structure-aware chunking, attaches metadata, generates embeddings
using sentence-transformers, and builds/saves a FAISS flat index.

Usage:
    cd backend
    python -m rag.ingest

The pipeline can be re-run at any time to rebuild the index from scratch.
All parameters are read from config.py / .env for reproducibility.
"""
from __future__ import annotations

import hashlib
import json
import logging
import os
import pickle
import re
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from uuid import uuid4

import numpy as np

from config import settings

logger = logging.getLogger(__name__)

# ─── Chunk size configuration (configurable via env) ─────────────────────────
# Target chunk size in characters. Legal documents need enough context for
# semantic meaning — sections vary, so we use a generous target with overlap.
CHUNK_SIZE = int(os.getenv("TRUSTFORGE_CHUNK_SIZE", "800"))
CHUNK_OVERLAP = int(os.getenv("TRUSTFORGE_CHUNK_OVERLAP", "150"))


# ─── Source document registry ─────────────────────────────────────────────────
# This registry defines the authoritative sources for the knowledge base.
# Documents placed in knowledge/sources/ should match the expected filenames.
# The source metadata is attached to every chunk from that document.

SOURCE_REGISTRY: List[Dict[str, Any]] = [
    {
        "document_id": "dpdp-act-2023",
        "document_title": "The Digital Personal Data Protection Act, 2023",
        "authority": "Ministry of Electronics and Information Technology (MeitY), Government of India",
        "source_type": "LEGAL_PRIMARY",
        "source_url": "https://www.meity.gov.in/static/uploads/2024/06/2bf1f0e9f04e6fb4f8fef35e82c42aa5.pdf",
        "publication_date": "2023-08-11",
        "version": "Act No. 22 of 2023",
        "expected_filename": "dpdp_act_2023.pdf",
    },
    {
        "document_id": "dpdp-rules-2025",
        "document_title": "The Digital Personal Data Protection Rules, 2025",
        "authority": "Ministry of Electronics and Information Technology (MeitY), Government of India",
        "source_type": "LEGAL_SECONDARY_OFFICIAL",
        "source_url": "https://www.meity.gov.in/static/uploads/2025/11/53450e6e5dc0bfa85ebd78686cadad39.pdf",
        "publication_date": "2025-11-13",
        "version": "G.S.R. 846(E)",
        "expected_filename": "dpdp_rules_2025_notified.pdf",
    },
    {
        "document_id": "dpdp-act-commencement-2025",
        "document_title": "Notification of Phased Commencement of the DPDP Act, 2023",
        "authority": "Ministry of Electronics and Information Technology (MeitY), Government of India",
        "source_type": "LEGAL_SECONDARY_OFFICIAL",
        "source_url": "https://www.meity.gov.in/static/uploads/2025/11/c56ceae6c383460ca69577428d36828b.pdf",
        "publication_date": "2025-11-13",
        "version": "G.S.R. 843(E)",
        "expected_filename": "dpdp_act_commencement_2025.pdf",
    },
    {
        "document_id": "certin-security-guidelines",
        "document_title": "CERT-In Guidelines for Information Security",
        "authority": "Indian Computer Emergency Response Team (CERT-In)",
        "source_type": "REGULATORY_GUIDANCE",
        "source_url": "https://www.cert-in.org.in/",
        "publication_date": "2022-04-28",
        "version": "2022",
        "expected_filename": "certin_guidelines.txt",
    },
    {
        "document_id": "owasp-security-headers",
        "document_title": "OWASP HTTP Security Response Headers Cheat Sheet",
        "authority": "Open Web Application Security Project (OWASP)",
        "source_type": "SECURITY_GUIDANCE",
        "source_url": "https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html",
        "publication_date": "2024-01-01",
        "version": "2024",
        "expected_filename": "owasp_security_headers.txt",
    },
]

# Built-in DPDP Act text (key sections) for immediate use without document upload.
# This is embedded to ensure the system functions for research before the full
# official gazette text is manually placed in knowledge/sources/.
# SOURCE: Based on The Digital Personal Data Protection Act, 2023 (No. 22 of 2023)
# as published in the Gazette of India Extraordinary, Part II, Section 1, dated 11-08-2023.
BUILTIN_DPDP_SECTIONS: List[Dict[str, Any]] = [
    {
        "section": "Preamble",
        "heading": "Preamble",
        "text": (
            "An Act to provide for the processing of digital personal data in a manner that "
            "recognises both the right of individuals to protect their personal data and the "
            "need to process such personal data for lawful purposes and for matters connected "
            "therewith or incidental thereto. BE it enacted by Parliament in the Seventy-fourth "
            "Year of the Republic of India as follows."
        ),
    },
    {
        "section": "Section 2",
        "heading": "Section 2 — Definitions",
        "text": (
            "In this Act, unless the context otherwise requires: "
            "'consent manager' means a person registered with the Board, who acts as a single "
            "point of contact to enable a Data Principal to give, manage, review and withdraw "
            "her consent through an accessible, transparent and interoperable platform; "
            "'data fiduciary' means any person who alone or in conjunction with other persons "
            "determines the purpose and means of processing of personal data; "
            "'data principal' means the individual to whom the personal data relates and where "
            "such individual is a child, includes the parents or lawful guardian of such individual; "
            "'data processor' means any person who processes personal data on behalf of a Data "
            "Fiduciary; "
            "'personal data' means any data about an individual who is identifiable by or in relation "
            "to such data; "
            "'personal data breach' means any unauthorised processing of personal data or accidental "
            "disclosure, acquisition, sharing, use, alteration, destruction or loss of access to "
            "personal data, that compromises the confidentiality, integrity or availability of "
            "personal data; "
            "'processing' means a wholly or partly automated operation or set of operations performed "
            "on digital personal data, and includes collection, recording, organisation, structuring, "
            "storage, adaptation, retrieval, use, alignment or combination, indexing, sharing, "
            "disclosure by transmission, dissemination or otherwise making available, restriction, "
            "erasure or destruction."
        ),
    },
    {
        "section": "Section 4",
        "heading": "Section 4 — Grounds for Processing Personal Data",
        "text": (
            "A Data Fiduciary may process the personal data of a Data Principal only in accordance "
            "with the provisions of this Act for any lawful purpose — "
            "(a) for which the Data Principal has given her consent; or "
            "(b) for certain legitimate uses specified under this Act. "
            "Every Data Fiduciary who intends to process personal data shall give to the Data "
            "Principal a notice before seeking her consent and shall not, while seeking consent, "
            "engage in any unfair trade practice."
        ),
    },
    {
        "section": "Section 5",
        "heading": "Section 5 — Notice",
        "text": (
            "Every Data Fiduciary who intends to process the personal data of a Data Principal "
            "for the first time shall give to such Data Principal a notice, before requesting for "
            "consent, containing — "
            "(a) a description of the personal data sought to be collected and the purpose of "
            "processing of such personal data; "
            "(b) the manner in which the Data Principal may exercise her rights under the provisions "
            "of this Act; and "
            "(c) the manner in which the Data Principal may make a complaint to the Board. "
            "Such notice shall be available in English or any language specified in the Eighth "
            "Schedule to the Constitution."
        ),
    },
    {
        "section": "Section 6",
        "heading": "Section 6 — Consent",
        "text": (
            "Consent given by a Data Principal shall be free, specific, informed, unconditional "
            "and unambiguous with a clear affirmative action, and shall signify an agreement to "
            "the processing of her personal data for the specified purpose. "
            "The Data Principal shall have the right to withdraw her consent at any time, with the "
            "ease of the same standard as giving consent. The withdrawal of consent shall not affect "
            "the lawfulness of processing of personal data based on consent before its withdrawal. "
            "Where the Data Principal withdraws consent, the Data Fiduciary shall, within a "
            "reasonable period, cease to and cause its Data Processors to cease to process the "
            "personal data of such Data Principal unless such processing is required or authorised "
            "under any law for the time being in force."
        ),
    },
    {
        "section": "Section 7",
        "heading": "Section 7 — Certain Legitimate Uses",
        "text": (
            "A Data Fiduciary may process personal data of a Data Principal without obtaining "
            "consent under section 6 for any of the following purposes, namely: "
            "(a) in case the Data Principal has voluntarily provided her personal data and not "
            "indicated that she does not consent to the use of her personal data; "
            "(b) by the State or any instrumentality of the State for performance of a function "
            "under any law; "
            "(c) for compliance with any judgment or order issued under any law in force in India; "
            "(d) for responding to a medical emergency involving a threat to life; "
            "(e) for taking measures to provide medical treatment or health services during an "
            "epidemic, outbreak of disease, or any other threat to public health; "
            "(f) for taking measures to ensure safety of, or provide assistance or services to, "
            "any individual during any disaster or breakdown of public order; "
            "(g) for purposes related to employment."
        ),
    },
    {
        "section": "Section 8",
        "heading": "Section 8 — General Obligations of Data Fiduciary",
        "text": (
            "Every Data Fiduciary shall — "
            "(1) make reasonable efforts to ensure that the personal data of the Data Principal, "
            "that is processed, is accurate and complete; "
            "(2) implement appropriate technical and organisational measures to ensure that processing "
            "of personal data is consistent with this Act; "
            "(3) protect personal data in its possession or under its control, including in respect of "
            "any processing undertaken by it or on its behalf by a Data Processor, by taking reasonable "
            "security safeguards to prevent personal data breach; "
            "(4) in the event of a personal data breach, give the Board and each affected Data Principal "
            "notice of such breach in such manner as may be prescribed; "
            "(5) retain data only for so long as is necessary for the specified purpose; "
            "(6) publish the business contact information of a Data Protection Officer or such other "
            "key managerial personnel as may be prescribed, who shall respond to any correspondence "
            "from Data Principals or the Board; "
            "(7) prior to engaging a Data Processor for the processing of personal data on behalf of "
            "the Data Fiduciary, the Data Fiduciary shall enter into a valid contract with the Data "
            "Processor."
        ),
    },
    {
        "section": "Section 9",
        "heading": "Section 9 — Processing of Personal Data of Children",
        "text": (
            "A Data Fiduciary shall, before processing any personal data of a child, obtain verifiable "
            "consent of the parent or the lawful guardian of such child in such manner as may be "
            "prescribed. A Data Fiduciary shall not undertake processing of personal data that is "
            "likely to cause any detrimental effect on the well-being of a child. A Data Fiduciary "
            "shall not undertake tracking or behavioural monitoring of children or targeted advertising "
            "directed at children."
        ),
    },
    {
        "section": "Section 10",
        "heading": "Section 10 — Significant Data Fiduciary",
        "text": (
            "The Central Government may, on the basis of an assessment of such relevant factors as it "
            "may consider necessary, notify any Data Fiduciary or class of Data Fiduciaries as "
            "Significant Data Fiduciary. In determining whether to notify a Data Fiduciary as a "
            "Significant Data Fiduciary, the Central Government may consider the volume and sensitivity "
            "of personal data processed, risk to the rights of Data Principals, potential impact on "
            "sovereignty and integrity of India, risk to electoral democracy, security of the State, "
            "and public order."
        ),
    },
    {
        "section": "Section 11",
        "heading": "Section 11 — Right to Access Information about Personal Data",
        "text": (
            "A Data Principal shall, subject to such terms and conditions as may be prescribed, "
            "have the right to obtain from the Data Fiduciary — "
            "(a) a summary of personal data which is being processed by the Data Fiduciary and the "
            "processing activities undertaken by that Data Fiduciary with respect to such personal data; "
            "(b) identities of all other Data Fiduciaries and Data Processors with whom personal data "
            "has been shared by the Data Fiduciary, along with a description of the personal data so "
            "shared; and "
            "(c) any other information related to personal data of such Data Principal and its "
            "processing, as may be prescribed."
        ),
    },
    {
        "section": "Section 12",
        "heading": "Section 12 — Right to Correction and Erasure of Personal Data",
        "text": (
            "A Data Principal shall have the right to — "
            "(a) correction of inaccurate or misleading personal data; "
            "(b) completion of incomplete personal data; "
            "(c) updating of personal data that is out-of-date; and "
            "(d) erasure of personal data, the retention of which is no longer necessary for the "
            "purpose for which it was collected, in accordance with the provisions of this Act."
        ),
    },
    {
        "section": "Section 13",
        "heading": "Section 13 — Right to Grievance Redressal",
        "text": (
            "A Data Principal shall have the right to have grievances redressed. A Data Principal "
            "may register a grievance with the Data Fiduciary regarding any act or omission of the "
            "Data Fiduciary or its Data Processor regarding the performance of their obligations "
            "in relation to personal data of the Data Principal or the rights of the Data Principal "
            "under the provisions of this Act. The Data Fiduciary shall respond within such period "
            "and in such manner as may be prescribed."
        ),
    },
    {
        "section": "Section 14",
        "heading": "Section 14 — Right to Nominate",
        "text": (
            "A Data Principal shall have the right to nominate, in the event of her death or "
            "incapacity, any other individual who shall, in the event of the death or incapacity of "
            "the Data Principal, exercise the rights of the Data Principal in accordance with the "
            "provisions of this Act."
        ),
    },
    {
        "section": "Section 17",
        "heading": "Section 17 — Exemptions",
        "text": (
            "The Central Government may, by notification, exempt from the application of this Act "
            "or any provision thereof, the processing of personal data — "
            "(a) by any instrumentality of the State in the interests of sovereignty and integrity "
            "of India, security of the State, friendly relations with foreign States, maintenance "
            "of public order, or preventing incitement to any cognisable offence relating to any "
            "of these; "
            "(b) for the purpose of research, archiving or statistical purpose if the personal data "
            "is not used to take any decision specific to a Data Principal; "
            "(c) for the purposes of prevention, detection, investigation or prosecution of offences "
            "or contravention of any law."
        ),
    },
]


def _load_builtin_corpus() -> List[Dict[str, Any]]:
    """
    Generate chunks from the built-in DPDP Act section texts.
    Each section becomes one or more chunks with full provenance metadata.
    """
    doc_meta = SOURCE_REGISTRY[0]  # DPDP Act 2023
    chunks = []

    for sec in BUILTIN_DPDP_SECTIONS:
        # Split long sections into overlapping chunks if needed
        text = sec["text"]
        sub_chunks = _split_text(text, CHUNK_SIZE, CHUNK_OVERLAP)
        for idx, chunk_text in enumerate(sub_chunks):
            chunk_id = f"{doc_meta['document_id']}-{sec['section'].lower().replace(' ', '-')}-{idx}"
            chunks.append({
                "chunk_id": chunk_id,
                "document_id": doc_meta["document_id"],
                "document_title": doc_meta["document_title"],
                "authority": doc_meta["authority"],
                "source_type": doc_meta["source_type"],
                "section": sec["section"],
                "heading": sec["heading"],
                "subsection": None,
                "text": chunk_text.strip(),
                "source_url": doc_meta["source_url"],
                "publication_date": doc_meta["publication_date"],
                "version": doc_meta["version"],
            })
    return chunks


def _load_source_file(source_meta: Dict, sources_dir: Path) -> List[Dict[str, Any]]:
    """
    Load a source document from disk, clean it, and chunk it.
    Returns list of chunk dicts.
    """
    filename = source_meta.get("expected_filename", "")
    filepath = sources_dir / filename

    if not filepath.exists():
        logger.warning(f"Source file not found: {filepath}. Skipping.")
        return []

    logger.info(f"Loading: {filepath.name}")
    text = filepath.read_text(encoding="utf-8", errors="replace")
    text = _clean_text(text)

    # Structure-aware chunking: split on section/rule/chapter headings first
    sections = _split_on_structure(text)
    chunks = []

    for sec_heading, sec_text in sections:
        sub_chunks = _split_text(sec_text, CHUNK_SIZE, CHUNK_OVERLAP)
        for idx, chunk_text in enumerate(sub_chunks):
            if not chunk_text.strip():
                continue
            chunk_id = (
                f"{source_meta['document_id']}-"
                + _slugify(sec_heading or "body")
                + f"-{idx}"
            )
            chunks.append({
                "chunk_id": chunk_id,
                "document_id": source_meta["document_id"],
                "document_title": source_meta["document_title"],
                "authority": source_meta["authority"],
                "source_type": source_meta["source_type"],
                "section": sec_heading,
                "heading": sec_heading,
                "subsection": None,
                "text": chunk_text.strip(),
                "source_url": source_meta.get("source_url"),
                "publication_date": source_meta.get("publication_date"),
                "version": source_meta.get("version"),
            })
    return chunks


def _clean_text(text: str) -> str:
    """Remove artefacts from PDFs/text extraction while preserving structure."""
    # Remove null bytes
    text = text.replace("\x00", "")
    # Collapse runs of spaces (but not newlines)
    text = re.sub(r"[ \t]{2,}", " ", text)
    # Collapse blank lines (keep at most one blank line)
    text = re.sub(r"\n{3,}", "\n\n", text)
    # Remove page numbers (common PDF patterns)
    text = re.sub(r"\n\s*\d+\s*\n", "\n", text)
    return text.strip()


def _split_on_structure(text: str) -> List[Tuple[Optional[str], str]]:
    """
    Split text on section/chapter/rule headings.
    Returns list of (heading, body_text) tuples.
    """
    # Pattern: "Section X", "Chapter Y", "Rule Z", "Article N"
    heading_pattern = re.compile(
        r"(?m)^((?:Section|Chapter|Rule|Article|Schedule|Clause|Sub-rule|Part)\s+[\d\.]+[A-Za-z]?[.\s—-]+[^\n]*)",
        re.IGNORECASE,
    )
    parts = heading_pattern.split(text)

    sections = []
    if parts[0].strip():
        sections.append((None, parts[0]))

    i = 1
    while i < len(parts):
        heading = parts[i].strip() if i < len(parts) else ""
        body = parts[i + 1].strip() if i + 1 < len(parts) else ""
        sections.append((heading, body))
        i += 2

    # If no structure detected, treat as one block
    if not sections:
        sections = [(None, text)]

    return sections


def _split_text(text: str, chunk_size: int, overlap: int) -> List[str]:
    """
    Split text into overlapping chunks preserving paragraph boundaries where possible.
    """
    if len(text) <= chunk_size:
        return [text]

    chunks = []
    paragraphs = re.split(r"\n\n+", text)

    current = []
    current_len = 0

    for para in paragraphs:
        para = para.strip()
        if not para:
            continue
        para_len = len(para)

        if current_len + para_len > chunk_size and current:
            chunks.append(" ".join(current))
            # Overlap: keep the last ~overlap characters worth of paragraphs
            overlap_text = " ".join(current)[-overlap:]
            current = [overlap_text]
            current_len = len(overlap_text)

        current.append(para)
        current_len += para_len + 1

    if current:
        chunks.append(" ".join(current))

    return chunks or [text]


def _slugify(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-")[:60]


def _load_authoritative_corpus() -> List[Dict[str, Any]]:
    """
    Load the complete authoritative DPDP statutory corpus (DPDP Act 2023, Notified Rules 2025,
    and Commencement Notification 2025) built from official Government of India publications.
    """
    corpus_file = Path(__file__).resolve().parent.parent / "knowledge" / "authoritative_corpus.json"
    if not corpus_file.exists():
        from knowledge.build_authoritative_corpus import build_authoritative_corpus
        return build_authoritative_corpus()
    with open(corpus_file, "r", encoding="utf-8") as f:
        return json.load(f)


def build_index() -> None:
    """
    Main entry point: load authoritative corpus, embed, and save FAISS index.
    """
    import faiss
    from sentence_transformers import SentenceTransformer

    index_dir = settings.knowledge_index_path
    index_dir.mkdir(parents=True, exist_ok=True)
    sources_dir = Path("knowledge/sources")
    sources_dir.mkdir(parents=True, exist_ok=True)

    logger.info(f"Building knowledge index in: {index_dir}")
    logger.info(f"Embedding model: {settings.embedding_model}")
    logger.info(f"Chunk size: {CHUNK_SIZE}, overlap: {CHUNK_OVERLAP}")

    # 1. Load authoritative DPDP statutory corpus (Act 2023, Rules 2025, Commencement 2025)
    all_chunks: List[Dict] = _load_authoritative_corpus()
    logger.info(f"Authoritative DPDP statutory corpus: {len(all_chunks)} chunks")

    # 2. Load any additional non-statutory guidance documents placed in knowledge/sources/
    for src_meta in SOURCE_REGISTRY[3:]:   # CERT-In, OWASP
        extra_chunks = _load_source_file(src_meta, sources_dir)
        if extra_chunks:
            all_chunks.extend(extra_chunks)
            logger.info(f"  + {src_meta['document_id']}: {len(extra_chunks)} chunks")

    if not all_chunks:
        logger.error("No chunks produced — cannot build index.")
        return

    # 3. Load embedding model
    logger.info(f"Loading embedding model: {settings.embedding_model}")
    start = time.time()
    model = SentenceTransformer(settings.embedding_model)
    logger.info(f"Model loaded in {time.time() - start:.1f}s")

    # 4. Embed all chunks
    texts = [c["text"] for c in all_chunks]
    logger.info(f"Embedding {len(texts)} chunks...")
    start = time.time()
    embeddings = model.encode(
        texts,
        batch_size=32,
        show_progress_bar=True,
        normalize_embeddings=True,   # cosine similarity via dot product
    )
    logger.info(f"Embedding complete in {time.time() - start:.1f}s")

    embeddings_np = np.array(embeddings, dtype=np.float32)
    dim = embeddings_np.shape[1]
    logger.info(f"Embedding dimension: {dim}, total vectors: {len(embeddings_np)}")

    # 5. Build FAISS index (flat inner product = cosine similarity on normalised vectors)
    index = faiss.IndexFlatIP(dim)
    index.add(embeddings_np)
    logger.info(f"FAISS index built: {index.ntotal} vectors")

    # 6. Save index and metadata
    faiss_path = index_dir / "trustforge.faiss"
    meta_path = index_dir / "chunks.pkl"

    faiss.write_index(index, str(faiss_path))
    with open(meta_path, "wb") as f:
        pickle.dump(all_chunks, f)

    # 7. Save index configuration for reproducibility
    config_record = {
        "embedding_model": settings.embedding_model,
        "embedding_dimension": dim,
        "similarity_metric": "cosine (inner product on normalised vectors)",
        "chunk_size": CHUNK_SIZE,
        "chunk_overlap": CHUNK_OVERLAP,
        "total_chunks": len(all_chunks),
        "sources": [
            {"document_id": c["document_id"], "source_type": c["source_type"]}
            for c in all_chunks
        ],
        "built_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "faiss_index_file": str(faiss_path),
        "metadata_file": str(meta_path),
    }
    config_path = index_dir / "index_config.json"
    config_path.write_text(json.dumps(config_record, indent=2), encoding="utf-8")

    logger.info(
        f"Index saved:\n"
        f"  FAISS: {faiss_path}\n"
        f"  Metadata: {meta_path}\n"
        f"  Config: {config_path}\n"
        f"  Total chunks: {len(all_chunks)}"
    )
    print(
        f"\nKnowledge index built successfully.\n"
        f"  Chunks: {len(all_chunks)}\n"
        f"  Model: {settings.embedding_model} ({dim}-dim)\n"
        f"  Index: {faiss_path}"
    )


if __name__ == "__main__":
    import logging
    logging.basicConfig(level=logging.INFO, format="[%(levelname)s] %(message)s")
    build_index()
