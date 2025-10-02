# Healthcare KPI Dashboard - Complete Implementation Guide

## 📋 Overview
This comprehensive healthcare business intelligence dashboard provides real-time metrics tracking for the CarePortals telehealth system. The dashboard extracts data from multiple Google Sheets, calculates 15+ core business KPIs, and presents them through an interactive web interface with professional visualizations.

**Key Features:**
- ✅ Real-time multi-spreadsheet data integration
- ✅ Clean core business flow tracking (0.48% going back rate)
- ✅ Accurate revenue metrics (gross + net revenue)
- ✅ Subscription-based medication adherence tracking
- ✅ Interactive time period selection
- ✅ Professional Chart.js visualizations
- ✅ Mobile-responsive design

## 🎯 Implemented KPIs

### Growth & Revenue Metrics (9 KPIs)
- ✅ **New Patient Enrollments** - Patients enrolled in selected time period
- ✅ **Active Patients** - Total patients with active subscriptions (185 current)
- ✅ **Monthly Recurring Revenue (MRR)** - Total recurring subscription revenue ($73,676)
- ✅ **Average Revenue per Patient (ARPU)** - MRR divided by active patients ($398.25)
- ✅ **Gross Revenue** - Total payments received ($160,868)
- ✅ **Net Revenue** - Gross revenue minus refunds
- ✅ **Pause Rate** - Percentage of subscriptions in paused state
- ✅ **Churn Rate** - Percentage of subscriptions cancelled in time period (12.32%)
- ✅ **Lifetime Value (LTV)** - Calculated using ARPU and churn rate ($3,231.94)

### Operations & Logistics Metrics (4 KPIs)
- ✅ **Purchase → Script Time** - Processing from order to prescription approval
- ✅ **Script → Shipment Time** - Time from prescription to awaiting shipment
- ✅ **Shipment → Shipped Time** - Final fulfillment processing time
- ✅ **Total Order Time** - Complete order-to-delivery timeline

### Core Business Flow Metrics (2 KPIs)
- ✅ **Going Back Rate** - Orders moving backwards in core flow (0.48% - realistic rate)
- ✅ **Total Orders Analyzed** - Recent shipped orders with complete tracking (210 orders)

### Clinical & Patient Success Metrics (1 KPI)
- ✅ **Medication Adherence** - Subscriptions staying active 90+ days (subscription-based tracking)

## 📊 Data Sources & Architecture

### Multi-Spreadsheet Integration System
The dashboard integrates data from **3 core Google Sheets** to provide comprehensive business intelligence:

### 1. Primary Database: Database_CarePortals.xlsx
**Spreadsheet ID**: `1PaCOgNJmKSb2VsJjCMjWpCG-gwrO7uVkuTAFUdrV-_o`

**Core Business Data Sheets:**
- **subscription.active** (185 records) - Active subscription tracking with status, product assignments, and revenue calculations
- **customers** (218 records) - Patient information, enrollment dates, contact details
- **order.created** (290 records) - Order initiation data with timestamps, order IDs, customer mapping, and product assignments
- **products** (22 records) - Product catalog with pricing (sale/renewal), cycle durations, and revenue calculations
- **payment_succesful** (330 records) - Payment processing data with amounts, timestamps, and transaction details
- **order.cancelled** (27 records) - Cancellation tracking for churn analysis
- **subscription.paused** (4 records) - Subscription pause data for pause rate calculations
- **subscription.cancelled** (26 records) - Cancelled subscription history for churn and LTV analysis

### 2. Operational Tracking: Customer_Support.xlsx
**Spreadsheet ID**: `1h-ttn7R6s2KszovW_NvBI1x6fVUaXAjcID6-Xa0ISsw`

**Operational Status Sheets:**
- **shipped** (241 records) - Completed shipments with processing times and delivery tracking
- **awaiting_shipment** (21 records) - Orders ready for fulfillment
- **awaiting_script** (2 records) - Orders awaiting prescription processing
- **processing** (1 record) - Orders in active processing
- **full_log** (1,947 records) - Complete order status transition history for operational analytics

