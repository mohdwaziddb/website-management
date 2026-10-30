package com.wm.service.templates;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.wm.common.ApiException;
import com.wm.common.DataTypeUtility;
import com.wm.common.ValidationUtility;
import com.wm.security.AuthPrincipal;
import com.wm.service.activity_logs.ActivityLogService;
import com.wm.settings.TemplateCatalog;
import com.wm.settings.TemplateOptions;
import com.wm.tenant.TenantDataSources;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.*;

@Service
public class CustomTemplateServiceImpl implements CustomTemplateService {
    private static final int MAX_TEMPLATES = 20;
    private static final int MAX_SECTIONS = 25;

    @Autowired
    private TenantDataSources ds;

    @Autowired
    private ObjectMapper mapper;

    @Autowired
    private ActivityLogService activityLogService;

    @Override
    public List<Map<String, Object>> getCustomTemplates() {
        List<Map<String, Object>> out = new ArrayList<>();
        for (Map<String, Object> row : ds.current().queryForList("SELECT * FROM custom_templates ORDER BY id DESC")) out.add(toDto(row));
        return out;
    }

    @Override
    public Map<String, Object> getCustomTemplate(String key) {
        return toDto(findRow(idOf(key)));
    }

    @Override
    public Map<String, Object> addCustomTemplate(Map<String, Object> param) {
        Long count = ds.current().queryForObject("SELECT COUNT(*) FROM custom_templates", Long.class);
        if (count != null && count >= MAX_TEMPLATES) throw ApiException.badRequest("You can save up to " + MAX_TEMPLATES + " custom templates");
        String name = ValidationUtility.requiredString(param.get("name"), "Template name", 100);
        String base = baseTemplate(param.get("baseTemplate"));
        String config = toJson(cleanConfig(param.get("config")));

        GeneratedKeyHolder keys = new GeneratedKeyHolder();
        Long userId = AuthPrincipal.current().userId();
        ds.current().update(con -> {
            PreparedStatement ps = con.prepareStatement("INSERT INTO custom_templates (name, base_template, config, created_by) VALUES (?,?,?,?)",
                    Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, name);
            ps.setString(2, base);
            ps.setString(3, config);
            ps.setObject(4, userId);
            return ps;
        }, keys);
        long id = Objects.requireNonNull(keys.getKey()).longValue();
        activityLogService.addLog("templates", id, "CREATE", "Created custom template \"" + name + "\"");
        return toDto(findRow(id));
    }

    @Override
    public Map<String, Object> updateCustomTemplate(long id, Map<String, Object> param) {
        Map<String, Object> before = findRow(id);
        String name = ValidationUtility.requiredString(param.get("name"), "Template name", 100);
        String base = baseTemplate(param.get("baseTemplate"));
        // website par laga hai to type nahi badal sakta (warna admin menus achanak badal jaate)
        String key = KEY_PREFIX + id;
        if (key.equals(activeTemplate()) && !Objects.equals(TemplateCatalog.typeOf(base), TemplateCatalog.typeOf(String.valueOf(before.get("base_template"))))) {
            throw ApiException.badRequest("This template is live on your website — its website type cannot change");
        }
        String config = toJson(cleanConfig(param.get("config")));
        ds.current().update("UPDATE custom_templates SET name = ?, base_template = ?, config = ?, updated_on = NOW() WHERE id = ?", name, base, config, id);
        activityLogService.addLog("templates", id, "UPDATE", "Updated custom template \"" + name + "\"");
        return toDto(findRow(id));
    }

    @Override
    public void deleteCustomTemplate(long id) {
        Map<String, Object> row = findRow(id);
        if ((KEY_PREFIX + id).equals(activeTemplate())) {
            throw ApiException.badRequest("This template is live on your website — apply another template first");
        }
        ds.current().update("DELETE FROM custom_templates WHERE id = ?", id);
        activityLogService.addLog("templates", id, "DELETE", "Deleted custom template \"" + row.get("name") + "\"");
    }

    @Override
    public String typeOf(String templateKey) {
        if (templateKey == null) return null;
        if (!templateKey.startsWith(KEY_PREFIX)) return TemplateCatalog.typeOf(templateKey);
        Long id = DataTypeUtility.longValue(templateKey.substring(KEY_PREFIX.length()));
        if (id == null) return null;
        List<String> base = ds.current().queryForList("SELECT base_template FROM custom_templates WHERE id = ?", String.class, id);
        return base.isEmpty() ? null : TemplateCatalog.typeOf(base.get(0));
    }

    // ------------------------------------------------------------ validation

