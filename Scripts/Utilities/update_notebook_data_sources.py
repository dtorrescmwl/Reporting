#!/usr/bin/env python3
"""
Script to update the Jupyter notebook with dynamic CSV file loading
for the most recent embeddables extraction data.
"""

import json
import glob
import os
from datetime import datetime

def create_dynamic_csv_loader_code():
    """Create the code to dynamically load the most recent CSV files"""
    return '''
import glob
import os
from datetime import datetime
import pandas as pd

def get_latest_embeddables_csv_files():
    """
    Automatically find the most recent CSV files for each funnel type
    from the embeddables extraction system.
    """
    embeddables_data_path = "/home/cmwldaniel/Reporting/Embeddables/Data/"
    
    # Define funnel types we're looking for
    funnel_types = ['medication_v1', 'tirzepatide_v1', 'semaglutide_v1']
    csv_types = ['all', 'complete', 'partial']
    
    latest_files = {}
    
    for funnel in funnel_types:
        funnel_files = {}
        for csv_type in csv_types:
            # Find all files matching the pattern: {funnel}_{timestamp}_{type}.csv
            pattern = f"{embeddables_data_path}{funnel}_*_{csv_type}.csv"
            matching_files = glob.glob(pattern)
            
            if matching_files:
                # Sort by modification time, get the most recent
                latest_file = max(matching_files, key=os.path.getmtime)
                funnel_files[csv_type] = latest_file
                
        if funnel_files:
            latest_files[funnel] = funnel_files
            
    return latest_files

def load_embeddables_csv_data():
    """Load the most recent embeddables CSV data"""
    latest_files = get_latest_embeddables_csv_files()
    embeddables_csv_data = {}
    
    print("📊 Loading Latest Embeddables CSV Data:")
    print("=" * 45)
    
    for funnel, files in latest_files.items():
        funnel_data = {}
        
        for csv_type, file_path in files.items():
            try:
                # Extract timestamp from filename for display
                filename = os.path.basename(file_path)
                timestamp = filename.split('_')[2]  # Extract YYYYMMDD_HHMMSS
                
                # Load the CSV
                df = pd.read_csv(file_path)
                funnel_data[csv_type] = df
                
                print(f"  ✅ {funnel} ({csv_type}): {len(df):,} entries [{timestamp}]")
                
            except Exception as e:
                print(f"  ❌ Error loading {file_path}: {e}")
                
        if funnel_data:
            embeddables_csv_data[funnel] = funnel_data
    
    return embeddables_csv_data

# Load the latest CSV data
embeddables_csv_data = load_embeddables_csv_data()
'''

def update_notebook_with_dynamic_loading(notebook_path):
    """Update the Jupyter notebook to include dynamic CSV loading"""
    
    # Read the existing notebook
    with open(notebook_path, 'r', encoding='utf-8') as f:
        notebook = json.load(f)
    
    # Create the new cell with dynamic CSV loading
    new_cell_code = create_dynamic_csv_loader_code()
    
    new_cell = {
        "cell_type": "code",
        "execution_count": None,
        "metadata": {},
        "outputs": [],
        "source": new_cell_code.split('\n')
    }
    
    # Find the best place to insert this cell (after the enhanced data loading section)
    insert_index = -1
    for i, cell in enumerate(notebook['cells']):
        if cell.get('cell_type') == 'code' and cell.get('source'):
            source_text = ''.join(cell['source'])
            if 'enhanced_data_files' in source_text and 'ADDITIONAL_DATA_PATH' in source_text:
                insert_index = i + 1
                break
    
    if insert_index > 0:
        # Insert the new cell right after the enhanced data loading
        notebook['cells'].insert(insert_index, new_cell)
        print(f"✅ Added dynamic CSV loading cell at position {insert_index}")
    else:
        # Append to the end if we can't find the right spot
        notebook['cells'].append(new_cell)
        print("✅ Added dynamic CSV loading cell at the end")
    
    # Update the main data loading function to use the new CSV data
    update_main_dataframes_function(notebook)
    
    # Write the updated notebook
    with open(notebook_path, 'w', encoding='utf-8') as f:
        json.dump(notebook, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Successfully updated {notebook_path}")

def update_main_dataframes_function(notebook):
    """Update the get_main_dataframes function to prioritize CSV data"""
    
    updated_function_code = '''
def get_main_dataframes():
    """Get main dataframes, prioritizing latest CSV data over Excel files"""
    dfs = {}
    
    # First priority: Use latest CSV data from embeddables extraction
    if 'embeddables_csv_data' in globals() and embeddables_csv_data:
        print("🔄 Using Latest CSV Data from Embeddables Extraction:")
        
        # Combine all funnel data into a single submissions dataframe
        all_submissions = []
        
        for funnel_name, funnel_data in embeddables_csv_data.items():
            if 'all' in funnel_data:
                df = funnel_data['all'].copy()
                # Add funnel source column if not present
                if 'form_source' not in df.columns:
                    df['form_source'] = funnel_name.replace('_', ' ').title()
                all_submissions.append(df)
        
        if all_submissions:
            combined_df = pd.concat(all_submissions, ignore_index=True)
            dfs['submissions'] = combined_df
            print(f"  ✅ Combined submissions: {len(combined_df):,} total entries")
            
            # Show breakdown by funnel
            if 'form_source' in combined_df.columns:
                funnel_counts = combined_df['form_source'].value_counts()
                for funnel, count in funnel_counts.items():
                    print(f"    • {funnel}: {count:,} entries")
        
        # Also provide access to individual funnel data
        for funnel_name, funnel_data in embeddables_csv_data.items():
            for data_type, df in funnel_data.items():
                key = f"{funnel_name}_{data_type}"
                dfs[key] = df
    
    # Fallback: Try to get submissions data from embeddables Excel file
    elif embeddables_data and 'submissions' in embeddables_data:
        dfs['submissions'] = embeddables_data['submissions']
        print("⚠️  Using Excel fallback data - CSV data not available")
    
    # Try to get page tracking data (Excel fallback)
    if embeddables_data:
        page_sheets = [sheet for sheet in embeddables_data.keys() if 'page' in sheet.lower() or 'tracker' in sheet.lower()]
        if page_sheets:
            dfs['page_tracking'] = embeddables_data[page_sheets[0]]
            print(f"✅ Found page tracking data: {page_sheets[0]}")
    
    # Try to get checkout sessions
    if embeddables_data and 'checkout.sessions' in embeddables_data:
        dfs['checkout_sessions'] = embeddables_data['checkout.sessions']
        print("✅ Found checkout sessions data")
    
    # Try to get orders data
    if careportals_data:
        order_sheets = [sheet for sheet in careportals_data.keys() if 'order' in sheet.lower()]
        if order_sheets:
            dfs['orders'] = careportals_data[order_sheets[0]]
            print(f"✅ Found orders data: {order_sheets[0]}")
    
    return dfs
'''
    
    # Find and update the get_main_dataframes function
    for cell in notebook['cells']:
        if cell.get('cell_type') == 'code' and cell.get('source'):
            source_text = ''.join(cell['source'])
            if 'def get_main_dataframes():' in source_text:
                cell['source'] = updated_function_code.split('\n')
                print("✅ Updated get_main_dataframes function")
                break

if __name__ == "__main__":
    notebook_path = "/home/cmwldaniel/Reporting/Healthcare_Reporting_Dashboard.ipynb"
    
    print("🔄 Updating Jupyter notebook with dynamic CSV data loading...")
    update_notebook_with_dynamic_loading(notebook_path)
    print("✅ Notebook update completed!")