#!/usr/bin/env python3
"""
CLEAN TEST: Core Order Flow Analysis
Only focusing on the 4 key business stages that matter:
awaiting_requirements → awaiting_script → awaiting_shipment → shipped

Going back means: moving backwards in this sequence (e.g., awaiting_shipment → awaiting_requirements)
"""

import pandas as pd
from datetime import datetime, timedelta

def test_core_order_flow():
    print("=== CORE ORDER FLOW TEST (LOCAL FILES) ===\n")

    # Load spreadsheets
    try:
        main_file = '/home/cmwldaniel/Reporting/GoogleSheets/Database_CarePortals.xlsx'
        orders_created_df = pd.read_excel(main_file, sheet_name='order.created', engine='openpyxl')

        careportals_file = '/home/cmwldaniel/Reporting/GoogleSheets/CarePortals_Orders.xlsx'
        order_updates_df = pd.read_excel(careportals_file, sheet_name='order.updated', engine='openpyxl')

        print(f"✓ Loaded {len(orders_created_df)} orders from Database_CarePortals")
        print(f"✓ Loaded {len(order_updates_df)} order updates from CarePortals_Orders")
    except Exception as e:
        print(f"Error: {e}")
        return

    # Convert timestamps
    orders_created_df['created_at'] = pd.to_datetime(orders_created_df['created_at'])
    order_updates_df['Timestamp'] = pd.to_datetime(order_updates_df['Timestamp'])

    # CORE BUSINESS FLOW - ONLY THESE 4 STAGES MATTER
    CORE_STAGES = [
        'awaiting_requirements',  # Stage 1
        'awaiting_script',        # Stage 2
        'awaiting_shipment',      # Stage 3
        'shipped'                 # Stage 4 (final)
    ]

    print(f"\nCore business stages: {CORE_STAGES}")

    # Filter for recent shipped orders (last 60 days)
    cutoff_date = datetime.now() - timedelta(days=60)
    recent_shipped_orders = order_updates_df[
        (order_updates_df['Status'] == 'shipped') &
        (order_updates_df['Timestamp'] >= cutoff_date)
    ]['Order ID'].unique()

    print(f"\nRecent shipped orders (last 60 days): {len(recent_shipped_orders)}")

    # Find orders with creation data + core stage progression
    created_order_ids = set(orders_created_df['order_id'].tolist())
    complete_orders = []

    for order_id in recent_shipped_orders:
        # Must have creation data
        if order_id not in created_order_ids:
            continue

        # Get all updates for this order
        order_updates = order_updates_df[order_updates_df['Order ID'] == order_id].copy()
        order_updates = order_updates.sort_values('Timestamp')

        # Filter to only core business stages
        core_updates = order_updates[order_updates['Status'].isin(CORE_STAGES)].copy()

        # Must have at least 2 core stages (including shipped)
        if len(core_updates) < 2:
            continue

        # Must reach shipped status
        if 'shipped' not in core_updates['Status'].values:
            continue

        complete_orders.append({
            'order_id': order_id,
            'creation_date': orders_created_df[orders_created_df['order_id'] == order_id]['created_at'].iloc[0],
            'core_updates': core_updates
        })

    print(f"Orders with complete core flow: {len(complete_orders)}")

    # Analyze going back behavior (ONLY in core stages)
    going_back_orders = 0
    total_analyzed = len(complete_orders)

    print(f"\n=== CORE FLOW ANALYSIS (Sample Orders) ===")

    for i, order_info in enumerate(complete_orders[:10]):  # Show first 10
        order_id = order_info['order_id']
        core_updates = order_info['core_updates']

        # Track progression through core stages
        stage_progression = []
        for _, update in core_updates.iterrows():
            stage = update['Status']
            timestamp = update['Timestamp']
            stage_num = CORE_STAGES.index(stage) + 1
            stage_progression.append((stage_num, stage, timestamp))

        print(f"\nOrder {order_id}:")
        print(f"  Created: {order_info['creation_date']}")
        print(f"  Core progression:")

        # Check for going back (stage number decreases)
        has_going_back = False
        max_stage_reached = 0

        for stage_num, stage_name, timestamp in stage_progression:
            direction = ""
            if stage_num < max_stage_reached:
                has_going_back = True
                direction = " ← GOING BACK"
            elif stage_num > max_stage_reached:
                direction = " → FORWARD"

            max_stage_reached = max(max_stage_reached, stage_num)
            print(f"    {stage_num}. {stage_name} at {timestamp.strftime('%Y-%m-%d %H:%M')}{direction}")

        if has_going_back:
            going_back_orders += 1
            print(f"  *** ORDER WENT BACK IN CORE FLOW ***")

    # Calculate final metrics
    going_back_rate = (going_back_orders / total_analyzed * 100) if total_analyzed > 0 else 0

    print(f"\n=== FINAL CORE FLOW METRICS ===")
    print(f"Total orders analyzed: {total_analyzed}")
    print(f"Orders that went back in core flow: {going_back_orders}")
    print(f"Core flow going back rate: {going_back_rate:.2f}%")

    # Calculate stage timings for core flow
    print(f"\n=== CORE STAGE TIMING ANALYSIS ===")

    stage_timings = {
        'requirements_to_script': [],
        'script_to_shipment': [],
        'shipment_to_shipped': [],
        'creation_to_shipped': []
    }

    for order_info in complete_orders:
        core_updates = order_info['core_updates']
        creation_time = order_info['creation_date']

        # Find first occurrence of each core stage
        stage_times = {}
        for _, update in core_updates.iterrows():
            stage = update['Status']
            if stage not in stage_times:  # First occurrence only
                stage_times[stage] = update['Timestamp']

        # Calculate timings between core stages
        if 'awaiting_requirements' in stage_times and 'awaiting_script' in stage_times:
            hours = (stage_times['awaiting_script'] - stage_times['awaiting_requirements']).total_seconds() / 3600
            if 0 < hours < 720:  # Max 30 days
                stage_timings['requirements_to_script'].append(hours)

        if 'awaiting_script' in stage_times and 'awaiting_shipment' in stage_times:
            hours = (stage_times['awaiting_shipment'] - stage_times['awaiting_script']).total_seconds() / 3600
            if 0 < hours < 720:
                stage_timings['script_to_shipment'].append(hours)

        if 'awaiting_shipment' in stage_times and 'shipped' in stage_times:
            hours = (stage_times['shipped'] - stage_times['awaiting_shipment']).total_seconds() / 3600
            if 0 < hours < 720:
                stage_timings['shipment_to_shipped'].append(hours)

        if 'shipped' in stage_times:
            hours = (stage_times['shipped'] - creation_time).total_seconds() / 3600
            if 0 < hours < 720:
                stage_timings['creation_to_shipped'].append(hours)

    # Print timing results
    for stage, times in stage_timings.items():
        if times:
            avg_hours = sum(times) / len(times)
            print(f"  {stage}: {avg_hours:.2f} hours avg ({len(times)} samples)")
        else:
            print(f"  {stage}: No samples")

    # Return order IDs for App Script
    qualifying_order_ids = [str(int(order['order_id'])) for order in complete_orders]

    print(f"\n=== RECOMMENDATION FOR APP SCRIPT ===")
    print(f"Use these {len(qualifying_order_ids)} order IDs:")
    print(f"Order IDs: {qualifying_order_ids[:20]}{'...' if len(qualifying_order_ids) > 20 else ''}")

    return {
        'total_orders': total_analyzed,
        'going_back_orders': going_back_orders,
        'going_back_rate': going_back_rate,
        'qualifying_order_ids': qualifying_order_ids,
        'stage_timings': stage_timings
    }

if __name__ == "__main__":
    results = test_core_order_flow()