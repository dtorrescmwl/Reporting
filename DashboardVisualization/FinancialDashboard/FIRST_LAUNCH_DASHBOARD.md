# Financial Dashboard - First Launch Implementation

## 🎯 Overview

This document specifies a minimal viable financial dashboard that provides maximum data value in an easily implementable HTML format. It focuses on 8 core metrics that can be calculated efficiently using `Database_CarePortals.xlsx` data.

**Implementation Target**: Single HTML file with embedded Google Apps Script backend
**Data Source**: `Database_CarePortals.xlsx` only (no order.cancelled dependencies)
**Performance Goal**: <5 second load time, responsive design

---

## 📊 Core Metrics (8 Essential KPIs)

### 1. New Orders 📈
**Calculation**: Count of orders in selected period
```javascript
// Data Source: order.created sheet
const newOrders = orderData.filter(order => {
  const orderDate = new Date(order.created_at);
  return orderDate >= startDate && orderDate <= endDate;
}).length;
```
**Data Type**: `order.created.created_at` (datetime64[ns])
**Visualization**: Large metric card with sparkline trend
**Period Comparison**: Count vs previous equal period

### 2. Cancellations 🚫
**Calculation**: Orders with cancelled status from order.updated
```javascript
// Data Source: order.updated sheet
const cancellations = orderUpdatedData.filter(update => {
  const updateDate = new Date(update['Datetime Updated']);
  const isCancelled = update.updated_status &&
    (update.updated_status.toLowerCase().includes('cancelled') ||
     update.updated_status.toLowerCase().includes('deleted'));
  return updateDate >= startDate && updateDate <= endDate && isCancelled;
});
// Get unique order IDs to avoid double counting
const uniqueCancelledOrders = [...new Set(cancellations.map(c => c.order_id))];
```
**Data Type**: `order.updated.updated_status` (object), `order.updated.Datetime Updated` (datetime64[ns])
**Visualization**: Metric card with trend indicator
**Period Comparison**: Cancellation rate percentage vs previous period

### 3. Renewals 🔄
**Calculation**: Orders from subscription source
```javascript
// Data Source: order.created sheet
const renewals = orderData.filter(order => {
  const orderDate = new Date(order.created_at);
  const isRenewal = order.source === 'subscription_cycle';
  return orderDate >= startDate && orderDate <= endDate && isRenewal;
}).length;
```
**Data Type**: `order.created.source` (object), `order.created.created_at` (datetime64[ns])
**Visualization**: Metric card with renewal rate percentage
**Period Comparison**: Renewal count and rate vs previous period

### 4. Gross Revenue 💵
**Calculation**: Sum of successful payments
```javascript
// Data Source: payment_succesful sheet
const grossRevenue = paymentData.filter(payment => {
  const paymentDate = new Date(payment.datetime);
  return paymentDate >= startDate && paymentDate <= endDate;
}).reduce((sum, payment) => sum + (payment.amount || 0), 0);
```
**Data Type**: `payment_succesful.amount` (int64), `payment_succesful.datetime` (datetime64[ns])
**Visualization**: Large metric card with currency formatting ($XX,XXX)
**Period Comparison**: Revenue growth percentage

### 5. Total Refunds 📉
**Calculation**: Sum of refund amounts
```javascript
// Data Source: refund.created sheet
const totalRefunds = refundData.filter(refund => {
  const refundDate = new Date(refund.datetime);
  return refundDate >= startDate && refundDate <= endDate;
}).reduce((sum, refund) => sum + (refund.amount || 0), 0);
```
**Data Type**: `refund.created.amount` (float64), `refund.created.datetime` (datetime64[ns])
**Visualization**: Metric card with red accent, refund rate percentage
**Period Comparison**: Refund amount and rate trends

### 6. Net Revenue 💰
**Calculation**: Gross revenue minus refunds
```javascript
// Calculated from metrics 4 and 5
const netRevenue = grossRevenue - totalRefunds;
const netMargin = grossRevenue > 0 ? ((netRevenue / grossRevenue) * 100) : 0;
```
**Data Type**: Calculated from payment_succesful.amount - refund.created.amount
**Visualization**: Prominent metric card with margin percentage
**Period Comparison**: Net revenue growth and margin trends

### 7. Average Order Value (AOV) 💲
**Calculation**: Mean order total amount
```javascript
// Data Source: order.created sheet
const ordersInPeriod = orderData.filter(order => {
  const orderDate = new Date(order.created_at);
  return orderDate >= startDate && orderDate <= endDate;
});
const totalOrderValue = ordersInPeriod.reduce((sum, order) => sum + (order.total_amount || 0), 0);
const aov = ordersInPeriod.length > 0 ? totalOrderValue / ordersInPeriod.length : 0;
```
**Data Type**: `order.created.total_amount` (int64)
**Visualization**: Metric card with trend comparison
**Period Comparison**: AOV change percentage

