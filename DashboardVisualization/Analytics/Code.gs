/**
 * CarePortals Dashboard - Apps Script Backend
 * Processes Database_CarePortals data for advanced visualizations
 * 
 * SETUP INSTRUCTIONS:
 * 1. Replace DATABASE_CAREPORTALS_ID with your actual Google Sheets ID
 * 2. Deploy as Web App with execute permissions for "Anyone"
 * 3. Set XFrameOptionsMode to ALLOWALL for Google Sites embedding
 */

// Database_CarePortals Google Sheet ID - CORRECTED
const DATABASE_CAREPORTALS_ID = '1PaCOgNJmKSb2VsJjCMjWpCG-gwrO7uVkuTAFUdrV-_o';

/**
 * Main web app entry point - serves the dashboard HTML
 */
function doGet() {
  return HtmlService.createTemplateFromFile('dashboard')
    .evaluate()
    .setTitle('CarePortals Analytics Dashboard')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL) // Allow embedding in Google Sites
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * Include external files in HTML template
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Main data processing function - called by dashboard
 * Returns processed data for all visualizations
 */
function getDashboardData() {
  try {
    Logger.log('Starting dashboard data processing...');
    
    const ss = SpreadsheetApp.openById(DATABASE_CAREPORTALS_ID);
    
    // Load all subscription data
    Logger.log('Loading subscription data from sheets...');
    const activeData = getSheetData(ss, 'subscription.active');
    const pausedData = getSheetData(ss, 'subscription.paused');
    const cancelledData = getSheetData(ss, 'subscription.cancelled');
    const customerData = getSheetData(ss, 'customers');
    const productData = getSheetData(ss, 'products');
    
    // Debug logging
    Logger.log(`Data loaded - Active: ${activeData.length}, Paused: ${pausedData.length}, Cancelled: ${cancelledData.length}`);
    Logger.log(`Additional data - Customers: ${customerData.length}, Products: ${productData.length}`);
    
    // Process data for visualizations with error handling
    const dashboardData = {
      lastUpdated: new Date().toISOString()
    };
    
    try {
      dashboardData.subscriptionOverview = createSubscriptionOverview(activeData, pausedData, cancelledData);
      Logger.log('✅ Subscription overview created successfully');
    } catch (error) {
      Logger.log('❌ Error creating subscription overview: ' + error.toString());
      dashboardData.subscriptionOverview = { error: 'Failed to process subscription overview' };
    }
    
    try {
      dashboardData.subscriptionTrends = createSubscriptionTrends(activeData, pausedData, cancelledData);
      Logger.log('✅ Subscription trends created successfully');
    } catch (error) {
      Logger.log('❌ Error creating subscription trends: ' + error.toString());
      dashboardData.subscriptionTrends = { error: 'Failed to process subscription trends' };
    }
    
    try {
      dashboardData.productDistribution = createProductDistribution(activeData, productData);
      Logger.log('✅ Product distribution created successfully');
    } catch (error) {
      Logger.log('❌ Error creating product distribution: ' + error.toString());
      dashboardData.productDistribution = { error: 'Failed to process product distribution' };
    }
    
    try {
      dashboardData.customersByState = createCustomersByState(activeData, customerData);
      Logger.log('✅ Customers by state created successfully');
    } catch (error) {
      Logger.log('❌ Error creating customers by state: ' + error.toString());
      dashboardData.customersByState = { error: 'Failed to process customers by state' };
    }
    
    try {
      dashboardData.revenueAnalysis = createRevenueAnalysis(activeData, productData);
      Logger.log('✅ Revenue analysis created successfully');
    } catch (error) {
      Logger.log('❌ Error creating revenue analysis: ' + error.toString());
      dashboardData.revenueAnalysis = { error: 'Failed to process revenue analysis' };
    }
    
    Logger.log('Dashboard data processed successfully');
    return dashboardData;
    
  } catch (error) {
    Logger.log('Error processing dashboard data: ' + error.toString());
    return {
      error: 'Failed to load data: ' + error.message,
      lastUpdated: new Date().toISOString()
    };
  }
}

/**
 * Helper function to safely get sheet data
 */
