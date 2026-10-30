package com.wm.service.store;

import com.wm.common.ApiException;
import com.wm.common.DataTypeUtility;
import com.wm.service.settings.WebsiteSettingsService;
import com.wm.tenant.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static com.wm.service.store.OrderStatus.*;

/**
 * Order ki har state change yahin se — customer, admin, Razorpay webhook aur expiry job sab isi ko bulate hain,
 * taaki stock / payment / history / email kabhi alag-alag na ho.
 * Har change "WHERE status = purana" ke saath (do log ek saath badlein to doosre ko error, data kharab nahi).
 */
@Component
public class StoreOrderFlow {
    private static final Logger log = LoggerFactory.getLogger(StoreOrderFlow.class);
    private static final Set<String> NOTIFY = Set.of(CONFIRMED, SHIPPED, DELIVERED, CANCELLED, RETURNED);

    @Autowired
    private StoreOrders orders;

    @Autowired
    private RazorpayGateway razorpay;

    @Autowired
    private StoreMailer mailer;

    @Autowired
    private WebsiteSettingsService websiteSettingsService;

    /** Razorpay payment pakka hua (checkout verify ya webhook — jo pehle aaye; doosra kuch nahi karega) */
    public void markPaid(JdbcTemplate db, StoreConfig cfg, Map<String, Object> order, String paymentId, String via) {
        long id = id(order);
        String before = String.valueOf(order.get("status"));
        boolean firstTime = orders.inTransaction(db, () -> {
            int n = db.update("UPDATE orders SET payment_status = 'PAID', razorpay_payment_id = ?, paid_on = NOW(), updated_on = NOW(), "
                    + "status = CASE WHEN status = 'PENDING_PAYMENT' THEN 'PLACED' ELSE status END WHERE id = ? AND payment_status <> 'PAID'", paymentId, id);
            if (n == 0) return false;
            orders.addPayment(db, id, RAZORPAY, "PAYMENT", DataTypeUtility.stringNullValue(order.get("razorpay_order_id")), paymentId,
                    (BigDecimal) order.get("total"), PAY_PAID, via);
            if (CANCELLED.equals(before)) {
                // 30 min baad pay hua aur order expire ho chuka tha: stock mile to order wapas, warna refund karna hoga
                if (reserveAgain(db, id)) {
                    db.update("UPDATE orders SET status = 'PLACED', cancel_reason = NULL WHERE id = ?", id);
                    orders.addEvent(db, id, PLACED, "Payment received after expiry — order restored (" + paymentId + ")", "Razorpay");
                } else {
                    orders.addEvent(db, id, null, "Payment received after cancellation but items are out of stock — please refund " + paymentId, "Razorpay");
                }
            } else {
                orders.addEvent(db, id, PLACED, "Payment received via Razorpay (" + paymentId + ")", "Razorpay");
            }
            return true;
        });
        if (firstTime) notifyPlaced(db, cfg, orders.byId(db, id));
    }

    /** Sab items ka stock dobara lo; ek bhi na mile to jo liya wo wapas aur false (payment record rehta hai) */
    private boolean reserveAgain(JdbcTemplate db, long orderId) {
        List<PricingCalculator.Line> taken = new java.util.ArrayList<>();
        for (Map<String, Object> it : orders.items(db, orderId)) {
            PricingCalculator.Line l = new PricingCalculator.Line(DataTypeUtility.longValue(it.get("product_id"), 0), DataTypeUtility.longValue(it.get("variant_id")),
                    "", null, null, null, BigDecimal.ZERO, DataTypeUtility.integerValue(it.get("qty"), 0), 0);
            if (!orders.reserve(db, l)) {
                for (PricingCalculator.Line t : taken) {
                    String table = t.variantId() != null ? "product_variants" : "products";
                    db.update("UPDATE " + table + " SET stock = stock + ? WHERE id = ? AND stock IS NOT NULL", t.qty(), t.variantId() != null ? t.variantId() : t.productId());
                }
                return false;
            }
            taken.add(l);
        }
        return true;
    }

    /** Admin / customer status change (rules: OrderStatus.canMove) */
    public void changeStatus(JdbcTemplate db, StoreConfig cfg, Map<String, Object> order, String to, String note, String byName, boolean refund) {
        String from = String.valueOf(order.get("status"));
        if (!ALL.contains(to)) throw ApiException.badRequest("Unknown status " + to);
        if (from.equals(to)) return;
        if (!canMove(from, to)) throw ApiException.badRequest("Cannot change order from " + label(from) + " to " + label(to));
        long id = id(order);
        orders.inTransaction(db, () -> {
            int n = db.update("UPDATE orders SET status = ?, updated_on = NOW()" + (CANCELLED.equals(to) ? ", cancel_reason = ?" : "") + " WHERE id = ? AND status = ?",
                    CANCELLED.equals(to) ? new Object[]{to, note, id, from} : new Object[]{to, id, from});
            if (n == 0) throw ApiException.badRequest("This order was just updated by someone else — please refresh");
            if (RESTOCK.contains(to)) orders.restock(db, id);
            // COD: deliver hua = cash mil gaya
            if (DELIVERED.equals(to) && COD.equals(order.get("payment_method"))) {
                db.update("UPDATE orders SET payment_status = 'PAID', paid_on = NOW() WHERE id = ? AND payment_status = 'PENDING'", id);
                orders.addPayment(db, id, COD, "PAYMENT", null, null, (BigDecimal) order.get("total"), PAY_PAID, "Cash collected on delivery");
            }
            // online payment hi nahi hua aur cancel => payment FAILED (pending na dikhe)
            if (CANCELLED.equals(to)) db.update("UPDATE orders SET payment_status = 'FAILED' WHERE id = ? AND payment_status = 'PENDING' AND payment_method = 'RAZORPAY'", id);
            orders.addEvent(db, id, to, note, byName);
            return null;
        });
        Map<String, Object> fresh = orders.byId(db, id);
        if (refund && RESTOCK.contains(to) && PAY_PAID.equals(fresh.get("payment_status")) && RAZORPAY.equals(fresh.get("payment_method"))) {
            refund(db, cfg, fresh, byName);
            fresh = orders.byId(db, id);
        }
        if (NOTIFY.contains(to)) notifyStatus(db, cfg, fresh);
    }

