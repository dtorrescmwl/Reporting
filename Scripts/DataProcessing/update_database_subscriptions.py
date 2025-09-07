#!/usr/bin/env python3
"""
FINAL CORRECTED Script to update Database_CarePortals.xlsx
- Mantiene estructura original (SubscriptionID, CustomerID, etc.)
- Preserva Last Updated de registros existentes  
- Preserva Customer IDs agregados manualmente
- Hace merge inteligente sin sobrescribir datos existentes
"""

import pandas as pd
import numpy as np
import os
from datetime import datetime
import pytz

def clean_test_entries(df):
    """Remove test entries from the subscriptions dataframe"""
    
    print("🧹 Limpiando Entradas de Prueba:")
    print("=" * 35)
    
    initial_count = len(df)
    
    # Define test patterns (exact matches from user's corrected list)
    exact_test_names = [
        'Newmx Bty', 'Mxbounty Tracking', 'Idrive Test', 'Maxbounty Test', 
        'Buoy Test', 'Richard Lee', 'Everflow Idrive', 'Test 150', 
        'Trigger Test', 'Bounty Test', 'Updated Script', 'Idrive Cpatest',
        'Idrive Redirecttest', 'Trackint Idrive', 'Daniel Test', 
        'Test Maxb3', 'Test Maxb', 'Newest Test', 'Lisanov19 Connellynov19',
        'Tamyra Mills', 'Testing Ghl'
    ]
    
    # Define specific users to remove
    specific_users = ['daniel gomez', 'daniel torres', 'lisa connelly', 'richard lee']
    
    # Create mask for entries to keep
    mask = pd.Series(True, index=df.index)
    
    # Remove exact test name matches
    for test_name in exact_test_names:
        test_mask = df['Name'].str.contains(test_name, case=False, na=False)
        removed_count = test_mask.sum()
        if removed_count > 0:
            print(f"  ❌ Removiendo {removed_count} entradas '{test_name}'")
        mask = mask & ~test_mask
    
    # Remove specific users  
    for user in specific_users:
        user_mask = df['Name'].str.contains(user, case=False, na=False)
        removed_count = user_mask.sum()
        if removed_count > 0:
            print(f"  ❌ Removiendo {removed_count} entradas para '{user}'")
        mask = mask & ~user_mask
    
    # Apply filter
    cleaned_df = df[mask].copy()
    
    removed_total = initial_count - len(cleaned_df)
    print(f"\n📊 Resumen:")
    print(f"  Entradas iniciales: {initial_count}")
    print(f"  Entradas removidas: {removed_total}")
    print(f"  Entradas limpias: {len(cleaned_df)}")
    
    return cleaned_df

def lookup_ids(df, customer_dict, product_dict):
    """Lookup customer and product IDs"""
    
    print("\n🔍 Buscando IDs de Customer y Product:")
    print("=" * 40)
    
    result_df = df.copy()
    result_df['Customer ID'] = None
    result_df['Product ID'] = None
    
    customer_found = 0
    product_found = 0
    
    for idx, row in df.iterrows():
        # Customer ID lookup
        subscription_name = str(row['Name']).strip()
        
        # Try exact match first
        exact_match = customer_dict[customer_dict['Customer Name'].str.strip() == subscription_name]
        if not exact_match.empty:
            result_df.at[idx, 'Customer ID'] = exact_match.iloc[0]['Customer ID']
            customer_found += 1
        else:
            # Try case-insensitive match
            case_match = customer_dict[customer_dict['Customer Name'].str.lower().str.strip() == subscription_name.lower()]
            if not case_match.empty:
                result_df.at[idx, 'Customer ID'] = case_match.iloc[0]['Customer ID']
                customer_found += 1
        
        # Product ID lookup
        product_name = str(row['Product Name']).strip()
        
        # Try exact match
        exact_match = product_dict[product_dict['label'].str.strip() == product_name]
        if not exact_match.empty:
            result_df.at[idx, 'Product ID'] = exact_match.iloc[0]['product_id']
            product_found += 1
        else:
            # Try partial match
            partial_matches = product_dict[product_dict['label'].str.contains(product_name, case=False, na=False)]
            if not partial_matches.empty:
                result_df.at[idx, 'Product ID'] = partial_matches.iloc[0]['product_id']
                product_found += 1
    
    total_count = len(df)
    print(f"  ✅ Customer IDs encontrados: {customer_found}/{total_count} ({customer_found/total_count*100:.1f}%)")
    print(f"  ✅ Product IDs encontrados: {product_found}/{total_count} ({product_found/total_count*100:.1f}%)")
    
    return result_df

