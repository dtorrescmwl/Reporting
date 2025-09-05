# System Integration Overview

## Complete Healthcare Data Ecosystem

This document provides a comprehensive overview of how all system components integrate to create a complete healthcare customer journey tracking and reporting platform.

## Integration Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Embeddables   │    │  Google Sheets  │    │   CarePortals   │
│  Funnel System  │◄──►│ Data Warehouse  │◄──►│   EMR/CRM       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  GoHighLevel    │    │   Reporting     │    │   Pharmacy      │
│   Marketing     │    │   Analytics     │    │   Partners      │
│  Automation     │    │    Tools        │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Data Flow Sequence

### 1. Lead Generation Phase (Embeddables → Google Sheets)

#### Patient Journey Start
```
User visits website → Embeddables funnel loads → Patient begins form
                                                      ↓
                              Survey Started webhook fired
                                                      ↓
                        Google Sheets: survey.started sheet updated
```

#### Progressive Data Collection
```
Patient progresses through funnel → Page tracking webhook fired
                                                      ↓
                     Google Sheets: page.tracker sheet updated (upsert)
                                   page.tracker_log sheet appended (forward-only)
                                                      ↓
                              Real-time funnel analytics available
```

#### Form Completion
```
Patient completes medical form → Form submission webhook fired
                                                      ↓
                        Email/phone validation → Banned domain filtering
                                                      ↓
                     Google Sheets: submissions sheet updated
                                                      ↓
                        GoHighLevel webhook fired with tags:
                        - completedsurvey
                        - formspecific (medicationsurvey/semaglutidesurvey/tirzepatidesurvey)
```

### 2. Sales Conversion Phase (CarePortals → Google Sheets)

#### Order Placement
```
Patient places order in CarePortals → Order created event triggered
                                                      ↓
                              Dual webhook system activated:
                                                      ↓
           ┌─────────────────────────────┬─────────────────────────────┐
           ▼                             ▼                             ▼
Simple Order Tracking              Normalized Database           EMR Profile Creation
(order.created sheet)            (Database CarePortals)        (Internal CarePortals)
                                                      ↓
                              Customer/Address/Product normalization
                              MD5 address hashing for deduplication
                              Pharmacy assignment based on state
```

#### Medical Review & Prescription
```
Medical review completed → Prescription created event triggered
                                                      ↓
                     Google Sheets: prescription.created sheet updated
                                   EMR profile link generated
                                                      ↓
                           Cross-system patient tracking enabled
                           (Email as primary key links all records)
```

### 3. Lifecycle Management Phase (CarePortals → Google Sheets)

#### Subscription Management
```
Subscription changes → Event webhooks fired:
                      - subscription.paused
                      - subscription.cancelled
                                                      ↓
                     Google Sheets: respective sheets updated
                                                      ↓
                              Churn analysis data available
```

#### Order Status Updates
```
Order status changes → Order updated webhook fired
                                                      ↓
                     Google Sheets: order.updated sheet updated
                                                      ↓
                        Complete order lifecycle tracking available
```

## Key Integration Points

### 1. Email-Based Customer Matching

**Primary Matching Logic**:
```javascript
// All systems use email as primary key
const customerRecord = {
  embeddables_entry_id: 'entry_abc123',
  careportals_customer_id: 'customer_xyz789',
  email: 'patient@example.com',  // PRIMARY MATCHING KEY
  first_name: 'Sample',
  last_name: 'Patient'
};

// Cross-system queries
function findCustomerJourney(email) {
  return {
    form_submission: embeddables_submissions.filter(r => r.email === email),
    page_progression: embeddables_tracker.filter(r => r.email === email),  
    orders: careportals_orders.filter(r => r.email === email),
    prescriptions: careportals_prescriptions.filter(r => r.email === email),
    subscriptions: careportals_subscriptions.filter(r => r.email === email)
  };
}
```

**Data Quality Assurance**:
- Email validation and banned domain filtering
- Deduplication across all systems
- Cross-reference validation between systems

### 2. Real-Time Webhook Processing

**Webhook Endpoint Architecture**:
```javascript
// Each Google Apps Script serves as webhook endpoint
const webhookEndpoints = {
  // Embeddables endpoints
  form_submissions: 'https://script.google.com/macros/s/[ID]/exec',
  survey_started: 'https://script.google.com/macros/s/[ID]/exec',
  checkout_sessions: 'https://script.google.com/macros/s/[ID]/exec',
  page_tracker: 'https://script.google.com/macros/s/[ID]/exec',
  
  // CarePortals endpoints  
  order_created_simple: 'https://script.google.com/macros/s/[ID]/exec',
  order_created_normalized: 'https://script.google.com/macros/s/[ID]/exec',
  order_updated: 'https://script.google.com/macros/s/[ID]/exec',
  prescription_created: 'https://script.google.com/macros/s/[ID]/exec',
  subscription_paused: 'https://script.google.com/macros/s/[ID]/exec',
  subscription_cancelled: 'https://script.google.com/macros/s/[ID]/exec'
};
```

