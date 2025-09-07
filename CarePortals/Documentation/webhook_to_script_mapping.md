# CarePortals Webhook to AppScript Mapping

This document provides a complete mapping of CarePortals webhook events to their corresponding AppScripts and configurations.

## 📋 Complete Webhook → Script Mapping

| Webhook Event | AppScript | Web App URL | Spreadsheet Destination | JSON Config |
|---------------|-----------|-------------|-------------------------|-------------|
| `order.created` | `database_orders.js` | [Link](https://script.google.com/macros/s/AKfycbywGZUxTowWHtvwRlrgmU9jl6aX5mICc6NkV2kFzbg5DLoTnG8cTcxdEvZ8isLVeH__/exec) | Database CarePortals → order.created | `/CarePortals/Webhooks/database_orders.json` |
| `order.updated` | `customer_support_order_tracking.js` | [Link](https://script.google.com/macros/s/AKfycbxci3zpOxCyTHRLh47aje0nx9HrAUSvRFflDV8Kz8TSK1Ogst5w0Y_A-65xQMTOTsupdQ/exec) | Customer Support → status tabs | `/CarePortals/Webhooks/customer_support_order_tracking.json` |
| `prescription.created` | `prescription_created.js` | [Link](https://script.google.com/macros/s/AKfycby_CuNffi6UibPIDLwMI23iYWq3N1_GbLPLUtJFKCD2j8qWAMiJwcauU63mDWZ7AZY/exec) | CarePortals Orders → prescription.created | *No JSON config documented* |
| `subscription.created` | `database_careportals_subscriptions.js` | [Link](https://script.google.com/macros/s/AKfycbwYTF1Vgiw98yfD7foWq-F5urkwaZ0kyasl5Rzx2_GpOvGsXQf_ch1GmOaAp27EfUQ5OA/exec?trigger=active) | Database CarePortals → subscription.active | `/CarePortals/Webhooks/created_subscription_to_sheets.json` |
| `subscription.active` | `database_careportals_subscriptions.js` | [Link](https://script.google.com/macros/s/AKfycbwYTF1Vgiw98yfD7foWq-F5urkwaZ0kyasl5Rzx2_GpOvGsXQf_ch1GmOaAp27EfUQ5OA/exec?trigger=active) | Database CarePortals → subscription.active | `/CarePortals/Webhooks/active_subscription_to_sheets.json` |
| `subscription.paused` | `database_careportals_subscriptions.js` | [Link](https://script.google.com/macros/s/AKfycbwYTF1Vgiw98yfD7foWq-F5urkwaZ0kyasl5Rzx2_GpOvGsXQf_ch1GmOaAp27EfUQ5OA/exec?trigger=paused) | Database CarePortals → subscription.paused | `/CarePortals/Webhooks/paused_subscription_to_sheets.json` |
| `subscription.cancelled` | `database_careportals_subscriptions.js` | [Link](https://script.google.com/macros/s/AKfycbwYTF1Vgiw98yfD7foWq-F5urkwaZ0kyasl5Rzx2_GpOvGsXQf_ch1GmOaAp27EfUQ5OA/exec?trigger=cancelled) | Database CarePortals → subscription.cancelled | `/CarePortals/Webhooks/cancelled_subscription_to_sheets.json` |
| `message.inbound` | `messages_log_customer_support.js` | [Link](TBD - Awaiting deployment URL) | Customer Support → messages.log | `/CarePortals/Webhooks/message_log_to_sheets.json` |

## 🏥 CarePortals Automation Setup

### Current Active Automations

#### 1. **Active Subscription to Sheets**
- **Name**: "Active Subscription to Sheets"
- **Trigger**: `subscription.active`
- **Description**: "Adding active subscription to Sheet entry"
- **Webhook URL**: `https://script.google.com/macros/s/AKfycbwYTF1Vgiw98yfD7foWq-F5urkwaZ0kyasl5Rzx2_GpOvGsXQf_ch1GmOaAp27EfUQ5OA/exec?trigger=active`
- **JSON Config**: `/CarePortals/Webhooks/active_subscription_to_sheets.json`

#### 2. **Created Subscription to Sheets**
- **Name**: "Created Subscription to Sheets" 
- **Trigger**: `subscription.created`
- **Description**: "Adding new subscriptions to Sheet entry"
- **Webhook URL**: `https://script.google.com/macros/s/AKfycbwYTF1Vgiw98yfD7foWq-F5urkwaZ0kyasl5Rzx2_GpOvGsXQf_ch1GmOaAp27EfUQ5OA/exec?trigger=active`
- **JSON Config**: `/CarePortals/Webhooks/created_subscription_to_sheets.json`

#### 3. **Active Subscription to Sheets** (Extended)
- **Name**: "Active Subscription to Sheets" 
- **Triggers**: `subscription.active` + `subscription.paused` (dual webhook setup)
- **Description**: "Adding active subscription to Sheet entry, now also handles paused status"
- **Webhook URLs**: 
  - `https://script.google.com/macros/s/AKfycbwYTF1Vgiw98yfD7foWq-F5urkwaZ0kyasl5Rzx2_GpOvGsXQf_ch1GmOaAp27EfUQ5OA/exec?trigger=active`
  - `https://script.google.com/macros/s/AKfycbwYTF1Vgiw98yfD7foWq-F5urkwaZ0kyasl5Rzx2_GpOvGsXQf_ch1GmOaAp27EfUQ5OA/exec?trigger=paused`
- **JSON Config**: `/CarePortals/Webhooks/paused_subscription_to_sheets.json`
- **Status**: ✅ **ACTIVE** (Updated with dual webhook configuration)

#### 4. **Created Subscription to Sheets** (Extended)
- **Name**: "Created Subscription to Sheets"
- **Triggers**: `subscription.created` + `subscription.cancelled` (dual webhook setup)
- **Description**: "Adding new subscriptions to Sheet entry, now also handles cancellation status"
- **Webhook URLs**:
  - `https://script.google.com/macros/s/AKfycbwYTF1Vgiw98yfD7foWq-F5urkwaZ0kyasl5Rzx2_GpOvGsXQf_ch1GmOaAp27EfUQ5OA/exec?trigger=active`
  - `https://script.google.com/macros/s/AKfycbwYTF1Vgiw98yfD7foWq-F5urkwaZ0kyasl5Rzx2_GpOvGsXQf_ch1GmOaAp27EfUQ5OA/exec?trigger=cancelled`
- **JSON Config**: `/CarePortals/Webhooks/cancelled_subscription_to_sheets.json`
- **Status**: ✅ **ACTIVE** (Updated with dual webhook configuration)

#### 5. **Message Log** (Pending Deployment)
- **Name**: "Message Log"
- **Trigger**: `message.inbound`
- **Description**: "Log for customer support of communications"
- **Webhook URL**: *TBD - Awaiting deployment URL*
- **JSON Config**: `/CarePortals/Webhooks/message_log_to_sheets.json`
- **Status**: 🔄 **PENDING DEPLOYMENT**

## 📊 Database CarePortals Spreadsheet Tabs

### New Subscription Tabs (Added)
- **`subscription.active`** - Currently active subscriptions only
- **`subscription.paused`** - Currently paused subscriptions only
- **`subscription.cancelled`** - Cancelled subscriptions only
- **`subscription.full_log`** - Complete audit trail of all subscription webhook events

### Existing Tabs
- **`order.created`** - Normalized order data
- **`customers`** - Customer master records
- **`addresses`** - Address master records
- **`products`** - Product catalog
- **`coupons`** - Coupon/discount records

## 🔄 Subscription Lifecycle Flow

```
subscription.created  → subscription.active tab (+ full_log)
subscription.active   → subscription.active tab (+ full_log)
subscription.paused   → subscription.paused tab (+ full_log)
subscription.cancelled → subscription.cancelled tab (+ full_log)
```

### Key Business Logic
- **Unique Placement**: Each subscription appears in only ONE status tab at a time
- **Duplicate Removal**: Moving to a new status removes the entry from other status tabs
- **Complete Audit**: Every webhook event is logged to `subscription.full_log` regardless of status
- **Eastern Time**: All timestamps converted from UTC to Eastern Time

## 📁 File Locations

### AppScripts
```
/AppScripts/CarePortals/
├── customer_support_order_tracking.js
├── database_orders.js
├── database_careportals_subscriptions.js  ← NEW
├── cancelled_subscriptions.js (legacy)
├── prescription_created.js
└── new_orders_created.js
```

### Webhook Configurations
```
/CarePortals/Webhooks/
├── customer_support_order_tracking.json
├── database_orders.json (hypothetical)
├── active_subscription_to_sheets.json         ← ✅ ACTIVE
├── created_subscription_to_sheets.json        ← ✅ ACTIVE
├── paused_subscription_to_sheets.json         ← ✅ ACTIVE (NEW)
├── cancelled_subscription_to_sheets.json     ← ✅ ACTIVE (NEW)
└── careportals_automation.json (legacy)
```

### Documentation
```
/CarePortals/Documentation/
├── webhook_data_structures.md              ← NEW
├── webhook_to_script_mapping.md            ← THIS FILE
└── (other documentation files)
```

## 🚀 Testing and Validation

### Testing Subscription Webhooks
1. Use the `testSubscriptionWebhook()` function in `database_careportals_subscriptions.js`
2. Check that entries appear in correct status tabs
3. Verify `subscription.full_log` captures all events
4. Confirm duplicate removal works correctly

### URL Parameter Testing
- Test `?trigger=active` routes to subscription.active tab
- Test `?trigger=paused` routes to subscription.paused tab  
- Test `?trigger=cancelled` routes to subscription.cancelled tab

## 🔧 Maintenance Notes

- **URL Updates**: All subscription events use the same AppScript with different URL parameters
- **JSON Configs**: All subscription automations use identical JSON structure
- **Legacy Scripts**: `cancelled_subscriptions.js` is superseded by `database_careportals_subscriptions.js`
- **Future Expansions**: Easy to add new subscription statuses by adding URL parameters and tabs

## 🚨 Critical Learning: Product Object Structure

### Issue Discovered
The CarePortals documentation shows `product` as a simple string ID, but in practice it sends a complex object that gets stringified to `[object Object]`.

### Solution Implemented
- **Problem**: `"product": "{{product}}"` returns `"[object Object]"`
- **Solution**: `"product._id": "{{product._id}}"` returns actual product ID (e.g., `"681e041f5b1be9b2b1b5975d"`)
- **AppScript Access**: Use `data["product._id"]` (bracket notation required for dot-containing keys)

### Debugging Process Used
1. Added JavaScript introspection attempts: `{{Object.keys(product)}}`, `{{JSON.stringify(product)}}` 
2. Added property guesses: `{{product._id}}`, `{{product.name}}`, etc.
3. Results: Only `product._id` contained usable data; JS introspection returned empty strings
4. **Conclusion**: CarePortals doesn't support JavaScript functions in JSON mapping, but dot notation access works

### Current Working Configuration
All 4 subscription JSON configs now use:
```json
{
  "_id": "{{_id}}",
  "customer._id": "{{customer._id}}",
  "product._id": "{{product._id}}",
  "status": "{{status}}",
  ...
}
```

**Key Takeaway**: When CarePortals webhook documentation shows simple fields, always test for nested object structures using dot notation access patterns.

---

**Last Updated**: Today  
**Next Review**: After adding subscription.paused and subscription.cancelled automations