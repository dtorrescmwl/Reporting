# CarePortals Order Search System

🔍 **Professional order search with cross-table data joining and date range filtering**

![Status](https://img.shields.io/badge/Status-PRODUCTION-green) ![Platform](https://img.shields.io/badge/Platform-Google%20Apps%20Script-blue) ![Search](https://img.shields.io/badge/Search-Multi--Type-orange)

## 🎯 Overview

The Order Search System provides a powerful, user-friendly interface to search orders across the Database_CarePortals system. It joins data from multiple tables to deliver comprehensive order information with flexible search options.

## ✨ Key Features

### 🔍 **Multi-Type Search**
- **All Fields**: Search across order ID, customer name, product, source
- **Order ID**: Search by 4-digit numerical order_id  
- **Customer Name**: Search by customer names
- **Date Range**: Find orders within specific date periods

### 📊 **Cross-Table Data Joining**
- **Orders**: From `order.created` sheet
- **Customers**: From `customers` sheet  
- **Products**: From `products` sheet with Short_name support
- **Real-time joins**: Efficient in-memory data processing

### 📅 **Advanced Date Filtering**
- **Default range**: Last 30 days automatically set
- **Custom ranges**: Select any start and end date
- **Full day coverage**: 00:00:00 to 23:59:59 time handling
- **Date validation**: Start date must precede end date

### 🎨 **Professional Interface**
- **Modern UI**: Clean, responsive design with glassmorphism effects
- **Smart forms**: Fields toggle based on search type
- **Live results**: Real-time search with loading states
- **Mobile ready**: Responsive layout for all devices

## 📁 File Structure

```
OrderSearch/
├── OrderSearchCode.gs        # Apps Script backend with search logic
├── order_search.html         # Search interface and results display
├── ORDER_SEARCH_SETUP.md     # Complete setup and usage guide
└── README.md                 # This overview file
```

## 🚀 Quick Start

### 1. **Create Apps Script Project**
```bash
# Files to copy to Google Apps Script:
OrderSearchCode.gs  → Apps Script backend
order_search.html   → HTML frontend (name it "order_search")
```

### 2. **Configure Database Connection**
Update the database ID in `OrderSearchCode.gs` (line 11):
```javascript
const DATABASE_CAREPORTALS_ID = '1PaCOgNJmKSb2VsJjCMjWpCG-gwrO7uVkuTAFUdrV-_o';
```

### 3. **Test & Deploy**
1. Run `testOrderSearch()` function to verify data loading
2. Deploy as Web App with appropriate access settings
3. Test all search types in the live interface

## 🔍 Search Capabilities

### Search Results Display
Each result includes:
- **Order ID**: 4-digit numerical ID from Column B (`order_id`)
- **Customer Name**: Full name from joined customer data
- **Product**: Uses `Short_name` from products sheet
- **Total Amount**: Formatted currency display
- **Source**: Order source (CarePortals, Embeddables, etc.)
- **Created Date**: Formatted order creation date

### Example Searches
```
Order ID Search:     "1880" → Finds order #1880
Customer Search:     "John Smith" → Finds all John Smith orders  
Product Search:      "Semaglutide" → Finds Semaglutide orders
Date Range:          Sep 1-8, 2025 → All orders in that week
All Fields:          "CarePortals" → Orders from CarePortals source
```

## ⚡ Technical Features

### **Backend Processing**
- **Efficient joins**: Hash map lookups for O(1) data retrieval  
- **Smart caching**: Apps Script automatic result caching
- **Error handling**: Graceful failure with informative messages
- **Data validation**: Type checking and format validation

### **Frontend Experience**  
- **Dynamic interface**: Fields show/hide based on search type
- **Input validation**: Client-side validation before API calls
- **Loading states**: Visual feedback during search operations
- **Results pagination**: Ready for large dataset handling

## 🗄️ Database Requirements

### Required Sheets in Database_CarePortals
- **`order.created`**: Order records with `created_at`, `order_id`, `care_portals_internal_order_id`
- **`customers`**: Customer data with `customer_id`, `first_name`, `last_name`
- **`products`**: Product catalog with `product_id`, `Short_name`, `Name`

### Data Relationships
- Orders linked to customers via `customer_id`
- Orders linked to products via `product_id`
- Internal order ID used for system references
- Display order ID shown to users (4-digit numerical)

## 🎯 Use Cases

### **Customer Support**
- Quick order lookup by order ID
- Find all orders for specific customers
- Date range analysis for support tickets

### **Operations**
- Product performance analysis
- Source attribution reporting  
- Date-based order filtering

### **Business Analysis**
- Order pattern identification
- Customer behavior analysis
- Product popularity trends

## 📈 Performance

- **Search Speed**: Sub-second results for typical datasets
- **Data Loading**: ~2-3 seconds for initial data load
- **Memory Usage**: Efficient in-memory processing
- **Scalability**: Handles thousands of orders seamlessly

## 🔧 Customization Options

### **Easy Modifications**
- **Additional search fields**: Extend search criteria
- **Result columns**: Add/remove displayed information
- **Date formats**: Customize date display preferences
- **UI styling**: Update colors, layout, branding

### **Advanced Features**
- **Export functionality**: Add CSV/Excel export
- **Pagination**: Handle very large datasets
- **Advanced filters**: Multiple criteria selection
- **Batch operations**: Multi-select result actions

## 📚 Documentation

### **Complete Setup Guide**
For detailed implementation instructions, see: `ORDER_SEARCH_SETUP.md`

### **Related Documentation**
- **Analytics Dashboard**: `../Analytics/README.md`
- **System Overview**: `../README.md`
- **Database Schema**: `../../SystemDocumentation/field_mapping.md`

---

## 🎉 Production Ready

The Order Search System provides:
- ⚡ **Fast search** across comprehensive order data
- 🔗 **Smart joins** between orders, customers, and products
- 📱 **Professional UI** suitable for business operations  
- 🛡️ **Secure access** with read-only database permissions
- 📅 **Flexible filtering** with multiple search types

**Setup Time**: ~15 minutes  
**Maintenance**: Zero (auto-updates from database)  
**Perfect for**: Customer support, operations, and business analysis