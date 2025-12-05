# Troubleshooting CallVu Preview Not Working

## Issue
Preview doesn't work at: `https://studio.callvu.net/callvu-viewer/?UrlSlug=276AFAC9-04F3-4F06-9C39-7D5F50B4086B&IsGate=true&TID=a0c0f492-376d-4282-aa0c-bf8d45dfd78d&ts=1764893551456`

## CVUF Structure Status
✅ **CVUF file structure is valid:**
- First step has `isFirstStep: true`
- First step has `isFirstNode: true`
- All step identifiers are unique
- JSON is valid
- All required fields are present

## Possible Causes

### 1. JavaScript in Paragraph Fields
The voice recorder uses embedded `<script>` tags in paragraph fields. CallVu might:
- Strip script tags, causing the form to fail
- Block JavaScript execution for security
- Cause JavaScript errors that prevent form rendering

### 2. Form Not Properly Saved/Published
- The form might need to be saved again in CallVu Studio
- Try re-importing the CVUF file
- Make sure you click "Save" after importing

### 3. Browser Console Errors
Check the browser console (F12) for JavaScript errors:
- Open the preview URL
- Press F12 to open DevTools
- Check the Console tab for errors
- Look for errors related to:
  - Script tag execution
  - Voice recorder initialization
  - CallVu form rendering

### 4. CallVu Platform Issue
- The form might need to be published/activated
- There might be a CallVu platform bug
- Try creating a new form and importing the CVUF

## Solutions to Try

### Solution 1: Check Browser Console
1. Open the preview URL
2. Press F12 (DevTools)
3. Check Console tab for errors
4. Share any error messages you see

### Solution 2: Re-import CVUF
1. In CallVu Studio, delete the current form (or create a new one)
2. Import the CVUF file again: `Sales_Enablement_Quiz_EDITABLE.cvuf`
3. Save the form
4. Try preview again

### Solution 3: Test Without Voice Recorder
If the voice recorder JavaScript is causing issues:
1. Temporarily remove voice recorder fields
2. Test if the form loads
3. If it works, the issue is with JavaScript in paragraph fields

### Solution 4: Contact CallVu Support
If none of the above works, this might be a CallVu platform issue. Contact CallVu support with:
- The preview URL that's not working
- Screenshot of browser console errors (if any)
- The CVUF file

## Next Steps
1. **Check browser console** for errors (most important)
2. **Re-import the CVUF file** in CallVu Studio
3. **Try preview again**
4. If still not working, share the console errors so we can fix them

