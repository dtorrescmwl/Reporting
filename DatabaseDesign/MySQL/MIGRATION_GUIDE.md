# CarePortals Google Sheets to MySQL Migration Guide

**Version:** 1.0
**Date:** 2025-10-22
**Purpose:** Step-by-step guide for migrating from Database_CarePortals.xlsx to MySQL

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Pre-Migration Checklist](#pre-migration-checklist)
3. [Migration Phases](#migration-phases)
4. [Data Transformation Scripts](#data-transformation-scripts)
5. [Validation Procedures](#validation-procedures)
6. [Rollback Strategy](#rollback-strategy)
7. [Post-Migration Tasks](#post-migration-tasks)
8. [Troubleshooting](#troubleshooting)

---

## Executive Summary

### Migration Overview

**Current State:**
- Database: Google Sheets (`Database_CarePortals.xlsx`)
- Records: ~5,100+ across 16 sheets
- Integration: Real-time webhooks from Stripe and CarePortals
- Update Frequency: Milliseconds (webhook-driven)

**Target State:**
- Database: MySQL 8.0+ (`careportals_db`)
- Tables: 16 normalized InnoDB tables
- Integration: Direct webhook writes to MySQL
- Performance: 10x faster queries, ACID compliance

**Migration Strategy:**
- **Approach:** Phased migration with dual-write period
- **Downtime:** Zero (dual-write ensures continuity)
- **Duration:** 2-4 weeks (includes validation)
- **Risk Level:** Low (with proper testing and rollback plan)

---

## Pre-Migration Checklist

### 1. Infrastructure Requirements

#### MySQL Server Setup
```bash
# MySQL 8.0+ with InnoDB support
mysql --version
# Output: mysql  Ver 8.0.x

# Required configuration
[mysqld]
default-storage-engine = InnoDB
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci
max_connections = 150
innodb_buffer_pool_size = 1G  # Adjust based on available RAM
innodb_log_file_size = 256M
```

#### Network Configuration
```bash
# Ensure MySQL is accessible from Google Apps Script
# If using Google Cloud SQL:
gcloud sql instances create careportals-db \
  --database-version=MYSQL_8_0 \
  --tier=db-n1-standard-2 \
  --region=us-central1

# If self-hosted, configure firewall
sudo ufw allow 3306/tcp
```

#### Python Environment (for migration scripts)
```bash
python3 --version  # Python 3.8+
pip3 install pandas mysql-connector-python google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client
```

### 2. Backup Current Data

```bash
# Download complete Google Sheets backup
python3 backup_google_sheets.py --spreadsheet-id "1PaCOgNJmKSb2VsJjCMjWpCG-gwrO7uVkuTAFUdrV-_o" --output "backup_$(date +%Y%m%d).xlsx"

# Archive backup
tar -czf careportals_backup_$(date +%Y%m%d).tar.gz backup_*.xlsx
```

### 3. Environment Variables

Create `.env` file:
```bash
# MySQL Connection
MYSQL_HOST=your-mysql-host
MYSQL_PORT=3306
MYSQL_USER=careportals_admin
MYSQL_PASSWORD=your_secure_password
MYSQL_DATABASE=careportals_db

# Google Sheets
GOOGLE_SHEETS_ID=1PaCOgNJmKSb2VsJjCMjWpCG-gwrO7uVkuTAFUdrV-_o
GOOGLE_CREDENTIALS_PATH=/path/to/credentials.json

# Webhook Endpoints
STRIPE_WEBHOOK_SECRET=whsec_xxx
CAREPORTALS_WEBHOOK_SECRET=your_webhook_secret
```

---

## Migration Phases

### Phase 1: Schema Creation (Day 1)

#### Step 1.1: Execute DDL
```bash
# Connect to MySQL
mysql -h $MYSQL_HOST -u $MYSQL_USER -p

# Execute DDL script
mysql> source CAREPORTALS_MYSQL_DDL.sql

# Verify table creation
mysql> USE careportals_db;
mysql> SHOW TABLES;
mysql> SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'careportals_db';
# Expected: 16 tables
```

#### Step 1.2: Verify Foreign Keys
```sql
-- Check all foreign key constraints
SELECT
    TABLE_NAME,
    COLUMN_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'careportals_db'
  AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY TABLE_NAME, COLUMN_NAME;

-- Expected: 18 foreign key relationships
```

#### Step 1.3: Verify Indexes
```sql
-- Check index creation
SELECT
    TABLE_NAME,
    INDEX_NAME,
    COLUMN_NAME,
    SEQ_IN_INDEX,
    NON_UNIQUE
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = 'careportals_db'
ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX;

-- Expected: 40+ indexes
```

---

### Phase 2: Static Data Migration (Days 2-3)

#### Step 2.1: Migration Script Setup

Create `migrate_data.py`:
```python
#!/usr/bin/env python3
"""
CarePortals Data Migration Script
Migrates data from Google Sheets to MySQL
"""

import pandas as pd
import mysql.connector
from google.oauth2 import service_account
from googleapiclient.discovery import build
import hashlib
import os
from dotenv import load_dotenv

load_dotenv()

# Google Sheets API setup
SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly']
SPREADSHEET_ID = os.getenv('GOOGLE_SHEETS_ID')
CREDENTIALS_PATH = os.getenv('GOOGLE_CREDENTIALS_PATH')

# MySQL connection
MYSQL_CONFIG = {
    'host': os.getenv('MYSQL_HOST'),
    'user': os.getenv('MYSQL_USER'),
    'password': os.getenv('MYSQL_PASSWORD'),
    'database': os.getenv('MYSQL_DATABASE'),
    'charset': 'utf8mb4',
    'collation': 'utf8mb4_unicode_ci'
}

def get_google_sheets_data(sheet_name):
    """Fetch data from Google Sheets"""
    creds = service_account.Credentials.from_service_account_file(
        CREDENTIALS_PATH, scopes=SCOPES
    )
    service = build('sheets', 'v4', credentials=creds)
    sheet = service.spreadsheets()

    result = sheet.values().get(
        spreadsheetId=SPREADSHEET_ID,
        range=f'{sheet_name}!A1:ZZ'
    ).execute()

    values = result.get('values', [])
    if not values:
        return pd.DataFrame()

    # Convert to DataFrame
    df = pd.DataFrame(values[1:], columns=values[0])
    return df

def normalize_address(address1, address2, city, province, postal):
    """Create MD5 hash for address normalization"""
    components = [
        normalize_street(address1 or ''),
        normalize_street(address2 or ''),
        (city or '').lower().strip(),
        (province or '').lower().strip(),
        (postal or '').lower().replace(' ', '')
    ]
    address_string = '|'.join(components)
    return hashlib.md5(address_string.encode()).hexdigest()

def normalize_street(street):
    """Normalize street address"""
    if not street:
        return ''

    street = street.lower().strip()
    replacements = {
        ' st ': ' street ',
        ' ave ': ' avenue ',
        ' rd ': ' road ',
        ' blvd ': ' boulevard ',
        ' dr ': ' drive ',
        ' ln ': ' lane ',
        ' ct ': ' court '
    }

    for old, new in replacements.items():
        street = street.replace(old, new)

    return street

def dollars_to_cents(dollar_value):
    """Convert dollar amounts to cents"""
    if dollar_value is None or dollar_value == '':
        return None
    try:
        return int(round(float(dollar_value) * 100))
    except:
        return None

def migrate_table(sheet_name, table_name, transform_func=None):
    """Generic table migration function"""
    print(f"Migrating {sheet_name} -> {table_name}...")

    # Fetch data from Google Sheets
    df = get_google_sheets_data(sheet_name)

    if df.empty:
        print(f"  No data in {sheet_name}, skipping...")
        return 0

    # Apply transformation if provided
    if transform_func:
        df = transform_func(df)

    # Connect to MySQL
    conn = mysql.connector.connect(**MYSQL_CONFIG)
    cursor = conn.cursor()

    # Build INSERT statement
    columns = ','.join(df.columns)
    placeholders = ','.join(['%s'] * len(df.columns))
    insert_query = f"INSERT INTO {table_name} ({columns}) VALUES ({placeholders})"

    # Insert data
    inserted = 0
    for _, row in df.iterrows():
        try:
            cursor.execute(insert_query, tuple(row))
            inserted += 1
        except mysql.connector.Error as err:
            print(f"  Error inserting row: {err}")
            print(f"  Data: {row.to_dict()}")

    conn.commit()
    cursor.close()
    conn.close()

    print(f"  ✓ Migrated {inserted}/{len(df)} records")
    return inserted

# Table-specific transformation functions
def transform_customers(df):
    """Transform customers data"""
    df = df.rename(columns={
        'customer_id': 'customer_id',
        'email': 'email',
        'first_name': 'first_name',
        'last_name': 'last_name',
        'phone': 'phone'
    })
    # Convert phone to integer
    df['phone'] = pd.to_numeric(df['phone'], errors='coerce').fillna(0).astype(int)
    df['created_at'] = pd.to_datetime('now')
    df['updated_at'] = pd.to_datetime('now')
    return df[['customer_id', 'email', 'first_name', 'last_name', 'phone', 'created_at', 'updated_at']]

def transform_addresses(df):
    """Transform addresses data with MD5 hashing"""
    # MD5 hash already exists in Google Sheets as address_id
    return df[['address_id', 'address1', 'address2', 'city', 'province_code', 'postal_code', 'country_code']]

def transform_products(df):
    """Transform products data"""
    # Convert prices to cents
    df['list_price'] = df['list_price'].apply(dollars_to_cents)
    df['sale_price'] = df['sale_price'].apply(dollars_to_cents)
    df['renewal_price'] = df['renewal_price'].apply(dollars_to_cents)

    # Convert active to boolean
    df['active'] = df.get('active', True)

    df['created_at'] = pd.to_datetime('now')
    df['updated_at'] = pd.to_datetime('now')

    return df

def transform_orders(df):
    """Transform orders data"""
    # Convert amounts to cents
    for col in ['total_amount', 'discount_amount', 'base_amount', 'credit_used_amount', 'discount_reduction_amount']:
        if col in df.columns:
            df[col] = df[col].apply(dollars_to_cents)

    # Parse timestamps
    df['created_at'] = pd.to_datetime(df['created_at'])
    df['updated_at'] = pd.to_datetime('now')

    return df

def transform_payments(df):
    """Transform payments data"""
    df['amount'] = df['amount'].apply(dollars_to_cents)
    df['application_fee_amount'] = df.get('application_fee_amount', 0).apply(dollars_to_cents)
    df['created_at'] = pd.to_datetime(df['datetime'])
    df['webhook_received_at'] = pd.to_datetime('now')
    return df

# Migration execution order (respects foreign keys)
MIGRATION_PLAN = [
    ('customers', 'customers', transform_customers),
    ('addresses', 'addresses', transform_addresses),
    ('products', 'products', transform_products),
    ('coupons', 'coupons', None),
    ('order.created', 'orders', transform_orders),
    ('payment_succesful', 'payments', transform_payments),
    ('refund.created', 'refunds', None),
    ('subscription.active', 'subscriptions_active', None),
    ('subscription.paused', 'subscriptions_paused', None),
    ('subscription.cancelled', 'subscriptions_cancelled', None),
    ('order.updated', 'order_status_updates', None),
    ('order.cancelled', 'orders_cancelled', None),
    ('questionnaire_structure', 'questionnaire_responses', None),
    ('subscription.full_log', 'subscriptions_audit_log', None)
]

def main():
    """Main migration execution"""
    print("=" * 60)
    print("CarePortals Data Migration: Google Sheets → MySQL")
    print("=" * 60)

    total_records = 0

    for sheet_name, table_name, transform_func in MIGRATION_PLAN:
        count = migrate_table(sheet_name, table_name, transform_func)
        total_records += count

    print("=" * 60)
    print(f"Migration Complete! Total records migrated: {total_records}")
    print("=" * 60)

if __name__ == '__main__':
    main()
```

#### Step 2.2: Execute Migration
```bash
# Run migration script
python3 migrate_data.py

# Expected output:
# ============================================================
# CarePortals Data Migration: Google Sheets → MySQL
# ============================================================
# Migrating customers -> customers...
#   ✓ Migrated 281/281 records
# Migrating addresses -> addresses...
#   ✓ Migrated 248/248 records
# ... (all tables)
# ============================================================
# Migration Complete! Total records migrated: 5100+
# ============================================================
```

---

### Phase 3: Data Validation (Day 4)

#### Step 3.1: Row Count Validation
```sql
-- Compare record counts
SELECT 'customers' as table_name, COUNT(*) as mysql_count FROM customers
UNION ALL
SELECT 'addresses', COUNT(*) FROM addresses
UNION ALL
SELECT 'products', COUNT(*) FROM products
UNION ALL
SELECT 'orders', COUNT(*) FROM orders
UNION ALL
SELECT 'payments', COUNT(*) FROM payments
UNION ALL
SELECT 'refunds', COUNT(*) FROM refunds;

-- Compare with Google Sheets counts manually
```

#### Step 3.2: Foreign Key Validation
```sql
-- Orphaned orders (missing customer)
SELECT 'Orphaned Orders' as issue, COUNT(*) as count
FROM orders o
LEFT JOIN customers c ON o.customer_id = c.customer_id
WHERE c.customer_id IS NULL;
-- Expected: 0

-- Payment amount mismatches
SELECT 'Payment Mismatches' as issue, COUNT(*) as count
FROM orders o
INNER JOIN payments p ON o.order_id = p.order_id
WHERE o.total_amount != p.amount;
-- Expected: 0 (or investigate differences)

-- Orphaned subscriptions
SELECT 'Orphaned Subscriptions' as issue, COUNT(*) as count
FROM subscriptions_active s
LEFT JOIN customers c ON s.customer_id = c.customer_id
WHERE s.customer_id IS NOT NULL AND c.customer_id IS NULL;
-- Expected: 0
```

#### Step 3.3: Data Integrity Validation
```sql
-- Negative amounts check
SELECT 'Negative Amounts' as issue, COUNT(*) as count
FROM orders
WHERE total_amount < 0 OR base_amount < 0;
-- Expected: 0

-- Invalid email formats
SELECT 'Invalid Emails' as issue, COUNT(*) as count
FROM customers
WHERE email NOT LIKE '%@%.%';
-- Expected: 0

-- Future dates check
SELECT 'Future Dates' as issue, COUNT(*) as count
FROM orders
WHERE created_at > NOW();
-- Expected: 0
```

---

### Phase 4: Webhook Migration (Days 5-7)

#### Step 4.1: Update Google Apps Script Webhooks

**Current:** Google Sheets write
**Target:** MySQL write + Google Sheets write (dual-write period)

Update `StripeTracking.js`:
```javascript
// NEW: MySQL connection function
function writeTo MySQL(table, data) {
  const url = 'https://your-api-endpoint.com/webhook';
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({
      table: table,
      data: data,
      secret: PropertiesService.getScriptProperties().getProperty('WEBHOOK_SECRET')
    })
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    Logger.log('MySQL write successful: ' + response.getContentText());
    return true;
  } catch (error) {
    Logger.log('MySQL write failed: ' + error);
    return false;
  }
}

// Modified: Dual-write function
function recordPayment(chargeData) {
  // Write to Google Sheets (existing)
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('payment_succesful');
  sheet.appendRow([
    chargeData.charge_id,
    chargeData.payment_intent_id,
    chargeData.order_number,
    chargeData.amount,
    // ... rest of fields
  ]);

  // NEW: Write to MySQL
  const mysqlSuccess = writeToMySQL('payments', chargeData);

  // Log dual-write status
  if (!mysqlSuccess) {
    // Write to error log
    logError('MySQL write failed for payment: ' + chargeData.charge_id);
  }
}
```

#### Step 4.2: Deploy API Endpoint (Cloud Function/Lambda)

Example Cloud Function (`webhook_handler.py`):
```python
import json
import mysql.connector
import os
from flask import Flask, request, jsonify

app = Flask(__name__)

MYSQL_CONFIG = {
    'host': os.getenv('MYSQL_HOST'),
    'user': os.getenv('MYSQL_USER'),
    'password': os.getenv('MYSQL_PASSWORD'),
    'database': os.getenv('MYSQL_DATABASE')
}

WEBHOOK_SECRET = os.getenv('WEBHOOK_SECRET')

@app.route('/webhook', methods=['POST'])
def webhook_handler():
    # Verify secret
    data = request.get_json()
    if data.get('secret') != WEBHOOK_SECRET:
        return jsonify({'error': 'Unauthorized'}), 401

    table = data.get('table')
    record = data.get('data')

    # Insert to MySQL
    conn = mysql.connector.connect(**MYSQL_CONFIG)
    cursor = conn.cursor()

    columns = ','.join(record.keys())
    placeholders = ','.join(['%s'] * len(record))
    query = f"INSERT INTO {table} ({columns}) VALUES ({placeholders})"

    try:
        cursor.execute(query, tuple(record.values()))
        conn.commit()
        return jsonify({'success': True}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

if __name__ == '__main__':
    app.run()
```

Deploy:
```bash
# Google Cloud Function
gcloud functions deploy webhook_handler \
  --runtime python39 \
  --trigger-http \
  --allow-unauthenticated \
  --set-env-vars MYSQL_HOST=...,MYSQL_USER=...,MYSQL_PASSWORD=...,MYSQL_DATABASE=...,WEBHOOK_SECRET=...
```

#### Step 4.3: Dual-Write Validation Period (7 days)

- Monitor both Google Sheets and MySQL for parity
- Compare daily record counts
- Check for discrepancies and investigate

Validation query:
```sql
-- Daily comparison
SELECT
    DATE(created_at) as date,
    COUNT(*) as mysql_count
FROM payments
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Compare with Google Sheets manually
```

---

### Phase 5: Cutover (Day 14)

#### Step 5.1: Final Validation
```bash
# Run validation script
python3 validate_data_parity.py

# Expected: 100% parity between Sheets and MySQL
```

#### Step 5.2: Switch to MySQL Primary
```javascript
// Update webhook handlers to write ONLY to MySQL
function recordPayment(chargeData) {
  // REMOVED: Google Sheets write
  // const sheet = SpreadsheetApp.openById(SPREADSHEET_ID)...

  // MySQL write only
  const mysqlSuccess = writeToMySQL('payments', chargeData);

  if (!mysqlSuccess) {
    throw new Error('MySQL write failed for payment: ' + chargeData.charge_id);
  }
}
```

#### Step 5.3: Update Dashboard Connections

Update KPI Dashboard (`Code.gs`):
```javascript
// OLD: Load from Google Sheets
// const ss = SpreadsheetApp.openById(DATABASE_SPREADSHEET_ID);
// const data = loadAllData(ss);

// NEW: Load from MySQL via API
function loadAllData() {
  const url = 'https://your-api-endpoint.com/kpi-data';
  const options = {
    headers: {
      'Authorization': 'Bearer ' + PropertiesService.getScriptProperties().getProperty('API_KEY')
    }
  };

  const response = UrlFetchApp.fetch(url, options);
  return JSON.parse(response.getContentText());
}
```

---

## Data Transformation Scripts

### Address Normalization
```python
def normalize_and_hash_addresses():
    """Normalize addresses from Google Sheets and create MD5 hashes"""
    import hashlib

    # Fetch addresses from Google Sheets
    df = get_google_sheets_data('addresses')

    def create_address_id(row):
        components = [
            normalize_street(row.get('address1', '')),
            normalize_street(row.get('address2', '')),
            row.get('city', '').lower().strip(),
            row.get('province_code', '').lower().strip(),
            row.get('postal_code', '').lower().replace(' ', '')
        ]
        address_string = '|'.join(components)
        return hashlib.md5(address_string.encode()).hexdigest()

    df['address_id'] = df.apply(create_address_id, axis=1)

    # Remove duplicates
    df = df.drop_duplicates(subset=['address_id'], keep='first')

    return df
```

### Timestamp Conversion
```python
from datetime import datetime
import pytz

def normalize_timestamps(df, timestamp_columns):
    """Convert all timestamps to UTC"""
    eastern = pytz.timezone('US/Eastern')

    for col in timestamp_columns:
        if col in df.columns:
            df[col] = pd.to_datetime(df[col])

            # Localize to Eastern if naive
            df[col] = df[col].apply(lambda dt:
                eastern.localize(dt) if dt.tzinfo is None else dt
            )

            # Convert to UTC
            df[col] = df[col].dt.tz_convert('UTC')

            # Remove timezone for MySQL
            df[col] = df[col].dt.tz_localize(None)

    return df
```

---

## Validation Procedures

### Automated Validation Script
```python
#!/usr/bin/env python3
"""
validate_migration.py
Comprehensive validation of migrated data
"""

def validate_row_counts():
    """Compare row counts between Sheets and MySQL"""
    sheets_counts = get_sheets_row_counts()
    mysql_counts = get_mysql_row_counts()

    discrepancies = []
    for table_name in sheets_counts.keys():
        if sheets_counts[table_name] != mysql_counts.get(table_name, 0):
            discrepancies.append({
                'table': table_name,
                'sheets': sheets_counts[table_name],
                'mysql': mysql_counts.get(table_name, 0),
                'diff': sheets_counts[table_name] - mysql_counts.get(table_name, 0)
            })

    return discrepancies

def validate_foreign_keys():
    """Validate all foreign key relationships"""
    validation_queries = [
        "SELECT COUNT(*) FROM orders o LEFT JOIN customers c ON o.customer_id = c.customer_id WHERE c.customer_id IS NULL",
        "SELECT COUNT(*) FROM orders o LEFT JOIN addresses a ON o.shipping_address_id = a.address_id WHERE o.shipping_address_id IS NOT NULL AND a.address_id IS NULL",
        # ... more queries
    ]

    failures = []
    for query in validation_queries:
        result = execute_query(query)
        if result[0][0] > 0:
            failures.append({'query': query, 'orphans': result[0][0]})

    return failures

def validate_data_quality():
    """Check data quality issues"""
    issues = []

    # Negative amounts
    result = execute_query("SELECT COUNT(*) FROM orders WHERE total_amount < 0")
    if result[0][0] > 0:
        issues.append({'issue': 'negative_amounts', 'count': result[0][0]})

    # Invalid emails
    result = execute_query("SELECT COUNT(*) FROM customers WHERE email NOT LIKE '%@%.%'")
    if result[0][0] > 0:
        issues.append({'issue': 'invalid_emails', 'count': result[0][0]})

    return issues

def main():
    print("Running migration validation...")

    # Row counts
    discrepancies = validate_row_counts()
    if discrepancies:
        print("❌ Row count discrepancies found:")
        for d in discrepancies:
            print(f"  {d['table']}: Sheets={d['sheets']}, MySQL={d['mysql']}, Diff={d['diff']}")
    else:
        print("✅ Row counts match")

    # Foreign keys
    fk_failures = validate_foreign_keys()
    if fk_failures:
        print("❌ Foreign key validation failures:")
        for f in fk_failures:
            print(f"  {f['query']}: {f['orphans']} orphaned records")
    else:
        print("✅ Foreign keys valid")

    # Data quality
    quality_issues = validate_data_quality()
    if quality_issues:
        print("❌ Data quality issues:")
        for issue in quality_issues:
            print(f"  {issue['issue']}: {issue['count']} records")
    else:
        print("✅ Data quality good")

if __name__ == '__main__':
    main()
```

---

## Rollback Strategy

### Scenario 1: Migration Failure During Phase 2
```bash
# Drop all tables and restart
mysql -u root -p careportals_db -e "DROP DATABASE careportals_db;"
mysql -u root -p -e "CREATE DATABASE careportals_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Re-execute DDL
mysql -u root -p careportals_db < CAREPORTALS_MYSQL_DDL.sql

# Re-run migration
python3 migrate_data.py
```

### Scenario 2: Issues During Dual-Write Period
```javascript
// Revert to Sheets-only writes
function recordPayment(chargeData) {
  // Write to Google Sheets only
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('payment_succesful');
  sheet.appendRow([...]);

  // Do NOT write to MySQL
  // writeToMySQL('payments', chargeData);  // DISABLED
}
```

### Scenario 3: Post-Cutover Issues
```bash
# Emergency rollback: Restore from MySQL backup
mysql -u root -p careportals_db < careportals_backup_YYYYMMDD.sql

# Re-enable Google Sheets writes
# Update webhook handlers (see Scenario 2)
```

---

## Post-Migration Tasks

### 1. Performance Tuning
```sql
-- Analyze tables for query optimization
ANALYZE TABLE customers, orders, payments, subscriptions_active;

-- Check slow query log
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 2;

-- Review and optimize
cat /var/log/mysql/mysql-slow.log
```

### 2. Backup Configuration
```bash
# Automated daily backups
crontab -e

# Add:
0 2 * * * /usr/bin/mysqldump --single-transaction --routines --triggers --events --databases careportals_db | gzip > /backups/careportals_$(date +\%Y\%m\%d).sql.gz

# Retention: Keep 30 days
0 3 * * * find /backups -name "careportals_*.sql.gz" -mtime +30 -delete
```

### 3. Monitoring Setup
```sql
-- Create monitoring views
CREATE VIEW v_daily_metrics AS
SELECT
    DATE(created_at) as date,
    COUNT(*) as order_count,
    SUM(total_amount) / 100.0 as total_revenue
FROM orders
GROUP BY DATE(created_at);

-- Set up alerts (external monitoring tool)
```

### 4. Documentation Updates
- Update system architecture diagrams
- Document new connection strings
- Update runbooks and SOPs
- Train team on MySQL query syntax

---

## Troubleshooting

### Common Issues

#### Issue 1: Character Encoding Errors
```sql
-- Check current encoding
SHOW VARIABLES LIKE 'character_set%';

-- Fix if needed
ALTER DATABASE careportals_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE customers CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### Issue 2: Foreign Key Constraint Violations
```sql
-- Temporarily disable foreign key checks (use with caution)
SET FOREIGN_KEY_CHECKS = 0;

-- Run migration
-- ...

-- Re-enable
SET FOREIGN_KEY_CHECKS = 1;
```

#### Issue 3: Timestamp Timezone Issues
```python
# Ensure all timestamps are in UTC before inserting
df['created_at'] = pd.to_datetime(df['created_at']).dt.tz_localize('UTC').dt.tz_localize(None)
```

#### Issue 4: Connection Pool Exhaustion
```python
# Use connection pooling
from mysql.connector import pooling

db_pool = pooling.MySQLConnectionPool(
    pool_name="careportals_pool",
    pool_size=10,
    **MYSQL_CONFIG
)

connection = db_pool.get_connection()
```

---

## Success Criteria

✅ **Migration Complete When:**
1. All 16 tables created with correct schemas
2. All ~5,100+ records migrated successfully
3. Zero foreign key constraint violations
4. Row count parity: Sheets = MySQL
5. Webhooks writing to MySQL in real-time
6. KPI Dashboard connected to MySQL
7. 7-day stability period with no data loss
8. Performance meets or exceeds Sheets (faster queries)
9. Backup and monitoring in place
10. Team trained on new system

---

## Timeline

| Phase | Duration | Status |
|-------|----------|--------|
| Phase 1: Schema Creation | 1 day | ⏳ Pending |
| Phase 2: Data Migration | 2 days | ⏳ Pending |
| Phase 3: Validation | 1 day | ⏳ Pending |
| Phase 4: Webhook Migration | 3 days | ⏳ Pending |
| Phase 4.5: Dual-Write Period | 7 days | ⏳ Pending |
| Phase 5: Cutover | 1 day | ⏳ Pending |
| **Total** | **15 days** | **In Progress** |

---

## Support

For issues during migration:
- **Technical Lead:** [Your Name]
- **Database Admin:** [DBA Name]
- **Emergency Contact:** [On-call Number]

---

**Document Version:** 1.0
**Last Updated:** 2025-10-22
**Next Review:** Post-migration (Day 21)

---

**End of Migration Guide**
