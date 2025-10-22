/**
 * Revenue Analytics Dashboard - Google Apps Script Backend
 *
 * Processes comprehensive revenue data by connecting:
 * - Orders from order.created sheet
 * - Payments from payment_succesful sheet
 * - Refunds from refund.created sheet
 *
 * Provides deep analytics on:
 * - Gross revenue, refunds, and net revenue
 * - First-time vs repeat customer analysis
 * - Full vs partial refund analysis
 * - Revenue trends and patterns
 * - Advanced business metrics
 */

// Database_CarePortals Google Sheet ID
const DATABASE_CAREPORTALS_ID = '1PaCOgNJmKSb2VsJjCMjWpCG-gwrO7uVkuTAFUdrV-_o';

/**
 * Main web app entry point - serves the revenue analytics dashboard
 */
function doGet() {
  return HtmlService.createTemplateFromFile('revenue_analytics')
    .evaluate()
    .setTitle('Revenue Analytics Dashboard')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * Include external files in HTML template
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Main function to get comprehensive revenue analytics data
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {Object} Complete analytics data object
 */
function getRevenueAnalyticsData(startDate, endDate) {
  try {
    Logger.log(`Loading revenue analytics data for period: ${startDate} to ${endDate}`);

    const ss = SpreadsheetApp.openById(DATABASE_CAREPORTALS_ID);

    // Load all required data
    const ordersData = getSheetData(ss, 'order.created');
    const paymentsData = getSheetData(ss, 'payment_succesful');
    const refundsData = getSheetData(ss, 'refund.created');
    const customersData = getSheetData(ss, 'customers');
    const productsData = getSheetData(ss, 'products');

    Logger.log(`Loaded data: ${ordersData.length} orders, ${paymentsData.length} payments, ${refundsData.length} refunds`);

    // Filter data by date range
    const filteredOrders = filterDataByDateRange(ordersData, startDate, endDate, 'created_at');
    const filteredPayments = filterDataByDateRange(paymentsData, startDate, endDate, 'datetime');
    const filteredRefunds = filterDataByDateRange(refundsData, startDate, endDate, 'datetime');

    Logger.log(`Filtered data: ${filteredOrders.length} orders, ${filteredPayments.length} payments, ${filteredRefunds.length} refunds`);

    // Add validation for empty results
    if (filteredPayments.length === 0) {
      Logger.log(`Warning: No payments found for date range ${startDate} to ${endDate}`);
    }
    if (filteredOrders.length === 0) {
      Logger.log(`Warning: No orders found for date range ${startDate} to ${endDate}`);
    }

    // Process and analyze data
    const analytics = processRevenueAnalytics(
      filteredOrders,
      filteredPayments,
      filteredRefunds,
      customersData,
      productsData,
      startDate,
      endDate
    );

    Logger.log('Revenue analytics processing completed successfully');
    return analytics;

  } catch (error) {
    Logger.log('Error in getRevenueAnalyticsData: ' + error.toString());
    return {
      error: 'Failed to load revenue analytics: ' + error.message,
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
    if (data.length <= 1) return [];

    const headers = data[0];
    const rows = data.slice(1);

    // Filter out empty rows and convert to objects
    const validRows = rows.filter(row =>
      row.some(cell => cell !== '' && cell != null && cell !== undefined)
    );

    return validRows.map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        let cellValue = row[index];

        // Handle dates
        if (cellValue instanceof Date) {
          cellValue = cellValue.toISOString();
        } else if (cellValue === '' || cellValue == null || cellValue === undefined) {
          cellValue = null;
        }

        obj[header] = cellValue;
      });
      return obj;
    });

  } catch (error) {
    Logger.log(`Error loading sheet ${sheetName}: ${error.toString()}`);
    return [];
  }
}

/**
 * Filter data by date range
 */
