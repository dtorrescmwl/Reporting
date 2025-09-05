# Field Mapping Reference Guide

## Overview

This document provides comprehensive field mappings between source systems and destination spreadsheets. All field transformations, business rules, and data flows are documented here for reporting tool development.

## Embeddables to Google Sheets Mapping

### Form Submission Fields (submissions sheet)

| Source Field (Embeddables) | Destination Column | Data Type | Transformation | Business Rules |
|---|---|---|---|---|
| `submissionData.submission_timestamp` | Submission Timestamp | DateTime | Direct copy | Original frontend timestamp |
| `submissionData.entryId` | Entry ID | String | Direct copy | Primary key for Embeddables system |
| `submissionData.form_source` | Form Source | String | Direct copy | Values: "medication v1", "semaglutide v1", "tirzepatide v1" |
| `submissionData.first_name` | First Name | String | `safeString()` | Required for lead qualification |
| `submissionData.last_name` | Last Name | String | `safeString()` | Required for lead qualification |
| `submissionData.email` | Email | String | Direct copy | PRIMARY MATCHING KEY - validates against banned domains |
| `submissionData.phone` | Phone | String | Direct copy | Required field - validates non-empty |
| `submissionData.age` | Age at Submission | Number | `safeString()` | Calculated from DOB components |
| `submissionData.dob_day` + `dob_month` + `dob_year` | Date of Birth | String | `formatDateOfBirth()` | Output: MM/DD/YYYY format |
| `submissionData.sex_assigned_at_birth` | Sex Assigned at Birth | String | Direct copy | Values: "male", "female" |
| `submissionData.state` | State | String | `capitalizeState()` | Uppercase state codes (impacts pharmacy routing) |
| `submissionData.height_feet` + `height_inches` | Height | String | `formatHeight()` | Output: X'Y'' format (e.g., "5'8''") |
| `submissionData.weight_lbs` | Weight at Submission (lbs) | Number | `safeString()` | Current weight in pounds |
| `submissionData.goal_weight_lbs` | Goal Weight (lbs) | Number | `safeString()` | Target weight |
| `submissionData.weight_difference` | Weight Difference (lbs) | Number | `safeString()` | Calculated: current - goal |
| `submissionData.bmi` | BMI | Number | `safeString()` | Body Mass Index calculation |
| `submissionData.dq_health_conditions_options` | Health Conditions | Array | `safeString()` | JSON array of disqualifying conditions |
| `submissionData.female_dq_questions` | Female Questions | Array | `safeString()` or "NA" | "NA" for males, array for females |
| `submissionData.disqualifier` | Disqualifier | Boolean | `safeString()` | Medical disqualification flag |
| `submissionData.disqualified_reasons` | Disqualified Reasons | Object | `parseDisqualifiedReasons()` | Extracts reasonsList from JSON |
| `submissionData.taking_wl_meds_options` | Taking WL Meds | String | `safeString()` | Current weight loss medications |
| `submissionData.taken_wl_meds_options` | Taken WL Meds | String | `safeString()` | Previous medication history |
| `submissionData.recently_took_wl_meds` | Recently Took WL Meds | String | `safeString()` | Recent medication use |
| `submissionData.glp_experience` | GLP Experience | String | `safeString()` | GLP-1 medication experience level |
| `submissionData.previous_medication_options` | Previous GLP Taken | String | `safeString()` | Specific medications used |
| `submissionData.glp1_dosage_question_mg` | Last GLP Dosage | String | `safeString()` | Previous dosage information |
| `submissionData.glp_details_last_dose` | GLP Details Last Dose | String | `safeString()` | Timing of last dose |
| `submissionData.glp_details_starting_weight` | GLP Details Starting Weight | String | `safeString()` | Weight when started previous medication |
| `submissionData.checkbox_notstack_glp` | Agreement Not to Stack | Boolean | `safeString()` | Safety consent for medication |
| `submissionData.match_medication_options` | Match Medication Options | String | `safeString()` | System recommendation matching |
| `submissionData.glp_recommendation` | Shown Recommendation | String | `safeString()` | Recommendation displayed to user |
| `submissionData.sleep_overall_options` | Sleep Overall | String | `safeString()` | Sleep quality assessment |
| `submissionData.sleep_hours_selector` | Sleep Hours | String | `safeString()` | Hours of sleep per night |
| `submissionData.effects_options_multiple` | Side Effects Experienced from Weight | Array | `safeString()` | Weight-related effects |
| `submissionData.concerns_options` | Concerns Options | Array | `safeString()` | Treatment concerns |
| `submissionData.priority_options` | Priority Options | Array | `safeString()` | Treatment priorities |
| `submissionData.glp_motivations` | GLP Motivations | Array | `safeString()` | Motivation for treatment |
| `submissionData.weight_loss_pace` | Weight Loss Pace | String | `safeString()` | Desired rate of weight loss |
| `submissionData.willing_to_options` | Willing To Options | Array | `safeString()` | Lifestyle change willingness |
| `submissionData.state_mind_options` | State of Mind | String | `safeString()` | Mental readiness for treatment |
| `submissionData.current_page_key` | Current Page Key | String | Direct copy | Final page reached in funnel |
| `submissionData.clicked_email_terms_conditions_checkbox` | Email Terms Conditions Checkbox | Boolean | `safeString()` | Consent tracking |
| `submissionData.ip_address` | IP Address | String | Direct copy | User IP for tracking/security |
| N/A (generated) | Datetime Received | DateTime | `getCurrentEasternTime()` | When webhook processed (Eastern Time) |

