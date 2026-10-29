package com.wm.tenant;

/**
 * code = permanent id (DB naam + JWT me), subdomain = code.yourdomain.com (optional),
 * customDomain = client ka apna domain jaise xyz.com (optional, bina "www.").
 */
public record Tenant(long id, String code, String subdomain, String customDomain, String name, String dbName,
                     String contactEmail, boolean active, String createdOn) {}
