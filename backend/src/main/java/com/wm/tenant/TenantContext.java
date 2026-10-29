package com.wm.tenant;

import com.wm.common.ApiException;

/** Current request ka tenant. TenantFilter set karta hai, request ke end me clear. */
public final class TenantContext {
    private static final ThreadLocal<Tenant> CURRENT = new ThreadLocal<>();

    private TenantContext() {}

    public static void set(Tenant tenant) {
        CURRENT.set(tenant);
    }

    public static Tenant get() {
        return CURRENT.get();
    }

    public static Tenant require() {
        Tenant t = CURRENT.get();
        if (t == null) {
            throw ApiException.notFound("Website not found for this domain");
        }
        return t;
    }

    public static void clear() {
        CURRENT.remove();
    }
}
