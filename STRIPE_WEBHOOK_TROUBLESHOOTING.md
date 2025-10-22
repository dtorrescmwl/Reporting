# Stripe Webhook Troubleshooting Guide

## 🚨 Problem Diagnosis

The "Moved Temporarily" error you're seeing indicates that your Google Apps Script web app is not properly deployed or accessible. This is a common issue with Google Apps Script webhooks.

### Error Analysis
```html
<HTML>
<HEAD>
<TITLE>Moved Temporarily</TITLE>
</HEAD>
<BODY BGCOLOR="#FFFFFF" TEXT="#000000">
<!-- GSE Default Error -->
<H1>Moved Temporarily</H1>
The document has moved <A HREF="https://script.googleusercontent.com/macros/echo?user_content_key=...">here</A>.
</BODY>
</HTML>
```

**Root Causes**:
1. Web app not properly deployed
2. Incorrect deployment permissions
3. Script authorization issues
4. URL versioning problems
5. Google Apps Script service outages

## 🔧 Step-by-Step Fix

### Step 1: Redeploy Your Web App

1. **Open Google Apps Script**:
   - Go to [script.google.com](https://script.google.com)
   - Open your StripeTracking project

2. **Replace Code with Fixed Version**:
   - Replace your existing code with `StripeTracking_Fixed.js`
   - This version includes better error handling and logging

3. **Save the Project**:
   - Click Save (Ctrl+S)
   - Wait for "Saved" confirmation

### Step 2: Deploy as Web App

1. **Click "Deploy" > "New Deployment"**

2. **Configure Deployment Settings**:
   ```
   Type: Web app
   Description: Stripe Webhook Handler v2.0
   Execute as: Me (your email)
   Who has access: Anyone
   ```

3. **Authorization**:
   - Click "Authorize access"
   - Go through the Google authorization flow
   - Grant all requested permissions

4. **Copy New Web App URL**:
   - After deployment, copy the new Web App URL
   - It should look like: `https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec`

### Step 3: Test the Deployment

1. **Test GET Request**:
   - Open the Web App URL in your browser
   - You should see a JSON response like:
   ```json
   {
     "service": "Stripe Webhook Handler",
     "status": "active",
     "timestamp": "2025-09-15T...",
     "version": "2.0",
     "events": ["payment_intent.succeeded", "refund.created"],
     "spreadsheet": "1PaCOgNJmKSb2VsJjCMjWpCG-gwrO7uVkuTAFUdrV-_o"
   }
   ```

2. **Test Apps Script Function**:
   - In Apps Script editor, run the `testWebhook()` function
   - Check the execution log for success

### Step 4: Update Stripe Webhook Configuration

1. **Go to Stripe Dashboard**:
   - Navigate to Developers > Webhooks
   - Find your existing webhook endpoint

2. **Update Endpoint URL**:
   - Click on your webhook
   - Update the endpoint URL with the new Web App URL
   - Make sure it ends with `/exec`

3. **Verify Events**:
   - Ensure these events are selected:
     - `payment_intent.succeeded`
     - `refund.created`

4. **Save Changes**

### Step 5: Test with Stripe

1. **Send Test Event**:
   - In Stripe webhook settings, click "Send test webhook"
   - Send a `payment_intent.succeeded` event

2. **Check Response**:
   - You should see a 200 OK response
   - Response body should be JSON, not HTML

3. **Verify Data**:
   - Check your Google Sheet for the test entry
   - Look for the `payment_succesful` tab

## 🔍 Advanced Troubleshooting

### Check Execution Logs

1. **In Google Apps Script**:
   - Go to "Executions" tab
   - Look for recent webhook executions
   - Check for errors or failures

2. **Common Log Entries**:
   ```
   ✅ Good: "Webhook Event Type: payment_intent.succeeded"
   ✅ Good: "Added new payment intent at row X"
   ❌ Bad: "ReferenceError" or "Authorization required"
   ```

### Verify Permissions

1. **Script Permissions**:
   - The script needs access to Google Sheets
   - Must be authorized to run as you
   - Public access must be enabled

2. **Sheet Permissions**:
   - Your Google Apps Script account must have edit access
   - Sheet ID must be correct

### Check Sheet Structure

1. **Verify Sheet Exists**:
   - Open the Database_CarePortals sheet
   - Confirm sheet ID: `1PaCOgNJmKSb2VsJjCMjWpCG-gwrO7uVkuTAFUdrV-_o`

2. **Check Tab Names**:
   - `payment_succesful` (note the typo - this matches your current setup)
   - `refund.created`

## 🚀 Testing Procedure

### 1. Manual Test in Apps Script

```javascript
// Run this in the Apps Script editor
function manualTest() {
  // Test the webhook function directly
  const testData = {
    postData: {
      contents: JSON.stringify({
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test_123',
            amount: 1000,
            currency: 'usd',
            status: 'succeeded',
            created: Math.floor(Date.now() / 1000),
            metadata: { resourceId: '9999' }
          }
        }
      })
    }
  };

  const result = doPost(testData);
  console.log(result.getContent());
}
```

### 2. Test with cURL

```bash
curl -X POST "YOUR_WEB_APP_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "payment_intent.succeeded",
    "data": {
      "object": {
        "id": "pi_test_123",
        "amount": 1000,
        "currency": "usd",
        "status": "succeeded",
        "created": 1694808000,
        "metadata": { "resourceId": "9999" }
      }
    }
  }'
```

### 3. Check Stripe Test Events

1. **Use Stripe CLI** (if installed):
   ```bash
   stripe listen --forward-to YOUR_WEB_APP_URL
   ```

2. **Trigger Test Payment**:
   ```bash
   stripe trigger payment_intent.succeeded
   ```

## 🔧 Common Issues & Solutions

### Issue 1: "Authorization Required"
**Solution**: Re-authorize the web app deployment
- Go to Deploy > Manage deployments
- Click "Authorize access" again

### Issue 2: "Script disabled"
**Solution**: Enable the Apps Script API
- Go to [console.developers.google.com](https://console.developers.google.com)
- Enable Apps Script API

### Issue 3: "Execution exceeded time limit"
**Solution**: Optimize the script
- The fixed version includes retry logic
- Add more error handling

### Issue 4: Wrong URL format
**Solution**: Ensure URL format is correct
```
✅ Correct: https://script.google.com/macros/s/{ID}/exec
❌ Wrong: https://script.googleusercontent.com/...
```

## 📊 Monitoring & Debugging

### 1. Enable Detailed Logging

Add this to your script for debugging:
```javascript
function debugWebhook(e) {
  console.log('=== DEBUG INFO ===');
  console.log('Headers:', JSON.stringify(e));
  console.log('POST data:', e.postData?.contents);
  console.log('Parameters:', JSON.stringify(e.parameter));
}
```

### 2. Create Test Function

```javascript
function createTestEntry() {
  try {
    const testResult = testWebhook();
    console.log('Test successful:', testResult);
    return testResult;
  } catch (error) {
    console.error('Test failed:', error);
    throw error;
  }
}
```

### 3. Monitor Execution Frequency

- Check Apps Script quotas
- Monitor daily execution limits
- Watch for quota exceeded errors

## 🔒 Security Improvements

### 1. Add Webhook Signature Verification

```javascript
// In your script, add the Stripe webhook secret
const WEBHOOK_SECRET = 'whsec_your_secret_here';

// The fixed script includes signature verification
```

### 2. Rate Limiting

The fixed script includes:
- Retry logic for transient failures
- Better error handling
- Execution time monitoring

## 📋 Quick Checklist

- [ ] Web app deployed with "Anyone" access
- [ ] Script authorized and permissions granted
- [ ] Stripe webhook URL updated to new deployment
- [ ] Test GET request returns JSON response
- [ ] Manual test function executes successfully
- [ ] Stripe test webhook returns 200 OK
- [ ] Data appears in Google Sheets
- [ ] Execution logs show no errors

## 🆘 If Still Not Working

1. **Create New Apps Script Project**:
   - Sometimes projects get corrupted
   - Start fresh with the fixed code

2. **Check Google Apps Script Status**:
   - Visit [status.cloud.google.com](https://status.cloud.google.com)
   - Look for Apps Script service issues

3. **Alternative Approach**:
   - Use Google Cloud Functions instead
   - Set up Zapier webhook integration
   - Use alternative webhook services

## 📞 Getting Help

1. **Check Apps Script Community**:
   - [Google Apps Script Community](https://developers.google.com/apps-script/support)

2. **Stripe Support**:
   - Stripe has excellent webhook debugging tools
   - Use webhook event logs for troubleshooting

3. **Test with Simple Webhook**:
   - Start with a minimal webhook that just logs data
   - Gradually add functionality

---

**Next Steps**: Follow this guide step by step, and your webhook should start working properly. The fixed script includes much better error handling and logging to help diagnose any remaining issues.