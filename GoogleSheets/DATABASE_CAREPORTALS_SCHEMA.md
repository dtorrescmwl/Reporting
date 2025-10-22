# Database_CarePortals.xlsx - Complete Schema Documentation

**Last Updated**: October 7, 2025
**File Location**: `/GoogleSheets/Database_CarePortals.xlsx`
**Google Sheets URL**: https://docs.google.com/spreadsheets/d/1PaCOgNJmKSb2VsJjCMjWpCG-gwrO7uVkuTAFUdrV-_o/edit
**Total Sheets**: 16

## Overview

Database_CarePortals.xlsx serves as the normalized relational database structure for the CarePortals healthcare system. It contains comprehensive data about orders, customers, products, subscriptions, payments, and refunds with proper foreign key relationships and data normalization.

## Sheet Structure Summary

| Sheet Name | Records | Columns | Purpose |
|------------|---------|---------|---------|
| order.created | 476 | 15 | Order creation records with foreign key relationships |
| Subscription_Errors | 0 | 5 | Error logging for subscription processing |
| questionnaire_structure | 145 | 11 | Questionnaire form structure data |
| refund.created | 121 | 10 | Stripe refund tracking (real-time webhook) |
| payment_succesful | 438 | 13 | Stripe payment tracking (real-time webhook) |
| test_log | 0 | 0 | Testing/debugging log |
| customers | 281 | 5 | Customer master data (deduplicated) |
| subscription.active | 206 | 7 | Active subscription records |
| addresses | 248 | 7 | Normalized shipping addresses (MD5 hashed) |
| order.cancelled | 71 | 2 | Cancelled order tracking |
| subscription.paused | 15 | 7 | Paused subscription records |
| subscription.cancelled | 53 | 7 | Cancelled subscription records |
| subscription.full_log | 202 | 10 | Complete subscription lifecycle log |
| products | 26 | 12 | Product catalog with pricing |
| **order.updated** | **3081** | **4** | **🆕 Order status tracking (real-time)** |
| coupons | 4 | 4 | Discount code management |

## Detailed Sheet Specifications

### 1. order.created (476 records, 15 columns)
**Purpose**: Complete order records with foreign key relationships to other tables

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| created_at | datetime64[ns] | No | Order creation timestamp (Eastern Time) |
| order_id | int64 | No | Customer-facing order ID (4-digit) |
| care_portals_internal_order_id | object | No | Internal EMR order ID |
| customer_id | object | No | Foreign key to customers table |
| shipping_address_id | object | Yes (310/476) | Foreign key to addresses table (MD5 hash) |
| product_id | object | Yes (322/476) | Foreign key to products table |
| source | object | No | Order source channel |
| total_amount | int64 | No | Final order total (cents) |
| discount_amount | int64 | No | Total discounts applied (cents) |
| base_amount | int64 | No | Pre-discount amount (cents) |
| credit_used_amount | int64 | No | Store credit applied (cents) |
| coupon | object | Yes (32/476) | Coupon code used |
| discount_reduction_amount | int64 | No | Line item discount (cents) |
| discount_reduction_type | float64 | Yes (0/476) | Line item discount type |
| pharmacy_assigned | object | Yes (101/476) | Pharmacy routing assignment |

**Business Rules**:
- Pharmacy Assignment: SevenCells (default), Other (SC/IN states)
- Foreign key relationships maintain referential integrity
- All monetary values stored in cents

### 2. Subscription_Errors (0 records, 5 columns)
**Purpose**: Error logging for subscription processing failures

| Column | Type | Description |
|--------|------|-------------|
| Timestamp | object | Error occurrence time |
| Error Type | object | Classification of error |
| Error Message | object | Detailed error description |
| Raw Data | object | Original data that caused error |
| Trigger | object | Event that triggered error |

### 3. questionnaire_structure (145 records, 11 columns)
**Purpose**: Questionnaire form structure and answer data

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| 2025-09-26 10:30:57 | datetime64[ns] | No | Timestamp column |
| wlus | object | No | Questionnaire identifier |
| 68d6a331de74a92fb95e41b1 | object | No | Form/session ID |
| 0 | object | No | Question index |
| direct-text-string | object | No | Question type |
| string-text | object | No | Answer data type |
| "string-text" | object | No | Answer format |
| "[" | object | No | JSON array marker |
| 1 | int64 | No | Answer count |
| answers | object | No | Answer content |
| wlus\|0\|direct-text-string | object | No | Composite key |

