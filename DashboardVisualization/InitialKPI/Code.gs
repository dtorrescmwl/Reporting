/**
 * Initial KPI Dashboard - Google Apps Script Backend
 * Comprehensive healthcare business metrics dashboard
 *
 * Data Sources:
 * - Database_CarePortals.xlsx: Main subscription and order data
 * - Customer_Support.xlsx: Support and operational data
 *
 * KPIs Implemented:
 * - Growth & Revenue: New enrollments, active patients, MRR, ARPU, churn rates, LTV
 * - Operations: Intake to prescription, prescription to shipment times
 * - Clinical: Medication adherence rates
 */

// Configuration
const SPREADSHEET_ID = '1PaCOgNJmKSb2VsJjCMjWpCG-gwrO7uVkuTAFUdrV-_o'; // Database_CarePortals.xlsx
const CUSTOMER_SUPPORT_SPREADSHEET_ID = '1h-ttn7R6s2KszovW_NvBI1x6fVUaXAjcID6-Xa0ISsw'; // Customer_Support.xlsx
const CAREPORTALS_ORDERS_SPREADSHEET_ID = '1J62EOn9OXZzFpqcyw4egfjZe72gOpYJPohApUPmtoKM'; // CarePortals_Orders.xlsx
const CACHE_DURATION = 300; // 5 minutes cache

/**
 * Main function to serve the KPI dashboard
 */
