#!/usr/bin/env python3
"""
PROPERLY fix the notebook by directly editing the JSON and ensuring line breaks
"""

import json

def fix_notebook_json_directly():
    """Fix by directly manipulating the JSON structure"""
    
    notebook_path = "/home/cmwldaniel/Reporting/Healthcare_Reporting_Dashboard.ipynb"
    
    # Read notebook
    with open(notebook_path, 'r', encoding='utf-8') as f:
        notebook = json.load(f)
    
    print("🔧 Direct JSON Fix:")
    print("=" * 20)
    
    # Find problematic cell by searching for the concatenated import
    for i, cell in enumerate(notebook['cells']):
        if cell.get('cell_type') == 'code' and cell.get('source'):
            source = ''.join(cell['source']) if isinstance(cell['source'], list) else str(cell['source'])
            
            if 'import globimport' in source or 'globimport' in source:
                print(f"Found problematic cell at index {i}")
                
                # Create properly formatted source lines
                correct_lines = [
                    "import glob\n",
                    "import os\n", 
                    "from datetime import datetime\n",
                    "import pandas as pd\n",
                    "\n",
                    "def get_latest_embeddables_csv_files():\n",
                    "    \"\"\"\n",
                    "    Automatically find the most recent CSV files for each funnel type\n",
                    "    from the embeddables extraction system.\n",
                    "    \"\"\"\n",
                    "    embeddables_data_path = \"/home/cmwldaniel/Reporting/Embeddables/Data/\"\n",
                    "    \n",
                    "    # Define funnel types we're looking for\n",
                    "    funnel_types = ['medication_v1', 'tirzepatide_v1', 'semaglutide_v1']\n",
                    "    csv_types = ['all', 'complete', 'partial']\n",
                    "    \n",
                    "    latest_files = {}\n",
                    "    \n",
                    "    for funnel in funnel_types:\n",
                    "        funnel_files = {}\n",
                    "        for csv_type in csv_types:\n",
                    "            # Find all files matching the pattern: {funnel}_{timestamp}_{type}.csv\n",
                    "            pattern = f\"{embeddables_data_path}{funnel}_*_{csv_type}.csv\"\n",
                    "            matching_files = glob.glob(pattern)\n",
                    "            \n",
                    "            if matching_files:\n",
                    "                # Sort by modification time, get the most recent\n",
                    "                latest_file = max(matching_files, key=os.path.getmtime)\n",
                    "                funnel_files[csv_type] = latest_file\n",
                    "                \n",
                    "        if funnel_files:\n",
                    "            latest_files[funnel] = funnel_files\n",
                    "            \n",
                    "    return latest_files\n",
                    "\n",
                    "def load_embeddables_csv_data():\n",
                    "    \"\"\"Load the most recent embeddables CSV data\"\"\"\n",
                    "    latest_files = get_latest_embeddables_csv_files()\n",
                    "    embeddables_csv_data = {}\n",
                    "    \n",
                    "    print(\"📊 Loading Latest Embeddables CSV Data:\")\n",
                    "    print(\"=\" * 45)\n",
                    "    \n",
                    "    for funnel, files in latest_files.items():\n",
                    "        funnel_data = {}\n",
                    "        \n",
                    "        for csv_type, file_path in files.items():\n",
                    "            try:\n",
                    "                # Extract timestamp from filename for display\n",
                    "                filename = os.path.basename(file_path)\n",
                    "                timestamp = filename.split('_')[2]  # Extract YYYYMMDD_HHMMSS\n",
                    "                \n",
                    "                # Load the CSV\n",
                    "                df = pd.read_csv(file_path)\n",
                    "                funnel_data[csv_type] = df\n",
                    "                \n",
                    "                print(f\"  ✅ {funnel} ({csv_type}): {len(df):,} entries [{timestamp}]\")\n",
                    "                \n",
                    "            except Exception as e:\n",
                    "                print(f\"  ❌ Error loading {file_path}: {e}\")\n",
                    "                \n",
                    "        if funnel_data:\n",
                    "            embeddables_csv_data[funnel] = funnel_data\n",
                    "    \n",
                    "    return embeddables_csv_data\n",
                    "\n",
                    "# Load the latest CSV data\n",
                    "embeddables_csv_data = load_embeddables_csv_data()"
                ]
                
                # Replace the cell source
                cell['source'] = correct_lines
                cell['execution_count'] = None
                cell['outputs'] = []
                
                print(f"✅ Replaced cell {i} with properly formatted code")
                break
    
    # Write back to file
    with open(notebook_path, 'w', encoding='utf-8') as f:
        json.dump(notebook, f, indent=2, ensure_ascii=False)
    
    print("✅ Notebook JSON fixed directly")

if __name__ == "__main__":
    fix_notebook_json_directly()