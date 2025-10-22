# Stripe Webhook Modification Instructions

## Background Context
The existing Google Apps Script webhook is currently listening to `payment_intent.succeeded` events from Stripe. However, the required `resourceID` field is no longer present in the webhook payload's metadata, despite being present in the actual Payment Intent object stored in Stripe. The partner platform adds the `resourceID` to the Payment Intent before the webhook fires, but Stripe's webhook payload is not including this metadata field in the event data.

## Required Modification
Modify the existing webhook handler to make an additional API call to Stripe to retrieve the complete Payment Intent object, which will contain the `resourceID` in its metadata. The `resourceID` is already present in Stripe's system when the webhook fires, but is not included in the webhook payload.

## Prerequisites
- Stripe secret API key is already stored securely using `PropertiesService.getScriptProperties().setProperty('STRIPE_SECRET_KEY', 'sk_live_...')`
- Existing webhook is deployed and receiving `payment_intent.succeeded` events
- The webhook URL is configured in Stripe dashboard

## Implementation Steps

### Step 1: Modify the doPost Function
Replace the existing `payment_intent.succeeded` event handler with the following logic:

```javascript
function doPost(e) {
  try {
    const event = JSON.parse(e.postData.contents);
    
    if (event.type === 'payment_intent.succeeded') {
      // Extract Payment Intent ID from webhook payload
      const paymentIntentId = event.data.object.id;
      
      // Retrieve stored Stripe API key
      const apiKey = PropertiesService.getScriptProperties().getProperty('STRIPE_SECRET_KEY');
      
      if (!apiKey) {
        console.error('Stripe API key not found in properties');
        return ContentService.createTextOutput('API key not configured');
      }
      
      // Make synchronous API call to retrieve complete Payment Intent
      // The resourceID is already present in Stripe, just not in webhook payload
      const response = UrlFetchApp.fetch(`https://api.stripe.com/v1/payment_intents/${paymentIntentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      // Parse response and extract resourceID
      const fullPaymentIntent = JSON.parse(response.getContentText());
      const resourceID = fullPaymentIntent.metadata.resourceID;
      
      if (resourceID) {
        console.log(`Found resourceID: ${resourceID} for Payment Intent: ${paymentIntentId}`);
        
        // Call existing transaction processing logic with resourceID
        processTransaction(resourceID, fullPaymentIntent);
      } else {
        console.warn(`No resourceID found in metadata for Payment Intent: ${paymentIntentId}`);
        console.log('Available metadata:', JSON.stringify(fullPaymentIntent.metadata, null, 2));
      }
    }
    
    // Return success response to Stripe
    return ContentService.createTextOutput(JSON.stringify({received: true}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Webhook processing error:', error);
    return ContentService.createTextOutput('Error processing webhook')
      .setMimeType(ContentService.MimeType.TEXT);
  }
}
```

### Step 2: Update Transaction Processing Function
Ensure your existing transaction processing function accepts the resourceID parameter:

```javascript
function processTransaction(resourceID, paymentIntentData) {
  // Replace this with your existing transaction logic
  // that previously extracted resourceID from event.data.object.metadata.resourceID
  
  console.log(`Processing transaction for resourceID: ${resourceID}`);
  console.log(`Payment amount: ${paymentIntentData.amount}`);
  console.log(`Currency: ${paymentIntentData.currency}`);
  
  // Your existing business logic here:
  // - Update spreadsheets
  // - Send notifications
  // - Log transactions
  // etc.
}
```

### Step 3: Add Error Handling and Logging
Add comprehensive logging to track the API call success:

```javascript
function logApiCall(paymentIntentId, success, resourceID = null) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] API Call - PI: ${paymentIntentId}, Success: ${success}, ResourceID: ${resourceID || 'N/A'}`);
}
```

## Key Technical Points

### API Call Details
- **Endpoint**: `https://api.stripe.com/v1/payment_intents/{PAYMENT_INTENT_ID}`
- **Method**: GET
- **Authentication**: Bearer token using stored API key
- **Expected Response**: Complete Payment Intent object with metadata

### Data Flow
1. Partner platform creates/updates Payment Intent with `resourceID` in metadata
2. Payment processing completes successfully
3. Stripe fires `payment_intent.succeeded` webhook (without complete metadata in payload)
4. Webhook handler extracts `paymentIntentId` from `event.data.object.id`
5. Retrieve stored API key from PropertiesService
6. Make GET request to Stripe API for complete Payment Intent object
7. Extract `resourceID` from `response.metadata.resourceID` (guaranteed to be present)
8. Process transaction using existing logic with resourceID

### Error Scenarios to Handle
- API key not found in properties
- Stripe API call fails (network, authentication, rate limits)
- Payment Intent not found
- resourceID still not present in metadata
- JSON parsing errors

### Performance Considerations
- Each `payment_intent.succeeded` event will now make 1 additional API call to Stripe
- This adds ~200-500ms latency to webhook processing
- Stripe API has rate limits (100 requests per second in live mode)
- No timing issues or race conditions since resourceID is already present when webhook fires

## Testing Instructions

1. **Test with existing webhook**: Ensure existing functionality still works
2. **Monitor console logs**: Check for successful API calls and resourceID extraction
3. **Verify resourceID presence**: Confirm the retrieved Payment Intent contains the expected resourceID
4. **Test error handling**: Simulate API failures to ensure graceful degradation

## Migration Notes

- **No webhook URL changes required**: The existing webhook endpoint remains the same
- **Backward compatibility**: If resourceID is not found, log a warning but don't fail
- **Gradual rollout**: The modification can be deployed immediately as it's additive to existing functionality

## Security Considerations

- API key is securely stored using PropertiesService (encrypted by Google)
- No API key exposure in logs or responses
- Only retrieve necessary data from Stripe API
- Maintain existing webhook signature verification if implemented