def convert_ct_to_et(ct_datetime_str):
    """Convert Central Time to Eastern Time with proper DST handling"""
    
    if pd.isna(ct_datetime_str) or ct_datetime_str == '':
        return None
        
    try:
        dt_str = str(ct_datetime_str).strip()
        
        # Try common formats
        formats = [
            '%b %d, %Y, %I:%M:%S %p',  # Jun 12, 2025, 6:37:11 PM
            '%B %d, %Y, %I:%M:%S %p',  # June 12, 2025, 6:37:11 PM  
            '%m/%d/%Y %H:%M:%S',       # 06/12/2025 18:37:11
            '%Y-%m-%d %H:%M:%S',       # 2025-06-12 18:37:11
        ]
        
        parsed_dt = None
        for fmt in formats:
            try:
                parsed_dt = datetime.strptime(dt_str, fmt)
                break
            except ValueError:
                continue
        
        if parsed_dt is None:
            # Try pandas parsing as fallback
            parsed_dt = pd.to_datetime(dt_str, errors='coerce')
            if pd.isna(parsed_dt):
                return None
            parsed_dt = parsed_dt.to_pydatetime()
        
        # Set timezone to Central Time
        ct_tz = pytz.timezone('US/Central')
        et_tz = pytz.timezone('US/Eastern')
        
        # Localize to Central Time (handles DST automatically)
        ct_aware = ct_tz.localize(parsed_dt)
        
        # Convert to Eastern Time (handles DST automatically)
        et_aware = ct_aware.astimezone(et_tz)
        
        # Return as naive datetime (remove timezone info for database storage)
        return et_aware.replace(tzinfo=None)
        
    except Exception as e:
        print(f"  ⚠️  Error convirtiendo datetime '{ct_datetime_str}': {e}")
        return None

def load_existing_data(database_path):
    """Load existing subscription data to preserve manual changes"""
    
    print("\n📂 Cargando Datos Existentes:")
    print("=" * 32)
    
    existing_data = {}
    
    try:
        db = pd.ExcelFile(database_path)
        subscription_sheets = ['subscription.active', 'subscription.paused', 'subscription.cancelled']
        
        for sheet_name in subscription_sheets:
            if sheet_name in db.sheet_names:
                df = pd.read_excel(database_path, sheet_name=sheet_name)
                existing_data[sheet_name] = df
                print(f"  ✅ {sheet_name}: {len(df)} registros existentes")
            else:
                existing_data[sheet_name] = pd.DataFrame()
                print(f"  ⚪ {sheet_name}: No existe, será creado")
                
    except Exception as e:
        print(f"  ⚠️  Error cargando datos existentes: {e}")
        for sheet_name in ['subscription.active', 'subscription.paused', 'subscription.cancelled']:
            existing_data[sheet_name] = pd.DataFrame()
    
    return existing_data

