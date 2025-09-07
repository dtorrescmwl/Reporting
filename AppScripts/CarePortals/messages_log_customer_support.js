/**
 * Messages Log Customer Support System
 * 
 * This script receives message webhooks from CarePortals and logs them
 * to the messages.log tab in the Customer_Support spreadsheet for
 * customer support tracking and communication history.
 */

const SPREADSHEET_ID = '1h-ttn7R6s2KszovW_NvBI1x6fVUaXAjcID6-Xa0ISsw';
const MESSAGES_LOG_TAB = 'messages.log';

// Helper function to convert UTC datetime to Eastern Time
function convertToEasternTime(utcDateString) {
  if (!utcDateString) return "";
  
  try {
    const utcDate = new Date(utcDateString);
    const easternTime = utcDate.toLocaleString("en-US", {
      timeZone: "America/New_York",
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    return easternTime;
  } catch (error) {
    console.error("Error converting time:", error);
    return utcDateString;
  }
}

// Helper function to lookup customer name from customer dictionary
function lookupCustomerName(spreadsheet, customerId) {
  try {
    console.log(`Looking up customer name for ID: ${customerId}`);
    
    if (!customerId || customerId === 'N/A') {
      console.log('No customer ID provided, returning N/A');
      return 'N/A';
    }
    
    const sheet = spreadsheet.getSheetByName('customer_dictionary');
    if (!sheet) {
      console.log('Customer dictionary sheet not found, returning customer ID');
      return customerId; // Return the ID if dictionary doesn't exist
    }
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      console.log('Customer dictionary sheet is empty, returning customer ID');
      return customerId;
    }
    
    // Look through all rows (skip header row)
    for (let i = 1; i < data.length; i++) {
      const rowCustomerId = String(data[i][0]); // Column A (customer ID)
      const rowCustomerName = data[i][1]; // Column B (customer name)
      
      if (rowCustomerId === String(customerId)) {
        console.log(`Found customer name: ${rowCustomerName} for ID: ${customerId}`);
        return rowCustomerName || customerId;
      }
    }
    
    console.log(`Customer ID ${customerId} not found in dictionary, returning ID`);
    return customerId; // Return the ID if not found in dictionary
    
  } catch (error) {
    console.error('Error looking up customer name:', error);
    return customerId; // Return the ID if lookup fails
  }
}

// Helper function to find customer ID from customer name (reverse lookup)
function findCustomerId(spreadsheet, customerName) {
  try {
    console.log(`Looking up customer ID for name: ${customerName}`);
    
    if (!customerName || customerName === 'N/A') {
      console.log('No customer name provided, returning null');
      return null;
    }
    
    const sheet = spreadsheet.getSheetByName('customer_dictionary');
    if (!sheet) {
      console.log('Customer dictionary sheet not found, returning null');
      return null;
    }
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      console.log('Customer dictionary sheet is empty, returning null');
      return null;
    }
    
    // Look through all rows (skip header row)
    for (let i = 1; i < data.length; i++) {
      const rowCustomerId = String(data[i][0]); // Column A (customer ID)
      const rowCustomerName = String(data[i][1]); // Column B (customer name)
      
      if (rowCustomerName === String(customerName)) {
        console.log(`Found customer ID: ${rowCustomerId} for name: ${customerName}`);
        return rowCustomerId;
      }
    }
    
    console.log(`Customer name ${customerName} not found in dictionary, returning null`);
    return null; // Return null if not found in dictionary
    
  } catch (error) {
    console.error('Error looking up customer ID:', error);
    return null;
  }
}

// Helper function to create EMR Profile link
function createEMRProfile(customerId) {
  if (!customerId || customerId === 'N/A') {
    return 'N/A';
  }
  return `https://emr.portals.care/customers/${customerId}?tab=orders`;
}

