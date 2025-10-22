# Reporting System - Master Index

Welcome to the complete reporting and automation system. This index provides a comprehensive overview of all components and their locations.

## 🗂️ Directory Structure

```
Reporting/
├── 📜 AppScripts/           # All Google Apps Scripts
├── 🏥 CarePortals/          # CarePortals EMR/CRM system data
├── 🔗 Embeddables/          # Embeddable forms data and CSV exports
├── 📊 GoogleSheets/         # Live sheets with real data (updated daily)
├── 📈 DashboardVisualization/ # ✅ **NEW** Advanced analytics dashboard system
├── 🗂️ SystemDocumentation/  # Technical documentation
├── 🔧 Scripts/              # Organized automation scripts
│   ├── Embeddables/         # Data extraction and filtering
│   ├── DataProcessing/      # Analysis utilities (includes extended records merge)
│   └── Utilities/           # System maintenance
├── 📋 Archive/              # Historical files and backups
└── 📝 New_Spreadsheets/     # Latest downloads (temp directory)
```

## 📜 AppScripts

**Location**: `/AppScripts/`
**Index**: `/AppScripts/INDEX.md`

### 🚀 CLASP CLI Development Ready
**New Feature**: Direct local editing with automatic deployment to Apps Script!

#### CLASP-Enabled Projects (Edit locally → Push to Apps Script)
- `StripeTracking.js` - ✅ **CLI READY** Located at `/AppScripts/CarePortals/StripeTracking_clasp/`
  - Edit locally: `src/Code.gs`
  - Deploy: `cd AppScripts/CarePortals/StripeTracking_clasp && clasp push`

### 🏥 CarePortals Scripts
- `customer_support_order_tracking.js` - Real-time order tracking for customer support (enhanced with 'shipped' status)
- `database_orders.js` - Order processing and database normalization (updated pharmacy assignment logic)
- `database_careportals_subscriptions.js` - ✅ **PRODUCTION** Comprehensive subscription lifecycle management
- `StripeTracking.js` - ✅ **ENHANCED** Real-time Stripe payment and refund webhook processing with API integration
- `cancelled_subscriptions.js` - Subscription cancellation handling (legacy)
- `prescription_created.js` - Prescription creation processing
- `new_orders_created.js` - New order creation handling

### 🔗 Embeddables Scripts  
- `medication_v1_form_submissions.js` - MedicationV1 form processing
- `checkout_sessions_embeddables.js` - Checkout session tracking
- `page_tracker.js` - Page interaction tracking

### 📊 General Scripts
- `survey_started.js` - Survey engagement tracking
- `order_updated.js` - General order update processing

## 🏥 CarePortals System

**Location**: `/CarePortals/`  
**README**: `/CarePortals/README.md`

### Components
- **Webhooks** (`/Webhooks/`) - JSON automation configurations
- **Data** (`/Data/`) - Raw and processed order data
- **Templates** (`/Templates/`) - Clean spreadsheet templates
- **Documentation** (`/Documentation/`) - System-specific guides

### Key Files
- `customer_support_order_tracking.json` - Order tracking automation
- `active_subscription_to_sheets.json` - ✅ Active subscription automation
- `created_subscription_to_sheets.json` - ✅ Created subscription automation  
- `paused_subscription_to_sheets.json` - ✅ Paused subscription automation
- `cancelled_subscription_to_sheets.json` - ✅ Cancelled subscription automation
- `careportals_orders_original.csv` - Source data  
- `Customer_Support.xlsx` - Template for implementations

## 🔗 Embeddables System

**Location**: `/Embeddables/`  
**README**: `/Embeddables/README.md`

### Systems
- **MedicationV1** - Medication assessment embeddable
- **SemaglutideV1** - Semaglutide-specific forms  
- **TirzepatideV1** - Tirzepatide-specific forms
- **Tools** - Shared utilities and extractors

## 📊 Google Sheets

**Location**: `/GoogleSheets/`  
**Index**: `/GoogleSheets/INDEX.md`

### Live Sheets with Real Data (Updated September 17, 2025)

