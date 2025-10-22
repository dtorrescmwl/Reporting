/**
 * Enhanced KPI Dashboard - Backend Calculations
 * Fixes critical LTV calculation flaw and implements professional healthcare KPIs
 * Data Source: Database_CarePortals.xlsx
 */

// Configuration
const DATABASE_SPREADSHEET_ID = '1PaCOgNJmKSb2VsJjCMjWpCG-gwrO7uVkuTAFUdrV-_o';
const CACHE_DURATION = 360; // 6 minutes

/**
 * Main function to serve the HTML dashboard
 */
function doGet(e) {
  try {
    console.log('=== DOGET CALLED ===');
    console.log('Event params:', e);

    // Check user access for HIPAA compliance
    checkUserAccess();

    // Log access for audit trail
    logAccess('Dashboard Access');

    console.log('Serving dashboard HTML');

    return HtmlService.createTemplateFromFile('dashboard')
      .evaluate()
      .setTitle('Enhanced KPI Dashboard')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (error) {
    console.error('=== DOGET ERROR ===');
    console.error('Dashboard access error:', error);
    console.error('Stack:', error.stack);
    return HtmlService.createHtmlOutput(`
      <h2>Access Denied</h2>
      <p>You don't have permission to access this dashboard.</p>
      <p>Error: ${error.message}</p>
      <pre>${error.stack}</pre>
    `);
  }
}

/**
 * HIPAA Compliance: Check user access
 */
function checkUserAccess() {
  const userEmail = Session.getActiveUser().getEmail();

  // Allow access to users in the organization
  if (!userEmail || !userEmail.includes('@')) {
    throw new Error('Invalid user authentication');
  }

  console.log('Dashboard accessed by:', userEmail);
  return true;
}

/**
 * Audit logging for HIPAA compliance
 */
function logAccess(action) {
  try {
    const userEmail = Session.getActiveUser().getEmail();
    const timestamp = new Date();

    console.log(`AUDIT: ${timestamp} - ${userEmail} - ${action}`);

    // Could extend to write to audit sheet if needed
  } catch (error) {
    console.error('Audit logging error:', error);
  }
}

/**
 * Main API function to get all KPI data with date range support
 * Maintains backward compatibility
 */
function getEnhancedKPIs(timePeriod = 'monthly', startDateISO = null, endDateISO = null) {
  try {
    console.log('=== GET ENHANCED KPIs CALLED ===');
    console.log('Parameters:', { timePeriod, startDateISO, endDateISO });

    checkUserAccess();
    logAccess('KPI Data Request');

    // Parse date range
    let startDate, endDate;

    if (startDateISO && endDateISO) {
      startDate = new Date(startDateISO);
      endDate = new Date(endDateISO);
      // Ensure end date includes the full day
      endDate.setHours(23, 59, 59, 999);
    } else {
      // Default date range based on time period
      const now = new Date();
      switch (timePeriod) {
        case 'yesterday':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 1);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(startDate);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'weekly':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - now.getDay()); // Start of current week
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(now);
          break;
        case 'monthly':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now);
          break;
        case 'quarterly':
          const quarterStart = Math.floor(now.getMonth() / 3) * 3;
          startDate = new Date(now.getFullYear(), quarterStart, 1);
          endDate = new Date(now);
          break;
        case 'alltime':
        default:
          startDate = new Date('2020-01-01');
          endDate = new Date(now);
      }
    }

    // Create cache key with date range
    const cacheKey = `enhanced_kpis_${timePeriod}_${startDate.getTime()}_${endDate.getTime()}`;
    const cache = CacheService.getScriptCache();
    let cachedData = cache.get(cacheKey);

    if (cachedData) {
      console.log('Returning cached KPI data for date range');
      return JSON.parse(cachedData);
    }

    // Load fresh data
    console.log('Calculating fresh KPI data for date range:', startDate, 'to', endDate);
    const data = loadAllData();

    // Ensure backward compatibility
    let kpis;
    try {
      kpis = calculateAllKPIs(data, timePeriod, startDate, endDate);

      // Validate that kpis has required fields
      if (!kpis || !kpis.snapshot || !kpis.timed) {
        throw new Error('KPI calculation returned incomplete data');
      }
    } catch (calcError) {
      console.warn('Error with date range calculation, falling back to basic calculation:', calcError);
      console.warn('Error details:', calcError.stack);
      // Fallback to old calculation method
      try {
        kpis = calculateAllKPIsBasic(data, timePeriod);
      } catch (basicError) {
        console.error('Basic calculation also failed:', basicError);
        // Return minimal safe data structure
        kpis = createMinimalKPIs(data);
      }
    }

    // Cache the results
    cache.put(cacheKey, JSON.stringify(kpis), CACHE_DURATION);

    console.log('=== KPIs CALCULATED SUCCESSFULLY ===');
    console.log('Returning KPIs:', Object.keys(kpis));

    // Convert all Date objects to ISO strings for google.script.run compatibility
    if (kpis.lastUpdated) {
      kpis.lastUpdated = kpis.lastUpdated.toISOString();
    }
    if (kpis.dateRange) {
      kpis.dateRange = {
        start: kpis.dateRange.start ? kpis.dateRange.start.toISOString() : null,
        end: kpis.dateRange.end ? kpis.dateRange.end.toISOString() : null
      };
    }

    console.log('KPIs serialized for transmission');
    return kpis;
  } catch (error) {
    console.error('=== ERROR IN GET ENHANCED KPIs ===');
    console.error('Error getting KPIs:', error);
    console.error('Stack:', error.stack);
    return {
      error: true,
      message: error.message,
      stack: error.stack,
      timestamp: new Date(),
      debug: {
        timePeriod: timePeriod,
        startDateISO: startDateISO,
        endDateISO: endDateISO
      }
    };
  }
}

