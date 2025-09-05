# Google Sheets Data Warehouse - Technical Architecture

## Overview

The data warehouse consists of three primary Google Spreadsheets, each serving specific functions in the healthcare data pipeline. All data is processed through Google Apps Script webhooks that provide real-time data integration, validation, and storage.

## Spreadsheet 1: Embeddables Data Warehouse
**Spreadsheet ID**: `1WVklvRZZqiVtVdD64IDm-vPSSvx-lv6QdXN9V8HC7hI`
**Purpose**: Stores all data from funnel interactions and user progression

### Sheet: `submissions`
**Purpose**: Complete form submission data from funnel completions
**Webhook Endpoint**: `https://script.google.com/macros/s/AKfycbw1k7j70HycMTkKTsjk953RQwHcaeLldXERFIhkCDs3CU7Mhl-DpRI_5L5-BC0WPSdl/exec`
**Trigger**: Form submission completion from any funnel type

#### Column Structure (46 columns):
1. **Submission Timestamp** - When form was submitted (from frontend)
2. **Entry ID** - Unique identifier for submission
3. **Form Source** - Funnel type (medication v1, semaglutide v1, tirzepatide v1)
4. **First Name** - Patient first name
5. **Last Name** - Patient last name
6. **Email** - Primary matching key across systems
7. **Phone** - Contact phone number
8. **Age at Submission** - Calculated age
9. **Date of Birth** - Formatted as MM/DD/YYYY
10. **Sex Assigned at Birth** - Medical classification
11. **State** - Capitalized state code (impacts pharmacy assignment)
12. **Height** - Formatted as X'Y'' (e.g., 5'8'')
13. **Weight at Submission (lbs)** - Current weight
14. **Goal Weight (lbs)** - Target weight
15. **Weight Difference (lbs)** - Calculated difference
16. **BMI** - Body Mass Index calculation
17. **Health Conditions** - Array of disqualifying conditions
18. **Female Questions** - Female-specific medical responses (NA for males)
19. **Disqualifier** - Boolean medical disqualification flag
20. **Disqualified Reasons** - Parsed reasons from JSON
21. **Taking WL Meds** - Current weight loss medications
22. **Taken WL Meds** - Previous medication history
23. **Recently Took WL Meds** - Recent medication use
24. **GLP Experience** - GLP-1 medication experience level
25. **Previous GLP Taken** - Specific medications used
26. **Last GLP Dosage** - Dosage information
27. **GLP Details Last Dose** - Timing of last dose
28. **GLP Details Starting Weight** - Weight when started previous medication
29. **Agreement Not to Stack** - Consent for medication safety
30. **Match Medication Options** - System recommendations
31. **Shown Recommendation** - Recommendation displayed to user
32. **Sleep Overall** - Sleep quality assessment
33. **Sleep Hours** - Hours of sleep per night
34. **Side Effects Experienced from Weight** - Weight-related effects
35. **Concerns Options** - Treatment concerns
36. **Priority Options** - Treatment priorities
37. **GLP Motivations** - Motivation for treatment
38. **Weight Loss Pace** - Desired rate of loss
39. **Willing To Options** - Lifestyle change willingness
40. **State of Mind** - Mental readiness
41. **Current Page Key** - Final page reached
42. **Email Terms Conditions Checkbox** - Consent tracking
43. **IP Address** - User IP for security/tracking
44. **Datetime Received** - When webhook was processed (Eastern Time)

#### Business Rules:
- **Email Validation**: Rejects `@cmwl.com` domain and test emails
- **Required Fields**: Email and phone must be present and non-empty
- **GoHighLevel Integration**: Sends webhook with form-specific tags
- **Data Formatting**: Standardized height, DOB, and state formatting
- **Timezone**: All timestamps converted to Eastern Time

#### Data Quality Controls:
- Banned email filtering: `['test@email.com', 'test@test.com']`
- Banned domain filtering: `@cmwl.com`
- Empty field validation for critical contact information
- JSON parsing with error handling for complex fields

### Sheet: `survey.started`
**Purpose**: Tracks survey initiation events
**Webhook Endpoint**: `https://script.google.com/macros/s/AKfycbzrimanbKAnontC5CEGTsLIcMskl2IjcYO4uEaLkBMIrvOBd75_LhOiqdYRmbLUkF2HUQ/exec`
**Trigger**: When user begins funnel interaction

