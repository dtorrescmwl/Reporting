# Webhook Processing Logic - Technical Implementation

## Overview

All data integration is handled through Google Apps Script webhooks that provide real-time processing, validation, and storage. Each webhook endpoint implements comprehensive business logic for data quality, error handling, and system integration.

## Core Processing Functions

### Data Validation and Sanitization

#### `safeString(value)` Function
**Purpose**: Safely convert any data type to string format
```javascript
function safeString(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
```
**Used By**: All webhook processors
**Handles**: null values, objects, arrays, undefined values

#### Email Validation Logic
**Purpose**: Enforce data quality for primary matching key
```javascript
// Reject empty email/phone
if (!submissionData.email || !submissionData.phone || 
    submissionData.email.trim() === '' || submissionData.phone.trim() === '') {
  return reject('Email and phone required');
}

// Banned email filtering
const bannedEmails = ['test@email.com', 'test@test.com'];
const bannedDomain = '@cmwl.com';

if (bannedEmails.includes(submissionData.email.toLowerCase()) || 
    submissionData.email.toLowerCase().includes(bannedDomain)) {
  return reject('Banned email address');
}
```
**Applied To**: Embeddables form submissions
**Business Rules**: Prevents test data and internal emails from entering reporting

### Date and Time Processing

#### `convertToEasternTime(utcDateString)` Function
**Purpose**: Standardize all timestamps to Eastern Time (handles EST/EDT automatically)
```javascript
function convertToEasternTime(utcDateString) {
  if (!utcDateString) return "";
  try {
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
}
```
**Applied To**: All webhook timestamps
**Format Output**: MM/dd/yyyy, HH:mm:ss AM/PM

#### `getCurrentEasternTime()` Function  
**Purpose**: Generate current Eastern Time for webhook processing timestamps
```javascript
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
```

### Specialized Data Formatting

#### Height Formatting
**Purpose**: Convert dropdown keys to human-readable height
```javascript
function formatHeight(feet, inches) {
  if (!feet || !inches) return '';
  
  const feetMap = {
    'feet_three': '3', 'feet_four': '4', 'feet_five': '5',
    'feet_six': '6', 'feet_seven': '7'
  };
  
  const inchesMap = {
    'inches_zero': '0', 'inches_one': '1', 'inches_two': '2',
    'inches_three': '3', 'inches_four': '4', 'inches_five': '5',
    'inches_six': '6', 'inches_seven': '7', 'inches_eight': '8',
    'inches_nine': '9', 'inches_ten': '10', 'inches_eleven': '11'
  };
  
  const feetStr = String(feet).toLowerCase();
  const inchesStr = String(inches).toLowerCase(); 
  
  const feetNum = feetMap[feetStr] || '0';
  const inchesNum = inchesMap[inchesStr] || '0';
  
  return `${feetNum}'${inchesNum}''`;
}
```
**Input Example**: `feet_five`, `inches_eight`
**Output Example**: `5'8''`

#### Date of Birth Formatting  
**Purpose**: Convert component format to standardized MM/DD/YYYY
```javascript
function formatDateOfBirth(day, month, year) {
  if (!day || !month || !year) return '';
  
  const monthMap = {
    'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04', 'may': '05', 'jun': '06',
    'jul': '07', 'aug': '08', 'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
  };
  
  const monthNum = monthMap[String(month).toLowerCase()] || '01';
  const dayFormatted = String(day).padStart(2, '0');
  
  return `${monthNum}/${dayFormatted}/${year}`;
}
```
**Input Example**: `15`, `mar`, `1990`
**Output Example**: `03/15/1990`

#### State Capitalization
**Purpose**: Standardize state codes for pharmacy assignment logic
```javascript
function capitalizeState(state) {
  if (!state) return '';
  return String(state).toUpperCase();
}
```
**Applied To**: All geographic data
**Purpose**: Ensures consistent pharmacy routing

#### Disqualified Reasons Parsing
**Purpose**: Extract human-readable reasons from complex JSON structures
```javascript
function parseDisqualifiedReasons(reasonsData) {
  if (!reasonsData) return '';
  
  try {
    let parsedData;
    if (typeof reasonsData === 'string') {
      parsedData = JSON.parse(reasonsData);
    } else {
      parsedData = reasonsData;
    }
    
    return parsedData.reasonsList || '';
  } catch (error) {
    console.warn('Could not parse disqualified reasons:', error);
    return safeString(reasonsData);
  }
}
```
**Handles**: Nested JSON objects, string-encoded JSON, malformed data

## Page Progression Logic (Embeddables)

### Forward-Only Progression Tracking
**Purpose**: Prevent duplicate entries from browser back navigation

