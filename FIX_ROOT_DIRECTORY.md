# Fix Vercel Root Directory Error

## Problem
Vercel error: "The specified Root Directory "(root)" does not exist."

## Solution
I've updated `vercel.json` to remove the root directory setting. Vercel should auto-detect the root.

## What to Do Now

### Option 1: Wait for Auto-Deploy (Easiest)
1. Wait 1-2 minutes for Vercel to detect the new commit
2. It should automatically start a new deployment
3. Check: https://vercel.com/mike-callvus-projects/callvusalesenablementquiz2/deployments
4. Wait for it to finish
5. Test: https://callvusalesenablementquiz2.vercel.app/embed

### Option 2: Manual Redeploy
1. Go to: https://vercel.com/mike-callvus-projects/callvusalesenablementquiz2/deployments
2. Click the three dots (⋯) on the latest deployment
3. Click "Redeploy"
4. Wait for it to finish
5. Test: https://callvusalesenablementquiz2.vercel.app/embed

### Option 3: Fix in Vercel Settings (If Above Doesn't Work)
1. Go to: https://vercel.com/mike-callvus-projects/callvusalesenablementquiz2/settings/general
2. Find "Root Directory" setting
3. Change it to: **"."** (just a period) or leave it **empty**
4. Click "Save"
5. Go to Deployments and click "Redeploy"

## What I Fixed
- Removed `outputDirectory` from vercel.json (Next.js handles this automatically)
- Simplified vercel.json to just specify framework and build command
- Vercel will now auto-detect everything else

The new deployment should work now!

