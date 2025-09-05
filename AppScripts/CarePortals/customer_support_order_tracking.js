/**
 * Customer Support Order Tracking System
 * 
 * This script manages real-time order tracking across different status tabs
 * for customer support purposes. It receives webhooks from CarePortals when
 * orders are updated and maintains clean status tracking with race condition
 * protection and Eastern Time conversion.
 */

const SPREADSHEET_ID = '1h-ttn7R6s2KszovW_NvBI1x6fVUaXAjcID6-Xa0ISsw';
const TRACKING_STATUSES = ['pending', 'awaiting_payment', 'awaiting_requirements', 'awaiting_script', 'awaiting_shipment', 'processing'];
const FULL_LOG_TAB = 'full_log';

// Helper function to convert UTC datetime to Eastern Time
function convertToEasternTime(utcDateString) {
  if (!utcDateString) return new Date();
  
  try {
    const utcDate = new Date(utcDateString);
    // Convert to Eastern Time and return as Date object
    const easternTime = new Date(utcDate.toLocaleString("en-US", {
      timeZone: "America/New_York"
    }));
    return easternTime;
  } catch (error) {
    console.error("Error converting time:", error);
    return new Date(utcDateString);
  }
}

// Helper function to lookup product name from product dictionary
function lookupProductName(spreadsheet, productId) {
  try {
    console.log(`Looking up product name for ID: ${productId}`);
    
    if (!productId || productId === 'N/A') {
      console.log('No product ID provided, returning N/A');
      return 'N/A';
    }
    
    const sheet = spreadsheet.getSheetByName('product_dictionary');
    if (!sheet) {
      console.log('Product dictionary sheet not found, returning product ID');
      return productId; // Return the ID if dictionary doesn't exist
    }
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      console.log('Product dictionary sheet is empty, returning product ID');
      return productId;
    }
    
    // Look through all rows (skip header row)
    for (let i = 1; i < data.length; i++) {
      const rowProductId = String(data[i][0]); // Column A (product ID)
      const rowProductName = data[i][1]; // Column B (product name)
      
      if (rowProductId === String(productId)) {
        console.log(`Found product name: ${rowProductName} for ID: ${productId}`);
        return rowProductName || productId;
      }
    }
    
    console.log(`Product ID ${productId} not found in dictionary, returning ID`);
    return productId; // Return the ID if not found in dictionary
    
  } catch (error) {
    console.error('Error looking up product name:', error);
    return productId; // Return the ID if lookup fails
  }
}

