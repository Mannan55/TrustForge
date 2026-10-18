"""
TrustForge Authoritative Legal Corpus RAG Retrieval Benchmark Runner (Phase 3).

Evaluates dense semantic retrieval against the expanded 83-chunk authoritative DPDP corpus
(DPDP Act 2023, Notified Rules 2025, and Phased Commencement Notification 2025).

Outputs:
- CSV: docs/research/evaluation/results/rag_results_v2_authoritative.csv
- JSON: docs/research/evaluation/results/rag_summary_v2_authoritative.json
"""
from __future__ import annotations

import asyncio
import csv
import json
import math
import os
import sys
import time
from pathlib import Path

# Setup paths
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT / "backend"))

from rag.retrieval import retrieve, reload_index


def compute_dcg(relevances: list[float], k: int) -> float:
    dcg = 0.0
    for i in range(min(k, len(relevances))):
        rel = relevances[i]
        dcg += (math.pow(2, rel) - 1.0) / math.log2(i + 2)
    return dcg


def compute_ndcg(retrieved_ids: list[str], rel_grades: dict[str, int], k: int) -> float:
    if not rel_grades:
        return 1.0 if not retrieved_ids else 0.0
    retrieved_rel = [float(rel_grades.get(cid, 0)) for cid in retrieved_ids[:k]]
    actual_dcg = compute_dcg(retrieved_rel, k)

    ideal_rel = sorted(list(rel_grades.values()), reverse=True)
    ideal_dcg = compute_dcg(ideal_rel, k)

    if ideal_dcg <= 0.0:
        return 0.0
    return actual_dcg / ideal_dcg


