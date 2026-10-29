package com.wm.service.platform;

import com.wm.tenant.Tenant;

import java.util.List;
import java.util.Map;

/**
 * Super admin: websites (tenants). Website = subdomain (abc.yourdomain.com) aur/ya client ka
 * apna domain (xyz.com) — dono me se ek zaroori. Har website ka alag MySQL database.
 */
public interface PlatformTenantService {

    List<Tenant> getTenants();

    /** param: code?, subdomain?, customDomain?, name, contactEmail?, siteType?, template?, importDemo?, adminName, adminEmail, adminPassword */
    Tenant addTenant(Map<String, Object> param);

    /** param: subdomain?, customDomain?, name, contactEmail?, active. Code / DB kabhi nahi badalta. */
    Tenant updateTenant(long id, Map<String, Object> param);

    /** Tenant admin password bhool gaya: email ka user ho to reset, warna naya ADMIN */
    void resetTenantAdmin(long id, Map<String, Object> param);

    /** Caddy on-demand TLS: domain hamara (active) hai ya nahi */
    boolean isKnownDomain(String domain);
}
