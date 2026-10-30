package com.wm.service.store;

import com.wm.common.ApiException;
import com.wm.common.DataTypeUtility;
import com.wm.common.PageResult;
import com.wm.common.ValidationUtility;
import com.wm.security.AuthPrincipal;
import com.wm.service.activity_logs.ActivityLogService;
import com.wm.tenant.TenantDataSources;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.*;

import static com.wm.service.store.OrderStatus.*;

@Service
public class StoreAdminServiceImpl implements StoreAdminService {
    private static final int MAX_PAGE = 100;

    @Autowired
    private TenantDataSources ds;

    @Autowired
    private StoreOrders orders;

    @Autowired
    private StoreOrderFlow flow;

    @Autowired
    private StoreSettingsService storeSettingsService;

    @Autowired
    private ActivityLogService activityLogService;

    // ------------------------------------------------------------ orders

    @Override
    public PageResult<Map<String, Object>> getOrders(Map<String, Object> param) {
        StringBuilder where = new StringBuilder(" WHERE 1 = 1");
        List<Object> args = new ArrayList<>();
        String status = DataTypeUtility.stringNullValue(param.get("status"));
        if (status != null) {
            if (!ALL.contains(status)) throw ApiException.badRequest("Unknown status");
            where.append(" AND o.status = ?");
            args.add(status);
        }
        for (String f : List.of("payment_status", "payment_method")) {
            String v = DataTypeUtility.stringNullValue(param.get(f));
            if (v != null) {
                where.append(" AND o.").append(f).append(" = ?");
                args.add(v);
            }
        }
        String q = DataTypeUtility.stringNullValue(param.get("q"));
        if (q != null) {
            String like = "%" + q.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
            where.append(" AND (o.order_no LIKE ? OR o.ship_name LIKE ? OR o.ship_phone LIKE ? OR o.ship_email LIKE ?)");
            args.addAll(List.of(like, like, like, like));
        }
        if (!DataTypeUtility.isEmpty(param.get("from"))) {
            where.append(" AND o.created_on >= ?");
            args.add(ValidationUtility.requiredDate(param.get("from"), "From date"));
        }
        if (!DataTypeUtility.isEmpty(param.get("to"))) {
            where.append(" AND o.created_on < DATE_ADD(?, INTERVAL 1 DAY)");
            args.add(ValidationUtility.requiredDate(param.get("to"), "To date"));
        }
        Long customer = DataTypeUtility.longValue(param.get("customer_id"));
        if (customer != null) {
            where.append(" AND o.customer_id = ?");
            args.add(customer);
        }
        int page = Math.max(DataTypeUtility.integerValue(param.get("page"), 1), 1);
        int size = Math.min(Math.max(DataTypeUtility.integerValue(param.get("size"), 20), 1), MAX_PAGE);
        JdbcTemplate db = ds.current();
        long total = db.queryForObject("SELECT COUNT(*) FROM orders o" + where, Long.class, args.toArray());
        List<Object> pageArgs = new ArrayList<>(args);
        pageArgs.add(size);
        pageArgs.add((long) (page - 1) * size);
        List<Map<String, Object>> rows = db.queryForList("SELECT o.id, o.order_no, o.status, o.payment_method, o.payment_status, o.total, o.ship_name, o.ship_phone, "
                + "o.ship_city, o.created_on, (SELECT SUM(i.qty) FROM order_items i WHERE i.order_id = o.id) AS items FROM orders o" + where
                + " ORDER BY o.id DESC LIMIT ? OFFSET ?", pageArgs.toArray());
        rows.forEach(r -> r.put("status_label", label(String.valueOf(r.get("status")))));
        return new PageResult<>(rows, total, page, size);
    }

    @Override
    public Map<String, Object> getOrder(long id) {
        JdbcTemplate db = ds.current();
        Map<String, Object> out = orders.detail(db, orders.byId(db, id), true);
        out.put("customer", db.queryForList("SELECT id, name, email, phone FROM customers WHERE id = ?", out.get("customer_id")).stream().findFirst().orElse(null));
        // invoice ke liye
        StoreConfig c = storeSettingsService.config();
        Map<String, Object> seller = new LinkedHashMap<>();
        seller.put("businessName", c.businessName());
        seller.put("gstin", c.gstin());
        seller.put("address", c.businessAddress());
        out.put("seller", seller);
        return out;
    }