#### CarePortals_Orders.xlsx - ✅ **UPDATED** Main order processing data
- **Spreadsheet ID**: `1J62EOn9OXZzFpqcyw4egfjZe72gOpYJPohApUPmtoKM`
- **Purpose**: Order processing, customer data, prescription tracking
- **Key Sheets**: order.created (217 records), prescription.created (158 records), order.updated (3432 records)
- **Used By**: new_orders_created.js, prescription_created.js, cancelled_subscriptions.js

#### Database_CarePortals.xlsx - ✅ **ENHANCED** Normalized database structure
- **Spreadsheet ID**: `1PaCOgNJmKSb2VsJjCMjWpCG-gwrO7uVkuTAFUdrV-_o`
- **URL**: https://docs.google.com/spreadsheets/d/1PaCOgNJmKSb2VsJjCMjWpCG-gwrO7uVkuTAFUdrV-_o/edit
- **Total Sheets**: 16 sheets with 5,100+ total records
- **Complete Schema**: See `/GoogleSheets/DATABASE_CAREPORTALS_SCHEMA.md` for detailed documentation
- **Key Sheets**:
  - **🆕 order.updated (3,081 records)** - Real-time order status tracking and lifecycle management
  - order.created (476 records), customers (281 records), products (26 records)
  - subscription.active (206 records), payment_succesful (438 records), refund.created (121 records)
  - addresses (248 records), subscription.cancelled (53 records), subscription.paused (15 records)
- **Recent Enhancements**:
  - **Order Tracking System**: New order.updated tab with real-time status changes
  - **Enhanced Products**: Short_name field for better dashboard display
  - **Extended Records**: +177 orders and +146 customers merged from extended_record.csv
- **Stripe Integration**: ✅ **ENHANCED** Complete payment ecosystem with historical and real-time data
  - Real-time webhook tracking via StripeTracking.js (payment_succesful/refund.created tabs)
  - **Enhanced Features**: API-based order number extraction, actual application fees, card details capture
  - **Data Quality**: Automated backfill functionality for missing payment data
- **Used By**: database_careportals_subscriptions.js, database_orders.js, StripeTracking.js, customer_support_order_tracking.js

#### Customer_Support.xlsx - ✅ **NEW** Customer support system
- **Spreadsheet ID**: `1h-ttn7R6s2KszovW_NvBI1x6fVUaXAjcID6-Xa0ISsw`
- **URL**: https://docs.google.com/spreadsheets/d/1h-ttn7R6s2KszovW_NvBI1x6fVUaXAjcID6-Xa0ISsw/edit
- **Web App**: https://script.google.com/macros/s/AKfycbxci3zpOxCyTHRLh47aje0nx9HrAUSvRFflDV8Kz8TSK1Ogst5w0Y_A-65xQMTOTsupdQ/exec
- **Key Sheets**: shipped (234 records), full_log (1876 records), awaiting_shipment (20 records)
- **Used By**: customer_support_order_tracking.js, messages_log_customer_support.js

#### Embeddables.xlsx - ✅ **UPDATED** Form submission tracking
- **Spreadsheet ID**: `1WVklvRZZqiVtVdD64IDm-vPSSvx-lv6QdXN9V8HC7hI`
- **Purpose**: Form submissions, page tracking, checkout sessions
- **Used By**: medication_v1_form_submissions.js, checkout_sessions_embeddables.js, page_tracker.js
- `extended_record.csv` - ✅ **NEW** Extended order and customer data (224 records)
- `order_tracking_system.xlsx` - Order tracking system data

## 📈 Dashboard Visualization Systems

**Location**: `/DashboardVisualization/`
**Status**: ✅ **PRODUCTION** Three complete dashboard systems + CLASP CLI Ready!

### 🚀 CLASP CLI Development Ready
**New Feature**: Edit dashboard code locally and deploy instantly!

#### CLASP-Enabled Dashboard Projects (Edit locally → Push to Apps Script)
- **Analytics Dashboard** - `/DashboardVisualization/Analytics/`
  - Edit: `Code.gs` + `dashboard.html`
  - Deploy: `cd DashboardVisualization/Analytics && clasp push`
