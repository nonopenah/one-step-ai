@echo off
setlocal
cd /d "%~dp0"
echo [ONE STEP] Checking backend packages...
py -m pip install -r requirements.txt
if errorlevel 1 (
  echo Backend setup failed. Python may need to be installed.
  pause
  exit /b 1
)
echo [ONE STEP] Backend: http://127.0.0.1:8000
py -m uvicorn app.main:app --reload --port 8000
pause
