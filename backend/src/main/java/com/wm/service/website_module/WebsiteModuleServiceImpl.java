package com.wm.service.website_module;

import com.wm.common.ApiException;
import com.wm.common.DataTypeUtility;
import com.wm.common.PageResult;
import com.wm.common.ValidationUtility;
import com.wm.module.FieldDef;
import com.wm.module.FieldType;
import com.wm.module.HtmlSanitizer;
import com.wm.module.ModuleDef;
import com.wm.module.ModuleRegistry;
import com.wm.security.AuthPrincipal;
import com.wm.service.activity_logs.ActivityLogService;
import com.wm.service.settings.WebsiteSettingsService;
import com.wm.settings.SiteTypeCatalog;
import com.wm.tenant.TenantDataSources;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.stereotype.Service;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Generic CRUD. Table/column names hamesha ModuleRegistry se aate hain,
 * values hamesha "?" parameters se — isliye dynamic SQL safe hai.
 */
@Service
public class WebsiteModuleServiceImpl implements WebsiteModuleService {
    private static final Set<FieldType> SORTABLE_TYPES = EnumSet.of(FieldType.TEXT, FieldType.NUMBER, FieldType.DATE, FieldType.MONTH, FieldType.REF);
    private static final Set<FieldType> FILTER_TYPES = EnumSet.of(FieldType.REF, FieldType.BOOLEAN, FieldType.SELECT, FieldType.MONTH, FieldType.NUMBER);
    private static final int MAX_PAGE_SIZE = 100;

    @Autowired
    private TenantDataSources ds;

    @Autowired
    private ModuleRegistry registry;

    @Autowired
    private ActivityLogService activityLogService;

    @Autowired
    private WebsiteSettingsService websiteSettingsService;

    /** Sirf is website type ke modules, type wale naam ke saath (Restaurant: Catalog -> Menu Items) */
    @Override
    public List<ModuleDef> getModules() {
        SiteTypeCatalog.SiteType type = SiteTypeCatalog.get(websiteSettingsService.getSettings().get("site_type"));
        return registry.all().stream()
                .filter(m -> type.modules().contains(m.key()))
                .map(m -> m.withLabel(type.labelOf(m.key(), m.label())))
                .toList();
    }

    @Override
    public List<Map<String, Object>> getDashboard() {
        JdbcTemplate db = ds.current();
        List<Map<String, Object>> out = new ArrayList<>();
        for (ModuleDef m : getModules()) {
            String pub = m.publishable() ? "COALESCE(SUM(is_publish), 0)" : "NULL";
            Map<String, Object> row = db.queryForMap("SELECT COUNT(*) AS total, " + pub + " AS published FROM `" + m.table() + "` WHERE is_deleted = 0");
            row.put("key", m.key());
            row.put("label", m.label());
            row.put("group", m.group());
            row.put("icon", m.icon());
            out.add(row);
        }
        return out;
    }

    @Override
    public PageResult<Map<String, Object>> getList(String module, Map<String, Object> param, boolean publicMode) {
        ModuleDef m = registry.get(module);
        List<Object> args = new ArrayList<>();
        StringBuilder where = new StringBuilder(" WHERE is_deleted = 0");

        if (publicMode) {
            where.append(" AND is_active = 1");
            if (m.publishable()) where.append(" AND is_publish = 1");
        } else {
            for (String flag : List.of("is_active", "is_publish")) {
                String v = DataTypeUtility.stringNullValue(param.get(flag));
                if (v != null && hasFlag(m, flag)) {
                    where.append(" AND ").append(flag).append(" = ?");
                    args.add(DataTypeUtility.booleanValue(v));
                }
            }
        }

        for (FieldDef f : m.fields()) {
            String v = DataTypeUtility.stringNullValue(param.get(f.name()));
            if (v == null) continue;
            boolean filterable = FILTER_TYPES.contains(f.type()) || "slug".equals(f.name());
            if (!filterable) continue;
            where.append(" AND `").append(f.name()).append("` = ?");
            args.add(coerce(m, f, v, null));
        }

        String q = DataTypeUtility.stringNullValue(param.get("q"));
        List<FieldDef> searchable = m.fields().stream().filter(FieldDef::searchable).toList();
        if (q != null && !searchable.isEmpty()) {
            String like = "%" + q.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
            where.append(" AND (").append(searchable.stream().map(f -> "`" + f.name() + "` LIKE ?").collect(Collectors.joining(" OR "))).append(")");
            searchable.forEach(f -> args.add(like));
        }

        int page = Math.max(DataTypeUtility.integerValue(param.get("page"), 1), 1);
        int size = Math.min(Math.max(DataTypeUtility.integerValue(param.get("size"), 20), 1), MAX_PAGE_SIZE);

        JdbcTemplate db = ds.current();
        long total = db.queryForObject("SELECT COUNT(*) FROM `" + m.table() + "`" + where, Long.class, args.toArray());

        List<Object> pageArgs = new ArrayList<>(args);
        pageArgs.add(size);
        pageArgs.add((long) (page - 1) * size);
        String sql = "SELECT " + selectColumns(m, publicMode) + " FROM `" + m.table() + "`" + where
                + " ORDER BY " + orderBy(m, DataTypeUtility.stringNullValue(param.get("sort")), DataTypeUtility.stringValue(param.get("dir")), publicMode)
                + " LIMIT ? OFFSET ?";
        List<Map<String, Object>> rows = db.queryForList(sql, pageArgs.toArray());
        rows.forEach(WebsiteModuleServiceImpl::toJsonRow);
        attachRefLabels(m, rows);
        return new PageResult<>(rows, total, page, size);
    }

