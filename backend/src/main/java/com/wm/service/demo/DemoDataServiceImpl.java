package com.wm.service.demo;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.wm.common.ApiException;
import com.wm.common.DataTypeUtility;
import com.wm.config.AppProperties;
import com.wm.module.FieldDef;
import com.wm.module.FieldType;
import com.wm.module.ModuleDef;
import com.wm.module.ModuleRegistry;
import com.wm.security.AuthPrincipal;
import com.wm.settings.SettingsRegistry;
import com.wm.settings.SiteTypeCatalog;
import com.wm.tenant.Tenant;
import com.wm.tenant.TenantContext;
import com.wm.tenant.TenantDataSources;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
public class DemoDataServiceImpl implements DemoDataService {
    private static final Logger log = LoggerFactory.getLogger(DemoDataServiceImpl.class);
    /** Reset ke baad bhi ye settings rehti hain */
    private static final Set<String> KEEP_ON_RESET = Set.of("site_name", "site_type", "template");
    /** Demo ne kaunsi settings bhari thi (remove par sirf wahi hatengi) — registry me nahi, isliye UI me nahi dikhti */
    private static final String DEMO_SETTINGS_KEY = "_demo_settings";

    @Autowired
    private TenantDataSources ds;

    @Autowired
    private ModuleRegistry registry;

    @Autowired
    private DemoCatalog demoCatalog;

    @Autowired
    private AppProperties props;

    @Autowired
    private ObjectMapper mapper;