### Page Tracker Fields (page.tracker and page.tracker_log sheets)

| Source Field | Destination Column | Transformation | Special Logic |
|---|---|---|---|
| `submissionData.entryId` | Entry ID | Direct copy | Unique identifier for progression tracking |
| `submissionData.current_page_key` | Current Page Key | Direct copy | Current page being accessed |
| `submissionData.current_page_id` | Current Page ID | Direct copy | Technical page identifier |
| `submissionData.current_page_index` | Current Page Index | `parseInt()` | Numeric page position for comparison |
| N/A (calculated) | Furthest Page Reached | Conditional update | Only updates if current > existing |
| N/A (calculated) | Furthest Page Index | `Math.max()` | Highest page number achieved |
| N/A (first time only) | First Started | `generateETDateTime()` | Set once on first entry |
| N/A (every update) | Last Updated Timestamp | `generateETDateTime()` | Updated on every interaction |

**Page Tracker Logic**:
- **Upsert Behavior**: Updates existing entry or creates new one
- **Forward-Only Logging**: Only logs progression to higher page indices
- **Deduplication**: Prevents duplicate entries from browser navigation
- **Analytics Integrity**: Maintains accurate funnel progression data

## CarePortals to Google Sheets Mapping

### Order Creation (Simple) - order.created sheet

| Source Field (CarePortals) | Destination Column | Transformation | Business Rules |
|---|---|---|---|
| `orderData.createdAt` | Datetime Purchase | `convertToEasternTime()` | Order creation timestamp |
| `orderData._id` | Care Portals Internal Order ID | Direct copy | Internal EMR order ID |
| `orderData.id` | Order ID | Direct copy | Customer-facing order number |
| `orderData["customer._id"]` | Customer ID | Direct copy | Internal customer identifier |
| `orderData["customer.firstName"]` | First Name | Direct copy | Patient first name |
| `orderData["customer.lastName"]` | Last Name | Direct copy | Patient last name |
| `orderData["customer.email"]` | Email | Direct copy | PRIMARY MATCHING KEY |
| `orderData["customer.phone"]` | Phone | Direct copy | Contact information |
| `orderData.source` | Source | Direct copy | Order source channel |
| `orderData.totalAmount` | Total Amount | Direct copy | Final order total |
| `orderData.discountAmount` | Discount Amount | Direct copy | Total discounts applied |
| `orderData.baseAmount` | Base Amount | Direct copy | Pre-discount amount |
| `orderData.creditUsedAmount` | Credit Used | Direct copy | Store credit applied |
| N/A (generated) | Datetime Webhook Received | `getCurrentEasternTime()` | Processing timestamp |
| N/A (manual) | Notes | Static text | Processing context |

### Order Creation (Normalized Database) - Database CarePortals

#### customers table
| Source Field | Destination Column | Transformation | Deduplication Logic |
|---|---|---|---|
| `orderData["customer._id"]` | customer_id | Direct copy | Uses CarePortals internal ID |
| `orderData["customer.email"]` | email | Direct copy | PRIMARY DEDUPLICATION KEY |
| `orderData["customer.firstName"]` | first_name | Direct copy | Patient identification |
| `orderData["customer.lastName"]` | last_name | Direct copy | Patient identification |
| `orderData["customer.phone"]` | phone | Direct copy | Contact information |

