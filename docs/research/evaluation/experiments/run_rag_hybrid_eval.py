"""
TrustForge Retrieval Optimization & Controlled Comparison Runner (Phase 4).

Runs the authoritative 45-query benchmark under:
1. Dense-only (MiniLM-L6-v2 vector retrieval baseline)
2. Hybrid (MiniLM-L6-v2 vector + BM25 keyword + Exact statutory RRF)

Saves:
- CSV: docs/research/evaluation/results/rag_hybrid_comparison.csv
- JSON: docs/research/evaluation/results/rag_hybrid_comparison_summary.json
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


async def evaluate_mode(queries: list[dict], mode: str) -> tuple[dict, list[dict]]:
    stats = {
        "count": 0,
        "hit@1": 0, "hit@3": 0, "hit@5": 0,
        "p@1": 0.0, "p@3": 0.0, "p@5": 0.0,
        "r@1": 0.0, "r@3": 0.0, "r@5": 0.0,
        "mrr@1": 0.0, "mrr@3": 0.0, "mrr@5": 0.0,
        "ndcg@1": 0.0, "ndcg@3": 0.0, "ndcg@5": 0.0,
    }
    out_of_scope_sims = []
    latencies = []
    per_query_rows = []

    for q in queries:
        qid = q["query_id"]
        qtext = q["query"]
        expected_ids = set(q["expected_chunk_ids"])
        rel_grades = q["relevance_grades"]
        is_answerable = q["is_answerable"]

        start_t = time.perf_counter()
        retrieved_chunks = await retrieve(qtext, top_k=5, mode=mode)
        elapsed_ms = (time.perf_counter() - start_t) * 1000.0
        latencies.append(elapsed_ms)

        retrieved_ids = [c.chunk_id for c in retrieved_chunks]
        similarities = [round(c.similarity, 4) for c in retrieved_chunks]

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

        p_1, p_3, p_5 = p_at_k(1), p_at_k(3), p_at_k(5)
        r_1, r_3, r_5 = r_at_k(1), r_at_k(3), r_at_k(5)

        mrr_1 = 1.0 if (first_rel_rank == 1) else 0.0
        mrr_3 = (1.0 / first_rel_rank) if (0 < first_rel_rank <= 3) else 0.0
        mrr_5 = (1.0 / first_rel_rank) if (0 < first_rel_rank <= 5) else 0.0

        ndcg_1 = compute_ndcg(retrieved_ids, rel_grades, 1)
        ndcg_3 = compute_ndcg(retrieved_ids, rel_grades, 3)
        ndcg_5 = compute_ndcg(retrieved_ids, rel_grades, 5)

        if is_answerable:
            stats["count"] += 1
            stats["hit@1"] += hit_1
            stats["hit@3"] += hit_3
            stats["hit@5"] += hit_5
            stats["p@1"] += p_1
            stats["p@3"] += p_3
            stats["p@5"] += p_5
            stats["r@1"] += r_1
            stats["r@3"] += r_3
            stats["r@5"] += r_5
            stats["mrr@1"] += mrr_1
            stats["mrr@3"] += mrr_3
            stats["mrr@5"] += mrr_5
            stats["ndcg@1"] += ndcg_1
            stats["ndcg@3"] += ndcg_3
            stats["ndcg@5"] += ndcg_5
        else:
            top_sim = similarities[0] if similarities else 0.0
            out_of_scope_sims.append(top_sim)

        per_query_rows.append({
            "query_id": qid,
            "mode": mode,
            "retrieved_chunk_ids": retrieved_ids,
            "top1_id": retrieved_ids[0] if retrieved_ids else "",
            "similarities": similarities,
            "first_rel_rank": first_rel_rank,
            "hit@1": hit_1,
            "hit@3": hit_3,
            "hit@5": hit_5,
            "mrr@5": mrr_5,
            "ndcg@5": ndcg_5,
            "latency_ms": elapsed_ms,
        })

    n = stats["count"]
    summary = {
        "mode": mode,
        "answerable_queries": n,
        "out_of_scope_queries": len(out_of_scope_sims),
        "hit@1": round(stats["hit@1"] / n, 4) if n else 0.0,
        "hit@3": round(stats["hit@3"] / n, 4) if n else 0.0,
        "hit@5": round(stats["hit@5"] / n, 4) if n else 0.0,
        "precision@1": round(stats["p@1"] / n, 4) if n else 0.0,
        "precision@3": round(stats["p@3"] / n, 4) if n else 0.0,
        "precision@5": round(stats["p@5"] / n, 4) if n else 0.0,
        "recall@1": round(stats["r@1"] / n, 4) if n else 0.0,
        "recall@3": round(stats["r@3"] / n, 4) if n else 0.0,
        "recall@5": round(stats["r@5"] / n, 4) if n else 0.0,
        "mrr@1": round(stats["mrr@1"] / n, 4) if n else 0.0,
        "mrr@3": round(stats["mrr@3"] / n, 4) if n else 0.0,
        "mrr@5": round(stats["mrr@5"] / n, 4) if n else 0.0,
        "ndcg@1": round(stats["ndcg@1"] / n, 4) if n else 0.0,
        "ndcg@3": round(stats["ndcg@3"] / n, 4) if n else 0.0,
        "ndcg@5": round(stats["ndcg@5"] / n, 4) if n else 0.0,
        "latency_mean_ms": round(sum(latencies) / len(latencies), 2) if latencies else 0.0,
        "latency_median_ms": round(sorted(latencies)[len(latencies) // 2], 2) if latencies else 0.0,
        "out_of_scope_max_sim": round(max(out_of_scope_sims), 4) if out_of_scope_sims else 0.0,
        "out_of_scope_mean_sim": round(sum(out_of_scope_sims) / len(out_of_scope_sims), 4) if out_of_scope_sims else 0.0,
    }

    return summary, per_query_rows


async def run_hybrid_comparison():
    reload_index()

    bench_path = PROJECT_ROOT / "docs" / "research" / "evaluation" / "datasets" / "rag_retrieval_benchmark_v2_authoritative.json"
    with open(bench_path, "r", encoding="utf-8") as f:
        bench_data = json.load(f)

    queries = bench_data["queries"]

    print("Evaluating Dense-only baseline (MiniLM-L6-v2)...")
    dense_summary, dense_rows = await evaluate_mode(queries, mode="dense")

    print("Evaluating Hybrid retrieval (MiniLM-L6-v2 + BM25 + Statutory RRF)...")
    hybrid_summary, hybrid_rows = await evaluate_mode(queries, mode="hybrid")

    # Match rows for comparison CSV
    dense_by_qid = {r["query_id"]: r for r in dense_rows}
    hybrid_by_qid = {r["query_id"]: r for r in hybrid_rows}

    comparison_rows = []
    improvements = []
    regressions = []
    neutral = []

    for q in queries:
        qid = q["query_id"]
        d = dense_by_qid[qid]
        h = hybrid_by_qid[qid]

        if not q["is_answerable"]:
            outcome = "OUT_OF_SCOPE_REJECTED"
        else:
            d_rank = d["first_rel_rank"]
            h_rank = h["first_rel_rank"]
            if (h["hit@1"] > d["hit@1"]) or (h_rank > 0 and (d_rank == 0 or h_rank < d_rank)):
                outcome = "IMPROVED"
                improvements.append(qid)
            elif (d["hit@1"] > h["hit@1"]) or (d_rank > 0 and (h_rank == 0 or d_rank < h_rank)):
                outcome = "REGRESSED"
                regressions.append(qid)
            else:
                outcome = "TIED"
                neutral.append(qid)

        comparison_rows.append({
            "query_id": qid,
            "topic": q.get("topic", ""),
            "category": q["query_category"],
            "is_answerable": q["is_answerable"],
            "query": q["query"],
            "expected_chunk_ids": "; ".join(q["expected_chunk_ids"]),
            "outcome": outcome,
            "dense_rank": d["first_rel_rank"],
            "hybrid_rank": h["first_rel_rank"],
            "dense_hit@1": d["hit@1"],
            "hybrid_hit@1": h["hit@1"],
            "dense_hit@5": d["hit@5"],
            "hybrid_hit@5": h["hit@5"],
            "dense_mrr@5": round(d["mrr@5"], 4),
            "hybrid_mrr@5": round(h["mrr@5"], 4),
            "dense_ndcg@5": round(d["ndcg@5"], 4),
            "hybrid_ndcg@5": round(h["ndcg@5"], 4),
            "dense_top1": d["top1_id"],
            "hybrid_top1": h["top1_id"],
            "dense_latency_ms": round(d["latency_ms"], 2),
            "hybrid_latency_ms": round(h["latency_ms"], 2),
        })

    # Save comparison CSV
    csv_path = PROJECT_ROOT / "docs" / "research" / "evaluation" / "results" / "rag_hybrid_comparison.csv"
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(comparison_rows[0].keys()))
        writer.writeheader()
        writer.writerows(comparison_rows)

    # Save full summary JSON
    combined_summary = {
        "experiment_name": "Phase 4 Dense vs Hybrid Retrieval Controlled Comparison",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "corpus_total_chunks": 83,
        "dense_baseline": dense_summary,
        "hybrid_model": hybrid_summary,
        "delta": {
            "hit@1_abs": round(hybrid_summary["hit@1"] - dense_summary["hit@1"], 4),
            "hit@1_rel_percent": round((hybrid_summary["hit@1"] - dense_summary["hit@1"]) / dense_summary["hit@1"] * 100, 2),
            "hit@3_abs": round(hybrid_summary["hit@3"] - dense_summary["hit@3"], 4),
            "hit@5_abs": round(hybrid_summary["hit@5"] - dense_summary["hit@5"], 4),
            "mrr@5_abs": round(hybrid_summary["mrr@5"] - dense_summary["mrr@5"], 4),
            "ndcg@5_abs": round(hybrid_summary["ndcg@5"] - dense_summary["ndcg@5"], 4),
            "latency_mean_overhead_ms": round(hybrid_summary["latency_mean_ms"] - dense_summary["latency_mean_ms"], 2),
            "improved_queries_count": len(improvements),
            "improved_query_ids": improvements,
            "regressed_queries_count": len(regressions),
            "regressed_query_ids": regressions,
            "tied_queries_count": len(neutral),
        }
    }

    summary_path = PROJECT_ROOT / "docs" / "research" / "evaluation" / "results" / "rag_hybrid_comparison_summary.json"
    with open(summary_path, "w", encoding="utf-8") as f:
        json.dump(combined_summary, f, indent=2)

    print("\n" + "=" * 65)
    print("PHASE 4: DENSE vs HYBRID RETRIEVAL CONTROLLED RESULTS")
    print("=" * 65)
    print(f"{'Metric':<24} | {'Dense Baseline':<16} | {'Hybrid (BM25+RRF)':<16} | {'Delta':<10}")
    print("-" * 65)
    print(f"{'Hit@1':<24} | {dense_summary['hit@1']*100:>14.2f}% | {hybrid_summary['hit@1']*100:>14.2f}% | {combined_summary['delta']['hit@1_abs']*100:>+8.2f}%")
    print(f"{'Hit@3':<24} | {dense_summary['hit@3']*100:>14.2f}% | {hybrid_summary['hit@3']*100:>14.2f}% | {combined_summary['delta']['hit@3_abs']*100:>+8.2f}%")
    print(f"{'Hit@5':<24} | {dense_summary['hit@5']*100:>14.2f}% | {hybrid_summary['hit@5']*100:>14.2f}% | {combined_summary['delta']['hit@5_abs']*100:>+8.2f}%")
    print(f"{'MRR@5':<24} | {dense_summary['mrr@5']:>16.4f} | {hybrid_summary['mrr@5']:>16.4f} | {combined_summary['delta']['mrr@5_abs']:>+10.4f}")
    print(f"{'NDCG@5':<24} | {dense_summary['ndcg@5']:>16.4f} | {hybrid_summary['ndcg@5']:>16.4f} | {combined_summary['delta']['ndcg@5_abs']:>+10.4f}")
    print(f"{'Mean Latency':<24} | {dense_summary['latency_mean_ms']:>13.2f} ms | {hybrid_summary['latency_mean_ms']:>13.2f} ms | {combined_summary['delta']['latency_mean_overhead_ms']:>+7.2f} ms")
    print(f"{'Out-of-Scope Max Sim':<24} | {dense_summary['out_of_scope_max_sim']:>16.4f} | {hybrid_summary['out_of_scope_max_sim']:>16.4f} | {'N/A':<10}")
    print("-" * 65)
    print(f"Per-Query Breakdown: {len(improvements)} Improved, {len(neutral)} Tied, {len(regressions)} Regressed")
    print(f"Saved Comparison CSV: {csv_path}")
    print(f"Saved Summary JSON:   {summary_path}")
    print("=" * 65)


if __name__ == "__main__":
    asyncio.run(run_hybrid_comparison())
