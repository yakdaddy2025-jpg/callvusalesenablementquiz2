# CallVu Sales Enablement Quiz - Complete Setup Guide

## Overview

This quiz includes embedded voice recorders on each question screen that:
- Capture voice responses and transcribe them live
- Log responses to both CallVu form fields and Google Sheets
- Only accept voice input (no typing allowed)
- Enable/disable Next button based on response completion
- Allow users to keep or delete responses to retry

## What's Been Set Up

✅ **Embedded Voice Recorder** (`pages/embed.js`)
- Voice-only input with live transcription
- Keep/Delete functionality
- Integration with CallVu via postMessage API
- Google Sheets logging support

✅ **CVUF File Updated** (`Sales_Enablement_Quiz.cvuf`)
- Added "Sales Enablement Quiz - Mode A and B" heading to each question screen
- Embedded voice recorder iframes on each question
- Read-only answer fields (voice-only input)
- CallVu logo at top (configured in form settings)

✅ **Integration Script** (`public/callvu-integration.js`)
- Handles communication between voice recorder and CallVu
- Updates CallVu form fields with transcripts
- Enables/disables Next button based on response status

## Setup Steps

### 1. Deploy Voice Recorder to Vercel

The code is already in your GitHub repo. Vercel should auto-deploy, but if not:

1. Go to https://vercel.com
2. Import your GitHub repo: `yakdaddy2025-jpg/callvusalesenablementquiz2`
3. Deploy

Your voice recorder will be available at:
- Main page: `https://callvusalesenablementquiz2.vercel.app`
- Embed page: `https://callvusalesenablementquiz2.vercel.app/embed`

### 2. Set Up Google Apps Script (For Spreadsheet Logging)

1. Go to https://script.google.com
2. Click **New Project**
3. Paste the contents of `google-apps-script.js`
4. Click **Deploy** → **New deployment**
5. Select **Web app**
6. Set:
   - **Execute as:** Me
   - **Who has access:** Anyone
7. Click **Deploy**
8. Copy the webhook URL

### 3. Update Voice Recorder with Webhook URL

1. In your GitHub repo, edit `pages/embed.js`
2. Find line 5: `const SHEET_WEBHOOK_URL = 'PASTE_YOUR_GOOGLE_SCRIPT_URL_HERE';`
3. Replace with your Google Apps Script webhook URL
4. Commit and push (Vercel will auto-deploy)

### 4. Import Quiz to CallVu

1. Go to your CallVu admin panel
2. Import the `Sales_Enablement_Quiz.cvuf` file
3. The quiz is now ready with:
   - Voice recorders embedded on each question screen
   - "Sales Enablement Quiz - Mode A and B" heading on each screen
   - CallVu logo at the top
   - Read-only answer fields (voice-only input)

### 5. Test the Integration

1. Open the quiz in CallVu
2. Fill in name and email on the first screen
3. Navigate to a question screen
4. You should see:
   - The heading "Sales Enablement Quiz - Mode A and B"
   - CallVu logo at the top
   - An embedded voice recorder
   - A read-only answer field below
5. Click the record button and speak
6. Click "Keep Response" when done
7. The Next button should become enabled
8. Check Google Sheets to verify logging

## How It Works

### Voice Recorder Flow

1. **User starts recording**: Clicks record button, speaks their answer
2. **Live transcription**: Text appears in real-time as they speak
3. **User stops recording**: Clicks stop button
4. **User reviews**: Sees their transcribed response
5. **User decides**: 
   - **Keep Response**: Saves transcript to CallVu field, logs to spreadsheet, enables Next button
   - **Delete & Try Again**: Clears transcript, allows re-recording

### CallVu Integration

- The voice recorder sends messages to the CallVu parent window via `postMessage`
- The integration script (`callvu-integration.js`) listens for these messages
- When a response is kept, it:
  - Updates the corresponding CallVu form field with the transcript
  - Enables the Next button
  - Logs to Google Sheets (if webhook is configured)

### Field Mapping

The integration script maps question IDs to CallVu field integration IDs:
- `Q1_Banking` → `Answer_Q1_Banking`
- `Q2_Insurance` → `Answer_Q2_Insurance`
- etc.

## Customization

### Editing Question Content

All question content is editable in CallVu's UI:
- Scenario text
- Success criteria
- Question prompts
- All paragraph blocks

### Changing the Heading

To change the heading on each screen:
1. In CallVu admin, edit the quiz
2. Find the heading paragraph field (starts with `Heading_`)
3. Edit the text

### Styling

The voice recorder uses Tailwind CSS. To customize:
1. Edit `pages/embed.js`
2. Modify the className attributes
3. Redeploy to Vercel

## Troubleshooting

### Voice Recorder Not Appearing

- Check that the iframe URL is correct: `https://callvusalesenablementquiz2.vercel.app/embed`
- Verify Vercel deployment is live
- Check browser console for errors

### Transcript Not Updating CallVu Field

- Verify the integration script is loaded (check browser console)
- Check that field integration IDs match the mapping in `callvu-integration.js`
- Ensure postMessage is working (check browser console for messages)

### Next Button Not Enabling

- Verify the voice recorder is sending `VOICE_RESPONSE_READY` messages
- Check that the integration script is finding the Next button
- Look for JavaScript errors in browser console

### Google Sheets Not Logging

- Verify the webhook URL is set in `pages/embed.js`
- Check that Google Apps Script is deployed as a web app
- Ensure "Who has access" is set to "Anyone"
- Check Google Apps Script execution logs

## Browser Support

Voice recording requires:
- Chrome (recommended)
- Edge
- Safari (limited support)

Firefox does not support Web Speech API.

## Security Notes

- The voice recorder iframe uses `sandbox="allow-scripts allow-same-origin allow-forms"` for security
- postMessage communication validates origin
- Microphone access requires user permission

## Next Steps

1. ✅ Deploy to Vercel (if not already done)
2. ✅ Set up Google Apps Script
3. ✅ Update webhook URL in `pages/embed.js`
4. ✅ Import CVUF to CallVu
5. ✅ Test the complete flow
6. ✅ Share with your team!

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify all URLs are correct
3. Test voice recorder in isolation: `https://callvusalesenablementquiz2.vercel.app/embed?question=Q1_Banking&title=Test`
4. Check Google Apps Script execution logs