- **Initial KPI Dashboard** - `/DashboardVisualization/InitialKPI/`
  - Edit: `Code.gs` + `kpi_dashboard.html`
  - Deploy: `cd DashboardVisualization/InitialKPI && clasp push`
- **Revenue Analytics** - `/DashboardVisualization/RevenueAnalytics/`
  - Edit: `RevenueAnalyticsCode.gs` + `revenue_analytics.html`
  - Deploy: `cd DashboardVisualization/RevenueAnalytics && clasp push`
- **Financial Dashboard** - `/DashboardVisualization/FinancialDashboard/`
  - Documentation: Complete development specifications and implementation guides
  - Status: **READY FOR IMPLEMENTATION** (Design phase complete)
- **Enhanced KPI Dashboard** - `/DashboardVisualization/EnhancedKPI/`
  - Purpose: **CRITICAL FIX** for unrealistic LTV calculations and improved healthcare KPI accuracy
  - Status: **READY FOR IMPLEMENTATION** (Addresses $3,231 LTV → realistic $150-$800)

### Analytics Notebooks
- `Healthcare_Reporting_Dashboard.ipynb` - ✅ Main healthcare analytics dashboard notebook
- `healthcare_analytics_findings.json` - Analytics findings and insights data

### 📊 Analytics Dashboard
**Location**: `/DashboardVisualization/Analytics/`  ✅ **CLI READY**
**Apps Script**: `DB_First_Visualization`
**Web App URL**: https://script.google.com/macros/s/AKfycbzo85VZL3NPBv3mNySOz0wAuPFnDK7L4zmNB7D6pzQSbzrpJXxAYJyJv-kY2ZP3i5X3/exec

**Components**:
- `Code.gs` - Apps Script backend with advanced data processing ✅ **EDITABLE LOCALLY**
- `dashboard.html` - Interactive dashboard with Chart.js visualizations ✅ **EDITABLE LOCALLY**
- `.clasp.json` - ✅ **NEW** CLI configuration for local development
- `IMPLEMENTATION_GUIDE.md` - Complete setup instructions
- `README.md` - System overview and features
- `SHORT_NAME_ENHANCEMENT.md` - Product name enhancement docs

**Key Features**:
- **📊 Real-time Metrics**: Subscription overview with KPIs
- **📈 Interactive Charts**: Trends, product distribution, geographic analysis, revenue analytics
- **🎨 Professional UI**: Modern glassmorphism design, mobile responsive
- **🔗 Google Sites Ready**: Embeddable with XFrame support
- **🎯 Product Enhancement**: Uses Short_name from products sheet for readable displays

### 🔍 Order Search System
**Location**: `/DashboardVisualization/OrderSearch/`  ✅ **CLI READY** (Already configured)
**Purpose**: Professional order search with cross-table data joining

**Components**:
- `OrderSearchCode.gs` - Apps Script search backend with cross-table joins ✅ **EDITABLE LOCALLY**
- `order_search.html` - Search interface and results display ✅ **EDITABLE LOCALLY**
- `.clasp.json` - ✅ CLI configuration for local development
- `ORDER_SEARCH_SETUP.md` - Complete setup and usage guide
- `README.md` - System overview

**Key Features**:
- **🔍 Multi-Type Search**: Order ID, customer name, all fields, date range
- **📅 Date Range Filtering**: Search orders within specific date periods
- **🔗 Cross-Table Joins**: Orders + customers + products data
- **📱 Professional UI**: Responsive design with smart form controls
- **⚡ Fast Results**: In-memory data processing with efficient lookups

### 💰 Revenue Analytics System
**Location**: `/DashboardVisualization/RevenueAnalytics/`  ✅ **CLI READY**
**Purpose**: Comprehensive revenue analysis with order-payment integration

**Components**:
- `RevenueAnalyticsCode.gs` - Apps Script backend with advanced revenue processing ✅ **EDITABLE LOCALLY**
- `revenue_analytics.html` - Interactive revenue dashboard with deep insights ✅ **EDITABLE LOCALLY**
- `.clasp.json` - ✅ **NEW** CLI configuration for local development
- `README.md` - Complete setup and usage guide

