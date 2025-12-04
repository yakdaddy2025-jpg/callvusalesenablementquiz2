@echo off
echo ========================================
echo   Push CallVu Quiz to GitHub
echo ========================================
echo.
echo Your repo is now PUBLIC - great!
echo.
echo You need to authenticate with the CORRECT GitHub account:
echo   Account: yakdaddy2025-jpg
echo.
echo This script will ask for your credentials.
echo.
echo IMPORTANT: Use a Personal Access Token as your password!
echo (Not your regular GitHub password)
echo.
echo To get a token:
echo 1. Go to: https://github.com/settings/tokens
echo 2. Generate new token (classic)
echo 3. Check "repo" box
echo 4. Copy the token
echo.
echo Press any key to continue...
pause >nul

cd /d "%~dp0"

echo.
echo Clearing old credentials...
git credential reject
echo protocol=https
echo host=github.com
) | git credential reject

echo.
echo Pushing to GitHub...
echo You will be prompted for:
echo - Username: yakdaddy2025-jpg
echo - Password: (use your Personal Access Token)
echo.

git push -u origin main

if errorlevel 1 (
    echo.
    echo ========================================
    echo   Authentication failed
    echo ========================================
    echo.
    echo Make sure you:
    echo 1. Use username: yakdaddy2025-jpg
    echo 2. Use a Personal Access Token (not regular password)
    echo 3. The token has "repo" permissions
    echo.
    echo Try again, or use GitHub Desktop instead.
    echo.
) else (
    echo.
    echo ========================================
    echo   SUCCESS! Code pushed to GitHub!
    echo ========================================
    echo.
    echo Vercel will auto-deploy in 1-2 minutes!
    echo Check: https://vercel.com/mike-callvus-projects/callvusalesenablementquiz2
    echo App URL: https://callvusalesenablementquiz2.vercel.app
    echo.
)

pause

