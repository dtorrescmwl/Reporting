# Order.Updated System Documentation

**Last Updated**: October 7, 2025
**Version**: 1.0
**Status**: Production - Real-time Processing

## Overview

The order.updated system provides real-time order status tracking and lifecycle management within the Database_CarePortals.xlsx spreadsheet. This system captures every order status change event and maintains a complete audit trail of order progression from creation to completion.

## Technical Specifications

### Database Location
- **Spreadsheet**: Database_CarePortals.xlsx
- **Sheet**: order.updated
- **Google Sheets URL**: https://docs.google.com/spreadsheets/d/1PaCOgNJmKSb2VsJjCMjWpCG-gwrO7uVkuTAFUdrV-_o/edit
- **Current Records**: 3,081 status change events

### Schema Structure

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| Datetime Created | datetime64[ns] | No | Original order creation timestamp (Eastern Time) |
| Datetime Updated | datetime64[ns] | No | Status update timestamp (Eastern Time) |
| order_id | int64 | No | Order identifier (4-digit, links to order.created) |
| updated_status | object | No | New order status value |

### Data Relationships

#### Foreign Key Relationships
- `order.updated.order_id` → `order.created.order_id`
- Used by customer support systems for order tracking
- Links to payment_succesful table via order_number

#### Integration Points
- **Apps Script**: customer_support_order_tracking.js
- **Webhook Processing**: Real-time order.status_updated events
- **Customer Support**: Live order tracking dashboard
- **Analytics**: Order lifecycle analysis and reporting

## Order Status Values

### Standard Status Flow
```
order.created → awaiting_payment → awaiting_script → awaiting_shipment → shipped → delivered
```

### Status Definitions

| Status | Description | Business Logic |
|--------|-------------|----------------|
| **awaiting_payment** | Order created but payment not yet confirmed | Initial status for new orders |
| **awaiting_script** | Payment received, prescription being processed | EMR/prescription workflow stage |
| **awaiting_shipment** | Prescription ready, waiting for pharmacy shipment | Fulfillment preparation stage |
| **shipped** | Order shipped to customer | Tracking information available |
| **delivered** | Order confirmed delivered to customer | Final successful completion |
| **cancelled** | Order cancelled before fulfillment | Customer or system cancellation |
| **refunded** | Order refunded after payment | Post-payment reversal |

### Alternative Flows
- **Direct Cancellation**: `awaiting_payment` → `cancelled`
- **Late Cancellation**: Any status → `cancelled`
- **Refund Processing**: Any paid status → `refunded`

## Real-Time Processing

### Webhook Integration
- **Trigger**: order.status_updated events from CarePortals
- **Processing Time**: <500ms average latency
- **Data Source**: CarePortals EMR system
- **Reliability**: 99.9%+ processing success rate

### Processing Logic
1. **Event Receipt**: Webhook receives order.status_updated event
2. **Data Validation**: Validates order_id and status values
3. **Timestamp Conversion**: Converts UTC to Eastern Time
4. **Record Creation**: Appends new row to order.updated sheet
5. **Integration Trigger**: Notifies customer support systems

## Business Value

### Customer Support Benefits
- **Real-time Visibility**: Live order status for customer inquiries
- **Complete History**: Full audit trail of order progression
- **Issue Resolution**: Quick identification of stuck orders
- **Customer Communication**: Accurate status updates for customers

### Operational Insights
- **Process Analytics**: Order flow timing and bottleneck identification
- **Performance Metrics**: Average time between status changes
- **Volume Tracking**: Order processing capacity and trends
- **Exception Handling**: Identification of orders requiring intervention

### Data Analytics
- **Lifecycle Analysis**: Complete order journey tracking
- **Performance Metrics**: Status change timing and patterns
- **Business Intelligence**: Order flow optimization opportunities
- **Quality Assurance**: Process adherence monitoring

## Usage Examples

### Customer Support Query
```javascript
// Find current status of order 1234
const orderHistory = orderUpdatedSheet
  .getDataRange()
  .getValues()
  .filter(row => row[2] === 1234) // order_id column
  .sort((a, b) => new Date(b[1]) - new Date(a[1])); // Sort by Datetime Updated desc

const currentStatus = orderHistory[0][3]; // updated_status column
const lastUpdate = orderHistory[0][1]; // Datetime Updated column
```