**Processing Pipeline**:
1. **Webhook Receipt**: HTTPS POST with JSON payload
2. **Data Validation**: Required fields, format checking, business rules
3. **Data Transformation**: Field mapping, formatting, normalization
4. **Storage**: Append/update Google Sheets with error handling
5. **Response**: Success/error status returned to source system

### 3. Data Normalization and Deduplication

**Customer Deduplication**:
```javascript
// Customers table maintains single record per email
function upsertCustomer(customerData) {
  const existing = customers.find(c => c.email === customerData.email);
  
  if (existing) {
    // Update existing customer with new information
    return updateCustomerRecord(existing.customer_id, customerData);
  } else {
    // Create new customer record
    return createCustomerRecord(customerData);
  }
}
```

**Address Normalization**:
```javascript
// Addresses deduplicated via MD5 hashing
function normalizeAndHashAddress(addressData) {
  // Step 1: Normalize street types (st → street, ave → avenue)
  // Step 2: Remove punctuation and standardize case
  // Step 3: Create concatenated string
  // Step 4: Generate MD5 hash as unique identifier
  // Step 5: Store normalized address with hash as key
  
  return {
    address_id: md5Hash,
    normalized_address: cleanAddress
  };
}
```

### 4. Business Logic Integration

**Pharmacy Assignment**:
```javascript
// State-based routing integrated across all order processing
function determinePharmacyRouting(shippingState) {
  const state = shippingState.toUpperCase();
  
  // Business rules encoded in system
  if (state === 'SC' || state === 'IN') {
    return 'Other';  // Regulatory requirements
  }
  
  return 'SevenCells';  // Default pharmacy
}
```

**Medical Qualification Rules**:
```javascript
// Medical business rules applied consistently
const qualificationRules = {
  bmi: { min: 27, max: 50 },
  age: { min: 18, max: 89 },
  disqualifying_conditions: [
    'type_1_diabetes', 'pancreatic_disease', 'thyroid_cancer_history'
  ],
  female_contraindications: [
    'currently_pregnant', 'breastfeeding', 'trying_to_conceive'
  ]
};
```

## External System Integrations

### 1. GoHighLevel Marketing Automation

**Integration Purpose**: Trigger marketing workflows based on form completions
```javascript
// Webhook fired after successful form submission
function sendToGoHighLevel(patientData) {
  const payload = {
    email: patientData.email,
    firstName: patientData.first_name,
    lastName: patientData.last_name,
    phone: patientData.phone,
    tags: determineMarketingTags(patientData)
  };
  
  // Fire webhook to GoHighLevel
  UrlFetchApp.fetch(goHighLevelWebhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    payload: JSON.stringify(payload)
  });
}

function determineMarketingTags(data) {
  const tags = ['completedsurvey'];
  
  // Form-specific tags
  if (data.form_source === 'semaglutide v1') tags.push('semaglutidesurvey');
  if (data.form_source === 'tirzepatide v1') tags.push('tirzepatidesurvey');
  if (data.form_source === 'medication v1') tags.push('medicationsurvey');
  
  // Qualification-based tags
  if (data.medically_qualified) tags.push('qualified');
  if (data.checkout_completed) tags.push('converted');
  
  return tags;
}
```

### 2. EMR System Integration

**Integration Purpose**: Link spreadsheet data to full EMR patient records
```javascript
// Generate direct links to EMR profiles
function generateEMRLink(customerId) {
  return `https://emr.portals.care/customers/${customerId}?org=cmwl`;
}

