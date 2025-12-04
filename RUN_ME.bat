@echo off
REM Simple batch file to run the auto-deploy script
REM Just double-click this file!

echo.
echo ========================================
echo   CallVu Quiz - Auto Deployment
echo ========================================
echo.
echo Opening PowerShell...
echo.

cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File ".\auto-deploy.ps1"

echo.
echo ========================================
echo   Script finished!
echo ========================================
echo.
pause

