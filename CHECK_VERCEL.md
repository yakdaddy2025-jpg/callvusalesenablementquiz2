# Check Vercel Settings

## The 404 Error

Vercel is building but showing 404. This usually means the framework isn't detected correctly.

## Fix in Vercel Dashboard

1. Go to: https://vercel.com/mike-callvus-projects/callvusalesenablementquiz2
2. Click **Settings** (top right)
3. Click **General** (left sidebar)
4. Scroll to **Build & Development Settings**

### Verify These Settings:

**Framework Preset:** Should be **Next.js**
- If it says "Other" or is blank, change it to **Next.js**

**Build Command:** Should be `npm run build`
- This is correct for Next.js

**Output Directory:** Should be `.next` or leave blank
- Next.js uses `.next` automatically
- Don't set it to `dist` (that's for Vite/React)

**Install Command:** Should be `npm install`
- This is correct

**Root Directory:** Should be `/` (root)
- This is correct

## After Changing Settings

1. Go to **Deployments** tab
2. Click the **three dots** (⋯) on the latest deployment
3. Click **Redeploy**
4. Wait for it to complete
5. Check the URL again

## Expected Result

After fixing:
- ✅ Build completes successfully
- ✅ App loads at: https://callvusalesenablementquiz2.vercel.app
- ✅ Shows voice recorder interface (not 404)

## If Still Not Working

Check the build logs in Vercel:
1. Click on the deployment
2. Click **Build Logs**
3. Look for any errors
4. Share the error message if you see one

