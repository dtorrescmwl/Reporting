#!/usr/bin/env python3
"""
Stripe Data Validation Script

This script analyzes the stripe webhook data to identify missing fields,
data quality issues, and provides recommendations for improvement.
"""

import pandas as pd
import json
from datetime import datetime, timedelta
import sys
import os

def analyze_stripe_webhook_data(charges_file, refunds_file):
    """
    Analyze stripe webhook data for completeness and quality issues.
    """
    print("🔍 Analyzing Stripe Webhook Data Quality")
    print("=" * 50)

    # Load data
    try:
        charges_df = pd.read_csv(charges_file)
        print(f"✅ Loaded {len(charges_df)} charge records")
    except Exception as e:
        print(f"❌ Error loading charges: {e}")
        charges_df = pd.DataFrame()

    try:
        refunds_df = pd.read_csv(refunds_file)
        print(f"✅ Loaded {len(refunds_df)} refund records")
    except Exception as e:
        print(f"❌ Error loading refunds: {e}")
        refunds_df = pd.DataFrame()

    print()

    # Analyze charges data
    if not charges_df.empty:
        analyze_charges_data(charges_df)
    else:
        print("⚠️  No charges data to analyze")

    print()

    # Analyze refunds data
    if not refunds_df.empty:
        analyze_refunds_data(refunds_df)
    else:
        print("⚠️  No refunds data to analyze")

    print()

    # Cross-reference analysis
    if not charges_df.empty and not refunds_df.empty:
        analyze_cross_references(charges_df, refunds_df)

def analyze_charges_data(df):
    """
    Analyze charges data for missing fields and quality issues.
    """
    print("💳 CHARGES DATA ANALYSIS")
    print("-" * 30)

    total_records = len(df)

    # Check for missing critical fields
    critical_fields = ['charge_id', 'payment_intent_id', 'amount', 'status', 'datetime']
    missing_analysis = {}

    for field in critical_fields:
        if field in df.columns:
            missing_count = df[field].isna().sum() + (df[field] == '').sum()
            missing_pct = (missing_count / total_records) * 100
            missing_analysis[field] = {'count': missing_count, 'percentage': missing_pct}

            if missing_count > 0:
                print(f"⚠️  {field}: {missing_count} missing ({missing_pct:.1f}%)")
            else:
                print(f"✅ {field}: Complete")
        else:
            print(f"❌ {field}: Column not found")

    print()

    # Check optional but useful fields
    optional_fields = ['order_number', 'customer_id', 'card_last4', 'card_brand', 'description']
    print("📋 Optional Field Completeness:")

    for field in optional_fields:
        if field in df.columns:
            missing_count = df[field].isna().sum() + (df[field] == '').sum()
            missing_pct = (missing_count / total_records) * 100
            print(f"   {field}: {total_records - missing_count}/{total_records} ({100-missing_pct:.1f}% complete)")
        else:
            print(f"   {field}: Column not found")

    print()

    # Analyze data patterns
    if 'amount' in df.columns:
        amounts = pd.to_numeric(df['amount'], errors='coerce')
        print(f"💰 Amount Analysis:")
        print(f"   Range: ${amounts.min():.2f} - ${amounts.max():.2f}")
        print(f"   Average: ${amounts.mean():.2f}")
        print(f"   Zero amounts: {(amounts == 0).sum()}")

    if 'status' in df.columns:
        status_counts = df['status'].value_counts()
        print(f"📊 Status Distribution:")
        for status, count in status_counts.items():
            print(f"   {status}: {count}")

    if 'datetime' in df.columns:
        analyze_datetime_field(df, 'datetime', 'charges')