```javascript
function processPageSubmission(submissionData, trackerSheet, logSheet) {
  const entryId = submissionData.entryId;
  const currentPageIndex = parseInt(submissionData.current_page_index) || 0;
  
  // Find existing entry in tracker sheet
  const existingRowIndex = findExistingEntry(trackerSheet, entryId);
  let existingFurthestPageIndex = -1;
  
  if (existingRowIndex > 0) {
    existingFurthestPageIndex = getExistingFurthestIndex(trackerSheet, existingRowIndex);
  }
  
  // Determine if this is forward movement
  const isForwardMovement = currentPageIndex > existingFurthestPageIndex;
  const isNewEntry = existingRowIndex === -1;
  
  // Always update tracker (upsert logic)
  updateTrackerEntry(trackerSheet, submissionData, isForwardMovement, isNewEntry);
  
  // Log only if forward movement
  let loggedForward = false;
  if (isForwardMovement) {
    logProgressionEvent(logSheet, submissionData);
    loggedForward = true;
  }
  
  return {
    action: existingRowIndex > 0 ? 'updated' : 'created',
    loggedForward: loggedForward
  };
}
```

**Business Logic**:
- **Upsert Behavior**: Updates existing entries or creates new ones
- **Forward-Only**: Only logs progression to higher page numbers  
- **Duplicate Prevention**: Prevents multiple entries for same page
- **Analytics Integrity**: Maintains accurate progression metrics

### Page Index Validation
**Purpose**: Ensure page progression makes logical sense
```javascript
// Page mapping with validation
const pageProgression = [
  { index: 0, key: 'current_height_and_weight', required_fields: ['weight_lbs', 'height_feet'] },
  { index: 1, key: 'bmi_goal_weight', required_fields: ['goal_weight_lbs', 'bmi'] },
  { index: 2, key: 'bmi_disqualified', required_fields: [] }, // Conditional
  { index: 3, key: 'sex', required_fields: ['sex_assigned_at_birth'] }
  // ... continues for all 32 pages
];
```

## Normalized Database Processing (CarePortals)

### Customer Deduplication Logic
**Purpose**: Maintain single customer record per email address

```javascript
function findOrCreateCustomer(customerData) {
  const customersSheet = getOrCreateSheet('customers');
  const email = customerData['customer.email'];
  
  // Search for existing customer by email
  const existingRow = findRowByEmail(customersSheet, email);
  
  if (existingRow) {
    // Return existing customer_id
    return customersSheet.getRange(existingRow, 1).getValue();
  } else {
    // Create new customer record
    const newCustomerData = [
      customerData['customer._id'], // Use CarePortals ID
      customerData['customer.email'],
      customerData['customer.firstName'] || '',
      customerData['customer.lastName'] || '',
      customerData['customer.phone'] || ''
    ];
    
    customersSheet.appendRow(newCustomerData);
    return customerData['customer._id'];
  }
}
```

### Address Normalization and MD5 Hashing
**Purpose**: Deduplicate addresses and create consistent references

```javascript
function createAddressId(addressData) {
  // Normalize address components
  let normalizedAddress = '';
  
  // Address line 1 normalization
  let addr1 = String(addressData['shippingAddress.address1'] || '').toLowerCase();
  addr1 = normalizeStreetTypes(addr1);
  addr1 = removeSpecialCharacters(addr1);
  normalizedAddress += addr1;
  
  // Add other components
  normalizedAddress += String(addressData['shippingAddress.address2'] || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  normalizedAddress += String(addressData['shippingAddress.city'] || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  normalizedAddress += String(addressData['shippingAddress.provinceCode'] || '').toLowerCase();
  normalizedAddress += String(addressData['shippingAddress.postalCode'] || '').replace(/[^0-9]/g, '');
  
  // Generate MD5 hash
  return Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, normalizedAddress, Utilities.Charset.UTF_8)
    .map(function(byte) {
      return (byte + 256).toString(16).slice(-2);
    }).join('');
}

function normalizeStreetTypes(address) {
  const replacements = {
    /\b(st|st\.)\b/g: 'street',
    /\b(ave|ave\.)\b/g: 'avenue', 
    /\b(dr|dr\.)\b/g: 'drive',
    /\b(rd|rd\.)\b/g: 'road',
    /\b(blvd|blvd\.)\b/g: 'boulevard',
    /\b(ln|ln\.)\b/g: 'lane',
    /\b(ct|ct\.)\b/g: 'court',
    /\b(pl|pl\.)\b/g: 'place',
    /\b(cir|cir\.)\b/g: 'circle',
    /\b(pkwy|pkwy\.)\b/g: 'parkway'
    // ... additional normalizations
  };
  
  let normalized = address;
  for (const [pattern, replacement] of Object.entries(replacements)) {
    normalized = normalized.replace(pattern, replacement);
  }
  
  return normalized;
}
```

### Pharmacy Assignment Logic
**Purpose**: Route orders to appropriate pharmacy based on shipping state

```javascript
function determinePharmacy(provinceCode) {
  const state = String(provinceCode || '').toUpperCase();
  
  // Special routing for specific states
  if (state === 'SC' || state === 'IN') {
    return 'Other';
  }
  
  // Default pharmacy for all other states
  return 'SevenCells';
}
```

**Business Rules**:
- **South Carolina (SC)**: Routes to "Other" pharmacy
- **Indiana (IN)**: Routes to "Other" pharmacy  
- **All Other States**: Route to "SevenCells" pharmacy
- **Unknown/Empty State**: Defaults to "SevenCells"

## Error Handling and Recovery

