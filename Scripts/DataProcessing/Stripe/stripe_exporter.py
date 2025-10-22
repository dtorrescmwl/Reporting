import stripe
import csv
import os
from datetime import datetime
from typing import List, Dict, Any
import time
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
STRIPE_API_KEY = os.getenv('STRIPE_API_KEY')
CHARGES_CSV_PATH = "stripe_charges.csv"  # Path where charges CSV will be saved
REFUNDS_CSV_PATH = "stripe_refunds.csv"  # Path where refunds CSV will be saved
RATE_LIMIT_DELAY = 0.1  # Delay between API calls to respect rate limits

# Initialize Stripe
stripe.api_key = STRIPE_API_KEY

def unix_to_datetime(unix_timestamp: int) -> str:
    """Convert Unix timestamp to readable datetime string."""
    return datetime.fromtimestamp(unix_timestamp).strftime('%Y-%m-%d %H:%M:%S')

def get_customer_email(customer_id: str) -> str:
    """Fetch customer email by customer ID."""
    try:
        if customer_id:
            customer = stripe.Customer.retrieve(customer_id)
            return customer.get('email', '') or ''
    except Exception as e:
        print(f"Error fetching customer {customer_id}: {e}")
    return ''

def extract_metadata_resource_id(metadata: Dict) -> str:
    """Extract resourceId from metadata if it exists."""
    if metadata and isinstance(metadata, dict):
        # Check both 'resourceId' and 'resourceID' variations
        return metadata.get('resourceId', metadata.get('resourceID', metadata.get('resource_id', '')))
    return ''

def safe_get_nested(obj, *keys, default=''):
    """Safely get nested attributes from an object."""
    try:
        for key in keys:
            if hasattr(obj, key):
                obj = getattr(obj, key)
            else:
                return default
        return obj if obj is not None else default
    except:
        return default

def get_all_charges() -> List[Dict[str, Any]]:
    """Fetch all successful charges from Stripe."""
    print("Fetching charges...")
    all_charges = []
    has_more = True
    starting_after = None
    
    while has_more:
        try:
            charges = stripe.Charge.list(
                limit=100,
                starting_after=starting_after,
            )
            
            # Filter for successful charges only
            successful_charges = [charge for charge in charges.data if charge.status == 'succeeded']
            
            for charge in successful_charges:
                # Extract payment method info safely
                payment_method_type = safe_get_nested(charge, 'payment_method_details', 'type')
                card_brand = safe_get_nested(charge, 'payment_method_details', 'card', 'brand')
                card_last4 = safe_get_nested(charge, 'payment_method_details', 'card', 'last4')
                
                transaction_data = {
                    'charge_id': charge.id,
                    'amount': charge.amount / 100,  # Convert from cents to dollars
                    'currency': charge.currency.upper(),
                    'status': charge.status,
                    'datetime': unix_to_datetime(charge.created),
                    'description': charge.description or '',
                    'customer_id': charge.customer or '',
                    'email': '',  # Will be populated later
                    'payment_method_type': payment_method_type,
                    'card_brand': card_brand,
                    'card_last4': card_last4,
                    'receipt_email': charge.receipt_email or '',
                    'statement_descriptor': charge.statement_descriptor or '',
                    'calculated_statement_descriptor': safe_get_nested(charge, 'calculated_statement_descriptor'),
                    'metadata_resource_id': extract_metadata_resource_id(charge.metadata),
                    'metadata': str(dict(charge.metadata)) if charge.metadata else '',
                    'refunded': charge.refunded,
                    'amount_refunded': charge.amount_refunded / 100 if charge.amount_refunded else 0,
                    'payment_intent_id': charge.payment_intent or '',
                    'payment_method_id': charge.payment_method or '',
                    'balance_transaction': safe_get_nested(charge, 'balance_transaction'),
                    'application_fee_amount': charge.application_fee_amount / 100 if charge.application_fee_amount else 0,
                    'failure_code': charge.failure_code or '',
                    'failure_message': charge.failure_message or '',
                    'network_status': safe_get_nested(charge, 'outcome', 'network_status'),
                    'risk_level': safe_get_nested(charge, 'outcome', 'risk_level'),
                    'outcome_type': safe_get_nested(charge, 'outcome', 'type'),
                    'seller_message': safe_get_nested(charge, 'outcome', 'seller_message'),
                    'disputed': charge.disputed,
                    'billing_address_postal_code': safe_get_nested(charge, 'billing_details', 'address', 'postal_code'),
                    'receipt_url': safe_get_nested(charge, 'receipt_url'),
                }
                all_charges.append(transaction_data)
            
            has_more = charges.has_more
            if has_more and charges.data:
                starting_after = charges.data[-1].id
            
            print(f"Fetched {len(successful_charges)} charges (Total: {len(all_charges)})")
            time.sleep(RATE_LIMIT_DELAY)
            
        except Exception as e:
            print(f"Error fetching charges: {e}")
            import traceback
            traceback.print_exc()
            break
    
    return all_charges