    /** Sirf jaani-pehchani keys aur allowed values — baaki sab chhod do (admin se aaya JSON) */
    @SuppressWarnings("unchecked")
    static Map<String, Object> cleanConfig(Object raw) {
        if (!(raw instanceof Map<?, ?> in)) throw ApiException.badRequest("Template settings are required");
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("dark", DataTypeUtility.booleanValue(in.get("dark")));

        Map<String, String> colors = new LinkedHashMap<>();
        Object c = in.get("colors");
        if (!(c instanceof Map<?, ?> cm)) throw ApiException.badRequest("Colors are required");
        for (String k : TemplateOptions.COLORS) {
            String v = DataTypeUtility.stringNullValue(cm.get(k));
            if (v == null || !v.matches("^#[0-9a-fA-F]{6}$")) throw ApiException.badRequest("Colour \"" + k + "\" must be like #1d4ed8");
            colors.put(k, v.toLowerCase(Locale.ROOT));
        }
        out.put("colors", colors);

        Object f = in.get("fonts");
        Map<String, Object> fonts = f instanceof Map<?, ?> fm ? (Map<String, Object>) fm : Map.of();
        out.put("fonts", Map.of("heading", option(fonts.get("heading"), TemplateOptions.FONTS, "Heading font"),
                "body", option(fonts.get("body"), TemplateOptions.FONTS, "Body font")));
        out.put("nav", option(in.get("nav"), TemplateOptions.NAV, "Navbar style"));
        out.put("hero", option(in.get("hero"), TemplateOptions.HERO, "Hero style"));
        out.put("heading", option(in.get("heading"), TemplateOptions.HEADING, "Heading style"));
        out.put("button", option(in.get("button"), TemplateOptions.BUTTON, "Button shape"));
        out.put("radius", option(in.get("radius"), TemplateOptions.RADIUS, "Corners"));
        out.put("card", option(in.get("card"), TemplateOptions.CARD, "Card style"));
        out.put("sections", sections(in.get("sections")));
        return out;
    }

    private static List<String> sections(Object raw) {
        if (!(raw instanceof List<?> list) || list.isEmpty()) throw ApiException.badRequest("Add at least one section");
        if (list.size() > MAX_SECTIONS) throw ApiException.badRequest("Too many sections");
        List<String> out = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        for (Object o : list) {
            String spec = DataTypeUtility.stringValue(o);
            String[] parts = spec.split(":", 2);
            List<String> variants = TemplateOptions.SECTIONS.get(parts[0]);
            if (variants == null) throw ApiException.badRequest("Unknown section \"" + parts[0] + "\"");
            if (parts.length == 2 && !variants.contains(parts[1])) throw ApiException.badRequest("Unknown style \"" + parts[1] + "\" for " + parts[0]);
            if (!seen.add(parts[0])) throw ApiException.badRequest("Section \"" + parts[0] + "\" is added twice");
            out.add(spec);
        }
        if (!"hero".equals(out.get(0))) throw ApiException.badRequest("Hero must be the first section");
        return out;
    }

    private static String option(Object raw, List<String> allowed, String label) {
        String v = DataTypeUtility.stringValue(raw);
        if (!allowed.contains(v)) throw ApiException.badRequest(label + ": invalid option");
        return v;
    }

    private static String baseTemplate(Object raw) {
        String base = DataTypeUtility.stringValue(raw);
        if (!TemplateCatalog.isValid(base)) throw ApiException.badRequest("Choose a base template");
        return base;
    }

    // ------------------------------------------------------------ helpers

    private Map<String, Object> findRow(long id) {
        List<Map<String, Object>> rows = ds.current().queryForList("SELECT * FROM custom_templates WHERE id = ?", id);
        if (rows.isEmpty()) throw ApiException.notFound("Template not found");
        return rows.get(0);
    }

    private static long idOf(String key) {
        Long id = key != null && key.startsWith(KEY_PREFIX) ? DataTypeUtility.longValue(key.substring(KEY_PREFIX.length())) : null;
        if (id == null) throw ApiException.notFound("Template not found");
        return id;
    }

    private String activeTemplate() {
        List<String> v = ds.current().queryForList("SELECT setting_value FROM site_settings WHERE setting_key = 'template'", String.class);
        return v.isEmpty() ? null : v.get(0);
    }

    private Map<String, Object> toDto(Map<String, Object> row) {
        Map<String, Object> out = new LinkedHashMap<>();
        long id = DataTypeUtility.longValue(row.get("id"), 0);
        String base = String.valueOf(row.get("base_template"));
        out.put("id", id);
        out.put("key", KEY_PREFIX + id);
        out.put("name", row.get("name"));
        out.put("baseTemplate", base);
        out.put("type", TemplateCatalog.typeOf(base));
        out.put("config", fromJson(String.valueOf(row.get("config"))));
        out.put("updatedOn", DataTypeUtility.getJsonValue(row.get("updated_on") != null ? row.get("updated_on") : row.get("created_on")));
        return out;
    }

    private String toJson(Map<String, Object> config) {
        try {
            return mapper.writeValueAsString(config);
        } catch (IOException e) {
            throw ApiException.badRequest("Invalid template settings");
        }
    }

    private Map<String, Object> fromJson(String json) {
        try {
            return mapper.readValue(json, new TypeReference<LinkedHashMap<String, Object>>() {
            });
        } catch (IOException e) {
            return Map.of();
        }
    }
}
