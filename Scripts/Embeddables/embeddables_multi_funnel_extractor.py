#!/usr/bin/env python3
"""
Multi-Funnel Embeddables Extractor
Fetches all entries (complete and partial) from multiple Embeddables funnels
Uses environment variables for configuration and supports all three funnels
"""

import os
import requests
import json
import csv
import pandas as pd
from datetime import datetime, timezone
import argparse
import sys
from typing import Dict, List, Any, Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class EmbeddablesExtractor:
    def __init__(self, api_key: str = None, project_id: str = None):
        # Use provided parameters or fall back to environment variables
        self.api_key = api_key or os.getenv('EMBEDDABLES_API_KEY')
        self.project_id = project_id or os.getenv('EMBEDDABLES_PROJECT_ID')
        
        if not self.api_key or not self.project_id:
            raise ValueError("API key and project ID must be provided either as parameters or in .env file")
        
        self.base_url = "https://api.embeddables.com"
        self.headers = {
            "X-Api-Key": self.api_key,
            "Content-Type": "application/json"
        }
        
        # Load test entry exclusion list
        self.test_entry_ids = self.load_test_exclusion_list()
        
        # Funnel configurations with correct embeddable IDs
        self.funnels = {
            'medication_v1': {
                'id': os.getenv('MEDICATION_V1_ID', 'flow_2bc58aj3a8g0d9ddd8j7jbd4g'),
                'name': 'Medication V1',
                'form_source': 'medication v1'
            },
            'tirzepatide_v1': {
                'id': os.getenv('TIRZEPATIDE_V1_ID', 'flow_8gd24ah717hhh9h6gjf38h58h'),
                'name': 'Tirzepatide V1',
                'form_source': 'tirzepatide v1'
            },
            'semaglutide_v1': {
                'id': os.getenv('SEMAGLUTIDE_V1_ID', 'flow_cc5fj2bciie5ecf1a2bg398865'),
                'name': 'Semaglutide V1', 
                'form_source': 'semaglutide v1'
            }
        }
        
        # Output directory
        self.output_dir = os.getenv('OUTPUT_DIR', '/home/cmwldaniel/Reporting/Embeddables/Data')
        os.makedirs(self.output_dir, exist_ok=True)
        
        # Page progression for all funnels (shared structure)
        self.page_progression = [
            {
                'index': 0, 'id': 'page_0233062066', 'key': 'current_height_and_weight',
                'required_fields': ['weight_lbs', 'height_feet', 'height_inches']
            },
            {
                'index': 1, 'id': 'page_2884506119', 'key': 'bmi_goal_weight',
                'required_fields': ['goal_weight_lbs', 'bmi']
            },
            {
                'index': 2, 'id': 'page_7914175924', 'key': 'bmi_disqualified',
                'required_fields': []  # Conditional page
            },
            {
                'index': 3, 'id': 'page_4777294352', 'key': 'sex',
                'required_fields': ['sex_assigned_at_birth']
            },
            {
                'index': 4, 'id': 'page_4455465552', 'key': 'female_disqualifiers',
                'required_fields': ['female_dq_questions']  # Only for females
            },
            {
                'index': 5, 'id': 'page_0147857189', 'key': 'specific_effects',
                'required_fields': ['effects_options_multiple']
            },
            # ... continuing with other pages for complete progression tracking
            {
                'index': 31, 'id': 'page_9359573993', 'key': 'checkout_page',
                'required_fields': []  # Final page - completion marker
            }
        ]
    
    def load_test_exclusion_list(self) -> set:
        """Load test entry IDs from exclusion file"""
        exclusion_file = "/home/cmwldaniel/Reporting/test_entries_exclusion.txt"
        test_ids = set()
        
        try:
            if os.path.exists(exclusion_file):
                with open(exclusion_file, 'r') as f:
                    for line in f:
                        line = line.strip()
                        # Skip comments and empty lines
                        if line and not line.startswith('#'):
                            test_ids.add(line)
                print(f"🚫 Loaded {len(test_ids)} test entry IDs for automatic filtering")
            else:
                print("⚠️ Test exclusion file not found - no test filtering will be applied")
        except Exception as e:
            print(f"⚠️ Error loading test exclusion file: {e}")
        
        return test_ids
    
    def fetch_entries_batch(self, params: Dict, embeddable_id: str = None) -> List[Dict]:
        """Fetch a single batch of entries"""
        url = f"{self.base_url}/projects/{self.project_id}/entries"
        
        try:
            print(f"Fetching with params: {params}")
            response = requests.get(url, headers=self.headers, params=params)
            
            if response.status_code == 401:
                print("Error: Invalid API key or unauthorized access")
                return []
            elif response.status_code == 404:
                print("Error: Project not found")
                return []
            
            response.raise_for_status()
            entries = response.json()
            
            # Filter by embeddable_id if specified
            if embeddable_id:
                entries = [e for e in entries if e.get('embeddable_id') == embeddable_id]
            
            return entries
            
        except requests.exceptions.RequestException as e:
            print(f"Error fetching entries: {e}")
            return []
    
    def fetch_all_entries(self, embeddable_id: str, limit: int = 10000, 
                         date_from: Optional[str] = None, date_to: Optional[str] = None) -> List[Dict]:
        """
        Fetch ALL entries with comprehensive pagination handling
        This version ensures we get the complete historical dataset
        """
        all_entries = []
        
        print(f"🔍 Fetching ALL entries for embeddable {embeddable_id}")
        if date_from or date_to:
            print(f"📅 Date range: {date_from or 'ALL HISTORY'} to {date_to or 'NOW'}")
        else:
            print(f"📅 Fetching complete historical dataset (no date limits)")
        
        # Strategy: Use time-based windowing with aggressive pagination
        # Remove any default date limits to ensure we get ALL historical data
        base_params = {
            'limit': 1000,  # API max per request
            'sort': 'created_at', 
            'direction': 'DESC'
        }
        
        # Only add date filters if explicitly provided
        if date_from:
            base_params['updated_after'] = date_from
        if date_to:
            base_params['updated_before'] = date_to
        
        # Get initial batch
        entries = self.fetch_entries_batch(base_params, embeddable_id)
        if not entries:
            print("❌ No entries found")
            return []
        
        all_entries.extend(entries)
        print(f"📦 Initial fetch: {len(entries)} entries (oldest: {entries[-1].get('created_at') if entries else 'N/A'})")
        
        # Continue paginating until we get everything
        oldest_date = entries[-1].get('created_at') if entries else None
        pagination_count = 1
        
        while oldest_date and len(all_entries) < limit:
            print(f"🔄 Pagination {pagination_count}: Fetching entries before {oldest_date}")
            
            # Fetch next batch using oldest date as cursor
            params = {
                'limit': 1000,
                'sort': 'created_at',
                'direction': 'DESC',
                'updated_before': oldest_date  # This ensures we go further back in time
            }
            
            # Only add date_from if explicitly provided (don't artificially limit history)
            if date_from:
                params['updated_after'] = date_from
                
            batch_entries = self.fetch_entries_batch(params, embeddable_id)
            
            if not batch_entries:
                print("✅ No more entries found - reached end of dataset")
                break
                
            # Remove any duplicate entries (shouldn't happen but be safe)
            existing_ids = {e['entry_id'] for e in all_entries}
            new_entries = [e for e in batch_entries if e['entry_id'] not in existing_ids]
            
            if not new_entries:
                print("⚠️ No new unique entries in batch - stopping pagination")
                break
                
            all_entries.extend(new_entries)
            new_oldest_date = batch_entries[-1].get('created_at') if batch_entries else None
            
            print(f"📦 Batch {pagination_count}: {len(new_entries)} new entries (total: {len(all_entries)}, oldest: {new_oldest_date})")
            
            # Check if we're making progress (date is getting older)
            if new_oldest_date == oldest_date:
                print("⚠️ Date cursor not advancing - stopping to prevent infinite loop")
                break
                
            oldest_date = new_oldest_date
            pagination_count += 1
            
            # Remove the artificial "small batch" stopping condition that was limiting historical data
            # We only stop when there are truly no more entries or we hit the limit
        
        print(f"🎉 Complete! Fetched {len(all_entries)} total entries across {pagination_count} API calls")
        
        # Show the date range we actually retrieved
        if all_entries:
            newest_date = all_entries[0].get('created_at', 'Unknown')
            oldest_retrieved = all_entries[-1].get('created_at', 'Unknown')
            print(f"📅 Retrieved data from {oldest_retrieved} to {newest_date}")
        
        return all_entries[:limit]
    
    def safe_string(self, value: Any) -> str:
        """Safely convert value to string"""
        if value is None or value == '':
            return ''
        if isinstance(value, dict) or isinstance(value, list):
            return json.dumps(value)
        return str(value)
    
    def format_date_of_birth(self, day: Any, month: Any, year: Any) -> str:
        """Format date of birth as MM/DD/YYYY"""
        if not day or not month or not year:
            return ''
        
        month_map = {
            'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
            'may': '05', 'jun': '06', 'jul': '07', 'aug': '08',
            'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
        }
        
        month_str = str(month).lower()
        month_num = month_map.get(month_str, '01')
        day_formatted = str(day).zfill(2)
        
        return f"{month_num}/{day_formatted}/{year}"
    
    def format_height(self, feet: Any, inches: Any) -> str:
        """Format height as X'Y''"""
        if not feet or not inches:
            return ''
        
        feet_map = {
            'feet_three': '3', 'feet_four': '4', 'feet_five': '5',
            'feet_six': '6', 'feet_seven': '7'
        }
        
        inches_map = {
            'inches_zero': '0', 'inches_one': '1', 'inches_two': '2',
            'inches_three': '3', 'inches_four': '4', 'inches_five': '5',
            'inches_six': '6', 'inches_seven': '7', 'inches_eight': '8',
            'inches_nine': '9', 'inches_ten': '10', 'inches_eleven': '11'
        }
        
        feet_str = str(feet).lower()
        inches_str = str(inches).lower()
        
        feet_num = feet_map.get(feet_str, '0')
        inches_num = inches_map.get(inches_str, '0')
        
        return f"{feet_num}'{inches_num}''"
    
    def capitalize_state(self, state: Any) -> str:
        """Capitalize state code"""
        if not state:
            return ''
        return str(state).upper()
    
    def parse_disqualified_reasons(self, reasons_data: Any) -> str:
        """Parse disqualified reasons from complex data structure"""
        if not reasons_data:
            return ''
        
        try:
            if isinstance(reasons_data, str):
                parsed_data = json.loads(reasons_data)
            else:
                parsed_data = reasons_data
            
            return parsed_data.get('reasonsList', '')
        except:
            return self.safe_string(reasons_data)
    
    def calculate_furthest_page(self, entry_data: Dict) -> tuple:
        """Get furthest page info directly from entry data - API already tracks this"""
        # The API already calculates and stores the furthest page reached
        furthest_key = entry_data.get('highest_page_reached_key', '')
        furthest_id = entry_data.get('highest_page_reached_id', '')
        furthest_index = entry_data.get('highest_page_reached_index', -1)
        
        # Fallback to current page if highest not available
        if not furthest_key:
            furthest_key = entry_data.get('current_page_key', '')
            furthest_id = entry_data.get('current_page_id', '')
            furthest_index = entry_data.get('current_page_index', -1)
        
        # Convert index to int if it's a string
        if isinstance(furthest_index, str):
            try:
                furthest_index = int(furthest_index)
            except:
                furthest_index = -1
                
        return furthest_key, furthest_id, furthest_index
    
    def process_entry(self, entry: Dict, form_source: str) -> Dict:
        """Process a single entry into the spreadsheet format"""
        try:
            # Parse the entry_data JSON string
            entry_data = json.loads(entry.get('entry_data', '{}'))
        except:
            entry_data = {}
        
        # Calculate furthest page reached
        furthest_key, furthest_id, furthest_index = self.calculate_furthest_page(entry_data)
        
        # Format timestamps
        created_at = entry.get('created_at', '')
        updated_at = entry.get('updated_at', '')
        
        try:
            if created_at:
                created_dt = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                first_started = created_dt.strftime('%Y-%m-%d %H:%M:%S')
            else:
                first_started = ''
        except:
            first_started = created_at
            
        try:
            if updated_at:
                updated_dt = datetime.fromisoformat(updated_at.replace('Z', '+00:00'))
                last_updated = updated_dt.strftime('%Y-%m-%d %H:%M:%S')
            else:
                last_updated = ''
        except:
            last_updated = updated_at
        
        # Build the row data matching your spreadsheet format
        return {
            'First Started': first_started,
            'Last Updated': last_updated,
            'Entry ID': entry.get('entry_id', ''),
            'Form Source': form_source,
            'Furthest Page Reached': furthest_key,
            'Furthest Page ID': furthest_id,
            'Furthest Page Index': str(furthest_index) if furthest_index >= 0 else '',
            'First Name': self.safe_string(entry_data.get('first_name')),
            'Last Name': self.safe_string(entry_data.get('last_name')),
            'Email': self.safe_string(entry_data.get('email')),
            'Phone': self.safe_string(entry_data.get('phone')),
            'Age at Submission': self.safe_string(entry_data.get('age')),
            'Date of Birth': self.format_date_of_birth(
                entry_data.get('dob_day'),
                entry_data.get('dob_month'),
                entry_data.get('dob_year')
            ),
            'Sex Assigned at Birth': self.safe_string(entry_data.get('sex_assigned_at_birth')),
            'State': self.capitalize_state(entry_data.get('state')),
            'Height': self.format_height(
                entry_data.get('height_feet'),
                entry_data.get('height_inches')
            ),
            'Weight at Submission (lbs)': self.safe_string(entry_data.get('weight_lbs')),
            'Goal Weight (lbs)': self.safe_string(entry_data.get('goal_weight_lbs')),
            'Weight Difference (lbs)': self.safe_string(entry_data.get('weight_difference')),
            'BMI': self.safe_string(entry_data.get('bmi')),
            'Health Conditions': self.safe_string(entry_data.get('dq_health_conditions_options')),
            'Female Questions': self.safe_string(entry_data.get('female_dq_questions')) if entry_data.get('sex_assigned_at_birth') == 'female' else 'NA',
            'Disqualifier': self.safe_string(entry_data.get('disqualifier')),
            'Disqualified Reasons': self.parse_disqualified_reasons(entry_data.get('disqualified_reasons')),
            'Taking WL Meds': self.safe_string(entry_data.get('taking_wl_meds_options')),
            'Taken WL Meds': self.safe_string(entry_data.get('taken_wl_meds_options')),
            'Recently Took WL Meds': self.safe_string(entry_data.get('recently_took_wl_meds')),
            'GLP Experience': self.safe_string(entry_data.get('glp_experience')),
            'Previous GLP Taken': self.safe_string(entry_data.get('previous_medication_options')),
            'Last GLP Dosage': self.safe_string(entry_data.get('glp1_dosage_question_mg')),
            'GLP Details Last Dose': self.safe_string(entry_data.get('glp_details_last_dose')),
            'GLP Details Starting Weight': self.safe_string(entry_data.get('glp_details_starting_weight')),
            'Agreement Not to Stack': self.safe_string(entry_data.get('checkbox_notstack_glp')),
            'Match Medication Options': self.safe_string(entry_data.get('match_medication_options')),
            'Shown Recommendation': self.safe_string(entry_data.get('glp_recommendation')),
            'Sleep Overall': self.safe_string(entry_data.get('sleep_overall_options')),
            'Sleep Hours': self.safe_string(entry_data.get('sleep_hours_selector')),
            'Side Effects Experienced from Weight': self.safe_string(entry_data.get('effects_options_multiple')),
            'Concerns Options': self.safe_string(entry_data.get('concerns_options')),
            'Priority Options': self.safe_string(entry_data.get('priority_options')),
            'GLP Motivations': self.safe_string(entry_data.get('glp_motivations')),
            'Weight Loss Pace': self.safe_string(entry_data.get('weight_loss_pace')),
            'Willing To Options': self.safe_string(entry_data.get('willing_to_options')),
            'State of Mind': self.safe_string(entry_data.get('state_mind_options')),
            'Email Terms Conditions Checkbox': self.safe_string(entry_data.get('clicked_email_terms_conditions_checkbox')),
            'IP Address': self.safe_string(entry_data.get('ip_address'))
        }
    
    def extract_funnel_data(self, funnel_key: str, limit: int = 10000,
                           date_from: Optional[str] = None, date_to: Optional[str] = None,
                           checkout_only: bool = False):
        """Extract data for a specific funnel"""
        funnel = self.funnels.get(funnel_key)
        if not funnel:
            print(f"Unknown funnel: {funnel_key}")
            return
        
        print(f"\n{'='*50}")
        print(f"🎯 Extracting {funnel['name']} Funnel Data")
        print(f"{'='*50}")
        print(f"Embeddable ID: {funnel['id']}")
        
        if checkout_only:
            print("Filtering for checkout completions only")
        
        # Fetch entries
        entries = self.fetch_all_entries(funnel['id'], limit, date_from, date_to)
        
        if not entries:
            print("No entries found")
            return
        
        # Process entries
        processed_data = []
        filtered_test_count = 0
        for entry in entries:
            try:
                # Filter out test entries
                entry_id = entry.get('entry_id', '')
                if entry_id in self.test_entry_ids:
                    filtered_test_count += 1
                    continue
                
                processed_entry = self.process_entry(entry, funnel['form_source'])
                
                # Filter for checkout completions if requested
                if checkout_only:
                    if processed_entry['Furthest Page Reached'] != 'checkout_page':
                        continue
                
                processed_data.append(processed_entry)
            except Exception as e:
                print(f"Error processing entry {entry.get('entry_id', 'unknown')}: {e}")
                continue
        
        if filtered_test_count > 0:
            print(f"🚫 Automatically filtered {filtered_test_count} test entries")
        
        # Generate filenames
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        base_filename = f"{funnel_key}_{timestamp}"
        
        if checkout_only:
            complete_filename = os.path.join(self.output_dir, f"{base_filename}_complete.csv")
        else:
            all_filename = os.path.join(self.output_dir, f"{base_filename}_all.csv")
            complete_filename = os.path.join(self.output_dir, f"{base_filename}_complete.csv")
            partial_filename = os.path.join(self.output_dir, f"{base_filename}_partial.csv")
        
        if processed_data:
            # Write all data
            if not checkout_only:
                df_all = pd.DataFrame(processed_data)
                df_all.to_csv(all_filename, index=False)
                print(f"📄 Exported {len(processed_data)} total entries to {all_filename}")
            
                # Separate complete and partial
                complete_entries = [entry for entry in processed_data 
                                  if entry['Furthest Page Reached'] == 'checkout_page']
                partial_entries = [entry for entry in processed_data 
                                 if entry['Furthest Page Reached'] != 'checkout_page']
                
                # Write complete entries
                if complete_entries:
                    df_complete = pd.DataFrame(complete_entries)
                    df_complete.to_csv(complete_filename, index=False)
                    print(f"✅ Exported {len(complete_entries)} complete entries to {complete_filename}")
                
                # Write partial entries
                if partial_entries:
                    df_partial = pd.DataFrame(partial_entries)
                    df_partial.to_csv(partial_filename, index=False)
                    print(f"⏸️  Exported {len(partial_entries)} partial entries to {partial_filename}")
            else:
                # Only complete entries requested
                df_complete = pd.DataFrame(processed_data)
                df_complete.to_csv(complete_filename, index=False)
                print(f"✅ Exported {len(processed_data)} complete entries to {complete_filename}")
            
            # Print summary stats
            if not checkout_only:
                furthest_pages = pd.DataFrame(processed_data)['Furthest Page Reached'].value_counts()
                print(f"\n📊 Funnel Drop-off Analysis:")
                for page, count in furthest_pages.items():
                    percentage = (count / len(processed_data)) * 100
                    print(f"  {page}: {count} ({percentage:.1f}%)")
        else:
            print("No entries to export")
    
    def extract_all_funnels(self, limit: int = 10000, date_from: Optional[str] = None, 
                           date_to: Optional[str] = None, checkout_only: bool = False):
        """Extract data for all funnels"""
        print(f"🚀 Starting Multi-Funnel Extraction")
        print(f"📅 Limit: {limit} entries per funnel")
        if date_from or date_to:
            print(f"📅 Date range: {date_from or 'beginning'} to {date_to or 'now'}")
        
        for funnel_key in self.funnels.keys():
            try:
                self.extract_funnel_data(funnel_key, limit, date_from, date_to, checkout_only)
            except Exception as e:
                print(f"❌ Error extracting {funnel_key}: {e}")
                continue
        
        print(f"\n🎉 Multi-funnel extraction complete!")
        print(f"📁 Files saved to: {self.output_dir}")