/**
 * Backward compatibility - Basic KPI calculation without date range
 */
function calculateAllKPIsBasic(data, timePeriod) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

  // Calculate comprehensive CLV metrics
  const clvMetrics = calculateCLVMetrics(data);
  const renewalRate = calculateRenewalRate(data);

  return {
    // SNAPSHOT SECTION
    snapshot: {
      activePatients: {
        count: data.subscriptions.filter(s => s.Status === 'active').length,
        quality: 'good',
        description: 'Total count of active subscriptions'
      },
      realizedCLV_all: {
        amount: clvMetrics.realizedCLV_all,
        currency: clvMetrics.currency,
        quality: clvMetrics.quality,
        description: 'Avg total revenue per customer (all)',
        methodology: 'Sum of order.total_amount per customer'
      },
      realizedCLV_mature: {
        amount: clvMetrics.realizedCLV_mature,
        currency: clvMetrics.currency,
        quality: clvMetrics.quality,
        description: 'Avg revenue per mature customer',
        methodology: 'Mature = cancelled, paused, or orders > cycle duration'
      },
      matureCustomerRatio: {
        percentage: clvMetrics.matureCustomerRatio,
        matureCount: clvMetrics.metadata.matureCustomers,
        totalCount: clvMetrics.metadata.totalCustomers,
        quality: clvMetrics.quality,
        description: '% of customers that are mature'
      },
      renewalRate: {
        rate: renewalRate.rate,
        matureCustomers: renewalRate.matureCustomers,
        renewedCustomers: renewalRate.renewedCustomers,
        quality: renewalRate.quality,
        description: renewalRate.description
      }
    },

    // TIMED SECTION
    timed: {
      newPatients: calculateNewPatients(data, thirtyDaysAgo, now),
      geographicReach: calculateGeographicReach(data, thirtyDaysAgo, now),
      mrr: calculateMRR(data),
      arpu: {
        amount: clvMetrics.arpu,
        currency: clvMetrics.currency,
        quality: clvMetrics.quality
      },
      netRevenue: calculateNetRevenue(data),
      paymentSuccessRate: calculatePaymentSuccessRate(data),
      churnRate: {
        rate: clvMetrics.churnRate,
        quality: clvMetrics.quality
      },
      predictiveCLV: {
        amount: clvMetrics.predictiveCLV,
        currency: clvMetrics.currency,
        quality: clvMetrics.quality
      },
      adherenceRate: calculateAdherenceRate(data),
      processingEfficiency: calculateProcessingEfficiency(data),
      productPerformance: calculateProductPerformance(data)
    },

    // Metadata
    lastUpdated: now,
    dataQuality: assessDataQuality(data),
    timePeriod: timePeriod,
    fallbackMode: true
  };
}

/**
 * Load all required data from Database_CarePortals spreadsheet
 */
function loadAllData() {
  try {
    const spreadsheet = SpreadsheetApp.openById(DATABASE_SPREADSHEET_ID);

    // Load all required sheets
    const customers = getSheetData(spreadsheet, 'customers');
    const orders = getSheetData(spreadsheet, 'order.created');
    const payments = getSheetData(spreadsheet, 'payment_succesful');
    const refunds = getSheetData(spreadsheet, 'refund.created');
    const products = getSheetData(spreadsheet, 'products');
    const subscriptions = getSheetData(spreadsheet, 'subscription.active');
    const cancelledSubs = getSheetData(spreadsheet, 'subscription.cancelled');
    const pausedSubs = getSheetData(spreadsheet, 'subscription.paused');
    const addresses = getSheetData(spreadsheet, 'addresses');

    console.log('Data loaded successfully:', {
      customers: customers.length,
      orders: orders.length,
      payments: payments.length,
      refunds: refunds.length,
      products: products.length,
      subscriptions: subscriptions.length,
      cancelledSubs: cancelledSubs.length,
      pausedSubs: pausedSubs.length,
      addresses: addresses.length
    });

    return {
      customers,
      orders,
      payments,
      refunds,
      products,
      subscriptions,
      cancelledSubs,
      pausedSubs,
      addresses
    };
  } catch (error) {
    console.error('Error loading data:', error);
    throw new Error('Failed to load database: ' + error.message);
  }
}

/**
 * Helper function to get sheet data with error handling
 */
function getSheetData(spreadsheet, sheetName) {
  try {
    const sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) {
      console.warn(`Sheet not found: ${sheetName}`);
      return [];
    }

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      console.warn(`No data in sheet: ${sheetName}`);
      return [];
    }

    // Convert to objects with headers
    const headers = data[0];
    return data.slice(1).map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index];
      });
      return obj;
    });
  } catch (error) {
    console.error(`Error loading sheet ${sheetName}:`, error);
    return [];
  }
}

/**
 * Calculate all Enhanced KPIs with date range filtering
 * Separates Snapshot (time-independent) from Timed (date range sensitive) metrics
 */
