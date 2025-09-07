# CarePortals Webhook Data Structures

This document provides reference examples of the JSON payloads sent by CarePortals webhooks for different event types.

## Subscription Events

CarePortals sends subscription webhooks for the following events:
- `subscription.created` - When a new subscription is created
- `subscription.active` - When a subscription becomes active  
- `subscription.paused` - When a subscription is paused
- `subscription.cancelled` - When a subscription is cancelled

### Subscription Event JSON Structure

```json
{
    "_id": "6803189d5fa95de751809d9a",
    "organization": "your_org",
    "customer": {
        "_id": "67db225426518e7646bd28e9",
        "email": "your_email@example.com",
        "phone": "+1-XXX-XXX-XXXX",
        "firstName": "Jhon",
        "lastName": "Doe"
    },
    "product": "6740b2cfe34bda25c01b2108",
    "phases": [
        {
            "price": 658,
            "cycles": "1",
            "requirements": [
                {
                    "type": "qnr",
                    "key": "facesheet"
                },
                {
                    "type": "qnr",
                    "key": "facesheet_ext"
                },
                {
                    "type": "qnr",
                    "key": "wlus"
                },
                {
                    "type": "qnr",
                    "key": "govId"
                },
                {
                    "type": "qnr",
                    "key": "selfie"
                },
                {
                    "type": "qnr",
                    "key": "bodySelfie"
                }
            ],
            "fillingCycleInterval": 1,
            "fillingCycleUnit": "month",
            "billableCycleInterval": 1
        },
        {
            "price": 0,
            "cycles": "2",
            "requirements": [
                {
                    "type": "qnr",
                    "key": "wlusmonthly"
                },
                {
                    "type": "qnr",
                    "key": "bodySelfie"
                }
            ],
            "fillingCycleInterval": 1,
            "fillingCycleUnit": "month",
            "billableCycleInterval": 1
        },
        {
            "price": 349,
            "cycles": 1,
            "requirements": [
                {
                    "type": "qnr",
                    "key": "wlusmonthly"
                },
                {
                    "type": "qnr",
                    "key": "bodySelfie"
                }
            ],
            "fillingCycleInterval": 1,
            "fillingCycleUnit": "month",
            "billableCycleInterval": 1
        },
        {
            "price": 349,
            "cycles": 0,
            "requirements": [
                {
                    "type": "qnr",
                    "key": "wlusmonthly"
                },
                {
                    "type": "qnr",
                    "key": "bodySelfie"
                }
            ],
            "fillingCycleInterval": 4,
            "fillingCycleUnit": "week",
            "billableCycleInterval": 1,
            "billingCycleInterval": null,
            "billingCycleUnit": "week"
        }
    ],
    "currentCycle": 4,
    "nextCycleDate": "2025-08-14T18:21:14.150Z",
    "status": "active",
    "statusHistory": [
        {
            "prevStatus": "active",
            "newStatus": "cancelled",
            "updatedAt": "2025-08-07T15:56:26.833Z",
            "userId": "anon_user_id"
        }
    ],
    "currency": "USD",
    "meta": {
        "initialTransactionId": "transaction_id"
    },
    "createdAt": "2025-04-19T03:29:33.581Z",
    "updatedAt": "2025-07-14T18:21:14.151Z",
    "__v": 0,
    "nextCycleOverrides": null,
    "upcomingReminderDate": "2025-08-07T18:21:14.150Z"
}
```

### Key Subscription Fields

- **`_id`**: Unique subscription identifier
- **`customer`**: Customer information object with ID, email, phone, and name
- **`product`**: Product ID for the subscribed product
- **`phases`**: Array of subscription phases with pricing and requirements
- **`currentCycle`**: Current cycle number the subscription is in
- **`status`**: Current subscription status (active, paused, cancelled)
- **`createdAt/updatedAt`**: ISO timestamps in UTC format

---

## Order Events  

CarePortals sends order webhooks for the following events:
- `order.created` - When a new order is placed
- `order.updated` - When an order status changes

### Order Event JSON Structure