    @Override
    public Map<String, Object> getRecord(String module, long id, boolean publicMode) {
        return findRecord(registry.get(module), id, publicMode);
    }

    @Override
    public Map<String, Object> getBySlug(String module, String slug) {
        Map<String, Object> param = new HashMap<>();
        param.put("slug", slug);
        param.put("size", 1);
        List<Map<String, Object>> items = getList(module, param, true).items();
        if (items.isEmpty()) throw ApiException.notFound("Not found");
        return items.get(0);
    }

    /** REF dropdown ke liye: [{id, label}] */
    @Override
    public List<Map<String, Object>> getOptions(String module) {
        ModuleDef m = registry.get(module);
        String order = m.sortable() ? "sort_order, `" + m.titleField() + "`" : "`" + m.titleField() + "`";
        return ds.current().queryForList("SELECT id, `" + m.titleField() + "` AS label FROM `" + m.table()
                + "` WHERE is_deleted = 0 AND is_active = 1 ORDER BY " + order + " LIMIT 1000");
    }

    @Override
    public Map<String, Object> addRecord(String module, Map<String, Object> param) {
        ModuleDef m = registry.get(module);
        Map<String, Object> values = readValues(m, param, null, true);

        List<String> cols = new ArrayList<>(values.keySet());
        List<Object> args = new ArrayList<>(values.values());
        cols.addAll(List.of("created_by", "created_on"));
        args.add(AuthPrincipal.current().userId());

        String sql = "INSERT INTO `" + m.table() + "` (" + cols.stream().map(c -> "`" + c + "`").collect(Collectors.joining(","))
                + ") VALUES (" + "?,".repeat(cols.size() - 1) + "NOW())";
        GeneratedKeyHolder keys = new GeneratedKeyHolder();
        ds.current().update(con -> {
            PreparedStatement ps = con.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            for (int i = 0; i < args.size(); i++) ps.setObject(i + 1, args.get(i));
            return ps;
        }, keys);
        long id = Objects.requireNonNull(keys.getKey()).longValue();
        activityLogService.addLog(m.key(), id, "CREATE", "Created \"" + values.get(m.titleField()) + "\"");
        return findRecord(m, id, false);
    }

    @Override
    public Map<String, Object> updateRecord(String module, long id, Map<String, Object> param) {
        ModuleDef m = registry.get(module);
        Map<String, Object> before = findRecord(m, id, false);
        Map<String, Object> values = readValues(m, param, id, false);
        if (values.isEmpty()) return before;

        List<String> changed = values.entrySet().stream()
                .filter(e -> !Objects.equals(DataTypeUtility.stringValue(DataTypeUtility.getJsonValue(e.getValue())),
                        DataTypeUtility.stringValue(before.get(e.getKey()))))
                .map(e -> labelOf(m, e.getKey()))
                .toList();

        List<Object> args = new ArrayList<>(values.values());
        args.add(AuthPrincipal.current().userId());
        args.add(id);
        String set = values.keySet().stream().map(c -> "`" + c + "` = ?").collect(Collectors.joining(", "));
        ds.current().update("UPDATE `" + m.table() + "` SET " + set + ", updated_by = ?, updated_on = NOW() WHERE id = ? AND is_deleted = 0", args.toArray());

        if (!changed.isEmpty()) {
            Object title = values.getOrDefault(m.titleField(), before.get(m.titleField()));
            activityLogService.addLog(m.key(), id, "UPDATE", "Updated \"" + title + "\": " + String.join(", ", changed));
        }
        return findRecord(m, id, false);
    }