function doGet(e) {
  const htmlOutput = HtmlService.createTemplateFromFile('kpi_dashboard');

  // Add any server-side variables if needed
  htmlOutput.title = 'Healthcare KPI Dashboard';

  return htmlOutput.evaluate()
    .setTitle('Healthcare KPI Dashboard')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * Include HTML partials and CSS/JS files
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Main KPI calculation function
 * Returns comprehensive metrics for the dashboard
 */
function calculateKPIs(timePeriod = 'monthly') {
  try {
    console.log(`Calculating KPIs for time period: ${timePeriod}`);

    // Check cache first
    const cacheKey = `kpi_data_${timePeriod}`;
    const cached = CacheService.getScriptCache().get(cacheKey);
    if (cached) {
      console.log('Returning cached KPI data');
      return JSON.parse(cached);
    }

    // Get fresh data from multiple spreadsheets
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const supportSs = SpreadsheetApp.openById(CUSTOMER_SUPPORT_SPREADSHEET_ID);

    // Try to access CarePortals Orders spreadsheet (may need correct ID)
    let carePortalsSs = null;
    try {
      carePortalsSs = SpreadsheetApp.openById(CAREPORTALS_ORDERS_SPREADSHEET_ID);
    } catch (error) {
      console.warn('Could not access CarePortals Orders spreadsheet:', error.toString());
    }

    const data = {
      // Main database data
      subscriptions: getSheetData(ss, 'subscription.active'),
      customers: getSheetData(ss, 'customers'),
      orders: getSheetData(ss, 'order.created'),
      products: getSheetData(ss, 'products'),
      payments: getSheetData(ss, 'payment_succesful'),
      cancelled: getSheetData(ss, 'order.cancelled'),
      paused: getSheetData(ss, 'subscription.paused'),
      cancelledSubscriptions: getSheetData(ss, 'subscription.cancelled'),
      addresses: getSheetData(ss, 'addresses'),
      refunds: getSheetData(ss, 'refund.created'),

      // Customer support data
      shipped: getSheetData(supportSs, 'shipped'),
      awaitingShipment: getSheetData(supportSs, 'awaiting_shipment'),
      awaitingScript: getSheetData(supportSs, 'awaiting_script'),
      processing: getSheetData(supportSs, 'processing'),
      supportFullLog: getSheetData(supportSs, 'full_log'),

      // CarePortals Orders data (if available)
      prescriptionCreated: carePortalsSs ? getSheetData(carePortalsSs, 'prescription.created') : [],
      carePortalsOrders: carePortalsSs ? getSheetData(carePortalsSs, 'order.created') : [],
      orderUpdated: carePortalsSs ? getSheetData(carePortalsSs, 'order.updated') : []
    };

    // Calculate all KPIs
    const kpis = {
      // Growth & Revenue Metrics
      growthRevenue: calculateGrowthRevenueKPIs(data, timePeriod),

      // Operations & Logistics Metrics
      operations: calculateOperationsKPIs(data, timePeriod),

      // Clinical & Patient Success Metrics
      clinical: calculateClinicalKPIs(data, timePeriod),

      // Financial Risk Metrics
      financial: calculateFinancialKPIs(data, timePeriod),

      // Order Flow Metrics
      orderFlow: calculateOrderFlowKPIs(data, timePeriod),

      // Summary metrics for quick overview
      summary: calculateSummaryMetrics(data),

      // Metadata
      lastUpdated: new Date().toISOString(),
      timePeriod: timePeriod,
      dataPoints: {
        subscriptions: data.subscriptions.length,
        customers: data.customers.length,
        orders: data.orders.length,
        payments: data.payments.length
      }
    };

    // Cache the results
    CacheService.getScriptCache().put(cacheKey, JSON.stringify(kpis), CACHE_DURATION);

    console.log('KPI calculation completed successfully');
    return kpis;

  } catch (error) {
    console.error('Error calculating KPIs:', error.toString());
    return {
      error: error.toString(),
      lastUpdated: new Date().toISOString()
    };
  }
}

/**
 * Calculate Growth & Revenue KPIs
 */
function calculateGrowthRevenueKPIs(data, timePeriod) {
  const now = new Date();
  const periodStart = getPeriodStart(now, timePeriod);

  // New Patient Enrollments (using subscription creation as proxy for customer enrollment)
  const newEnrollments = data.subscriptions.filter(sub => {
    const createdDate = new Date(sub['Datetime Created']);
    return createdDate >= periodStart && createdDate <= now;
  }).length;

  // Active Patients (customers with active subscriptions)
  const activePatients = data.subscriptions.filter(sub =>
    sub.Status === 'active' || sub.Status === 'trialing'
  ).length;

  // Monthly Recurring Revenue (MRR)
  const mrr = calculateMRR(data);

  // Average Revenue per Patient (ARPU)
  const arpu = activePatients > 0 ? mrr / activePatients : 0;

  // Pause Rate
  const pauseRate = calculatePauseRate(data, timePeriod);

  // Churn Rate
  const churnRate = calculateChurnRate(data, timePeriod);

  // Subscription Renewal Rate
  const renewalRate = calculateRenewalRate(data, timePeriod);

  // Average Subscription Duration
  const avgSubscriptionDuration = calculateAvgSubscriptionDuration(data);

  // Lifetime Value (LTV)
  const ltv = calculateLTV(arpu, churnRate);

  // Gross Revenue (total payments)
  const grossRevenue = data.payments.reduce((sum, payment) => {
    return sum + (parseFloat(payment.amount) || 0);
  }, 0);

  // Net Revenue (gross revenue minus refunds)
  const totalRefunds = data.refunds ? data.refunds.reduce((sum, refund) => {
    return sum + (parseFloat(refund.amount) || 0);
  }, 0) : 0;
  const netRevenue = grossRevenue - totalRefunds;

  return {
    newEnrollments: {
      value: newEnrollments,
      label: `New Patient Enrollments (${timePeriod})`,
      trend: calculateTrend(data.customers, 'created_at', timePeriod)
    },
    activePatients: {
      value: activePatients,
      label: 'Active Patients',
      trend: null // Would need historical data
    },
    mrr: {
      value: mrr,
      label: 'Monthly Recurring Revenue',
      formatted: `$${mrr.toLocaleString()}`,
      trend: null
    },
    arpu: {
      value: arpu,
      label: 'Average Revenue per Patient',
      formatted: `$${arpu.toFixed(2)}`,
      trend: null
    },
    pauseRate: {
      value: pauseRate,
      label: 'Pause Rate',
      formatted: `${pauseRate.toFixed(2)}%`,
      trend: null
    },
    churnRate: {
      value: churnRate,
      label: 'Churn Rate',
      formatted: `${churnRate.toFixed(2)}%`,
      trend: null
    },
    renewalRate: {
      value: renewalRate,
      label: 'Subscription Renewal Rate',
      formatted: `${renewalRate.toFixed(2)}%`,
      trend: null
    },
    avgSubscriptionDuration: {
      value: avgSubscriptionDuration,
      label: 'Average Subscription Duration',
      formatted: `${avgSubscriptionDuration.toFixed(1)} months`,
      trend: null
    },
    ltv: {
      value: ltv,
      label: 'Customer Lifetime Value',
      formatted: `$${ltv.toFixed(2)}`,
      trend: null
    },
    grossRevenue: {
      value: grossRevenue,
      label: 'Gross Revenue (Total Payments)',
      formatted: `$${grossRevenue.toLocaleString()}`,
      trend: null
    },
    netRevenue: {
      value: netRevenue,
      label: 'Net Revenue (After Refunds)',
      formatted: `$${netRevenue.toLocaleString()}`,
      refundAmount: totalRefunds,
      trend: null
    }
  };
}

/**
 * Calculate stage timing from order.updated data with proper inter-spreadsheet linking
 * Focuses on recent shipped orders with complete data for better accuracy
 */
function calculateStageTimings(data, timePeriod) {
  const orderUpdates = data.orderUpdated || [];

  if (orderUpdates.length === 0) {
    console.warn('No order.updated data available for stage timing analysis');
    return {
      purchaseToAwaitingScript: { avgHours: 0, sampleSize: 0 },
      awaitingScriptToAwaitingShipment: { avgHours: 0, sampleSize: 0 },
      awaitingShipmentToShipped: { avgHours: 0, sampleSize: 0 },
      purchaseToShipped: { avgHours: 0, sampleSize: 0 }
    };
  }

  // Get order.created data to link with order updates
  const ordersCreated = data.orders || [];

  // Filter for recent shipped orders with complete data
  const qualifyingOrderIds = getRecentShippedOrdersWithCompleteData(orderUpdates, ordersCreated);
  const orderCreatedMap = {};

  // Map order_id to created_at timestamp
  ordersCreated.forEach(order => {
    if (order.order_id && order.created_at) {
      orderCreatedMap[order.order_id] = new Date(order.created_at);
    }
  });

  const orderHistory = {};

  // Group updates by order ID using correct field names, filtered to qualifying orders
  orderUpdates.forEach(update => {
    const orderId = update['Order ID'];
    const updateDate = new Date(update['Timestamp']);
    const status = update['Status'];

    if (!orderId) return; // Skip if no order ID

    // Only process qualifying orders with complete data
    if (!qualifyingOrderIds.includes(orderId.toString())) return;

    if (!orderHistory[orderId]) {
      orderHistory[orderId] = [];
      // Add order.created as first status if we have it
      if (orderCreatedMap[orderId]) {
        orderHistory[orderId].push({
          status: 'order.created',
          timestamp: orderCreatedMap[orderId],
          orderId: orderId
        });
      }
    }

    orderHistory[orderId].push({
      status: status,
      timestamp: updateDate,
      orderId: orderId
    });
  });

  const stageTimes = {
    purchaseToAwaitingScript: [],
    awaitingScriptToAwaitingShipment: [],
    awaitingShipmentToShipped: [],
    purchaseToShipped: []
  };

  // Analyze timing for each order
  Object.keys(orderHistory).forEach(orderId => {
    const transitions = orderHistory[orderId].sort((a, b) => a.timestamp - b.timestamp);

    // Find stage timestamps (use latest occurrence if multiple)
    let orderCreated = null;
    let awaitingScript = null;
    let awaitingShipment = null;
    let shipped = null;

    transitions.forEach(transition => {
      switch (transition.status) {
        case 'order.created':
          if (!orderCreated) orderCreated = transition.timestamp;
          break;
        case 'awaiting_script':
          awaitingScript = transition.timestamp; // Use latest
          break;
        case 'awaiting_shipment':
          awaitingShipment = transition.timestamp; // Use latest
          break;
        case 'shipped':
          if (!shipped) shipped = transition.timestamp;
          break;
      }
    });

    // Calculate stage timings
    if (orderCreated && awaitingScript) {
      const hours = (awaitingScript - orderCreated) / (1000 * 60 * 60);
      if (hours > 0 && hours < 720) { // Max 30 days
        stageTimes.purchaseToAwaitingScript.push(hours);
      }
    }

    if (awaitingScript && awaitingShipment) {
      const hours = (awaitingShipment - awaitingScript) / (1000 * 60 * 60);
      if (hours > 0 && hours < 720) {
        stageTimes.awaitingScriptToAwaitingShipment.push(hours);
      }
    }

    if (awaitingShipment && shipped) {
      const hours = (shipped - awaitingShipment) / (1000 * 60 * 60);
      if (hours > 0 && hours < 720) {
        stageTimes.awaitingShipmentToShipped.push(hours);
      }
    }

    if (orderCreated && shipped) {
      const hours = (shipped - orderCreated) / (1000 * 60 * 60);
      if (hours > 0 && hours < 720) {
        stageTimes.purchaseToShipped.push(hours);
      }
    }
  });

  // Calculate averages
  const result = {};
  Object.keys(stageTimes).forEach(stage => {
    const times = stageTimes[stage];
    result[stage] = {
      avgHours: times.length > 0 ? times.reduce((sum, time) => sum + time, 0) / times.length : 0,
      sampleSize: times.length
    };
  });

  console.log(`Stage timing analysis completed:`, result);
  return result;
}

/**
 * Calculate Operations & Logistics KPIs
 */
function calculateOperationsKPIs(data, timePeriod) {
  // Calculate stage timings from order.updated data
  const stageTimings = calculateStageTimings(data, timePeriod);

  return {
    purchaseToAwaitingScript: {
      value: stageTimings.purchaseToAwaitingScript.avgHours,
      label: 'Avg Time: Purchase → Awaiting Script',
      formatted: `${stageTimings.purchaseToAwaitingScript.avgHours.toFixed(1)} hours`,
      sampleSize: stageTimings.purchaseToAwaitingScript.sampleSize,
      trend: null
    },
    awaitingScriptToAwaitingShipment: {
      value: stageTimings.awaitingScriptToAwaitingShipment.avgHours,
      label: 'Avg Time: Awaiting Script → Awaiting Shipment',
      formatted: `${stageTimings.awaitingScriptToAwaitingShipment.avgHours.toFixed(1)} hours`,
      sampleSize: stageTimings.awaitingScriptToAwaitingShipment.sampleSize,
      trend: null
    },
    awaitingShipmentToShipped: {
      value: stageTimings.awaitingShipmentToShipped.avgHours,
      label: 'Avg Time: Awaiting Shipment → Shipped',
      formatted: `${stageTimings.awaitingShipmentToShipped.avgHours.toFixed(1)} hours`,
      sampleSize: stageTimings.awaitingShipmentToShipped.sampleSize,
      trend: null
    },
    purchaseToShipped: {
      value: stageTimings.purchaseToShipped.avgHours,
      label: 'Avg Time: Purchase → Shipped (Total)',
      formatted: `${stageTimings.purchaseToShipped.avgHours.toFixed(1)} hours`,
      sampleSize: stageTimings.purchaseToShipped.sampleSize,
      trend: null
    }
  };
}

/**
 * Calculate Cancelled Order / Refund Rate with Full vs Partial breakdown
 */
function calculateCancelledOrderRefundRate(data, timePeriod) {
  // CANCELLED ORDER RATE CALCULATION
  // Data sources: order.updated (careportals_orders) + order.created (database_careportals)
  let totalOrdersCreated = 0;
  let totalOrdersCancelled = 0;

  // Step 1: Get orders created in the time period
  const createdOrderIds = new Set();
  if (data.orders && data.orders.length > 0) {
    data.orders.forEach(order => {
      const createdDate = new Date(order.created_at);
      if (isDateInPeriod(createdDate, timePeriod)) {
        totalOrdersCreated++;
        createdOrderIds.add(order.order_id);
      }
    });
  }

  // Step 2: Find cancellations from order.updated that match created orders
  if (data.orderUpdated && data.orderUpdated.length > 0) {
    const cancelledInPeriod = new Set(); // Track unique cancelled orders

    data.orderUpdated.forEach(update => {
      const orderId = update['Order ID'];
      const status = update['Status'];
      const updateDate = new Date(update['Timestamp']);

      // Check if this is a cancellation status and the order was created in our period
      if (status && status.toLowerCase().includes('cancel') &&
          createdOrderIds.has(orderId) &&
          isDateInPeriod(updateDate, timePeriod)) {
        cancelledInPeriod.add(orderId);
      }
    });

    totalOrdersCancelled = cancelledInPeriod.size;
  }

  const cancelledOrderRate = totalOrdersCreated > 0 ? (totalOrdersCancelled / totalOrdersCreated) * 100 : 0;

  // REFUND RATE CALCULATION WITH 3-STEP LINKING
  // Chain: refund.created → charge_id → payment_successful → order.created
  let totalPayments = 0;
  let totalRefunds = 0;
  let totalRefundAmount = 0;
  let totalPaymentAmount = 0;
  let fullRefunds = 0;
  let partialRefunds = 0;
  let ordersWithRefunds = 0;

  // Step 1: Build payment lookup by charge_id
  const paymentsMap = {};
  const paymentOrderMap = {}; // charge_id → order_id
  if (data.payments && data.payments.length > 0) {
    data.payments.forEach(payment => {
      const paymentDate = new Date(payment.datetime);
      if (isDateInPeriod(paymentDate, timePeriod)) {
        totalPayments++;
        totalPaymentAmount += parseFloat(payment.amount) || 0;
        paymentsMap[payment.charge_id] = {
          amount: parseFloat(payment.amount) || 0,
          order_id: payment.order_id
        };
        paymentOrderMap[payment.charge_id] = payment.order_id;
      }
    });
  }

  // Step 2: Process refunds with 3-step linking
  const refundedOrderIds = new Set();
  if (data.refunds && data.refunds.length > 0) {
    data.refunds.forEach(refund => {
      const refundDate = new Date(refund.datetime);
      if (isDateInPeriod(refundDate, timePeriod)) {
        const chargeId = refund.charge_id;
        const refundAmount = parseFloat(refund.amount) || 0;

        // Step 2a: Find payment via charge_id
        const paymentInfo = paymentsMap[chargeId];
        if (paymentInfo) {
          // Step 2b: Link to order via payment data
          const orderId = paymentInfo.order_id;
          if (orderId && createdOrderIds.has(orderId)) {
            // This refund links to an order created in our period
            totalRefunds++;
            totalRefundAmount += refundAmount;
            refundedOrderIds.add(orderId);

            // Check if full or partial refund
            const originalAmount = paymentInfo.amount;
            if (originalAmount > 0) {
              const refundPercentage = (refundAmount / originalAmount) * 100;
              if (refundPercentage >= 99) { // Consider 99%+ as full refund
                fullRefunds++;
              } else {
                partialRefunds++;
              }
            } else {
              partialRefunds++;
            }
          }
        }
      }
    });
  }

  ordersWithRefunds = refundedOrderIds.size;

  // Calculate rates
  const refundRate = totalPayments > 0 ? (totalRefunds / totalPayments) * 100 : 0;
  const orderRefundRate = totalOrdersCreated > 0 ? (ordersWithRefunds / totalOrdersCreated) * 100 : 0;
  const refundAmountRate = totalPaymentAmount > 0 ? (totalRefundAmount / totalPaymentAmount) * 100 : 0;
  const fullRefundRate = totalPayments > 0 ? (fullRefunds / totalPayments) * 100 : 0;
  const partialRefundRate = totalPayments > 0 ? (partialRefunds / totalPayments) * 100 : 0;

  return {
    // Cancelled Order Metrics
    cancelledOrderRate: cancelledOrderRate,
    totalOrdersCreated: totalOrdersCreated,
    totalOrdersCancelled: totalOrdersCancelled,

    // Refund Metrics (with 3-step linking)
    refundRate: refundRate,
    orderRefundRate: orderRefundRate,
    refundAmountRate: refundAmountRate,
    totalPayments: totalPayments,
    totalRefunds: totalRefunds,
    ordersWithRefunds: ordersWithRefunds,
    totalPaymentAmount: totalPaymentAmount,
    totalRefundAmount: totalRefundAmount,
    fullRefunds: fullRefunds,
    partialRefunds: partialRefunds,
    fullRefundRate: fullRefundRate,
    partialRefundRate: partialRefundRate
  };
}

/**
 * Filter for recent shipped orders with complete stage data based on local analysis
 * This function replicates the exact filtering logic that was tested locally
 * @param {Array} orderUpdates - All order updates
 * @param {Array} ordersCreated - Order creation data for linkage
 * @param {number} daysBack - Number of days to look back (default 60)
 * @returns {Array} Filtered order IDs with complete data
 */
function getRecentShippedOrdersWithCompleteData(orderUpdates, ordersCreated, daysBack = 60) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);

  // Create order creation lookup
  const createdOrderIds = new Set();
  ordersCreated.forEach(order => {
    if (order.order_id) {
      createdOrderIds.add(order.order_id);
    }
  });

  // Group updates by order ID
  const orderGroups = {};
  orderUpdates.forEach(update => {
    const orderId = update['Order ID'];
    const timestamp = new Date(update['Timestamp']);

    if (!orderId) return;

    if (!orderGroups[orderId]) {
      orderGroups[orderId] = [];
    }
    orderGroups[orderId].push({
      status: update['Status'],
      timestamp: timestamp
    });
  });

  // Apply the exact same criteria as local analysis
  const qualifyingOrderIds = [];

  Object.keys(orderGroups).forEach(orderIdStr => {
    const orderId = parseFloat(orderIdStr);
    const updates = orderGroups[orderIdStr].sort((a, b) => a.timestamp - b.timestamp);
    const statuses = updates.map(u => u.status);

    // Criteria 1: Has creation data
    const hasCreation = createdOrderIds.has(orderId);

    // Criteria 2: Has shipped status
    const hasShipped = statuses.includes('shipped');

    // Criteria 3: Has meaningful progression (3+ unique stages)
    const uniqueStatuses = [...new Set(statuses)];
    const hasProgression = uniqueStatuses.length >= 3;

    // Criteria 4: Has key stages (awaiting_script OR awaiting_shipment)
    const hasKeyStages = uniqueStatuses.includes('awaiting_script') ||
                        uniqueStatuses.includes('awaiting_shipment');

    // Criteria 5: Is recent (shipped in last 60 days)
    let isRecent = false;
    if (hasShipped) {
      const shippedUpdate = updates.filter(u => u.status === 'shipped').pop();
      if (shippedUpdate) {
        isRecent = shippedUpdate.timestamp >= cutoffDate;
      }
    }

    // Order qualifies if it meets ALL criteria
    if (hasCreation && hasShipped && hasProgression && hasKeyStages && isRecent) {
      qualifyingOrderIds.push(orderIdStr);
    }
  });

  console.log(`Filtered to ${qualifyingOrderIds.length} recent shipped orders with complete data (from ${Object.keys(orderGroups).length} total)`);
  console.log(`Criteria breakdown: creation data + shipped + 3+ stages + key stages + recent (${daysBack} days)`);

  return qualifyingOrderIds;
}