### 3. Order Flow Tracking: CarePortals_Orders.xlsx
**Spreadsheet ID**: `1J62EOn9OXZzFpqcyw4egfjZe72gOpYJPohApUPmtoKM`

**Core Flow Analysis Sheets:**
- **order.updated** (3,432 records) - Complete order status transition log with timestamps
- **prescription.created** (158 records) - Prescription approval tracking
- **order.created** - Order initiation from CarePortals system

### Data Relationships & Foreign Keys
**Primary Linking Strategy:**
- **Customer ID** → Links subscriptions, orders, and payments across all sheets
- **Order ID** → Links order.created (Database_CarePortals) ↔ order.updated (CarePortals_Orders)
- **Product ID** → Links subscriptions to product pricing and details

**Data Overlap Analysis:**
- **Orders in Database_CarePortals**: 290 orders (range: 1669-2000)
- **Orders in CarePortals_Orders**: 362 unique orders (range: 101-1927)
- **Overlapping Orders**: 207 orders with complete tracking data
- **Recent Complete Orders**: 210 orders (last 60 days with full progression tracking)

## 🏗️ Technical Architecture

### Backend: Google Apps Script (Code.gs)
**File Size**: 58KB (2,200+ lines)
**Core Functions**: 25+ specialized calculation functions

**Key Backend Components:**
1. **Data Extraction Layer**
   - `getSheetData()` - Generic sheet data reader with error handling
   - Multi-spreadsheet connection management
   - Automatic field mapping and data type conversion

2. **KPI Calculation Engine**
   - `calculateGrowthRevenueKPIs()` - Revenue, MRR, ARPU, LTV calculations
   - `calculateOperationsKPIs()` - Timing and operational metrics
   - `calculateClinicalKPIs()` - Medication adherence using subscription data
   - `calculateCoreOrderStageFlow()` - Clean business flow analysis

3. **Core Business Flow Logic**
   - **4-Stage Model**: `awaiting_requirements → awaiting_script → awaiting_shipment → shipped`
   - **Going Back Detection**: Identifies backwards movement in core stages
   - **Recent Orders Filter**: Focuses on last 60 days with complete tracking
   - **Data Quality Filter**: Only processes orders with creation data + full progression

4. **Data Processing Features**
   - **Inter-spreadsheet Linking**: Uses Order ID as foreign key
   - **Caching System**: 5-minute cache for performance optimization
   - **Error Handling**: Graceful degradation with meaningful error messages
   - **Time Period Support**: Daily, Weekly, Monthly, Quarterly, Annual analysis

### Frontend: Interactive Dashboard (kpi_dashboard.html)
**File Size**: 36KB (1,200+ lines)
**Framework**: Vanilla JavaScript + Chart.js

**Frontend Features:**
1. **Responsive Design**
   - Mobile-first glassmorphism UI
   - Adaptive layout for all screen sizes
   - Professional color scheme with healthcare branding

2. **Interactive Charts**
   - Chart.js integration for professional visualizations
   - Real-time data updates
   - Interactive legends and tooltips
   - Responsive chart resizing

3. **Time Period Controls**
   - Dynamic period selection (Daily → Annual)
   - Automatic data refresh on period change
   - Loading states and progress indicators

4. **Performance Optimization**
   - Lazy loading for chart initialization
   - Debounced API calls
   - Efficient DOM manipulation
   - Optimized for large datasets

### Data Extraction Process

#### Step 1: Multi-Spreadsheet Connection
```javascript
// Primary database connection
const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
const supportSs = SpreadsheetApp.openById(CUSTOMER_SUPPORT_SPREADSHEET_ID);
const carePortalsSs = SpreadsheetApp.openById(CAREPORTALS_ORDERS_SPREADSHEET_ID);
```