    /** Sortable modules ka drag-drop order: [{id, sort_order}] */
    @Override
    public void reorderRecords(String module, List<Map<String, Object>> items) {
        ModuleDef m = registry.get(module);
        if (!m.sortable()) throw ApiException.badRequest(m.label() + " is not sortable");
        JdbcTemplate db = ds.current();
        for (Map<String, Object> it : items) {
            db.update("UPDATE `" + m.table() + "` SET sort_order = ? WHERE id = ? AND is_deleted = 0",
                    ValidationUtility.requiredLong(it.get("sort_order"), "Order"), ValidationUtility.requiredLong(it.get("id"), "Id"));
        }
        activityLogService.addLog(m.key(), null, "REORDER", "Changed display order");
    }

    /** Soft delete. Agar dusre module isko use kar rahe hain (category -> gallery) to block. */
    @Override
    public void deleteRecord(String module, long id) {
        ModuleDef m = registry.get(module);
        Map<String, Object> before = findRecord(m, id, false);
        JdbcTemplate db = ds.current();
        for (ModuleDef other : registry.all()) {
            for (FieldDef f : other.fields()) {
                if (f.type() != FieldType.REF || !m.key().equals(f.ref())) continue;
                long used = db.queryForObject("SELECT COUNT(*) FROM `" + other.table() + "` WHERE is_deleted = 0 AND `" + f.name() + "` = ?", Long.class, id);
                if (used > 0) {
                    throw ApiException.badRequest("Cannot delete: used in " + used + " " + other.label() + " record(s)");
                }
            }
        }
        db.update("UPDATE `" + m.table() + "` SET is_deleted = 1, updated_by = ?, updated_on = NOW() WHERE id = ?",
                AuthPrincipal.current().userId(), id);
        activityLogService.addLog(m.key(), id, "DELETE", "Deleted \"" + before.get(m.titleField()) + "\"");
    }

    // ------------------------------------------------------------------ helpers

    private Map<String, Object> findRecord(ModuleDef m, long id, boolean publicMode) {
        String extra = publicMode ? " AND is_active = 1" + (m.publishable() ? " AND is_publish = 1" : "") : "";
        List<Map<String, Object>> rows = ds.current().queryForList(
                "SELECT " + selectColumns(m, publicMode) + " FROM `" + m.table() + "` WHERE id = ? AND is_deleted = 0" + extra, id);
        if (rows.isEmpty()) throw ApiException.notFound(m.label() + " record not found");
        rows.forEach(WebsiteModuleServiceImpl::toJsonRow);
        attachRefLabels(m, rows);
        return rows.get(0);
    }

    /** param se sirf registry wale fields + flags lo, type ke hisaab se convert/validate karo. */
    private Map<String, Object> readValues(ModuleDef m, Map<String, Object> param, Long id, boolean creating) {
        Map<String, Object> values = new LinkedHashMap<>();
        for (FieldDef f : m.fields()) {
            if (!creating && !param.containsKey(f.name())) continue;
            Object v = coerce(m, f, param.get(f.name()), id);
            if (f.required() && v == null) throw ApiException.badRequest(f.label() + " is required");
            if (f.unique() && v != null) checkUnique(m, f, v, id);
            values.put(f.name(), v);
        }
        if (m.publishable() && param.containsKey("is_publish")) values.put("is_publish", DataTypeUtility.booleanValue(param.get("is_publish")));
        if (param.containsKey("is_active")) values.put("is_active", DataTypeUtility.booleanValue(param.get("is_active")));
        if (m.sortable() && !DataTypeUtility.isEmpty(param.get("sort_order"))) {
            values.put("sort_order", ValidationUtility.requiredLong(param.get("sort_order"), "Order"));
        }
        return values;
    }

