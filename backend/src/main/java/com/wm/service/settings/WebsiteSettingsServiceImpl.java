package com.wm.service.settings;

import com.wm.common.ApiException;
import com.wm.common.DataTypeUtility;
import com.wm.common.ValidationUtility;
import com.wm.module.FieldDef;
import com.wm.module.HtmlSanitizer;
import com.wm.service.activity_logs.ActivityLogService;
import com.wm.service.templates.CustomTemplateService;
import com.wm.settings.SettingsRegistry;
import com.wm.settings.SiteTypeCatalog;
import com.wm.settings.TemplateCatalog;
import com.wm.tenant.TenantDataSources;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.function.Function;

@Service
public class WebsiteSettingsServiceImpl implements WebsiteSettingsService {

    @Autowired
    private TenantDataSources ds;

    @Autowired
    private ActivityLogService activityLogService;

    @Autowired
    private CustomTemplateService customTemplateService;

    @Override
    public Map<String, String> getSettings() {
        Map<String, String> out = new LinkedHashMap<>();
        SettingsRegistry.FIELDS.forEach(f -> out.put(f.name(), null));
        ds.current().query("SELECT setting_key, setting_value FROM site_settings", rs -> {
            if (out.containsKey(rs.getString(1))) out.put(rs.getString(1), rs.getString(2));
        });
        // purani websites (site_type nahi tha) = school
        if (!SiteTypeCatalog.isValid(out.get("site_type"))) out.put("site_type", SiteTypeCatalog.DEFAULT);
        // built-in ya is website ka custom template; delete ho gaya ho to type ka default
        if (customTemplateService.typeOf(out.get("template")) == null) out.put("template", TemplateCatalog.defaultFor(out.get("site_type")));
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
        Map<String, String> before = getSettings();
        if (clean.containsKey("template") && customTemplateService.typeOf(clean.get("template")) == null) {
            throw ApiException.badRequest("Website Template: invalid option");
        }
        matchTypeAndTemplate(clean, before, customTemplateService::typeOf);

        JdbcTemplate db = ds.current();
        clean.forEach((k, v) -> db.update("INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?) " +
                "ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)", k, v));
        boolean typeChanged = clean.containsKey("site_type") && !clean.get("site_type").equals(before.get("site_type"));
        String summary = typeChanged
                ? "Website type changed to " + SiteTypeCatalog.get(clean.get("site_type")).label() + " (template " + clean.get("template") + ")"
                : clean.containsKey("template") && !clean.get("template").equals(before.get("template"))
                ? "Website template changed to " + clean.get("template")
                : "Website settings updated";
        activityLogService.addLog("settings", null, "UPDATE", summary);
        return getSettings();
    }

    /**
     * Website type aur template hamesha match karein:
     *  - sirf template aaya (dusre type ka)  => website type bhi us template ka type (Templates page se Apply)
     *  - sirf type badla                     => template us type ka pehla (Settings me type change)
     *  - dono aaye aur match nahi            => 400
     */
    static void matchTypeAndTemplate(Map<String, String> clean, Map<String, String> before, Function<String, String> typeOf) {
        String template = clean.get("template");
        String type = clean.get("site_type");
        if (template != null) {
            String templateType = typeOf.apply(template);
            if (type != null && !type.equals(templateType)) {
                throw ApiException.badRequest("Template \"" + template + "\" is for " + SiteTypeCatalog.get(templateType).label()
                        + " websites — choose a " + SiteTypeCatalog.get(type).label() + " template");
            }
            clean.put("site_type", templateType);
        } else if (type != null && !type.equals(typeOf.apply(before.get("template")))) {
            clean.put("template", TemplateCatalog.defaultFor(type));
        }
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
                // template: built-in ya custom ("custom-<id>") — saveSettings me check hota hai
                if (!"template".equals(f.name()) && !f.options().contains(v)) throw ApiException.badRequest(f.label() + ": invalid option");
                return v;
            default:
                if ("email".equals(f.name())) return ValidationUtility.optionalEmail(v, f.label());
                if ("primary_color".equals(f.name()) && !v.matches("^#[0-9a-fA-F]{6}$")) {
                    throw ApiException.badRequest(f.label() + " must be like #1d4ed8");
                }
                if ("google_analytics_id".equals(f.name())) {
                    String id = v.trim().toUpperCase(java.util.Locale.ROOT);
                    if (!id.matches("^(G|GT|UA)-[A-Z0-9-]{4,20}$")) throw ApiException.badRequest(f.label() + " must look like G-AB12CD34EF");
                    return id;
                }
                if ("google_site_verification".equals(f.name()) && !v.trim().matches("^[A-Za-z0-9_-]{10,100}$")) {
                    throw ApiException.badRequest(f.label() + ": paste only the code inside content=\"…\"");
                }
                if ("whatsapp".equals(f.name())) {
                    String digits = v.replaceAll("[\\s+()-]", "");
                    if (!digits.matches("^\\d{10,15}$")) throw ApiException.badRequest(f.label() + " must be a mobile number, e.g. 9876543210 or +91 98765 43210");
                    return v.trim();
                }
                return ValidationUtility.maxLength(v, 255, f.label());
        }
    }
}
