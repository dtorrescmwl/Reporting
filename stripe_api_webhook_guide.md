# Complete Stripe API & Webhook Integration Guide

## Table of Contents
1. [Overview](#overview)
2. [Stripe API Structure](#stripe-api-structure)
3. [Webhook Events](#webhook-events)
4. [Data Models](#data-models)
5. [Implementation Patterns](#implementation-patterns)
6. [Field Mapping & Availability](#field-mapping--availability)
7. [Timezone Handling](#timezone-handling)
8. [Error Handling](#error-handling)
9. [Best Practices](#best-practices)
10. [Code Examples](#code-examples)

---

## Overview

This guide documents the comprehensive analysis of Stripe's API and webhook system, focusing on payment processing data extraction and real-time event handling. The integration covers both historical data retrieval via API calls and ongoing transaction monitoring through webhooks.

### Key Insights
- Stripe provides consistent data structures across API and webhook endpoints
- Payment processing involves multiple related objects: PaymentIntents, Charges, and Refunds
- Webhooks provide real-time updates but may have slight field variations compared to API responses
- Proper timezone handling is critical for data consistency

---

## Stripe API Structure

### Core Objects

#### 1. Charges (`/v1/charges`)
The fundamental payment object representing a payment attempt.

**Object Structure:**
```json
{
  "id": "ch_3S7OPtGIItQPbBO71SCafn7C",
  "object": "charge",
  "amount": 34900,
  "amount_captured": 34900,
  "amount_refunded": 5000,
  "application_fee_amount": 349,
  "balance_transaction": "txn_3S7OPtGIItQPbBO71gMQrvra",
  "captured": true,
  "created": 1757888945,
  "currency": "usd",
  "customer": "cus_SW9hjosrZduE5h",
  "description": "Orders #1984",
  "metadata": {
    "organization": "cmwl",
    "resourceId": "1984",
    "resourceType": "orders"
  },
  "payment_intent": "pi_3S7OPtGIItQPbBO71z0EclCB",
  "payment_method": "pm_1Rb7RQGIItQPbBO719yMLdvQ",
  "payment_method_details": {
    "card": {
      "brand": "visa",
      "last4": "8703",
      "funding": "credit"
    },
    "type": "card"
  },
  "status": "succeeded",
  "outcome": {
    "network_status": "approved_by_network",
    "risk_level": "normal",
    "type": "authorized"
  }
}
```

**Key Fields:**
- `id`: Unique charge identifier (starts with `ch_`)
- `amount`: Amount in cents (divide by 100 for dollars)
- `payment_intent`: Links to PaymentIntent object
- `customer`: Links to Customer object
- `metadata`: Custom key-value pairs for business logic
- `payment_method_details.card`: Card-specific information

#### 2. Payment Intents (`/v1/payment_intents`)
Higher-level object that tracks the entire payment process.

**Object Structure:**
```json
{
  "id": "pi_3S7OPtGIItQPbBO71z0EclCB",
  "object": "payment_intent",
  "amount": 34900,
  "currency": "usd",
  "customer": "cus_SW9hjosrZduE5h",
  "description": "Orders #1984",
  "latest_charge": "ch_3S7OPtGIItQPbBO71SCafn7C",
  "metadata": {
    "organization": "cmwl",
    "resourceId": "1984",
    "resourceType": "orders"
  },
  "payment_method": "pm_1Rb7RQGIItQPbBO719yMLdvQ",
  "status": "succeeded"
}
```

**Key Fields:**
- `id`: Unique payment intent identifier (starts with `pi_`)
- `latest_charge`: References the associated charge
- `status`: Payment state (requires_payment_method, succeeded, etc.)

#### 3. Refunds (`/v1/refunds`)
Represents money returned to customers.

**Object Structure:**
```json
{
  "id": "re_3S7OPtGIItQPbBO71xfWopGP",
  "object": "refund",
  "amount": 5000,
  "charge": "ch_3S7OPtGIItQPbBO71SCafn7C",
  "created": 1757960539,
  "currency": "usd",
  "payment_intent": "pi_3S7OPtGIItQPbBO71z0EclCB",
  "reason": "requested_by_customer",
  "receipt_number": "3342-6171",
  "status": "succeeded"
}
```

**Key Fields:**
- `id`: Unique refund identifier (starts with `re_`)
- `charge`: References the original charge
- `payment_intent`: Links back to original payment intent
- `reason`: Refund justification (requested_by_customer, fraudulent, etc.)

### API Pagination

All list endpoints use cursor-based pagination:

```python
# Pagination pattern
has_more = True
starting_after = None

while has_more:
    response = stripe.Charge.list(
        limit=100,
        starting_after=starting_after
    )
    
    # Process response.data
    
    has_more = response.has_more
    if has_more and response.data:
        starting_after = response.data[-1].id
```

### Rate Limiting
- Standard rate limit: 100 requests per second per account
- Implement delays between requests (recommended: 0.1 seconds)
- Handle 429 status codes with exponential backoff

---

## Webhook Events

### Event Types

#### 1. `payment_intent.succeeded`
Fired when a payment is successfully completed.

**Payload Structure:**
```json
{
  "id": "evt_xxx",
  "object": "event",
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      // PaymentIntent object (same as API response)
    }
  }
}
```

**Use Case:** Create charge records when payments succeed.

#### 2. `refund.created`
Fired when a refund is processed.

**Payload Structure:**
```json
{
  "id": "evt_xxx",
  "object": "event",
  "type": "refund.created",
  "data": {
    "object": {
      // Refund object (same as API response)
    }
  }
}
```

**Use Case:** Track refund transactions and update charge records.

#### 3. `charge.refunded` (Alternative)
Fired when a charge is refunded (provides less detailed information).

**Considerations:**
- Only provides cumulative refund amounts
- Doesn't include individual refund details
- `refund.created` is preferred for detailed tracking

### Webhook Security

Stripe signs webhooks with HMAC-SHA256. Always verify signatures:

```javascript
// Google Apps Script verification example
function verifyWebhookSignature(payload, signature, secret) {
  const elements = signature.split(',');
  const signatureHash = elements[1].split('=')[1];
  
  const expectedHash = Utilities.computeHmacSha256Signature(
    payload, 
    secret
  );
  
  return signatureHash === Utilities.base64Encode(expectedHash);
}
```

---

## Data Models

### Normalized Database Schema

#### Charges Table
```sql
CREATE TABLE charges (
    charge_id VARCHAR(255) PRIMARY KEY,
    payment_intent_id VARCHAR(255),
    order_number VARCHAR(255),
    amount DECIMAL(10,2),
    currency VARCHAR(3),
    datetime TIMESTAMP,
    customer_id VARCHAR(255),
    payment_method_id VARCHAR(255),
    card_last4 VARCHAR(4),
    card_brand VARCHAR(20),
    status VARCHAR(50),
    description TEXT,
    application_fee_amount DECIMAL(10,2)
);
```

#### Refunds Table
```sql
CREATE TABLE refunds (
    refund_id VARCHAR(255) PRIMARY KEY,
    charge_id VARCHAR(255) REFERENCES charges(charge_id),
    amount DECIMAL(10,2),
    currency VARCHAR(3),
    datetime TIMESTAMP,
    reason VARCHAR(50),
    status VARCHAR(50),
    payment_intent_id VARCHAR(255)
);
```

### Relationships
- **One-to-One:** PaymentIntent → Charge
- **One-to-Many:** Charge → Refunds
- **Many-to-One:** Charges → Customer

---

## Implementation Patterns

### 1. Historical Data Import (API)
```python
def get_all_charges():
    all_charges = []
    has_more = True
    starting_after = None
    
    while has_more:
        charges = stripe.Charge.list(
            limit=100,
            starting_after=starting_after
        )
        
        # Filter successful charges
        successful_charges = [
            charge for charge in charges.data 
            if charge.status == 'succeeded'
        ]
        
        # Process and transform data
        for charge in successful_charges:
            processed_charge = transform_charge_data(charge)
            all_charges.append(processed_charge)
        
        # Handle pagination
        has_more = charges.has_more
        if has_more and charges.data:
            starting_after = charges.data[-1].id
        
        time.sleep(0.1)  # Rate limiting
    
    return all_charges
```

### 2. Real-time Processing (Webhooks)
```javascript
function doPost(e) {
    try {
        const webhook = JSON.parse(e.postData.contents);
        
        switch (webhook.type) {
            case 'payment_intent.succeeded':
                handlePaymentSuccess(webhook.data.object);
                break;
            case 'refund.created':
                handleRefundCreated(webhook.data.object);
                break;
        }
        
        return ContentService.createTextOutput(
            JSON.stringify({status: 'success'})
        );
    } catch (error) {
        console.error('Webhook error:', error);
        return ContentService.createTextOutput(
            JSON.stringify({status: 'error'})
        );
    }
}
```

### 3. Data Transformation Pipeline
```python
def transform_charge_data(charge):
    return {
        'charge_id': charge.id,
        'payment_intent_id': charge.payment_intent or '',
        'order_number': extract_order_number(charge.metadata),
        'amount': charge.amount / 100,  # Convert cents to dollars
        'currency': charge.currency.upper(),
        'datetime': unix_to_eastern_time(charge.created),
        'customer_id': charge.customer or '',
        'payment_method_id': charge.payment_method or '',
        'card_last4': safe_get(charge, 'payment_method_details.card.last4'),
        'card_brand': safe_get(charge, 'payment_method_details.card.brand'),
        'status': charge.status,
        'description': charge.description or '',
        'application_fee_amount': calculate_fee(charge.amount)
    }
```

---

## Field Mapping & Availability

### Charges - API vs Webhook Comparison

| Field | API Availability | Webhook Availability | Notes |
|-------|------------------|---------------------|--------|
| `charge_id` | ✅ Direct (`id`) | ✅ Via `latest_charge` | Primary identifier |
| `payment_intent_id` | ✅ Direct | ✅ Direct (`id`) | Links to PaymentIntent |
| `order_number` | ✅ Via `metadata.resourceId` | ✅ Via `metadata.resourceId` | Business reference |
| `amount` | ✅ Direct | ✅ Direct | Always in cents |
| `currency` | ✅ Direct | ✅ Direct | ISO 4217 code |
| `datetime` | ✅ `created` | ✅ `created` | Unix timestamp |
| `customer_id` | ✅ Direct | ✅ Direct | May be null |
| `payment_method_id` | ✅ Direct | ✅ Direct | Payment method reference |
| `card_last4` | ✅ Via nested object | ❌ Not available | API only |
| `card_brand` | ✅ Via nested object | ❌ Not available | API only |
| `status` | ✅ Direct | ✅ Direct | Payment status |
| `description` | ✅ Direct | ✅ Direct | Human-readable description |

### Refunds - API vs Webhook Comparison

| Field | API Availability | Webhook Availability | Notes |
|-------|------------------|---------------------|--------|
| `refund_id` | ✅ Direct (`id`) | ✅ Direct (`id`) | Primary identifier |
| `charge_id` | ✅ Direct (`charge`) | ✅ Direct (`charge`) | Foreign key |
| `amount` | ✅ Direct | ✅ Direct | Refund amount in cents |
| `currency` | ✅ Direct | ✅ Direct | ISO 4217 code |
| `datetime` | ✅ `created` | ✅ `created` | Unix timestamp |
| `reason` | ✅ Direct | ✅ Direct | Refund justification |
| `status` | ✅ Direct | ✅ Direct | Refund status |
| `payment_intent_id` | ✅ Direct | ✅ Direct | Links to PaymentIntent |
| `receipt_number` | ✅ Direct | ❌ May be null | Receipt reference |

---

## Timezone Handling

### Challenge
Stripe stores all timestamps as Unix timestamps (UTC), but business requirements often need local timezone display.

### Solution Pattern
```python
import pytz
from datetime import datetime

def unix_to_eastern_time(unix_timestamp):
    """Convert Unix timestamp to Eastern Time string."""
    utc = pytz.utc
    eastern = pytz.timezone('America/New_York')
    
    # Create UTC datetime
    utc_dt = datetime.fromtimestamp(unix_timestamp, tz=utc)
    
    # Convert to Eastern
    eastern_dt = utc_dt.astimezone(eastern)
    
    # Format for consistency
    return eastern_dt.strftime('%m/%d/%Y %H:%M:%S')
```

### Google Apps Script Implementation
```javascript
function convertToEasternTime(unixTimestamp) {
    if (!unixTimestamp) return "";
    
    try {
        const utcDate = new Date(unixTimestamp * 1000);
        return utcDate.toLocaleString("en-US", {
            timeZone: "America/New_York",
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    } catch (error) {
        console.error("Time conversion error:", error);
        return unixTimestamp.toString();
    }
}
```

---

## Error Handling

### API Error Patterns
```python
def safe_api_call(api_function, *args, **kwargs):
    """Wrapper for safe API calls with retry logic."""
    max_retries = 3
    retry_delay = 1
    
    for attempt in range(max_retries):
        try:
            return api_function(*args, **kwargs)
        except stripe.error.RateLimitError:
            if attempt < max_retries - 1:
                time.sleep(retry_delay * (2 ** attempt))
                continue
            raise
        except stripe.error.APIError as e:
            print(f"API Error: {e}")
            if attempt < max_retries - 1:
                time.sleep(retry_delay)
                continue
            raise
        except Exception as e:
            print(f"Unexpected error: {e}")
            raise
```

### Webhook Error Handling
```javascript
function handleWebhookError(error, eventType) {
    console.error(`Webhook processing failed for ${eventType}:`, error);
    
    // Log to spreadsheet for monitoring
    const errorSheet = getErrorLogSheet();
    errorSheet.appendRow([
        new Date(),
        eventType,
        error.toString(),
        'FAILED'
    ]);
    
    // Return appropriate response
    return ContentService.createTextOutput(
        JSON.stringify({
            status: 'error',
            message: 'Processing failed',
            timestamp: new Date().toISOString()
        })
    ).setMimeType(ContentService.MimeType.JSON);
}
```

---

## Best Practices

### 1. Data Consistency
- Always use the same timezone conversion across all systems
- Implement idempotency checks to prevent duplicate records
- Validate data before insertion/update

### 2. Performance Optimization
- Implement proper pagination for large datasets
- Use batch operations when possible
- Cache frequently accessed data (customer information)

### 3. Security
- Verify webhook signatures
- Use environment variables for API keys
- Implement proper access controls

### 4. Monitoring
- Log all API calls and responses
- Track webhook processing success/failure rates
- Monitor rate limit usage

### 5. Data Architecture
- Use proper foreign key relationships
- Implement soft deletes for audit trails
- Consider partitioning for large datasets

---

## Code Examples

### Complete Webhook Handler (Google Apps Script)
```javascript
const SPREADSHEET_ID = 'your_spreadsheet_id';
const WEBHOOK_SECRET = 'your_webhook_secret';

function doPost(e) {
    try {
        // Verify webhook signature (recommended)
        if (!verifySignature(e)) {
            return ContentService.createTextOutput('Invalid signature')
                .setStatusCode(401);
        }
        
        const event = JSON.parse(e.postData.contents);
        
        switch (event.type) {
            case 'payment_intent.succeeded':
                processPaymentSuccess(event.data.object);
                break;
            case 'refund.created':
                processRefund(event.data.object);
                break;
            default:
                console.log(`Unhandled event: ${event.type}`);
        }
        
        return ContentService.createTextOutput(
            JSON.stringify({status: 'success'})
        );
        
    } catch (error) {
        return handleWebhookError(error, event?.type || 'unknown');
    }
}

function processPaymentSuccess(paymentIntent) {
    const sheet = getChargesSheet();
    const amount = paymentIntent.amount / 100;
    
    const rowData = [
        paymentIntent.latest_charge || '',
        paymentIntent.id,
        paymentIntent.metadata?.resourceId || '',
        amount,
        paymentIntent.currency.toUpperCase(),
        convertToEasternTime(paymentIntent.created),
        paymentIntent.customer || '',
        paymentIntent.payment_method || '',
        '', // card_last4 not available
        '', // card_brand not available
        paymentIntent.status,
        paymentIntent.description || '',
        Math.round(amount * 0.01 * 100) / 100 // 1% fee
    ];
    
    // Check for existing record to prevent duplicates
    const existingRow = findRowByValue(sheet, 2, paymentIntent.id);
    if (existingRow) {
        sheet.getRange(existingRow, 1, 1, rowData.length).setValues([rowData]);
    } else {
        sheet.appendRow(rowData);
    }
}
```

### Complete Python API Exporter
```python
import stripe
import csv
import pytz
from datetime import datetime
import time

class StripeDataExporter:
    def __init__(self, api_key, output_dir='./'):
        stripe.api_key = api_key
        self.output_dir = output_dir
        self.et_tz = pytz.timezone('America/New_York')
        self.utc_tz = pytz.utc
    
    def export_all_data(self):
        """Export all charges and refunds to CSV files."""
        print("Starting Stripe data export...")
        
        # Export charges
        charges = self.get_all_charges()
        self.save_charges_csv(charges)
        
        # Export refunds
        refunds = self.get_all_refunds()
        self.save_refunds_csv(refunds)
        
        self.print_summary(charges, refunds)
    
    def get_all_charges(self):
        """Fetch all successful charges with pagination."""
        print("Fetching charges...")
        all_charges = []
        has_more = True
        starting_after = None
        
        while has_more:
            try:
                response = stripe.Charge.list(
                    limit=100,
                    starting_after=starting_after
                )
                
                successful_charges = [
                    charge for charge in response.data 
                    if charge.status == 'succeeded'
                ]
                
                for charge in successful_charges:
                    processed_charge = self.process_charge(charge)
                    all_charges.append(processed_charge)
                
                has_more = response.has_more
                if has_more and response.data:
                    starting_after = response.data[-1].id
                
                print(f"Processed {len(successful_charges)} charges...")
                time.sleep(0.1)  # Rate limiting
                
            except Exception as e:
                print(f"Error fetching charges: {e}")
                break
        
        return all_charges
    
    def process_charge(self, charge):
        """Transform charge data into standardized format."""
        amount = charge.amount / 100
        
        return {
            'charge_id': charge.id,
            'payment_intent_id': charge.payment_intent or '',
            'order_number': self.extract_order_number(charge.metadata),
            'amount': amount,
            'currency': charge.currency.upper(),
            'datetime': self.unix_to_eastern_time(charge.created),
            'customer_id': charge.customer or '',
            'payment_method_id': charge.payment_method or '',
            'card_last4': self.safe_get(charge, 'payment_method_details.card.last4'),
            'card_brand': self.safe_get(charge, 'payment_method_details.card.brand'),
            'status': charge.status,
            'description': charge.description or '',
            'application_fee_amount': round(amount * 0.01, 2)
        }
    
    def unix_to_eastern_time(self, unix_timestamp):
        """Convert Unix timestamp to Eastern Time formatted string."""
        utc_dt = datetime.fromtimestamp(unix_timestamp, tz=self.utc_tz)
        et_dt = utc_dt.astimezone(self.et_tz)
        return et_dt.strftime('%m/%d/%Y %H:%M:%S')
    
    def safe_get(self, obj, path, default=''):
        """Safely extract nested attributes."""
        keys = path.split('.')
        for key in keys:
            if hasattr(obj, key):
                obj = getattr(obj, key)
            else:
                return default
        return obj if obj is not None else default
    
    def extract_order_number(self, metadata):
        """Extract order number from metadata."""
        if not metadata:
            return ''
        return metadata.get('resourceId', metadata.get('resourceID', ''))

# Usage
if __name__ == "__main__":
    exporter = StripeDataExporter('sk_test_your_api_key_here')
    exporter.export_all_data()
```

---

## Conclusion

This documentation represents a comprehensive understanding of Stripe's API and webhook systems based on real-world implementation experience. The key to successful integration is:

1. **Understanding the data relationships** between PaymentIntents, Charges, and Refunds
2. **Implementing consistent data transformation** across API and webhook sources  
3. **Proper timezone handling** for business requirements
4. **Robust error handling** and monitoring
5. **Following security best practices** for webhook verification

The patterns and examples provided here should serve as a solid foundation for any Stripe integration project requiring both historical data import and real-time transaction processing.