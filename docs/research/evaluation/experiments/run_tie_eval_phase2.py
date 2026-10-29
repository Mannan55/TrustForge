"""
TrustForge Trust Inference Engine (TIE) Benchmark Runner — Phase 2 Controlled Evaluation.

Scientifically evaluates the effect of removing the statutory context truncation defect
(c.text[:300]) and replacing it with a bounded, complete-provision context budget.

Evaluates against the exact same 32 assertions and unchanged ground-truth labels.
Preserves baseline results in tie_results.csv and summary_metrics.json.
Cache keys explicitly include the full prompt content hash, context budget, model, and temperature.

Outputs:
- CSV: docs/research/evaluation/results/tie_results_phase2.csv
- Cache: docs/research/evaluation/results/tie_cache_phase2.json
"""
from __future__ import annotations

import asyncio
import csv
import hashlib
import json
import os
import sys
import time
from collections import defaultdict

_cur = os.path.abspath(__file__)
for _ in range(5):
    _cur = os.path.dirname(_cur)
BASE_DIR = _cur
sys.path.insert(0, os.path.join(BASE_DIR, "backend"))

from config import settings
from core.models import (
    AssessmentAnswers,
    ComplianceControl,
    ControlStatus,
    EvaluationMethod,
    EvidenceConfidence,
    EvidenceItem,
    EvidenceSourceType,
    EvidenceStatus,
    RetrievedChunk,
    TIEResult,
)
from compliance.controls import CONTROLS, CONTROL_MAP
from compliance.evidence_mapper import wizard_answers_to_evidence
from compliance.tie_evaluator import (
    evaluate_control,
    _build_tie_prompt,
    _build_context_passages,
)
from rag.retrieval import retrieve
from rag.query_builder import build_retrieval_query

MAX_NEW_GROQ_CALLS = 30
CACHE_FILE = os.path.join(BASE_DIR, "docs", "research", "evaluation", "results", "tie_cache_phase2.json")


def load_cache() -> dict:
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}


