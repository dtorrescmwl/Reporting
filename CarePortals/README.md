# CarePortals System

## Overview

The CarePortals system handles Electronic Medical Records (EMR) and Customer Relationship Management (CRM) integration through automated webhook processing. This system captures order lifecycle events, prescription creation, and subscription management data into normalized Google Sheets for reporting and analysis.

## 🎯 System Components

### 📜 AppScripts (Processing Engines)
- **`customer_support_order_tracking.js`** - Real-time order status tracking across lifecycle stages
- **`database_orders.js`** - Normalized order processing with relational data structure
- **`database_careportals_subscriptions.js`** - **NEW** Comprehensive subscription lifecycle management
- **`prescription_created.js`** - Prescription creation event processing
- **`cancelled_subscriptions.js`** - Legacy subscription cancellation handling (superseded)
- **`new_orders_created.js`** - New order creation event processing

### 📊 Google Sheets Integration

#### Database CarePortals Spreadsheet
**Order Management Tabs:**
- `order.created` - Normalized order data with foreign key relationships
- `customers` - Customer master records (deduplicated by email)
- `addresses` - Address master records (MD5-hashed for deduplication)  
- `products` - Product catalog with pricing information
- `coupons` - Coupon/discount master records

**Subscription Management Tabs:** ⭐ **NEW**
- `subscription.active` - Currently active subscriptions only
- `subscription.paused` - Currently paused subscriptions only  
- `subscription.cancelled` - Cancelled subscriptions only
- `subscription.full_log` - Complete audit trail of all subscription webhook events

#### Customer Support Spreadsheet
- Status-specific tabs for real-time order tracking
- Race condition protection and timestamp management
- Product dictionary lookup system

### 🔗 Webhook Configurations
- **`customer_support_order_tracking.json`** - Order status tracking automation
- **`active_subscription_to_sheets.json`** - ✅ **ACTIVE** Active subscription automation
- **`created_subscription_to_sheets.json`** - ✅ **ACTIVE** Subscription creation automation  
- **`paused_subscription_to_sheets.json`** - ✅ **ACTIVE** Paused subscription automation
- **`cancelled_subscription_to_sheets.json`** - ✅ **ACTIVE** Cancelled subscription automation
- **`careportals_automation.json`** - Legacy automation configuration

### 📖 Documentation
- **`webhook_data_structures.md`** - **NEW** Complete JSON payload examples for orders and subscriptions
- **`webhook_to_script_mapping.md`** - **NEW** Comprehensive webhook → script mapping
- **`ORDER_TRACKING_SYSTEM_DOCUMENTATION.md`** - Complete order tracking system guide

## 🆕 Recent Additions

### Subscription Management System
**New AppScript**: `database_careportals_subscriptions.js`
- **Triggers**: subscription.created, subscription.active, subscription.paused, subscription.cancelled
- **URL Parameters**: `?trigger=active`, `?trigger=paused`, `?trigger=cancelled`
- **Key Features**:
  - Single subscription per status tab (automatic duplicate removal)
  - Complete audit trail in subscription.full_log
  - Eastern Time conversion for all timestamps
  - Comprehensive error logging

**CarePortals Automations - All Active**:
1. **"Active Subscription to Sheets"** - Dual webhook setup (subscription.active + subscription.paused)
2. **"Created Subscription to Sheets"** - Dual webhook setup (subscription.created + subscription.cancelled)

**Total Active Configurations**: 4 webhook endpoints across 2 CarePortals automations

### Enhanced Documentation
- Complete webhook payload examples for orders and subscriptions
- Webhook-to-script mapping for all automation setups
- Clear file organization and maintenance guidelines

## 🔄 Data Flow Architecture

### Order Processing Flow
```
CarePortals EMR → order.created webhook → database_orders.js → Database CarePortals spreadsheet
CarePortals EMR → order.updated webhook → customer_support_order_tracking.js → Customer Support spreadsheet
```

