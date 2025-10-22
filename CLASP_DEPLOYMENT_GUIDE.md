# CLASP Deployment Guide

This guide provides all the necessary information for deploying and managing Google Apps Script projects using CLASP (Command Line Apps Script Projects).

## Prerequisites

1. **CLASP installed**: `npm install -g @google/clasp`
2. **Google Cloud Platform project** set up with Apps Script API enabled
3. **Authentication**: `clasp login`

## Project Structure & IDs

### 📊 Spreadsheet IDs

| Spreadsheet Name | ID | Purpose |
|------------------|----|---------| 
| **Database CarePortals** | `1PaCOgNJmKSb2VsJjCMjWpCG-gwrO7uVkuTAFUdrV-_o` | Main normalized database |
| **Customer Support** | `1h-ttn7R6s2KszovW_NvBI1x6fVUaXAjcID6-Xa0ISsw` | Customer support tracking |
| **CarePortals Orders** | `1J62EOn9OXZzFpqcyw4egfjZe72gOpYJPohApUPmtoKM` | Legacy order processing |
| **Embeddables Data** | `1WVklvRZZqiVtVdD64IDm-vPSSvx-lv6QdXN9V8HC7hI` | Form submissions data |

---

## 🔧 App Script Projects & Deployments

### 1. Customer Support Order Tracking
- **Local Files**: `AppScripts/CarePortals/customer_support_order_tracking.js`
- **Spreadsheet**: Customer Support (`1h-ttn7R6s2KszovW_NvBI1x6fVUaXAjcID6-Xa0ISsw`)
- **Web App URL**: https://script.google.com/macros/s/AKfycbxci3zpOxCyTHRLh47aje0nx9HrAUSvRFflDV8Kz8TSK1Ogst5w0Y_A-65xQMTOTsupdQ/exec
- **Script ID**: `AKfycbxci3zpOxCyTHRLh47aje0nx9HrAUSvRFflDV8Kz8TSK1Ogst5w0Y_A-65xQMTOTsupdQ`

### 2. Database Orders (Normalized Processing)
- **Local Files**: `AppScripts/CarePortals/database_orders.js`
- **Spreadsheet**: Database CarePortals (`1PaCOgNJmKSb2VsJjCMjWpCG-gwrO7uVkuTAFUdrV-_o`)
- **Web App URL**: https://script.google.com/macros/s/AKfycbywGZUxTowWHtvwRlrgmU9jl6aX5mICc6NkV2kFzbg5DLoTnG8cTcxdEvZ8isLVeH__/exec
- **Script ID**: `AKfycbywGZUxTowWHtvwRlrgmU9jl6aX5mICc6NkV2kFzbg5DLoTnG8cTcxdEvZ8isLVeH__`

### 3. Database CarePortals Subscriptions
- **Local Files**: `AppScripts/CarePortals/database_careportals_subscriptions.js`
- **Spreadsheet**: Database CarePortals (`1PaCOgNJmKSb2VsJjCMjWpCG-gwrO7uVkuTAFUdrV-_o`)
- **Web App URL**: https://script.google.com/macros/s/AKfycbwYTF1Vgiw98yfD7foWq-F5urkwaZ0kyasl5Rzx2_GpOvGsXQf_ch1GmOaAp27EfUQ5OA/exec
- **Script ID**: `AKfycbwYTF1Vgiw98yfD7foWq-F5urkwaZ0kyasl5Rzx2_GpOvGsXQf_ch1GmOaAp27EfUQ5OA`
- **Parameters**:
  - `?trigger=active` - For active subscriptions
  - `?trigger=paused` - For paused subscriptions  
  - `?trigger=cancelled` - For cancelled subscriptions

### 4. Messages Log Customer Support
- **Local Files**: `AppScripts/CarePortals/messages_log_customer_support.js`
- **Spreadsheet**: Customer Support (`1h-ttn7R6s2KszovW_NvBI1x6fVUaXAjcID6-Xa0ISsw`)
- **Web App URL**: *Script ID needed*

### 5. Prescription Created
- **Local Files**: `AppScripts/CarePortals/prescription_created.js`
- **Spreadsheet**: CarePortals Orders (`1J62EOn9OXZzFpqcyw4egfjZe72gOpYJPohApUPmtoKM`)
- **Web App URL**: https://script.google.com/macros/s/AKfycby_CuNffi6UibPIDLwMI23iYWq3N1_GbLPLUtJFKCD2j8qWAMiJwcauU63mDWZ7AZY/exec
- **Script ID**: `AKfycby_CuNffi6UibPIDLwMI23iYWq3N1_GbLPLUtJFKCD2j8qWAMiJwcauU63mDWZ7AZY`

