# Smart Manufacturing MES — Production Deployment Guide

This guide covers everything needed to deploy the **Smart Manufacturing MES** application across local production, Docker, or Cloud environments (Railway, Render, Fly.io, AWS).

---

## 🚀 Option 1: One-Click Docker Compose Deployment (Recommended)

Docker Compose deploys the complete multi-tier architecture:
- **PostgreSQL 15** database with persistent volume and automatic health checks.
- **FastAPI MES Backend & React Frontend** (unified high-performance container with auto-bootstrap).
- **Factory Floor Simulator** running continuous real-time machine ticks in the background.

### Prerequisites
- Docker Desktop or Docker Engine installed.

### Steps
1. Configure environment variables (optional, defaults are pre-configured):
   ```bash
   cp .env.example .env
   ```
2. Launch the full stack:
   ```bash
   docker compose up -d --build
   ```
3. Open your browser:
   - **MES Application UI**: [http://localhost:8000](http://localhost:8000)
   - **Swagger API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
   - **Default Admin Login**:
     - **Username**: `admin`
     - **Password**: `admin123`

To inspect container logs:
```bash
docker compose logs -f mes-app
docker compose logs -f mes-simulator
```

To stop:
```bash
docker compose down
```

---

## ☁️ Option 2: Cloud Deployment (Railway / Render / Fly.io)

### Railway
1. Push this repository to GitHub.
2. Log into [Railway.app](https://railway.app) and create a **New Project** from GitHub repo.
3. Add a **PostgreSQL** database service in the Railway canvas.
4. Set the following environment variables in the App service:
   - `DATABASE_URL`: `${{Postgres.DATABASE_URL}}`
   - `PORT`: `8000`
5. Railway will automatically build using the included multi-stage [`Dockerfile`](file:///d:/Fast%20api/smart_manufacturing/Dockerfile) and launch the app.

### Render
1. Create a **New Web Service** pointing to your repository.
2. Select **Docker** runtime.
3. Under Environment Variables:
   - Add `DATABASE_URL` pointing to your managed PostgreSQL instance.
   - `PORT`: `8000`
4. Deploy!

### Fly.io
```bash
fly launch
fly postgres create
fly postgres attach <postgres-app-name>
fly deploy
```

---

## 💻 Option 3: Local / On-Premise Production Deployment

If deploying directly on a host machine without Docker:

### 1. Build the React Frontend
```bash
cd frontend
npm install
npm run build
cd ..
```

### 2. Configure Environment
Set `DATABASE_URL` in `.env` or system environment:
```ini
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/smart_manufacturing"
```

### 3. Initialize Database & Demo Data
```bash
python init_db.py
```

### 4. Run the Production Server
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2
```

### 5. (Optional) Run the Real-Time Factory Simulator
In a separate terminal or background service:
```bash
python simulate_factory.py
```

---

## 🔑 Default Credentials

| Username | Password | Role | Assigned Plants |
| :--- | :--- | :--- | :--- |
| `admin` | `admin123` | System Administrator | Mumbai Plant, Pune Plant |

*(Custom admin credentials can be set via `ADMIN_USERNAME` and `ADMIN_PASSWORD` in your `.env` before running `init_db.py`)*

---

## 📊 Verification & Health Check

- **Health Endpoint**: `GET /health` → `{"status": "ok", "app": "Smart Manufacturing MES API"}`
- **Interactive API Docs**: `GET /docs` or `GET /redoc`
- **Machine Kiosk UI**: Navigate to `/kiosk` to test selecting machines, queueing jobs, and live execution.