### Subscription Processing Flow ⭐ **NEW**
```
CarePortals EMR → subscription.created → database_careportals_subscriptions.js?trigger=active → subscription.active tab
CarePortals EMR → subscription.active → database_careportals_subscriptions.js?trigger=active → subscription.active tab
CarePortals EMR → subscription.paused → database_careportals_subscriptions.js?trigger=paused → subscription.paused tab
CarePortals EMR → subscription.cancelled → database_careportals_subscriptions.js?trigger=cancelled → subscription.cancelled tab
                                            ↓
                                    ALL events → subscription.full_log tab
```

## 🎯 Key Business Logic

### Order Management
- **Customer Deduplication**: Single customer record per email address
- **Address Normalization**: MD5 hashing for address deduplication
- **Pharmacy Routing**: State-based routing (SC/IN → Other, rest → SevenCells)
- **Race Condition Protection**: Timestamp-based duplicate prevention

### Subscription Management ⭐ **NEW**
- **Status Isolation**: Each subscription appears in only one status tab
- **Automatic Migration**: Moving status removes from previous tab
- **Complete Audit Trail**: Every webhook logged to full_log regardless of status
- **Timestamp Conversion**: All UTC timestamps converted to Eastern Time

## 📁 Directory Structure

```
CarePortals/
├── README.md (this file)
├── Data/
│   ├── careportals_orders_original.csv
│   ├── latest_updated_order.csv
│   └── processed/
├── Documentation/
│   ├── webhook_data_structures.md          ⭐ NEW
│   ├── webhook_to_script_mapping.md        ⭐ NEW
│   └── ORDER_TRACKING_SYSTEM_DOCUMENTATION.md
├── Templates/
│   └── Customer_Support.xlsx
└── Webhooks/
    ├── customer_support_order_tracking.json
    ├── active_subscription_to_sheets.json   ⭐ NEW  
    ├── created_subscription_to_sheets.json  ⭐ NEW
    └── careportals_automation.json (legacy)
```

## 🚀 Quick Start

### For Subscription System (✅ Complete)
1. **AppScript Deployed**: `database_careportals_subscriptions.js`
   - URL: `https://script.google.com/macros/s/AKfycbwYTF1Vgiw98yfD7foWq-F5urkwaZ0kyasl5Rzx2_GpOvGsXQf_ch1GmOaAp27EfUQ5OA/exec`
2. **CarePortals Automations Active**:
   - "Active Subscription to Sheets": `?trigger=active` + `?trigger=paused`
   - "Created Subscription to Sheets": `?trigger=active` + `?trigger=cancelled`
3. **All 4 JSON Configs Deployed**: Using `product._id` structure
4. **Spreadsheet Tabs Created**: subscription.active, subscription.paused, subscription.cancelled, subscription.full_log
5. **Testing Verified**: Product ID extraction working correctly

### For Existing Order Systems
1. **Order Tracking**: Use customer_support_order_tracking.js system
2. **Order Processing**: Use database_orders.js for normalized data
3. **Documentation**: Reference ORDER_TRACKING_SYSTEM_DOCUMENTATION.md

## 📊 Monitoring and Maintenance

### Key Metrics to Monitor
- **Subscription Health**: Check active vs. cancelled ratios in status tabs
- **Data Quality**: Monitor subscription.full_log for processing errors
- **Cross-System Integrity**: Verify customer records consistency across order and subscription data
- **Webhook Performance**: Check AppScript execution logs for performance issues

### Maintenance Tasks
- **Weekly**: Review subscription status distributions
- **Monthly**: Analyze subscription lifecycle patterns using full_log data
- **Quarterly**: Archive old data and optimize sheet performance
- **As Needed**: Add new subscription status automations using same pattern

## 🔗 Related Systems

- **AppScripts Index**: `/AppScripts/INDEX.md`
- **Google Sheets URLs**: `/GoogleSheets/INDEX.md`
- **System Documentation**: `/SystemDocumentation/`
- **Embeddables Integration**: `/Embeddables/` (for form-to-order tracking)

---

**Last Updated**: Today  
**System Status**: ✅ Active with new subscription management capabilities  
**Maintainer**: System Administrator