function getSheetData(spreadsheet, sheetName) {
  try {
    const sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) {
      Logger.log(`Warning: Sheet ${sheetName} not found`);
      return [];
    }
    
    const data = sheet.getDataRange().getValues();
    Logger.log(`Sheet ${sheetName}: Found ${data.length} total rows`);
    
    if (data.length <= 1) {
      Logger.log(`Sheet ${sheetName}: No data rows found`);
      return []; // No data rows
    }
    
    // Convert to objects with headers
    const headers = data[0];
    const rows = data.slice(1);
    
    // Filter out completely empty rows
    const validRows = rows.filter(row => {
      return row.some(cell => cell !== '' && cell != null && cell !== undefined);
    });
    
    Logger.log(`Sheet ${sheetName}: ${validRows.length} rows with data after filtering empty rows`);
    
    const result = validRows.map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        // Get the cell value and handle different data types
        let cellValue = row[index];
        
        // Convert dates to strings, handle null/undefined
        if (cellValue instanceof Date) {
          cellValue = cellValue.toString();
        } else if (cellValue == null || cellValue === undefined) {
          cellValue = '';
        } else if (typeof cellValue !== 'string' && typeof cellValue !== 'number') {
          cellValue = String(cellValue);
        }
        
        obj[header] = cellValue;
      });
      return obj;
    });
    
    Logger.log(`Sheet ${sheetName}: Successfully processed ${result.length} records`);
    return result;
    
  } catch (error) {
    Logger.log(`Error reading sheet ${sheetName}: ${error.toString()}`);
    return [];
  }
}

/**
 * Create subscription overview metrics
 */
function createSubscriptionOverview(activeData, pausedData, cancelledData) {
  const totalActive = activeData.length;
  const totalPaused = pausedData.length;
  const totalCancelled = cancelledData.length;
  const totalSubscriptions = totalActive + totalPaused + totalCancelled;
  
  return {
    totalSubscriptions: totalSubscriptions,
    activeSubscriptions: totalActive,
    pausedSubscriptions: totalPaused,
    cancelledSubscriptions: totalCancelled,
    activeRate: totalSubscriptions > 0 ? (totalActive / totalSubscriptions * 100).toFixed(1) : 0,
    churnRate: totalSubscriptions > 0 ? (totalCancelled / totalSubscriptions * 100).toFixed(1) : 0
  };
}

/**
 * Create subscription trends over time
 */
function createSubscriptionTrends(activeData, pausedData, cancelledData) {
  const monthlyData = {};
  
  // Process active subscriptions
  activeData.forEach(sub => {
    const date = parseDate(sub['Datetime Created']);
    if (date) {
      const monthKey = formatMonth(date);
      if (!monthlyData[monthKey]) monthlyData[monthKey] = { active: 0, paused: 0, cancelled: 0 };
      monthlyData[monthKey].active++;
    }
  });
  
  // Process paused subscriptions
  pausedData.forEach(sub => {
    const date = parseDate(sub['Datetime Created']);
    if (date) {
      const monthKey = formatMonth(date);
      if (!monthlyData[monthKey]) monthlyData[monthKey] = { active: 0, paused: 0, cancelled: 0 };
      monthlyData[monthKey].paused++;
    }
  });
  
  // Process cancelled subscriptions
  cancelledData.forEach(sub => {
    const date = parseDate(sub['Datetime Created']);
    if (date) {
      const monthKey = formatMonth(date);
      if (!monthlyData[monthKey]) monthlyData[monthKey] = { active: 0, paused: 0, cancelled: 0 };
      monthlyData[monthKey].cancelled++;
    }
  });
  
  // Convert to arrays for charting
  const sortedMonths = Object.keys(monthlyData).sort();
  
  return {
    months: sortedMonths,
    active: sortedMonths.map(month => monthlyData[month].active),
    paused: sortedMonths.map(month => monthlyData[month].paused),
    cancelled: sortedMonths.map(month => monthlyData[month].cancelled)
  };
}

/**
 * Create product distribution analysis
 */
function createProductDistribution(activeData, productData) {
  const productCounts = {};
  const productNames = {};
  
  // Build product name lookup using Short_name (preferred) or product_id as fallback
  productData.forEach(product => {
    const productId = product.ProductID || product.product_id;
    const shortName = product.Short_name || product.Name || `Product ${productId}`;
    productNames[productId] = shortName;
  });
  
  // Count active subscriptions by product
  activeData.forEach(sub => {
    const productId = sub.ProductID || sub.product_id;
    const productName = productNames[productId] || `Product ${productId}`;
    productCounts[productName] = (productCounts[productName] || 0) + 1;
  });
  
  return {
    labels: Object.keys(productCounts),
    values: Object.values(productCounts)
  };
}

/**
 * Create customers by state analysis
 */
