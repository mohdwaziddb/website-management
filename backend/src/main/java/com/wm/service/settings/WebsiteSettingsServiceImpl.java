package com.wm.service.settings;

import com.wm.common.ApiException;
import com.wm.common.DataTypeUtility;
import com.wm.common.ValidationUtility;
import com.wm.module.FieldDef;
import com.wm.module.HtmlSanitizer;
import com.wm.service.activity_logs.ActivityLogService;
import com.wm.settings.SettingsRegistry;
import com.wm.settings.SiteTypeCatalog;
import com.wm.settings.TemplateCatalog;
import com.wm.tenant.TenantDataSources;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class WebsiteSettingsServiceImpl implements WebsiteSettingsService {

    @Autowired
    private TenantDataSources ds;

    @Autowired
    private ActivityLogService activityLogService;

    @Override
    public Map<String, String> getSettings() {
        Map<String, String> out = new LinkedHashMap<>();
        SettingsRegistry.FIELDS.forEach(f -> out.put(f.name(), null));
        ds.current().query("SELECT setting_key, setting_value FROM site_settings", rs -> {
            if (out.containsKey(rs.getString(1))) out.put(rs.getString(1), rs.getString(2));
        });
        // purani websites (site_type nahi tha) = school
        if (!SiteTypeCatalog.isValid(out.get("site_type"))) out.put("site_type", SiteTypeCatalog.DEFAULT);
        if (!TemplateCatalog.isValid(out.get("template"))) out.put("template", TemplateCatalog.defaultFor(out.get("site_type")));
        return out;
    }

    @Override
    public Map<String, Object> getSettingsForm() {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("fields", SettingsRegistry.FIELDS);
        out.put("values", getSettings());
        return out;
    }

    @Override
    public Map<String, String> saveSettings(Map<String, Object> param) {
        Map<String, String> clean = new LinkedHashMap<>();
        for (FieldDef f : SettingsRegistry.FIELDS) {
            if (param.containsKey(f.name())) clean.put(f.name(), cleanValue(f, param.get(f.name())));
        }
        if (clean.isEmpty()) throw ApiException.badRequest("Nothing to save");

        JdbcTemplate db = ds.current();
        clean.forEach((k, v) -> db.update("INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?) " +
                "ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)", k, v));
        String summary = clean.keySet().equals(java.util.Set.of("template"))
                ? "Website template changed to " + clean.get("template")
                : "Website settings updated";
        activityLogService.addLog("settings", null, "UPDATE", summary);
        return getSettings();
    }

    /** Field type ke hisaab se validate; blank => null */
    private static String cleanValue(FieldDef f, Object raw) {
        String v = DataTypeUtility.stringNullValue(raw);
        if (v == null) {
            if ("template".equals(f.name())) throw ApiException.badRequest("Template is required");
            if ("site_type".equals(f.name())) throw ApiException.badRequest("Website Type is required");
            return null;
        }
        switch (f.type()) {
            case RICHTEXT:
                return HtmlSanitizer.clean(v);
            case TEXTAREA:
                return ValidationUtility.maxLength(v, 5000, f.label());
            case URL:
                if (!DataTypeUtility.isValidUrl(v)) throw ApiException.badRequest(f.label() + " must be a valid URL (https://...)");
                return ValidationUtility.maxLength(v, 1000, f.label());
            case IMAGE:
                if (!v.startsWith("/files/") && !v.matches("(?i)^https?://\\S+$")) throw ApiException.badRequest(f.label() + ": invalid file");
                return ValidationUtility.maxLength(v, 500, f.label());
            case SELECT:
                if (!f.options().contains(v)) throw ApiException.badRequest(f.label() + ": invalid option");
                return v;
            default:
                if ("email".equals(f.name())) return ValidationUtility.optionalEmail(v, f.label());
                if ("primary_color".equals(f.name()) && !v.matches("^#[0-9a-fA-F]{6}$")) {
                    throw ApiException.badRequest(f.label() + " must be like #1d4ed8");
                }
                return ValidationUtility.maxLength(v, 255, f.label());
        }
    }
}
