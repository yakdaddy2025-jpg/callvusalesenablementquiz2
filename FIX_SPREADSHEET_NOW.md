# CRITICAL: Fix Spreadsheet Not Updating

## The Problem
Nothing is showing up in the spreadsheet even though you're clicking "Keep Response".

## Most Likely Cause
**The webhook URL in the code is pointing to the OLD script deployment.**

When you redeploy Google Apps Script, you get a NEW webhook URL. The code is still using the old one.

## Fix Steps (Do These Now):

### Step 1: Get Your NEW Webhook URL
1. Go to https://script.google.com
2. Open your script
3. Click **"Deploy"** → **"Manage deployments"**
4. Click the **pencil icon (Edit)** on your deployment
5. **Copy the "Web app URL"** - it looks like:
   ```
   https://script.google.com/macros/s/YOUR_NEW_ID_HERE/exec
   ```

### Step 2: Update the Code
1. Open: `C:\Users\mikes\callvusalesenablementquiz2\pages\embed.js`
2. Find **line 5**: 
   ```javascript
   const SHEET_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbzGzk7Zcb9invzxdO5mEVtoNX7bgXu-yWXagtjJ6B30mSNtxkwTsM_nB9B3tY2AdwCz/exec';
   ```
3. **Replace the entire URL** with your NEW webhook URL from Step 1
4. Save the file

### Step 3: Push to GitHub
```bash
cd C:\Users\mikes\callvusalesenablementquiz2
git add pages/embed.js
git commit -m "Update webhook URL to new deployment"
git push origin main
```

### Step 4: Verify Script is Updated
1. In Google Apps Script, make sure you pasted the code from `google-apps-script-FIXED.js`
2. The script should have:
   - `SPREADSHEET_NAME = 'Callvu Sales Enablement Quiz - Responses v2'`
   - `SPREADSHEET_ID = ''` (empty)

### Step 5: Test the Script
1. In Google Apps Script, click **"Run"** → **`testSetup`**
2. Check **"Executions"** log - should show spreadsheet URL
3. If error, check what it says

### Step 6: Test POST Request
1. In Google Apps Script, click **"Run"** → **`testPost`**
2. Check **"Executions"** log - should show "Successfully logged response"
3. **Check your spreadsheet** - should see a test row with headers

### Step 7: Check Browser Console
1. Open CallVu form
2. Press **F12** → **Console** tab
3. Click **"Keep Response"** on any step
4. Look for:
   - `📊 ===== LOGGING TO SPREADSHEET =====`
   - `📊 Webhook URL: ...` (should be your NEW URL)
   - `✅ POST request sent to webhook`
   - Any error messages

## If Still Not Working:

### Check Google Apps Script Execution Log
1. Go to https://script.google.com
2. Click **"Executions"** (left sidebar)
3. Look for recent executions when you clicked "Keep Response"
4. Click on the execution
5. Check the logs:
   - Should see "Received data: ..."
   - Should see "Successfully logged response to row: X"
   - If you see "Spreadsheet not found" → check spreadsheet name
   - If you see other errors → note them

### Verify Spreadsheet Name
- Must be exactly: **"Callvu Sales Enablement Quiz - Responses v2"** (case-sensitive)
- Or get the spreadsheet ID from the edit URL and update `SPREADSHEET_ID` in the script

### Check Spreadsheet Permissions
- Make sure the Google account running the script has edit access to the spreadsheet
- The script runs as "Me" - make sure "Me" can edit the spreadsheet

## Quick Test
After updating the webhook URL, test immediately:
1. Wait 1-2 minutes for Vercel to deploy
2. Hard refresh CallVu form (Ctrl+F5)
3. Record a response → Click "Keep Response"
4. Check browser console for logging messages
5. Check Google Apps Script execution log
6. Check spreadsheet

