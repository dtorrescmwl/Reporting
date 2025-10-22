# Scripts Directory

This directory contains all automation and data processing scripts organized by function.

## 📁 Directory Structure

### `/Embeddables/`
**Embeddables form data extraction and processing**
- `embeddables_multi_funnel_extractor.py` - Main extraction script for all funnel types
- `test_entries_exclusion.txt` - Test entry IDs to exclude from reporting
- `funnel_list.txt` - Reference list of available funnels

### `/DataProcessing/`
**Data analysis and processing utilities**
- `examine_submissions_data.py` - Data quality analysis and exploration
- `update_database_subscriptions.py` - Clean and merge subscription data from EXTRA_subscriptions.xlsx
- `merge_extended_records.py` - ✅ **PRODUCTION** Merge extended orders/customers from CSV into Database_CarePortals.xlsx
  - **Purpose**: Integrates 224 extended records into main database
  - **Results**: +177 orders and +146 customers successfully merged (Sep 8, 2025)
  - **Features**: Deduplication, field mapping, data integrity protection
  - **Documentation**: `/SystemDocumentation/EXTENDED_RECORDS_MERGE_GUIDE.md`
- **OrdersWebhook/**: Order status tracking data conversion tools
  - `convert_order_updated_format.py` - Converts CSV to webhook format for order.updated processing
  - **Current Database**: Database_CarePortals.xlsx with 3,081 order.updated records
- **Stripe/**: Stripe payment data integration
  - `stripe_exporter.py` - Historical payment/refund data extraction
  - **Integration**: Links with real-time webhook processing

### `/Utilities/`
**System maintenance and utility scripts**
- `update_notebook_data_sources.py` - Updates Jupyter notebook data sources
- `fix_notebook_syntax.py` - Fixes syntax errors in notebook cells
- `fix_main_dataframes.py` - Repairs malformed functions in notebook
- `fix_notebook_final.py` - Complete notebook cell replacement utility
- `clean_notebook_completely.py` - Clears all execution history and cache

## 🚀 Usage

### Embeddables Data Extraction
```bash
# Extract all funnels
python3 Scripts/Embeddables/embeddables_multi_funnel_extractor.py

# Extract specific funnel
python3 Scripts/Embeddables/embeddables_multi_funnel_extractor.py --funnel medication_v1

# Extract complete submissions only
python3 Scripts/Embeddables/embeddables_multi_funnel_extractor.py --checkout-only
```

### Data Analysis
```bash
# Examine submission data quality
python3 Scripts/DataProcessing/examine_submissions_data.py

# Merge extended records into Database_CarePortals.xlsx
python3 Scripts/DataProcessing/merge_extended_records.py
```

### System Maintenance
```bash
# Update Jupyter notebook data sources
python3 Scripts/Utilities/update_notebook_data_sources.py
```

## 📋 Configuration

All scripts use environment variables from `/home/cmwldaniel/Reporting/.env`:
- `EMBEDDABLES_API_KEY` - API authentication
- `EMBEDDABLES_PROJECT_ID` - Project identifier  
- Output paths and funnel IDs

## 🗂️ Data Flow

1. **Extraction**: Scripts pull data from Embeddables API
2. **Processing**: Data is cleaned and filtered (test entries removed)
3. **Output**: Clean CSV files generated in `/Embeddables/Data/`
4. **Analysis**: Jupyter notebook automatically uses latest data files