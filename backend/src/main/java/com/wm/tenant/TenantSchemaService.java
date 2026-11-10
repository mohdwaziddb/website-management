package com.wm.tenant;

import com.wm.common.DataTypeUtility;
import com.wm.module.FieldDef;
import com.wm.module.FieldType;
import com.wm.module.ModuleDef;
import com.wm.module.ModuleRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import com.wm.security.SecurityConfig;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Tenant DB ka schema registry se banata hai.
 * CREATE TABLE IF NOT EXISTS + missing columns ALTER se add, to registry me naya field = startup par column ban jata hai.
 */
@Service
public class TenantSchemaService {
    private static final Logger log = LoggerFactory.getLogger(TenantSchemaService.class);

    private static final List<String> CORE_TABLES = List.of(
            """
            CREATE TABLE IF NOT EXISTS users (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(150) NOT NULL,
                email VARCHAR(200) NOT NULL UNIQUE,
                password_hash VARCHAR(100) NOT NULL,
                role VARCHAR(20) NOT NULL,
                is_active TINYINT(1) NOT NULL DEFAULT 1,
                token_version INT NOT NULL DEFAULT 0,
                last_login DATETIME NULL,
                created_on DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            )""",
            """
            CREATE TABLE IF NOT EXISTS activity_logs (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                module VARCHAR(60) NOT NULL,
                record_id BIGINT NULL,
                action VARCHAR(20) NOT NULL,
                summary TEXT NULL,
                user_id BIGINT NULL,
                user_name VARCHAR(150) NULL,
                created_on DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_logs_module_record (module, record_id)
            )""",
            """
            CREATE TABLE IF NOT EXISTS site_settings (
                setting_key VARCHAR(60) PRIMARY KEY,
                setting_value TEXT NULL
            )""",
            // admin ke apne templates (kisi built-in ko base lekar rang / font / sections badle) — reset me nahi hat-te
            """
            CREATE TABLE IF NOT EXISTS custom_templates (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                base_template VARCHAR(30) NOT NULL,
                config TEXT NOT NULL,
                created_by BIGINT NULL,
                created_on DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_on DATETIME NULL
            )"""
    );

    /** Registry se hataye gaye modules — startup par har tenant DB se drop (explicit list, auto-drop kabhi nahi). */
    static final List<String> REMOVED_TABLES = List.of("wings", "sessions", "classes", "transfer_certificates");

    /** Hataye gaye REF columns: table -> columns */
    static final Map<String, List<String>> REMOVED_COLUMNS = Map.of(
            "gallery_categories", List.of("wing_id"),
            "magazines", List.of("session_id", "class_id"),
            "magazine_thumbnails", List.of("session_id"),
            "activities", List.of("session_id", "class_id"));

    /** DB naam sirf yahi characters (SQL me backtick ke andar jata hai) */
    private static final Pattern DB_NAME = Pattern.compile("^[a-z0-9_]{1,64}$");
    /** MySQL ke apne DB — website ka DB kabhi ye na ho */
    private static final Set<String> SYSTEM_DBS = Set.of("mysql", "sys", "information_schema", "performance_schema");

    private final ModuleRegistry registry;
    private final TenantRepository tenants;
    private final TenantDataSources dataSources;
    private final JdbcTemplate master;
    private final PasswordEncoder encoder;

    public TenantSchemaService(ModuleRegistry registry, TenantRepository tenants, TenantDataSources dataSources,
                               JdbcTemplate master, PasswordEncoder encoder) {
        this.registry = registry;
        this.tenants = tenants;
        this.dataSources = dataSources;
        this.master = master;
        this.encoder = encoder;
    }

    /**
     * Startup par saare tenants: DB na ho to banao + schema sync + pehla admin. Ek tenant fail ho to baaki chalte rahen.
     * Isliye nayi website = master tenants me SQL se row + restart.
     */
    @EventListener(ApplicationReadyEvent.class)
    public void syncAll() {
        for (Tenant t : tenants.findAll()) {
            try {
                provision(t);
            } catch (Exception e) {
                log.error("Setup failed for tenant {}", t.code(), e);
            }
        }
    }

