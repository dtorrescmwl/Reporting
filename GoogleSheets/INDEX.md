# Google Sheets Index

This directory contains all live Google Sheets with real data and their corresponding URLs.

## 🏥 CarePortals Sheets

### CarePortals_Orders.xlsx
- **URL**: [Add Google Sheets URL here]
- **Purpose**: Order processing data with full order details and status tracking
- **Last Updated**: [Add date]
- **Key Features**: 
  - Complete order lifecycle tracking
  - Customer information and order details
  - Status history and updates

### Database_CarePortals.xlsx
- **URL**: https://docs.google.com/spreadsheets/d/1PaCOgNJmKSb2VsJjCMjWpCG-gwrO7uVkuTAFUdrV-_o/edit
- **Purpose**: Normalized database structure for relational data storage
- **Last Updated**: October 7, 2025
- **Total Sheets**: 16 sheets with 5,100+ total records
- **Complete Schema**: See `/GoogleSheets/DATABASE_CAREPORTALS_SCHEMA.md` for detailed documentation
- **Key Features**:
  - **Core Tables**: orders (476), customers (281), products (26), addresses (248)
  - **Subscription Management**: active (206), paused (15), cancelled (53), full_log (202)
  - **Payment Integration**: payment_succesful (438), refund.created (121) with real-time webhooks
  - **🆕 Order Tracking**: order.updated (3,081) - Real-time order status changes
  - **Relational Structure**: Proper foreign keys with MD5-hashed address deduplication
  - **Data Quality**: Email-based customer deduplication, normalized addresses
  - **Enhanced Products**: Short_name field for dashboard display
  - **Stripe Integration**: Complete payment ecosystem with historical and real-time data
    - **payment_succesful Tab**: ✅ **REAL-TIME** Live webhook-driven payment tracking from StripeTracking.js
    - **refund.created Tab**: ✅ **REAL-TIME** Live webhook-driven refund tracking from StripeTracking.js
    - **API Integration**: Automatic order number extraction, card details, actual fees
  - **Quality Controls**: 99%+ data completeness, timezone standardization (Eastern Time)

### Customer_Support.xlsx
- **URL**: https://docs.google.com/spreadsheets/d/1h-ttn7R6s2KszovW_NvBI1x6fVUaXAjcID6-Xa0ISsw/edit?gid=1296501344#gid=1296501344
- **Web App URL**: https://script.google.com/macros/s/AKfycbxci3zpOxCyTHRLh47aje0nx9HrAUSvRFflDV8Kz8TSK1Ogst5w0Y_A-65xQMTOTsupdQ/exec
- **AppScript**: customer_support_order_tracking.js
- **Purpose**: Real-time order status tracking for customer support
- **Last Updated**: Today (automatically updated via webhooks)
- **Key Features**:
  - Real-time status tracking across tabs (pending, awaiting_payment, etc.)
  - Race condition protection using timestamps
  - Eastern Time conversion
  - Product dictionary lookup
  - EMR profile links for customer access
  - Full audit log of all order changes

## 🔗 Embeddables Sheets

### Embeddables.xlsx
- **URL**: [Add Google Sheets URL here]  
- **Purpose**: Form submission tracking and funnel analysis for embeddable forms
- **Last Updated**: September 8, 2025
- **Key Features**:
  - Form submission data from all embeddables
  - Conversion tracking and analytics
  - User journey mapping
  - Dashboard integration for real-time analytics

### extended_record.csv
- **Location**: `GoogleSheets/extended_record.csv`
- **Purpose**: Extended order and customer data beyond Database_CarePortals scope
- **Last Updated**: September 8, 2025
- **Key Features**:
  - 224 order records with customer information
  - Financial data (total_amount, discount_amount, base_amount)
  - Datetime Purchase timestamps
  - Ready for merge into Database_CarePortals.xlsx

## 📊 Sheet Management Guidelines

### Adding New Sheets
1. Add the actual XLSX file to this directory
2. Update this INDEX.md with the sheet details
3. Include the live Google Sheets URL
4. Document the purpose and key features
5. Note the associated AppScript if applicable

### URL Management
- Keep all Google Sheets URLs updated in this index
- Include both view and edit links where appropriate
- Document any special permissions or sharing settings

### Data Backup
- XLSX files in this directory serve as periodic backups
- Live data is always in the Google Sheets URLs listed above
- Update XLSX files periodically to capture current state

## 🔧 Related Resources

- **AppScripts**: See `/AppScripts/` directory for all related Google Apps Scripts
- **Templates**: See individual system directories (e.g., `/CarePortals/Templates/`) for clean templates
- **Documentation**: See `/SystemDocumentation/` for technical guides and setup instructions