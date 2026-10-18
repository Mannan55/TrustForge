@echo off
setlocal
set "PROJECT=C:\TF new V1\TrustForge"
set "BACKEND=%PROJECT%\backend"
set "FRONTEND=%PROJECT%\TrustForge Frontend"

if not exist "%BACKEND%\main.py" (
    echo ERROR: Cannot find backend\main.py at "%BACKEND%".
    pause
    exit /b 1
)
if not exist "%FRONTEND%\package.json" (
    echo ERROR: Cannot find frontend\package.json at "%FRONTEND%".
    pause
    exit /b 1
)

echo Starting TrustForge backend and frontend...
start "TrustForge Backend" cmd /k "cd /d ""%BACKEND%"" && python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000"
start "TrustForge Frontend" cmd /k "cd /d ""%FRONTEND%"" && npm run dev -- --host 127.0.0.1 --port 5173"

echo.
echo Backend:  http://127.0.0.1:8000
 echo Frontend: http://127.0.0.1:5173
 echo API docs: http://127.0.0.1:8000/docs
 echo.
echo Keep both new command windows open while using TrustForge.
echo To stop: press Ctrl+C in EACH window.
pause
