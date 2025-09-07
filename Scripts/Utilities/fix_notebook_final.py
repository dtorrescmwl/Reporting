#!/usr/bin/env python3
"""
Final fix for the persistent syntax error in the Jupyter notebook.
"""

import json
import re

def fix_notebook_completely(notebook_path):
    """Completely fix the notebook by removing and recreating the problematic cell"""
    
    # Read the existing notebook
    with open(notebook_path, 'r', encoding='utf-8') as f:
        notebook = json.load(f)
    
    # The completely correct code
    correct_code = [
        "import glob",
        "import os", 
        "from datetime import datetime",
        "import pandas as pd",
        "",
        "def get_latest_embeddables_csv_files():",
        "    \"\"\"",
        "    Automatically find the most recent CSV files for each funnel type",
        "    from the embeddables extraction system.",
        "    \"\"\"",
        "    embeddables_data_path = \"/home/cmwldaniel/Reporting/Embeddables/Data/\"",
        "    ",
        "    # Define funnel types we're looking for",
        "    funnel_types = ['medication_v1', 'tirzepatide_v1', 'semaglutide_v1']",
        "    csv_types = ['all', 'complete', 'partial']",
        "    ",
        "    latest_files = {}",
        "    ",
        "    for funnel in funnel_types:",
        "        funnel_files = {}",
        "        for csv_type in csv_types:",
        "            # Find all files matching the pattern: {funnel}_{timestamp}_{type}.csv",
        "            pattern = f\"{embeddables_data_path}{funnel}_*_{csv_type}.csv\"",
        "            matching_files = glob.glob(pattern)",
        "            ",
        "            if matching_files:",
        "                # Sort by modification time, get the most recent",
        "                latest_file = max(matching_files, key=os.path.getmtime)",
        "                funnel_files[csv_type] = latest_file",
        "                ",
        "        if funnel_files:",
        "            latest_files[funnel] = funnel_files",
        "            ",
        "    return latest_files",
        "",
        "def load_embeddables_csv_data():",
        "    \"\"\"Load the most recent embeddables CSV data\"\"\"",
        "    latest_files = get_latest_embeddables_csv_files()",
        "    embeddables_csv_data = {}",
        "    ",
        "    print(\"📊 Loading Latest Embeddables CSV Data:\")",
        "    print(\"=\" * 45)",
        "    ",
        "    for funnel, files in latest_files.items():",
        "        funnel_data = {}",
        "        ",
        "        for csv_type, file_path in files.items():",
        "            try:",
        "                # Extract timestamp from filename for display",
        "                filename = os.path.basename(file_path)",
        "                timestamp = filename.split('_')[2]  # Extract YYYYMMDD_HHMMSS",
        "                ",
        "                # Load the CSV",
        "                df = pd.read_csv(file_path)",
        "                funnel_data[csv_type] = df",
        "                ",
        "                print(f\"  ✅ {funnel} ({csv_type}): {len(df):,} entries [{timestamp}]\")",
        "                ",
        "            except Exception as e:",
        "                print(f\"  ❌ Error loading {file_path}: {e}\")",
        "                ",
        "        if funnel_data:",
        "            embeddables_csv_data[funnel] = funnel_data",
        "    ",
        "    return embeddables_csv_data",
        "",
        "# Load the latest CSV data",
        "embeddables_csv_data = load_embeddables_csv_data()"
    ]
    
    # Find and replace the problematic cell
    fixed = False
    for i, cell in enumerate(notebook['cells']):
        if cell.get('cell_type') == 'code' and cell.get('source'):
            source = ''.join(cell['source'])
            if 'import globimport os' in source or 'get_latest_embeddables_csv_files' in source:
                # Completely replace the cell
                cell['source'] = correct_code
                cell['execution_count'] = None
                cell['outputs'] = []
                print(f"✅ Completely replaced problematic cell at index {i}")
                fixed = True
                break
    
    if not fixed:
        print("⚠️ Problematic cell not found, adding new cell")
        # Create a new cell and insert it
        new_cell = {
            "cell_type": "code",
            "execution_count": None,
            "metadata": {},
            "outputs": [],
            "source": correct_code
        }
        # Insert after the data loading section
        insert_index = 7
        if len(notebook['cells']) > insert_index:
            notebook['cells'][insert_index] = new_cell
        else:
            notebook['cells'].append(new_cell)
        print(f"✅ Added new corrected cell at index {insert_index}")
    
    # Write the corrected notebook
    with open(notebook_path, 'w', encoding='utf-8') as f:
        json.dump(notebook, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Notebook completely fixed: {notebook_path}")

if __name__ == "__main__":
    notebook_path = "/home/cmwldaniel/Reporting/Healthcare_Reporting_Dashboard.ipynb"
    fix_notebook_completely(notebook_path)