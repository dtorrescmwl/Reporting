# Questionnaire Parser

Python script to parse and organize questionnaire submission data from CSV format into structured Excel spreadsheets.

## Purpose

Converts raw questionnaire webhook payload data into organized Excel tabs, with one tab per questionnaire type:
- **wlus**: Weight Loss United States questionnaire
- **wlusmonthly**: Monthly follow-up questionnaire
- **facesheet**: Patient medical history
- **facesheet_ext**: Extended patient information

## Usage

```bash
python3 questionnaire_parser.py <input_csv>
```

### Example

```bash
python3 questionnaire_parser.py /path/to/questionnaires.csv
```

This will create `questionnaires_parsed.xlsx` in the same directory as the input CSV.

## Output Structure

Each tab in the output Excel file contains:

### Common Fields (all tabs)
- `questionnaire_id`: Unique questionnaire submission ID
- `user_id`: Customer/user ID (from nested customer._id)
- `name`: Full name (firstName + lastName combined)
- `gender`: Customer gender
- `dob`: Date of birth
- `created_at`: When questionnaire was created (in **Eastern Time** with EST/EDT indicator)
- `updated_at`: When questionnaire was last updated (in **Eastern Time** with EST/EDT indicator)

### Questionnaire-Specific Fields
Each tab includes all answers from the questionnaire with smart formatting:

**List Consolidation**: Fields like `medications` and `supplements` that contain lists of objects with `name` fields are consolidated into comma-separated values:
- Example: `"Hydroxychloriquine 200mg, dylixitine 60mg, methocarbomol 2 tabs"`
- Example: `"Iron, Biotin"`

**Boolean Group Consolidation**: Related boolean fields are consolidated into single columns with comma-separated values for all `true` selections:
- Example: `surgeries` → `"hysterectomy, gallbladder, weightloss (hysterectomyDesc: Partial 2001)"`
- Example: `allergies` → `"sulfa, latex"`
- Example: `wlus_MedicalConditions` → `"noneOfTheAbove"` or `"diabetes, hypertension, thyroid"`

This approach significantly reduces column count while preserving all data:
- **wlus**: 35 columns (reduced from 64 - 45% reduction)
- **wlusmonthly**: 31 columns (reduced from 53 - 42% reduction)
- **facesheet**: 12 columns (reduced from 34 - 65% reduction)
- **facesheet_ext**: 12 columns (reduced from 34 - 65% reduction)

### Additional Improvements

**Clean Values**: Redundant field name prefixes are removed from values:
- Before: `"highestWeight: 325lbs"`
- After: `"325lbs"`
- Before: `"otherInformationOrQuestionsDoYouHaveForTheDoctor: None at this time"`
- After: `"None at this time"`

**Separated Height/Weight**: Height and weight measurements are kept in separate columns for easy analysis:
- `wlus_weightAndHeight2025_feet`: `5`
- `wlus_weightAndHeight2025_inches`: `10`
- `wlus_weightAndHeight2025_weight`: `238`
- `wlus_weightAndHeight2025_heightUnit`: `feetIn`
- `wlus_weightAndHeight2025_weightUnit`: `lbs`

**Eastern Time Conversion**: All timestamps are automatically converted from UTC to Eastern Time with proper DST handling:
- Format: `2025-10-13 12:10:20 EDT` or `2025-01-15 10:30:45 EST`
- Correctly handles Daylight Saving Time transitions

**Duplicate Filtering**: Multiple submissions from the same user within 24 hours are automatically filtered, keeping only the newest:
- Example: If user submits at 10 AM and 2 PM same day, only 2 PM entry is kept

**Excluded Columns**: Unnecessary tracking columns are automatically excluded:
- Excluded: `status`, `states` (internal tracking fields)
- Excluded: `wlus_individualizedConsent`, `wlus_consentTruthfulness`, `wlus_consentGLP1GIP` (consent fields)
- Excluded: `wlusFollowup_complete`, `wlus_complete` (completion markers)

## Data Inclusions & Exclusions

**Included**:
- ✅ Full name (firstName + lastName combined as single `name` field)
- ✅ Gender and date of birth
- ✅ All questionnaire answers

**Excluded** (as per requirements):
- ❌ Username (uname)
- ❌ Email address
- ❌ Phone number
- ❌ Street addresses (address1, address2, city, provinceCode, postalCode)
- ❌ Status and states (internal tracking)
- ❌ Consent fields (not meaningful data)

## Skipped Questionnaires

The following questionnaire types are present in the CSV but not processed:
- `telehealth_consent`
- `selfie`
- `bodySelfie`
- `govId`

## Requirements

- Python 3.6+
- pandas
- openpyxl

Install dependencies:
```bash
pip3 install pandas openpyxl
```

## File Organization

- Input: `/Questionnaires/questionnaires.csv`
- Output: `/Questionnaires/questionnaires_parsed.xlsx`
- Script: `/Scripts/DataProcessing/Questionnaires/questionnaire_parser.py`

## Notes

- The script automatically flattens nested JSON structures into column names
- List/array fields are converted to JSON strings for easier storage
- All data is preserved from the `answers` object in each questionnaire
- The first `_id` field (questionnaire ID) is stored as `questionnaire_id`
- The nested `customer._id` is stored as `user_id`