**Customer Deduplication Logic**:
1. Search existing customers by email address
2. If found: return existing customer_id
3. If not found: create new customer record with CarePortals ID

#### addresses table
| Source Field | Destination Column | Transformation | Normalization Logic |
|---|---|---|---|
| N/A (calculated) | address_id | `createAddressId()` | MD5 hash of normalized address |
| `orderData["shippingAddress.address1"]` | address1 | Address normalization | Street type standardization |
| `orderData["shippingAddress.address2"]` | address2 | Address normalization | Apartment/suite information |
| `orderData["shippingAddress.city"]` | city | Lowercase conversion | City name standardization |
| `orderData["shippingAddress.provinceCode"]` | province_code | Direct copy | State/province code |
| `orderData["shippingAddress.postalCode"]` | postal_code | Numeric extraction | ZIP code standardization |
| `orderData["shippingAddress.countryCode"]` | country_code | Direct copy | Country identifier |

**Address Normalization Process**:
1. **Street Type Standardization**: `st` → `street`, `ave` → `avenue`, etc.
2. **Case Normalization**: All text converted to lowercase
3. **Character Cleaning**: Remove spaces, punctuation, special characters
4. **Component Concatenation**: Combine all normalized components
5. **MD5 Hashing**: Generate unique identifier from normalized string
6. **Deduplication**: Use hash to prevent duplicate addresses

#### products table
| Source Field | Destination Column | Transformation | Data Source |
|---|---|---|---|
| `orderData["lineItems.0.productId"]` | product_id | Direct copy | Product identifier |
| `orderData["lineItems.0.name"]` | label | Direct copy | Product display name |
| N/A | sub_label | Manual entry | Product subtitle |
| `orderData["lineItems.0.extras.drugName"]` | drug_name | Direct copy | Medication compound |
| `orderData["lineItems.0.listPrice"]` | list_price | Direct copy | Original price |
| `orderData["lineItems.0.price"]` | sale_price | Direct copy | Current sale price |
| N/A | sale_cycle_duration | Manual entry | Sale period |
| N/A | renewal_price | Manual entry | Subscription price |
| N/A | renewal_cycle_duration | Manual entry | Renewal frequency |
| N/A | active | Manual entry | Product availability |
| N/A | direct_cart_link | Manual entry | Purchase URL |

#### coupons table
| Source Field | Destination Column | Transformation | Auto-Generation |
|---|---|---|---|
| `orderData.coupon` | coupon_id | Direct copy | Coupon code |
| `orderData["lineItems.0.discount.reductionAmount"]` | reduction_amount | Direct copy | Discount value |
| `orderData["lineItems.0.discount.reductionType"]` | reduction_type | Direct copy | Dollar/percent |
| N/A (generated) | description | Auto-generated | Based on amount/type |

#### order.created table (Normalized)
| Source Field | Destination Column | Transformation | Foreign Key |
|---|---|---|---|
| `orderData.createdAt` | created_at | `convertToEasternTime()` | Timestamp |
| `orderData.id` | order_id | Direct copy | Customer-facing ID |
| `orderData._id` | care_portals_internal_order_id | Direct copy | Internal EMR ID |
| N/A (lookup) | customer_id | Customer deduplication | FK to customers |
| N/A (calculated) | shipping_address_id | Address normalization | FK to addresses (MD5) |
| `orderData["lineItems.0.productId"]` | product_id | Direct copy | FK to products |
| `orderData.source` | source | Direct copy | Order channel |
| `orderData.totalAmount` | total_amount | Direct copy | Final total |
| `orderData.discountAmount` | discount_amount | Direct copy | Total discounts |
| `orderData.baseAmount` | base_amount | Direct copy | Pre-discount amount |
| `orderData.creditUsedAmount` | credit_used_amount | Direct copy | Credit applied |
| `orderData.coupon` | coupon | Direct copy | Coupon code |
| `orderData["lineItems.0.discount.reductionAmount"]` | discount_reduction_amount | Direct copy | Line discount |
| `orderData["lineItems.0.discount.reductionType"]` | discount_reduction_type | Direct copy | Discount type |
| N/A (calculated) | pharmacy_assigned | `determinePharmacy()` | Based on state |

**Pharmacy Assignment Logic**:
```javascript
function determinePharmacy(provinceCode) {
  const state = String(provinceCode || '').toUpperCase();
  return (state === 'SC' || state === 'IN') ? 'Other' : 'SevenCells';
}
```

### Subscription Events