    /** Razorpay se poora paisa wapas */
    public void refund(JdbcTemplate db, StoreConfig cfg, Map<String, Object> order, String byName) {
        if (!RAZORPAY.equals(order.get("payment_method")) || !PAY_PAID.equals(order.get("payment_status"))) {
            throw ApiException.badRequest("Only paid online (Razorpay) orders can be refunded");
        }
        if (!RESTOCK.contains(String.valueOf(order.get("status")))) throw ApiException.badRequest("Cancel the order (or mark it returned) before refunding");
        String paymentId = DataTypeUtility.stringNullValue(order.get("razorpay_payment_id"));
        if (paymentId == null || cfg.razorpayKeyId() == null || cfg.razorpayKeySecret() == null) throw ApiException.badRequest("Razorpay keys are not set — refund from the Razorpay dashboard");
        long id = id(order);
        BigDecimal amount = (BigDecimal) order.get("total");
        String refundId;
        try {
            refundId = razorpay.refund(cfg.razorpayKeyId(), cfg.razorpayKeySecret(), paymentId, PricingCalculator.toPaise(amount));
        } catch (ApiException e) {
            orders.addEvent(db, id, null, "Refund failed: " + e.getMessage(), byName);
            throw e;
        }
        int n = db.update("UPDATE orders SET payment_status = 'REFUNDED', updated_on = NOW() WHERE id = ? AND payment_status = 'PAID'", id);
        if (n == 0) return;
        orders.addPayment(db, id, RAZORPAY, "REFUND", DataTypeUtility.stringNullValue(order.get("razorpay_order_id")), refundId, amount, PAY_REFUNDED, "Refunded by " + byName);
        orders.addEvent(db, id, null, "Refund of ₹" + amount + " started (" + refundId + "). It reaches the customer in 5-7 working days.", byName);
    }

    // ------------------------------------------------------------ emails

    public void notifyPlaced(JdbcTemplate db, StoreConfig cfg, Map<String, Object> order) {
        try {
            String store = siteName();
            List<Map<String, Object>> items = orders.items(db, id(order));
            String table = StoreMailer.orderTable(order, items);
            String pay = COD.equals(order.get("payment_method")) ? "Cash on Delivery — please keep ₹" + order.get("total") + " ready." : "Paid online (Razorpay).";
            mailer.send(cfg, String.valueOf(order.get("ship_email")), "Order " + order.get("order_no") + " confirmed — " + store,
                    StoreMailer.layout(store, "Thank you for your order!", "<p>Hi " + StoreMailer.esc(order.get("ship_name")) + ", we have received your order <b>"
                            + StoreMailer.esc(order.get("order_no")) + "</b>.</p><p>" + pay + "</p>" + table));
            mailer.send(cfg, cfg.storeEmail(), "New order " + order.get("order_no") + " — ₹" + order.get("total"),
                    StoreMailer.layout(store, "New order received", "<p><b>" + StoreMailer.esc(order.get("order_no")) + "</b> · "
                            + StoreMailer.esc(order.get("payment_method")) + "</p>" + table));
        } catch (Exception e) {
            log.warn("Order email failed: {}", e.getMessage());
        }
    }

    private void notifyStatus(JdbcTemplate db, StoreConfig cfg, Map<String, Object> order) {
        try {
            String store = siteName();
            String status = String.valueOf(order.get("status"));
            StringBuilder body = new StringBuilder("<p>Hi ").append(StoreMailer.esc(order.get("ship_name"))).append(",</p><p>Your order <b>")
                    .append(StoreMailer.esc(order.get("order_no"))).append("</b> is now <b>").append(label(status)).append("</b>.</p>");
            if (SHIPPED.equals(status) && order.get("tracking_no") != null) {
                body.append("<p>Courier: ").append(StoreMailer.esc(order.get("courier"))).append(" · Tracking no: <b>").append(StoreMailer.esc(order.get("tracking_no"))).append("</b>");
                if (order.get("tracking_url") != null) body.append(" · <a href=\"").append(StoreMailer.esc(order.get("tracking_url"))).append("\">Track</a>");
                body.append("</p>");
            }
            if (PAY_REFUNDED.equals(order.get("payment_status"))) body.append("<p>Your refund of ₹").append(order.get("total")).append(" has been started.</p>");
            mailer.send(cfg, String.valueOf(order.get("ship_email")), "Order " + order.get("order_no") + ": " + label(status) + " — " + store,
                    StoreMailer.layout(store, "Order update", body.toString()));
        } catch (Exception e) {
            log.warn("Status email failed: {}", e.getMessage());
        }
    }

    private String siteName() {
        return DataTypeUtility.stringValue(websiteSettingsService.getSettings().get("site_name"), TenantContext.get() != null ? TenantContext.get().name() : "Store");
    }

    static long id(Map<String, Object> order) {
        return DataTypeUtility.longValue(order.get("id"), 0);
    }
}
