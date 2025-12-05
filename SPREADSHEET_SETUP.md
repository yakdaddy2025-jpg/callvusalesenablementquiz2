# Spreadsheet Setup & Troubleshooting

## Current Spreadsheet
- **URL:** https://docs.google.com/spreadsheets/d/1JcvaZhDq9Hfr8dOSfVdFcCnaxiTL4oK_l70E_TvXqJ0/edit
- **Name:** CallVu Quiz Responses
- **Sheet:** Responses

## Webhook URL
```
https://script.google.com/macros/s/AKfycbzGzk7Zcb9invzxdO5mEVtoNX7bgXu-yWXagtjJ6B30mSNtxkwTsM_nB9B3tY2AdwCz/exec
```

## To Fix Missing Responses

### Step 1: Update Google Apps Script
1. Go to https://script.google.com
2. Find your script (search for the webhook URL or "CallVu Quiz")
3. Open the script editor
4. Copy the entire contents of `google-apps-script.js` from this repo
5. Paste it into the script editor (replace all)
6. Click **Deploy** → **New deployment**
7. Select type: **Web app**
8. Execute as: **Me**
9. Who has access: **Anyone**
10. Click **Deploy**
11. Copy the new webhook URL (if it changed)

### Step 2: Verify Script is Working
1. In the script editor, click **Run** → **testSetup**
2. Check **Execution log** - should show spreadsheet URL
3. Or visit: `https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec` (GET request)
   - Should return: `{"status":"ok","message":"CallVu Quiz Logger is running","spreadsheet":"..."}`

### Step 3: Test Data Logging
1. Open CallVu form in browser
2. Press **F12** → **Console** tab
3. Fill out form and submit a response
4. Look for console messages:
   - `📊 Logging to spreadsheet:` - shows payload being sent
   - `✅ POST request sent to webhook` - confirms request was sent
   - Any error messages

### Step 4: Check Spreadsheet
1. Open the spreadsheet: https://docs.google.com/spreadsheets/d/1JcvaZhDq9Hfr8dOSfVdFcCnaxiTL4oK_l70E_TvXqJ0/edit
2. Check if new rows appear
3. If not, check the **Execution log** in Google Apps Script for errors

## Current Data Fields Being Sent
- submissionTimestamp
- recordingStartTime
- recordingEndTime
- repName
- repEmail
- questionId
- questionTitle
- transcript
- recordingDuration
- wordCount
- responseType

## Troubleshooting

### No data appearing in spreadsheet
- Check Google Apps Script execution log for errors
- Verify webhook URL is correct in `pages/embed.js`
- Check browser console for errors
- Ensure script is deployed as "Web app" (not just saved)

### Name/Email missing
- The code now tries to extract from CallVu form fields
- If still missing, check browser console for warnings
- Data will still be logged with "Unknown User" / "unknown@callvu.com" placeholders

### Script errors
- Check execution log in Google Apps Script
- Verify all column headers match in the script
- Ensure script has permission to create/edit spreadsheets

