@echo off
REM TrustForge — Development Startup Script
REM Starts both the FastAPI backend and the Vite frontend

echo.
echo ============================================================
echo   TrustForge Research Prototype — Development Mode
echo ============================================================
echo.

REM Start backend
echo [1/2] Starting FastAPI backend on http://localhost:8000 ...
cd /d "%~dp0backend"
start "TrustForge Backend" cmd /k "python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
echo     Backend started in a new window.
echo.

REM Wait a moment for backend to start
timeout /t 2 /nobreak >nul

REM Start frontend
echo [2/2] Starting Vite frontend on http://localhost:5173 ...
cd /d "%~dp0"
start "TrustForge Frontend" cmd /k "npm run dev"
echo     Frontend started in a new window.
echo.

echo ============================================================
echo   Services Running:
echo     Backend:  http://localhost:8000
echo     API Docs: http://localhost:8000/docs
echo     Frontend: http://localhost:5173
echo ============================================================
echo.
echo   To stop services, close the two terminal windows.
echo.
