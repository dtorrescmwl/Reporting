# Current Spreadsheet Reporting Capabilities

## Overview

Based on the comprehensive system analysis, your current Google Sheets setup provides sophisticated multi-dimensional reporting capabilities across the entire healthcare customer journey. The system enables cross-platform analytics by using email as the primary matching key to track customers from initial funnel interaction through prescription fulfillment and ongoing care.

## Primary Reporting Dimensions

### 1. Complete Customer Journey Tracking

**Cross-System Customer Matching**
- **Primary Key**: Email address links all records across Embeddables and CarePortals
- **Journey Stages**: Form submission → Medical qualification → Order placement → Prescription → Subscription management
- **Time-to-Conversion**: Track days/hours between each stage
- **Drop-off Analysis**: Identify where customers exit the funnel

**Example Analysis Capability**:
```
Customer: patient@example.com
├── Form Submitted: 2024-01-15 (Semaglutide funnel, medically qualified)
├── Page Progression: Reached checkout page (index 31)  
├── Order Placed: 2024-01-18 ($249.99 total, SevenCells pharmacy)
├── Prescription Created: 2024-01-19 (EMR ID: rx_12345)
└── Subscription Status: Active (no cancellations/pauses)
```

### 2. Funnel Performance Analytics

**Multi-Funnel Comparison**
- **Funnel Types**: Medication Choice V1, Semaglutide V1, Tirzepatide V1
- **Progression Tracking**: Page-by-page progression with forward-only logging
- **Conversion Rates**: Form completion → Checkout → Order placement
- **Qualification Success**: Medical screening pass/fail rates

**Current Tracking Includes**:
- Form initiation vs. completion rates
- Page abandonment analysis (furthest page reached)
- Time spent in funnel progression
- Geographic performance by state
- Medical qualification success by demographics

### 3. Revenue and Business Analytics

**Financial Performance Tracking**
- **Order Values**: Total amount, discounts, base amount, credit usage
- **Product Performance**: Individual medication performance
- **Coupon Effectiveness**: Discount code usage and impact
- **Geographic Revenue**: State-based financial performance

**Customer Lifetime Value Components**:
- Initial order value
- Subscription recurring revenue
- Retention vs. churn rates
- Credit utilization patterns

### 4. Medical and Operational Analytics

**Healthcare-Specific Metrics**
- **BMI Distribution**: Patient qualification based on BMI ranges
- **Age Demographics**: Age-based qualification and success rates  
- **Medical Conditions**: Disqualification reasons and trends
- **GLP-1 Experience**: Previous medication experience impact on conversion
- **Female-Specific**: Pregnancy/contraindication screening effectiveness

**Operational Efficiency**:
- **Pharmacy Routing**: SevenCells vs. Other pharmacy performance by state
- **Processing Times**: Order creation to prescription fulfillment
- **Error Rates**: Webhook failures and data quality issues

## Detailed Reporting Capabilities by Data Source

### Embeddables Funnel Analytics

#### Form Submission Analysis
**Data Source**: `submissions` sheet (46 fields)
- **Demographics**: Age, BMI, height/weight, geographic distribution
- **Medical History**: Previous GLP-1 experience, health conditions, disqualifications
- **Behavioral Data**: Sleep patterns, motivations, treatment priorities
- **Qualification Outcomes**: Medical approval vs. disqualification with reasons

#### Page Progression Intelligence  
**Data Sources**: `page.tracker` (current state) + `page.tracker_log` (historical)
- **Funnel Drop-off**: Exact page where users exit
- **Time-on-Page**: Duration analysis for each funnel step
- **Forward Progression**: Only legitimate forward movement tracked
- **Completion Rates**: Percentage reaching each milestone page

#### Conversion Tracking
**Data Source**: `checkout.sessions` sheet  
- **Cart Launch Rates**: Form completion to checkout initiation
- **Product Selection**: Which medications/plans selected
- **Abandonment Analysis**: Checkout initiation vs. actual purchase

### CarePortals Business Analytics

#### Order Performance Analysis
**Data Sources**: `order.created` (simple) + normalized database
- **Customer Acquisition**: New vs. returning customer analysis
- **Order Values**: Average order value, discount impact, credit usage
- **Geographic Performance**: State-based conversion and revenue
- **Source Attribution**: Order source channel effectiveness

#### Prescription and Medical Analytics
**Data Source**: `prescription.created` sheet
- **Medical Conversion**: Orders that result in prescriptions
- **Provider Efficiency**: Time from order to prescription
- **Patient Outcomes**: Prescription fulfillment success rates

#### Subscription Lifecycle Management
**Data Sources**: `subscription.paused` + `subscription.cancelled` sheets
- **Churn Analysis**: Cancellation rates and timing
- **Pause Patterns**: Temporary subscription holds
- **Retention Metrics**: Active subscription duration
- **Lifecycle Value**: Revenue from acquisition through churn

## Advanced Cross-System Analytics

