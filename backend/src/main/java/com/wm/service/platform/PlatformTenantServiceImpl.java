package com.wm.service.platform;

import com.wm.common.ApiException;
import com.wm.common.DataTypeUtility;
import com.wm.common.ValidationUtility;
import com.wm.config.AppProperties;
import com.wm.security.SecurityConfig;
import com.wm.service.demo.DemoDataService;
import com.wm.settings.SiteTypeCatalog;
import com.wm.settings.TemplateCatalog;
import com.wm.tenant.Tenant;
import com.wm.tenant.TenantDataSources;
import com.wm.tenant.TenantRepository;
import com.wm.tenant.TenantResolver;
import com.wm.tenant.TenantSchemaService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

/**
 * Naya tenant: alag MySQL database banao -> schema -> pehla admin user + settings -> master me entry.
 * Master entry sabse last, taaki aadha-bana tenant kabhi live na ho. Fail hua to naya DB drop.
 */
@Service
public class PlatformTenantServiceImpl implements PlatformTenantService {
    private static final Logger log = LoggerFactory.getLogger(PlatformTenantServiceImpl.class);

    @Autowired
    private JdbcTemplate master;

    @Autowired
    private TenantRepository tenantRepository;

    @Autowired
    private TenantResolver resolver;

    @Autowired
    private TenantDataSources dataSources;

    @Autowired
    private TenantSchemaService schemaService;

    @Autowired
    private PasswordEncoder encoder;

    @Autowired
    private AppProperties props;

    @Autowired
    private DemoDataService demoDataService;

    @Override
    public List<Tenant> getTenants() {
        return tenantRepository.findAll();
    }

