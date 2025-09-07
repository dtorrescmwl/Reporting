#!/usr/bin/env python3
"""
Script to fix the get_main_dataframes function in the Jupyter notebook
that was also concatenated without proper line breaks.
"""

import json

def fix_main_dataframes_function(notebook_path):
    """Fix the get_main_dataframes function"""
    
    # Read the existing notebook
    with open(notebook_path, 'r', encoding='utf-8') as f:
        notebook = json.load(f)
    
    # Fixed function with proper line breaks
    fixed_function = '''def get_main_dataframes():
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

# Test the main dataframes loading
main_dfs = get_main_dataframes()
if main_dfs:
    print(f"\\n📊 Available dataframes: {list(main_dfs.keys())}")'''
    
    # Find and replace the problematic function
    for i, cell in enumerate(notebook['cells']):
        if cell.get('cell_type') == 'code' and cell.get('source'):
            source_text = ''.join(cell['source'])
            if 'def get_main_dataframes():' in source_text and 'globals() and embeddables_csv_data:' in source_text:
                # Replace with properly formatted function
                cell['source'] = fixed_function.split('\n')
                cell['execution_count'] = None  # Reset execution count
                cell['outputs'] = []  # Clear outputs
                print(f"✅ Fixed get_main_dataframes function at cell index {i}")
                break
    
    # Write the corrected notebook
    with open(notebook_path, 'w', encoding='utf-8') as f:
        json.dump(notebook, f, indent=2, ensure_ascii=False)
    
    print(f"✅ get_main_dataframes function fixed: {notebook_path}")

if __name__ == "__main__":
    notebook_path = "/home/cmwldaniel/Reporting/Healthcare_Reporting_Dashboard.ipynb"
    fix_main_dataframes_function(notebook_path)