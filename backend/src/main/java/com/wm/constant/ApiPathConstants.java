package com.wm.constant;

/** Saare API paths ek jagah. */
public final class ApiPathConstants {

    private ApiPathConstants() {
    }

    public static final String API = "/api";

    /** Website (tenant) admin panel — subdomain ya custom domain par */
    public static final class Website {
        public static final String BASE = API;
        public static final String TENANT_INFO = "/tenant-info";
        public static final String LOGIN = "/auth/login";
        public static final String REFRESH = "/auth/refresh";
        public static final String ME = "/auth/me";
        public static final String CHANGE_PASSWORD = "/auth/change-password";
        public static final String LOGOUT_ALL = "/auth/logout-all";
        public static final String MODULES = "/modules";
        public static final String DASHBOARD = "/dashboard";
        public static final String MODULE = "/m/{module}";
        public static final String MODULE_OPTIONS = "/m/{module}/options";
        public static final String MODULE_REORDER = "/m/{module}/reorder";
        public static final String MODULE_RECORD = "/m/{module}/{id}";
        public static final String SETTINGS = "/settings";
        public static final String LOGS = "/logs";
        public static final String FILES = "/files";
        public static final String USERS = "/users";
        public static final String USER = "/users/{id}";
        public static final String DEMO = "/demo";
        public static final String DEMO_IMPORT = "/demo/import";
        public static final String RESET = "/website/reset";

        private Website() {
        }
    }

    /** Public website (bina login) */
    public static final class PublicSite {
        public static final String BASE = API + "/public";
        public static final String SETTINGS = "/settings";
        public static final String MODULE = "/m/{module}";
        public static final String MODULE_RECORD = "/m/{module}/{id}";
        public static final String BY_SLUG = "/{module:pages|blogs}/slug/{slug}";

        private PublicSite() {
        }
    }

    /** Super admin — root domain */
    public static final class Platform {
        public static final String BASE = API + "/platform";
        public static final String LOGIN = "/auth/login";
        public static final String REFRESH = "/auth/refresh";
        public static final String ME = "/auth/me";
        public static final String CHANGE_PASSWORD = "/auth/change-password";
        public static final String TENANTS = "/tenants";
        public static final String TENANT = "/tenants/{id}";
        public static final String TENANT_RESET_ADMIN = "/tenants/{id}/reset-admin";
        public static final String DOMAIN_CHECK = "/domain-check";
        /** Template preview ke liye demo data — bina login, kisi bhi domain se */
        public static final String DEMO_PREVIEW = "/demo/{type}";

        private Platform() {
        }
    }
}
