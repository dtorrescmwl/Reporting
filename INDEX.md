# Reporting System - Master Index

Welcome to the complete reporting and automation system. This index provides a comprehensive overview of all components and their locations.

## 🗂️ Directory Structure

```
New_Structure/
├── 📜 AppScripts/           # All Google Apps Scripts
├── 🏥 CarePortals/          # CarePortals EMR/CRM system
├── 🔗 Embeddables/          # Embeddable forms and tools
├── 📊 GoogleSheets/         # Live sheets with real data
├── 🗂️ SystemDocumentation/  # Technical documentation
└── 🔧 Tools/               # Utilities and processors
```

## 📜 AppScripts

**Location**: `/AppScripts/`  
**Index**: `/AppScripts/INDEX.md`

### 🏥 CarePortals Scripts
- `customer_support_order_tracking.js` - Real-time order tracking for customer support
- `database_orders.js` - Order processing and database normalization
- `cancelled_subscriptions.js` - Subscription cancellation handling
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
- `customer_support_order_tracking.json` - Our new automation
- `careportals_orders_original.csv` - Source data  
- `Customer_Support.xlsx` - Template for new implementations

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

### Live Sheets with Real Data
- `CarePortals_Orders.xlsx` - Main order processing data
- `Database_CarePortals.xlsx` - Normalized database structure
- `Customer_Support.xlsx` - **Our new customer support system**  
  - **URL**: https://docs.google.com/spreadsheets/d/1h-ttn7R6s2KszovW_NvBI1x6fVUaXAjcID6-Xa0ISsw/edit
  - **Web App**: https://script.google.com/macros/s/AKfycbxci3zpOxCyTHRLh47aje0nx9HrAUSvRFflDV8Kz8TSK1Ogst5w0Y_A-65xQMTOTsupdQ/exec
- `Embeddables.xlsx` - Form submission tracking

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