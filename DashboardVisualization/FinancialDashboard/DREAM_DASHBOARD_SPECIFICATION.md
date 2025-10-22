# Financial Dashboard - Dream Specification

## 📋 Overview

This comprehensive financial dashboard provides executive-level insights into company finances and order volume metrics with period-over-period comparisons. The dashboard analyzes order flow, revenue streams, cancellations, renewals, and financial health using data exclusively from `Database_CarePortals.xlsx`.

**Data Source**: `Database_CarePortals.xlsx` (5,100+ records across 16 sheets)
**Primary Tables**: order.created (476), order.updated (3,081), payment_succesful (438), refund.created (121), subscription.active (206)

---

## 🎯 Required Core Metrics

### 1. New Orders 📈
**Definition**: Number of new orders created in the selected time period
**Data Source**: `order.created.created_at`
**Visualization**: Line chart with daily/weekly/monthly buckets
**Business Value**: Growth tracking and demand patterns
**Period Comparison**: Month-over-month percentage change

### 2. Cancellations 🚫
**Definition**: Orders that moved to cancelled status during the period
**Data Source**: `order.updated` filtered for `updated_status` containing "cancelled"
**Visualization**: Bar chart with cancellation reasons breakdown
**Business Value**: Churn analysis and process improvement identification
**Period Comparison**: Cancellation rate trends and absolute count changes

### 3. Renewals 🔄
**Definition**: Subscription orders representing customer renewals
**Data Source**: `order.created` filtered for `source = "subscription_cycle"`
**Visualization**: Stacked area chart showing renewal vs new customer orders
**Business Value**: Customer retention and subscription health
**Period Comparison**: Renewal rate trends and revenue impact

### 4. Net Revenue 💰
**Definition**: Total revenue after refunds (payments minus refunds)
**Data Source**: `payment_succesful.amount - refund.created.amount` (linked via charge_id)
**Visualization**: Line chart with gross vs net revenue comparison
**Business Value**: True financial performance after customer returns
**Period Comparison**: Net revenue growth rate and margin impact

### 5. Revenue Minus Refunds 💳
**Definition**: Alternative calculation of net revenue with detailed refund impact
**Data Source**: `payment_succesful.amount` minus `refund.created.amount` with detailed breakdown
**Visualization**: Waterfall chart showing revenue → refunds → net
**Business Value**: Visual representation of refund impact on revenue
**Period Comparison**: Refund rate trends and net revenue efficiency

---

## 📊 Extended Metrics Suite

### Financial Health Indicators

#### 6. Gross Revenue 💵
**Definition**: Total payments received before refunds
**Data Source**: `payment_succesful.amount` sum
**Visualization**: Large metric card with trend sparkline
**Business Value**: Top-line revenue tracking

#### 7. Refund Rate 📉
**Definition**: Percentage of gross revenue that was refunded
**Data Source**: `(refund.created.amount sum / payment_succesful.amount sum) * 100`
**Visualization**: Gauge chart with color-coded zones (green <10%, yellow 10-20%, red >20%)
**Business Value**: Customer satisfaction and product quality indicator

#### 8. Average Order Value (AOV) 💲
**Definition**: Mean value of orders in the period
**Data Source**: `order.created.total_amount` average
**Visualization**: Metric card with distribution histogram
**Business Value**: Pricing strategy effectiveness

#### 9. Customer Lifetime Value (CLV) 👥
**Definition**: Revenue per customer including subscription renewals
**Data Source**: Total revenue per unique `customer_id`
**Visualization**: Box plot showing CLV distribution
**Business Value**: Customer acquisition investment justification

### Operational Efficiency Metrics

#### 10. Order Processing Time ⏱️
**Definition**: Time from order creation to payment completion
**Data Source**: `payment_succesful.datetime - order.created.created_at`
**Visualization**: Histogram with median and percentile markers
**Business Value**: Process efficiency and customer experience

#### 11. Payment Success Rate ✅
**Definition**: Percentage of orders with successful payments
**Data Source**: `orders with payments / total orders * 100`
**Visualization**: Donut chart with success/pending/failed segments
**Business Value**: Payment processing optimization

#### 12. Refund Processing Time 🔄
**Definition**: Days between payment and refund
**Data Source**: `refund.created.datetime - payment_succesful.datetime`
**Visualization**: Box plot with trend line
**Business Value**: Customer service efficiency

### Growth & Retention Metrics

#### 13. New vs Returning Customer Revenue 🆕
**Definition**: Revenue split between first-time and subscription customers
**Data Source**: `order.created.source` ("checkout" vs "subscription_cycle")
**Visualization**: Stacked bar chart with revenue proportions
**Business Value**: Business model sustainability analysis

#### 14. Monthly Recurring Revenue (MRR) 📈
**Definition**: Predictable monthly revenue from subscriptions
**Data Source**: `subscription.active` count × average renewal price
**Visualization**: Line chart with growth rate annotations
**Business Value**: Subscription business health

#### 15. Subscription Renewal Rate 🔄
**Definition**: Percentage of subscriptions that successfully renew
**Data Source**: Active subscriptions / (Active + Cancelled) subscriptions
**Visualization**: Trend line with confidence intervals
**Business Value**: Customer retention effectiveness

### Product & Customer Insights

#### 16. Revenue by Product 🛍️
**Definition**: Revenue breakdown by product categories
**Data Source**: `order.created.product_id` linked to `products.label`
**Visualization**: Horizontal bar chart with product names
**Business Value**: Product portfolio optimization