    /** Idempotent — har startup par chal sakta hai. site_name sirf tab jab khaali ho. */
    public void provision(Tenant t) {
        String dbName = t.dbName();
        if (!validDbName(dbName)) {
            log.error("Tenant {}: invalid db_name '{}' (sirf a-z, 0-9, _ ; system / master DB nahi) — skipped", t.code(), dbName);
            return;
        }
        master.execute("CREATE DATABASE IF NOT EXISTS `" + dbName + "` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        JdbcTemplate db = dataSources.forDb(dbName);
        ensureSchema(db);
        syncSuperAdmin(db, t);
        db.update("INSERT IGNORE INTO site_settings (setting_key, setting_value) VALUES ('site_name', ?)", t.name());
    }

    /**
     * Master ke admin_username / admin_password se website ka Super Admin (role ADMIN, users list me chhupa).
     * Master me password badla => restart par naya hash + token_version++ (purane sessions khatam).
     */
    private void syncSuperAdmin(JdbcTemplate db, Tenant t) {
        String login = t.superAdminLogin();
        String password = DataTypeUtility.stringNullValue(t.adminPassword());
        if (DataTypeUtility.isEmpty(login) || password == null) {
            log.warn("Tenant {}: master me admin_username / admin_password khaali — super admin nahi bana", t.code());
            return;
        }
        List<Map<String, Object>> rows = db.queryForList("SELECT id, password_hash FROM users WHERE email = ?", login);
        if (rows.isEmpty()) {
            db.update("INSERT INTO users (name, email, password_hash, role) VALUES (?,?,?,?)",
                    "Super Admin", login, encoder.encode(password), SecurityConfig.ADMIN);
            log.info("Tenant {}: super admin {} bana", t.code(), login);
        } else if (!encoder.matches(password, DataTypeUtility.stringValue(rows.get(0).get("password_hash")))) {
            db.update("UPDATE users SET password_hash = ?, role = ?, is_active = 1, token_version = token_version + 1 WHERE email = ?",
                    encoder.encode(password), SecurityConfig.ADMIN, login);
            log.info("Tenant {}: super admin password update hua", t.code());
        } else {
            db.update("UPDATE users SET role = ?, is_active = 1 WHERE email = ?", SecurityConfig.ADMIN, login);
        }
    }

    boolean validDbName(String dbName) {
        if (dbName == null || !DB_NAME.matcher(dbName).matches() || SYSTEM_DBS.contains(dbName)) return false;
        return !dbName.equals(master.queryForObject("SELECT DATABASE()", String.class));
    }

    public void ensureSchema(JdbcTemplate jdbc) {
        CORE_TABLES.forEach(jdbc::execute);
        StoreSchema.TABLES.forEach(jdbc::execute);
        dropRemoved(jdbc);
        for (ModuleDef m : registry.all()) {
            jdbc.execute(createTableSql(m));
            addMissingColumns(jdbc, m);
        }
    }

    private void dropRemoved(JdbcTemplate jdbc) {
        for (String table : REMOVED_TABLES) {
            jdbc.execute("DROP TABLE IF EXISTS `" + table + "`");
            jdbc.update("DELETE FROM activity_logs WHERE module = ?", table);
        }
        REMOVED_COLUMNS.forEach((table, cols) -> {
            Set<String> existing = columns(jdbc, table);
            for (String col : cols) {
                if (existing.contains(col)) {
                    jdbc.execute("ALTER TABLE `" + table + "` DROP COLUMN `" + col + "`");
                    log.info("Dropped column {}.{}", table, col);
                }
            }
        });
    }

    private static Set<String> columns(JdbcTemplate jdbc, String table) {
        return new HashSet<>(jdbc.queryForList(
                "SELECT column_name FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ?",
                String.class, table));
    }

    private String createTableSql(ModuleDef m) {
        List<String> cols = new ArrayList<>();
        cols.add("id BIGINT AUTO_INCREMENT PRIMARY KEY");
        for (FieldDef f : m.fields()) cols.add(columnSql(f));
        systemColumns(m).forEach(cols::add);
        for (FieldDef f : m.fields()) {
            if (f.type() == FieldType.REF) cols.add("INDEX idx_" + f.name() + " (`" + f.name() + "`)");
        }
        return "CREATE TABLE IF NOT EXISTS `" + m.table() + "` (\n  " + String.join(",\n  ", cols) + "\n)";
    }

    private void addMissingColumns(JdbcTemplate jdbc, ModuleDef m) {
        Set<String> existing = columns(jdbc, m.table());
        List<String> wanted = new ArrayList<>();
        for (FieldDef f : m.fields()) wanted.add(columnSql(f));
        wanted.addAll(systemColumns(m));
        for (String colSql : wanted) {
            String name = colSql.substring(1, colSql.indexOf('`', 1));
            if (!existing.contains(name)) {
                jdbc.execute("ALTER TABLE `" + m.table() + "` ADD COLUMN " + colSql);
                log.info("Added column {}.{}", m.table(), name);
            }
        }
    }

    private static String columnSql(FieldDef f) {
        return "`" + f.name() + "` " + f.type().sqlType + " NULL";
    }

    private static List<String> systemColumns(ModuleDef m) {
        List<String> cols = new ArrayList<>();
        if (m.sortable()) cols.add("`sort_order` INT NOT NULL DEFAULT 0");
        if (m.publishable()) cols.add("`is_publish` TINYINT(1) NOT NULL DEFAULT 0");
        cols.add("`is_active` TINYINT(1) NOT NULL DEFAULT 1");
        cols.add("`is_deleted` TINYINT(1) NOT NULL DEFAULT 0");
        // demo import se aayi row — "Remove demo data" sirf inhe hatata hai
        cols.add("`is_demo` TINYINT(1) NOT NULL DEFAULT 0");
        cols.add("`created_by` BIGINT NULL");
        cols.add("`created_on` DATETIME NULL");
        cols.add("`updated_by` BIGINT NULL");
        cols.add("`updated_on` DATETIME NULL");
        return cols;
    }
}
