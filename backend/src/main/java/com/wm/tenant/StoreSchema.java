package com.wm.tenant;

import java.util.List;

/**
 * Online store ke tables (har website DB me — generic modules nahi, kyunki inka apna flow hai).
 * Products / categories / variants / coupons generic modules hain (ModuleRegistry, group "Store").
 * Paisa hamesha DECIMAL(12,2), order me product ka naam / price snapshot (baad me product badle to purana order na badle).
 */
public final class StoreSchema {

    private StoreSchema() {
    }

    public static final List<String> TABLES = List.of(
            """
            CREATE TABLE IF NOT EXISTS customers (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(150) NOT NULL,
                email VARCHAR(200) NOT NULL UNIQUE,
                phone VARCHAR(20) NULL,
                password_hash VARCHAR(100) NOT NULL,
                is_active TINYINT(1) NOT NULL DEFAULT 1,
                token_version INT NOT NULL DEFAULT 0,
                reset_token_hash VARCHAR(100) NULL,
                reset_expires DATETIME NULL,
                last_login DATETIME NULL,
                created_on DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            )""",
            """
            CREATE TABLE IF NOT EXISTS customer_addresses (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                customer_id BIGINT NOT NULL,
                name VARCHAR(150) NOT NULL,
                phone VARCHAR(20) NOT NULL,
                line1 VARCHAR(255) NOT NULL,
                line2 VARCHAR(255) NULL,
                city VARCHAR(100) NOT NULL,
                state VARCHAR(100) NOT NULL,
                pincode VARCHAR(10) NOT NULL,
                is_default TINYINT(1) NOT NULL DEFAULT 0,
                created_on DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_addr_customer (customer_id)
            )""",
            """
            CREATE TABLE IF NOT EXISTS wishlist (
                customer_id BIGINT NOT NULL,
                product_id BIGINT NOT NULL,
                created_on DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (customer_id, product_id)
            )""",
            """
            CREATE TABLE IF NOT EXISTS orders (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                order_no VARCHAR(40) NULL UNIQUE,
                customer_id BIGINT NOT NULL,
                status VARCHAR(20) NOT NULL,
                payment_method VARCHAR(20) NOT NULL,
                payment_status VARCHAR(20) NOT NULL,
                subtotal DECIMAL(12,2) NOT NULL,
                discount DECIMAL(12,2) NOT NULL DEFAULT 0,
                coupon_code VARCHAR(40) NULL,
                tax DECIMAL(12,2) NOT NULL DEFAULT 0,
                prices_include_tax TINYINT(1) NOT NULL DEFAULT 1,
                shipping DECIMAL(12,2) NOT NULL DEFAULT 0,
                cod_fee DECIMAL(12,2) NOT NULL DEFAULT 0,
                total DECIMAL(12,2) NOT NULL,
                ship_name VARCHAR(150) NOT NULL,
                ship_phone VARCHAR(20) NOT NULL,
                ship_email VARCHAR(200) NOT NULL,
                ship_line1 VARCHAR(255) NOT NULL,
                ship_line2 VARCHAR(255) NULL,
                ship_city VARCHAR(100) NOT NULL,
                ship_state VARCHAR(100) NOT NULL,
                ship_pincode VARCHAR(10) NOT NULL,
                notes VARCHAR(500) NULL,
                razorpay_order_id VARCHAR(60) NULL,
                razorpay_payment_id VARCHAR(60) NULL,
                courier VARCHAR(100) NULL,
                tracking_no VARCHAR(100) NULL,
                tracking_url VARCHAR(500) NULL,
                cancel_reason VARCHAR(500) NULL,
                paid_on DATETIME NULL,
                created_on DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_on DATETIME NULL,
                INDEX idx_orders_customer (customer_id),
                INDEX idx_orders_status (status),
                INDEX idx_orders_rzp (razorpay_order_id)
            )""",
            """
            CREATE TABLE IF NOT EXISTS order_items (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                order_id BIGINT NOT NULL,
                product_id BIGINT NOT NULL,
                variant_id BIGINT NULL,
                title VARCHAR(255) NOT NULL,
                variant_title VARCHAR(255) NULL,
                sku VARCHAR(255) NULL,
                image VARCHAR(500) NULL,
                unit_price DECIMAL(12,2) NOT NULL,
                qty INT NOT NULL,
                gst_rate INT NOT NULL DEFAULT 0,
                discount DECIMAL(12,2) NOT NULL DEFAULT 0,
                tax DECIMAL(12,2) NOT NULL DEFAULT 0,
                line_total DECIMAL(12,2) NOT NULL,
                INDEX idx_items_order (order_id),
                INDEX idx_items_product (product_id)
            )""",
            """
            CREATE TABLE IF NOT EXISTS order_events (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                order_id BIGINT NOT NULL,
                status VARCHAR(20) NULL,
                note VARCHAR(500) NULL,
                by_name VARCHAR(150) NULL,
                created_on DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_events_order (order_id)
            )""",
            """
            CREATE TABLE IF NOT EXISTS payments (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                order_id BIGINT NOT NULL,
                provider VARCHAR(20) NOT NULL,
                kind VARCHAR(20) NOT NULL,
                provider_order_id VARCHAR(60) NULL,
                provider_payment_id VARCHAR(60) NULL,
                amount DECIMAL(12,2) NOT NULL,
                status VARCHAR(20) NOT NULL,
                note VARCHAR(500) NULL,
                created_on DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_payments_order (order_id)
            )""",
            """
            CREATE TABLE IF NOT EXISTS product_reviews (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                product_id BIGINT NOT NULL,
                customer_id BIGINT NOT NULL,
                customer_name VARCHAR(150) NOT NULL,
                rating TINYINT NOT NULL,
                title VARCHAR(150) NULL,
                comment TEXT NULL,
                is_verified TINYINT(1) NOT NULL DEFAULT 0,
                is_approved TINYINT(1) NOT NULL DEFAULT 0,
                created_on DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY uq_review (product_id, customer_id)
            )""",
            """
            CREATE TABLE IF NOT EXISTS store_settings (
                setting_key VARCHAR(60) PRIMARY KEY,
                setting_value TEXT NULL
            )"""
    );
}
