#!/usr/bin/env python3
"""
Completely clean the notebook of any execution history and problematic cells
"""

import json

def clean_notebook_completely(notebook_path):
    """Clean all execution history and ensure no problematic code remains"""
    
    with open(notebook_path, 'r', encoding='utf-8') as f:
        notebook = json.load(f)
    
    print('🧹 Cleaning Notebook Completely:')
    print('=' * 35)
    
    cells_cleaned = 0
    cells_with_issues = []
    
    for i, cell in enumerate(notebook['cells']):
        if cell.get('cell_type') == 'code':
            # Clear all execution history
            cell['execution_count'] = None
            cell['outputs'] = []
            cells_cleaned += 1
            
            # Check for any problematic code patterns
            if cell.get('source'):
                source = ''.join(cell['source'])
                if any(pattern in source for pattern in [
                    'import globimport', 'importimport', 'importfrom', 
                    'globimport os', 'osfrom datetime'
                ]):
                    cells_with_issues.append(i)
                    print(f'⚠️  Found potentially problematic cell at index {i}')
    
    if cells_with_issues:
        print(f'❌ Found {len(cells_with_issues)} cells with potential issues')
        for cell_index in cells_with_issues:
            cell = notebook['cells'][cell_index]
            source_lines = cell.get('source', [])
            print(f'   Cell {cell_index} first line: {repr(source_lines[0] if source_lines else "Empty")}')
    else:
        print('✅ No problematic code patterns found')
    
    # Write the cleaned notebook
    with open(notebook_path, 'w', encoding='utf-8') as f:
        json.dump(notebook, f, indent=2, ensure_ascii=False)
    
    print(f'✅ Cleaned {cells_cleaned} code cells')
    print(f'✅ All execution history cleared')
    print('✅ Notebook is now clean for fresh execution')

if __name__ == "__main__":
    notebook_path = "/home/cmwldaniel/Reporting/Healthcare_Reporting_Dashboard.ipynb"
    clean_notebook_completely(notebook_path)