function createCustomersByState(activeData, customerData) {
  const customerLookup = {};
  const stateCounts = {};
  
  // Build customer lookup
  customerData.forEach(customer => {
    try {
      const customerId = customer.CustomerID;
      if (customerId) {
        customerLookup[customerId] = customer;
      }
    } catch (error) {
      Logger.log(`Error processing customer: ${error.toString()}`);
    }
  });
  
  // Count customers by state
  activeData.forEach(sub => {
    try {
      const customerId = sub.CustomerID;
      const customer = customerLookup[customerId];
      
      if (customer && customer.State) {
        let state = customer.State;
        if (typeof state === 'string') {
          state = state.toUpperCase();
          stateCounts[state] = (stateCounts[state] || 0) + 1;
        }
      }
    } catch (error) {
      Logger.log(`Error processing state for subscription: ${error.toString()}`);
    }
  });
  
  // Sort by count and take top 10
  const sortedStates = Object.entries(stateCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10);
  
  return {
    labels: sortedStates.map(([state]) => state),
    values: sortedStates.map(([,count]) => count)
  };
}

/**
 * Create revenue analysis
 */
function createRevenueAnalysis(activeData, productData) {
  const productPricing = {
    '90day': 299,
    'monthly': 149,
    '30day': 149
  };
  
  const revenueByProduct = {};
  
  activeData.forEach(sub => {
    try {
      // Safely handle Cycle field - convert to string and handle null/undefined
      let cycle = sub.Cycle || 'monthly';
      if (typeof cycle !== 'string') {
        cycle = String(cycle || 'monthly');
      }
      
      const price = productPricing[cycle.toLowerCase()] || productPricing['monthly'];
      
      // Safely handle ProductID and get Short_name
      let productId = sub.ProductID || sub.product_id || 'Unknown';
      if (typeof productId !== 'string') {
        productId = String(productId || 'Unknown');
      }
      
      // Use Short_name from productData lookup
      const productInfo = productData.find(p => (p.ProductID || p.product_id) === productId);
      const displayName = productInfo ? (productInfo.Short_name || productInfo.Name || productId) : productId;
      
      if (!revenueByProduct[displayName]) {
        revenueByProduct[displayName] = { revenue: 0, count: 0 };
      }
      
      revenueByProduct[displayName].revenue += price;
      revenueByProduct[displayName].count++;
      
    } catch (error) {
      Logger.log(`Error processing revenue for subscription: ${error.toString()}`);
      Logger.log(`Subscription data: ${JSON.stringify(sub)}`);
      // Skip this record and continue
    }
  });
  
  return {
    labels: Object.keys(revenueByProduct),
    revenue: Object.values(revenueByProduct).map(item => item.revenue),
    subscriptions: Object.values(revenueByProduct).map(item => item.count)
  };
}

/**
 * Utility functions
 */
function parseDate(dateString) {
  if (!dateString) return null;
  
  try {
    // Handle various date formats
    if (dateString instanceof Date) return dateString;
    
    // Try parsing as string
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  } catch (error) {
    return null;
  }
}

function formatMonth(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Test function for development
 */
function testGetDashboardData() {
  const data = getDashboardData();
  Logger.log(JSON.stringify(data, null, 2));
  return data;
}

/**
 * Simple test to verify sheet data reading
 */
function testSheetDataReading() {
  try {
    Logger.log('=== TESTING SHEET DATA READING ===');
    const ss = SpreadsheetApp.openById(DATABASE_CAREPORTALS_ID);
    
    // Test each subscription sheet
    const activeData = getSheetData(ss, 'subscription.active');
    const pausedData = getSheetData(ss, 'subscription.paused');
    const cancelledData = getSheetData(ss, 'subscription.cancelled');
    
    Logger.log(`\n=== FINAL COUNTS ===`);
    Logger.log(`Active: ${activeData.length}`);
    Logger.log(`Paused: ${pausedData.length}`);
    Logger.log(`Cancelled: ${cancelledData.length}`);
    
    // Show sample of active data if any exists
    if (activeData.length > 0) {
      Logger.log(`\n=== SAMPLE ACTIVE RECORD ===`);
      Logger.log(JSON.stringify(activeData[0], null, 2));
    }
    
    return {
      active: activeData.length,
      paused: pausedData.length,
      cancelled: cancelledData.length,
      sampleActive: activeData.length > 0 ? activeData[0] : null
    };
    
  } catch (error) {
    Logger.log('ERROR in testSheetDataReading: ' + error.toString());
    return { error: error.toString() };
  }
}