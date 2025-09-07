#!/usr/bin/env python3
"""
Examine the actual structure of submissions data to understand BMI columns
"""
import pandas as pd

try:
    # Load the embeddables data
    print("📋 Loading Embeddables.xlsx...")
    embeddables_file = "/home/cmwldaniel/Reporting/GoogleSheets/Embeddables.xlsx"
    
    # Read all sheets first to see what's available
    excel_file = pd.ExcelFile(embeddables_file)
    print(f"Available sheets: {excel_file.sheet_names}")
    
    # Load submissions data
    if 'submissions' in excel_file.sheet_names:
        submissions_df = pd.read_excel(embeddables_file, sheet_name='submissions')
        print(f"\n📊 Submissions Data Structure:")
        print(f"  Shape: {submissions_df.shape}")
        print(f"  Total columns: {len(submissions_df.columns)}")
        
        # Show all column names
        print(f"\n📋 All Column Names:")
        for i, col in enumerate(submissions_df.columns, 1):
            print(f"  {i:2d}. {col}")
        
        # Look for BMI-related columns specifically
        bmi_related = []
        height_related = []
        weight_related = []
        
        for col in submissions_df.columns:
            col_lower = col.lower()
            if 'bmi' in col_lower:
                bmi_related.append(col)
            if any(term in col_lower for term in ['height', 'tall']):
                height_related.append(col)
            if 'weight' in col_lower:
                weight_related.append(col)
        
        print(f"\n🔍 BMI-Related Columns Found:")
        print(f"  BMI columns: {bmi_related}")
        print(f"  Height columns: {height_related}")  
        print(f"  Weight columns: {weight_related}")
        
        # If we found BMI columns, examine their values
        if bmi_related:
            for col in bmi_related:
                print(f"\n📏 Examining BMI column: '{col}'")
                bmi_series = submissions_df[col]
                print(f"  Data type: {bmi_series.dtype}")
                print(f"  Non-null values: {bmi_series.notna().sum()}/{len(bmi_series)}")
                
                # Show sample values
                non_null_values = bmi_series.dropna()
                if len(non_null_values) > 0:
                    print(f"  Sample values: {list(non_null_values.head(10))}")
                    print(f"  Min: {non_null_values.min()}")
                    print(f"  Max: {non_null_values.max()}")
                    print(f"  Mean: {non_null_values.mean():.2f}")
                    
                    # Try to convert to numeric and see what happens
                    try:
                        numeric_values = pd.to_numeric(bmi_series, errors='coerce')
                        numeric_clean = numeric_values.dropna()
                        if len(numeric_clean) > 0:
                            print(f"  After numeric conversion - Min: {numeric_clean.min():.2f}, Max: {numeric_clean.max():.2f}, Mean: {numeric_clean.mean():.2f}")
                    except Exception as e:
                        print(f"  Error converting to numeric: {e}")
        
        # If we found height/weight columns, examine them too
        if height_related:
            for col in height_related:
                print(f"\n📐 Examining Height column: '{col}'")
                height_series = submissions_df[col]
                print(f"  Data type: {height_series.dtype}")
                non_null_values = height_series.dropna()
                if len(non_null_values) > 0:
                    print(f"  Sample values: {list(non_null_values.head(10))}")
                    try:
                        numeric_values = pd.to_numeric(height_series, errors='coerce').dropna()
                        if len(numeric_values) > 0:
                            print(f"  Numeric range: {numeric_values.min():.2f} - {numeric_values.max():.2f}")
                    except:
                        pass
        
        if weight_related:
            for col in weight_related:
                print(f"\n⚖️ Examining Weight column: '{col}'")
                weight_series = submissions_df[col]
                print(f"  Data type: {weight_series.dtype}")
                non_null_values = weight_series.dropna()
                if len(non_null_values) > 0:
                    print(f"  Sample values: {list(non_null_values.head(10))}")
                    try:
                        numeric_values = pd.to_numeric(weight_series, errors='coerce').dropna()
                        if len(numeric_values) > 0:
                            print(f"  Numeric range: {numeric_values.min():.2f} - {numeric_values.max():.2f}")
                    except:
                        pass
    
    # Also check if there are other sheets with form submissions
    if 'imported_form_submissions' in excel_file.sheet_names:
        print(f"\n📋 Also checking 'imported_form_submissions' sheet...")
        imported_df = pd.read_excel(embeddables_file, sheet_name='imported_form_submissions')
        print(f"  Shape: {imported_df.shape}")
        
        # Look for BMI columns in imported data too
        bmi_cols_imported = [col for col in imported_df.columns if 'bmi' in col.lower()]
        print(f"  BMI columns in imported data: {bmi_cols_imported}")

except Exception as e:
    print(f"❌ Error loading data: {e}")
    import traceback
    traceback.print_exc()