#### subscription.cancelled and subscription.paused sheets
| Source Field | Destination Column | Transformation | Business Rules |
|---|---|---|---|
| N/A (generated) | Datetime Received | `getCurrentEasternTime()` | Processing timestamp |
| `subscriptionData["customer._id"]` | EMR Profile | `generateEMRProfileLink()` | Link to EMR system |
| `subscriptionData["customer.firstName"]` | First Name | Direct copy | Patient identification |
| `subscriptionData["customer.lastName"]` | Last Name | Direct copy | Patient identification |
| `subscriptionData["customer.email"]` | Email | Direct copy | PRIMARY MATCHING KEY |
| `subscriptionData["customer.phone"]` | Phone | Direct copy | Contact information |
| `subscriptionData._id` | EMR ID | Direct copy | Internal EMR ID |
| `subscriptionData["customer._id"]` | CRM ID | Direct copy | Customer ID |
| `subscriptionData.id` | Subscription ID | Direct copy | Customer-facing ID |

**EMR Profile Link Generation**:
```javascript
function generateEMRProfileLink(customerId) {
  if (!customerId) return '';
  return `https://emr.portals.care/customers/${customerId}?org=cmwl`;
}
```

### Prescription Events

#### prescription.created sheet
| Source Field | Destination Column | Transformation | Business Rules |
|---|---|---|---|
| N/A (generated) | Datetime Received | `getCurrentEasternTime()` | Processing timestamp |
| `prescriptionData["customer._id"]` | EMR Profile | `generateEMRProfileLink()` | Link to EMR system |
| `prescriptionData["customer.firstName"]` | Customer First Name | Direct copy | Patient identification |
| `prescriptionData["customer.lastName"]` | Customer Last Name | Direct copy | Patient identification |
| `prescriptionData["customer.email"]` | Customer Email | Direct copy | PRIMARY MATCHING KEY |
| `prescriptionData["customer.phone"]` | Customer Phone | Direct copy | Contact information |
| `prescriptionData._id` | EMR ID | Direct copy | Internal prescription ID |
| `prescriptionData["customer._id"]` | CRM ID | Direct copy | Customer ID |

## Cross-System Field Relationships

### Primary Matching Keys
1. **Email Address**: Links records across all systems
   - Embeddables: `submissionData.email`
   - CarePortals: `customer.email`
   - Validation: Banned domains filtered

2. **Customer ID**: CarePortals internal identifier
   - CarePortals: `customer._id`
   - Used in normalized database as primary customer key

3. **Entry ID**: Embeddables unique identifier
   - Embeddables: `submissionData.entryId`
   - Used for funnel progression tracking

### Secondary Matching Keys
1. **Phone Number**: Backup matching field
2. **First/Last Name**: Identity verification
3. **Order IDs**: Transaction tracking

## Data Type Specifications

### String Formatting Rules
- **Heights**: Format as `X'Y''` (e.g., `5'8''`)
- **Dates**: Format as `MM/DD/YYYY` (e.g., `03/15/1990`)
- **States**: Uppercase state codes (e.g., `NY`, `CA`)
- **Timestamps**: Eastern Time format `MM/dd/yyyy, HH:mm:ss AM/PM`

### Array Handling
- **JSON Arrays**: Stored as JSON strings (e.g., `["option1", "option2"]`)
- **Single Values**: Stored as strings
- **Empty Values**: Stored as empty strings `""`

### Null/Empty Value Handling
- **Null/Undefined**: Converted to empty string `""`
- **Objects**: JSON.stringify() conversion
- **Arrays**: JSON.stringify() conversion
- **Numbers**: String conversion via String()

### Boolean Handling
- **True/False**: Converted to string `"true"`/`"false"`
- **Checkboxes**: Actual boolean values from frontend

## Validation Rules Summary

### Email Validation
- **Required**: Must be present and non-empty
- **Banned Domains**: `@cmwl.com` rejected
- **Banned Addresses**: `test@email.com`, `test@test.com` rejected
- **Format**: Must be valid email format

### Phone Validation
- **Required**: Must be present and non-empty
- **Format**: No specific format requirements

### Data Quality Rules
- **Medical Fields**: Arrays properly parsed from JSON
- **Page Progression**: Forward-only movement logged
- **Address Normalization**: Consistent formatting for deduplication
- **Timezone Standardization**: All timestamps Eastern Time

This comprehensive field mapping ensures consistent data transformation and maintains referential integrity across all systems.