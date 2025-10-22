-- ============================================================================
-- CarePortals MySQL Database - Complete DDL Script
-- ============================================================================
-- Version: 1.0
-- Date: 2025-10-22
-- Purpose: Create complete MySQL database schema for CarePortals healthcare system
-- Source: Database_CarePortals.xlsx
-- ============================================================================

-- Drop database if exists (CAUTION: Use only for fresh installations)
-- DROP DATABASE IF EXISTS careportals_db;

-- Create database
CREATE DATABASE IF NOT EXISTS careportals_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE careportals_db;

-- ============================================================================
-- CORE ENTITY TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Table: customers
-- Purpose: Master customer data with email deduplication
-- ----------------------------------------------------------------------------
CREATE TABLE customers (
    customer_id VARCHAR(255) NOT NULL COMMENT 'CarePortals customer._id',
    email VARCHAR(255) NOT NULL COMMENT 'Primary business key',
    first_name VARCHAR(100) NOT NULL COMMENT 'Customer first name',
    last_name VARCHAR(100) NOT NULL COMMENT 'Customer last name',
    phone BIGINT NOT NULL COMMENT 'Contact phone (digits only)',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation time',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update time',

    PRIMARY KEY (customer_id),
    UNIQUE KEY idx_email (email),
    KEY idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Master customer data with email deduplication';

-- ----------------------------------------------------------------------------
-- Table: addresses
-- Purpose: Normalized shipping addresses with MD5-based deduplication
-- ----------------------------------------------------------------------------
CREATE TABLE addresses (
    address_id CHAR(32) NOT NULL COMMENT 'MD5 hash of normalized address',
    address1 VARCHAR(255) NULL COMMENT 'Street address line 1',
    address2 VARCHAR(255) NULL COMMENT 'Street address line 2 (apt/suite)',
    city VARCHAR(100) NULL COMMENT 'City name',
    province_code CHAR(2) NULL COMMENT 'State/province code (US/CA)',
    postal_code VARCHAR(20) NULL COMMENT 'ZIP/postal code',
    country_code CHAR(2) NULL COMMENT 'ISO country code',

    PRIMARY KEY (address_id),
    KEY idx_province (province_code),
    KEY idx_postal (postal_code),
    KEY idx_province_postal (province_code, postal_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Normalized shipping addresses with MD5-based deduplication';

-- ----------------------------------------------------------------------------
-- Table: products
-- Purpose: Product catalog with pricing and subscription details
-- ----------------------------------------------------------------------------
CREATE TABLE products (
    product_id VARCHAR(255) NOT NULL COMMENT 'Product identifier',
    short_name VARCHAR(100) NULL COMMENT 'Dashboard display name',
    label VARCHAR(255) NULL COMMENT 'Full product name',
    sub_label VARCHAR(255) NULL COMMENT 'Product subtitle',
    drug_name VARCHAR(255) NOT NULL COMMENT 'Medication compound name',
    list_price INT NOT NULL COMMENT 'Original price (cents)',
    sale_price INT NULL COMMENT 'Current sale price (cents)',
    sale_cycle_duration INT NULL COMMENT 'Prepaid period duration (orders)',
    renewal_price INT NULL COMMENT 'Subscription renewal price (cents)',
    renewal_cycle_duration INT NOT NULL COMMENT 'Renewal frequency (days)',
    active BOOLEAN DEFAULT TRUE COMMENT 'Product availability flag',
    direct_cart_link TEXT NULL COMMENT 'Direct purchase URL',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation time',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update time',

    PRIMARY KEY (product_id),
    KEY idx_active (active),
    KEY idx_short_name (short_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Product catalog with pricing and subscription details';

-- ----------------------------------------------------------------------------
-- Table: coupons
-- Purpose: Discount code management
-- ----------------------------------------------------------------------------
CREATE TABLE coupons (
    coupon_code VARCHAR(50) NOT NULL COMMENT 'Coupon code identifier',
    reduction_amount INT NOT NULL COMMENT 'Discount value (cents or percentage)',
    reduction_type ENUM('dollar','percent') NULL COMMENT 'Discount type',
    description TEXT NOT NULL COMMENT 'Coupon description',
    active BOOLEAN DEFAULT TRUE COMMENT 'Coupon validity flag',
    valid_from TIMESTAMP NULL COMMENT 'Start date of validity',
    valid_until TIMESTAMP NULL COMMENT 'End date of validity',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation time',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update time',

    PRIMARY KEY (coupon_code),
    KEY idx_active_valid (active, valid_from, valid_until)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Discount code management';

-- ----------------------------------------------------------------------------
-- Table: orders
-- Purpose: Complete order records with foreign key relationships
-- ----------------------------------------------------------------------------
CREATE TABLE orders (
    order_id BIGINT NOT NULL COMMENT 'Customer-facing order ID (4-digit+)',
    care_portals_internal_order_id VARCHAR(255) NOT NULL COMMENT 'Internal EMR order ID',
    customer_id VARCHAR(255) NOT NULL COMMENT 'References customers(customer_id)',
    shipping_address_id CHAR(32) NULL COMMENT 'References addresses(address_id)',
    product_id VARCHAR(255) NULL COMMENT 'References products(product_id)',
    coupon_code VARCHAR(50) NULL COMMENT 'References coupons(coupon_code)',
    source VARCHAR(50) NOT NULL COMMENT 'Order source channel',
    total_amount INT NOT NULL COMMENT 'Final order total (cents)',
    discount_amount INT NOT NULL DEFAULT 0 COMMENT 'Total discounts applied (cents)',
    base_amount INT NOT NULL COMMENT 'Pre-discount amount (cents)',
    credit_used_amount INT NOT NULL DEFAULT 0 COMMENT 'Store credit applied (cents)',
    discount_reduction_amount INT NOT NULL DEFAULT 0 COMMENT 'Line item discount (cents)',
    discount_reduction_type VARCHAR(20) NULL COMMENT 'Line item discount type',
    pharmacy_assigned VARCHAR(50) NULL COMMENT 'Pharmacy routing assignment',
    created_at TIMESTAMP NOT NULL COMMENT 'Order creation timestamp',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update time',

    PRIMARY KEY (order_id),
    UNIQUE KEY idx_internal_order_id (care_portals_internal_order_id),
    KEY idx_customer_id (customer_id),
    KEY idx_product_id (product_id),
    KEY idx_source (source),
    KEY idx_pharmacy (pharmacy_assigned),
    KEY idx_created_at (created_at),
    KEY idx_customer_created (customer_id, created_at),

    CONSTRAINT fk_orders_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers(customer_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_orders_address
        FOREIGN KEY (shipping_address_id)
        REFERENCES addresses(address_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT fk_orders_product
        FOREIGN KEY (product_id)
        REFERENCES products(product_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT fk_orders_coupon
        FOREIGN KEY (coupon_code)
        REFERENCES coupons(coupon_code)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT check_total_amount CHECK (total_amount >= 0),
    CONSTRAINT check_base_amount CHECK (base_amount >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Complete order records with foreign key relationships';

-- ============================================================================
-- PAYMENT SYSTEM TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Table: payments
-- Purpose: Stripe payment tracking with real-time webhook processing
-- ----------------------------------------------------------------------------
CREATE TABLE payments (
    payment_id BIGINT AUTO_INCREMENT COMMENT 'Internal payment ID',
    charge_id VARCHAR(255) NOT NULL COMMENT 'Stripe charge ID (ch_* or py_*)',
    payment_intent_id VARCHAR(255) NOT NULL COMMENT 'Stripe payment intent ID',
    order_id BIGINT NOT NULL COMMENT 'References orders(order_id)',
    stripe_customer_id VARCHAR(255) NOT NULL COMMENT 'Stripe customer ID',
    payment_method_id VARCHAR(255) NULL COMMENT 'Stripe payment method ID',
    amount INT NOT NULL COMMENT 'Payment amount (cents)',
    currency CHAR(3) NOT NULL COMMENT 'Currency code (USD)',
    card_last4 CHAR(4) NULL COMMENT 'Last 4 digits of card',
    card_brand VARCHAR(20) NULL COMMENT 'Card brand (visa, mastercard)',
    status VARCHAR(20) NOT NULL COMMENT 'Payment status',
    description TEXT NULL COMMENT 'Payment description',
    application_fee_amount INT DEFAULT 0 COMMENT 'Stripe processing fees (cents)',
    created_at TIMESTAMP NOT NULL COMMENT 'Payment processing time',
    webhook_received_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Webhook processing time',

    PRIMARY KEY (payment_id),
    UNIQUE KEY idx_charge_id (charge_id),
    UNIQUE KEY idx_payment_intent (payment_intent_id),
    KEY idx_order_id (order_id),
    KEY idx_stripe_customer (stripe_customer_id),
    KEY idx_status (status),
    KEY idx_created_at (created_at),

    CONSTRAINT fk_payments_order
        FOREIGN KEY (order_id)
        REFERENCES orders(order_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Stripe payment tracking with real-time webhook processing';

-- ----------------------------------------------------------------------------
-- Table: refunds
-- Purpose: Stripe refund tracking with real-time webhook processing
-- ----------------------------------------------------------------------------
CREATE TABLE refunds (
    refund_id BIGINT AUTO_INCREMENT COMMENT 'Internal refund ID',
    stripe_refund_id VARCHAR(255) NOT NULL COMMENT 'Stripe refund ID (re_*)',
    charge_id VARCHAR(255) NOT NULL COMMENT 'References payments(charge_id)',
    payment_intent_id VARCHAR(255) NOT NULL COMMENT 'Associated payment intent',
    amount INT NOT NULL COMMENT 'Refund amount (cents)',
    currency CHAR(3) NOT NULL COMMENT 'Currency code (USD)',
    reason VARCHAR(255) NULL COMMENT 'Refund reason',
    status VARCHAR(20) NOT NULL COMMENT 'Refund status',
    created_at TIMESTAMP NOT NULL COMMENT 'Refund creation time',
    webhook_received_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Webhook processing time',

    PRIMARY KEY (refund_id),
    UNIQUE KEY idx_stripe_refund_id (stripe_refund_id),
    KEY idx_charge_id (charge_id),
    KEY idx_reason (reason),
    KEY idx_status (status),
    KEY idx_created_at (created_at),

    CONSTRAINT fk_refunds_payment
        FOREIGN KEY (charge_id)
        REFERENCES payments(charge_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Stripe refund tracking with real-time webhook processing';

-- ============================================================================
-- SUBSCRIPTION MANAGEMENT TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Table: subscriptions_active
-- Purpose: Currently active subscription records
-- ----------------------------------------------------------------------------
CREATE TABLE subscriptions_active (
    id BIGINT AUTO_INCREMENT COMMENT 'Internal subscription record ID',
    subscription_id VARCHAR(255) NOT NULL COMMENT 'Customer-facing subscription ID',
    customer_id VARCHAR(255) NULL COMMENT 'References customers(customer_id)',
    product_id VARCHAR(255) NULL COMMENT 'References products(product_id)',
    cycle INT NOT NULL COMMENT 'Current subscription cycle number',
    status VARCHAR(20) NOT NULL COMMENT 'Subscription status (active)',
    created_at TIMESTAMP NOT NULL COMMENT 'Subscription creation time',
    updated_at TIMESTAMP NULL COMMENT 'Last modification time',

    PRIMARY KEY (id),
    UNIQUE KEY idx_subscription_id (subscription_id),
    KEY idx_customer_id (customer_id),
    KEY idx_product_id (product_id),
    KEY idx_created_at (created_at),
    KEY idx_customer_product (customer_id, product_id),

    CONSTRAINT fk_subscriptions_active_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers(customer_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT fk_subscriptions_active_product
        FOREIGN KEY (product_id)
        REFERENCES products(product_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT check_active_cycle CHECK (cycle > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Currently active subscription records';

-- ----------------------------------------------------------------------------
-- Table: subscriptions_paused
-- Purpose: Temporarily paused subscription records
-- ----------------------------------------------------------------------------
CREATE TABLE subscriptions_paused (
    id BIGINT AUTO_INCREMENT COMMENT 'Internal subscription record ID',
    subscription_id VARCHAR(255) NOT NULL COMMENT 'Customer-facing subscription ID',
    customer_id VARCHAR(255) NULL COMMENT 'References customers(customer_id)',
    product_id VARCHAR(255) NULL COMMENT 'References products(product_id)',
    cycle INT NOT NULL COMMENT 'Current subscription cycle number',
    status VARCHAR(20) NOT NULL COMMENT 'Subscription status (paused)',
    created_at TIMESTAMP NOT NULL COMMENT 'Subscription creation time',
    updated_at TIMESTAMP NULL COMMENT 'Last modification time',

    PRIMARY KEY (id),
    UNIQUE KEY idx_subscription_id (subscription_id),
    KEY idx_customer_id (customer_id),
    KEY idx_product_id (product_id),
    KEY idx_created_at (created_at),
    KEY idx_customer_product (customer_id, product_id),

    CONSTRAINT fk_subscriptions_paused_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers(customer_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT fk_subscriptions_paused_product
        FOREIGN KEY (product_id)
        REFERENCES products(product_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT check_paused_cycle CHECK (cycle > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Temporarily paused subscription records';

-- ----------------------------------------------------------------------------
-- Table: subscriptions_cancelled
-- Purpose: Cancelled subscription records for churn analysis
-- ----------------------------------------------------------------------------
CREATE TABLE subscriptions_cancelled (
    id BIGINT AUTO_INCREMENT COMMENT 'Internal subscription record ID',
    subscription_id VARCHAR(255) NOT NULL COMMENT 'Customer-facing subscription ID',
    customer_id VARCHAR(255) NULL COMMENT 'References customers(customer_id)',
    product_id VARCHAR(255) NULL COMMENT 'References products(product_id)',
    cycle INT NOT NULL COMMENT 'Current subscription cycle number',
    status VARCHAR(20) NOT NULL COMMENT 'Subscription status (cancelled)',
    created_at TIMESTAMP NOT NULL COMMENT 'Subscription creation time',
    updated_at TIMESTAMP NULL COMMENT 'Last modification time',

    PRIMARY KEY (id),
    UNIQUE KEY idx_subscription_id (subscription_id),
    KEY idx_customer_id (customer_id),
    KEY idx_product_id (product_id),
    KEY idx_created_at (created_at),
    KEY idx_customer_product (customer_id, product_id),

    CONSTRAINT fk_subscriptions_cancelled_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers(customer_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT fk_subscriptions_cancelled_product
        FOREIGN KEY (product_id)
        REFERENCES products(product_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT check_cancelled_cycle CHECK (cycle > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Cancelled subscription records for churn analysis';

-- ----------------------------------------------------------------------------
-- Table: subscriptions_audit_log
-- Purpose: Complete subscription lifecycle audit trail
-- ----------------------------------------------------------------------------
CREATE TABLE subscriptions_audit_log (
    log_id BIGINT AUTO_INCREMENT COMMENT 'Audit log entry ID',
    subscription_id VARCHAR(255) NOT NULL COMMENT 'Subscription identifier',
    customer_id VARCHAR(255) NULL COMMENT 'Customer identifier',
    product_id VARCHAR(255) NULL COMMENT 'Product identifier',
    cycle INT NOT NULL COMMENT 'Subscription cycle at event',
    status VARCHAR(20) NOT NULL COMMENT 'Subscription status',
    trigger_type VARCHAR(50) NOT NULL COMMENT 'Event that triggered log',
    created_at TIMESTAMP NOT NULL COMMENT 'Original subscription creation',
    updated_at TIMESTAMP NOT NULL COMMENT 'Update timestamp',
    webhook_received_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Webhook processing time',
    raw_data JSON NULL COMMENT 'Complete webhook payload',

    PRIMARY KEY (log_id),
    KEY idx_subscription_id (subscription_id),
    KEY idx_customer_id (customer_id),
    KEY idx_status (status),
    KEY idx_trigger_type (trigger_type),
    KEY idx_webhook_received (webhook_received_at),
    KEY idx_subscription_received (subscription_id, webhook_received_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Complete subscription lifecycle audit trail - IMMUTABLE';

-- ============================================================================
-- ORDER TRACKING TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Table: order_status_updates
-- Purpose: Real-time order status tracking and lifecycle management
-- ----------------------------------------------------------------------------
CREATE TABLE order_status_updates (
    update_id BIGINT AUTO_INCREMENT COMMENT 'Status update record ID',
    order_id BIGINT NOT NULL COMMENT 'References orders(order_id)',
    updated_status VARCHAR(50) NOT NULL COMMENT 'New order status',
    order_created_at TIMESTAMP NOT NULL COMMENT 'Original order creation',
    status_updated_at TIMESTAMP NOT NULL COMMENT 'Status change timestamp',
    webhook_received_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Webhook processing time',

    PRIMARY KEY (update_id),
    KEY idx_order_id (order_id),
    KEY idx_updated_status (updated_status),
    KEY idx_status_updated_at (status_updated_at),
    KEY idx_order_status_time (order_id, status_updated_at),

    CONSTRAINT fk_order_status_updates_order
        FOREIGN KEY (order_id)
        REFERENCES orders(order_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Real-time order status tracking and lifecycle management';

-- ----------------------------------------------------------------------------
-- Table: orders_cancelled
-- Purpose: Cancelled order tracking
-- ----------------------------------------------------------------------------
CREATE TABLE orders_cancelled (
    cancellation_id BIGINT AUTO_INCREMENT COMMENT 'Cancellation record ID',
    order_id BIGINT NOT NULL COMMENT 'References orders(order_id)',
    cancelled_at TIMESTAMP NOT NULL COMMENT 'Cancellation timestamp',

    PRIMARY KEY (cancellation_id),
    UNIQUE KEY idx_order_id (order_id),
    KEY idx_cancelled_at (cancelled_at),

    CONSTRAINT fk_orders_cancelled_order
        FOREIGN KEY (order_id)
        REFERENCES orders(order_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Cancelled order tracking';

-- ============================================================================
-- QUESTIONNAIRE TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Table: questionnaire_responses
-- Purpose: Questionnaire form structure and answer data
-- ----------------------------------------------------------------------------
CREATE TABLE questionnaire_responses (
    response_id BIGINT AUTO_INCREMENT COMMENT 'Response record ID',
    questionnaire_id VARCHAR(100) NOT NULL COMMENT 'Questionnaire identifier',
    session_id VARCHAR(100) NOT NULL COMMENT 'Form session ID',
    question_index INT NOT NULL COMMENT 'Question position',
    question_type VARCHAR(50) NOT NULL COMMENT 'Question type',
    answer_data_type VARCHAR(50) NOT NULL COMMENT 'Answer format',
    answer_count INT NOT NULL COMMENT 'Number of answers',
    answers JSON NULL COMMENT 'Answer content',
    composite_key VARCHAR(255) NOT NULL COMMENT 'Unique question identifier',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Response timestamp',

    PRIMARY KEY (response_id),
    KEY idx_questionnaire_id (questionnaire_id),
    KEY idx_session_id (session_id),
    KEY idx_composite_key (composite_key),
    KEY idx_created_at (created_at),
    KEY idx_questionnaire_session (questionnaire_id, session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Questionnaire form structure and answer data';

-- ============================================================================
-- SYSTEM TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Table: webhook_logs
-- Purpose: System webhook processing audit trail
-- ----------------------------------------------------------------------------
CREATE TABLE webhook_logs (
    log_id BIGINT AUTO_INCREMENT COMMENT 'Log entry ID',
    webhook_type VARCHAR(50) NOT NULL COMMENT 'Type of webhook event',
    source_system VARCHAR(50) NOT NULL COMMENT 'Source (Stripe, CarePortals)',
    event_id VARCHAR(255) NULL COMMENT 'External event identifier',
    status ENUM('success','failed','pending') NOT NULL COMMENT 'Processing status',
    error_message TEXT NULL COMMENT 'Error details if failed',
    payload JSON NULL COMMENT 'Complete webhook payload',
    processing_time_ms INT NULL COMMENT 'Processing duration',
    received_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Webhook receipt time',

    PRIMARY KEY (log_id),
    KEY idx_webhook_type (webhook_type),
    KEY idx_source_system (source_system),
    KEY idx_event_id (event_id),
    KEY idx_status (status),
    KEY idx_received_at (received_at),
    KEY idx_type_status_received (webhook_type, status, received_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='System webhook processing audit trail - IMMUTABLE';

-- ----------------------------------------------------------------------------
-- Table: error_logs
-- Purpose: System error tracking and debugging
-- ----------------------------------------------------------------------------
CREATE TABLE error_logs (
    error_id BIGINT AUTO_INCREMENT COMMENT 'Error record ID',
    error_type VARCHAR(100) NOT NULL COMMENT 'Error classification',
    error_message TEXT NOT NULL COMMENT 'Detailed error description',
    raw_data JSON NULL COMMENT 'Data that caused error',
    trigger_source VARCHAR(100) NULL COMMENT 'Event/process that triggered error',
    stack_trace TEXT NULL COMMENT 'Error stack trace',
    occurred_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Error occurrence time',

    PRIMARY KEY (error_id),
    KEY idx_error_type (error_type),
    KEY idx_trigger_source (trigger_source),
    KEY idx_occurred_at (occurred_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='System error tracking and debugging - IMMUTABLE';

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- View: v_customer_orders
-- Purpose: Simplified customer order history
-- ----------------------------------------------------------------------------
CREATE VIEW v_customer_orders AS
SELECT
    o.order_id,
    o.care_portals_internal_order_id,
    o.created_at as order_date,
    c.customer_id,
    c.email,
    c.first_name,
    c.last_name,
    p.short_name as product_name,
    o.total_amount / 100.0 as total_amount_dollars,
    o.source,
    o.pharmacy_assigned
FROM orders o
INNER JOIN customers c ON o.customer_id = c.customer_id
LEFT JOIN products p ON o.product_id = p.product_id;

-- ----------------------------------------------------------------------------
-- View: v_order_payment_status
-- Purpose: Order payment and refund summary
-- ----------------------------------------------------------------------------
CREATE VIEW v_order_payment_status AS
SELECT
    o.order_id,
    o.total_amount / 100.0 as order_total_dollars,
    COALESCE(pm.amount / 100.0, 0) as payment_amount_dollars,
    COALESCE(SUM(r.amount) / 100.0, 0) as total_refunded_dollars,
    COALESCE(pm.amount / 100.0, 0) - COALESCE(SUM(r.amount) / 100.0, 0) as net_payment_dollars,
    pm.status as payment_status,
    pm.created_at as payment_date
FROM orders o
LEFT JOIN payments pm ON o.order_id = pm.order_id
LEFT JOIN refunds r ON pm.charge_id = r.charge_id
GROUP BY o.order_id, o.total_amount, pm.amount, pm.status, pm.created_at;

-- ----------------------------------------------------------------------------
-- View: v_active_subscriptions
-- Purpose: Current subscription status with customer and product details
-- ----------------------------------------------------------------------------
CREATE VIEW v_active_subscriptions AS
SELECT
    s.subscription_id,
    s.cycle,
    s.created_at as subscription_start_date,
    s.updated_at as last_update,
    c.customer_id,
    c.email,
    c.first_name,
    c.last_name,
    p.short_name as product_name,
    p.renewal_price / 100.0 as renewal_price_dollars,
    p.renewal_cycle_duration as renewal_days
FROM subscriptions_active s
INNER JOIN customers c ON s.customer_id = c.customer_id
INNER JOIN products p ON s.product_id = p.product_id;

-- ============================================================================
-- STORED PROCEDURES
-- ============================================================================

DELIMITER //

-- ----------------------------------------------------------------------------
-- Procedure: sp_get_customer_clv
-- Purpose: Calculate Customer Lifetime Value for a specific customer
-- ----------------------------------------------------------------------------
CREATE PROCEDURE sp_get_customer_clv(
    IN p_customer_id VARCHAR(255)
)
BEGIN
    SELECT
        c.customer_id,
        c.email,
        c.first_name,
        c.last_name,
        COUNT(DISTINCT o.order_id) as total_orders,
        SUM(o.total_amount) / 100.0 as total_revenue_dollars,
        COALESCE(SUM(r.amount) / 100.0, 0) as total_refunded_dollars,
        (SUM(o.total_amount) - COALESCE(SUM(r.amount), 0)) / 100.0 as net_clv_dollars,
        MIN(o.created_at) as first_order_date,
        MAX(o.created_at) as last_order_date,
        DATEDIFF(MAX(o.created_at), MIN(o.created_at)) as customer_lifetime_days
    FROM customers c
    LEFT JOIN orders o ON c.customer_id = o.customer_id
    LEFT JOIN payments pm ON o.order_id = pm.order_id
    LEFT JOIN refunds r ON pm.charge_id = r.charge_id
    WHERE c.customer_id = p_customer_id
    GROUP BY c.customer_id, c.email, c.first_name, c.last_name;
END//

-- ----------------------------------------------------------------------------
-- Procedure: sp_get_order_lifecycle
-- Purpose: Get complete lifecycle timeline for an order
-- ----------------------------------------------------------------------------
CREATE PROCEDURE sp_get_order_lifecycle(
    IN p_order_id BIGINT
)
BEGIN
    SELECT
        o.order_id,
        o.created_at as order_created,
        osu.updated_status,
        osu.status_updated_at,
        TIMESTAMPDIFF(HOUR, o.created_at, osu.status_updated_at) as hours_from_creation,
        TIMESTAMPDIFF(HOUR,
            LAG(osu.status_updated_at) OVER (ORDER BY osu.status_updated_at),
            osu.status_updated_at
        ) as hours_in_previous_status
    FROM orders o
    LEFT JOIN order_status_updates osu ON o.order_id = osu.order_id
    WHERE o.order_id = p_order_id
    ORDER BY osu.status_updated_at;
END//

DELIMITER ;

-- ============================================================================
-- INITIAL DATA VALIDATION QUERIES
-- ============================================================================

-- These queries should be run after data migration to validate integrity

-- Orphaned orders (missing customer)
-- SELECT 'Orphaned Orders' as issue, COUNT(*) as count
-- FROM orders o LEFT JOIN customers c ON o.customer_id = c.customer_id
-- WHERE c.customer_id IS NULL;

-- Payment amount mismatches
-- SELECT 'Payment Mismatches' as issue, COUNT(*) as count
-- FROM orders o INNER JOIN payments p ON o.order_id = p.order_id
-- WHERE o.total_amount != p.amount;

-- Subscriptions without customers
-- SELECT 'Orphaned Subscriptions' as issue, COUNT(*) as count
-- FROM subscriptions_active s LEFT JOIN customers c ON s.customer_id = c.customer_id
-- WHERE s.customer_id IS NOT NULL AND c.customer_id IS NULL;

-- ============================================================================
-- GRANTS AND PERMISSIONS (Example - adjust as needed)
-- ============================================================================

-- Application user
-- CREATE USER 'careportals_app'@'%' IDENTIFIED BY 'SECURE_PASSWORD_HERE';
-- GRANT SELECT, INSERT, UPDATE ON careportals_db.* TO 'careportals_app'@'%';
-- REVOKE DELETE ON careportals_db.payments FROM 'careportals_app'@'%';
-- REVOKE DELETE ON careportals_db.refunds FROM 'careportals_app'@'%';
-- REVOKE DELETE ON careportals_db.subscriptions_audit_log FROM 'careportals_app'@'%';
-- REVOKE DELETE ON careportals_db.webhook_logs FROM 'careportals_app'@'%';
-- REVOKE DELETE ON careportals_db.error_logs FROM 'careportals_app'@'%';

-- Read-only analyst user
-- CREATE USER 'careportals_analyst'@'%' IDENTIFIED BY 'SECURE_PASSWORD_HERE';
-- GRANT SELECT ON careportals_db.* TO 'careportals_analyst'@'%';

-- Admin user
-- CREATE USER 'careportals_admin'@'localhost' IDENTIFIED BY 'SECURE_PASSWORD_HERE';
-- GRANT ALL PRIVILEGES ON careportals_db.* TO 'careportals_admin'@'localhost';

-- ============================================================================
-- END OF DDL SCRIPT
-- ============================================================================

-- To verify table creation:
-- SHOW TABLES;
-- SHOW CREATE TABLE orders;
-- SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'careportals_db';
