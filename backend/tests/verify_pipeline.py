"""
Minimal verification: submit one assessment, poll until complete, print result.
Designed to run while the server has no competing load.
"""
import json, sys, time, urllib.request, urllib.error

BASE = "http://127.0.0.1:8000"

def http_get(path, timeout=90):
    try:
        r = urllib.request.urlopen(BASE + path, timeout=timeout)
        return True, json.loads(r.read())
    except urllib.error.HTTPError as e:
        return False, {"error": e.code, "detail": e.read().decode()}
    except Exception as e:
        return False, {"error": str(e)}

def http_post(path, body):
    data = json.dumps(body).encode()
    req = urllib.request.Request(BASE + path, data=data,
                                  headers={"Content-Type": "application/json"}, method="POST")
    r = urllib.request.urlopen(req, timeout=30)
    return json.loads(r.read())

# 1. Health
ok, health = http_get("/api/health")
print("Health:", health)

# 2. Submit
resp = http_post("/api/assessments", {
    "org_id": "verify-org-001",
    "categories": ["identifiers", "financial"],
    "purposes": ["service"],
    "languages": ["en"],
    "rights": ["access", "correction"],
    "processors": [],
    "retention": "12 months",
    "erasure_automated": True,
    "breach_plan": True,
    "grievance_officer_named": True,
    "grievance_contact_published": True,
})
AID = resp["assessment_id"]
print(f"\nSubmitted: {AID}")

# 3. Poll with long timeout, tolerance for temporary server busy
print("\nPolling (max 8 minutes, 20s intervals):")
for i in range(24):
    time.sleep(20)
    ok, r = http_get(f"/api/assessments/{AID}")
    if not ok:
        print(f"  [{(i+1)*20}s] GET error: {r} — will retry")
        continue
    status = r.get("status", "?")
    nf = len(r.get("findings", []))
    ts = r.get("trust_score", "—")
    print(f"  [{(i+1)*20:3d}s] {status:<12} findings={nf}  trust_score={ts}")
    if status == "complete":
        print("\n=== RESULT ===")
        print(f"Trust Score : {r['trust_score']}")
        print(f"Posture     : {r['posture']}")
        print(f"Controls    : {r['total_controls']}")
        print(f"  PASS      : {r['pass_count']}")
        print(f"  GAP       : {r['potential_gap_count']}")
        print(f"  FAIL      : {r['fail_count']}")
        print(f"  INSUFF    : {r['insufficient_evidence_count']}")
        print(f"Evidence    : {len(r['evidence'])}")
        print(f"\nPillar Scores:")
        for ps in r.get("pillar_scores", []):
            bar = "█" * int(ps["score"] / 10) + "░" * (10 - int(ps["score"] / 10))
            print(f"  {ps['pillar']:22s} {bar} {ps['score']:.1f}")
        
        # Sample findings
        print(f"\nSample findings:")
        for f in r.get("findings", [])[:5]:
            err = f" [ERR:{f['error'][:30]}]" if f.get("error") else ""
            print(f"  {f['control_id']:<15} {f['status']:<25} {f['evaluation_method']}{err}")
        
        methods = [f["evaluation_method"] for f in r.get("findings", [])]
        errs = sum(1 for f in r.get("findings", []) if f.get("error"))
        print(f"\nEvaluation: llm_grounded={methods.count('llm_grounded')} "
              f"deterministic={methods.count('deterministic')} errors={errs}")
        
        # Verify sub-endpoints
        ok2, ts_data = http_get(f"/api/trust-score/{AID}")
        ok3, fn_data = http_get(f"/api/findings/{AID}")
        print(f"\nGET /trust-score: {'OK' if ok2 else 'FAIL'}")
        print(f"GET /findings:    {'OK (' + str(len(fn_data)) + ' findings)' if ok3 else 'FAIL'}")
        
        ok4, rpt = http_get(f"/api/reports/{AID}")
        print(f"GET /reports:     {'OK' if ok4 else 'FAIL'}")
        
        sys.exit(0 if not errs or errs < 20 else 1)
    elif status == "error":
        print("Assessment ended in error state!")
        sys.exit(1)

print("TIMEOUT — assessment did not complete in 8 minutes")
sys.exit(2)
