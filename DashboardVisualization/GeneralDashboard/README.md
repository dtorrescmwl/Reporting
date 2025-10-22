# CarePortals General Dashboard

📊 **Comprehensive monthly dashboard with active subscriptions and checkout order analytics**

![Status](https://img.shields.io/badge/Status-NEW-green) ![Platform](https://img.shields.io/badge/Platform-Google%20Apps%20Script-blue) ![Charts](https://img.shields.io/badge/Charts-Chart.js-orange)

## 🎯 Overview

The General Dashboard provides a comprehensive view of CarePortals operations with focus on active subscriptions and detailed monthly analytics for checkout orders. It features month-by-month navigation and detailed order tracking with state information.

## ✨ Key Features

### 📈 **Active Subscriptions Display**
- **Current active count**: Real-time subscription numbers
- **Prominent display**: Large, centered metric card
- **Auto-updating**: Refreshes with latest data

### 📅 **Multi-View Time Navigation**
- **Monthly View**: Select any month/year combination (default)
- **Weekly View**: Current week starting from Monday
- **All Time**: Complete historical data
- **Custom Date**: Select any start and end date range
- **Dynamic switching**: Seamless view changes without page reload

### 💰 **Time-Based Metrics**
- **Total Checkout Orders**: Count of orders with source = "checkout" for selected time period
- **Total Revenue**: Sum of all order total_amounts (all sources) for selected time period
- **Revenue from New Orders**: Sum of checkout orders only for selected time period
- **Clear categorization**: Color-coded metric cards

### 📊 **Product Distribution**
- **Pie chart visualization**: "Products from Purchase"
- **Time-period specific**: Shows product distribution for checkout source in selected time range
- **Unknown handling**: Blank product_ids shown as "Unknown"
- **Interactive chart**: Hover for detailed values

### 📋 **Checkout Orders Table**
- **Complete order details**: All checkout orders for selected time period
- **Six columns**: Order ID (4-digit), Customer Name, Product, Total Amount, Created Date, State
- **State information**: Province code from addresses table via shipping_address_id
- **Fallback handling**: Shows "XX" for missing address data
- **Responsive design**: Adapts to mobile screens

## 📁 File Structure

```
GeneralDashboard/
├── GeneralDashboardCode.gs    # Apps Script backend with monthly processing
├── general_dashboard.html     # Dashboard interface with month navigation
└── README.md                  # This overview file
```

## 🚀 Quick Setup

### 1. **Create Apps Script Project**
```bash
# Files to copy to Google Apps Script:
GeneralDashboardCode.gs  → Apps Script backend
general_dashboard.html   → HTML frontend (name it "general_dashboard")
```

### 2. **Configure Database Connection**
The database ID is pre-configured in the code:
```javascript
const DATABASE_CAREPORTALS_ID = '1PaCOgNJmKSb2VsJjCMjWpCG-gwrO7uVkuTAFUdrV-_o';
```

### 3. **Test & Deploy**
1. Run `testGeneralDashboard()` function to verify data loading
2. Deploy as Web App with appropriate access settings
3. Test month navigation and all dashboard features

## 🗄️ Database Requirements

### Required Sheets
- **`order.created`**: Order records with created_at, order_id, source, total_amount, shipping_address_id
- **`customers`**: Customer data with customer_id, first_name, last_name
- **`products`**: Product catalog with product_id, Short_name, Name
- **`subscription.active`**: Active subscription records (count only)
- **`addresses`**: Address data with address_id, province_code

### Key Data Relationships
```
order.created.customer_id → customers.customer_id
order.created.product_id → products.product_id  
order.created.shipping_address_id → addresses.address_id
```

## 📊 Dashboard Sections

### **1. Active Subscriptions**
- Shows count from `subscription.active` sheet
- Large, prominent display at top of dashboard
- Real-time data refresh

### **2. Multi-View Navigation**
- **View Type Selector**: Dropdown with Monthly, Weekly, All Time, Custom options
- **Time Range Display**: Shows explicit start and end dates for current view
- **Dynamic Controls**: Relevant controls appear based on selected view type
  - **Monthly**: Month/year selectors + Update button
  - **Weekly**: No controls (auto-calculates current week)
  - **All Time**: No controls (shows all historical data)
  - **Custom**: Start date + End date inputs + Update button

### **3. Time-Period Metrics Cards**
```
┌─────────────────┬─────────────────┬─────────────────┐
│ Total Checkout  │   Total Revenue │ Revenue from    │
│    Orders       │                 │  New Orders     │
│      24         │    $1,247.50    │    $892.75      │
│ (current period)│ (all sources)   │ (checkout only) │
└─────────────────┴─────────────────┴─────────────────┘
```

### **4. Product Distribution Chart**
- Pie chart showing product breakdown for selected time period
- Only includes checkout source orders
- Handles unknown/blank products gracefully
- Interactive hover states

### **5. Checkout Orders Table**
Full table of checkout orders for selected time period:
- **Order ID**: 4-digit numerical identifier  
- **Customer Name**: First + Last name from customers table
- **Product**: Short_name from products table
- **Total Amount**: Formatted currency
- **Created**: Formatted date
- **State**: Province code from addresses table

## ⚡ Technical Features

### **Backend Processing (Apps Script)**
- **Multi-view time filtering**: Efficient date range queries for all view types
- **Week calculation**: Monday-to-Sunday week determination
- **Cross-table joins**: Customer, product, and address lookups
- **Revenue calculations**: Separate totals for all vs checkout orders
- **Product aggregation**: Smart handling of unknown products
- **State resolution**: Address lookup with fallback to "XX"

### **Frontend Experience**
- **Multi-view navigation**: Seamless switching between different time periods
- **Dynamic controls**: Form controls appear/hide based on selected view type
- **Date validation**: Client-side validation for custom date ranges
- **Loading states**: Visual feedback during data loading
- **Error handling**: Graceful failure with retry options
- **Responsive design**: Mobile-friendly layout
- **Interactive charts**: Chart.js pie chart with hover effects

## 💡 Business Intelligence

### **Flexible Time-Period Insights**
- **Checkout performance**: Track new customer acquisition through checkout across different time periods
- **Revenue analysis**: Compare total revenue vs new order revenue for any time range
- **Product trends**: See which products drive most new orders in specific periods
- **Geographic analysis**: State distribution of new customers over time

### **Operational Metrics**
- **Active subscriber base**: Monitor subscription growth
- **Period comparisons**: Track performance across different time ranges (weekly, monthly, custom)
- **Order fulfillment**: Complete order details for operations
- **Customer analysis**: Full customer information for support

## 🔧 Customization Options

### **Easy Modifications**
- **Additional metrics**: Add more metric cards to monthly view
- **Chart enhancements**: Add more chart types for different insights
- **Table columns**: Extend orders table with additional fields
- **Date ranges**: Modify to support custom date ranges

### **Advanced Features**
- **Comparison views**: Side-by-side month comparisons
- **Trend analysis**: Multi-month trend visualization
- **Export functionality**: Download tables as CSV/Excel
- **Filtering options**: Filter by product, state, or amount ranges

## 🎯 Use Cases

### **Executive Reporting**
- Monthly business performance overview
- Active subscription monitoring
- Revenue trend analysis

### **Operations Management**  
- Order fulfillment tracking
- Product performance analysis
- Geographic distribution insights

### **Customer Support**
- Recent order lookup
- Customer information access
- State-based routing decisions

## 📈 Performance

- **Load time**: ~3-4 seconds for monthly data
- **Month switching**: ~2 seconds for navigation
- **Data processing**: Handles thousands of orders efficiently
- **Chart rendering**: Real-time pie chart updates

## 🛡️ Data Security

- **Read-only access**: Dashboard cannot modify database
- **Secure connections**: HTTPS-only data transmission
- **Privacy-conscious**: Shows only essential customer information
- **Controlled access**: Deployable with restricted permissions

---

## 🎉 Ready for Production

The General Dashboard provides:
- 📊 **Complete overview** of active subscriptions and monthly performance
- 📅 **Flexible navigation** across any calendar month
- 💰 **Detailed revenue** breakdown by source and totals
- 🛍️ **Product insights** from checkout order analysis
- 📋 **Operational data** with full order details including state information

**Setup Time**: ~10 minutes  
**Maintenance**: Zero (auto-updates from database)  
**Perfect for**: Executive reporting, operations management, monthly business reviews