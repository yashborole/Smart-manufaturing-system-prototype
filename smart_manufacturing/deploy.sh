#!/bin/bash
set -e

echo "========================================================="
echo "  Smart Manufacturing MES - Production Deployment"
echo "========================================================="

if command -v docker &> /dev/null; then
    echo "[1/2] Docker detected. Starting stack via Docker Compose..."
    docker compose up -d --build
    echo ""
    echo "========================================================="
    echo "  Deployment Successful!"
    echo "  MES Application:  http://localhost:8000"
    echo "  API Swagger Docs: http://localhost:8000/docs"
    echo "  Admin Login:      admin / admin123"
    echo "========================================================="
    exit 0
fi

echo "Docker not detected. Deploying using Python environment..."

if [ -d "frontend" ]; then
    echo "[1/3] Building frontend..."
    cd frontend
    npm install
    npm run build
    cd ..
fi

echo "[2/3] Initializing database..."
python3 init_db.py

echo "[3/3] Launching FastAPI server..."
echo "MES is running at http://localhost:8000"
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 2