/**
 * Calculate Order Stage Flow using recent shipped orders with complete data for better accuracy
 */
function calculateOrderStageFlow(data, timePeriod) {
  let totalOrders = 0;
  let ordersWithGoingBack = 0;

  // Use order.updated from CarePortals (not support log)
  const orderUpdates = data.orderUpdated || [];

  if (orderUpdates.length === 0) {
    console.warn('No order.updated data available for stage flow analysis');
    return {
      goingBackRate: 0,
      totalOrders: 0,
      ordersWithGoingBack: 0,
      avgStageTimings: {}
    };
  }

  // Get order.created data to link with order updates
  const ordersCreated = data.orders || [];

  // Filter for recent shipped orders with complete data
  const qualifyingOrderIds = getRecentShippedOrdersWithCompleteData(orderUpdates, ordersCreated);
  const orderCreatedMap = {};

  // Map order_id to created_at timestamp
  ordersCreated.forEach(order => {
    if (order.order_id && order.created_at) {
      orderCreatedMap[order.order_id] = new Date(order.created_at);
    }
  });

  const orderHistory = {};

  // Group updates by order ID using correct field names, filtered to qualifying orders
  orderUpdates.forEach(update => {
    const orderId = update['Order ID'];
    const updateDate = new Date(update['Timestamp']);
    const status = update['Status'];

    if (!orderId) return; // Skip if no order ID

    // Only process qualifying orders with complete data
    if (!qualifyingOrderIds.includes(orderId.toString())) return;

    if (!orderHistory[orderId]) {
      orderHistory[orderId] = [];
      // Add order.created as first status if we have it
      if (orderCreatedMap[orderId]) {
        orderHistory[orderId].push({
          status: 'order.created',
          timestamp: orderCreatedMap[orderId],
          orderId: orderId
        });
      }
    }

    orderHistory[orderId].push({
      status: status,
      timestamp: updateDate,
      orderId: orderId
    });
  });

  // Define order stage sequence based on actual data
  const stageSequence = [
    'order.created',
    'pending',
    'awaiting_payment',
    'awaiting_requirements',
    'awaiting_script',
    'processing',
    'awaiting_fulfillment',
    'awaiting_shipment',
    'shipped'
  ];

  // Analyze each order's progression
  Object.keys(orderHistory).forEach(orderId => {
    const transitions = orderHistory[orderId].sort((a, b) => a.timestamp - b.timestamp);

    if (transitions.length > 0) {
      totalOrders++;

      let hasGoingBack = false;
      let highestStageReached = -1;

      transitions.forEach(transition => {
        const currentStageIndex = stageSequence.indexOf(transition.status);

        if (currentStageIndex !== -1) {
          // Check if this is a "going back" event
          if (currentStageIndex < highestStageReached) {
            hasGoingBack = true;
          }

          highestStageReached = Math.max(highestStageReached, currentStageIndex);
        }
      });

      if (hasGoingBack) {
        ordersWithGoingBack++;
      }
    }
  });

  const goingBackRate = totalOrders > 0 ? (ordersWithGoingBack / totalOrders) * 100 : 0;

  console.log(`Order flow analysis: ${totalOrders} orders, ${ordersWithGoingBack} with going back events`);

  return {
    goingBackRate: goingBackRate,
    totalOrders: totalOrders,
    ordersWithGoingBack: ordersWithGoingBack,
    avgStageTimings: {} // Will be calculated in operations section
  };
}

/**
 * Calculate KPIs with custom date range
 */
function calculateKPIsWithCustomDates(startDateStr, endDateStr) {
  try {
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    console.log(`Calculating KPIs for custom range: ${startDate.toISOString()} to ${endDate.toISOString()}`);

    // Get all data
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const supportSs = SpreadsheetApp.openById(CUSTOMER_SUPPORT_SPREADSHEET_ID);
    const carePortalsSs = SpreadsheetApp.openById(CAREPORTALS_ORDERS_SPREADSHEET_ID);

    const data = {
      subscriptions: getSheetData(ss, 'subscription.active'),
      customers: getSheetData(ss, 'customers'),
      orders: getSheetData(ss, 'order.created'),
      products: getSheetData(ss, 'products'),
      payments: getSheetData(ss, 'payment_succesful'),
      cancelled: getSheetData(ss, 'order.cancelled'),
      paused: getSheetData(ss, 'subscription.paused'),
      cancelledSubscriptions: getSheetData(ss, 'subscription.cancelled'),
      addresses: getSheetData(ss, 'addresses'),
      refunds: getSheetData(ss, 'refunds.created'),

      // Customer Support data
      shipped: getSheetData(supportSs, 'shipped'),
      awaitingShipment: getSheetData(supportSs, 'awaiting_shipment'),
      awaitingScript: getSheetData(supportSs, 'awaiting_script'),
      processing: getSheetData(supportSs, 'processing'),
      supportFullLog: getSheetData(supportSs, 'full_log'),

      // CarePortals Orders data
      prescriptionCreated: carePortalsSs ? getSheetData(carePortalsSs, 'prescription.created') : [],
      carePortalsOrders: carePortalsSs ? getSheetData(carePortalsSs, 'order.created') : [],
      orderUpdated: carePortalsSs ? getSheetData(carePortalsSs, 'order.updated') : []
    };

    // Use existing functions with custom period logic embedded in isDateInPeriod
    const customTimePeriod = {
      type: 'custom',
      startDate: startDate,
      endDate: endDate
    };

    const kpis = {
      // Growth & Revenue Metrics
      growthRevenue: calculateGrowthRevenueKPIs(data, customTimePeriod),

      // Operations & Logistics Metrics
      operations: calculateOperationsKPIs(data, customTimePeriod),

      // Clinical & Patient Success Metrics
      clinical: calculateClinicalKPIs(data, customTimePeriod),

      // Financial Risk Metrics
      financial: calculateFinancialKPIs(data, customTimePeriod),

      // Order Flow Metrics
      orderFlow: calculateOrderFlowKPIs(data, customTimePeriod),

      // Summary metrics for quick overview
      summary: calculateSummaryMetrics(data),

      // Metadata
      lastUpdated: new Date().toISOString(),
      timePeriod: `custom (${startDateStr} to ${endDateStr})`,
      dataPoints: {
        subscriptions: data.subscriptions.length,
        customers: data.customers.length,
        orders: data.orders.length,
        payments: data.payments.length
      }
    };

    return kpis;

  } catch (error) {
    console.error('Error calculating custom KPIs:', error.toString());
    return {
      error: error.toString(),
      lastUpdated: new Date().toISOString()
    };
  }
}

/**
 * Helper function to check if date is in specified time period
 */
