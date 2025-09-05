# Business Rules and Validation Logic

## Overview

This document details all business rules, validation logic, and data quality controls implemented across the healthcare funnel and CRM system. These rules ensure data integrity, regulatory compliance, and operational efficiency.

## Data Quality and Validation Rules

### Email Validation Rules

#### Primary Validation
**Purpose**: Ensure email is valid primary key for cross-system matching
```javascript
// Required field validation
if (!submissionData.email || submissionData.email.trim() === '') {
  return reject('Email address is required');
}

// Format validation (basic)
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailPattern.test(submissionData.email)) {
  return reject('Invalid email format');
}
```

#### Banned Email Filtering
**Purpose**: Prevent test data and internal emails from entering production reporting
```javascript
const bannedEmails = [
  'test@email.com',
  'test@test.com',
  'demo@example.com',
  'sample@sample.com'
];

const bannedDomains = [
  '@cmwl.com',        // Internal company domain
  '@example.com',     // Common test domain
  '@test.com',        // Test domain
  '@tempmail.com'     // Temporary email services
];

// Check banned emails
if (bannedEmails.includes(submissionData.email.toLowerCase())) {
  return reject('Email address not permitted');
}

// Check banned domains
for (const domain of bannedDomains) {
  if (submissionData.email.toLowerCase().includes(domain)) {
    return reject('Email domain not permitted');
  }
}
```

**Business Impact**: Prevents test data from contaminating production analytics and ensures marketing automation targets real customers only.

### Phone Validation Rules

#### Required Field Validation
**Purpose**: Ensure contact method available for customer follow-up
```javascript
if (!submissionData.phone || submissionData.phone.trim() === '') {
  return reject('Phone number is required');
}

// Minimum length check (basic validation)
if (submissionData.phone.replace(/[^0-9]/g, '').length < 10) {
  return reject('Phone number must be at least 10 digits');
}
```

**Business Rules**:
- Phone number required for all form submissions
- Used as secondary matching key if email issues occur
- Critical for healthcare follow-up and compliance

### Medical Data Validation

#### BMI Qualification Rules
**Purpose**: Ensure patients meet medical criteria for GLP-1 therapy
```javascript
function validateBMI(weight_lbs, height_feet, height_inches) {
  // Convert height to total inches
  const totalInches = (parseInt(height_feet) * 12) + parseInt(height_inches);
  
  // Calculate BMI: (weight in pounds / (height in inches)²) × 703
  const bmi = (parseFloat(weight_lbs) / (totalInches * totalInches)) * 703;
  
  // Medical qualification threshold
  if (bmi < 27.0) {
    return {
      qualified: false,
      disqualifier: 'bmi_too_low',
      reason: 'BMI below 27 - not eligible for GLP-1 therapy'
    };
  }
  
  if (bmi > 50.0) {
    return {
      qualified: false,
      disqualifier: 'bmi_too_high', 
      reason: 'BMI above 50 - requires specialized medical evaluation'
    };
  }
  
  return { qualified: true, bmi: bmi.toFixed(1) };
}
```

**Clinical Standards**:
- **Minimum BMI**: 27.0 for GLP-1 therapy eligibility
- **Maximum BMI**: 50.0 for standard protocol (above requires special evaluation)
- **Calculation**: Standard BMI formula with metric conversion

#### Age Qualification Rules
**Purpose**: Ensure patients meet age requirements for treatment
```javascript
function validateAge(dob_year, dob_month, dob_day) {
  const birthDate = new Date(dob_year, getMonthNumber(dob_month) - 1, dob_day);
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  
  // Adjust for birthday not yet occurred this year
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  if (age < 18) {
    return {
      qualified: false,
      disqualifier: 'under_18',
      reason: 'Patient must be 18 or older for treatment'
    };
  }
  
  if (age > 89) {
    return {
      qualified: false,
      disqualifier: 'over_89',
      reason: 'Patients over 89 require specialized medical evaluation'
    };
  }
  
  return { qualified: true, age: age };
}
```

