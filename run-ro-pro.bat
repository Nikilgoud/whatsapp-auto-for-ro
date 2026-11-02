@echo off
title RO Care & Renewal PRO Engine
color 0b

echo ========================================================
echo         RO RENEWAL PRO - SERVICE & BILLING ENGINE       
echo ========================================================
echo.
echo [1/3] Checking Node.js environment...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

echo [2/3] Starting RO Renewal PRO Engine...
echo       - Default Owner Login: 9849000000
echo       - Default Passcode:    123456
echo.

start "" "http://localhost:3001"
start "" "http://localhost:3000"

echo [3/3] Opening dashboard in your default browser...
npm run dev

pause
