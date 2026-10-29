#!/bin/bash
set -e

echo "======================================================================"
echo "Starting TrustForge Multi-Process Production Container on Render"
echo "======================================================================"

# 1. Start Python SentenceTransformers Embedding Daemon in background
echo "[1/3] Starting Python embedding daemon (sentence-transformers/all-MiniLM-L6-v2) on port 8008..."
python3 /app/scripts/embedding_server.py &
EMBED_PID=$!

# Wait for embedding daemon to become healthy
echo "[2/3] Waiting for embedding daemon health check..."
MAX_RETRIES=30
RETRY_COUNT=0
until curl -s http://127.0.0.1:8008/health > /dev/null || [ $RETRY_COUNT -eq $MAX_RETRIES ]; do
  sleep 1
  RETRY_COUNT=$((RETRY_COUNT + 1))
  echo -n "."
done
echo ""

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
  echo "WARNING: Embedding daemon health check timed out. Proceeding with BM25 fallback."
else
  echo "Embedding daemon healthy and active on port 8008."
fi

# 2. Start Node.js Express Orchestrator in foreground
echo "[3/3] Launching TrustForge Express Backend on port ${PORT:-8000}..."
exec node dist/index.js
