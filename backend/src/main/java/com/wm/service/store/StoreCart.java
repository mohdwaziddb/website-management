package com.wm.service.store;

import com.wm.common.ApiException;
import com.wm.common.DataTypeUtility;
import com.wm.module.ModuleRegistry;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;

/**
 * Browser ka cart sirf [{productId, variantId, qty}] bhejta hai — price, naam, stock hamesha DB se
 * (koi price badal kar ₹1 ka order na bana sake). Coupon ke rules bhi yahin.
 */
@Component
public class StoreCart {
    public static final int MAX_LINES = 50;
    public static final int MAX_QTY = 99;
    private static final ZoneId INDIA = ZoneId.of("Asia/Kolkata");

    /** issues = jo line nahi bik sakti (stock khatam, product hata) — cart me dikhane ke liye */
    public record Resolved(List<PricingCalculator.Line> lines, List<Map<String, Object>> issues, List<Map<String, Object>> view) {
    }

    @SuppressWarnings("unchecked")
    public Resolved resolve(JdbcTemplate db, Object rawItems) {
        if (!(rawItems instanceof List<?> list) || list.isEmpty()) throw ApiException.badRequest("Your cart is empty");
        if (list.size() > MAX_LINES) throw ApiException.badRequest("Too many items in cart (max " + MAX_LINES + ")");

        // same product + variant do baar aaye to jod do
        Map<String, long[]> merged = new LinkedHashMap<>();
        for (Object o : list) {
            if (!(o instanceof Map<?, ?> m)) throw ApiException.badRequest("Invalid cart item");
            Map<String, Object> it = (Map<String, Object>) m;
            long pid = DataTypeUtility.longValue(it.get("productId"), -1);
            Long vid = DataTypeUtility.longValue(it.get("variantId"));
            int qty = DataTypeUtility.integerValue(it.get("qty"), 0);
            if (pid <= 0) throw ApiException.badRequest("Invalid product in cart");
            if (qty < 1 || qty > MAX_QTY) throw ApiException.badRequest("Quantity must be between 1 and " + MAX_QTY);
            merged.merge(pid + ":" + (vid == null ? "" : vid), new long[]{pid, vid == null ? 0 : vid, qty},
                    (a, b) -> new long[]{a[0], a[1], Math.min(MAX_QTY, a[2] + b[2])});
        }

        List<PricingCalculator.Line> lines = new ArrayList<>();
        List<Map<String, Object>> issues = new ArrayList<>();
        List<Map<String, Object>> view = new ArrayList<>();
        for (long[] x : merged.values()) {
            long pid = x[0];
            Long vid = x[1] == 0 ? null : x[1];
            int qty = (int) x[2];
            List<Map<String, Object>> ps = db.queryForList("SELECT * FROM products WHERE id = ? AND is_deleted = 0 AND is_active = 1 AND is_publish = 1", pid);
            if (ps.isEmpty()) {
                issues.add(issue(pid, vid, "This product is no longer available"));
                continue;
            }
            Map<String, Object> p = ps.get(0);
            long variants = db.queryForObject("SELECT COUNT(*) FROM product_variants WHERE product_id = ? AND is_deleted = 0 AND is_active = 1 AND is_publish = 1",
                    Long.class, pid);
            Map<String, Object> v = null;
            if (vid != null) {
                List<Map<String, Object>> vs = db.queryForList("SELECT * FROM product_variants WHERE id = ? AND product_id = ? AND is_deleted = 0 AND is_active = 1 AND is_publish = 1",
                        vid, pid);
                if (vs.isEmpty()) {
                    issues.add(issue(pid, vid, "Selected option of " + p.get("title") + " is no longer available"));
                    continue;
                }
                v = vs.get(0);
            } else if (variants > 0) {
                issues.add(issue(pid, null, "Please choose an option for " + p.get("title")));
                continue;
            }
            BigDecimal price = v != null && v.get("price") != null ? (BigDecimal) v.get("price") : (BigDecimal) p.get("price");
            Long stock = DataTypeUtility.longValue(v != null ? v.get("stock") : p.get("stock"));
            String title = String.valueOf(p.get("title"));
            if (stock != null && stock <= 0) {
                issues.add(issue(pid, vid, title + " is out of stock"));
                continue;
            }
            if (stock != null && qty > stock) {
                issues.add(issue(pid, vid, "Only " + stock + " left of " + title));
                continue;
            }
            String image = v != null && v.get("image") != null ? String.valueOf(v.get("image")) : DataTypeUtility.stringNullValue(p.get("cover_image"));
            String sku = DataTypeUtility.stringNullValue(v != null && v.get("sku") != null ? v.get("sku") : p.get("sku"));
            PricingCalculator.Line line = new PricingCalculator.Line(pid, vid, title, v == null ? null : String.valueOf(v.get("title")), sku, image,
                    price, qty, DataTypeUtility.integerValue(p.get("gst_rate"), 0));
            lines.add(line);
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("productId", pid);
            row.put("variantId", vid);
            row.put("slug", p.get("slug"));
            row.put("stock", stock);
            view.add(row);
        }
        return new Resolved(lines, issues, view);
    }