#### Column Structure (5 columns):
1. **Submission Timestamp** - When survey was started
2. **Entry ID** - Unique identifier
3. **Form Source** - Which funnel was accessed
4. **IP Address** - User IP address
5. **Datetime Received** - When webhook was processed (Eastern Time)

### Sheet: `checkout.sessions`
**Purpose**: Tracks checkout button interactions
**Webhook Endpoint**: `https://script.google.com/macros/s/AKfycbxBwDqMmElLEM85jmL96WbnXt5HyJmA4BBvcZ2E8W6Si8eQquc3y3Onkd2_OPexyQmZ/exec`
**Trigger**: When user clicks checkout/purchase button

#### Column Structure (4 columns):
1. **Submission Timestamp** - When checkout was initiated
2. **Entry ID** - Unique identifier
3. **Cart Launched** - Type of product/plan selected
4. **Timestamp Webhook Received** - Processing time (Eastern Time)

### Sheet: `page.tracker`
**Purpose**: Latest page reached by each user (upsert logic)
**Webhook Endpoint**: `https://script.google.com/macros/s/AKfycbybkatHo6_Uv7GcqzCtrrcC68Jmj5qSa9eM64QpgsYtggkcYPxNjVauDxFD2N8b_qk-/exec`
**Trigger**: Each page progression event

#### Column Structure (44 columns):
- Same fields as `submissions` sheet, plus:
- **First Started** - Initial funnel entry time (set once)
- **Last Updated Timestamp** - Most recent activity
- **Furthest Page Reached** - Highest page key achieved
- **Furthest Page Index** - Highest page number achieved

#### Business Logic:
- **Upsert Logic**: Updates existing entries or creates new ones
- **Forward-Only**: Only logs progression to new highest pages
- **Deduplication**: Prevents duplicate entries from browser navigation

### Sheet: `page.tracker_log`
**Purpose**: Complete log of all page progression events
**Webhook Endpoint**: Same as `page.tracker`
**Trigger**: Forward progression only (prevents duplicate logging)

#### Column Structure (42 columns):
- All demographic and medical fields from submissions
- **Timestamp ET** - When progression occurred
- **Current Page Key** - Page that was reached
- **Current Page ID** - Technical page identifier
- **Current Page Index** - Numeric page position

## Spreadsheet 2: CarePortals Orders
**Spreadsheet ID**: `1J62EOn9OXZzFpqcyw4egfjZe72gOpYJPohApUPmtoKM`
**Purpose**: Healthcare service delivery tracking

### Sheet: `prescription.created`
**Purpose**: New prescriptions created in EMR
**Webhook Endpoint**: `https://script.google.com/macros/s/AKfycby_CuNffi6UibPIDLwMI23iYWq3N1_GbLPLUtJFKCD2j8qWAMiJwcauU63mDWZ7AZY/exec`
**Trigger**: `prescription.created` event from CarePortals

#### Column Structure (8 columns):
1. **Datetime Received** - When webhook was processed (Eastern Time)
2. **EMR Profile** - Link to EMR system (`https://emr.portals.care/customers/{id}?org=cmwl`)
3. **Customer First Name** - Patient first name
4. **Customer Last Name** - Patient last name  
5. **Customer Email** - Primary matching key
6. **Customer Phone** - Contact information
7. **EMR ID** - Internal EMR prescription ID
8. **CRM ID** - Internal customer ID

### Sheet: `subscription.paused`
**Purpose**: Temporarily paused subscriptions
**Webhook Endpoint**: `https://script.google.com/macros/s/AKfycbyaXE6SiIKI3eVcMHhhYxtJye5h6XfVr5cp9cjSeRYqwn6GAvvUwDt6t_X-QjMLAHsRSg/exec`
**Trigger**: `subscription.paused` event from CarePortals

#### Column Structure (9 columns):
1. **Datetime Received** - Processing time (Eastern Time)
2. **EMR Profile** - Link to EMR patient record
3. **First Name** - Patient first name
4. **Last Name** - Patient last name
5. **Email** - Primary matching key
6. **Phone** - Contact information
7. **EMR ID** - Internal EMR ID
8. **CRM ID** - Internal customer ID
9. **Subscription ID** - Customer-facing subscription ID

