# AppScript Deployment URLs

This document contains all Google Apps Script web app deployment URLs for easy reference and management.

## 🏥 CarePortals Scripts

### customer_support_order_tracking.js
- **Web App URL**: https://script.google.com/macros/s/AKfycbxci3zpOxCyTHRLh47aje0nx9HrAUSvRFflDV8Kz8TSK1Ogst5w0Y_A-65xQMTOTsupdQ/exec
- **Google Sheets**: https://docs.google.com/spreadsheets/d/1h-ttn7R6s2KszovW_NvBI1x6fVUaXAjcID6-Xa0ISsw/edit?gid=1296501344#gid=1296501344
- **Purpose**: Customer support order status tracking
- **Trigger**: CarePortals order.updated webhook
- **Status**: ✅ Active

### database_orders.js
- **Web App URL**: https://script.google.com/macros/s/AKfycbywGZUxTowWHtvwRlrgmU9jl6aX5mICc6NkV2kFzbg5DLoTnG8cTcxdEvZ8isLVeH__/exec
- **Purpose**: Order processing and database normalization
- **Trigger**: CarePortals order.created webhook
- **Status**: ✅ Active

### [Add other CarePortals scripts as they are deployed]

## 🔗 Embeddables Scripts

### [Add Embeddables script URLs as they are deployed]

## 📊 General Scripts

### [Add General script URLs as they are deployed]

## 📋 Deployment Management

### Adding New Deployments
1. Deploy the script as a web app in Google Apps Script
2. Copy the deployment URL  
3. Add it to this document with:
   - Script name and file location
   - Web App URL
   - Associated Google Sheets URL (if applicable)
   - Purpose/description
   - Trigger type
   - Current status

### URL Updates
- **When to update**: After each new deployment or redeploy
- **Who updates**: Script maintainer or system administrator
- **Testing**: Always test URLs after updates

### Status Indicators
- ✅ **Active**: Currently deployed and working
- ⚠️ **Testing**: Deployed but in testing phase
- ❌ **Inactive**: Temporarily disabled or deprecated
- 🔄 **Updating**: Currently being redeployed

## 🔧 Related Resources

- **AppScripts Index**: `/AppScripts/INDEX.md`
- **Google Sheets URLs**: `/GoogleSheets/INDEX.md`  
- **Webhook Configurations**: Individual system directories (e.g., `/CarePortals/Webhooks/`)
- **Setup Guides**: `/AppScripts/Documentation/setup_instructions.md`

---

**Last Updated**: Today  
**Next Review**: Update after each deployment