# Healthcare Funnel & CRM System - Knowledge Base Index

## Overview

This knowledge base provides comprehensive technical documentation for a healthcare customer journey tracking system. The system integrates Embeddables funnel platform with CarePortals EMR/CRM via Google Sheets data warehouse to enable complete patient lifecycle analytics.

## Knowledge Base Structure

### Core System Documentation

#### [01_system_overview.md](./01_system_overview.md)
**Purpose**: High-level architecture and business context
**Contains**:
- System architecture overview
- Integration points between Embeddables, Google Sheets, and CarePortals
- Data flow architecture
- Business context for healthcare GLP-1 services

#### [02_embeddables_system.md](./02_embeddables_system.md)
**Purpose**: Complete Embeddables funnel system documentation
**Contains**:
- Project configuration (Group ID, Project ID, API details)
- Three funnel types: Medication Choice V1, Semaglutide V1, Tirzepatide V1
- 32-page progression structure with conditional branching
- All 52+ data collection fields with definitions
- Page progression logic and tracking rules

#### [03_careportals_system.md](./03_careportals_system.md)
**Purpose**: CarePortals EMR/CRM system integration details
**Contains**:
- Webhook event types (subscriptions, orders, prescriptions)
- Complete JSON payload structures for all webhooks
- Business logic for order processing workflow
- Status management and error handling
- Customer identification and matching logic

### Data Architecture Documentation

#### [04_spreadsheet_architecture.md](./04_spreadsheet_architecture.md)
**Purpose**: Complete Google Sheets data warehouse structure
**Contains**:
- Three primary spreadsheets with their IDs and purposes
- Detailed column structures for all 11 sheets
- Webhook endpoints for each data destination
- Business rules and data quality controls for each sheet
- Normalized database structure with foreign key relationships

#### [05_webhook_processing_logic.md](./05_webhook_processing_logic.md)
**Purpose**: Technical implementation of all webhook processing
**Contains**:
- Data validation and sanitization functions
- Date/time processing and Eastern Time standardization
- Specialized formatting (heights, dates, addresses)
- Page progression logic for funnel analytics
- Normalized database processing with MD5 address hashing
- Error handling and data recovery mechanisms
- Performance optimization techniques

#### [06_field_mapping_reference.md](./06_field_mapping_reference.md)
**Purpose**: Comprehensive field mappings between all systems
**Contains**:
- Embeddables to Google Sheets field mappings (46 fields)
- CarePortals to Google Sheets mappings for all webhook types
- Cross-system relationship definitions
- Data type specifications and transformation rules
- Primary and secondary matching key definitions
- Validation rules summary

### Business Logic Documentation

#### [07_business_rules_validation.md](./07_business_rules_validation.md)
**Purpose**: All business rules, validation logic, and data quality controls
**Contains**:
- Email and phone validation rules with banned domain filtering
- Medical qualification rules (BMI, age, health conditions)
- Page progression and funnel analytics rules
- Address normalization and pharmacy assignment logic
- GoHighLevel integration and marketing automation rules
- Error handling, data recovery, and duplicate detection
- Performance optimization and batch processing limits

#### [08_system_integration_overview.md](./08_system_integration_overview.md)
**Purpose**: Complete system integration and data flow documentation
**Contains**:
- End-to-end patient journey data flow
- Email-based customer matching across all systems
- Real-time webhook processing architecture
- External system integrations (GoHighLevel, EMR)
- Reporting and analytics capabilities
- Data quality monitoring and security compliance

## System Components

### Primary Systems
- **Embeddables**: Funnel platform for lead generation and medical qualification
- **CarePortals**: EMR/CRM system for healthcare service delivery
- **Google Sheets**: Data warehouse and reporting foundation

### Integration Technologies
- **Google Apps Script**: Webhook processing and data transformation
- **Real-time Webhooks**: Immediate data synchronization
- **MD5 Hashing**: Address deduplication and normalization
- **JSON Processing**: Complex data structure handling

### External Integrations  
- **GoHighLevel**: Marketing automation platform
- **EMR System**: Electronic medical records
- **Pharmacy Partners**: SevenCells and Other pharmacy routing

## Data Architecture Summary