### Comprehensive Error Logging
**Purpose**: Capture all failures with sufficient context for debugging

```javascript
function handleWebhookError(error, rawData, sheetName) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    let errorSheet = spreadsheet.getSheetByName("Webhook_Errors");
    
    if (!errorSheet) {
      errorSheet = spreadsheet.insertSheet("Webhook_Errors");
      errorSheet.appendRow([
        "Timestamp", "Sheet_Target", "Error_Message", "Raw_Data"
      ]);
    }
    
    errorSheet.appendRow([
      getCurrentEasternTime(),
      sheetName,
      error.toString(),
      JSON.stringify(rawData)
    ]);
  } catch (logError) {
    console.error("Could not log error to sheet:", logError);
  }
}
```

### Data Recovery Processing
**Purpose**: Process failed webhook data from error sheets

```javascript
function processErrorsToOrderCreated() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const errorsSheet = spreadsheet.getSheetByName('Errors');
  const orderCreatedSheet = spreadsheet.getSheetByName('order.created');
  
  if (!errorsSheet || !orderCreatedSheet) {
    throw new Error('Required sheets not found');
  }
  
  // Get all values from column D in Errors sheet
  const lastRow = errorsSheet.getLastRow();
  if (lastRow < 2) return; // No data to process
  
  const errorData = errorsSheet.getRange('D2:D' + lastRow).getValues();
  const newRows = [];
  
  // Process each JSON string in error data
  errorData.forEach((row, index) => {
    const jsonString = row[0];
    if (!jsonString || jsonString.toString().trim() === '') return;
    
    try {
      const orderData = JSON.parse(jsonString);
      const processedRow = processOrderData(orderData);
      newRows.push(processedRow);
    } catch (error) {
      console.log(`Error parsing JSON in row ${index + 2}: ${error.message}`);
    }
  });
  
  // Add recovered data to target sheet
  if (newRows.length > 0) {
    const lastRowInOrderSheet = orderCreatedSheet.getLastRow();
    const range = orderCreatedSheet.getRange(lastRowInOrderSheet + 1, 1, newRows.length, newRows[0].length);
    range.setValues(newRows);
    console.log(`Successfully recovered ${newRows.length} orders from error data`);
  }
}
```

### Webhook Response Handling
**Purpose**: Provide meaningful responses for debugging and monitoring

```javascript
function createSuccessResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify({
      success: true,
      message: 'Data processed successfully',
      timestamp: getCurrentEasternTime(),
      recordsProcessed: data.recordCount || 1
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

function createErrorResponse(error, context) {
  return ContentService
    .createTextOutput(JSON.stringify({
      success: false,
      error: error.toString(),
      context: context,
      timestamp: getCurrentEasternTime()
    }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

## Performance Optimization

### Sheet Auto-Resizing
**Purpose**: Maintain readable column widths without performance impact
```javascript
// Optional auto-resize (can be disabled for performance)
if (ENABLE_AUTO_RESIZE) {
  sheet.autoResizeColumns(1, sheet.getLastColumn());
}
```

### Batch Processing
**Purpose**: Efficient handling of multiple records
```javascript
// Process multiple records in single operation
if (newRows.length > 0) {
  const range = sheet.getRange(lastRow + 1, 1, newRows.length, newRows[0].length);
  range.setValues(newRows); // Single batch write
}
```

### Header Management
**Purpose**: Dynamic sheet creation with consistent headers
```javascript
function ensureHeaders(sheet, headerArray) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headerArray);
    
    // Format header row
    const headerRange = sheet.getRange(1, 1, 1, headerArray.length);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#4a90e2");
    headerRange.setFontColor("#ffffff");
  }
}
```

## Integration Points

### GoHighLevel Webhook Integration
**Purpose**: Trigger marketing automation based on form completions
```javascript
function sendToGoHighLevel(submissionData) {
  const goHighLevelUrl = 'https://services.leadconnectorhq.com/hooks/webhook_url';
  
  const payload = {
    email: submissionData.email,
    firstName: submissionData.first_name,
    lastName: submissionData.last_name,
    phone: submissionData.phone,
    tags: ['completedsurvey', getFormSpecificTag(submissionData.form_source)]
  };
  
  const options = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    payload: JSON.stringify(payload)
  };
  
  try {
    UrlFetchApp.fetch(goHighLevelUrl, options);
  } catch (error) {
    console.error('GoHighLevel webhook failed:', error);
  }
}

function getFormSpecificTag(formSource) {
  const tagMap = {
    'medication v1': 'medicationsurvey',
    'semaglutide v1': 'semaglutidesurvey', 
    'tirzepatide v1': 'tirzepatidesurvey'
  };
  
  return tagMap[formSource] || 'generalsurvey';
}
```

### EMR Profile Link Generation  
**Purpose**: Create direct links to patient records in EMR system
```javascript
function generateEMRProfileLink(customerId) {
  if (!customerId) return '';
  return `https://emr.portals.care/customers/${customerId}?org=cmwl`;
}
```

This comprehensive webhook processing system ensures data quality, provides robust error handling, and maintains system integrity across all integration points.