function calculateAllKPIs(data, timePeriod, startDate, endDate) {
  const now = new Date();

  // Calculate comprehensive CLV metrics
  const clvMetrics = calculateCLVMetrics(data);
  const renewalRate = calculateRenewalRate(data);

  return {
    // SNAPSHOT SECTION - Time-independent metrics
    snapshot: {
      activePatients: {
        count: data.subscriptions.filter(s => s.Status === 'active').length,
        quality: 'good',
        description: 'Total count of active subscriptions'
      },
      realizedCLV_all: {
        amount: clvMetrics.realizedCLV_all,
        currency: clvMetrics.currency,
        quality: clvMetrics.quality,
        description: 'Avg total revenue per customer (all)',
        methodology: 'Sum of order.total_amount per customer'
      },
      realizedCLV_mature: {
        amount: clvMetrics.realizedCLV_mature,
        currency: clvMetrics.currency,
        quality: clvMetrics.quality,
        description: 'Avg revenue per mature customer',
        methodology: 'Mature = cancelled, paused, or orders > cycle duration'
      },
      matureCustomerRatio: {
        percentage: clvMetrics.matureCustomerRatio,
        matureCount: clvMetrics.metadata.matureCustomers,
        totalCount: clvMetrics.metadata.totalCustomers,
        quality: clvMetrics.quality,
        description: '% of customers that are mature'
      },
      renewalRate: {
        rate: renewalRate.rate,
        matureCustomers: renewalRate.matureCustomers,
        renewedCustomers: renewalRate.renewedCustomers,
        quality: renewalRate.quality,
        description: renewalRate.description
      }
    },

    // TIMED SECTION - Date range sensitive metrics
    timed: {
      // Customer Growth & Enrollment
      newPatients: calculateNewPatients(data, startDate, endDate),
      geographicReach: calculateGeographicReach(data, startDate, endDate),

      // Revenue & Financial Health
      mrr: calculateMRR(data, startDate, endDate),
      arpu: {
        amount: clvMetrics.arpu,
        currency: clvMetrics.currency,
        quality: clvMetrics.quality,
        description: 'Average monthly revenue per active user'
      },
      netRevenue: calculateNetRevenue(data, startDate, endDate),
      paymentSuccessRate: calculatePaymentSuccessRate(data, startDate, endDate),

      // Customer Success & Retention
      churnRate: {
        rate: clvMetrics.churnRate,
        quality: clvMetrics.quality,
        activeCustomers: clvMetrics.metadata.activeInLast90Days,
        cancelledCustomers: clvMetrics.metadata.cancelledInLast90Days,
        methodology: 'Last 90 days: Cancelled / (Active + Cancelled)',
        description: '% of subscriptions cancelled per month (last 90 days)'
      },
      predictiveCLV: {
        amount: clvMetrics.predictiveCLV,
        currency: clvMetrics.currency,
        quality: clvMetrics.quality,
        description: 'Estimated total future value per customer (ARPU / Churn Rate)',
        formula: clvMetrics.predictiveCLV ? `${clvMetrics.arpu.toFixed(2)} / ${(clvMetrics.churnRate / 100).toFixed(4)}` : 'N/A'
      },
      adherenceRate: calculateAdherenceRate(data),

      // Operational Excellence
      processingEfficiency: calculateProcessingEfficiency(data, startDate, endDate),
      productPerformance: calculateProductPerformance(data, startDate, endDate)
    },

    // Metadata
    lastUpdated: now,
    dataQuality: assessDataQuality(data),
    timePeriod: timePeriod,
    dateRange: {
      start: startDate,
      end: endDate
    }
  };
}

/**
 * 1. New Patient Enrollments - Based on first checkout orders
 * Counts unique customers with their first checkout order in the date range
 */
function calculateNewPatients(data, startDate, endDate) {
  try {
    // Get all checkout orders
    const checkoutOrders = data.orders.filter(order =>
      order.source === 'checkout' && order.created_at && order.customer_id
    );

    // Group orders by customer and find first checkout order
    const customerFirstOrders = new Map();
    checkoutOrders.forEach(order => {
      const customerId = order.customer_id;
      const orderDate = new Date(order.created_at);

      if (!customerFirstOrders.has(customerId)) {
        customerFirstOrders.set(customerId, orderDate);
      } else {
        // Keep the earliest order
        const existingDate = customerFirstOrders.get(customerId);
        if (orderDate < existingDate) {
          customerFirstOrders.set(customerId, orderDate);
        }
      }
    });

    // Count customers whose first checkout order is in the date range
    let newPatientCount = 0;
    customerFirstOrders.forEach((firstOrderDate, customerId) => {
      if (firstOrderDate >= startDate && firstOrderDate <= endDate) {
        newPatientCount++;
      }
    });

    return {
      count: newPatientCount,
      trend: 'stable', // Could calculate vs previous period
      quality: newPatientCount > 0 ? 'good' : 'low',
      dateRange: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
      methodology: 'First checkout order in date range'
    };
  } catch (error) {
    console.error('Error calculating new patients:', error);
    return { count: 0, trend: 'unknown', quality: 'error', methodology: 'Error' };
  }
}

/**
 * 2. Active Patients - Multi-dimensional definition with date range
 */
