function doPost(e) {
  try {
    // Get the specific spreadsheet by ID and sheet
    const spreadsheet = SpreadsheetApp.openById("1J62EOn9OXZzFpqcyw4egfjZe72gOpYJPohApUPmtoKM");
    const sheet = spreadsheet.getSheetByName("subscription.cancelled");
    
    // Parse the incoming JSON data
    const data = JSON.parse(e.postData.contents);
    
    // Check if headers exist, if not add them
    if (sheet.getLastRow() === 0) {
      const headers = [
        "Datetime Received",
        "EMR Profile",
        "First Name",
        "Last Name",
        "Email",
        "Phone",
        "EMR ID",
        "CRM ID",
        "Subscription ID"
      ];
      sheet.appendRow(headers);
      
      // Format header row
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#4a90e2");
      headerRange.setFontColor("#ffffff");
    }
    
    // Prepare the row data in the same order as headers
    const rowData = [
      new Date().toLocaleString("en-US", {
        timeZone: "America/New_York",
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }),
      data["customer._id"] ? `https://emr.portals.care/customers/${data["customer._id"]}?tab=orders` : "",
      data["customer.firstName"] || "",
      data["customer.lastName"] || "",
      data["customer.email"] || "",
      data["customer.phone"] || "",
      data._id || "",
      data["customer._id"] || "",
      data.id || ""
    ];
    
    // Append the data to the sheet
    sheet.appendRow(rowData);
    
    // Auto-resize columns for better readability (optional - comment out if performance is a concern)
    sheet.autoResizeColumns(1, sheet.getLastColumn());
    
    // Log success
    console.log("Subscription cancellation webhook data added successfully:", data._id || data.id);
    
    // Return success response
    return ContentService
      .createTextOutput(JSON.stringify({
        result: 'success',
        message: 'Data added to subscription.cancelled sheet',
        id: data._id || data.id
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    // Log error for debugging
    console.error("Error processing subscription webhook:", error);
    
    // Try to log the raw data for debugging
    try {
      const spreadsheet = SpreadsheetApp.openById("1J62EOn9OXZzFpqcyw4egfjZe72gOpYJPohApUPmtoKM");
      let errorSheet = spreadsheet.getSheetByName("Webhook_Errors");
      if (!errorSheet) {
        errorSheet = spreadsheet.insertSheet("Webhook_Errors");
      }
      errorSheet.appendRow([
        new Date().toLocaleString("en-US", {timeZone: "America/New_York"}),
        "SUBSCRIPTION_WEBHOOK_ERROR",
        error.toString(),
        e.postData ? e.postData.contents : "No data"
      ]);
    } catch (logError) {
      console.error("Could not log error to sheet:", logError);
    }
    
    // Return error response
    return ContentService
      .createTextOutput(JSON.stringify({
        result: 'error',
        message: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Test function to simulate webhook (for testing in Apps Script editor)
function testSubscriptionWebhook() {
  // Get the specific spreadsheet by ID and sheet
  const spreadsheet = SpreadsheetApp.openById("1J62EOn9OXZzFpqcyw4egfjZe72gOpYJPohApUPmtoKM");
  const sheet = spreadsheet.getSheetByName("subscription.cancelled");
  
  // Check if headers exist, if not add them
  if (sheet.getLastRow() === 0) {
    const headers = [
      "Datetime Received",
      "EMR Profile",
      "First Name",
      "Last Name",
      "Email",
      "Phone",
      "EMR ID",
      "CRM ID",
      "Subscription ID"
    ];
    sheet.appendRow(headers);
    
    // Format header row
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#4a90e2");
    headerRange.setFontColor("#ffffff");
  }
  
  // Create test data based on the fields we know have values
  const testData = {
    "_id": "6892461a5993f44d2acad168",
    "organization": "cmwl",
    "id": "1662",
    "status": "cancelled",
    "customer.firstName": "Mike",
    "customer.lastName": "Anderson",
    "customer.email": "manderson70@hotmail.com",
    "customer.phone": "+13199314295",
    "customer._id": "68913d6be9aa57a7f37ae92e"
  };
  
  // Prepare the row data in the same order as headers
  const rowData = [
    new Date().toLocaleString("en-US", {
      timeZone: "America/New_York",
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }),
    testData["customer._id"] ? `https://emr.portals.care/customers/${testData["customer._id"]}?tab=orders` : "",
    testData["customer.firstName"] || "",
    testData["customer.lastName"] || "",
    testData["customer.email"] || "",
    testData["customer.phone"] || "",
    testData._id || "",
    testData["customer._id"] || "",
    testData.id || ""
  ];
  
  // Append the test data to the sheet
  sheet.appendRow(rowData);
  
  // Auto-resize columns for better readability
  sheet.autoResizeColumns(1, sheet.getLastColumn());
  
  console.log("Test subscription cancellation data added successfully!");
  console.log("Check your 'subscription.cancelled' sheet - you should see a new row with test data");
}

// Function to clear all data except headers (useful for testing)
function clearSubscriptionData() {
  const spreadsheet = SpreadsheetApp.openById("1J62EOn9OXZzFpqcyw4egfjZe72gOpYJPohApUPmtoKM");
  const sheet = spreadsheet.getSheetByName("subscription.cancelled");
  const lastRow = sheet.getLastRow();
  
  if (lastRow > 1) {
    sheet.deleteRows(2, lastRow - 1);
    console.log("Cleared all data rows from subscription.cancelled sheet, keeping headers");
  } else {
    console.log("No data rows to clear in subscription.cancelled sheet");
  }
}