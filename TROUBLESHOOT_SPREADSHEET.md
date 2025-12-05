# Troubleshooting Spreadsheet Not Updating

## Quick Checks

1. **Verify Webhook URL is Correct**
   - After redeploying Google Apps Script, you get a NEW webhook URL
   - Copy the new URL from: Deploy → Manage deployments → (your deployment) → Web app URL
   - Update `SHEET_WEBHOOK_URL` in `pages/embed.js` line 5
   - Push to GitHub → Vercel will auto-deploy

2. **Check Google Apps Script Execution Log**
   - Go to https://script.google.com
   - Open your script
   - Click "Executions" (left sidebar)
   - Look for recent executions
   - Check for errors (red entries)
   - Click on an execution to see logs

3. **Verify Spreadsheet Name**
   - Script looks for: "Callvu Sales Enablement Quiz - Responses v2"
   - Make sure the spreadsheet name matches EXACTLY (case-sensitive)

4. **Test the Script**
   - In Google Apps Script, click "Run" → `testSetup`
   - Check execution log - should show spreadsheet URL
   - If error, check what it says

5. **Test POST Request**
   - In Google Apps Script, click "Run" → `testPost`
   - Check execution log - should show "Successfully logged response"
   - Check spreadsheet - should see a test row

6. **Check Browser Console**
   - Open CallVu form
   - Press F12 → Console tab
   - Click "Keep Response"
   - Look for:
     - `📊 ===== LOGGING TO SPREADSHEET =====`
     - `✅ POST request sent to webhook`
     - Any error messages

## Common Issues

### Issue: "No webhook URL configured"
**Fix:** Update `SHEET_WEBHOOK_URL` in `pages/embed.js`

### Issue: "Spreadsheet not found"
**Fix:** 
- Verify spreadsheet name is exactly: "Callvu Sales Enablement Quiz - Responses v2"
- Or update `SPREADSHEET_ID` in Google Apps Script with the actual ID

### Issue: Script runs but no data appears
**Fix:**
- Check execution log for errors
- Verify script has permission to edit spreadsheet
- Make sure "Responses" sheet exists (script creates it automatically)

### Issue: CORS errors
**Fix:**
- Make sure deployment is set to "Who has access: Anyone"
- Redeploy the script

## Getting the New Webhook URL

1. Go to https://script.google.com
2. Open your script
3. Click "Deploy" → "Manage deployments"
4. Click the pencil icon (Edit) on your deployment
5. Copy the "Web app URL" - this is your new webhook URL
6. Update `pages/embed.js` line 5 with the new URL
7. Push to GitHub