**Age Requirements**:
- **Minimum Age**: 18 years (legal adult consent)
- **Maximum Age**: 89 years (above requires specialized evaluation)
- **Calculation**: Accurate age accounting for birth date

#### Medical Condition Disqualification
**Purpose**: Screen for contraindicated medical conditions
```javascript
const disqualifyingConditions = [
  'type_1_diabetes',
  'pancreatic_disease',
  'thyroid_cancer_history',
  'multiple_endocrine_neoplasia',
  'severe_kidney_disease',
  'severe_liver_disease',
  'eating_disorder_active',
  'pregnancy',
  'breastfeeding'
];

function validateMedicalConditions(healthConditions) {
  const selectedConditions = Array.isArray(healthConditions) ? 
    healthConditions : JSON.parse(healthConditions || '[]');
    
  const disqualifying = selectedConditions.filter(condition => 
    disqualifyingConditions.includes(condition)
  );
  
  if (disqualifying.length > 0) {
    return {
      qualified: false,
      disqualifier: 'medical_conditions',
      reasons: disqualifying,
      message: 'Medical conditions contraindicate GLP-1 therapy'
    };
  }
  
  return { qualified: true };
}
```

**Medical Contraindications**:
- **Absolute Contraindications**: Type 1 diabetes, pancreatic disease, thyroid cancer history
- **Relative Contraindications**: Severe organ disease, active eating disorders
- **Temporary Contraindications**: Pregnancy, breastfeeding

#### Female-Specific Qualifications
**Purpose**: Address female-specific medical considerations
```javascript
function validateFemaleSpecific(sex, femaleQuestions) {
  if (sex !== 'female') {
    return { qualified: true, applies: false };
  }
  
  const responses = Array.isArray(femaleQuestions) ? 
    femaleQuestions : JSON.parse(femaleQuestions || '[]');
  
  // Check for pregnancy/breastfeeding
  if (responses.includes('currently_pregnant') || responses.includes('breastfeeding')) {
    return {
      qualified: false,
      disqualifier: 'pregnancy_breastfeeding',
      reason: 'GLP-1 therapy contraindicated during pregnancy/breastfeeding'
    };
  }
  
  // Check for trying to conceive
  if (responses.includes('trying_to_conceive')) {
    return {
      qualified: false,
      disqualifier: 'trying_to_conceive',
      reason: 'GLP-1 therapy not recommended when trying to conceive'
    };
  }
  
  return { qualified: true };
}
```

## Page Progression Rules

### Forward-Only Movement Logic
**Purpose**: Maintain accurate funnel analytics by preventing duplicate entries
```javascript
function validatePageProgression(entryId, currentPageIndex, existingData) {
  // Find existing progression for this entry
  const existingEntry = existingData.find(row => row.entryId === entryId);
  
  if (!existingEntry) {
    // New entry - allow any page
    return { 
      valid: true, 
      action: 'create',
      shouldLog: true 
    };
  }
  
  const existingHighestIndex = parseInt(existingEntry.furthestPageIndex) || 0;
  const currentIndex = parseInt(currentPageIndex) || 0;
  
  if (currentIndex > existingHighestIndex) {
    // Forward progression - update and log
    return {
      valid: true,
      action: 'update',
      shouldLog: true,
      newHighest: currentIndex
    };
  } else {
    // Backward or same page - update but don't log
    return {
      valid: true,
      action: 'update',
      shouldLog: false
    };
  }
}
```

**Analytics Rules**:
- **New Entries**: Always logged regardless of page
- **Forward Movement**: Only log progression to higher page indices
- **Backward Movement**: Update tracker but don't create log entry
- **Same Page**: Update timestamp but don't create duplicate log