#### Step 2: Data Loading & Mapping
```javascript
const data = {
  // Core business data
  subscriptions: getSheetData(ss, 'subscription.active'),
  customers: getSheetData(ss, 'customers'),
  orders: getSheetData(ss, 'order.created'),

  // Operational data
  shipped: getSheetData(supportSs, 'shipped'),

  // Flow tracking data
  orderUpdated: getSheetData(carePortalsSs, 'order.updated')
};
```

#### Step 3: Core Flow Filtering
```javascript
// Filter for recent shipped orders with complete tracking
const qualifyingOrders = orders.filter(order => {
  return hasCreationData && hasShipped &&
         hasProgression && hasKeyStages && isRecent;
});
```

#### Step 4: KPI Calculations
- **Revenue Metrics**: MRR calculation using product pricing + subscription status
- **Flow Metrics**: Stage progression analysis with backwards movement detection
- **Adherence**: Subscription duration analysis (90+ day tracking)
- **Operational**: Inter-spreadsheet timing calculations

## 🚀 Deployment Guide

### Prerequisites
1. **Google Apps Script Project** with access to the 3 source spreadsheets
2. **Spreadsheet Access**: Editor permissions on all 3 Google Sheets
3. **Google Apps Script APIs**: Enabled Sheets API and HTML Service

### Step 1: Deploy Backend (Code.gs)
1. Create new Google Apps Script project
2. Copy entire `Code.gs` content (58KB)
3. Configure the 3 spreadsheet IDs at the top:
   ```javascript
   const SPREADSHEET_ID = '1PaCOgNJmKSb2VsJjCMjWpCG-gwrO7uVkuTAFUdrV-_o';
   const CUSTOMER_SUPPORT_SPREADSHEET_ID = '1h-ttn7R6s2KszovW_NvBI1x6fVUaXAjcID6-Xa0ISsw';
   const CAREPORTALS_ORDERS_SPREADSHEET_ID = '1J62EOn9OXZzFpqcyw4egfjZe72gOpYJPohApUPmtoKM';
   ```

### Step 2: Deploy Frontend (HTML)
1. Add new HTML file named `kpi_dashboard`
2. Copy entire `kpi_dashboard.html` content (36KB)
3. Set up web app deployment:
   - Execute as: Me
   - Access: Anyone with link (or organization)

### Step 3: Testing & Validation
**Run these test functions to validate deployment:**

1. **Core Flow Test** (Recommended):
   ```javascript
   runCoreOrderFlowTest()
   ```
   **Expected Results:**
   - 210 orders analyzed
   - 0.48% going back rate
   - Clean core stage progression

2. **Comprehensive Data Test**:
   ```javascript
   runComprehensiveDataTest()
   ```
   **Expected Results:**
   - All 3 spreadsheets connected
   - 185 active subscriptions
   - $73,676 MRR
   - 71.11% adherence rate

### Step 4: Performance Optimization
- **Caching**: 5-minute cache automatically enabled
- **Error Handling**: Built-in graceful degradation
- **Load Time**: Typical response ~3-5 seconds for full KPI calculation

## 📈 Dashboard Features & Display

### Main Dashboard View
**Layout**: 4-column responsive grid with glassmorphism design

**KPI Categories:**
1. **Growth & Revenue Panel** (Top Left)
   - Active Patients: 185
   - MRR: $73,676
   - ARPU: $398.25
   - Gross Revenue: $160,868
   - Net Revenue: (After refunds)
   - Churn Rate: 12.32%
   - LTV: $3,231.94

2. **Operations Panel** (Top Right)
   - Purchase → Script: ~65 hours
   - Script → Shipment: ~30 hours
   - Shipment → Shipped: ~99 hours
   - Total Order Time: ~178 hours

3. **Flow Analysis Panel** (Bottom Left)
   - Going Back Rate: 0.48%
   - Orders Analyzed: 210
   - Core Stage Progression Charts

