@echo off
echo ========================================
echo   CallVu Quiz - Push to GitHub
echo ========================================
echo.

cd /d "%~dp0"

echo Checking if GitHub repo exists...
git ls-remote https://github.com/yakdaddy2025-jpg/callvusalesenablementquiz2.git >nul 2>&1

if errorlevel 1 (
    echo.
    echo ERROR: GitHub repository not found!
    echo.
    echo Please create it first:
    echo 1. Go to: https://github.com/new
    echo 2. Repository name: callvusalesenablementquiz2
    echo 3. Choose Public or Private
    echo 4. DO NOT check "Add a README file"
    echo 5. Click "Create repository"
    echo.
    echo Then run this script again.
    echo.
    pause
    exit /b 1
)

echo Repository exists!
echo.
echo Pushing to GitHub...
echo.

git push -u origin main

if errorlevel 1 (
    echo.
    echo Push failed. You may need to enter your GitHub credentials.
    echo.
    echo Try running this command manually:
    echo   git push -u origin main
    echo.
    echo Then enter your GitHub username and password when asked.
    echo.
) else (
    echo.
    echo ========================================
    echo   SUCCESS! Pushed to GitHub!
    echo ========================================
    echo.
    echo Your app will be live at:
    echo   https://callvusalesenablementquiz2.vercel.app
    echo.
    echo Vercel will auto-deploy in 1-2 minutes.
    echo Check: https://vercel.com/mike-callvus-projects/callvusalesenablementquiz2
    echo.
)

pause