function isDateInPeriod(date, timePeriod, customStart = null, customEnd = null) {
  const now = new Date();

  // Handle custom period object
  if (typeof timePeriod === 'object' && timePeriod.type === 'custom') {
    return date >= timePeriod.startDate && date <= timePeriod.endDate;
  }

  if (timePeriod === 'custom' && customStart && customEnd) {
    return date >= new Date(customStart) && date <= new Date(customEnd);
  }

  if (timePeriod === 'all_time') {
    return true; // Include all dates for all time
  }

  let periodStart;

  switch (timePeriod) {
    case 'daily':
      periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'weekly':
      periodStart = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
      break;
    case 'monthly':
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'quarterly':
      const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
      periodStart = new Date(now.getFullYear(), quarterMonth, 1);
      break;
    case 'annually':
      periodStart = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  return date >= periodStart && date <= now;
}

/**
 * Calculate Financial Risk KPIs
 */
function calculateFinancialKPIs(data, timePeriod) {
  const financialData = calculateCancelledOrderRefundRate(data, timePeriod);

  return {
    cancelledOrderRate: {
      value: financialData.cancelledOrderRate,
      label: 'Cancelled Order Rate',
      formatted: `${financialData.cancelledOrderRate.toFixed(2)}%`,
      sampleSize: financialData.totalOrdersCreated,
      trend: null
    },
    refundRate: {
      value: financialData.refundRate,
      label: 'Payment Refund Rate',
      formatted: `${financialData.refundRate.toFixed(2)}%`,
      sampleSize: financialData.totalPayments,
      trend: null
    },
    orderRefundRate: {
      value: financialData.orderRefundRate,
      label: 'Order Refund Rate',
      formatted: `${financialData.orderRefundRate.toFixed(2)}%`,
      sampleSize: financialData.totalOrdersCreated,
      trend: null
    },
    fullRefundRate: {
      value: financialData.fullRefundRate,
      label: 'Full Refund Rate',
      formatted: `${financialData.fullRefundRate.toFixed(2)}%`,
      sampleSize: financialData.totalPayments,
      trend: null
    },
    partialRefundRate: {
      value: financialData.partialRefundRate,
      label: 'Partial Refund Rate',
      formatted: `${financialData.partialRefundRate.toFixed(2)}%`,
      sampleSize: financialData.totalPayments,
      trend: null
    },
    refundAmountRate: {
      value: financialData.refundAmountRate,
      label: 'Refund Amount Rate',
      formatted: `${financialData.refundAmountRate.toFixed(2)}%`,
      sampleSize: financialData.totalPayments,
      trend: null
    },
    totalCancellations: {
      value: financialData.totalOrdersCancelled,
      label: 'Total Order Cancellations',
      formatted: `${financialData.totalOrdersCancelled} of ${financialData.totalOrdersCreated} orders`,
      sampleSize: financialData.totalOrdersCreated,
      trend: null
    },
    totalRefunds: {
      value: financialData.totalRefunds,
      label: 'Total Payment Refunds',
      formatted: `${financialData.totalRefunds} (${financialData.fullRefunds} full, ${financialData.partialRefunds} partial)`,
      sampleSize: financialData.totalRefunds,
      trend: null
    },
    totalRefundAmount: {
      value: financialData.totalRefundAmount,
      label: 'Total Refund Amount',
      formatted: `$${financialData.totalRefundAmount.toFixed(2)}`,
      sampleSize: financialData.totalRefunds,
      trend: null
    }
  };
}

/**
 * Calculate Core Order Stage Flow using only the 4 key business stages
 */
function calculateCoreOrderStageFlow(data, timePeriod) {
  // CORE BUSINESS FLOW - ONLY THESE 4 STAGES MATTER
  const CORE_STAGES = [
    'awaiting_requirements',  // Stage 1
    'awaiting_script',        // Stage 2
    'awaiting_shipment',      // Stage 3
    'shipped'                 // Stage 4 (final)
  ];

  const orderUpdates = data.orderUpdated || [];

  if (orderUpdates.length === 0) {
    return {
      goingBackRate: 0,
      totalOrders: 0,
      ordersWithGoingBack: 0
    };
  }

  // Get order.created data to link with order updates
  const ordersCreated = data.orders || [];
  const createdOrderIds = new Set();
  ordersCreated.forEach(order => {
    if (order.order_id) {
      createdOrderIds.add(order.order_id);
    }
  });

  // Filter for recent shipped orders (last 60 days)
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 60);

  const recentShippedOrders = [];
  orderUpdates.forEach(update => {
    const orderId = update['Order ID'];
    const status = update['Status'];
    const timestamp = new Date(update['Timestamp']);

    if (status === 'shipped' && timestamp >= cutoffDate) {
      if (!recentShippedOrders.includes(orderId)) {
        recentShippedOrders.push(orderId);
      }
    }
  });

  // Find orders with complete core flow
  const completeOrders = [];

  recentShippedOrders.forEach(orderId => {
    // Must have creation data
    if (!createdOrderIds.has(orderId)) return;

    // Get all updates for this order, filtered to core stages only
    const coreUpdates = orderUpdates
      .filter(update => update['Order ID'] === orderId && CORE_STAGES.includes(update['Status']))
      .sort((a, b) => new Date(a['Timestamp']) - new Date(b['Timestamp']));

    // Must have at least 2 core stages and reach shipped
    if (coreUpdates.length < 2) return;
    if (!coreUpdates.some(update => update['Status'] === 'shipped')) return;

    completeOrders.push({
      orderId: orderId,
      coreUpdates: coreUpdates
    });
  });

  // Analyze going back behavior (ONLY in core stages)
  let goingBackOrders = 0;
  const totalAnalyzed = completeOrders.length;

  completeOrders.forEach(orderInfo => {
    const coreUpdates = orderInfo.coreUpdates;

    // Track progression through core stages
    let hasGoingBack = false;
    let maxStageReached = 0;

    coreUpdates.forEach(update => {
      const stage = update['Status'];
      const stageNum = CORE_STAGES.indexOf(stage) + 1;

      if (stageNum < maxStageReached) {
        hasGoingBack = true;
      }

      maxStageReached = Math.max(maxStageReached, stageNum);
    });

    if (hasGoingBack) {
      goingBackOrders++;
    }
  });

  const goingBackRate = totalAnalyzed > 0 ? (goingBackOrders / totalAnalyzed * 100) : 0;

  return {
    goingBackRate: goingBackRate,
    totalOrders: totalAnalyzed,
    ordersWithGoingBack: goingBackOrders
  };
}

/**
 * Calculate Order Flow KPIs using clean core business flow
 */
function calculateOrderFlowKPIs(data, timePeriod) {
  // Use the clean core flow logic instead of the old noisy one
  const coreFlowData = calculateCoreOrderStageFlow(data, timePeriod);

  const result = {
    goingBackRate: {
      value: coreFlowData.goingBackRate,
      label: 'Core Flow Going Back Rate',
      formatted: `${coreFlowData.goingBackRate.toFixed(2)}%`,
      sampleSize: coreFlowData.totalOrders,
      trend: null
    },
    totalOrdersAnalyzed: {
      value: coreFlowData.totalOrders,
      label: 'Total Orders Analyzed (Core Flow)',
      formatted: `${coreFlowData.totalOrders}`,
      sampleSize: coreFlowData.totalOrders,
      trend: null
    }
  };

  // Note: Stage timing metrics are calculated separately in Operations KPIs

  return result;
}

/**
 * Calculate Clinical & Patient Success KPIs
 */
function calculateClinicalKPIs(data, timePeriod) {
  // Medication Adherence (% of patients staying on therapy > 90 days)
  const adherenceData = calculateMedicationAdherence(data);

  return {
    medicationAdherence: {
      value: adherenceData.adherenceRate,
      label: 'Medication Adherence (90+ days)',
      formatted: `${adherenceData.adherenceRate.toFixed(2)}%`,
      sampleSize: adherenceData.totalPatients,
      adherentPatients: adherenceData.adherentPatients,
      trend: null
    }
  };
}

/**
 * Calculate summary metrics for dashboard overview
 */
function calculateSummaryMetrics(data) {
  return {
    totalCustomers: data.customers.length,
    totalOrders: data.orders.length,
    totalRevenue: data.payments.reduce((sum, payment) => sum + (payment.amount || 0), 0),
    activeSubscriptions: data.subscriptions.filter(sub =>
      sub.Status === 'active' || sub.Status === 'trialing'
    ).length
  };
}

/**
 * Helper function to get sheet data with error handling
 */
function getSheetData(spreadsheet, sheetName) {
  try {
    const sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) {
      console.warn(`Sheet '${sheetName}' not found`);
      return [];
    }

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];

    const headers = data[0];
    return data.slice(1).map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index];
      });
      return obj;
    });
  } catch (error) {
    console.error(`Error reading sheet '${sheetName}':`, error.toString());
    return [];
  }
}

/**
 * Calculate Monthly Recurring Revenue
 */
function calculateMRR(data) {
  const activeSubscriptions = data.subscriptions.filter(sub =>
    sub.Status === 'active' || sub.Status === 'trialing'
  );

  let totalMRR = 0;

  activeSubscriptions.forEach(sub => {
    // Get product price from products sheet
    const product = data.products.find(p => p.product_id === sub.ProductID);
    if (product && product.renewal_price) {
      // Use renewal_price for monthly recurring revenue
      totalMRR += parseFloat(product.renewal_price) || 0;
    }
  });

  return totalMRR;
}

/**
 * Calculate Pause Rate
 */
function calculatePauseRate(data, timePeriod) {
  const totalSubscriptions = data.subscriptions.length;
  const pausedSubscriptions = data.paused.length;

  return totalSubscriptions > 0 ? (pausedSubscriptions / totalSubscriptions) * 100 : 0;
}

/**
 * Calculate Churn Rate
 */
function calculateChurnRate(data, timePeriod) {
  const periodStart = getPeriodStart(new Date(), timePeriod);

  const cancelledInPeriod = data.cancelledSubscriptions.filter(cancelled => {
    const cancelDate = new Date(cancelled['Last Updated']);
    return cancelDate >= periodStart;
  }).length;

  const totalSubscriptions = data.subscriptions.length + data.cancelledSubscriptions.length;

  return totalSubscriptions > 0 ? (cancelledInPeriod / totalSubscriptions) * 100 : 0;
}

/**
 * Calculate Renewal Rate
 */
