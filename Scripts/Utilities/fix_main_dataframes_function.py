#!/usr/bin/env python3
"""
Fix the get_main_dataframes function that's also concatenated without line breaks
"""

import json

def fix_main_dataframes_function():
    notebook_path = "/home/cmwldaniel/Reporting/Healthcare_Reporting_Dashboard.ipynb"
    
    with open(notebook_path, 'r', encoding='utf-8') as f:
        notebook = json.load(f)
    
    print("🔧 Fixing get_main_dataframes Function:")
    print("=" * 45)
    
    # Correct function with proper line breaks
    correct_function = [
        "def get_main_dataframes():\n",
        "    \"\"\"Get main dataframes, prioritizing latest CSV data over Excel files\"\"\"\n",
        "    dfs = {}\n",
        "    \n",
        "    # First priority: Use latest CSV data from embeddables extraction\n",
        "    if 'embeddables_csv_data' in globals() and embeddables_csv_data:\n",
        "        print(\"🔄 Using Latest CSV Data from Embeddables Extraction:\")\n",
        "        \n",
        "        # Combine all funnel data into a single submissions dataframe\n",
        "        all_submissions = []\n",
        "        \n",
        "        for funnel_name, funnel_data in embeddables_csv_data.items():\n",
        "            if 'all' in funnel_data:\n",
        "                df = funnel_data['all'].copy()\n",
        "                # Add funnel source column if not present\n",
        "                if 'form_source' not in df.columns:\n",
        "                    df['form_source'] = funnel_name.replace('_', ' ').title()\n",
        "                all_submissions.append(df)\n",
        "        \n",
        "        if all_submissions:\n",
        "            combined_df = pd.concat(all_submissions, ignore_index=True)\n",
        "            dfs['submissions'] = combined_df\n",
        "            print(f\"  ✅ Combined submissions: {len(combined_df):,} total entries\")\n",
        "            \n",
        "            # Show breakdown by funnel\n",
        "            if 'form_source' in combined_df.columns:\n",
        "                funnel_counts = combined_df['form_source'].value_counts()\n",
        "                for funnel, count in funnel_counts.items():\n",
        "                    print(f\"    • {funnel}: {count:,} entries\")\n",
        "        \n",
        "        # Also provide access to individual funnel data\n",
        "        for funnel_name, funnel_data in embeddables_csv_data.items():\n",
        "            for data_type, df in funnel_data.items():\n",
        "                key = f\"{funnel_name}_{data_type}\"\n",
        "                dfs[key] = df\n",
        "    \n",
        "    # Fallback: Try to get submissions data from embeddables Excel file\n",
        "    elif embeddables_data and 'submissions' in embeddables_data:\n",
        "        dfs['submissions'] = embeddables_data['submissions']\n",
        "        print(\"⚠️  Using Excel fallback data - CSV data not available\")\n",
        "    \n",
        "    # Try to get page tracking data (Excel fallback)\n",
        "    if embeddables_data:\n",
        "        page_sheets = [sheet for sheet in embeddables_data.keys() if 'page' in sheet.lower() or 'tracker' in sheet.lower()]\n",
        "        if page_sheets:\n",
        "            dfs['page_tracking'] = embeddables_data[page_sheets[0]]\n",
        "            print(f\"✅ Found page tracking data: {page_sheets[0]}\")\n",
        "    \n",
        "    # Try to get checkout sessions\n",
        "    if embeddables_data and 'checkout.sessions' in embeddables_data:\n",
        "        dfs['checkout_sessions'] = embeddables_data['checkout.sessions']\n",
        "        print(\"✅ Found checkout sessions data\")\n",
        "    \n",
        "    # Try to get orders data\n",
        "    if careportals_data:\n",
        "        order_sheets = [sheet for sheet in careportals_data.keys() if 'order' in sheet.lower()]\n",
        "        if order_sheets:\n",
        "            dfs['orders'] = careportals_data[order_sheets[0]]\n",
        "            print(f\"✅ Found orders data: {order_sheets[0]}\")\n",
        "    \n",
        "    return dfs\n",
        "\n",
        "# Test the main dataframes loading\n",
        "main_dfs = get_main_dataframes()\n",
        "if main_dfs:\n",
        "    print(f\"\\n📊 Available dataframes: {list(main_dfs.keys())}\")"
    ]
    
    # Find and fix the problematic cell
    for i, cell in enumerate(notebook['cells']):
        if cell.get('cell_type') == 'code' and cell.get('source'):
            source = ''.join(cell['source']) if isinstance(cell['source'], list) else str(cell['source'])
            
            if 'def get_main_dataframes():' in source and ('dfs = {}        #' in source or 'dataframes():    """Get main' in source):
                print(f"Found problematic get_main_dataframes cell at index {i}")
                
                # Replace with properly formatted function
                cell['source'] = correct_function
                cell['execution_count'] = None
                cell['outputs'] = []
                
                print(f"✅ Fixed get_main_dataframes function at cell {i}")
                break
    
    # Write the corrected notebook
    with open(notebook_path, 'w', encoding='utf-8') as f:
        json.dump(notebook, f, indent=2, ensure_ascii=False)
    
    print("✅ get_main_dataframes function fixed!")

if __name__ == "__main__":
    fix_main_dataframes_function()