### 6. New Orders Created
- **Local Files**: `AppScripts/CarePortals/new_orders_created.js`
- **Spreadsheet**: CarePortals Orders (`1J62EOn9OXZzFpqcyw4egfjZe72gOpYJPohApUPmtoKM`)
- **Web App URL**: *Script ID needed*

### 7. Cancelled Subscriptions
- **Local Files**: `AppScripts/CarePortals/cancelled_subscriptions.js`
- **Spreadsheet**: CarePortals Orders (`1J62EOn9OXZzFpqcyw4egfjZe72gOpYJPohApUPmtoKM`)
- **Web App URL**: *Script ID needed*

### 8. Order Updated (General)
- **Local Files**: `AppScripts/General/order_updated.js`
- **Spreadsheet**: CarePortals Orders (`1J62EOn9OXZzFpqcyw4egfjZe72gOpYJPohApUPmtoKM`)
- **Web App URL**: *Script ID needed*

### 9. Survey Started
- **Local Files**: `AppScripts/General/survey_started.js`
- **Spreadsheet**: Embeddables Data (`1WVklvRZZqiVtVdD64IDm-vPSSvx-lv6QdXN9V8HC7hI`)
- **Web App URL**: *Script ID needed*

### 10. MedicationV1 Form Submissions
- **Local Files**: `AppScripts/Embeddables/medication_v1_form_submissions.js`
- **Spreadsheet**: Embeddables Data (`1WVklvRZZqiVtVdD64IDm-vPSSvx-lv6QdXN9V8HC7hI`)
- **Web App URL**: *Script ID needed*

### 11. Checkout Sessions Embeddables
- **Local Files**: `AppScripts/Embeddables/checkout_sessions_embeddables.js`
- **Spreadsheet**: Embeddables Data (`1WVklvRZZqiVtVdD64IDm-vPSSvx-lv6QdXN9V8HC7hI`)
- **Web App URL**: *Script ID needed*

### 12. Page Tracker
- **Local Files**: `AppScripts/Embeddables/page_tracker.js`
- **Spreadsheet**: Embeddables Data (`1WVklvRZZqiVtVdD64IDm-vPSSvx-lv6QdXN9V8HC7hI`)
- **Web App URL**: *Script ID needed*

---

## 📊 Dashboard Systems

### 1. Analytics Dashboard
- **Local Files**: 
  - `DashboardVisualization/Analytics/Code.gs`
  - `DashboardVisualization/Analytics/dashboard.html`
- **Spreadsheet**: Database CarePortals (`1PaCOgNJmKSb2VsJjCMjWpCG-gwrO7uVkuTAFUdrV-_o`)
- **Web App URL**: https://script.google.com/macros/s/AKfycbzo85VZL3NPBv3mNySOz0wAuPFnDK7L4zmNB7D6pzQSbzrpJXxAYJyJv-kY2ZP3i5X3/exec
- **Script ID**: `AKfycbzo85VZL3NPBv3mNySOz0wAuPFnDK7L4zmNB7D6pzQSbzrpJXxAYJyJv-kY2ZP3i5X3`
- **Apps Script Project Name**: `DB_First_Visualization`

### 2. General Dashboard  
- **Local Files**:
  - `DashboardVisualization/GeneralDashboard/GeneralDashboardCode.gs`
  - `DashboardVisualization/GeneralDashboard/general_dashboard.html`
- **Spreadsheet**: Database CarePortals (`1PaCOgNJmKSb2VsJjCMjWpCG-gwrO7uVkuTAFUdrV-_o`)
- **Web App URL**: *To be deployed*
- **Script ID**: *To be assigned*

### 3. Order Search System
- **Local Files**:
  - `DashboardVisualization/OrderSearch/OrderSearchCode.gs` 
  - `DashboardVisualization/OrderSearch/order_search.html`
- **Spreadsheet**: Database CarePortals (`1PaCOgNJmKSb2VsJjCMjWpCG-gwrO7uVkuTAFUdrV-_o`)
- **Web App URL**: *To be deployed*
- **Script ID**: *To be assigned*

---

