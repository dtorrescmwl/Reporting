# Embeddables Funnel System - Technical Documentation

## System Configuration

### Project Details
- **Group ID**: `org_mjsuTSL8E0ZlNrDf`
- **Project ID**: `pr_vxEInhfyhdcUwzNl`
- **API Base URL**: `https://api.embeddables.com`
- **Authentication**: X-Api-Key header required

### Funnel Types

#### 1. Medication Choice V1 (General)
- **Embeddable ID**: `flow_2bc58aj3a8g0d9ddd8j7jbd4g`
- **Purpose**: General GLP-1 medication qualification
- **Messaging**: "CMWL GLP-1 Plan"
- **Drug Focus**: Both Semaglutide and Tirzepatide options

#### 2. Semaglutide V1 (Specific)
- **Embeddable ID**: `flow_cc5fj2bciie5ecf1a2bg398865`
- **Purpose**: Semaglutide-focused qualification
- **Messaging**: "CMWL Semaglutide Plan"
- **Drug Focus**: Primarily Semaglutide/Ozempic

#### 3. Tirzepatide V1 (Specific)
- **Embeddable ID**: `flow_8gd24ah717hhh9h6gjf38h58h`
- **Purpose**: Tirzepatide-focused qualification
- **Messaging**: "CMWL Tirzepatide Plan"
- **Drug Focus**: Primarily Tirzepatide/Mounjaro

## Page Progression Structure

All funnels follow a 32-page structure with conditional branching:

### Core Pages (Required)
1. **Height & Weight** (`current_height_and_weight`)
2. **BMI & Goal Weight** (`bmi_goal_weight`) 
3. **Sex Assignment** (`sex`)
4. **Medical Review** (`medical_review`)
5. **Lead Capture** (`lead_capture`)
6. **Priority Assessment** (`main_priority`)
7. **Sleep Evaluation** (`sleep_overall`, `sleep_hours`)
8. **Health Conditions** (`dq_health_conditions`)
9. **Medication History** (`taking_wl_meds`, `taken_wl_meds`)
10. **Final Checkout** (`checkout_page`)

### Conditional Pages
- **BMI Disqualified** (`bmi_disqualified`) - BMI < 27
- **Female Disqualifiers** (`female_disqualifiers`) - Female-specific questions
- **GLP Details** (`glp_details`) - Previous medication experience
- **Disqualification** (`dq_page`) - Medical disqualification

### Interstitial Pages
- Various engagement and educational content pages
- No form fields, used for user journey optimization

## Data Collection Fields

### Demographics
- `first_name`, `last_name`: Patient identity
- `email`, `phone`: Contact information
- `age`: Calculated from date of birth
- `dob_day`, `dob_month`, `dob_year`: Birth date components
- `sex_assigned_at_birth`: Medical classification
- `state`: Geographic location (impacts pharmacy assignment)

### Physical Measurements
- `height_feet`, `height_inches`: Height components (dropdown format)
- `weight_lbs`: Current weight in pounds
- `goal_weight_lbs`: Target weight
- `weight_difference`: Calculated difference
- `bmi`: Body Mass Index calculation

### Medical History
- `dq_health_conditions_options`: Disqualifying conditions array
- `female_dq_questions`: Female-specific medical questions
- `taking_wl_meds_options`: Current weight loss medications
- `taken_wl_meds_options`: Previous medication history
- `recently_took_wl_meds`: Recent medication use
- `glp_experience`: GLP-1 medication experience
- `previous_medication_options`: Specific medications used
- `glp1_dosage_question_mg`: Last dosage information
- `glp_details_last_dose`: Last dose timing
- `glp_details_starting_weight`: Starting weight on previous medication

### Behavioral & Psychographic
- `sleep_overall_options`: Sleep quality assessment
- `sleep_hours_selector`: Hours of sleep per night
- `effects_options_multiple`: Weight-related effects experienced
- `concerns_options`: Patient concerns about treatment
- `priority_options`: Treatment priorities
- `glp_motivations`: Motivation for GLP-1 treatment
- `weight_loss_pace`: Desired rate of weight loss
- `willing_to_options`: Willingness to make lifestyle changes
- `state_mind_options`: Mental readiness for treatment

### System Tracking
- `entryId`: Unique identifier for form submission
- `form_source`: Which funnel type was used
- `current_page_key`: Current page in funnel
- `current_page_id`: Technical page identifier
- `current_page_index`: Numeric page position
- `highest_page_reached_key`: Furthest page accessed
- `highest_page_reached_index`: Furthest page number
- `ip_address`: User IP for tracking/security
- `submission_timestamp`: When form was submitted
- `clicked_email_terms_conditions_checkbox`: Consent tracking

### Qualification Logic
- `disqualifier`: Boolean indicating medical disqualification
- `disqualified_reasons`: JSON object with specific reasons
- `checkbox_notstack_glp`: Agreement not to combine medications
- `match_medication_options`: Recommended medication matching
- `glp_recommendation`: System recommendation provided

