# KPI Dashboard External Data Sources

This document details all spreadsheet data sources used by the KPI Dashboard that are **NOT** the main Database_CarePortals spreadsheet.

## Summary

The KPI Dashboard uses **2 additional spreadsheets** beyond the main database:

1. **Customer_Support.xlsx** - For operational timing and shipment data
2. **CarePortals_Orders.xlsx** - For order flow and stage progression tracking

---

## 1. Customer Support Spreadsheet

**Spreadsheet ID:** `1h-ttn7R6s2KszovW_NvBI1x6fVUaXAjcID6-Xa0ISsw`
**File Name:** `Customer_Support.xlsx`

### Sheets Used:

#### Sheet: `shipped`
**Columns Extracted:**
- `Created At` (Date) - When the order was originally created
- `Updated At` (Date) - When the order was marked as shipped
- `Order ID` (String/Number) - Unique order identifier
- `Pharmacy` (String) - Pharmacy name (used for SevenCells filtering)

**Usage in KPIs:**
- **Purchase → Shipment Time**: Calculates hours between `Created At` and `Updated At`
- **SevenCells-specific timing**: Filters by `Pharmacy` containing "sevencells"

#### Sheet: `awaiting_shipment`
**Columns Extracted:**
- All columns (currently for count/status tracking)

**Usage in KPIs:**
- **Status counts** for operational metrics

#### Sheet: `awaiting_script`
**Columns Extracted:**
- All columns (currently for count/status tracking)

**Usage in KPIs:**
- **Status counts** for operational metrics

#### Sheet: `processing`
**Columns Extracted:**
- All columns (currently for count/status tracking)

**Usage in KPIs:**
- **Status counts** for operational metrics

#### Sheet: `full_log`
**Columns Extracted:**
- `Order #` (String/Number) - Order number identifier
- `Status` (String) - Current order status
- `Created Date` (Date) - When the log entry was first created
- `Last Update` (Date) - When the log entry was last updated
- `Pharmacy` (String) - Pharmacy name (used for filtering)

**Usage in KPIs:**
- **Purchase → Prescription timing**: Tracks progression from order creation through "awaiting_script" status
- **Prescription → Shipment timing**: Tracks transitions between statuses
- **SevenCells analysis**: Filters records by `Pharmacy` field
- **Status progression analysis**: Maps order lifecycle through various statuses

---

## 2. CarePortals Orders Spreadsheet

**Spreadsheet ID:** `1J62EOn9OXZzFpqcyw4egfjZe72gOpYJPohApUPmtoKM`
**File Name:** `CarePortals_Orders.xlsx`

### Sheets Used:

#### Sheet: `prescription.created`
**Columns Extracted:**
- All columns (currently reserved for future prescription tracking)

**Usage in KPIs:**
- **Future use** - Currently loaded but not actively used in calculations

#### Sheet: `order.created`
**Columns Extracted:**
- All columns (currently reserved for order creation tracking)

**Usage in KPIs:**
- **Future use** - Currently loaded but not actively used in calculations

#### Sheet: `order.updated`
**Columns Extracted:**
- `Order ID` (String/Number) - Unique order identifier
- `Status` (String) - Order status (awaiting_requirements, awaiting_script, awaiting_shipment, shipped, etc.)
- `Timestamp` (Date) - When the status update occurred

**Usage in KPIs:**
- **Stage timing calculations**: Tracks time between status changes
- **Order flow analysis**: Identifies orders that "go back" in the process
- **Core business flow tracking**: Monitors progression through 4 key stages:
  1. `awaiting_requirements`
  2. `awaiting_script`
  3. `awaiting_shipment`
  4. `shipped`
- **Operations metrics**: Calculates average time for each stage transition
- **Order completion analysis**: Filters for recent shipped orders with complete data

---

## Key Insights

### Data Relationships
- **Customer Support** provides **timing data** for completed orders
- **CarePortals Orders** provides **real-time status updates** during order processing
- Both spreadsheets use **Order ID** as the linking field to main database

### Critical Columns by Function

**For Timing Analysis:**
- Customer Support `shipped.Created At` + `shipped.Updated At`
- Customer Support `full_log.Created Date` + `full_log.Last Update`
- CarePortals Orders `order.updated.Timestamp`

**For Status Tracking:**
- Customer Support `full_log.Status`
- CarePortals Orders `order.updated.Status`

**For Pharmacy-Specific Analysis:**
- Customer Support `shipped.Pharmacy`
- Customer Support `full_log.Pharmacy`

**For Order Linking:**
- Customer Support `shipped.Order ID`
- Customer Support `full_log.Order #`
- CarePortals Orders `order.updated.Order ID`

### Data Dependencies
The KPI Dashboard will gracefully handle missing external spreadsheets:
- If Customer Support spreadsheet is unavailable: Uses default timing values
- If CarePortals Orders spreadsheet is unavailable: Skips advanced flow analysis
- Warning messages are logged but dashboard continues to function

---

*Document generated for KPI Dashboard version @19*
*Last updated: October 2025*