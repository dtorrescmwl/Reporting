function doPost(e) {
  try {
    // Use the specific spreadsheet ID
    const SPREADSHEET_ID = "1J62EOn9OXZzFpqcyw4egfjZe72gOpYJPohApUPmtoKM";
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    // Get the specific sheet "prescription.created"
    let targetSheet = spreadsheet.getSheetByName("prescription.created");
    
    // Create the sheet if it doesn't exist
    if (!targetSheet) {
      targetSheet = spreadsheet.insertSheet("prescription.created");
      console.log("Created new sheet: prescription.created");
    }
    
    // Parse the incoming JSON data
    const data = JSON.parse(e.postData.contents);
    
    // Check if headers exist, if not add them
    if (targetSheet.getLastRow() === 0) {
      const headers = [
        "Datetime Received",
        "EMR Profile",
        "Customer First Name",
        "Customer Last Name",
        "Customer Email",
        "Customer Phone",
        "EMR ID",
        "CRM ID"
      ];
      targetSheet.appendRow(headers);
      
      // Format header row
      const headerRange = targetSheet.getRange(1, 1, 1, headers.length);
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
      data["customer._id"] || ""
    ];
    
    // Append the data to the sheet
    targetSheet.appendRow(rowData);
    
    // Auto-resize columns for better readability
    targetSheet.autoResizeColumns(1, targetSheet.getLastColumn());
    
    // Log success
    console.log("Prescription webhook data added successfully:", data._id);
    
    // Return success response
    return ContentService
      .createTextOutput(JSON.stringify({
        result: 'success',
        message: 'Prescription data added to sheet',
        id: data._id
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    // Log error for debugging
    console.error("Error processing prescription webhook:", error);
    
    // Try to log the raw data for debugging
    try {
      const SPREADSHEET_ID = "1J62EOn9OXZzFpqcyw4egfjZe72gOpYJPohApUPmtoKM";
      const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
      let errorSheet = spreadsheet.getSheetByName("Errors");
      if (!errorSheet) {
        errorSheet = spreadsheet.insertSheet("Errors");
      }
      errorSheet.appendRow([
        new Date(),
        "PRESCRIPTION_ERROR",
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

// Test function for prescription webhook
function testPrescriptionWebhook() {
  const SPREADSHEET_ID = "1J62EOn9OXZzFpqcyw4egfjZe72gOpYJPohApUPmtoKM";
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  // Create test prescription data with only the fields we know have values
  const testData = {
    "_id": "689e2ff914a65f1c0a8e80ee",
    "organization": "cmwl",
    "customer.firstName": "Yaseen",
    "customer.lastName": "Habawwal",
    "customer.email": "yaseen@portals.care",
    "customer.phone": "+16048309282",
    "customer._id": "66f2fa78e720d48e95cdc7aa"
  };
  
  // Simulate the webhook call
  const mockEvent = {
    postData: {
      contents: JSON.stringify(testData)
    },
    parameter: {}
  };
  
  // Call the doPost function
  const result = doPost(mockEvent);
  
  console.log("Test prescription webhook completed!");
  console.log("Result:", result.getContent());
}

// Function to clear prescription data but keep headers
function clearPrescriptionData() {
  const SPREADSHEET_ID = "1J62EOn9OXZzFpqcyw4egfjZe72gOpYJPohApUPmtoKM";
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = spreadsheet.getSheetByName("prescription.created");
  
  if (!sheet) {
    console.log("prescription.created sheet not found");
    return;
  }
  
  const lastRow = sheet.getLastRow();
  
  if (lastRow > 1) {
    sheet.deleteRows(2, lastRow - 1);
    console.log("Cleared all prescription data rows, keeping headers");
  } else {
    console.log("No prescription data rows to clear");
  }
}