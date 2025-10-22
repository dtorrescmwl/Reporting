#!/usr/bin/env python3
"""
Local test script to analyze order tracking data and identify orders with complete stage progression
This will help us understand which orders should be used for accurate KPI calculations
"""

import pandas as pd
from datetime import datetime, timedelta
import numpy as np

def analyze_order_tracking():
    print("=== LOCAL ORDER TRACKING ANALYSIS ===\n")

    # Load the spreadsheets
    try:
        print("Loading spreadsheets...")

        # Database_CarePortals.xlsx - order.created sheet
        main_file = '/home/cmwldaniel/Reporting/GoogleSheets/Database_CarePortals.xlsx'
        orders_created_df = pd.read_excel(main_file, sheet_name='order.created', engine='openpyxl')
        print(f"✓ Loaded {len(orders_created_df)} orders from Database_CarePortals.order.created")

        # CarePortals_Orders.xlsx - order.updated sheet
        careportals_file = '/home/cmwldaniel/Reporting/GoogleSheets/CarePortals_Orders.xlsx'
        order_updates_df = pd.read_excel(careportals_file, sheet_name='order.updated', engine='openpyxl')
        print(f"✓ Loaded {len(order_updates_df)} order updates from CarePortals_Orders.order.updated")

    except Exception as e:
        print(f"Error loading files: {e}")
        return

    # Basic data analysis
    print(f"\n=== BASIC DATA OVERVIEW ===")
    print(f"Orders created range: {orders_created_df['order_id'].min()} to {orders_created_df['order_id'].max()}")
    print(f"Order updates range: {order_updates_df['Order ID'].min()} to {order_updates_df['Order ID'].max()}")

    # Convert timestamps
    orders_created_df['created_at'] = pd.to_datetime(orders_created_df['created_at'])
    order_updates_df['Timestamp'] = pd.to_datetime(order_updates_df['Timestamp'])

    print(f"Creation dates range: {orders_created_df['created_at'].min()} to {orders_created_df['created_at'].max()}")
    print(f"Update dates range: {order_updates_df['Timestamp'].min()} to {order_updates_df['Timestamp'].max()}")

    # Find overlapping orders
    created_order_ids = set(orders_created_df['order_id'].tolist())
    update_order_ids = set(order_updates_df['Order ID'].dropna().tolist())
    overlapping_orders = created_order_ids.intersection(update_order_ids)

    print(f"\n=== ORDER OVERLAP ANALYSIS ===")
    print(f"Orders in created: {len(created_order_ids)}")
    print(f"Orders in updates: {len(update_order_ids)}")
    print(f"Overlapping orders: {len(overlapping_orders)}")

    # Analyze recent orders (last 60 days)
    cutoff_date = datetime.now() - timedelta(days=60)
    recent_updates = order_updates_df[order_updates_df['Timestamp'] >= cutoff_date].copy()
    recent_shipped = recent_updates[recent_updates['Status'] == 'shipped']['Order ID'].unique()

    print(f"\n=== RECENT ORDER ANALYSIS (Last 60 days) ===")
    print(f"Recent order updates: {len(recent_updates)}")
    print(f"Recent shipped orders: {len(recent_shipped)}")

    # Analyze complete order journeys
    print(f"\n=== COMPLETE ORDER JOURNEY ANALYSIS ===")

    # Group updates by order ID
    order_groups = order_updates_df.groupby('Order ID')

    complete_orders = []
    incomplete_orders = []

    for order_id, group in order_groups:
        # Sort by timestamp
        group_sorted = group.sort_values('Timestamp')
        statuses = group_sorted['Status'].tolist()
        timestamps = group_sorted['Timestamp'].tolist()

        # Check if this order has creation data
        has_creation = order_id in created_order_ids

        # Check if it reached shipped status
        has_shipped = 'shipped' in statuses

        # Check if it has meaningful progression (3+ stages)
        has_progression = len(set(statuses)) >= 3

        # Check if it has key stages
        has_key_stages = ('awaiting_script' in statuses or 'awaiting_shipment' in statuses)

        # Check if it's recent (shipped in last 60 days)
        is_recent = False
        if has_shipped:
            shipped_date = group_sorted[group_sorted['Status'] == 'shipped']['Timestamp'].iloc[-1]
            is_recent = shipped_date >= cutoff_date

        order_info = {
            'order_id': order_id,
            'has_creation': has_creation,
            'has_shipped': has_shipped,
            'has_progression': has_progression,
            'has_key_stages': has_key_stages,
            'is_recent': is_recent,
            'status_count': len(statuses),
            'unique_statuses': len(set(statuses)),
            'statuses': statuses,
            'timestamps': timestamps,
            'creation_date': orders_created_df[orders_created_df['order_id'] == order_id]['created_at'].iloc[0] if has_creation else None
        }

        # Complete order criteria: has creation + shipped + progression + key stages + recent
        if has_creation and has_shipped and has_progression and has_key_stages and is_recent:
            complete_orders.append(order_info)
        else:
            incomplete_orders.append(order_info)

    print(f"Total orders analyzed: {len(order_groups)}")
    print(f"Complete orders (all criteria): {len(complete_orders)}")
    print(f"Incomplete orders: {len(incomplete_orders)}")

    # Show breakdown of why orders are incomplete
    print(f"\n=== INCOMPLETE ORDER BREAKDOWN ===")
    no_creation = sum(1 for o in incomplete_orders if not o['has_creation'])
    no_shipped = sum(1 for o in incomplete_orders if not o['has_shipped'])
    no_progression = sum(1 for o in incomplete_orders if not o['has_progression'])
    no_key_stages = sum(1 for o in incomplete_orders if not o['has_key_stages'])
    not_recent = sum(1 for o in incomplete_orders if not o['is_recent'])

    print(f"Missing creation data: {no_creation}")
    print(f"Never shipped: {no_shipped}")
    print(f"Insufficient progression (<3 stages): {no_progression}")
    print(f"Missing key stages: {no_key_stages}")
    print(f"Not recent (>60 days): {not_recent}")

    # Analyze the complete orders
    if complete_orders:
        print(f"\n=== COMPLETE ORDERS ANALYSIS ===")
        print(f"Sample of complete orders (first 10):")

        for i, order in enumerate(complete_orders[:10]):
            print(f"\nOrder {order['order_id']}:")
            print(f"  Created: {order['creation_date']}")
            print(f"  Stages ({order['unique_statuses']} unique): {order['statuses']}")

        # Calculate actual stage timings for complete orders
        print(f"\n=== STAGE TIMING ANALYSIS (Complete Orders Only) ===")

        stage_timings = {
            'purchase_to_script': [],
            'script_to_shipment': [],
            'shipment_to_shipped': [],
            'purchase_to_shipped': []
        }

        for order in complete_orders:
            # Create timeline
            timeline = list(zip(order['timestamps'], order['statuses']))
            timeline.sort(key=lambda x: x[0])

            # Find key timestamps
            creation_time = order['creation_date']
            script_time = None
            shipment_time = None
            shipped_time = None

            for timestamp, status in timeline:
                if status == 'awaiting_script' and script_time is None:
                    script_time = timestamp
                elif status == 'awaiting_shipment' and shipment_time is None:
                    shipment_time = timestamp
                elif status == 'shipped' and shipped_time is None:
                    shipped_time = timestamp

            # Calculate timings
            if creation_time and script_time:
                hours = (script_time - creation_time).total_seconds() / 3600
                if 0 < hours < 720:  # Max 30 days
                    stage_timings['purchase_to_script'].append(hours)

            if script_time and shipment_time:
                hours = (shipment_time - script_time).total_seconds() / 3600
                if 0 < hours < 720:
                    stage_timings['script_to_shipment'].append(hours)

            if shipment_time and shipped_time:
                hours = (shipped_time - shipment_time).total_seconds() / 3600
                if 0 < hours < 720:
                    stage_timings['shipment_to_shipped'].append(hours)

            if creation_time and shipped_time:
                hours = (shipped_time - creation_time).total_seconds() / 3600
                if 0 < hours < 720:
                    stage_timings['purchase_to_shipped'].append(hours)

        # Print timing results
        for stage, times in stage_timings.items():
            if times:
                avg_hours = np.mean(times)
                sample_size = len(times)
                print(f"  {stage}: {avg_hours:.2f} hours (avg), {sample_size} samples")
            else:
                print(f"  {stage}: No valid samples")

        # Return the complete order IDs for use in the app script
        complete_order_ids = [str(order['order_id']) for order in complete_orders]
        print(f"\n=== RECOMMENDATION FOR APP SCRIPT ===")
        print(f"Use these {len(complete_order_ids)} order IDs for accurate KPI calculations:")
        print(f"Order IDs: {complete_order_ids[:20]}{'...' if len(complete_order_ids) > 20 else ''}")

        return complete_order_ids, complete_orders

    else:
        print("No complete orders found!")
        return [], []

if __name__ == "__main__":
    complete_order_ids, complete_orders = analyze_order_tracking()