function filterDataByDateRange(data, startDate, endDate, dateField) {
  if (!data || data.length === 0) return [];

  // Ensure proper date parsing with timezone consideration
  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T23:59:59');

  Logger.log(`Filtering data from ${start} to ${end} using field '${dateField}'`);

  const filtered = data.filter(item => {
    const itemDate = parseDate(item[dateField]);
    if (!itemDate) {
      Logger.log(`Warning: Could not parse date '${item[dateField]}' for field '${dateField}'`);
      return false;
    }
    return itemDate >= start && itemDate <= end;
  });

  Logger.log(`Filtered ${filtered.length} items from ${data.length} total`);
  return filtered;
}

/**
 * Parse various date formats
 */
function parseDate(dateValue) {
  if (!dateValue) return null;

  try {
    if (dateValue instanceof Date) return dateValue;

    // Handle string dates
    if (typeof dateValue === 'string') {
      // Trim whitespace
      dateValue = dateValue.trim();

      // Handle MM/DD/YYYY HH:MM:SS format (common in Google Sheets)
      if (dateValue.includes('/')) {
        const parsed = new Date(dateValue);
        if (!isNaN(parsed.getTime())) return parsed;
      }

      // Handle ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS)
      if (dateValue.includes('-')) {
        // If it's just YYYY-MM-DD, add time to avoid timezone issues
        if (dateValue.length === 10) {
          dateValue += 'T12:00:00';
        }
        const parsed = new Date(dateValue);
        if (!isNaN(parsed.getTime())) return parsed;
      }

      // Last resort: try direct parsing
      const parsed = new Date(dateValue);
      if (!isNaN(parsed.getTime())) return parsed;
    }

    // Handle number (timestamp)
    if (typeof dateValue === 'number') {
      const parsed = new Date(dateValue);
      if (!isNaN(parsed.getTime())) return parsed;
    }

    // Try direct conversion
    const parsed = new Date(dateValue);
    if (!isNaN(parsed.getTime())) return parsed;

    Logger.log(`Could not parse date value: ${dateValue} (type: ${typeof dateValue})`);
    return null;
  } catch (error) {
    Logger.log('Error parsing date: ' + dateValue + ' - ' + error.toString());
    return null;
  }
}

/**
 * Main processing function for revenue analytics
 */
function processRevenueAnalytics(orders, payments, refunds, customers, products, startDate, endDate) {

  // Create lookup maps for efficiency
  const orderMap = createOrderMap(orders);
  const paymentMap = createPaymentMap(payments);
  const customerMap = createCustomerMap(customers);
  const productMap = createProductMap(products);

  // Link payments to orders and refunds to payments
  const linkedPayments = linkPaymentsToOrders(payments, orderMap);
  const linkedRefunds = linkRefundsToPayments(refunds, paymentMap, orderMap);

  // Calculate core metrics
  const metrics = calculateCoreMetrics(linkedPayments, linkedRefunds);

  // Generate chart data
  const charts = generateChartData(orders, linkedPayments, linkedRefunds, startDate, endDate);

  // Perform refund analysis
  const refundAnalysis = analyzeRefunds(linkedRefunds, linkedPayments);

  // Generate deep analysis insights
  const analysis = generateDeepAnalysis(orders, linkedPayments, linkedRefunds, customerMap, productMap);

  return {
    metrics,
    charts,
    refundAnalysis,
    analysis,
    metadata: {
      dateRange: { startDate, endDate },
      dataPoints: {
        orders: orders.length,
        payments: payments.length,
        refunds: refunds.length
      },
      lastUpdated: new Date().toISOString()
    }
  };
}

/**
 * Create lookup maps for data joining
 */
function createOrderMap(orders) {
  const map = new Map();
  orders.forEach(order => {
    if (order.order_id) {
      map.set(order.order_id.toString(), order);
    }
  });
  return map;
}

function createPaymentMap(payments) {
  const map = new Map();
  payments.forEach(payment => {
    if (payment.charge_id) {
      map.set(payment.charge_id, payment);
    }
  });
  return map;
}

