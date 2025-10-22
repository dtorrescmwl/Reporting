# Stripe Payment Data Integration

This directory contains the Stripe API integration for extracting historical payment data and linking it to CarePortals orders.

## 📁 Files

### stripe_exporter.py
**Purpose**: Python script to extract complete historical charges and refunds data from Stripe API

**Features**:
- Fetches all successful charges with complete metadata
- Extracts all refunds with relationships to original charges
- Links charges to orders via `metadata.resourceId` field
- Populates customer email information
- Exports to separate CSV files for charges and refunds
- Handles API rate limiting and pagination
- Secure API key management via environment variables

**Usage**:
```bash
cd /home/cmwldaniel/Reporting/Scripts/DataProcessing/Stripe/
python3 stripe_exporter.py
```

**Dependencies**:
- `stripe` - Stripe Python SDK
- `python-dotenv` - Environment variable management
- `csv`, `os`, `datetime`, `time` - Standard Python libraries

### stripe_charges.csv
**Purpose**: Complete historical charge data from Stripe

**Key Fields**:
- `charge_id` - Unique Stripe charge identifier
- `amount` - Charge amount in dollars
- `datetime` - Transaction timestamp
- `metadata_resource_id` - Links to order ID in CarePortals system
- `customer_id` - Stripe customer identifier
- `email` - Customer email address
- `payment_method_type` - Payment method (card, etc.)
- `card_brand` - Card brand (visa, mastercard, etc.)
- `status` - Charge status (succeeded, etc.)
- `refunded` - Boolean indicating if charge was refunded
- `amount_refunded` - Total amount refunded for this charge

### stripe_refunds.csv
**Purpose**: Complete historical refund data from Stripe

**Key Fields**:
- `refund_id` - Unique Stripe refund identifier
- `charge_id` - Links back to original charge
- `amount` - Refund amount in dollars
- `datetime` - Refund timestamp
- `reason` - Reason for refund
- `status` - Refund status
- `metadata_resource_id` - Original order ID from charge metadata

## 🔗 Integration with CarePortals

### Order Linking
Charges are linked to CarePortals orders through the `metadata.resourceId` field in Stripe charges. This field contains the order ID from the CarePortals system.

### Database Integration
The payment data is integrated into the `Database_CarePortals.xlsx` Google Sheet through two methods:

#### Historical Data (One-time Export)
- **Charges Tab**: Complete historical charge data from CSV export
- **Refunds Tab**: Complete historical refund data from CSV export

#### Real-time Data (Webhook Integration)
- **payment_succesful Tab**: ✅ **LIVE** Real-time webhook-driven payment tracking
- **refund.created Tab**: ✅ **LIVE** Real-time webhook-driven refund tracking
- **AppScript**: `/AppScripts/CarePortals/StripeTracking.js`
- **Webhook Events**:
  - `payment_intent.succeeded` → payment_succesful tab
  - `refund.created` → refund.created tab

### Relationship Mapping
```
Orders (CarePortals) ←→ Charges (Stripe) ←→ Refunds (Stripe)
     order_id     ←→  metadata.resourceId  ←→    charge_id

Data Flow:
1. Historical: stripe_exporter.py → CSV files → charges/refunds tabs
2. Real-time: Stripe webhooks → StripeTracking.js → payment_succesful/refund.created tabs
```

## 🔒 Security

### API Key Management
- Stripe API key is stored in `.env` file in project root
- `.env` file is excluded from git via `.gitignore`
- Script uses `python-dotenv` to load environment variables securely

### Environment Variables Required
```bash
# In .env file
STRIPE_API_KEY=sk_live_...your_stripe_api_key...
```

## 📊 Data Usage

### Analytics Applications
- Revenue tracking and reconciliation
- Refund analysis and patterns
- Payment method preferences
- Customer payment behavior analysis
- Order-to-payment lifecycle tracking

### Reporting Integration
- Dashboard visualization of payment metrics
- Customer support payment lookup
- Financial reconciliation reports
- Business intelligence and forecasting

## 🔄 Data Refresh

### Manual Refresh
Run the `stripe_exporter.py` script to update the CSV files with latest Stripe data.

### Automation Considerations
- Script can be scheduled for regular execution
- Consider API rate limits for frequent updates
- Monitor for new charges and refunds since last export
- Update Google Sheets after CSV refresh

## 📋 Next Steps

1. **Automated Integration**: Consider webhook integration for real-time updates
2. **Dashboard Enhancement**: Add Stripe metrics to existing analytics dashboard
3. **Reconciliation Reports**: Create automated order-payment matching reports
4. **Customer Support**: Integrate payment lookup into support tools

---

**Last Updated**: September 15, 2025
**Maintainer**: System Administrator