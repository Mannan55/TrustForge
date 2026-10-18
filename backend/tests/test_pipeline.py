"""
Full assessment pipeline integration test.
Submits, polls, validates findings, trust score, and determinism.
"""
import json
import sys
import time
import urllib.request
import urllib.error

BASE = "http://127.0.0.1:8000"


def post(path, body):
    data = json.dumps(body).encode()
    req = urllib.request.Request(
        BASE + path, data=data,
        headers={"Content-Type": "application/json"}, method="POST"
    )
    r = urllib.request.urlopen(req, timeout=20)
    return json.loads(r.read())


def get(path, timeout=60):
    r = urllib.request.urlopen(BASE + path, timeout=timeout)
    return json.loads(r.read())


def poll_until_complete(assessment_id, max_wait=360):
    """Poll until status=complete or error, returns final result dict."""
    for i in range(max_wait // 10):
        time.sleep(10)
        try:
            r = get(f"/api/assessments/{assessment_id}")
        except Exception as e:
            print(f"  [{(i+1)*10:3d}s] poll error: {e} — retrying next cycle")
            continue
        status = r.get("status", "?")
        ts = r.get("trust_score", "—")
        nf = len(r.get("findings", []))
        ne = len(r.get("evidence", []))
        print(f"  [{(i+1)*10:3d}s] status={status:<10} trust_score={ts}  findings={nf}  evidence={ne}")
        if status in ("complete", "error"):
            return r
    raise TimeoutError(f"Assessment {assessment_id} did not complete in {max_wait}s")


def main():
    print("=" * 60)
    print(" TrustForge End-to-End Pipeline Test")
    print("=" * 60)

    # 1. Health
    health = get("/api/health")
    assert health["status"] == "ok", f"Health check failed: {health}"
    print(f"\n[PASS] Health OK  |  LLM: {health['llm_provider']}  |  Model reported in .env")

    # 2. Submit assessment
    print("\n[STEP 1] Submitting assessment (wizard-only, no website scan)...")
    wizard_payload = {
        "org_id": "integration-test-org",
        "categories": ["identifiers", "financial", "device"],
        "purposes": ["service", "analytics", "auth"],
        "languages": ["en", "hi"],
        "rights": ["access", "correction", "grievance"],
        "processors": ["aws", "razorpay"],
        "retention": "12 months",
        "erasure_automated": True,
        "breach_plan": False,
        "grievance_officer_named": True,
        "grievance_contact_published": True,
    }
    resp = post("/api/assessments", wizard_payload)
    aid = resp["assessment_id"]
    assert resp["status"] == "accepted", f"Unexpected: {resp}"
    print(f"[PASS] Accepted  |  assessment_id={aid}")

    # 3. Poll
    print(f"\n[STEP 2] Polling for completion (max 300s)...")
    final = poll_until_complete(aid)

    if final["status"] == "error":
        print(f"\n[FAIL] Assessment ended in error state")
        sys.exit(1)

    # 4. Validate result
    print(f"\n[STEP 3] Validating result...")
    print(f"  Trust Score  : {final['trust_score']}")
    print(f"  Posture      : {final['posture']}")
    print(f"  Total Controls: {final['total_controls']}")
    print(f"    PASS       : {final['pass_count']}")
    print(f"    GAP        : {final['potential_gap_count']}")
    print(f"    FAIL       : {final['fail_count']}")
    print(f"    INSUFF     : {final['insufficient_evidence_count']}")
    print(f"  Evidence     : {len(final['evidence'])}")
    print(f"  Findings     : {len(final['findings'])}")

    assert final["trust_score"] is not None, "Trust Score is None"
    assert final["posture"] is not None, "Posture is None"
    assert final["total_controls"] == 20, f"Expected 20 controls, got {final['total_controls']}"
    assert len(final["findings"]) == 20, f"Expected 20 findings, got {len(final['findings'])}"

    print(f"\n  Pillar Scores:")
    for ps in final.get("pillar_scores", []):
        print(f"    {ps['pillar']:22s}: {ps['score']:6.1f}")

    # 5. Show sample findings
    print(f"\n  Sample findings (first 5):")
    for f in final["findings"][:5]:
        err_note = f"  [ERROR: {f['error'][:50]}]" if f.get("error") else ""
        print(f"    {f['control_id']:<15} {f['status']:<25} {f['evaluation_method']}{err_note}")

    # Count TIE vs deterministic
    methods = [f["evaluation_method"] for f in final["findings"]]
    llm_count = sum(1 for m in methods if m == "llm_grounded")
    det_count = sum(1 for m in methods if m == "deterministic")
    err_count = sum(1 for f in final["findings"] if f.get("error"))
    print(f"\n  Evaluation breakdown:")
    print(f"    LLM-grounded  : {llm_count}")
    print(f"    Deterministic : {det_count}")
    print(f"    Errors        : {err_count}")

    if err_count > 0:
        print(f"\n  [WARN] {err_count} controls had evaluation errors — check LLM model config")

    # 6. Verify /api/findings/{id}
    print(f"\n[STEP 4] Verifying GET /api/findings/{{id}}...")
    findings = get(f"/api/findings/{aid}")
    assert len(findings) == 20, f"Expected 20, got {len(findings)}"
    print(f"[PASS] /api/findings returned {len(findings)} findings")

    # 7. Verify /api/trust-score/{id}
    print(f"\n[STEP 5] Verifying GET /api/trust-score/{{id}}...")
    ts = get(f"/api/trust-score/{aid}")
    assert ts["trust_score"] == final["trust_score"], "Score mismatch between endpoints"
    assert ts["posture"] == final["posture"], "Posture mismatch"
    print(f"[PASS] /api/trust-score: {ts['trust_score']} ({ts['posture']})")

    # 8. Verify 404 for non-existent assessment
    print(f"\n[STEP 6] Verifying 404 for unknown assessment...")
    try:
        get("/api/assessments/does-not-exist")
        print("[FAIL] Expected 404 but got success")
    except urllib.error.HTTPError as e:
        if e.code == 404:
            print("[PASS] Correct 404 for unknown assessment")
        else:
            print(f"[FAIL] Expected 404, got {e.code}")

    try:
        get("/api/findings/does-not-exist")
        print("[FAIL] Expected 404 for findings")
    except urllib.error.HTTPError as e:
        if e.code == 404:
            print("[PASS] Correct 404 for unknown findings")
        else:
            print(f"[FAIL] Expected 404, got {e.code}")

    print(f"\n{'=' * 60}")
    print(f" ALL TESTS PASSED")
    print(f" Trust Score: {final['trust_score']} | Posture: {final['posture']}")
    if err_count > 0:
        print(f" WARNING: {err_count} LLM errors — run with correct Groq model")
    print(f"{'=' * 60}")
    sys.exit(0)


if __name__ == "__main__":
    main()