function createCustomerMap(customers) {
  const map = new Map();
  customers.forEach(customer => {
    if (customer.customer_id) {
      map.set(customer.customer_id, customer);
    }
  });
  return map;
}

function createProductMap(products) {
  const map = new Map();
  products.forEach(product => {
    if (product.product_id) {
      map.set(product.product_id, product);
    }
  });
  return map;
}

/**
 * Link payments to orders using order_number field
 */
function linkPaymentsToOrders(payments, orderMap) {
  return payments.map(payment => {
    const orderNumber = payment.order_number?.toString();
    const linkedOrder = orderNumber ? orderMap.get(orderNumber) : null;

    return {
      ...payment,
      linkedOrder,
      amount: parseFloat(payment.amount) || 0
    };
  });
}

/**
 * Link refunds to payments and orders
 */
function linkRefundsToPayments(refunds, paymentMap, orderMap) {
  return refunds.map(refund => {
    const linkedPayment = paymentMap.get(refund.charge_id);
    const linkedOrder = linkedPayment?.order_number ?
      orderMap.get(linkedPayment.order_number.toString()) : null;

    return {
      ...refund,
      linkedPayment,
      linkedOrder,
      amount: parseFloat(refund.amount) || 0
    };
  });
}

/**
 * Calculate core revenue metrics
 */
function calculateCoreMetrics(linkedPayments, linkedRefunds) {
  const grossRevenue = linkedPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const totalRefunds = linkedRefunds.reduce((sum, refund) => sum + refund.amount, 0);
  const netRevenue = grossRevenue - totalRefunds;
  const refundRate = grossRevenue > 0 ? (totalRefunds / grossRevenue) * 100 : 0;

  return {
    grossRevenue: Math.round(grossRevenue * 100) / 100,
    totalRefunds: Math.round(totalRefunds * 100) / 100,
    netRevenue: Math.round(netRevenue * 100) / 100,
    refundRate: Math.round(refundRate * 100) / 100,
    paymentCount: linkedPayments.length,
    refundCount: linkedRefunds.length
  };
}

/**
 * Generate chart data for visualizations
 */
function generateChartData(orders, linkedPayments, linkedRefunds, startDate, endDate) {

  // Revenue trends over time
  const revenueTrends = generateRevenueTrends(linkedPayments, linkedRefunds, startDate, endDate);

  // Revenue by source (checkout vs subscription)
  const sourceRevenue = generateSourceRevenueData(linkedPayments);

  // Refunds by source
  const refundBySource = generateRefundBySourceData(linkedRefunds);

  return {
    revenueTrends,
    sourceRevenue,
    refundBySource
  };
}

/**
 * Generate revenue trends data
 */
function generateRevenueTrends(linkedPayments, linkedRefunds, startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

  let groupBy = 'day';
  let dateFormat = 'MMM d';

  // Adjust grouping based on date range
  if (daysDiff > 90) {
    groupBy = 'month';
    dateFormat = 'MMM yyyy';
  } else if (daysDiff > 30) {
    groupBy = 'week';
    dateFormat = 'MMM d';
  }

  const labels = [];
  const grossRevenue = [];
  const netRevenue = [];

  // Generate time buckets
  const buckets = generateTimeBuckets(start, end, groupBy);

  buckets.forEach(bucket => {
    const bucketPayments = linkedPayments.filter(payment => {
      const paymentDate = parseDate(payment.datetime);
      return paymentDate && paymentDate >= bucket.start && paymentDate < bucket.end;
    });

    const bucketRefunds = linkedRefunds.filter(refund => {
      const refundDate = parseDate(refund.datetime);
      return refundDate && refundDate >= bucket.start && refundDate < bucket.end;
    });

    const gross = bucketPayments.reduce((sum, p) => sum + p.amount, 0);
    const refunds = bucketRefunds.reduce((sum, r) => sum + r.amount, 0);

    labels.push(formatDate(bucket.start, dateFormat));
    grossRevenue.push(Math.round(gross * 100) / 100);
    netRevenue.push(Math.round((gross - refunds) * 100) / 100);
  });

  return { labels, grossRevenue, netRevenue };
}

