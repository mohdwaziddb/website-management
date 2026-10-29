package com.wm.service.demo;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wm.module.FieldDef;
import com.wm.module.FieldType;
import com.wm.module.ModuleDef;
import com.wm.module.ModuleRegistry;
import com.wm.settings.SettingsRegistry;
import com.wm.settings.SiteTypeCatalog;
import com.wm.settings.TemplateCatalog;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.*;
import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.*;

/** Har website type ka demo JSON registry ke saath sahi hai — galat field / ref / photo yahin pakda jaata hai */
class DemoCatalogTest {
    private static final Pattern PHOTO = Pattern.compile("^[up]:\\d{10,}-[0-9a-f]{6,}$");
    private final ModuleRegistry registry = new ModuleRegistry();
    private final DemoCatalog catalog = new DemoCatalog();

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(catalog, "mapper", new ObjectMapper());
        ReflectionTestUtils.setField(catalog, "registry", registry);
    }

    @Test
    void everyTypeHasValidDemo() {
        for (SiteTypeCatalog.SiteType type : SiteTypeCatalog.all()) {
            String t = type.key();
            assertEquals(t, catalog.getRaw(t).get("type"), t);
            Map<String, Object> settings = catalog.getSettings(t);
            assertFalse(String.valueOf(settings.get("site_name")).isBlank(), t + " site_name");
            settings.keySet().forEach(k -> assertTrue(SettingsRegistry.isKnown(k), t + " unknown setting " + k));

            Set<String> keys = new HashSet<>();
            int rows = 0;
            for (var e : catalog.getModules(t).entrySet()) {
                ModuleDef m = registry.get(e.getKey());
                assertTrue(type.modules().contains(m.key()), t + ": module " + m.key() + " not enabled for this type");
                for (Map<String, Object> row : e.getValue()) {
                    rows++;
                    for (String col : row.keySet()) {
                        if (col.equals("_key")) continue;
                        FieldDef f = m.field(col).orElseThrow(() -> new AssertionError(t + ": " + m.key() + "." + col + " is not a field"));
                        Object v = row.get(col);
                        if (v == null) continue;
                        if (f.type() == FieldType.IMAGE) assertTrue(PHOTO.matcher(String.valueOf(v)).matches(), t + ": bad photo " + v);
                        if (f.type() == FieldType.REF) {
                            assertTrue(String.valueOf(v).startsWith("@"), t + ": ref must be @key");
                            assertTrue(keys.contains(f.ref() + ":" + String.valueOf(v).substring(1)), t + ": unresolved ref " + v);
                        }
                        if (f.type() == FieldType.SELECT) assertTrue(f.options().contains(String.valueOf(v)), t + ": bad option " + v + " for " + col);
                    }
                    for (FieldDef f : m.fields()) {
                        if (f.required()) assertNotNull(row.get(f.name()), t + ": " + m.key() + " missing required " + f.name());
                    }
                    if (row.get("_key") != null) keys.add(m.key() + ":" + row.get("_key"));
                }
            }
            assertTrue(rows >= 15, t + " has only " + rows + " demo rows");
            assertTrue(catalog.getModules(t).containsKey("sliders"), t + " needs sliders");
        }
    }

    @Test
    void previewResolvesRefsAndPhotos() {
        Map<String, Object> p = catalog.getPreview("restaurant");
        @SuppressWarnings("unchecked")
        Map<String, List<Map<String, Object>>> modules = (Map<String, List<Map<String, Object>>>) p.get("modules");
        Map<String, Object> photo = modules.get("image_gallery").get(0);
        assertTrue(((Number) photo.get("id")).longValue() < 0);
        assertTrue(((Number) photo.get("category_id")).longValue() < 0);
        assertEquals("Ambience", photo.get("category_id_label"));
        assertTrue(String.valueOf(photo.get("image")).startsWith("https://images.unsplash.com/photo-"));
        assertFalse(photo.containsKey("_key"));
    }

    @Test
    void siteTypesAndTemplatesAreConsistent() {
        assertEquals(15, SiteTypeCatalog.all().size());
        for (SiteTypeCatalog.SiteType type : SiteTypeCatalog.all()) {
            type.modules().forEach(m -> assertNotNull(registry.get(m)));
            type.labels().keySet().forEach(m -> assertTrue(type.modules().contains(m), type.key() + " label for disabled " + m));
            long templates = TemplateCatalog.KEYS.stream().filter(k -> type.key().equals(TemplateCatalog.typeOf(k))).count();
            assertTrue(templates >= 3, type.key() + " has " + templates + " templates");
            assertEquals(type.key(), TemplateCatalog.typeOf(TemplateCatalog.defaultFor(type.key())));
        }
        assertEquals(47, TemplateCatalog.KEYS.size());
        assertEquals("school", SiteTypeCatalog.get("nonsense").key());
        assertEquals("restaurant", TemplateCatalog.typeOf("saffron"));
    }

    @Test
    void unknownTypeIs404() {
        assertEquals(404, assertThrows(com.wm.common.ApiException.class, () -> catalog.getRaw("casino")).getStatus().value());
    }
}
