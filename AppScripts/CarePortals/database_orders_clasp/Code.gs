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

// Helper function to determine pharmacy based on assignedTo fields from webhook
function getPharmacy(assignedToFirstName, assignedToLastName) {
  // Extract pharmacy from assignedTo firstName + lastName (same logic as customer support script)
  const firstName = assignedToFirstName || '';
  const lastName = assignedToLastName || '';

  if (firstName || lastName) {
    return `${firstName} ${lastName}`.trim();
  }

  return 'N/A';
}

// Helper function to create MD5 hash
function createMD5Hash(inputString) {
  const digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.MD5, 
    inputString, 
    Utilities.Charset.UTF_8
  );
  
  // Convert bytes to hex string
  const hexString = digest.map(byte => 
    (byte < 0 ? byte + 256 : byte).toString(16).padStart(2, '0')
  ).join('');
  
  return hexString;
}

// Helper function to create normalized address key
function createAddressKey(address) {
  // First, convert to string and basic normalization
  let normalized = [
    String(address.address1 || '').toLowerCase().trim(),
    String(address.city || '').toLowerCase().trim(),
    String(address.provinceCode || '').toLowerCase().trim(),
    String(address.postalCode || '').replace(/[\s-]/g, '').toLowerCase()
  ].join(' ');
  
  // Standardize street types (order matters - longest first)
  normalized = normalized
    // Street variations
    .replace(/\bstreet\b/g, 'street')
    .replace(/\bst\./g, 'street')
    .replace(/\bst\b/g, 'street')
    
    // Avenue variations  
    .replace(/\bavenue\b/g, 'avenue')
    .replace(/\bave\./g, 'avenue')
    .replace(/\bave\b/g, 'avenue')
    .replace(/\bav\./g, 'avenue')
    .replace(/\bav\b/g, 'avenue')
    
    // Drive variations
    .replace(/\bdrive\b/g, 'drive')
    .replace(/\bdr\./g, 'drive')
    .replace(/\bdr\b/g, 'drive')
    .replace(/\bdrv\./g, 'drive')
    .replace(/\bdrv\b/g, 'drive')
    
    // Road variations
    .replace(/\broad\b/g, 'road')
    .replace(/\brd\./g, 'road')
    .replace(/\brd\b/g, 'road')
    
    // Boulevard variations
    .replace(/\bboulevard\b/g, 'boulevard')
    .replace(/\bblvd\./g, 'boulevard')
    .replace(/\bblvd\b/g, 'boulevard')
    .replace(/\bboul\./g, 'boulevard')
    .replace(/\bboul\b/g, 'boulevard')
    
    // Lane variations
    .replace(/\blane\b/g, 'lane')
    .replace(/\bln\./g, 'lane')
    .replace(/\bln\b/g, 'lane')
    .replace(/\bla\./g, 'lane')
    .replace(/\bla\b/g, 'lane')
    
    // Court variations
    .replace(/\bcourt\b/g, 'court')
    .replace(/\bct\./g, 'court')
    .replace(/\bct\b/g, 'court')
    .replace(/\bcrt\./g, 'court')
    .replace(/\bcrt\b/g, 'court')
    
    // Circle variations
    .replace(/\bcircle\b/g, 'circle')
    .replace(/\bcir\./g, 'circle')
    .replace(/\bcir\b/g, 'circle')
    
    // Place variations
    .replace(/\bplace\b/g, 'place')
    .replace(/\bpl\./g, 'place')
    .replace(/\bpl\b/g, 'place')
    
    // Way variations
    .replace(/\bway\b/g, 'way')
    .replace(/\bwy\./g, 'way')
    .replace(/\bwy\b/g, 'way')
    
    // Parkway variations
    .replace(/\bparkway\b/g, 'parkway')
    .replace(/\bpkwy\./g, 'parkway')
    .replace(/\bpkwy\b/g, 'parkway')
    .replace(/\bpky\./g, 'parkway')
    .replace(/\bpky\b/g, 'parkway')
    
    // Highway variations
    .replace(/\bhighway\b/g, 'highway')
    .replace(/\bhwy\./g, 'highway')
    .replace(/\bhwy\b/g, 'highway');
  
  // Final cleanup: remove all remaining spaces, punctuation, special characters
  normalized = normalized.replace(/[^a-z0-9]/g, '');
  
  // Return MD5 hash of normalized string
  return createMD5Hash(normalized);
}