def format_for_database(df, existing_data):
    """Format data with original structure and preserve existing data"""
    
    print("\n🔧 Formateando con Estructura Original:")
    print("=" * 42)
    
    # Convertir a estructura original
    new_entries = pd.DataFrame()
    
    new_entries['SubscriptionID'] = df['Subscription ID']
    new_entries['CustomerID'] = df['Customer ID']
    new_entries['ProductID'] = df['Product ID']
    new_entries['Cycle'] = df['Current Cycle']
    new_entries['Status'] = df['Status'].str.lower()
    
    # Convertir tiempos CT a ET
    print("  🕐 Convirtiendo Central Time a Eastern Time...")
    new_entries['Datetime Created'] = df['Created'].apply(convert_ct_to_et)
    
    # NO agregar Last Updated para nuevas entradas (como solicitado)
    new_entries['Last Updated'] = None
    
    print(f"  📊 Nuevas entradas formateadas: {len(new_entries)}")
    
    # Merge inteligente por status
    merged_data = {}
    
    for status in ['active', 'paused', 'cancelled']:
        sheet_name = f'subscription.{status}'
        
        # Filtrar nuevas entradas por status
        status_new = new_entries[new_entries['Status'] == status].copy()
        
        # Obtener datos existentes
        existing_df = existing_data.get(sheet_name, pd.DataFrame())
        
        if len(existing_df) == 0:
            # No hay datos existentes, usar solo nuevos
            merged_data[sheet_name] = status_new
            print(f"  ✅ {sheet_name}: {len(status_new)} nuevas entradas")
        else:
            print(f"  🔄 {sheet_name}: Merge inteligente...")
            
            # Hacer merge inteligente preservando datos existentes
            merged_df = merge_preserve_existing(existing_df, status_new)
            merged_data[sheet_name] = merged_df
            
            existing_count = len(existing_df)
            new_count = len(status_new)
            final_count = len(merged_df)
            
            print(f"    • Existentes: {existing_count}")
            print(f"    • Nuevas: {new_count}")  
            print(f"    • Final: {final_count}")
    
    return merged_data

def merge_preserve_existing(existing_df, new_df):
    """Merge preserving existing data - don't overwrite manual changes"""
    
    if len(existing_df) == 0:
        return new_df
    
    if len(new_df) == 0:
        return existing_df
    
    # Crear copia de datos existentes
    merged_df = existing_df.copy()
    
    # Para cada nueva entrada
    for idx, new_row in new_df.iterrows():
        subscription_id = new_row['SubscriptionID']
        
        # Buscar si ya existe
        existing_mask = existing_df['SubscriptionID'] == subscription_id
        
        if existing_mask.any():
            # Ya existe - preservar datos existentes, pero actualizar algunos campos si están vacíos
            existing_idx = existing_df[existing_mask].index[0]
            existing_row = existing_df.loc[existing_idx]
            
            # Solo actualizar campos que están vacíos en datos existentes
            updates_made = []
            
            # CustomerID - preservar si ya tiene valor (cambios manuales)
            if pd.isna(existing_row['CustomerID']) and not pd.isna(new_row['CustomerID']):
                merged_df.at[existing_idx, 'CustomerID'] = new_row['CustomerID']
                updates_made.append('CustomerID')
            
            # ProductID - actualizar si está vacío
            if pd.isna(existing_row['ProductID']) and not pd.isna(new_row['ProductID']):
                merged_df.at[existing_idx, 'ProductID'] = new_row['ProductID']
                updates_made.append('ProductID')
            
            # Cycle - actualizar si está vacío
            if pd.isna(existing_row['Cycle']) and not pd.isna(new_row['Cycle']):
                merged_df.at[existing_idx, 'Cycle'] = new_row['Cycle']
                updates_made.append('Cycle')
            
            # Status - actualizar (puede haber cambiado)
            if existing_row['Status'] != new_row['Status']:
                merged_df.at[existing_idx, 'Status'] = new_row['Status']
                updates_made.append('Status')
            
            if updates_made:
                print(f"    • Actualizado {subscription_id[:12]}...: {', '.join(updates_made)}")
        else:
            # Nueva entrada - agregar al final
            merged_df = pd.concat([merged_df, new_row.to_frame().T], ignore_index=True)
    
    return merged_df

