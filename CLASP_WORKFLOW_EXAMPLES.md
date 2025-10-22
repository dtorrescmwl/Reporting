# CLASP Workflow Examples
## Real-world scenarios for editing Apps Script projects locally

Here are practical examples of how to use CLASP for common development tasks.

---

## 📊 Example 1: Updating Dashboard Styling

**Scenario**: Change the color scheme of your Analytics Dashboard

### Steps:
```bash
# 1. Navigate to dashboard project
cd DashboardVisualization/Analytics

# 2. Edit the HTML file locally
nano dashboard.html

# Find this section and change colors:
# backgroundColor: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'],

# Change to new colors:
# backgroundColor: ['#8E44AD', '#E74C3C', '#F39C12', '#27AE60'],

# 3. Save and deploy
clasp push

# 4. Refresh your web app - new colors are live!
```

**Time saved**: ~10 minutes vs manual copy/paste

---

## 🔧 Example 2: Adding New Webhook Feature

**Scenario**: Add new field processing to StripeTracking.js

### Steps:
```bash
# 1. Navigate to StripeTracking project
cd AppScripts/CarePortals/StripeTracking_clasp

# 2. Edit the Apps Script code
code src/Code.gs

# Add new field processing:
# const newField = eventData.customer?.email || 'N/A';

# 3. Deploy changes
clasp push

# 4. Test with a webhook - new field is processed!
```

**Benefits**:
- Edit in your favorite IDE (VS Code, nano, etc.)
- Version control ready
- No need to open Apps Script editor

---

## 📈 Example 3: Dashboard Bug Fix

**Scenario**: Fix a chart rendering issue in Revenue Analytics

### Steps:
```bash
# 1. Navigate to revenue analytics
cd DashboardVisualization/RevenueAnalytics

# 2. Edit backend code
nano RevenueAnalyticsCode.gs

# Fix calculation error:
# OLD: const netRevenue = grossRevenue - totalRefunds;
# NEW: const netRevenue = Math.max(0, grossRevenue - totalRefunds);

# 3. Deploy fix
clasp push

# 4. Dashboard automatically uses fixed calculation
```

**Result**: Instant deployment, no Apps Script editor needed

---

## 🔄 Example 4: Multi-File Dashboard Update

**Scenario**: Update both frontend and backend of KPI Dashboard

### Steps:
```bash
# 1. Navigate to project
cd DashboardVisualization/InitialKPI

# 2. Edit backend data processing
nano Code.gs
# Add new KPI calculation...

# 3. Edit frontend display
nano kpi_dashboard.html
# Add new chart for the KPI...

# 4. Deploy both changes together
clasp push

# 5. Both frontend and backend changes are live!
```

**Advantage**: Edit multiple files, deploy as a unit

---

## 🚀 Example 5: Quick Content Update

**Scenario**: Update dashboard title and descriptions

### Steps:
```bash
# 1. Navigate to any dashboard
cd DashboardVisualization/Analytics

# 2. Quick edit with nano
nano dashboard.html

# Change title:
# <h1>CarePortals Analytics</h1>
# to:
# <h1>Q4 Healthcare Analytics</h1>

# 3. Quick deploy
clasp push

# Takes 30 seconds total!
```

---

## 🔍 Example 6: Debugging with Local Tools

**Scenario**: Debug complex data processing logic

### Steps:
```bash
# 1. Navigate to project
cd DashboardVisualization/RevenueAnalytics

# 2. Open in VS Code for advanced debugging
code .

# Use VS Code features:
# - Syntax highlighting
# - Find/replace across files
# - Git integration
# - Extensions for Apps Script

# 3. Make changes and deploy
clasp push
```

**Benefits**:
- Full IDE features
- Better debugging tools
- Search across all files

---

## 🔄 Example 7: Bulk Updates Across Projects

**Scenario**: Update API endpoint across all dashboard projects

### Steps:
```bash
# 1. Use grep to find all instances
grep -r "old-api-endpoint" DashboardVisualization/

# 2. Use sed to replace across all files
find DashboardVisualization/ -name "*.gs" -exec sed -i 's/old-api-endpoint/new-api-endpoint/g' {} \;

# 3. Deploy all projects
cd DashboardVisualization/Analytics && clasp push
cd ../InitialKPI && clasp push
cd ../RevenueAnalytics && clasp push

# All projects updated in minutes!
```

---

## 📋 Example 8: Version Control Integration

**Scenario**: Track changes with git for better development

### Steps:
```bash
# 1. Initialize git in dashboard directory
cd DashboardVisualization/Analytics
git init
git add .
git commit -m "Initial dashboard setup"

# 2. Make changes
nano dashboard.html

# 3. Commit changes
git add dashboard.html
git commit -m "Updated color scheme"

# 4. Deploy
clasp push

# 5. Tag releases
git tag v1.1-color-update
```

**Benefits**:
- Track all changes
- Easy rollback
- Collaborative development

---

## ⚡ Example 9: Batch Testing Changes

**Scenario**: Test changes across multiple environments

### Steps:
```bash
# 1. Make changes locally
cd DashboardVisualization/Analytics
nano Code.gs

# 2. Test in development
clasp push

# 3. Verify in web app
curl -s "https://your-web-app-url/exec" | grep "expected-output"

# 4. If good, deploy to other projects
cp Code.gs ../InitialKPI/
cd ../InitialKPI && clasp push
```

---

## 🎯 Example 10: Emergency Hot Fix

**Scenario**: Critical bug needs immediate fix

### Steps:
```bash
# 1. Quick navigation
cd DashboardVisualization/Analytics

# 2. Immediate fix
sed -i 's/broken-function/fixed-function/g' Code.gs

# 3. Emergency deploy
clasp push

# 4. Verify fix is live
curl -s "https://your-web-app-url/exec"

# Total time: Under 2 minutes!
```

---

## 💡 Pro Tips

### Productivity Boosters:
```bash
# Create aliases for common commands
alias cdanalytics='cd /home/user/Reporting/DashboardVisualization/Analytics'
alias cdroa='cd /home/user/Reporting/DashboardVisualization/RevenueAnalytics'
alias pushall='clasp push && echo "Deployed!"'

# Quick project switcher
function switch-dashboard() {
  case $1 in
    analytics) cd DashboardVisualization/Analytics ;;
    kpi) cd DashboardVisualization/InitialKPI ;;
    revenue) cd DashboardVisualization/RevenueAnalytics ;;
  esac
}

# Usage: switch-dashboard analytics
```

### File Watching:
```bash
# Auto-deploy on file changes (requires inotify-tools)
while inotifywait -e modify Code.gs dashboard.html; do
  echo "File changed, deploying..."
  clasp push
  echo "Deployed at $(date)"
done
```

---

## 📊 Time Comparison

| Task | Manual Method | CLASP CLI Method | Time Saved |
|------|---------------|------------------|-------------|
| **Single file edit** | 5 minutes | 1 minute | 80% |
| **Multi-file update** | 15 minutes | 3 minutes | 80% |
| **Bug fix + deploy** | 8 minutes | 2 minutes | 75% |
| **Bulk updates** | 45 minutes | 10 minutes | 78% |
| **Version control** | Manual backup | Git integration | Priceless |

---

## 🎉 You're Ready!

These examples show the power of CLASP CLI development:
- **Faster development** cycles
- **Better tooling** support
- **Version control** integration
- **Bulk operations** capability
- **Emergency response** readiness

**Next**: Try these workflows with your own projects!