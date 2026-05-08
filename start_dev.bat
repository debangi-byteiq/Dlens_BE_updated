@echo off
setlocal

set "ROOT=%~dp0"
set "BACKEND_DIR=%ROOT%backend"
set "FRONTEND_DIR=%ROOT%frontend"
set "VENV_ACTIVATE=%ROOT%.venv\Scripts\activate.bat"

if not exist "%BACKEND_DIR%\" (
    echo Backend folder not found: "%BACKEND_DIR%"
    exit /b 1
)

if not exist "%FRONTEND_DIR%\" (
    echo Frontend folder not found: "%FRONTEND_DIR%"
    exit /b 1
)

start "DLens Backend" /D "%BACKEND_DIR%" cmd /k "if exist ""%VENV_ACTIVATE%"" (call ""%VENV_ACTIVATE%"" && uvicorn app.main:app --reload --host 127.0.0.1 --port 8000) else (echo Missing root virtualenv: ""%ROOT%.venv"" && echo Create it from the repo root with: python -m venv .venv && echo Then run: .venv\Scripts\activate.bat ^&^& pip install -r backend\requirements.txt)"

start "DLens Frontend" /D "%FRONTEND_DIR%" cmd /k "if exist node_modules\ (npm run dev -- --host 127.0.0.1 --port 5173) else (echo Missing frontend dependencies: frontend\node_modules && echo Run: npm install)"

echo Started DLens backend and frontend terminals.
echo Backend:  http://127.0.0.1:8000
echo Frontend: http://127.0.0.1:5173

endlocal