    @Override
    public Map<String, Object> updateStatus(long id, Map<String, Object> param) {
        JdbcTemplate db = ds.current();
        Map<String, Object> order = orders.byId(db, id);
        String to = ValidationUtility.requiredString(param.get("status"), "Status", 20);
        String note = ValidationUtility.optionalString(param.get("note"), "Note", 500);
        if (SHIPPED.equals(to) && !DataTypeUtility.isEmpty(param.get("tracking_no"))) saveTracking(db, id, param);
        boolean refund = DataTypeUtility.booleanValue(param.get("refund"), true);
        flow.changeStatus(db, storeSettingsService.config(), order, to, note, me(), refund);
        activityLogService.addLog("orders", id, "UPDATE", order.get("order_no") + ": " + label(String.valueOf(order.get("status"))) + " → " + label(to));
        return getOrder(id);
    }

    @Override
    public Map<String, Object> updateTracking(long id, Map<String, Object> param) {
        JdbcTemplate db = ds.current();
        Map<String, Object> order = orders.byId(db, id);
        saveTracking(db, id, param);
        orders.addEvent(db, id, null, "Tracking: " + param.get("courier") + " " + param.get("tracking_no"), me());
        activityLogService.addLog("orders", id, "UPDATE", order.get("order_no") + ": tracking updated");
        return getOrder(id);
    }

    private static void saveTracking(JdbcTemplate db, long id, Map<String, Object> param) {
        String courier = ValidationUtility.requiredString(param.get("courier"), "Courier", 100);
        String no = ValidationUtility.requiredString(param.get("tracking_no"), "Tracking number", 100);
        String url = DataTypeUtility.stringNullValue(param.get("tracking_url"));
        if (url != null && !DataTypeUtility.isValidUrl(url)) throw ApiException.badRequest("Tracking link must be a valid URL (https://...)");
        db.update("UPDATE orders SET courier = ?, tracking_no = ?, tracking_url = ?, updated_on = NOW() WHERE id = ?", courier, no, url, id);
    }

    @Override
    public Map<String, Object> addNote(long id, Map<String, Object> param) {
        JdbcTemplate db = ds.current();
        orders.byId(db, id);
        orders.addEvent(db, id, null, ValidationUtility.requiredString(param.get("note"), "Note", 500), me());
        return getOrder(id);
    }

    @Override
    public Map<String, Object> refund(long id) {
        JdbcTemplate db = ds.current();
        Map<String, Object> order = orders.byId(db, id);
        flow.refund(db, storeSettingsService.config(), order, me());
        activityLogService.addLog("orders", id, "UPDATE", order.get("order_no") + ": refunded ₹" + order.get("total"));
        return getOrder(id);
    }

    // ------------------------------------------------------------ dashboard

    @Override
    public Map<String, Object> getSummary() {
        JdbcTemplate db = ds.current();
        String live = "status NOT IN ('CANCELLED', 'PENDING_PAYMENT', 'RETURNED')";
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("today", db.queryForMap("SELECT COUNT(*) AS orders, COALESCE(SUM(total), 0) AS revenue FROM orders WHERE " + live + " AND DATE(created_on) = CURDATE()"));
        out.put("month", db.queryForMap("SELECT COUNT(*) AS orders, COALESCE(SUM(total), 0) AS revenue FROM orders WHERE " + live
                + " AND created_on >= DATE_FORMAT(CURDATE(), '%Y-%m-01')"));
        out.put("allTime", db.queryForMap("SELECT COUNT(*) AS orders, COALESCE(SUM(total), 0) AS revenue FROM orders WHERE " + live));
        Map<String, Object> byStatus = new LinkedHashMap<>();
        ALL.forEach(s -> byStatus.put(s, 0L));
        db.query("SELECT status, COUNT(*) FROM orders GROUP BY status", rs -> {
            byStatus.put(rs.getString(1), rs.getLong(2));
        });
        out.put("byStatus", byStatus);
        out.put("customers", db.queryForObject("SELECT COUNT(*) FROM customers", Long.class));
        out.put("pendingReviews", db.queryForObject("SELECT COUNT(*) FROM product_reviews WHERE is_approved = 0", Long.class));
        int low = storeSettingsService.config().lowStockThreshold();
        out.put("lowStockThreshold", low);
        out.put("lowStock", db.queryForList("SELECT p.id, p.title, NULL AS variant, p.stock FROM products p WHERE p.is_deleted = 0 AND p.stock IS NOT NULL AND p.stock <= ? "
                + "AND NOT EXISTS (SELECT 1 FROM product_variants v WHERE v.product_id = p.id AND v.is_deleted = 0) "
                + "UNION ALL SELECT p.id, p.title, v.title, v.stock FROM product_variants v JOIN products p ON p.id = v.product_id AND p.is_deleted = 0 "
                + "WHERE v.is_deleted = 0 AND v.stock IS NOT NULL AND v.stock <= ? ORDER BY stock LIMIT 20", low, low));
        out.put("recent", getOrders(Map.of("size", 5)).items());
        return out;
    }

