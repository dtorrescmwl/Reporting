/**
 * Questionnaire Webhook Handler
 * Receives questionnaire submissions and stores them in organized tabs
 * Handles: wlus, wlusmonthly, facesheet, facesheet_ext
 */

const SPREADSHEET_ID = '1VLjobTfPvSc0UJrS6jdpVfAsTw0D7wTZNKGi4nEzDcY';

// Tab names (must match spreadsheet tabs)
const QUESTIONNAIRE_TABS = {
  'wlus': 'wlus',
  'wlusmonthly': 'wlusmonthly',
  'facesheet': 'facesheet',
  'facesheet_ext': 'facesheet_ext'
};

/**
 * Convert UTC datetime to Eastern Time
 */
function convertToEasternTime(utcDateString) {
  if (!utcDateString) return '';

  try {
    const utcDate = new Date(utcDateString);
    const easternTime = utcDate.toLocaleString("en-US", {
      timeZone: "America/New_York",
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    });
    return easternTime;
  } catch (error) {
    console.error("Error converting time:", error);
    return utcDateString;
  }
}

/**
 * Extract names from list of objects with 'name' field
 */
function extractListNames(listData) {
  if (!Array.isArray(listData)) return '';

  const names = listData
    .filter(item => item && item.name)
    .map(item => item.name);

  return names.join(', ');
}

/**
 * Consolidate boolean group into comma-separated list
 */
function consolidateBooleanGroup(groupDict) {
  if (typeof groupDict !== 'object' || groupDict === null) {
    return groupDict;
  }

  const trueKeys = [];
  const otherValues = {};

  for (const [key, value] of Object.entries(groupDict)) {
    if (typeof value === 'boolean' && value === true) {
      // Remove redundant prefix from key name
      const cleanKey = key.includes('_') ? key.split('_').pop() : key;
      trueKeys.push(cleanKey);
    } else if (typeof value !== 'boolean') {
      const cleanKey = key.includes('_') ? key.split('_').pop() : key;
      otherValues[cleanKey] = value;
    }
  }

  if (trueKeys.length === 0 && Object.keys(otherValues).length === 0) {
    return '';
  }

  let result = trueKeys.join(', ');

  // Add descriptions or other values
  for (const [key, value] of Object.entries(otherValues)) {
    if (result) {
      result += ` (${key}: ${value})`;
    } else {
      result = String(value);
    }
  }

  return result;
}

/**
 * Check if column should be excluded
 */
function shouldExcludeColumn(columnName) {
  const excludeKeywords = ['consent', 'complete', 'status', 'states'];
  const columnLower = String(columnName).toLowerCase();
  return excludeKeywords.some(keyword => columnLower.includes(keyword));
}

/**
 * Flatten nested dictionary structure
 */
function flattenDict(obj, parentKey = '', separator = '_') {
  const items = [];

  for (const [key, value] of Object.entries(obj)) {
    const newKey = parentKey ? `${parentKey}${separator}${key}` : key;

    // Skip excluded fields
    if (shouldExcludeColumn(newKey)) {
      continue;
    }

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Check if this dict contains a 'list' key
      if ('list' in value && Array.isArray(value.list)) {
        items.push([newKey, extractListNames(value.list)]);
      }
      // Special handling for height/weight data
      else if ('heightUnit' in value || 'weightUnit' in value) {
        for (const [subKey, subVal] of Object.entries(value)) {
          items.push([`${newKey}_${subKey}`, subVal]);
        }
      }
      // Check if this is a boolean group
      else if (Object.values(value).every(v => typeof v === 'boolean' || typeof v === 'string' || typeof v === 'number')) {
        const consolidated = consolidateBooleanGroup(value);
        items.push([newKey, consolidated]);
      }
      else {
        // Recursively flatten
        items.push(...flattenDict(value, newKey, separator));
      }
    }
    else if (Array.isArray(value)) {
      // Convert arrays to comma-separated if simple strings, otherwise JSON
      if (value.every(item => typeof item === 'string')) {
        items.push([newKey, value.join(', ')]);
      } else {
        items.push([newKey, JSON.stringify(value)]);
      }
    }
    else {
      items.push([newKey, value]);
    }
  }

  return items;
}

/**
 * Parse questionnaire entry
 */
function parseQuestionnaireEntry(entry) {
  const answers = entry.answers || {};
  const flatData = flattenDict(answers);

  const customer = entry.customer || {};
  const firstName = customer.firstName || '';
  const lastName = customer.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim();

  // Create result object with metadata
  const result = {
    'questionnaire_id': entry._id || '',
    'user_id': customer._id || '',
    'name': fullName,
    'gender': customer.gender || '',
    'dob': customer.dob || '',
    'created_at': convertToEasternTime(entry.createdAt || ''),
    'updated_at': convertToEasternTime(entry.updatedAt || '')
  };

  // Add all flattened answer fields
  for (const [key, value] of flatData) {
    result[key] = value;
  }

  return result;
}

/**
 * Get or create sheet
 */
function getOrCreateSheet(spreadsheet, sheetName) {
  let sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    console.log(`Creating sheet: ${sheetName}`);
    sheet = spreadsheet.insertSheet(sheetName);
  }
  return sheet;
}