function calculateRenewalRate(data, timePeriod) {
  // This would require subscription renewal data
  // For now, return inverse of churn rate as approximation
  const churnRate = calculateChurnRate(data, timePeriod);
  return 100 - churnRate;
}

/**
 * Calculate Average Subscription Duration
 */
function calculateAvgSubscriptionDuration(data) {
  const now = new Date();
  let totalDuration = 0;
  let count = 0;

  // Active subscriptions
  data.subscriptions.forEach(sub => {
    const startDate = new Date(sub['Datetime Created']);
    const duration = (now - startDate) / (1000 * 60 * 60 * 24 * 30); // months
    if (duration > 0) {
      totalDuration += duration;
      count++;
    }
  });

  // Cancelled subscriptions
  data.cancelledSubscriptions.forEach(cancelled => {
    const startDate = new Date(cancelled['Datetime Created']);
    const endDate = new Date(cancelled['Last Updated']);
    const duration = (endDate - startDate) / (1000 * 60 * 60 * 24 * 30); // months
    if (duration > 0) {
      totalDuration += duration;
      count++;
    }
  });

  return count > 0 ? totalDuration / count : 0;
}

/**
 * Calculate Customer Lifetime Value
 */
function calculateLTV(arpu, churnRate) {
  // LTV = ARPU / Churn Rate (monthly)
  // If churn rate is 0, use a default retention period
  if (churnRate === 0 || churnRate < 0.1) {
    return arpu * 24; // Assume 24 months if very low churn
  }

  const monthlyChurnRate = churnRate / 100;
  return arpu / monthlyChurnRate;
}

/**
 * Calculate Purchase to Prescription Time
 */
function calculatePurchaseToPrescriptionTime(data, timePeriod) {
  let totalHours = 0;
  let count = 0;

  // Use support full log to track prescription processing time
  // This represents time from order creation to when prescription is processed (no longer awaiting_script)
  if (data.supportFullLog && data.supportFullLog.length > 0) {
    const orderTransitions = {};

    // Group support log entries by order number
    data.supportFullLog.forEach(logEntry => {
      const orderNum = logEntry['Order #'];
      if (!orderTransitions[orderNum]) {
        orderTransitions[orderNum] = [];
      }
      orderTransitions[orderNum].push({
        status: logEntry.Status,
        createdDate: new Date(logEntry['Created Date']),
        lastUpdate: new Date(logEntry['Last Update'])
      });
    });

    // Analyze prescription processing time for each order
    Object.keys(orderTransitions).forEach(orderNum => {
      const transitions = orderTransitions[orderNum].sort((a, b) => a.lastUpdate - b.lastUpdate);

      if (transitions.length > 0) {
        const firstEntry = transitions[0]; // Order creation/first entry

        // Find when prescription was completed (moved beyond awaiting_script)
        const scriptCompleted = transitions.find(t =>
          t.status !== 'awaiting_script' && t.status !== 'processing'
        );

        if (scriptCompleted) {
          const hours = (scriptCompleted.lastUpdate - firstEntry.createdDate) / (1000 * 60 * 60);

          // Reasonable prescription processing time: 1-168 hours
          if (hours >= 1 && hours <= 168) {
            totalHours += hours;
            count++;
          }
        }
      }
    });
  }


  return {
    avgHours: count > 0 ? totalHours / count : 24, // Default 24 hours if no data
    sampleSize: count
  };
}

/**
 * Calculate Purchase to Prescription Time - SevenCells Pharmacy Only
 */
function calculatePurchaseToPrescriptionTimeSevenCells(data, timePeriod) {
  let totalHours = 0;
  let count = 0;

  // Filter for SevenCells pharmacy orders only
  if (data.supportFullLog && data.supportFullLog.length > 0) {
    const orderTransitions = {};

    // Group support log entries by order number, filtering for SevenCells
    data.supportFullLog.forEach(logEntry => {
      const pharmacy = logEntry.Pharmacy || '';
      const isSevenCells = pharmacy.toLowerCase().includes('sevencells');

      if (isSevenCells) {
        const orderNum = logEntry['Order #'];
        if (!orderTransitions[orderNum]) {
          orderTransitions[orderNum] = [];
        }
        orderTransitions[orderNum].push({
          status: logEntry.Status,
          createdDate: new Date(logEntry['Created Date']),
          lastUpdate: new Date(logEntry['Last Update']),
          pharmacy: pharmacy
        });
      }
    });

    // Analyze prescription processing time for SevenCells orders
    Object.keys(orderTransitions).forEach(orderNum => {
      const transitions = orderTransitions[orderNum].sort((a, b) => a.lastUpdate - b.lastUpdate);

      if (transitions.length > 0) {
        const firstEntry = transitions[0]; // Order creation/first entry

        // Find when prescription was completed (moved beyond awaiting_script)
        const scriptCompleted = transitions.find(t =>
          t.status !== 'awaiting_script' && t.status !== 'processing'
        );

        if (scriptCompleted) {
          const hours = (scriptCompleted.lastUpdate - firstEntry.createdDate) / (1000 * 60 * 60);

          // Reasonable prescription processing time: 1-168 hours
          if (hours >= 1 && hours <= 168) {
            totalHours += hours;
            count++;
          }
        }
      }
    });
  }

  return {
    avgHours: count > 0 ? totalHours / count : 24, // Default 24 hours if no data
    sampleSize: count
  };
}

/**
 * Calculate Prescription to Shipment Time (Order Creation to Shipment)
 */
function calculatePrescriptionToShipmentTime(data, timePeriod) {
  let totalHours = 0;
  let count = 0;

  // Primary method: Use Customer Support shipped data (this is the complete order lifecycle)
  if (data.shipped && data.shipped.length > 0) {
    data.shipped.forEach(shipment => {
      const orderCreatedTime = new Date(shipment['Created At']); // Order creation
      const shippedTime = new Date(shipment['Updated At']); // When shipped

      if (orderCreatedTime && shippedTime) {
        const hours = (shippedTime - orderCreatedTime) / (1000 * 60 * 60);

        // This represents full order lifecycle: order → prescription → shipment
        if (hours >= 1 && hours <= 168) { // 1 hour to 1 week
          totalHours += hours;
          count++;
        }
      }
    });
  }

  // Additional logic: Use support full log for prescription → shipment transitions
  if (data.supportFullLog && data.supportFullLog.length > 0) {
    // Group by order number to track status transitions
    const orderTransitions = {};

    data.supportFullLog.forEach(logEntry => {
      const orderNum = logEntry['Order #'];
      if (!orderTransitions[orderNum]) {
        orderTransitions[orderNum] = [];
      }
      orderTransitions[orderNum].push({
        status: logEntry.Status,
        timestamp: new Date(logEntry['Last Update'] || logEntry['Created Date'])
      });
    });

    // Analyze transitions from awaiting_script to shipped
    Object.keys(orderTransitions).forEach(orderNum => {
      const transitions = orderTransitions[orderNum].sort((a, b) => a.timestamp - b.timestamp);

      let scriptTime = null;
      let shippedTime = null;

      transitions.forEach(transition => {
        if (transition.status === 'awaiting_script' && !scriptTime) {
          scriptTime = transition.timestamp;
        }
        if (transition.status === 'shipped' && scriptTime) {
          shippedTime = transition.timestamp;
        }
      });

      if (scriptTime && shippedTime) {
        const hours = (shippedTime - scriptTime) / (1000 * 60 * 60);
        if (hours > 0 && hours < 168) { // 1 week max
          totalHours += hours;
          count++;
        }
      }
    });
  }

  return {
    avgHours: count > 0 ? totalHours / count : 48, // Default 48 hours if no data
    sampleSize: count
  };
}

/**
 * Calculate Prescription to Shipment Time - SevenCells Pharmacy Only
 */
function calculatePrescriptionToShipmentTimeSevenCells(data, timePeriod) {
  let totalHours = 0;
  let count = 0;

  // Primary method: Use Customer Support shipped data filtered for SevenCells
  if (data.shipped && data.shipped.length > 0) {
    data.shipped.forEach(shipment => {
      const pharmacy = shipment.Pharmacy || '';
      const isSevenCells = pharmacy.toLowerCase().includes('sevencells');

      if (isSevenCells) {
        const orderCreatedTime = new Date(shipment['Created At']); // Order creation
        const shippedTime = new Date(shipment['Updated At']); // When shipped

        if (orderCreatedTime && shippedTime) {
          const hours = (shippedTime - orderCreatedTime) / (1000 * 60 * 60);

          // This represents full order lifecycle: order → prescription → shipment
          if (hours >= 1 && hours <= 168) { // 1 hour to 1 week
            totalHours += hours;
            count++;
          }
        }
      }
    });
  }

  // Additional logic: Use support full log for SevenCells prescription → shipment transitions
  if (data.supportFullLog && data.supportFullLog.length > 0) {
    // Group by order number to track status transitions for SevenCells only
    const orderTransitions = {};

    data.supportFullLog.forEach(logEntry => {
      const pharmacy = logEntry.Pharmacy || '';
      const isSevenCells = pharmacy.toLowerCase().includes('sevencells');

      if (isSevenCells) {
        const orderNum = logEntry['Order #'];
        if (!orderTransitions[orderNum]) {
          orderTransitions[orderNum] = [];
        }
        orderTransitions[orderNum].push({
          status: logEntry.Status,
          timestamp: new Date(logEntry['Last Update'] || logEntry['Created Date']),
          pharmacy: pharmacy
        });
      }
    });

    // Analyze transitions from awaiting_script to shipped for SevenCells
    Object.keys(orderTransitions).forEach(orderNum => {
      const transitions = orderTransitions[orderNum].sort((a, b) => a.timestamp - b.timestamp);

      let scriptTime = null;
      let shippedTime = null;

      transitions.forEach(transition => {
        if (transition.status === 'awaiting_script' && !scriptTime) {
          scriptTime = transition.timestamp;
        }
        if (transition.status === 'shipped' && scriptTime) {
          shippedTime = transition.timestamp;
        }
      });

      if (scriptTime && shippedTime) {
        const hours = (shippedTime - scriptTime) / (1000 * 60 * 60);
        if (hours > 0 && hours < 168) { // 1 week max
          totalHours += hours;
          count++;
        }
      }
    });
  }

  return {
    avgHours: count > 0 ? totalHours / count : 48, // Default 48 hours if no data
    sampleSize: count
  };
}

