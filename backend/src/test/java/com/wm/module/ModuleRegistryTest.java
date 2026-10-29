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
        assertEquals(47, TemplateCatalog.KEYS.size());
        assertTrue(TemplateCatalog.isValid("classic"));
        assertFalse(TemplateCatalog.isValid("hacker"));
    }
}
