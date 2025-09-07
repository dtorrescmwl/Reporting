#!/usr/bin/env python3
"""
Script to update Database_CarePortals.xlsx with clean subscription data from EXTRA_subscriptions.xlsx
"""

import pandas as pd
import numpy as np
import os
from datetime import datetime

def clean_test_entries(df):
    """Remove test entries from the subscriptions dataframe"""
    
    print("🧹 Cleaning Test Entries:")
    print("=" * 25)
    
    initial_count = len(df)
    
    # Define test patterns (exact matches from user's list)
    exact_test_names = [
        'Newmx Bty', 'Mxbounty Tracking', 'Idrive Test', 'Maxbounty Test', 
        'Buoy Test', 'Richard Lee', 'Everflow Idrive', 'Test 150', 
        'Trigger Test', 'Bounty Test', 'Updated Script', 'Idrive Cpatest',
        'Idrive Redirecttest', 'Trackint Idrive', 'Daniel Test', 
        'Test Maxb3', 'Test Maxb', 'Newest Test', 'Lisanov19 Connellynov19',
        'Tamyra Mills', 'Testing Ghl'
    ]
    
    # Define specific users to remove
    specific_users = ['daniel gomez', 'daniel torres', 'lisa connelly', 'richard lee']
    
    # Create mask for entries to keep
    mask = pd.Series(True, index=df.index)
    
    # Remove exact test name matches
    for test_name in exact_test_names:
        test_mask = df['Name'].str.contains(test_name, case=False, na=False)
        removed_count = test_mask.sum()
        if removed_count > 0:
            print(f"  ❌ Removing {removed_count} entries matching '{test_name}'")
        mask = mask & ~test_mask
    
    # Remove specific users  
    for user in specific_users:
        user_mask = df['Name'].str.contains(user, case=False, na=False)
        removed_count = user_mask.sum()
        if removed_count > 0:
            print(f"  ❌ Removing {removed_count} entries for '{user}'")
        mask = mask & ~user_mask
    
    # Apply filter
    cleaned_df = df[mask].copy()
    
    removed_total = initial_count - len(cleaned_df)
    print(f"\n📊 Summary:")
    print(f"  Initial entries: {initial_count}")
    print(f"  Removed entries: {removed_total}")
    print(f"  Clean entries: {len(cleaned_df)}")
    
    return cleaned_df

def lookup_customer_ids(df, customer_dict):
    """Lookup customer IDs using name matching"""
    
    print("\n🔍 Looking up Customer IDs:")
    print("=" * 30)
    
    # Create a copy for modifications
    result_df = df.copy()
    result_df['Customer ID'] = None
    
    found_count = 0
    total_count = len(df)
    
    for idx, row in df.iterrows():
        subscription_name = str(row['Name']).strip()
        
        # Try exact match first
        exact_match = customer_dict[customer_dict['Customer Name'].str.strip() == subscription_name]
        if not exact_match.empty:
            result_df.at[idx, 'Customer ID'] = exact_match.iloc[0]['Customer ID']
            found_count += 1
            continue
        
        # Try case-insensitive match
        case_match = customer_dict[customer_dict['Customer Name'].str.lower().str.strip() == subscription_name.lower()]
        if not case_match.empty:
            result_df.at[idx, 'Customer ID'] = case_match.iloc[0]['Customer ID']
            found_count += 1
    
    print(f"  ✅ Found customer IDs: {found_count}/{total_count} ({found_count/total_count*100:.1f}%)")
    print(f"  ❌ Missing customer IDs: {total_count - found_count}")
    
    return result_df

def lookup_product_ids(df, product_dict):
    """Lookup product IDs using product name matching"""
    
    print("\n🔍 Looking up Product IDs:")
    print("=" * 30)
    
    # Create a copy for modifications
    result_df = df.copy()
    result_df['Product ID'] = None
    
    found_count = 0
    total_count = len(df)
    
    for idx, row in df.iterrows():
        product_name = str(row['Product Name']).strip()
        
        # Try exact match
        exact_match = product_dict[product_dict['label'].str.strip() == product_name]
        if not exact_match.empty:
            result_df.at[idx, 'Product ID'] = exact_match.iloc[0]['product_id']
            found_count += 1
            continue
        
        # Try partial match (in case of slight differences)
        partial_matches = product_dict[product_dict['label'].str.contains(product_name, case=False, na=False)]
        if not partial_matches.empty:
            result_df.at[idx, 'Product ID'] = partial_matches.iloc[0]['product_id']
            found_count += 1
    
    print(f"  ✅ Found product IDs: {found_count}/{total_count} ({found_count/total_count*100:.1f}%)")
    print(f"  ❌ Missing product IDs: {total_count - found_count}")
    
    return result_df

