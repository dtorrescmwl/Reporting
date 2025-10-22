# CLASP CLI Setup Guide
## Complete Guide for Local Development → Apps Script Deployment

This guide will get you set up to edit Apps Script files locally and push changes directly to Google Apps Script using the command line.

---

## 🛠️ Initial Setup (One-time)

### Step 1: Install Node.js and CLASP
```bash
# Install Node.js (if not already installed)
# Download from https://nodejs.org or use your package manager

# Install CLASP globally
npm install -g @google/clasp

# Verify installation
clasp --version
```

### Step 2: Login to Google Apps Script
```bash
# This opens a browser window for Google authentication
clasp login

# You'll need to:
# 1. Sign in with your Google account (cmwlvirtual.com)
# 2. Allow CLASP to access your Google Apps Script projects
# 3. Copy the authorization code back to terminal
```

### Step 3: Enable Apps Script API
1. Go to https://script.google.com/home/usersettings
2. Turn ON "Google Apps Script API"

---

## 📁 Project Structure Overview

Your project now has **2 types of clasp-enabled directories**:

### Type 1: Single Script Projects (AppScripts)
```
AppScripts/CarePortals/StripeTracking_clasp/
├── .clasp.json                    # Project configuration
├── src/
│   └── Code.gs                    # Your Apps Script code
```

### Type 2: Dashboard Projects (DashboardVisualization)
```
DashboardVisualization/Analytics/
├── .clasp.json                    # Project configuration
├── Code.gs                        # Apps Script backend code
└── dashboard.html                 # Frontend HTML/CSS/JS
```

---

## 🔄 Daily Workflow: Edit → Push → Deploy

### For Dashboard Projects (Analytics, InitialKPI, RevenueAnalytics)

1. **Navigate to project:**
```bash
cd DashboardVisualization/Analytics
```

2. **Edit files locally:**
```bash
# Edit the backend logic
nano Code.gs
# OR
code Code.gs

# Edit the frontend interface
nano dashboard.html
# OR
code dashboard.html
```

3. **Push changes to Apps Script:**
```bash
clasp push
```

4. **Your changes are now LIVE!** 🎉
   - Web app automatically updates
   - No need to manually copy/paste code

### For Single Script Projects (StripeTracking)

1. **Navigate to project:**
```bash
cd AppScripts/CarePortals/StripeTracking_clasp
```

2. **Edit the script:**
```bash
nano src/Code.gs
# OR
code src/Code.gs
```

3. **Push changes:**
```bash
clasp push
```

---

## 📋 All Available Projects

### Ready for CLI Development:

| Project | Directory | Type |
|---------|-----------|------|
| **StripeTracking** | `AppScripts/CarePortals/StripeTracking_clasp/` | Single Script |
| **Analytics Dashboard** | `DashboardVisualization/Analytics/` | Dashboard |
| **Initial KPI Dashboard** | `DashboardVisualization/InitialKPI/` | Dashboard |
| **Revenue Analytics** | `DashboardVisualization/RevenueAnalytics/` | Dashboard |

### Legacy Projects (Manual editing only):
- All other AppScripts projects (see CLASP_DEPLOYMENT_GUIDE.md for setup instructions)

---

## 🚀 Quick Start Example

Let's make a change to the Analytics Dashboard:

```bash
# 1. Go to project
cd DashboardVisualization/Analytics

# 2. Edit the dashboard
nano dashboard.html

# 3. Make your changes (add a new chart, change styling, etc.)

# 4. Save and push
clasp push

# 5. Check your live web app - changes are immediately visible!
```

---

## 🔧 Advanced Commands

### Pull latest from Apps Script (if you made changes in the online editor):
```bash
clasp pull
```

### View project info:
```bash
clasp status
```

### Open project in Apps Script editor:
```bash
clasp open
```

### Deploy a new version:
```bash
clasp deploy
```

---

## ⚠️ Important Notes

1. **Always `clasp push` after making local changes**
2. **Dashboard projects**: Edit both `.gs` and `.html` files as needed
3. **Single script projects**: Only edit files in the `src/` directory
4. **Backup**: Your original files are preserved - clasp creates copies
5. **Conflicts**: If you edit both locally and online, use `clasp pull` to get latest from Apps Script first

---

## 🆘 Troubleshooting

### "Script not found" error:
```bash
# Make sure you're in the right directory with .clasp.json
ls -la | grep clasp
```

### "Permission denied" error:
```bash
# Re-authenticate
clasp logout
clasp login
```

### File not updating:
```bash
# Force push
clasp push --force
```

### Need to start over:
```bash
# Delete local .clasp.json and re-clone
rm .clasp.json
clasp clone [SCRIPT_ID]
```

---

## 🎯 Success!
You can now edit Apps Script projects locally and deploy with a single command!