function doPost(e) {
  try {
    console.log('=== WEBHOOK RECEIVED ===');
    console.log('Raw payload:', e.postData.contents);
    
    const orderData = JSON.parse(e.postData.contents);
    console.log('Parsed order data:', JSON.stringify(orderData, null, 2));
    
    const result = processOrderUpdate(orderData);
    console.log('Processing result:', result);
    
    return ContentService
      .createTextOutput(JSON.stringify({success: true, result: result}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('=== ERROR IN DOPOST ===');
    console.error('Error details:', error);
    console.error('Stack trace:', error.stack);
    return ContentService
      .createTextOutput(JSON.stringify({success: false, error: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function processOrderUpdate(orderData) {
  try {
    console.log('=== PROCESSING ORDER UPDATE ===');
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    console.log('Spreadsheet opened successfully');
    
    // Extract order information with new fields
    const orderInfo = extractOrderInfo(orderData, spreadsheet);
    console.log('Extracted order info:', JSON.stringify(orderInfo, null, 2));
    
    // Always add to full_log
    console.log('Adding to full_log...');
    addToFullLog(spreadsheet, orderInfo);
    
    // Remove existing entries from all tracking tabs (only if this entry is more recent)
    console.log('Checking and removing outdated entries from tracking tabs...');
    removeFromAllTrackingTabs(spreadsheet, orderInfo.orderNumber, orderInfo.lastUpdate);
    
    // Add to appropriate tracking tab if status matches
    if (TRACKING_STATUSES.includes(orderInfo.status)) {
      console.log(`Adding to ${orderInfo.status} tracking tab...`);
      addToTrackingTab(spreadsheet, orderInfo);
    } else {
      console.log(`Status "${orderInfo.status}" is not tracked, skipping tracking tab addition`);
    }
    
    return {
      orderId: orderInfo.orderId,
      orderNumber: orderInfo.orderNumber,
      status: orderInfo.status,
      processed: true
    };
    
  } catch (error) {
    console.error('=== ERROR IN PROCESS ORDER UPDATE ===');
    console.error('Error:', error);
    throw error;
  }
}

function extractOrderInfo(orderData, spreadsheet) {
  try {
    console.log('Raw order data keys:', Object.keys(orderData));
    
    // Get product ID and lookup product name from dictionary
    const productId = orderData.productId || 'N/A';
    console.log('Extracted product ID:', productId);
    
    const product = lookupProductName(spreadsheet, productId);
    console.log('Looked up product name:', product);
    
    // Extract pharmacy from assignedTo firstName + lastName
    let pharmacy = 'N/A';
    const assignedFirstName = orderData['assignedTo.firstName'] || '';
    const assignedLastName = orderData['assignedTo.lastName'] || '';
    if (assignedFirstName || assignedLastName) {
      pharmacy = `${assignedFirstName} ${assignedLastName}`.trim();
    }
    console.log('Extracted pharmacy:', pharmacy);
    
    // Create EMR Profile link - using flat field name
    const customerId = orderData['customer._id'];
    const emrProfile = customerId 
      ? `https://emr.portals.care/customers/${customerId}?tab=orders`
      : 'N/A';
    console.log('EMR Profile:', emrProfile);
    
    // Extract customer name - using flat field names
    const firstName = orderData['customer.firstName'] || '';
    const lastName = orderData['customer.lastName'] || '';
    const customerName = `${firstName} ${lastName}`.trim() || 'N/A';
    console.log('Customer name:', customerName);
    
    // Extract state from clean field
    const state = orderData.state || 'N/A';
    console.log('Extracted state from state field:', state);
    
    // Handle dates properly - convert to Eastern Time
    let createdDate = convertToEasternTime(orderData.createdAt);
    let lastUpdate = convertToEasternTime(orderData.updatedAt);
    
    console.log('Created date (ET):', createdDate);
    console.log('Last update (ET):', lastUpdate);
    
    const orderInfo = {
      orderId: orderData._id || 'N/A',
      orderNumber: orderData.id || 'N/A',
      product: product,
      totalAmount: orderData.totalAmount || 0,
      customerName: customerName,
      createdDate: createdDate,
      lastUpdate: lastUpdate,
      status: orderData.status || 'unknown',
      state: state,
      pharmacy: pharmacy,
      emrProfile: emrProfile
    };
    
    console.log('Final order info extracted:', JSON.stringify(orderInfo, null, 2));
    return orderInfo;
    
  } catch (error) {
    console.error('Error extracting order info:', error);
    console.error('Stack trace:', error.stack);
    throw error;
  }
}

function addToFullLog(spreadsheet, orderInfo) {
  try {
    console.log(`Getting/creating ${FULL_LOG_TAB} sheet...`);
    const sheet = getOrCreateSheet(spreadsheet, FULL_LOG_TAB);
    
    // Ensure headers exist with new column structure
    if (sheet.getLastRow() === 0) {
      console.log('Adding headers to full_log sheet...');
      sheet.getRange(1, 1, 1, 10).setValues([[
        'Order #', 'Product', 'Total Amount', 'Name', 'Created Date', 'Last Update', 'Status', 'State', 'Pharmacy', 'EMR Profile'
      ]]);
    }
    
    // Add new entry
    const rowData = [
      orderInfo.orderNumber,
      orderInfo.product,
      orderInfo.totalAmount,
      orderInfo.customerName,
      orderInfo.createdDate,
      orderInfo.lastUpdate,
      orderInfo.status,
      orderInfo.state,
      orderInfo.pharmacy,
      orderInfo.emrProfile
    ];
    
    console.log('Adding row to full_log:', JSON.stringify(rowData));
    sheet.appendRow(rowData);
    console.log('Successfully added to full_log');
    
  } catch (error) {
    console.error('Error adding to full_log:', error);
    throw error;
  }
}

function addToTrackingTab(spreadsheet, orderInfo) {
  try {
    console.log(`Getting/creating ${orderInfo.status} sheet...`);
    const sheet = getOrCreateSheet(spreadsheet, orderInfo.status);
    
    // Ensure headers exist with new column structure
    if (sheet.getLastRow() === 0) {
      console.log(`Adding headers to ${orderInfo.status} sheet...`);
      sheet.getRange(1, 1, 1, 10).setValues([[
        'Order #', 'Product', 'Total Amount', 'Name', 'Created Date', 'Last Update', 'Status', 'State', 'Pharmacy', 'EMR Profile'
      ]]);
    }
    
    // Add new entry
    const rowData = [
      orderInfo.orderNumber,
      orderInfo.product,
      orderInfo.totalAmount,
      orderInfo.customerName,
      orderInfo.createdDate,
      orderInfo.lastUpdate,
      orderInfo.status,
      orderInfo.state,
      orderInfo.pharmacy,
      orderInfo.emrProfile
    ];
    
    console.log(`Adding row to ${orderInfo.status}:`, JSON.stringify(rowData));
    sheet.appendRow(rowData);
    console.log(`Successfully added to ${orderInfo.status} tab`);
    
  } catch (error) {
    console.error(`Error adding to ${orderInfo.status} tab:`, error);
    throw error;
  }
}

function removeFromAllTrackingTabs(spreadsheet, orderNumber, newLastUpdate) {
  console.log(`Checking entries for order # ${orderNumber} in all tracking tabs...`);
  console.log(`New entry last update:`, newLastUpdate);
  
  TRACKING_STATUSES.forEach(status => {
    try {
      console.log(`Checking ${status} tab for existing entries...`);
      const sheet = spreadsheet.getSheetByName(status);
      if (!sheet) {
        console.log(`Sheet ${status} does not exist, skipping...`);
        return;
      }
      
      const data = sheet.getDataRange().getValues();
      if (data.length <= 1) {
        console.log(`Sheet ${status} has no data rows, skipping...`);
        return; // Only headers or empty
      }
      
      let removedCount = 0;
      let skippedCount = 0;
      
      // Find rows with matching Order # (column 0) and compare timestamps
      // Convert both to strings for comparison since Excel might store as number
      for (let i = data.length - 1; i >= 1; i--) {
        if (String(data[i][0]) === String(orderNumber)) {
          const existingLastUpdate = data[i][5]; // Last Update is column 5 (0-indexed)
          console.log(`Found existing entry in ${status} tab - existing lastUpdate:`, existingLastUpdate);
          
          try {
            // Convert both dates to timestamps for comparison
            const existingTime = new Date(existingLastUpdate).getTime();
            const newTime = new Date(newLastUpdate).getTime();
            
            if (newTime > existingTime) {
              // New entry is more recent, remove existing entry
              console.log(`Removing row ${i + 1} from ${status} tab (new entry is more recent)`);
              sheet.deleteRow(i + 1);
              removedCount++;
            } else {
              // Existing entry is more recent or same time, keep it
              console.log(`Keeping row ${i + 1} in ${status} tab (existing entry is more recent or same time)`);
              skippedCount++;
            }
          } catch (dateError) {
            console.error(`Error comparing dates for row ${i + 1}:`, dateError);
            // If we can't compare dates, remove the existing entry to be safe
            console.log(`Removing row ${i + 1} from ${status} tab (date comparison failed)`);
            sheet.deleteRow(i + 1);
            removedCount++;
          }
        }
      }
      
      console.log(`${status} tab: removed ${removedCount} entries, kept ${skippedCount} more recent entries`);
      
    } catch (error) {
      console.error(`Error processing ${status} tab:`, error);
    }
  });
}

function getOrCreateSheet(spreadsheet, sheetName) {
  try {
    console.log(`Looking for sheet: ${sheetName}`);
    let sheet = spreadsheet.getSheetByName(sheetName);
    
    if (!sheet) {
      console.log(`Sheet ${sheetName} not found, creating it...`);
      sheet = spreadsheet.insertSheet(sheetName);
      console.log(`Successfully created sheet: ${sheetName}`);
    } else {
      console.log(`Found existing sheet: ${sheetName}`);
    }
    
    return sheet;
    
  } catch (error) {
    console.error(`Error getting/creating sheet ${sheetName}:`, error);
    throw error;
  }
}

function testWithSampleData() {
  const sampleOrder = {
    "_id": "7893efc2581fe0505d48c681",
    "id": 9876,
    "customer.firstName": "Jane",
    "customer.lastName": "Doe",
    "customer._id": "7820cf7b9fdd8c7aae179818",
    "status": "pending",
    "createdAt": "2024-07-25T10:00:00.000Z",
    "updatedAt": "2024-07-25T10:05:00.000Z",
    "state": "NY",
    "productId": "778e289d7ea1698a8757aa44",
    "totalAmount": 99.50,
    "assignedTo.firstName": "CityCentral",
    "assignedTo.lastName": "Pharmacy"
  };
  
  processOrderUpdate(sampleOrder);
  console.log('Test completed');
}