def format_for_database(df):
    """Format the data to match the database structure"""
    
    print("\n🔧 Formatting for Database:")
    print("=" * 30)
    
    # Map the columns to match database format
    formatted_df = pd.DataFrame()
    
    formatted_df['subscription_id'] = df['Subscription ID']
    formatted_df['customer_id'] = df['Customer ID'] 
    formatted_df['product_id'] = df['Product ID']
    formatted_df['status'] = df['Status'].str.lower()  # normalize status
    formatted_df['created_at'] = pd.to_datetime(df['Created'], errors='coerce')
    formatted_df['current_cycle'] = df['Current Cycle']
    formatted_df['updated_at'] = datetime.now()
    
    # Remove entries without customer_id or product_id
    initial_count = len(formatted_df)
    formatted_df = formatted_df.dropna(subset=['customer_id', 'product_id'])
    final_count = len(formatted_df)
    
    print(f"  📊 Entries with complete data: {final_count}/{initial_count}")
    
    return formatted_df

def update_database(formatted_df, database_path):
    """Update the database file with new subscription data"""
    
    print(f"\n📝 Updating Database:")
    print("=" * 25)
    
    # Load existing database
    with pd.ExcelWriter(database_path, mode='a', if_sheet_exists='replace', engine='openpyxl') as writer:
        
        # Group by status and write to appropriate sheets
        status_counts = {}
        
        for status in ['active', 'paused', 'cancelled']:
            status_data = formatted_df[formatted_df['status'] == status]
            status_counts[status] = len(status_data)
            
            if len(status_data) > 0:
                # Write to corresponding sheet
                sheet_name = f'subscription.{status}'
                status_data.to_excel(writer, sheet_name=sheet_name, index=False)
                print(f"  ✅ Updated {sheet_name}: {len(status_data)} entries")
            else:
                # Create empty sheet with headers
                sheet_name = f'subscription.{status}'
                empty_df = pd.DataFrame(columns=formatted_df.columns)
                empty_df.to_excel(writer, sheet_name=sheet_name, index=False)
                print(f"  ⚪ {sheet_name}: 0 entries (empty)")
    
    print(f"\n📊 Final Status Breakdown:")
    for status, count in status_counts.items():
        print(f"  • {status}: {count} subscriptions")
    
    return status_counts

def main():
    """Main execution function"""
    
    print("🚀 Database Subscription Update Process")
    print("=" * 45)
    
    # Change to GoogleSheets directory
    os.chdir('/home/cmwldaniel/Reporting/GoogleSheets')
    
    # Load source data
    print("📂 Loading source data...")
    all_subs = pd.read_excel('EXTRA_subscriptions.xlsx', sheet_name='all_subscriptions')
    customer_dict = pd.read_excel('EXTRA_subscriptions.xlsx', sheet_name='customer_dictionary')
    product_dict = pd.read_excel('EXTRA_subscriptions.xlsx', sheet_name='product_dictionary')
    
    print(f"  ✅ Loaded {len(all_subs)} subscriptions")
    print(f"  ✅ Loaded {len(customer_dict)} customers")  
    print(f"  ✅ Loaded {len(product_dict)} products")
    
    # Step 1: Clean test entries
    clean_subs = clean_test_entries(all_subs)
    
    # Step 2: Lookup customer IDs
    subs_with_customers = lookup_customer_ids(clean_subs, customer_dict)
    
    # Step 3: Lookup product IDs  
    subs_with_products = lookup_product_ids(subs_with_customers, product_dict)
    
    # Step 4: Format for database
    formatted_subs = format_for_database(subs_with_products)
    
    # Step 5: Update database (use LATEST as base)
    print(f"\n🔄 Preparing to update database...")
    
    # Copy LATEST_Database_CarePortals.xlsx to Database_CarePortals.xlsx
    import shutil
    shutil.copy('LATEST_Database_CarePortals.xlsx', 'Database_CarePortals.xlsx')
    print("  ✅ Copied LATEST_Database_CarePortals.xlsx as base")
    
    # Update with subscription data
    status_counts = update_database(formatted_subs, 'Database_CarePortals.xlsx')
    
    print(f"\n🎉 Update Complete!")
    print(f"   Database updated: Database_CarePortals.xlsx")
    print(f"   Total subscriptions processed: {sum(status_counts.values())}")

if __name__ == "__main__":
    main()