4. **Clinical Panel** (Bottom Right)
   - Medication Adherence: (90+ day tracking)
   - Subscription Duration Analysis

### Interactive Features
- **Time Period Selector**: Daily/Weekly/Monthly/Quarterly/Annual
- **Real-time Updates**: Auto-refresh on period change
- **Chart Interactions**: Hover tooltips, zoom, pan
- **Mobile Responsive**: Full functionality on all devices

### Data Quality Indicators
- **Sample Sizes**: Displayed for each metric
- **Data Freshness**: Last updated timestamp
- **Coverage**: Percentage of orders with complete tracking

## 🔧 Maintenance & Updates

### Regular Maintenance Tasks
1. **Monthly**: Review data quality and sample sizes
2. **Quarterly**: Validate spreadsheet connections
3. **As Needed**: Update spreadsheet IDs if sheets change

### Data Quality Monitoring
- **Core Flow Analysis**: Should maintain ~0.5% going back rate
- **Adherence Tracking**: Sample size will grow as business matures
- **Revenue Accuracy**: Gross vs Net revenue tracking

### Troubleshooting Common Issues
1. **"No data" errors**: Check spreadsheet permissions
2. **High going back rates**: Verify core stage filtering logic
3. **Zero adherence**: Normal for businesses < 90 days old
4. **Timeout errors**: Check caching system and data volume

## 📊 KPI Calculation Methodologies

### Revenue Calculations
- **MRR**: Sum of active subscription renewal prices
- **ARPU**: MRR ÷ Active Subscriptions
- **LTV**: ARPU ÷ (Churn Rate ÷ 100)
- **Net Revenue**: Gross Payments - Total Refunds

### Flow Analysis (Core Innovation)
- **4-Stage Model**: Only tracks business-critical stages
- **Going Back**: Stage number decrease (e.g., shipment → requirements)
- **Quality Filter**: Recent (60 days) + Complete tracking + Creation data

### Adherence Methodology
- **Subscription-Based**: Tracks subscription duration, not order frequency
- **90-Day Threshold**: Industry standard for medication adherence
- **Active + Cancelled**: Includes both current and historical adherence

## 🎯 Business Impact & Key Achievements

### Dashboard Accomplishments
1. **✅ Accurate Flow Analysis**: Reduced false positive going back rate from 96% to 0.48%
2. **✅ Multi-Spreadsheet Integration**: Successfully linked 3 data sources with 3,400+ records
3. **✅ Revenue Transparency**: Separate gross ($160,868) and net revenue tracking
4. **✅ Real-time Insights**: Sub-5-second response times with caching optimization
5. **✅ Data Quality Focus**: Only processes 210 orders with complete tracking data

### Business Metrics Summary (Current State)
- **Active Patients**: 185 (healthy growth trajectory)
- **Monthly Recurring Revenue**: $73,676
- **Average Revenue per Patient**: $398.25
- **Customer Lifetime Value**: $3,231.94
- **Churn Rate**: 12.32% (within industry standards)
- **Core Flow Efficiency**: 99.52% orders progress forward smoothly

### Technical Innovations
1. **Clean Core Flow Logic**: 4-stage business model ignoring operational noise
2. **Inter-Spreadsheet Foreign Keys**: Robust order linking across data sources
3. **Quality-First Filtering**: Recent + complete data focus for accuracy
4. **Subscription-Based Adherence**: More accurate than order-frequency models

---

## 📞 Support & Contact

**System Owner**: Healthcare KPI Dashboard Team
**Last Updated**: September 2025
**Version**: 1.0 (Production Ready)

**For Technical Issues**:
- Run diagnostic tests: `runCoreOrderFlowTest()`
- Check data connections in Google Apps Script
- Verify spreadsheet permissions

**For Business Questions**:
- Review KPI methodology section
- Validate sample sizes and data quality indicators
- Consult core flow analysis for operational insights