/**
 * Find existing entry by user_id within 24 hours
 */
function findAndRemoveDuplicateEntry(sheet, userId, newTimestamp) {
  if (sheet.getLastRow() <= 1) return; // Only header or empty

  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  // Find column indices
  const userIdColIndex = headers.indexOf('user_id');
  const createdAtColIndex = headers.indexOf('created_at');

  if (userIdColIndex === -1 || createdAtColIndex === -1) {
    console.log('Required columns not found');
    return;
  }

  // Parse new timestamp
  const newDate = new Date(newTimestamp);

  // Check rows from bottom to top (to safely delete)
  for (let i = data.length - 1; i >= 1; i--) {
    const rowUserId = data[i][userIdColIndex];
    const rowTimestamp = data[i][createdAtColIndex];

    if (rowUserId === userId) {
      // Parse existing timestamp
      try {
        const existingDate = new Date(rowTimestamp);
        const timeDiff = Math.abs(newDate - existingDate) / 1000; // seconds

        // If within 24 hours (86400 seconds)
        if (timeDiff < 86400) {
          console.log(`Removing duplicate entry at row ${i + 1} (within 24h)`);
          sheet.deleteRow(i + 1);
        }
      } catch (error) {
        console.error(`Error parsing date for row ${i + 1}:`, error);
      }
    }
  }
}

/**
 * Add entry to sheet
 */
function addEntryToSheet(spreadsheet, sheetName, parsedData) {
  const sheet = getOrCreateSheet(spreadsheet, sheetName);

  // Get or create headers
  const headers = Object.keys(parsedData);

  if (sheet.getLastRow() === 0) {
    // Add headers
    sheet.appendRow(headers);
    console.log(`Added headers to ${sheetName}`);
  } else {
    // Verify headers match (get existing headers)
    const existingHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

    // If headers don't match, need to handle column alignment
    if (JSON.stringify(existingHeaders) !== JSON.stringify(headers)) {
      console.log('Headers differ, aligning data...');
      // Create data array aligned with existing headers
      const rowData = existingHeaders.map(header => parsedData[header] || '');

      // Check for and remove duplicates within 24h
      findAndRemoveDuplicateEntry(sheet, parsedData.user_id, parsedData.created_at);

      // Add new row
      sheet.appendRow(rowData);
      return;
    }
  }

  // Check for and remove duplicates within 24h
  findAndRemoveDuplicateEntry(sheet, parsedData.user_id, parsedData.created_at);

  // Add row
  const rowData = headers.map(header => parsedData[header] || '');
  sheet.appendRow(rowData);

  console.log(`Added entry to ${sheetName}`);
}

/**
 * Main webhook handler
 */
function doPost(e) {
  try {
    console.log('=== QUESTIONNAIRE WEBHOOK RECEIVED ===');

    if (!e.postData || !e.postData.contents) {
      console.error('No POST data received');
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'No POST data received'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const data = JSON.parse(e.postData.contents);
    const questionnaireType = data.type;

    console.log(`Questionnaire type: ${questionnaireType}`);

    // Check if this is a questionnaire type we handle
    if (!QUESTIONNAIRE_TABS[questionnaireType]) {
      console.log(`Skipping questionnaire type: ${questionnaireType}`);
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: `Questionnaire type ${questionnaireType} not handled`
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Parse the entry
    const parsedData = parseQuestionnaireEntry(data);

    // Open spreadsheet
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);

    // Add to appropriate tab
    const sheetName = QUESTIONNAIRE_TABS[questionnaireType];
    addEntryToSheet(spreadsheet, sheetName, parsedData);

    console.log('=== PROCESSING COMPLETE ===');

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      questionnaireType: questionnaireType,
      userId: parsedData.user_id,
      timestamp: parsedData.created_at
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    console.error('=== ERROR ===');
    console.error('Error:', error.toString());
    console.error('Stack:', error.stack);

    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Test function with sample data
 */
function testWebhook() {
  const sampleData = {
    "_id": "test123",
    "type": "wlus",
    "customer": {
      "_id": "user123",
      "firstName": "Test",
      "lastName": "User",
      "gender": "female",
      "dob": "1990-01-01"
    },
    "createdAt": "2025-10-16T14:30:00.000Z",
    "updatedAt": "2025-10-16T14:30:00.000Z",
    "answers": {
      "wlus_highestWeight": {
        "highestWeight": "200lbs"
      },
      "wlus_MedicalConditions": {
        "noneOfTheAbove": true
      }
    }
  };

  const e = {
    postData: {
      contents: JSON.stringify(sampleData)
    }
  };

  const result = doPost(e);
  console.log('Test result:', result.getContent());
}

/**
 * GET handler for testing
 */
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    service: 'Questionnaire Webhook Handler',
    status: 'active',
    timestamp: new Date().toISOString(),
    version: '1.0',
    questionnaireTypes: Object.keys(QUESTIONNAIRE_TABS),
    spreadsheet: SPREADSHEET_ID
  }, null, 2)).setMimeType(ContentService.MimeType.JSON);
}