### 8. Active Subscriptions 📊
**Calculation**: Count of active subscriptions
```javascript
// Data Source: subscription.active sheet
const activeSubscriptions = subscriptionData.filter(sub => {
  return sub.Status && sub.Status.toLowerCase() === 'active';
}).length;
```
**Data Type**: `subscription.active.Status` (object)
**Visualization**: Metric card with subscription health indicator
**Period Comparison**: Net change in active subscription count

---

## 📈 Supporting Visualizations (3 Charts)

### Chart 1: Revenue Trend (Line Chart)
**Purpose**: Show gross vs net revenue over time
**Data Calculation**:
```javascript
// Group payments and refunds by day/week/month based on date range
const dailyData = {};
// Process payments
paymentData.forEach(payment => {
  const date = formatDateKey(payment.datetime, timeBucket);
  if (!dailyData[date]) dailyData[date] = { gross: 0, refunds: 0 };
  dailyData[date].gross += payment.amount || 0;
});
// Process refunds
refundData.forEach(refund => {
  const date = formatDateKey(refund.datetime, timeBucket);
  if (!dailyData[date]) dailyData[date] = { gross: 0, refunds: 0 };
  dailyData[date].refunds += refund.amount || 0;
});
// Calculate net for each period
Object.keys(dailyData).forEach(date => {
  dailyData[date].net = dailyData[date].gross - dailyData[date].refunds;
});
```
**Chart Configuration**: Chart.js line chart with two series (gross, net)

### Chart 2: Order Source Breakdown (Donut Chart)
**Purpose**: Show new customer vs renewal order split
**Data Calculation**:
```javascript
const sourceBreakdown = {
  'New Customers': 0,
  'Renewals': 0,
  'Other': 0
};
ordersInPeriod.forEach(order => {
  if (order.source === 'checkout') {
    sourceBreakdown['New Customers']++;
  } else if (order.source === 'subscription_cycle') {
    sourceBreakdown['Renewals']++;
  } else {
    sourceBreakdown['Other']++;
  }
});
```
**Chart Configuration**: Chart.js donut chart with percentage labels

### Chart 3: Monthly Trends Summary (Bar Chart)
**Purpose**: Show key metrics by month for trend analysis
**Data Calculation**:
```javascript
// Calculate monthly aggregates for last 6 months
const monthlyMetrics = {};
for (let i = 5; i >= 0; i--) {
  const monthDate = new Date();
  monthDate.setMonth(monthDate.getMonth() - i);
  const monthKey = monthDate.toISOString().substring(0, 7); // YYYY-MM

  monthlyMetrics[monthKey] = {
    orders: calculateNewOrdersForMonth(monthDate),
    revenue: calculateRevenueForMonth(monthDate),
    refunds: calculateRefundsForMonth(monthDate)
  };
}
```
**Chart Configuration**: Chart.js bar chart with multiple series

---

## 🔧 Technical Implementation Specifications

### Data Loading Function
```javascript
function loadFinancialDashboardData() {
  const spreadsheet = SpreadsheetApp.openById(DATABASE_CAREPORTALS_ID);

  return {
    orders: getSheetData(spreadsheet, 'order.created'),
    orderUpdates: getSheetData(spreadsheet, 'order.updated'),
    payments: getSheetData(spreadsheet, 'payment_succesful'),
    refunds: getSheetData(spreadsheet, 'refund.created'),
    subscriptions: getSheetData(spreadsheet, 'subscription.active')
  };
}
```

### Date Range Processing
```javascript
function getDateRange(period) {
  const today = new Date();
  const ranges = {
    'yesterday': {
      start: new Date(today.getTime() - 24*60*60*1000),
      end: new Date(today.getTime() - 24*60*60*1000)
    },
    'last7days': {
      start: new Date(today.getTime() - 7*24*60*60*1000),
      end: today
    },
    'last30days': {
      start: new Date(today.getTime() - 30*24*60*60*1000),
      end: today
    },
    'thismonth': {
      start: new Date(today.getFullYear(), today.getMonth(), 1),
      end: today
    }
  };
  return ranges[period] || ranges['last30days'];
}
```

