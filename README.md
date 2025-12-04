# CallVu Sales Enablement Quiz

Voice recorder web app for the CallVu Sales Enablement Quiz.

## Quick Setup Guide

### Step 1: Deploy to Vercel

This project is already set up for Vercel deployment. Once you push to GitHub, Vercel will auto-deploy.

**Your Vercel URL:** `https://callvusalesenablementquiz2.vercel.app`

### Step 2: Set Up Google Sheets Logging

1. Go to [https://script.google.com](https://script.google.com)
2. Click **"New Project"**
3. Delete the default code
4. Copy and paste the contents of `google-apps-script.js` from this repo
5. Click **"Deploy"** → **"New deployment"**
6. Click the gear icon ⚙️, select **"Web app"**
7. Set:
   - **Execute as:** Me
   - **Who has access:** Anyone
8. Click **"Deploy"**
9. Click **"Authorize access"** and follow the prompts
10. **COPY THE WEB APP URL** (looks like: `https://script.google.com/macros/s/ABC123.../exec`)

### Step 3: Update Voice Recorder with Webhook URL

1. Edit `pages/index.js` line 6
2. Replace `PASTE_YOUR_GOOGLE_SCRIPT_URL_HERE` with your Google Apps Script URL from Step 2
3. Commit and push to GitHub
4. Vercel will auto-redeploy

### Step 4: Import Quiz to CallVu

1. Use the `Sales_Enablement_Quiz.cvuf` file (already updated with your Vercel URL)
2. Log into CallVu admin
3. Go to **Forms** → **Import**
4. Select the `Sales_Enablement_Quiz.cvuf` file
5. Done! The quiz is ready to use.

## Project Structure

```
├── pages/
│   ├── _app.js          # Next.js app wrapper
│   └── index.js         # Voice recorder main page
├── styles/
│   └── globals.css      # Tailwind CSS styles
├── package.json         # Dependencies
├── next.config.js       # Next.js config
├── tailwind.config.js   # Tailwind config
├── postcss.config.js    # PostCSS config
├── google-apps-script.js # Google Sheets logger script
├── Sales_Enablement_Quiz.cvuf # CallVu quiz file
└── README.md            # This file
```

## Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## How It Works

1. User opens quiz in CallVu
2. Clicks voice recorder link on a question
3. Voice recorder opens in new tab (hosted on Vercel)
4. User records their response using browser speech recognition
5. Response is transcribed and submitted
6. Data is sent to Google Sheets via Google Apps Script webhook
7. Manager reviews responses in the Google Sheet

## Testing

1. Open the CallVu quiz
2. Navigate to any question with a voice recorder link
3. Click the 🎤 link to open the voice recorder
4. Record a response and submit
5. Check your Google Sheet - a new row should appear

## Troubleshooting

**Voice recorder not working?**
- Use Chrome, Edge, or Safari (speech recognition requires these browsers)
- Allow microphone permissions when prompted
- Check browser console for errors

**Responses not logging to sheet?**
- Verify the webhook URL in `pages/index.js` is correct
- Check Google Apps Script execution logs
- Responses also save to browser localStorage as backup

**Quiz not importing?**
- Ensure CVUF file isn't corrupted
- Try importing without URL changes first

## Support

For issues or questions, check the setup instructions or contact your team lead.

