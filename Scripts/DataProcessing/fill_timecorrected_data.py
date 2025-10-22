#!/usr/bin/env python3
"""
Script to fill missing data in data_timecorrected.csv using Database_CarePortals.xlsx

This script:
1. Reads the data_timecorrected.csv file
2. Extracts data from Database_CarePortals.xlsx sheets
3. Uses order_id as foreign key to merge data
4. Fills in Product, State, Pharmacy, and EMR Profile columns
5. Outputs the completed CSV file
"""

import pandas as pd
import sys
import os

def main():
    print("=== FILLING DATA_TIMECORRECTED.CSV ===")

    # File paths
    base_dir = "/home/cmwldaniel/Reporting"
    csv_file = os.path.join(base_dir, "data_timecorrected.csv")
    excel_file = os.path.join(base_dir, "GoogleSheets", "Database_CarePortals.xlsx")
    output_file = os.path.join(base_dir, "data_timecorrected_filled.csv")

    try:
        # Read the CSV file to be filled
        print(f"Reading CSV file: {csv_file}")
        df_csv = pd.read_csv(csv_file)
        print(f"CSV file has {len(df_csv)} rows")
        print("Columns:", list(df_csv.columns))

        # Read relevant sheets from Excel file
        print(f"\nReading Excel file: {excel_file}")

        # Read order.created sheet for product_id and customer_id mapping
        orders_df = pd.read_excel(excel_file, sheet_name='order.created')
        print(f"Orders sheet: {len(orders_df)} rows")

        # Read customers sheet for customer details
        customers_df = pd.read_excel(excel_file, sheet_name='customers')
        print(f"Customers sheet: {len(customers_df)} rows")

        # Read addresses sheet for state information
        addresses_df = pd.read_excel(excel_file, sheet_name='addresses')
        print(f"Addresses sheet: {len(addresses_df)} rows")

        # Read products sheet for product names
        products_df = pd.read_excel(excel_file, sheet_name='products')
        print(f"Products sheet: {len(products_df)} rows")

        print("\n=== MERGING DATA ===")

        # Start with the CSV data
        result_df = df_csv.copy()

        # Merge with orders to get product_id, customer_id, and shipping_address_id
        print("Merging with orders data...")
        orders_merge = orders_df[['order_id', 'customer_id', 'shipping_address_id', 'product_id', 'pharmacy_assigned']].copy()
        orders_merge = orders_merge.rename(columns={'order_id': 'Order ID'})

        # Convert Order ID to same type for merging
        result_df['Order ID'] = result_df['Order ID'].astype(int)
        orders_merge['Order ID'] = orders_merge['Order ID'].astype(int)

        result_df = result_df.merge(orders_merge, on='Order ID', how='left')
        print(f"After orders merge: {len(result_df)} rows")

        # Merge with products to get product name
        print("Merging with products data...")
        products_merge = products_df[['product_id', 'Short_name']].copy()
        result_df = result_df.merge(products_merge, on='product_id', how='left')

        # Fill Product column with Short_name
        result_df['Product'] = result_df['Short_name'].fillna('')

        # Merge with addresses to get state
        print("Merging with addresses data...")
        addresses_merge = addresses_df[['address_id', 'province_code']].copy()
        addresses_merge = addresses_merge.rename(columns={'address_id': 'shipping_address_id'})
        result_df = result_df.merge(addresses_merge, on='shipping_address_id', how='left')

        # Fill State column with province_code
        result_df['State'] = result_df['province_code'].fillna('')

        # Create EMR Profile URLs using customer_id
        print("Creating EMR Profile URLs...")
        result_df['EMR Profile'] = result_df['customer_id'].apply(
            lambda x: f"https://cmwl.portals.care/{x}" if pd.notna(x) else ""
        )

        # Fill Pharmacy column with pharmacy_assigned
        print("Filling Pharmacy column...")
        result_df['Pharmacy'] = result_df['pharmacy_assigned'].fillna('')

        # Clean up - keep only the original columns
        final_columns = ['Order ID', 'Product', 'Total Amount', 'Name', 'Created At', 'Updated At', 'Status', 'State', 'Pharmacy', 'EMR Profile']
        result_df = result_df[final_columns]

        print("\n=== RESULTS SUMMARY ===")
        print(f"Total rows processed: {len(result_df)}")
        print(f"Product filled: {len(result_df[result_df['Product'] != ''])} / {len(result_df)}")
        print(f"State filled: {len(result_df[result_df['State'] != ''])} / {len(result_df)}")
        print(f"Pharmacy filled: {len(result_df[result_df['Pharmacy'] != ''])} / {len(result_df)}")
        print(f"EMR Profile filled: {len(result_df[result_df['EMR Profile'] != ''])} / {len(result_df)}")

        # Save the result
        print(f"\nSaving result to: {output_file}")
        result_df.to_csv(output_file, index=False)

        # Also overwrite the original file
        print(f"Overwriting original file: {csv_file}")
        result_df.to_csv(csv_file, index=False)

        print("\n=== SAMPLE RESULTS ===")
        print(result_df.head(10).to_string())

        print("\n=== COMPLETION ===")
        print("Data filling completed successfully!")

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()