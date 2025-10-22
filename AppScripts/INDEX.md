# AppScripts Index

This directory contains all Google Apps Scripts organized by system and purpose.

## 🚀 CLASP CLI Development Ready

**NEW**: Edit Apps Scripts locally and deploy with command line tools!

### CLASP-Enabled Scripts
- **StripeTracking.js** ✅ **CLI READY**
  - **Location**: `AppScripts/CarePortals/StripeTracking_clasp/`
  - **Edit locally**: `src/Code.gs`
  - **Deploy**: `cd AppScripts/CarePortals/StripeTracking_clasp && clasp push`
  - **Web App**: https://script.google.com/macros/s/AKfycbxiwMYL8jlJtO7VXoqTBcnjSieWGEH0lhzRJvWxQGdBPg1ZAUaV8oivSYFfho45Sge_jA/exec

### CLI Workflow
```bash
# 1. Setup (one-time)
npm install -g @google/clasp
clasp login

# 2. Navigate to project
cd AppScripts/CarePortals/StripeTracking_clasp

# 3. Edit locally
nano src/Code.gs

# 4. Deploy changes
clasp push
```

**Documentation**: See `/CLASP_CLI_SETUP_GUIDE.md` for complete instructions.

## 🏥 CarePortals Scripts

### customer_support_order_tracking.js
- **Purpose**: Real-time order status tracking system for customer support
- **Spreadsheet**: Customer_Support  
- **Web App URL**: https://script.google.com/macros/s/AKfycbxci3zpOxCyTHRLh47aje0nx9HrAUSvRFflDV8Kz8TSK1Ogst5w0Y_A-65xQMTOTsupdQ/exec
- **Trigger**: CarePortals order.updated webhook
- **Features**: 
  - Tracks orders across status tabs (pending, awaiting_payment, etc.)
  - Race condition protection using timestamps
  - Eastern Time conversion
  - Product dictionary lookup

### database_orders.js  
- **Purpose**: Main order processing and database normalization
- **Spreadsheet**: Database CarePortals
- **Web App URL**: https://script.google.com/macros/s/AKfycbywGZUxTowWHtvwRlrgmU9jl6aX5mICc6NkV2kFzbg5DLoTnG8cTcxdEvZ8isLVeH__/exec
- **Trigger**: CarePortals order.created webhook
- **Features**: Normalized relational data structure, customer/address deduplication

### cancelled_subscriptions.js
- **Purpose**: Handles subscription cancellation events
- **Web App URL**: https://script.google.com/macros/s/AKfycbynH6kOFmrPrKpmRFG6-msEKkCyyADmukF5rvL3hUX4bo70u9IvJLMwJfG8Wq94oH9T8g/exec
- **Trigger**: CarePortals subscription.cancelled webhook

### prescription_created.js
- **Purpose**: Processes prescription creation events  
- **Web App URL**: https://script.google.com/macros/s/AKfycby_CuNffi6UibPIDLwMI23iYWq3N1_GbLPLUtJFKCD2j8qWAMiJwcauU63mDWZ7AZY/exec
- **Trigger**: CarePortals prescription.created webhook

### new_orders_created.js
- **Purpose**: Processes new order creation events
- **Web App URL**: https://script.google.com/macros/s/AKfycbwOaZ1ts8Cktwj6opB5Dyxcr8461Cry5tWt3pKFT1E_PYPGqcM4mb9L9-hk-F3RLL2h/exec
- **Trigger**: CarePortals order.created webhook

### database_careportals_subscriptions.js ✅ PRODUCTION READY
- **Purpose**: Comprehensive subscription lifecycle management
- **Spreadsheet**: Database CarePortals
- **Web App URL**: https://script.google.com/macros/s/AKfycbwYTF1Vgiw98yfD7foWq-F5urkwaZ0kyasl5Rzx2_GpOvGsXQf_ch1GmOaAp27EfUQ5OA/exec
- **Triggers**: CarePortals subscription.created, subscription.active, subscription.paused, subscription.cancelled webhooks
- **URL Parameters**: ?trigger=active, ?trigger=paused, ?trigger=cancelled
- **CarePortals Automations**: 4 active webhooks across 2 automations (dual webhook setup)
- **Features**: 
  - Routes subscriptions to status-specific tabs (subscription.active, subscription.paused, subscription.cancelled)
  - Maintains subscription.full_log for complete audit trail
  - Removes duplicates across status tabs
  - Eastern Time conversion for all timestamps
  - **Product ID extraction**: Uses `data["product._id"]` to handle complex product objects
  - **Error handling**: Comprehensive error logging with Subscription_Errors sheet

