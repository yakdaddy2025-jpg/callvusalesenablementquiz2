# 📖 Step-by-Step Guide - For Non-Technical Users

## How to Run the Auto-Deploy Script

### Step 1: Open PowerShell (Terminal)

**Option A: From File Explorer (Easiest)**
1. Open File Explorer (the folder icon on your taskbar)
2. Navigate to: `C:\Users\mikes\callvusalesenablementquiz2`
3. Click in the address bar at the top
4. Type: `powershell` and press Enter
5. A black window will open - this is PowerShell!

**Option B: From Start Menu**
1. Click the Windows Start button (bottom left)
2. Type: `PowerShell`
3. Click on "Windows PowerShell" or "PowerShell"
4. A black window will open

### Step 2: Navigate to Your Project Folder

In the PowerShell window that just opened, type this and press Enter:

```powershell
cd C:\Users\mikes\callvusalesenablementquiz2
```

You should see the path change in PowerShell.

### Step 3: Run the Auto-Deploy Script

Type this and press Enter:

```powershell
.\auto-deploy.ps1
```

### Step 4: What You'll See

The script will show you colored messages:
- **Yellow** = Working on something
- **Green** = Success ✅
- **Red** = Something needs your attention ❌

### Step 5: If It Says "Repository Not Found"

The script will tell you exactly what to do. It will say:

```
📋 MANUAL STEP REQUIRED:
   1. Go to: https://github.com/new
   2. Repository name: callvusalesenablementquiz2
   3. Choose Public or Private
   4. DO NOT initialize with README
   5. Click 'Create repository'
```

Just follow those steps, then run the script again!

### Step 6: If It Asks for Authentication

If you see an error about authentication:
1. The script will give you options
2. Follow the instructions it shows
3. Or just run: `git push -u origin main` and enter your GitHub username and password when asked

---

## Visual Guide

```
┌─────────────────────────────────────────┐
│  PowerShell Window                       │
│  ─────────────────────────────────────  │
│  PS C:\Users\mikes\partnerships-careers> │
│  .\auto-deploy.ps1                      │
│                                         │
│  [1/5] Verifying project files...      │
│  ✅ All required files present          │
│                                         │
│  [2/5] Checking git status...          │
│  ✅ Files already staged/committed      │
│                                         │
│  [3/5] Checking GitHub repository...    │
│  ...                                    │
└─────────────────────────────────────────┘
```

---

## Troubleshooting

**"Script cannot be loaded" error?**
- Type this first: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`
- Press Y when asked
- Then run the script again

**"Cannot find path" error?**
- Make sure you're in the right folder
- Type: `cd C:\Users\mikes\partnerships-careers`
- Then run the script again

**Still stuck?**
- Take a screenshot of the error
- The script will tell you exactly what to do next!