### Page Index Validation
**Purpose**: Ensure page progression follows logical funnel flow
```javascript
const validPageProgression = [
  { index: 0, key: 'current_height_and_weight', required: true },
  { index: 1, key: 'bmi_goal_weight', required: true },
  { index: 2, key: 'bmi_disqualified', conditional: 'bmi < 27' },
  { index: 3, key: 'sex', required: true },
  { index: 4, key: 'female_disqualifiers', conditional: 'sex === female' },
  // ... continues for all 32 pages
];

function validatePageSequence(currentPageKey, currentPageIndex, previousPages) {
  const pageConfig = validPageProgression.find(p => p.index === currentPageIndex);
  
  if (!pageConfig) {
    return { valid: false, error: 'Invalid page index' };
  }
  
  if (pageConfig.key !== currentPageKey) {
    return { valid: false, error: 'Page key/index mismatch' };
  }
  
  // Check conditional pages
  if (pageConfig.conditional) {
    const shouldShow = evaluateCondition(pageConfig.conditional, previousPages);
    if (!shouldShow) {
      return { valid: false, error: 'Page shown inappropriately based on conditions' };
    }
  }
  
  return { valid: true };
}
```

## Data Normalization Rules

### Address Standardization
**Purpose**: Create consistent address records for deduplication and routing
```javascript
const streetTypeNormalizations = {
  // Street variations
  'street': ['st', 'st.', 'str', 'str.'],
  'avenue': ['ave', 'ave.', 'av', 'av.'], 
  'drive': ['dr', 'dr.', 'drv', 'drv.'],
  'road': ['rd', 'rd.', 'r', 'r.'],
  'boulevard': ['blvd', 'blvd.', 'boul', 'boul.'],
  'lane': ['ln', 'ln.', 'la', 'la.'],
  'court': ['ct', 'ct.', 'crt', 'crt.'],
  'place': ['pl', 'pl.', 'plc', 'plc.'],
  'circle': ['cir', 'cir.', 'circ', 'circ.'],
  'parkway': ['pkwy', 'pkwy.', 'pky', 'pky.'],
  'way': ['wy', 'wy.', 'w', 'w.'],
  'trail': ['trl', 'trl.', 'tr', 'tr.'],
  'terrace': ['ter', 'ter.', 'terr', 'terr.'],
  'square': ['sq', 'sq.', 'sqr', 'sqr.'],
  'plaza': ['plz', 'plz.', 'pl', 'pl.']
};

function normalizeAddress(addressLine) {
  let normalized = addressLine.toLowerCase().trim();
  
  // Apply street type normalizations
  for (const [standard, variations] of Object.entries(streetTypeNormalizations)) {
    for (const variation of variations) {
      const pattern = new RegExp(`\\b${variation}\\b`, 'g');
      normalized = normalized.replace(pattern, standard);
    }
  }
  
  // Remove punctuation and extra spaces
  normalized = normalized.replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
  
  return normalized;
}
```

### State Code Standardization
**Purpose**: Ensure consistent state codes for pharmacy routing
```javascript
function normalizeStateCode(state) {
  if (!state) return '';
  
  const stateCode = state.toString().trim().toUpperCase();
  
  // Validate against known state codes
  const validStates = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
    'DC'  // District of Columbia
  ];
  
  if (!validStates.includes(stateCode)) {
    console.warn(`Invalid state code: ${stateCode}`);
    return stateCode; // Return as-is for manual review
  }
  
  return stateCode;
}
```

## Business Logic Rules

### Pharmacy Assignment Rules
**Purpose**: Route orders to appropriate pharmacy partner based on regulations
```javascript
function assignPharmacy(shippingState, orderValue, medications) {
  const state = normalizeStateCode(shippingState);
  
  // State-specific routing rules
  if (state === 'SC' || state === 'IN') {
    return {
      pharmacy: 'Other',
      reason: 'State-specific regulatory requirements',
      restrictions: ['Require additional documentation', 'Extended processing time']
    };
  }
  
  // Default pharmacy for most states
  return {
    pharmacy: 'SevenCells',
    reason: 'Standard processing state',
    restrictions: []
  };
}
```

**Routing Rules**:
- **South Carolina (SC)**: Routes to "Other" due to state pharmacy regulations
- **Indiana (IN)**: Routes to "Other" due to state pharmacy regulations
- **All Other States**: Route to "SevenCells" for standard processing
- **Unknown States**: Default to "SevenCells" with warning

