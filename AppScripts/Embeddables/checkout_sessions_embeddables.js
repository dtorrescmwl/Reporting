// Handle GET requests (for browser testing)
function doGet(e) {
  return ContentService
    .createTextOutput('Checkout Button Webhook is running! Use POST to submit checkout data.')
    .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  try {
    // Parse the incoming data
    const submissionData = JSON.parse(e.postData.contents);
    
    // Open your Google Sheet - CHECKOUT SESSIONS SHEET
    const sheet = SpreadsheetApp.openById('1WVklvRZZqiVtVdD64IDm-vPSSvx-lv6QdXN9V8HC7hI')
      .getSheetByName('checkout.sessions');
    
    // Check if headers exist, if not create them
    if (sheet.getLastRow() === 0) {
      setupCheckoutHeaders();
    }
    
    // Helper function to safely get string values
    const safeString = (value) => {
      if (value === null || value === undefined) return '';
      if (typeof value === 'object') return JSON.stringify(value);
      return String(value);
    };
    
    // Add the checkout data to your sheet in the EXACT order specified
    sheet.appendRow([
      safeString(submissionData.submission_timestamp), // Submission Timestamp
      safeString(submissionData.entryId), // Entry ID
      safeString(submissionData.cart_launched), // Cart Launched - accepts ANY string from frontend
      new Date(), // Timestamp Submitted (added by Apps Script)
    ]);
    
    // Return success response
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true, 
        message: 'Checkout data received and added to sheet',
        entryId: submissionData.entryId,
        cartType: submissionData.cart_launched,
        sheetType: 'checkout'
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    // Return error response
    return ContentService
      .createTextOutput(JSON.stringify({
        error: error.toString(),
        message: 'Failed to process checkout submission'
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Function to set up column headers for checkout sheet (run this once or automatically)
function setupCheckoutHeaders() {
  const sheet = SpreadsheetApp.openById('1WVklvRZZqiVtVdD64IDm-vPSSvx-lv6QdXN9V8HC7hI')
    .getSheetByName('checkout.sessions');
  
  // Headers in the EXACT order specified
  const headers = [
    'Submission Timestamp',
    'Entry ID',
    'Cart Launched',
    'Timestamp Webhook Received', // Added by Apps Script    
  ];
  
  // Add headers to the sheet
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Format headers
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.getRange(1, 1, 1, headers.length).setBackground('#f0f0f0');
}

// Enhanced test function to verify your checkout setup
function testCheckoutWebhook() {
  const testData = {
    entryId: 'checkout-test-' + new Date().getTime(),
    cart_launched: 'Tirzepatide Monthly', // Just a test value
    submission_timestamp: new Date().toISOString().replace('T', ' ').split('.')[0]
  };
  
  const testEvent = {
    postData: {
      contents: JSON.stringify(testData)
    },
    parameter: {}
  };
  
  const result = doPost(testEvent);
  console.log('Test result:', result.getContent());
}

// Helper function to check if sheet exists and create it if it doesn't
function ensureSheetExists() {
  const spreadsheet = SpreadsheetApp.openById('1WVklvRZZqiVtVdD64IDm-vPSSvx-lv6QdXN9V8HC7hI');
  let sheet = spreadsheet.getSheetByName('checkout.sessions');
  
  if (!sheet) {
    sheet = spreadsheet.insertSheet('checkout.sessions');
  }
  
  // Set up headers if the sheet is empty
  if (sheet.getLastRow() === 0) {
    setupCheckoutHeaders();
  }
  
  return sheet;
}

function unmergeAll() {
  var sheet = SpreadsheetApp.getActiveSheet();
  var range = sheet.getDataRange();
  range.breakApart();
}