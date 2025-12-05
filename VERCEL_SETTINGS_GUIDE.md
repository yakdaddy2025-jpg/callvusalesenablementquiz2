# How to Find Vercel Settings - Step by Step

## Method 1: Via Project Dashboard
1. Go to: https://vercel.com/dashboard
2. Find your project: **"callvusalesenablementquiz2"**
3. Click on the project name
4. Click **"Settings"** tab (top navigation)
5. Scroll down to **"General"** section
6. Look for:
   - **Framework Preset** (should say "Next.js")
   - **Root Directory** (should be "." or empty)
   - **Build Command** (should be "npm run build" or empty for auto-detect)
   - **Output Directory** (should be ".next" or empty for auto-detect)

## Method 2: Via Project Settings Direct Link
1. Go directly to: https://vercel.com/mike-callvus-projects/callvusalesenablementquiz2/settings/general
2. This should take you straight to the General settings page

## Method 3: Check Build Logs Instead
If you can't find settings, check the build logs:
1. Go to: https://vercel.com/mike-callvus-projects/callvusalesenablementquiz2/deployments
2. Click on the **latest deployment** (top of the list)
3. Click **"Build Logs"** tab
4. Look for errors or check if it says "Next.js" detected

## What to Look For
- If Framework Preset is NOT "Next.js", change it to "Next.js"
- If Root Directory is NOT "." or empty, set it to "."
- If Build Command is different, you can leave it as default (Next.js auto-detects)

## Alternative: Just Redeploy
If you can't find the settings, just:
1. Go to deployments: https://vercel.com/mike-callvus-projects/callvusalesenablementquiz2/deployments
2. Click the **three dots (⋯)** on the latest deployment
3. Click **"Redeploy"**
4. Wait for it to finish
5. Test: https://callvusalesenablementquiz2.vercel.app/embed

## If Still 404 After Redeploy
The issue might be that Vercel isn't detecting Next.js. Try:
1. Delete the Vercel project
2. Go to: https://vercel.com/new
3. Import from GitHub: https://github.com/yakdaddy2025-jpg/callvusalesenablementquiz2
4. Vercel should auto-detect Next.js
5. Click "Deploy"

