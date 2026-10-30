package com.wm.service.store;

import java.util.List;
import java.util.Optional;

/**
 * Store settings (table store_settings — site_settings se alag, kyunki site settings public API par jaati hain
 * aur yahan Razorpay secret / SMTP password hai). secret = response me kabhi wapas nahi jaata.
 */
public final class StoreSettingsRegistry {

    public enum Kind { TEXT, EMAIL, DECIMAL, NUMBER, BOOLEAN }

    public record Setting(String key, String label, String group, Kind kind, boolean secret, String defaultValue, String help) {
    }

    public static final String ORDER_PREFIX = "order_prefix";
    public static final String PRICES_INCLUDE_TAX = "prices_include_tax";
    public static final String LOW_STOCK = "low_stock_threshold";
    public static final String STORE_EMAIL = "store_email";
    public static final String SHIPPING_FEE = "shipping_fee";
    public static final String FREE_SHIPPING_ABOVE = "free_shipping_above";
    public static final String COD_ENABLED = "cod_enabled";
    public static final String COD_FEE = "cod_fee";
    public static final String COD_MAX = "cod_max_order";
    public static final String RZP_ENABLED = "razorpay_enabled";
    public static final String RZP_KEY_ID = "razorpay_key_id";
    public static final String RZP_KEY_SECRET = "razorpay_key_secret";
    public static final String RZP_WEBHOOK_SECRET = "razorpay_webhook_secret";
    public static final String REVIEWS_AUTO_APPROVE = "reviews_auto_approve";
    public static final String SMTP_HOST = "smtp_host";
    public static final String SMTP_PORT = "smtp_port";
    public static final String SMTP_USERNAME = "smtp_username";
    public static final String SMTP_PASSWORD = "smtp_password";
    public static final String SMTP_FROM = "smtp_from";

    public static final List<Setting> ALL = List.of(
            s(ORDER_PREFIX, "Order Number Prefix", "Store", Kind.TEXT, false, "ORD", "e.g. ORD → ORD100023"),
            s("business_name", "Business Name (Invoice)", "Store", Kind.TEXT, false, "", "Invoice par dikhega"),
            s("gstin", "GSTIN", "Store", Kind.TEXT, false, "", "15 characters, e.g. 07AABCU9603R1ZM"),
            s("business_address", "Business Address (Invoice)", "Store", Kind.TEXT, false, "", ""),
            s(STORE_EMAIL, "Order Notification Email", "Store", Kind.EMAIL, false, "", "Naye order ki email yahan aayegi"),
            s(PRICES_INCLUDE_TAX, "Prices include GST", "Store", Kind.BOOLEAN, false, "true", "On = product price me GST shamil hai (India me normal)"),
            s(LOW_STOCK, "Low Stock Alert at", "Store", Kind.NUMBER, false, "5", "Itna ya kam stock = dashboard par alert"),
            s(REVIEWS_AUTO_APPROVE, "Publish reviews without approval", "Store", Kind.BOOLEAN, false, "false", "Off = admin approve kare tab dikhe"),
            s(SHIPPING_FEE, "Shipping Charge (₹)", "Shipping", Kind.DECIMAL, false, "0", "Har order par"),
            s(FREE_SHIPPING_ABOVE, "Free Shipping Above (₹)", "Shipping", Kind.DECIMAL, false, "", "Khaali = kabhi free nahi"),
            s(COD_ENABLED, "Cash on Delivery", "Payments", Kind.BOOLEAN, false, "true", ""),
            s(COD_FEE, "COD Charge (₹)", "Payments", Kind.DECIMAL, false, "0", ""),
            s(COD_MAX, "COD allowed up to (₹)", "Payments", Kind.DECIMAL, false, "", "Isse bade order par COD nahi. Khaali = koi limit nahi"),
            s(RZP_ENABLED, "Razorpay (UPI / Cards / Netbanking)", "Payments", Kind.BOOLEAN, false, "false", ""),
            s(RZP_KEY_ID, "Razorpay Key ID", "Payments", Kind.TEXT, false, "", "Dashboard → Account & Settings → API Keys (rzp_test_… / rzp_live_…)"),
            s(RZP_KEY_SECRET, "Razorpay Key Secret", "Payments", Kind.TEXT, true, "", ""),
            s(RZP_WEBHOOK_SECRET, "Razorpay Webhook Secret", "Payments", Kind.TEXT, true, "", "Webhook banate waqt jo secret rakha"),
            s(SMTP_HOST, "SMTP Host", "Email", Kind.TEXT, false, "", "e.g. smtp.gmail.com"),
            s(SMTP_PORT, "SMTP Port", "Email", Kind.NUMBER, false, "587", "587 (TLS) ya 465 (SSL)"),
            s(SMTP_USERNAME, "SMTP Username", "Email", Kind.TEXT, false, "", ""),
            s(SMTP_PASSWORD, "SMTP Password", "Email", Kind.TEXT, true, "", "Gmail me App Password"),
            s(SMTP_FROM, "From Email", "Email", Kind.EMAIL, false, "", "e.g. orders@yourstore.com")
    );

    private StoreSettingsRegistry() {
    }

    private static Setting s(String key, String label, String group, Kind kind, boolean secret, String def, String help) {
        return new Setting(key, label, group, kind, secret, def, help);
    }

    public static Optional<Setting> find(String key) {
        return ALL.stream().filter(x -> x.key().equals(key)).findFirst();
    }
}
