# Standardized Clasp Setup Guide

This document provides the standardized process for setting up clasp projects for Google Apps Script deployment across the Reporting system.

## Directory Structure

All clasp projects should follow this structure:
```
/home/cmwldaniel/Reporting/AppScripts/[Category]/[script_name]_clasp/
├── .clasp.json
├── appsscript.json
└── Code.gs (or main script file)
```

## Step-by-Step Setup Process

### 1. Create Clasp Project Directory
```bash
cd /home/cmwldaniel/Reporting/AppScripts/[Category]
mkdir -p [script_name]_clasp
cd [script_name]_clasp
```

### 2. Create .clasp.json Configuration
Create `.clasp.json` with the Google Apps Script project ID:
```json
{
  "scriptId": "YOUR_GOOGLE_APPS_SCRIPT_PROJECT_ID",
  "rootDir": "."
}
```

### 3. Create appsscript.json with Web App Settings
Create `appsscript.json` with standardized web app configuration:
```json
{
  "timeZone": "America/New_York",
  "dependencies": {},
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8",
  "webapp": {
    "executeAs": "USER_DEPLOYING",
    "access": "ANYONE"
  }
}
```

**Web App Settings Explained:**
- `executeAs: "USER_DEPLOYING"` = Execute as: Me
- `access: "ANYONE"` = Who has access: Anyone

### 4. Copy Main Script File
Copy your main script file as `Code.gs` (or keep original name):
```bash
cp /path/to/your/script.js ./Code.gs
```

### 5. Deploy with Clasp
```bash
# Push files to Google Apps Script
clasp push -f

# Deploy to existing deployment (if updating)
clasp deploy --deploymentId YOUR_DEPLOYMENT_ID --description "Description of changes"

# OR create new deployment
clasp deploy --description "Initial deployment - Execute as USER_DEPLOYING, Access ANYONE"
```

## Deployment ID Management

### Finding Deployment IDs
```bash
# List all deployments
clasp deployments

# Sample output:
# - AKfycbwYTF1Vgiw98yfD7foWq... @9 - Description
```

### Updating Existing Deployments
Always use `--deploymentId` when updating existing web apps to maintain the same URL:
```bash
clasp deploy --deploymentId AKfycbwYTF1Vgiw98yfD7foWq... --description "Updated with new functionality"
```

## Current Clasp Projects

### Active Projects
1. **Revenue Analytics Dashboard**
   - Location: `/DashboardVisualization/RevenueAnalytics/`
   - Script ID: `1J62EOn9OXZzFpqcyw4egfjZe72gOpYJPohApUPmtoKM`
   - URL: https://script.google.com/a/macros/cmwlvirtual.com/s/AKfycbyvHg0nYU5gyNEmssGld4lUIt3f-_iMA5ctXu0myygFgHfdzGYEJJWW5OAi6hLbtTzmzQ/exec

2. **KPI Dashboard**
   - Location: `/DashboardVisualization/InitialKPI/`
   - Script ID: `1Y2GN0BC-_nseRMV4JZvDeM8hPR4rc19GzYf4wSEK5BIJvSbGHwwRzoZN`
   - URL: https://script.google.com/a/macros/cmwlvirtual.com/s/AKfycbyCwqa2Axq91FoXG-8uGSke2gOpH9bCZz1kxJr31B-HLdoYu4-seTyGMEOQvGvMe-jR/exec

3. **Subscription Processing**
   - Location: `/AppScripts/CarePortals/subscriptions_clasp/`
   - Script ID: `1y7HUnUK9bp0fbb1W7MCU9lZQXtiaBoJT_x-6AG4Tl5QVty5hkDl1SG8m`
   - URL: https://script.google.com/macros/s/AKfycbwYTF1Vgiw98yfD7foWq-F5urkwaZ0kyasl5Rzx2_GpOvGsXQf_ch1GmOaAp27EfUQ5OA/exec

4. **Database Orders Processing**
   - Location: `/AppScripts/CarePortals/database_orders_clasp/`
   - Script ID: `1Zcqvh3QplPbwZ5VrR88ys71IPisJZyozC3yL-LegCl3VQknC0tfZGoki`
   - Deployment ID: `AKfycbywGZUxTowWHtvwRlrgmU9jl6aX5mICc6NkV2kFzbg5DLoTnG8cTcxdEvZ8isLVeH__`
   - Purpose: Processes order.created and order.updated webhooks
   - **Note**: order.updated webhook contains comprehensive order status tracking including cancellations

## Web App Configuration Standards

### Required Settings for ALL Webhook Scripts
- **Execute as:** USER_DEPLOYING (maintains proper permissions)
- **Who has access:** ANYONE (allows webhook access)
- **Time Zone:** America/New_York (consistent with business operations)

### **CRITICAL: Webhook Script Deployment Requirements**
For ALL webhook processing scripts (subscription processing, database orders, etc.), the deployment MUST be configured as:
- **Execute as:** Me (USER_DEPLOYING)
- **Access:** Anyone (ANYONE)

This configuration is REQUIRED for webhook scripts to function properly. Without these settings:
- External webhooks will fail with permission errors
- Script execution will be blocked
- Data processing will not occur

**Always verify these settings after each deployment update.**

### **PENDING MIGRATION: Order.Cancelled Webhook Deprecation**
The `order.cancelled` webhook is planned for deprecation in favor of the more comprehensive `order.updated` system.

**Current Status:** order.cancelled webhook still active but should be disabled after dashboard migration is complete.

**Migration Documentation:** `/SystemDocumentation/WebhookMigration/ORDER_CANCELLED_TO_UPDATED_MIGRATION.md`

**Dependencies to resolve:**
- General Dashboard (`GeneralDashboardCode.gs`) uses order.cancelled for filtering
- KPI Dashboard (`InitialKPI/Code.gs`) uses order.cancelled for cancellation metrics

**Action Required:** Execute dashboard migration to use filtered order.updated data instead of order.cancelled before disabling the webhook.

### Security Considerations
- All scripts should include proper error handling
- Sensitive operations should validate request sources
- Error logs should be captured in designated error sheets

## Troubleshooting

### Common Issues
1. **Authentication Errors**
   ```bash
   clasp login  # Re-authenticate if needed
   ```

2. **Deployment Not Working as Web App**
   - Ensure `appsscript.json` includes `webapp` configuration
   - Verify deployment is created as "Web app" not "Library"

3. **Permission Issues**
   - Check `executeAs` and `access` settings in `appsscript.json`
   - Ensure script owner has proper permissions

### Verification
After deployment, verify:
1. Web app URL is accessible
2. Webhook endpoints respond correctly
3. Error handling logs to appropriate sheets
4. Functions execute with proper permissions

## Best Practices

1. **Always use descriptive deployment descriptions**
2. **Include permission settings in deployment description**
3. **Test deployments after updates**
4. **Maintain consistent directory structure**
5. **Document deployment URLs in project documentation**
6. **Use version control for clasp project files**

---

*Last Updated: October 2025*
*Standardized process for Google Apps Script deployments via clasp*