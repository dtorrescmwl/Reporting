// Helper function to convert UTC datetime to Eastern Time (handles EST/EDT automatically)
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

// Helper function to get current Eastern Time (when webhook is received)
function getCurrentEasternTime() {
  const now = new Date();
  return now.toLocaleString("en-US", {
    timeZone: "America/New_York",
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

// Helper function to get or create sheet
function getOrCreateSheet(spreadsheet, sheetName) {
  let sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
    console.log(`Created new sheet: ${sheetName}`);
  }
  return sheet;
}

// Helper function to setup sheet headers
function setupSheetHeaders(sheet, headers) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#4a90e2");
    headerRange.setFontColor("#ffffff");
    return true;
  }
  return false;
}

// Function to remove existing subscription from all status tabs (except full_log)
function removeFromStatusTabs(spreadsheet, subscriptionId) {
  const statusTabs = ['subscription.active', 'subscription.paused', 'subscription.cancelled'];
  let removedFrom = [];
  
  statusTabs.forEach(tabName => {
    const sheet = getOrCreateSheet(spreadsheet, tabName);
    if (sheet.getLastRow() <= 1) return; // No data rows
    
    // Get all data
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    // Find SubscriptionID column (should be column A based on our headers)
    const subscriptionIdCol = 0;
    
    // Find rows to delete (in reverse order to avoid index issues)
    const rowsToDelete = [];
    for (let i = data.length - 1; i >= 1; i--) {
      if (data[i][subscriptionIdCol] === subscriptionId) {
        rowsToDelete.push(i + 1); // +1 because sheet rows are 1-indexed
        removedFrom.push(tabName);
      }
    }
    
    // Delete rows
    rowsToDelete.forEach(rowIndex => {
      sheet.deleteRow(rowIndex);
    });
  });
  
  if (removedFrom.length > 0) {
    console.log(`Removed subscription ${subscriptionId} from: ${removedFrom.join(', ')}`);
  }
  
  return removedFrom;
}