// Helper function to generate unique ID
function generateUniqueId() {
  return Utilities.getUuid();
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

// Helper function to find existing record by key column
function findExistingRecord(sheet, keyColumn, keyValue) {
  if (sheet.getLastRow() <= 1) return null;
  
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][keyColumn - 1] === keyValue) {
      return data[i];
    }
  }
  return null;
}

// Process customer - get existing or create new
function processCustomer(spreadsheet, customerData) {
  const sheet = getOrCreateSheet(spreadsheet, "customers");
  
  // Setup headers if needed
  const headers = [
    "customer_id", "email", "first_name", "last_name", "phone"
  ];
  setupSheetHeaders(sheet, headers);
  
  // Check if customer exists by email
  const existingCustomer = findExistingRecord(sheet, 2, customerData.email); // email is column 2
  
  if (existingCustomer) {
    return existingCustomer[0]; // Return customer_id
  }
  
  // Create new customer using backend customer_id
  const rowData = [
    customerData.customer_id,
    customerData.email,
    customerData.firstName,
    customerData.lastName,
    customerData.phone
  ];
  
  sheet.appendRow(rowData);
  return customerData.customer_id;
}

// Process address - get existing or create new
function processAddress(spreadsheet, addressData) {
  const sheet = getOrCreateSheet(spreadsheet, "addresses");
  
  // Setup headers if needed
  const headers = [
    "address_id", "address1", "address2", "city", "province_code", 
    "postal_code"
  ];
  setupSheetHeaders(sheet, headers);
  
  // Create address key
  const addressKey = createAddressKey(addressData);
  
  // Check if address exists
  const existingAddress = findExistingRecord(sheet, 1, addressKey); // address_id is column 1
  
  if (existingAddress) {
    return existingAddress[0]; // Return address_id
  }
  
  // Create new address
  const rowData = [
    addressKey,
    addressData.address1,
    addressData.address2,
    addressData.city,
    addressData.provinceCode,
    addressData.postalCode
  ];
  
  sheet.appendRow(rowData);
  return addressKey;
}

// Process product - get existing or create new
function processProduct(spreadsheet, productData) {
  const sheet = getOrCreateSheet(spreadsheet, "products");
  
  // Setup headers if needed
  const headers = [
    "product_id", "label", "sub_label", "drug_name", "list_price", "sale_price", 
    "sale_cycle_duration", "renewal_price", "renewal_cycle_duration", "active", "direct_cart_link"
  ];
  setupSheetHeaders(sheet, headers);
  
  // Check if product exists by product_id
  const existingProduct = findExistingRecord(sheet, 1, productData.productId); // product_id is column 1
  
  if (existingProduct) {
    return existingProduct[0]; // Return existing product_id
  }
  
  // Create new product
  const rowData = [
    productData.productId,
    productData.name,
    "", // sub_label - left empty for manual addition later
    productData.drugName,
    productData.listPrice,
    productData.price,
    "", // sale_cycle_duration - left empty for manual addition later
    "", // renewal_price - left empty for manual addition later
    "", // renewal_cycle_duration - left empty for manual addition later
    true, // active - default to true for new products
    "" // direct_cart_link - empty for now
  ];
  
  sheet.appendRow(rowData);
  return productData.productId;
}

// Process coupon - get existing or create new
function processCoupon(spreadsheet, couponCode, reductionAmount, reductionType) {
  if (!couponCode) return couponCode;
  
  const sheet = getOrCreateSheet(spreadsheet, "coupons");
  
  // Setup headers if needed
  const headers = [
    "coupon_id", "reduction_amount", "reduction_type", "description"
  ];
  setupSheetHeaders(sheet, headers);
  
  // Check if coupon exists
  const existingCoupon = findExistingRecord(sheet, 1, couponCode); // coupon_id is column 1
  
  if (existingCoupon) {
    return existingCoupon[0]; // Return coupon_id
  }
  
  // Create new coupon
  const rowData = [
    couponCode,
    reductionAmount || 0,
    reductionType || "",
    `${reductionAmount}${reductionType === 'percent' ? '%' : ''} off` // auto-generated description
  ];
  
  sheet.appendRow(rowData);
  return couponCode;
}