### 4. refund.created (121 records, 10 columns) 🔴 **REAL-TIME WEBHOOK**
**Purpose**: Stripe refund tracking with real-time webhook processing

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| refund_id | object | No | Stripe refund ID (re_*) |
| charge_id | object | No | Associated Stripe charge ID |
| amount | float64 | No | Refund amount (cents) |
| currency | object | No | Currency code (USD) |
| datetime | datetime64[ns] | No | Refund creation time |
| reason | object | Yes (93/121) | Refund reason |
| status | object | No | Refund status |
| payment_intent_id | object | No | Associated payment intent ID |
| Unnamed: 8 | object | Yes (4/121) | Additional data field |
| Unnamed: 9 | object | Yes (4/121) | Additional data field |

### 5. payment_succesful (438 records, 13 columns) 🔴 **REAL-TIME WEBHOOK**
**Purpose**: Stripe payment tracking with real-time webhook processing

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| charge_id | object | No | Stripe charge ID (ch_* or py_*) |
| payment_intent_id | object | No | Stripe payment intent ID |
| order_number | int64 | No | CarePortals order ID (extracted via API) |
| amount | int64 | No | Payment amount (cents) |
| currency | object | No | Currency code (USD) |
| datetime | datetime64[ns] | No | Payment processing time |
| customer_id | object | No | Stripe customer ID |
| payment_method_id | object | No | Payment method ID |
| card_last4 | float64 | Yes (400/438) | Last 4 digits of card |
| card_brand | object | Yes (400/438) | Card brand (visa, mastercard, etc.) |
| status | object | No | Payment status |
| description | object | No | Payment description |
| application_fee_amount | float64 | No | Actual Stripe fees |

**Integration**: Connected to StripeTracking.js for real-time processing

### 6. test_log (0 records, 0 columns)
**Purpose**: Testing and debugging log (currently empty)

### 7. customers (281 records, 5 columns)
**Purpose**: Customer master data with email deduplication

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| customer_id | object | No | CarePortals customer._id |
| email | object | No | Primary key for cross-system matching |
| first_name | object | No | Customer first name |
| last_name | object | No | Customer last name |
| phone | int64 | No | Contact phone number |

**Business Rules**:
- Email serves as natural primary key
- Deduplication prevents duplicate customer records
- Phone stored as integer (no formatting)

### 8. subscription.active (206 records, 7 columns)
**Purpose**: Currently active subscription records

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| SubscriptionID | object | No | Customer-facing subscription ID |
| CustomerID | object | Yes (131/206) | CarePortals customer ID |
| ProductID | object | Yes (131/206) | Associated product ID |
| Cycle | int64 | No | Subscription cycle number |
| Status | object | No | Current subscription status |
| Datetime Created | datetime64[ns] | No | Subscription creation time |
| Last Updated | datetime64[ns] | Yes (88/206) | Last modification time |

### 9. addresses (248 records, 7 columns)
**Purpose**: Normalized shipping addresses with MD5 hashing for deduplication

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| address_id | object | No | MD5 hash of normalized address |
| address1 | object | Yes (246/248) | Street address line 1 |
| address2 | object | Yes (30/248) | Street address line 2 |
| city | object | Yes (246/248) | City name |
| province_code | object | Yes (247/248) | State/province code |
| postal_code | object | Yes (246/248) | ZIP/postal code |
| country_code | object | Yes (16/248) | Country code |

**Normalization Logic**:
- Street type standardization (st→street, ave→avenue, etc.)
- Case normalization (lowercase)
- Character cleaning (spaces, punctuation removed)
- MD5 hashing for unique identification

### 10. order.cancelled (71 records, 2 columns)
**Purpose**: Cancelled order tracking

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| deleted_at | object | No | Cancellation timestamp |
| order_id | int64 | No | Cancelled order ID |

### 11. subscription.paused (15 records, 7 columns)
**Purpose**: Temporarily paused subscription records

Same structure as subscription.active with paused status.

### 12. subscription.cancelled (53 records, 7 columns)
**Purpose**: Cancelled subscription records for churn analysis

Same structure as subscription.active with cancelled status.

### 13. subscription.full_log (202 records, 10 columns)
**Purpose**: Complete subscription lifecycle audit log

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| Datetime Received | datetime64[ns] | No | Webhook processing time |
| Trigger Type | object | No | Event type that triggered log entry |
| SubscriptionID | object | No | Subscription identifier |
| CustomerID | object | Yes (117/202) | Customer identifier |
| ProductID | object | Yes (116/202) | Product identifier |
| Cycle | int64 | No | Subscription cycle |
| Status | object | No | Subscription status |
| Datetime Created | datetime64[ns] | No | Original creation time |
| Last Updated | datetime64[ns] | No | Last update time |
| Raw Data | object | No | Complete webhook payload |