async def run_rag_evaluation_v2():
    reload_index()

    benchmark_path = PROJECT_ROOT / "docs" / "research" / "evaluation" / "datasets" / "rag_retrieval_benchmark_v2_authoritative.json"
    with open(benchmark_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    queries = data["queries"]
    results_rows = []

    answerable_stats = {
        "count": 0,
        "hit@1": 0, "hit@3": 0, "hit@5": 0,
        "p@1": 0.0, "p@3": 0.0, "p@5": 0.0,
        "r@1": 0.0, "r@3": 0.0, "r@5": 0.0,
        "mrr@1": 0.0, "mrr@3": 0.0, "mrr@5": 0.0,
        "ndcg@1": 0.0, "ndcg@3": 0.0, "ndcg@5": 0.0,
    }

    out_of_scope_stats = {
        "count": 0,
        "top_similarities": [],
    }

    latencies = []

    for q in queries:
        qid = q["query_id"]
        qtext = q["query"]
        expected_ids = set(q["expected_chunk_ids"])
        rel_grades = q["relevance_grades"]
        is_answerable = q["is_answerable"]
        category = q["query_category"]
        topic = q.get("topic", "")

        start_t = time.perf_counter()
        retrieved_chunks = await retrieve(qtext, top_k=5)
        elapsed_ms = (time.perf_counter() - start_t) * 1000.0
        latencies.append(elapsed_ms)

        retrieved_ids = [c.chunk_id for c in retrieved_chunks]
        similarities = [round(c.similarity, 4) for c in retrieved_chunks]

        # Calculate metrics for this query
        first_rel_rank = 0
        for idx, cid in enumerate(retrieved_ids):
            if cid in expected_ids:
                first_rel_rank = idx + 1
                break

        hit_1 = 1 if (len(retrieved_ids) >= 1 and retrieved_ids[0] in expected_ids) else 0
        hit_3 = 1 if any(cid in expected_ids for cid in retrieved_ids[:3]) else 0
        hit_5 = 1 if any(cid in expected_ids for cid in retrieved_ids[:5]) else 0

        def p_at_k(k: int) -> float:
            if not retrieved_ids or k <= 0:
                return 0.0
            sub = retrieved_ids[:k]
            tp = sum(1 for cid in sub if cid in expected_ids)
            return tp / float(k)

        def r_at_k(k: int) -> float:
            if not expected_ids or k <= 0:
                return 0.0
            sub = retrieved_ids[:k]
            tp = sum(1 for cid in sub if cid in expected_ids)
            return tp / float(len(expected_ids))

        p_1 = p_at_k(1)
        p_3 = p_at_k(3)
        p_5 = p_at_k(5)

        r_1 = r_at_k(1)
        r_3 = r_at_k(3)
        r_5 = r_at_k(5)

        mrr_1 = 1.0 if (first_rel_rank == 1) else 0.0
        mrr_3 = (1.0 / first_rel_rank) if (0 < first_rel_rank <= 3) else 0.0
        mrr_5 = (1.0 / first_rel_rank) if (0 < first_rel_rank <= 5) else 0.0

        ndcg_1 = compute_ndcg(retrieved_ids, rel_grades, 1)
        ndcg_3 = compute_ndcg(retrieved_ids, rel_grades, 3)
        ndcg_5 = compute_ndcg(retrieved_ids, rel_grades, 5)

        if is_answerable:
            answerable_stats["count"] += 1
            answerable_stats["hit@1"] += hit_1
            answerable_stats["hit@3"] += hit_3
            answerable_stats["hit@5"] += hit_5
            answerable_stats["p@1"] += p_1
            answerable_stats["p@3"] += p_3
            answerable_stats["p@5"] += p_5
            answerable_stats["r@1"] += r_1
            answerable_stats["r@3"] += r_3
            answerable_stats["r@5"] += r_5
            answerable_stats["mrr@1"] += mrr_1
            answerable_stats["mrr@3"] += mrr_3
            answerable_stats["mrr@5"] += mrr_5
            answerable_stats["ndcg@1"] += ndcg_1
            answerable_stats["ndcg@3"] += ndcg_3
            answerable_stats["ndcg@5"] += ndcg_5
        else:
            out_of_scope_stats["count"] += 1
            top_sim = similarities[0] if similarities else 0.0
            out_of_scope_stats["top_similarities"].append(top_sim)

        results_rows.append({
            "query_id": qid,
            "topic": topic,
            "category": category,
            "is_answerable": is_answerable,
            "query": qtext,
            "expected_chunk_ids": "; ".join(q["expected_chunk_ids"]),
            "retrieved_chunk_ids": "; ".join(retrieved_ids),
            "top1_similarity": similarities[0] if similarities else 0.0,
            "all_similarities": "; ".join(str(s) for s in similarities),
            "first_rel_rank": first_rel_rank if is_answerable else "N/A",
            "hit@1": hit_1 if is_answerable else "N/A",
            "hit@3": hit_3 if is_answerable else "N/A",
            "hit@5": hit_5 if is_answerable else "N/A",
            "p@1": round(p_1, 4) if is_answerable else "N/A",
            "p@3": round(p_3, 4) if is_answerable else "N/A",
            "p@5": round(p_5, 4) if is_answerable else "N/A",
            "r@1": round(r_1, 4) if is_answerable else "N/A",
            "r@3": round(r_3, 4) if is_answerable else "N/A",
            "r@5": round(r_5, 4) if is_answerable else "N/A",
            "mrr@5": round(mrr_5, 4) if is_answerable else "N/A",
            "ndcg@5": round(ndcg_5, 4) if is_answerable else "N/A",
            "latency_ms": round(elapsed_ms, 2),
        })

    # Aggregate metrics
    n_ans = answerable_stats["count"]
    agg_metrics = {
        "benchmark_version": "2.0-authoritative",
        "corpus_total_chunks": 83,
        "total_queries": len(queries),
        "answerable_queries": n_ans,
        "out_of_scope_queries": out_of_scope_stats["count"],
        "hit@1": round(answerable_stats["hit@1"] / n_ans, 4) if n_ans else 0.0,
        "hit@3": round(answerable_stats["hit@3"] / n_ans, 4) if n_ans else 0.0,
        "hit@5": round(answerable_stats["hit@5"] / n_ans, 4) if n_ans else 0.0,
        "precision@1": round(answerable_stats["p@1"] / n_ans, 4) if n_ans else 0.0,
        "precision@3": round(answerable_stats["p@3"] / n_ans, 4) if n_ans else 0.0,
        "precision@5": round(answerable_stats["p@5"] / n_ans, 4) if n_ans else 0.0,
        "recall@1": round(answerable_stats["r@1"] / n_ans, 4) if n_ans else 0.0,
        "recall@3": round(answerable_stats["r@3"] / n_ans, 4) if n_ans else 0.0,
        "recall@5": round(answerable_stats["r@5"] / n_ans, 4) if n_ans else 0.0,
        "mrr@1": round(answerable_stats["mrr@1"] / n_ans, 4) if n_ans else 0.0,
        "mrr@3": round(answerable_stats["mrr@3"] / n_ans, 4) if n_ans else 0.0,
        "mrr@5": round(answerable_stats["mrr@5"] / n_ans, 4) if n_ans else 0.0,
        "ndcg@1": round(answerable_stats["ndcg@1"] / n_ans, 4) if n_ans else 0.0,
        "ndcg@3": round(answerable_stats["ndcg@3"] / n_ans, 4) if n_ans else 0.0,
        "ndcg@5": round(answerable_stats["ndcg@5"] / n_ans, 4) if n_ans else 0.0,
        "latency_mean_ms": round(sum(latencies) / len(latencies), 2) if latencies else 0.0,
        "latency_median_ms": round(sorted(latencies)[len(latencies) // 2], 2) if latencies else 0.0,
        "out_of_scope_max_sim": round(max(out_of_scope_stats["top_similarities"]), 4) if out_of_scope_stats["top_similarities"] else 0.0,
        "out_of_scope_mean_sim": round(sum(out_of_scope_stats["top_similarities"]) / len(out_of_scope_stats["top_similarities"]), 4) if out_of_scope_stats["top_similarities"] else 0.0,
    }

    # Save CSV
    csv_path = PROJECT_ROOT / "docs" / "research" / "evaluation" / "results" / "rag_results_v2_authoritative.csv"
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(results_rows[0].keys()))
        writer.writeheader()
        writer.writerows(results_rows)

    # Save JSON summary
    summary_path = PROJECT_ROOT / "docs" / "research" / "evaluation" / "results" / "rag_summary_v2_authoritative.json"
    with open(summary_path, "w", encoding="utf-8") as f:
        json.dump(agg_metrics, f, indent=2)

    print("\n" + "=" * 60)
    print("PHASE 3: AUTHORITATIVE LEGAL CORPUS RETRIEVAL BENCHMARK RESULTS")
    print("=" * 60)
    print(f"Corpus Size:               {agg_metrics['corpus_total_chunks']} chunks")
    print(f"Total Queries:             {agg_metrics['total_queries']} ({agg_metrics['answerable_queries']} answerable, {agg_metrics['out_of_scope_queries']} out-of-scope)")
    print(f"Hit@1:                     {agg_metrics['hit@1'] * 100:.2f}%")
    print(f"Hit@3:                     {agg_metrics['hit@3'] * 100:.2f}%")
    print(f"Hit@5:                     {agg_metrics['hit@5'] * 100:.2f}%")
    print(f"MRR@5:                     {agg_metrics['mrr@5']:.4f}")
    print(f"NDCG@5:                    {agg_metrics['ndcg@5']:.4f}")
    print(f"Mean Latency:              {agg_metrics['latency_mean_ms']:.2f} ms")
    print(f"Out-of-Scope Max Sim:      {agg_metrics['out_of_scope_max_sim']:.4f}")
    print(f"Results CSV:               {csv_path}")
    print(f"Summary JSON:              {summary_path}")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(run_rag_evaluation_v2())