## 🚀 CLASP Commands & Workflow

### Initial Setup for Each Project

1. **Clone existing project**:
   ```bash
   clasp clone <SCRIPT_ID>
   ```

2. **Or create new project**:
   ```bash
   mkdir project-name
   cd project-name
   clasp create --type webapp --title "Project Name"
   ```

### Development Workflow

1. **Pull latest from Google Drive**:
   ```bash
   clasp pull
   ```

2. **Push local changes**:
   ```bash
   clasp push
   ```

3. **Deploy new version**:
   ```bash
   clasp deploy -d "Version description"
   ```

4. **Open in browser**:
   ```bash
   clasp open
   ```

### Project-Specific Commands

#### For Customer Support Order Tracking:
```bash
# Clone the project
clasp clone AKfycbxci3zpOxCyTHRLh47aje0nx9HrAUSvRFflDV8Kz8TSK1Ogst5w0Y_A-65xQMTOTsupdQ

# Push local file
clasp push
# File: AppScripts/CarePortals/customer_support_order_tracking.js → Code.gs

# Deploy
clasp deploy -d "Customer support tracking update"
```

#### For Analytics Dashboard:
```bash
# Clone the project  
clasp clone AKfycbzo85VZL3NPBv3mNySOz0wAuPFnDK7L4zmNB7D6pzQSbzrpJXxAYJyJv-kY2ZP3i5X3

# Push local files
clasp push
# Files: 
# - DashboardVisualization/Analytics/Code.gs → Code.gs
# - DashboardVisualization/Analytics/dashboard.html → dashboard.html

# Deploy
clasp deploy -d "Analytics dashboard update"
```

### File Structure Requirements

Each CLASP project needs a `.clasp.json` file:
```json
{
  "scriptId": "SCRIPT_ID_HERE",
  "rootDir": "path/to/local/files"
}
```

### Example .clasp.json Files

#### For Customer Support:
```json
{
  "scriptId": "AKfycbxci3zpOxCyTHRLh47aje0nx9HrAUSvRFflDV8Kz8TSK1Ogst5w0Y_A-65xQMTOTsupdQ",
  "rootDir": "AppScripts/CarePortals/"
}
```

#### For Analytics Dashboard:
```json
{
  "scriptId": "AKfycbzo85VZL3NPBv3mNySOz0wAuPFnDK7L4zmNB7D6pzQSbzrpJXxAYJyJv-kY2ZP3i5X3",
  "rootDir": "DashboardVisualization/Analytics/"
}
```

---

## 📝 Deployment Checklist

### Before Deployment:
- [ ] Test the script locally if possible
- [ ] Verify all spreadsheet IDs are correct
- [ ] Check that all required libraries/services are enabled
- [ ] Backup current version if critical

### After Deployment:
- [ ] Test the web app URL
- [ ] Verify webhook endpoints work (if applicable)
- [ ] Update documentation with new deployment URLs
- [ ] Notify team of changes

---

## 🔐 Security & Access

### Script Permissions:
- Most scripts require **"Anyone"** access for webhooks
- Dashboard systems can use **"Anyone with the link"**
- Internal tools can use **"Only myself"**

### Spreadsheet Access:
- Ensure service account has edit access to all spreadsheets
- Verify sharing settings allow script access
- Check that API is enabled in Google Cloud Console

---

## 🐛 Troubleshooting

### Common Issues:
1. **"Script not found"** - Check script ID and permissions
2. **"Unauthorized"** - Run `clasp login` again
3. **"Cannot read property"** - Check spreadsheet IDs in code
4. **"Timeout"** - Optimize script performance

### Logs & Debugging:
```bash
# View execution logs
clasp logs

# Open Apps Script editor
clasp open
```

---

## 📋 Project Status

### ✅ Currently Deployed & Active:
- Customer Support Order Tracking
- Database Orders Processing  
- Database CarePortals Subscriptions
- Analytics Dashboard
- Prescription Created

### 🔄 Need Script IDs:
- Messages Log Customer Support
- New Orders Created
- Cancelled Subscriptions
- Order Updated
- Survey Started
- MedicationV1 Form Submissions
- Checkout Sessions
- Page Tracker

### 🚀 Ready for Deployment:
- General Dashboard
- Order Search System

---

**Last Updated**: September 12, 2025  
**CLASP Version**: Latest  
**Total Projects**: 15 (5 active, 8 need IDs, 2 ready)