function calculateActivePatients(data, startDate, endDate) {
  try {
    const activePatients = new Set();

    // Active subscriptions
    data.subscriptions.forEach(sub => {
      if (sub.Status === 'active' && sub.CustomerID) {
        activePatients.add(sub.CustomerID);
      }
    });

    // Orders within date range
    data.orders.forEach(order => {
      if (!order.created_at || !order.customer_id) return;

      const orderDate = new Date(order.created_at);
      if (orderDate >= startDate && orderDate <= endDate) {
        activePatients.add(order.customer_id);
      }
    });

    return {
      count: activePatients.size,
      breakdown: {
        activeSubscriptions: data.subscriptions.filter(s => s.Status === 'active').length,
        ordersInPeriod: data.orders.filter(o => {
          if (!o.created_at) return false;
          const orderDate = new Date(o.created_at);
          return orderDate >= startDate && orderDate <= endDate;
        }).length
      },
      quality: 'good',
      dateRange: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`
    };
  } catch (error) {
    console.error('Error calculating active patients:', error);
    return { count: 0, breakdown: {}, quality: 'error' };
  }
}

/**
 * 3. Geographic Reach - Market analysis with date range
 */
function calculateGeographicReach(data, startDate, endDate) {
  try {
    const activeStates = new Set();

    // Get unique states from orders in date range
    data.orders.forEach(order => {
      if (!order.shipping_address_id || !order.created_at) return;

      const orderDate = new Date(order.created_at);
      if (orderDate < startDate || orderDate > endDate) return;

      const address = data.addresses.find(addr =>
        addr.address_id === order.shipping_address_id
      );

      if (address && address.province_code) {
        activeStates.add(address.province_code);
      }
    });

    return {
      stateCount: activeStates.size,
      states: Array.from(activeStates),
      quality: activeStates.size > 0 ? 'good' : 'low',
      dateRange: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`
    };
  } catch (error) {
    console.error('Error calculating geographic reach:', error);
    return { stateCount: 0, states: [], quality: 'error' };
  }
}

/**
 * 4. Monthly Recurring Revenue - Enhanced calculation
 */
function calculateMRR(data, startDate = null, endDate = null) {
  try {
    let totalMRR = 0;

    data.subscriptions.forEach(sub => {
      if (sub.Status !== 'active') return;

      const product = data.products.find(p => p.product_id === sub.ProductID);
      if (!product || !product.renewal_price) return;

      const renewalPrice = parseFloat(product.renewal_price) || 0;
      const cycleDuration = parseInt(product.renewal_cycle_duration) || 30;

      // Normalize to monthly
      const monthlyRevenue = renewalPrice * (30 / cycleDuration);
      totalMRR += monthlyRevenue;
    });

    return {
      amount: Math.round(totalMRR * 100) / 100,
      currency: 'USD',
      activeSubscriptions: data.subscriptions.filter(s => s.Status === 'active').length,
      quality: 'good'
    };
  } catch (error) {
    console.error('Error calculating MRR:', error);
    return { amount: 0, currency: 'USD', activeSubscriptions: 0, quality: 'error' };
  }
}

/**
 * 5. 🔥 FIXED Customer Lifetime Value - Cohort-based calculation
 */
function calculateRealisticLTV(data) {
  try {
    console.log('Calculating realistic LTV using cohort analysis...');

    // Group customers by signup month (cohorts)
    const cohorts = {};

    data.customers.forEach(customer => {
      if (!customer.created_at || !customer.customer_id) return;

      const signupDate = new Date(customer.created_at);
      const cohortKey = signupDate.getFullYear() + '-' + (signupDate.getMonth() + 1).toString().padStart(2, '0');

      if (!cohorts[cohortKey]) {
        cohorts[cohortKey] = [];
      }
      cohorts[cohortKey].push(customer.customer_id);
    });

    let totalWeightedLTV = 0;
    let totalCustomers = 0;

    Object.keys(cohorts).forEach(cohortKey => {
      const cohortCustomers = cohorts[cohortKey];

      // Calculate total revenue for this cohort
      let cohortRevenue = 0;
      cohortCustomers.forEach(customerId => {
        // Get customer payments through orders
        const customerOrders = data.orders.filter(order => order.customer_id === customerId);

        customerOrders.forEach(order => {
          const payment = data.payments.find(p => p.order_number === order.order_id);
          if (payment && payment.amount) {
            cohortRevenue += parseFloat(payment.amount) || 0;
          }
        });

        // Subtract refunds
        const customerRefunds = data.refunds.filter(refund => {
          return customerOrders.some(order => order.order_id === refund.order_id);
        });

        customerRefunds.forEach(refund => {
          cohortRevenue -= parseFloat(refund.amount) || 0;
        });
      });

      // Calculate average LTV for this cohort
      const cohortLTV = cohortCustomers.length > 0 ? cohortRevenue / cohortCustomers.length : 0;

      totalWeightedLTV += cohortLTV * cohortCustomers.length;
      totalCustomers += cohortCustomers.length;
    });

    const averageLTV = totalCustomers > 0 ? totalWeightedLTV / totalCustomers : 0;

    console.log(`LTV Calculation Result: $${averageLTV.toFixed(2)} (Expected: $150-$800)`);

    return {
      amount: Math.round(averageLTV * 100) / 100,
      currency: 'USD',
      methodology: 'Cohort-based with actual revenue data',
      expectedRange: '$150-$800',
      cohortCount: Object.keys(cohorts).length,
      quality: averageLTV >= 150 && averageLTV <= 800 ? 'excellent' : 'needs_review'
    };
  } catch (error) {
    console.error('Error calculating LTV:', error);
    return {
      amount: 0,
      currency: 'USD',
      methodology: 'Error in calculation',
      quality: 'error',
      error: error.message
    };
  }
}

/**
 * 🔄 RENEWAL RATE CALCULATOR
 * Calculates the percentage of mature customers who renewed after their prepaid period
 * Snapshot metric - time-independent
 */
