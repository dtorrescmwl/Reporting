#!/usr/bin/env python3
"""
Embeddables Entries Extractor
Fetches all entries from Embeddables API and formats them for spreadsheet import
Includes proper page progression logic and handles historical data retrieval
"""

import requests
import json
import csv
import pandas as pd
from datetime import datetime, timezone
import argparse
import sys
from typing import Dict, List, Any, Optional

class EmbeddablesExtractor:
    def __init__(self, api_key: str, project_id: str, embeddable_id: Optional[str] = None):
        self.api_key = api_key
        self.project_id = project_id
        self.embeddable_id = embeddable_id
        self.base_url = "https://api.embeddables.com"
        self.headers = {
            "X-Api-Key": api_key,
            "Content-Type": "application/json"
        }
        
        # Page mapping with field indicators for accurate progression tracking
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
            {
                'index': 6, 'id': 'page_3729980498', 'key': 'medical_review',
                'required_fields': ['first_name', 'last_name', 'state']
            },
            {
                'index': 7, 'id': 'page_0356581073', 'key': 'lead_capture',
                'required_fields': ['email', 'phone', 'clicked_email_terms_conditions_checkbox']
            },
            {
                'index': 8, 'id': 'page_2005227088', 'key': 'main_priority',
                'required_fields': ['priority_options']
            },
            {
                'index': 9, 'id': 'page_2471548884', 'key': 'interstitial_magic_science',
                'required_fields': []  # Interstitial - no required fields
            },
            {
                'index': 10, 'id': 'page_8819757418', 'key': 'success_interstitial_female',
                'required_fields': []  # Conditional interstitial
            },
            {
                'index': 11, 'id': 'page_0461952995', 'key': 'success_interstitial_male',
                'required_fields': []  # Conditional interstitial
            },
            {
                'index': 12, 'id': 'page_7202369300', 'key': 'interstitial_glp1_how',
                'required_fields': []  # Interstitial
            },
            {
                'index': 13, 'id': 'page_4066672896', 'key': 'glp_motivation',
                'required_fields': ['glp_motivations']
            },
            {
                'index': 14, 'id': 'page_6209763550', 'key': 'pace',
                'required_fields': ['weight_loss_pace']
            },
            {
                'index': 15, 'id': 'page_9780197469', 'key': 'interstitial_works_for_me',
                'required_fields': []  # Conditional interstitial
            },
            {
                'index': 16, 'id': 'page_1912862433', 'key': 'interstitial_i_want_faster',
                'required_fields': []  # Conditional interstitial
            },
            {
                'index': 17, 'id': 'page_4709533173', 'key': 'interstitial_too_fast',
                'required_fields': []  # Conditional interstitial
            },
            {
                'index': 18, 'id': 'page_8469008010', 'key': 'sleep_overall',
                'required_fields': ['sleep_overall_options']
            },
            {
                'index': 19, 'id': 'page_1771454475', 'key': 'sleep_hours',
                'required_fields': ['sleep_hours_selector']
            },
            {
                'index': 20, 'id': 'page_8143531633', 'key': 'success_interstitial_2',
                'required_fields': []  # Interstitial
            },
            {
                'index': 21, 'id': 'page_9598316663', 'key': 'dq_health_conditions',
                'required_fields': ['dq_health_conditions_options']
            },
            {
                'index': 22, 'id': 'page_7425910822', 'key': 'taking_wl_meds',
                'required_fields': ['taking_wl_meds_options']
            },
            {
                'index': 23, 'id': 'page_7546122099', 'key': 'taken_wl_meds',
                'required_fields': ['taken_wl_meds_options']  # Conditional
            },
            {
                'index': 24, 'id': 'page_5823926603', 'key': 'glp_details',
                'required_fields': ['previous_medication_options']  # Conditional
            },
            {
                'index': 25, 'id': 'page_0241012732', 'key': 'patient_willing_to',
                'required_fields': ['willing_to_options']
            },
            {
                'index': 26, 'id': 'page_2993066365', 'key': 'match_medication',
                'required_fields': ['match_medication_options']  # Conditional
            },
            {
                'index': 27, 'id': 'page_6095557267', 'key': 'state_of_mind',
                'required_fields': ['state_mind_options']
            },
            {
                'index': 28, 'id': 'page_3616048081', 'key': 'concerns',
                'required_fields': ['concerns_options']
            },
            {
                'index': 29, 'id': 'page_8491832920', 'key': 'date_of_birth',
                'required_fields': ['dob_year', 'dob_month', 'dob_day']
            },
            {
                'index': 30, 'id': 'page_5106098584', 'key': 'dq_page',
                'required_fields': []  # Disqualification page
            },
            {
                'index': 31, 'id': 'page_9359573993', 'key': 'checkout_page',
                'required_fields': []  # Final page - presence in entries indicates completion
            }
        ]
    
    def fetch_entries_batch(self, params: Dict) -> List[Dict]:
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
            if self.embeddable_id:
                entries = [e for e in entries if e.get('embeddable_id') == self.embeddable_id]
            
            return entries
            
        except requests.exceptions.RequestException as e:
            print(f"Error fetching entries: {e}")
            return []
    
    def fetch_all_entries(self, limit: int = 1000, date_from: Optional[str] = None, 
                         date_to: Optional[str] = None) -> List[Dict]:
        """Fetch all entries with proper pagination handling"""
        all_entries = []
        
        print(f"Fetching entries for project {self.project_id}")
        if self.embeddable_id:
            print(f"Filtering for embeddable {self.embeddable_id}")
        if date_from or date_to:
            print(f"Date range: {date_from or 'beginning'} to {date_to or 'now'}")
        
        # Strategy: Use time-based windowing since API limits to ~100 per request
        # We'll fetch in chunks using date ranges to get all data
        
        # First, get a large batch to see total scope
        base_params = {
            'limit': 1000,  # Try to get as many as possible
            'sort': 'created_at', 
            'direction': 'DESC'
        }
        
        if date_from:
            base_params['updated_after'] = date_from
        if date_to:
            base_params['updated_before'] = date_to
        
        # Get initial batch
        entries = self.fetch_entries_batch(base_params)
        if not entries:
            print("No entries found")
            return []
        
        all_entries.extend(entries)
        print(f"Initial fetch: {len(entries)} entries")
        
        # If we got fewer than requested, we have all data
        if len(entries) < 1000:
            print(f"Got all available entries: {len(all_entries)} total")
            return all_entries[:limit]
        
        # If we hit the limit, we need to paginate using date windows
        # Get oldest entry from current batch
        oldest_date = entries[-1].get('created_at')
        
        while len(all_entries) < limit and oldest_date:
            print(f"Fetching older entries before {oldest_date}")
            
            # Fetch next batch using oldest date as cursor
            params = {
                'limit': 1000,
                'sort': 'created_at',
                'direction': 'DESC',
                'updated_before': oldest_date
            }
            
            if date_from:
                params['updated_after'] = date_from
                
            batch_entries = self.fetch_entries_batch(params)
            
            if not batch_entries:
                print("No more entries found")
                break
                
            # Remove any duplicate entries (shouldn't happen but be safe)
            existing_ids = {e['entry_id'] for e in all_entries}
            new_entries = [e for e in batch_entries if e['entry_id'] not in existing_ids]
            
            if not new_entries:
                print("No new entries in batch, stopping")
                break
                
            all_entries.extend(new_entries)
            oldest_date = batch_entries[-1].get('created_at')
            
            print(f"Fetched {len(new_entries)} more entries (total: {len(all_entries)})")
            
            # Safety check - if we got fewer than 50 entries, we're probably at the end
            if len(batch_entries) < 50:
                print("Small batch indicates end of data")
                break
        
        print(f"Fetched {len(all_entries)} total entries")
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
    
    def process_entry(self, entry: Dict) -> Dict:
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
            'Form Source': entry_data.get('form_source', 'medication v1'),
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
    
    def extract_to_csv(self, filename: str = 'embeddables_entries.csv', limit: int = 1000,
                      date_from: Optional[str] = None, date_to: Optional[str] = None,
                      checkout_only: bool = False):
        """Extract entries and save to CSV"""
        print(f"Starting extraction for project {self.project_id}")
        if self.embeddable_id:
            print(f"Filtering for embeddable {self.embeddable_id}")
        if checkout_only:
            print("Filtering for checkout completions only")
        
        # Fetch entries
        entries = self.fetch_all_entries(limit, date_from, date_to)
        
        if not entries:
            print("No entries found")
            return
        
        # Process entries
        processed_data = []
        for entry in entries:
            try:
                processed_entry = self.process_entry(entry)
                
                # Filter for checkout completions if requested
                if checkout_only:
                    if processed_entry['Furthest Page Reached'] != 'checkout_page':
                        continue
                
                processed_data.append(processed_entry)
            except Exception as e:
                print(f"Error processing entry {entry.get('entry_id', 'unknown')}: {e}")
                continue
        
        # Write to CSV
        if processed_data:
            df = pd.DataFrame(processed_data)
            df.to_csv(filename, index=False)
            print(f"Exported {len(processed_data)} entries to {filename}")
            
            # Print summary stats
            if not checkout_only:
                furthest_pages = df['Furthest Page Reached'].value_counts()
                print("\nFurthest page reached distribution:")
                for page, count in furthest_pages.items():
                    print(f"  {page}: {count}")
        else:
            print("No entries to export")

def main():
    parser = argparse.ArgumentParser(description='Extract Embeddables entries to CSV')
    parser.add_argument('--api-key', required=True, help='Embeddables API key')
    parser.add_argument('--project-id', required=True, help='Project ID')
    parser.add_argument('--embeddable-id', help='Filter by specific embeddable ID')
    parser.add_argument('--output', default='embeddables_entries.csv', help='Output CSV filename')
    parser.add_argument('--limit', type=int, default=1000, help='Maximum number of entries to fetch')
    parser.add_argument('--date-from', help='Start date (ISO format: 2025-08-01T00:00:00Z)')
    parser.add_argument('--date-to', help='End date (ISO format: 2025-09-01T00:00:00Z)')
    parser.add_argument('--checkout-only', action='store_true', help='Only export completed checkouts')
    
    args = parser.parse_args()
    
    extractor = EmbeddablesExtractor(
        api_key=args.api_key,
        project_id=args.project_id,
        embeddable_id=args.embeddable_id
    )
    
    extractor.extract_to_csv(
        filename=args.output,
        limit=args.limit,
        date_from=args.date_from,
        date_to=args.date_to,
        checkout_only=args.checkout_only
    )

if __name__ == '__main__':
    main()