    private static Map<String, Object> issue(long pid, Long vid, String message) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("productId", pid);
        m.put("variantId", vid);
        m.put("message", message);
        return m;
    }

    /**
     * Coupon valid hai? (active, date, min order, total uses, per customer). Galat = badRequest with reason.
     * customerId null (login se pehle) => per-customer check checkout par hoga.
     */
    public PricingCalculator.Coupon coupon(JdbcTemplate db, String rawCode, Long customerId, BigDecimal subtotal) {
        String code = DataTypeUtility.stringNullValue(rawCode);
        if (code == null) return null;
        List<Map<String, Object>> rows = db.queryForList("SELECT * FROM coupons WHERE UPPER(code) = UPPER(?) AND is_deleted = 0 AND is_active = 1 AND is_publish = 1",
                code.trim());
        if (rows.isEmpty()) throw ApiException.badRequest("Coupon \"" + code + "\" is not valid");
        Map<String, Object> c = rows.get(0);
        LocalDate today = LocalDate.now(INDIA);
        LocalDate from = DataTypeUtility.dateValue(c.get("starts_on"));
        LocalDate till = DataTypeUtility.dateValue(c.get("expires_on"));
        if (from != null && today.isBefore(from)) throw ApiException.badRequest("Coupon " + c.get("code") + " starts on " + from);
        if (till != null && today.isAfter(till)) throw ApiException.badRequest("Coupon " + c.get("code") + " has expired");
        BigDecimal min = (BigDecimal) c.get("min_order");
        if (min != null && subtotal.compareTo(min) < 0) {
            throw ApiException.badRequest("Add items worth ₹" + min.subtract(subtotal).setScale(2) + " more to use " + c.get("code") + " (min order ₹" + min + ")");
        }
        String used = "SELECT COUNT(*) FROM orders WHERE UPPER(coupon_code) = UPPER(?) AND status <> 'CANCELLED'";
        Long limit = DataTypeUtility.longValue(c.get("usage_limit"));
        if (limit != null && db.queryForObject(used, Long.class, c.get("code")) >= limit) throw ApiException.badRequest("Coupon " + c.get("code") + " is no longer available");
        Long perCustomer = DataTypeUtility.longValue(c.get("per_customer_limit"));
        if (perCustomer != null && customerId != null && db.queryForObject(used + " AND customer_id = ?", Long.class, c.get("code"), customerId) >= perCustomer) {
            throw ApiException.badRequest("You have already used coupon " + c.get("code"));
        }
        return new PricingCalculator.Coupon(String.valueOf(c.get("code")), String.valueOf(c.get("discount_type")), (BigDecimal) c.get("value"),
                (BigDecimal) c.get("max_discount"));
    }

    public static PricingCalculator.Rules rules(StoreConfig c) {
        return new PricingCalculator.Rules(c.pricesIncludeTax(), c.shippingFee(), c.freeShippingAbove(), c.codFee());
    }
}
