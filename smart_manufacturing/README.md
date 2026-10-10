# 🏭 Smart Manufacturing MES (Manufacturing Execution System)

A modern, full-stack **Manufacturing Execution System (MES)** built with **FastAPI**, **PostgreSQL**, and **React**. Designed to monitor plant floors in real time, calculate OEE (Overall Equipment Effectiveness), track jobs & production cycles, and simulate shop-floor machine kiosks.

---

## ✨ Features

- **Plant Fleet Management**: Manage multiple manufacturing facilities and production lines.
- **Real-Time KPIs & OEE**: Calculate availability, performance, and quality metrics per machine and plant.
- **Machine Kiosk Simulation**:
  - Industrial operator interface with color-coded live machine states (`Running`, `Idle`, `Stopped`, `Down`, `Maintenance`).
  - Job queueing and execution with priority tracking.
  - Progressive cycle simulation and machine telemetry.
- **Defect & Rejection Tracking**: Defect codes by machine category (e.g., CNC dimensional error, welding porosity, lathe chatter marks).
- **Automated Alerts & Activity Auditing**: Real-time alerts on tool wear, vibration, and unplanned stops.
- **Docker-Ready**: Multi-stage build and full multi-container Docker Compose configuration for 1-click cloud or on-premise deployment.

---

## 🛠️ Technology Stack

- **Backend**: Python 3.11, FastAPI, SQLAlchemy 2.0, Pydantic, Alembic, Uvicorn
- **Frontend**: React 18, Vite, Lucide Icons, Axios, React Router
- **Database**: PostgreSQL 15
- **DevOps**: Docker, Docker Compose, Nginx (optional reverse-proxy)

---

## 🚀 Quick Start (Production Deployment)

### Using Docker Compose (Recommended)

```bash
docker compose up -d --build
```

The system will start:
1. **PostgreSQL 15** database on port `5432`
2. **FastAPI MES Application & Frontend** on [http://localhost:8000](http://localhost:8000)
3. **Factory Floor Simulator** simulating live machine cycles

#### Default Admin Login:
- **Username**: `admin`
- **Password**: `admin123`
- **API Swagger Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

### Local Development Setup

#### 1. Backend Setup
```bash
# Activate virtual environment
.\venv\Scripts\activate   # Windows
# or: source venv/bin/activate  # Linux/macOS

# Install dependencies
pip install -r requirements.txt

# Bootstrap database and admin user
python init_db.py

# Run FastAPI backend
uvicorn app.main:app --reload --port 8000
```

#### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173).

#### 3. Factory Floor Simulator (Optional background worker)
```bash
python simulate_factory.py
```

---

## 📖 Deployment Documentation

Detailed deployment guides for **Railway**, **Render**, **Fly.io**, **AWS**, and custom Linux servers are documented in [DEPLOYMENT.md](DEPLOYMENT.md).

---

## 📁 Repository Structure

```
smart_manufacturing/
├── app/
│   ├── core/           # Configuration and security settings
│   ├── db_ops/         # Database queries & business logic (kiosk, plants, login)
│   ├── routes/         # FastAPI endpoints (kiosk, plants, dashboard, login)
│   ├── database.py     # SQLAlchemy engine, connection pooling & session management
│   ├── models.py       # DB schema (User, Plant, Machine, Job, MachineLog, etc.)
│   ├── schemas.py      # Pydantic validation schemas
│   └── main.py         # App factory, routers, and static SPA serving
├── frontend/           # React + Vite frontend source code
│   ├── src/
│   │   ├── api/        # Dynamic API configuration
│   │   ├── components/ # Reusable UI components
│   │   ├── context/    # Authentication & Plant state context
│   │   └── pages/      # Dashboard, MachineKiosk, MachineInsight, Login
│   └── dist/           # Built static assets
├── alembic/            # Database schema migrations
├── init_db.py          # Automatic DB table bootstrap & default seed script
├── seed_data.py        # Demo dataset generator for testing
├── simulate_factory.py # Continuous shop-floor machine simulator
├── Dockerfile          # Multi-stage production container
├── docker-compose.yml  # Multi-service production stack
├── DEPLOYMENT.md       # Complete deployment guide
└── requirements.txt    # Python dependencies
```
