@echo off
title Zekra Server v2
echo ========================================================
echo    Starting Zekra v2 Local Server on http://localhost:5500
echo ========================================================
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0server.ps1"
pause
