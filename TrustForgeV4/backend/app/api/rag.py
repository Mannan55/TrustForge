"""
TrustForge — RAG API Routes
POST /api/rag/ingest   — build FAISS index from corpus
POST /api/rag/query    — retrieve relevant legal provisions
GET  /api/rag/status   — check if index is built
"""
from fastapi import APIRouter, HTTPException
from app.schemas import RAGQuery, RAGResult
from app.services.rag_engine import build_index_from_corpus, retrieve, is_index_built

router = APIRouter(prefix="/api", tags=["RAG"])


@router.post("/rag/ingest")
def ingest_corpus() -> dict:
    """
    Ingest the DPDP legal corpus from data/legal/*.txt files.
    
    - Chunks documents by section/subsection boundaries
    - Embeds chunks using all-MiniLM-L6-v2 (local, free)
    - Builds FAISS index for retrieval
    
    This must be run at least once before RAG queries work.
    Expected runtime: ~30-90 seconds (first download of model may take longer).
    """
    result = build_index_from_corpus()
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
    return result


@router.post("/rag/query", response_model=RAGResult)
def query_rag(request: RAGQuery) -> RAGResult:
    """
    Retrieve top-K relevant DPDP legal provisions for a query.
    
    Returns chunks with:
    - Source document
    - Section/rule number
    - Heading
    - Relevant text snippet
    - Cosine similarity score
    """
    if not is_index_built():
        raise HTTPException(
            status_code=503,
            detail="FAISS index not built. Run POST /api/rag/ingest first."
        )
    return retrieve(request.query, top_k=request.top_k)


@router.get("/rag/status")
def rag_status() -> dict:
    """Check whether the RAG index has been built."""
    built = is_index_built()
    return {
        "index_built": built,
        "message": "Ready for retrieval." if built else "Run POST /api/rag/ingest to build the index.",
    }