    /** Raw value ko field type ke hisaab se validate + convert karo. Blank => null. */
    Object coerce(ModuleDef m, FieldDef f, Object raw, Long selfId) {
        if (f.type() == FieldType.BOOLEAN) return raw == null ? null : DataTypeUtility.booleanValue(raw);
        String s = DataTypeUtility.stringNullValue(raw);
        if (s == null) return null;
        return switch (f.type()) {
            case TEXT -> {
                if ("slug".equals(f.name())) {
                    s = DataTypeUtility.slugify(s);
                    if (s == null) throw ApiException.badRequest(f.label() + " must contain letters or numbers");
                }
                yield ValidationUtility.maxLength(s, 255, f.label());
            }
            case TEXTAREA -> ValidationUtility.maxLength(s, 65_000, f.label());
            case RICHTEXT -> HtmlSanitizer.clean(s);
            case URL -> {
                if (!DataTypeUtility.isValidUrl(s)) throw ApiException.badRequest(f.label() + " must be a valid URL (https://...)");
                yield ValidationUtility.maxLength(s, 500, f.label());
            }
            case IMAGE, FILE -> {
                if (!s.startsWith("/files/") && !s.matches("(?i)^https?://\\S+$")) throw ApiException.badRequest(f.label() + ": invalid file");
                yield ValidationUtility.maxLength(s, 500, f.label());
            }
            case NUMBER -> ValidationUtility.requiredLong(s, f.label());
            case DATE -> ValidationUtility.requiredDate(s, f.label());
            case MONTH -> {
                long mo = ValidationUtility.requiredLong(s, f.label());
                if (mo < 1 || mo > 12) throw ApiException.badRequest(f.label() + " must be 1-12");
                yield (int) mo;
            }
            case SELECT -> {
                if (!f.options().contains(s)) throw ApiException.badRequest(f.label() + ": invalid option");
                yield s;
            }
            case REF -> {
                long refId = ValidationUtility.requiredLong(s, f.label());
                if (selfId != null && f.ref().equals(m.key()) && refId == selfId) {
                    throw ApiException.badRequest(f.label() + " cannot be itself");
                }
                ModuleDef target = registry.get(f.ref());
                long exists = ds.current().queryForObject("SELECT COUNT(*) FROM `" + target.table() + "` WHERE id = ? AND is_deleted = 0", Long.class, refId);
                if (exists == 0) throw ApiException.badRequest(f.label() + ": selected value not found");
                yield refId;
            }
            case BOOLEAN -> throw new IllegalStateException("handled above");
        };
    }

    private void checkUnique(ModuleDef m, FieldDef f, Object v, Long id) {
        long n = ds.current().queryForObject("SELECT COUNT(*) FROM `" + m.table() + "` WHERE is_deleted = 0 AND `" + f.name() + "` = ? AND id <> ?",
                Long.class, v, id == null ? -1L : id);
        if (n > 0) throw ApiException.badRequest(f.label() + " \"" + v + "\" already exists");
    }

    private void attachRefLabels(ModuleDef m, List<Map<String, Object>> rows) {
        if (rows.isEmpty()) return;
        for (FieldDef f : m.fields()) {
            if (f.type() != FieldType.REF) continue;
            Set<Long> ids = rows.stream().map(r -> DataTypeUtility.longValue(r.get(f.name()))).filter(Objects::nonNull).collect(Collectors.toSet());
            if (ids.isEmpty()) continue;
            ModuleDef target = registry.get(f.ref());
            Map<Long, String> labels = new HashMap<>();
            ds.current().query("SELECT id, `" + target.titleField() + "` FROM `" + target.table() + "` WHERE id IN ("
                            + String.join(",", Collections.nCopies(ids.size(), "?")) + ")",
                    rs -> {
                        labels.put(rs.getLong(1), rs.getString(2));
                    }, ids.toArray());
            rows.forEach(r -> {
                Long v = DataTypeUtility.longValue(r.get(f.name()));
                r.put(f.name() + "_label", v == null ? null : labels.get(v));
            });
        }
    }

    private String selectColumns(ModuleDef m, boolean publicMode) {
        List<String> cols = new ArrayList<>();
        cols.add("id");
        m.fields().forEach(f -> cols.add("`" + f.name() + "`"));
        if (m.sortable()) cols.add("sort_order");
        if (!publicMode) {
            if (m.publishable()) cols.add("is_publish");
            cols.addAll(List.of("is_active", "created_by", "created_on", "updated_by", "updated_on"));
        }
        return String.join(", ", cols);
    }

    private String orderBy(ModuleDef m, String sort, String dir, boolean publicMode) {
        String direction = "asc".equalsIgnoreCase(dir) ? "ASC" : "DESC";
        if (sort != null) {
            boolean ok = Set.of("id", "created_on", "updated_on").contains(sort)
                    || ("sort_order".equals(sort) && m.sortable())
                    || m.field(sort).filter(f -> SORTABLE_TYPES.contains(f.type())).isPresent();
            if (ok) return "`" + sort + "` " + direction + ", id DESC";
        }
        if (publicMode) {
            if (m.sortable()) return "sort_order ASC, id DESC";
            Optional<FieldDef> date = m.fields().stream().filter(f -> f.type() == FieldType.DATE).findFirst();
            if (date.isPresent()) return "`" + date.get().name() + "` DESC, id DESC";
        }
        return "id DESC";
    }

    private static boolean hasFlag(ModuleDef m, String flag) {
        return "is_active".equals(flag) || ("is_publish".equals(flag) && m.publishable());
    }

    private static void toJsonRow(Map<String, Object> row) {
        row.replaceAll((k, v) -> DataTypeUtility.getJsonValue(v));
    }

    private static String labelOf(ModuleDef m, String col) {
        return switch (col) {
            case "is_publish" -> "Published";
            case "is_active" -> "Active";
            case "sort_order" -> "Order";
            default -> m.field(col).map(FieldDef::label).orElse(col);
        };
    }
}