/**
 * Calculate Medication Adherence
 */
function calculateMedicationAdherence(data) {
  // Use subscription data to calculate adherence (how long customers stay subscribed)
  const now = new Date();
  let eligibleSubscriptions = 0;
  let adherentSubscriptions = 0;

  // Check active subscriptions that are 90+ days old
  if (data.subscriptions && data.subscriptions.length > 0) {
    data.subscriptions.forEach(subscription => {
      const createdDate = new Date(subscription['Datetime Created']);
      const daysSinceCreated = (now - createdDate) / (1000 * 60 * 60 * 24);

      // Only consider subscriptions that are 90+ days old
      if (daysSinceCreated >= 90) {
        eligibleSubscriptions++;

        // If subscription is still active, they are adherent
        if (subscription.Status === 'active') {
          adherentSubscriptions++;
        }
      }
    });
  }

  // Also check cancelled subscriptions that were active for 90+ days
  if (data.cancelledSubscriptions && data.cancelledSubscriptions.length > 0) {
    data.cancelledSubscriptions.forEach(subscription => {
      const createdDate = new Date(subscription['Datetime Created']);
      const lastUpdated = new Date(subscription['Last Updated']);
      const daysActive = (lastUpdated - createdDate) / (1000 * 60 * 60 * 24);

      // If they stayed subscribed for 90+ days before cancelling, count as adherent
      if (daysActive >= 90) {
        eligibleSubscriptions++;
        adherentSubscriptions++;
      }
    });
  }

  const adherenceRate = eligibleSubscriptions > 0 ? (adherentSubscriptions / eligibleSubscriptions) * 100 : 0;

  console.log(`Medication adherence: ${adherentSubscriptions}/${eligibleSubscriptions} subscriptions stayed active 90+ days (${adherenceRate.toFixed(2)}%)`);

  return {
    adherenceRate: adherenceRate,
    adherentPatients: adherentSubscriptions,
    totalPatients: eligibleSubscriptions
  };
}

/**
 * Get period start date based on time period
 */
function getPeriodStart(now, timePeriod) {
  const start = new Date(now);

  // Handle custom range objects or non-string periods
  if (typeof timePeriod !== 'string') {
    // For custom ranges or invalid periods, default to monthly
    start.setMonth(start.getMonth() - 1);
    return start;
  }

  switch (timePeriod.toLowerCase()) {
    case 'daily':
      start.setHours(0, 0, 0, 0);
      break;
    case 'weekly':
      start.setDate(start.getDate() - 7);
      break;
    case 'monthly':
      start.setMonth(start.getMonth() - 1);
      break;
    case 'quarterly':
      start.setMonth(start.getMonth() - 3);
      break;
    case 'annually':
      start.setFullYear(start.getFullYear() - 1);
      break;
    default:
      start.setMonth(start.getMonth() - 1); // Default to monthly
  }

  return start;
}

/**
 * Calculate trend for a metric (placeholder)
 */
function calculateTrend(data, dateField, timePeriod) {
  // This would require historical comparison
  // For now, return null as placeholder
  return null;
}

/**
 * Get available time periods for the dashboard
 */
function getTimePeriods() {
  return [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'annually', label: 'Annually' }
  ];
}

/**
 * Test corrected timing calculations with Customer Support data
 */
function testCorrectedTimingCalculations() {
  console.log('=== TESTING CORRECTED TIMING CALCULATIONS ===');

  try {
    // Get all data
    const data = getAllKPIData();

    console.log(`\n--- Available Data Sources ---`);
    console.log(`Orders: ${data.orders ? data.orders.length : 0} records`);
    console.log(`Shipped: ${data.shipped ? data.shipped.length : 0} records`);
    console.log(`Support Full Log: ${data.supportFullLog ? data.supportFullLog.length : 0} records`);

    // Test support log status analysis
    if (data.supportFullLog && data.supportFullLog.length > 0) {
      console.log(`\n--- Support Log Status Analysis ---`);

      // Get unique statuses
      const statuses = [...new Set(data.supportFullLog.map(log => log.Status))];
      console.log(`Available statuses: ${statuses.join(', ')}`);

      // Group by order number and analyze transitions
      const orderTransitions = {};
      data.supportFullLog.forEach(logEntry => {
        const orderNum = logEntry['Order #'];
        if (!orderTransitions[orderNum]) {
          orderTransitions[orderNum] = [];
        }
        orderTransitions[orderNum].push({
          status: logEntry.Status,
          createdDate: new Date(logEntry['Created Date']),
          lastUpdate: new Date(logEntry['Last Update'])
        });
      });

      // Analyze first 3 orders
      const orderNumbers = Object.keys(orderTransitions).slice(0, 3);
      orderNumbers.forEach(orderNum => {
        const transitions = orderTransitions[orderNum].sort((a, b) => a.lastUpdate - b.lastUpdate);
        console.log(`\n📋 Order ${orderNum}:`);
        transitions.forEach((t, index) => {
          console.log(`   ${index + 1}. ${t.status} - ${t.createdDate.toISOString()} → ${t.lastUpdate.toISOString()}`);
        });

        if (transitions.length > 1) {
          const hours = (transitions[transitions.length - 1].lastUpdate - transitions[0].createdDate) / (1000 * 60 * 60);
          console.log(`   Total processing time: ${hours.toFixed(1)} hours`);
        }
      });
    }

    // Test timing calculations
    console.log(`\n--- Timing Calculation Tests ---`);

    const purchaseResult = calculatePurchaseToPrescriptionTime(data, 'monthly');
    console.log(`Purchase → Prescription (All): ${purchaseResult.avgHours.toFixed(1)} hours (${purchaseResult.sampleSize} samples)`);

    const purchaseSevenCellsResult = calculatePurchaseToPrescriptionTimeSevenCells(data, 'monthly');
    console.log(`Purchase → Prescription (SevenCells): ${purchaseSevenCellsResult.avgHours.toFixed(1)} hours (${purchaseSevenCellsResult.sampleSize} samples)`);

    const shipmentResult = calculatePrescriptionToShipmentTime(data, 'monthly');
    console.log(`Prescription → Shipment (All): ${shipmentResult.avgHours.toFixed(1)} hours (${shipmentResult.sampleSize} samples)`);

    const shipmentSevenCellsResult = calculatePrescriptionToShipmentTimeSevenCells(data, 'monthly');
    console.log(`Prescription → Shipment (SevenCells): ${shipmentSevenCellsResult.avgHours.toFixed(1)} hours (${shipmentSevenCellsResult.sampleSize} samples)`);

    // Sample shipped orders for verification
    if (data.shipped && data.shipped.length > 0) {
      console.log(`\n--- Sample Shipped Orders ---`);
      data.shipped.slice(0, 3).forEach(shipped => {
        const createdTime = new Date(shipped['Created At']);
        const updatedTime = new Date(shipped['Updated At']);
        const hours = (updatedTime - createdTime) / (1000 * 60 * 60);

        console.log(`Order ${shipped['Order ID']}: ${createdTime.toISOString()} → ${updatedTime.toISOString()} (${hours.toFixed(1)} hours)`);
      });
    }

    console.log('\n=== TIMING TEST COMPLETED ===');

  } catch (error) {
    console.error('Error in timing test:', error.toString());
  }
}

/**
 * CLEAN CORE ORDER FLOW TEST
 * Tests only the 4 core business stages: awaiting_requirements → awaiting_script → awaiting_shipment → shipped
 * Going back means moving backwards in this sequence (e.g., awaiting_shipment → awaiting_requirements)
 */