def save_cache(cache: dict) -> None:
    os.makedirs(os.path.dirname(CACHE_FILE), exist_ok=True)
    with open(CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(cache, f, indent=2)


def build_evidence_for_org(org: dict) -> list[EvidenceItem]:
    w_answers = org.get("wizard_answers", {})
    answers = AssessmentAnswers(
        org_id=org.get("org_id", "benchmark_org"),
        categories=w_answers.get("categories", []),
        purposes=w_answers.get("purposes", []),
        retention=w_answers.get("retention"),
        erasure_automated=w_answers.get("erasure_automated", False),
        breach_plan=w_answers.get("breach_plan", False),
        grievance_officer_named=w_answers.get("grievance_officer_named", False),
        grievance_contact_published=w_answers.get("grievance_contact_published", False),
        processors=w_answers.get("processors", []),
        languages=w_answers.get("languages", ["English"]),
        rights=w_answers.get("rights", []),
    )
    items = wizard_answers_to_evidence(answers)

    s_profile = org.get("scanner_evidence_profile", {})
    for key, val in s_profile.items():
        obs = bool(val)
        status = EvidenceStatus.VERIFIED if obs else EvidenceStatus.NOT_FOUND
        items.append(EvidenceItem(
            source=EvidenceSourceType.WEBSITE_SCANNER,
            key=key,
            title=key.replace("_", " ").title(),
            status=status,
            observed=obs,
            value=val,
            method="Simulated scanner evidence from benchmark profile.",
            confidence=EvidenceConfidence.HIGH,
        ))

    return items


async def run_phase2_evaluation():
    dataset_path = os.path.join(
        BASE_DIR, "docs", "research", "evaluation", "datasets", "synthetic_org_profiles.json"
    )
    with open(dataset_path, "r", encoding="utf-8") as f:
        dataset = json.load(f)

    orgs = dataset["organizations"]
    org_map = {o["org_id"]: o for o in orgs}

    cache = load_cache()
    new_groq_calls = 0

    print("=" * 70)
    print("TRUSTFORGE PHASE 2 TIE EVALUATION BENCHMARK (BOUNDED COMPLETE CONTEXT)")
    print(f"Context budget: {settings.tie_context_budget} chars")
    print(f"Loaded {len(orgs)} org profiles. Phase 2 cached responses: {len(cache)}")
    print("=" * 70)

    det_controls = ["TF-SEC-001", "TF-SEC-002"]
    rag_org_ids = ["SYN-001", "SYN-003", "SYN-007"]
    rag_controls = ["TF-PRIV-001", "TF-PRIV-005", "TF-GOV-001", "TF-LIFE-002"]

    eval_schedule = []
    for o in orgs:
        for cid in det_controls:
            eval_schedule.append((o["org_id"], cid))
    for oid in rag_org_ids:
        for cid in rag_controls:
            eval_schedule.append((oid, cid))

    print(f"Total planned assertions: {len(eval_schedule)} "
          f"({len(orgs)*len(det_controls)} deterministic, {len(rag_org_ids)*len(rag_controls)} RAG-grounded)")

    results_rows = []
    classes = ["PASS", "FAIL", "POTENTIAL_GAP", "NOT_APPLICABLE", "INSUFFICIENT_EVIDENCE"]
    confusion_matrix = defaultdict(lambda: defaultdict(int))

    det_total = 0
    det_correct = 0
    rag_total = 0
    rag_correct = 0

    total_citations = 0
    valid_citations = 0

    for oid, cid in eval_schedule:
        org = org_map[oid]
        control = CONTROL_MAP[cid]
        ev_items = build_evidence_for_org(org)
        gt_outcome = org["expected_outcomes"].get(cid, {})
        gt_status = gt_outcome.get("status", "UNKNOWN")

        # Retrieve chunks in advance if RAG control so we can compute prompt hash for cache key
        chunks: list[RetrievedChunk] = []
        prompt_hash = "none"
        excluded_count = 0
        if control.evaluation_method == EvaluationMethod.RAG_GROUNDED:
            query = build_retrieval_query(control, ev_items)
            try:
                chunks = await retrieve(query, top_k=settings.retrieval_top_k)
            except Exception:
                chunks = []
            prompt = _build_tie_prompt(control, ev_items, chunks, context_budget=settings.tie_context_budget)
            prompt_hash = hashlib.sha256(prompt.encode("utf-8")).hexdigest()[:16]
            _, _, excluded = _build_context_passages(chunks, context_budget=settings.tie_context_budget)
            excluded_count = len(excluded)

        # Create robust cache key including prompt hash and context budget
        ev_str = "|".join(f"{e.key}:{e.observed}" for e in sorted(ev_items, key=lambda x: x.key))
        cache_key = hashlib.sha256(
            f"{oid}_{cid}_{ev_str}_{settings.llm_model}_{settings.llm_temperature}_{settings.tie_context_budget}_{prompt_hash}".encode("utf-8")
        ).hexdigest()

        is_cached = cache_key in cache
        llm_called = False
        start_t = time.perf_counter()

        if is_cached:
            cached_data = cache[cache_key]
            status_val = cached_data["status"]
            confidence = cached_data["confidence"]
            cit_data = cached_data.get("citations", [])
            finding = cached_data.get("finding", "")
            explanation = cached_data.get("explanation", "")
        else:
            if control.evaluation_method == EvaluationMethod.RAG_GROUNDED:
                if new_groq_calls >= MAX_NEW_GROQ_CALLS:
                    print(f"WARNING: Groq call cap reached ({MAX_NEW_GROQ_CALLS}). Skipping.")
                    status_val = "NOT_MEASURED"
                    confidence = 0.0
                    cit_data = []
                    finding = "Cap reached"
                    explanation = ""
                else:
                    new_groq_calls += 1
                    llm_called = True
                    res = await evaluate_control(control, ev_items)
                    status_val = res.status.value
                    confidence = res.confidence
                    cit_data = [
                        {"chunk_id": c.chunk_id, "document_title": c.document_title, "section": c.section, "excerpt": c.excerpt}
                        for c in res.citations
                    ]
                    finding = res.finding
                    explanation = res.explanation

                    cache[cache_key] = {
                        "status": status_val,
                        "confidence": confidence,
                        "finding": finding,
                        "explanation": explanation,
                        "citations": cit_data,
                    }
                    save_cache(cache)

                    # Generous delay between live LLM calls to respect Groq free tier RPM/TPM
                    await asyncio.sleep(6.0)
            else:
                res = await evaluate_control(control, ev_items)
                status_val = res.status.value
                confidence = res.confidence
                cit_data = []
                finding = res.finding
                explanation = res.explanation

                cache[cache_key] = {
                    "status": status_val,
                    "confidence": confidence,
                    "finding": finding,
                    "explanation": explanation,
                    "citations": cit_data,
                }
                save_cache(cache)

        elapsed_ms = (time.perf_counter() - start_t) * 1000.0

        c_count = len(cit_data)
        c_valid = sum(1 for c in cit_data if c.get("chunk_id"))
        total_citations += c_count
        valid_citations += c_valid

        confusion_matrix[gt_status][status_val] += 1
        is_match = (gt_status == status_val)

        if control.evaluation_method == EvaluationMethod.DETERMINISTIC:
            det_total += 1
            if is_match:
                det_correct += 1
        else:
            rag_total += 1
            if is_match:
                rag_correct += 1

        results_rows.append({
            "org_id": oid,
            "org_name": org["name"],
            "control_id": cid,
            "pillar": control.pillar.value,
            "evaluation_method": control.evaluation_method.value,
            "ground_truth_status": gt_status,
            "predicted_status": status_val,
            "match": is_match,
            "confidence": round(confidence, 2),
            "citations_count": c_count,
            "citations_valid": c_valid,
            "excluded_passages_count": excluded_count,
            "latency_ms": round(elapsed_ms, 1),
            "is_cached": is_cached,
            "llm_called": llm_called,
            "finding": finding,
            "explanation": explanation,
        })
        print(f"[{oid}][{cid}] GT: {gt_status:<22} | Pred: {status_val:<22} | Match: {is_match} | LLM: {llm_called}")

    # Save Phase 2 CSV
    results_dir = os.path.join(BASE_DIR, "docs", "research", "evaluation", "results")
    csv_path = os.path.join(results_dir, "tie_results_phase2.csv")

    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=[
            "org_id", "org_name", "control_id", "pillar", "evaluation_method",
            "ground_truth_status", "predicted_status", "match", "confidence",
            "citations_count", "citations_valid", "excluded_passages_count", "latency_ms",
            "is_cached", "llm_called", "finding", "explanation"
        ])
        writer.writeheader()
        writer.writerows(results_rows)

    # Compute metrics
    per_class_metrics = {}
    macro_f1_sum = 0.0
    macro_classes_count = 0

    total_evals = len(results_rows)
    total_correct = sum(1 for r in results_rows if r["match"])
    overall_acc = total_correct / total_evals if total_evals > 0 else 0.0

    for cls in classes:
        tp = confusion_matrix[cls][cls]
        fp = sum(confusion_matrix[other][cls] for other in classes if other != cls)
        fn = sum(confusion_matrix[cls][other] for other in classes if other != cls)
        gt_count = sum(confusion_matrix[cls][pred] for pred in classes)

        prec = tp / (tp + fp) if (tp + fp) > 0 else (1.0 if fn == 0 and gt_count == 0 else 0.0)
        rec = tp / (tp + fn) if (tp + fn) > 0 else (1.0 if fp == 0 and gt_count == 0 else 0.0)
        f1 = (2 * prec * rec) / (prec + rec) if (prec + rec) > 0 else 0.0

        if gt_count > 0:
            macro_f1_sum += f1
            macro_classes_count += 1

        per_class_metrics[cls] = {
            "GT_Count": gt_count,
            "TP": tp, "FP": fp, "FN": fn,
            "Precision": prec, "Recall": rec, "F1": f1
        }

    macro_f1 = macro_f1_sum / macro_classes_count if macro_classes_count > 0 else 0.0
    cit_validity_rate = valid_citations / total_citations if total_citations > 0 else 1.0

    print("\n" + "=" * 70)
    print("PHASE 2 TIE EVALUATION SUMMARY")
    print(f"Total assertions: {total_evals}")
    print(f"Overall Accuracy: {overall_acc:.4f} ({total_correct}/{total_evals})")
    print(f"Deterministic Accuracy: {det_correct/det_total:.4f} ({det_correct}/{det_total})")
    print(f"Qualitative Accuracy: {rag_correct/rag_total:.4f} ({rag_correct}/{rag_total})")
    print(f"Macro F1: {macro_f1:.4f}")
    print(f"Citation Validity Rate: {cit_validity_rate:.4f} ({valid_citations}/{total_citations})")
    print(f"Fresh Groq Calls: {new_groq_calls}")
    print("=" * 70)

    # Save summary json
    summary_path = os.path.join(results_dir, "summary_metrics_phase2.json")
    with open(summary_path, "w", encoding="utf-8") as f:
        json.dump({
            "phase": "Phase 2 — Bounded Complete Context",
            "evaluation_date": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "llm_model": settings.llm_model,
            "tie_context_budget": settings.tie_context_budget,
            "total_assertions": total_evals,
            "overall_accuracy": overall_acc,
            "deterministic_accuracy": det_correct / det_total if det_total else 0.0,
            "qualitative_accuracy": rag_correct / rag_total if rag_total else 0.0,
            "macro_f1": macro_f1,
            "citation_validity_rate": cit_validity_rate,
            "new_groq_calls": new_groq_calls,
            "per_class_metrics": per_class_metrics,
            "confusion_matrix": {k: dict(v) for k, v in confusion_matrix.items()},
        }, f, indent=2)

    return results_rows, per_class_metrics, overall_acc, macro_f1


if __name__ == "__main__":
    asyncio.run(run_phase2_evaluation())
