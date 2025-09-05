function doPost(e) {
  try {
    // Target the specific spreadsheet and "order.created" tab
    const spreadsheetId = "1J62EOn9OXZzFpqcyw4egfjZe72gOpYJPohApUPmtoKM";
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.getSheetByName("order.updated");
    
    // Check if the sheet exists, if not create it
    if (!sheet) {
      throw new Error("Sheet 'order.created' not found in the specified spreadsheet");
    }
    
    // Parse the incoming JSON data
    const data = JSON.parse(e.postData.contents);
    
    // Get the trigger type from URL parameter (e.g., ?trigger=created)
    // If no parameter is provided, default to "created" since this is the order.created tab
    const triggerType = e.parameter.trigger || "created";
    
    // Check if headers exist, if not add them
    if (sheet.getLastRow() === 0) {
      const headers = [
        "Timestamp",
        "Trigger",
        "ID",
        "Order ID",
        "Organization",
        "Status",
        "Customer ID",
        "First Name",
        "Last Name",
        "Email",
        "Phone",
        "Source",
        "Total Amount",
        "Discount Amount",
        "Base Amount",
        "Credit Used",
        "Post Purchase Status",
        "Assigned Group",
        "Requirements",
        "Is Deleted",
        "Shipping Address",
        "Line Items",
        "Invoices",
        "Shipments",
        "Shipped At",
        "Tracking Code",
        "Tracking Link",
        "Status History",
        "Created At",
        "Updated At",
        "Version"
      ];
      sheet.appendRow(headers);
      
      // Format header row
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#4a90e2");
      headerRange.setFontColor("#ffffff");
    }
    
    // Helper functions
    function formatField(field) {
      if (field === null || field === undefined) return "";
      if (typeof field === 'object') return JSON.stringify(field);
      return String(field);
    }
    
    function formatShippingAddress(address) {
      if (!address) return "";
      return `${address.address1 || ""} ${address.address2 || ""} ${address.city || ""} ${address.provinceCode || ""} ${address.postalCode || ""}`.trim();
    }
    
    function formatLineItems(items) {
      if (!items || !Array.isArray(items)) return "";
      return items.map(item => `${item.name || ""} (${item.quantity || 1})`).join("; ");
    }
    
    // Prepare the row data in the same order as headers
    const rowData = [
      new Date(),
      triggerType,
      data._id || "",
      data.id || "",
      data.organization || "",
      data.status || "",
      data["customer._id"] || "",
      data["customer.firstName"] || "",
      data["customer.lastName"] || "",
      data["customer.email"] || "",
      data["customer.phone"] || "",
      data.source || "",
      data.totalAmount || "",
      data.discountAmount || "",
      data.baseAmount || "",
      data.creditUsedAmount || "",
      data.postPurchaseStatus || "",
      data.assignedToGroup || "",
      formatField(data.requirements),
      data.isDeleted || false,
      formatShippingAddress(data.shippingAddress),
      formatLineItems(data.lineItems),
      formatField(data.invoices),
      formatField(data.shipments),
      data.shippedAt || "",
      data.trackingCode || "",
      data.trackingLink || "",
      formatField(data.statusHistory),
      data.createdAt || "",
      data.updatedAt || "",
      data.__v || ""
    ];
    
    // Append the data to the sheet
    sheet.appendRow(rowData);
    
    // Auto-resize columns for better readability (optional - comment out if performance is a concern)
    sheet.autoResizeColumns(1, sheet.getLastColumn());
    
    // Log success
    console.log("Order webhook data added successfully:", data._id || data.id);
    
    // Return success response
    return ContentService
      .createTextOutput(JSON.stringify({
        result: 'success',
        message: 'Order data added to sheet',
        id: data._id || data.id,
        trigger: triggerType
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    // Log error for debugging
    console.error("Error processing order webhook:", error);
    
    // Return error response
    return ContentService
      .createTextOutput(JSON.stringify({
        result: 'error',
        message: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}