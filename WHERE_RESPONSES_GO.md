# Where Quiz Responses Go

## 📍 Two Places Responses Are Stored

### 1. **CallVu Form Fields** (Automatic - Always Works)

**Location:** Stored directly in CallVu's system

**What gets saved:**
- All voice transcriptions (speech-to-text responses)
- All multiple choice answers
- All Mode A/B selections
- Name and email (from first screen)

**How to access:**
1. Go to your **CallVu Admin Panel**
2. Navigate to your quiz form
3. Click on **"Responses"** or **"Submissions"** tab
4. You'll see all completed quizzes with:
   - Rep name and email
   - All their responses to each question
   - Timestamp of completion
   - You can export to CSV/Excel

**This works automatically** - no setup needed! ✅

---

### 2. **Google Sheets** (Optional - Needs Setup)

**Location:** Google Drive → Spreadsheet named "CallVu Quiz Responses"

**What gets saved:**
- Timestamp
- Rep Name
- Rep Email
- Question ID
- Question Title
- Response Transcript (voice responses)
- Recording Duration (in seconds)
- Columns for: Success Criteria, Score (1-10), Manager Notes

**How to set it up:**

#### Step 1: Deploy Google Apps Script

1. Go to https://script.google.com
2. Click **"New Project"**
3. Copy and paste the entire contents of `google-apps-script.js`
4. Click **"Deploy"** → **"New deployment"**
5. Click the gear icon ⚙️ next to "Select type" → Choose **"Web app"**
6. Configure:
   - **Description:** "CallVu Quiz Logger"
   - **Execute as:** Me
   - **Who has access:** Anyone
7. Click **"Deploy"**
8. **Copy the Web app URL** (looks like: `https://script.google.com/macros/s/.../exec`)

#### Step 2: Update Voice Recorder with Webhook URL

1. In your GitHub repo, edit `pages/embed.js`
2. Find line 5:
   ```javascript
   const SHEET_WEBHOOK_URL = 'PASTE_YOUR_GOOGLE_SCRIPT_URL_HERE';
   ```
3. Replace with your Google Apps Script URL:
   ```javascript
   const SHEET_WEBHOOK_URL = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';
   ```
4. Commit and push (Vercel will auto-deploy)

#### Step 3: Access Your Spreadsheet

1. Go to https://drive.google.com
2. Look for a spreadsheet named **"CallVu Quiz Responses"**
   - It will be created automatically on first response
3. Open it to see all responses
4. You can:
   - Filter by rep name/email
   - Sort by question
   - Add scores and manager notes
   - Export to Excel/CSV
   - Share with your CEO

**Note:** Responses only log to Google Sheets when users click **"Keep Response"** on voice questions.

---

## 📊 What Data Gets Captured

### For Voice Responses (Speech-to-Text):
- ✅ Full transcript of what they said
- ✅ Recording duration
- ✅ Question they answered
- ✅ Timestamp
- ✅ Rep name and email

### For Multiple Choice Questions:
- ✅ Selected answer (A, B, C, or D)
- ✅ Question ID
- ✅ Timestamp
- ✅ Rep name and email

### For Mode A/B Selections:
- ✅ Selected option (Mode A, Mode B, or Hybrid)
- ✅ Question ID
- ✅ Timestamp
- ✅ Rep name and email

---

## 🔍 How to Review Responses

### Option 1: CallVu Admin (Recommended)
- **Best for:** Quick review, exporting all data
- **Access:** CallVu Admin → Your Quiz → Responses
- **Features:**
  - View all submissions
  - Filter by date/rep
  - Export to CSV/Excel
  - See complete quiz responses in one place

### Option 2: Google Sheets
- **Best for:** Detailed scoring, manager notes, sharing with CEO
- **Access:** Google Drive → "CallVu Quiz Responses"
- **Features:**
  - Add scores (1-10) for each response
  - Add manager notes
  - Filter and sort easily
  - Share with team/CEO
  - Create charts and reports

---

## ⚠️ Important Notes

1. **CallVu storage is automatic** - All responses are saved in CallVu even if Google Sheets isn't set up

2. **Google Sheets is optional** - Only voice responses are logged to Google Sheets (when "Keep Response" is clicked)

3. **Multiple choice questions** are only stored in CallVu (not logged to Google Sheets)

4. **Name/Email collection** - Collected once at the beginning and used for all responses

5. **Real-time updates** - Responses appear in CallVu immediately. Google Sheets updates when "Keep Response" is clicked.

---

## 🚀 Quick Setup Checklist

- [ ] Import CVUF to CallVu ✅ (You have the file)
- [ ] Test quiz in CallVu
- [ ] Set up Google Apps Script (optional)
- [ ] Update webhook URL in `pages/embed.js` (optional)
- [ ] Share Google Sheet with CEO (optional)

---

## 📞 Need Help?

If responses aren't showing up:
1. **Check CallVu Admin** - Responses should always be there
2. **Check browser console** - Look for errors when "Keep Response" is clicked
3. **Verify Google Apps Script** - Make sure it's deployed as a Web app
4. **Check webhook URL** - Make sure it's correct in `pages/embed.js`

