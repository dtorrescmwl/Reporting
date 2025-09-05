# Healthcare Funnel & CRM System - Technical Overview

## System Architecture

This system consists of three primary components that work together to manage the complete patient acquisition and care lifecycle:

### 1. Embeddables Funnel Platform
- **Purpose**: Lead generation through healthcare qualification funnels
- **Technology**: Component-based funnel builder with JSON configuration
- **Integration**: Real-time webhooks to Google Sheets and CRM systems
- **Data Flow**: Collects patient demographics, medical history, and preferences

### 2. CarePortals EMR/CRM System  
- **Purpose**: Electronic Medical Records and Customer Relationship Management
- **Technology**: Healthcare-focused EMR with webhook automation
- **Integration**: Sends patient, order, and prescription data via webhooks
- **Data Flow**: Manages order lifecycle, prescriptions, and subscriptions

### 3. Google Sheets Data Warehouse
- **Purpose**: Centralized data storage and reporting foundation
- **Technology**: Google Apps Script automation with webhook endpoints
- **Integration**: Receives data from both Embeddables and CarePortals
- **Data Flow**: Normalizes, validates, and stores all patient journey data

## Data Flow Architecture

```
Embeddables Funnels → Google Sheets ← CarePortals EMR/CRM
        ↓                 ↓                    ↓
   Patient Leads    Data Warehouse      Patient Orders
   Qualification   & Reporting Hub     & Prescriptions
```

## Key Integration Points

1. **Email Address**: Primary key linking records across all systems
2. **Real-time Webhooks**: Immediate data synchronization
3. **Data Validation**: Business rules enforce data quality
4. **Error Handling**: Comprehensive logging and recovery mechanisms
5. **Timezone Management**: All timestamps standardized to Eastern Time

## Business Context

This system supports a healthcare organization providing GLP-1 medication services for weight management. The complete patient journey flows from initial qualification through prescription fulfillment and ongoing care management.
