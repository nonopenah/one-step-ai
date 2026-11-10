@echo off
setlocal
cd /d "%~dp0"
set "PYTHONUTF8=1"
echo [ONE STEP] Checking Python installation...
python --version
if errorlevel 1 (
  echo Python was not found. Install Python and reopen this folder.
  pause
  exit /b 1
)
echo [ONE STEP] Installing backend dependencies...
python -X utf8 -m pip install -r requirements.txt
if errorlevel 1 (
  echo Backend setup failed. Please check the message above.
  pause
  exit /b 1
)
echo [ONE STEP] Backend: http://127.0.0.1:8000
python -m uvicorn app.main:app --reload --port 8000
pause