// Create order record
function createOrder(spreadsheet, orderData, customerId, addressId, productId) {
  const sheet = getOrCreateSheet(spreadsheet, "order.created");

  // Setup headers if needed
  const headers = [
    "created_at", "order_id", "care_portals_internal_order_id", "customer_id", "shipping_address_id", "product_id",
    "source", "total_amount", "discount_amount", "base_amount",
    "credit_used_amount", "coupon", "discount_reduction_amount",
    "discount_reduction_type", "pharmacy_assigned"
  ];
  setupSheetHeaders(sheet, headers);

  // Check if order already exists by order_id (now column 2)
  const existingOrder = findExistingRecord(sheet, 2, orderData.order_id); // order_id is now column 2

  if (existingOrder) {
    console.log(`Order ${orderData.order_id} already exists, skipping creation`);
    return existingOrder[1]; // Return existing order_id (now column 2)
  }

  // Create new order using backend order ID
  const pharmacy = getPharmacy(orderData.assignedToFirstName, orderData.assignedToLastName);

  const rowData = [
    convertToEasternTime(orderData.createdAt),
    orderData.order_id,
    orderData.care_portals_internal_order_id,
    customerId,
    addressId,
    productId,
    orderData.source,
    orderData.totalAmount,
    orderData.discountAmount,
    orderData.baseAmount,
    orderData.creditUsedAmount,
    orderData.coupon,
    orderData.discount_reduction_amount,
    orderData.discount_reduction_type,
    pharmacy
  ];

  sheet.appendRow(rowData);
  console.log(`Created new order: ${orderData.order_id}`);
  return orderData.order_id;
}

// Process order update
function processOrderUpdate(spreadsheet, orderUpdateData) {
  const sheet = getOrCreateSheet(spreadsheet, "order.updated");

  // Setup headers if needed
  const headers = [
    "Datetime Created", "Datetime Updated", "order_id", "updated_status"
  ];
  setupSheetHeaders(sheet, headers);

  // Create new order update record (always add, don't check for duplicates as status can change multiple times)
  const rowData = [
    convertToEasternTime(orderUpdateData.createdAt),   // Datetime Created (ET)
    convertToEasternTime(orderUpdateData.updatedAt),   // Datetime Updated (ET)
    orderUpdateData.order_id,                          // order_id (4-digit)
    orderUpdateData.updated_status                     // updated_status
  ];

  sheet.appendRow(rowData);
  console.log(`Created order update record: ${orderUpdateData.order_id} -> ${orderUpdateData.updated_status}`);
  return orderUpdateData.order_id;
}

// Process cancelled order
function processCancelledOrder(spreadsheet, orderData) {
  const sheet = getOrCreateSheet(spreadsheet, "order.cancelled");

  // Setup headers if needed
  const headers = [
    "order_id", "deleted_datetime"
  ];
  setupSheetHeaders(sheet, headers);

  // Check if cancelled order already exists
  const existingCancelledOrder = findExistingRecord(sheet, 1, orderData.order_id); // order_id is column 1

  if (existingCancelledOrder) {
    console.log(`Cancelled order ${orderData.order_id} already exists, skipping`);
    return existingCancelledOrder[0];
  }

  // Create new cancelled order record
  const rowData = [
    getCurrentEasternTime(),
    orderData.order_id
  ];

  sheet.appendRow(rowData);
  console.log(`Created cancelled order record: ${orderData.order_id}`);
  return orderData.order_id;
}

