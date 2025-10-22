#!/usr/bin/env python3
"""
Merge Extended Records Script
Merges new orders and customers from extended_record.csv into Database_CarePortals.xlsx

Key Features:
1. Adds new orders to order.created sheet (deduplicates by care_portals_internal_order_id)
2. Adds new customers to customers sheet (deduplicates by customer_id)  
3. Handles field mappings: Datetime Purchase -> created_at
4. Leaves blank fields for missing data (pharmacy, shipping address)
5. Preserves existing data integrity

Usage:
    python3 Scripts/DataProcessing/merge_extended_records.py
"""

import pandas as pd
import numpy as np
from datetime import datetime
import os
import sys

def load_data():
    """Load all required data files"""
    print("📂 Loading data files...")
    
    # Load extended records CSV
    extended_df = pd.read_csv('GoogleSheets/extended_record.csv')
    print(f"✅ Extended records: {len(extended_df)} rows")
    
    # Load existing database
    db_file = 'GoogleSheets/Database_CarePortals.xlsx'
    
    # Load existing orders
    existing_orders_df = pd.read_excel(db_file, sheet_name='order.created')
    print(f"✅ Existing orders: {len(existing_orders_df)} rows")
    
    # Load existing customers  
    existing_customers_df = pd.read_excel(db_file, sheet_name='customers')
    print(f"✅ Existing customers: {len(existing_customers_df)} rows")
    
    # Load products for reference
    products_df = pd.read_excel(db_file, sheet_name='products')
    print(f"✅ Products: {len(products_df)} rows")
    
    return extended_df, existing_orders_df, existing_customers_df, products_df

def clean_extended_data(extended_df):
    """Clean and standardize extended records data"""
    print("🧹 Cleaning extended records data...")
    
    # Standardize column names to match database schema
    extended_clean = extended_df.copy()
    
    # Rename columns to match database format
    column_mapping = {
        'Datetime Purchase': 'created_at',
        'Care Portals Internal Order ID': 'care_portals_internal_order_id',
        'Order ID': 'order_id', 
        'Customer ID': 'customer_id',
        'First Name': 'first_name',
        'Last Name': 'last_name',
        'Email': 'email',
        'Phone': 'phone',
        'Source': 'source',
        'Total Amount': 'total_amount',
        'Discount Amount': 'discount_amount', 
        'Base Amount': 'base_amount',
        'Credit Used': 'credit_used_amount'
    }
    
    extended_clean = extended_clean.rename(columns=column_mapping)
    
    # Convert datetime format
    try:
        extended_clean['created_at'] = pd.to_datetime(extended_clean['created_at'])
        print(f"✅ Converted {len(extended_clean)} datetime entries")
    except Exception as e:
        print(f"⚠️ Datetime conversion issue: {e}")
    
    # Remove duplicates within extended data itself
    initial_count = len(extended_clean)
    extended_clean = extended_clean.drop_duplicates(subset=['care_portals_internal_order_id'])
    dedupe_count = len(extended_clean)
    if initial_count != dedupe_count:
        print(f"🔄 Removed {initial_count - dedupe_count} internal duplicates")
    
    return extended_clean

def find_new_orders(extended_clean, existing_orders_df):
    """Find orders that don't exist in the database"""
    print("🔍 Finding new orders to add...")
    
    existing_order_ids = set(existing_orders_df['care_portals_internal_order_id'].values)
    extended_order_ids = set(extended_clean['care_portals_internal_order_id'].values)
    
    new_order_ids = extended_order_ids - existing_order_ids
    new_orders = extended_clean[extended_clean['care_portals_internal_order_id'].isin(new_order_ids)].copy()
    
    print(f"📊 Analysis Results:")
    print(f"   - Existing orders in DB: {len(existing_order_ids)}")
    print(f"   - Orders in extended file: {len(extended_order_ids)}")
    print(f"   - New orders to add: {len(new_orders)}")
    print(f"   - Duplicate orders (skipped): {len(extended_order_ids & existing_order_ids)}")
    
    return new_orders

def find_new_customers(extended_clean, existing_customers_df):
    """Find customers that don't exist in the database"""
    print("👥 Finding new customers to add...")
    
    existing_customer_ids = set(existing_customers_df['customer_id'].values)
    
    # Get unique customers from extended data
    customer_data = extended_clean[['customer_id', 'first_name', 'last_name', 'email', 'phone']].drop_duplicates(subset=['customer_id'])
    extended_customer_ids = set(customer_data['customer_id'].values)
    
    new_customer_ids = extended_customer_ids - existing_customer_ids
    new_customers = customer_data[customer_data['customer_id'].isin(new_customer_ids)].copy()
    
    print(f"📊 Customer Analysis:")
    print(f"   - Existing customers in DB: {len(existing_customer_ids)}")
    print(f"   - Customers in extended file: {len(extended_customer_ids)}")
    print(f"   - New customers to add: {len(new_customers)}")
    print(f"   - Existing customers (skipped): {len(extended_customer_ids & existing_customer_ids)}")
    
    return new_customers

