# Financial Dashboard Frontend Development Instructions

## 📋 Project Overview

Build a comprehensive financial dashboard that displays company finances and order volume metrics with period-over-period comparisons. The dashboard should be implemented as an HTML file that connects to a Google Spreadsheet data source.

## 🎯 Core Requirements

### Data Source
- **Input**: Google Spreadsheet with financial and order data
- **Security**: Must handle HIPAA-compliant data stored in secure Google Workspace
- **Access**: Create accompanying Google Apps Script (.gs) file if needed for spreadsheet access
- **Alternative**: Use any secure method to connect to Google Sheets data

### Output Format
- **Primary**: Single HTML file with embedded dashboard
- **Design**: Professional, responsive design suitable for executive viewing
- **Compatibility**: Works across desktop, tablet, and mobile devices

## 📊 Required Metrics (8 Core KPIs)

### 1. New Orders 📈
- **Data Type**: Count of new orders in selected time period
- **Visualization**: Large metric card with sparkline trend
- **Period Comparison**: Show percentage change vs previous period
- **Format**: Integer count with trend indicator

### 2. Cancellations 🚫
- **Data Type**: Count of cancelled orders in selected time period
- **Visualization**: Metric card with trend indicator
- **Period Comparison**: Cancellation rate percentage vs previous period
- **Format**: Integer count with percentage rate

### 3. Renewals 🔄
- **Data Type**: Count of subscription renewal orders
- **Visualization**: Metric card with renewal rate percentage
- **Period Comparison**: Renewal count and rate vs previous period
- **Format**: Integer count with percentage rate

### 4. Gross Revenue 💵
- **Data Type**: Total payments received before refunds
- **Visualization**: Large metric card with currency formatting
- **Period Comparison**: Revenue growth percentage
- **Format**: Currency ($XX,XXX) with growth indicator

### 5. Total Refunds 📉
- **Data Type**: Sum of refund amounts
- **Visualization**: Metric card with red accent, refund rate percentage
- **Period Comparison**: Refund amount and rate trends
- **Format**: Currency ($XX,XXX) with rate percentage

### 6. Net Revenue 💰
- **Data Type**: Gross revenue minus total refunds
- **Visualization**: Prominent metric card with margin percentage
- **Period Comparison**: Net revenue growth and margin trends
- **Format**: Currency ($XX,XXX) with margin percentage

### 7. Average Order Value (AOV) 💲
- **Data Type**: Mean order total amount
- **Visualization**: Metric card with trend comparison
- **Period Comparison**: AOV change percentage
- **Format**: Currency ($XXX.XX) with trend indicator

### 8. Active Subscriptions 📊
- **Data Type**: Count of currently active subscriptions
- **Visualization**: Metric card with subscription health indicator
- **Period Comparison**: Net change in active subscription count
- **Format**: Integer count with change indicator

## 📈 Required Charts (3 Supporting Visualizations)

### Chart 1: Revenue Trend (Line Chart)
- **Purpose**: Show gross vs net revenue over time
- **Type**: Line chart with two series (gross revenue, net revenue)
- **Time Axis**: Automatically bucket by day/week/month based on selected date range
- **Features**: Interactive tooltips, trend lines, legend
- **Colors**: Green for gross revenue, blue for net revenue

### Chart 2: Order Source Breakdown (Donut Chart)
- **Purpose**: Show new customer vs renewal order split
- **Type**: Donut chart with percentage labels
- **Categories**: New Customers, Renewals, Other
- **Features**: Interactive segments, percentage displays, center total
- **Colors**: Distinct colors for each category

### Chart 3: Monthly Trends Summary (Bar Chart)
- **Purpose**: Show key metrics by month for trend analysis
- **Type**: Multi-series bar chart
- **Metrics**: Orders, Revenue, Refunds for last 6 months
- **Features**: Multiple series, month labels, hover details
- **Colors**: Coordinated color scheme across metrics

## 🎨 UI Design Requirements

### Layout Structure
```
┌─────────────────────────────────────────────────────┐
│ Header: Time Period Selector + Last Updated         │
├─────────────┬─────────────┬─────────────┬───────────┤
│ New Orders  │ Gross Rev   │ Net Revenue │ Active    │
│ [Number]    │ [$Amount]   │ [$Amount]   │ Subs      │
│ [% Change]  │ [% Change]  │ [% Change]  │ [Change]  │
├─────────────┼─────────────┼─────────────┼───────────┤
│ Renewals    │ Refunds     │ AOV         │ Cancelled │
│ [Number]    │ [$Amount]   │ [$Amount]   │ [Count]   │
│ [% Change]  │ [% Change]  │ [% Change]  │ [% Change]│
├─────────────────────┬───────────────────────────────┤
│ Revenue Trend       │ Order Sources                 │
│ (Line Chart)        │ (Donut Chart)                 │
├─────────────────────────────────────────────────────┤
│ Monthly Trends (Bar Chart - Full Width)            │
└─────────────────────────────────────────────────────┘
```