### 1. Email-Based Customer Journey Reconstruction

**Complete Lifecycle Tracking**
Using email as the primary key, you can track:
- **Acquisition Cost**: Marketing spend per acquired customer
- **Conversion Efficiency**: Form submission to order placement rates
- **Medical Qualification Impact**: How medical screening affects conversion
- **Geographic Performance**: State-by-state customer acquisition and revenue
- **Time-to-Value**: Days from form submission to prescription fulfillment

### 2. Cohort and Segmentation Analysis

**Customer Segmentation Capabilities**
- **Funnel-Based Cohorts**: Customers by funnel type (General/Semaglutide/Tirzepatide)
- **Medical Cohorts**: BMI ranges, age groups, medical history segments
- **Geographic Cohorts**: State-based analysis (especially SC/IN vs. others)
- **Behavioral Cohorts**: Sleep patterns, motivations, treatment priorities

**Temporal Analysis**
- **Monthly Cohorts**: Customer acquisition by month
- **Seasonal Trends**: Quarterly/seasonal performance patterns
- **Day-of-Week Analysis**: Optimal timing for conversions

### 3. Operational Intelligence

**Data Quality Monitoring**
- **Webhook Health**: Processing success rates across all endpoints
- **Data Completeness**: Missing field analysis across systems
- **Error Patterns**: Common failure points and recovery rates

**System Performance Metrics**
- **Processing Times**: Webhook response times and delays
- **Data Volume**: Records processed per day/week/month
- **Integration Health**: Cross-system data consistency

## Specific Cross-System Reporting Examples

### 1. Form-to-Purchase Conversion Analysis
**Data Join**: `submissions.email = order.created.customer_email`
- Identify customers who both submitted forms AND placed orders
- Calculate conversion rates by funnel type
- Analyze time-to-conversion metrics
- Segment by demographics and medical qualifications

### 2. Geographic Performance Dashboard
**Multi-Source Analysis**:
- Form submissions by state (Embeddables data)
- Order conversion rates by state (CarePortals data) 
- Pharmacy routing impact (SC/IN vs. others)
- Revenue performance by geographic region

### 3. Medical Qualification Impact Study
**Cross-System Medical Analytics**:
- BMI distribution from form submissions
- Medical disqualification reasons and trends
- Qualified patient conversion to orders
- Prescription fulfillment rates by medical profile

### 4. Product Performance Analysis
**Revenue and Product Analytics**:
- Funnel-specific conversion (Semaglutide vs. Tirzepatide funnels)
- Product selection patterns from order data
- Discount effectiveness by product type
- Customer lifetime value by initial product choice

## Current Reporting Strengths

### 1. Real-Time Data Integration
- Live webhook processing provides up-to-date analytics
- Cross-system data synchronization via email matching
- Immediate visibility into conversion funnel performance

### 2. Comprehensive Customer Journey Tracking  
- End-to-end visibility from marketing funnel to prescription fulfillment
- Detailed behavioral and medical data collection
- Subscription lifecycle management and churn analysis

### 3. Healthcare-Specific Intelligence
- Medical qualification tracking with detailed disqualification reasons
- BMI and demographic-based patient analysis
- GLP-1 experience impact on treatment outcomes
- Regulatory compliance tracking (state-based routing)

### 4. Business Intelligence Capabilities
- Revenue attribution across marketing funnels
- Geographic performance analysis with pharmacy routing insights
- Customer segmentation based on medical and behavioral profiles
- Operational efficiency metrics and error monitoring

## Data Relationships for Advanced Reporting

### Primary Joins (Email-Based)
```sql
-- Conceptual structure for cross-system analysis
embeddables.submissions.email = careportals.orders.customer_email
embeddables.submissions.email = careportals.prescriptions.customer_email  
embeddables.submissions.email = careportals.subscriptions.customer_email
```

### Secondary Relationships
- **Address Analysis**: MD5-hashed addresses enable geographic and shipping analysis
- **Product Correlation**: Line item analysis with funnel type preferences
- **Temporal Patterns**: Timestamp alignment across all customer touchpoints

### Normalized Database Advantages
- **Customer Master**: Single source of truth for customer information
- **Address Deduplication**: Accurate geographic and shipping analytics
- **Product Catalog**: Consistent product performance analysis
- **Foreign Key Integrity**: Reliable cross-table reporting

## Reporting Infrastructure Summary

Your current spreadsheet setup provides:
- **11 interconnected sheets** across 3 spreadsheets
- **Email-based customer journey reconstruction** 
- **Real-time webhook data integration**
- **Healthcare-specific analytics** (BMI, age, medical conditions)
- **Multi-dimensional business intelligence** (geographic, temporal, product-based)
- **Operational monitoring** (error tracking, data quality)

This infrastructure enables sophisticated reporting across acquisition, conversion, medical qualification, fulfillment, and retention - providing complete visibility into your healthcare customer lifecycle.