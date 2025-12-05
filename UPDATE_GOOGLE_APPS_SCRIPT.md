# CRITICAL: Update Your Google Apps Script

## The Problem
Your spreadsheet shows:
- ❌ Missing "Unique Response ID" and "Answer Field ID" columns
- ❌ No data being logged at all

This means your Google Apps Script is **NOT the latest version**.

## Steps to Fix

### 1. Open Google Apps Script
- Go to: https://script.google.com
- Find your project (or create a new one)

### 2. Copy the Latest Code
- Open the file: `google-apps-script.js` from this folder
- Copy **ALL** the code

### 3. Paste into Google Apps Script
- Delete all existing code in the editor
- Paste the new code
- Click **Save** (Ctrl+S or Cmd+S)

### 4. Deploy as Web App
- Click **Deploy** → **New deployment**
- Click the gear icon ⚙️ next to "Select type"
- Choose **Web app**
- Settings:
  - **Execute as:** Me
  - **Who has access:** Anyone
- Click **Deploy**
- **Copy the Web app URL** (you'll need this)

### 5. Update the Webhook URL
- The webhook URL in `pages/embed.js` should be:
  ```
  https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
  ```
- If you got a new URL, update line 5 in `pages/embed.js`

### 6. Test
- Go back to your CallVu form
- Record a response
- Check the spreadsheet - you should see:
  - ✅ "Unique Response ID" and "Answer Field ID" columns
  - ✅ Data rows appearing

## Check Execution Logs
If data still doesn't appear:
1. In Google Apps Script, go to **Executions** (left sidebar)
2. Click on the latest execution
3. Check the logs for errors
4. Look for messages like:
   - "POST REQUEST RECEIVED"
   - "Data parsed successfully"
   - "Appending row with:"
   - Any error messages

## Verify Spreadsheet Name
Make sure your spreadsheet is named exactly:
**"Callvu Sales Enablement Quiz - Responses v2"**
(Case-sensitive, exact match)

## If Still Not Working
1. Check the browser console for errors
2. Check Google Apps Script execution logs
3. Verify the webhook URL is correct
4. Make sure "Who has access" is set to "Anyone"