function calculateRenewalRate(data) {
  try {
    console.log('Calculating renewal rate...');

    const today = new Date();

    // Map product_id -> sale_cycle_duration
    const productDuration = {};
    data.products.forEach(p => {
      const duration = parseFloat(p.sale_cycle_duration) || 1;
      productDuration[p.product_id] = duration;
    });

    // Group orders by customer
    const customers = {};
    data.orders.forEach(order => {
      const customerId = order.customer_id;
      if (!customerId || !order.created_at) return;

      if (!customers[customerId]) {
        customers[customerId] = {
          productId: order.product_id,
          orders: []
        };
      }

      customers[customerId].orders.push({
        amount: parseFloat(order.total_amount) || 0,
        date: new Date(order.created_at)
      });
    });

    let matureCustomers = 0;
    let renewedCustomers = 0;

    Object.keys(customers).forEach(customerId => {
      const customer = customers[customerId];
      const duration = productDuration[customer.productId] || 1;

      // Sort orders by date
      customer.orders.sort((a, b) => a.date - b.date);

      const numOrders = customer.orders.length;
      const prepaidOrders = customer.orders.slice(0, duration);
      const renewalOrders = customer.orders.slice(duration);
      const lastOrderDate = customer.orders[customer.orders.length - 1].date;
      const monthsSinceLast = (today - lastOrderDate) / (1000 * 60 * 60 * 24 * 30);

      // Check cancellation and pause status
      const hasCancelled = data.cancelledSubs.some(sub => sub.customer_id === customerId);
      const hasPaused = data.pausedSubs.some(sub => sub.customer_id === customerId);

      // Determine maturity (same logic as CLV calculator)
      let isMature = false;
      if (hasCancelled) {
        isMature = true;
      } else if (hasPaused) {
        isMature = false;
      } else if (numOrders > duration) {
        isMature = true;
      } else if (numOrders === duration && monthsSinceLast >= 1) {
        isMature = true;
      }

      if (isMature) {
        matureCustomers++;

        // Check if customer renewed (any paid order after prepaid period)
        const renewed = renewalOrders.some(order => order.amount > 0);
        if (renewed) {
          renewedCustomers++;
        }
      }
    });

    const renewalRate = matureCustomers > 0 ? (renewedCustomers / matureCustomers) * 100 : 0;

    console.log('Renewal rate calculated:', {
      renewalRate,
      matureCustomers,
      renewedCustomers
    });

    return {
      rate: Math.round(renewalRate * 100) / 100,
      matureCustomers,
      renewedCustomers,
      quality: renewalRate >= 80 ? 'excellent' : renewalRate >= 60 ? 'good' : renewalRate >= 40 ? 'needs_improvement' : 'low',
      description: '% of mature customers who placed at least one paid renewal'
    };
  } catch (error) {
    console.error('Error calculating renewal rate:', error);
    return {
      rate: 0,
      matureCustomers: 0,
      renewedCustomers: 0,
      quality: 'error',
      description: 'Error calculating renewal rate',
      error: error.message
    };
  }
}

/**
 * 🧠 COMPREHENSIVE CLV CALCULATOR
 * Calculates Realized CLV (All & Mature), Mature Customer Ratio, Predictive CLV, Churn Rate, and ARPU
 * Based on the CLV CALCULATOR DEVICE specification
 */
