package com.wm.security;

import com.wm.common.ApiException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * Logged-in user. scope TENANT = kisi subdomain ka admin/editor, PLATFORM = super admin.
 */
public record AuthPrincipal(long userId, String name, String email, String role, String scope, String tenant) {
    public static final String SCOPE_TENANT = "TENANT";
    public static final String SCOPE_PLATFORM = "PLATFORM";
    /** Website ka shopper (online store) — table customers, sirf /api/store/** */
    public static final String SCOPE_CUSTOMER = "CUSTOMER";
    public static final String ROLE_CUSTOMER = "CUSTOMER";

    public static AuthPrincipal current() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof AuthPrincipal p) return p;
        throw ApiException.unauthorized("Login required");
    }
}