def update_database(merged_data, database_path):
    """Update database with merged data"""
    
    print(f"\n📝 Actualizando Base de Datos:")
    print("=" * 35)
    
    # Usar modo 'a' para preservar otras hojas
    with pd.ExcelWriter(database_path, mode='a', if_sheet_exists='replace', engine='openpyxl') as writer:
        
        total_subscriptions = 0
        
        for sheet_name, df in merged_data.items():
            if len(df) > 0:
                # Asegurar que las columnas estén en el orden correcto
                column_order = ['SubscriptionID', 'CustomerID', 'ProductID', 'Cycle', 'Status', 'Datetime Created', 'Last Updated']
                
                # Reordenar columnas si existen
                existing_cols = [col for col in column_order if col in df.columns]
                df_ordered = df[existing_cols]
                
                df_ordered.to_excel(writer, sheet_name=sheet_name, index=False)
                
                # Estadísticas
                status = sheet_name.replace('subscription.', '').upper()
                total_subscriptions += len(df_ordered)
                
                # Contar datos preservados
                manual_customers = df_ordered['CustomerID'].notna().sum()
                missing_customers = df_ordered['CustomerID'].isna().sum()
                preserved_updates = df_ordered['Last Updated'].notna().sum()
                
                print(f"  ✅ {status}: {len(df_ordered)} suscripciones")
                print(f"    • CustomerID preservados: {manual_customers}")
                print(f"    • Last Updated preservados: {preserved_updates}")
                if missing_customers > 0:
                    print(f"    • CustomerID en blanco: {missing_customers}")
            else:
                # Crear hoja vacía con headers
                empty_df = pd.DataFrame(columns=['SubscriptionID', 'CustomerID', 'ProductID', 'Cycle', 'Status', 'Datetime Created', 'Last Updated'])
                empty_df.to_excel(writer, sheet_name=sheet_name, index=False)
                print(f"  ⚪ {sheet_name}: vacío")
    
    print(f"\n📊 Resumen Final:")
    print(f"  Total suscripciones procesadas: {total_subscriptions}")
    
    return total_subscriptions

def main():
    """Main execution function"""
    
    print("🚀 ACTUALIZACIÓN FINAL - Base de Datos Suscripciones")
    print("=" * 60)
    
    # Change to GoogleSheets directory
    os.chdir('/home/cmwldaniel/Reporting/GoogleSheets')
    
    # Load source data
    print("📂 Cargando datos fuente...")
    all_subs = pd.read_excel('EXTRA_subscriptions.xlsx', sheet_name='all_subscriptions')
    customer_dict = pd.read_excel('EXTRA_subscriptions.xlsx', sheet_name='customer_dictionary')
    product_dict = pd.read_excel('EXTRA_subscriptions.xlsx', sheet_name='product_dictionary')
    
    print(f"  ✅ {len(all_subs)} suscripciones cargadas")
    print(f"  ✅ {len(customer_dict)} customers cargados")  
    print(f"  ✅ {len(product_dict)} productos cargados")
    
    # Step 1: Clean test entries
    clean_subs = clean_test_entries(all_subs)
    
    # Step 2: Lookup IDs
    subs_with_ids = lookup_ids(clean_subs, customer_dict, product_dict)
    
    # Step 3: Load existing data (preserve manual changes)
    existing_data = load_existing_data('LATEST_Database_CarePortals.xlsx')
    
    # Step 4: Format and merge intelligently
    merged_data = format_for_database(subs_with_ids, existing_data)
    
    # Step 5: Copy LATEST as base (to preserve other sheets)
    print(f"\n🔄 Preparando base de datos...")
    import shutil
    shutil.copy('LATEST_Database_CarePortals.xlsx', 'Database_CarePortals.xlsx')
    print("  ✅ Copiado LATEST_Database_CarePortals.xlsx como base")
    
    # Step 6: Update database
    total_processed = update_database(merged_data, 'Database_CarePortals.xlsx')
    
    print(f"\n🎉 ¡ACTUALIZACIÓN COMPLETADA!")
    print(f"   ✅ Estructura original preservada")
    print(f"   ✅ Customer IDs manuales preservados") 
    print(f"   ✅ Last Updated preservado")
    print(f"   ✅ Tiempos convertidos CT → ET")
    print(f"   ✅ {total_processed} suscripciones procesadas")

if __name__ == "__main__":
    main()