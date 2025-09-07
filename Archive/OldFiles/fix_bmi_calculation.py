#!/usr/bin/env python3
"""
Fix the BMI calculation error in the Healthcare Reporting Dashboard notebook.
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
    
    # Replace the function with the improved version
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
    
    # BMI Analysis - Enhanced with proper validation and calculation
    print(f"\\n🔍 Looking for BMI/Height/Weight columns...")
    
    # First, try to find existing BMI column
    bmi_cols = [col for col in df.columns if 'bmi' in col.lower() and 'submission' not in col.lower()]
    height_cols = [col for col in df.columns if any(term in col.lower() for term in ['height', 'tall'])]
    weight_cols = [col for col in df.columns if 'weight' in col.lower()]
    
    print(f"  BMI columns found: {bmi_cols}")
    print(f"  Height columns found: {height_cols}")
    print(f"  Weight columns found: {weight_cols}")
    
    bmi_data = None
    
    # Try to use existing BMI column first
    if bmi_cols:
        bmi_col = bmi_cols[0]
        print(f"  Using existing BMI column: {bmi_col}")
        bmi_data = pd.to_numeric(df[bmi_col], errors='coerce')
        
        # Validate BMI values (normal human range is roughly 10-70)
        valid_bmi = bmi_data[(bmi_data >= 10) & (bmi_data <= 70)]
        if len(valid_bmi) < len(bmi_data.dropna()) * 0.8:  # Less than 80% valid
            print(f"  ⚠️ BMI column contains invalid values (range: {bmi_data.min():.1f} - {bmi_data.max():.1f})")
            bmi_data = None  # Reject this column
    
    # If no valid BMI column, try to calculate from height/weight
    if bmi_data is None and height_cols and weight_cols:
        height_col = height_cols[0]
        weight_col = weight_cols[0]
        print(f"  Calculating BMI from {height_col} and {weight_col}")
        
        height_data = pd.to_numeric(df[height_col], errors='coerce')
        weight_data = pd.to_numeric(df[weight_col], errors='coerce')
        
        # Convert height to meters if it seems to be in cm or inches
        if height_data.median() > 10:  # Likely in cm or inches
            if height_data.median() > 100:  # Likely in cm
                height_data = height_data / 100  # Convert cm to meters
            else:  # Likely in inches
                height_data = height_data * 0.0254  # Convert inches to meters
        
        # Convert weight to kg if it seems to be in lbs
        if weight_data.median() > 200:  # Likely in lbs
            weight_data = weight_data * 0.453592  # Convert lbs to kg
        
        # Calculate BMI: weight(kg) / height(m)^2
        bmi_data = weight_data / (height_data ** 2)
    
    # Analyze BMI if we have valid data
    if bmi_data is not None:
        bmi_clean = bmi_data.dropna()
        # Final validation - remove any remaining outliers
        bmi_clean = bmi_clean[(bmi_clean >= 10) & (bmi_clean <= 70)]
        
        if len(bmi_clean) > 0:
            print(f"\\n📏 BMI Analysis ({len(bmi_clean):,} valid records):")
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
            print("❌ No valid BMI data found")
    else:
        print("❌ No BMI, height, or weight columns found for analysis")
    
    # Age Analysis
    age_cols = [col for col in df.columns if 'age' in col.lower()]
    if age_cols:
        age_col = age_cols[0]
        age_data = pd.to_numeric(df[age_col], errors='coerce')
        age_clean = age_data.dropna()
        
        # Validate age range (reasonable human ages)
        age_clean = age_clean[(age_clean >= 5) & (age_clean <= 120)]
        
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
    gender_cols = [col for col in df.columns if any(term in col.lower() for term in ['sex', 'gender'])]
    if gender_cols:
        gender_col = gender_cols[0]
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
    new_source = new_function.split('\n')
    
    # Update the cell
    notebook['cells'][target_cell_index]['source'] = [line + '\\n' for line in new_source]
    
    # Write the updated notebook back
    with open('/home/cmwldaniel/Reporting/Healthcare_Reporting_Dashboard.ipynb', 'w') as f:
        json.dump(notebook, f, indent=1)
    
    print("✅ Successfully updated the BMI calculation function")
    print("The function now includes:")
    print("  - BMI column validation (excludes columns with 'submission')")
    print("  - Range validation (BMI values between 10-70)")
    print("  - Height/weight-based BMI calculation as fallback")
    print("  - Unit conversion (cm/inches to meters, lbs to kg)")
    print("  - Better error handling and debugging output")

else:
    print("❌ Could not find the analyze_medical_qualifications function")