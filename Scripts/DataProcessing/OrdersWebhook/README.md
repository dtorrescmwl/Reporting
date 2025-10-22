# Order.Updated Webhook Format Converter

This directory contains tools for converting CSV files from the CarePortals_Orders spreadsheet format to the format expected by the order.updated webhook processing function.

## Files

- `convert_order_updated_format.py` - Main conversion script
- `sample_input.csv` - Example input file format
- `test_output.csv` - Example output from conversion
- `README.md` - This documentation file

## Purpose

The `convert_order_updated_format.py` script converts CSV files with the same structure as the Database_CarePortals spreadsheet order.updated tab into the format that the Google Apps Script `processOrderUpdate()` function expects.

**Current Database Structure**: The order.updated tab in Database_CarePortals.xlsx now contains 3,081 records with real-time order status tracking.

### Input Format
The script accepts CSV files with columns for order data, automatically detecting common column name variations:

**Required columns (one of each):**
- Order ID: `order_id`, `Order ID`, `id`, `Order_ID`, `order_number`
- Status: `status`, `updated_status`, `Status`, `order_status`, `current_status`

**Optional columns:**
- Created timestamp: `created_at`, `createdAt`, `Created At`, `date_created`, `created`
- Updated timestamp: `updated_at`, `updatedAt`, `Updated At`, `date_updated`, `updated`, `modified_at`

### Output Format
The script produces a CSV file with exactly these columns:
- `Datetime Created` - Eastern Time formatted timestamp
- `Datetime Updated` - Eastern Time formatted timestamp
- `order_id` - Order identifier (4-digit)
- `updated_status` - Order status

## Usage

### Basic Usage
```bash
python3 convert_order_updated_format.py input.csv output.csv
```

### With Verbose Output
```bash
python3 convert_order_updated_format.py input.csv output.csv --verbose
```

### Example
```bash
# Convert a CarePortals export to webhook format
python3 convert_order_updated_format.py careportals_orders_export.csv webhook_ready.csv

# Test with the provided sample
python3 convert_order_updated_format.py sample_input.csv my_output.csv --verbose
```

## Requirements

- Python 3.6+
- pandas
- pytz

Install requirements:
```bash
pip3 install pandas pytz
```

## Features

- **Automatic column detection** - Recognizes common variations of column names
- **Timezone conversion** - Converts UTC timestamps to Eastern Time (EST/EDT)
- **Flexible datetime parsing** - Handles multiple datetime formats
- **Error handling** - Skips invalid rows and reports issues
- **Validation** - Ensures required fields are present
- **Verbose mode** - Shows detailed processing information

## Input File Examples

### Standard Format
```csv
order_id,status,created_at,updated_at
1234,awaiting_script,2024-01-15T15:30:00Z,2024-01-15T16:45:00Z
5678,awaiting_shipment,2024-01-16T10:00:00Z,2024-01-16T14:30:00Z
```

### Alternative Column Names
```csv
Order ID,Status,Created At,Updated At
1234,awaiting_script,01/15/2024 15:30:00,01/15/2024 16:45:00
5678,awaiting_shipment,01/16/2024 10:00:00,01/16/2024 14:30:00
```

## Output File Format

The output CSV will always have this exact format:
```csv
Datetime Created,Datetime Updated,order_id,updated_status
"01/15/2024, 10:30:00 AM","01/15/2024, 11:45:00 AM",1234,awaiting_script
"01/16/2024, 05:00:00 AM","01/16/2024, 09:30:00 AM",5678,awaiting_shipment
```

## Integration with Webhook System

The output CSV format matches exactly what the Google Apps Script `processOrderUpdate()` function expects:

```javascript
// Headers expected by processOrderUpdate()
const headers = [
  "Datetime Created", "Datetime Updated", "order_id", "updated_status"
];
```

This ensures seamless integration with the existing webhook processing infrastructure.

## Error Handling

The script will:
- Skip rows with missing required data
- Report processing errors for individual rows
- Continue processing even if some rows fail
- Provide detailed error messages
- Exit with error code if no valid rows are converted

## Timezone Handling

All timestamps are automatically converted from UTC to Eastern Time (America/New_York timezone), which handles EST/EDT transitions automatically. The output format matches the Google Apps Script's `convertToEasternTime()` function.

---

*Created: October 2025*
*Part of the CarePortals Database Orders Processing System*