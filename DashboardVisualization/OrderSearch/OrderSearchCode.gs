/**
 * Order Search System - Apps Script Backend
 * 
 * Searches orders across Database_CarePortals tables and returns comprehensive results
 * Joins data from: order.created, customers, products tables
 */

// Configuration
const DATABASE_CAREPORTALS_ID = '1PaCOgNJmKSb2VsJjCMjWpCG-gwrO7uVkuTAFUdrV-_o';

/**
 * Main function to serve the HTML search interface
 */
function doGet() {
  return HtmlService.createTemplateFromFile('order_search')
    .evaluate()
    .setTitle('CarePortals Order Search')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Search orders by various criteria and/or date range
 * @param {string} searchTerm - Search term (order ID, customer name, etc.)
 * @param {string} searchType - Type of search: 'order_id', 'customer_name', 'all', 'date_range'
 * @param {string} startDate - Start date for date range search (YYYY-MM-DD format)
 * @param {string} endDate - End date for date range search (YYYY-MM-DD format)
 * @return {Object} Search results with order information
 */
function searchOrders(searchTerm, searchType = 'all', startDate = null, endDate = null) {
  try {
    console.log(`Searching orders: "${searchTerm}" (type: ${searchType}), dates: ${startDate} to ${endDate}`);
    
    // For date range searches, we don't require a search term
    if (searchType !== 'date_range' && (!searchTerm || searchTerm.trim() === '')) {
      return {
        success: false,
        error: 'Please enter a search term',
        results: []
      };
    }
    
    // For date range searches, we require both dates
    if (searchType === 'date_range' && (!startDate || !endDate)) {
      return {
        success: false,
        error: 'Please select both start and end dates for date range search',
        results: []
      };
    }
    
    // Load all required data
    const orderData = loadOrderData();
    const customerData = loadCustomerData();
    const productData = loadProductData();
    
    if (!orderData.success || !customerData.success || !productData.success) {
      return {
        success: false,
        error: 'Failed to load database tables',
        results: []
      };
    }
    
    // Create lookup maps for efficient joining
    const customerLookup = createCustomerLookup(customerData.data);
    const productLookup = createProductLookup(productData.data);
    
    // Search and join data
    const searchResults = performSearch(
      orderData.data, 
      customerLookup, 
      productLookup, 
      searchTerm ? searchTerm.trim().toLowerCase() : '', 
      searchType,
      startDate,
      endDate
    );
    
    console.log(`Search completed. Found ${searchResults.length} results`);
    
    return {
      success: true,
      results: searchResults,
      searchTerm: searchTerm,
      searchType: searchType,
      startDate: startDate,
      endDate: endDate,
      totalResults: searchResults.length
    };
    
  } catch (error) {
    console.error('Search error:', error);
    return {
      success: false,
      error: 'Search failed: ' + error.message,
      results: []
    };
  }
}

/**
 * Load order data from order.created sheet
 */
function loadOrderData() {
  try {
    const sheet = SpreadsheetApp.openById(DATABASE_CAREPORTALS_ID).getSheetByName('order.created');
    
    if (!sheet) {
      return { success: false, error: 'order.created sheet not found' };
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);
    
    // Convert to objects with proper field mapping
    const orders = rows.map(row => {
      const order = {};
      headers.forEach((header, index) => {
        order[header] = row[index];
      });
      return order;
    });
    
    console.log(`Loaded ${orders.length} orders`);
    return { success: true, data: orders };
    
  } catch (error) {
    console.error('Error loading order data:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Load customer data from customers sheet
 */
function loadCustomerData() {
  try {
    const sheet = SpreadsheetApp.openById(DATABASE_CAREPORTALS_ID).getSheetByName('customers');
    
    if (!sheet) {
      return { success: false, error: 'customers sheet not found' };
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);
    
    const customers = rows.map(row => {
      const customer = {};
      headers.forEach((header, index) => {
        customer[header] = row[index];
      });
      return customer;
    });
    
    console.log(`Loaded ${customers.length} customers`);
    return { success: true, data: customers };
    
  } catch (error) {
    console.error('Error loading customer data:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Load product data from products sheet
 */
function loadProductData() {
  try {
    const sheet = SpreadsheetApp.openById(DATABASE_CAREPORTALS_ID).getSheetByName('products');
    
    if (!sheet) {
      return { success: false, error: 'products sheet not found' };
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);
    
    const products = rows.map(row => {
      const product = {};
      headers.forEach((header, index) => {
        product[header] = row[index];
      });
      return product;
    });
    
    console.log(`Loaded ${products.length} products`);
    return { success: true, data: products };
    
  } catch (error) {
    console.error('Error loading product data:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Create customer lookup map by customer_id
 */
function createCustomerLookup(customers) {
  const lookup = {};
  
  customers.forEach(customer => {
    const customerId = customer.customer_id || customer.CustomerID;
    if (customerId) {
      lookup[customerId] = {
        name: `${customer.first_name || customer.FirstName || ''} ${customer.last_name || customer.LastName || ''}`.trim(),
        firstName: customer.first_name || customer.FirstName || '',
        lastName: customer.last_name || customer.LastName || '',
        email: customer.email || customer.Email || '',
        phone: customer.phone || customer.Phone || ''
      };
    }
  });
  
  console.log(`Created customer lookup with ${Object.keys(lookup).length} entries`);
  return lookup;
}

/**
 * Create product lookup map by product_id
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
 * Perform the actual search across orders with joins
 */
function performSearch(orders, customerLookup, productLookup, searchTerm, searchType, startDate, endDate) {
  const results = [];
  
  orders.forEach(order => {
    let matchFound = false;
    
    // Get joined data
    const customerId = order.customer_id || order.CustomerID;
    const productId = order.product_id || order.ProductID;
    const customer = customerLookup[customerId] || { name: 'Unknown Customer' };
    const product = productLookup[productId] || { name: 'Unknown Product' };
    
    // Use the actual order_id column (Column B) - this is the 4-digit numerical ID to display
    const displayOrderId = order.order_id || '';
    const internalOrderId = order.care_portals_internal_order_id || '';
    
    // Get order date for date filtering
    const orderDate = order.created_at;
    
    // Check date range filter first (if applicable)
    if (searchType === 'date_range' || (startDate && endDate)) {
      try {
        const orderDateTime = new Date(orderDate);
        const startDateTime = new Date(startDate + 'T00:00:00');
        const endDateTime = new Date(endDate + 'T23:59:59');
        
        if (orderDateTime < startDateTime || orderDateTime > endDateTime) {
          return; // Skip this order - outside date range
        }
        
        // For pure date range search, we've found a match
        if (searchType === 'date_range') {
          matchFound = true;
        }
      } catch (dateError) {
        console.warn('Date parsing error for order:', order.order_id, dateError);
        return; // Skip orders with invalid dates
      }
    }
    
    // Perform text search based on type (skip for pure date range searches)
    if (searchType !== 'date_range' && searchTerm) {
      switch (searchType) {
        case 'order_id':
          if (displayOrderId.toString().includes(searchTerm) || 
              internalOrderId.toLowerCase().includes(searchTerm)) {
            matchFound = true;
          }
          break;
          
        case 'customer_name':
          if (customer.name.toLowerCase().includes(searchTerm)) {
            matchFound = true;
          }
          break;
          
        case 'all':
        default:
          // Search across all fields
          if (displayOrderId.toString().includes(searchTerm) ||
              internalOrderId.toLowerCase().includes(searchTerm) ||
              customer.name.toLowerCase().includes(searchTerm) ||
              product.name.toLowerCase().includes(searchTerm) ||
              (order.source || '').toLowerCase().includes(searchTerm)) {
            matchFound = true;
          }
          break;
      }
    }
    
    if (matchFound) {
      results.push({
        orderId: displayOrderId.toString(), // This is the 4-digit order_id from Column B
        internalOrderId: internalOrderId, // Keep internal ID for reference
        customerName: customer.name,
        productName: product.name,
        totalAmount: formatCurrency(order.total_amount || order.TotalAmount || 0),
        source: order.source || order.Source || 'Unknown',
        createdAt: formatDate(order.created_at || order.DatetimeCreated)
      });
    }
  });
  
  // Sort results by order ID
  return results.sort((a, b) => b.orderId.localeCompare(a.orderId));
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
 * Test function to verify search functionality
 */
function testOrderSearch() {
  console.log('Testing order search...');
  
  // Test 1: Text search
  const textResults = searchOrders('18', 'order_id');
  console.log('Text search results:', textResults);
  
  // Test 2: Date range search (last 7 days)
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - 7*24*60*60*1000).toISOString().split('T')[0];
  const dateResults = searchOrders('', 'date_range', startDate, endDate);
  console.log('Date range results:', dateResults);
  
  if (textResults.success && textResults.results.length > 0) {
    console.log('Sample order data structure:', textResults.results[0]);
  }
  
  return { textResults, dateResults };
}