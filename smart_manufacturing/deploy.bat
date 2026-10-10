@echo off
setlocal

echo =========================================================
echo   Smart Manufacturing MES - Production Deployment
echo =========================================================
echo.

where docker >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [1/3] Docker detected on your system.
    echo       Starting full stack via Docker Compose...
    docker compose up -d --build
    echo.
    echo =========================================================
    echo   Deployment Successful!
    echo   MES Application:  http://localhost:8000
    echo   API Swagger Docs: http://localhost:8000/docs
    echo   Admin Login:      admin / admin123
    echo =========================================================
    goto :end
)

echo Docker not found or not in PATH. Running local production build...
echo.

if not exist "venv\Scripts\python.exe" (
    echo [Error] Python virtual environment not found in .\venv.
    exit /b 1
)

echo [1/3] Building Frontend React assets...
cd frontend
call npm run build
cd ..

echo [2/3] Initializing Database & Admin Account...
venv\Scripts\python.exe init_db.py

echo [3/3] Starting Production FastAPI Server...
echo MES is running at http://localhost:8000
venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000

:end
endlocal
