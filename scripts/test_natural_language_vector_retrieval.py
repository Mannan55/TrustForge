import json
import os
import sys
import urllib.request
from sentence_transformers import SentenceTransformer

# Load model
model = SentenceTransformer('all-MiniLM-L6-v2')

# Natural language query specified in prompt
query = "What obligations apply to providing a privacy notice before collecting personal data?"
query_embedding = model.encode(query, normalize_embeddings=True).tolist()

print(f"Generated query vector dimension: {len(query_embedding)}")
print(f"Query vector sample (first 5): {query_embedding[:5]}")

# Read api/.env for SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
supabase_url = ""
supabase_key = ""
with open("api/.env", "r") as f:
    for line in f:
        if line.startswith("SUPABASE_URL="):
            supabase_url = line.strip().split("=", 1)[1]
        elif line.startswith("SUPABASE_SERVICE_ROLE_KEY="):
            supabase_key = line.strip().split("=", 1)[1]

if not supabase_url or not supabase_key:
    print("Error: Supabase credentials not found in api/.env")
    sys.exit(1)

# Call match_legal_chunks RPC
rpc_url = f"{supabase_url}/rest/v1/rpc/match_legal_chunks"
headers = {
    "apikey": supabase_key,
    "Authorization": f"Bearer {supabase_key}",
    "Content-Type": "application/json"
}
payload = json.dumps({
    "query_embedding": query_embedding,
    "match_threshold": 0.3,
    "match_count": 5
}).encode('utf-8')

req = urllib.request.Request(rpc_url, data=payload, headers=headers)
try:
    with urllib.request.urlopen(req) as resp:
        results = json.loads(resp.read().decode('utf-8'))
except Exception as e:
    print("RPC failed:", e)
    sys.exit(1)

print(f"\nSuccessfully retrieved {len(results)} chunks from Supabase pgvector:")
for i, r in enumerate(results, 1):
    print(f"\n[{i}] Chunk ID: {r['id']}")
    print(f"    Section: {r['section']} | Heading: {r['heading']}")
    print(f"    Similarity: {r['similarity']:.4f} | Enforceability: {r['enforceability']}")
    print(f"    Excerpt: {r['text'][:140]}...")