```json
{
  "_id": "7893efc2581fe0505d48c681",
  "organization": "clinic_x",
  "id": 9876,
  "customer": {
    "_id": "7820cf7b9fdd8c7aae179818",
    "email": "janedoe@email.com",
    "phone": "+15551234567",
    "firstName": "Jane",
    "lastName": "Doe"
  },
  "status": "shipped",
  "statusHistory": [],
  "source": "api",
  "lineItems": [
    {
      "name": "Health Supplement (4-week)",
      "productId": "778e289d7ea1698a8757aa44",
      "price": 199,
      "listPrice": 199,
      "discount": {
        "amount": 199,
        "reductionAmount": 50,
        "reductionType": "percent",
        "type": "coupon",
        "referenceId": "SAVE50NOW"
      },
      "quantity": 1,
      "isSubscription": true,
      "type": "physical",
      "requirements": [
        {
          "type": "qnr",
          "key": "intake_form"
        },
        {
          "type": "qnr",
          "key": "health_history"
        },
        {
          "type": "qnr",
          "key": "photo_id"
        },
        {
          "type": "qnr",
          "key": "selfie_photo"
        }
      ],
      "extras": {
        "pharmacies": {
          "CityCentralPharmacy ID": "XYZ123456ABCDEF7890"
        },
        "excludeInjectionKit": false,
        "GotoPharmacy": false,
        "bigcommerceId": null,
        "stripePriceId": null,
        "drugName": "CityCentral Health Supplement 4 wk starter 10mg",
        "includeInjectionKit": [],
        "categories": ["supplements"]
      }
    }
  ],
  "shippingAddress": {
    "address1": "123 Main Street",
    "address2": "Apt 5",
    "city": "Anytown",
    "provinceCode": "NY",
    "postalCode": "10001",
    "countryCode": "US"
  },
  "coupon": "SAVE50NOW",
  "invoices": [],
  "totalAmount": 99.50,
  "discountAmount": 99.50,
  "baseAmount": 199,
  "requirements": [],
  "version": 3,
  "isDeleted": false,
  "creditUsedAmount": 0,
  "createdAt": "2024-07-25T10:00:00.000Z",
  "updatedAt": "2024-07-25T10:05:00.000Z",
  "__v": 1,
  "assignedTo": {
       "_id": "6823w2d85r49ba01b19f12ff",
       "username": "CityCentral-pharmacy@portals.care",
       "firstName": "CityCentral",
       "lastName": "Pharmacy"
  }
}
```

### Key Order Fields

- **`_id`**: Internal CarePortals order ID  
- **`id`**: Customer-facing order number
- **`customer`**: Customer information object
- **`status`**: Current order status (pending, shipped, delivered, etc.)
- **`lineItems`**: Array of ordered products with pricing and details
- **`shippingAddress`**: Complete shipping address information
- **`totalAmount`**: Final amount charged to customer
- **`discountAmount`**: Total discount applied
- **`baseAmount`**: Original price before discounts
- **`assignedTo`**: Pharmacy or provider assigned to fulfill the order
- **`createdAt/updatedAt`**: ISO timestamps in UTC format

---

## Webhook JSON Data Mapping

When setting up CarePortals automations, use the `{{field}}` syntax to extract data from the webhook payload:

### Common Patterns

**Customer Information:**
```json
"customer._id": "{{customer._id}}",
"customer.email": "{{customer.email}}",
"customer.firstName": "{{customer.firstName}}",
"customer.lastName": "{{customer.lastName}}",
"customer.phone": "{{customer.phone}}"
```

**Nested Objects:**
```json
"shippingAddress.address1": "{{shippingAddress.address1}}",
"shippingAddress.city": "{{shippingAddress.city}}",
"shippingAddress.provinceCode": "{{shippingAddress.provinceCode}}"
```

**Array Elements:**
```json
"lineItems.0.name": "{{lineItems.0.name}}",
"lineItems.0.productId": "{{lineItems.0.productId}}",
"lineItems.0.price": "{{lineItems.0.price}}"
```

**Direct Fields:**
```json
"_id": "{{_id}}",
"status": "{{status}}",
"totalAmount": "{{totalAmount}}",
"createdAt": "{{createdAt}}"
```

---

## Notes

- All timestamps are provided in UTC ISO format and should be converted to Eastern Time in AppScript processing
- The `customer` object is consistent across both subscription and order events
- Nested objects and arrays use dot notation for field access
- Some fields may be null or empty depending on the event context