### GoHighLevel Integration Rules
**Purpose**: Tag customers in marketing automation based on funnel completion
```javascript
function determineGoHighLevelTags(formSource, completionLevel, qualificationStatus) {
  const baseTags = ['completedsurvey'];
  
  // Form-specific tags
  const formTags = {
    'medication v1': 'medicationsurvey',
    'semaglutide v1': 'semaglutidesurvey',
    'tirzepatide v1': 'tirzepatidesurvey'
  };
  
  if (formTags[formSource]) {
    baseTags.push(formTags[formSource]);
  }
  
  // Qualification-based tags
  if (qualificationStatus === 'qualified') {
    baseTags.push('medically_qualified');
  } else if (qualificationStatus === 'disqualified') {
    baseTags.push('medically_disqualified');
  }
  
  // Completion level tags
  if (completionLevel === 'checkout_completed') {
    baseTags.push('checkout_completed');
  } else if (completionLevel === 'partial_completion') {
    baseTags.push('partial_completion');
  }
  
  return baseTags;
}
```

### Data Retention and Privacy Rules
**Purpose**: Ensure compliance with healthcare data regulations
```javascript
const dataRetentionRules = {
  // HIPAA-sensitive data retention
  medicalData: {
    retentionPeriod: '7 years',
    fields: [
      'health_conditions', 'medical_history', 'prescription_data',
      'bmi', 'weight', 'medical_disqualifications'
    ],
    accessRestrictions: 'Healthcare providers only'
  },
  
  // Marketing data retention  
  marketingData: {
    retentionPeriod: '3 years',
    fields: [
      'funnel_progression', 'page_tracking', 'ip_address',
      'email_preferences', 'marketing_tags'
    ],
    accessRestrictions: 'Marketing team only'
  },
  
  // PII data retention
  personalData: {
    retentionPeriod: '5 years post-treatment',
    fields: [
      'email', 'phone', 'name', 'address', 'date_of_birth'
    ],
    accessRestrictions: 'Authorized personnel only'
  }
};

function validateDataAccess(userRole, requestedFields) {
  const allowedFields = [];
  
  if (userRole === 'healthcare_provider') {
    allowedFields.push(...dataRetentionRules.medicalData.fields);
    allowedFields.push(...dataRetentionRules.personalData.fields);
  } else if (userRole === 'marketing_analyst') {
    allowedFields.push(...dataRetentionRules.marketingData.fields);
    allowedFields.push('email'); // For campaign targeting
  }
  
  const unauthorizedFields = requestedFields.filter(field => 
    !allowedFields.includes(field)
  );
  
  if (unauthorizedFields.length > 0) {
    return {
      authorized: false,
      deniedFields: unauthorizedFields,
      reason: 'Insufficient permissions for requested data'
    };
  }
  
  return { authorized: true };
}
```

## Error Handling and Data Recovery Rules

### Webhook Failure Recovery
**Purpose**: Ensure no data is lost due to temporary system failures
```javascript
function processWebhookWithRetry(webhookData, maxRetries = 3) {
  let attempts = 0;
  
  while (attempts < maxRetries) {
    try {
      const result = processWebhookData(webhookData);
      return { success: true, result: result };
    } catch (error) {
      attempts++;
      
      if (attempts >= maxRetries) {
        // Final failure - log to error sheet for manual recovery
        logToErrorSheet({
          timestamp: getCurrentEasternTime(),
          error: error.toString(),
          data: JSON.stringify(webhookData),
          attempts: attempts
        });
        
        return { 
          success: false, 
          error: error.toString(),
          savedForRecovery: true 
        };
      }
      
      // Wait before retry (exponential backoff)
      Utilities.sleep(1000 * Math.pow(2, attempts - 1));
    }
  }
}
```

