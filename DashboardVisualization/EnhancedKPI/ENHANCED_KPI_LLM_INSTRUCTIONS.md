# Enhanced KPI Dashboard - LLM Frontend Development Instructions

## 📋 Project Overview

Build an enhanced healthcare KPI dashboard that displays scientifically accurate business metrics for a subscription-based healthcare service using only available data. This dashboard addresses critical calculation flaws in existing systems, particularly fixing an unrealistic Customer Lifetime Value formula and implementing professional-grade visualizations.

## 🎯 Core Requirements

### Data Source
- **Input**: Google Spreadsheet with healthcare subscription business data
- **Security**: Must handle HIPAA-compliant data in secure Google Workspace
- **Access**: Create Google Apps Script (.gs) backend for secure data access
- **Focus**: Subscription healthcare business with complex customer lifecycle data

### Output Format
- **Primary**: Single HTML file with professional healthcare business dashboard
- **Design**: Executive-level presentation suitable for C-suite and clinical stakeholders
- **Compatibility**: Desktop-primary with mobile responsiveness

## 🚨 Critical Fix Requirements

### PRIMARY FIX: Customer Lifetime Value (LTV) Calculation
**Problem**: Current system uses flawed formula producing unrealistic values ($3,000+ LTV)
**Required Solution**: Implement scientific cohort-based LTV calculation

```javascript
// REQUIRED: Proper LTV calculation methodology
function calculateRealisticLTV(customerData, orderData, paymentData) {
  // Group customers by signup month (cohorts)
  // Calculate average revenue per customer per month
  // Apply customer survival/retention rates over time
  // Sum discounted future value
  // Return realistic LTV in $150-$800 range for healthcare subscriptions
}
```

**Expected Output**: LTV values between $150-$800 (realistic for healthcare)
**Visualization**: Metric card showing cohort-based LTV with confidence range

## 📊 Required Metrics (12 Core KPIs - Available Data Only)

### Customer Growth & Enrollment (3 KPIs)

#### 1. New Patient Enrollments 📈
- **Data Type**: Count of new customers in selected time period
- **Calculation**: First-time customers based on earliest order date
- **Visualization**: Large metric card with enrollment trend sparkline
- **Format**: Integer count with percentage change vs previous period

#### 2. Active Patients 👥
- **Data Type**: Currently engaged customers
- **Calculation**: Customers with active subscriptions OR recent orders (90 days)
- **Visualization**: Metric card with activity breakdown donut chart
- **Format**: Integer count with engagement distribution

#### 3. Geographic Reach 🌍
- **Data Type**: Number of states/regions served
- **Calculation**: Unique geographic regions with active customers
- **Visualization**: Count with mini geographic distribution
- **Format**: Integer count with new market indicators

### Revenue & Financial Health (5 KPIs)

#### 5. Monthly Recurring Revenue (MRR) 💰
- **Data Type**: Normalized monthly revenue from subscriptions
- **Calculation**: All subscription revenue normalized to 30-day periods
- **Visualization**: Large metric card with MRR composition breakdown
- **Format**: Currency ($XX,XXX) with growth percentage

#### 6. Customer Lifetime Value (LTV) ⭐ **PRIMARY FOCUS**
- **Data Type**: Realistic customer value using cohort analysis
- **Calculation**: Cohort-based survival analysis with revenue attribution
- **Visualization**: Metric card with cohort LTV distribution
- **Format**: Currency ($XXX) - MUST BE REALISTIC ($150-$800 range)
- **Critical**: Fix the current unrealistic calculation

#### 7. Average Revenue Per User (ARPU) 📊
- **Data Type**: Revenue per customer per month
- **Calculation**: Total customer revenue / Total customer-months
- **Visualization**: Metric card with ARPU trend and cohort comparison
- **Format**: Currency ($XXX.XX) with trend indicator

#### 8. Net Revenue After Refunds 💲
- **Data Type**: True revenue performance after refund impact
- **Calculation**: Total payments minus total refunds with trend analysis
- **Visualization**: Revenue waterfall chart showing payment-refund flow
- **Format**: Currency ($XXX,XXX) with refund rate percentage

### Customer Success & Retention (2 KPIs)

#### 9. Enhanced Churn Rate 📉
- **Data Type**: Customer attrition rate using cohort methodology
- **Calculation**: Monthly cohort churn with proper statistical methodology
- **Visualization**: Trend line with cohort churn overlay
- **Format**: Percentage (X.X%) with target benchmarks

