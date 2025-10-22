// Google Apps Script for handling Stripe webhooks
// IMPROVED VERSION - Handles deployment issues and improves error handling
// Handles payment_intent.succeeded and refund.created events

const SPREADSHEET_ID = '1PaCOgNJmKSb2VsJjCMjWpCG-gwrO7uVkuTAFUdrV-_o';
const CHARGES_SHEET_NAME = 'payment_successful';
const REFUNDS_SHEET_NAME = 'refund.created';

// Add these constants for better error handling
const WEBHOOK_SECRET = ''; // Add your Stripe webhook secret here for verification (optional but recommended)
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

/**
 * Main webhook handler with improved error handling and logging
 */
function doPost(e) {
  const startTime = new Date().getTime();

  try {
    // Log the incoming request for debugging
    console.log('=== STRIPE WEBHOOK RECEIVED ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Content Type:', e.parameter ? 'URL Parameters' : 'POST Data');

    // Validate request has data
    if (!e.postData || !e.postData.contents) {
      console.error('No POST data received');
      return createErrorResponse('No POST data received', 400);
    }

    // Parse webhook data
    let data;
    try {
      data = JSON.parse(e.postData.contents);
      console.log('Webhook Event Type:', data.type);
      console.log('Event ID:', data.id);
    } catch (parseError) {
      console.error('Failed to parse JSON:', parseError.toString());
      console.error('Raw data:', e.postData.contents);
      return createErrorResponse('Invalid JSON data', 400);
    }

    // Handle different event types
    let result;
    switch (data.type) {
      case 'payment_intent.succeeded':
        console.log('Processing payment_intent.succeeded event');
        result = handlePaymentIntentSucceeded(data.data.object);
        break;

      case 'refund.created':
        console.log('Processing refund.created event');
        result = handleRefundCreated(data.data.object);
        break;

      default:
        console.log('Unhandled event type:', data.type);
        result = { status: 'ignored', message: `Event type ${data.type} not handled` };
    }

    const processingTime = new Date().getTime() - startTime;
    console.log(`Processing completed in ${processingTime}ms`);
    console.log('Result:', result);

    return createSuccessResponse({
      status: 'success',
      eventType: data.type,
      eventId: data.id,
      processingTime: processingTime,
      result: result
    });

  } catch (error) {
    const processingTime = new Date().getTime() - startTime;
    console.error('=== WEBHOOK ERROR ===');
    console.error('Error:', error.toString());
    console.error('Stack:', error.stack);
    console.error(`Failed after ${processingTime}ms`);

    return createErrorResponse(error.toString(), 500);
  }
}

/**
 * Handle GET requests for testing
 */
function doGet(e) {
  const testResponse = {
    service: 'Stripe Webhook Handler',
    status: 'active',
    timestamp: new Date().toISOString(),
    version: '2.0',
    events: ['payment_intent.succeeded', 'refund.created'],
    spreadsheet: SPREADSHEET_ID
  };

  return ContentService.createTextOutput(JSON.stringify(testResponse, null, 2))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Create standardized success response
 */
function createSuccessResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, stripe-signature'
    });
}

/**
 * Create standardized error response
 */
function createErrorResponse(message, statusCode = 500) {
  const errorData = {
    status: 'error',
    message: message,
    timestamp: new Date().toISOString(),
    statusCode: statusCode
  };

  return ContentService.createTextOutput(JSON.stringify(errorData))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, stripe-signature'
    });
}

/**
 * Convert Unix timestamp to Eastern Time with better error handling
 */
