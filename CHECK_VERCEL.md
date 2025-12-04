# Checking Your Vercel Deployment

## Correct URLs to Try

1. **Production URL (Main):**
   ```
   https://callvusalesenablementquiz2.vercel.app
   ```

2. **Embed Page (Voice Recorder):**
   ```
   https://callvusalesenablementquiz2.vercel.app/embed
   ```

3. **Test with Question Parameter:**
   ```
   https://callvusalesenablementquiz2.vercel.app/embed?question=Q1_Banking&title=Test
   ```

## If You're Getting 404 Errors

### Step 1: Check Vercel Dashboard

1. Go to https://vercel.com
2. Sign in
3. Find your project: `callvusalesenablementquiz2`
4. Check the **Deployments** tab
5. Look for the latest deployment - is it:
   - ✅ **Ready** (green checkmark)?
   - ⏳ **Building** (yellow spinner)?
   - ❌ **Error** (red X)?

### Step 2: Check Build Logs

If there's an error:
1. Click on the failed deployment
2. Click "View Build Logs"
3. Look for error messages
4. Common issues:
   - Missing dependencies
   - Build errors
   - Configuration issues

### Step 3: Verify Project Settings

In Vercel dashboard → Settings → General:
- **Framework Preset:** Next.js
- **Root Directory:** `./` (or leave empty)
- **Build Command:** `npm run build` (should auto-detect)
- **Output Directory:** `.next` (should auto-detect)

### Step 4: Check Domain Configuration

1. Go to Settings → Domains
2. You should see: `callvusalesenablementquiz2.vercel.app`
3. Make sure it's assigned to your project

## Quick Fixes

### If Build Failed:

1. **Check for errors in build logs**
2. **Try redeploying:**
   - Go to Deployments
   - Click the three dots (⋯) on latest deployment
   - Click "Redeploy"

### If 404 on Specific Routes:

The `/embed` route should exist because we created `pages/embed.js`. If it's not working:

1. **Verify the file exists:** `pages/embed.js`
2. **Check Next.js routing:**
   - `pages/index.js` → `/`
   - `pages/embed.js` → `/embed`

3. **Try rebuilding:**
   ```bash
   npm run build
   ```
   If this works locally, push to GitHub and Vercel will rebuild.

## Testing Locally First

Before checking Vercel, test locally:

```bash
npm install
npm run dev
```

Then visit:
- http://localhost:3000
- http://localhost:3000/embed

If these work locally, the issue is with Vercel deployment, not your code.

## Still Getting 404?

1. **Check the exact URL you're using** - make sure it's the production URL, not a preview URL
2. **Wait a few minutes** - sometimes deployments take time to propagate
3. **Clear browser cache** - try incognito/private mode
4. **Check Vercel status page** - https://www.vercel-status.com/
