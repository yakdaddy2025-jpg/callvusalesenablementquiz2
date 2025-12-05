# Fix Root Directory Error - Step by Step

## The Problem
Vercel is looking for a root directory called "(root)" which doesn't exist. This is a setting in Vercel's dashboard, not in the code.

## Solution: Fix in Vercel Dashboard

### Step 1: Go to Project Settings
1. Open: https://vercel.com/mike-callvus-projects/callvusalesenablementquiz2/settings/general
2. If that doesn't work, try:
   - Go to: https://vercel.com/dashboard
   - Click on "callvusalesenablementquiz2" project
   - Click "Settings" tab at the top
   - Click "General" in the left sidebar

### Step 2: Find Root Directory Setting
1. Scroll down in the General settings page
2. Look for a section called **"Root Directory"** or **"Project Root"**
3. You should see a field that says **"(root)"** or something similar

### Step 3: Fix the Root Directory
1. **Clear the field completely** (delete everything in it)
2. OR change it to: **"."** (just a period)
3. OR leave it **empty/blank**
4. Click **"Save"** button

### Step 4: Redeploy
1. Go to: https://vercel.com/mike-callvus-projects/callvusalesenablementquiz2/deployments
2. Click the **three dots (⋯)** on the latest deployment
3. Click **"Redeploy"**
4. Wait for it to finish
5. Test: https://callvusalesenablementquiz2.vercel.app/embed

## Alternative: If You Can't Find the Setting

### Option A: Delete and Recreate Project
1. Go to: https://vercel.com/mike-callvus-projects/callvusalesenablementquiz2/settings/general
2. Scroll to the very bottom
3. Click **"Delete Project"** (or similar)
4. Go to: https://vercel.com/new
5. Import from GitHub: https://github.com/yakdaddy2025-jpg/callvusalesenablementquiz2
6. Vercel will auto-detect Next.js
7. Click "Deploy"
8. Don't set any root directory - leave it empty

### Option B: Use Vercel CLI
If you have Node.js installed:
```bash
npm i -g vercel
vercel login
cd C:\Users\mikes\callvusalesenablementquiz2
vercel --prod
```

## What I Did
- Removed vercel.json file (Vercel will auto-detect Next.js)
- This should help, but you still need to fix the root directory setting in Vercel dashboard

## Most Important Step
**Find the "Root Directory" setting in Vercel General settings and clear it or set it to "."**

