package com.wm.service.inbox;

import com.wm.common.ApiException;
import com.wm.common.DataTypeUtility;
import com.wm.common.ValidationUtility;
import com.wm.security.PublicRateLimiter;
import com.wm.service.activity_logs.ActivityLogService;
import com.wm.service.settings.WebsiteSettingsService;
import com.wm.service.store.StoreConfig;
import com.wm.service.store.StoreSettingsService;
import com.wm.service.store.StoreMailer;
import com.wm.tenant.Tenant;
import com.wm.tenant.TenantContext;
import com.wm.tenant.TenantDataSources;
import org.jsoup.Jsoup;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class InboxServiceImpl implements InboxService {
    static final int ENQUIRIES_PER_WINDOW = 5;
    static final int SUBSCRIBES_PER_WINDOW = 10;
    static final long WINDOW_SECONDS = 600;
    private static final Map<String, Object> OK = Map.of("ok", true);

    @Autowired
    private TenantDataSources ds;

    @Autowired
    private PublicRateLimiter limiter;

    @Autowired
    private ActivityLogService activityLogService;

    @Autowired
    private WebsiteSettingsService websiteSettingsService;

    @Autowired
    private StoreSettingsService storeSettingsService;

    @Autowired
    private StoreMailer mailer;

    @Override
    public Map<String, Object> submitEnquiry(Map<String, Object> param, String ip) {
        Tenant t = TenantContext.require();
        // bot ne chhupa hua field bhara => chupchap "ok" (bot ko pata na chale)
        if (!DataTypeUtility.isEmpty(param.get("website"))) return OK;
        limiter.check(t.code() + ":enquiry:" + ip, ENQUIRIES_PER_WINDOW, WINDOW_SECONDS);

        String name = ValidationUtility.requiredString(plain(param.get("name")), "Name", 150);
        String email = ValidationUtility.optionalEmail(plain(param.get("email")), "Email");
        String phone = phone(plain(param.get("phone")));
        if (email == null && phone == null) throw ApiException.badRequest("Please share your email or phone so we can reply");
        String subject = ValidationUtility.optionalString(plain(param.get("subject")), "Subject", 200);
        String message = ValidationUtility.requiredString(plain(param.get("message")), "Message", 2000);
        if (message.length() < 5) throw ApiException.badRequest("Message is too short");
        String page = ValidationUtility.optionalString(plain(param.get("page")), "Page", 255);

        JdbcTemplate db = ds.current();
        org.springframework.jdbc.support.GeneratedKeyHolder keys = new org.springframework.jdbc.support.GeneratedKeyHolder();
        Object[] args = {name, email, phone, subject, message, page};
        db.update(con -> {
            var ps = con.prepareStatement("INSERT INTO enquiries (name, email, phone, subject, message, page, status, created_on) VALUES (?, ?, ?, ?, ?, ?, 'New', NOW())",
                    java.sql.Statement.RETURN_GENERATED_KEYS);
            for (int i = 0; i < args.length; i++) ps.setObject(i + 1, args[i]);
            return ps;
        }, keys);
        Long id = keys.getKey() == null ? null : keys.getKey().longValue();
        activityLogService.addLog("enquiries", id, "CREATE", "New enquiry from " + name + (subject != null ? ": " + subject : ""));
        notifyAdmin(t, name, email, phone, subject, message, page);
        return OK;
    }

    @Override
    public Map<String, Object> subscribe(Map<String, Object> param, String ip) {
        Tenant t = TenantContext.require();
        if (!DataTypeUtility.isEmpty(param.get("website"))) return OK;
        limiter.check(t.code() + ":subscribe:" + ip, SUBSCRIBES_PER_WINDOW, WINDOW_SECONDS);
        String email = ValidationUtility.requiredEmail(plain(param.get("email")), "Email");
        String source = ValidationUtility.optionalString(plain(param.get("source")), "Source", 100);
        JdbcTemplate db = ds.current();
        List<Map<String, Object>> rows = db.queryForList("SELECT id, is_active, is_deleted FROM subscribers WHERE email = ? ORDER BY id DESC LIMIT 1", email);
        if (rows.isEmpty()) {
            db.update("INSERT INTO subscribers (email, source, created_on) VALUES (?, ?, NOW())", email, source == null ? "Website" : source);
        } else if (!DataTypeUtility.booleanValue(rows.get(0).get("is_active")) || DataTypeUtility.booleanValue(rows.get(0).get("is_deleted"))) {
            // pehle unsubscribe / delete hua tha => wapas chalu
            db.update("UPDATE subscribers SET is_active = 1, is_deleted = 0, updated_on = NOW() WHERE id = ?", rows.get(0).get("id"));
        }
        // dobara subscribe = bhi "ok" (koi email exist karta hai ya nahi, ye leak na ho)
        return OK;
    }

    /** HTML / tags hata ke saada text (admin panel me XSS na ho) */
    static String plain(Object raw) {
        String s = DataTypeUtility.stringNullValue(raw);
        return s == null ? null : DataTypeUtility.stringNullValue(Jsoup.parse(s).wholeText().replace('\u0000', ' ').trim());
    }

    static String phone(String raw) {
        if (raw == null) return null;
        String digits = raw.replaceAll("[\\s+()-]", "");
        if (!digits.matches("^\\d{10,15}$")) throw ApiException.badRequest("Phone must be a valid mobile number");
        return raw.trim();
    }

    private void notifyAdmin(Tenant t, String name, String email, String phone, String subject, String message, String page) {
        StoreConfig cfg = storeSettingsService.config();
        Map<String, String> site = websiteSettingsService.getSettings();
        String to = cfg.storeEmail() != null ? cfg.storeEmail() : DataTypeUtility.stringNullValue(site.get("email"));
        String siteName = DataTypeUtility.stringValue(site.get("site_name"), t.name());
        String body = "<p><b>" + esc(name) + "</b> sent a message from your website" + (page != null ? " (" + esc(page) + ")" : "") + ".</p>"
                + "<p>Email: " + esc(email) + "<br>Phone: " + esc(phone) + "</p>"
                + (subject != null ? "<p><b>" + esc(subject) + "</b></p>" : "")
                + "<p style=\"white-space:pre-line\">" + esc(message) + "</p>";
        mailer.send(cfg, to, "New enquiry: " + (subject != null ? subject : name), StoreMailer.layout(siteName, "New website enquiry", body));
    }

    private static String esc(String s) {
        return s == null ? "—" : org.springframework.web.util.HtmlUtils.htmlEscape(s);
    }
}
