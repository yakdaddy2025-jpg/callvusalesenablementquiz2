@echo off
echo ========================================
echo   Push CallVu Quiz to GitHub
echo ========================================
echo.
echo This will push your code to GitHub.
echo You will be asked for your GitHub username and password.
echo.
echo IMPORTANT: For password, use a Personal Access Token, not your regular password!
echo.
echo If you don't have a token:
echo 1. Go to: https://github.com/settings/tokens
echo 2. Generate new token (classic)
echo 3. Check "repo" box
echo 4. Copy the token and use it as your password
echo.
echo Press any key to continue...
pause >nul

cd /d "%~dp0"

echo.
echo Pushing to GitHub...
echo.

git push -u origin main

if errorlevel 1 (
    echo.
    echo ========================================
    echo   Push completed (check above for errors)
    echo ========================================
    echo.
    echo If you see "Repository not found" or authentication errors:
    echo - Make sure you used a Personal Access Token as password
    echo - Or use GitHub Desktop (easier option)
    echo.
) else (
    echo.
    echo ========================================
    echo   SUCCESS! Code pushed to GitHub!
    echo ========================================
    echo.
    echo Vercel will auto-deploy in 1-2 minutes.
    echo Check: https://vercel.com/mike-callvus-projects/callvusalesenablementquiz2
    echo.
)

pause

