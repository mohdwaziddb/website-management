package com.wm.service.store;

import com.wm.common.ApiException;
import com.wm.common.DataTypeUtility;
import com.wm.common.ValidationUtility;
import com.wm.service.activity_logs.ActivityLogService;
import com.wm.tenant.TenantDataSources;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.math.BigDecimal;
import java.util.*;

import static com.wm.service.store.StoreSettingsRegistry.*;

@Service
public class StoreSettingsServiceImpl implements StoreSettingsService {
    public static final String WEBHOOK_PATH = "/api/public/store/razorpay/webhook";

    @Autowired
    private TenantDataSources ds;

    @Autowired
    private RazorpayGateway razorpay;

    @Autowired
    private StoreMailer mailer;

    @Autowired
    private ActivityLogService activityLogService;

    @Override
    public Map<String, Object> getSettings() {
        Map<String, String> raw = read(ds.current());
        Map<String, Object> values = new LinkedHashMap<>();
        Map<String, Boolean> secretsSet = new LinkedHashMap<>();
        for (Setting s : ALL) {
            String v = raw.getOrDefault(s.key(), s.defaultValue());
            if (s.secret()) {
                secretsSet.put(s.key(), !DataTypeUtility.isEmpty(raw.get(s.key())));
                values.put(s.key(), "");
            } else {
                values.put(s.key(), s.kind() == Kind.BOOLEAN ? DataTypeUtility.booleanValue(v) : v);
            }
        }
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("fields", ALL);
        out.put("values", values);
        out.put("secretsSet", secretsSet);
        out.put("webhookUrl", ServletUriComponentsBuilder.fromCurrentContextPath().path(WEBHOOK_PATH).toUriString());
        return out;
    }

    /** Sirf bheje gaye keys badalte hain. Secret khaali bheja = purana rehne do. */
    @Override
    public Map<String, Object> updateSettings(Map<String, Object> param) {
        JdbcTemplate db = ds.current();
        Map<String, String> next = new LinkedHashMap<>(read(db));
        List<String> changed = new ArrayList<>();
        for (Setting s : ALL) {
            if (!param.containsKey(s.key())) continue;
            Object raw = param.get(s.key());
            if (s.secret() && DataTypeUtility.isEmpty(raw)) continue;
            String v = clean(s, raw);
            if (!Objects.equals(v, next.get(s.key()))) changed.add(s.label());
            next.put(s.key(), v);
        }
        StoreConfig cfg = StoreConfig.from(next);
        if (cfg.razorpayEnabled()) {
            if (cfg.razorpayKeyId() == null || !cfg.razorpayKeyId().startsWith("rzp_")) throw ApiException.badRequest("Razorpay Key ID must start with rzp_test_ or rzp_live_");
            if (cfg.razorpayKeySecret() == null) throw ApiException.badRequest("Razorpay Key Secret is required to enable Razorpay");
        }
        if (!cfg.codEnabled() && !cfg.razorpayEnabled()) throw ApiException.badRequest("Enable at least one payment method (Cash on Delivery or Razorpay)");

        next.forEach((k, v) -> {
            if (find(k).isEmpty()) return;
            if (v == null) db.update("DELETE FROM store_settings WHERE setting_key = ?", k);
            else db.update("INSERT INTO store_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)", k, v);
        });
        if (!changed.isEmpty()) activityLogService.addLog("store_settings", null, "UPDATE", "Store settings: " + String.join(", ", changed));
        return getSettings();
    }

    private static String clean(Setting s, Object raw) {
        String v = DataTypeUtility.stringNullValue(raw);
        if (v == null) return null;
        return switch (s.kind()) {
            case BOOLEAN -> String.valueOf(DataTypeUtility.booleanValue(raw));
            case EMAIL -> ValidationUtility.requiredEmail(v, s.label());
            case NUMBER -> {
                long n = ValidationUtility.requiredLong(v, s.label());
                if (n < 0 || n > 100_000) throw ApiException.badRequest(s.label() + " must be between 0 and 100000");
                yield String.valueOf(n);
            }
            case DECIMAL -> {
                BigDecimal d;
                try {
                    d = new BigDecimal(v.trim());
                } catch (NumberFormatException e) {
                    throw ApiException.badRequest(s.label() + " must be a number");
                }
                if (d.signum() < 0 || d.scale() > 2) throw ApiException.badRequest(s.label() + " must be 0 or more (max 2 decimals)");
                yield d.toPlainString();
            }
            case TEXT -> {
                String t = ValidationUtility.maxLength(v, 255, s.label());
                if (ORDER_PREFIX.equals(s.key()) && !t.matches("[A-Za-z0-9-]{1,10}")) throw ApiException.badRequest("Order Number Prefix: 1-10 letters / numbers");
                if ("gstin".equals(s.key()) && !t.toUpperCase().matches("\\d{2}[A-Z]{5}\\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]")) throw ApiException.badRequest("GSTIN is not valid");
                yield "gstin".equals(s.key()) ? t.toUpperCase() : t;
            }
        };
    }

    @Override
    public Map<String, Object> getPublicConfig() {
        StoreConfig c = config();
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("currency", "INR");
        out.put("pricesIncludeTax", c.pricesIncludeTax());
        out.put("shippingFee", c.shippingFee());
        out.put("freeShippingAbove", c.freeShippingAbove());
        out.put("codEnabled", c.codEnabled());
        out.put("codFee", c.codFee());
        out.put("codMaxOrder", c.codMaxOrder());
        out.put("razorpayEnabled", c.razorpayReady());
        out.put("razorpayKeyId", c.razorpayReady() ? c.razorpayKeyId() : null);
        return out;
    }

    @Override
    public StoreConfig config() {
        Map<String, String> raw = read(ds.current());
        Map<String, String> withDefaults = new HashMap<>();
        for (Setting s : ALL) withDefaults.put(s.key(), raw.getOrDefault(s.key(), DataTypeUtility.stringNullValue(s.defaultValue())));
        return StoreConfig.from(withDefaults);
    }

    @Override
    public Map<String, Object> testRazorpay() {
        StoreConfig c = config();
        if (c.razorpayKeyId() == null || c.razorpayKeySecret() == null) throw ApiException.badRequest("Save Razorpay Key ID and Key Secret first");
        razorpay.ping(c.razorpayKeyId(), c.razorpayKeySecret());
        return Map.of("ok", true, "mode", c.razorpayKeyId().startsWith("rzp_live_") ? "LIVE" : "TEST");
    }

    @Override
    public Map<String, Object> testEmail(Map<String, Object> param) {
        StoreConfig c = config();
        if (!c.mailReady()) throw ApiException.badRequest("Save SMTP Host and From Email first");
        String to = ValidationUtility.requiredEmail(param.get("to"), "Send to");
        try {
            mailer.sendNow(c, to, "Test email", StoreMailer.layout(c.businessName() != null ? c.businessName() : "Your store", "SMTP works!",
                    "<p>Order emails from your website will be sent like this.</p>"));
        } catch (Exception e) {
            throw ApiException.badRequest("Email failed: " + e.getMessage());
        }
        return Map.of("ok", true);
    }

    static Map<String, String> read(JdbcTemplate db) {
        Map<String, String> out = new HashMap<>();
        db.query("SELECT setting_key, setting_value FROM store_settings", rs -> {
            out.put(rs.getString(1), rs.getString(2));
        });
        return out;
    }
}