// EMR links included in all CarePortals data
const patientRecord = {
  customer_id: 'customer_123',
  emr_profile_link: generateEMRLink('customer_123'),
  // ... other patient data
};
```

## Data Warehouse Structure

### Spreadsheet Organization

#### Spreadsheet 1: Embeddables Data (`1WVklvRZZqiVtVdD64IDm-vPSSvx-lv6QdXN9V8HC7hI`)
```
├── submissions (Complete form data)
├── survey.started (Initiation tracking) 
├── checkout.sessions (Conversion tracking)
├── page.tracker (Current progression state)
└── page.tracker_log (Complete progression history)
```

#### Spreadsheet 2: CarePortals Orders (`1J62EOn9OXZzFpqcyw4egfjZe72gOpYJPohApUPmtoKM`)
```
├── prescription.created (Medical prescriptions)
├── subscription.paused (Temporary holds)
├── subscription.cancelled (Churn tracking)
├── order.created (Simple order tracking)
└── order.updated (Order lifecycle)
```

#### Spreadsheet 3: Database CarePortals (`1PaCOgNJmKSb2VsJjCMjWpCG-gwrO7uVkuTAFUdrV-_o`)
```
├── customers (Normalized customer master)
├── addresses (Deduplicated addresses with MD5 keys)
├── products (Product catalog)
├── coupons (Discount codes)
└── order.created (Normalized orders with foreign keys)
```

## Reporting and Analytics Capabilities

### 1. Customer Journey Analytics

**Complete Funnel Analysis**:
```sql
-- Conceptual query showing cross-system analysis capability
SELECT 
    c.email,
    e.form_source,
    e.furthest_page_reached,
    e.medically_qualified,
    o.order_count,
    o.total_revenue,
    p.prescription_count,
    s.subscription_status,
    DATEDIFF(o.first_order_date, e.submission_date) as conversion_days
FROM embeddables_submissions e
LEFT JOIN careportals_orders o ON e.email = o.customer_email
LEFT JOIN careportals_prescriptions p ON e.email = p.customer_email  
LEFT JOIN careportals_subscriptions s ON e.email = s.customer_email
WHERE e.submission_date >= '2024-01-01';
```

### 2. Conversion Funnel Metrics

**Key Performance Indicators**:
- **Lead Generation**: Form starts → Form completions
- **Medical Qualification**: Submissions → Qualified patients
- **Sales Conversion**: Qualified patients → Orders placed
- **Prescription Fulfillment**: Orders → Prescriptions written
- **Retention**: Active subscriptions → Cancelled/paused

### 3. Geographic Performance Analysis

**State-Based Analytics**:
```javascript
// Geographic performance analysis capability
function analyzeGeographicPerformance() {
  return {
    conversion_by_state: calculateConversionRates('state'),
    pharmacy_performance: comparePharmacyRouting(),
    regulatory_impact: analyzeStateRegulations(),
    shipping_analysis: calculateDeliveryMetrics()
  };
}
```

### 4. Medical Outcome Tracking

**Clinical Analytics**:
- BMI distribution and qualification rates
- Medical disqualification reasons and trends  
- Age and demographic analysis
- GLP-1 experience levels and outcomes

## Data Quality and Monitoring

### 1. Real-Time Monitoring

**Webhook Health Monitoring**:
```javascript
// Each webhook reports processing status
const webhookHealth = {
  endpoint_url: 'https://script.google.com/macros/s/[ID]/exec',
  last_successful: '2024-01-15 14:30:22',
  error_count_24h: 0,
  processing_time_avg: '245ms',
  records_processed_today: 1247
};
```

### 2. Data Validation

**Cross-System Validation**:
```javascript
// Validate data consistency across systems
function validateDataIntegrity() {
  const validation = {
    email_consistency: checkEmailMatching(),
    timestamp_alignment: validateTimestamps(),
    missing_records: findOrphanedRecords(),
    duplicate_detection: identifyDuplicates()
  };
  
  return validation;
}
```

### 3. Error Recovery

**Automated Recovery Processes**:
```javascript
// Error sheet processing for failed webhooks
function processFailedWebhooks() {
  const errorSheet = getErrorSheet();
  const failedRecords = errorSheet.getDataRange().getValues();
  
  failedRecords.forEach(record => {
    try {
      reprocessWebhookData(record);
      markRecordAsRecovered(record);
    } catch (error) {
      escalateToManualReview(record, error);
    }
  });
}
```

## Security and Compliance

### 1. Data Access Controls

**Role-Based Access**:
```javascript
const accessControls = {
  healthcare_provider: {
    allowed_sheets: ['all_medical_data', 'patient_records'],
    restrictions: ['no_marketing_data']
  },
  marketing_analyst: {
    allowed_sheets: ['funnel_data', 'conversion_metrics'],
    restrictions: ['no_medical_details', 'email_only_for_campaigns']
  },
  reporting_admin: {
    allowed_sheets: ['all_sheets'],
    restrictions: ['audit_logged']
  }
};
```

### 2. HIPAA Compliance

**Protected Health Information (PHI)**:
- Medical condition data encrypted and access-controlled
- Audit logging for all PHI access
- Data retention policies enforced
- Minimum necessary standard applied

### 3. Data Retention

**Automated Cleanup**:
```javascript
const retentionPolicies = {
  medical_data: '7_years',
  marketing_data: '3_years',
  personal_data: '5_years_post_treatment',
  analytics_data: 'indefinite_aggregated'
};
```

This comprehensive integration ensures a complete, compliant, and analytically rich healthcare customer journey tracking system that enables sophisticated reporting and business intelligence capabilities.