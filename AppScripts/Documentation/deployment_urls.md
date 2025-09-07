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

### database_careportals_subscriptions.js
- **Web App URL**: https://script.google.com/macros/s/AKfycbwYTF1Vgiw98yfD7foWq-F5urkwaZ0kyasl5Rzx2_GpOvGsXQf_ch1GmOaAp27EfUQ5OA/exec
- **Google Sheets**: Database CarePortals spreadsheet (subscription tabs)
- **Purpose**: Comprehensive subscription lifecycle management
- **Triggers**: subscription.created, subscription.active, subscription.paused, subscription.cancelled
- **URL Parameters**: ?trigger=active, ?trigger=paused, ?trigger=cancelled
- **Status**: ✅ Active
- **Tabs Created**: subscription.active, subscription.paused, subscription.cancelled, subscription.full_log

### cancelled_subscriptions.js
- **Web App URL**: https://script.google.com/macros/s/AKfycbynH6kOFmrPrKpmRFG6-msEKkCyyADmukF5rvL3hUX4bo70u9IvJLMwJfG8Wq94oH9T8g/exec
- **Purpose**: Legacy subscription cancellation handling  
- **Trigger**: CarePortals subscription.cancelled webhook
- **Status**: ⚠️ Superseded by database_careportals_subscriptions.js

### prescription_created.js
- **Web App URL**: https://script.google.com/macros/s/AKfycby_CuNffi6UibPIDLwMI23iYWq3N1_GbLPLUtJFKCD2j8qWAMiJwcauU63mDWZ7AZY/exec
- **Purpose**: Prescription creation event processing
- **Trigger**: CarePortals prescription.created webhook
- **Status**: ✅ Active

### new_orders_created.js
- **Web App URL**: https://script.google.com/macros/s/AKfycbwOaZ1ts8Cktwj6opB5Dyxcr8461Cry5tWt3pKFT1E_PYPGqcM4mb9L9-hk-F3RLL2h/exec
- **Purpose**: New order creation event processing
- **Trigger**: CarePortals order.created webhook  
- **Status**: ✅ Active

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