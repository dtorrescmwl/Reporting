// Handle GET requests (for browser testing)
function doGet(e) {
  return ContentService
    .createTextOutput('Survey Started Webhook is running! Use POST to submit survey data.')
    .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  try {
    // Parse the incoming data
    const submissionData = JSON.parse(e.postData.contents);
    
    // Open your Google Sheet - SURVEY STARTED SHEET
    const sheet = SpreadsheetApp.openById('1WVklvRZZqiVtVdD64IDm-vPSSvx-lv6QdXN9V8HC7hI')
      .getSheetByName('survey.started');
    
    // Check if headers exist, if not create them
    if (sheet.getLastRow() === 0) {
      setupSurveyHeaders();
    }
    
    // Helper function to safely get string values
    const safeString = (value) => {
      if (value === null || value === undefined) return '';
      if (typeof value === 'object') return JSON.stringify(value);
      return String(value);
    };
    
    // Helper function to generate formatted date (ET timezone) - same as frontend
    const generateFormattedDateET = () => {
      const date = new Date();
      const etDate = new Date(date.toLocaleString("en-US", {timeZone: "America/New_York"}));
      const year = etDate.getFullYear();
      const month = String(etDate.getMonth() + 1).padStart(2, '0');
      const day = String(etDate.getDate()).padStart(2, '0');
      const hours = String(etDate.getHours()).padStart(2, '0');
      const minutes = String(etDate.getMinutes()).padStart(2, '0');
      const seconds = String(etDate.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    };
    
    // Add the survey data to your sheet in the EXACT order specified
    sheet.appendRow([
      safeString(submissionData.submission_timestamp), // Submission Timestamp
      safeString(submissionData.entry_id), // Entry ID
      safeString(submissionData.form_source), // Form Source
      safeString(submissionData.ip_address), // IP Address
      generateFormattedDateET(), // Datetime Received (added by Apps Script in ET)
    ]);
    
    // Return success response
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true, 
        message: 'Survey data received and added to sheet',
        entryId: submissionData.entry_id,
        formSource: submissionData.form_source,
        sheetType: 'survey.started'
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    // Return error response
    return ContentService
      .createTextOutput(JSON.stringify({
        error: error.toString(),
        message: 'Failed to process survey submission'
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Function to set up column headers for survey started sheet (run this once or automatically)
function setupSurveyHeaders() {
  const sheet = SpreadsheetApp.openById('1WVklvRZZqiVtVdD64IDm-vPSSvx-lv6QdXN9V8HC7hI')
    .getSheetByName('survey.started');
  
  // Headers in the EXACT order specified to match existing spreadsheet
  const headers = [
    'Submission Timestamp',
    'Entry ID',
    'Form Source',
    'IP Address',
    'Datetime Received', // Added by Apps Script - matches existing header    
  ];
  
  // Add headers to the sheet
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Format headers
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.getRange(1, 1, 1, headers.length).setBackground('#f0f0f0');
}

// Enhanced test function to verify your survey setup
function testSurveyWebhook() {
  const testData = {
    entry_id: 'survey-test-' + new Date().getTime(),
    form_source: 'Test Form',
    ip_address: '192.168.1.1',
    submission_timestamp: new Date().toISOString().replace('T', ' ').split('.')[0]
  };
  
  const testEvent = {
    postData: {
      contents: JSON.stringify(testData)
    },
    parameter: {}
  };
  
  const result = doPost(testEvent);
  console.log('Test result:', result.getContent());
}

// Helper function to check if sheet exists and create it if it doesn't
function ensureSheetExists() {
  const spreadsheet = SpreadsheetApp.openById('1WVklvRZZqiVtVdD64IDm-vPSSvx-lv6QdXN9V8HC7hI');
  let sheet = spreadsheet.getSheetByName('survey.started');
  
  if (!sheet) {
    sheet = spreadsheet.insertSheet('survey.started');
  }
  
  // Set up headers if the sheet is empty
  if (sheet.getLastRow() === 0) {
    setupSurveyHeaders();
  }
  
  return sheet;
}

function unmergeAll() {
  var sheet = SpreadsheetApp.getActiveSheet();
  var range = sheet.getDataRange();
  range.breakApart();
}