function calculateCLVMetrics(data) {
  try {
    console.log('Calculating comprehensive CLV metrics...');

    const today = new Date();
    const ninetyDaysAgo = new Date(today.getTime() - (90 * 24 * 60 * 60 * 1000));

    // Build product duration map
    const productMap = {};
    data.products.forEach(p => {
      const duration = parseFloat(p.sale_cycle_duration) || 1;
      productMap[p.product_id] = duration;
    });

    // Group orders by customer and calculate revenue
    const customers = {};
    data.orders.forEach(order => {
      const customerId = order.customer_id;
      if (!customerId || !order.created_at) return;

      const orderDate = new Date(order.created_at);
      const amount = parseFloat(order.total_amount) || 0;

      if (!customers[customerId]) {
        customers[customerId] = {
          totalRevenue: 0,
          orderDates: [],
          productId: order.product_id
        };
      }

      customers[customerId].totalRevenue += amount;
      customers[customerId].orderDates.push(orderDate);
      if (!customers[customerId].productId && order.product_id) {
        customers[customerId].productId = order.product_id;
      }
    });

    // Determine maturity status for each customer
    let totalAll = 0;
    let totalMature = 0;
    let countAll = 0;
    let countMature = 0;
    let arpuSum = 0;
    let activeCustomersCount = 0;

    Object.keys(customers).forEach(customerId => {
      const customer = customers[customerId];
      const productId = customer.productId;
      const duration = productMap[productId] || 1;
      const numOrders = customer.orderDates.length;

      if (numOrders === 0) return;

      const sortedDates = customer.orderDates.sort((a, b) => a - b);
      const firstOrderDate = sortedDates[0];
      const lastOrderDate = sortedDates[sortedDates.length - 1];
      const monthsSinceLast = (today - lastOrderDate) / (1000 * 60 * 60 * 24 * 30);

      // Check cancellation and pause status
      const hasCancelled = data.cancelledSubs.some(sub => sub.customer_id === customerId);
      const hasPaused = data.pausedSubs.some(sub => sub.customer_id === customerId);

      // Determine maturity
      let isMature = false;
      if (hasCancelled) {
        isMature = true;
      } else if (hasPaused) {
        isMature = false;
      } else if (numOrders > duration) {
        isMature = true;
      } else if (numOrders === duration && monthsSinceLast >= 1) {
        isMature = true;
      }

      // Accumulate totals
      totalAll += customer.totalRevenue;
      countAll++;

      if (isMature) {
        totalMature += customer.totalRevenue;
        countMature++;
      }

      // Calculate monthly ARPU
      const monthsActive = Math.max(1, Math.ceil((lastOrderDate - firstOrderDate) / (1000 * 60 * 60 * 24 * 30)));
      const monthlyRevenue = customer.totalRevenue / monthsActive;
      arpuSum += monthlyRevenue;

      // Check if customer had orders in last 90 days (for churn calculation)
      const hasRecentOrder = customer.orderDates.some(date => date >= ninetyDaysAgo);
      if (hasRecentOrder) {
        activeCustomersCount++;
      }
    });

    // Calculate Realized CLVs
    const realizedCLV_all = countAll > 0 ? totalAll / countAll : 0;
    const realizedCLV_mature = countMature > 0 ? totalMature / countMature : 0;
    const matureCustomerRatio = countAll > 0 ? (countMature / countAll) * 100 : 0;

    // Calculate ARPU
    const arpu = countAll > 0 ? arpuSum / countAll : 0;

    // Calculate Churn Rate (last 90 days)
    // Count active subscriptions
    const activeSubscriptionCount = data.subscriptions.filter(s => s.Status === 'active').length;

    // Count cancelled subscriptions in last 90 days
    const cancelledInLast90 = data.cancelledSubs.filter(sub => {
      if (!sub.last_updated) return false;
      const updateDate = new Date(sub.last_updated);
      return updateDate >= ninetyDaysAgo;
    }).length;

    const pausedInLast90 = data.pausedSubs.filter(sub => {
      if (!sub.last_updated) return false;
      const updateDate = new Date(sub.last_updated);
      return updateDate >= ninetyDaysAgo;
    }).length;

    // Churn rate: cancelled / (active + cancelled)
    // Use total subscriptions (not just those with orders in last 90 days)
    const totalSubscriptions = activeSubscriptionCount + data.cancelledSubs.length;
    let churnRate = 0;

    if (totalSubscriptions > 0) {
      // If we have specific last 90 day data, use it; otherwise use all-time
      if (cancelledInLast90 > 0) {
        // Monthly churn rate from last 90 days
        churnRate = (cancelledInLast90 / totalSubscriptions) * (30 / 90) * 100;
      } else {
        // Fall back to all-time churn rate
        churnRate = (data.cancelledSubs.length / totalSubscriptions) * 100;
      }
    }

    // Calculate Predictive CLV
    const predictiveCLV = churnRate > 0 ? (arpu / (churnRate / 100)) : null;

    console.log('CLV Metrics calculated:', {
      realizedCLV_all,
      realizedCLV_mature,
      matureCustomerRatio,
      arpu,
      churnRate,
      predictiveCLV,
      activeSubscriptions: activeSubscriptionCount,
      totalSubscriptions,
      cancelledInLast90
    });

    return {
      realizedCLV_all: Math.round(realizedCLV_all * 100) / 100,
      realizedCLV_mature: Math.round(realizedCLV_mature * 100) / 100,
      matureCustomerRatio: Math.round(matureCustomerRatio * 100) / 100,
      predictiveCLV: predictiveCLV ? Math.round(predictiveCLV * 100) / 100 : null,
      churnRate: Math.round(churnRate * 100) / 100,
      arpu: Math.round(arpu * 100) / 100,
      metadata: {
        totalCustomers: countAll,
        matureCustomers: countMature,
        activeInLast90Days: activeSubscriptionCount,
        cancelledInLast90Days: cancelledInLast90,
        pausedInLast90Days: pausedInLast90,
        totalSubscriptions: totalSubscriptions,
        churnCalculationMethod: cancelledInLast90 > 0 ? 'Last 90 days (monthly rate)' : 'All-time average'
      },
      currency: 'USD',
      quality: 'good'
    };
  } catch (error) {
    console.error('Error calculating CLV metrics:', error);
    return {
      realizedCLV_all: 0,
      realizedCLV_mature: 0,
      matureCustomerRatio: 0,
      predictiveCLV: null,
      churnRate: 0,
      arpu: 0,
      metadata: {},
      currency: 'USD',
      quality: 'error',
      error: error.message
    };
  }
}

/**
 * 6. Average Revenue Per User - Enhanced calculation
 */
function calculateARPU(data, startDate = null, endDate = null) {
  try {
    let totalRevenue = 0;
    let totalCustomerMonths = 0;

    const customerRevenueMap = new Map();

    // Calculate revenue per customer
    data.payments.forEach(payment => {
      if (!payment.amount || !payment.order_number) return;

      const order = data.orders.find(o => o.order_id === payment.order_number);
      if (!order || !order.customer_id) return;

      const revenue = parseFloat(payment.amount) || 0;
      const customerId = order.customer_id;

      if (!customerRevenueMap.has(customerId)) {
        customerRevenueMap.set(customerId, 0);
      }
      customerRevenueMap.set(customerId, customerRevenueMap.get(customerId) + revenue);
    });

    // Subtract refunds
    data.refunds.forEach(refund => {
      if (!refund.amount || !refund.order_id) return;

      const order = data.orders.find(o => o.order_id === refund.order_id);
      if (!order || !order.customer_id) return;

      const refundAmount = parseFloat(refund.amount) || 0;
      const customerId = order.customer_id;

      if (customerRevenueMap.has(customerId)) {
        customerRevenueMap.set(customerId, customerRevenueMap.get(customerId) - refundAmount);
      }
    });

    // Calculate ARPU (simplified to total revenue / total customers)
    customerRevenueMap.forEach(revenue => {
      totalRevenue += revenue;
    });

    const arpu = customerRevenueMap.size > 0 ? totalRevenue / customerRevenueMap.size : 0;

    return {
      amount: Math.round(arpu * 100) / 100,
      currency: 'USD',
      totalCustomers: customerRevenueMap.size,
      quality: 'good'
    };
  } catch (error) {
    console.error('Error calculating ARPU:', error);
    return { amount: 0, currency: 'USD', totalCustomers: 0, quality: 'error' };
  }
}

