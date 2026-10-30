package com.wm.service.store;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class RazorpaySignatureTest {

    @Test
    void knownHmacVector() {
        // RFC 4231 jaisa: HMAC_SHA256("The quick brown fox jumps over the lazy dog", "key")
        assertEquals("f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8",
                RazorpayGateway.hmac("The quick brown fox jumps over the lazy dog", "key"));
    }

    @Test
    void checkoutSignature() {
        String sig = RazorpayGateway.hmac("order_ABC|pay_XYZ", "secret123");
        assertTrue(RazorpayGateway.verifyPayment("order_ABC", "pay_XYZ", sig, "secret123"));
        assertTrue(RazorpayGateway.verifyPayment("order_ABC", "pay_XYZ", sig.toUpperCase(), "secret123"));
        assertFalse(RazorpayGateway.verifyPayment("order_ABC", "pay_OTHER", sig, "secret123"));
        assertFalse(RazorpayGateway.verifyPayment("order_ABC", "pay_XYZ", sig, "wrong"));
        assertFalse(RazorpayGateway.verifyPayment("order_ABC", "pay_XYZ", null, "secret123"));
        assertFalse(RazorpayGateway.verifyPayment("order_ABC", "pay_XYZ", sig, null));
    }

    @Test
    void webhookSignature() {
        String body = "{\"event\":\"payment.captured\"}";
        String sig = RazorpayGateway.hmac(body, "wh");
        assertTrue(RazorpayGateway.verifyWebhook(body, sig, "wh"));
        assertFalse(RazorpayGateway.verifyWebhook(body + " ", sig, "wh"));
        assertFalse(RazorpayGateway.verifyWebhook(body, sig, null));
    }
}
