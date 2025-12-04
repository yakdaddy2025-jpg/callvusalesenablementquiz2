# 🚀 Quick Start - CallVu Quiz Deployment

## One Command Deployment

```powershell
.\auto-deploy.ps1
```

This script will:
- ✅ Verify all files are ready
- ✅ Stage and commit changes
- ✅ Check if GitHub repo exists
- ✅ Push to GitHub
- ✅ Provide next steps

## If Repository Doesn't Exist

The script will guide you, or create it automatically:

```powershell
# With GitHub CLI installed:
.\auto-deploy.ps1 -CreateRepo

# Or manually create at:
# https://github.com/new
# Name: callvusalesenablementquiz2
```

## If Authentication Fails

```powershell
# Option 1: Use GitHub CLI
gh auth login
.\auto-deploy.ps1

# Option 2: Use token
.\auto-deploy.ps1 -GitHubToken YOUR_PERSONAL_ACCESS_TOKEN

# Option 3: Manual
git push -u origin main
```

## After Successful Push

1. **Vercel auto-deploys** (check in 1-2 minutes)
2. **App live at:** https://callvusalesenablementquiz2.vercel.app
3. **Set up Google Apps Script** (see SETUP_AUTOMATION.md)

## Current Status

✅ All files created and committed
✅ Remote configured: `callvusalesenablementquiz2`
⏳ Waiting for: GitHub repo creation + push

---

**Need help?** See `SETUP_AUTOMATION.md` for detailed instructions.
