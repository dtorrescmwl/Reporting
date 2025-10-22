# Questionnaire Structure Analyzer - Deployment Guide

## Files Created

1. **Code.gs** - The main Apps Script code that analyzes questionnaire structures
2. **appsscript.json** - Apps Script manifest configuration
3. **questionnaire_webhook_config.json** - Webhook configuration for CarePortals
4. **DEPLOYMENT_GUIDE.md** - This deployment guide

## Quick Setup Steps

### Option 1: Manual Apps Script Deployment (Recommended)

1. **Go to Google Apps Script**: https://script.google.com/
2. **Create New Project**: Click "New project"
3. **Copy the code**:
   - Open `Code.gs` from the `clasp_project` folder
   - Copy all content and paste into the Apps Script editor
4. **Set up manifest**:
   - Click on `appsscript.json` in the Apps Script editor
   - Copy content from the `appsscript.json` file and replace existing content
5. **Deploy as Web App**:
   - Click "Deploy" → "New deployment"
   - Choose "Web app" as type
   - Set "Execute as" to "Me"
   - Set "Who has access" to "Anyone"
   - Click "Deploy"
   - Copy the Web App URL

### Option 2: Clasp CLI Deployment (After API Enabling)

1. **Enable Apps Script API**:
   - Visit: https://script.google.com/home/usersettings
   - Enable "Google Apps Script API"
   - Wait 5 minutes for propagation

2. **Deploy with Clasp**:
   ```bash
   cd /home/cmwldaniel/Reporting/Questionnaires/clasp_project
   clasp create --title "Questionnaire Structure Analyzer"
   clasp push
   clasp deploy
   ```

## Webhook Configuration

Use the content from `questionnaire_webhook_config.json` in your CarePortals webhook setup. This comprehensive configuration captures all possible fields from any questionnaire type.

## How It Works

The script is designed to be completely dynamic and will:

1. **Accept any questionnaire payload structure**
2. **Analyze the `answers` object recursively**
3. **Detect different answer patterns**:
   - Single/Multi-select boolean options
   - Text fields (nested or direct)
   - Calculated fields (mixed data types)
   - File uploads
   - Complex nested objects
   - Arrays and other data types
4. **Log unique structures** to Google Sheets tab `questionnaire_structure`
5. **Avoid duplicates** by creating structure fingerprints

## Expected Output

The script will create entries in the `questionnaire_structure` tab with:
- Timestamp
- Questionnaire Type
- Answer Key
- Answer Pattern (e.g., "single-select-boolean", "calculated-field")
- Pattern Details
- Value Structure (JSON representation)
- Sample Data
- Key Count
- Data Location (answers vs top-level)
- Structure Fingerprint (for deduplication)

## Testing

You can test the deployment using the built-in test function `testDynamicAnalysis()` in the Apps Script editor.

## ✅ DEPLOYMENT COMPLETE

**Script ID**: `1Gbz9NS7OPRrSi_P8GSy2f_cCspXAX8HbxpJMkAKsbopWHiryXhHK9FvK`
**Deployment ID**: `AKfycbyp9EgPWWPG_C5s1z0N4IeauBRraxT_7Fbz2M2-TnkvABqFY870DZ1qji9afwDM5jZPgQ`
**Web App URL**: `https://script.google.com/macros/s/AKfycbyp9EgPWWPG_C5s1z0N4IeauBRraxT_7Fbz2M2-TnkvABqFY870DZ1qji9afwDM5jZPgQ/exec`

## Next Steps

1. ✅ Script deployed and ready
2. Configure the webhook in CarePortals using the JSON configuration from `questionnaire_webhook_config.json`
3. Send test questionnaire data to verify structure analysis
4. Monitor the `questionnaire_structure` tab for new entries

## Updated Webhook JSON

The `questionnaire_webhook_config.json` now correctly extracts answer substructures using the proper `{{answers.field.subfield}}` syntax based on your existing webhook patterns. It includes:

- **Full answers object**: `"answers": "{{answers}}"`
- **Individual answer fields**: `"answers.wlusFollowup_genderIdentify": "{{answers.wlusFollowup_genderIdentify}}"`
- **Answer sub-options**: `"answers.wlusFollowup_genderIdentify.wlusFollowup_genderIdentify_male": "{{answers.wlusFollowup_genderIdentify.wlusFollowup_genderIdentify_male}}"`
- **Calculated fields**: All weight/height measurement subfields
- **Text responses**: Nested text field structures
- **Consent fields**: All consent-related answer options
- **Medication data**: Drug information and dosage fields

This captures both the sample questionnaire structure AND provides comprehensive coverage for different questionnaire types.