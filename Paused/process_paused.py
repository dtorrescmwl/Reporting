#!/usr/bin/env python3
"""
Process paused.xlsx:
1. Recreate Sheet1 on Sheet6 with CustomerID -> 'First Name + Last Name' and ProductID -> Short_name
2. Add entries from Sheet5 that aren't already in Sheet6
"""

import pandas as pd
import openpyxl
from openpyxl import load_workbook

# File path
file_path = '/home/cmwldaniel/Reporting/Paused/paused.xlsx'

# Read all necessary sheets
print("Reading Excel file...")
sheet1 = pd.read_excel(file_path, sheet_name='Sheet1')
sheet2 = pd.read_excel(file_path, sheet_name='Sheet2')
sheet3 = pd.read_excel(file_path, sheet_name='Sheet3')
sheet5 = pd.read_excel(file_path, sheet_name='Sheet5')

print(f"Sheet1 shape: {sheet1.shape}")
print(f"Sheet2 shape: {sheet2.shape}")
print(f"Sheet3 shape: {sheet3.shape}")
print(f"Sheet5 shape: {sheet5.shape}")

# Create lookup dictionaries
# CustomerID -> First Name + Last Name
customer_lookup = {}
for _, row in sheet2.iterrows():
    customer_id = row['customer_id']
    first_name = str(row['first_name']).strip() if pd.notna(row['first_name']) else ''
    last_name = str(row['last_name']).strip() if pd.notna(row['last_name']) else ''
    full_name = f"{first_name} {last_name}".strip()
    customer_lookup[customer_id] = full_name

print(f"Created customer lookup with {len(customer_lookup)} entries")

# ProductID -> Short_name
product_lookup = {}
for _, row in sheet3.iterrows():
    product_id = row['product_id']
    short_name = str(row['Short_name']).strip() if pd.notna(row['Short_name']) else ''
    product_lookup[product_id] = short_name

print(f"Created product lookup with {len(product_lookup)} entries")

# Create Sheet6 by replacing IDs with names from Sheet1
print("\nCreating Sheet6 from Sheet1...")
sheet6 = sheet1.copy()

# Replace CustomerID with First Name + Last Name
sheet6['CustomerID'] = sheet6['CustomerID'].apply(
    lambda x: customer_lookup.get(x, x) if pd.notna(x) else x
)

# Replace ProductID with Short_name
sheet6['ProductID'] = sheet6['ProductID'].apply(
    lambda x: product_lookup.get(x, x) if pd.notna(x) else x
)

# Rename columns for clarity
sheet6 = sheet6.rename(columns={
    'CustomerID': 'Customer Name',
    'ProductID': 'Product Name'
})

print(f"Sheet6 created with {len(sheet6)} entries")
print("\nFirst few rows of Sheet6:")
print(sheet6.head())

# Process Sheet5 to extract names and check if they exist in Sheet6
print("\n\nProcessing Sheet5...")
print(f"Sheet5 columns: {sheet5.columns.tolist()}")

# The second column (index 1) contains the names in Sheet5
# Column name appears to be the first data row, so let's check
sheet5_names = []

# Check if first column name is actually a name (Bridget Deptula)
first_col_name = sheet5.columns[1]
if first_col_name and first_col_name != 'Unnamed: 1':
    sheet5_names.append(first_col_name)
    print(f"Found name in column header: {first_col_name}")

# Get all names from column B (index 1)
for _, row in sheet5.iterrows():
    name = row.iloc[1] if len(row) > 1 else None
    if pd.notna(name) and str(name).strip() and str(name).strip() != 'nan':
        sheet5_names.append(str(name).strip())

print(f"\nFound {len(sheet5_names)} names in Sheet5:")
for name in sorted(set(sheet5_names))[:10]:
    print(f"  - {name}")

# Get existing names in Sheet6
existing_names = set(sheet6['Customer Name'].dropna().unique())
print(f"\nExisting names in Sheet6: {len(existing_names)}")

# Find names from Sheet5 that are NOT in Sheet6
missing_names = []
for name in set(sheet5_names):
    if name not in existing_names:
        missing_names.append(name)

print(f"\nNames from Sheet5 NOT in Sheet6: {len(missing_names)}")
for name in sorted(missing_names):
    print(f"  - {name}")

# For missing names, we need to create entries with the same format as Sheet6
# Since we don't have their ProductID, Cycle, etc., we'll need to look at Sheet5 structure more carefully
if missing_names:
    print("\n\nAdding missing entries to Sheet6...")

    # Get Sheet5 structure - it seems to have: Name, Product, Price, Status, Datetime Created, Last Updated, Cycle
    # Let's map the columns
    sheet5_data_rows = []

    # First, let's understand Sheet5 better
    print("\nSheet5 structure analysis:")
    print(f"Columns: {sheet5.columns.tolist()}")
    print("\nFirst row:")
    print(sheet5.iloc[0] if len(sheet5) > 0 else "Empty")

    # Based on the column structure, it seems:
    # Column 1 (Bridget Deptula) = Name
    # Column 2 (Tirzepatide CMWL 90-Day Starter Plan) = Product
    # Column 3 = Price
    # Column 4 = Status (paused)
    # Column 5 = Datetime Created
    # Column 6 = Last Updated
    # Column 7 = Cycle

    # The first row in the column names is actually data
    if first_col_name and first_col_name in missing_names:
        # Extract data from column headers
        cols = sheet5.columns.tolist()
        new_entry = {
            'Customer Name': cols[1] if len(cols) > 1 else '',
            'Product Name': cols[2] if len(cols) > 2 else '',
            'Cycle': cols[7] if len(cols) > 7 else None,
            'Status': cols[4] if len(cols) > 4 else 'paused',
            'Datetime Created': cols[5] if len(cols) > 5 else '',
            'Last Updated': cols[6] if len(cols) > 6 else ''
        }
        sheet6 = pd.concat([sheet6, pd.DataFrame([new_entry])], ignore_index=True)
        print(f"Added: {new_entry['Customer Name']}")

    # Now add the rest from the data rows
    for _, row in sheet5.iterrows():
        name = row.iloc[1] if len(row) > 1 else None
        if pd.notna(name) and str(name).strip() in missing_names:
            new_entry = {
                'Customer Name': str(name).strip(),
                'Product Name': row.iloc[2] if len(row) > 2 else '',
                'Cycle': row.iloc[7] if len(row) > 7 else None,
                'Status': row.iloc[4] if len(row) > 4 else 'paused',
                'Datetime Created': row.iloc[5] if len(row) > 5 else '',
                'Last Updated': row.iloc[6] if len(row) > 6 else ''
            }
            sheet6 = pd.concat([sheet6, pd.DataFrame([new_entry])], ignore_index=True)
            print(f"Added: {new_entry['Customer Name']}")

print(f"\n\nFinal Sheet6 has {len(sheet6)} entries")

# Write back to Excel
print("\n\nWriting to Excel...")
with pd.ExcelWriter(file_path, engine='openpyxl', mode='a', if_sheet_exists='replace') as writer:
    sheet6.to_excel(writer, sheet_name='Sheet6', index=False)

print("✅ Successfully created Sheet6!")
print(f"\nSummary:")
print(f"  - Original Sheet1 entries: {len(sheet1)}")
print(f"  - Additional entries from Sheet5: {len(missing_names)}")
print(f"  - Total Sheet6 entries: {len(sheet6)}")
