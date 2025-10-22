/**
 * General Dashboard - Apps Script Backend
 * 
 * Provides general dashboard data including:
 * - Active subscriptions count
 * - Monthly view with checkout metrics
 * - Revenue analytics by month
 * - Product distribution from checkout orders
 * - Checkout orders table with state information
 */

// Configuration
const DATABASE_CAREPORTALS_ID = '1PaCOgNJmKSb2VsJjCMjWpCG-gwrO7uVkuTAFUdrV-_o';

/**
 * Main function to serve the HTML dashboard interface
 */
function doGet() {
  return HtmlService.createTemplateFromFile('general_dashboard')
    .evaluate()
    .setTitle('CarePortals General Dashboard')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Get dashboard data for a specific time range
 * @param {string} viewType - View type: 'monthly', 'weekly', 'yesterday', 'alltime', 'custom'
 * @param {number} year - Year (e.g., 2025) - for monthly view
 * @param {number} month - Month (1-12) - for monthly view  
 * @param {string} startDate - Start date (YYYY-MM-DD) - for custom view
 * @param {string} endDate - End date (YYYY-MM-DD) - for custom view
 * @param {number} weekOffset - Week offset for weekly view (0 = current, -1 = previous, 1 = next)
 * @return {Object} Dashboard data including all metrics and tables
 */
function getDashboardData(viewType = 'monthly', year = null, month = null, startDate = null, endDate = null, weekOffset = 0) {
  try {
    console.log(`Getting dashboard data for view: ${viewType}, year: ${year}, month: ${month}, dates: ${startDate} to ${endDate}`);
    
    // Calculate time range based on view type
    const timeRange = calculateTimeRange(viewType, year, month, startDate, endDate, weekOffset);
    if (!timeRange.success) {
      return {
        success: false,
        error: timeRange.error
      };
    }
    
    console.log(`Time range calculated: ${timeRange.startDate.toISOString()} to ${timeRange.endDate.toISOString()}`);
    
    // Load all required data
    const dataLoaded = loadAllData();
    if (!dataLoaded.success) {
      return {
        success: false,
        error: 'Failed to load database tables: ' + dataLoaded.error
      };
    }
    
    const { orderData, customerData, productData, subscriptionData, addressData, cancelledOrderData } = dataLoaded.data;
    
    // Create lookup maps
    const customerLookup = createCustomerLookup(customerData);
    const productLookup = createProductLookup(productData);
    const addressLookup = createAddressLookup(addressData);
    
    // Get active subscriptions count
    const activeSubscriptions = getActiveSubscriptionsCount(subscriptionData);
    
    // Get time-range data (excluding cancelled orders)
    const rangeData = getTimeRangeData(orderData, customerLookup, productLookup, addressLookup, cancelledOrderData, timeRange.startDate, timeRange.endDate);
    
    return {
      success: true,
      viewType: viewType,
      timeRange: {
        start: timeRange.startDate.toISOString(),
        end: timeRange.endDate.toISOString(),
        display: timeRange.displayText
      },
      activeSubscriptions: activeSubscriptions,
      metrics: rangeData.metrics,
      productDistribution: rangeData.productDistribution,
      checkoutOrders: rangeData.checkoutOrders,
      lastUpdated: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Dashboard error:', error);
    return {
      success: false,
      error: 'Dashboard failed: ' + error.message
    };
  }
}

/**
 * Load all required data from Database_CarePortals
 */
function loadAllData() {
  try {
    const spreadsheet = SpreadsheetApp.openById(DATABASE_CAREPORTALS_ID);
    
    // Load order data
    const orderSheet = spreadsheet.getSheetByName('order.created');
    if (!orderSheet) {
      return { success: false, error: 'order.created sheet not found' };
    }
    const orderData = sheetToObjects(orderSheet);
    
    // Load customer data
    const customerSheet = spreadsheet.getSheetByName('customers');
    if (!customerSheet) {
      return { success: false, error: 'customers sheet not found' };
    }
    const customerData = sheetToObjects(customerSheet);
    
    // Load product data
    const productSheet = spreadsheet.getSheetByName('products');
    if (!productSheet) {
      return { success: false, error: 'products sheet not found' };
    }
    const productData = sheetToObjects(productSheet);
    
    // Load active subscription data
    const subscriptionSheet = spreadsheet.getSheetByName('subscription.active');
    if (!subscriptionSheet) {
      return { success: false, error: 'subscription.active sheet not found' };
    }
    const subscriptionData = sheetToObjects(subscriptionSheet);
    
    // Load address data
    const addressSheet = spreadsheet.getSheetByName('addresses');
    if (!addressSheet) {
      return { success: false, error: 'addresses sheet not found' };
    }
    const addressData = sheetToObjects(addressSheet);
    
    // Load cancelled orders data
    const cancelledOrderSheet = spreadsheet.getSheetByName('order.cancelled');
    if (!cancelledOrderSheet) {
      return { success: false, error: 'order.cancelled sheet not found' };
    }
    const cancelledOrderData = sheetToObjects(cancelledOrderSheet);
    
    console.log(`Loaded data: ${orderData.length} orders, ${customerData.length} customers, ${productData.length} products, ${subscriptionData.length} subscriptions, ${addressData.length} addresses, ${cancelledOrderData.length} cancelled orders`);
    
    return {
      success: true,
      data: {
        orderData,
        customerData,
        productData,
        subscriptionData,
        addressData,
        cancelledOrderData
      }
    };
    
  } catch (error) {
    console.error('Error loading data:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Convert sheet data to objects
 */
function sheetToObjects(sheet) {
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);
  
  return rows.map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  });
}

/**
 * Create customer lookup map
 */
function createCustomerLookup(customers) {
  const lookup = {};
  customers.forEach(customer => {
    const customerId = customer.customer_id || customer.CustomerID;
    if (customerId) {
      lookup[customerId] = {
        name: `${customer.first_name || customer.FirstName || ''} ${customer.last_name || customer.LastName || ''}`.trim(),
        firstName: customer.first_name || customer.FirstName || '',
        lastName: customer.last_name || customer.LastName || ''
      };
    }
  });
  console.log(`Created customer lookup with ${Object.keys(lookup).length} entries`);
  return lookup;
}

/**
 * Create product lookup map
 */
function createProductLookup(products) {
  const lookup = {};
  products.forEach(product => {
    const productId = product.product_id || product.ProductID;
    if (productId) {
      lookup[productId] = {
        name: product.Short_name || product.Name || product.ProductName || `Product ${productId}`,
        fullName: product.Name || product.ProductName || '',
        shortName: product.Short_name || ''
      };
    }
  });
  console.log(`Created product lookup with ${Object.keys(lookup).length} entries`);
  return lookup;
}

/**
 * Create address lookup map
 */
function createAddressLookup(addresses) {
  const lookup = {};
  addresses.forEach(address => {
    const addressId = address.address_id;
    if (addressId) {
      lookup[addressId] = {
        provinceCode: address.province_code || 'XX',
        city: address.city || '',
        postalCode: address.postal_code || ''
      };
    }
  });
  console.log(`Created address lookup with ${Object.keys(lookup).length} entries`);
  return lookup;
}

/**
 * Get active subscriptions count
 */
function getActiveSubscriptionsCount(subscriptionData) {
  return subscriptionData.length;
}

/**
 * Calculate time range based on view type
 */
function calculateTimeRange(viewType, year, month, startDate, endDate, weekOffset = 0) {
  const now = new Date();
  
  try {
    switch (viewType.toLowerCase()) {
      case 'monthly':
        const targetYear = year || now.getFullYear();
        const targetMonth = month || (now.getMonth() + 1);
        const startOfMonth = new Date(targetYear, targetMonth - 1, 1);
        const endOfMonth = new Date(targetYear, targetMonth, 0, 23, 59, 59);
        return {
          success: true,
          startDate: startOfMonth,
          endDate: endOfMonth,
          displayText: `${getMonthName(targetMonth)} ${targetYear}`
        };
        
      case 'weekly':
        // Find Monday of current week
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // If Sunday, go back 6 days
        const monday = new Date(today);
        monday.setDate(today.getDate() + mondayOffset + (weekOffset * 7)); // Add week offset
        monday.setHours(0, 0, 0, 0);
        
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);
        
        let displayText = `Week of ${formatDisplayDate(monday)} - ${formatDisplayDate(sunday)}`;
        if (weekOffset === 0) {
          displayText += ' (Current Week)';
        } else if (weekOffset === -1) {
          displayText += ' (Last Week)';
        } else if (weekOffset === 1) {
          displayText += ' (Next Week)';
        }
        
        return {
          success: true,
          startDate: monday,
          endDate: sunday,
          displayText: displayText
        };
        
      case 'yesterday':
        // Get yesterday's date
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const startOfYesterday = new Date(yesterday);
        startOfYesterday.setHours(0, 0, 0, 0);
        
        const endOfYesterday = new Date(yesterday);
        endOfYesterday.setHours(23, 59, 59, 999);
        
        return {
          success: true,
          startDate: startOfYesterday,
          endDate: endOfYesterday,
          displayText: `Yesterday (${formatDisplayDate(startOfYesterday)})`
        };
        
      case 'alltime':
        // Use a very early start date and current time as end
        return {
          success: true,
          startDate: new Date('2020-01-01'),
          endDate: now,
          displayText: 'All Time'
        };
        
      case 'custom':
        if (!startDate || !endDate) {
          return {
            success: false,
            error: 'Start date and end date are required for custom view'
          };
        }
        
        const customStart = new Date(startDate + 'T00:00:00');
        const customEnd = new Date(endDate + 'T23:59:59');
        
        if (customStart > customEnd) {
          return {
            success: false,
            error: 'Start date must be before or equal to end date'
          };
        }
        
        return {
          success: true,
          startDate: customStart,
          endDate: customEnd,
          displayText: `${formatDisplayDate(customStart)} - ${formatDisplayDate(customEnd)}`
        };
        
      default:
        return {
          success: false,
          error: `Unknown view type: ${viewType}`
        };
    }
  } catch (error) {
    return {
      success: false,
      error: `Error calculating time range: ${error.message}`
    };
  }
}

/**
 * Get time range data including metrics and checkout orders (excluding cancelled orders)
 */
function getTimeRangeData(orderData, customerLookup, productLookup, addressLookup, cancelledOrderData, startDate, endDate) {
  console.log(`Processing time range data from ${startDate.toISOString()} to ${endDate.toISOString()}`);
  
  // Create set of cancelled order IDs for quick lookup
  const cancelledOrderIds = new Set(cancelledOrderData.map(order => order.order_id));
  console.log(`Found ${cancelledOrderIds.size} cancelled orders to exclude`);
  
  // Filter orders for the time range and exclude cancelled orders
  const rangeOrders = orderData.filter(order => {
    try {
      const orderDate = new Date(order.created_at);
      const isInRange = orderDate >= startDate && orderDate <= endDate;
      const isNotCancelled = !cancelledOrderIds.has(order.order_id);
      return isInRange && isNotCancelled;
    } catch (error) {
      return false;
    }
  });
  
  // Filter checkout orders for the time range
  const checkoutOrders = rangeOrders.filter(order => 
    (order.source || '').toLowerCase() === 'checkout'
  );
  
  console.log(`Found ${rangeOrders.length} non-cancelled orders in range, ${checkoutOrders.length} checkout orders`);
  
  // Calculate metrics
  const metrics = {
    totalCheckoutOrders: checkoutOrders.length,
    totalRevenue: rangeOrders.reduce((sum, order) => sum + (parseFloat(order.total_amount) || 0), 0),
    revenueFromNewOrders: checkoutOrders.reduce((sum, order) => sum + (parseFloat(order.total_amount) || 0), 0)
  };
  
  // Product distribution from checkout orders
  const productDistribution = getProductDistribution(checkoutOrders, productLookup);
  
  // Checkout orders table data
  const checkoutOrdersTable = getCheckoutOrdersTable(checkoutOrders, customerLookup, productLookup, addressLookup);
  
  return {
    metrics,
    productDistribution,
    checkoutOrders: checkoutOrdersTable
  };
}

/**
 * Get product distribution from checkout orders
 */
function getProductDistribution(checkoutOrders, productLookup) {
  const productCounts = {};
  
  checkoutOrders.forEach(order => {
    const productId = order.product_id;
    let productName;
    
    if (!productId || productId === '') {
      productName = 'Unknown';
    } else {
      productName = productLookup[productId] ? productLookup[productId].name : 'Unknown';
    }
    
    productCounts[productName] = (productCounts[productName] || 0) + 1;
  });
  
  const labels = Object.keys(productCounts);
  const values = Object.values(productCounts);
  
  console.log('Product distribution:', productCounts);
  
  return { labels, values };
}

/**
 * Get checkout orders table with all required columns
 */
function getCheckoutOrdersTable(checkoutOrders, customerLookup, productLookup, addressLookup) {
  return checkoutOrders.map(order => {
    // Get customer info
    const customerId = order.customer_id;
    const customer = customerLookup[customerId] || { name: 'Unknown Customer' };
    
    // Get product info
    const productId = order.product_id;
    const product = productLookup[productId] || { name: 'Unknown Product' };
    
    // Get state info from address
    const shippingAddressId = order.shipping_address_id;
    const address = addressLookup[shippingAddressId] || { provinceCode: 'XX' };
    
    return {
      orderId: order.order_id.toString(),
      customerId: customerId,
      customerName: customer.name,
      productName: product.name,
      totalAmount: formatCurrency(order.total_amount),
      created: formatDate(order.created_at),
      state: address.provinceCode
    };
  }).sort((a, b) => b.orderId.localeCompare(a.orderId)); // Sort by order ID descending
}

/**
 * Format currency values
 */
function formatCurrency(amount) {
  const num = parseFloat(amount) || 0;
  return '$' + num.toFixed(2);
}

/**
 * Format date values
 */
function formatDate(dateValue) {
  if (!dateValue) return '';
  
  try {
    const date = new Date(dateValue);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    return dateValue.toString();
  }
}

/**
 * Get month name from number
 */
function getMonthName(month) {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return monthNames[month - 1] || 'Unknown';
}

/**
 * Helper function to format dates for display
 */
function formatDisplayDate(date) {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Test function to verify dashboard functionality
 */
function testGeneralDashboard() {
  console.log('Testing general dashboard...');
  
  // Test different view types
  const monthlyResults = getDashboardData('monthly');
  const weeklyResults = getDashboardData('weekly');
  const yesterdayResults = getDashboardData('yesterday');
  const alltimeResults = getDashboardData('alltime');
  const customResults = getDashboardData('custom', null, null, '2025-09-01', '2025-09-07');
  
  console.log('Monthly results:', monthlyResults);
  console.log('Weekly results:', weeklyResults);
  console.log('Yesterday results:', yesterdayResults);
  console.log('All-time results:', alltimeResults);
  console.log('Custom results:', customResults);
  
  return {
    monthly: monthlyResults,
    weekly: weeklyResults,
    yesterday: yesterdayResults,
    alltime: alltimeResults,
    custom: customResults
  };
}