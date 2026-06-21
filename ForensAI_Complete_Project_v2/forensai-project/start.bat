@echo off
echo.
echo ==============================================
echo   FORENSAI -- Intelligent Forest Protection
echo   AI-Sthetica 2026 ^| Harshitha + Kshema + Neha
echo ==============================================
echo.

echo [1/4] Installing backend dependencies...
cd forensai-backend
pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install backend dependencies
    pause
    exit /b 1
)
echo Backend dependencies installed.

echo.
echo [2/4] Starting ForensAI Backend on port 8000...
start "ForensAI Backend" cmd /k "python -m uvicorn main:app --reload --port 8000 --host 0.0.0.0"
echo Backend starting...

timeout /t 5 /nobreak > nul

echo.
echo [3/4] Installing frontend dependencies...
cd ..\forensai-frontend
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install frontend dependencies
    pause
    exit /b 1
)
echo Frontend dependencies installed.

echo.
echo [4/4] Starting ForensAI Dashboard on port 3000...
start "ForensAI Dashboard" cmd /k "npm start"

echo.
echo ==============================================
echo   ForensAI is running!
echo   Backend API:  http://localhost:8000
echo   Dashboard:    http://localhost:3000
echo   Health check: http://localhost:8000/health
echo ==============================================
echo.
echo Both windows have been opened.
echo Close them to stop the services.
pause