**Key Features**:
- **🔍 Deep Revenue Analysis**: Gross revenue, refunds, and net revenue with trends
- **📊 Order Source Insights**: First-time vs repeat customer revenue analysis
- **💸 Refund Intelligence**: Full vs partial refund analysis with timing patterns
- **📅 Flexible Date Ranges**: Yesterday, weekly, monthly, all-time, or custom ranges
- **🎯 Business Metrics**: Customer lifetime value, refund rates, conversion analysis
- **📈 Advanced Charts**: Revenue trends, source breakdowns, refund patterns
- **🔗 Data Integration**: Links orders → payments → refunds for complete analysis

### System Comparison
| Feature | Analytics | Order Search | Revenue Analytics |
|---------|-----------|--------------|-------------------|
| **Purpose** | Business insights | Order lookup | Revenue analysis |
| **Users** | Executives, analysts | Support, operations | Finance, executives |
| **Data** | Aggregated metrics | Individual records | Financial metrics |
| **Interface** | Charts & visualizations | Search & results table | Revenue dashboards |
| **Focus** | Subscriptions | Order details | Payment performance |

## 🔧 Scripts & Automation

**Location**: `/Scripts/`  
**README**: `/Scripts/README.md`

### Embeddables Data Extraction
- **Main Extractor**: `Scripts/Embeddables/embeddables_multi_funnel_extractor.py`
- **Test Filtering**: `Scripts/Embeddables/test_entries_exclusion.txt` (30+ filtered entries)
- **Usage**: Automated daily/weekly data extraction with clean, filtered results

### Data Processing & Analysis
- **Data Examination**: `Scripts/DataProcessing/examine_submissions_data.py`
- **Extended Records Merge**: `Scripts/DataProcessing/merge_extended_records.py` - ✅ **NEW** Merge CSV orders/customers into database
- **Database Updates**: `Scripts/DataProcessing/update_database_subscriptions.py` - Clean subscription data processing
- **Stripe Payment Processing**: `Scripts/DataProcessing/Stripe/` - ✅ **NEW** Stripe API integration
  - `stripe_exporter.py` - Historical charges and refunds data extraction
  - `stripe_charges.csv` - Complete charge history with order metadata linking
  - `stripe_refunds.csv` - Refund data with charge relationships
  - **Security**: API keys stored in .env file (excluded from git)
- **Notebook Updates**: `Scripts/Utilities/update_notebook_data_sources.py`
- **Demo Analysis**: `Scripts/DataProcessing/embeddable_analysis_demo.ipynb` - Embeddable data analysis demonstrations
- **Quality Assurance**: Automatic test entry filtering during processing

## 💳 Stripe Integration System

**Location**: `/AppScripts/CarePortals/StripeTracking.js`
**Documentation**: `/STRIPE_WEBHOOK_SYSTEM_UPDATE.md` ✅ **NEW**
**Status**: ✅ **PRODUCTION** - Enhanced webhook processing with API integration

### Recent Enhancements (September 17, 2025)
- **API Integration**: Automatic order number extraction via Stripe API calls
- **Field Corrections**: Fixed case-sensitive field mappings (`resourceId` vs `resourceID`)
- **Card Data Capture**: Reliable extraction of last 4 digits and brand from payment methods
- **Actual Application Fees**: Extract real Stripe fees instead of manual calculations
- **Error Handling**: Fixed charge API expansion errors for different payment types
- **Data Structure**: Removed redundant timestamp columns, optimized for essential data
- **Backfill Functionality**: Automated recovery of missing payment data

### Key Features
- **Real-time Processing**: Immediate webhook processing with <500ms latency
- **Data Completeness**: 99%+ field completion through API fallbacks
- **Error Recovery**: Robust error handling with detailed logging
- **Multi-Payment Support**: Handles all charge types (`ch_` and `py_` prefixes)
- **Security**: Encrypted API key storage and minimal data exposure

### Technical Documentation
- **Setup Guide**: `stripe_update.md` - Original implementation instructions
- **Complete Update**: `STRIPE_WEBHOOK_SYSTEM_UPDATE.md` - Comprehensive enhancement documentation
- **Troubleshooting**: `STRIPE_WEBHOOK_TROUBLESHOOTING.md` - Error resolution guide

## 🗂️ System Documentation

