package com.wm.service.store;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.Map;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

/**
 * Razorpay REST API (https://razorpay.com/docs/api). Har website ki apni keys (StoreConfig) — isliye har call me keys.
 * Interface taaki tests me asli Razorpay ko call kiye bina mock ho sake.
 */
public interface RazorpayGateway {

    /** POST /v1/orders — amount paise me. Return: razorpay order id (order_xxx) */
    String createOrder(String keyId, String keySecret, long amountPaise, String receipt, Map<String, String> notes);

    /** POST /v1/payments/{id}/refund — poora amount. Return: refund id */
    String refund(String keyId, String keySecret, String paymentId, long amountPaise);

    /** Keys sahi hain? (GET /v1/orders?count=1) */
    void ping(String keyId, String keySecret);

    // ------------------------------------------------------------ signatures (Razorpay docs)

    /** Checkout success: HMAC_SHA256(order_id + "|" + payment_id, key_secret) == razorpay_signature */
    static boolean verifyPayment(String razorpayOrderId, String paymentId, String signature, String keySecret) {
        if (razorpayOrderId == null || paymentId == null || signature == null || keySecret == null) return false;
        return safeEquals(hmac(razorpayOrderId + "|" + paymentId, keySecret), signature);
    }

    /** Webhook: HMAC_SHA256(raw body, webhook_secret) == X-Razorpay-Signature */
    static boolean verifyWebhook(String body, String signature, String webhookSecret) {
        if (body == null || signature == null || webhookSecret == null) return false;
        return safeEquals(hmac(body, webhookSecret), signature);
    }

    static String hmac(String data, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    /** constant-time compare (timing se signature guess na ho) */
    private static boolean safeEquals(String a, String b) {
        return MessageDigest.isEqual(a.getBytes(StandardCharsets.UTF_8), b.trim().toLowerCase().getBytes(StandardCharsets.UTF_8));
    }
}
