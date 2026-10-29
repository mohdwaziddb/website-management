package com.wm.service.auth;

import com.wm.common.DataTypeUtility;
import com.wm.security.AuthPrincipal;
import com.wm.service.settings.WebsiteSettingsService;
import com.wm.tenant.Tenant;
import com.wm.tenant.TenantContext;
import com.wm.tenant.TenantDataSources;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class WebsiteAuthServiceImpl implements WebsiteAuthService {
    private static final String TABLE = "users";

    @Autowired
    private TenantDataSources ds;

    @Autowired
    private AccountAuthSupport accountAuthSupport;

    @Autowired
    private WebsiteSettingsService websiteSettingsService;

    @Override
    public Map<String, Object> getTenantInfo() {
        Tenant t = TenantContext.require();
        Map<String, String> s = websiteSettingsService.getSettings();
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("code", t.code());
        out.put("subdomain", t.subdomain());
        out.put("customDomain", t.customDomain());
        out.put("name", DataTypeUtility.stringValue(s.get("site_name"), t.name()));
        out.put("logo", s.get("logo"));
        out.put("template", s.get("template"));
        return out;
    }

    @Override
    public Map<String, Object> login(Map<String, Object> param) {
        Tenant t = TenantContext.require();
        Map<String, Object> tokens = accountAuthSupport.login(ds.current(), TABLE, t.code(), param, u -> principal(u, t));
        ds.current().update("UPDATE users SET last_login = NOW() WHERE email = ?", DataTypeUtility.lowerValue(param.get("email")));
        return tokens;
    }

    @Override
    public Map<String, Object> refresh(Map<String, Object> param) {
        Tenant t = TenantContext.require();
        return accountAuthSupport.refresh(ds.current(), TABLE, param, AuthPrincipal.SCOPE_TENANT, t.code(), u -> principal(u, t));
    }

    @Override
    public AuthPrincipal getMe() {
        return AuthPrincipal.current();
    }

    @Override
    public Map<String, Object> changePassword(Map<String, Object> param) {
        Tenant t = TenantContext.require();
        return accountAuthSupport.changePassword(ds.current(), TABLE, AuthPrincipal.current().userId(), param, u -> principal(u, t));
    }

    @Override
    public void logoutAll() {
        accountAuthSupport.logoutAll(ds.current(), TABLE, AuthPrincipal.current().userId());
    }

    private static AuthPrincipal principal(Map<String, Object> u, Tenant t) {
        return new AuthPrincipal(DataTypeUtility.longValue(u.get("id"), 0), DataTypeUtility.stringValue(u.get("name")),
                DataTypeUtility.stringValue(u.get("email")), DataTypeUtility.stringValue(u.get("role")), AuthPrincipal.SCOPE_TENANT, t.code());
    }
}