    /** Tests me false — photos download nahi, Unsplash URL hi save */
    @Value("${app.demo.download-images:true}")
    private boolean downloadImages;

    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).followRedirects(HttpClient.Redirect.NORMAL).build();

    // ------------------------------------------------------------ status / preview

    @Override
    public Map<String, Object> getDemoStatus() {
        JdbcTemplate db = ds.current();
        long rows = countDemoRows(db);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("siteType", siteType(db));
        out.put("demoRows", rows);
        out.put("hasDemo", rows > 0);
        return out;
    }

    @Override
    public Map<String, Object> getPreview(String siteType) {
        return demoCatalog.getPreview(siteType);
    }

    // ------------------------------------------------------------ import

    @Override
    public Map<String, Object> importDemo() {
        Tenant t = TenantContext.require();
        JdbcTemplate db = ds.current();
        AuthPrincipal p = AuthPrincipal.current();
        return importInto(db, t.code(), siteType(db), p.userId(), p.name());
    }

    @Override
    public Map<String, Object> importDemo(Tenant tenant, String siteType) {
        return importInto(ds.forDb(tenant.dbName()), tenant.code(), siteType, null, "System");
    }

    private Map<String, Object> importInto(JdbcTemplate db, String code, String siteType, Long userId, String userName) {
        if (countDemoRows(db) > 0) throw ApiException.badRequest("Demo data is already imported — remove it first");
        Map<String, List<Map<String, Object>>> modules = demoCatalog.getModules(siteType);
        Map<String, String> photos = downloadPhotos(code, modules);
        photos.putAll(copyFiles(code, modules));

        Map<String, Long> idByKey = new HashMap<>();
        int total = 0;
        for (var e : modules.entrySet()) {
            ModuleDef m = registry.get(e.getKey());
            int order = 0;
            for (Map<String, Object> row : e.getValue()) {
                long id = insertRow(db, m, row, order++, idByKey, photos, userId);
                String key = DataTypeUtility.stringNullValue(row.get("_key"));
                if (key != null) idByKey.put(m.key() + ":" + key, id);
                total++;
            }
        }

        // settings sirf jo khaali hain — admin ki bhari hui settings kabhi overwrite nahi
        Map<String, String> current = readSettings(db);
        Map<String, String> filled = new LinkedHashMap<>();
        demoCatalog.getSettings(siteType).forEach((k, v) -> {
            String value = DataTypeUtility.stringNullValue(DemoCatalog.resolveImage(v));
            if (value != null && SettingsRegistry.isKnown(k) && DataTypeUtility.isEmpty(current.get(k))) {
                saveSetting(db, k, value);
                filled.put(k, value);
            }
        });
        saveSetting(db, DEMO_SETTINGS_KEY, toJson(filled));

        addLog(db, userId, userName, "IMPORT", "Imported " + total + " demo records (" + SiteTypeCatalog.get(siteType).label() + ")");
        log.info("Demo imported for {}: {} rows, {} photos", code, total, photos.size());
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("imported", total);
        out.put("settings", filled.size());
        out.put("photos", photos.size());
        return out;
    }

    private long insertRow(JdbcTemplate db, ModuleDef m, Map<String, Object> row, int order, Map<String, Long> idByKey,
                           Map<String, String> photos, Long userId) {
        List<String> cols = new ArrayList<>();
        List<Object> args = new ArrayList<>();
        for (FieldDef f : m.fields()) {
            Object v = row.get(f.name());
            if (v == null) continue;
            if (f.type() == FieldType.REF) {
                v = v instanceof String s && s.startsWith("@") ? idByKey.get(f.ref() + ":" + s.substring(1)) : DataTypeUtility.longValue(v);
            } else if (DemoCatalog.isImageRef(v) || DemoCatalog.isFileRef(v)) {
                v = photos.getOrDefault((String) v, (String) DemoCatalog.resolveImage(v));
            } else if (f.type() == FieldType.DATE) {
                v = DataTypeUtility.dateValue(v);
            } else if (f.type() == FieldType.BOOLEAN) {
                v = DataTypeUtility.booleanValue(v);
            }
            cols.add(f.name());
            args.add(v);
        }
        if (m.publishable()) {
            cols.add("is_publish");
            args.add(true);
        }
        if (m.sortable()) {
            cols.add("sort_order");
            args.add(order);
        }
        cols.add("is_demo");
        args.add(true);
        cols.add("created_by");
        args.add(userId);

        String sql = "INSERT INTO `" + m.table() + "` (" + cols.stream().map(c -> "`" + c + "`").collect(Collectors.joining(","))
                + ", created_on) VALUES (" + "?,".repeat(cols.size()) + "NOW())";
        GeneratedKeyHolder keys = new GeneratedKeyHolder();
        db.update(con -> {
            PreparedStatement ps = con.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            for (int i = 0; i < args.size(); i++) ps.setObject(i + 1, args.get(i));
            return ps;
        }, keys);
        return Objects.requireNonNull(keys.getKey()).longValue();
    }

    /** Demo PDFs (Downloads, E-Magazine) classpath se uploads/<code>/demo/ me */
    private Map<String, String> copyFiles(String code, Map<String, List<Map<String, Object>>> modules) {
        Map<String, String> out = new HashMap<>();
        Path dir = uploadRoot().resolve(code).resolve("demo");
        modules.values().stream().flatMap(List::stream).flatMap(r -> r.values().stream()).filter(DemoCatalog::isFileRef).map(String.class::cast)
                .distinct().forEach(ref -> {
                    String name = ref.substring(2);
                    try (var in = demoCatalog.getFile(name).getInputStream()) {
                        Files.createDirectories(dir);
                        Files.copy(in, dir.resolve(name), java.nio.file.StandardCopyOption.REPLACE_EXISTING);
                        out.put(ref, "/files/" + code + "/demo/" + name);
                    } catch (IOException | RuntimeException e) {
                        log.warn("Demo file copy failed {}: {}", ref, e.getMessage());
                    }
                });
        return out;
    }

    /** Saari demo photos parallel download -> uploads/<code>/demo/. Fail ho to Unsplash URL hi rehta hai. */
    private Map<String, String> downloadPhotos(String code, Map<String, List<Map<String, Object>>> modules) {
        Set<String> refs = modules.values().stream().flatMap(List::stream).flatMap(r -> r.values().stream())
                .filter(DemoCatalog::isImageRef).map(String.class::cast).collect(Collectors.toCollection(LinkedHashSet::new));
        Map<String, String> out = new HashMap<>();
        if (!downloadImages || refs.isEmpty()) return out;

        Path dir = uploadRoot().resolve(code).resolve("demo");
        try {
            Files.createDirectories(dir);
        } catch (IOException e) {
            log.warn("Cannot create {}", dir, e);
            return out;
        }
        List<CompletableFuture<Void>> jobs = new ArrayList<>();
        for (String ref : refs) {
            String name = ref.replace(':', '-') + ".jpg";
            Path target = dir.resolve(name);
            String url = "/files/" + code + "/demo/" + name;
            if (Files.exists(target)) {
                out.put(ref, url);
                continue;
            }
            HttpRequest req = HttpRequest.newBuilder(URI.create((String) DemoCatalog.resolveImage(ref))).timeout(Duration.ofSeconds(25)).GET().build();
            jobs.add(http.sendAsync(req, HttpResponse.BodyHandlers.ofFile(target)).handle((res, err) -> {
                if (err == null && res.statusCode() == 200) {
                    synchronized (out) {
                        out.put(ref, url);
                    }
                } else {
                    log.warn("Demo photo download failed {}: {}", ref, err != null ? err.getMessage() : res.statusCode());
                    try {
                        Files.deleteIfExists(target);
                    } catch (IOException ignored) {
                        // khaali file reh gayi to bhi koi baat nahi
                    }
                }
                return null;
            }));
        }
        CompletableFuture.allOf(jobs.toArray(CompletableFuture[]::new)).join();
        return out;
    }

    // ------------------------------------------------------------ remove

    @Override
    public Map<String, Object> removeDemo() {
        Tenant t = TenantContext.require();
        JdbcTemplate db = ds.current();
        long before = countDemoRows(db);
        if (before == 0) throw ApiException.badRequest("No demo data to remove");

        // jis demo row ko admin ke apne record use kar rahe hain (category -> photo), use rakh lo
        int kept = 0;
        for (ModuleDef m : registry.all()) {
            for (FieldDef f : m.fields()) {
                if (f.type() != FieldType.REF) continue;
                ModuleDef target = registry.get(f.ref());
                List<Long> used = db.queryForList("SELECT DISTINCT `" + f.name() + "` FROM `" + m.table() + "` WHERE is_demo = 0 AND is_deleted = 0 AND `"
                        + f.name() + "` IS NOT NULL", Long.class);
                for (Long id : used) kept += db.update("UPDATE `" + target.table() + "` SET is_demo = 0 WHERE id = ? AND is_demo = 1", id);
            }
        }
        int removed = 0;
        for (ModuleDef m : registry.all()) removed += db.update("DELETE FROM `" + m.table() + "` WHERE is_demo = 1");

        // demo ki bhari settings — sirf tab hatao jab admin ne badli na ho
        Map<String, String> current = readSettings(db);
        Map<String, String> filled = fromJson(current.get(DEMO_SETTINGS_KEY));
        filled.forEach((k, v) -> {
            if (Objects.equals(current.get(k), v)) db.update("DELETE FROM site_settings WHERE setting_key = ?", k);
        });
        db.update("DELETE FROM site_settings WHERE setting_key = ?", DEMO_SETTINGS_KEY);
        if (kept == 0) deleteDir(uploadRoot().resolve(t.code()).resolve("demo"));

        AuthPrincipal p = AuthPrincipal.current();
        addLog(db, p.userId(), p.name(), "DELETE", "Removed " + removed + " demo records");
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("removed", removed);
        out.put("kept", kept);
        return out;
    }

    // ------------------------------------------------------------ reset

    @Override
    public Map<String, Object> resetWebsite(Map<String, Object> param) {
        Tenant t = TenantContext.require();
        JdbcTemplate db = ds.current();
        Map<String, String> settings = readSettings(db);
        String name = DataTypeUtility.stringValue(settings.get("site_name"), t.name());
        String confirm = DataTypeUtility.stringValue(param.get("confirm"));
        if (!confirm.equalsIgnoreCase(name.trim())) {
            throw ApiException.badRequest("Type the website name \"" + name + "\" to confirm reset");
        }

        int removed = 0;
        for (ModuleDef m : registry.all()) removed += db.update("DELETE FROM `" + m.table() + "`");
        // store: orders / customers bhi saaf (store_settings — payment keys — rehti hain)
        for (String table : List.of("order_items", "order_events", "payments", "orders", "product_reviews", "wishlist", "customer_addresses", "customers")) {
            removed += db.update("DELETE FROM " + table);
        }
        db.update("DELETE FROM site_settings WHERE setting_key NOT IN (" + KEEP_ON_RESET.stream().map(k -> "'" + k + "'").collect(Collectors.joining(",")) + ")");
        deleteDir(uploadRoot().resolve(t.code()));

        AuthPrincipal p = AuthPrincipal.current();
        addLog(db, p.userId(), p.name(), "RESET", "Website reset — " + removed + " records removed");

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("removed", removed);
        if (DataTypeUtility.booleanValue(param.get("importDemo"))) {
            out.put("demo", importInto(db, t.code(), siteType(db), p.userId(), p.name()));
        }
        return out;
    }

    // ------------------------------------------------------------ helpers

    private long countDemoRows(JdbcTemplate db) {
        long n = 0;
        for (ModuleDef m : registry.all()) {
            Long c = db.queryForObject("SELECT COUNT(*) FROM `" + m.table() + "` WHERE is_demo = 1", Long.class);
            n += c == null ? 0 : c;
        }
        return n;
    }

    private static Map<String, String> readSettings(JdbcTemplate db) {
        Map<String, String> out = new HashMap<>();
        db.query("SELECT setting_key, setting_value FROM site_settings", rs -> {
            out.put(rs.getString(1), rs.getString(2));
        });
        return out;
    }

    private static String siteType(JdbcTemplate db) {
        return SiteTypeCatalog.get(readSettings(db).get("site_type")).key();
    }

    private static void saveSetting(JdbcTemplate db, String key, String value) {
        db.update("INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)", key, value);
    }

    private static void addLog(JdbcTemplate db, Long userId, String userName, String action, String summary) {
        db.update("INSERT INTO activity_logs (module, record_id, action, summary, user_id, user_name, created_on) VALUES ('website', NULL, ?, ?, ?, ?, NOW())",
                action, summary, userId, userName);
    }

    private Path uploadRoot() {
        return Path.of(props.uploadDir()).toAbsolutePath().normalize();
    }

    private void deleteDir(Path dir) {
        if (!dir.startsWith(uploadRoot()) || !Files.exists(dir)) return;
        try (Stream<Path> walk = Files.walk(dir)) {
            walk.sorted(Comparator.reverseOrder()).forEach(p -> {
                try {
                    Files.deleteIfExists(p);
                } catch (IOException e) {
                    log.warn("Cannot delete {}", p);
                }
            });
        } catch (IOException e) {
            log.warn("Cannot clean {}", dir, e);
        }
    }

    private String toJson(Map<String, String> map) {
        try {
            return mapper.writeValueAsString(map);
        } catch (IOException e) {
            return "{}";
        }
    }

    private Map<String, String> fromJson(String json) {
        if (DataTypeUtility.isEmpty(json)) return Map.of();
        try {
            return mapper.readValue(json, new TypeReference<Map<String, String>>() {
            });
        } catch (IOException e) {
            return Map.of();
        }
    }
}
