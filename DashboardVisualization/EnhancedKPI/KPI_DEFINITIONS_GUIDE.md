# Healthcare KPI Dashboard - Complete Definitions Guide

**Document Version:** 1.0
**Last Updated:** 2025-10-22
**Data Source:** Database_CarePortals.xlsx
**Dashboard URL:** https://script.google.com/a/macros/cmwlvirtual.com/s/AKfycbw7pUMTMbSMdwnot8NpC8W7H3UzFvjDwl6_Rx03oYyyFubFGYowKmpg_deRtmnDght-5A/exec

---

## Table of Contents

1. [Summary Statistics](#summary-statistics)
2. [Snapshot Metrics (Time-Independent)](#snapshot-metrics)
3. [Timed Metrics (Date Range Sensitive)](#timed-metrics)
4. [Data Quality Indicators](#data-quality-indicators)

---

## Summary Statistics

These high-level metrics appear at the top of the dashboard and provide quick insights into the business.

### 1. Total Customers
**What it is:** The total number of unique customers in the system.

**What it means:** Represents the complete customer base that has ever interacted with the business.

**How it's calculated:**
```javascript
data.customers.length
```

**Data Source:** `customers` sheet

**Quality Indicator:** Good if > 10 customers

---

### 2. Active Subscriptions
**What it is:** The count of currently active subscription records.

**What it means:** Indicates the number of subscriptions that are currently generating recurring revenue.

**How it's calculated:**
```javascript
data.subscriptions.filter(s => s.Status === 'active').length
```

**Data Source:** `subscription.active` sheet

**Filter Criteria:** `Status = 'active'`

**Quality Indicator:** Higher is better; indicates healthy recurring revenue base

---

### 3. Total Orders
**What it is:** The cumulative count of all orders ever placed.

**What it means:** Represents the total transaction volume across all time.

**How it's calculated:**
```javascript
data.orders.length
```

**Data Source:** `order.created` sheet

**Quality Indicator:** Good if > 10 orders

---

### 4. Total Revenue
**What it is:** The sum of all successful payments.

**What it means:** Gross revenue generated before refunds.

**How it's calculated:**
```javascript
data.payments.reduce((sum, payment) => {
  return sum + (parseFloat(payment.amount) || 0);
}, 0)
```

**Data Source:** `payment_succesful` sheet

**Formula:** Sum(payment.amount) for all payments

**Display Format:** Currency (USD) with comma separators

---

## Snapshot Metrics (Time-Independent)

These metrics represent the current state of the business and are not filtered by date range.

### 5. Active Patients
**Section:** Clinical & Patient Success

**What it is:** Count of subscriptions with active status.

**What it means:** Number of patients currently enrolled in treatment programs.

**How it's calculated:**
```javascript
data.subscriptions.filter(s => s.Status === 'active').length
```

**Data Source:** `subscription.active` sheet

**Filter:** `Status = 'active'`

**Quality Indicator:** 'good' quality

**Clinical Significance:** Represents active patient census

---

### 6. Realized CLV (All Customers)
**Section:** Growth & Revenue Metrics

**What it is:** Average total revenue generated per customer across all customers.

**What it means:** Historical customer value based on actual transactions, not predictions.

**How it's calculated:**
```javascript
// Step 1: Group orders by customer and sum revenue
const customers = {};
data.orders.forEach(order => {
  const customerId = order.customer_id;
  if (!customerId) return;

  const amount = parseFloat(order.total_amount) || 0;
  if (!customers[customerId]) {
    customers[customerId] = { totalRevenue: 0 };
  }
  customers[customerId].totalRevenue += amount;
});

// Step 2: Calculate average
let totalRevenue = 0;
let customerCount = 0;

Object.keys(customers).forEach(customerId => {
  totalRevenue += customers[customerId].totalRevenue;
  customerCount++;
});

const realizedCLV_all = customerCount > 0 ? totalRevenue / customerCount : 0;
```

**Formula:** `Sum(order.total_amount per customer) / Total Customers`

**Data Sources:**
- `order.created` sheet (order.total_amount, customer_id)

**Methodology:** Sum of all order amounts per customer, averaged across all customers

**Quality Indicator:** 'good' quality when sufficient data exists

**Business Significance:** Shows actual revenue per customer relationship

---

### 7. Realized CLV (Mature Customers)
**Section:** Growth & Revenue Metrics

**What it is:** Average total revenue per customer who has completed their initial prepaid period or cancelled.

**What it means:** More accurate CLV metric focusing only on customers who have had time to demonstrate their full lifecycle value.

**How it's calculated:**
```javascript
// Determine mature customers
// A customer is "mature" if:
// 1. They have cancelled (in subscription.cancelled sheet), OR
// 2. Number of orders > sale_cycle_duration, OR
// 3. Number of orders = sale_cycle_duration AND 1+ months since last order

const isMature = (customerId, numOrders, lastOrderDate, productId) => {
  const hasCancelled = data.cancelledSubs.some(sub => sub.customer_id === customerId);
  const hasPaused = data.pausedSubs.some(sub => sub.customer_id === customerId);

  const duration = productDuration[productId] || 1; // from product.sale_cycle_duration
  const monthsSinceLast = (today - lastOrderDate) / (1000 * 60 * 60 * 24 * 30);

  if (hasCancelled) return true;
  if (hasPaused) return false;
  if (numOrders > duration) return true;
  if (numOrders === duration && monthsSinceLast >= 1) return true;

  return false;
};

// Calculate CLV for mature customers only
let totalMature = 0;
let countMature = 0;

Object.keys(customers).forEach(customerId => {
  if (isMature(customerId, ...)) {
    totalMature += customers[customerId].totalRevenue;
    countMature++;
  }
});

const realizedCLV_mature = countMature > 0 ? totalMature / countMature : 0;
```

**Maturity Criteria:**
1. Customer has cancelled subscription, OR
2. Customer has paused subscription = FALSE, AND
3. Number of orders > sale_cycle_duration (prepaid period), OR
4. Number of orders = sale_cycle_duration AND 1+ months since last order

**Formula:** `Sum(order.total_amount for mature customers) / Count(mature customers)`

**Data Sources:**
- `order.created` sheet (total_amount, customer_id, created_at)
- `subscription.cancelled` sheet (customer_id)
- `subscription.paused` sheet (customer_id)
- `products` sheet (sale_cycle_duration)

**Quality Indicator:** 'good' quality when sufficient mature customers exist

**Business Significance:** More accurate predictor of long-term customer value than all-customer CLV

---

### 8. Mature Customer Ratio
**Section:** Growth & Revenue Metrics

**What it is:** Percentage of customers who have reached maturity status.

**What it means:** Indicates how much of the customer base has been around long enough to demonstrate full lifecycle behavior.

**How it's calculated:**
```javascript
const matureCustomerRatio = (countMature / countAll) * 100;
```

**Formula:** `(Mature Customers / Total Customers) * 100`

**Display:** Percentage with 2 decimal places

**Breakdown Displayed:**
- Count of mature customers
- Total customer count

**Data Sources:** Same as Realized CLV calculations

**Quality Indicator:** 'good' quality when data is complete

**Business Significance:** Higher ratio means more reliable CLV projections

---

### 9. Renewal Rate
**Section:** Clinical & Patient Success

**What it is:** Percentage of mature customers who placed at least one paid renewal order after their prepaid period.

**What it means:** Measures customer retention and satisfaction after the initial commitment period ends.

**How it's calculated:**
```javascript
// Step 1: Identify mature customers (same logic as CLV)
// Step 2: For each mature customer, check if they have renewal orders

const hasRenewalOrder = (customerId, productId) => {
  const duration = productDuration[productId] || 1; // from product.sale_cycle_duration
  const orders = customers[customerId].orders.sort((a, b) => a.date - b.date);

  const prepaidOrders = orders.slice(0, duration);
  const renewalOrders = orders.slice(duration); // Orders after prepaid period

  // Check if any renewal order has amount > 0
  return renewalOrders.some(order => order.amount > 0);
};

let renewedCustomers = 0;
matureCustomers.forEach(customerId => {
  if (hasRenewalOrder(customerId, productId)) {
    renewedCustomers++;
  }
});

const renewalRate = (renewedCustomers / matureCustomers) * 100;
```

**Formula:** `(Renewed Customers / Mature Customers) * 100`

**Renewed Customer Definition:** A mature customer who has at least one paid order (amount > 0) after their prepaid period

**Data Sources:**
- `order.created` sheet (customer_id, total_amount, created_at, product_id)
- `products` sheet (sale_cycle_duration)
- `subscription.cancelled` sheet
- `subscription.paused` sheet

**Display:** Percentage with 2 decimal places, plus counts

**Quality Thresholds:**
- Excellent: ≥ 80%
- Good: 60-79%
- Needs Improvement: 40-59%
- Low: < 40%

**Business Significance:** Critical retention metric; higher renewal rates indicate product-market fit and customer satisfaction

---

## Timed Metrics (Date Range Sensitive)

These metrics are calculated based on the selected time period (daily, weekly, monthly, quarterly, annually, all-time, or custom range).

### 10. New Patient Enrollments
**Section:** Growth & Revenue Metrics

**What it is:** Count of unique customers whose first checkout order occurred in the selected date range.

**What it means:** New customer acquisition for the period.

**How it's calculated:**
```javascript
// Step 1: Find first checkout order for each customer
const customerFirstOrders = new Map();

const checkoutOrders = data.orders.filter(order =>
  order.source === 'checkout' && order.created_at && order.customer_id
);

checkoutOrders.forEach(order => {
  const customerId = order.customer_id;
  const orderDate = new Date(order.created_at);

  if (!customerFirstOrders.has(customerId)) {
    customerFirstOrders.set(customerId, orderDate);
  } else {
    // Keep earliest order
    const existingDate = customerFirstOrders.get(customerId);
    if (orderDate < existingDate) {
      customerFirstOrders.set(customerId, orderDate);
    }
  }
});

// Step 2: Count customers with first order in date range
let newPatientCount = 0;
customerFirstOrders.forEach((firstOrderDate, customerId) => {
  if (firstOrderDate >= startDate && firstOrderDate <= endDate) {
    newPatientCount++;
  }
});
```

**Filter Criteria:**
- `order.source = 'checkout'` (excludes renewal orders)
- First order by customer
- Order date within selected range

**Formula:** `Count(DISTINCT customer_id WHERE first_checkout_order.created_at BETWEEN startDate AND endDate)`

**Data Sources:**
- `order.created` sheet (customer_id, created_at, source)

**Quality Indicator:**
- Good: > 0 new patients
- Low: 0 new patients

**Business Significance:** Primary growth indicator; tracks acquisition performance

---

### 11. Geographic Reach
**Section:** Operations & Logistics Metrics

**What it is:** Number of unique US states with orders in the selected date range.

**What it means:** Market penetration and geographic distribution of the customer base.

**How it's calculated:**
```javascript
const activeStates = new Set();

data.orders.forEach(order => {
  if (!order.shipping_address_id || !order.created_at) return;

  const orderDate = new Date(order.created_at);
  if (orderDate < startDate || orderDate > endDate) return;

  // Find address
  const address = data.addresses.find(addr =>
    addr.address_id === order.shipping_address_id
  );

  if (address && address.province_code) {
    activeStates.add(address.province_code);
  }
});

const stateCount = activeStates.size;
```

**Formula:** `COUNT(DISTINCT address.province_code WHERE order.created_at BETWEEN startDate AND endDate)`

**Data Sources:**
- `order.created` sheet (shipping_address_id, created_at)
- `addresses` sheet (address_id, province_code)

**Join Condition:** `order.shipping_address_id = address.address_id`

**Display:** Count of states + list of state codes

**Quality Indicator:**
- Good: > 0 states
- Low: 0 states

**Business Significance:** Indicates market expansion and regulatory compliance scope

---

### 12. Monthly Recurring Revenue (MRR)
**Section:** Growth & Revenue Metrics

**What it is:** Normalized monthly revenue from all active subscriptions.

**What it means:** Predictable recurring revenue stream; key metric for subscription businesses.

**How it's calculated:**
```javascript
let totalMRR = 0;

data.subscriptions.forEach(sub => {
  if (sub.Status !== 'active') return;

  // Find product pricing
  const product = data.products.find(p => p.product_id === sub.ProductID);
  if (!product || !product.renewal_price) return;

  const renewalPrice = parseFloat(product.renewal_price) || 0;
  const cycleDuration = parseInt(product.renewal_cycle_duration) || 30;

  // Normalize to monthly (30 days)
  const monthlyRevenue = renewalPrice * (30 / cycleDuration);
  totalMRR += monthlyRevenue;
});
```

**Formula:** `Sum((product.renewal_price * 30) / product.renewal_cycle_duration) FOR active subscriptions`

**Normalization:** All renewal cycles converted to 30-day months

**Data Sources:**
- `subscription.active` sheet (Status, ProductID)
- `products` sheet (product_id, renewal_price, renewal_cycle_duration)

**Filter:** Only active subscriptions

**Display:** Currency (USD) with 2 decimal places

**Breakdown Shown:**
- Total MRR amount
- Active subscription count

**Quality Indicator:** 'good' when active subscriptions exist

**Business Significance:** Core SaaS metric; indicates recurring revenue health

---

### 13. Average Revenue Per User (ARPU)
**Section:** Growth & Revenue Metrics

**What it is:** Average monthly revenue generated per customer.

**What it means:** Revenue efficiency metric; shows how much each customer contributes monthly.

**How it's calculated:**
```javascript
// Calculated as part of CLV metrics
const customers = {}; // Group by customer

data.orders.forEach(order => {
  const customerId = order.customer_id;
  if (!customerId || !order.created_at) return;

  const orderDate = new Date(order.created_at);
  const amount = parseFloat(order.total_amount) || 0;

  if (!customers[customerId]) {
    customers[customerId] = {
      totalRevenue: 0,
      orderDates: []
    };
  }

  customers[customerId].totalRevenue += amount;
  customers[customerId].orderDates.push(orderDate);
});

// Calculate monthly ARPU per customer
let arpuSum = 0;
let customerCount = 0;

Object.keys(customers).forEach(customerId => {
  const customer = customers[customerId];
  const sortedDates = customer.orderDates.sort((a, b) => a - b);
  const firstOrderDate = sortedDates[0];
  const lastOrderDate = sortedDates[sortedDates.length - 1];

  // Calculate months active
  const monthsActive = Math.max(1,
    Math.ceil((lastOrderDate - firstOrderDate) / (1000 * 60 * 60 * 24 * 30))
  );

  // Monthly revenue for this customer
  const monthlyRevenue = customer.totalRevenue / monthsActive;
  arpuSum += monthlyRevenue;
  customerCount++;
});

const arpu = customerCount > 0 ? arpuSum / customerCount : 0;
```

**Formula:** `Average(customer.totalRevenue / customer.monthsActive) across all customers`

**Months Active Calculation:**
```
CEILING((lastOrderDate - firstOrderDate) / 30 days)
Minimum: 1 month
```

**Data Sources:**
- `order.created` sheet (customer_id, total_amount, created_at)

**Display:** Currency (USD) with 2 decimal places

**Quality Indicator:** 'good' when sufficient data exists

**Business Significance:** Used in Predictive CLV calculation; indicates per-customer revenue potential

---

### 14. Net Revenue After Refunds
**Section:** Financial Risk Metrics

**What it is:** Total revenue minus total refunds.

**What it means:** Actual realized revenue after accounting for returns and cancellations.

**How it's calculated:**
```javascript
// Sum all payments
const totalPayments = data.payments.reduce((sum, payment) => {
  return sum + (parseFloat(payment.amount) || 0);
}, 0);

// Sum all refunds
const totalRefunds = data.refunds.reduce((sum, refund) => {
  return sum + (parseFloat(refund.amount) || 0);
}, 0);

// Calculate net
const netRevenue = totalPayments - totalRefunds;

// Calculate refund rate
const refundRate = totalPayments > 0 ? (totalRefunds / totalPayments) * 100 : 0;
```

**Formula:** `Sum(payment.amount) - Sum(refund.amount)`

**Refund Rate Formula:** `(Total Refunds / Total Payments) * 100`

**Data Sources:**
- `payment_succesful` sheet (amount)
- `refund.created` sheet (amount)

**Display Components:**
- Net Revenue (USD)
- Total Payments (USD)
- Total Refunds (USD)
- Refund Rate (%)

**Quality Indicator:** 'good' when data complete

**Business Significance:** True revenue metric; high refund rates indicate product or service issues

---

### 15. Payment Success Rate
**Section:** Financial Risk Metrics

**What it is:** Percentage of payment attempts that succeeded.

**What it means:** Payment processing reliability and customer payment method health.

**How it's calculated:**
```javascript
const totalPayments = data.payments.length;

const successfulPayments = data.payments.filter(p =>
  p.amount && parseFloat(p.amount) > 0
).length;

const successRate = totalPayments > 0 ?
  (successfulPayments / totalPayments) * 100 : 0;
```

**Formula:** `(Successful Payments / Total Payment Attempts) * 100`

**Successful Payment Criteria:** `payment.amount > 0`

**Data Sources:**
- `payment_succesful` sheet (amount)

**Display:** Percentage with 2 decimal places + counts

**Quality Thresholds:**
- Excellent: > 95%
- Good: 90-95%
- Needs Improvement: < 90%

**Business Significance:** Indicates payment infrastructure health; low rates suggest need for payment method updates or processor issues

---

### 16. Churn Rate
**Section:** Clinical & Patient Success

**What it is:** Percentage of subscriptions that were cancelled per month (based on last 90 days).

**What it means:** Customer attrition rate; inverse of retention.

**How it's calculated:**
```javascript
const ninetyDaysAgo = new Date(today.getTime() - (90 * 24 * 60 * 60 * 1000));

// Count active subscriptions
const activeSubscriptionCount = data.subscriptions.filter(s =>
  s.Status === 'active'
).length;

// Count cancellations in last 90 days
const cancelledInLast90 = data.cancelledSubs.filter(sub => {
  if (!sub.last_updated) return false;
  const updateDate = new Date(sub.last_updated);
  return updateDate >= ninetyDaysAgo;
}).length;

// Total subscriptions
const totalSubscriptions = activeSubscriptionCount + data.cancelledSubs.length;

// Calculate monthly churn rate
let churnRate = 0;
if (totalSubscriptions > 0) {
  if (cancelledInLast90 > 0) {
    // Monthly rate from 90-day period
    churnRate = (cancelledInLast90 / totalSubscriptions) * (30 / 90) * 100;
  } else {
    // Fallback to all-time rate
    churnRate = (data.cancelledSubs.length / totalSubscriptions) * 100;
  }
}
```

**Formula (90-day):** `(Cancellations in last 90 days / Total Subscriptions) * (30 / 90) * 100`

**Formula (Fallback):** `(All Cancellations / Total Subscriptions) * 100`

**90-Day Period:** Used for more current churn rate estimate

**Data Sources:**
- `subscription.active` sheet (Status)
- `subscription.cancelled` sheet (customer_id, last_updated)

**Display Components:**
- Churn rate (%)
- Active customer count
- Cancelled customer count (90 days)
- Methodology description

**Quality Thresholds:**
- Excellent: < 5%
- Good: 5-10%
- Needs Improvement: > 10%

**Business Significance:** Critical retention metric; directly impacts CLV and long-term growth

---

### 17. Predictive CLV
**Section:** Growth & Revenue Metrics

**What it is:** Estimated total future lifetime value per customer.

**What it means:** Projected total revenue from an average customer over their entire lifecycle.

**How it's calculated:**
```javascript
// Uses ARPU and Churn Rate calculated above
const predictiveCLV = churnRate > 0 ? (arpu / (churnRate / 100)) : null;
```

**Formula:** `ARPU / (Churn Rate / 100)`

**Example:**
- If ARPU = $200/month
- If Churn Rate = 5% per month (0.05)
- Then Predictive CLV = $200 / 0.05 = $4,000

**Prerequisites:**
- ARPU must be calculated
- Churn Rate must be > 0

**Data Sources:** Derived from ARPU and Churn Rate calculations

**Display:** Currency (USD) with 2 decimal places, plus formula breakdown

**Quality Indicator:** 'good' when both ARPU and Churn Rate are valid

**Business Significance:** Strategic metric for customer acquisition spend; indicates maximum acceptable CAC (Customer Acquisition Cost)

**Note:** Returns null if churn rate is 0 (division by zero)

---

### 18. Medication Adherence Rate
**Section:** Clinical & Patient Success

**What it is:** Percentage of customers enrolled for 90+ days who remain active.

**What it means:** Clinical success metric; measures patient compliance with treatment.

**How it's calculated:**
```javascript
const now = new Date();
let adherentCustomers = 0;
let totalEligibleCustomers = 0;

data.subscriptions.forEach(sub => {
  if (!sub['Datetime Created']) return;

  const startDate = new Date(sub['Datetime Created']);
  const daysSinceStart = (now - startDate) / (1000 * 60 * 60 * 24);

  // Only count subscriptions active for 90+ days
  if (daysSinceStart >= 90) {
    totalEligibleCustomers++;

    // Adherent if still active OR completed 90+ days
    if (sub.Status === 'active' || daysSinceStart >= 90) {
      adherentCustomers++;
    }
  }
});

const adherenceRate = totalEligibleCustomers > 0 ?
  (adherentCustomers / totalEligibleCustomers) * 100 : 0;
```

**Formula:** `(Adherent Customers / Eligible Customers) * 100`

**Eligible Customer:** Subscription created 90+ days ago

**Adherent Customer:** Active status OR completed 90+ days of treatment

**Clinical Target:** 80% (industry standard)

**Data Sources:**
- `subscription.active` sheet (Datetime Created, Status)

**Display Components:**
- Adherence rate (%)
- Adherent customer count
- Total eligible customer count
- Clinical target (80%)

**Quality Thresholds:**
- Excellent: ≥ 80%
- Good: 70-79%
- Needs Improvement: < 70%

**Business Significance:** Clinical effectiveness indicator; correlates with outcomes and retention

---

### 19. Order Processing Efficiency
**Section:** Operations & Logistics Metrics

**What it is:** Time between order creation and update (processing time).

**What it means:** Operational speed; how quickly orders move through the system.

**How it's calculated:**
```javascript
const processingTimes = [];

data.orders.forEach(order => {
  if (!order.created_at || !order.updated_at) return;

  const createdTime = new Date(order.created_at);
  const updatedTime = new Date(order.updated_at);

  const processingHours = (updatedTime - createdTime) / (1000 * 60 * 60);

  // Only include realistic times (0 to 168 hours = 1 week)
  if (processingHours >= 0 && processingHours <= 168) {
    processingTimes.push(processingHours);
  }
});

// Sort for percentile calculations
processingTimes.sort((a, b) => a - b);

// Calculate median (50th percentile)
const median = processingTimes[Math.floor(processingTimes.length / 2)];

// Calculate 90th percentile
const p90 = processingTimes[Math.floor(processingTimes.length * 0.9)];
```

**Formula:** `(order.updated_at - order.created_at) / 3600 seconds`

**Metrics Reported:**
- Median processing time (50th percentile)
- 90th percentile processing time (P90)
- Sample size (order count)

**Time Filters:** Only includes orders with 0-168 hour processing time (excludes outliers)

**Data Sources:**
- `order.created` sheet (created_at, updated_at)

**Unit:** Hours with 2 decimal places

**Quality Thresholds:**
- Excellent: Median < 24 hours
- Good: Median 24-48 hours
- Needs Improvement: Median > 48 hours

**Business Significance:** Operational efficiency indicator; faster processing improves customer satisfaction

---

### 20. Product Performance
**Section:** Operations & Logistics Metrics

**What it is:** Revenue and order metrics broken down by product.

**What it means:** Identifies top-performing products and revenue drivers.

**How it's calculated:**
```javascript
const productMetrics = {};

data.products.forEach(product => {
  const productId = product.product_id;

  // Find all orders for this product
  const productOrders = data.orders.filter(order =>
    order.product_id === productId
  );

  // Find all subscriptions for this product
  const productSubscriptions = data.subscriptions.filter(sub =>
    sub.ProductID === productId
  );

  // Calculate revenue (sum payments for product orders)
  const revenue = productOrders.reduce((sum, order) => {
    const payment = data.payments.find(p =>
      p.order_number === order.order_id
    );
    return sum + (payment ? parseFloat(payment.amount) || 0 : 0);
  }, 0);

  // Count unique customers
  const uniqueCustomers = new Set(
    productOrders.map(o => o.customer_id)
  ).size;

  productMetrics[productId] = {
    name: product.name || productId,
    totalOrders: productOrders.length,
    activeSubscriptions: productSubscriptions.filter(s =>
      s.Status === 'active'
    ).length,
    revenue: Math.round(revenue * 100) / 100,
    uniqueCustomers: uniqueCustomers
  };
});

// Sort by revenue and take top 5
const topProducts = Object.values(productMetrics)
  .sort((a, b) => b.revenue - a.revenue)
  .slice(0, 5);
```

**Metrics Per Product:**
- Product name
- Total order count
- Active subscription count
- Total revenue (USD)
- Unique customer count

**Data Sources:**
- `products` sheet (product_id, name)
- `order.created` sheet (order_id, product_id, customer_id)
- `subscription.active` sheet (ProductID, Status)
- `payment_succesful` sheet (order_number, amount)

**Join Logic:**
- `order.product_id = product.product_id`
- `subscription.ProductID = product.product_id`
- `payment.order_number = order.order_id`

**Display:** Top 5 products by revenue

**Quality Indicator:** 'good' when products exist

**Business Significance:** Product strategy; identifies which offerings drive revenue

---

## Data Quality Indicators

### Quality Assessment
The dashboard assesses data quality and displays it in metadata:

```javascript
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
```

**Thresholds:**
- Overall = 'low' if customers < 10 OR orders < 10
- Overall = 'good' otherwise

**Displayed In:** Metadata section at bottom of dashboard

---

### Quality Levels by Metric

Each KPI includes a quality indicator:

- **'excellent'**: Metric exceeds target thresholds
- **'good'**: Metric meets baseline requirements
- **'needs_improvement'**: Metric below targets but calculable
- **'low'**: Insufficient data for reliable calculation
- **'error'**: Calculation failed
- **'no_data'**: No data available

---

## Time Period Calculations

### Date Range Determination

**Monthly (default):**
```javascript
startDate = new Date(now.getFullYear(), now.getMonth(), 1); // First day of current month
endDate = new Date(now); // Today
```

**Weekly:**
```javascript
startDate = new Date(now);
startDate.setDate(now.getDate() - now.getDay()); // Start of current week (Sunday)
startDate.setHours(0, 0, 0, 0);
endDate = new Date(now);
```

**Quarterly:**
```javascript
const quarterStart = Math.floor(now.getMonth() / 3) * 3; // 0, 3, 6, or 9
startDate = new Date(now.getFullYear(), quarterStart, 1);
endDate = new Date(now);
```

**All Time:**
```javascript
startDate = new Date('2020-01-01');
endDate = new Date(now);
```

**Custom:**
```javascript
// User provides dates via date picker
startDate = new Date(startDateISO);
endDate = new Date(endDateISO);
endDate.setHours(23, 59, 59, 999); // Include full end day
```

---

## Data Sources Reference

### Spreadsheet Structure
**Spreadsheet ID:** `1PaCOgNJmKSb2VsJjCMjWpCG-gwrO7uVkuTAFUdrV-_o`

### Sheet Names and Key Fields

**customers:**
- customer_id
- created_at
- email

**order.created:**
- order_id
- customer_id
- product_id
- total_amount
- created_at
- updated_at
- source ('checkout' or 'renewal')
- shipping_address_id

**payment_succesful:**
- order_number (joins to order.order_id)
- amount
- datetime

**refund.created:**
- order_id
- amount
- datetime

**products:**
- product_id
- name
- renewal_price
- renewal_cycle_duration (days)
- sale_cycle_duration (number of prepaid orders)

**subscription.active:**
- CustomerID
- ProductID
- Status
- Datetime Created

**subscription.cancelled:**
- customer_id
- last_updated

**subscription.paused:**
- customer_id
- last_updated

**addresses:**
- address_id
- province_code (US state)

---

## Calculation Performance

### Caching Strategy
- Cache duration: 6 minutes (360 seconds)
- Cache key format: `enhanced_kpis_{timePeriod}_{startTime}_{endTime}`
- Cache service: Google Apps Script CacheService

### Calculation Order
1. Load all data from sheets
2. Calculate CLV metrics (includes ARPU, Churn, Predictive CLV)
3. Calculate Renewal Rate
4. Calculate time-dependent metrics with date filtering
5. Assess data quality
6. Cache results
7. Return JSON to frontend

---

## Metadata Display

At the bottom of the dashboard, the following metadata is shown:

- **Last Updated:** Timestamp of KPI calculation
- **Time Period:** Selected time period (monthly, weekly, etc.)
- **Data Points:** Count of subscriptions, customers, and orders used in calculations

---

## Dashboard Sections

The KPIs are organized into 5 main sections:

1. **Growth & Revenue Metrics** (📈)
   - New Patient Enrollments
   - Realized CLV (All)
   - Realized CLV (Mature)
   - Mature Customer Ratio
   - MRR
   - ARPU
   - Predictive CLV

2. **Operations & Logistics Metrics** (⚙️)
   - Purchase → Awaiting Script time
   - Awaiting Script → Awaiting Shipment time
   - Awaiting Shipment → Shipped time
   - Purchase → Shipped total time
   - Geographic Reach
   - Order Processing Efficiency
   - Product Performance

3. **Clinical & Patient Success Metrics** (🏥)
   - Active Patients
   - Renewal Rate
   - Medication Adherence Rate
   - Churn Rate

4. **Financial Risk Metrics** (💰)
   - Net Revenue After Refunds
   - Payment Success Rate

5. **Order Flow & Stage Analysis** (🔄)
   - Order stage transition times

---

## Pending KPIs (Placeholders)

The following KPIs are displayed as placeholders awaiting data integration:

1. **Customer Acquisition Cost (CAC)**
   - Requires: Marketing cost data integration

2. **Cancelled Order/Refund Rate**
   - Requires: Enhanced Stripe tracking

3. **Shipping SLA Compliance**
   - Requires: Shipping provider API integration

4. **Support Ticket Metrics**
   - Requires: Support system integration

5. **Average Weight Loss**
   - Requires: Patient outcome data extraction

6. **Lead-to-Consult Conversion**
   - Requires: Marketing funnel data integration

---

## Technical Notes

### Google Apps Script Compatibility
- All Date objects converted to ISO strings for transmission
- Uses `google.script.run` for client-server communication
- HIPAA compliance checks on every request
- Audit logging for all dashboard access

### Error Handling
- Multiple fallback calculation methods
- Minimal KPI structure returned on critical errors
- Detailed error logging to console
- User-friendly error messages displayed

### Browser Compatibility
- Supports all modern browsers
- Mobile-responsive design
- Works with Google Workspace authentication

---

## Version History

**Version 1.0** (2025-10-22)
- Initial comprehensive documentation
- All 20+ KPIs documented with formulas
- Data source mapping complete
- Quality indicators defined

---

## Contact & Support

For questions about KPI calculations or dashboard access:
- Check Google Apps Script logs for detailed calculation traces
- Review data quality indicators in dashboard metadata
- Contact system administrator for data source issues

---

**End of Document**
