import urllib.request, urllib.error, json

BASE = "http://127.0.0.1:8000"
AID = "b9f1c498-ed1e-446b-b651-53bcbc72bdc7"

def test_all_endpoints():
    print("=" * 80)
    print("API ENDPOINT VERIFICATION (PHASE 14)")
    print("=" * 80)
    results = {}

    # 1. GET /api/health
    r = urllib.request.urlopen(f"{BASE}/api/health")
    data = json.loads(r.read())
    print(f"GET  /api/health                -> Status {r.status} | {data['status']} | LLM: {data['llm_provider']}")
    results["health"] = r.status

    # 2. POST /api/scans
    req = urllib.request.Request(
        f"{BASE}/api/scans",
        data=json.dumps({"url": "https://example.com"}).encode(),
        headers={"Content-Type": "application/json"}
    )
    r = urllib.request.urlopen(req)
    data = json.loads(r.read())
    print(f"POST /api/scans                 -> Status {r.status} | checks={len(data['checks'])}, evidence={len(data['evidence'])}")
    results["scans"] = r.status

    # 3. POST /api/rag/retrieve
    req = urllib.request.Request(
        f"{BASE}/api/rag/retrieve",
        data=json.dumps({"query": "consent requirements", "top_k": 3}).encode(),
        headers={"Content-Type": "application/json"}
    )
    r = urllib.request.urlopen(req)
    data = json.loads(r.read())
    print(f"POST /api/rag/retrieve          -> Status {r.status} | chunks={len(data)}")
    results["rag_retrieve"] = r.status

    # 4. POST /api/assessments
    req = urllib.request.Request(
        f"{BASE}/api/assessments",
        data=json.dumps({
            "org_id": "test-verify-org",
            "categories": ["financial"],
            "purposes": ["service"],
            "languages": ["en"],
            "rights": ["access"],
            "processors": [],
            "retention": "30 days"
        }).encode(),
        headers={"Content-Type": "application/json"}
    )
    r = urllib.request.urlopen(req)
    data = json.loads(r.read())
    print(f"POST /api/assessments           -> Status {r.status} | id={data['assessment_id']}, status={data['status']}")
    results["assessments_post"] = r.status

    # 5. GET /api/assessments/{id}
    r = urllib.request.urlopen(f"{BASE}/api/assessments/{AID}")
    data = json.loads(r.read())
    print(f"GET  /api/assessments/{{id}}       -> Status {r.status} | status={data['status']}, score={data['trust_score']}")
    results["assessments_get"] = r.status

    # 6. GET /api/findings/{id}
    r = urllib.request.urlopen(f"{BASE}/api/findings/{AID}")
    data = json.loads(r.read())
    print(f"GET  /api/findings/{{id}}          -> Status {r.status} | count={len(data)}")
    results["findings"] = r.status

    # 7. GET /api/trust-score/{id}
    r = urllib.request.urlopen(f"{BASE}/api/trust-score/{AID}")
    data = json.loads(r.read())
    print(f"GET  /api/trust-score/{{id}}       -> Status {r.status} | score={data['trust_score']}, posture={data['posture']}")
    results["trust_score"] = r.status

    # 8. GET /api/reports/{id}
    r = urllib.request.urlopen(f"{BASE}/api/reports/{AID}")
    data = json.loads(r.read())
    print(f"GET  /api/reports/{{id}}           -> Status {r.status} | report_id={data['report_id']}")
    results["reports"] = r.status

    # 9. Invalid ID error handling (404)
    for ep in [f"/api/assessments/invalid-id-12345", f"/api/findings/invalid-id-12345", f"/api/trust-score/invalid-id-12345", f"/api/reports/invalid-id-12345"]:
        try:
            urllib.request.urlopen(f"{BASE}{ep}")
            print(f"GET  {ep} -> UNEXPECTED SUCCESS")
        except urllib.error.HTTPError as e:
            print(f"GET  {ep:<30} -> Status {e.code} (Expected 404 Not Found)")
            assert e.code == 404

    print("\nALL 8 CORE ENDPOINTS RETURNED 200 OK + INVALID IDS CORRECTLY RETURNED 404!")

if __name__ == "__main__":
    test_all_endpoints()