#### 10. Medication Adherence Rate 💊
- **Data Type**: Clinical adherence measurement using subscription patterns
- **Calculation**: Customers maintaining subscriptions for 90+ days
- **Visualization**: Gauge chart with clinical benchmarks (target >80%)
- **Format**: Percentage (XX%) with clinical target indicators

### Operational Excellence (2 KPIs)

#### 11. Order Processing Efficiency ⚡
- **Data Type**: End-to-end order fulfillment timing
- **Calculation**: Median time from order to shipment with percentiles
- **Visualization**: Box plot with timing distribution and benchmarks
- **Format**: Time (XX hours/days) with efficiency percentiles

#### 12. Product Performance Analysis 📈
- **Data Type**: Comprehensive product metrics with customer correlation
- **Calculation**: Product adoption rates, revenue per product, customer retention by product
- **Visualization**: Product performance matrix with adoption vs retention scatter plot
- **Format**: Matrix showing product success metrics with trend indicators

## 📈 Required Visualizations (6 Charts - Available Data)

### Chart 1: LTV Evolution Over Time (Line Chart)
- **Purpose**: Track realistic LTV calculation improvement over cohorts
- **X-Axis**: Customer signup month (cohorts)
- **Y-Axis**: Customer Lifetime Value (realistic $150-$800 range)
- **Lines**: Different customer cohorts with average trend
- **Features**: Cohort comparison, confidence intervals
- **Critical**: Show fixed LTV values, not the inflated $3,231+ values

### Chart 2: Revenue Waterfall Analysis (Waterfall Chart)
- **Purpose**: Net revenue tracking with refund impact visualization
- **Data**: Total payments minus refunds with component breakdown
- **Components**: Starting revenue + new payments - refunds = net revenue
- **Colors**: Green for positive contributions, red for refunds
- **Features**: Monthly breakdown with refund pattern analysis

### Chart 3: Cohort Retention Heat Map (Heat Map)
- **Purpose**: Customer lifecycle patterns by enrollment period
- **X-Axis**: Months since signup
- **Y-Axis**: Customer signup cohorts (by month)
- **Colors**: Retention rate intensity (dark = high retention)
- **Features**: Click cohorts for detailed analysis, survival curves

### Chart 4: Product Performance Matrix (Scatter Plot)
- **Purpose**: Product adoption and customer retention correlation
- **X-Axis**: Product order volume
- **Y-Axis**: Customer retention rate by product
- **Bubbles**: Bubble size = revenue, color = product category
- **Features**: Product drill-down, customer journey analysis

### Chart 5: Order Processing Efficiency (Box Plot)
- **Purpose**: Operational bottleneck identification using available timing data
- **Data**: Order creation to completion timing from order records
- **Features**: Percentile markers (P50, P90, P99), trend analysis
- **Interactive**: Time period filtering, efficiency improvement tracking

### Chart 6: Geographic Market Analysis (Choropleth Map)
- **Purpose**: Market penetration and revenue distribution
- **Data**: Customer density and revenue by province/state from address data
- **Colors**: Revenue intensity scale with customer count overlay
- **Features**: Hover details, click for regional market analysis

## 🎨 UI Design Requirements

### Professional Healthcare Layout (Available Data)
```
┌─────────────────────────────────────────────────────────────┐
│ Time Period Selector + Data Quality Indicators             │
├───────────────┬───────────────┬───────────────┬─────────────┤
│ New Patients  │ Active        │ MRR           │ LTV         │
│ [Count]       │ Patients      │ [$Amount]     │ [$150-800]  │
│ [% Change]    │ [Count]       │ [% Change]    │ [FIXED!]    │
├───────────────┼───────────────┼───────────────┼─────────────┤
│ ARPU          │ Churn Rate    │ Net Revenue   │ Adherence   │
│ [$Amount]     │ [%]           │ After Refunds │ Rate        │
│ [Trend]       │ [Cohort]      │ [$Amount]     │ [Clinical%] │
├───────────────┼───────────────┼───────────────┼─────────────┤
│ Processing    │ Product       │ Geographic    │ [Available] │
│ Efficiency    │ Performance   │ Reach         │ [Data Only] │
│ [Median]      │ [Matrix]      │ [States]      │ [Metrics]   │
├───────────────────────────────┬───────────────────────────────┤
│ LTV Evolution (Realistic)     │ Revenue Waterfall Analysis    │
│ ($150-$800 Range - FIXED!)   │ (Payments - Refunds)          │
├───────────────────────────────┼───────────────────────────────┤
│ Cohort Retention Heat Map     │ Product Performance Matrix    │
│ (Customer Lifecycle)          │ (Adoption vs Retention)       │
├───────────────────────────────┴───────────────────────────────┤
│ Order Processing + Geographic Market Analysis               │
│ (Efficiency Tracking + Revenue Distribution)                │
└─────────────────────────────────────────────────────────────┘
```

