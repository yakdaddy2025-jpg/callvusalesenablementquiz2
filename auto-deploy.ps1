# Fully Automated Deployment Script for CallVu Quiz
# This script attempts to automate everything possible

param(
    [string]$GitHubToken = "",
    [switch]$CreateRepo = $false
)

$ErrorActionPreference = "Continue"
$repoUrl = "https://github.com/yakdaddy2025-jpg/callvusalesenablementquiz2.git"
$repoName = "callvusalesenablementquiz2"

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   CallVu Sales Enablement Quiz - Auto Deployment       ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Step 1: Verify files are ready
Write-Host "[1/5] Verifying project files..." -ForegroundColor Yellow
$requiredFiles = @(
    "pages/index.js",
    "pages/_app.js",
    "styles/globals.css",
    "package.json",
    "next.config.js",
    "google-apps-script.js",
    "Sales_Enablement_Quiz.cvuf"
)

$missingFiles = @()
foreach ($file in $requiredFiles) {
    if (-not (Test-Path $file)) {
        $missingFiles += $file
    }
}

if ($missingFiles.Count -gt 0) {
    Write-Host "❌ Missing files: $($missingFiles -join ', ')" -ForegroundColor Red
    exit 1
}
Write-Host "✅ All required files present" -ForegroundColor Green
Write-Host ""

# Step 1.5: Configure git if needed
Write-Host "[1.5/5] Configuring git..." -ForegroundColor Yellow
$gitEmail = git config user.email 2>&1
$gitName = git config user.name 2>&1

if (-not $gitEmail -or $gitEmail -like "*error*" -or $gitEmail -eq "") {
    Write-Host "⚠️  Git email not set. Setting default..." -ForegroundColor Yellow
    git config user.email "callvu-quiz@example.com" 2>&1 | Out-Null
    git config user.name "CallVu Quiz" 2>&1 | Out-Null
    Write-Host "✅ Git configured (you can change this later)" -ForegroundColor Green
} else {
    Write-Host "✅ Git already configured" -ForegroundColor Green
}
Write-Host ""

# Step 2: Check git status
Write-Host "[2/5] Checking git status..." -ForegroundColor Yellow
$gitStatus = git status --porcelain 2>&1
$stagedFiles = git diff --cached --name-only 2>&1

if ($stagedFiles.Count -eq 0) {
    Write-Host "⚠️  No files staged. Staging CallVu project files..." -ForegroundColor Yellow
    git add pages/ styles/ next.config.js tailwind.config.js postcss.config.js google-apps-script.js Sales_Enablement_Quiz.cvuf package.json README.md .gitignore 2>&1 | Out-Null
    
    $hasChanges = git diff --cached --name-only 2>&1
    if ($hasChanges.Count -gt 0) {
        Write-Host "✅ Files staged" -ForegroundColor Green
        git commit -m "Deploy CallVu Sales Enablement Quiz voice recorder" 2>&1 | Out-Null
        Write-Host "✅ Changes committed" -ForegroundColor Green
    }
} else {
    Write-Host "✅ Files already staged/committed" -ForegroundColor Green
}
Write-Host ""

# Step 3: Check if repo exists
Write-Host "[3/5] Checking GitHub repository..." -ForegroundColor Yellow
$repoCheck = git ls-remote $repoUrl 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Repository not found on GitHub" -ForegroundColor Red
    Write-Host ""
    
    if ($CreateRepo) {
        Write-Host "Attempting to create repository..." -ForegroundColor Yellow
        # Try GitHub CLI first
        $ghExists = Get-Command gh -ErrorAction SilentlyContinue
        if ($ghExists) {
            Write-Host "Using GitHub CLI to create repo..." -ForegroundColor Yellow
            gh repo create $repoName --public --source=. --remote=origin --push 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Repository created and pushed!" -ForegroundColor Green
                exit 0
            }
        }
    }
    
    Write-Host ""
    Write-Host "📋 MANUAL STEP REQUIRED:" -ForegroundColor Cyan
    Write-Host "   1. Go to: https://github.com/new" -ForegroundColor White
    Write-Host "   2. Repository name: $repoName" -ForegroundColor White
    Write-Host "   3. Choose Public or Private" -ForegroundColor White
    Write-Host "   4. DO NOT initialize with README" -ForegroundColor White
    Write-Host "   5. Click 'Create repository'" -ForegroundColor White
    Write-Host ""
    Write-Host "   Then run this script again:" -ForegroundColor Yellow
    Write-Host "   .\auto-deploy.ps1" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host "✅ Repository exists" -ForegroundColor Green
Write-Host ""

# Step 4: Set remote (if not already set)
Write-Host "[4/5] Configuring git remote..." -ForegroundColor Yellow
$currentRemote = git remote get-url origin 2>&1
if ($currentRemote -notlike "*$repoName*") {
    git remote set-url origin $repoUrl 2>&1 | Out-Null
    Write-Host "✅ Remote configured" -ForegroundColor Green
} else {
    Write-Host "✅ Remote already configured" -ForegroundColor Green
}
Write-Host ""

# Step 5: Push to GitHub
Write-Host "[5/5] Pushing to GitHub..." -ForegroundColor Yellow

if ($GitHubToken) {
    Write-Host "Using provided GitHub token..." -ForegroundColor Yellow
    $tokenUrl = $repoUrl -replace "https://", "https://$GitHubToken@"
    git push $tokenUrl main 2>&1
} else {
    git push -u origin main 2>&1
}

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║              ✅ SUCCESSFULLY DEPLOYED!                  ║" -ForegroundColor Green
    Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
    Write-Host "🔗 Your app will be live at:" -ForegroundColor Cyan
    Write-Host "   https://callvusalesenablementquiz2.vercel.app" -ForegroundColor White
    Write-Host ""
    Write-Host "📋 Next Steps:" -ForegroundColor Cyan
    Write-Host "   1. Vercel will auto-deploy (check in 1-2 minutes)" -ForegroundColor White
    Write-Host "   2. Go to: https://vercel.com/mike-callvus-projects/callvusalesenablementquiz2" -ForegroundColor White
    Write-Host "   3. Set up Google Apps Script (see SETUP_AUTOMATION.md)" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Push failed. Possible reasons:" -ForegroundColor Red
    Write-Host "   - Authentication required" -ForegroundColor Yellow
    Write-Host "   - Repository permissions" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "💡 Solutions:" -ForegroundColor Cyan
    Write-Host "   Option 1: Use GitHub CLI" -ForegroundColor White
    Write-Host "      gh auth login" -ForegroundColor Gray
    Write-Host "      .\auto-deploy.ps1" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   Option 2: Use Personal Access Token" -ForegroundColor White
    Write-Host "      .\auto-deploy.ps1 -GitHubToken YOUR_TOKEN" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   Option 3: Manual push" -ForegroundColor White
    Write-Host "      git push -u origin main" -ForegroundColor Gray
    Write-Host "      (Enter credentials when prompted)" -ForegroundColor Gray
    Write-Host ""
}

