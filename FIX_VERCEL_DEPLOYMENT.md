# Fix Vercel 404 Error for /embed Route

## Problem
The `/embed` route is returning 404 on Vercel: `https://callvusalesenablementquiz2.vercel.app/embed`

## Solution Steps

### Step 1: Verify Vercel Project Settings
1. Go to: https://vercel.com/mike-callvus-projects/callvusalesenablementquiz2/settings
2. Check **"Framework Preset"** - should be **"Next.js"**
3. Check **"Root Directory"** - should be **"."** (root)
4. Check **"Build Command"** - should be **"npm run build"** (or leave default)
5. Check **"Output Directory"** - should be **".next"** (or leave default)

### Step 2: Trigger Redeployment
1. Go to: https://vercel.com/mike-callvus-projects/callvusalesenablementquiz2/deployments
2. Click **"Redeploy"** on the latest deployment
3. Or push a new commit to trigger auto-deployment

### Step 3: Check Build Logs
1. Go to the deployment page
2. Click on the latest deployment
3. Check **"Build Logs"** for any errors
4. The build should show:
   ```
   Route (pages)                             Size     First Load JS
   └ ○ /embed                                3.1 kB         81.3 kB
   ```

### Step 4: Verify Files Are in GitHub
1. Go to: https://github.com/yakdaddy2025-jpg/callvusalesenablementquiz2
2. Verify `pages/embed.js` exists
3. Verify `package.json` exists
4. Verify `next.config.js` exists

### Step 5: If Still Not Working
1. **Delete and Recreate Vercel Project:**
   - Go to Vercel dashboard
   - Delete the current project
   - Import from GitHub again
   - Select the repository
   - Vercel should auto-detect Next.js

2. **Manual Deployment:**
   - Install Vercel CLI: `npm i -g vercel`
   - Run: `vercel --prod`
   - Follow prompts

## Current Status
✅ Local build works (`npm run build` succeeds)
✅ `/embed` route is generated correctly
✅ Files are in the repository
❌ Vercel deployment needs to be fixed/redeployed

## Next Steps
1. Check Vercel project settings (Step 1)
2. Redeploy (Step 2)
3. Test: `https://callvusalesenablementquiz2.vercel.app/embed`
4. If still 404, try deleting and recreating the Vercel project