### Enhanced Color Scheme
- **Growth Metrics**: Green gradient (#10B981 to #059669)
- **Financial Metrics**: Blue gradient (#3B82F6 to #1D4ED8)
- **Health/Clinical Metrics**: Purple gradient (#8B5CF6 to #7C3AED)
- **Operational Metrics**: Orange gradient (#F59E0B to #D97706)
- **Alert/Warning States**: Red (#EF4444) for concerning values
- **Success States**: Green (#10B981) for healthy metrics

### Professional Features
- **Executive Quality**: Presentation-ready for board meetings
- **Interactive Tooltips**: Detailed metric explanations
- **Alert System**: Automatic flagging of concerning metrics
- **Mobile Responsive**: Functional on tablets and phones
- **Loading States**: Professional loading animations
- **Error Handling**: Graceful degradation for missing data

## 💡 Expected Data Structure

### Customer Data
- Customer creation dates and identifiers
- Customer lifecycle status and engagement indicators
- Geographic information for market analysis

### Subscription Data
- Active subscription records with billing cycles
- Subscription creation and cancellation dates
- Product assignments and pricing information

### Order Data
- Order creation and fulfillment timestamps
- Order processing stages and status changes
- Order amounts and customer associations

### Payment Data
- Payment transactions with success/failure status
- Payment amounts and timestamps
- Refund information and patterns

### Product Data
- Product catalog with pricing and billing cycles
- Product performance and adoption metrics

## 🔧 Technical Implementation Requirements

### Backend Data Processing
- **Google Apps Script**: Secure data access and processing
- **Calculation Engine**: Implement all 12 KPI calculations with enhanced accuracy
- **Data Validation**: Quality checks and error handling
- **Caching**: Intelligent caching for performance optimization

### Frontend Technology
- **HTML5**: Semantic markup with accessibility
- **CSS3**: Professional styling with healthcare industry aesthetics
- **JavaScript**: Modern ES6+ with Chart.js for visualizations
- **Responsive**: Mobile-first design with desktop optimization

### Critical Implementation Notes
1. **LTV Calculation**: Must be implemented correctly using cohort analysis
2. **Chart Quality**: Professional, publication-ready visualizations
3. **Performance**: <3 second load time with proper caching
4. **Accuracy**: All calculations must be statistically sound

## 🎯 Success Criteria

### Accuracy Requirements
- **LTV Values**: Must be realistic ($150-$800 for healthcare subscriptions)
- **Churn Rate**: Should align with industry benchmarks (<5% monthly)
- **Data Integrity**: 99%+ accuracy vs manual calculations

### Visualization Quality
- **Professional Appearance**: Board-presentation ready
- **Interactivity**: All charts must have meaningful interactions
- **Responsiveness**: Full functionality across devices

### Business Impact
- **Decision Support**: Metrics must be actionable for healthcare executives
- **Clinical Relevance**: Adherence and health metrics align with clinical standards
- **Financial Accuracy**: Revenue calculations support investor reporting

## 🔍 Validation Requirements

### Calculation Validation
- LTV calculation produces values in expected range ($150-$800)
- Churn rate methodology is statistically sound
- MRR calculation matches manual verification
- All percentage calculations sum appropriately

### User Experience Validation
- Dashboard loads within 3 seconds
- All interactive features work correctly
- Mobile responsiveness maintained
- Error states handled gracefully

### Data Quality Validation
- Missing data handled appropriately
- Edge cases (zero values, empty datasets) work correctly
- Time period changes update all metrics consistently
- Performance scales with realistic data volumes

---

**Primary Goal**: Create a scientifically accurate, professionally designed healthcare KPI dashboard using only available data that fixes the critical LTV calculation flaw while providing executive-level insights for subscription healthcare business management.