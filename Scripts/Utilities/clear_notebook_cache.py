#!/usr/bin/env python3
"""
Clear all execution cache from the notebook to force fresh execution
"""

import json

def clear_all_execution_history():
    notebook_path = "/home/cmwldaniel/Reporting/Healthcare_Reporting_Dashboard.ipynb"
    
    with open(notebook_path, 'r', encoding='utf-8') as f:
        notebook = json.load(f)
    
    print("🧹 Clearing All Execution History:")
    print("=" * 40)
    
    cleared_count = 0
    for i, cell in enumerate(notebook['cells']):
        if cell.get('cell_type') == 'code':
            # Clear execution count and outputs
            if cell.get('execution_count') is not None:
                cell['execution_count'] = None
                cleared_count += 1
            
            if cell.get('outputs'):
                cell['outputs'] = []
    
    # Also clear any notebook-level execution info
    if 'execution_count' in notebook:
        del notebook['execution_count']
    
    # Write cleaned notebook
    with open(notebook_path, 'w', encoding='utf-8') as f:
        json.dump(notebook, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Cleared execution history from {cleared_count} cells")
    print("✅ Notebook is now completely clean")
    print()
    print("🔄 Next steps:")
    print("1. Restart your Jupyter kernel (Kernel → Restart)")
    print("2. Clear browser cache (Ctrl+F5)")
    print("3. Run cells fresh from the top")

if __name__ == "__main__":
    clear_all_execution_history()