/**
 * Generate time buckets for trending
 */
function generateTimeBuckets(start, end, groupBy) {
  const buckets = [];
  const current = new Date(start);

  while (current < end) {
    const bucketStart = new Date(current);
    let bucketEnd;

    switch (groupBy) {
      case 'day':
        bucketEnd = new Date(current);
        bucketEnd.setDate(bucketEnd.getDate() + 1);
        current.setDate(current.getDate() + 1);
        break;
      case 'week':
        bucketEnd = new Date(current);
        bucketEnd.setDate(bucketEnd.getDate() + 7);
        current.setDate(current.getDate() + 7);
        break;
      case 'month':
        bucketEnd = new Date(current);
        bucketEnd.setMonth(bucketEnd.getMonth() + 1);
        current.setMonth(current.getMonth() + 1);
        break;
    }

    buckets.push({ start: bucketStart, end: bucketEnd });
  }

  return buckets;
}

/**
 * Generate revenue by source data
 */
function generateSourceRevenueData(linkedPayments) {
  const sourceMap = new Map();

  linkedPayments.forEach(payment => {
    if (payment.linkedOrder) {
      const source = payment.linkedOrder.source || 'Unknown';
      const displayName = getSourceDisplayName(source);

      if (!sourceMap.has(displayName)) {
        sourceMap.set(displayName, 0);
      }
      sourceMap.set(displayName, sourceMap.get(displayName) + payment.amount);
    }
  });

  const labels = Array.from(sourceMap.keys());
  const data = labels.map(label => Math.round(sourceMap.get(label) * 100) / 100);

  return { labels, data };
}

/**
 * Generate refund by source data
 */
function generateRefundBySourceData(linkedRefunds) {
  const sourceMap = new Map();

  linkedRefunds.forEach(refund => {
    if (refund.linkedOrder) {
      const source = refund.linkedOrder.source || 'Unknown';
      const displayName = getSourceDisplayName(source);

      if (!sourceMap.has(displayName)) {
        sourceMap.set(displayName, 0);
      }
      sourceMap.set(displayName, sourceMap.get(displayName) + refund.amount);
    }
  });

  const labels = Array.from(sourceMap.keys());
  const data = labels.map(label => Math.round(sourceMap.get(label) * 100) / 100);

  return { labels, data };
}

/**
 * Convert source codes to display names
 */
function getSourceDisplayName(source) {
  const sourceNames = {
    'checkout': 'Checkout (First-time)',
    'subscription_cycle': 'Subscription (Repeat)',
    'admin': 'Admin Created',
    'api': 'API',
    'import': 'Data Import'
  };

  return sourceNames[source] || source || 'Unknown';
}

/**
 * Analyze refund patterns
 */
function analyzeRefunds(linkedRefunds, linkedPayments) {
  const paymentAmountMap = new Map();
  linkedPayments.forEach(payment => {
    if (payment.charge_id) {
      paymentAmountMap.set(payment.charge_id, payment.amount);
    }
  });

  let fullRefunds = { count: 0, amount: 0 };
  let partialRefunds = { count: 0, amount: 0 };

  linkedRefunds.forEach(refund => {
    const originalAmount = paymentAmountMap.get(refund.charge_id) || 0;
    const refundAmount = refund.amount;

    if (Math.abs(refundAmount - originalAmount) < 0.01) {
      // Full refund
      fullRefunds.count++;
      fullRefunds.amount += refundAmount;
    } else {
      // Partial refund
      partialRefunds.count++;
      partialRefunds.amount += refundAmount;
    }
  });

  return {
    fullRefunds: {
      count: fullRefunds.count,
      amount: Math.round(fullRefunds.amount * 100) / 100
    },
    partialRefunds: {
      count: partialRefunds.count,
      amount: Math.round(partialRefunds.amount * 100) / 100
    }
  };
}