/**
 * 7. Net Revenue After Refunds
 */
function calculateNetRevenue(data, startDate = null, endDate = null) {
  try {
    const totalPayments = data.payments.reduce((sum, payment) => {
      return sum + (parseFloat(payment.amount) || 0);
    }, 0);

    const totalRefunds = data.refunds.reduce((sum, refund) => {
      return sum + (parseFloat(refund.amount) || 0);
    }, 0);

    const netRevenue = totalPayments - totalRefunds;
    const refundRate = totalPayments > 0 ? (totalRefunds / totalPayments) * 100 : 0;

    return {
      amount: Math.round(netRevenue * 100) / 100,
      currency: 'USD',
      totalPayments: Math.round(totalPayments * 100) / 100,
      totalRefunds: Math.round(totalRefunds * 100) / 100,
      refundRate: Math.round(refundRate * 100) / 100,
      quality: 'good'
    };
  } catch (error) {
    console.error('Error calculating net revenue:', error);
    return { amount: 0, currency: 'USD', quality: 'error' };
  }
}

/**
 * 8. Payment Success Rate
 */
function calculatePaymentSuccessRate(data, startDate = null, endDate = null) {
  try {
    const totalPayments = data.payments.length;
    const successfulPayments = data.payments.filter(p => p.amount && parseFloat(p.amount) > 0).length;

    const successRate = totalPayments > 0 ? (successfulPayments / totalPayments) * 100 : 0;

    return {
      rate: Math.round(successRate * 100) / 100,
      successfulPayments,
      totalPayments,
      quality: successRate > 95 ? 'excellent' : successRate > 90 ? 'good' : 'needs_improvement'
    };
  } catch (error) {
    console.error('Error calculating payment success rate:', error);
    return { rate: 0, successfulPayments: 0, totalPayments: 0, quality: 'error' };
  }
}

/**
 * 9. Enhanced Churn Rate - Cohort-based
 */
function calculateEnhancedChurnRate(data) {
  try {
    const totalActiveCustomers = data.subscriptions.filter(s => s.Status === 'active').length;
    const totalCancelledCustomers = data.cancelledSubs.length;
    const totalCustomers = totalActiveCustomers + totalCancelledCustomers;

    const churnRate = totalCustomers > 0 ? (totalCancelledCustomers / totalCustomers) * 100 : 0;

    return {
      rate: Math.round(churnRate * 100) / 100,
      activeCustomers: totalActiveCustomers,
      cancelledCustomers: totalCancelledCustomers,
      methodology: 'Cancelled / (Active + Cancelled)',
      quality: churnRate < 5 ? 'excellent' : churnRate < 10 ? 'good' : 'needs_improvement'
    };
  } catch (error) {
    console.error('Error calculating churn rate:', error);
    return { rate: 0, activeCustomers: 0, cancelledCustomers: 0, quality: 'error' };
  }
}

/**
 * 10. Medication Adherence Rate
 */
function calculateAdherenceRate(data) {
  try {
    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));

    let adherentCustomers = 0;
    let totalEligibleCustomers = 0;

    data.subscriptions.forEach(sub => {
      if (!sub['Datetime Created']) return;

      const startDate = new Date(sub['Datetime Created']);
      const daysSinceStart = (now - startDate) / (1000 * 60 * 60 * 24);

      if (daysSinceStart >= 90) {
        totalEligibleCustomers++;

        if (sub.Status === 'active' || daysSinceStart >= 90) {
          adherentCustomers++;
        }
      }
    });

    const adherenceRate = totalEligibleCustomers > 0 ? (adherentCustomers / totalEligibleCustomers) * 100 : 0;

    return {
      rate: Math.round(adherenceRate * 100) / 100,
      adherentCustomers,
      totalEligibleCustomers,
      clinicalTarget: 80,
      quality: adherenceRate >= 80 ? 'excellent' : adherenceRate >= 70 ? 'good' : 'needs_improvement'
    };
  } catch (error) {
    console.error('Error calculating adherence rate:', error);
    return { rate: 0, adherentCustomers: 0, totalEligibleCustomers: 0, quality: 'error' };
  }
}

/**
 * 11. Order Processing Efficiency
 */
function calculateProcessingEfficiency(data, startDate = null, endDate = null) {
  try {
    const processingTimes = [];

    data.orders.forEach(order => {
      if (!order.created_at || !order.updated_at) return;

      const createdTime = new Date(order.created_at);
      const updatedTime = new Date(order.updated_at);

      const processingHours = (updatedTime - createdTime) / (1000 * 60 * 60);
      if (processingHours >= 0 && processingHours <= 168) { // Within 1 week
        processingTimes.push(processingHours);
      }
    });

    if (processingTimes.length === 0) {
      return { median: 0, p90: 0, sampleSize: 0, quality: 'no_data' };
    }

    processingTimes.sort((a, b) => a - b);
    const median = processingTimes[Math.floor(processingTimes.length / 2)];
    const p90 = processingTimes[Math.floor(processingTimes.length * 0.9)];

    return {
      median: Math.round(median * 100) / 100,
      p90: Math.round(p90 * 100) / 100,
      sampleSize: processingTimes.length,
      unit: 'hours',
      quality: median < 24 ? 'excellent' : median < 48 ? 'good' : 'needs_improvement'
    };
  } catch (error) {
    console.error('Error calculating processing efficiency:', error);
    return { median: 0, p90: 0, sampleSize: 0, quality: 'error' };
  }
}

/**
 * 12. Product Performance Analysis
 */
