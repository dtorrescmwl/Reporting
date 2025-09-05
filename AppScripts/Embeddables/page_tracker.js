// Handle GET requests (for browser testing)
function doGet(e) {
  return ContentService
    .createTextOutput('Page Tracker Webhook is running! Use POST to submit data.')
    .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  try {
    // Parse the incoming data
    const submissionData = JSON.parse(e.postData.contents);
    
    // Check if entryId is empty - if so, don't process
    if (!submissionData.entryId || submissionData.entryId.trim() === '') {
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false,
          message: 'EntryId is required'
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Get spreadsheet and sheets
    const spreadsheet = SpreadsheetApp.openById('1WVklvRZZqiVtVdD64IDm-vPSSvx-lv6QdXN9V8HC7hI');
    let trackerSheet = spreadsheet.getSheetByName('page.tracker');
    let logSheet = spreadsheet.getSheetByName('page.tracker_log');
    
    // Create sheets if they don't exist
    if (!trackerSheet) {
      trackerSheet = spreadsheet.insertSheet('page.tracker');
    }
    if (!logSheet) {
      logSheet = spreadsheet.insertSheet('page.tracker_log');
    }
    
    // Ensure headers exist
    if (trackerSheet.getLastRow() === 0) {
      setupTrackerHeaders(trackerSheet);
    }
    if (logSheet.getLastRow() === 0) {
      setupLogHeaders(logSheet);
    }
    
    // Process the submission
    const result = processPageSubmission(submissionData, trackerSheet, logSheet);
    
    console.log('Successfully processed page tracking:', submissionData.entryId);
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: 'Page tracking processed successfully',
        entryId: submissionData.entryId,
        action: result.action,
        loggedForward: result.loggedForward
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error processing page tracking:', error);
    
    return ContentService
      .createTextOutput(JSON.stringify({
        error: error.toString(),
        message: 'Failed to process page tracking'
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function processPageSubmission(submissionData, trackerSheet, logSheet) {
  const entryId = submissionData.entryId;
  const currentPageIndex = parseInt(submissionData.current_page_index) || 0;
  
  // Find existing entry in tracker sheet
  const trackerData = trackerSheet.getDataRange().getValues();
  const trackerHeaders = trackerData[0];
  const entryIdCol = trackerHeaders.indexOf('Entry ID') + 1;
  const furthestPageIndexCol = trackerHeaders.indexOf('Furthest Page Index') + 1;
  const firstStartedCol = trackerHeaders.indexOf('First Started') + 1;
  
  let existingRowIndex = -1;
  let existingFurthestPageIndex = -1;
  let existingFirstStarted = '';
  
  // Search for existing entry
  for (let i = 1; i < trackerData.length; i++) {
    if (trackerData[i][entryIdCol - 1] === entryId) {
      existingRowIndex = i + 1; // Convert to 1-based index
      existingFurthestPageIndex = parseInt(trackerData[i][furthestPageIndexCol - 1]) || 0;
      existingFirstStarted = trackerData[i][firstStartedCol - 1] || '';
      break;
    }
  }
  
  // Determine if this is forward movement
  const isForwardMovement = currentPageIndex > existingFurthestPageIndex;
  const isNewEntry = existingRowIndex === -1;
  
  // Always update tracker (upsert)
  const trackerRowData = buildTrackerRowData(
    submissionData, 
    isForwardMovement ? currentPageIndex : existingFurthestPageIndex, 
    isForwardMovement,
    isNewEntry,
    existingFirstStarted
  );
  
  if (existingRowIndex > 0) {
    // Update existing row
    trackerSheet.getRange(existingRowIndex, 1, 1, trackerRowData.length).setValues([trackerRowData]);
  } else {
    // Insert new row
    trackerSheet.appendRow(trackerRowData);
  }
  
  // Log only if forward movement
  let loggedForward = false;
  if (isForwardMovement) {
    const logRowData = buildLogRowData(submissionData);
    logSheet.appendRow(logRowData);
    loggedForward = true;
  }
  
  return {
    action: existingRowIndex > 0 ? 'updated' : 'created',
    loggedForward: loggedForward
  };
}

// Helper function to safely get string values
function safeString(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

// Helper function to format date of birth (MM/DD/YYYY)
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

// Helper function to format height
function formatHeight(feet, inches) {
  if (!feet || !inches) return '';
  
  const feetMap = {
    'feet_three': '3', 'feet_four': '4', 'feet_five': '5',
    'feet_six': '6', 'feet_seven': '7'
  };
  
  const inchesMap = {
    'inches_zero': '0', 'inches_one': '1', 'inches_two': '2', 'inches_three': '3',
    'inches_four': '4', 'inches_five': '5', 'inches_six': '6', 'inches_seven': '7',
    'inches_eight': '8', 'inches_nine': '9', 'inches_ten': '10', 'inches_eleven': '11'
  };
  
  const feetStr = String(feet).toLowerCase();
  const inchesStr = String(inches).toLowerCase();
  
  const feetNum = feetMap[feetStr] || '0';
  const inchesNum = inchesMap[inchesStr] || '0';
  
  return `${feetNum}'${inchesNum}''`;
}

// Helper function to capitalize state
function capitalizeState(state) {
  if (!state) return '';
  return String(state).toUpperCase();
}

// Helper function to parse disqualified reasons
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

// Generate ET datetime
function generateETDateTime() {
  const date = new Date();
  const etDate = new Date(date.toLocaleString("en-US", {timeZone: "America/New_York"}));
  const year = etDate.getFullYear();
  const month = String(etDate.getMonth() + 1).padStart(2, '0');
  const day = String(etDate.getDate()).padStart(2, '0');
  const hours = String(etDate.getHours()).padStart(2, '0');
  const minutes = String(etDate.getMinutes()).padStart(2, '0');
  const seconds = String(etDate.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function buildTrackerRowData(submissionData, furthestPageIndex, updateFurthest, isNewEntry, existingFirstStarted) {
  return [
    isNewEntry ? generateETDateTime() : existingFirstStarted, // First Started (only set once)
    generateETDateTime(), // Last Updated Timestamp
    safeString(submissionData.entryId), // Entry ID
    safeString(submissionData.form_source), // Form Source
    safeString(submissionData.current_page_key), // Current Page Key
    safeString(submissionData.current_page_id), // Current Page ID
    safeString(submissionData.current_page_index), // Current Page Index
    safeString(submissionData.first_name), // First Name
    safeString(submissionData.last_name), // Last Name
    safeString(submissionData.email), // Email
    safeString(submissionData.phone), // Phone
    safeString(submissionData.age), // Age at Submission
    formatDateOfBirth(submissionData.dob_day, submissionData.dob_month, submissionData.dob_year), // Date of Birth
    safeString(submissionData.sex_assigned_at_birth), // Sex Assigned at Birth
    capitalizeState(submissionData.state), // State
    formatHeight(submissionData.height_feet, submissionData.height_inches), // Height
    safeString(submissionData.weight_lbs), // Weight at Submission (lbs)
    safeString(submissionData.goal_weight_lbs), // Goal Weight (lbs)
    safeString(submissionData.weight_difference), // Weight Difference (lbs)
    safeString(submissionData.bmi), // BMI
    safeString(submissionData.dq_health_conditions_options), // Health Conditions
    safeString(submissionData.female_dq_questions), // Female Questions
    safeString(submissionData.disqualifier), // Disqualifier
    parseDisqualifiedReasons(submissionData.disqualified_reasons), // Disqualified Reasons
    safeString(submissionData.taking_wl_meds_options), // Taking WL Meds
    safeString(submissionData.taken_wl_meds_options), // Taken WL Meds
    safeString(submissionData.recently_took_wl_meds), // Recently Took WL Meds
    safeString(submissionData.glp_experience), // GLP Experience
    safeString(submissionData.previous_medication_options), // Previous GLP Taken
    safeString(submissionData.glp1_dosage_question_mg), // Last GLP Dosage
    safeString(submissionData.glp_details_last_dose), // GLP Details Last Dose
    safeString(submissionData.glp_details_starting_weight), // GLP Details Starting Weight
    safeString(submissionData.checkbox_notstack_glp), // Agreement Not to Stack
    safeString(submissionData.match_medication_options), // Match Medication Options
    safeString(submissionData.glp_recommendation), // Shown Recommendation
    safeString(submissionData.sleep_overall_options), // Sleep Overall
    safeString(submissionData.sleep_hours_selector), // Sleep Hours
    safeString(submissionData.effects_options_multiple), // Side Effects Experienced from Weight
    safeString(submissionData.concerns_options), // Concerns Options
    safeString(submissionData.priority_options), // Priority Options
    safeString(submissionData.glp_motivations), // GLP Motivations
    safeString(submissionData.weight_loss_pace), // Weight Loss Pace
    safeString(submissionData.willing_to_options), // Willing To Options
    safeString(submissionData.state_mind_options), // State of Mind
    safeString(submissionData.clicked_email_terms_conditions_checkbox), // Email Terms Conditions Checkbox
    safeString(submissionData.ip_address), // IP Address
    // Page tracking specific fields
    updateFurthest ? safeString(submissionData.current_page_key) : '', // Furthest Page Reached
    String(furthestPageIndex) // Furthest Page Index
  ];
}

function buildLogRowData(submissionData) {
  return [
    generateETDateTime(), // Timestamp ET
    safeString(submissionData.entryId), // Entry ID
    safeString(submissionData.form_source), // Form Source
    safeString(submissionData.current_page_key), // Current Page Key
    safeString(submissionData.current_page_id), // Current Page ID
    safeString(submissionData.current_page_index), // Current Page Index
    safeString(submissionData.first_name), // First Name
    safeString(submissionData.last_name), // Last Name
    safeString(submissionData.email), // Email
    safeString(submissionData.phone), // Phone
    safeString(submissionData.age), // Age at Submission
    formatDateOfBirth(submissionData.dob_day, submissionData.dob_month, submissionData.dob_year), // Date of Birth
    safeString(submissionData.sex_assigned_at_birth), // Sex Assigned at Birth
    capitalizeState(submissionData.state), // State
    formatHeight(submissionData.height_feet, submissionData.height_inches), // Height
    safeString(submissionData.weight_lbs), // Weight at Submission (lbs)
    safeString(submissionData.goal_weight_lbs), // Goal Weight (lbs)
    safeString(submissionData.weight_difference), // Weight Difference (lbs)
    safeString(submissionData.bmi), // BMI
    safeString(submissionData.dq_health_conditions_options), // Health Conditions
    safeString(submissionData.female_dq_questions), // Female Questions
    safeString(submissionData.disqualifier), // Disqualifier
    parseDisqualifiedReasons(submissionData.disqualified_reasons), // Disqualified Reasons
    safeString(submissionData.taking_wl_meds_options), // Taking WL Meds
    safeString(submissionData.taken_wl_meds_options), // Taken WL Meds
    safeString(submissionData.recently_took_wl_meds), // Recently Took WL Meds
    safeString(submissionData.glp_experience), // GLP Experience
    safeString(submissionData.previous_medication_options), // Previous GLP Taken
    safeString(submissionData.glp1_dosage_question_mg), // Last GLP Dosage
    safeString(submissionData.glp_details_last_dose), // GLP Details Last Dose
    safeString(submissionData.glp_details_starting_weight), // GLP Details Starting Weight
    safeString(submissionData.checkbox_notstack_glp), // Agreement Not to Stack
    safeString(submissionData.match_medication_options), // Match Medication Options
    safeString(submissionData.glp_recommendation), // Shown Recommendation
    safeString(submissionData.sleep_overall_options), // Sleep Overall
    safeString(submissionData.sleep_hours_selector), // Sleep Hours
    safeString(submissionData.effects_options_multiple), // Side Effects Experienced from Weight
    safeString(submissionData.concerns_options), // Concerns Options
    safeString(submissionData.priority_options), // Priority Options
    safeString(submissionData.glp_motivations), // GLP Motivations
    safeString(submissionData.weight_loss_pace), // Weight Loss Pace
    safeString(submissionData.willing_to_options), // Willing To Options
    safeString(submissionData.state_mind_options), // State of Mind
    safeString(submissionData.clicked_email_terms_conditions_checkbox), // Email Terms Conditions Checkbox
    safeString(submissionData.ip_address) // IP Address
  ];
}

function setupTrackerHeaders(sheet) {
  const headers = [
    'First Started', 'Last Updated Timestamp', 'Entry ID', 'Form Source', 
    'Current Page Key', 'Current Page ID', 'Current Page Index',
    'First Name', 'Last Name', 'Email', 'Phone', 'Age at Submission', 'Date of Birth', 'Sex Assigned at Birth',
    'State', 'Height', 'Weight at Submission (lbs)', 'Goal Weight (lbs)', 
    'Weight Difference (lbs)', 'BMI', 'Health Conditions', 'Female Questions',
    'Disqualifier', 'Disqualified Reasons', 'Taking WL Meds', 'Taken WL Meds',
    'Recently Took WL Meds', 'GLP Experience', 'Previous GLP Taken', 'Last GLP Dosage',
    'GLP Details Last Dose', 'GLP Details Starting Weight', 'Agreement Not to Stack',
    'Match Medication Options', 'Shown Recommendation', 'Sleep Overall', 'Sleep Hours',
    'Side Effects Experienced from Weight', 'Concerns Options', 'Priority Options',
    'GLP Motivations', 'Weight Loss Pace', 'Willing To Options', 'State of Mind',
    'Email Terms Conditions Checkbox', 'IP Address',
    'Furthest Page Reached', 'Furthest Page Index'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#f0f0f0');
  headerRange.setWrap(true);
  
  console.log('Tracker headers set up successfully');
}

function setupLogHeaders(sheet) {
  const headers = [
    'Timestamp ET', 'Entry ID', 'Form Source', 
    'Current Page Key', 'Current Page ID', 'Current Page Index',
    'First Name', 'Last Name', 'Email', 'Phone', 'Age at Submission', 'Date of Birth', 'Sex Assigned at Birth',
    'State', 'Height', 'Weight at Submission (lbs)', 'Goal Weight (lbs)', 
    'Weight Difference (lbs)', 'BMI', 'Health Conditions', 'Female Questions',
    'Disqualifier', 'Disqualified Reasons', 'Taking WL Meds', 'Taken WL Meds',
    'Recently Took WL Meds', 'GLP Experience', 'Previous GLP Taken', 'Last GLP Dosage',
    'GLP Details Last Dose', 'GLP Details Starting Weight', 'Agreement Not to Stack',
    'Match Medication Options', 'Shown Recommendation', 'Sleep Overall', 'Sleep Hours',
    'Side Effects Experienced from Weight', 'Concerns Options', 'Priority Options',
    'GLP Motivations', 'Weight Loss Pace', 'Willing To Options', 'State of Mind',
    'Email Terms Conditions Checkbox', 'IP Address'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#e8f5e8');
  headerRange.setWrap(true);
  
  console.log('Log headers set up successfully');
}

// Test function
function testPageTracking() {
  const testData = {
    entryId: 'page-test-' + Date.now(),
    submission_timestamp: new Date().toISOString(),
    form_source: 'medication v1',
    current_page_key: 'page-demographics',
    current_page_id: 'demo-page',
    current_page_index: '2',
    first_name: 'Page',
    last_name: 'Test',
    email: 'page.test@example.com',
    phone: '555-0123',
    age: '32'
  };
  
  const testEvent = {
    postData: {
      contents: JSON.stringify(testData)
    }
  };
  
  const result = doPost(testEvent);
  console.log('Page tracking test result:', result.getContent());
}