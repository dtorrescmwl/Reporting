#!/usr/bin/env python3
"""
Convert CarePortals_Orders CSV format to order.updated webhook format.

This script takes a CSV file with the same structure as the CarePortals_Orders
spreadsheet order.updated tab and converts it to the format expected by the
order.updated webhook function (processOrderUpdate).

Input format (CarePortals_Orders order.updated tab):
- May contain various columns from the original order data
- Must contain: order_id, status information, timestamps

Output format (webhook processOrderUpdate format):
- Datetime Created (Eastern Time)
- Datetime Updated (Eastern Time)
- order_id (4-digit)
- updated_status

Author: Claude Code
Date: October 2025
"""

import pandas as pd
import argparse
import sys
from datetime import datetime
import pytz
from pathlib import Path


def convert_to_eastern_time(utc_datetime_str):
    """
    Convert UTC datetime string to Eastern Time (handles EST/EDT automatically).

    Args:
        utc_datetime_str (str): UTC datetime string in various formats

    Returns:
        str: Eastern time formatted as MM/DD/YYYY, HH:MM:SS AM/PM
    """
    if not utc_datetime_str or pd.isna(utc_datetime_str):
        return ""

    try:
        # Handle various datetime formats
        if isinstance(utc_datetime_str, str):
            # Try different datetime formats
            formats_to_try = [
                "%Y-%m-%dT%H:%M:%SZ",           # 2024-01-15T15:30:00Z
                "%Y-%m-%dT%H:%M:%S.%fZ",        # 2024-01-15T15:30:00.123Z
                "%Y-%m-%d %H:%M:%S",            # 2024-01-15 15:30:00
                "%m/%d/%Y %H:%M:%S",            # 01/15/2024 15:30:00
                "%m/%d/%Y, %I:%M:%S %p",        # 01/15/2024, 3:30:00 PM
            ]

            utc_dt = None
            for fmt in formats_to_try:
                try:
                    utc_dt = datetime.strptime(utc_datetime_str, fmt)
                    break
                except ValueError:
                    continue

            if utc_dt is None:
                # Try pandas to_datetime as fallback
                utc_dt = pd.to_datetime(utc_datetime_str).to_pydatetime()
        else:
            # Handle pandas datetime
            utc_dt = pd.to_datetime(utc_datetime_str).to_pydatetime()

        # Set UTC timezone if naive
        if utc_dt.tzinfo is None:
            utc_dt = pytz.UTC.localize(utc_dt)

        # Convert to Eastern Time
        eastern_tz = pytz.timezone('America/New_York')
        eastern_dt = utc_dt.astimezone(eastern_tz)

        # Format as MM/DD/YYYY, HH:MM:SS AM/PM
        return eastern_dt.strftime("%m/%d/%Y, %I:%M:%S %p")

    except Exception as e:
        print(f"Warning: Could not convert datetime '{utc_datetime_str}': {e}")
        return str(utc_datetime_str)


def detect_input_format(df):
    """
    Detect the format of the input CSV and map columns to standard names.

    Args:
        df (pd.DataFrame): Input dataframe

    Returns:
        dict: Mapping of standard column names to actual column names
    """
    columns = df.columns.tolist()
    column_mapping = {}

    # Common column name variations - prioritize 4-digit Order ID over internal ID
    order_id_variants = ['Order ID', 'Order_ID', 'order_id', 'order_number', 'id']
    status_variants = ['status', 'updated_status', 'Status', 'order_status', 'current_status']
    created_variants = ['created_at', 'createdAt', 'Created At', 'date_created', 'created']
    updated_variants = ['updated_at', 'updatedAt', 'Updated At', 'date_updated', 'updated', 'modified_at']

    # Special handling for Order ID - prioritize "Order ID" column if it exists
    if 'Order ID' in columns:
        column_mapping['order_id'] = 'Order ID'
    elif 'Order_ID' in columns:
        column_mapping['order_id'] = 'Order_ID'

    # Find matching columns - prioritize exact matches first
    for col in columns:
        col_lower = col.lower().strip()

        # Order ID mapping - only if not already set by special handling
        if not column_mapping.get('order_id'):
            for variant in order_id_variants:
                if col_lower == variant.lower():
                    column_mapping['order_id'] = col
                    break

            # If no exact match, check partial matches (but avoid matching internal IDs)
            if not column_mapping.get('order_id'):
                for variant in order_id_variants:
                    if variant.lower() in col_lower and 'internal' not in col_lower and 'care_portals' not in col_lower:
                        column_mapping['order_id'] = col
                        break

        # Status mapping
        if not column_mapping.get('status'):
            for variant in status_variants:
                if col_lower == variant.lower() or variant.lower() in col_lower:
                    column_mapping['status'] = col
                    break

        # Created date mapping
        if not column_mapping.get('created_at'):
            for variant in created_variants:
                if col_lower == variant.lower() or variant.lower() in col_lower:
                    column_mapping['created_at'] = col
                    break

        # Updated date mapping
        if not column_mapping.get('updated_at'):
            for variant in updated_variants:
                if col_lower == variant.lower() or variant.lower() in col_lower:
                    column_mapping['updated_at'] = col
                    break

    return column_mapping


