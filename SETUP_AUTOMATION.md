# Automated Setup Guide - CallVu Sales Enablement Quiz

## ✅ What's Already Done

1. ✅ All project files created and configured
2. ✅ Files committed to git
3. ✅ Remote set to: `https://github.com/yakdaddy2025-jpg/callvusalesenablementquiz2.git`
4. ✅ CVUF file updated with correct Vercel URL
5. ✅ Deployment script created (`deploy-callvu.ps1`)

## 🚀 Automated Deployment

### Option 1: Run the Deployment Script

```powershell
.\deploy-callvu.ps1
```

This script will:
- Check if the GitHub repo exists
- Push all files automatically
- Provide next steps

### Option 2: Manual Push (if script doesn't work)

```bash
git push -u origin main
```

## 📋 One-Time Setup Required

### 1. Create GitHub Repository (if not exists)

**Automated via GitHub CLI (if you have it installed):**
```bash
gh repo create yakdaddy2025-jpg/callvusalesenablementquiz2 --public --source=. --remote=origin --push
```

**Or manually:**
1. Go to https://github.com/new
2. Repository name: `callvusalesenablementquiz2`
3. Choose Public or Private
4. **DO NOT** initialize with README
5. Click "Create repository"

### 2. GitHub Authentication

If push fails, set up authentication:

**Option A: Personal Access Token**
1. Go to https://github.com/settings/tokens
2. Generate new token (classic)
3. Select scope: `repo`
4. Copy token
5. Use when prompted: `git push https://YOUR_TOKEN@github.com/yakdaddy2025-jpg/callvusalesenablementquiz2.git main`

**Option B: GitHub CLI**
```bash
gh auth login
```

### 3. Vercel Auto-Deploy

Once pushed to GitHub:
- Vercel will **automatically detect** the new commit
- Go to: https://vercel.com/mike-callvus-projects/callvusalesenablementquiz2
- If not auto-deployed, click "Redeploy"

### 4. Google Apps Script Setup

1. Go to https://script.google.com
2. New Project
3. Paste contents of `google-apps-script.js`
4. Deploy → New deployment → Web app
5. Execute as: **Me** | Access: **Anyone**
6. Copy the webhook URL
7. Update `pages/index.js` line 6:
   ```javascript
   const SHEET_WEBHOOK_URL = 'YOUR_WEBHOOK_URL_HERE';
   ```
8. Commit and push:
   ```bash
   git add pages/index.js
   git commit -m "Update webhook URL"
   git push
   ```

## 🎯 Quick Commands

```bash
# Check status
git status

# Push to GitHub
git push -u origin main

# Check Vercel deployment
# Visit: https://vercel.com/mike-callvus-projects/callvusalesenablementquiz2

# Test the app
# Visit: https://callvusalesenablementquiz2.vercel.app
```

## 🔧 Troubleshooting

**Repository not found:**
- Create it at https://github.com/new
- Name: `callvusalesenablementquiz2`

**Authentication failed:**
- Set up Personal Access Token (see above)
- Or use GitHub CLI: `gh auth login`

**Vercel not deploying:**
- Check GitHub connection in Vercel dashboard
- Manually trigger redeploy
- Check build logs in Vercel

**Voice recorder not working:**
- Ensure Vercel deployment is complete
- Check browser console for errors
- Verify webhook URL is set in `pages/index.js`

