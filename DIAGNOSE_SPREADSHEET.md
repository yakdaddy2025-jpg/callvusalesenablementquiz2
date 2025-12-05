# Diagnose Why Spreadsheet Isn't Updating

## Step 1: Check Browser Console
1. Open CallVu form
2. Press F12 → Console tab
3. Click "Keep Response" on any step
4. Look for these messages:
   - `📊 ===== LOGGING TO SPREADSHEET =====`
   - `📊 Webhook URL: ...`
   - `✅ POST request sent to webhook`
   - Any error messages (❌)

## Step 2: Check Google Apps Script Execution Log
1. Go to https://script.google.com
2. Open your script
3. Click "Executions" (left sidebar)
4. Look for recent executions
5. Click on the most recent one
6. Check the logs:
   - Should see "Received data: ..."
   - Should see "Successfully logged response to row: X"
   - If you see errors, note them

## Step 3: Verify Webhook URL
The webhook URL in `pages/embed.js` line 5 is:
```
https://script.google.com/macros/s/AKfycbzGzk7Zcb9invzxdO5mEVtoNX7bgXu-yWXagtjJ6B30mSNtxkwTsM_nB9B3tY2AdwCz/exec
```

**Is this the correct URL from your deployment?**
- Go to Google Apps Script
- Deploy → Manage deployments
- Copy the "Web app URL"
- Compare with the URL in embed.js

## Step 4: Test the Script Directly
1. In Google Apps Script, click "Run" → `testSetup`
2. Check execution log - should show spreadsheet URL
3. Run `testPost` - should add a test row
4. Check spreadsheet - should see test data

## Step 5: Verify Spreadsheet Name
The script looks for: **"Callvu Sales Enablement Quiz - Responses v2"**
- Make sure your spreadsheet name matches EXACTLY (case-sensitive)
- Or update `SPREADSHEET_ID` in the script with the actual ID

## Step 6: Check Spreadsheet Permissions
- Make sure the Google Apps Script has permission to edit the spreadsheet
- The script runs as "Me" - make sure "Me" has edit access to the spreadsheet

## Common Issues:

### Issue: "Spreadsheet not found"
**Fix:** 
- Verify spreadsheet name is exactly: "Callvu Sales Enablement Quiz - Responses v2"
- Or get the spreadsheet ID from the edit URL and update `SPREADSHEET_ID`

### Issue: Script runs but no data
**Fix:**
- Check execution log for errors
- Make sure "Responses" sheet exists (script creates it)
- Verify script has edit permissions

### Issue: No executions in log
**Fix:**
- Webhook URL is wrong - update it
- Check browser console for errors
- Verify deployment is active