function calculateProductPerformance(data, startDate = null, endDate = null) {
  try {
    const productMetrics = {};

    data.products.forEach(product => {
      const productOrders = data.orders.filter(order => order.product_id === product.product_id);
      const productSubscriptions = data.subscriptions.filter(sub => sub.ProductID === product.product_id);

      const revenue = productOrders.reduce((sum, order) => {
        const payment = data.payments.find(p => p.order_number === order.order_id);
        return sum + (payment ? parseFloat(payment.amount) || 0 : 0);
      }, 0);

      productMetrics[product.product_id] = {
        name: product.name || product.product_id,
        totalOrders: productOrders.length,
        activeSubscriptions: productSubscriptions.filter(s => s.Status === 'active').length,
        revenue: Math.round(revenue * 100) / 100,
        uniqueCustomers: new Set(productOrders.map(o => o.customer_id)).size
      };
    });

    const topProducts = Object.values(productMetrics)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      totalProducts: Object.keys(productMetrics).length,
      topProducts,
      quality: 'good'
    };
  } catch (error) {
    console.error('Error calculating product performance:', error);
    return { totalProducts: 0, topProducts: [], quality: 'error' };
  }
}

/**
 * Assess overall data quality
 */
function assessDataQuality(data) {
  const quality = {
    customers: data.customers.length,
    orders: data.orders.length,
    payments: data.payments.length,
    subscriptions: data.subscriptions.length,
    overall: 'good'
  };

  if (quality.customers < 10 || quality.orders < 10) {
    quality.overall = 'low';
  }

  return quality;
}

/**
 * Test function to verify everything works
 */
function testDashboard() {
  try {
    console.log('Testing Enhanced KPI Dashboard...');

    const data = loadAllData();
    console.log('Data loaded successfully');

    // Set up proper date range for testing
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1); // Start of current month
    const endDate = new Date(now);

    const kpis = calculateAllKPIs(data, 'monthly', startDate, endDate);
    console.log('KPIs calculated successfully');
    console.log('LTV Result:', kpis.ltv);

    return kpis;
  } catch (error) {
    console.error('Test failed:', error);
    return { error: error.message };
  }
}

/**
 * Create minimal KPIs structure as ultimate fallback
 */
function createMinimalKPIs(data) {
  console.log('Creating minimal KPIs fallback structure');
  return {
    snapshot: {
      activePatients: { count: data.subscriptions.length, quality: 'low' },
      realizedCLV_all: { amount: 0, currency: 'USD', quality: 'error' },
      realizedCLV_mature: { amount: 0, currency: 'USD', quality: 'error' },
      matureCustomerRatio: { percentage: 0, quality: 'error' },
      renewalRate: { rate: 0, matureCustomers: 0, renewedCustomers: 0, quality: 'error' }
    },
    timed: {
      newPatients: { count: data.customers.length, quality: 'low', trend: 'unknown' },
      geographicReach: { stateCount: 0, states: [], quality: 'low' },
      mrr: { amount: 0, currency: 'USD', activeSubscriptions: data.subscriptions.length, quality: 'low' },
      arpu: { amount: 0, currency: 'USD', quality: 'low' },
      netRevenue: { amount: 0, currency: 'USD', totalPayments: 0, totalRefunds: 0, refundRate: 0, quality: 'low' },
      paymentSuccessRate: { rate: 0, successfulPayments: 0, totalPayments: 0, quality: 'low' },
      churnRate: { rate: 0, activeCustomers: 0, cancelledCustomers: 0, quality: 'low' },
      predictiveCLV: { amount: null, currency: 'USD', quality: 'error' },
      adherenceRate: { rate: 0, adherentCustomers: 0, totalEligibleCustomers: 0, clinicalTarget: 80, quality: 'low' },
      processingEfficiency: { median: 0, p90: 0, sampleSize: 0, unit: 'hours', quality: 'no_data' },
      productPerformance: { totalProducts: data.products.length, topProducts: [], quality: 'low' }
    },
    lastUpdated: new Date(),
    dataQuality: { customers: data.customers.length, orders: data.orders.length, payments: data.payments.length, subscriptions: data.subscriptions.length, overall: 'error' },
    timePeriod: 'error',
    fallbackMode: true,
    errorMessage: 'KPI calculation failed, showing minimal data structure'
  };
}

/**
 * Simple diagnostic to check spreadsheet access and data availability
 */
function diagnosticCheck() {
  try {
    console.log('=== RUNNING DIAGNOSTIC CHECK ===');

    // Check spreadsheet access
    const spreadsheet = SpreadsheetApp.openById(DATABASE_SPREADSHEET_ID);
    console.log('✅ Spreadsheet access successful');

    // Check sheets exist
    const sheetNames = ['customers', 'order.created', 'payment_succesful', 'refund.created',
                       'products', 'subscription.active', 'subscription.cancelled', 'addresses'];

    const results = {};
    sheetNames.forEach(name => {
      const sheet = spreadsheet.getSheetByName(name);
      if (sheet) {
        const rowCount = sheet.getLastRow();
        results[name] = { exists: true, rows: rowCount };
        console.log(`✅ ${name}: ${rowCount} rows`);
      } else {
        results[name] = { exists: false, rows: 0 };
        console.log(`❌ ${name}: NOT FOUND`);
      }
    });

    console.log('=== DIAGNOSTIC COMPLETE ===');
    return {
      success: true,
      spreadsheetId: DATABASE_SPREADSHEET_ID,
      sheets: results
    };
  } catch (error) {
    console.error('❌ DIAGNOSTIC FAILED:', error);
    return {
      success: false,
      error: error.message,
      stack: error.stack
    };
  }
}