**Location**: `/SystemDocumentation/`

### Architecture Documentation
- `system_overview.md` - High-level system architecture
- `careportals_system.md` - CarePortals technical details  
- `embeddables_system.md` - Embeddables technical details

### Reference Materials
- `field_mapping.md` - Data field mappings and transformations
- `business_rules.md` - Business logic and validation rules
- `webhook_processing.md` - Webhook processing workflows

### Implementation Guides
- `ORDER_TRACKING_SYSTEM_DOCUMENTATION.md` - Complete guide for our new system

## 🔧 Tools & Utilities

**Location**: `/Tools/`

### Data Processors
- `csv_to_xlsx_converter.py` - General CSV to Excel converter
- `timezone_converter.py` - UTC to Eastern Time conversion utility

## 📋 Archive & Historical Files

**Location**: `/Archive/`

### Historical Documentation
- `DATABASE_UPDATE_CORRECTIONS.md` - Database update corrections from September 7, 2025
- `DATABASE_UPDATE_SUMMARY.md` - Database update summary documentation
- `DATABASE_UPDATE_FINAL_CORRECTIONS.md` - Final database update corrections
- `REORGANIZATION_SUMMARY.md` - System reorganization summary from September 6, 2025

**Location**: `/SystemDocumentation/Archive/`

### Extended Records Documentation
- `EXTENDED_RECORDS_MERGE_SUMMARY.md` - Summary of extended records merge process

## 🚀 CLASP CLI Development

**Setup Guide**: `/CLASP_CLI_SETUP_GUIDE.md`
**Deployment Summary**: `/CLASP_DEPLOYMENT_SUMMARY.md`

### Quick CLI Workflow
```bash
# 1. One-time setup
npm install -g @google/clasp
clasp login

# 2. Edit files locally (any text editor)
nano DashboardVisualization/Analytics/dashboard.html

# 3. Deploy changes instantly
cd DashboardVisualization/Analytics
clasp push

# 4. Changes are LIVE! 🎉
```

### CLASP-Ready Projects
| Project | Location | Edit Files | Deploy Command |
|---------|----------|------------|----------------|
| **StripeTracking** | `AppScripts/CarePortals/StripeTracking_clasp/` | `src/Code.gs` | `clasp push` |
| **Analytics Dashboard** | `DashboardVisualization/Analytics/` | `Code.gs`, `dashboard.html` | `clasp push` |
| **Initial KPI Dashboard** | `DashboardVisualization/InitialKPI/` | `Code.gs`, `kpi_dashboard.html` | `clasp push` |
| **Revenue Analytics** | `DashboardVisualization/RevenueAnalytics/` | `RevenueAnalyticsCode.gs`, `revenue_analytics.html` | `clasp push` |

## 🚀 Quick Start

### For Customer Support Order Tracking
1. **AppScript**: `/AppScripts/CarePortals/customer_support_order_tracking.js`
2. **Webhook JSON**: `/CarePortals/Webhooks/customer_support_order_tracking.json`  
3. **Live Sheet**: https://docs.google.com/spreadsheets/d/1h-ttn7R6s2KszovW_NvBI1x6fVUaXAjcID6-Xa0ISsw/edit
4. **Documentation**: `/SystemDocumentation/Guides/ORDER_TRACKING_SYSTEM_DOCUMENTATION.md`

### For Adding New Components
1. **Determine system**: CarePortals, Embeddables, or General
2. **Choose location**: Follow directory structure patterns
3. **Update indexes**: Add entries to relevant INDEX.md files
4. **Document**: Add to appropriate documentation sections

## 📋 Key Features

### ✅ Clean Organization
- Code separated from documentation
- System-based organization
- Clear naming conventions
- Comprehensive indexing

### ✅ Easy Navigation  
- Master index (this file)
- System-specific indexes  
- README files in major directories
- Consistent structure across systems

### ✅ Scalable Structure
- Easy to add new systems
- Clear patterns to follow
- Separation of concerns maintained
- Documentation co-located with relevant systems

---

**Last Updated**: Today  
**Version**: 1.0  
**Maintainer**: System Administrator

*This structure is designed to grow and remain organized as new systems and components are added.*