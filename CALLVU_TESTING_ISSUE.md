# CallVu Form Testing Issue - URL Resets to form/1

## Problem
When testing the form flow in CallVu, the URL resets to `https://studio.callvu.net/callvu-viewer/form/1` even though you're running the form from `https://studio.callvu.net/callvu-studio/form/2000025`.

## Possible Causes

### 1. Form Not Published/Activated
- The form might be in draft mode
- You need to **publish** or **activate** the form before testing
- Check CallVu Studio → Your Form → Versioning/Publish settings

### 2. Using Preview vs Published Version
- The viewer URL (`/callvu-viewer/form/1`) might be pointing to a different form
- Make sure you're testing the **published** version, not a draft
- Check if form ID 2000025 is the active/published version

### 3. CallVu Studio Settings
- The form might need to be saved and published
- Check: **Form Settings** → **Versioning** → Make sure you're on the published version
- The viewer might be defaulting to form ID 1 if the form isn't properly published

## How to Fix

### Step 1: Check Form Status
1. Go to CallVu Studio: `https://studio.callvu.net/callvu-studio/form/2000025`
2. Check the form status (should be "Published" or "Active")
3. If it says "Draft", you need to publish it

### Step 2: Publish the Form
1. In CallVu Studio, look for a **"Publish"** or **"Activate"** button
2. Click it to publish the current version
3. Wait for confirmation that it's published

### Step 3: Test the Published Version
1. After publishing, use the **"Preview"** or **"Test"** button in CallVu Studio
2. This should open the viewer with the correct form ID
3. The URL should be something like: `https://studio.callvu.net/callvu-viewer/form/2000025` (not `/form/1`)

### Step 4: Check Form Settings
1. Go to **Form Settings** in CallVu Studio
2. Check **Versioning** tab
3. Make sure you're testing the **published** version, not a draft

## Alternative: Direct Viewer URL
If the form is published, try accessing it directly:
- `https://studio.callvu.net/callvu-viewer/form/2000025`

If this works, the issue is with how CallVu Studio is launching the preview.

## Note
This is likely a CallVu platform issue, not a CVUF file issue. The CVUF structure looks correct. The problem is that CallVu Studio might be:
- Testing a draft version instead of published
- Defaulting to form ID 1 when the form isn't properly published
- Having a caching issue

Try publishing the form first, then test again.