def get_all_refunds() -> List[Dict[str, Any]]:
    """Fetch all refunds from Stripe."""
    print("Fetching refunds...")
    all_refunds = []
    has_more = True
    starting_after = None
    
    while has_more:
        try:
            refunds = stripe.Refund.list(
                limit=100,
                starting_after=starting_after,
            )
            
            for refund in refunds.data:
                # Get the original charge details for additional context
                original_charge = None
                charge_description = ''
                charge_metadata = {}
                customer_id = ''
                
                try:
                    original_charge = stripe.Charge.retrieve(refund.charge)
                    charge_description = original_charge.description or ''
                    charge_metadata = original_charge.metadata or {}
                    customer_id = original_charge.customer or ''
                except Exception as e:
                    print(f"Warning: Could not fetch original charge {refund.charge}: {e}")
                
                transaction_data = {
                    'refund_id': refund.id,
                    'charge_id': refund.charge,  # Links back to the original charge
                    'amount': refund.amount / 100,  # Positive amount for refunds
                    'currency': refund.currency.upper(),
                    'status': refund.status,
                    'datetime': unix_to_datetime(refund.created),
                    'reason': refund.reason or '',
                    'description': charge_description,  # From original charge
                    'customer_id': customer_id,  # From original charge
                    'email': '',  # Will be populated later
                    'receipt_number': safe_get_nested(refund, 'receipt_number'),
                    'balance_transaction': safe_get_nested(refund, 'balance_transaction'),
                    'payment_intent_id': safe_get_nested(refund, 'payment_intent'),
                    'metadata_resource_id': extract_metadata_resource_id(charge_metadata),
                    'metadata': str(dict(charge_metadata)) if charge_metadata else '',
                    'refund_metadata': str(dict(refund.metadata)) if refund.metadata else '',
                    'destination_details_type': safe_get_nested(refund, 'destination_details', 'type'),
                    'destination_reference_status': safe_get_nested(refund, 'destination_details', 'card', 'reference_status'),
                }
                all_refunds.append(transaction_data)
            
            has_more = refunds.has_more
            if has_more and refunds.data:
                starting_after = refunds.data[-1].id
            
            print(f"Fetched {len(refunds.data)} refunds (Total: {len(all_refunds)})")
            time.sleep(RATE_LIMIT_DELAY)
            
        except Exception as e:
            print(f"Error fetching refunds: {e}")
            import traceback
            traceback.print_exc()
            break
    
    return all_refunds

def populate_customer_emails(transactions: List[Dict[str, Any]]) -> None:
    """Populate email addresses for transactions with customer IDs."""
    print("Populating customer emails...")
    customer_cache = {}  # Cache to avoid duplicate API calls
    
    for transaction in transactions:
        customer_id = transaction.get('customer_id')
        if customer_id and not transaction.get('email'):
            if customer_id in customer_cache:
                transaction['email'] = customer_cache[customer_id]
            else:
                email = get_customer_email(customer_id)
                customer_cache[customer_id] = email
                transaction['email'] = email
                time.sleep(RATE_LIMIT_DELAY)
        
        # Use receipt_email if no customer email found
        if not transaction['email'] and transaction.get('receipt_email'):
            transaction['email'] = transaction['receipt_email']

