# CarePortals Webhook Troubleshooting Guide

This document captures common issues and solutions encountered when working with CarePortals webhook integrations.

## 🚨 Critical Issue: Product Object Structure

### Problem
**Symptom**: Product field shows `[object Object]` instead of product ID in spreadsheet
**Cause**: CarePortals sends product as complex object despite documentation showing it as simple string

### Root Cause Analysis
1. **Documentation vs Reality Gap**: CarePortals API docs show `"product": "6740b2cfe34bda25c01b2108"` but actual webhooks send product as nested object
2. **Stringification Issue**: Using `"product": "{{product}}"` in JSON mapping causes object-to-string conversion resulting in `"[object Object]"`
3. **JavaScript Limitations**: CarePortals JSON mapping doesn't support JavaScript functions like `Object.keys()` or `JSON.stringify()`

### Debugging Process That Led to Solution
```json
// ATTEMPTED: JavaScript introspection (failed)
"debug_product_keys": "{{Object.keys(product)}}",     // Returns: ""
"debug_product_json": "{{JSON.stringify(product)}}",  // Returns: ""
"debug_product_typeof": "{{typeof product}}",         // Returns: ""

// ATTEMPTED: Property guesses (partial success)
"product._id": "{{product._id}}",     // Returns: "681e041f5b1be9b2b1b5975d" ✅
"product.name": "{{product.name}}",   // Returns: ""
"product.id": "{{product.id}}",       // Returns: ""
"product.title": "{{product.title}}", // Returns: ""
"product.sku": "{{product.sku}}",     // Returns: ""
```

### Solution Implemented
**JSON Mapping Change**:
```json
// BEFORE (broken)
{
  "product": "{{product}}"
}

// AFTER (working)
{
  "product._id": "{{product._id}}"
}
```

**AppScript Access Change**:
```javascript
// BEFORE (broken)
data.product  // Returns: "[object Object]"

// AFTER (working)
data["product._id"]  // Returns: "681e041f5b1be9b2b1b5975d"
```

**Note**: Bracket notation required because field name contains dot.

### Testing Verification
Real webhook result that confirmed the fix:
```
Product Value: [object Object]
Product._id: 681e041f5b1be9b2b1b5975d  ← This was the expected product ID
```

## 🔧 General Debugging Strategy

### For [object Object] Issues
1. **Test dot notation access**: Try `{{field.subfield}}`, `{{field._id}}`, `{{field.id}}`
2. **Use debug sheet**: Create temporary debug columns to capture multiple property attempts
3. **Verify in raw payload**: Check the actual JSON string sent by webhook
4. **Don't rely on documentation**: Always test actual webhook behavior vs documented structure

### For Timestamp Issues
- CarePortals sends UTC, convert to Eastern Time in AppScript
- Use `convertToEasternTime()` helper function for consistency

### For Customer Deduplication
- Use `data["customer._id"]` for customer identification
- Customer email as secondary identifier if needed

## 📝 Lessons Learned

### CarePortals Webhook Patterns
1. **Object Nesting**: Fields shown as strings in docs may actually be objects
2. **Dot Notation Works**: `{{object.property}}` syntax works for accessing nested fields
3. **JavaScript Doesn't Work**: No support for JS functions in JSON mapping
4. **Bracket Notation Required**: In AppScript, use `data["field.subfield"]` for dot-containing keys

### Debugging Best Practices
1. **Start with debug sheet**: Capture multiple property attempts simultaneously
2. **Use raw webhook payload**: Always log `e.postData.contents` for inspection
3. **Test property variations**: Try common patterns like `_id`, `id`, `name`, `title`
4. **Document findings**: Update this guide when new patterns discovered

### Working Field Patterns in CarePortals
```javascript
// Customer fields (nested object flattened)
data["customer._id"]
data["customer.email"]
data["customer.firstName"]
data["customer.lastName"]
data["customer.phone"]

// Product fields (object with _id property)
data["product._id"]  // Primary identifier

// Simple fields (as documented)
data._id
data.organization
data.status
data.currentCycle
data.currency
data.createdAt
data.updatedAt
```

## 🚀 Quick Fixes

### Product ID Not Showing
```json
// Replace this:
"product": "{{product}}"

// With this:
"product._id": "{{product._id}}"
```

### Customer ID Not Showing
```json
// Make sure you're using:
"customer._id": "{{customer._id}}"
// Not:
"customer": "{{customer}}"
```

### AppScript Access Errors
```javascript
// Use bracket notation for dot-containing field names:
const productId = data["product._id"];
const customerId = data["customer._id"];

// Not object notation:
const productId = data.product._id;  // This won't work
```

---

**Last Updated**: Today  
**Next Review**: When new CarePortals integration issues discovered