### Sheet: `subscription.cancelled`
**Purpose**: Cancelled subscriptions for churn analysis
**Webhook Endpoint**: `https://script.google.com/a/macros/cmwlvirtual.com/s/AKfycbynH6kOFmrPrKpmRFG6-msEKkCyyADmukF5rvL3hUX4bo70u9IvJLMwJfG8Wq94oH9T8g/exec`
**Trigger**: `subscription.cancelled` event from CarePortals

#### Column Structure (9 columns):
Same structure as `subscription.paused`

### Sheet: `order.created` (Simple)
**Purpose**: Basic order tracking
**Webhook Endpoint**: `https://script.google.com/macros/s/AKfycbwOaZ1ts8Cktwj6opB5Dyxcr8461Cry5tWt3pKFT1E_PYPGqcM4mb9L9-hk-F3RLL2h/exec`
**Trigger**: `order.created` event from CarePortals (first webhook)

#### Column Structure (15 columns):
1. **Datetime Purchase** - Order creation time (Eastern Time)
2. **Care Portals Internal Order ID** - Internal EMR order ID
3. **Order ID** - Customer-facing order number
4. **Customer ID** - Internal customer ID
5. **First Name** - Patient first name
6. **Last Name** - Patient last name
7. **Email** - Primary matching key
8. **Phone** - Contact information
9. **Source** - Order source channel
10. **Total Amount** - Final order total
11. **Discount Amount** - Total discounts applied
12. **Base Amount** - Pre-discount amount
13. **Credit Used** - Store credit applied
14. **Datetime Webhook Received** - Processing time
15. **Notes** - Additional information

### Sheet: `order.updated`
**Purpose**: Order status and lifecycle changes
**Webhook Endpoint**: `https://script.google.com/macros/s/AKfycbwNoZ-byjqv0Z9hAErYN2bQ_y6V33ZwtTc1--g0KZ50s4BqbQbcyh-J-jDe1mvafRb-6A/exec`
**Trigger**: `order.status_updated` event from CarePortals

#### Column Structure (32 columns):
1. **Timestamp** - Processing time
2. **Trigger** - Event type (usually "updated")
3. **ID** - Internal EMR ID
4. **Order ID** - Customer-facing ID
5. **Organization** - Organization code
6. **Status** - Current order status
7. **Customer ID** - Internal customer ID
8. **First Name** - Patient first name
9. **Last Name** - Patient last name
10. **Email** - Primary matching key
11. **Phone** - Contact information
12. **Source** - Order source
13. **Total Amount** - Order total
14. **Discount Amount** - Discounts applied
15. **Base Amount** - Pre-discount amount
16. **Credit Used** - Store credit used
17. **Post Purchase Status** - Post-order processing status
18. **Assigned Group** - Fulfillment team assignment
19. **Requirements** - Special requirements
20. **Is Deleted** - Deletion flag
21. **Shipping Address** - Full address object
22. **Line Items** - Product details
23. **Invoices** - Invoice information
24. **Shipments** - Shipping details
25. **Shipped At** - Ship date
26. **Tracking Code** - Shipping tracking number
27. **Tracking Link** - Tracking URL
28. **Status History** - Order progression history
29. **Created At** - Original creation time
30. **Updated At** - Last update time
31. **Version** - Record version number

## Spreadsheet 3: Database CarePortals (Normalized)
**Spreadsheet ID**: `1PaCOgNJmKSb2VsJjCMjWpCG-gwrO7uVkuTAFUdrV-_o`
**Purpose**: Normalized relational database structure
**Webhook Endpoint**: `https://script.google.com/macros/s/AKfycbywGZUxTowWHtvwRlrgmU9jl6aX5mICc6NkV2kFzbg5DLoTnG8cTcxdEvZ8isLVeH__/exec`

### Sheet: `customers`
**Purpose**: Customer master data (deduplicated by email)

#### Column Structure (5 columns):
1. **customer_id** - Uses CarePortals customer._id
2. **email** - Primary key for cross-system matching
3. **first_name** - Patient first name
4. **last_name** - Patient last name
5. **phone** - Contact phone number