// Helper function to get or create sheet
function getOrCreateSheet(spreadsheet, sheetName) {
  try {
    console.log(`Looking for sheet: ${sheetName}`);
    let sheet = spreadsheet.getSheetByName(sheetName);
    
    if (!sheet) {
      console.log(`Sheet ${sheetName} not found, creating it...`);
      sheet = spreadsheet.insertSheet(sheetName);
      
      // Add headers for messages.log
      if (sheetName === MESSAGES_LOG_TAB) {
        const headers = ['Date Received', 'Name', 'Message', 'EMR Profile'];
        sheet.appendRow(headers);
        
        // Format headers
        const headerRange = sheet.getRange(1, 1, 1, headers.length);
        headerRange.setFontWeight('bold');
        headerRange.setBackground('#4a90e2');
        headerRange.setFontColor('#ffffff');
        
        console.log(`Added headers to ${sheetName} sheet`);
      }
      
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

function doPost(e) {
  try {
    console.log('=== MESSAGE WEBHOOK RECEIVED ===');
    console.log('Raw payload:', e.postData.contents);
    
    const messageData = JSON.parse(e.postData.contents);
    console.log('Parsed message data:', JSON.stringify(messageData, null, 2));
    
    const result = processMessage(messageData);
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

function processMessage(messageData) {
  try {
    console.log('=== PROCESSING MESSAGE ===');
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    console.log('Spreadsheet opened successfully');
    
    // Extract message information
    const messageInfo = extractMessageInfo(messageData, spreadsheet);
    console.log('Extracted message info:', JSON.stringify(messageInfo, null, 2));
    
    // Add to messages.log tab
    console.log('Adding to messages.log tab...');
    addToMessagesLog(spreadsheet, messageInfo);
    
    return {
      messageId: messageInfo.messageId,
      customerName: messageInfo.customerName,
      processed: true
    };
    
  } catch (error) {
    console.error('=== ERROR IN PROCESS MESSAGE ===');
    console.error('Error:', error);
    throw error;
  }
}

function extractMessageInfo(messageData, spreadsheet) {
  try {
    console.log('Raw message data keys:', Object.keys(messageData));
    
    // Use the customer field (this contains the actual name like "Chauncey Billups")
    const customerData = messageData.customer || 'N/A';
    console.log('Customer data:', customerData);
    
    let customerName = 'N/A';
    let customerId = null;
    let emrProfile = 'N/A';
    
    // If customer field contains a name (like "Chauncey Billups"), use it directly
    if (customerData && customerData !== 'N/A') {
      // Check if it looks like an ID (long alphanumeric string) or a name
      if (customerData.length > 20 && /^[a-f0-9]+$/i.test(customerData)) {
        // It's an ID, look up the name
        customerId = customerData;
        customerName = lookupCustomerName(spreadsheet, customerId);
        emrProfile = createEMRProfile(customerId);
      } else {
        // It's already a name, use it directly
        customerName = customerData;
        // Try to find the corresponding customer ID in the dictionary for EMR link
        customerId = findCustomerId(spreadsheet, customerName);
        emrProfile = createEMRProfile(customerId);
      }
    }
    
    console.log('Customer Name:', customerName);
    console.log('Customer ID:', customerId);
    console.log('EMR Profile:', emrProfile);
    
    // Convert timestamp to Eastern Time
    const timeET = convertToEasternTime(messageData.createdAt);
    console.log('Time (ET):', timeET);
    
    // Extract message content
    const content = messageData.content || 'N/A';
    console.log('Content:', content);
    
    const messageInfo = {
      messageId: messageData._id || 'N/A',
      timeET: timeET,
      customerName: customerName,
      customerId: customerId,
      content: content,
      emrProfile: emrProfile
    };
    
    console.log('Final message info extracted:', JSON.stringify(messageInfo, null, 2));
    return messageInfo;
    
  } catch (error) {
    console.error('Error extracting message info:', error);
    throw error;
  }
}

function addToMessagesLog(spreadsheet, messageInfo) {
  try {
    console.log('Adding message to messages.log tab');
    
    const sheet = getOrCreateSheet(spreadsheet, MESSAGES_LOG_TAB);
    
    const rowData = [
      messageInfo.timeET,
      messageInfo.customerName,
      messageInfo.content,
      messageInfo.emrProfile
    ];
    
    console.log('Row data to add:', rowData);
    sheet.appendRow(rowData);
    
    // Auto-resize columns to fit content
    sheet.autoResizeColumns(1, rowData.length);
    
    console.log('Successfully added message to messages.log');
    
  } catch (error) {
    console.error('Error adding to messages.log:', error);
    throw error;
  }
}

// Test function for message webhook (for testing in Apps Script editor)
function testMessageWebhook() {
  console.log("Starting message webhook test...");
  
  // Create test data that matches the expected message webhook format
  const testData = {
    "channel": "WEB",
    "inbound": true,
    "customer": "Chauncey Billups", // Using actual customer name format
    "contact": {
      "email": "chauncey@example.com"
    },
    "content": "This is a sample message test.",
    "subject": "Inbox inbound message",
    "status": "pending",
    "_id": "69123456a789b0123456c1d2",
    "createdAt": "2024-07-15T10:30:45.123Z",
    "updatedAt": "2024-07-15T10:30:45.123Z",
    "__v": 0
  };
  
  // Simulate the webhook call
  const mockEvent = {
    postData: {
      contents: JSON.stringify(testData)
    }
  };
  
  const result = doPost(mockEvent);
  console.log("Test completed! Response:", result.getContent());
  console.log("Check your Customer_Support spreadsheet - you should see a new entry in messages.log");
}