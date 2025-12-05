# CallVu Preview Not Working - Troubleshooting Guide

## Issue
Preview doesn't work at the provided URL. The CVUF structure is valid, so the issue is likely:

1. **JavaScript in paragraph fields** - CallVu might strip `<script>` tags
2. **JavaScript errors** - Errors preventing form from loading
3. **CallVu platform issue** - Form not properly saved/published

## Immediate Steps

### Step 1: Check Browser Console (MOST IMPORTANT)
1. Open the preview URL in your browser
2. Press **F12** to open Developer Tools
3. Click the **Console** tab
4. Look for **red error messages**
5. **Share the error messages** - this will tell us exactly what's wrong

### Step 2: Check Network Tab
1. In Developer Tools, click **Network** tab
2. Refresh the page
3. Look for failed requests (red entries)
4. Check if the CVUF file is loading

### Step 3: Re-import CVUF
1. In CallVu Studio, go to your form
2. Delete the current form (or create a new one)
3. Import `Sales_Enablement_Quiz_EDITABLE.cvuf` again
4. **Save** the form
5. Try preview again

## Most Likely Cause

The voice recorder uses embedded `<script>` tags in paragraph fields. CallVu might:
- Strip script tags for security
- Block JavaScript execution
- Cause errors that prevent form rendering

## Quick Test

To test if JavaScript is the issue:
1. Temporarily remove one voice recorder field
2. Test if the form loads
3. If it works, the issue is with JavaScript in paragraph fields

## What to Share

If preview still doesn't work, share:
1. **Browser console errors** (F12 → Console tab)
2. **What you see** on the preview page (blank? error message?)
3. **Network tab errors** (F12 → Network tab)

This will help identify the exact issue.