### Color Scheme
- **Revenue Metrics**: Green (#10B981)
- **Refund/Cancellation Metrics**: Red (#EF4444)
- **Order Metrics**: Blue (#3B82F6)
- **Subscription Metrics**: Purple (#8B5CF6)
- **Background**: Professional light theme with subtle gradients

### Time Period Controls
**Required Options**:
- Yesterday
- Last 7 Days
- Last 30 Days
- This Month
- Custom Range (date picker)

**Default**: Last 30 Days

### Responsive Design
- **Desktop**: 4-column metric grid
- **Tablet**: 2-column metric grid
- **Mobile**: Single column layout
- **Charts**: Responsive sizing with touch-friendly interactions

## 🔧 Technical Specifications

### Frontend Technology
- **HTML5**: Semantic markup with proper accessibility
- **CSS3**: Modern styling with flexbox/grid layouts
- **JavaScript**: Vanilla JS or minimal libraries
- **Charts**: Use Chart.js library for visualizations
- **Responsive**: Mobile-first design approach

### Data Connection
- **Method 1**: Google Apps Script backend (.gs file) to fetch spreadsheet data
- **Method 2**: Google Sheets API direct connection (if simpler)
- **Format**: JSON data exchange between frontend and data source
- **Security**: Ensure HIPAA compliance in data handling

### Performance Requirements
- **Load Time**: <5 seconds initial load
- **Responsiveness**: <2 seconds for period changes
- **Mobile**: Optimized for 3G networks
- **Caching**: Implement appropriate data caching

### Data Processing
- **Date Filtering**: Filter data by selected time periods
- **Calculations**: Compute metrics from raw data
- **Comparisons**: Calculate period-over-period changes
- **Aggregation**: Group data by time periods for charts

## 💡 Expected Data Structure

The spreadsheet should contain tables with these types of data:

### Orders Data
- Order creation timestamps
- Order amounts
- Order sources (new customer vs renewal)
- Order status changes
- Cancellation information

### Payment Data
- Payment amounts
- Payment timestamps
- Success/failure status

### Refund Data
- Refund amounts
- Refund timestamps
- Associated payment references

### Subscription Data
- Active subscription counts
- Subscription status information

## 🎯 User Experience Goals

### Primary Users
- **Executives**: Quick financial overview
- **Finance Teams**: Detailed metrics analysis
- **Operations**: Period comparison insights

### Key Features
- **Intuitive Navigation**: Easy time period selection
- **Clear Metrics**: Large, readable metric displays
- **Trend Visualization**: Clear period-over-period comparisons
- **Mobile Friendly**: Full functionality on all devices

### Interaction Design
- **Hover Effects**: Detailed tooltips on charts
- **Period Selection**: Smooth transitions between time periods
- **Loading States**: Clear feedback during data loading
- **Error Handling**: Graceful degradation for missing data

## 📋 Implementation Deliverables

### Required Files
1. **main_dashboard.html** - Complete dashboard frontend
2. **data_connector.gs** - Google Apps Script for data access (if needed)
3. **styles.css** - Styling (can be embedded in HTML)
4. **scripts.js** - JavaScript functionality (can be embedded in HTML)

### Optional Enhancements
- **Export Functionality**: PDF/image export of dashboard
- **Print Optimization**: Print-friendly layout
- **Keyboard Navigation**: Accessibility compliance
- **Dark Mode**: Alternative color scheme

## 🔍 Testing Requirements

### Functionality Testing
- All 8 metrics display correctly
- Period selection changes data appropriately
- Charts render properly on all devices
- Period-over-period comparisons calculate correctly

### Performance Testing
- Load time under 5 seconds
- Responsive to user interactions
- Works on various browsers and devices
- Handles edge cases (no data, zero values)

### Security Testing
- Secure connection to Google Sheets
- No sensitive data exposure
- HIPAA compliance maintained
- Proper error handling

## 🎨 Visual Design Guidelines

### Professional Appearance
- Clean, modern design aesthetic
- Consistent spacing and typography
- Professional color palette
- Clear visual hierarchy

### Accessibility
- High contrast ratios
- Readable font sizes
- Proper heading structure
- Screen reader compatibility

### Brand Neutral
- Avoid specific company branding
- Use generic healthcare/financial styling
- Professional appearance suitable for executive presentation

---

**Implementation Goal**: Create a production-ready financial dashboard that provides immediate business value through clear visualization of key financial metrics with period-over-period analysis capabilities.