package com.wm.service.auth;

import com.wm.security.AuthPrincipal;

import java.util.Map;

/** Website (tenant) admin panel ka login. Tenant TenantFilter se aata hai (subdomain / custom domain). */
public interface WebsiteAuthService {

    Map<String, Object> getTenantInfo();

    Map<String, Object> login(Map<String, Object> param);

    Map<String, Object> refresh(Map<String, Object> param);

    AuthPrincipal getMe();

    Map<String, Object> changePassword(Map<String, Object> param);

    void logoutAll();
}
