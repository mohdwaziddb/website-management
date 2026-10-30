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
        public static final String MODULE_BULK = "/m/{module}/bulk";
        public static final String NOTIFICATIONS = "/notifications";
        public static final String MODULE_RECORD = "/m/{module}/{id}";
        public static final String SETTINGS = "/settings";
        public static final String LOGS = "/logs";
        public static final String FILES = "/files";
        public static final String USERS = "/users";
        public static final String USER = "/users/{id}";
        public static final String DEMO = "/demo";
        public static final String DEMO_IMPORT = "/demo/import";
        public static final String RESET = "/website/reset";
        public static final String CUSTOM_TEMPLATES = "/templates/custom";
        public static final String CUSTOM_TEMPLATE = "/templates/custom/{id}";

        private Website() {
        }
    }

    /** Public website (bina login) */
    public static final class PublicSite {
        public static final String BASE = API + "/public";
        public static final String SETTINGS = "/settings";
        public static final String MODULE = "/m/{module}";
        public static final String MODULE_RECORD = "/m/{module}/{id}";
        public static final String BY_SLUG = "/{module:pages|blogs|news_posts|news_categories|products|product_categories}/slug/{slug}";
        /** Contact form / newsletter (website visitor) */
        public static final String ENQUIRIES = "/enquiries";
        public static final String SUBSCRIBE = "/subscribe";
        /** nginx / vite: /sitemap.xml, /robots.txt -> yahan */
        public static final String SITEMAP = "/sitemap.xml";
        public static final String ROBOTS = "/robots.txt";
        /** WhatsApp / Facebook bots ke liye OG tags (?path=/news/abc) */
        public static final String SHARE = "/share";
        /** Website ka custom template (live site + preview) */
        public static final String CUSTOM_TEMPLATE = "/custom-templates/{key}";

        private PublicSite() {
        }
    }

    /** Online store — website ka customer (shopper). Login: role CUSTOMER */
    public static final class Store {
        public static final String BASE = API + "/store";
        public static final String REGISTER = "/auth/register";
        public static final String LOGIN = "/auth/login";
        public static final String REFRESH = "/auth/refresh";
        public static final String FORGOT_PASSWORD = "/auth/forgot-password";
        public static final String RESET_PASSWORD = "/auth/reset-password";
        public static final String CHANGE_PASSWORD = "/auth/change-password";
        public static final String ME = "/me";
        public static final String ADDRESSES = "/addresses";
        public static final String ADDRESS = "/addresses/{id}";
        public static final String WISHLIST = "/wishlist";
        public static final String WISHLIST_ITEM = "/wishlist/{productId}";
        public static final String REVIEWS = "/products/{productId}/reviews";
        public static final String CHECKOUT = "/checkout";
        public static final String ORDERS = "/orders";
        public static final String ORDER = "/orders/{orderNo}";
        public static final String ORDER_CANCEL = "/orders/{orderNo}/cancel";
        public static final String ORDER_PAY = "/orders/{orderNo}/pay";
        public static final String ORDER_VERIFY = "/orders/{orderNo}/razorpay/verify";

        private Store() {
        }
    }

    /** Online store — bina login (cart quote, reviews, config, Razorpay webhook) */
    public static final class StorePublic {
        public static final String BASE = API + "/public/store";
        public static final String CONFIG = "/config";
        public static final String QUOTE = "/quote";
        public static final String REVIEWS = "/products/{productId}/reviews";
        public static final String WEBHOOK = "/razorpay/webhook";

        private StorePublic() {
        }
    }

    /** Online store — admin panel (ADMIN / EDITOR; settings sirf ADMIN) */
    public static final class Shop {
        public static final String BASE = API + "/shop";
        public static final String SUMMARY = "/summary";
        public static final String ORDERS = "/orders";
        public static final String ORDER = "/orders/{id}";
        public static final String ORDER_STATUS = "/orders/{id}/status";
        public static final String ORDER_TRACKING = "/orders/{id}/tracking";
        public static final String ORDER_NOTE = "/orders/{id}/notes";
        public static final String ORDER_REFUND = "/orders/{id}/refund";
        public static final String CUSTOMERS = "/customers";
        public static final String CUSTOMER = "/customers/{id}";
        public static final String CUSTOMER_ACTIVE = "/customers/{id}/active";
        public static final String REVIEWS = "/reviews";
        public static final String REVIEW = "/reviews/{id}";
        public static final String SETTINGS = "/settings";
        public static final String SETTINGS_TEST_RAZORPAY = "/settings/test-razorpay";
        public static final String SETTINGS_TEST_EMAIL = "/settings/test-email";

        private Shop() {
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
        /** Preview me demo PDF (Downloads / E-Magazine) */
        public static final String DEMO_FILE = "/demo/files/{name:.+}";

        private Platform() {
        }
    }
}
