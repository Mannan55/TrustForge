# TrustForge Multi-Process Production Container for Render
# Hosts both Node.js Express 4.21 Orchestrator and Python SentenceTransformers Daemon

FROM node:22-bookworm-slim

# Install system dependencies, Python 3, pip, and Playwright Chromium requirements
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    curl \
    ca-certificates \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libpango-1.0-0 \
    libcairo2 \
    libasound2 \
    && rm -rf /var/lib/apt/lists/*

# Set up virtual environment for Python SentenceTransformers
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install sentence-transformers and PyTorch CPU-only for lightweight cloud memory footprint
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu && \
    pip install --no-cache-dir sentence-transformers

WORKDIR /app

# Copy package manifests and install Node dependencies
COPY package*.json ./
RUN npm ci

# Copy full application source
COPY . .

# Copy embedding server script and knowledge corpus to expected paths
COPY ../scripts /app/scripts
COPY ../backend/knowledge /app/backend/knowledge

# Compile TypeScript
RUN npm run build

# Install Playwright browser binaries
RUN npx playwright install chromium --with-deps

# Make start script executable
RUN chmod +x /app/start.sh

# Render binds dynamically to PORT (typically 10000 or 8000)
ENV PORT=8000
ENV EMBEDDING_SERVICE_URL="http://127.0.0.1:8008/embed"
ENV EMBEDDING_HEALTH_URL="http://127.0.0.1:8008/health"

EXPOSE 8000 8008

CMD ["/bin/bash", "/app/start.sh"]
