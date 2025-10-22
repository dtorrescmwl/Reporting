// Handle GET requests (for browser testing)
function doGet(e) {
  return ContentService
    .createTextOutput('General Submissions Webhook is running! Use POST to submit data.')
    .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  try {
    // Parse the incoming data
    const submissionData = JSON.parse(e.postData.contents);
    
    // Log all incoming submissions for debugging
    console.log('Received submission with entryId:', submissionData.entryId, 'email:', submissionData.email, 'phone:', submissionData.phone);
    
    // Check if email is empty - email is required
    if (!submissionData.email || submissionData.email.trim() === '') {
      console.log('Rejected submission - missing email:', submissionData.entryId);
      return;
    }
    
    // Log if phone is missing but continue processing
    if (!submissionData.phone || submissionData.phone.trim() === '') {
      console.log('Warning: submission missing phone, continuing with webhook:', submissionData.entryId);
    }
    
    // Email filtering - reject banned emails
    const email = String(submissionData.email || '').toLowerCase();
    const bannedEmails = ['test@email.com', 'test@test.com'];
    const bannedDomain = '@cmwl.com';
    
    if (bannedEmails.includes(email) || email.includes(bannedDomain)) {
      console.log('Rejected submission from banned email:', email);
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false,
          message: 'Submission rejected - invalid email',
          entryId: submissionData.entryId
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // FIXED: Specify the 'submissions' sheet explicitly
    const sheet = SpreadsheetApp.openById('1WVklvRZZqiVtVdD64IDm-vPSSvx-lv6QdXN9V8HC7hI')
      .getSheetByName('submissions');
    
    // FIXED: Ensure headers exist before adding data
    if (sheet.getLastRow() === 0) {
      setupSubmissionsHeaders();
    }
    
    // Helper function to safely get string values
    const safeString = (value) => {
      if (value === null || value === undefined) return '';
      if (typeof value === 'object') return JSON.stringify(value);
      return String(value);
    };
    
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
    
    // FIXED: Helper function to format height with complete dictionaries
    function formatHeight(feet, inches) {
      if (!feet || !inches) return '';
      
      console.log('Height input values:', { feet, inches });
      
      // Complete feet mapping (3-7 feet)
      const feetMap = {
        'feet_three': '3',
        'feet_four': '4', 
        'feet_five': '5',
        'feet_six': '6',
        'feet_seven': '7'
      };
      
      // Complete inches mapping (0-11 inches)
      const inchesMap = {
        'inches_zero': '0',
        'inches_one': '1',
        'inches_two': '2',
        'inches_three': '3',
        'inches_four': '4',
        'inches_five': '5',
        'inches_six': '6',
        'inches_seven': '7',
        'inches_eight': '8',
        'inches_nine': '9',
        'inches_ten': '10',
        'inches_eleven': '11'
      };
      
      // Extract numeric values using the mappings
      const feetStr = String(feet).toLowerCase();
      const inchesStr = String(inches).toLowerCase();
      
      const feetNum = feetMap[feetStr] || '0';
      const inchesNum = inchesMap[inchesStr] || '0';
      
      console.log('Height conversion:', { 
        feetStr, 
        inchesStr, 
        feetNum, 
        inchesNum, 
        result: `${feetNum}'${inchesNum}''` 
      });
      
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
    
    // FIXED: Generate ET datetime when received
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
    
    // FIXED: Add the data to sheet in the NEW ORDER
    sheet.appendRow([
      safeString(submissionData.submission_timestamp),                   // Submission Timestamp
      safeString(submissionData.entryId),                                // Entry ID
      safeString(submissionData.form_source),                            // Form Source
      safeString(submissionData.first_name),                             // First Name
      safeString(submissionData.last_name),                              // Last Name
      safeString(submissionData.email),                                  // Email
      safeString(submissionData.phone),                                  // Phone
      safeString(submissionData.age),                                    // Age at Submission
      formatDateOfBirth(submissionData.dob_day, submissionData.dob_month, submissionData.dob_year), // Date of Birth
      safeString(submissionData.sex_assigned_at_birth),                  // Sex Assigned at Birth
      capitalizeState(submissionData.state),                             // State (capitalized)
      formatHeight(submissionData.height_feet, submissionData.height_inches), // Height
      safeString(submissionData.weight_lbs),                             // Weight at Submission (lbs)
      safeString(submissionData.goal_weight_lbs),                        // Goal Weight (lbs)
      safeString(submissionData.weight_difference),                      // Weight Difference (lbs)
      safeString(submissionData.bmi),                                    // BMI
      safeString(submissionData.dq_health_conditions_options),           // Health Conditions
      safeString(submissionData.female_dq_questions),                    // Female Questions
      safeString(submissionData.disqualifier),                           // Disqualifier
      parseDisqualifiedReasons(submissionData.disqualified_reasons),     // Disqualified Reasons
      safeString(submissionData.taking_wl_meds_options),                 // Taking WL Meds
      safeString(submissionData.taken_wl_meds_options),                  // Taken WL Meds
      safeString(submissionData.recently_took_wl_meds),                  // Recently Took WL Meds
      safeString(submissionData.glp_experience),                         // GLP Experience
      safeString(submissionData.previous_medication_options),            // Previous GLP Taken
      safeString(submissionData.glp1_dosage_question_mg),                // Last GLP Dosage
      safeString(submissionData.glp_details_last_dose),                  // GLP Details Last Dose
      safeString(submissionData.glp_details_starting_weight),            // GLP Details Starting Weight
      safeString(submissionData.checkbox_notstack_glp),                  // Agreement Not to Stack
      safeString(submissionData.match_medication_options),               // Match Medication Options
      safeString(submissionData.glp_recommendation),                   // Shown Recommendation
      safeString(submissionData.sleep_overall_options),                  // Sleep Overall
      safeString(submissionData.sleep_hours_selector),                   // Sleep Hours
      safeString(submissionData.effects_options_multiple),               // Side Effects Experienced from Weight
      safeString(submissionData.concerns_options),                       // Concerns Options
      safeString(submissionData.priority_options),                       // Priority Options
      safeString(submissionData.glp_motivations),                        // GLP Motivations
      safeString(submissionData.weight_loss_pace),                       // Weight Loss Pace
      safeString(submissionData.willing_to_options),                     // Willing To Options
      safeString(submissionData.state_mind_options),                     // State of Mind
      safeString(submissionData.current_page_key),                       // Current Page Key
      safeString(submissionData.clicked_email_terms_conditions_checkbox), // Email Terms Conditions Checkbox
      safeString(submissionData.ip_address),                             // IP Address
      generateETDateTime()                                               // Datetime Received (MOVED TO LAST)
    ]);
    
    // NEW: Send outgoing webhook to GoHighLevel after successful sheet insertion
    console.log('Sheet insertion successful, about to send webhook for entryId:', submissionData.entryId);
    console.log('Raw submission data for webhook:', JSON.stringify(submissionData, null, 2));
    try {
      // Send single webhook with both tags
      const webhookSuccess = sendCombinedWebhook(submissionData);
      console.log('Combined webhook result for', submissionData.entryId, ':', webhookSuccess);
    } catch (webhookError) {
      console.error('Error sending combined webhook for', submissionData.entryId, ':', webhookError);
      console.error('Webhook error stack:', webhookError.stack);
      // Note: We don't fail the main submission if the webhook fails
    }
    
    // Log successful submission
    console.log('Successfully added general submission:', submissionData.entryId);
    
    // Return success response
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true, 
        message: 'General submission received and added to submissions sheet',
        entryId: submissionData.entryId,
        sheetType: 'submissions'
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error processing general submission:', error);
    
    // Return error response
    return ContentService
      .createTextOutput(JSON.stringify({
        error: error.toString(),
        message: 'Failed to process general submission'
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// NEW: Function to send combined webhook with both tags to GoHighLevel
function sendCombinedWebhook(submissionData) {
  console.log('=== WEBHOOK FUNCTION START ===');
  console.log('sendCombinedWebhook called for entryId:', submissionData.entryId);
  console.log('form_source value:', submissionData.form_source);
  console.log('first_name value:', submissionData.first_name);
  console.log('last_name value:', submissionData.last_name);
  console.log('email value:', submissionData.email);
  console.log('phone value:', submissionData.phone);
  
  try {
    // Determine form-specific tag
    let formTag = '';
    const formSource = String(submissionData.form_source || '').toLowerCase();
    console.log('Form source converted to lowercase:', formSource);
    
    switch(formSource) {
      case 'medication v1':
        formTag = 'generalsurvey';
        break;
      case 'tirzepatide v1':
        formTag = 'tirzepatidesurvey';
        break;
      case 'semaglutide v1':
        formTag = 'semaglutidesurvey';
        break;
      default:
        console.warn('Unknown form_source for webhook:', submissionData.form_source);
        formTag = 'unknownsurvey';
        break;
    }
    
    // Combine both tags - try different formats
    const combinedTags = `completedsurvey,${formTag}`; // Comma-separated approach
    
    // Prepare the payload for GoHighLevel
    const payload = {
      firstName: safeString(submissionData.first_name),
      lastName: safeString(submissionData.last_name),
      email: safeString(submissionData.email),
      phone: safeString(submissionData.phone) || 'No Phone Provided',
      tags: combinedTags
    };
    
    // Extra validation for webhook-critical data
    if (!payload.email || payload.email.trim() === '') {
      console.error('Cannot send webhook - email is required for GoHighLevel');
      return { success: false, error: 'Email required for webhook' };
    }
    
    // Helper function to safely get string values (redefined for this scope)
    function safeString(value) {
      if (value === null || value === undefined) return '';
      if (typeof value === 'object') return JSON.stringify(value);
      return String(value).trim();
    }
    
    // Webhook configuration
    const webhookUrl = 'https://rest.gohighlevel.com/v1/contacts/';
    const bearerToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsb2NhdGlvbl9pZCI6IjNmbDFlQ0VoUWRBbTgyUGdMN0lWIiwidmVyc2lvbiI6MSwiaWF0IjoxNzQzMDE3MzA3MzAyLCJzdWIiOiJhVlFyak9FU2ZTNUpDalFSR0FwMyJ9.S6zYJBH_jGIJ-B8hUUr2UrdLxLEdC3S9P-0TI196YTQ';
    
    // Set up the HTTP request options
    const options = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify(payload)
    };
    
    console.log('=== ABOUT TO SEND HTTP REQUEST ===');
    console.log('Webhook URL:', webhookUrl);
    console.log('HTTP options:', JSON.stringify(options, null, 2));
    console.log('Payload being sent:', JSON.stringify(payload, null, 2));
    
    // Send the request
    console.log('Calling UrlFetchApp.fetch...');
    const response = UrlFetchApp.fetch(webhookUrl, options);
    console.log('UrlFetchApp.fetch completed');
    
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();
    
    console.log('=== HTTP RESPONSE RECEIVED ===');
    console.log('Response code:', responseCode);
    console.log('Response text:', responseText);
    
    if (responseCode >= 200 && responseCode < 300) {
      console.log('Combined webhook sent successfully with tags:', combinedTags);
      return {
        success: true,
        responseCode: responseCode,
        response: responseText,
        tags: combinedTags
      };
    } else {
      console.error('Combined webhook failed with response code:', responseCode);
      return {
        success: false,
        responseCode: responseCode,
        response: responseText,
        tags: combinedTags
      };
    }
    
  } catch (error) {
    console.error('Error in sendCombinedWebhook:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

// FIXED: Function to set up column headers for submissions sheet with NEW ORDER
function setupSubmissionsHeaders() {
  const sheet = SpreadsheetApp.openById('1WVklvRZZqiVtVdD64IDm-vPSSvx-lv6QdXN9V8HC7hI')
    .getSheetByName('submissions');
  
  // Create the sheet if it doesn't exist
  if (!sheet) {
    const spreadsheet = SpreadsheetApp.openById('1WVklvRZZqiVtVdD64IDm-vPSSvx-lv6QdXN9V8HC7hI');
    const newSheet = spreadsheet.insertSheet('submissions');
    return setupSubmissionsHeaders(); // Recursive call to set up headers on new sheet
  }
  
  const headers = [
    'Submission Timestamp',           // When form was submitted (from frontend)
    'Entry ID',                       // Unique identifier for this submission
    'Form Source',                    // Which form version (e.g., "medication v1")
    'First Name',
    'Last Name', 
    'Email',
    'Phone',
    'Age at Submission',              // UPDATED NAME
    'Date of Birth',                  // COMBINED DOB FIELD
    'Sex Assigned at Birth',
    'State',                          // Will be capitalized
    'Height',                         // COMBINED HEIGHT FIELD
    'Weight at Submission (lbs)',     // UPDATED NAME
    'Goal Weight (lbs)',
    'Weight Difference (lbs)',        // UPDATED NAME
    'BMI',
    'Health Conditions',              // UPDATED NAME
    'Female Questions',               // UPDATED NAME
    'Disqualifier',
    'Disqualified Reasons',           // Will show parsed reasonsList
    'Taking WL Meds',
    'Taken WL Meds', 
    'Recently Took WL Meds',
    'GLP Experience',
    'Previous GLP Taken',             // NEW FIELD
    'Last GLP Dosage',                // NEW FIELD
    'GLP Details Last Dose',
    'GLP Details Starting Weight',
    'Agreement Not to Stack',         // NEW FIELD
    'Match Medication Options',
    'Shown Recommendation',           // NEW FIELD
    'Sleep Overall',
    'Sleep Hours',
    'Side Effects Experienced from Weight', // UPDATED NAME
    'Concerns Options', 
    'Priority Options',
    'GLP Motivations',
    'Weight Loss Pace',
    'Willing To Options',
    'State of Mind',
    'Current Page Key',
    'Email Terms Conditions Checkbox',
    'IP Address',
    'Datetime Received'               // MOVED TO LAST
  ];
  
  // FIXED: Don't clear existing content, just add headers if needed
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // Format headers
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#f0f0f0');
    headerRange.setWrap(true);
    
    // Auto-resize columns to fit content
    for (let i = 1; i <= headers.length; i++) {
      sheet.autoResizeColumn(i);
    }
    
    console.log('Submissions headers set up successfully with', headers.length, 'columns');
  } else {
    console.log('Headers already exist, skipping setup');
  }
}

// FIXED: Test function for submissions
function testSubmissionsWebhook() {
  // Set up headers first
  setupSubmissionsHeaders();
  
  const testData = {
    submission_timestamp: new Date().toISOString(),
    entryId: 'submission-test-' + Date.now(),
    form_source: 'tirzepatide v1',
    first_name: 'Jane',
    last_name: 'Doe',
    email: 'jane@example.com',
    phone: '555-1234',
    age: '30',
    dob_day: '15',
    dob_month: 'aug',
    dob_year: '1994',
    sex_assigned_at_birth: 'female',
    state: 'ny',
    weight_lbs: '150',
    height_feet: 'feet_five',
    height_inches: 'inches_six',
    bmi: '24.2',
    disqualifier: false,
    disqualified_reasons: '',
    previous_medication_options: 'ozempic',
    glp1_dosage_question_mg: '1.0',
    checkbox_notstack_glp: true,
    match_recommendation: 'semaglutide',
    current_page_key: 'submission-complete'
  };
  
  const testEvent = {
    postData: {
      contents: JSON.stringify(testData)
    },
    parameter: {}
  };
  
  const result = doPost(testEvent);
  console.log('Submissions test result:', result.getContent());
}

// NEW: Test function for combined webhook
function testCombinedWebhook() {
  const testData = {
    first_name: 'Combined',
    last_name: 'Test',
    email: 'combined.test@example.com',
    phone: '+1999888777',
    form_source: 'semaglutide v1'  // Should get both 'completedsurvey' and 'semaglutidesurvey'
  };
  
  console.log('Testing combined webhook with both tags:');
  const result = sendCombinedWebhook(testData);
  console.log('Combined webhook result:', result);
  return result;
}

/**
 * New test function to verify doPost flow without actual sheet writing
 */
function testDoPostFlow() {
  console.log('=== TESTING COMPLETE DOPOST FLOW ===');
  
  const mockEvent = {
    postData: {
      contents: JSON.stringify({
        entryId: 'debug_test_' + new Date().getTime(),
        form_source: 'medication v1',
        first_name: 'Debug',
        last_name: 'Test',
        email: 'debug.test@example.com',
        phone: '555-999-8888',
        submission_timestamp: new Date().toISOString(),
        age: '25',
        sex_assigned_at_birth: 'Male'
      })
    }
  };
  
  try {
    // Temporarily bypass sheet operations to test webhook flow
    console.log('Mock event created, testing doPost...');
    const result = doPost(mockEvent);
    console.log('doPost completed, result:', result.getContent());
    return JSON.parse(result.getContent());
  } catch (error) {
    console.error('doPost test failed with error:', error);
    console.error('Error stack:', error.stack);
    return { error: error.toString(), stack: error.stack };
  }
}

/**
 * Test GoHighLevel API endpoint directly
 */
function testGoHighLevelAPI() {
  console.log('=== TESTING GOHIGHLEVEL API DIRECTLY ===');
  
  const webhookUrl = 'https://rest.gohighlevel.com/v1/contacts/';
  const bearerToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsb2NhdGlvbl9pZCI6IjNmbDFlQ0VoUWRBbTgyUGdMN0lWIiwidmVyc2lvbiI6MSwiaWF0IjoxNzQzMDE3MzA3MzAyLCJzdWIiOiJhVlFyak9FU2ZTNUpDalFSR0FwMyJ9.S6zYJBH_jGIJ-B8hUUr2UrdLxLEdC3S9P-0TI196YTQ';
  
  const testPayload = {
    firstName: 'API',
    lastName: 'Test',
    email: 'api.test@example.com',
    phone: '555-000-1111',
    tags: 'apitestsurvey'
  };
  
  const options = {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${bearerToken}`,
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify(testPayload)
  };
  
  try {
    console.log('Testing direct API call to GoHighLevel...');
    console.log('URL:', webhookUrl);
    console.log('Payload:', JSON.stringify(testPayload, null, 2));
    
    const response = UrlFetchApp.fetch(webhookUrl, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();
    
    console.log('API Test Response Code:', responseCode);
    console.log('API Test Response Text:', responseText);
    
    return {
      success: responseCode >= 200 && responseCode < 300,
      responseCode,
      responseText
    };
    
  } catch (error) {
    console.error('API test error:', error);
    return { success: false, error: error.toString() };
  }
}