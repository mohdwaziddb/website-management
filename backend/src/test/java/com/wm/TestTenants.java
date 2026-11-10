package com.wm;

import com.wm.security.SecurityConfig;
import com.wm.tenant.Tenant;
import com.wm.tenant.TenantDataSources;
import com.wm.tenant.TenantRepository;
import com.wm.tenant.TenantSchemaService;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/**
 * Tests me website waise hi banti hai jaise live par: master tenants me row (super admin login ke saath) + provision.
 * Phir ek client ADMIN (adminEmail / Secret@123) — jaise super admin Users page se banata hai.
 * DB naam = "wmtest_" + code, taaki cleanup LIKE 'wmtest\_%' se ho.
 */
public final class TestTenants {
    public static final String ADMIN_PASSWORD = "Secret@123";
    public static final String SUPER_USERNAME = "@biziotest";
    public static final String SUPER_PASSWORD = "Super@12345";

    private TestTenants() {
    }

    public static String dbName(String code) {
        return "wmtest_" + code.replace('-', '_');
    }

    public static Tenant create(TenantRepository repo, TenantSchemaService schema, TenantDataSources ds, String code, String subdomain,
                                String customDomain, String name, String adminEmail) {
        long id = repo.insert(code, subdomain, customDomain, name, dbName(code), null, SUPER_USERNAME, SUPER_PASSWORD);
        Tenant t = repo.findById(id).orElseThrow();
        schema.provision(t);
        ds.forDb(t.dbName()).update("INSERT INTO users (name, email, password_hash, role) VALUES (?,?,?,?)",
                "Admin", adminEmail, new BCryptPasswordEncoder().encode(ADMIN_PASSWORD), SecurityConfig.ADMIN);
        return t;
    }

    /** site_type / template jaise settings (test ke liye seedha DB me) */
    public static void setting(TenantDataSources ds, Tenant t, String key, String value) {
        JdbcTemplate db = ds.forDb(t.dbName());
        db.update("REPLACE INTO site_settings (setting_key, setting_value) VALUES (?, ?)", key, value);
    }
}
