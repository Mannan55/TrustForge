"""Quick one-shot poll of an existing assessment."""
import json, sys, urllib.request

AID = sys.argv[1]
r = urllib.request.urlopen(f"http://127.0.0.1:8000/api/assessments/{AID}", timeout=60)
d = json.loads(r.read())
print(json.dumps(d, indent=2))