    // ------------------------------------------------------------ customers

    @Override
    public PageResult<Map<String, Object>> getCustomers(Map<String, Object> param) {
        String q = DataTypeUtility.stringNullValue(param.get("q"));
        List<Object> args = new ArrayList<>();
        String where = "";
        if (q != null) {
            String like = "%" + q.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
            where = " WHERE c.name LIKE ? OR c.email LIKE ? OR c.phone LIKE ?";
            args.addAll(List.of(like, like, like));
        }
        int page = Math.max(DataTypeUtility.integerValue(param.get("page"), 1), 1);
        int size = Math.min(Math.max(DataTypeUtility.integerValue(param.get("size"), 20), 1), MAX_PAGE);
        JdbcTemplate db = ds.current();
        long total = db.queryForObject("SELECT COUNT(*) FROM customers c" + where, Long.class, args.toArray());
        List<Object> pageArgs = new ArrayList<>(args);
        pageArgs.add(size);
        pageArgs.add((long) (page - 1) * size);
        List<Map<String, Object>> rows = db.queryForList("SELECT c.id, c.name, c.email, c.phone, c.is_active, c.created_on, c.last_login, "
                + "(SELECT COUNT(*) FROM orders o WHERE o.customer_id = c.id) AS orders, "
                + "(SELECT COALESCE(SUM(o.total), 0) FROM orders o WHERE o.customer_id = c.id AND o.status NOT IN ('CANCELLED', 'PENDING_PAYMENT', 'RETURNED')) AS spent "
                + "FROM customers c" + where + " ORDER BY c.id DESC LIMIT ? OFFSET ?", pageArgs.toArray());
        return new PageResult<>(rows, total, page, size);
    }

    @Override
    public Map<String, Object> getCustomer(long id) {
        JdbcTemplate db = ds.current();
        List<Map<String, Object>> rows = db.queryForList("SELECT id, name, email, phone, is_active, created_on, last_login FROM customers WHERE id = ?", id);
        if (rows.isEmpty()) throw ApiException.notFound("Customer not found");
        Map<String, Object> c = rows.get(0);
        c.put("addresses", db.queryForList("SELECT * FROM customer_addresses WHERE customer_id = ? ORDER BY is_default DESC, id DESC", id));
        c.put("orders", getOrders(Map.of("customer_id", id, "size", 50)).items());
        return c;
    }

    @Override
    public Map<String, Object> setCustomerActive(long id, Map<String, Object> param) {
        Map<String, Object> c = getCustomer(id);
        boolean active = DataTypeUtility.booleanValue(param.get("is_active"));
        // disable => turant logout (token_version++)
        ds.current().update("UPDATE customers SET is_active = ?, token_version = token_version + ? WHERE id = ?", active, active ? 0 : 1, id);
        activityLogService.addLog("customers", id, "UPDATE", (active ? "Enabled" : "Disabled") + " customer " + c.get("email"));
        return getCustomer(id);
    }

    // ------------------------------------------------------------ reviews

    @Override
    public List<Map<String, Object>> getReviews(Map<String, Object> param) {
        String filter = DataTypeUtility.stringValue(param.get("status"), "pending");
        String where = switch (filter) {
            case "approved" -> " WHERE r.is_approved = 1";
            case "all" -> "";
            default -> " WHERE r.is_approved = 0";
        };
        return ds.current().queryForList("SELECT r.*, p.title AS product_title, p.slug AS product_slug FROM product_reviews r "
                + "LEFT JOIN products p ON p.id = r.product_id" + where + " ORDER BY r.created_on DESC LIMIT 200");
    }

    @Override
    public Map<String, Object> setReviewApproved(long id, Map<String, Object> param) {
        boolean approved = DataTypeUtility.booleanValue(param.get("is_approved"));
        if (ds.current().update("UPDATE product_reviews SET is_approved = ? WHERE id = ?", approved, id) == 0) throw ApiException.notFound("Review not found");
        activityLogService.addLog("product_reviews", id, "UPDATE", (approved ? "Approved" : "Hidden") + " a product review");
        return ds.current().queryForMap("SELECT * FROM product_reviews WHERE id = ?", id);
    }

    @Override
    public void deleteReview(long id) {
        if (ds.current().update("DELETE FROM product_reviews WHERE id = ?", id) == 0) throw ApiException.notFound("Review not found");
        activityLogService.addLog("product_reviews", id, "DELETE", "Deleted a product review");
    }

    private static String me() {
        return AuthPrincipal.current().name();
    }
}