def analyze_refunds_data(df):
    """
    Analyze refunds data for missing fields and quality issues.
    """
    print("💸 REFUNDS DATA ANALYSIS")
    print("-" * 30)

    total_records = len(df)

    # Check for missing critical fields
    critical_fields = ['refund_id', 'charge_id', 'amount', 'status', 'datetime']

    for field in critical_fields:
        if field in df.columns:
            missing_count = df[field].isna().sum() + (df[field] == '').sum()
            missing_pct = (missing_count / total_records) * 100

            if missing_count > 0:
                print(f"⚠️  {field}: {missing_count} missing ({missing_pct:.1f}%)")
            else:
                print(f"✅ {field}: Complete")
        else:
            print(f"❌ {field}: Column not found")

    print()

    # Check optional fields
    optional_fields = ['reason', 'payment_intent_id']
    print("📋 Optional Field Completeness:")

    for field in optional_fields:
        if field in df.columns:
            missing_count = df[field].isna().sum() + (df[field] == '').sum()
            missing_pct = (missing_count / total_records) * 100
            print(f"   {field}: {total_records - missing_count}/{total_records} ({100-missing_pct:.1f}% complete)")

    print()

    # Analyze refund patterns
    if 'amount' in df.columns:
        amounts = pd.to_numeric(df['amount'], errors='coerce')
        print(f"💰 Refund Amount Analysis:")
        print(f"   Range: ${amounts.min():.2f} - ${amounts.max():.2f}")
        print(f"   Average: ${amounts.mean():.2f}")
        print(f"   Total refunded: ${amounts.sum():.2f}")

    if 'reason' in df.columns:
        reason_counts = df['reason'].value_counts()
        print(f"📊 Refund Reasons:")
        for reason, count in reason_counts.items():
            if pd.notna(reason) and reason != '':
                print(f"   {reason}: {count}")

    if 'datetime' in df.columns:
        analyze_datetime_field(df, 'datetime', 'refunds')

def analyze_datetime_field(df, field, data_type):
    """
    Analyze datetime field for patterns and issues.
    """
    print(f"📅 {data_type.title()} Datetime Analysis:")

    try:
        # Try to parse datetimes
        dt_series = pd.to_datetime(df[field], errors='coerce')
        valid_dates = dt_series.dropna()

        if len(valid_dates) > 0:
            print(f"   Valid dates: {len(valid_dates)}/{len(df)}")
            print(f"   Date range: {valid_dates.min()} to {valid_dates.max()}")

            # Check for recent activity
            now = datetime.now()
            recent = valid_dates[valid_dates > (now - timedelta(days=7))]
            print(f"   Recent (last 7 days): {len(recent)}")

            # Check for timezone issues
            sample_dates = valid_dates.head(3)
            print(f"   Sample dates: {list(sample_dates.dt.strftime('%Y-%m-%d %H:%M:%S'))}")
        else:
            print(f"   ❌ No valid dates found")

    except Exception as e:
        print(f"   ❌ Error parsing dates: {e}")

def analyze_cross_references(charges_df, refunds_df):
    """
    Analyze relationships between charges and refunds.
    """
    print("🔗 CROSS-REFERENCE ANALYSIS")
    print("-" * 30)

    # Check charge_id relationships
    if 'charge_id' in charges_df.columns and 'charge_id' in refunds_df.columns:
        charge_ids_in_charges = set(charges_df['charge_id'].dropna())
        charge_ids_in_refunds = set(refunds_df['charge_id'].dropna())

        matched_charges = charge_ids_in_refunds.intersection(charge_ids_in_charges)
        unmatched_refunds = charge_ids_in_refunds - charge_ids_in_charges

        print(f"💳 Charge ID Matching:")
        print(f"   Total unique charges: {len(charge_ids_in_charges)}")
        print(f"   Total refunds: {len(refunds_df)}")
        print(f"   Refunds with matching charges: {len(matched_charges)}")
        print(f"   Orphaned refunds: {len(unmatched_refunds)}")

        if unmatched_refunds:
            print(f"   ⚠️  Sample orphaned refund charge_ids: {list(unmatched_refunds)[:5]}")

    print()

    # Check payment_intent_id relationships
    if 'payment_intent_id' in charges_df.columns and 'payment_intent_id' in refunds_df.columns:
        pi_ids_in_charges = set(charges_df['payment_intent_id'].dropna())
        pi_ids_in_refunds = set(refunds_df['payment_intent_id'].dropna())

        matched_pis = pi_ids_in_refunds.intersection(pi_ids_in_charges)

        print(f"🔄 Payment Intent ID Matching:")
        print(f"   Payment intents in charges: {len(pi_ids_in_charges)}")
        print(f"   Payment intents in refunds: {len(pi_ids_in_refunds)}")
        print(f"   Matched payment intents: {len(matched_pis)}")

