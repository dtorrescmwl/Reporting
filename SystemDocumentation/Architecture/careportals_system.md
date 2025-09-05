# CarePortals EMR/CRM System - Technical Documentation

## System Overview

CarePortals is the Electronic Medical Records (EMR) and Customer Relationship Management (CRM) system that manages the healthcare service delivery side of operations. It handles patient orders, prescriptions, subscriptions, and the complete care lifecycle.

## Webhook Event Types

### 1. Subscription Events

#### Subscription Cancelled
- **Trigger**: `subscription.cancelled`
- **Purpose**: Track subscription cancellations for churn analysis
- **Data Payload**:
  ```json
  {
    "_id": "internal_subscription_id",
    "organization": "organization_code", 
    "id": "customer_facing_subscription_id",
    "status": "cancelled",
    "customer._id": "internal_customer_id",
    "customer.firstName": "patient_first_name",
    "customer.lastName": "patient_last_name", 
    "customer.email": "patient@email.com",
    "customer.phone": "+1234567890"
  }
  ```

#### Subscription Paused
- **Trigger**: `subscription.paused`
- **Purpose**: Track temporary subscription holds
- **Data Payload**: Same structure as cancelled, with `"status": "paused"`

### 2. Order Events

#### Order Created
- **Trigger**: `order.created` 
- **Purpose**: Track new order placement and conversion
- **Dual Webhooks**: Sends to both simple tracking and normalized database
- **Data Payload (Simple)**:
  ```json
  {
    "_id": "internal_order_id",
    "id": "customer_facing_order_id",
    "source": "order_source_channel",
    "totalAmount": 199.99,
    "discountAmount": 50.00,
    "baseAmount": 249.99,
    "creditUsedAmount": 0.00,
    "createdAt": "2024-01-15T10:30:00Z",
    "customer._id": "internal_customer_id",
    "customer.email": "patient@email.com",
    "customer.firstName": "patient_first_name",
    "customer.lastName": "patient_last_name",
    "customer.phone": "+1234567890"
  }
  ```

- **Data Payload (Full Database)**:
  ```json
  {
    "_id": "internal_order_id",
    "id": "customer_facing_order_id", 
    "source": "order_source_channel",
    "totalAmount": 199.99,
    "discountAmount": 50.00,
    "baseAmount": 249.99,
    "creditUsedAmount": 0.00,
    "createdAt": "2024-01-15T10:30:00Z",
    "coupon": "discount_code",
    "customer._id": "internal_customer_id",
    "customer.email": "patient@email.com", 
    "customer.firstName": "patient_first_name",
    "customer.lastName": "patient_last_name",
    "customer.phone": "+1234567890",
    "shippingAddress.address1": "123 Main Street",
    "shippingAddress.address2": "Apt 4B", 
    "shippingAddress.city": "Sample City",
    "shippingAddress.provinceCode": "NY",
    "shippingAddress.postalCode": "12345",
    "shippingAddress.countryCode": "US",
    "lineItems.0.productId": "product_identifier",
    "lineItems.0.name": "Product Display Name",
    "lineItems.0.drugName": "medication_compound_name", 
    "lineItems.0.listPrice": 249.99,
    "lineItems.0.price": 199.99,
    "lineItems.0.discount.reductionAmount": 50,
    "lineItems.0.discount.reductionType": "dollar"
  }
  ```

#### Order Updated
- **Trigger**: `order.status_updated`
- **Purpose**: Track order lifecycle changes (pending → processing → shipped → delivered)
- **Data Payload**: Extended order object with status history and tracking

### 3. Prescription Events

#### Prescription Created  
- **Trigger**: `prescription.created`
- **Purpose**: Track when EMR creates new prescriptions
- **Data Payload**:
  ```json
  {
    "_id": "internal_prescription_id",
    "organization": "organization_code",
    "customer._id": "internal_customer_id", 
    "customer.firstName": "patient_first_name",
    "customer.lastName": "patient_last_name",
    "customer.email": "patient@email.com", 
    "customer.phone": "+1234567890"
  }
  ```

## Business Logic

### Customer Identification
- **Primary Key**: `customer.email` - Links records across all systems
- **Secondary Key**: `customer._id` - Internal CarePortals identifier
- **Tertiary Key**: `customer.phone` - Backup matching field

### Order Processing Workflow
1. **Order Placement**: Customer completes checkout process
2. **Order Creation**: System generates internal and customer-facing IDs
3. **Prescription Generation**: Medical review creates prescription record
4. **Fulfillment**: Order moves through pharmacy and shipping
5. **Subscription Management**: Ongoing care subscription lifecycle

### Status Management
Orders progress through defined statuses:
- `pending`: Initial order placement
- `processing`: Under medical review
- `approved`: Prescription approved  
- `pharmacy`: Sent to pharmacy partner
- `shipped`: Package dispatched
- `delivered`: Received by patient
- `cancelled`: Order cancelled
- `refunded`: Payment reversed

### Error Handling
- Comprehensive webhook retry logic
- Error logging to dedicated sheets
- Fallback data recovery processes
- Data validation at every integration point
