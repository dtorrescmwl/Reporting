# Revenue Analytics Dashboard

A comprehensive revenue analysis system that provides deep insights into payment performance, refund patterns, and business metrics by connecting CarePortals order data with Stripe payment information.

## 🎯 Overview

This dashboard analyzes revenue performance through multiple dimensions:
- **Gross Revenue**: Total payment amounts received
- **Refunds**: Complete refund analysis with timing and patterns
- **Net Revenue**: Actual revenue after refunds
- **Order Source Analysis**: First-time vs repeat customer behavior
- **Advanced Business Metrics**: Customer lifetime value, refund patterns, and more

## 📁 Files

### revenue_analytics.html
**Purpose**: Interactive dashboard frontend with comprehensive visualizations

**Key Features**:
- **Responsive Design**: Modern glassmorphism UI that works on all devices
- **Date Range Selector**: Yesterday, weekly, monthly, all-time, or custom ranges
- **Real-time Metrics**: Key revenue indicators with trend analysis
- **Interactive Charts**: Revenue trends, source analysis, refund breakdowns
- **Deep Analytics**: Order source insights, payment patterns, timing analysis

**Date Range Options**:
- **Yesterday**: Previous day's data
- **Weekly**: Current week (Monday start) to present
- **Monthly**: Current calendar month to present
- **All Time**: Complete historical data
- **Custom Range**: User-selected date range

### RevenueAnalyticsCode.gs
**Purpose**: Google Apps Script backend for data processing and analytics

**Core Functions**:
- `getRevenueAnalyticsData(startDate, endDate)` - Main data processing function
- `processRevenueAnalytics()` - Comprehensive data analysis engine
- `calculateCoreMetrics()` - Revenue, refunds, and rate calculations
- `analyzeRefunds()` - Full vs partial refund analysis
- `generateDeepAnalysis()` - Advanced business insights

**Data Integration**:
- Links orders → payments via `order_number` field
- Links payments → refunds via `charge_id` field
- Enriches data with customer and product information
- Handles date filtering and time-based analysis

## 🔗 Data Integration Architecture

### Data Sources
```
order.created (Orders) ←→ payment_succesful (Payments) ←→ refund.created (Refunds)
     order_id         ←→     order_number        ←→        charge_id
```

### Source Analysis
- **Checkout Orders** (`source = "checkout"`): First-time customer purchases
- **Subscription Orders** (`source = "subscription_cycle"`): Repeat customer purchases
- **Other Sources**: Admin, API, or imported orders

### Key Data Fields

**Orders**:
- `order_id` - Primary key
- `source` - Order source (checkout/subscription_cycle)
- `total_amount` - Order value
- `created_at` - Order timestamp
- `customer_id` - Customer reference

**Payments**:
- `charge_id` - Primary key
- `order_number` - Links to order_id
- `amount` - Payment amount
- `datetime` - Payment timestamp
- `status` - Payment status

**Refunds**:
- `refund_id` - Primary key
- `charge_id` - Links to payment
- `amount` - Refund amount
- `datetime` - Refund timestamp
- `reason` - Refund reason

## 📊 Analytics Features

### Core Revenue Metrics
- **Gross Revenue**: Sum of all successful payments
- **Total Refunds**: Sum of all refund amounts
- **Net Revenue**: Gross revenue minus refunds
- **Refund Rate**: Percentage of revenue refunded

### Revenue Analysis
- **Trends Over Time**: Daily, weekly, or monthly revenue patterns
- **Source Breakdown**: Revenue by order source (first-time vs repeat)
- **Payment Success Rates**: Transaction success analytics
- **Geographic Analysis**: Revenue by customer location

### Refund Deep Dive
- **Full vs Partial Refunds**: Complete analysis of refund types
- **Refund by Source**: How first-time vs repeat customers refund
- **Timing Analysis**: Average time from payment to refund
- **Refund Reasons**: Categorization of refund causes
- **Refund Patterns**: Seasonal or cyclical refund trends

### Order Source Insights
- **First-time Customer Behavior**: Checkout order analysis
  - Average order value
  - Product preferences
  - Refund patterns
  - Conversion to subscriptions
- **Repeat Customer Analysis**: Subscription order patterns
  - Subscription value trends
  - Loyalty metrics
  - Churn analysis

### Advanced Business Metrics
- **Customer Lifetime Value (CLV)**: Average revenue per customer
- **Revenue per Customer**: Total revenue divided by unique customers
- **Refund-to-Order Ratio**: Percentage of orders that result in refunds
- **Partial Refund Rate**: Percentage of refunds that are partial
- **Repeat Customer Rate**: Percentage of orders from repeat customers

### Payment Insights
- **Payment Method Analysis**: Breakdown by payment types
- **Average Payment Value**: Mean transaction amount
- **Payment Success Rates**: Transaction completion rates
- **Card Usage Patterns**: Credit card brand preferences