### messages_log_customer_support.js 🔄 PENDING DEPLOYMENT
- **Purpose**: Message logging for customer support communication tracking
- **Spreadsheet**: Customer_Support
- **Web App URL**: *TBD - Awaiting deployment*
- **Trigger**: CarePortals message.inbound webhook
- **Features**:
  - Logs messages to messages.log tab in Customer_Support spreadsheet
  - Dual customer field support (customer and customer._id)
  - Customer name lookup from customer_dictionary tab
  - EMR Profile link generation
  - Eastern Time conversion for timestamps
  - Auto-creates messages.log tab with proper headers

### StripeTracking.js ✅ CLI-READY + DEPLOYED
- **Purpose**: Real-time Stripe payment and refund tracking via webhooks
- **Spreadsheet**: Database_CarePortals (ID: 1PaCOgNJmKSb2VsJjCMjWpCG-gwrO7uVkuTAFUdrV-_o)
- **Web App URL**: https://script.google.com/macros/s/AKfycbxiwMYL8jlJtO7VXoqTBcnjSieWGEH0lhzRJvWxQGdBPg1ZAUaV8oivSYFfho45Sge_jA/exec
- **CLI Location**: `AppScripts/CarePortals/StripeTracking_clasp/src/Code.gs`
- **Triggers**: Stripe webhooks (payment_intent.succeeded, refund.created)
- **Features**:
  - **Real-time Payment Tracking**: Captures successful payments to `payment_succesful` tab
  - **Refund Processing**: Logs refunds to `refund.created` tab
  - **Order Linking**: Uses `metadata.resourceId` to link payments to CarePortals orders
  - **Eastern Time Conversion**: All timestamps converted from Unix to Eastern Time
  - **Auto-sheet Creation**: Creates tabs with proper headers if they don't exist
  - **Duplicate Prevention**: Checks for existing records before adding new ones
  - **Application Fee Calculation**: Calculates 1% application fee for each payment
  - **Payment Method Support**: Tracks payment methods, card details when available
  - **Error Handling**: Comprehensive error logging and webhook response management

## 🔗 Embeddables Scripts

### medication_v1_form_submissions.js
- **Purpose**: Processes form submissions from MedicationV1 embeddables
- **Web App URL**: https://script.google.com/macros/s/AKfycbw1k7j70HycMTkKTsjk953RQwHcaeLldXERFIhkCDs3CU7Mhl-DpRI_5L5-BC0WPSdl/exec
- **Spreadsheet**: Embeddables
- **Features**: Form data processing, validation, storage

### checkout_sessions_embeddables.js  
- **Purpose**: Tracks checkout sessions from embeddable forms
- **Web App URL**: https://script.google.com/macros/s/AKfycbw1Tk2PiILx6s5y7Pn6Y7MHG5gFB9r8HM-fG4CYDaI3cWvr4K0y7C8Y7Dvo_exec/exec
- **Features**: Session tracking, conversion metrics

### page_tracker.js
- **Purpose**: Tracks page interactions and user behavior
- **Web App URL**: https://script.google.com/macros/s/AKfycbybkatHo6_Uv7GcqzCtrrcC68Jmj5qSa9eM64QpgsYtggkcYPxNjVauDxFD2N8b_qk-/exec
- **Features**: Page view tracking, funnel analysis

## 📊 General Scripts

### survey_started.js
- **Purpose**: Tracks survey initiation events
- **Web App URL**: https://script.google.com/macros/s/AKfycbzrimanbKAnontC5CEGTsLIcMskl2IjcYO4uEaLkBMIrvOBd75_LhOiqdYRmbLUkF2HUQ/exec
- **Features**: Survey engagement metrics

### order_updated.js
- **Purpose**: General order update processing  
- **Web App URL**: https://script.google.com/macros/s/AKfycbwNoZ-byjqv0Z9hAErYN2bQ_y6V33ZwtTc1--g0KZ50s4BqbQbcyh-J-jDe1mvafRb-6A/exec
- **Features**: Order status change tracking

## 📖 Documentation

See the `Documentation/` folder for:
- Deployment guides
- Setup instructions  
- Web App URL management
- Best practices