package com.wm.service.store;

import com.wm.common.ApiException;
import com.wm.common.DataTypeUtility;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Supplier;

/**
 * Orders ke common DB kaam — customer checkout, admin panel aur expiry job teeno yahi use karte hain
 * (stock ghatana / wapas, history, poora order detail).
 */
@Component
public class StoreOrders {

    /** Tenant DB par transaction (stock + order ek saath; beech me fail = sab wapas) */
    public <T> T inTransaction(JdbcTemplate db, Supplier<T> work) {
        TransactionTemplate tx = new TransactionTemplate(new DataSourceTransactionManager(db.getDataSource()));
        return tx.execute(s -> work.get());
    }

    public Map<String, Object> byId(JdbcTemplate db, long id) {
        List<Map<String, Object>> rows = db.queryForList("SELECT * FROM orders WHERE id = ?", id);
        if (rows.isEmpty()) throw ApiException.notFound("Order not found");
        return rows.get(0);
    }

    /** customerId != null => sirf usi customer ka (dusre ka order = 404, exist karna bhi na pata chale) */
    public Map<String, Object> byNo(JdbcTemplate db, String orderNo, Long customerId) {
        List<Map<String, Object>> rows = customerId == null
                ? db.queryForList("SELECT * FROM orders WHERE order_no = ?", orderNo)
                : db.queryForList("SELECT * FROM orders WHERE order_no = ? AND customer_id = ?", orderNo, customerId);
        if (rows.isEmpty()) throw ApiException.notFound("Order not found");
        return rows.get(0);
    }

    public List<Map<String, Object>> items(JdbcTemplate db, long orderId) {
        return db.queryForList("SELECT * FROM order_items WHERE order_id = ? ORDER BY id", orderId);
    }

    /** Order + items + history (+ admin ko payments) */
    public Map<String, Object> detail(JdbcTemplate db, Map<String, Object> order, boolean admin) {
        long id = DataTypeUtility.longValue(order.get("id"), 0);
        Map<String, Object> out = new LinkedHashMap<>(order);
        out.remove("customer_id");
        if (admin) out.put("customer_id", order.get("customer_id"));
        out.put("status_label", OrderStatus.label(String.valueOf(order.get("status"))));
        out.put("items", items(db, id));
        out.put("events", db.queryForList("SELECT status, note, by_name, created_on FROM order_events WHERE order_id = ? ORDER BY id", id));
        String status = String.valueOf(order.get("status"));
        out.put("can_cancel", OrderStatus.CUSTOMER_CANCELLABLE.contains(status));
        out.put("can_pay", OrderStatus.PENDING_PAYMENT.equals(status) && OrderStatus.RAZORPAY.equals(order.get("payment_method")));
        if (admin) {
            out.put("payments", db.queryForList("SELECT * FROM payments WHERE order_id = ? ORDER BY id", id));
            out.put("next_statuses", OrderStatus.nextOf(status));
        }
        return out;
    }

    public void addEvent(JdbcTemplate db, long orderId, String status, String note, String byName) {
        db.update("INSERT INTO order_events (order_id, status, note, by_name) VALUES (?, ?, ?, ?)", orderId, status, note, byName);
    }

    public void setStatus(JdbcTemplate db, long orderId, String status, String note, String byName) {
        db.update("UPDATE orders SET status = ?, updated_on = NOW() WHERE id = ?", status, orderId);
        addEvent(db, orderId, status, note, byName);
    }

    /**
     * Stock ghatao — sirf tab jab bacha ho (ek hi query, do log ek saath aakhri piece na le sakein).
     * stock NULL = unlimited. false = stock khatam.
     */
    public boolean reserve(JdbcTemplate db, PricingCalculator.Line l) {
        String table = l.variantId() != null ? "product_variants" : "products";
        long id = l.variantId() != null ? l.variantId() : l.productId();
        return db.update("UPDATE " + table + " SET stock = CASE WHEN stock IS NULL THEN NULL ELSE stock - ? END WHERE id = ? AND (stock IS NULL OR stock >= ?)",
                l.qty(), id, l.qty()) == 1;
    }

    /** Cancel / return: items ka stock wapas */
    public void restock(JdbcTemplate db, long orderId) {
        for (Map<String, Object> it : items(db, orderId)) {
            Long variant = DataTypeUtility.longValue(it.get("variant_id"));
            int qty = DataTypeUtility.integerValue(it.get("qty"), 0);
            if (variant != null) db.update("UPDATE product_variants SET stock = stock + ? WHERE id = ? AND stock IS NOT NULL", qty, variant);
            else db.update("UPDATE products SET stock = stock + ? WHERE id = ? AND stock IS NOT NULL", qty, it.get("product_id"));
        }
    }

    public void addPayment(JdbcTemplate db, long orderId, String provider, String kind, String providerOrderId, String providerPaymentId,
                           BigDecimal amount, String status, String note) {
        db.update("INSERT INTO payments (order_id, provider, kind, provider_order_id, provider_payment_id, amount, status, note) VALUES (?,?,?,?,?,?,?,?)",
                orderId, provider, kind, providerOrderId, providerPaymentId, amount, status, note);
    }
}
