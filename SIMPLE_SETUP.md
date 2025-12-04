# Simple Setup - No Vercel Needed! ✅

## What I've Done For You

✅ **Created CVUF file** with inline voice recorder (no Vercel!)
✅ **Updated Google Apps Script** to write to YOUR spreadsheet
✅ **Everything embedded** - works directly in CallVu

## 2 Steps to Complete

### Step 1: Set Up Google Apps Script (5 minutes)

1. Go to https://script.google.com
2. Click **"New Project"**
3. Copy and paste the ENTIRE contents of `google-apps-script-updated.js`
4. Click **"Deploy"** → **"New deployment"**
5. Click the gear icon ⚙️ → Select **"Web app"**
6. Set:
   - **Execute as:** Me
   - **Who has access:** Anyone
7. Click **"Deploy"**
8. **COPY THE WEB APP URL** (looks like: `https://script.google.com/macros/s/.../exec`)

### Step 2: Update CVUF with Webhook URL

1. Open `Sales_Enablement_Quiz_FINAL.cvuf` in a text editor
2. Press `Ctrl+H` (Find & Replace)
3. Find: `PASTE_YOUR_GOOGLE_SCRIPT_URL_HERE`
4. Replace with: Your Google Apps Script URL (from Step 1)
5. Click "Replace All"
6. Save the file

**That's it!** Now import the CVUF to CallVu.

---

## Your Google Sheet

All responses will automatically go to:
**https://docs.google.com/spreadsheets/d/1JcvaZhDq9Hfr8dOSfVdFcCnaxiTL4oK_l70E_TvXqJ0/edit**

The script will:
- Create a "Responses" sheet if it doesn't exist
- Add headers automatically
- Log every voice response
- Include: Timestamp, Name, Email, Question, Transcript, Duration

---

## How It Works

- **No Vercel needed** - Voice recorder is embedded directly in the CVUF
- **Uses browser's built-in speech recognition** (Chrome/Edge/Safari)
- **All responses go to your Google Sheet** automatically
- **Works offline** (once CVUF is imported to CallVu)

---

## Testing

1. Import `Sales_Enablement_Quiz_FINAL.cvuf` to CallVu
2. Fill in name/email
3. Go to a question with voice recorder
4. Click record and speak
5. Click "Keep Response"
6. Check your Google Sheet - response should appear!

---

## Troubleshooting

**Voice recorder not working?**
- Make sure you're using Chrome, Edge, or Safari
- Allow microphone permissions when prompted

**Responses not appearing in Google Sheet?**
- Check that Google Apps Script is deployed as Web app
- Verify the webhook URL is correct in the CVUF
- Check Google Apps Script execution logs

**Need help?** Check the execution logs in Google Apps Script editor.