## Technical Implementation

### Height Format
Heights are stored as dropdown keys:
- Feet: `feet_three`, `feet_four`, `feet_five`, `feet_six`, `feet_seven`  
- Inches: `inches_zero` through `inches_eleven`

### Date Format
Dates use component format:
- Day: Numeric 1-31
- Month: Three-letter abbreviations (jan, feb, mar, etc.)
- Year: Full four-digit year

### Multi-Select Arrays
Many fields store arrays of selected options as JSON strings:
```json
["option_1", "option_2", "option_3"]
```

### Page Progression Logic
- Forward-only progression tracking
- Prevents duplicate entries from back navigation
- Maintains highest page reached for analytics

## Data Extraction System

### Multi-Funnel Extraction Script
**Location**: `/home/cmwldaniel/Reporting/Scripts/Embeddables/embeddables_multi_funnel_extractor.py`

#### Recent Updates (September 2025)
- **Fixed Historical Data Limitation**: Resolved pagination issue that previously limited data extraction to entries from August 26th forward
- **Enhanced Pagination Strategy**: Implemented aggressive time-based windowing to ensure complete historical dataset retrieval
- **Automatic Test Filtering**: Added real-time filtering system to exclude test entries during extraction
- **Improved Error Handling**: Enhanced robustness for large dataset processing
- **Increased Default Limits**: Raised from 5,000 to 10,000 entries per funnel

#### Key Features
- **Complete Historical Coverage**: Now extracts ALL entries back to the beginning of each funnel
  - Medication V1: Back to May 15, 2025 (290+ entries)
  - Tirzepatide V1: Back to July 13, 2025 (186+ entries)  
  - Semaglutide V1: Back to July 21, 2025 (93+ entries)
- **Environment Variable Configuration**: Uses `.env` file for secure credential management
- **Multi-Format Output**: Generates all/complete/partial CSV files automatically
- **Real-Time Statistics**: Provides funnel drop-off analysis and completion rates

### Test Entry Filtering System

#### Test Entry Exclusion
**Location**: `/home/cmwldaniel/Reporting/Scripts/Embeddables/test_entries_exclusion.txt`

The system automatically filters out test entries to ensure clean reporting data:

##### Identified Test Patterns
- **Obvious Test Names**: "test", "fake", "dummy", placeholder names
- **Internal Test Users**: Daniel Torres, Daniel Gomez, Lisa Connelly, Richard Lee
- **CMWL Internal Emails**: webhook testing, @cmwl.com addresses
- **Suspicious Data**: Extreme measurements (3'0" heights), placeholder values

##### Current Test Entry Count
- **Total Excluded**: 30 test entry IDs across all funnels
- **Medication V1**: 14 test entries identified
- **Tirzepatide V1**: 11 test entries identified
- **Semaglutide V1**: 5 test entries identified

##### Automatic Filtering Process
1. **Load Exclusion List**: Script automatically loads test IDs on startup
2. **Real-Time Filtering**: Entries filtered during processing, before CSV export
3. **Reporting**: System reports number of filtered entries for transparency
4. **Maintenance**: Exclusion list can be updated as new test patterns emerge

#### Data Quality Assurance
- **Historical Cleanup**: All existing data files cleaned of test entries (60+ records removed)
- **Future Protection**: All new extractions automatically exclude test entries
- **Audit Trail**: Filtering activity logged during each extraction
- **Accuracy**: Clean datasets ensure accurate funnel analysis and conversion reporting

### Environment Configuration
**Location**: `/home/cmwldaniel/Reporting/.env`

```bash
# Embeddables API Configuration
EMBEDDABLES_API_KEY=rk_bbccfbbc1304468fa03a04664b18912a
EMBEDDABLES_PROJECT_ID=pr_vxEInhfyhdcUwzNl

# Funnel Embeddable IDs (Verified)
MEDICATION_V1_ID=flow_2bc58aj3a8g0d9ddd8j7jbd4g
TIRZEPATIDE_V1_ID=flow_8gd24ah717hhh9h6gjf38h58h
SEMAGLUTIDE_V1_ID=flow_cc5fj2bciie5ecf1a2bg398865

# Output Directory
OUTPUT_DIR=/home/cmwldaniel/Reporting/Embeddables/Data
```

### Usage Examples

#### Extract All Funnels
```bash
python3 Scripts/Embeddables/embeddables_multi_funnel_extractor.py
```

#### Extract Specific Funnel
```bash
python3 Scripts/Embeddables/embeddables_multi_funnel_extractor.py --funnel medication_v1
```

#### Extract Complete Submissions Only
```bash
python3 Scripts/Embeddables/embeddables_multi_funnel_extractor.py --checkout-only
```

### Output Files
Generated files follow naming convention: `{funnel}_{YYYYMMDD_HHMMSS}_{type}.csv`

- **All Entries**: Complete dataset including partial submissions
- **Complete Entries**: Only submissions reaching checkout page
- **Partial Entries**: Incomplete submissions for drop-off analysis