    @Override
    public Tenant addTenant(Map<String, Object> param) {
        String name = ValidationUtility.requiredString(param.get("name"), "Website name", 200);
        String email = ValidationUtility.optionalEmail(param.get("contactEmail"), "Contact email");
        String adminName = ValidationUtility.requiredString(param.get("adminName"), "Admin name", 150);
        String adminEmail = ValidationUtility.requiredEmail(param.get("adminEmail"), "Admin email");
        String adminPassword = ValidationUtility.requiredPassword(param.get("adminPassword"), "Admin password");
        String siteType = DataTypeUtility.stringValue(param.get("siteType"), SiteTypeCatalog.DEFAULT);
        if (!SiteTypeCatalog.isValid(siteType)) throw ApiException.badRequest("Unknown website type");
        String template = DataTypeUtility.stringValue(param.get("template"), TemplateCatalog.defaultFor(siteType));
        if (!TemplateCatalog.isValid(template)) throw ApiException.badRequest("Unknown template");

        String sub = subdomain(param.get("subdomain"), null);
        String domain = customDomain(param.get("customDomain"), null);
        if (sub == null && domain == null) throw ApiException.badRequest("Subdomain or custom domain is required");

        String code = DataTypeUtility.lowerValue(param.get("code"));
        if (code == null) code = sub != null ? sub : codeFromDomain(domain);
        if (!resolver.valid(code)) throw ApiException.badRequest("Code: only a-z, 0-9 and '-' (1-40 chars)");
        if (tenantRepository.exists(TenantRepository.Key.CODE, code, null)) throw ApiException.badRequest("Code '" + code + "' already exists");

        // dbName sirf [a-z0-9_] — regex validated code se, isliye SQL me quote karna safe
        String dbName = props.tenantDb().dbPrefix() + code.replace('-', '_');
        try {
            master.execute("CREATE DATABASE `" + dbName + "` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        } catch (Exception e) {
            throw ApiException.badRequest("Database " + dbName + " already exists or cannot be created");
        }

        Tenant tenant;
        try {
            JdbcTemplate db = dataSources.forDb(dbName);
            schemaService.ensureSchema(db);
            db.update("INSERT INTO users (name, email, password_hash, role) VALUES (?,?,?,?)",
                    adminName, adminEmail, encoder.encode(adminPassword), SecurityConfig.ADMIN);
            db.update("INSERT INTO site_settings (setting_key, setting_value) VALUES ('site_name', ?), ('email', ?), ('template', ?), ('site_type', ?)",
                    name, email, template, siteType);
            long id = tenantRepository.insert(code, sub, domain, name, dbName, email);
            log.info("Provisioned tenant {} -> {} (subdomain={}, domain={}, type={})", code, dbName, sub, domain, siteType);
            tenant = tenantRepository.findById(id).orElseThrow();
        } catch (RuntimeException e) {
            log.error("Provisioning failed for {}, dropping {}", code, dbName, e);
            dataSources.close(dbName);
            master.execute("DROP DATABASE IF EXISTS `" + dbName + "`");
            throw e instanceof ApiException ? e : ApiException.badRequest("Website creation failed: " + e.getMessage());
        }

        // demo import fail ho to bhi website ban chuki hai — admin baad me Templates page se import kar sakta hai
        if (DataTypeUtility.booleanValue(param.get("importDemo"))) {
            try {
                demoDataService.importDemo(tenant, siteType);
            } catch (RuntimeException e) {
                log.warn("Demo import failed for {}", code, e);
            }
        }
        return tenant;
    }

    @Override
    public Tenant updateTenant(long id, Map<String, Object> param) {
        Tenant t = find(id);
        String name = ValidationUtility.requiredString(param.get("name"), "Website name", 200);
        String email = ValidationUtility.optionalEmail(param.get("contactEmail"), "Contact email");
        boolean active = DataTypeUtility.booleanValue(param.get("active"), true);
        String sub = subdomain(param.get("subdomain"), id);
        String domain = customDomain(param.get("customDomain"), id);
        if (sub == null && domain == null) throw ApiException.badRequest("Subdomain or custom domain is required");

        tenantRepository.update(id, sub, domain, name, email, active);
        // band website ka pool turant free
        if (!active) dataSources.close(t.dbName());
        return find(id);
    }

    @Override
    public void resetTenantAdmin(long id, Map<String, Object> param) {
        Tenant t = find(id);
        String email = ValidationUtility.requiredEmail(param.get("email"), "Email");
        String password = ValidationUtility.requiredPassword(param.get("password"), "Password");
        String name = ValidationUtility.optionalString(param.get("name"), "Name", 150);

        JdbcTemplate db = dataSources.forDb(t.dbName());
        int n = db.update("UPDATE users SET password_hash = ?, is_active = 1, token_version = token_version + 1 WHERE email = ?",
                encoder.encode(password), email);
        if (n == 0) {
            db.update("INSERT INTO users (name, email, password_hash, role) VALUES (?,?,?,?)",
                    DataTypeUtility.stringValue(name, "Admin"), email, encoder.encode(password), SecurityConfig.ADMIN);
        }
    }

    @Override
    public boolean isKnownDomain(String domain) {
        String d = TenantResolver.normalizeDomain(domain);
        if (d == null) return false;
        TenantResolver.HostKey key = resolver.fromHost(d);
        if (key == null) return d.equals(resolver.baseDomain());
        return tenantRepository.find(key.key(), key.value()).filter(Tenant::active).isPresent();
    }

    // ------------------------------------------------------------ validation

    private Tenant find(long id) {
        return tenantRepository.findById(id).orElseThrow(() -> ApiException.notFound("Website not found"));
    }

    private String subdomain(Object raw, Long selfId) {
        String sub = DataTypeUtility.lowerValue(raw);
        if (sub == null) return null;
        if (resolver.isReserved(sub)) throw ApiException.badRequest("Subdomain '" + sub + "' is reserved");
        if (!resolver.valid(sub)) throw ApiException.badRequest("Subdomain: only a-z, 0-9 and '-' (1-40 chars)");
        if (tenantRepository.exists(TenantRepository.Key.SUBDOMAIN, sub, selfId)) throw ApiException.badRequest("Subdomain already taken");
        return sub;
    }

    private String customDomain(Object raw, Long selfId) {
        String domain = TenantResolver.normalizeDomain(DataTypeUtility.stringNullValue(raw));
        if (domain == null) return null;
        if (!DataTypeUtility.isValidDomain(domain)) throw ApiException.badRequest("Custom domain is not valid (enter only the domain, e.g. xyz.com)");
        if (resolver.isOwnDomain(domain)) throw ApiException.badRequest("Use the subdomain field for *." + resolver.baseDomain());
        if (tenantRepository.exists(TenantRepository.Key.DOMAIN, domain, selfId)) throw ApiException.badRequest("Custom domain already used by another website");
        return domain;
    }

    /** "xyz.co.in" -> "xyz-co" (last part hata ke), max 40 */
    static String codeFromDomain(String domain) {
        String base = domain.substring(0, domain.lastIndexOf('.')).replace('.', '-').replaceAll("[^a-z0-9-]", "");
        if (base.length() > 40) base = base.substring(0, 40);
        return base.replaceAll("^-+|-+$", "");
    }
}
