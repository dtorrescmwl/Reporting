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
- **URL**: [Add Google Sheets URL here]
- **Purpose**: Normalized database structure for relational data storage
- **Last Updated**: [Add date]
- **Key Features**:
  - Separate tables for orders, customers, products, addresses
  - Relational structure with proper foreign keys
  - Deduplication of customer and address data

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
- **Last Updated**: [Add date]
- **Key Features**:
  - Form submission data from all embeddables
  - Conversion tracking and analytics
  - User journey mapping

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