### Main Calculation Function
```javascript
function calculateFinancialMetrics(data, startDate, endDate) {
  // Filter data by date range
  const ordersInPeriod = filterByDateRange(data.orders, 'created_at', startDate, endDate);
  const paymentsInPeriod = filterByDateRange(data.payments, 'datetime', startDate, endDate);
  const refundsInPeriod = filterByDateRange(data.refunds, 'datetime', startDate, endDate);

  // Calculate core metrics
  const metrics = {
    newOrders: ordersInPeriod.length,
    grossRevenue: paymentsInPeriod.reduce((sum, p) => sum + (p.amount || 0), 0),
    totalRefunds: refundsInPeriod.reduce((sum, r) => sum + (r.amount || 0), 0),
    renewals: ordersInPeriod.filter(o => o.source === 'subscription_cycle').length,
    activeSubscriptions: data.subscriptions.filter(s => s.Status === 'active').length
  };

  // Calculate derived metrics
  metrics.netRevenue = metrics.grossRevenue - metrics.totalRefunds;
  metrics.aov = metrics.newOrders > 0 ?
    ordersInPeriod.reduce((sum, o) => sum + (o.total_amount || 0), 0) / metrics.newOrders : 0;
  metrics.refundRate = metrics.grossRevenue > 0 ?
    (metrics.totalRefunds / metrics.grossRevenue) * 100 : 0;

  // Calculate cancellations from order.updated
  const cancellations = data.orderUpdates.filter(update => {
    const updateDate = new Date(update['Datetime Updated']);
    const isCancelled = update.updated_status &&
      update.updated_status.toLowerCase().includes('cancelled');
    return updateDate >= startDate && updateDate <= endDate && isCancelled;
  });
  metrics.cancellations = [...new Set(cancellations.map(c => c.order_id))].length;

  return metrics;
}
```

---

## 🎨 UI Layout Specification

### Header Section
- **Time Period Selector**: Dropdown with preset ranges
- **Last Updated**: Timestamp of data refresh
- **Refresh Button**: Manual data reload

### Metrics Grid (2x4 Layout)
```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│ New Orders  │ Gross Rev   │ Net Revenue │ Active Subs │
│ [Number]    │ [$Amount]   │ [$Amount]   │ [Count]     │
│ [% Change]  │ [% Change]  │ [% Change]  │ [Change]    │
├─────────────┼─────────────┼─────────────┼─────────────┤
│ Renewals    │ Refunds     │ AOV         │ Cancelled   │
│ [Number]    │ [$Amount]   │ [$Amount]   │ [Count]     │
│ [% Change]  │ [% Change]  │ [% Change]  │ [% Change]  │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

### Charts Section
```
┌──────────────────────────────────────┬─────────────────────┐
│ Revenue Trend (Line Chart)           │ Order Sources       │
│                                      │ (Donut Chart)       │
├──────────────────────────────────────┼─────────────────────┤
│ Monthly Trends (Bar Chart - Full Width)                    │
└─────────────────────────────────────────────────────────────┘
```

### Color Scheme
- **Revenue Metrics**: Green (#10B981)
- **Refund/Cancellation Metrics**: Red (#EF4444)
- **Order Metrics**: Blue (#3B82F6)
- **Subscription Metrics**: Purple (#8B5CF6)

---

## ⚡ Performance Optimizations

### Data Caching
```javascript
// Cache data for 5 minutes to improve performance
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const cache = CacheService.getScriptCache();

function getCachedData(cacheKey) {
  const cached = cache.get(cacheKey);
  return cached ? JSON.parse(cached) : null;
}

function setCachedData(cacheKey, data) {
  cache.put(cacheKey, JSON.stringify(data), CACHE_DURATION / 1000);
}
```

### Efficient Date Filtering
```javascript
function filterByDateRange(data, dateField, startDate, endDate) {
  const startTime = startDate.getTime();
  const endTime = endDate.getTime();

  return data.filter(row => {
    const rowDate = new Date(row[dateField]);
    const rowTime = rowDate.getTime();
    return rowTime >= startTime && rowTime <= endTime;
  });
}
```

---

## 🚀 Deployment Checklist

### Backend Setup (Google Apps Script)
- [ ] Create new Apps Script project
- [ ] Set `DATABASE_CAREPORTALS_ID` constant
- [ ] Copy calculation functions
- [ ] Test with `calculateFinancialMetrics()` function
- [ ] Deploy as web app with public access

### Frontend Setup (HTML)
- [ ] Create responsive HTML structure
- [ ] Include Chart.js library
- [ ] Implement metric cards with proper formatting
- [ ] Add time period selector
- [ ] Test mobile responsiveness

### Data Validation
- [ ] Verify metric calculations against manual counts
- [ ] Test edge cases (no data, zero values)
- [ ] Validate date range filtering
- [ ] Confirm period-over-period comparisons

### Performance Testing
- [ ] Measure load time (<5 seconds target)
- [ ] Test with full dataset (5,100+ records)
- [ ] Verify caching functionality
- [ ] Check mobile performance

---

## 📋 Success Criteria

### Functional Requirements
- ✅ All 8 core metrics display correctly
- ✅ Period selection works across all metrics
- ✅ Charts render properly on all devices
- ✅ Data updates in real-time when period changes

### Performance Requirements
- ✅ Initial load time <5 seconds
- ✅ Period change response <2 seconds
- ✅ Mobile responsiveness on tablets and phones
- ✅ Graceful handling of missing data

### Business Value Requirements
- ✅ Provides clear financial overview at a glance
- ✅ Enables quick period-over-period analysis
- ✅ Identifies trends in key business metrics
- ✅ Supports executive decision making

---

This first launch dashboard provides immediate business value while maintaining implementation simplicity. It focuses on the most critical financial metrics and can be built efficiently using the existing Database_CarePortals.xlsx data structure.