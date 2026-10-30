package com.wm.service.store;

import com.wm.common.PageResult;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.Map;

/** Cart → checkout → payment, aur customer ke apne orders */
public interface StoreCheckoutService {

    /** Cart ka hisaab (bina login bhi): price, stock issues, coupon, shipping, GST, total */
    Map<String, Object> quote(Map<String, Object> param);

    /** Order banao (login zaroori). Razorpay ho to "payment" me checkout ke liye data */
    Map<String, Object> checkout(Map<String, Object> param);

    PageResult<Map<String, Object>> getMyOrders(Map<String, Object> param);

    Map<String, Object> getMyOrder(String orderNo);

    Map<String, Object> cancelMyOrder(String orderNo, Map<String, Object> param);

    /** Razorpay checkout ke baad signature check => PAID */
    Map<String, Object> verifyRazorpay(String orderNo, Map<String, Object> param);

    /** Pending (unpaid) order ka payment dobara */
    Map<String, Object> retryPayment(String orderNo);

    /** Razorpay webhook (raw body + X-Razorpay-Signature) */
    Map<String, Object> handleWebhook(String body, String signature);

    /** 30 min se unpaid online orders cancel + stock wapas. Return: kitne */
    int expirePendingOrders(JdbcTemplate db, int minutes);
}