/**
 * Generate deep analysis insights
 */
function generateDeepAnalysis(orders, linkedPayments, linkedRefunds, customerMap, productMap) {

  // Source analysis
  const sourceAnalysis = analyzeOrderSources(orders, linkedPayments);

  // Payment insights
  const paymentInsights = analyzePayments(linkedPayments);

  // Refund timing analysis
  const refundTiming = analyzeRefundTiming(linkedRefunds, linkedPayments);

  // Advanced metrics
  const advancedMetrics = calculateAdvancedMetrics(orders, linkedPayments, linkedRefunds, customerMap);

  return {
    sourceAnalysis,
    paymentInsights,
    refundTiming,
    advancedMetrics
  };
}

/**
 * Analyze order sources
 */
function analyzeOrderSources(orders, linkedPayments) {
  const checkoutOrders = orders.filter(o => o.source === 'checkout');
  const subscriptionOrders = orders.filter(o => o.source === 'subscription_cycle');

  const checkoutRevenue = linkedPayments
    .filter(p => p.linkedOrder?.source === 'checkout')
    .reduce((sum, p) => sum + p.amount, 0);

  const subscriptionRevenue = linkedPayments
    .filter(p => p.linkedOrder?.source === 'subscription_cycle')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalRevenue = checkoutRevenue + subscriptionRevenue;
  const conversionRate = totalRevenue > 0 ? (subscriptionRevenue / totalRevenue) * 100 : 0;

  return [
    { label: 'First-time Orders', value: `${checkoutOrders.length} orders` },
    { label: 'Repeat Orders', value: `${subscriptionOrders.length} orders` },
    { label: 'Checkout Revenue', value: `$${Math.round(checkoutRevenue).toLocaleString()}` },
    { label: 'Subscription Revenue', value: `$${Math.round(subscriptionRevenue).toLocaleString()}` },
    { label: 'Repeat Customer Rate', value: `${Math.round(conversionRate * 10) / 10}%` }
  ];
}

/**
 * Analyze payment patterns
 */
function analyzePayments(linkedPayments) {
  const totalAmount = linkedPayments.reduce((sum, p) => sum + p.amount, 0);
  const averagePayment = linkedPayments.length > 0 ? totalAmount / linkedPayments.length : 0;
  const successfulPayments = linkedPayments.filter(p => p.status === 'succeeded');
  const successRate = linkedPayments.length > 0 ? (successfulPayments.length / linkedPayments.length) * 100 : 0;
  const ordersWithPayments = linkedPayments.filter(p => p.linkedOrder).length;

  // Count unique payment methods
  const paymentMethods = new Set(linkedPayments.map(p => p.payment_method_type).filter(Boolean));

  return [
    { label: 'Successful Payments', value: `${linkedPayments.length} transactions` },
    { label: 'Average Payment', value: `$${Math.round(averagePayment * 100) / 100}` },
    { label: 'Payment Success Rate', value: `${Math.round(successRate * 10) / 10}%` },
    { label: 'Orders with Payments', value: `${ordersWithPayments} matched` },
    { label: 'Payment Methods', value: `${paymentMethods.size} types` }
  ];
}

/**
 * Analyze refund timing patterns
 */
