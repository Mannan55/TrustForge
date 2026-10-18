"""Poll assessment until complete."""
import json
import sys
import time
import urllib.request

AID = sys.argv[1] if len(sys.argv) > 1 else "2eae5cd3-c56d-43bf-a005-5b27abbfeb1a"
BASE = "http://127.0.0.1:8000"

print(f"Polling assessment {AID}...")
for i in range(36):
    time.sleep(10)
    try:
        r = urllib.request.urlopen(f"{BASE}/api/assessments/{AID}", timeout=10)
        d = json.loads(r.read())
    except Exception as e:
        print(f"  [{(i+1)*10}s] poll error: {e}")
        continue

    status = d.get("status", "?")
    ts = d.get("trust_score", "pending")
    nf = len(d.get("findings", []))
    ne = len(d.get("evidence", []))
    print(f"  [{(i+1)*10:3d}s] status={status}  trust_score={ts}  findings={nf}  evidence={ne}")

    if status in ("complete", "error"):
        print("\n=== Assessment Result ===")
        print(f"Status      : {d['status']}")
        print(f"Trust Score : {d.get('trust_score')}")
        print(f"Posture     : {d.get('posture')}")
        print(f"Controls    : {d.get('total_controls', 0)}")
        print(f"  PASS      : {d.get('pass_count', 0)}")
        print(f"  GAP       : {d.get('potential_gap_count', 0)}")
        print(f"  FAIL      : {d.get('fail_count', 0)}")
        print(f"  INSUFF    : {d.get('insufficient_evidence_count', 0)}")
        print(f"Findings    : {nf}")
        print(f"Evidence    : {ne}")
        print("\nPillar Scores:")
        for ps in d.get("pillar_scores", []):
            print(f"  {ps['pillar']:22s}: {ps['score']:5.1f}")
        sys.exit(0 if status == "complete" else 1)

print("TIMEOUT: assessment did not complete in 360s")
sys.exit(2)