function runCoreOrderFlowTest() {
  console.log('=== CORE ORDER FLOW TEST (CLEAN) ===');

  try {
    // Load data
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const carePortalsSs = SpreadsheetApp.openById(CAREPORTALS_ORDERS_SPREADSHEET_ID);

    const ordersCreated = getSheetData(ss, 'order.created');
    const orderUpdates = getSheetData(carePortalsSs, 'order.updated');

    console.log(`✓ Loaded ${ordersCreated.length} orders from Database_CarePortals`);
    console.log(`✓ Loaded ${orderUpdates.length} order updates from CarePortals_Orders`);

    // CORE BUSINESS FLOW - ONLY THESE 4 STAGES MATTER
    const CORE_STAGES = [
      'awaiting_requirements',  // Stage 1
      'awaiting_script',        // Stage 2
      'awaiting_shipment',      // Stage 3
      'shipped'                 // Stage 4 (final)
    ];

    console.log(`Core business stages: ${CORE_STAGES.join(' → ')}`);

    // Filter for recent shipped orders (last 60 days)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 60);

    const recentShippedOrders = [];
    orderUpdates.forEach(update => {
      const orderId = update['Order ID'];
      const status = update['Status'];
      const timestamp = new Date(update['Timestamp']);

      if (status === 'shipped' && timestamp >= cutoffDate) {
        if (!recentShippedOrders.includes(orderId)) {
          recentShippedOrders.push(orderId);
        }
      }
    });

    console.log(`Recent shipped orders (last 60 days): ${recentShippedOrders.length}`);

    // Create order creation lookup
    const createdOrderIds = new Set();
    const creationDates = {};
    ordersCreated.forEach(order => {
      if (order.order_id) {
        createdOrderIds.add(order.order_id);
        creationDates[order.order_id] = new Date(order.created_at);
      }
    });

    // Find orders with complete core flow
    const completeOrders = [];

    recentShippedOrders.forEach(orderId => {
      // Must have creation data
      if (!createdOrderIds.has(orderId)) return;

      // Get all updates for this order, filtered to core stages only
      const coreUpdates = orderUpdates
        .filter(update => update['Order ID'] === orderId && CORE_STAGES.includes(update['Status']))
        .sort((a, b) => new Date(a['Timestamp']) - new Date(b['Timestamp']));

      // Must have at least 2 core stages and reach shipped
      if (coreUpdates.length < 2) return;
      if (!coreUpdates.some(update => update['Status'] === 'shipped')) return;

      completeOrders.push({
        orderId: orderId,
        creationDate: creationDates[orderId],
        coreUpdates: coreUpdates
      });
    });

    console.log(`Orders with complete core flow: ${completeOrders.length}`);

    // Analyze going back behavior (ONLY in core stages)
    let goingBackOrders = 0;
    const totalAnalyzed = completeOrders.length;

    console.log(`\\n=== CORE FLOW ANALYSIS (Sample Orders) ===`);

    completeOrders.slice(0, 10).forEach(orderInfo => {
      const orderId = orderInfo.orderId;
      const coreUpdates = orderInfo.coreUpdates;

      console.log(`\\nOrder ${orderId}:`);
      console.log(`  Created: ${orderInfo.creationDate}`);
      console.log(`  Core progression:`);

      // Track progression through core stages
      let hasGoingBack = false;
      let maxStageReached = 0;

      coreUpdates.forEach(update => {
        const stage = update['Status'];
        const timestamp = new Date(update['Timestamp']);
        const stageNum = CORE_STAGES.indexOf(stage) + 1;

        let direction = '';
        if (stageNum < maxStageReached) {
          hasGoingBack = true;
          direction = ' ← GOING BACK';
        } else if (stageNum > maxStageReached) {
          direction = ' → FORWARD';
        }

        maxStageReached = Math.max(maxStageReached, stageNum);
        console.log(`    ${stageNum}. ${stage} at ${timestamp} ${direction}`);
      });

      if (hasGoingBack) {
        goingBackOrders++;
        console.log(`  *** ORDER WENT BACK IN CORE FLOW ***`);
      }
    });

    // Calculate final metrics
    const goingBackRate = totalAnalyzed > 0 ? (goingBackOrders / totalAnalyzed * 100) : 0;

    console.log(`\\n=== FINAL CORE FLOW METRICS ===`);
    console.log(`Total orders analyzed: ${totalAnalyzed}`);
    console.log(`Orders that went back in core flow: ${goingBackOrders}`);
    console.log(`Core flow going back rate: ${goingBackRate.toFixed(2)}%`);

    return {
      success: true,
      totalOrders: totalAnalyzed,
      goingBackOrders: goingBackOrders,
      goingBackRate: goingBackRate,
      completeOrders: completeOrders.length
    };

  } catch (error) {
    console.error('Error in core order flow test:', error.toString());
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * COMPREHENSIVE ORDER TRACKING TEST FUNCTION
 * Tests inter-spreadsheet order tracking and flow analysis
 * Run this function to validate order linkage and timing calculations
 */
function runOrderTrackingDataTest() {
  console.log('=== Starting Order Tracking Data Test ===');

  try {
    // Test database connections
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const supportSs = SpreadsheetApp.openById(CUSTOMER_SUPPORT_SPREADSHEET_ID);
    const carePortalsSs = SpreadsheetApp.openById(CAREPORTALS_ORDERS_SPREADSHEET_ID);

    console.log('✓ All database connections established');

    // Load order data from Database_CarePortals.xlsx
    const ordersCreated = getSheetData(ss, 'order.created');
    console.log(`✓ Loaded ${ordersCreated.length} orders from Database_CarePortals order.created`);

    // Load order updates from CarePortals_Orders.xlsx
    const orderUpdates = getSheetData(carePortalsSs, 'order.updated');
    console.log(`✓ Loaded ${orderUpdates.length} order updates from CarePortals_Orders order.updated`);

    // Test order ID linkage
    const orderCreatedMap = {};
    ordersCreated.forEach(order => {
      if (order.order_id && order.created_at) {
        orderCreatedMap[order.order_id] = order.created_at;
      }
    });

    const orderUpdatesByOrderId = {};
    let matchedOrders = 0;
    let unmatchedUpdates = 0;

    orderUpdates.forEach(update => {
      const orderId = update['Order ID'];
      if (orderId) {
        if (!orderUpdatesByOrderId[orderId]) {
          orderUpdatesByOrderId[orderId] = [];
        }
        orderUpdatesByOrderId[orderId].push(update);

        if (orderCreatedMap[orderId]) {
          matchedOrders++;
        } else {
          unmatchedUpdates++;
        }
      }
    });

    const uniqueOrdersInUpdates = Object.keys(orderUpdatesByOrderId).length;
    const uniqueOrdersInCreated = Object.keys(orderCreatedMap).length;

    console.log(`\n=== ORDER LINKAGE ANALYSIS ===`);
    console.log(`Orders in Database_CarePortals.order.created: ${uniqueOrdersInCreated}`);
    console.log(`Unique orders in CarePortals_Orders.order.updated: ${uniqueOrdersInUpdates}`);
    console.log(`Matched order updates (have order.created): ${matchedOrders}`);
    console.log(`Unmatched order updates (no order.created): ${unmatchedUpdates}`);

    // Analyze order statuses
    const statusCounts = {};
    orderUpdates.forEach(update => {
      const status = update['Status'];
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    console.log(`\n=== ORDER STATUS DISTRIBUTION ===`);
    Object.entries(statusCounts).sort((a, b) => b[1] - a[1]).forEach(([status, count]) => {
      console.log(`${status}: ${count}`);
    });

    // Test stage timing calculation with sample orders
    const sampleOrderIds = Object.keys(orderUpdatesByOrderId).slice(0, 5);
    console.log(`\n=== SAMPLE ORDER ANALYSIS (First 5 orders) ===`);

    sampleOrderIds.forEach(orderId => {
      const updates = orderUpdatesByOrderId[orderId].sort((a, b) =>
        new Date(a['Timestamp']) - new Date(b['Timestamp'])
      );

      console.log(`\nOrder ID ${orderId}:`);
      console.log(`  Created: ${orderCreatedMap[orderId] || 'NOT FOUND'}`);
      console.log(`  Updates (${updates.length}):`);

      updates.forEach((update, index) => {
        console.log(`    ${index + 1}. ${update['Status']} at ${update['Timestamp']}`);
      });
    });

    // Test the actual KPI calculation functions with filtering
    console.log(`\n=== TESTING ORDER FLOW CALCULATIONS (FILTERED) ===`);

    const testData = {
      orders: ordersCreated,
      orderUpdated: orderUpdates
    };

    // Show filtering in action
    const qualifyingOrders = getRecentShippedOrdersWithCompleteData(orderUpdates, ordersCreated);
    console.log(`\nFiltering Results:`);
    console.log(`  Total orders in updates: ${uniqueOrdersInUpdates}`);
    console.log(`  Recent shipped orders with complete data: ${qualifyingOrders.length}`);
    console.log(`  Data quality improvement: ${((qualifyingOrders.length / uniqueOrdersInUpdates) * 100).toFixed(1)}% of orders have complete tracking`);

    const orderFlowResults = calculateOrderStageFlow(testData, 'monthly');
    console.log(`\nOrder Flow Results (Filtered):`);
    console.log(`  Total Orders Analyzed: ${orderFlowResults.totalOrders}`);
    console.log(`  Orders with Going Back: ${orderFlowResults.ordersWithGoingBack}`);
    console.log(`  Going Back Rate: ${orderFlowResults.goingBackRate.toFixed(2)}%`);

    const stageTimingResults = calculateStageTimings(testData, 'monthly');
    console.log(`\nStage Timing Results (Filtered):`);
    Object.entries(stageTimingResults).forEach(([stage, data]) => {
      console.log(`  ${stage}: ${data.avgHours.toFixed(2)} hours (${data.sampleSize} samples)`);
    });

    console.log('\n=== Order Tracking Test Completed Successfully ===');
    return {
      success: true,
      ordersCreated: uniqueOrdersInCreated,
      orderUpdates: orderUpdates.length,
      uniqueOrdersInUpdates: uniqueOrdersInUpdates,
      matchedOrders: matchedOrders,
      orderFlowResults: orderFlowResults,
      stageTimingResults: stageTimingResults
    };

  } catch (error) {
    console.error('Error in order tracking test:', error.toString());
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * COMPREHENSIVE TEST FUNCTION
 * Tests all data extraction and KPI calculations
 * Run this function to debug and validate data
 */
function runComprehensiveDataTest() {
  console.log('=== COMPREHENSIVE KPI DATA TEST ===');
  console.log('Starting comprehensive data extraction and calculation test...');

  try {
    // Get raw data
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    console.log('\n=== 1. SPREADSHEET CONNECTION ===');
    console.log(`Spreadsheet ID: ${SPREADSHEET_ID}`);
    console.log(`Spreadsheet name: ${ss.getName()}`);

    // Test each sheet
    const expectedSheets = [
      'subscription.active',
      'customers',
      'order.created',
      'products',
      'payment_succesful',
      'order.cancelled',
      'subscription.paused',
      'subscription.cancelled'
    ];

    console.log('\n=== 2. SHEET AVAILABILITY TEST ===');
    expectedSheets.forEach(sheetName => {
      const sheet = ss.getSheetByName(sheetName);
      if (sheet) {
        const rowCount = sheet.getLastRow();
        console.log(`✅ ${sheetName}: ${rowCount} rows`);
      } else {
        console.log(`❌ ${sheetName}: NOT FOUND`);
      }
    });

    // Extract data from multiple spreadsheets
    console.log('\n=== 3. DATA EXTRACTION TEST ===');

    // Test Customer Support spreadsheet access
    console.log('Testing Customer Support spreadsheet access...');
    const supportSs = SpreadsheetApp.openById(CUSTOMER_SUPPORT_SPREADSHEET_ID);
    console.log(`Customer Support spreadsheet: ${supportSs.getName()}`);

    const data = {
      // Main database data
      subscriptions: getSheetData(ss, 'subscription.active'),
      customers: getSheetData(ss, 'customers'),
      orders: getSheetData(ss, 'order.created'),
      products: getSheetData(ss, 'products'),
      payments: getSheetData(ss, 'payment_succesful'),
      cancelled: getSheetData(ss, 'order.cancelled'),
      paused: getSheetData(ss, 'subscription.paused'),
      cancelledSubscriptions: getSheetData(ss, 'subscription.cancelled'),
      addresses: getSheetData(ss, 'addresses'),
      refunds: getSheetData(ss, 'refund.created'),

      // Customer support data
      shipped: getSheetData(supportSs, 'shipped'),
      awaitingShipment: getSheetData(supportSs, 'awaiting_shipment'),
      awaitingScript: getSheetData(supportSs, 'awaiting_script'),
      processing: getSheetData(supportSs, 'processing'),
      supportFullLog: getSheetData(supportSs, 'full_log')
    };

    // Report data extraction results
    Object.keys(data).forEach(key => {
      const records = data[key];
      console.log(`${key}: ${records.length} records`);
      if (records.length > 0) {
        console.log(`  Sample columns: ${Object.keys(records[0]).slice(0, 5).join(', ')}`);
        console.log(`  All columns: ${Object.keys(records[0]).join(', ')}`);
      }
    });

    console.log('\n=== 4. ACTIVE SUBSCRIPTIONS ANALYSIS ===');
    console.log(`Total active subscriptions: ${data.subscriptions.length}`);
    if (data.subscriptions.length > 0) {
      const statuses = {};
      data.subscriptions.forEach(sub => {
        const status = sub.Status || 'undefined';
        statuses[status] = (statuses[status] || 0) + 1;
      });
      console.log('Status breakdown:', statuses);

      // Sample subscription
      console.log('Sample subscription record:');
      console.log(JSON.stringify(data.subscriptions[0], null, 2));
    }

    console.log('\n=== 5. PRODUCTS ANALYSIS ===');
    console.log(`Total products: ${data.products.length}`);
    if (data.products.length > 0) {
      console.log('Product pricing:');
      data.products.forEach(product => {
        console.log(`  ${product.Short_name}: Sale: $${product.sale_price}, Renewal: $${product.renewal_price}`);
      });
    }

    console.log('\n=== 6. CUSTOMERS ANALYSIS ===');
    console.log(`Total customers: ${data.customers.length}`);
    if (data.customers.length > 0) {
      console.log('Sample customer record:');
      console.log(JSON.stringify(data.customers[0], null, 2));
    }

    console.log('\n=== 7. PAYMENT DATA ANALYSIS ===');
    console.log(`Total payments: ${data.payments.length}`);
    if (data.payments.length > 0) {
      const totalRevenue = data.payments.reduce((sum, payment) => {
        return sum + (parseFloat(payment.amount) || 0);
      }, 0);
      console.log(`Total payment amount: $${totalRevenue}`);
      console.log('Sample payment record:');
      console.log(JSON.stringify(data.payments[0], null, 2));
    }

    console.log('\n=== 8. SUBSCRIPTION STATUS ANALYSIS ===');

    // Active subscriptions count
    const activeCount = data.subscriptions.filter(sub =>
      sub.Status === 'active' || sub.Status === 'trialing'
    ).length;
    console.log(`Active/Trialing subscriptions: ${activeCount}`);

    // Paused subscriptions
    console.log(`Paused subscriptions: ${data.paused.length}`);

    // Cancelled subscriptions
    console.log(`Cancelled subscriptions: ${data.cancelledSubscriptions.length}`);

    console.log('\n=== 9. MRR CALCULATION TEST ===');
    const activeSubscriptions = data.subscriptions.filter(sub =>
      sub.Status === 'active' || sub.Status === 'trialing'
    );

    let mrrTotal = 0;
    let mrrDetails = [];

    activeSubscriptions.forEach(sub => {
      const product = data.products.find(p => p.product_id === sub.ProductID);
      if (product && product.renewal_price) {
        const price = parseFloat(product.renewal_price);
        mrrTotal += price;
        mrrDetails.push({
          productName: product.Short_name,
          price: price,
          subscriptionId: sub.SubscriptionID
        });
      }
    });

    console.log(`Calculated MRR: $${mrrTotal}`);
    console.log(`ARPU: $${activeCount > 0 ? (mrrTotal / activeCount).toFixed(2) : 0}`);
    console.log('MRR breakdown by product:');
    const productRevenue = {};
    mrrDetails.forEach(detail => {
      productRevenue[detail.productName] = (productRevenue[detail.productName] || 0) + detail.price;
    });
    Object.keys(productRevenue).forEach(productName => {
      console.log(`  ${productName}: $${productRevenue[productName]}`);
    });

    console.log('\n=== 10. CHURN ANALYSIS ===');
    const now = new Date();
    const monthAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

    const recentCancellations = data.cancelledSubscriptions.filter(sub => {
      const cancelDate = new Date(sub['Last Updated']);
      return cancelDate >= monthAgo;
    });

    console.log(`Cancellations in last 30 days: ${recentCancellations.length}`);
    const totalSubs = data.subscriptions.length + data.cancelledSubscriptions.length;
    const churnRate = totalSubs > 0 ? (recentCancellations.length / totalSubs * 100) : 0;
    console.log(`Monthly churn rate: ${churnRate.toFixed(2)}%`);

    console.log('\n=== 11. ADHERENCE ANALYSIS ===');
    const ninetyDaysAgo = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
    const allSubs = [...data.subscriptions, ...data.cancelledSubscriptions];

    const oldEnoughSubs = allSubs.filter(sub => {
      const startDate = new Date(sub['Datetime Created']);
      return startDate <= ninetyDaysAgo;
    });

    const stillActiveSubs = oldEnoughSubs.filter(sub =>
      sub.Status === 'active' || sub.Status === 'trialing'
    );

    console.log(`Subscriptions 90+ days old: ${oldEnoughSubs.length}`);
    console.log(`Still active after 90+ days: ${stillActiveSubs.length}`);
    const adherenceRate = oldEnoughSubs.length > 0 ? (stillActiveSubs.length / oldEnoughSubs.length * 100) : 0;
    console.log(`90-day adherence rate: ${adherenceRate.toFixed(2)}%`);

    console.log('\n=== 12. OPERATIONS TIMING TEST ===');
    console.log('Checking timing data from multiple sources...');

    // Check Customer Support timing data
    console.log('\n--- Customer Support Timing Data ---');
    console.log(`Shipped orders: ${data.shipped.length}`);
    console.log(`Awaiting shipment: ${data.awaitingShipment.length}`);
    console.log(`Awaiting script: ${data.awaitingScript.length}`);
    console.log(`Support full log: ${data.supportFullLog.length}`);

    if (data.shipped.length > 0) {
      console.log('Sample shipped order:');
      console.log(JSON.stringify(data.shipped[0], null, 2));

      // Calculate sample timing
      const sampleShipped = data.shipped[0];
      if (sampleShipped['Created At'] && sampleShipped['Updated At']) {
        const createdTime = new Date(sampleShipped['Created At']);
        const shippedTime = new Date(sampleShipped['Updated At']);
        const hours = (shippedTime - createdTime) / (1000 * 60 * 60);
        console.log(`Sample timing: ${hours.toFixed(1)} hours from created to shipped`);
      }
    }

    // Test actual timing calculations
    console.log('\n--- Testing Timing Calculations ---');
    const purchaseToScript = calculatePurchaseToPrescriptionTime(data, 'monthly');
    const scriptToShipment = calculatePrescriptionToShipmentTime(data, 'monthly');

    console.log(`Purchase → Prescription: ${purchaseToScript.avgHours.toFixed(1)} hours (sample: ${purchaseToScript.sampleSize})`);
    console.log(`Prescription → Shipment: ${scriptToShipment.avgHours.toFixed(1)} hours (sample: ${scriptToShipment.sampleSize})`);

    // Check original order fields
    if (data.orders.length > 0) {
      const sampleOrder = data.orders[0];
      console.log('\nOriginal order fields:', Object.keys(sampleOrder));

      // Check available timing fields
      console.log('\nTiming data availability:');
      console.log(`✅ Order created_at: AVAILABLE (${data.orders.length} orders)`);
      console.log(`✅ Customer Support shipped data: AVAILABLE (${data.shipped ? data.shipped.length : 0} shipped orders)`);
      console.log(`✅ Support full log: AVAILABLE (${data.supportFullLog ? data.supportFullLog.length : 0} status transitions)`);

      // Note: We use Customer Support data for timing instead of order-level fields
      console.log('\n📝 Timing calculations use Customer Support spreadsheet data:');
      console.log('   • Intake → Processing: Order creation to Customer Support tracking');
      console.log('   • Processing → Shipment: Customer Support "Created At" to "Updated At"');
    }

    console.log('\n=== 13. FINAL KPI CALCULATION TEST ===');
    const kpis = calculateKPIs('monthly');

    console.log('Calculated KPIs:');
    console.log(`Active Patients: ${kpis.growthRevenue?.activePatients?.value || 'ERROR'}`);
    console.log(`MRR: $${kpis.growthRevenue?.mrr?.value || 'ERROR'}`);
    console.log(`ARPU: $${kpis.growthRevenue?.arpu?.value || 'ERROR'}`);
    console.log(`Churn Rate: ${kpis.growthRevenue?.churnRate?.value || 'ERROR'}%`);
    console.log(`LTV: $${kpis.growthRevenue?.ltv?.value || 'ERROR'}`);
    console.log(`New Enrollments: ${kpis.growthRevenue?.newEnrollments?.value || 'ERROR'}`);
    const adherenceValue = kpis.clinical?.medicationAdherence?.value;
    const adherenceFormatted = adherenceValue !== undefined ? `${adherenceValue.toFixed(2)}%` : 'Not enough data (need 90+ day customers)';
    console.log(`Adherence Rate: ${adherenceFormatted}`);

    console.log('\n=== TEST COMPLETED SUCCESSFULLY ===');

    return {
      success: true,
      dataStatus: {
        subscriptions: data.subscriptions.length,
        customers: data.customers.length,
        orders: data.orders.length,
        products: data.products.length,
        payments: data.payments.length
      },
      kpiResults: kpis
    };

  } catch (error) {
    console.error('=== TEST FAILED ===');
    console.error('Error:', error.toString());
    console.error('Stack:', error.stack);

    return {
      success: false,
      error: error.toString(),
      stack: error.stack
    };
  }
}