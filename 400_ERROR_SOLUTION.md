# 400 Bad Request Error - Solution Guide

## Problem
CallVu's backend is returning **400 Bad Request** errors when trying to activate/preview the form. The console shows:
- `[ERROR] Session error: statusCode = NETWORK_ERROR | message = Request failed with status code 400`
- `[ERROR] activateSubmit error: FXError: Request failed with status code 400`

## Root Cause
The CVUF file contains **embedded JavaScript** (`<script>` tags) in paragraph fields for the voice recorder. CallVu's backend validation is likely **rejecting these script tags** for security reasons.

## Solutions (In Order of Preference)

### Solution 1: Use Iframe Approach (RECOMMENDED)
Instead of embedding JavaScript directly, host the voice recorder on Vercel and embed it via iframe.

**Steps:**
1. Ensure the Vercel deployment is working: `https://callvusalesenablementquiz2.vercel.app/embed`
2. Update the CVUF to use iframes pointing to the Vercel URL
3. The iframe approach avoids JavaScript in the CVUF itself

**Note:** We tried this before but got a 404 error. We need to fix the Vercel deployment first.

### Solution 2: Contact CallVu Support
Since this is a platform limitation, CallVu support can:
- Confirm if JavaScript in paragraph fields is allowed
- Provide guidance on how to embed custom functionality
- Suggest alternative approaches

**What to tell them:**
- You're trying to embed a voice recorder with JavaScript in paragraph fields
- Getting 400 Bad Request errors when activating the form
- Ask if there's a supported way to add custom JavaScript functionality

### Solution 3: Simplify Voice Recorder
Create a minimal version without complex JavaScript:
- Use only HTML/CSS (no script tags)
- Use external script loading instead of inline scripts
- Use CallVu's built-in form fields where possible

### Solution 4: Test Without Voice Recorder
Temporarily remove all voice recorder fields to confirm the form loads:
1. If form loads without voice recorders → JavaScript is the issue
2. If form still doesn't load → Different issue (form structure, field configs, etc.)

## Immediate Action Items

1. **Check Vercel Deployment:**
   - Visit: `https://callvusalesenablementquiz2.vercel.app/embed`
   - If it loads, we can switch to iframe approach
   - If 404, we need to fix the Vercel deployment

2. **Test Simplified Form:**
   - Create a test CVUF with just one step and no JavaScript
   - Import to CallVu and test if it loads
   - This confirms if JavaScript is the issue

3. **Contact CallVu Support:**
   - Share the 400 error details
   - Ask about JavaScript in paragraph fields
   - Request guidance on embedding custom functionality

## Current Status
- ✅ CVUF structure is valid (JSON, field configs, step structure)
- ✅ No null/undefined values causing issues
- ✅ HTML structure is valid (no unclosed tags)
- ❌ **400 errors suggest CallVu backend is rejecting embedded JavaScript**

## Next Steps
1. Check if Vercel `/embed` page is working
2. If yes, switch to iframe approach
3. If no, contact CallVu support for guidance
4. Consider alternative voice recording solutions that don't require embedded JavaScript