// Main webhook processing function
function doPost(e) {
  try {
    // Get the specific spreadsheet by ID (Database CarePortals)
    const spreadsheet = SpreadsheetApp.openById("1PaCOgNJmKSb2VsJjCMjWpCG-gwrO7uVkuTAFUdrV-_o");
    
    // Parse the incoming JSON data
    const data = JSON.parse(e.postData.contents);
    
    // Get the trigger type from URL parameter
    const triggerType = e.parameter.trigger || "active"; // Default to active if not specified
    
    console.log(`Processing subscription webhook with trigger: ${triggerType}`);
    console.log(`Subscription ID: ${data._id}, Status: ${data.status}`);
    
    // Define headers for subscription sheets
    const subscriptionHeaders = [
      "SubscriptionID",
      "CustomerID", 
      "ProductID",
      "Cycle",
      "Status",
      "Datetime Created",
      "Last Updated"
    ];
    
    // Define headers for full log sheet  
    const fullLogHeaders = [
      "Datetime Received",
      "Trigger Type",
      "SubscriptionID",
      "CustomerID",
      "ProductID", 
      "Cycle",
      "Status",
      "Datetime Created",
      "Last Updated",
      "Raw Data"
    ];
    
    // Prepare the subscription data
    const subscriptionData = [
      data._id || "",                                    // SubscriptionID
      data["customer._id"] || "",                        // CustomerID
      data["product._id"] || "",                         // ProductID
      data.currentCycle || "",                           // Cycle
      data.status || "",                                 // Status
      convertToEasternTime(data.createdAt),              // Datetime Created (ET)
      convertToEasternTime(data.updatedAt)               // Last Updated (ET)
    ];
    
    // Prepare full log data
    const fullLogData = [
      getCurrentEasternTime(),                           // Datetime Received
      triggerType,                                       // Trigger Type
      data._id || "",                                    // SubscriptionID
      data["customer._id"] || "",                        // CustomerID
      data["product._id"] || "",                         // ProductID
      data.currentCycle || "",                           // Cycle
      data.status || "",                                 // Status
      convertToEasternTime(data.createdAt),              // Datetime Created (ET)
      convertToEasternTime(data.updatedAt),              // Last Updated (ET)
      JSON.stringify(data)                               // Raw Data
    ];
    
    // Always add to full log first
    const fullLogSheet = getOrCreateSheet(spreadsheet, "subscription.full_log");
    setupSheetHeaders(fullLogSheet, fullLogHeaders);
    fullLogSheet.appendRow(fullLogData);
    console.log("Added entry to subscription.full_log");
    
    // Remove subscription from all status tabs before adding to new one
    const removedFrom = removeFromStatusTabs(spreadsheet, data._id);
    
    // Determine which status tab to add to based on trigger
    let targetTab = "";
    switch (triggerType) {
      case "active":
        targetTab = "subscription.active";
        break;
      case "paused": 
        targetTab = "subscription.paused";
        break;
      case "cancelled":
        targetTab = "subscription.cancelled";
        break;
      default:
        // Default to active for unknown triggers (covers subscription.created)
        targetTab = "subscription.active";
        console.log(`Unknown trigger type: ${triggerType}, defaulting to active tab`);
    }
    
    // Add to the appropriate status tab
    const statusSheet = getOrCreateSheet(spreadsheet, targetTab);
    setupSheetHeaders(statusSheet, subscriptionHeaders);
    statusSheet.appendRow(subscriptionData);
    console.log(`Added subscription to ${targetTab} tab`);
    
    // Auto-resize columns for all updated sheets
    const sheetsToResize = [fullLogSheet, statusSheet];
    sheetsToResize.forEach(sheet => {
      if (sheet && sheet.getLastColumn() > 0) {
        sheet.autoResizeColumns(1, sheet.getLastColumn());
      }
    });
    
    // Log success
    console.log(`Subscription webhook processed successfully: ${data._id}`);
    
    // Return success response
    return ContentService
      .createTextOutput(JSON.stringify({
        result: 'success',
        message: 'Subscription data processed successfully',
        subscriptionId: data._id,
        trigger: triggerType,
        targetTab: targetTab,
        removedFrom: removedFrom
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    // Log error for debugging
    console.error("Error processing subscription webhook:", error);
    
    // Try to log the error to sheet
    try {
      const spreadsheet = SpreadsheetApp.openById("1PaCOgNJmKSb2VsJjCMjWpCG-gwrO7uVkuTAFUdrV-_o");
      let errorSheet = getOrCreateSheet(spreadsheet, "Subscription_Errors");
      if (errorSheet.getLastRow() === 0) {
        errorSheet.appendRow(["Timestamp", "Error Type", "Error Message", "Raw Data", "Trigger"]);
        const headerRange = errorSheet.getRange(1, 1, 1, 5);
        headerRange.setFontWeight("bold");
        headerRange.setBackground("#ff4444");
        headerRange.setFontColor("#ffffff");
      }
      errorSheet.appendRow([
        getCurrentEasternTime(),
        "SUBSCRIPTION_WEBHOOK_ERROR",
        error.toString(),
        e.postData ? e.postData.contents : "No data",
        e.parameter.trigger || "unknown"
      ]);
    } catch (logError) {
      console.error("Could not log error to sheet:", logError);
    }
    
    // Return error response
    return ContentService
      .createTextOutput(JSON.stringify({
        result: 'error',
        message: error.toString(),
        trigger: e.parameter.trigger || "unknown"
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Test function for subscription webhook (for testing in Apps Script editor)
function testSubscriptionWebhook() {
  console.log("Starting subscription webhook test...");
  
  // Create test data that matches the expected subscription webhook format
  const testData = {
    "_id": "test_subscription_123456789",
    "organization": "cmwl",
    "customer": {
      "_id": "test_customer_123456789",
      "email": "test@example.com",
      "phone": "+15551234567",
      "firstName": "Test",
      "lastName": "User"
    },
    "product": "test_product_123456789",
    "phases": [
      {
        "price": 349,
        "cycles": "1",
        "requirements": []
      }
    ],
    "currentCycle": 1,
    "nextCycleDate": "2025-02-15T18:21:14.150Z",
    "status": "active",
    "currency": "USD",
    "createdAt": "2025-01-15T15:30:00Z",
    "updatedAt": "2025-01-15T15:30:00Z",
    "__v": 0
  };
  
  // Simulate the webhook call with active trigger
  const mockEvent = {
    postData: {
      contents: JSON.stringify(testData)
    },
    parameter: {
      trigger: "active"
    }
  };
  
  const result = doPost(mockEvent);
  console.log("Test completed! Response:", result.getContent());
  console.log("Check your Database CarePortals spreadsheet - you should see new entries in subscription.active and subscription.full_log");
}

// Function to clear all subscription data except headers (useful for testing)
function clearSubscriptionData() {
  const spreadsheet = SpreadsheetApp.openById("1PaCOgNJmKSb2VsJjCMjWpCG-gwrO7uVkuTAFUdrV-_o");
  const sheetNames = ["subscription.active", "subscription.paused", "subscription.cancelled", "subscription.full_log"];
  
  sheetNames.forEach(sheetName => {
    const sheet = getOrCreateSheet(spreadsheet, sheetName);
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.deleteRows(2, lastRow - 1);
      console.log(`Cleared data from ${sheetName}, keeping headers`);
    } else {
      console.log(`No data rows to clear in ${sheetName}`);
    }
  });
}