### 14. products (26 records, 12 columns)
**Purpose**: Product catalog with pricing and metadata

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| product_id | object | Yes (25/26) | Product identifier |
| Short_name | object | Yes (25/26) | Display name for dashboards |
| label | object | Yes (22/26) | Full product name |
| sub_label | object | Yes (14/26) | Product subtitle |
| drug_name | object | No | Medication compound name |
| list_price | int64 | No | Original price (cents) |
| sale_price | float64 | Yes (22/26) | Current sale price (cents) |
| sale_cycle_duration | float64 | Yes (22/26) | Sale period length |
| renewal_price | float64 | Yes (22/26) | Subscription renewal price |
| renewal_cycle_duration | int64 | No | Renewal frequency (days) |
| active | float64 | Yes (22/26) | Product availability flag |
| direct_cart_link | float64 | Yes (0/26) | Direct purchase URL |

**Enhancement**: Short_name field added for better dashboard display

### 15. order.updated (3081 records, 4 columns) 🆕 **NEW FEATURE**
**Purpose**: Real-time order status tracking and lifecycle management

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| Datetime Created | datetime64[ns] | No | Original order creation time |
| Datetime Updated | datetime64[ns] | No | Status update timestamp |
| order_id | int64 | No | Order identifier |
| updated_status | object | No | New order status |

**Key Features**:
- **Real-time Updates**: Processes order.status_updated webhooks
- **Status Tracking**: Tracks all order lifecycle changes
- **Audit Trail**: Complete history of order status changes
- **High Volume**: 3081 records showing active usage
- **Integration**: Connected to customer support systems

**Status Values Include**:
- awaiting_payment
- awaiting_script
- awaiting_shipment
- shipped
- delivered
- cancelled
- refunded

### 16. coupons (4 records, 4 columns)
**Purpose**: Discount code management

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| coupon_id | object | No | Coupon code identifier |
| reduction_amount | int64 | No | Discount value |
| reduction_type | object | Yes (2/4) | Discount type (dollar/percent) |
| description | object | No | Coupon description |

## Foreign Key Relationships

### Primary Relationships
- `order.created.customer_id` → `customers.customer_id`
- `order.created.shipping_address_id` → `addresses.address_id` (MD5)
- `order.created.product_id` → `products.product_id`
- `order.created.coupon` → `coupons.coupon_id`
- `order.updated.order_id` → `order.created.order_id`

### Payment Relationships
- `payment_succesful.order_number` → `order.created.order_id`
- `refund.created.charge_id` → `payment_succesful.charge_id`

### Subscription Relationships
- `subscription.*.CustomerID` → `customers.customer_id`
- `subscription.*.ProductID` → `products.product_id`

## Data Quality Metrics

### Completeness Rates
- **Customer Data**: 100% (email, name, phone required)
- **Order Core Data**: 100% (order_id, amounts, timestamps)
- **Address Data**: 99.2% (246/248 records complete)
- **Product Assignment**: 67.6% (322/476 orders have product_id)
- **Payment Integration**: 100% (real-time webhook processing)

### Data Integrity
- **No Duplicate Customers**: Email-based deduplication
- **No Duplicate Addresses**: MD5 hash-based deduplication
- **Referential Integrity**: Foreign key relationships maintained
- **Timezone Consistency**: All timestamps in Eastern Time

## Webhook Integration

### Real-Time Processing
1. **order.updated**: Live order status changes
2. **payment_succesful**: Immediate payment confirmations
3. **refund.created**: Real-time refund processing
4. **subscription lifecycle**: Active/paused/cancelled state changes

### Data Flow
```
CarePortals/Stripe → Webhook → Google Apps Script → Database_CarePortals.xlsx
```

## Technical Specifications

### Performance
- **Total Records**: ~5,100+ across all sheets
- **Update Frequency**: Real-time for critical tables
- **Processing Latency**: <500ms for webhook updates
- **Storage Format**: Google Sheets native format

### Security
- **Access Control**: Google Sheets permissions
- **API Keys**: Encrypted storage in Apps Script
- **Data Validation**: Business rules enforced in processing
- **Audit Trail**: Complete change tracking via full_log tables

## Usage Guidelines

### For Developers
- Use foreign key relationships for data joins
- Respect data types and nullable constraints
- Follow timezone conventions (Eastern Time)
- Implement proper error handling for missing references

### For Analysts
- order.updated provides complete order lifecycle view
- payment_succesful links to order.created via order_number
- Customer deduplication handled automatically
- Address normalization provides clean geographic data

### For System Integration
- Real-time webhook endpoints available for all major events
- Standard field naming conventions across tables
- Consistent timestamp formatting
- JSON data preserved in raw_data fields for debugging

---

**Integration Points**:
- StripeTracking.js → payment_succesful, refund.created
- customer_support_order_tracking.js → order.updated
- database_careportals_subscriptions.js → subscription.*
- database_orders.js → order.created, customers, addresses, products

**Last Schema Review**: October 7, 2025
**Next Review**: Monthly or when major structural changes occur