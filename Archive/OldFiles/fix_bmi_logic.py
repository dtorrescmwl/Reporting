#!/usr/bin/env python3
"""
Fix the BMI logic to properly identify the BMI column and handle the data correctly
"""
import json

# Read the notebook
with open('/home/cmwldaniel/Reporting/Healthcare_Reporting_Dashboard.ipynb', 'r') as f:
    notebook = json.load(f)

# Find the cell with the analyze_medical_qualifications function
target_cell_index = None
for i, cell in enumerate(notebook['cells']):
    if cell.get('cell_type') == 'code' and 'source' in cell:
        source_content = ''.join(cell['source'])
        if 'def analyze_medical_qualifications(dfs):' in source_content:
            target_cell_index = i
            break

if target_cell_index is not None:
    print(f"Found target cell at index {target_cell_index}")
    
    # Replace the function with the corrected version
    new_function = '''# Medical Qualification Analysis
def analyze_medical_qualifications(dfs):
    print("🏥 Medical Qualification Analysis")
    print("=" * 35)
    
    if 'submissions' not in dfs:
        print("❌ Missing submissions data for medical analysis")
        return None
        
    df = dfs['submissions']
    print(f"📊 Analyzing {len(df):,} form submissions")
    
    results = {}
    
    # BMI Analysis - Corrected to find the actual BMI column
    print(f"\\n🔍 Looking for BMI column...")
    
    # Find the exact BMI column (not partial matches like 'Submission' containing 'bmi')
    bmi_col = None
    for col in df.columns:
        if col.strip().lower() == 'bmi':
            bmi_col = col
            break
    
    if bmi_col:
        print(f"  ✅ Found BMI column: '{bmi_col}'")
        bmi_data = pd.to_numeric(df[bmi_col], errors='coerce')
        bmi_clean = bmi_data.dropna()
        
        if len(bmi_clean) > 0:
            print(f"\\n📏 BMI Analysis ({len(bmi_clean):,} records):")
            print(f"  Average BMI: {bmi_clean.mean():.1f}")
            print(f"  Median BMI: {bmi_clean.median():.1f}")
            print(f"  BMI Range: {bmi_clean.min():.1f} - {bmi_clean.max():.1f}")
            
            # BMI Categories
            bmi_categories = pd.cut(bmi_clean, 
                                  bins=[0, 18.5, 25, 30, 35, 40, 100],
                                  labels=['Underweight', 'Normal', 'Overweight', 'Obese I', 'Obese II', 'Obese III'])
            
            bmi_dist = bmi_categories.value_counts()
            print("\\n  📊 BMI Distribution:")
            for category, count in bmi_dist.items():
                pct = (count / len(bmi_clean)) * 100
                print(f"    {category}: {count:,} ({pct:.1f}%)")
                
            results['bmi_analysis'] = {
                'mean': bmi_clean.mean(),
                'median': bmi_clean.median(),
                'distribution': bmi_dist,
                'total_records': len(bmi_clean)
            }
    else:
        print("  ❌ No exact 'BMI' column found")
        
        # Fallback: try to calculate BMI from Height and Weight
        height_col = None
        weight_col = None
        
        # Find Height column
        for col in df.columns:
            if col.strip().lower() == 'height':
                height_col = col
                break
        
        # Find Weight column (prefer "Weight at Submission")
        for col in df.columns:
            if 'weight at submission' in col.lower():
                weight_col = col
                break
        
        if height_col and weight_col:
            print(f"  🔄 Calculating BMI from '{height_col}' and '{weight_col}'")
            
            # Process height data (format like "5'4''")
            height_series = df[height_col]
            height_inches = []
            
            for h in height_series:
                if pd.notna(h) and isinstance(h, str):
                    try:
                        # Parse format like "5'4''"
                        parts = h.replace("''", "").split("'")
                        if len(parts) == 2:
                            feet = int(parts[0])
                            inches = int(parts[1]) if parts[1] else 0
                            total_inches = feet * 12 + inches
                            height_inches.append(total_inches)
                        else:
                            height_inches.append(None)
                    except:
                        height_inches.append(None)
                else:
                    height_inches.append(None)
            
            # Convert to pandas series
            height_inches_series = pd.Series(height_inches)
            weight_lbs = pd.to_numeric(df[weight_col], errors='coerce')
            
            # Calculate BMI: (weight in lbs) / (height in inches)^2 * 703
            calculated_bmi = (weight_lbs / (height_inches_series ** 2)) * 703
            calculated_bmi_clean = calculated_bmi.dropna()
            
            if len(calculated_bmi_clean) > 0:
                print(f"\\n📏 Calculated BMI Analysis ({len(calculated_bmi_clean):,} records):")
                print(f"  Average BMI: {calculated_bmi_clean.mean():.1f}")
                print(f"  Median BMI: {calculated_bmi_clean.median():.1f}")
                print(f"  BMI Range: {calculated_bmi_clean.min():.1f} - {calculated_bmi_clean.max():.1f}")
                
                results['bmi_analysis'] = {
                    'mean': calculated_bmi_clean.mean(),
                    'median': calculated_bmi_clean.median(),
                    'total_records': len(calculated_bmi_clean),
                    'source': 'calculated'
                }
        else:
            print("  ❌ Cannot calculate BMI: missing height or weight columns")
    
    # Age Analysis
    age_col = None
    for col in df.columns:
        if 'age at submission' in col.lower():
            age_col = col
            break
    
    if age_col:
        age_data = pd.to_numeric(df[age_col], errors='coerce')
        age_clean = age_data.dropna()
        
        if len(age_clean) > 0:
            print(f"\\n📅 Age Analysis ({len(age_clean):,} records):")
            print(f"  Average Age: {age_clean.mean():.1f} years")
            print(f"  Median Age: {age_clean.median():.1f} years")
            print(f"  Age Range: {age_clean.min():.0f} - {age_clean.max():.0f} years")
            
            # Age groups
            age_groups = pd.cut(age_clean, 
                              bins=[0, 18, 25, 35, 45, 55, 65, 100],
                              labels=['<18', '18-24', '25-34', '35-44', '45-54', '55-64', '65+'])
            
            age_dist = age_groups.value_counts()
            print("\\n  📊 Age Distribution:")
            for group, count in age_dist.items():
                pct = (count / len(age_clean)) * 100
                print(f"    {group}: {count:,} ({pct:.1f}%)")
                
            results['age_analysis'] = {
                'mean': age_clean.mean(),
                'median': age_clean.median(),
                'distribution': age_dist
            }
    
    # Gender Analysis
    gender_col = None
    for col in df.columns:
        if 'sex assigned at birth' in col.lower():
            gender_col = col
            break
    
    if gender_col:
        print(f"\\n⚧ Gender Analysis:")
        gender_dist = df[gender_col].value_counts()
        
        for gender, count in gender_dist.items():
            pct = (count / len(df)) * 100
            print(f"  {gender}: {count:,} ({pct:.1f}%)")
        
        results['gender_analysis'] = gender_dist
    
    return results

# Call the analysis
medical_results = analyze_medical_qualifications(main_dfs)
'''
    
    # Split the new function into lines for notebook format
    new_source = new_function.split('\\n')
    
    # Update the cell
    notebook['cells'][target_cell_index]['source'] = [line + '\\n' for line in new_source]
    
    # Write the updated notebook back
    with open('/home/cmwldaniel/Reporting/Healthcare_Reporting_Dashboard.ipynb', 'w') as f:
        json.dump(notebook, f, indent=1)
    
    print("✅ Successfully updated the BMI calculation function")
    print("Key fixes:")
    print("  - Uses exact column name matching (BMI column is 'BMI')")
    print("  - Handles height format '5\\'4\\'\\'\\' correctly") 
    print("  - Uses proper BMI calculation: (weight_lbs / height_inches²) × 703")
    print("  - Matches actual column names from the data structure")

else:
    print("❌ Could not find the analyze_medical_qualifications function")