#### Business Logic:
- Deduplication by email address
- Uses existing customer_id if customer already exists
- Creates new customer record only if email not found

### Sheet: `addresses`
**Purpose**: Normalized shipping addresses with MD5 hashing

#### Column Structure (7 columns):
1. **address_id** - MD5 hash of normalized address string
2. **address1** - Street address line 1
3. **address2** - Street address line 2
4. **city** - City name
5. **province_code** - State/province code
6. **postal_code** - ZIP/postal code
7. **country_code** - Country code

#### Normalization Logic:
- **Address Standardization**: Converts all street types to standard form
  - `st`, `st.`, `street` → `street`
  - `ave`, `ave.`, `avenue` → `avenue`  
  - `dr`, `dr.`, `drive` → `drive`
  - `rd`, `rd.`, `road` → `road`
  - Plus 15+ other standardizations
- **Case Normalization**: All text converted to lowercase
- **Character Cleaning**: Removes spaces, punctuation, special characters
- **MD5 Hashing**: Creates unique identifier from normalized string
- **Deduplication**: Prevents duplicate addresses

### Sheet: `products`
**Purpose**: Product catalog and pricing

#### Column Structure (11 columns):
1. **product_id** - Product identifier from CarePortals
2. **label** - Product display name
3. **sub_label** - Product subtitle (manual entry)
4. **drug_name** - Medication compound name
5. **list_price** - Original price
6. **sale_price** - Current sale price
7. **sale_cycle_duration** - Sale period length (manual)
8. **renewal_price** - Subscription renewal price (manual)
9. **renewal_cycle_duration** - Renewal frequency (manual)
10. **active** - Product availability flag
11. **direct_cart_link** - Direct purchase URL (manual)

### Sheet: `coupons`
**Purpose**: Discount code management

#### Column Structure (4 columns):
1. **coupon_id** - Coupon code
2. **reduction_amount** - Discount value
3. **reduction_type** - Discount type (dollar/percent)
4. **description** - Auto-generated description

### Sheet: `order.created`
**Purpose**: Complete order records with foreign key relationships

#### Column Structure (15 columns):
1. **created_at** - Order creation time (Eastern Time)
2. **order_id** - Customer-facing order ID  
3. **care_portals_internal_order_id** - Internal EMR ID
4. **customer_id** - Foreign key to customers table
5. **shipping_address_id** - Foreign key to addresses table (MD5)
6. **product_id** - Foreign key to products table
7. **source** - Order source channel
8. **total_amount** - Final order total
9. **discount_amount** - Total discounts
10. **base_amount** - Pre-discount amount
11. **credit_used_amount** - Store credit applied
12. **coupon** - Coupon code used
13. **discount_reduction_amount** - Line item discount
14. **discount_reduction_type** - Line item discount type
15. **pharmacy_assigned** - Pharmacy routing logic

#### Pharmacy Assignment Logic:
- **SevenCells**: Default pharmacy for most states
- **Other**: Used for South Carolina (SC) and Indiana (IN)
- Based on `shippingAddress.provinceCode`

#### Foreign Key Relationships:
- Links to customer, address, product, and coupon entities
- Maintains referential integrity through upsert logic
- Prevents orphaned records through validation

## Data Processing Pipeline

### Real-Time Processing
1. **Webhook Receipt**: Data received via HTTPS POST
2. **JSON Parsing**: Incoming data validated and parsed
3. **Business Rule Application**: Validation, filtering, formatting
4. **Data Transformation**: Field mapping and standardization
5. **Storage**: Append to appropriate sheet(s)
6. **Error Handling**: Failures logged to error sheets

### Data Quality Assurance
- **Email Validation**: Format and domain checking
- **Required Field Validation**: Critical fields must be present
- **Data Type Validation**: Ensures proper data types
- **Timezone Standardization**: All times converted to Eastern
- **Deduplication**: Prevents duplicate records where appropriate

### Error Recovery
- **Error Logging**: All failures captured with context
- **Retry Logic**: Built into webhook processing
- **Data Recovery**: Manual recovery processes for failed data
- **Monitoring**: Error sheets provide visibility into issues