function convertToEasternTime(unixTimestamp) {
  if (!unixTimestamp) {
    console.warn('No timestamp provided');
    return "";
  }

  try {
    const utcDate = new Date(unixTimestamp * 1000);

    // Validate the date
    if (isNaN(utcDate.getTime())) {
      console.error('Invalid timestamp:', unixTimestamp);
      return unixTimestamp.toString();
    }

    const easternTime = utcDate.toLocaleString("en-US", {
      timeZone: "America/New_York",
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    console.log(`Converted timestamp ${unixTimestamp} to ${easternTime}`);
    return easternTime;
  } catch (error) {
    console.error("Error converting timestamp:", error.toString());
    return unixTimestamp.toString();
  }
}

/**
 * Get spreadsheet with retry logic
 */
function getSpreadsheet() {
  let attempts = 0;
  while (attempts < MAX_RETRIES) {
    try {
      console.log(`Attempting to open spreadsheet (attempt ${attempts + 1}/${MAX_RETRIES})`);
      const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
      console.log('Spreadsheet opened successfully');
      return ss;
    } catch (error) {
      attempts++;
      console.error(`Spreadsheet access failed (attempt ${attempts}):`, error.toString());
      if (attempts >= MAX_RETRIES) {
        throw new Error(`Failed to open spreadsheet after ${MAX_RETRIES} attempts: ${error.toString()}`);
      }
      Utilities.sleep(RETRY_DELAY);
    }
  }
}

/**
 * Get charges sheet with auto-creation and retry logic
 */
function getChargesSheet() {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(CHARGES_SHEET_NAME);

  if (!sheet) {
    console.log(`Creating new charges sheet: ${CHARGES_SHEET_NAME}`);
    sheet = ss.insertSheet(CHARGES_SHEET_NAME);
    setupChargesHeaders(sheet);
    console.log('Charges sheet created and headers set up');
  } else {
    console.log(`Using existing charges sheet: ${CHARGES_SHEET_NAME}`);
  }

  return sheet;
}

/**
 * Get refunds sheet with auto-creation and retry logic
 */
function getRefundsSheet() {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(REFUNDS_SHEET_NAME);

  if (!sheet) {
    console.log(`Creating new refunds sheet: ${REFUNDS_SHEET_NAME}`);
    sheet = ss.insertSheet(REFUNDS_SHEET_NAME);
    setupRefundsHeaders(sheet);
    console.log('Refunds sheet created and headers set up');
  } else {
    console.log(`Using existing refunds sheet: ${REFUNDS_SHEET_NAME}`);
  }

  return sheet;
}

/**
 * Set up headers for charges sheet
 */
function setupChargesHeaders(sheet) {
  const headers = [
    'charge_id', 'payment_intent_id', 'order_number', 'amount', 'currency',
    'datetime', 'customer_id', 'payment_method_id', 'card_last4', 'card_brand',
    'status', 'description', 'application_fee_amount'
  ];

  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#f0f0f0');
  sheet.freezeRows(1);

  console.log('Charges sheet headers configured');
}

/**
 * Set up headers for refunds sheet
 */
function setupRefundsHeaders(sheet) {
  const headers = [
    'refund_id', 'charge_id', 'amount', 'currency', 'datetime',
    'reason', 'status', 'payment_intent_id'
  ];

  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#f0f0f0');
  sheet.freezeRows(1);

  console.log('Refunds sheet headers configured');
}

/**
 * Safely get nested object properties
 */
function safeGet(obj, path, defaultValue = '') {
  try {
    return path.split('.').reduce((current, key) => {
      return (current && current[key] !== undefined) ? current[key] : defaultValue;
    }, obj);
  } catch (error) {
    console.warn(`Error accessing path ${path}:`, error.toString());
    return defaultValue;
  }
}

/**
 * Find row by value in specific column with error handling
 */
function findRowByValue(sheet, columnIndex, value) {
  try {
    if (!value) return null;

    const data = sheet.getDataRange().getValues();
    console.log(`Searching for value "${value}" in column ${columnIndex} of ${data.length} rows`);

    for (let i = 1; i < data.length; i++) {
      if (data[i][columnIndex - 1] === value) {
        console.log(`Found existing record at row ${i + 1}`);
        return i + 1;
      }
    }

    console.log('No existing record found');
    return null;
  } catch (error) {
    console.error('Error finding row:', error.toString());
    return null;
  }
}

/**
 * Retrieve full Payment Intent from Stripe API to get complete metadata
 */
function getFullPaymentIntent(paymentIntentId) {
  try {
    // Retrieve stored Stripe API key
    const apiKey = PropertiesService.getScriptProperties().getProperty('STRIPE_SECRET_KEY');

    if (!apiKey) {
      console.error('Stripe API key not found in properties');
      throw new Error('Stripe API key not configured');
    }

    console.log(`Making API call to retrieve Payment Intent: ${paymentIntentId}`);

    // Make API call to retrieve complete Payment Intent with expanded payment method
    const response = UrlFetchApp.fetch(`https://api.stripe.com/v1/payment_intents/${paymentIntentId}?expand[]=payment_method`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    if (response.getResponseCode() !== 200) {
      throw new Error(`Stripe API returned status ${response.getResponseCode()}: ${response.getContentText()}`);
    }

    const fullPaymentIntent = JSON.parse(response.getContentText());
    console.log(`Successfully retrieved Payment Intent with metadata:`, JSON.stringify(fullPaymentIntent.metadata, null, 2));

    return fullPaymentIntent;

  } catch (error) {
    console.error('Error retrieving Payment Intent from API:', error.toString());
    throw error;
  }
}

/**
 * Handle payment intent succeeded with improved data extraction and API call for metadata
 */
function handlePaymentIntentSucceeded(paymentIntent) {
  console.log('=== PROCESSING PAYMENT INTENT ===');
  console.log('Payment Intent ID:', paymentIntent.id);
  console.log('Amount:', paymentIntent.amount);
  console.log('Customer:', paymentIntent.customer);

  try {
    // Get complete Payment Intent from Stripe API to retrieve resourceID
    const fullPaymentIntent = getFullPaymentIntent(paymentIntent.id);
    const resourceId = safeGet(fullPaymentIntent, 'metadata.resourceId', '');

    if (resourceId) {
      console.log(`Found resourceID: ${resourceId} for Payment Intent: ${paymentIntent.id}`);
    } else {
      console.warn(`No resourceID found in metadata for Payment Intent: ${paymentIntent.id}`);
      console.log('Available metadata:', JSON.stringify(fullPaymentIntent.metadata, null, 2));
    }

    const chargesSheet = getChargesSheet();
    const existingRow = findRowByValue(chargesSheet, 2, paymentIntent.id); // payment_intent_id is column 2

    const amount = (paymentIntent.amount || 0) / 100;
    // Get application fee from API instead of calculating manually
    const applicationFee = safeGet(fullPaymentIntent, 'application_fee_amount', 0) / 100;

    // Extract additional data from latest charge if available
    let chargeId = safeGet(paymentIntent, 'latest_charge', '');
    let cardLast4 = '';
    let cardBrand = '';

    // Get card details from expanded payment method (most reliable)
    if (fullPaymentIntent.payment_method && fullPaymentIntent.payment_method.card) {
      cardLast4 = safeGet(fullPaymentIntent, 'payment_method.card.last4', '');
      cardBrand = safeGet(fullPaymentIntent, 'payment_method.card.brand', '');
    }
    // Fallback: If we have charges array, get more details
    else if (paymentIntent.charges && paymentIntent.charges.data && paymentIntent.charges.data.length > 0) {
      const latestCharge = paymentIntent.charges.data[0];
      chargeId = latestCharge.id || chargeId;
      cardLast4 = safeGet(latestCharge, 'payment_method_details.card.last4', '');
      cardBrand = safeGet(latestCharge, 'payment_method_details.card.brand', '');
    }

    const chargeData = [
      chargeId, // charge_id
      paymentIntent.id, // payment_intent_id
      resourceId, // order_number (now retrieved via API call)
      amount, // amount
      (paymentIntent.currency || '').toUpperCase(), // currency
      convertToEasternTime(paymentIntent.created), // datetime
      safeGet(paymentIntent, 'customer', ''), // customer_id
      safeGet(paymentIntent, 'payment_method', ''), // payment_method_id
      cardLast4, // card_last4
      cardBrand, // card_brand
      paymentIntent.status || '', // status
      safeGet(paymentIntent, 'description', ''), // description
      applicationFee // application_fee_amount
    ];

    console.log('Charge data prepared:', chargeData);

    if (existingRow) {
      chargesSheet.getRange(existingRow, 1, 1, chargeData.length).setValues([chargeData]);
      console.log(`Updated existing payment intent at row ${existingRow}`);
      return { action: 'updated', row: existingRow, paymentIntentId: paymentIntent.id, resourceId: resourceId };
    } else {
      chargesSheet.appendRow(chargeData);
      const newRow = chargesSheet.getLastRow();
      console.log(`Added new payment intent at row ${newRow}`);
      return { action: 'created', row: newRow, paymentIntentId: paymentIntent.id, resourceId: resourceId };
    }

  } catch (error) {
    console.error('Error handling payment intent:', error.toString());
    throw new Error(`Failed to process payment intent: ${error.message}`);
  }
}

/**
 * Handle refund created with improved data extraction
 */
function handleRefundCreated(refund) {
  console.log('=== PROCESSING REFUND ===');
  console.log('Refund ID:', refund.id);
  console.log('Charge ID:', refund.charge);
  console.log('Amount:', refund.amount);

  try {
    const refundsSheet = getRefundsSheet();
    const existingRow = findRowByValue(refundsSheet, 1, refund.id); // refund_id is column 1

    const amount = (refund.amount || 0) / 100;

    const refundData = [
      refund.id || '', // refund_id
      refund.charge || '', // charge_id
      amount, // amount
      (refund.currency || '').toUpperCase(), // currency
      convertToEasternTime(refund.created), // datetime
      safeGet(refund, 'reason', ''), // reason
      refund.status || '', // status
      safeGet(refund, 'payment_intent', '') // payment_intent_id
    ];

    console.log('Refund data prepared:', refundData);

    if (existingRow) {
      refundsSheet.getRange(existingRow, 1, 1, refundData.length).setValues([refundData]);
      console.log(`Updated existing refund at row ${existingRow}`);
      return { action: 'updated', row: existingRow, refundId: refund.id };
    } else {
      refundsSheet.appendRow(refundData);
      const newRow = refundsSheet.getLastRow();
      console.log(`Added new refund at row ${newRow}`);
      return { action: 'created', row: newRow, refundId: refund.id };
    }

  } catch (error) {
    console.error('Error handling refund:', error.toString());
    throw new Error(`Failed to process refund: ${error.message}`);
  }
}

/**
 * Test function to verify webhook is working
 */
function testWebhook() {
  const testPaymentIntent = {
    id: 'pi_test_' + Date.now(),
    amount: 3490,
    currency: 'usd',
    status: 'succeeded',
    created: Math.floor(Date.now() / 1000),
    customer: 'cus_test_customer',
    payment_method: 'pm_test_method',
    latest_charge: 'ch_test_charge',
    description: 'Test payment',
    metadata: {
      resourceId: '9999'
    }
  };

  console.log('=== TESTING WEBHOOK ===');
  const result = handlePaymentIntentSucceeded(testPaymentIntent);
  console.log('Test result:', result);
  return result;
}

/**
 * Test function to retrieve specific payment intent and log resourceID
 */
function testPaymentIntentAPI() {
  console.log('=== TESTING PAYMENT INTENT API CALL ===');

  const paymentIntentId = 'pi_3S8LUxGIItQPbBO719GgP9EZ';
  console.log(`Testing API call for Payment Intent: ${paymentIntentId}`);

  try {
    // Call the API to get full payment intent
    const fullPaymentIntent = getFullPaymentIntent(paymentIntentId);

    // Extract and log the resourceID
    const resourceId = safeGet(fullPaymentIntent, 'metadata.resourceID', '');

    console.log('=== API CALL RESULTS ===');
    console.log(`Payment Intent ID: ${paymentIntentId}`);
    console.log(`ResourceID: ${resourceId}`);
    console.log('Full metadata:', JSON.stringify(fullPaymentIntent.metadata, null, 2));
    console.log('Payment Intent Status:', fullPaymentIntent.status);
    console.log('Payment Intent Amount:', fullPaymentIntent.amount);

    if (resourceId) {
      console.log(`✅ SUCCESS: Found resourceID = ${resourceId}`);
    } else {
      console.log('❌ WARNING: No resourceID found in metadata');
    }

    return {
      paymentIntentId: paymentIntentId,
      resourceId: resourceId,
      status: fullPaymentIntent.status,
      amount: fullPaymentIntent.amount,
      metadata: fullPaymentIntent.metadata
    };

  } catch (error) {
    console.error('=== API CALL ERROR ===');
    console.error('Error retrieving Payment Intent:', error.toString());
    console.error('Stack trace:', error.stack);

    return {
      error: error.toString(),
      paymentIntentId: paymentIntentId
    };
  }
}

/**
 * Helper function to get charge details from Stripe API
 */
function getChargeDetails(chargeId) {
  try {
    // Retrieve stored Stripe API key
    const apiKey = PropertiesService.getScriptProperties().getProperty('STRIPE_SECRET_KEY');

    if (!apiKey) {
      console.error('Stripe API key not found in properties');
      throw new Error('Stripe API key not configured');
    }

    console.log(`Making API call to retrieve Charge: ${chargeId}`);

    // Make API call to retrieve charge (without payment_method expansion to avoid errors with py_ charges)
    const response = UrlFetchApp.fetch(`https://api.stripe.com/v1/charges/${chargeId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    if (response.getResponseCode() !== 200) {
      throw new Error(`Stripe API returned status ${response.getResponseCode()}: ${response.getContentText()}`);
    }

    const charge = JSON.parse(response.getContentText());
    console.log(`Successfully retrieved Charge: ${chargeId}`);

    return charge;

  } catch (error) {
    console.error('Error retrieving Charge from API:', error.toString());
    throw error;
  }
}

/**
 * Function to backfill missing data in payment_successful sheet
 */
function backfillMissingPaymentData() {
  console.log('=== BACKFILLING MISSING PAYMENT DATA ===');

  try {
    // Get the charges sheet
    const chargesSheet = getChargesSheet();

    if (chargesSheet.getLastRow() <= 1) {
      console.log('No data rows found in payment_successful sheet');
      return { message: 'No data to process', updated: 0 };
    }

    // Get all data
    const data = chargesSheet.getDataRange().getValues();
    const headers = data[0];

    // Find column indices
    const chargeIdIndex = headers.indexOf('charge_id'); // Column 0
    const orderNumberIndex = headers.indexOf('order_number'); // Column 2
    const cardLast4Index = headers.indexOf('card_last4'); // Column 8
    const cardBrandIndex = headers.indexOf('card_brand'); // Column 9
    const applicationFeeIndex = headers.indexOf('application_fee_amount'); // Column 12

    console.log('Column indices:');
    console.log(`  charge_id: ${chargeIdIndex}`);
    console.log(`  order_number: ${orderNumberIndex}`);
    console.log(`  card_last4: ${cardLast4Index}`);
    console.log(`  card_brand: ${cardBrandIndex}`);
    console.log(`  application_fee_amount: ${applicationFeeIndex}`);

    if (chargeIdIndex === -1) {
      throw new Error('charge_id column not found in sheet');
    }

    let updatedCount = 0;
    const updates = [];

    // Process each row (skip header)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const chargeId = row[chargeIdIndex];
      const orderNumber = row[orderNumberIndex];
      const cardLast4 = row[cardLast4Index];
      const cardBrand = row[cardBrandIndex];
      const applicationFee = row[applicationFeeIndex];

      // Check if any required fields are missing
      const missingFields = [];
      if (!orderNumber || orderNumber === '') missingFields.push('order_number');
      if (!cardLast4 || cardLast4 === '') missingFields.push('card_last4');
      if (!cardBrand || cardBrand === '') missingFields.push('card_brand');
      if (!applicationFee || applicationFee === '' || applicationFee === 0) missingFields.push('application_fee_amount');

      if (missingFields.length > 0 && chargeId) {
        console.log(`\nRow ${i + 1}: Missing ${missingFields.join(', ')} for charge ${chargeId}`);

        try {
          // Get charge details from Stripe
          const charge = getChargeDetails(chargeId);

          // Get payment intent details to extract order number
          let paymentIntent = null;
          if (charge.payment_intent && missingFields.includes('order_number')) {
            paymentIntent = getFullPaymentIntent(charge.payment_intent);
          }

          let hasUpdates = false;
          const rowUpdates = {};

          // Fill missing order number
          if (missingFields.includes('order_number') && paymentIntent) {
            const resourceId = safeGet(paymentIntent, 'metadata.resourceId', '');
            if (resourceId) {
              rowUpdates.order_number = resourceId;
              hasUpdates = true;
              console.log(`  Found order_number: ${resourceId}`);
            }
          }

          // Fill missing card details
          if (missingFields.includes('card_last4') || missingFields.includes('card_brand')) {
            let foundCardLast4 = '';
            let foundCardBrand = '';

            // Try payment method first
            if (charge.payment_method && charge.payment_method.card) {
              foundCardLast4 = charge.payment_method.card.last4 || '';
              foundCardBrand = charge.payment_method.card.brand || '';
            }
            // Fallback to payment_method_details
            else if (charge.payment_method_details && charge.payment_method_details.card) {
              foundCardLast4 = charge.payment_method_details.card.last4 || '';
              foundCardBrand = charge.payment_method_details.card.brand || '';
            }

            if (missingFields.includes('card_last4') && foundCardLast4) {
              rowUpdates.card_last4 = foundCardLast4;
              hasUpdates = true;
              console.log(`  Found card_last4: ${foundCardLast4}`);
            }

            if (missingFields.includes('card_brand') && foundCardBrand) {
              rowUpdates.card_brand = foundCardBrand;
              hasUpdates = true;
              console.log(`  Found card_brand: ${foundCardBrand}`);
            }
          }

          // Fill missing application fee
          if (missingFields.includes('application_fee_amount')) {
            let foundApplicationFee = charge.application_fee_amount;

            // If not found, calculate 1% of amount
            if (!foundApplicationFee && charge.amount) {
              foundApplicationFee = Math.round(charge.amount * 0.01) / 100; // Convert to dollars
              console.log(`  Calculated application_fee_amount: ${foundApplicationFee} (1% of ${charge.amount / 100})`);
            } else if (foundApplicationFee) {
              foundApplicationFee = foundApplicationFee / 100; // Convert cents to dollars
              console.log(`  Found application_fee_amount: ${foundApplicationFee}`);
            }

            if (foundApplicationFee) {
              rowUpdates.application_fee_amount = foundApplicationFee;
              hasUpdates = true;
            }
          }

          // Apply updates to the sheet
          if (hasUpdates) {
            if (rowUpdates.order_number) {
              chargesSheet.getRange(i + 1, orderNumberIndex + 1).setValue(rowUpdates.order_number);
            }
            if (rowUpdates.card_last4) {
              chargesSheet.getRange(i + 1, cardLast4Index + 1).setValue(rowUpdates.card_last4);
            }
            if (rowUpdates.card_brand) {
              chargesSheet.getRange(i + 1, cardBrandIndex + 1).setValue(rowUpdates.card_brand);
            }
            if (rowUpdates.application_fee_amount) {
              chargesSheet.getRange(i + 1, applicationFeeIndex + 1).setValue(rowUpdates.application_fee_amount);
            }

            updates.push({
              row: i + 1,
              chargeId: chargeId,
              updates: rowUpdates
            });

            updatedCount++;
            console.log(`  ✅ Updated row ${i + 1}`);
          } else {
            console.log(`  ❌ No additional data found for row ${i + 1}`);
          }

        } catch (error) {
          console.error(`  Error processing row ${i + 1} (charge ${chargeId}):`, error.toString());
        }

        // Add delay to avoid rate limiting
        Utilities.sleep(200);
      }
    }

    console.log('\n=== BACKFILL SUMMARY ===');
    console.log(`Total rows processed: ${data.length - 1}`);
    console.log(`Rows updated: ${updatedCount}`);

    if (updates.length > 0) {
      console.log('\nUpdated rows:');
      updates.forEach(update => {
        const updateFields = Object.keys(update.updates).join(', ');
        console.log(`  Row ${update.row} (${update.chargeId}): ${updateFields}`);
      });
    }

    return {
      message: `Successfully backfilled ${updatedCount} rows`,
      totalProcessed: data.length - 1,
      updated: updatedCount,
      details: updates
    };

  } catch (error) {
    console.error('Error in backfill process:', error.toString());
    return {
      error: error.toString(),
      updated: 0
    };
  }
}

/**
 * Test function to find application fee information
 */
function testFindApplicationFee() {
  console.log('=== APPLICATION FEE SEARCH ===');

  const paymentIntentId = 'pi_3S8LUxGIItQPbBO719GgP9EZ';
  console.log(`Searching for application fee in Payment Intent: ${paymentIntentId}`);

  try {
    // Call the API to get full payment intent
    const fullPaymentIntent = getFullPaymentIntent(paymentIntentId);

    console.log('=== PAYMENT INTENT ANALYSIS ===');
    console.log('Amount:', fullPaymentIntent.amount);
    console.log('Amount in dollars:', (fullPaymentIntent.amount / 100));
    console.log('Currency:', fullPaymentIntent.currency);
    console.log('');

    // Search for application fee in various locations
    console.log('=== SEARCHING FOR APPLICATION FEE ===');

    // Check top-level application fee
    console.log('1. Top-level application_fee_amount:', fullPaymentIntent.application_fee_amount || 'NOT FOUND');

    // Check if there are any charges with application fees
    if (fullPaymentIntent.latest_charge) {
      console.log('2. Latest charge ID:', fullPaymentIntent.latest_charge);

      // Make separate API call to get charge details
      try {
        const apiKey = PropertiesService.getScriptProperties().getProperty('STRIPE_SECRET_KEY');
        const chargeResponse = UrlFetchApp.fetch(`https://api.stripe.com/v1/charges/${fullPaymentIntent.latest_charge}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });

        if (chargeResponse.getResponseCode() === 200) {
          const charge = JSON.parse(chargeResponse.getContentText());
          console.log('   Charge application_fee_amount:', charge.application_fee_amount || 'NOT FOUND');
          console.log('   Charge amount:', charge.amount);
          console.log('   Charge amount in dollars:', (charge.amount / 100));

          if (charge.application_fee_amount) {
            const feePercentage = ((charge.application_fee_amount / charge.amount) * 100).toFixed(2);
            console.log(`   Application fee percentage: ${feePercentage}%`);
          }
        }
      } catch (chargeError) {
        console.log('   Error fetching charge details:', chargeError.toString());
      }
    } else {
      console.log('2. No latest_charge found');
    }

    // Check transfer data for application fees
    if (fullPaymentIntent.transfer_data) {
      console.log('3. Transfer data found:');
      console.log('   Transfer data keys:', Object.keys(fullPaymentIntent.transfer_data));
      console.log('   Transfer amount:', fullPaymentIntent.transfer_data.amount || 'NOT FOUND');
    } else {
      console.log('3. No transfer_data found');
    }

    // Calculate expected 1% fee
    const expectedFee = Math.round(fullPaymentIntent.amount * 0.01);
    const expectedFeeInDollars = expectedFee / 100;

    console.log('');
    console.log('=== CALCULATED VALUES ===');
    console.log(`Expected 1% fee (cents): ${expectedFee}`);
    console.log(`Expected 1% fee (dollars): $${expectedFeeInDollars.toFixed(2)}`);

    // Compare with actual values
    let actualFee = fullPaymentIntent.application_fee_amount;
    if (!actualFee && fullPaymentIntent.latest_charge) {
      // Try to get from charge if available
      try {
        const apiKey = PropertiesService.getScriptProperties().getProperty('STRIPE_SECRET_KEY');
        const chargeResponse = UrlFetchApp.fetch(`https://api.stripe.com/v1/charges/${fullPaymentIntent.latest_charge}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });
        if (chargeResponse.getResponseCode() === 200) {
          const charge = JSON.parse(chargeResponse.getContentText());
          actualFee = charge.application_fee_amount;
        }
      } catch (error) {
        console.log('Could not fetch charge for fee comparison');
      }
    }

    console.log('');
    console.log('=== FINAL RESULT ===');
    if (actualFee) {
      const actualFeeInDollars = actualFee / 100;
      const actualPercentage = ((actualFee / fullPaymentIntent.amount) * 100).toFixed(2);
      console.log(`✅ FOUND: Application fee = ${actualFee} cents ($${actualFeeInDollars.toFixed(2)})`);
      console.log(`   Actual percentage: ${actualPercentage}%`);
      console.log(`   Expected: ${expectedFee} cents ($${expectedFeeInDollars.toFixed(2)})`);
      console.log(`   Match: ${actualFee === expectedFee ? 'YES' : 'NO'}`);
    } else {
      console.log('❌ NOT FOUND: No application fee found');
      console.log(`   Would expect: ${expectedFee} cents ($${expectedFeeInDollars.toFixed(2)}) for 1%`);
    }

    return {
      paymentIntentId: paymentIntentId,
      amount: fullPaymentIntent.amount,
      actualFee: actualFee,
      expectedFee: expectedFee,
      feeLocation: actualFee ? (fullPaymentIntent.application_fee_amount ? 'payment_intent' : 'charge') : null
    };

  } catch (error) {
    console.error('=== API CALL ERROR ===');
    console.error('Error retrieving Payment Intent:', error.toString());
    console.error('Stack trace:', error.stack);

    return {
      error: error.toString(),
      paymentIntentId: paymentIntentId
    };
  }
}