### Data Validation Before Processing
**Purpose**: Prevent corrupted data from entering the system
```javascript
function validateWebhookData(data, requiredFields, dataType) {
  const validation = {
    valid: true,
    errors: [],
    warnings: []
  };
  
  // Check required fields
  for (const field of requiredFields) {
    if (!data[field] || data[field] === '') {
      validation.errors.push(`Missing required field: ${field}`);
      validation.valid = false;
    }
  }
  
  // Data type specific validation
  if (dataType === 'embeddables_submission') {
    if (!data.email || !data.phone) {
      validation.errors.push('Email and phone required for submissions');
      validation.valid = false;
    }
    
    if (data.bmi && (parseFloat(data.bmi) < 15 || parseFloat(data.bmi) > 60)) {
      validation.warnings.push('BMI value outside normal range');
    }
  }
  
  if (dataType === 'careportals_order') {
    if (!data.customer || !data.customer.email) {
      validation.errors.push('Customer information required for orders');
      validation.valid = false;
    }
    
    if (data.totalAmount && parseFloat(data.totalAmount) <= 0) {
      validation.errors.push('Order total must be greater than zero');
      validation.valid = false;
    }
  }
  
  return validation;
}
```

### Duplicate Detection Rules
**Purpose**: Prevent duplicate records while allowing legitimate updates
```javascript
function checkForDuplicates(newRecord, existingData, deduplicationFields) {
  const duplicates = [];
  
  for (const existing of existingData) {
    let matchCount = 0;
    
    for (const field of deduplicationFields) {
      if (newRecord[field] === existing[field]) {
        matchCount++;
      }
    }
    
    // Consider duplicate if all deduplication fields match
    if (matchCount === deduplicationFields.length) {
      duplicates.push({
        existingRecord: existing,
        matchingFields: deduplicationFields,
        timeDifference: new Date() - new Date(existing.timestamp)
      });
    }
  }
  
  return {
    isDuplicate: duplicates.length > 0,
    duplicates: duplicates,
    recommendation: getDuplicationRecommendation(duplicates)
  };
}

function getDuplicationRecommendation(duplicates) {
  if (duplicates.length === 0) {
    return 'process_normally';
  }
  
  const mostRecent = duplicates.sort((a, b) => 
    new Date(b.existingRecord.timestamp) - new Date(a.existingRecord.timestamp)
  )[0];
  
  // If duplicate within 5 minutes, likely system error
  if (mostRecent.timeDifference < 5 * 60 * 1000) {
    return 'reject_duplicate';
  }
  
  // If duplicate within 24 hours, likely user resubmission
  if (mostRecent.timeDifference < 24 * 60 * 60 * 1000) {
    return 'update_existing';
  }
  
  // Older duplicates might be legitimate new attempts
  return 'process_as_new';
}
```

## Performance and Optimization Rules

### Batch Processing Limits
**Purpose**: Prevent Google Sheets API limits and timeouts
```javascript
const processingLimits = {
  maxBatchSize: 100,           // Maximum rows per batch write
  maxExecutionTime: 300000,    // 5 minutes maximum execution
  maxApiCalls: 100,            // API calls per execution
  delayBetweenBatches: 1000    // 1 second delay between batches
};

function processBatchWithLimits(dataArray, processingFunction) {
  const batches = [];
  let currentBatch = [];
  
  for (let i = 0; i < dataArray.length; i++) {
    currentBatch.push(dataArray[i]);
    
    if (currentBatch.length >= processingLimits.maxBatchSize) {
      batches.push(currentBatch);
      currentBatch = [];
    }
  }
  
  // Add remaining items
  if (currentBatch.length > 0) {
    batches.push(currentBatch);
  }
  
  // Process each batch with delay
  const results = [];
  for (let i = 0; i < batches.length; i++) {
    if (i > 0) {
      Utilities.sleep(processingLimits.delayBetweenBatches);
    }
    
    const batchResult = processingFunction(batches[i]);
    results.push(batchResult);
  }
  
  return results;
}
```

These comprehensive business rules ensure data quality, regulatory compliance, and system reliability across all integration points.