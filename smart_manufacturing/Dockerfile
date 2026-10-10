# Multi-Stage Production Dockerfile for Smart Manufacturing MES
# Stage 1: Build Frontend (React + Vite)
FROM node:20-alpine AS frontend-builder
WORKDIR /build

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
# Build frontend with relative API path for reverse-proxy / same-origin hosting
ENV VITE_API_URL=""
RUN npm run build

# Stage 2: Production Python Backend (FastAPI + Uvicorn)
FROM python:3.11-slim AS production

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PORT=8000

WORKDIR /app

# Install system dependencies (including libpq for psycopg2)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copy backend source code
COPY app/ ./app/
COPY auth.py create_admin.py init_db.py seed_data.py simulate_factory.py reset_machine_data.py ./
COPY alembic/ ./alembic/
COPY alembic.ini ./

# Copy built frontend from Stage 1 into /app/frontend/dist
COPY --from=frontend-builder /build/dist ./frontend/dist

# Expose production port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Entrypoint: initialize database tables & start uvicorn
CMD ["sh", "-c", "python init_db.py && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 2"]
