@echo off
setlocal
cd /d "%~dp0frontend"
if not exist "node_modules" (
  echo [ONE STEP] Installing frontend packages...
  call npm.cmd install
  if errorlevel 1 (
    echo Frontend installation failed.
    pause
    exit /b 1
  )
)
echo [ONE STEP] Frontend: http://localhost:3000
call npm.cmd run dev
pause
