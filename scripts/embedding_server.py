"""
TrustForge Lightweight Local Embedding Server.
Serves sentence-transformers/all-MiniLM-L6-v2 embeddings via HTTP on port 8008.
Uses standard library http.server (no extra dependencies).
"""
import json
from http.server import HTTPServer, BaseHTTPRequestHandler
from sentence_transformers import SentenceTransformer

print("[Embedding Server] Loading sentence-transformers/all-MiniLM-L6-v2...")
model = SentenceTransformer('all-MiniLM-L6-v2')
print("[Embedding Server] Model loaded successfully.")

class EmbeddingHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/health':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"status": "healthy", "model": "all-MiniLM-L6-v2", "dimension": 384}).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        if self.path == '/embed':
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length).decode('utf-8')
            try:
                data = json.loads(body)
                text = data.get('text', '')
                vector = model.encode(text, normalize_embeddings=True).tolist()
                response = json.dumps({"vector": vector, "dimension": len(vector)}).encode('utf-8')
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(response)
            except Exception as e:
                err_resp = json.dumps({"error": str(e)}).encode('utf-8')
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(err_resp)
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, format, *args):
        # Quiet logging
        return

if __name__ == '__main__':
    import os
    host = os.environ.get('EMBEDDING_HOST', '0.0.0.0')
    port = int(os.environ.get('EMBEDDING_PORT', '8008'))
    server_address = (host, port)
    httpd = HTTPServer(server_address, EmbeddingHandler)
    print(f"[Embedding Server] Listening on http://{host}:{port}...")
    httpd.serve_forever()
