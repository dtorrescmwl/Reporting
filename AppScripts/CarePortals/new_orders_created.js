function processErrorsToOrderCreated() {
  const spreadsheet = SpreadsheetApp.openById("1J62EOn9OXZzFpqcyw4egfjZe72gOpYJPohApUPmtoKM");
  
  // Get the sheets
  const errorsSheet = spreadsheet.getSheetByName('Errors');
  const orderCreatedSheet = spreadsheet.getSheetByName('order.created');
  
  if (!errorsSheet || !orderCreatedSheet) {
    throw new Error('Required sheets not found. Make sure "Errors" and "order.created" tabs exist.');
  }
  
  // Get all values from column D in Errors sheet (skip header row)
  const lastRow = errorsSheet.getLastRow();
  if (lastRow < 2) {
    console.log('No data found in Errors sheet column D');
    return;
  }
  
  const errorData = errorsSheet.getRange('D2:D' + lastRow).getValues();
  
  // Get headers from order.created sheet to map the data correctly
  const headers = orderCreatedSheet.getRange(1, 1, 1, orderCreatedSheet.getLastColumn()).getValues()[0];
  
  // Create array to store new rows
  const newRows = [];
  
  // Process each JSON string in column D
  errorData.forEach((row, index) => {
    const jsonString = row[0];
    
    // Skip empty cells
    if (!jsonString || jsonString.toString().trim() === '') {
      return;
    }
    
    try {
      // Parse the JSON
      const orderData = JSON.parse(jsonString);
      
      // Helper function to safely convert time (fallback if main function not available)
      const safeConvertToEasternTime = (utcDateString) => {
        if (!utcDateString) return "";
        try {
          // Try to use the main function if available
          if (typeof convertToEasternTime === 'function') {
            return convertToEasternTime(utcDateString);
          }
          // Fallback conversion
          const utcDate = new Date(utcDateString);
          return utcDate.toLocaleString("en-US", {
            timeZone: "America/New_York",
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          });
        } catch (error) {
          console.error("Error converting time:", error);
          return utcDateString;
        }
      };

      // Helper function to safely get current Eastern time
      const safeGetCurrentEasternTime = () => {
        try {
          // Try to use the main function if available
          if (typeof getCurrentEasternTime === 'function') {
            return getCurrentEasternTime();
          }
          // Fallback
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
        } catch (error) {
          console.error("Error getting current time:", error);
          return new Date().toString();
        }
      };

      // Create new row array matching the headers from your existing webhook
      const newRow = headers.map(header => {
        switch(header) {
          case 'Datetime Purchase':
            return safeConvertToEasternTime(orderData.createdAt) || '';
          case 'Care Portals Internal Order ID':
            return orderData._id || '';
          case 'Order ID':
            return orderData.id || '';
          case 'Customer ID':
            return orderData['customer._id'] || '';
          case 'First Name':
            return orderData['customer.firstName'] || '';
          case 'Last Name':
            return orderData['customer.lastName'] || '';
          case 'Email':
            return orderData['customer.email'] || '';
          case 'Phone':
            return orderData['customer.phone'] || '';
          case 'Source':
            return orderData.source || '';
          case 'Total Amount':
            return orderData.totalAmount || '';
          case 'Discount Amount':
            return orderData.discountAmount || '';
          case 'Base Amount':
            return orderData.baseAmount || '';
          case 'Credit Used':
            return orderData.creditUsedAmount || '';
          case 'Datetime Webhook Received':
            return safeGetCurrentEasternTime();
          case 'Notes':
            return `Processed from Errors tab row ${index + 2}`;
          default:
            return ''; // For any unmatched headers
        }
      });
      
      newRows.push(newRow);
      
    } catch (error) {
      console.log(`Error parsing JSON in row ${index + 2}: ${error.message}`);
      console.log(`JSON content: ${jsonString}`);
    }
  });
  
  // Add the new rows to order.created sheet if we have data
  if (newRows.length > 0) {
    const lastRowInOrderSheet = orderCreatedSheet.getLastRow();
    const range = orderCreatedSheet.getRange(lastRowInOrderSheet + 1, 1, newRows.length, newRows[0].length);
    range.setValues(newRows);
    
    // Auto-resize columns for better readability (matching your existing style)
    orderCreatedSheet.autoResizeColumns(1, orderCreatedSheet.getLastColumn());
    
    console.log(`Successfully processed ${newRows.length} orders from Errors tab to order.created tab`);
  } else {
    console.log('No valid JSON data found in Errors tab column D');
  }
}

// Optional: Function to clear processed data from Errors tab after successful processing
function clearProcessedErrors() {
  const spreadsheet = SpreadsheetApp.openById("1J62EOn9OXZzFpqcyw4egfjZe72gOpYJPohApUPmtoKM");
  const errorsSheet = spreadsheet.getSheetByName('Errors');
  
  if (errorsSheet) {
    const lastRow = errorsSheet.getLastRow();
    if (lastRow > 1) {
      errorsSheet.getRange('D2:D' + lastRow).clearContent();
      console.log('Cleared processed data from Errors tab');
    }
  }
}