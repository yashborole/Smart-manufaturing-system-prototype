import os
import auth
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.database import engine, Base
import app.models  # Ensure all models are registered
from app.routes.login import router as users_router
from app.routes.plants import router as plants_router
from app.routes.dashboard import router as dashboard_router
from app.routes.kiosk import router as kiosk_router

app = FastAPI(title="Smart Manufacturing MES API")

# Ensure all database tables exist on startup
@app.on_event("startup")
def startup_db():
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        print(f"Database table verification/creation note: {e}")

# Enable CORS for all origins in development and deployment
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routers
app.include_router(auth.router)
app.include_router(users_router)
app.include_router(plants_router)
app.include_router(dashboard_router)
app.include_router(kiosk_router)

@app.get("/health")
def health_check():
    return {"status": "ok", "app": "Smart Manufacturing MES API"}

# Serve frontend build if dist folder exists
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
if os.path.exists(frontend_dist):
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        # Don't intercept API docs
        if full_path in ("docs", "redoc", "openapi.json"):
            return None
        candidate = os.path.join(frontend_dist, full_path)
        if full_path and os.path.isfile(candidate):
            return FileResponse(candidate)
        return FileResponse(os.path.join(frontend_dist, "index.html"))