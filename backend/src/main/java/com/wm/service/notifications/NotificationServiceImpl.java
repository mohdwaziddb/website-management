package com.wm.service.notifications;

import com.wm.service.settings.WebsiteSettingsService;
import com.wm.service.store.StoreSettingsService;
import com.wm.settings.SiteTypeCatalog;
import com.wm.tenant.TenantDataSources;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class NotificationServiceImpl implements NotificationService {

    @Autowired
    private TenantDataSources ds;

    @Autowired
    private WebsiteSettingsService websiteSettingsService;

    @Autowired
    private StoreSettingsService storeSettingsService;

    @Override
    public Map<String, Object> getNotifications() {
        JdbcTemplate db = ds.current();
        SiteTypeCatalog.SiteType type = SiteTypeCatalog.get(websiteSettingsService.getSettings().get("site_type"));
        List<Map<String, Object>> items = new ArrayList<>();

        long enquiries = db.queryForObject("SELECT COUNT(*) FROM enquiries WHERE is_deleted = 0 AND status = 'New'", Long.class);
        items.add(item("enquiries", enquiries == 1 ? "1 new enquiry" : enquiries + " new enquiries", enquiries, "/m/enquiries", "blue"));

        if (type.modules().contains("products")) {
            long toShip = db.queryForObject("SELECT COUNT(*) FROM orders WHERE status IN ('PLACED', 'CONFIRMED', 'PACKED')", Long.class);
            items.add(item("orders", toShip + (toShip == 1 ? " order" : " orders") + " to ship", toShip, "/store/orders?status=PLACED", "violet"));
            long reviews = db.queryForObject("SELECT COUNT(*) FROM product_reviews WHERE is_approved = 0", Long.class);
            items.add(item("reviews", reviews + (reviews == 1 ? " review" : " reviews") + " waiting for approval", reviews, "/store/reviews", "amber"));
            int low = storeSettingsService.config().lowStockThreshold();
            long lowStock = db.queryForObject("SELECT (SELECT COUNT(*) FROM products p WHERE p.is_deleted = 0 AND p.stock IS NOT NULL AND p.stock <= ? "
                    + "AND NOT EXISTS (SELECT 1 FROM product_variants v WHERE v.product_id = p.id AND v.is_deleted = 0)) + "
                    + "(SELECT COUNT(*) FROM product_variants v WHERE v.is_deleted = 0 AND v.stock IS NOT NULL AND v.stock <= ?)", Long.class, low, low);
            items.add(item("stock", lowStock + (lowStock == 1 ? " product is" : " products are") + " low on stock", lowStock, "/store/orders", "rose"));
        }

        Map<String, Object> out = new LinkedHashMap<>();
        // sirf jinme kuch hai
        List<Map<String, Object>> active = items.stream().filter(i -> ((Number) i.get("count")).longValue() > 0).toList();
        out.put("total", active.stream().mapToLong(i -> ((Number) i.get("count")).longValue()).sum());
        out.put("items", active);
        out.put("recentEnquiries", db.queryForList("SELECT id, name, subject, created_on FROM enquiries WHERE is_deleted = 0 AND status = 'New' ORDER BY id DESC LIMIT 5"));
        return out;
    }

    private static Map<String, Object> item(String key, String label, long count, String to, String tone) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("key", key);
        m.put("label", label);
        m.put("count", count);
        m.put("to", to);
        m.put("tone", tone);
        return m;
    }
}
