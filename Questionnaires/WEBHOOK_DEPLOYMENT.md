# Questionnaire Webhook Deployment

Apps Script webhook handler for questionnaire submissions that replicates the Python parser functionality.

## Deployment Information

**Webhook URL**:
```
https://script.google.com/macros/s/AKfycbxHeRdXEcLpRp9_VpIFaKPrFu0VXBKqWQgd-gTwLiuaxU3mtiG70DuMKYsSVMsHKbZnnw/exec
```

**Script Location**: https://script.google.com/d/1ao5s9hZwLBfUBQiCopgEJ9tnyH5Og_WgJKalRjtcQwBP7OXD8Sol2D6-/edit

**Target Spreadsheet**: https://docs.google.com/spreadsheets/d/1VLjobTfPvSc0UJrS6jdpVfAsTw0D7wTZNKGi4nEzDcY/edit

**Version**: @1
**Deployment ID**: AKfycbxHeRdXEcLpRp9_VpIFaKPrFu0VXBKqWQgd-gTwLiuaxU3mtiG70DuMKYsSVMsHKbZnnw

## Features

✅ **Handles 4 Questionnaire Types**:
- `wlus` → wlus tab
- `wlusmonthly` → wlusmonthly tab
- `facesheet` → facesheet tab
- `facesheet_ext` → facesheet_ext tab

✅ **Smart Data Processing**:
- Consolidates boolean groups into comma-separated values
- Extracts list names from medications/supplements
- Separates height/weight into individual columns
- Removes redundant field prefixes from values

✅ **Eastern Time Conversion**:
- Converts UTC timestamps to Eastern Time
- Properly handles EST/EDT based on date
- Format: `2025-10-13 12:10:20 EDT`

✅ **24-Hour Duplicate Detection**:
- Checks if user submitted same questionnaire type within 24h
- Automatically removes old entry
- Keeps only the newest submission

✅ **Column Management**:
- **Included**: questionnaire_id, user_id, name (firstName + lastName), gender, dob, created_at, updated_at, all answers
- **Excluded**: status, states, consent fields, complete markers

## Usage

### Webhook Integration

Send POST requests to the webhook URL with questionnaire payload:

```bash
curl -X POST \
  https://script.google.com/macros/s/AKfycbxHeRdXEcLpRp9_VpIFaKPrFu0VXBKqWQgd-gTwLiuaxU3mtiG70DuMKYsSVMsHKbZnnw/exec \
  -H "Content-Type: application/json" \
  -d @questionnaire_payload.json
```

### Expected Payload Format

```json
{
  "_id": "68ed246cdaca9e740790aedd",
  "type": "wlus",
  "customer": {
    "_id": "68ed228fdaca9e740790adf3",
    "firstName": "Jessica",
    "lastName": "Williams",
    "gender": "female",
    "dob": "1975-02-07"
  },
  "createdAt": "2025-10-13T16:10:20.677Z",
  "updatedAt": "2025-10-13T16:13:04.489Z",
  "answers": {
    "wlus_highestWeight": {
      "highestWeight": "325lbs"
    },
    "wlus_MedicalConditions": {
      "wlus_MedicalConditions_noneOfTheAbove": true
    }
  }
}
```

### Response Format

**Success**:
```json
{
  "success": true,
  "questionnaireType": "wlus",
  "userId": "68ed228fdaca9e740790adf3",
  "timestamp": "2025-10-13 12:10:20 EDT"
}
```

**Error**:
```json
{
  "success": false,
  "error": "Error message"
}
```

## Data Processing

### 1. List Consolidation
**Input**:
```json
"medications": {
  "list": [
    {"name": "Iron"},
    {"name": "Biotin"}
  ]
}
```
**Output**: `"Iron, Biotin"`

### 2. Boolean Consolidation
**Input**:
```json
"surgeries": {
  "hysterectomy": true,
  "gallbladder": true
}
```
**Output**: `"hysterectomy, gallbladder"`

### 3. Height/Weight Separation
**Input**:
```json
"wlus_weightAndHeight2025": {
  "feet": 5,
  "inches": 10,
  "weight": 238
}
```
**Output**: Separate columns:
- `wlus_weightAndHeight2025_feet`: 5
- `wlus_weightAndHeight2025_inches`: 10
- `wlus_weightAndHeight2025_weight`: 238

### 4. Duplicate Handling

When a user submits the same questionnaire type within 24 hours:
1. Script finds existing entry by `user_id`
2. Compares timestamps
3. If within 24h, deletes old row
4. Adds new entry

## Testing

### Test via GET Request
```bash
curl https://script.google.com/macros/s/AKfycbxHeRdXEcLpRp9_VpIFaKPrFu0VXBKqWQgd-gTwLiuaxU3mtiG70DuMKYsSVMsHKbZnnw/exec
```

Returns service information and status.

### Test Function in Script
Run `testWebhook()` function in the Apps Script editor to test with sample data.

## Maintenance

### Updating the Script
1. Edit `/Questionnaires/questionnaire_webhook_clasp/Code.gs`
2. Push changes: `clasp push --force`
3. Deploy update: `clasp deploy --deploymentId AKfycbxHeRdXEcLpRp9_VpIFaKPrFu0VXBKqWQgd-gTwLiuaxU3mtiG70DuMKYsSVMsHKbZnnw`

### Monitoring
- Check execution logs in Apps Script dashboard
- View processed entries in target spreadsheet tabs
- Monitor for errors in console logs

## Notes

- Script matches exact functionality of Python parser
- All timestamps properly handle Daylight Saving Time
- Duplicate detection uses calendar day comparison (not exact 24h)
- Headers are automatically aligned if column structure changes
- Skipped questionnaire types (selfie, bodySelfie, etc.) are ignored gracefully
