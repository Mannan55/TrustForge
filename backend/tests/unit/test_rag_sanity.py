import os, sys, asyncio
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from rag.retrieval import retrieve

queries = [
    "consent",
    "notice",
    "data fiduciary obligations",
    "breach security safeguards",
    "children data",
    "access rights",
    "correction and erasure",
    "grievance redressal",
    "nomination",
    "Significant Data Fiduciary",
]

async def run_all():
    print("=" * 80)
    print("TRUSTFORGE RAG RETRIEVAL SANITY AUDIT (10 CANONICAL QUERIES)")
    print("=" * 80)
    for q in queries:
        chunks = await retrieve(q, top_k=3)
        print(f"\n[QUERY]: '{q}'")
        for idx, c in enumerate(chunks):
            print(f"  Rank {idx+1}: {c.chunk_id:<28} | {str(c.section):<12} | Sim={c.similarity:.4f} | {c.text[:80]}...")

if __name__ == "__main__":
    asyncio.run(run_all())
