# Order Search System Setup Guide

## 📋 Overview

The Order Search System provides a simple, powerful interface to search orders across the Database_CarePortals system. It joins data from multiple tables to provide comprehensive order information in a clean, searchable interface.

## 🔧 System Components

### Files Created
- **`OrderSearchCode.gs`** - Apps Script backend with search logic and data joining
- **`order_search.html`** - HTML frontend with search interface and results table
- **`ORDER_SEARCH_SETUP.md`** - This setup guide

### Key Features
- **Cross-table data joining**: Combines order.created, customers, and products tables
- **4-digit Order ID extraction**: Shows user-friendly short order IDs
- **Multiple search types**: Order ID, customer name, or all fields
- **Real-time search**: Fast results with loading states
- **Responsive design**: Works on desktop and mobile
- **Professional UI**: Clean, modern interface

## 🚀 Setup Instructions

### Step 1: Create New Apps Script Project

1. **Go to Apps Script**: [script.google.com](https://script.google.com)
2. **Create new project**: Click "New Project"
3. **Name the project**: "Order_Search_System" (or your preferred name)
4. **Delete default code** from the `Code.gs` file

### Step 2: Add Backend Code

1. **Replace Code.gs content** with `OrderSearchCode.gs`
2. **Update the Database ID** (line 11):
   ```javascript
   const DATABASE_CAREPORTALS_ID = '1PaCOgNJmKSb2VsJjCMjWpCG-gwrO7uVkuTAFUdrV-_o';
   ```
3. **Save the project** (Ctrl+S)

### Step 3: Add HTML Frontend

1. **Add HTML file**: Click `+` next to "Files" → "HTML"
2. **Name it**: `order_search`
3. **Replace content** with `order_search.html`
4. **Save the file**

### Step 4: Test the System

1. **Run test function**: Select `testOrderSearch` from function dropdown
2. **Click Run** to test data loading
3. **Authorize permissions** when prompted
4. **Check logs** for successful data loading

### Step 5: Deploy as Web App

1. **Click Deploy** → "New deployment"
2. **Choose type**: "Web app"
3. **Configuration**:
   - Execute as: Me
   - Who has access: Anyone (or your preference)
4. **Click Deploy**
5. **Copy the Web App URL**

### Step 6: Test Search Functionality

1. **Open Web App URL** in browser
2. **Test searches**:
   - Search by 4-digit order ID (e.g., "1234")
   - Search by customer name (e.g., "John")
   - Search all fields (e.g., "Semaglutide")

## 📊 Data Requirements

### Database Structure
The system expects these sheets in Database_CarePortals:

#### **order.created** sheet
- `care_portals_internal_order_id` or `order_id` - Order identifier
- `customer_id` or `CustomerID` - Link to customer
- `product_id` or `ProductID` - Link to product  
- `total_amount` or `TotalAmount` - Order total
- `source` or `Source` - Order source
- `created_at` or `DatetimeCreated` - Order date

#### **customers** sheet
- `customer_id` or `CustomerID` - Customer identifier
- `first_name` or `FirstName` - Customer first name
- `last_name` or `LastName` - Customer last name
- `email` or `Email` - Customer email
- `phone` or `Phone` - Customer phone

#### **products** sheet  
- `product_id` or `ProductID` - Product identifier
- `Short_name` - Preferred display name
- `Name` or `ProductName` - Full product name

## 🔍 Search Features

### Search Types
1. **All Fields** (default): Searches across order ID, customer name, product, source
2. **Order ID**: Searches only order identifiers (4-digit numerical ID)
3. **Customer Name**: Searches only customer names
4. **Date Range**: Searches orders within a specific date range

### Results Display
Each result shows:
- **Order ID**: 4-digit numerical ID from Column B (order_id)
- **Customer Name**: Full name from first + last
- **Product**: Uses Short_name if available, falls back to Name
- **Total Amount**: Formatted currency (e.g., "$45.99")
- **Source**: Order source (e.g., "CarePortals", "Embeddables")
- **Created**: Formatted date

### Date Range Search
- **Default Range**: Last 30 days (automatically set)
- **Custom Range**: Select any start and end date
- **Validation**: Start date must be before or equal to end date
- **Time Handling**: Searches from 00:00:00 on start date to 23:59:59 on end date

## ⚡ Technical Details

### Data Joining Logic
```javascript
// Customer lookup by customer_id
const customerLookup = {
  "12345": {
    name: "John Smith",
    firstName: "John", 
    lastName: "Smith"
  }
};

// Product lookup by product_id
const productLookup = {
  "1": {
    name: "Semaglutide", // Uses Short_name preferably
    fullName: "Semaglutide 2.4mg Injection"
  }
};
```

### Order ID Display Logic
```javascript
// Uses the actual order_id column (Column B) - 4-digit numerical ID
const displayOrderId = order.order_id || '';
const internalOrderId = order.care_portals_internal_order_id || '';
// Cross-references using internal ID for data joining
```

### Date Range Filtering
```javascript
// Date range validation and filtering
const orderDateTime = new Date(orderDate);
const startDateTime = new Date(startDate + 'T00:00:00');
const endDateTime = new Date(endDate + 'T23:59:59');

if (orderDateTime < startDateTime || orderDateTime > endDateTime) {
  return; // Skip this order - outside date range
}
```

### Performance Optimizations
- **In-memory joining**: Loads all data once, performs lookups in memory
- **Efficient search**: Uses string contains for flexible matching
- **Result limiting**: Can be extended with pagination for large datasets
- **Caching**: Apps Script caches function results automatically

## 🛡️ Security & Permissions

### Data Access
- **Read-only**: System only reads from Database_CarePortals
- **No data modification**: Search interface cannot alter database
- **Secure queries**: Uses SpreadsheetApp.openById() with specific sheet ID

### Privacy Considerations
- **Customer data**: Shows only names, not sensitive information
- **Order data**: Shows totals and sources, not payment details
- **Access control**: Deployable with restricted access if needed

## 🎨 UI Features

### Modern Design
- **Glassmorphism effects**: Translucent cards with blur
- **Gradient background**: Professional color scheme
- **Responsive layout**: Adapts to mobile and desktop
- **Hover effects**: Interactive table rows

### User Experience
- **Auto-focus**: Search input focused on page load
- **Enter key support**: Press Enter to search
- **Loading states**: Visual feedback during search
- **Error handling**: Clear error messages
- **No results messaging**: Helpful guidance when no matches

## 📈 Usage Examples

### Example Searches
```
Search Term: "1880" → Finds order with order_id 1880
Search Term: "John" → Finds orders for customers named John  
Search Term: "Semaglutide" → Finds orders for Semaglutide product
Search Term: "CarePortals" → Finds orders from CarePortals source
Date Range: 2025-09-01 to 2025-09-08 → Finds all orders in that week
```

### Expected Results
```
Order ID | Customer Name | Product      | Total Amount | Source      | Created
---------|---------------|--------------|--------------|-------------|--------
1880     | John Smith    | Semaglutide  | $45.99      | CarePortals | Sep 2, 2025
1881     | Jane Doe      | Tirzepatide  | $67.50      | CarePortals | Sep 2, 2025
```

## 🔧 Customization Options

### Easy Modifications
- **Additional fields**: Add more columns to results table
- **Search filters**: Add date range or source filters
- **Result limits**: Implement pagination for large datasets
- **Export features**: Add CSV/Excel export buttons

### Advanced Customizations
- **Fuzzy search**: Implement Levenshtein distance for typo tolerance
- **Advanced filters**: Multiple criteria selection
- **Real-time search**: Search-as-you-type functionality
- **Batch operations**: Select multiple results for actions

## 📞 Troubleshooting

### Common Issues

#### "Sheet not found" errors
- Verify Database_CarePortals sheet ID is correct
- Check that sheet names match: `order.created`, `customers`, `products`

#### "No results" when data exists
- Check column name mappings in Apps Script
- Verify data types (text vs numbers) in search
- Test with `testOrderSearch()` function

#### Permission errors
- Re-authorize Apps Script permissions
- Check Web App deployment settings
- Verify sheet sharing permissions

#### Slow performance
- Check data volume (system works best with <10k orders)
- Consider adding pagination for large datasets
- Monitor Apps Script execution time limits

### Debug Tools
- **Browser console**: Check for JavaScript errors
- **Apps Script logs**: View `console.log()` output
- **Test function**: Use `testOrderSearch()` to verify data loading

## 📚 Related Documentation

- **Dashboard System**: `/DashboardVisualization/README.md`
- **Database Schema**: `/SystemDocumentation/field_mapping.md`
- **CarePortals System**: `/CarePortals/README.md`

---

## 🎉 Ready to Use!

Your order search system provides:
- ⚡ **Fast searches** across all order data
- 🔗 **Joined results** from multiple database tables  
- 📱 **Mobile-friendly** responsive design
- 🎨 **Professional UI** suitable for business users
- 🛡️ **Secure access** with read-only permissions

**Setup Time**: ~15 minutes  
**Maintenance**: Zero (auto-updates from database)  
**Cost**: Free (Google Apps Script free tier)

Perfect for customer support, order lookup, and business operations!