function analyzeRefundTiming(linkedRefunds, linkedPayments) {
  const paymentDateMap = new Map();
  linkedPayments.forEach(payment => {
    if (payment.charge_id) {
      paymentDateMap.set(payment.charge_id, parseDate(payment.datetime));
    }
  });

  const refundDelays = [];
  let checkoutRefundDelays = [];
  let subscriptionRefundDelays = [];
  let sameDayRefunds = 0;
  let longDelayRefunds = 0;

  linkedRefunds.forEach(refund => {
    const paymentDate = paymentDateMap.get(refund.charge_id);
    const refundDate = parseDate(refund.datetime);

    if (paymentDate && refundDate) {
      const daysDiff = (refundDate - paymentDate) / (1000 * 60 * 60 * 24);
      refundDelays.push(daysDiff);

      if (daysDiff < 1) sameDayRefunds++;
      if (daysDiff > 7) longDelayRefunds++;

      // Categorize by order source
      if (refund.linkedOrder?.source === 'checkout') {
        checkoutRefundDelays.push(daysDiff);
      } else if (refund.linkedOrder?.source === 'subscription_cycle') {
        subscriptionRefundDelays.push(daysDiff);
      }
    }
  });

  const avgRefundTime = refundDelays.length > 0 ?
    refundDelays.reduce((sum, d) => sum + d, 0) / refundDelays.length : 0;

  const avgCheckoutRefundTime = checkoutRefundDelays.length > 0 ?
    checkoutRefundDelays.reduce((sum, d) => sum + d, 0) / checkoutRefundDelays.length : 0;

  const avgSubscriptionRefundTime = subscriptionRefundDelays.length > 0 ?
    subscriptionRefundDelays.reduce((sum, d) => sum + d, 0) / subscriptionRefundDelays.length : 0;

  return [
    { label: 'Average Refund Time', value: `${Math.round(avgRefundTime * 10) / 10} days` },
    { label: 'Checkout Refund Time', value: `${Math.round(avgCheckoutRefundTime * 10) / 10} days` },
    { label: 'Subscription Refund Time', value: `${Math.round(avgSubscriptionRefundTime * 10) / 10} days` },
    { label: 'Same-day Refunds', value: `${sameDayRefunds} refunds` },
    { label: 'Refunds > 7 days', value: `${longDelayRefunds} refunds` }
  ];
}

/**
 * Calculate advanced business metrics
 */
function calculateAdvancedMetrics(orders, linkedPayments, linkedRefunds, customerMap) {
  const totalRevenue = linkedPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalRefunds = linkedRefunds.reduce((sum, r) => sum + r.amount, 0);

  // Calculate customer lifetime value
  const uniqueCustomers = new Set(orders.map(o => o.customer_id).filter(Boolean));
  const customerCount = uniqueCustomers.size;
  const clv = customerCount > 0 ? totalRevenue / customerCount : 0;

  // Refund metrics
  const refundToOrderRatio = orders.length > 0 ? (linkedRefunds.length / orders.length) * 100 : 0;
  const partialRefundRate = linkedRefunds.length > 0 ?
    (linkedRefunds.filter(r => r.amount < (r.linkedPayment?.amount || 0)).length / linkedRefunds.length) * 100 : 0;

  // Repeat customer analysis
  const checkoutOrders = orders.filter(o => o.source === 'checkout').length;
  const subscriptionOrders = orders.filter(o => o.source === 'subscription_cycle').length;
  const repeatRate = orders.length > 0 ? (subscriptionOrders / orders.length) * 100 : 0;

  // Revenue per customer
  const revenuePerCustomer = customerCount > 0 ? totalRevenue / customerCount : 0;

  return [
    { label: 'Customer Lifetime Value', value: `$${Math.round(clv)}` },
    { label: 'Refund-to-Order Ratio', value: `${Math.round(refundToOrderRatio * 10) / 10}%` },
    { label: 'Partial Refund Rate', value: `${Math.round(partialRefundRate * 10) / 10}%` },
    { label: 'Repeat Customer Rate', value: `${Math.round(repeatRate * 10) / 10}%` },
    { label: 'Revenue per Customer', value: `$${Math.round(revenuePerCustomer)}` }
  ];
}

/**
 * Utility function to format dates
 */
function formatDate(date, format) {
  const options = {
    'MMM d': { month: 'short', day: 'numeric' },
    'MMM yyyy': { month: 'short', year: 'numeric' }
  };

  return date.toLocaleDateString('en-US', options[format] || options['MMM d']);
}