def check_webhook_completeness():
    """
    Check if webhook data appears complete based on expected patterns.
    """
    print("🔍 WEBHOOK COMPLETENESS CHECK")
    print("-" * 30)

    print("Expected webhook behavior:")
    print("✅ Every successful payment should create a charge record")
    print("✅ Every refund should reference an existing charge")
    print("✅ Timestamps should be recent and in Eastern time")
    print("✅ Order numbers should link to CarePortals orders")
    print("✅ Amounts should be positive and realistic")
    print()

    print("Common issues with partial webhook data:")
    print("❌ Missing charge_id (indicates webhook processing error)")
    print("❌ Missing order_number (metadata not captured)")
    print("❌ Missing customer_id (customer data not included)")
    print("❌ UTC timestamps (timezone conversion not working)")
    print("❌ Missing card details (payment method data not extracted)")

def generate_recommendations(charges_file, refunds_file):
    """
    Generate recommendations for improving webhook data quality.
    """
    print("\n🎯 RECOMMENDATIONS")
    print("=" * 50)

    print("1. 🔧 WEBHOOK FIXES:")
    print("   - Redeploy Google Apps Script with the fixed version")
    print("   - Use the troubleshooting guide to fix deployment issues")
    print("   - Test webhook with Stripe test events")
    print()

    print("2. 📊 DATA IMPROVEMENTS:")
    print("   - Add webhook signature verification for security")
    print("   - Include more payment method details")
    print("   - Add better error handling and retry logic")
    print("   - Log processing timestamps for debugging")
    print()

    print("3. 🔍 MONITORING:")
    print("   - Set up alerts for webhook failures")
    print("   - Monitor data completeness daily")
    print("   - Check Stripe webhook event logs regularly")
    print("   - Validate order_number matching with CarePortals")
    print()

    print("4. 🛠️ IMMEDIATE ACTIONS:")
    print("   - Replace StripeTracking.js with StripeTracking_Fixed.js")
    print("   - Follow STRIPE_WEBHOOK_TROUBLESHOOTING.md guide")
    print("   - Test webhook endpoint with curl or Postman")
    print("   - Verify Google Apps Script execution logs")

def main():
    """
    Main function to run the analysis.
    """
    print("🔧 Stripe Webhook Data Validation Tool")
    print("=====================================")
    print()

    # Check if files exist
    charges_file = "Scripts/DataProcessing/Stripe/stripe_charges.csv"
    refunds_file = "Scripts/DataProcessing/Stripe/stripe_refunds.csv"

    # Check current directory
    if not os.path.exists(charges_file):
        charges_file = "stripe_charges.csv"
    if not os.path.exists(refunds_file):
        refunds_file = "stripe_refunds.csv"

    if os.path.exists(charges_file) or os.path.exists(refunds_file):
        analyze_stripe_webhook_data(charges_file, refunds_file)
    else:
        print("⚠️  CSV files not found. Generating general recommendations...")

    check_webhook_completeness()
    generate_recommendations(charges_file, refunds_file)

    print("\n" + "=" * 50)
    print("✅ Analysis complete!")
    print("📋 Next steps: Follow the troubleshooting guide to fix webhook issues")

if __name__ == "__main__":
    main()