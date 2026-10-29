package com.wm.tenant;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.Set;

/**
 * Purane master DB (v1: sirf subdomain) ko naye structure (code + custom_domain) par laata hai.
 * Idempotent — har startup par chal sakta hai. TenantRepository isse inject karta hai taaki pehle chale.
 */
@Component
public class MasterSchemaMigrator {
    private static final Logger log = LoggerFactory.getLogger(MasterSchemaMigrator.class);

    public MasterSchemaMigrator(JdbcTemplate master) {
        Set<String> cols = new HashSet<>(master.queryForList(
                "SELECT column_name FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'tenants'",
                String.class));
        if (!cols.contains("code")) {
            master.execute("ALTER TABLE tenants ADD COLUMN code VARCHAR(40) NULL AFTER id");
            master.update("UPDATE tenants SET code = subdomain WHERE code IS NULL");
            master.execute("ALTER TABLE tenants MODIFY code VARCHAR(40) NOT NULL, ADD UNIQUE KEY uk_tenants_code (code)");
            master.execute("ALTER TABLE tenants MODIFY subdomain VARCHAR(40) NULL");
            log.info("Migrated tenants: added code");
        }
        if (!cols.contains("custom_domain")) {
            master.execute("ALTER TABLE tenants ADD COLUMN custom_domain VARCHAR(253) NULL AFTER subdomain, ADD UNIQUE KEY uk_tenants_domain (custom_domain)");
            log.info("Migrated tenants: added custom_domain");
        }
    }
}
