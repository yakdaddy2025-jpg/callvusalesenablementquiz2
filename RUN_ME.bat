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

@echo off
cd /d "%~dp0"
REM Make sure we're in the right directory
if not exist "pages" (
    echo ERROR: Not in the correct directory!
    echo Please run this from: C:\Users\mikes\callvusalesenablementquiz2
    pause
    exit
)
powershell -ExecutionPolicy Bypass -File ".\auto-deploy.ps1"

echo.
echo ========================================
echo   Script finished!
echo ========================================
echo.
echo Press any key to close this window...
pause >nul

