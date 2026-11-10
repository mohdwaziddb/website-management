package com.wm.security;

import com.wm.common.DataTypeUtility;
import com.wm.tenant.TenantContext;
import com.wm.tenant.TenantDataSources;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

/**
 * Access token sirf signature se valid nahi — user abhi bhi active ho aur token_version same ho.
 * Isse user disable / role change / password change / "logout all" turant lagta hai (60 min token expiry ka intezaar nahi).
 * Har request par ek primary-key query.
 */
@Component
public class SessionValidator {

    @Autowired
    private TenantDataSources ds;

    public boolean isCurrent(AuthPrincipal p, Integer tokenVersion) {
        if (tokenVersion == null || TenantContext.get() == null) return false;
        String table = AuthPrincipal.SCOPE_CUSTOMER.equals(p.scope()) ? "customers" : "users";
        List<Map<String, Object>> rows = ds.current().queryForList("SELECT token_version, is_active FROM " + table + " WHERE id = ?", p.userId());
        if (rows.isEmpty()) return false;
        Map<String, Object> u = rows.get(0);
        return DataTypeUtility.booleanValue(u.get("is_active")) && DataTypeUtility.integerValue(u.get("token_version"), -1) == tokenVersion;
    }
}
