package com.wm.tenant;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/** Master DB ke tenants table par kaam. Lookup cache me rehta hai (har request DB hit na ho). */
@Repository
public class TenantRepository {
    private static final RowMapper<Tenant> MAPPER = (rs, i) -> new Tenant(
            rs.getLong("id"),
            rs.getString("code"),
            rs.getString("subdomain"),
            rs.getString("custom_domain"),
            rs.getString("name"),
            rs.getString("db_name"),
            rs.getString("contact_email"),
            rs.getBoolean("is_active"),
            String.valueOf(rs.getTimestamp("created_on")));

    /** Lookup / unique check ke columns (SQL me column naam sirf isi enum se). */
    public enum Key {
        CODE("code"), SUBDOMAIN("subdomain"), DOMAIN("custom_domain");

        final String column;

        Key(String column) {
            this.column = column;
        }
    }

    private final JdbcTemplate master;
    // sirf mile hue tenants cache hote hain, taaki random hosts se cache na bhare
    private final ConcurrentHashMap<String, Tenant> cache = new ConcurrentHashMap<>();

    /** migrator inject sirf order ke liye: purana master schema pehle upgrade ho. */
    public TenantRepository(JdbcTemplate master, MasterSchemaMigrator migrator) {
        this.master = master;
    }

    public Optional<Tenant> find(Key key, String value) {
        if (value == null) return Optional.empty();
        String cacheKey = key + ":" + value;
        Tenant cached = cache.get(cacheKey);
        if (cached != null) return Optional.of(cached);
        Optional<Tenant> found = master.query("SELECT * FROM tenants WHERE " + key.column + " = ?", MAPPER, value)
                .stream().findFirst();
        found.ifPresent(t -> cache.put(cacheKey, t));
        return found;
    }

    public Optional<Tenant> findById(long id) {
        return master.query("SELECT * FROM tenants WHERE id = ?", MAPPER, id).stream().findFirst();
    }

    public List<Tenant> findAll() {
        return master.query("SELECT * FROM tenants ORDER BY id DESC", MAPPER);
    }

    /** Cache ke bina — create/update ki unique validation ke liye. */
    public boolean exists(Key key, String value, Long excludeId) {
        Long n = master.queryForObject("SELECT COUNT(*) FROM tenants WHERE " + key.column + " = ? AND id <> ?",
                Long.class, value, excludeId == null ? -1L : excludeId);
        return n != null && n > 0;
    }

    public long insert(String code, String subdomain, String customDomain, String name, String dbName, String contactEmail) {
        master.update("INSERT INTO tenants (code, subdomain, custom_domain, name, db_name, contact_email) VALUES (?,?,?,?,?,?)",
                code, subdomain, customDomain, name, dbName, contactEmail);
        return master.queryForObject("SELECT id FROM tenants WHERE code = ?", Long.class, code);
    }

    public void update(long id, String subdomain, String customDomain, String name, String contactEmail, boolean active) {
        master.update("UPDATE tenants SET subdomain = ?, custom_domain = ?, name = ?, contact_email = ?, is_active = ? WHERE id = ?",
                subdomain, customDomain, name, contactEmail, active, id);
        cache.clear();
    }
}