### Spreadsheet 1: Embeddables Data
**ID**: `1WVklvRZZqiVtVdD64IDm-vPSSvx-lv6QdXN9V8HC7hI`
- `submissions`: Complete form data (46 columns)
- `survey.started`: Survey initiation tracking
- `checkout.sessions`: Conversion tracking
- `page.tracker`: Current progression state (upsert)
- `page.tracker_log`: Complete progression history (append-only)

### Spreadsheet 2: CarePortals Orders  
**ID**: `1J62EOn9OXZzFpqcyw4egfjZe72gOpYJPohApUPmtoKM`
- `prescription.created`: Medical prescriptions
- `subscription.paused`: Temporary subscription holds
- `subscription.cancelled`: Churn tracking
- `order.created`: Simple order tracking
- `order.updated`: Order lifecycle management

### Spreadsheet 3: Database CarePortals (Normalized)
**ID**: `1PaCOgNJmKSb2VsJjCMjWpCG-gwrO7uVkuTAFUdrV-_o`
- `customers`: Customer master data (deduplicated by email)
- `addresses`: MD5-hashed normalized addresses
- `products`: Product catalog with pricing
- `coupons`: Discount codes and descriptions
- `order.created`: Orders with foreign key relationships

## Key Business Rules

### Medical Qualification
- **BMI Requirements**: 27-50 range for GLP-1 therapy
- **Age Requirements**: 18-89 years old
- **Health Conditions**: Automated disqualification logic
- **Female-Specific**: Pregnancy/breastfeeding screening

### Data Quality
- **Email Validation**: Banned domains (`@cmwl.com`) and test addresses
- **Phone Validation**: Required field for all submissions
- **Forward-Only Tracking**: Prevents duplicate funnel analytics
- **Address Normalization**: Street type standardization and MD5 hashing

### Geographic Routing
- **Pharmacy Assignment**: State-based routing (SC/IN → Other, rest → SevenCells)
- **Compliance**: State-specific regulatory requirements

## Reporting Capabilities

### Customer Journey Analytics
- Complete funnel progression from form start to prescription fulfillment
- Cross-system customer matching via email addresses
- Conversion rate analysis at each stage
- Time-to-conversion tracking

### Business Intelligence
- Geographic performance analysis
- Medical qualification success rates
- Product and pricing optimization insights
- Churn and retention analytics

### Operational Reporting
- Real-time webhook health monitoring
- Data quality validation and error tracking
- Performance metrics and optimization insights

## Usage Guidelines for LLMs

### For Report Building
1. **Start with** `04_spreadsheet_architecture.md` to understand data locations
2. **Reference** `06_field_mapping_reference.md` for exact field names and transformations  
3. **Apply** `07_business_rules_validation.md` for proper data filtering and validation
4. **Consider** `08_system_integration_overview.md` for cross-system relationships

### For Data Analysis
1. **Use email as primary key** for joining data across all systems
2. **Apply Eastern Time standardization** for all timestamp comparisons
3. **Respect medical qualification rules** when creating patient cohorts
4. **Follow deduplication logic** when working with addresses and customers

### For System Development
1. **Implement webhook processing** following patterns in `05_webhook_processing_logic.md`
2. **Apply data validation rules** from `07_business_rules_validation.md`
3. **Use proper error handling** as documented in webhook processing logic
4. **Follow performance optimization** guidelines for batch processing

## Security and Compliance Notes

### HIPAA Compliance
- Medical data requires special handling and access controls
- Audit logging required for all PHI access
- Data retention policies must be enforced

### Data Privacy
- Email addresses are primary keys but must be protected
- IP addresses collected for security/tracking only
- Consent tracking maintained for all marketing communications

### Access Controls
- Role-based access to different data types
- Healthcare providers: Full medical data access
- Marketing analysts: Limited to non-PHI data
- Reporting admins: Full access with audit logging

This knowledge base provides complete technical documentation for building reporting tools, conducting data analysis, and understanding the full customer journey across all integrated systems.

---

**Knowledge Base Version**: 1.0  
**Last Updated**: Generated dynamically  
**Coverage**: Complete system documentation with no PII  
**Usage**: LLM knowledge base for healthcare reporting tools