def main():
    parser = argparse.ArgumentParser(description='Extract Embeddables entries for multiple funnels')
    parser.add_argument('--funnel', choices=['medication_v1', 'tirzepatide_v1', 'semaglutide_v1', 'all'], 
                       default='all', help='Funnel to extract (default: all)')
    parser.add_argument('--limit', type=int, default=10000, help='Maximum number of entries to fetch per funnel')
    parser.add_argument('--date-from', help='Start date (ISO format: 2025-08-01T00:00:00Z)')
    parser.add_argument('--date-to', help='End date (ISO format: 2025-09-01T00:00:00Z)')
    parser.add_argument('--checkout-only', action='store_true', help='Only export completed checkouts')
    parser.add_argument('--api-key', help='Override API key from .env file')
    parser.add_argument('--project-id', help='Override project ID from .env file')
    
    args = parser.parse_args()
    
    try:
        extractor = EmbeddablesExtractor(
            api_key=args.api_key,
            project_id=args.project_id
        )
        
        if args.funnel == 'all':
            extractor.extract_all_funnels(
                limit=args.limit,
                date_from=args.date_from,
                date_to=args.date_to,
                checkout_only=args.checkout_only
            )
        else:
            extractor.extract_funnel_data(
                funnel_key=args.funnel,
                limit=args.limit,
                date_from=args.date_from,
                date_to=args.date_to,
                checkout_only=args.checkout_only
            )
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()