def save_charges_to_csv(charges: List[Dict[str, Any]], file_path: str) -> None:
    """Save charges to CSV file."""
    if not charges:
        print("No charges to save.")
        return
    
    # Define CSV headers for charges
    headers = [
        'charge_id', 'amount', 'currency', 'status', 'datetime', 'description', 
        'customer_id', 'email', 'payment_method_type', 'card_brand', 'card_last4',
        'receipt_email', 'statement_descriptor', 'calculated_statement_descriptor',
        'metadata_resource_id', 'metadata', 'refunded', 'amount_refunded', 
        'payment_intent_id', 'payment_method_id', 'balance_transaction', 
        'application_fee_amount', 'failure_code', 'failure_message', 
        'network_status', 'risk_level', 'outcome_type', 'seller_message', 
        'disputed', 'billing_address_postal_code', 'receipt_url'
    ]
    
    try:
        with open(file_path, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=headers)
            writer.writeheader()
            
            for charge in charges:
                # Ensure all fields exist with default empty values
                row = {header: charge.get(header, '') for header in headers}
                writer.writerow(row)
        
        print(f"Successfully saved {len(charges)} charges to {file_path}")
        
    except Exception as e:
        print(f"Error saving charges CSV file: {e}")

def save_refunds_to_csv(refunds: List[Dict[str, Any]], file_path: str) -> None:
    """Save refunds to CSV file."""
    if not refunds:
        print("No refunds to save.")
        return
    
    # Define CSV headers for refunds
    headers = [
        'refund_id', 'charge_id', 'amount', 'currency', 'status', 'datetime', 
        'reason', 'description', 'customer_id', 'email', 'receipt_number', 
        'balance_transaction', 'payment_intent_id', 'metadata_resource_id', 
        'metadata', 'refund_metadata', 'destination_details_type', 
        'destination_reference_status'
    ]
    
    try:
        with open(file_path, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=headers)
            writer.writeheader()
            
            for refund in refunds:
                # Ensure all fields exist with default empty values
                row = {header: refund.get(header, '') for header in headers}
                writer.writerow(row)
        
        print(f"Successfully saved {len(refunds)} refunds to {file_path}")
        
    except Exception as e:
        print(f"Error saving refunds CSV file: {e}")

def main():
    """Main function to orchestrate the data extraction and CSV creation."""
    print("Starting Stripe transaction export...")
    print(f"API Key: {STRIPE_API_KEY[:12]}..." if len(STRIPE_API_KEY) > 12 else "API Key not set")
    
    # Validate API key
    if not STRIPE_API_KEY or STRIPE_API_KEY == "sk_test_your_api_key_here":
        print("ERROR: Please set your Stripe API key in the STRIPE_API_KEY variable.")
        return
    
    try:
        # Test API connection
        account = stripe.Account.retrieve()
        print(f"✓ Successfully connected to Stripe API (Account: {account.id})")
    except Exception as e:
        print(f"ERROR: Failed to connect to Stripe API: {e}")
        return
    
    # Fetch all data
    charges = get_all_charges()
    refunds = get_all_refunds()
    
    print(f"Total charges fetched: {len(charges)}")
    print(f"Total refunds fetched: {len(refunds)}")
    
    # Populate customer emails for both charges and refunds
    if charges:
        populate_customer_emails(charges)
        # Sort charges by datetime (most recent first)
        charges.sort(key=lambda x: x['datetime'], reverse=True)
    
    if refunds:
        populate_customer_emails(refunds)
        # Sort refunds by datetime (most recent first)
        refunds.sort(key=lambda x: x['datetime'], reverse=True)
    
    # Save to separate CSV files
    save_charges_to_csv(charges, CHARGES_CSV_PATH)
    save_refunds_to_csv(refunds, REFUNDS_CSV_PATH)
    
    # Print summary
    total_charge_amount = sum(charge['amount'] for charge in charges)
    total_refund_amount = sum(refund['amount'] for refund in refunds)
    
    print(f"\n=== EXPORT SUMMARY ===")
    print(f"Charges: {len(charges)} (Total: ${total_charge_amount:,.2f})")
    print(f"Refunds: {len(refunds)} (Total: ${total_refund_amount:,.2f})")
    print(f"Net Revenue: ${total_charge_amount - total_refund_amount:,.2f}")
    print(f"Charges CSV saved to: {os.path.abspath(CHARGES_CSV_PATH)}")
    print(f"Refunds CSV saved to: {os.path.abspath(REFUNDS_CSV_PATH)}")

if __name__ == "__main__":
    main()
