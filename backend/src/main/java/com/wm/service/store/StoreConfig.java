package com.wm.service.store;

import com.wm.common.DataTypeUtility;

import java.math.BigDecimal;
import java.util.Map;

import static com.wm.service.store.StoreSettingsRegistry.*;

/** Store settings ka typed snapshot (ek request ke liye ek baar padho) */
public record StoreConfig(
        String orderPrefix,
        boolean pricesIncludeTax,
        int lowStockThreshold,
        boolean reviewsAutoApprove,
        String storeEmail,
        BigDecimal shippingFee,
        BigDecimal freeShippingAbove,
        boolean codEnabled,
        BigDecimal codFee,
        BigDecimal codMaxOrder,
        boolean razorpayEnabled,
        String razorpayKeyId,
        String razorpayKeySecret,
        String razorpayWebhookSecret,
        String smtpHost,
        int smtpPort,
        String smtpUsername,
        String smtpPassword,
        String smtpFrom,
        String businessName,
        String gstin,
        String businessAddress
) {
    public static StoreConfig from(Map<String, String> v) {
        return new StoreConfig(
                DataTypeUtility.stringValue(v.get(ORDER_PREFIX), "ORD"),
                DataTypeUtility.booleanValue(v.get(PRICES_INCLUDE_TAX), true),
                DataTypeUtility.integerValue(v.get(LOW_STOCK), 5),
                DataTypeUtility.booleanValue(v.get(REVIEWS_AUTO_APPROVE), false),
                DataTypeUtility.stringNullValue(v.get(STORE_EMAIL)),
                money(v.get(SHIPPING_FEE), BigDecimal.ZERO),
                money(v.get(FREE_SHIPPING_ABOVE), null),
                DataTypeUtility.booleanValue(v.get(COD_ENABLED), true),
                money(v.get(COD_FEE), BigDecimal.ZERO),
                money(v.get(COD_MAX), null),
                DataTypeUtility.booleanValue(v.get(RZP_ENABLED), false),
                DataTypeUtility.stringNullValue(v.get(RZP_KEY_ID)),
                DataTypeUtility.stringNullValue(v.get(RZP_KEY_SECRET)),
                DataTypeUtility.stringNullValue(v.get(RZP_WEBHOOK_SECRET)),
                DataTypeUtility.stringNullValue(v.get(SMTP_HOST)),
                DataTypeUtility.integerValue(v.get(SMTP_PORT), 587),
                DataTypeUtility.stringNullValue(v.get(SMTP_USERNAME)),
                DataTypeUtility.stringNullValue(v.get(SMTP_PASSWORD)),
                DataTypeUtility.stringNullValue(v.get(SMTP_FROM)),
                DataTypeUtility.stringNullValue(v.get("business_name")),
                DataTypeUtility.stringNullValue(v.get("gstin")),
                DataTypeUtility.stringNullValue(v.get("business_address")));
    }

    /** Razorpay on + dono keys bhari hain */
    public boolean razorpayReady() {
        return razorpayEnabled && razorpayKeyId != null && razorpayKeySecret != null;
    }

    public boolean mailReady() {
        return smtpHost != null && smtpFrom != null;
    }

    static BigDecimal money(Object v, BigDecimal fallback) {
        String s = DataTypeUtility.stringNullValue(v);
        if (s == null) return fallback;
        try {
            return new BigDecimal(s).setScale(2, java.math.RoundingMode.HALF_UP);
        } catch (NumberFormatException e) {
            return fallback;
        }
    }
}