def convert_csv_format(input_file, output_file):
    """
    Convert CSV from CarePortals_Orders format to order.updated webhook format.

    Args:
        input_file (str): Path to input CSV file
        output_file (str): Path to output CSV file

    Returns:
        dict: Conversion summary statistics
    """
    try:
        # Read input CSV
        print(f"Reading input file: {input_file}")
        df = pd.read_csv(input_file)

        if df.empty:
            raise ValueError("Input CSV file is empty")

        print(f"Found {len(df)} rows in input file")
        print(f"Input columns: {list(df.columns)}")

        # Detect column mapping
        column_mapping = detect_input_format(df)
        print(f"Detected column mapping: {column_mapping}")

        # Validate required columns
        required_fields = ['order_id', 'status']
        missing_fields = []

        for field in required_fields:
            if field not in column_mapping:
                missing_fields.append(field)

        if missing_fields:
            raise ValueError(f"Could not find required columns: {missing_fields}. "
                           f"Available columns: {list(df.columns)}")

        # Create output dataframe
        output_data = []

        for index, row in df.iterrows():
            try:
                # Extract data using column mapping
                order_id = str(row[column_mapping['order_id']]).strip()
                status = str(row[column_mapping['status']]).strip()

                # Handle created_at - use current time if not available
                if 'created_at' in column_mapping and pd.notna(row[column_mapping['created_at']]):
                    created_at_eastern = convert_to_eastern_time(row[column_mapping['created_at']])
                else:
                    # Use current Eastern time as fallback
                    current_eastern = datetime.now(pytz.timezone('America/New_York'))
                    created_at_eastern = current_eastern.strftime("%m/%d/%Y, %I:%M:%S %p")

                # Handle updated_at - use created_at if not available
                if 'updated_at' in column_mapping and pd.notna(row[column_mapping['updated_at']]):
                    updated_at_eastern = convert_to_eastern_time(row[column_mapping['updated_at']])
                else:
                    updated_at_eastern = created_at_eastern

                # Skip empty order IDs
                if not order_id or order_id.lower() in ['nan', 'none', '']:
                    print(f"Warning: Skipping row {index + 1} - empty order_id")
                    continue

                # Skip empty statuses
                if not status or status.lower() in ['nan', 'none', '']:
                    print(f"Warning: Skipping row {index + 1} - empty status")
                    continue

                # Create output row
                output_row = {
                    'Datetime Created': created_at_eastern,
                    'Datetime Updated': updated_at_eastern,
                    'order_id': order_id,
                    'updated_status': status
                }

                output_data.append(output_row)

            except Exception as e:
                print(f"Warning: Error processing row {index + 1}: {e}")
                continue

        if not output_data:
            raise ValueError("No valid rows were converted. Check your input data format.")

        # Create output DataFrame
        output_df = pd.DataFrame(output_data)

        # Write output CSV
        print(f"Writing output file: {output_file}")
        output_df.to_csv(output_file, index=False)

        # Summary statistics
        summary = {
            'input_rows': len(df),
            'output_rows': len(output_df),
            'skipped_rows': len(df) - len(output_df),
            'input_file': input_file,
            'output_file': output_file,
            'column_mapping': column_mapping
        }

        return summary

    except Exception as e:
        raise Exception(f"Error converting CSV format: {e}")


def main():
    """Main function to handle command line arguments and execute conversion."""
    parser = argparse.ArgumentParser(
        description='Convert CarePortals_Orders CSV format to order.updated webhook format',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python convert_order_updated_format.py input.csv output.csv
  python convert_order_updated_format.py /path/to/orders.csv ./webhook_format.csv

Input CSV should contain columns for:
  - order_id (required): Order identifier
  - status (required): Order status
  - created_at (optional): Creation timestamp
  - updated_at (optional): Update timestamp

Output CSV will contain:
  - Datetime Created: Eastern Time formatted timestamp
  - Datetime Updated: Eastern Time formatted timestamp
  - order_id: Order identifier
  - updated_status: Order status
        """
    )

    parser.add_argument('input_file', help='Path to input CSV file')
    parser.add_argument('output_file', help='Path to output CSV file')
    parser.add_argument('--verbose', '-v', action='store_true',
                       help='Enable verbose output')

    args = parser.parse_args()

    # Validate input file exists
    input_path = Path(args.input_file)
    if not input_path.exists():
        print(f"Error: Input file '{args.input_file}' does not exist")
        sys.exit(1)

    if not input_path.is_file():
        print(f"Error: '{args.input_file}' is not a file")
        sys.exit(1)

    # Create output directory if needed
    output_path = Path(args.output_file)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    try:
        # Convert the file
        summary = convert_csv_format(args.input_file, args.output_file)

        # Print summary
        print("\n" + "="*50)
        print("CONVERSION COMPLETED SUCCESSFULLY")
        print("="*50)
        print(f"Input file:     {summary['input_file']}")
        print(f"Output file:    {summary['output_file']}")
        print(f"Input rows:     {summary['input_rows']}")
        print(f"Output rows:    {summary['output_rows']}")
        print(f"Skipped rows:   {summary['skipped_rows']}")

        if args.verbose:
            print(f"\nColumn mapping used:")
            for key, value in summary['column_mapping'].items():
                print(f"  {key} -> {value}")

        print(f"\nOutput file saved to: {args.output_file}")
        print("Ready to use with order.updated webhook!")

    except Exception as e:
        print(f"\nError: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()