#### 17. Geographic Revenue Distribution 🌍
**Definition**: Revenue by customer location
**Data Source**: `order.created.shipping_address_id` linked to `addresses.province_code`
**Visualization**: Choropleth map with revenue intensity
**Business Value**: Market expansion opportunities

#### 18. Seasonal Revenue Patterns 📅
**Definition**: Revenue trends by month/quarter over multiple years
**Data Source**: `payment_succesful.datetime` grouped by time periods
**Visualization**: Heat map with seasonal overlay
**Business Value**: Demand forecasting and resource planning

---

## 🎨 Visualization Strategy

### Dashboard Layout
**Structure**: 4-column responsive grid with executive summary at top
**Hierarchy**: Critical metrics (1-5) prominently displayed, extended metrics in expandable sections
**Interactivity**: Click-to-drill-down from summary to detailed views

### Chart Type Selection Rationale

#### Line Charts
- **Used for**: Time-series metrics (New Orders, Net Revenue, MRR)
- **Why**: Best for showing trends and period-over-period comparisons
- **Features**: Multiple series, trend lines, annotations for significant events

#### Bar Charts
- **Used for**: Categorical comparisons (Cancellations by reason, Revenue by Product)
- **Why**: Clear comparison of discrete categories
- **Features**: Stacked options, color coding, sorting capabilities

#### Gauge Charts
- **Used for**: Rate metrics (Refund Rate, Payment Success Rate)
- **Why**: Immediate visual indication of performance against targets
- **Features**: Color-coded zones, target lines, historical comparison

#### Waterfall Charts
- **Used for**: Revenue flow analysis (Gross → Net Revenue)
- **Why**: Shows step-by-step impact of different factors
- **Features**: Clear positive/negative flow, cumulative totals

#### Box Plots
- **Used for**: Distribution analysis (CLV, Processing Times)
- **Why**: Shows outliers, median, and quartiles for complete picture
- **Features**: Overlay trend lines, filter capabilities

#### Donut/Pie Charts
- **Used for**: Composition analysis (New vs Returning Revenue)
- **Why**: Clear proportion visualization with total context
- **Features**: Interactive segments, drill-down capability

#### Heat Maps
- **Used for**: Seasonal patterns and geographic distribution
- **Why**: Reveals patterns across two dimensions effectively
- **Features**: Color intensity scales, interactive tooltips

---

## 📱 User Experience Design

### Time Period Controls
**Options**: Yesterday, This Week, This Month, Last 30 Days, This Quarter, This Year, Custom Range
**Default**: Last 30 Days
**Comparison**: Automatic previous period comparison for all metrics

### Interactive Features
- **Drill-Down**: Click metrics to see detailed breakdowns
- **Filters**: Product, customer type, geographic region, order source
- **Export**: PDF reports, CSV data downloads
- **Alerts**: Configurable thresholds for key metrics

### Mobile Responsiveness
- **Cards**: Stack vertically on mobile
- **Charts**: Simplified for touch interaction
- **Navigation**: Collapsible menu system
- **Performance**: Lazy loading for large datasets

---

## 🔄 Period-Over-Period Analysis

### Comparison Logic
**Primary**: Current period vs same period length immediately prior
**Secondary**: Year-over-year for seasonal adjustment
**Trend**: 13-period moving average for smoothed trends

### Visual Indicators
- **Green**: Positive change (revenue growth, efficiency improvements)
- **Red**: Negative change (revenue decline, increased refunds)
- **Yellow**: Neutral or mixed signals requiring attention
- **Icons**: Arrows, percentages, absolute change values

### Statistical Context
- **Significance**: Confidence intervals for meaningful changes
- **Seasonality**: Adjusted comparisons for seasonal businesses
- **Volatility**: Moving averages to smooth noisy data

---

## 📋 Business Intelligence Features

### Executive Summary Dashboard
**Purpose**: One-page overview for leadership
**Content**: Top 5 metrics + key insights + alerts
**Update Frequency**: Real-time with caching for performance

### Operational Dashboard
**Purpose**: Detailed analysis for operations teams
**Content**: All 18 metrics + drill-down capabilities
**Features**: Custom date ranges, detailed filters, export options

### Alerts & Notifications
**Automated Alerts**: Threshold-based notifications for critical metrics
**Trends**: Early warning system for negative trend detection
**Anomalies**: Statistical outlier detection and flagging

### Data Quality Indicators
**Completeness**: Percentage of orders with complete data
**Freshness**: Last update timestamp for real-time data
**Accuracy**: Data validation flags and error indicators

---

## 🎯 Success Metrics for Dashboard

### User Adoption
- **Daily Active Users**: Target 80% of relevant stakeholders
- **Time Spent**: Average session >5 minutes indicates engagement
- **Feature Usage**: Drill-down and filter usage rates

### Business Impact
- **Decision Speed**: Faster identification of trends and issues
- **Data-Driven Decisions**: Documented use in strategic planning
- **Revenue Optimization**: Measurable improvements in tracked metrics

### Technical Performance
- **Load Time**: <3 seconds for initial dashboard load
- **Accuracy**: 99.9% data accuracy vs source systems
- **Reliability**: 99.5% uptime with graceful degradation

---

This dream dashboard specification provides comprehensive financial oversight while maintaining focus on actionable business intelligence. The design prioritizes executive decision-making while providing operational teams with the detailed analytics they need for day-to-day optimization.