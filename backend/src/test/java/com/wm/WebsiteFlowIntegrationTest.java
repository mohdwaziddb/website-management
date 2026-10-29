package com.wm;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.wm.tenant.TenantDataSources;
import com.wm.tenant.TenantSchemaService;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;

/**
 * Poora flow local MySQL par (alag DBs: wm_test_master + wmtest_t_*), test ke end me sab drop.
 * Host = URL ka host (http://alpha.localhost/...), isliye subdomain / custom domain resolution bhi test hota hai.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class WebsiteFlowIntegrationTest {
    private static final String ROOT = "http://localhost";
    private static final String ALPHA = "http://alpha.localhost";
    private static final String BETA = "http://www.beta-school.test";

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper json;

    @Autowired
    private JdbcTemplate master;

    @Autowired
    private TenantDataSources dataSources;

    @Autowired
    private TenantSchemaService schemaService;

    private String platformToken;
    private String alphaToken;
    private String betaToken;
    private long alphaId;

    @BeforeAll
    void cleanStart() {
        dropTenantDbs();
        master.update("DELETE FROM tenants");
    }

    @AfterAll
    void cleanEnd() {
        dropTenantDbs();
        master.execute("DROP DATABASE IF EXISTS wm_test_master");
    }

    private void dropTenantDbs() {
        for (String db : master.queryForList("SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'wmtest\\_t\\_%'", String.class)) {
            dataSources.close(db);
            master.execute("DROP DATABASE IF EXISTS `" + db + "`");
        }
    }

    // ------------------------------------------------------------ helpers

    private record Res(int status, JsonNode body) {
        JsonNode data() {
            return body.get("data");
        }

        String message() {
            return body.path("message").asText();
        }
    }

    private Res call(MockHttpServletRequestBuilder req, String token, Object body) throws Exception {
        if (token != null) req.header("Authorization", "Bearer " + token);
        if (body != null) req.contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsBytes(body));
        MvcResult r = mvc.perform(req).andReturn();
        String text = r.getResponse().getContentAsString(java.nio.charset.StandardCharsets.UTF_8);
        return new Res(r.getResponse().getStatus(), text.isEmpty() ? json.createObjectNode() : json.readTree(text));
    }

    private static Map<String, Object> map(Object... kv) {
        Map<String, Object> m = new LinkedHashMap<>();
        for (int i = 0; i < kv.length; i += 2) m.put((String) kv[i], kv[i + 1]);
        return m;
    }

    private static Map<String, Object> tenant(String sub, String domain, String name) {
        return map("subdomain", sub, "customDomain", domain, "name", name, "contactEmail", "info@" + name.toLowerCase() + ".com",
                "template", "modern", "adminName", "Admin", "adminEmail", "admin@" + name.toLowerCase() + ".com", "adminPassword", "Secret@123");
    }

    private String login(String host, String email, String password) throws Exception {
        Res r = call(post(host + "/api/auth/login"), null, map("email", email, "password", password));
        assertEquals(200, r.status(), r.message());
        assertTrue(r.body().get("success").asBoolean());
        return r.data().get("accessToken").asText();
    }

    // ------------------------------------------------------------ platform

    @Test
    @Order(1)
    void platformLogin() throws Exception {
        Res bad = call(post(ROOT + "/api/platform/auth/login"), null, map("email", "root@test.local", "password", "wrong-pass"));
        assertEquals(401, bad.status());
        assertFalse(bad.body().get("success").asBoolean());
        assertEquals("Invalid email or password", bad.message());

        assertEquals(400, call(post(ROOT + "/api/platform/auth/login"), null, map("email", "", "password", "x")).status());

        Res ok = call(post(ROOT + "/api/platform/auth/login"), null, map("email", "ROOT@test.local", "password", "Root@12345"));
        assertEquals(200, ok.status());
        platformToken = ok.data().get("accessToken").asText();
        assertEquals("SUPER_ADMIN", ok.data().get("user").get("role").asText());
    }

    @Test
    @Order(2)
    void tenantsRequireSuperAdmin() throws Exception {
        assertEquals(401, call(get(ROOT + "/api/platform/tenants"), null, null).status());
        assertEquals(200, call(get(ROOT + "/api/platform/tenants"), platformToken, null).status());
    }

    @Test
    @Order(3)
    void createTenantValidation() throws Exception {
        String url = ROOT + "/api/platform/tenants";
        assertEquals("Subdomain or custom domain is required", call(post(url), platformToken, tenant(null, null, "Gamma")).message());
        assertEquals("Subdomain 'www' is reserved", call(post(url), platformToken, tenant("www", null, "Gamma")).message());
        assertEquals(400, call(post(url), platformToken, tenant("Bad_Sub", null, "Gamma")).status());
        assertEquals("Use the subdomain field for *.localhost", call(post(url), platformToken, tenant(null, "x.localhost", "Gamma")).message());
        assertEquals(400, call(post(url), platformToken, tenant(null, "bad domain.com", "Gamma")).status());

        Map<String, Object> weak = tenant("gamma", null, "Gamma");
        weak.put("adminPassword", "123");
        assertEquals("Admin password must be 8-100 characters", call(post(url), platformToken, weak).message());

        Map<String, Object> badTpl = tenant("gamma", null, "Gamma");
        badTpl.put("template", "hacker");
        assertEquals("Unknown template", call(post(url), platformToken, badTpl).message());

        Map<String, Object> noName = tenant("gamma", null, "Gamma");
        noName.put("name", " ");
        assertEquals("Website name is required", call(post(url), platformToken, noName).message());

        assertEquals(400, call(post(url).contentType(MediaType.APPLICATION_JSON).content("{bad json"), platformToken, null).status());
    }

    @Test
    @Order(4)
    void createSubdomainAndCustomDomainTenants() throws Exception {
        Res alpha = call(post(ROOT + "/api/platform/tenants"), platformToken, tenant("alpha", null, "Alpha"));
        assertEquals(200, alpha.status(), alpha.message());
        assertEquals("alpha", alpha.data().get("code").asText());
        assertEquals("wmtest_t_alpha", alpha.data().get("dbName").asText());
        alphaId = alpha.data().get("id").asLong();

        Res beta = call(post(ROOT + "/api/platform/tenants"), platformToken, tenant(null, "WWW.Beta-School.test", "Beta"));
        assertEquals(200, beta.status(), beta.message());
        assertEquals("beta-school", beta.data().get("code").asText());
        assertEquals("beta-school.test", beta.data().get("customDomain").asText());
        assertTrue(beta.data().get("subdomain").isNull());

        assertEquals("Subdomain already taken", call(post(ROOT + "/api/platform/tenants"), platformToken, tenant("alpha", null, "Other")).message());
        assertEquals("Custom domain already used by another website",
                call(post(ROOT + "/api/platform/tenants"), platformToken, tenant("other", "beta-school.test", "Other")).message());

        Long dbs = master.queryForObject("SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name IN ('wmtest_t_alpha','wmtest_t_beta_school')", Long.class);
        assertEquals(2L, dbs);
    }

    // ------------------------------------------------------------ host resolution

    @Test
    @Order(5)
    void resolvesTenantFromHost() throws Exception {
        Res a = call(get(ALPHA + "/api/tenant-info"), null, null);
        assertEquals("alpha", a.data().get("code").asText());
        assertEquals("modern", a.data().get("template").asText());

        assertEquals("beta-school", call(get(BETA + "/api/tenant-info"), null, null).data().get("code").asText());
        assertEquals("beta-school", call(get("http://beta-school.test/api/tenant-info"), null, null).data().get("code").asText());

        assertEquals(404, call(get("http://nope.localhost/api/tenant-info"), null, null).status());
        assertEquals(404, call(get("http://unknown-client.com/api/tenant-info"), null, null).status());
        assertEquals(404, call(get(ROOT + "/api/tenant-info"), null, null).status());
        // root domain par X-Tenant header se (tools / curl)
        assertEquals("alpha", call(get(ROOT + "/api/tenant-info").header("X-Tenant", "alpha"), null, null).data().get("code").asText());
        assertEquals(400, call(get(ALPHA + "/api/tenant-info").header("X-Tenant", "beta-school"), null, null).status());
    }

    @Test
    @Order(6)
    void domainCheckForSsl() throws Exception {
        assertEquals(200, call(get(ROOT + "/api/platform/domain-check?domain=www.beta-school.test"), null, null).status());
        assertEquals(200, call(get(ROOT + "/api/platform/domain-check?domain=alpha.localhost"), null, null).status());
        assertEquals(200, call(get(ROOT + "/api/platform/domain-check?domain=localhost"), null, null).status());
        assertEquals(404, call(get(ROOT + "/api/platform/domain-check?domain=evil.com"), null, null).status());
        assertEquals(404, call(get(ROOT + "/api/platform/domain-check"), null, null).status());
    }

    // ------------------------------------------------------------ tenant auth

    @Test
    @Order(7)
    void tenantLoginAndIsolation() throws Exception {
        assertEquals(401, call(post(ALPHA + "/api/auth/login"), null, map("email", "admin@alpha.com", "password", "wrong-pass")).status());
        alphaToken = login(ALPHA, "admin@alpha.com", "Secret@123");
        betaToken = login(BETA, "admin@beta.com", "Secret@123");

        assertEquals(200, call(get(ALPHA + "/api/dashboard"), alphaToken, null).status());
        // alpha ka token beta par nahi chalega, platform token tenant par nahi
        assertEquals(401, call(get(BETA + "/api/dashboard"), alphaToken, null).status());
        assertEquals(401, call(get(ALPHA + "/api/dashboard"), platformToken, null).status());
        assertEquals(401, call(get(ROOT + "/api/platform/tenants"), alphaToken, null).status());
        assertEquals(401, call(get(ALPHA + "/api/dashboard"), null, null).status());
    }

    @Test
    @Order(8)
    void refreshToken() throws Exception {
        Res r = call(post(ALPHA + "/api/auth/login"), null, map("email", "admin@alpha.com", "password", "Secret@123"));
        String refresh = r.data().get("refreshToken").asText();
        assertEquals(200, call(post(ALPHA + "/api/auth/refresh"), null, map("refreshToken", refresh)).status());
        assertEquals(401, call(post(BETA + "/api/auth/refresh"), null, map("refreshToken", refresh)).status());
        assertEquals(401, call(post(ALPHA + "/api/auth/refresh"), null, map("refreshToken", "garbage")).status());
        assertEquals(400, call(post(ALPHA + "/api/auth/refresh"), null, map()).status());
    }

    @Test
    @Order(9)
    void loginLockAfterFiveFailures() throws Exception {
        for (int i = 0; i < 5; i++) {
            call(post(BETA + "/api/auth/login"), null, map("email", "ghost@beta.com", "password", "wrong-pass"));
        }
        assertEquals(429, call(post(BETA + "/api/auth/login"), null, map("email", "ghost@beta.com", "password", "wrong-pass")).status());
    }

    // ------------------------------------------------------------ modules

    @Test
    @Order(10)
    void moduleMetadataHasNoRemovedModules() throws Exception {
        Res r = call(get(ALPHA + "/api/modules"), alphaToken, null);
        List<String> keys = r.data().findValuesAsText("key");
        assertTrue(keys.contains("sliders"));
        assertFalse(keys.contains("wings") || keys.contains("sessions") || keys.contains("classes") || keys.contains("transfer_certificates"));
        assertEquals(404, call(get(ALPHA + "/api/m/wings"), alphaToken, null).status());
    }

    @Test
    @Order(11)
    void crudValidation() throws Exception {
        String sliders = ALPHA + "/api/m/sliders";
        assertEquals("Title is required", call(post(sliders), alphaToken, map("image", "/files/a.png")).message());
        assertEquals("Slider Image is required", call(post(sliders), alphaToken, map("title", "S1")).message());
        assertEquals("Slider Image: invalid file", call(post(sliders), alphaToken, map("title", "S1", "image", "javascript:x")).message());
        assertEquals("Link URL must be a valid URL (https://...)",
                call(post(sliders), alphaToken, map("title", "S1", "image", "/files/a.png", "link_url", "//evil.com")).message());
        assertEquals("Order must be a number",
                call(post(sliders), alphaToken, map("title", "S1", "image", "/files/a.png", "sort_order", "abc")).message());
        assertEquals("Invalid value for id", call(get(sliders + "/abc"), alphaToken, null).message());
        assertEquals(404, call(get(sliders + "/999999"), alphaToken, null).status());

        Res ok = call(post(sliders), alphaToken, map("title", "S1", "image", "/files/a.png", "is_publish", true));
        assertEquals(200, ok.status(), ok.message());
        long id = ok.data().get("id").asLong();

        Res upd = call(put(sliders + "/" + id), alphaToken, map("title", "S1 updated"));
        assertEquals("S1 updated", upd.data().get("title").asText());
        assertEquals("/files/a.png", upd.data().get("image").asText());

        Res mag = call(post(ALPHA + "/api/m/magazines"), alphaToken, map("title", "M", "file", "/files/m.pdf", "month", "13"));
        assertEquals("Month must be 1-12", mag.message());
        assertEquals("Year must be a number", call(post(ALPHA + "/api/m/magazines"), alphaToken, map("title", "M", "file", "/files/m.pdf", "year", "x")).message());
        assertEquals(200, call(post(ALPHA + "/api/m/magazines"), alphaToken, map("title", "M", "file", "/files/m.pdf", "year", "2026", "month", "4")).status());
    }

    @Test
    @Order(12)
    void slugUniqueAndSanitized() throws Exception {
        String pages = ALPHA + "/api/m/pages";
        Res p = call(post(pages), alphaToken, map("title", "About", "slug", " About Us! ", "is_publish", true,
                "page_body", "<p onclick=\"x()\">Hi</p><script>alert(1)</script>"));
        assertEquals(200, p.status(), p.message());
        assertEquals("about-us", p.data().get("slug").asText());
        assertEquals("<p>Hi</p>", p.data().get("page_body").asText());
        assertEquals("Slug (URL) \"about-us\" already exists", call(post(pages), alphaToken, map("title", "X", "slug", "about-us")).message());
        assertEquals("Slug (URL) must contain letters or numbers", call(post(pages), alphaToken, map("title", "X", "slug", "!!!")).message());
    }

    @Test
    @Order(13)
    void refBlocksDeleteAndValidates() throws Exception {
        long cat = call(post(ALPHA + "/api/m/gallery_categories"), alphaToken, map("title", "Annual Day", "is_publish", true)).data().get("id").asLong();
        assertEquals("Category: selected value not found",
                call(post(ALPHA + "/api/m/image_gallery"), alphaToken, map("title", "P", "image", "/files/p.png", "category_id", 99999)).message());
        Res img = call(post(ALPHA + "/api/m/image_gallery"), alphaToken, map("title", "P", "image", "/files/p.png", "category_id", cat, "is_publish", true));
        assertEquals("Annual Day", img.data().get("category_id_label").asText());

        assertEquals("Cannot delete: used in 1 Image Gallery record(s)",
                call(delete(ALPHA + "/api/m/gallery_categories/" + cat), alphaToken, null).message());
        long imgId = img.data().get("id").asLong();
        assertEquals(200, call(delete(ALPHA + "/api/m/image_gallery/" + imgId), alphaToken, null).status());
        assertEquals(200, call(delete(ALPHA + "/api/m/gallery_categories/" + cat), alphaToken, null).status());
        assertEquals(404, call(get(ALPHA + "/api/m/gallery_categories/" + cat), alphaToken, null).status());
    }

    @Test
    @Order(14)
    void publicApiShowsOnlyPublished() throws Exception {
        call(post(ALPHA + "/api/m/thoughts"), alphaToken, map("title", "Draft", "description", "d"));
        call(post(ALPHA + "/api/m/thoughts"), alphaToken, map("title", "Live", "description", "l", "is_publish", true));

        Res pub = call(get(ALPHA + "/api/public/m/thoughts"), null, null);
        assertEquals(1, pub.data().get("total").asInt());
        assertEquals("Live", pub.data().get("items").get(0).get("title").asText());
        assertFalse(pub.data().get("items").get(0).has("created_by"));

        assertEquals(200, call(get(ALPHA + "/api/public/pages/slug/about-us"), null, null).status());
        assertEquals(404, call(get(ALPHA + "/api/public/pages/slug/nope"), null, null).status());
        // beta ka data alpha se alag
        assertEquals(0, call(get(BETA + "/api/public/m/thoughts"), null, null).data().get("total").asInt());
        // public API se write nahi
        assertEquals(401, call(post(ALPHA + "/api/m/thoughts"), null, map("title", "x", "description", "x")).status());
    }

    // ------------------------------------------------------------ settings / template

    @Test
    @Order(15)
    void templateSettings() throws Exception {
        String url = ALPHA + "/api/settings";
        assertEquals("Website Template: invalid option", call(put(url), alphaToken, map("template", "hacker")).message());
        assertEquals("Template is required", call(put(url), alphaToken, map("template", "")).message());
        assertEquals("Email is not a valid email", call(put(url), alphaToken, map("email", "bad")).message());
        assertEquals("Theme Color must be like #1d4ed8", call(put(url), alphaToken, map("primary_color", "red")).message());
        assertEquals("Nothing to save", call(put(url), alphaToken, map("unknown", "x")).message());

        Res ok = call(put(url), alphaToken, map("template", "elegant", "about_short", "<b>Hi</b><script>x</script>"));
        assertEquals(200, ok.status(), ok.message());
        assertEquals("elegant", ok.data().get("template").asText());
        assertEquals("<b>Hi</b>", ok.data().get("about_short").asText());
        assertEquals("elegant", call(get(ALPHA + "/api/public/settings"), null, null).data().get("template").asText());
    }

    @Test
    @Order(16)
    void editorCannotManageUsersOrSettings() throws Exception {
        Res u = call(post(ALPHA + "/api/users"), alphaToken, map("name", "Ed", "email", "ed@alpha.com", "role", "EDITOR", "password", "Editor@123"));
        assertEquals(200, u.status(), u.message());
        assertEquals("Email already exists",
                call(post(ALPHA + "/api/users"), alphaToken, map("name", "Ed", "email", "ED@alpha.com", "role", "EDITOR", "password", "Editor@123")).message());
        assertEquals("Role must be ADMIN or EDITOR",
                call(post(ALPHA + "/api/users"), alphaToken, map("name", "X", "email", "x@alpha.com", "role", "ROOT", "password", "Editor@123")).message());

        String editor = login(ALPHA, "ed@alpha.com", "Editor@123");
        assertEquals(403, call(get(ALPHA + "/api/users"), editor, null).status());
        assertEquals(403, call(put(ALPHA + "/api/settings"), editor, map("template", "classic")).status());
        assertEquals(200, call(get(ALPHA + "/api/m/sliders"), editor, null).status());
    }

    @Test
    @Order(17)
    void fileUpload() throws Exception {
        MockMultipartFile png = new MockMultipartFile("file", "logo.png", "image/png", new byte[]{1, 2, 3});
        MvcResult r = mvc.perform(multipart(ALPHA + "/api/files").file(png).header("Authorization", "Bearer " + alphaToken)).andReturn();
        assertEquals(200, r.getResponse().getStatus());
        assertTrue(json.readTree(r.getResponse().getContentAsString()).get("data").get("url").asText().startsWith("/files/alpha/"));

        MockMultipartFile svg = new MockMultipartFile("file", "x.svg", "image/svg+xml", "<svg/>".getBytes());
        MvcResult bad = mvc.perform(multipart(ALPHA + "/api/files").file(svg).header("Authorization", "Bearer " + alphaToken)).andReturn();
        assertEquals(400, bad.getResponse().getStatus());
        assertTrue(bad.getResponse().getContentAsString().contains("File type .svg not allowed"));
    }

    // ------------------------------------------------------------ schema cleanup + suspend

    @Test
    @Order(18)
    void removedTablesAndColumnsAreDropped() {
        JdbcTemplate db = dataSources.forDb("wmtest_t_alpha");
        db.execute("CREATE TABLE wings (id BIGINT PRIMARY KEY)");
        db.execute("ALTER TABLE activities ADD COLUMN session_id BIGINT NULL");
        schemaService.ensureSchema(db);

        Long wings = db.queryForObject("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'wings'", Long.class);
        Long col = db.queryForObject("SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'activities' AND column_name = 'session_id'", Long.class);
        assertEquals(0L, wings);
        assertEquals(0L, col);
    }

    @Test
    @Order(19)
    void updateAndSuspendTenant() throws Exception {
        String url = ROOT + "/api/platform/tenants/" + alphaId;
        assertEquals("Subdomain or custom domain is required",
                call(put(url), platformToken, map("name", "Alpha", "subdomain", "", "customDomain", "", "active", true)).message());

        Res moved = call(put(url), platformToken, map("name", "Alpha", "subdomain", "alpha", "customDomain", "alpha-school.test", "active", true));
        assertEquals(200, moved.status(), moved.message());
        // same code => purana token naye domain par bhi chalega
        assertEquals(200, call(get("http://alpha-school.test/api/dashboard"), alphaToken, null).status());

        call(put(url), platformToken, map("name", "Alpha", "subdomain", "alpha", "customDomain", "alpha-school.test", "active", false));
        assertEquals(404, call(get(ALPHA + "/api/tenant-info"), null, null).status());
        assertEquals(404, call(get("http://alpha-school.test/api/public/settings"), null, null).status());

        call(put(url), platformToken, map("name", "Alpha", "subdomain", "alpha", "customDomain", null, "active", true));
        assertEquals(200, call(get(ALPHA + "/api/tenant-info"), null, null).status());
    }

    @Test
    @Order(20)
    void resetTenantAdmin() throws Exception {
        String url = ROOT + "/api/platform/tenants/" + alphaId + "/reset-admin";
        assertEquals(400, call(post(url), platformToken, map("email", "admin@alpha.com", "password", "x")).status());
        assertEquals(200, call(post(url), platformToken, map("email", "admin@alpha.com", "password", "NewPass@123")).status());
        // purana token ab invalid (token_version++) — refresh fail hoga, naya login chalega
        login(ALPHA, "admin@alpha.com", "NewPass@123");
        assertEquals(404, call(post(ROOT + "/api/platform/tenants/999999/reset-admin"), platformToken,
                map("email", "a@b.com", "password", "NewPass@123")).status());
    }

    // ------------------------------------------------------------ website types + demo data + reset

    private static final String GAMMA = "http://gamma.localhost";
    private String gammaToken;

    @Test
    @Order(22)
    void restaurantSiteWithDemoOnCreate() throws Exception {
        Map<String, Object> bad = tenant("gamma", null, "Gamma");
        bad.put("siteType", "casino");
        assertEquals("Unknown website type", call(post(ROOT + "/api/platform/tenants"), platformToken, bad).message());

        Map<String, Object> req = tenant("gamma", null, "Gamma");
        req.put("siteType", "restaurant");
        req.put("template", null);
        req.put("importDemo", true);
        Res r = call(post(ROOT + "/api/platform/tenants"), platformToken, req);
        assertEquals(200, r.status(), r.message());

        Res info = call(get(GAMMA + "/api/tenant-info"), null, null);
        assertEquals("saffron", info.data().get("template").asText());
        assertEquals("Gamma", info.data().get("name").asText()); // demo ne site_name overwrite nahi kiya

        gammaToken = login(GAMMA, "admin@gamma.com", "Secret@123");
        JsonNode modules = call(get(GAMMA + "/api/modules"), gammaToken, null).data();
        Map<String, String> labels = new LinkedHashMap<>();
        modules.forEach(m -> labels.put(m.get("key").asText(), m.get("label").asText()));
        assertEquals("Menu Items", labels.get("catalog_items"));
        assertEquals("Chefs", labels.get("team_members"));
        assertFalse(labels.containsKey("tenders") || labels.containsKey("thoughts") || labels.containsKey("magazines"));

        Res menu = call(get(GAMMA + "/api/public/m/catalog_items"), null, null);
        assertEquals(8, menu.data().get("total").asInt());
        assertTrue(menu.data().get("items").get(0).get("image").asText().startsWith("https://images.unsplash.com/"));
        assertEquals("Slow-cooked flavours, warm hospitality", call(get(GAMMA + "/api/public/settings"), null, null).data().get("tagline").asText());
    }

    @Test
    @Order(23)
    void demoStatusAndDoubleImport() throws Exception {
        Res s = call(get(GAMMA + "/api/demo"), gammaToken, null);
        assertTrue(s.data().get("hasDemo").asBoolean());
        assertEquals("restaurant", s.data().get("siteType").asText());
        assertEquals("Demo data is already imported — remove it first", call(post(GAMMA + "/api/demo/import"), gammaToken, null).message());
    }

    @Test
    @Order(24)
    void removeDemoKeepsAdminData() throws Exception {
        long demoCat = call(get(GAMMA + "/api/m/gallery_categories"), gammaToken, null).data().get("items").get(0).get("id").asLong();
        Res own = call(post(GAMMA + "/api/m/image_gallery"), gammaToken, map("title", "My own photo", "image", "/files/x.png", "category_id", demoCat, "is_publish", true));
        assertEquals(200, own.status(), own.message());
        call(put(GAMMA + "/api/settings"), gammaToken, map("phone", "+91 11111 22222"));

        Res r = call(delete(GAMMA + "/api/demo"), gammaToken, null);
        assertEquals(200, r.status(), r.message());
        assertEquals(1, r.data().get("kept").asInt());

        assertEquals(0, call(get(GAMMA + "/api/m/catalog_items"), gammaToken, null).data().get("total").asInt());
        assertEquals(1, call(get(GAMMA + "/api/m/image_gallery"), gammaToken, null).data().get("total").asInt());
        assertEquals(1, call(get(GAMMA + "/api/m/gallery_categories"), gammaToken, null).data().get("total").asInt());
        JsonNode settings = call(get(GAMMA + "/api/public/settings"), null, null).data();
        assertTrue(settings.get("tagline").isNull());                       // demo ki setting hati
        assertEquals("+91 11111 22222", settings.get("phone").asText());     // admin ki badli hui setting rahi
        assertEquals("No demo data to remove", call(delete(GAMMA + "/api/demo"), gammaToken, null).message());

        Res again = call(post(GAMMA + "/api/demo/import"), gammaToken, null);
        assertEquals(200, again.status(), again.message());
        assertTrue(again.data().get("imported").asInt() > 30);
    }

    @Test
    @Order(25)
    void resetWebsite() throws Exception {
        assertEquals("Type the website name \"Gamma\" to confirm reset", call(post(GAMMA + "/api/website/reset"), gammaToken, map("confirm", "nope")).message());
        Res editor = call(post(GAMMA + "/api/users"), gammaToken, map("name", "Ed", "email", "ed@gamma.com", "role", "EDITOR", "password", "Editor@123"));
        assertEquals(200, editor.status(), editor.message());
        String editorToken = login(GAMMA, "ed@gamma.com", "Editor@123");
        assertEquals(403, call(post(GAMMA + "/api/website/reset"), editorToken, map("confirm", "Gamma")).status());
        assertEquals(403, call(post(GAMMA + "/api/demo/import"), editorToken, null).status());

        Res r = call(post(GAMMA + "/api/website/reset"), gammaToken, map("confirm", " gamma "));
        assertEquals(200, r.status(), r.message());
        for (String m : List.of("catalog_items", "image_gallery", "gallery_categories", "sliders")) {
            assertEquals(0, call(get(GAMMA + "/api/m/" + m), gammaToken, null).data().get("total").asInt(), m);
        }
        JsonNode settings = call(get(GAMMA + "/api/public/settings"), null, null).data();
        assertEquals("Gamma", settings.get("site_name").asText());
        assertEquals("restaurant", settings.get("site_type").asText());
        assertTrue(settings.get("phone").isNull());
        // users reset me nahi jaate
        assertEquals(200, call(get(GAMMA + "/api/m/sliders"), editorToken, null).status());

        Res withDemo = call(post(GAMMA + "/api/website/reset"), gammaToken, map("confirm", "Gamma", "importDemo", true));
        assertEquals(200, withDemo.status(), withDemo.message());
        assertEquals(8, call(get(GAMMA + "/api/m/catalog_items"), gammaToken, null).data().get("total").asInt());
    }

    @Test
    @Order(26)
    void publicDemoPreviewAndTypeSwitch() throws Exception {
        Res gym = call(get(ROOT + "/api/platform/demo/gym"), null, null);
        assertEquals(200, gym.status());
        assertEquals("Iron Pulse Fitness", gym.data().get("settings").get("site_name").asText());
        assertTrue(gym.data().get("modules").get("pricing_plans").size() >= 3);
        assertEquals(200, call(get(GAMMA + "/api/platform/demo/hospital"), null, null).status());
        assertEquals(404, call(get(ROOT + "/api/platform/demo/casino"), null, null).status());

        // admin type badle => menus badle
        assertEquals(200, call(put(GAMMA + "/api/settings"), gammaToken, map("site_type", "gym")).status());
        JsonNode modules = call(get(GAMMA + "/api/modules"), gammaToken, null).data();
        assertTrue(modules.findValuesAsText("label").contains("Memberships"));
        assertEquals("Website Type: invalid option", call(put(GAMMA + "/api/settings"), gammaToken, map("site_type", "casino")).message());
    }

    @Test
    @Order(27)
    void usersPageRules() throws Exception {
        JsonNode users = call(get(GAMMA + "/api/users"), gammaToken, null).data();
        long adminId = -1, editorId = -1;
        for (JsonNode u : users) {
            if (u.get("email").asText().equals("admin@gamma.com")) adminId = u.get("id").asLong();
            if (u.get("email").asText().equals("ed@gamma.com")) editorId = u.get("id").asLong();
        }
        // apna sirf naam badla => session chalta rahe (pehle yahin logout ho jata tha)
        Res self = call(put(GAMMA + "/api/users/" + adminId), gammaToken, map("name", "Gamma Owner", "email", "admin@gamma.com", "role", "ADMIN", "isActive", true));
        assertEquals(200, self.status(), self.message());
        assertEquals("Gamma Owner", self.data().get("name").asText());
        assertEquals(200, call(get(GAMMA + "/api/dashboard"), gammaToken, null).status());

        assertEquals("Change your own password from the Profile page",
                call(put(GAMMA + "/api/users/" + adminId), gammaToken, map("name", "G", "email", "admin@gamma.com", "role", "ADMIN", "isActive", true, "password", "NewPass@123")).message());
        assertEquals("You cannot disable or demote yourself",
                call(put(GAMMA + "/api/users/" + adminId), gammaToken, map("name", "G", "email", "admin@gamma.com", "role", "EDITOR", "isActive", true)).message());
        assertEquals(404, call(put(GAMMA + "/api/users/999999"), gammaToken, map("name", "X", "email", "x@gamma.com", "role", "EDITOR")).status());

        // editor ka naam badla => uska session chalta rahe; email badla => logout
        String editorToken = login(GAMMA, "ed@gamma.com", "Editor@123");
        call(put(GAMMA + "/api/users/" + editorId), gammaToken, map("name", "Ed Writer", "email", "ed@gamma.com", "role", "EDITOR", "isActive", true));
        assertEquals(200, call(get(GAMMA + "/api/dashboard"), editorToken, null).status());
        call(put(GAMMA + "/api/users/" + editorId), gammaToken, map("name", "Ed Writer", "email", "editor@gamma.com", "role", "EDITOR", "isActive", true));
        Res stale = call(post(GAMMA + "/api/auth/login"), null, map("email", "ed@gamma.com", "password", "Editor@123"));
        assertEquals(401, stale.status());
        login(GAMMA, "editor@gamma.com", "Editor@123");

        // dusra admin pehle wale ko disable kare => pehle wale ka session turant khatam; khud ko delete nahi kar sakta
        Res second = call(post(GAMMA + "/api/users"), gammaToken, map("name", "Second", "email", "second@gamma.com", "role", "ADMIN", "password", "Second@123"));
        assertEquals(200, second.status(), second.message());
        long secondId = second.data().get("id").asLong();
        String secondToken = login(GAMMA, "second@gamma.com", "Second@123");
        assertEquals(200, call(put(GAMMA + "/api/users/" + adminId), secondToken, map("name", "Gamma Owner", "email", "admin@gamma.com", "role", "ADMIN", "isActive", false)).status());
        assertEquals(401, call(get(GAMMA + "/api/dashboard"), gammaToken, null).status());
        assertEquals("Account is disabled", call(post(GAMMA + "/api/auth/login"), null, map("email", "admin@gamma.com", "password", "Secret@123")).message());
        assertEquals("You cannot delete yourself", call(delete(GAMMA + "/api/users/" + secondId), secondToken, null).message());
        assertEquals(200, call(put(GAMMA + "/api/users/" + adminId), secondToken, map("name", "Gamma Owner", "email", "admin@gamma.com", "role", "ADMIN", "isActive", true)).status());
        gammaToken = login(GAMMA, "admin@gamma.com", "Secret@123");
        assertEquals(200, call(delete(GAMMA + "/api/users/" + secondId), gammaToken, null).status());
    }

    /** Purana (v1) master DB: sirf subdomain column — migrator code + custom_domain add karke backfill kare */
    @Test
    @Order(21)
    void migratesOldMasterSchema() {
        master.execute("CREATE DATABASE wmtest_t_migration");
        JdbcTemplate old = dataSources.forDb("wmtest_t_migration");
        old.execute("CREATE TABLE tenants (id BIGINT AUTO_INCREMENT PRIMARY KEY, subdomain VARCHAR(40) NOT NULL UNIQUE, name VARCHAR(200) NOT NULL, "
                + "db_name VARCHAR(64) NOT NULL UNIQUE, contact_email VARCHAR(200), is_active TINYINT(1) NOT NULL DEFAULT 1, "
                + "created_on DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)");
        old.update("INSERT INTO tenants (subdomain, name, db_name) VALUES ('demo', 'Demo', 'wm_t_demo')");

        new com.wm.tenant.MasterSchemaMigrator(old);
        new com.wm.tenant.MasterSchemaMigrator(old); // dobara chalne par kuch na toote

        assertEquals("demo", old.queryForObject("SELECT code FROM tenants WHERE subdomain = 'demo'", String.class));
        old.update("INSERT INTO tenants (code, custom_domain, name, db_name) VALUES ('xyz', 'xyz.com', 'Xyz', 'wm_t_xyz2')");
        assertNull(old.queryForObject("SELECT subdomain FROM tenants WHERE code = 'xyz'", String.class));
    }
}