### Timing Analysis
- **Refund Timing Patterns**:
  - Average days from payment to refund
  - Same-day refund frequency
  - Long-delay refund analysis
  - Source-specific timing (checkout vs subscription)

## 🚀 Setup Instructions

### 1. Google Apps Script Setup
1. Create new Google Apps Script project
2. Replace `Code.gs` with `RevenueAnalyticsCode.gs`
3. Add `revenue_analytics.html` as HTML file
4. Update `DATABASE_CAREPORTALS_ID` with your sheet ID
5. Deploy as Web App with public access

### 2. Web App Configuration
- **Execute as**: Me (your account)
- **Who has access**: Anyone
- **XFrame Options**: ALLOWALL (for embedding)

### 3. Deployment
1. Save and deploy the Apps Script
2. Copy the Web App URL
3. Test with different date ranges
4. Embed in Google Sites or use standalone

## 📈 Dashboard Sections

### Key Metrics Cards
- Large, prominent display of core revenue metrics
- Color-coded for easy identification (green=revenue, red=refunds, blue=net)
- Trend indicators showing change vs previous period

### Revenue Trends Chart
- Line chart showing gross and net revenue over time
- Automatic time bucketing (daily/weekly/monthly) based on date range
- Interactive tooltips with exact values

### Source Revenue Analysis
- Doughnut chart showing revenue breakdown by order source
- Identifies first-time vs repeat customer revenue contribution
- Percentage and dollar amount displays

### Refund Analysis Charts
- **Full vs Partial Refunds**: Bar chart with amount and count metrics
- **Refunds by Source**: Source-specific refund patterns
- Dual-axis charts for comprehensive analysis

### Deep Analytics Panels
- **Order Source Analysis**: First-time vs repeat customer insights
- **Payment Insights**: Transaction patterns and success rates
- **Refund Timing**: Time-to-refund analysis by customer type
- **Advanced Metrics**: Business intelligence indicators

## 🔧 Customization Options

### Date Range Modifications
- Adjust default date ranges in JavaScript
- Add new preset ranges (quarterly, yearly)
- Modify time bucketing logic for trends

### Metric Calculations
- Add new revenue metrics in `calculateCoreMetrics()`
- Extend refund analysis in `analyzeRefunds()`
- Create custom business intelligence metrics

### Visualization Enhancements
- Add new chart types (scatter, radar, etc.)
- Implement drill-down capabilities
- Add export functionality

### Data Enrichment
- Include product-specific analysis
- Add customer segmentation
- Incorporate geographic analysis

## 🎨 UI Features

### Modern Design
- Glassmorphism effects with backdrop blur
- Gradient backgrounds and smooth animations
- Responsive grid layouts for all screen sizes
- Professional color scheme with semantic colors

### Interactive Elements
- Hover effects on cards and buttons
- Smooth transitions and animations
- Active state indicators
- Loading states and error handling

### Mobile Optimization
- Responsive design for tablets and phones
- Touch-friendly button sizing
- Optimized chart displays for small screens
- Collapsible sections for mobile

## 📋 Business Use Cases

### Executive Reporting
- Monthly revenue summaries
- Board presentation dashboards
- Strategic planning metrics
- Performance trend analysis

### Operations Management
- Daily revenue monitoring
- Refund pattern identification
- Customer behavior analysis
- Payment processing insights

### Customer Success
- First-time customer conversion tracking
- Refund reduction initiatives
- Customer satisfaction correlation
- Retention strategy development

### Financial Analysis
- Revenue forecasting
- Refund budgeting
- Payment processing optimization
- Cost-benefit analysis

## 🔍 Data Quality & Insights

### Current Data Insights (Example)
Based on analysis of Database_CarePortals data:
- **Total Revenue**: $72,231 gross, $49,424 net
- **Refund Rate**: 31.57% overall
- **Source Split**: 31.5% first-time, 68.5% repeat customers
- **Refund Types**: 50% full refunds, 50% partial refunds
- **Average Refund Time**: 3.2 days from payment

### Data Quality Considerations
- Some orders may not have matching payments (timing differences)
- Testing orders should be filtered from analysis
- Date parsing handles multiple formats automatically
- Empty or null values are handled gracefully

## 🚀 Future Enhancements

### Phase 2 Features
- Real-time webhook integration
- Predictive analytics for refund risk
- Customer segmentation analysis
- A/B testing impact analysis

### Advanced Analytics
- Machine learning refund prediction
- Cohort analysis for customer lifetime value
- Seasonal pattern recognition
- Anomaly detection for unusual patterns

### Integration Opportunities
- CRM system integration
- Marketing attribution analysis
- Inventory correlation analysis
- Customer support ticket correlation

---

**Last Updated**: September 15, 2025
**Version**: 1.0
**Author**: Revenue Analytics Team

*This dashboard provides comprehensive insights into revenue performance and helps drive data-driven business decisions through deep order-payment-refund analysis.*