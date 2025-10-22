# Database Consolidation Plan for KPI Dashboard

This document outlines the data input systems needed to consolidate all external data sources into the main **Database_CarePortals** spreadsheet, making the KPI dashboard fully reliant on a single document.

## Current External Dependencies

Based on `KPI_DASHBOARD_EXTERNAL_DATA_SOURCES.md`, the dashboard currently relies on:
1. **Customer_Support.xlsx** (5 sheets)
2. **CarePortals_Orders.xlsx** (3 sheets)

## Required New Sheets in Database_CarePortals

### 1. Core Order Tracking Sheet

#### Sheet: `order.updated`
**Purpose:** Complete order status progression tracking (includes shipment events)
**Required Columns:**
- `order_id` (String/Number) - Links to existing `order.created.order_id`
- `status` (String) - Order status value (awaiting_requirements, awaiting_script, awaiting_shipment, shipped, etc.)
- `timestamp` (DateTime) - When status change occurred
- `pharmacy` (String) - Pharmacy handling the order
- `tracking_number` (String) - Only populated for 'shipped' status updates
- `updated_by` (String) - System/user making the update

**Webhook Needed:**
- **Source:** CarePortals system
- **Trigger:** `order.updated` event (includes ALL status changes including shipped)
- **Data:** Order ID, new status, timestamp, pharmacy, tracking (if shipped)

**Note:** This single sheet replaces both `order.updated` and `order.shipped` since shipped is just another status update.

### 2. Operational Status Sheets

#### Sheet: `order.status_log`
**Purpose:** Complete order lifecycle logging (replaces Customer Support full_log)
**Required Columns:**
- `order_id` (String/Number) - Links to existing orders
- `status` (String) - Current order status
- `created_date` (DateTime) - When log entry was created
- `last_update` (DateTime) - When status was last updated
- `pharmacy` (String) - Associated pharmacy
- `notes` (Text) - Additional status information

**Webhook Needed:**
- **Source:** Customer Support system OR CarePortals
- **Trigger:** Any status change event
- **Data:** Order ID, status, timestamps, pharmacy, notes

#### Sheet: `order.current_status`
**Purpose:** Current status counts (replaces awaiting_shipment, awaiting_script, processing sheets)
**Required Columns:**
- `order_id` (String/Number) - Links to existing orders
- `current_status` (String) - Current order status
- `status_since` (DateTime) - When order entered this status
- `pharmacy` (String) - Associated pharmacy
- `priority` (String) - Order priority level

**Webhook Needed:**
- **Source:** CarePortals system
- **Trigger:** `order.status_changed` event
- **Data:** Order ID, new status, timestamp, pharmacy

## Implementation Priority

### Phase 1: Critical Order Flow Data
1. **`order.updated`** - Essential for ALL operations metrics and timing calculations (includes shipped events)

### Phase 2: Enhanced Logging (Optional)
2. **`order.status_log`** - For detailed status progression (can duplicate order.updated data)
3. **`order.current_status`** - For real-time status counts (can be derived from order.updated)

## Webhook Implementation Guide

### 1. CarePortals Order Update Webhook (SINGLE WEBHOOK FOR ALL STATUS CHANGES)
```javascript
// Webhook endpoint: /webhook/order-updated
// Trigger: When ANY order status changes in CarePortals (including shipped)

// Example: Status change to awaiting_shipment
const webhookData = {
  order_id: "12345",
  status: "awaiting_shipment",
  timestamp: "2025-01-15T14:30:00Z",
  pharmacy: "SevenCells",
  previous_status: "awaiting_script",
  tracking_number: null, // Only for shipped status
  updated_by: "system"
};

// Example: Status change to shipped
const shippedWebhookData = {
  order_id: "12345",
  status: "shipped",
  timestamp: "2025-01-15T16:45:00Z",
  pharmacy: "SevenCells",
  previous_status: "awaiting_shipment",
  tracking_number: "1Z999AA1234567890", // Populated for shipped status
  updated_by: "system"
};

// Target: Database_CarePortals.order.updated (single sheet for all updates)
```

## Data Migration Strategy

### Step 1: Create New Sheet
- Add `order.updated` sheet to Database_CarePortals
- Set up proper column headers and data validation
- Optional: Add `order.status_log` and `order.current_status` for enhanced tracking

### Step 2: Historical Data Migration
- Export data from Customer_Support.xlsx and CarePortals_Orders.xlsx
- Transform and consolidate into `order.updated` sheet format
- Merge shipment data (shipped status) with other status updates
- Verify data integrity and relationships

### Step 3: Webhook Setup
- Implement single `order.updated` webhook in CarePortals system
- Test webhook delivery to Google Sheets
- Monitor for data accuracy and completeness

### Step 4: KPI Dashboard Update
- Update Code.gs to use new consolidated sheets
- Remove references to external spreadsheets
- Test all KPI calculations with new data sources

### Step 5: Validation & Cutover
- Run parallel processing for 1-2 weeks
- Compare results between old and new data sources
- Complete cutover once validated

## Benefits of Consolidation

1. **Single Source of Truth**: All data in Database_CarePortals
2. **Simplified Maintenance**: No external spreadsheet dependencies
3. **Better Performance**: Reduced API calls and faster data loading
4. **Improved Reliability**: Eliminates external spreadsheet access issues
5. **Enhanced Security**: Centralized access control

## Technical Requirements

### Google Sheets API Setup
- Enable Google Sheets API for webhook endpoints
- Set up proper authentication and permissions
- Implement rate limiting and error handling

### Webhook Infrastructure
- Deploy webhook receivers (Google Apps Script or external service)
- Implement data validation and transformation
- Add logging and monitoring for webhook delivery

### Data Validation
- Implement data type checking
- Add referential integrity checks (order_id links)
- Set up automated data quality monitoring

---

*Implementation plan for KPI Dashboard consolidation*
*Target: Single Database_CarePortals dependency*
*Status: Planning phase*