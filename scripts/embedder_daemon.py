import sys
import json
from sentence_transformers import SentenceTransformer

# Load model once at startup
model = SentenceTransformer('all-MiniLM-L6-v2')
sys.stdout.write(json.dumps({"status": "ready"}) + "\n")
sys.stdout.flush()

for line in sys.stdin:
    line = line.strip()
    if not line:
        continue
    try:
        req = json.loads(line)
        text = req.get("text", "")
        req_id = req.get("id", "")
        # Normalized embedding matching build_authoritative_corpus
        vec = model.encode(text, normalize_embeddings=True).tolist()
        resp = {"id": req_id, "vector": vec, "dim": len(vec)}
        sys.stdout.write(json.dumps(resp) + "\n")
        sys.stdout.flush()
    except Exception as e:
        sys.stdout.write(json.dumps({"error": str(e)}) + "\n")
        sys.stdout.flush()
