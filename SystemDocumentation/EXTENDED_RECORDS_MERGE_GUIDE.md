# Extended Records Merge Guide

This guide documents the extended records merge process that integrates new order and customer data from CSV files into the Database_CarePortals.xlsx system.

## 📋 Overview

The extended records merge system processes CSV files containing order and customer data beyond the scope of the main Database_CarePortals system, adding new records while preserving data integrity through sophisticated deduplication.

## 🔧 System Components

### Primary Script
- **File**: `Scripts/DataProcessing/merge_extended_records.py`
- **Purpose**: Merge extended order and customer records into Database_CarePortals.xlsx
- **Language**: Python 3 with pandas

### Data Sources
- **Input**: `GoogleSheets/extended_record.csv` (224 records as of September 8, 2025)
- **Target**: `GoogleSheets/Database_CarePortals.xlsx`
- **Output**: `EXTENDED_RECORDS_MERGE_SUMMARY.md`

## 📊 Data Processing Flow

### 1. Data Loading
```python
extended_df = pd.read_csv('GoogleSheets/extended_record.csv')
existing_orders_df = pd.read_excel(db_file, sheet_name='order.created')
existing_customers_df = pd.read_excel(db_file, sheet_name='customers')
```

### 2. Field Mappings
The script applies these critical field mappings:

| CSV Column | Database Column | Notes |
|------------|-----------------|-------|
| `Datetime Purchase` | `created_at` | Timezone conversion applied |
| `Care Portals Internal Order ID` | `care_portals_internal_order_id` | Primary deduplication key |
| `Customer ID` | `customer_id` | Customer deduplication key |
| `First Name` | `first_name` | Customer information |
| `Last Name` | `last_name` | Customer information |
| `Email` | `email` | Customer contact |
| `Phone` | `phone` | Customer contact |
| `Total Amount` | `total_amount` | Financial data |
| `Discount Amount` | `discount_amount` | Financial data |
| `Base Amount` | `base_amount` | Financial data |

### 3. Blank Field Handling
Fields not present in CSV are left blank as specified:
- `shipping_address_id` - Not in CSV source
- `pharmacy_assigned` - Not in CSV source
- `product_id` - Not in CSV source

### 4. Deduplication Strategy
- **Orders**: Deduplicated by `care_portals_internal_order_id`
- **Customers**: Deduplicated by `customer_id`
- **Approach**: Set operations to identify new records only
- **Safety**: No existing records are overwritten

## 🚀 Usage Instructions

### Basic Execution
```bash
cd /home/cmwldaniel/Reporting
python3 Scripts/DataProcessing/merge_extended_records.py
```

### Prerequisites
- Python 3 with pandas and openpyxl libraries
- `GoogleSheets/extended_record.csv` file present
- `GoogleSheets/Database_CarePortals.xlsx` accessible

### Expected Output
```
🚀 Starting Extended Records Merge Process
📂 Loading data files...
✅ Extended records: 224 rows
✅ Existing orders: [existing count] rows
✅ Existing customers: [existing count] rows
🔍 Finding new orders to add...
📊 Analysis Results:
   - New orders to add: 177
👥 Finding new customers to add...
📊 Customer Analysis:
   - New customers to add: 146
💾 Updating database...
✅ Updated order.created: [old] → [new] rows
✅ Updated customers: [old] → [new] rows
📄 Summary report saved to: EXTENDED_RECORDS_MERGE_SUMMARY.md
🎉 Extended Records Merge Completed Successfully!
```

## 📈 Performance Results

### September 8, 2025 Merge Results
- **Source Records**: 224 from extended_record.csv
- **New Orders Added**: 177 (deduplication removed 47 duplicates)
- **New Customers Added**: 146 (deduplication removed 78 duplicates)
- **Processing Time**: ~3 seconds
- **Data Integrity**: 100% preserved

## 🔍 Quality Assurance

### Data Validation
1. **Datetime Conversion**: Automatic conversion with error handling
2. **Internal Deduplication**: Removes duplicates within CSV itself
3. **External Deduplication**: Prevents overwriting existing records
4. **Schema Matching**: Ensures new data matches database structure

### Error Handling
- Comprehensive try/catch blocks
- Detailed error reporting with stack traces
- Graceful failure with rollback capability
- Pre-flight checks for data integrity

### Verification Steps
1. **Record Count Validation**: Before/after counts logged
2. **Key Uniqueness**: Deduplication keys verified
3. **Schema Compliance**: Column mapping validated
4. **Summary Report**: Detailed results documented

## 🗂️ File Locations

### Script Location
```
Reporting/
└── Scripts/
    └── DataProcessing/
        └── merge_extended_records.py
```

### Data Files
```
Reporting/
└── GoogleSheets/
    ├── extended_record.csv              # Input data
    ├── Database_CarePortals.xlsx        # Target database
    └── EXTENDED_RECORDS_MERGE_SUMMARY.md # Results report
```

## 🔧 Integration with Dashboard

The merged data immediately becomes available to the Dashboard Visualization system through:
1. **Increased Record Counts**: More orders and customers in analytics
2. **Enhanced Metrics**: Improved subscription tracking with expanded dataset
3. **Better Insights**: More comprehensive customer analysis

## 📋 Maintenance

### Regular Operations
- **Frequency**: Run as needed when new CSV data available
- **Monitoring**: Check summary reports for processing results
- **Validation**: Verify record counts in dashboard after merge

### Troubleshooting
1. **CSV Format Issues**: Verify column names match expected mappings
2. **Excel Access**: Ensure Database_CarePortals.xlsx is not locked
3. **Memory Issues**: Large CSV files may require chunked processing
4. **Datetime Errors**: Check timestamp format consistency

## 📚 Related Documentation

- **Dashboard System**: `/DashboardVisualization/README.md`
- **Database Schema**: `/SystemDocumentation/field_mapping.md`
- **Scripts Overview**: `/Scripts/README.md`
- **CarePortals System**: `/CarePortals/README.md`

---

**Last Updated**: September 8, 2025  
**Version**: 1.0  
**Maintainer**: System Administrator