// Main webhook processing function
function doPost(e) {
  try {
    // Get the specific spreadsheet by ID
    const spreadsheet = SpreadsheetApp.openById("1PaCOgNJmKSb2VsJjCMjWpCG-gwrO7uVkuTAFUdrV-_o");
    
    // Check webhook type from URL parameters
    const urlParams = e.parameter || {};
    const isExtraCancelled = urlParams.extra === 'cancelled';
    const isOrderUpdated = urlParams.extra === 'updated';

    // Parse the incoming JSON data
    const data = JSON.parse(e.postData.contents);

    if (isOrderUpdated) {
      // Handle order.updated webhook - new functionality
      const orderUpdatedData = {
        order_id: data.id || "", // 4-digit order ID
        updated_status: data.status || "",
        createdAt: data.createdAt || "",
        updatedAt: data.updatedAt || ""
      };

      // Process order update
      const updatedOrderId = processOrderUpdate(spreadsheet, orderUpdatedData);

      // Auto-resize columns for order.updated sheet
      const updatedSheet = getOrCreateSheet(spreadsheet, "order.updated");
      if (updatedSheet && updatedSheet.getLastColumn() > 0) {
        updatedSheet.autoResizeColumns(1, updatedSheet.getLastColumn());
      }

      // Log success
      console.log("Order update processed successfully:", updatedOrderId);

      // Return success response
      return ContentService
        .createTextOutput(JSON.stringify({
          result: 'success',
          message: 'Order update processed successfully',
          order_id: updatedOrderId,
          status: orderUpdatedData.updated_status,
          type: 'updated'
        }))
        .setMimeType(ContentService.MimeType.JSON);

    } else if (isExtraCancelled) {
      // Handle cancelled order - only need order_id and updatedAt
      const cancelledOrderData = {
        order_id: data.id || "", // 4-digit order ID
        updatedAt: data.updatedAt || data.createdAt || "" // fallback to createdAt if updatedAt not available
      };
      
      // Process cancelled order
      const cancelledOrderId = processCancelledOrder(spreadsheet, cancelledOrderData);
      
      // Auto-resize columns for cancelled orders sheet
      const cancelledSheet = getOrCreateSheet(spreadsheet, "order.cancelled");
      if (cancelledSheet && cancelledSheet.getLastColumn() > 0) {
        cancelledSheet.autoResizeColumns(1, cancelledSheet.getLastColumn());
      }
      
      // Log success
      console.log("Cancelled order processed successfully:", cancelledOrderId);
      
      // Return success response
      return ContentService
        .createTextOutput(JSON.stringify({
          result: 'success',
          message: 'Cancelled order processed successfully',
          order_id: cancelledOrderId,
          type: 'cancelled'
        }))
        .setMimeType(ContentService.MimeType.JSON);
    } else {
      // Handle regular order creation - existing code
      // Extract and organize data
      const customerData = {
        customer_id: data["customer._id"] || "",
        email: data["customer.email"] || "",
        firstName: data["customer.firstName"] || "",
        lastName: data["customer.lastName"] || "",
        phone: data["customer.phone"] || ""
      };
      
      const addressData = {
        address1: data["shippingAddress.address1"] || "",
        address2: data["shippingAddress.address2"] || "",
        city: data["shippingAddress.city"] || "",
        provinceCode: data["shippingAddress.provinceCode"] || "",
        postalCode: data["shippingAddress.postalCode"] || "",
        countryCode: data["shippingAddress.countryCode"] || ""
      };
      
      const productData = {
        productId: data["lineItems.0.productId"] || "",
        name: data["lineItems.0.name"] || "",
        drugName: data["lineItems.0.drugName"] || "",
        listPrice: data["lineItems.0.listPrice"] || 0,
        price: data["lineItems.0.price"] || 0
      };
      
      const orderData = {
        order_id: data.id || "",
        care_portals_internal_order_id: data._id || "",
        source: data.source || "",
        totalAmount: data.totalAmount || 0,
        discountAmount: data.discountAmount || 0,
        baseAmount: data.baseAmount || 0,
        creditUsedAmount: data.creditUsedAmount || 0,
        coupon: data.coupon || "",
        discount_reduction_amount: data["lineItems.0.discount.reductionAmount"] || 0,
        discount_reduction_type: data["lineItems.0.discount.reductionType"] || "",
        createdAt: data.createdAt || "",
        assignedToFirstName: data["assignedTo.firstName"] || "",
        assignedToLastName: data["assignedTo.lastName"] || "",
        shippingAddress: addressData
      };
      
      // Process each entity and get IDs
      const customerId = processCustomer(spreadsheet, customerData);
      const addressId = processAddress(spreadsheet, addressData);
      const productId = processProduct(spreadsheet, productData);
      
      // Process coupon if exists
      if (orderData.coupon) {
        processCoupon(spreadsheet, orderData.coupon, orderData.discount_reduction_amount, orderData.discount_reduction_type);
      }
      
      // Create the order
      const orderId = createOrder(spreadsheet, orderData, customerId, addressId, productId);
      
      // Auto-resize columns for all sheets
      const sheetNames = ["order.created", "customers", "addresses", "products", "coupons"];
      sheetNames.forEach(sheetName => {
        const sheet = getOrCreateSheet(spreadsheet, sheetName);
        if (sheet && sheet.getLastColumn() > 0) {
          sheet.autoResizeColumns(1, sheet.getLastColumn());
        }
      });
      
      // Log success
      console.log("Order processed successfully:", orderId);
      
      // Return success response
      return ContentService
        .createTextOutput(JSON.stringify({
          result: 'success',
          message: 'Order processed successfully',
          order_id: orderId,
          backend_order_id: data._id || data.id,
          type: 'created'
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
      
  } catch (error) {
    // Log error for debugging
    console.error("Error processing webhook:", error);
    
    // Try to log the error to sheet
    try {
      const spreadsheet = SpreadsheetApp.openById("1PaCOgNJmKSb2VsJjCMjWpCG-gwrO7uVkuTAFUdrV-_o");
      let errorSheet = getOrCreateSheet(spreadsheet, "Errors");
      if (errorSheet.getLastRow() === 0) {
        errorSheet.appendRow(["Timestamp", "Error Type", "Error Message", "Raw Data"]);
        const headerRange = errorSheet.getRange(1, 1, 1, 4);
        headerRange.setFontWeight("bold");
        headerRange.setBackground("#ff4444");
        headerRange.setFontColor("#ffffff");
      }
      errorSheet.appendRow([
        getCurrentEasternTime(),
        "WEBHOOK_ERROR",
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

// Test function to simulate order.updated webhook (for testing in Apps Script editor)
function testOrderUpdatedWebhook() {
  console.log("Starting order.updated webhook test...");

  // Create test data that matches the new order.updated webhook format
  const testData = {
    "_id": "670123456789abcdef",
    "organization": "cmwl",
    "id": "1984",
    "status": "awaiting_shipment",
    "statusHistory": "[]",
    "source": "checkout",
    "lineItems": "[]",
    "shippingAddress": "{}",
    "invoices": "[]",
    "totalAmount": 149.00,
    "discountAmount": 0,
    "baseAmount": 149.00,
    "assignedTo.firstName": "SevenCells",
    "assignedTo.lastName": "Pharmacy",
    "requirements": "[]",
    "isDeleted": false,
    "creditUsedAmount": 0,
    "postPurchaseStatus": "active",
    "createdAt": "2024-01-15T15:30:00Z",
    "updatedAt": "2024-01-15T16:45:00Z",
    "_v": 0,
    "shipments": "[]",
    "shippedAt": null,
    "trackingCode": null,
    "trackingLink": null,
    "customer.firstName": "Test",
    "customer.lastName": "User",
    "customer.email": "test@example.com",
    "customer.phone": "+15551234567",
    "customer._id": "cust123456789",
    "state": "NY",
    "productId": "prod123456"
  };

  // Simulate the order.updated webhook call
  const mockEvent = {
    postData: {
      contents: JSON.stringify(testData)
    },
    parameter: {
      extra: "updated"
    }
  };

  const result = doPost(mockEvent);
  console.log("Order.updated test completed! Response:", result.getContent());
  console.log("Check the 'order.updated' sheet - you should see a new record");
}

// Test function to simulate webhook (for testing in Apps Script editor)
function testWebhook() {
  console.log("Starting webhook test...");

  // Create test data that matches the expected flattened webhook format
  const testData = {
    "_id": "test123456789",
    "id": "9999",
    "source": "website",
    "totalAmount": 199.00,
    "discountAmount": 99.50,
    "baseAmount": 199.00,
    "creditUsedAmount": 0,
    "createdAt": "2024-01-15T15:30:00Z",
    "coupon": "SAVE50NOW",
    "customer._id": "cust123456789",
    "customer.firstName": "Test",
    "customer.lastName": "User",
    "customer.email": "test@example.com",
    "customer.phone": "+15551234567",
    "shippingAddress.address1": "123 Test Street",
    "shippingAddress.address2": "Apt 4B",
    "shippingAddress.city": "Test City",
    "shippingAddress.provinceCode": "NY",
    "shippingAddress.postalCode": "10001",
    "shippingAddress.countryCode": "US",
    "assignedTo.firstName": "SevenCells",
    "assignedTo.lastName": "Pharmacy",
    "lineItems.0.productId": "prod123456",
    "lineItems.0.name": "Test Health Supplement",
    "lineItems.0.drugName": "Test Supplement 10mg",
    "lineItems.0.listPrice": 199,
    "lineItems.0.price": 199,
    "lineItems.0.discount.reductionAmount": 50,
    "lineItems.0.discount.reductionType": "percent"
  };

  // Simulate the webhook call
  const mockEvent = {
    postData: {
      contents: JSON.stringify(testData)
    }
  };

  const result = doPost(mockEvent);
  console.log("Test completed! Response:", result.getContent());
  console.log("Check your sheets - you should see new records in multiple tables");
}

// Function to clear all data except headers (useful for testing)
function clearDataKeepHeaders() {
  const spreadsheet = SpreadsheetApp.openById("1PaCOgNJmKSb2VsJjCMjWpCG-gwrO7uVkuTAFUdrV-_o");
  const sheetNames = ["order.created", "customers", "addresses", "products", "coupons"];
  
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


// Function to generate missing address IDs for existing entries
function generateMissingAddressIds() {
  console.log("Starting generation of missing address IDs...");
  
  const spreadsheet = SpreadsheetApp.openById("1PaCOgNJmKSb2VsJjCMjWpCG-gwrO7uVkuTAFUdrV-_o");
  const sheet = getOrCreateSheet(spreadsheet, "addresses");
  
  if (sheet.getLastRow() <= 1) {
    console.log("No address data found");
    return {
      message: "No address data found",
      updated: 0
    };
  }
  
  // Get all data
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  // Find column indices
  const addressIdIndex = 0; // address_id is first column
  const address1Index = headers.indexOf("address1");
  const address2Index = headers.indexOf("address2");
  const cityIndex = headers.indexOf("city");
  const provinceIndex = headers.indexOf("province_code");
  const postalIndex = headers.indexOf("postal_code");
  
  if (address1Index === -1 || cityIndex === -1) {
    console.log("Could not find required address columns");
    return {
      message: "Could not find required address columns (address1, city)",
      updated: 0
    };
  }
  
  console.log("Found address columns, checking for missing IDs...");
  
  let updatedCount = 0;
  const updates = [];
  
  // Process each row (skip header)
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const currentAddressId = row[addressIdIndex];
    
    // Check if address_id is missing or empty
    if (!currentAddressId || currentAddressId.trim() === "") {
      // Create address object from row data
      const addressData = {
        address1: row[address1Index] || "",
        address2: row[address2Index] || "",
        city: row[cityIndex] || "",
        provinceCode: row[provinceIndex] || "",
        postalCode: row[postalIndex] || ""
      };
      
      // Generate new MD5 hash address ID
      const newAddressId = createAddressKey(addressData);
      
      console.log(`Row ${i + 1}: Generated ID "${newAddressId}" for address: ${addressData.address1}, ${addressData.city}, ${addressData.provinceCode}`);
      
      // Update the address_id in column A
      sheet.getRange(i + 1, addressIdIndex + 1).setValue(newAddressId);
      
      updates.push({
        row: i + 1,
        address: `${addressData.address1}, ${addressData.city}, ${addressData.provinceCode}`,
        generatedId: newAddressId
      });
      
      updatedCount++;
    }
  }
  
  console.log(`Generation completed! Updated ${updatedCount} address entries.`);
  
  // Log details of updates
  if (updates.length > 0) {
    console.log("Updated addresses:");
    updates.forEach(update => {
      console.log(`  Row ${update.row}: ${update.address} → ${update.generatedId}`);
    });
  }
  
  return {
    message: `Successfully generated ${updatedCount} missing address IDs`,
    updated: updatedCount,
    details: updates
  };
}

/**
 * DEPLOYMENT INSTRUCTIONS:
 * 
 * 1. Copy this entire script into your Google Sheets Apps Script editor
 *    (Extensions → Apps Script)
 * 
 * 2. The script will automatically create these sheet tabs if they don't exist:
 *    - order.created (main orders table)
 *    - customers  
 *    - addresses
 *    - products
 *    - coupons
 * 
 * 3. Save the script (Ctrl+S or Cmd+S)
 * 
 * 4. Run the testWebhook() function first to test if it works
 * 
 * 5. Deploy as Web App:
 *    - Click "Deploy" → "New Deployment"
 *    - Choose type: "Web app"
 *    - Description: "Order Processing Webhook" (or any name you want)
 *    - Execute as: "Me"
 *    - Who has access: "Anyone" (required for external webhooks)
 *    - Click "Deploy"
 * 
 * 6. Copy the Web App URL - this is your webhook endpoint
 * 
 * 7. Use this URL in your webhook service to send flattened order data
 * 
 * NOTE: Every time you make changes, you need to create a new deployment
 * or update the existing deployment for changes to take effect.
 * 
 * SHEETS CREATED AUTOMATICALLY:
 * The script will automatically create these sheet tabs if they don't exist:
 * - orders
 * - customers
 * - addresses
 * - products
 * - coupons
 * - Errors (created when first error occurs)
 * 
 * Future expansion sheets (not used yet):
 * - categories
 * - product_categories
 * - product_coupons
 */