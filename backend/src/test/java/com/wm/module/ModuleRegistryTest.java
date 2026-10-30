package com.wm.module;

import com.wm.common.ApiException;
import com.wm.settings.SettingsRegistry;
import com.wm.settings.TemplateCatalog;
import org.junit.jupiter.api.Test;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class ModuleRegistryTest {
    private final ModuleRegistry registry = new ModuleRegistry();

    @Test
    void removedModulesAreGone() {
        Set<String> keys = new HashSet<>();
        registry.all().forEach(m -> keys.add(m.key()));
        for (String removed : List.of("wings", "sessions", "classes", "transfer_certificates")) {
            assertFalse(keys.contains(removed), removed + " should be removed");
        }
        registry.all().forEach(m -> assertNotEquals("Academics", m.group()));
    }

    @Test
    void noFieldRefersToRemovedModules() {
        for (ModuleDef m : registry.all()) {
            for (FieldDef f : m.fields()) {
                assertFalse(List.of("wing_id", "session_id", "class_id").contains(f.name()), m.key() + "." + f.name());
                if (f.type() == FieldType.REF) assertNotNull(registry.get(f.ref()));
            }
        }
    }

    @Test
    void everyModuleIsValid() {
        Set<String> tables = new HashSet<>();
        for (ModuleDef m : registry.all()) {
            assertTrue(m.key().matches("[a-z_]+"), m.key());
            assertTrue(tables.add(m.table()), "duplicate table " + m.table());
            assertTrue(m.field(m.titleField()).isPresent(), m.key() + " title field");
            Set<String> names = new HashSet<>();
            m.fields().forEach(f -> assertTrue(names.add(f.name()), "duplicate field " + m.key() + "." + f.name()));
        }
    }

    @Test
    void unknownModuleIs404() {
        ApiException e = assertThrows(ApiException.class, () -> registry.get("wings"));
        assertEquals(404, e.getStatus().value());
    }

    @Test
    void settingsHaveTemplateSelect() {
        FieldDef t = SettingsRegistry.FIELDS.stream().filter(f -> f.name().equals("template")).findFirst().orElseThrow();
        assertEquals(FieldType.SELECT, t.type());
        assertEquals(TemplateCatalog.KEYS, t.options());
        assertEquals(53, TemplateCatalog.KEYS.size());
        assertTrue(TemplateCatalog.isValid("classic"));
        assertFalse(TemplateCatalog.isValid("hacker"));
    }

    @Test
    void storeValidators() {
        ModuleDef products = registry.get("products");
        assertEquals("MRP cannot be less than the selling price",
                assertThrows(ApiException.class, () -> products.validator().validate(java.util.Map.of("price", new java.math.BigDecimal("500"), "compare_price", new java.math.BigDecimal("400")))).getMessage());
        products.validator().validate(java.util.Map.of("price", new java.math.BigDecimal("500"), "compare_price", new java.math.BigDecimal("600")));

        ModuleDef coupons = registry.get("coupons");
        assertTrue(coupons.internal());
        java.util.Map<String, Object> ok = new java.util.HashMap<>(java.util.Map.of("code", "SAVE10", "discount_type", "Percent", "value", new java.math.BigDecimal("10")));
        coupons.validator().validate(ok);
        ok.put("value", new java.math.BigDecimal("150"));
        assertThrows(ApiException.class, () -> coupons.validator().validate(ok));
        ok.put("value", new java.math.BigDecimal("10"));
        ok.put("code", "BAD CODE");
        assertThrows(ApiException.class, () -> coupons.validator().validate(ok));
        ok.put("code", "SAVE10");
        ok.put("starts_on", java.time.LocalDate.of(2026, 10, 10));
        ok.put("expires_on", java.time.LocalDate.of(2026, 10, 1));
        assertEquals("Valid Till cannot be before Valid From", assertThrows(ApiException.class, () -> coupons.validator().validate(ok)).getMessage());
    }

    @Test
    void storeTablesDoNotClashWithModules() {
        Set<String> moduleTables = new HashSet<>();
        registry.all().forEach(m -> moduleTables.add(m.table()));
        for (String sql : com.wm.tenant.StoreSchema.TABLES) {
            String table = sql.replaceAll("(?s).*CREATE TABLE IF NOT EXISTS (\\w+).*", "$1");
            assertFalse(moduleTables.contains(table), table);
        }
    }
}
