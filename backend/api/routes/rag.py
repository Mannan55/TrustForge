"""
RAG retrieval endpoint — returns authoritative passages for a query.

POST /api/rag/retrieve
"""
from __future__ import annotations

import logging
from typing import List

from fastapi import APIRouter, HTTPException
from core.models import RAGQuery, RetrievedChunk
from rag.retrieval import retrieve

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/rag/retrieve", response_model=List[RetrievedChunk])
async def rag_retrieve(query: RAGQuery) -> List[RetrievedChunk]:
    """
    Retrieve top-K authoritative passages relevant to the query.

    Returns chunks with full provenance (document, section, authority, source URL).
    """
    try:
        chunks = await retrieve(
            query=query.query,
            top_k=query.top_k,
            source_type_filter=query.source_type_filter,
        )
        return chunks
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except Exception as exc:
        logger.exception(f"RAG retrieval failed: {exc}")
        raise HTTPException(status_code=500, detail=f"Retrieval error: {exc}")