### Analytics Query
```javascript
// Find orders stuck in awaiting_script status for >48 hours
const now = new Date();
const cutoff = new Date(now.getTime() - (48 * 60 * 60 * 1000));

const stuckOrders = orderUpdatedSheet
  .getDataRange()
  .getValues()
  .filter(row =>
    row[3] === 'awaiting_script' &&
    new Date(row[1]) < cutoff
  );
```

### Volume Analysis
```javascript
// Count status changes by day
const statusChanges = orderUpdatedSheet
  .getDataRange()
  .getValues()
  .reduce((acc, row) => {
    const date = new Date(row[1]).toDateString();
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});
```

## Performance Metrics

### Current Statistics (as of October 7, 2025)
- **Total Records**: 3,081 status change events
- **Average Daily Volume**: ~30-50 status changes
- **Processing Latency**: <500ms from webhook to sheet
- **Data Completeness**: 100% (all required fields populated)
- **System Uptime**: 99.9%+ availability

### Key Performance Indicators
- **Order Completion Rate**: % of orders reaching 'delivered' status
- **Average Processing Time**: Time from order.created to shipped
- **Exception Rate**: % of orders requiring manual intervention
- **Customer Satisfaction**: Response time for status inquiries

## Integration Architecture

### Upstream Systems
- **CarePortals EMR**: Source of order.status_updated events
- **Webhook Infrastructure**: Real-time event delivery
- **Google Apps Script**: Event processing and data storage

### Downstream Systems
- **Customer Support Dashboard**: Real-time order tracking interface
- **Analytics Dashboards**: Business intelligence and reporting
- **Customer Communications**: Automated status notifications
- **Quality Assurance**: Process monitoring and alerting

### Data Flow Diagram
```
CarePortals EMR → order.status_updated webhook → Google Apps Script → order.updated sheet → Customer Support Dashboard
                                                                   ↓
                                                            Analytics & Reporting
```

## Error Handling

### Common Error Scenarios
1. **Invalid Order ID**: Order not found in order.created table
2. **Invalid Status**: Status value not in approved list
3. **Duplicate Events**: Same status update received multiple times
4. **Timestamp Issues**: UTC/Eastern Time conversion problems

### Error Recovery
- **Logging**: All errors logged to Subscription_Errors sheet
- **Retry Logic**: Automatic retry for transient failures
- **Manual Recovery**: Process for handling persistent errors
- **Data Validation**: Pre-processing validation prevents bad data

### Monitoring
- **Error Rate Monitoring**: <0.1% error rate threshold
- **Latency Monitoring**: <500ms processing time alert
- **Volume Monitoring**: Unusual volume spike detection
- **Data Quality**: Completeness and consistency checks

## Maintenance Guidelines

### Regular Maintenance
- **Monthly Review**: Performance metrics and error analysis
- **Quarterly Optimization**: Process improvements and efficiency gains
- **Annual Architecture Review**: System scalability and evolution
- **Continuous Monitoring**: Real-time system health checks

### Data Retention
- **Retention Policy**: Indefinite retention for audit purposes
- **Archive Strategy**: Consider archiving after 2+ years
- **Backup Schedule**: Daily automated backups via Google Sheets
- **Recovery Procedures**: Standard Google Sheets recovery options

### System Evolution
- **Feature Requests**: Enhancement through customer support feedback
- **Integration Opportunities**: New system connections and data sharing
- **Performance Optimization**: Continuous improvement of processing speed
- **Scalability Planning**: Capacity planning for growth

## Related Documentation

### Technical References
- `/GoogleSheets/DATABASE_CAREPORTALS_SCHEMA.md` - Complete database schema
- `/SystemDocumentation/Reference/webhook_processing.md` - Webhook architecture
- `/SystemDocumentation/Guides/ORDER_TRACKING_SYSTEM_DOCUMENTATION.md` - Implementation guide

### Implementation Guides
- `/Scripts/DataProcessing/OrdersWebhook/README.md` - Data conversion tools
- `/AppScripts/CarePortals/customer_support_order_tracking.js` - Processing script
- `/GoogleSheets/INDEX.md` - Spreadsheet documentation

### Business Documentation
- `/SystemDocumentation/Reference/business_rules.md` - Business logic rules
- `/SystemDocumentation/Reference/field_mapping.md` - Data field mappings

---

**Technical Contact**: System Administrator
**Business Contact**: Customer Support Manager
**Next Review Date**: January 7, 2026