package com.wm.service.demo;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.wm.common.ApiException;
import com.wm.common.DataTypeUtility;
import com.wm.module.FieldDef;
import com.wm.module.FieldType;
import com.wm.module.ModuleDef;
import com.wm.module.ModuleRegistry;
import com.wm.settings.SiteTypeCatalog;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Website type ka demo data: classpath:demo/<type>.json (tools/gen_demo.py se banta hai).
 * Image value "u:<unsplash-id>" (landscape) / "p:<id>" (portrait), ref value "@<_key>".
 */
@Component
public class DemoCatalog {
    private static final String UNSPLASH = "https://images.unsplash.com/photo-";

    @Autowired
    private ObjectMapper mapper;

    @Autowired
    private ModuleRegistry registry;

    private final Map<String, Map<String, Object>> cache = new ConcurrentHashMap<>();

    /** JSON jaisa hai waisa (import ke liye). Unknown type => 404 */
    public Map<String, Object> getRaw(String type) {
        if (!SiteTypeCatalog.isValid(type)) throw ApiException.notFound("Unknown website type");
        return cache.computeIfAbsent(type, this::load);
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> getSettings(String type) {
        return (Map<String, Object>) getRaw(type).getOrDefault("settings", Map.of());
    }

    /** module -> rows (JSON order me — refs wale modules baad me aate hain) */
    @SuppressWarnings("unchecked")
    public Map<String, List<Map<String, Object>>> getModules(String type) {
        return (Map<String, List<Map<String, Object>>>) getRaw(type).getOrDefault("modules", Map.of());
    }

    /**
     * Frontend preview ke liye resolved data: har row ko negative id, refs -> id + "<field>_label",
     * images -> Unsplash URL. Website ka apna data na ho tab template isi se bhara dikhta hai.
     */
    public Map<String, Object> getPreview(String type) {
        Map<String, List<Map<String, Object>>> modules = getModules(type);
        Map<String, Long> idByKey = new HashMap<>();
        Map<String, String> titleByKey = new HashMap<>();
        long next = -1;
        Map<String, List<Map<String, Object>>> withIds = new LinkedHashMap<>();
        for (var e : modules.entrySet()) {
            ModuleDef m = registry.get(e.getKey());
            List<Map<String, Object>> rows = new ArrayList<>();
            for (Map<String, Object> row : e.getValue()) {
                Map<String, Object> copy = new LinkedHashMap<>(row);
                copy.put("id", next);
                String key = DataTypeUtility.stringNullValue(row.get("_key"));
                if (key != null) {
                    idByKey.put(m.key() + ":" + key, next);
                    titleByKey.put(m.key() + ":" + key, DataTypeUtility.stringValue(row.get(m.titleField())));
                }
                next--;
                rows.add(copy);
            }
            withIds.put(m.key(), rows);
        }

        Map<String, Object> out = new LinkedHashMap<>();
        for (var e : withIds.entrySet()) {
            ModuleDef m = registry.get(e.getKey());
            List<Map<String, Object>> rows = new ArrayList<>();
            for (Map<String, Object> row : e.getValue()) {
                Map<String, Object> r = new LinkedHashMap<>();
                r.put("id", row.get("id"));
                for (FieldDef f : m.fields()) {
                    Object v = row.get(f.name());
                    if (v == null) continue;
                    if (f.type() == FieldType.REF && v instanceof String s && s.startsWith("@")) {
                        String ref = f.ref() + ":" + s.substring(1);
                        r.put(f.name(), idByKey.get(ref));
                        r.put(f.name() + "_label", titleByKey.get(ref));
                    } else {
                        r.put(f.name(), resolveImage(v));
                    }
                }
                rows.add(r);
            }
            out.put(m.key(), rows);
        }
        return Map.of("type", type, "settings", getSettings(type), "modules", out);
    }

    /** "u:<id>" / "p:<id>" => Unsplash URL; baaki value as-is */
    public static Object resolveImage(Object v) {
        if (!(v instanceof String s)) return v;
        if (s.startsWith("u:")) return UNSPLASH + s.substring(2) + "?w=1600&q=80&auto=format&fit=crop";
        if (s.startsWith("p:")) return UNSPLASH + s.substring(2) + "?w=600&h=600&q=80&auto=format&fit=crop&crop=faces";
        return v;
    }

    public static boolean isImageRef(Object v) {
        return v instanceof String s && (s.startsWith("u:") || s.startsWith("p:"));
    }

    private Map<String, Object> load(String type) {
        try (InputStream in = new ClassPathResource("demo/" + type + ".json").getInputStream()) {
            return mapper.readValue(in, new TypeReference<LinkedHashMap<String, Object>>() {
            });
        } catch (IOException e) {
            throw ApiException.notFound("No demo data for " + type);
        }
    }
}