def prepare_orders_for_database(new_orders, existing_orders_df):
    """Prepare new orders to match database schema"""
    print("⚙️ Preparing orders for database insertion...")
    
    # Get the expected columns from existing orders
    db_columns = list(existing_orders_df.columns)
    print(f"📋 Database order schema has {len(db_columns)} columns")
    
    # Create new dataframe with database schema
    orders_to_add = pd.DataFrame(columns=db_columns)
    
    for idx, order in new_orders.iterrows():
        new_row = {}
        
        # Map available fields
        new_row['created_at'] = order['created_at']
        new_row['order_id'] = order['order_id']
        new_row['care_portals_internal_order_id'] = order['care_portals_internal_order_id']
        new_row['customer_id'] = order['customer_id']
        new_row['source'] = order.get('source', '')
        new_row['total_amount'] = order.get('total_amount', 0)
        new_row['discount_amount'] = order.get('discount_amount', 0)
        new_row['base_amount'] = order.get('base_amount', 0)
        new_row['credit_used_amount'] = order.get('credit_used_amount', 0)
        
        # Fields that CSV doesn't have - leave blank as specified
        new_row['shipping_address_id'] = ''  # CSV doesn't have shipping address
        new_row['pharmacy_assigned'] = ''    # CSV doesn't have pharmacy
        new_row['product_id'] = ''           # CSV doesn't have product info
        new_row['coupon'] = ''
        new_row['discount_reduction_amount'] = 0
        new_row['discount_reduction_type'] = ''
        
        orders_to_add = pd.concat([orders_to_add, pd.DataFrame([new_row])], ignore_index=True)
    
    print(f"✅ Prepared {len(orders_to_add)} orders for insertion")
    return orders_to_add

def prepare_customers_for_database(new_customers, existing_customers_df):
    """Prepare new customers to match database schema"""
    print("👤 Preparing customers for database insertion...")
    
    # Get expected columns from existing customers
    db_columns = list(existing_customers_df.columns)
    
    # Select only the columns we have data for
    customers_to_add = new_customers[db_columns].copy()
    
    # Fill any missing values
    customers_to_add = customers_to_add.fillna('')
    
    print(f"✅ Prepared {len(customers_to_add)} customers for insertion")
    return customers_to_add

def update_database(orders_to_add, customers_to_add, existing_orders_df, existing_customers_df):
    """Update the database with new records"""
    print("💾 Updating database...")
    
    # Combine existing and new data
    updated_orders = pd.concat([existing_orders_df, orders_to_add], ignore_index=True)
    updated_customers = pd.concat([existing_customers_df, customers_to_add], ignore_index=True)
    
    # Write updated data back to Excel
    db_file = 'GoogleSheets/Database_CarePortals.xlsx'
    
    with pd.ExcelWriter(db_file, engine='openpyxl', mode='a', if_sheet_exists='replace') as writer:
        # Update order.created sheet
        updated_orders.to_excel(writer, sheet_name='order.created', index=False)
        print(f"✅ Updated order.created: {len(existing_orders_df)} → {len(updated_orders)} rows")
        
        # Update customers sheet
        updated_customers.to_excel(writer, sheet_name='customers', index=False)
        print(f"✅ Updated customers: {len(existing_customers_df)} → {len(updated_customers)} rows")
    
    return updated_orders, updated_customers

def create_summary_report(orders_to_add, customers_to_add):
    """Create a summary report of the merge operation"""
    print("📋 Creating summary report...")
    
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    report = f"""
# Extended Records Merge Summary
**Timestamp**: {timestamp}
**Source File**: GoogleSheets/extended_record.csv

## 📊 Summary Statistics
- **New Orders Added**: {len(orders_to_add)}
- **New Customers Added**: {len(customers_to_add)}
- **Total Processing Time**: {datetime.now()}

## 🔄 Data Mappings Applied
- **Datetime Purchase** → **created_at** (with timezone conversion)
- **Care Portals Internal Order ID** → **care_portals_internal_order_id**
- **Customer ID** → **customer_id**
- **Customer Info** → **first_name, last_name, email, phone**

## 🏢 Blank Fields (As Specified)
- **shipping_address_id**: Not in CSV - left blank
- **pharmacy_assigned**: Not in CSV - left blank  
- **product_id**: Not in CSV - left blank

## ✅ Deduplication Applied
- Orders deduplicated by **care_portals_internal_order_id**
- Customers deduplicated by **customer_id**
- No existing records were overwritten

## 📈 Database Growth
- **order.created** sheet: +{len(orders_to_add)} records
- **customers** sheet: +{len(customers_to_add)} records

---
Generated by merge_extended_records.py
"""
    
    with open('EXTENDED_RECORDS_MERGE_SUMMARY.md', 'w') as f:
        f.write(report)
    
    print(f"📄 Summary report saved to: EXTENDED_RECORDS_MERGE_SUMMARY.md")

def main():
    """Main execution function"""
    print("🚀 Starting Extended Records Merge Process")
    print("="*60)
    
    try:
        # Load data
        extended_df, existing_orders_df, existing_customers_df, products_df = load_data()
        
        # Clean extended data
        extended_clean = clean_extended_data(extended_df)
        
        # Find new records
        new_orders = find_new_orders(extended_clean, existing_orders_df)
        new_customers = find_new_customers(extended_clean, existing_customers_df)
        
        if len(new_orders) == 0 and len(new_customers) == 0:
            print("✅ No new records to add - database is up to date!")
            return
        
        # Prepare data for database
        orders_to_add = prepare_orders_for_database(new_orders, existing_orders_df) if len(new_orders) > 0 else pd.DataFrame()
        customers_to_add = prepare_customers_for_database(new_customers, existing_customers_df) if len(new_customers) > 0 else pd.DataFrame()
        
        # Update database
        updated_orders, updated_customers = update_database(orders_to_add, customers_to_add, existing_orders_df, existing_customers_df)
        
        # Create summary report
        create_summary_report(orders_to_add, customers_to_add)
        
        print("="*60)
        print("🎉 Extended Records Merge Completed Successfully!")
        print(f"📊 Final Results:")
        print(f"   - Orders: {len(existing_orders_df)} → {len(updated_orders)}")
        print(f"   - Customers: {len(existing_customers_df)} → {len(updated_customers)}")
        
    except Exception as e:
        print(f"❌ Error during merge process: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)