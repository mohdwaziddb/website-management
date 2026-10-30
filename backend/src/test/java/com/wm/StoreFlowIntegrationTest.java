package com.wm;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.wm.service.store.RazorpayGateway;
import com.wm.service.store.StoreCheckoutService;
import com.wm.tenant.TenantDataSources;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;

/**
 * Online store ka poora flow local MySQL par (wmtest_t_shop). Razorpay ka asli server nahi — RazorpayGateway mock,
 * signatures asli HMAC se banti hain (jaise Razorpay banata hai).
 * WebsiteFlowIntegrationTest se pehle chalta hai (wo end me test master DB drop karta hai).
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@Order(50)
class StoreFlowIntegrationTest {
    private static final String ROOT = "http://localhost";
    private static final String SHOP = "http://shop.localhost";
    private static final String KEY_SECRET = "test_key_secret";
    private static final String WEBHOOK_SECRET = "wh_secret";

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper json;

    @Autowired
    private JdbcTemplate master;

    @Autowired
    private TenantDataSources dataSources;

    @Autowired
    private StoreCheckoutService checkoutService;

    @MockBean
    private RazorpayGateway razorpay;

    private String adminToken;
    private String editorToken;
    private String customerToken;
    private String otherCustomerToken;
    private long mugId;
    private long teeId;
    private long teeVariantId;
    private String codOrderNo;
    private String paidOrderNo;

    @BeforeAll
    void cleanStart() {
        dropShop();
    }

    @AfterAll
    void cleanEnd() {
        dropShop();
    }

    private void dropShop() {
        for (String db : master.queryForList("SELECT db_name FROM tenants WHERE subdomain = 'shop'", String.class)) {
            dataSources.close(db);
            master.execute("DROP DATABASE IF EXISTS `" + db + "`");
        }
        master.update("DELETE FROM tenants WHERE subdomain = 'shop'");
    }

    private JdbcTemplate shopDb() {
        return dataSources.forDb(master.queryForObject("SELECT db_name FROM tenants WHERE subdomain = 'shop'", String.class));
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
        if (body != null) req.contentType(MediaType.APPLICATION_JSON).content(body instanceof String s ? s.getBytes(StandardCharsets.UTF_8) : json.writeValueAsBytes(body));
        MvcResult r = mvc.perform(req).andReturn();
        String text = r.getResponse().getContentAsString(StandardCharsets.UTF_8);
        return new Res(r.getResponse().getStatus(), text.isEmpty() ? json.createObjectNode() : json.readTree(text));
    }

    private static Map<String, Object> map(Object... kv) {
        Map<String, Object> m = new LinkedHashMap<>();
        for (int i = 0; i < kv.length; i += 2) m.put((String) kv[i], kv[i + 1]);
        return m;
    }

    private static Map<String, Object> address() {
        return map("name", "Ravi Kumar", "phone", "+91 98765 43210", "line1", "12 MG Road", "city", "Pune", "state", "Maharashtra", "pincode", "411001");
    }

    private static List<Map<String, Object>> mugs(int qty) {
        return List.of(map("productId", 0L, "qty", qty));
    }

    private List<Map<String, Object>> mug(int qty) {
        return List.of(map("productId", mugId, "qty", qty));
    }

    private long stock(long productId) {
        return shopDb().queryForObject("SELECT stock FROM products WHERE id = ?", Long.class, productId);
    }

    // ------------------------------------------------------------ setup

    @Test
    @Order(1)
    void createStoreWebsite() throws Exception {
        String platform = call(post(ROOT + "/api/platform/auth/login"), null, map("email", "root@test.local", "password", "Root@12345")).data().get("accessToken").asText();
        Res t = call(post(ROOT + "/api/platform/tenants"), platform, map("subdomain", "shop", "name", "Kart Shop", "contactEmail", "info@kart.test",
                "siteType", "ecommerce", "importDemo", true, "adminName", "Shop Admin", "adminEmail", "admin@kart.test", "adminPassword", "Secret@123"));
        assertEquals(200, t.status(), t.message());
        adminToken = call(post(SHOP + "/api/auth/login"), null, map("email", "admin@kart.test", "password", "Secret@123")).data().get("accessToken").asText();
        Res ed = call(post(SHOP + "/api/users"), adminToken, map("name", "Ed", "email", "editor@kart.test", "password", "Editor@123", "role", "EDITOR"));
        assertEquals(200, ed.status(), ed.message());
        editorToken = call(post(SHOP + "/api/auth/login"), null, map("email", "editor@kart.test", "password", "Editor@123")).data().get("accessToken").asText();

        // admin sidebar me store ke menus
        Res modules = call(get(SHOP + "/api/modules"), adminToken, null);
        String keys = modules.data().toString();
        for (String k : List.of("products", "product_variants", "product_categories", "coupons")) assertTrue(keys.contains("\"" + k + "\""), k);
    }

    @Test
    @Order(2)
    void publicCatalogAndHiddenCoupons() throws Exception {
        Res products = call(get(SHOP + "/api/public/m/products?size=50"), null, null);
        assertEquals(200, products.status());
        assertTrue(products.data().get("total").asInt() >= 10);
        Res bySlug = call(get(SHOP + "/api/public/products/slug/essential-cotton-tee"), null, null);
        assertEquals(200, bySlug.status());
        teeId = bySlug.data().get("id").asLong();
        Res variants = call(get(SHOP + "/api/public/m/product_variants?product_id=" + teeId + "&size=50"), null, null);
        assertEquals(8, variants.data().get("total").asInt());
        teeVariantId = variants.data().get("items").get(0).get("id").asLong();

        // coupons ke codes public API par kabhi nahi
        assertEquals(404, call(get(SHOP + "/api/public/m/coupons"), null, null).status());
        assertEquals(200, call(get(SHOP + "/api/m/coupons"), adminToken, null).status());

        Res cfg = call(get(SHOP + "/api/public/store/config"), null, null);
        assertTrue(cfg.data().get("codEnabled").asBoolean());
        assertFalse(cfg.data().get("razorpayEnabled").asBoolean());
        assertFalse(cfg.toString().contains("secret"));
    }

    @Test
    @Order(3)
    void productValidation() throws Exception {
        long cat = call(get(SHOP + "/api/public/product_categories/slug/home-living"), null, null).data().get("id").asLong();
        Map<String, Object> p = map("title", "Test Mug", "slug", "test-mug", "category_id", cat, "price", "500", "compare_price", "400", "gst_rate", "18",
                "stock", 3, "cover_image", "https://example.com/mug.jpg", "is_publish", true);
        assertEquals("MRP cannot be less than the selling price", call(post(SHOP + "/api/m/products"), adminToken, p).message());
        p.put("compare_price", "600");
        p.put("price", "abc");
        assertEquals(400, call(post(SHOP + "/api/m/products"), adminToken, p).status());
        p.put("price", "500.123");
        assertEquals("Selling Price (₹): max 2 decimal places", call(post(SHOP + "/api/m/products"), adminToken, p).message());
        p.put("price", "500");
        p.put("stock", -1);
        assertEquals("Stock must be at least 0", call(post(SHOP + "/api/m/products"), adminToken, p).message());
        p.put("stock", 3);
        p.put("gst_rate", "7");
        assertEquals(400, call(post(SHOP + "/api/m/products"), adminToken, p).status());
        p.put("gst_rate", "18");
        Res ok = call(post(SHOP + "/api/m/products"), adminToken, p);
        assertEquals(200, ok.status(), ok.message());
        mugId = ok.data().get("id").asLong();
        assertEquals(500.0, ok.data().get("price").asDouble());

        // coupon validation (admin)
        Res bad = call(post(SHOP + "/api/m/coupons"), adminToken, map("code", "HUGE", "discount_type", "Percent", "value", "120", "is_publish", true));
        assertEquals("Percent discount cannot be more than 100", bad.message());
    }

    @Test
    @Order(4)
    void storeSettingsOnlyAdmin() throws Exception {
        Map<String, Object> s = map("shipping_fee", "49", "free_shipping_above", "999", "cod_fee", "30");
        assertEquals(403, call(put(SHOP + "/api/shop/settings"), editorToken, s).status());
        assertEquals(403, call(get(SHOP + "/api/shop/settings"), editorToken, null).status());
        assertEquals("Shipping Charge (₹) must be 0 or more (max 2 decimals)", call(put(SHOP + "/api/shop/settings"), adminToken, map("shipping_fee", "-5")).message());
        assertEquals("Enable at least one payment method (Cash on Delivery or Razorpay)", call(put(SHOP + "/api/shop/settings"), adminToken, map("cod_enabled", false)).message());
        assertEquals(400, call(put(SHOP + "/api/shop/settings"), adminToken, map("gstin", "12345")).status());
        Res ok = call(put(SHOP + "/api/shop/settings"), adminToken, s);
        assertEquals(200, ok.status(), ok.message());
        assertEquals("49", ok.data().get("values").get("shipping_fee").asText());
    }

    @Test
    @Order(5)
    void cartQuote() throws Exception {
        Res one = call(post(SHOP + "/api/public/store/quote"), null, map("items", mug(1)));
        assertEquals(200, one.status(), one.message());
        assertEquals(549.0, one.data().get("total").asDouble()); // 500 + 49 shipping
        assertEquals(76.27, one.data().get("tax").asDouble()); // 500 × 18 / 118 (included)

        Res two = call(post(SHOP + "/api/public/store/quote"), null, map("items", mug(2), "paymentMethod", "COD"));
        assertEquals(0.0, two.data().get("shipping").asDouble()); // 1000 >= 999
        assertEquals(1030.0, two.data().get("total").asDouble()); // + COD 30

        Res tooMany = call(post(SHOP + "/api/public/store/quote"), null, map("items", mug(5)));
        assertEquals("Only 3 left of Test Mug", tooMany.data().get("issues").get(0).get("message").asText());

        Res noOption = call(post(SHOP + "/api/public/store/quote"), null, map("items", List.of(map("productId", teeId, "qty", 1))));
        assertEquals("Please choose an option for Essential Cotton Crew T-Shirt", noOption.data().get("issues").get(0).get("message").asText());

        Res withVariant = call(post(SHOP + "/api/public/store/quote"), null, map("items", List.of(map("productId", teeId, "variantId", teeVariantId, "qty", 2))));
        assertEquals(0, withVariant.data().get("issues").size());
        assertEquals(998.0, withVariant.data().get("subtotal").asDouble());

        Res coupon = call(post(SHOP + "/api/public/store/quote"), null, map("items", mug(2), "coupon", "welcome10"));
        assertEquals(100.0, coupon.data().get("discount").asDouble());
        assertEquals("WELCOME10", coupon.data().get("couponCode").asText());

        Res minOrder = call(post(SHOP + "/api/public/store/quote"), null, map("items", mug(1), "coupon", "FLAT200"));
        assertTrue(minOrder.data().get("couponError").asText().contains("min order ₹1999"), minOrder.toString());
        assertEquals(0.0, minOrder.data().get("discount").asDouble());

        assertEquals("Coupon \"NOPE\" is not valid", call(post(SHOP + "/api/public/store/quote"), null, map("items", mug(1), "coupon", "NOPE")).data().get("couponError").asText());
        assertEquals("Your cart is empty", call(post(SHOP + "/api/public/store/quote"), null, map("items", List.of())).message());
        assertEquals("Quantity must be between 1 and 99", call(post(SHOP + "/api/public/store/quote"), null, map("items", List.of(map("productId", mugId, "qty", 0)))).message());
    }

    @Test
    @Order(6)
    void customerSignupAndSecurity() throws Exception {
        assertEquals("Email is not a valid email", call(post(SHOP + "/api/store/auth/register"), null, map("name", "R", "email", "bad", "password", "Secret@123")).message());
        assertEquals("Password must be 8-100 characters", call(post(SHOP + "/api/store/auth/register"), null, map("name", "R", "email", "r@x.com", "password", "short")).message());
        assertEquals("Phone must be a valid 10-digit mobile number",
                call(post(SHOP + "/api/store/auth/register"), null, map("name", "R", "email", "r@x.com", "password", "Secret@123", "phone", "12345")).message());

        Res reg = call(post(SHOP + "/api/store/auth/register"), null, map("name", "Ravi Kumar", "email", "Ravi@Example.com", "password", "Secret@123", "phone", "9876543210"));
        assertEquals(200, reg.status(), reg.message());
        assertEquals("CUSTOMER", reg.data().get("user").get("role").asText());
        customerToken = reg.data().get("accessToken").asText();
        assertEquals(400, call(post(SHOP + "/api/store/auth/register"), null, map("name", "X", "email", "ravi@example.com", "password", "Secret@123")).status());
        assertEquals(401, call(post(SHOP + "/api/store/auth/login"), null, map("email", "ravi@example.com", "password", "wrong-pass")).status());
        assertEquals(200, call(post(SHOP + "/api/store/auth/login"), null, map("email", "ravi@example.com", "password", "Secret@123")).status());
        otherCustomerToken = call(post(SHOP + "/api/store/auth/register"), null, map("name", "Other", "email", "other@example.com", "password", "Secret@123"))
                .data().get("accessToken").asText();

        // customer admin API nahi chala sakta, admin customer API nahi
        assertEquals(403, call(get(SHOP + "/api/shop/orders"), customerToken, null).status());
        assertEquals(403, call(get(SHOP + "/api/m/products"), customerToken, null).status());
        assertEquals(403, call(get(SHOP + "/api/store/me"), adminToken, null).status());
        assertEquals(401, call(get(SHOP + "/api/store/me"), null, null).status());
        assertEquals(401, call(post(SHOP + "/api/store/checkout"), null, map("items", mug(1))).status());
        assertEquals("Ravi Kumar", call(get(SHOP + "/api/store/me"), customerToken, null).data().get("name").asText());
    }

    @Test
    @Order(7)
    void codCheckout() throws Exception {
        assertEquals("Please add a delivery address", call(post(SHOP + "/api/store/checkout"), customerToken, map("items", mug(2), "paymentMethod", "COD")).message());
        Map<String, Object> badPin = address();
        badPin.put("pincode", "0110");
        assertEquals("PIN code must be 6 digits",
                call(post(SHOP + "/api/store/checkout"), customerToken, map("items", mug(2), "paymentMethod", "COD", "address", badPin)).message());
        assertEquals("Please choose a payment method", call(post(SHOP + "/api/store/checkout"), customerToken, map("items", mug(2), "address", address())).message());
        assertTrue(call(post(SHOP + "/api/store/checkout"), customerToken, map("items", mug(2), "paymentMethod", "COD", "address", address(), "expectedTotal", "500"))
                .message().startsWith("Prices in your cart changed"));

        // 2 × 500 − 10% (100) = 900 (< 999 => shipping 49) + COD 30 = 979
        Res ok = call(post(SHOP + "/api/store/checkout"), customerToken, map("items", mug(2), "paymentMethod", "COD", "coupon", "WELCOME10",
                "address", address(), "saveAddress", true, "expectedTotal", "979", "notes", "Ring the bell"));
        assertEquals(200, ok.status(), ok.message());
        JsonNode order = ok.data().get("order");
        codOrderNo = order.get("order_no").asText();
        assertTrue(codOrderNo.startsWith("ORD1"));
        assertEquals("PLACED", order.get("status").asText());
        assertEquals("PENDING", order.get("payment_status").asText());
        assertEquals(979.0, order.get("total").asDouble());
        assertEquals("9876543210", order.get("ship_phone").asText());
        assertEquals(2, order.get("items").get(0).get("qty").asInt());
        assertFalse(order.has("customer_id"));
        assertEquals(1, stock(mugId));
        assertEquals(1, call(get(SHOP + "/api/store/addresses"), customerToken, null).data().size());

        // per-customer coupon limit 1
        assertEquals("You have already used coupon WELCOME10",
                call(post(SHOP + "/api/store/checkout"), customerToken, map("items", mug(1), "paymentMethod", "COD", "coupon", "WELCOME10", "address", address())).message());
        // stock 1 bacha, 2 maange
        assertEquals("Only 1 left of Test Mug", call(post(SHOP + "/api/store/checkout"), customerToken, map("items", mug(2), "paymentMethod", "COD", "address", address())).message());
        assertEquals(1L, shopDb().queryForObject("SELECT COUNT(*) FROM orders", Long.class));

        // dusra customer is order ko nahi dekh sakta
        assertEquals(404, call(get(SHOP + "/api/store/orders/" + codOrderNo), otherCustomerToken, null).status());
        assertEquals(1, call(get(SHOP + "/api/store/orders"), customerToken, null).data().get("total").asInt());
    }

    @Test
    @Order(8)
    void adminOrderFlowAndCustomerCancel() throws Exception {
        Res list = call(get(SHOP + "/api/shop/orders?q=" + codOrderNo), editorToken, null);
        assertEquals(1, list.data().get("total").asInt());
        long id = list.data().get("items").get(0).get("id").asLong();
        Res detail = call(get(SHOP + "/api/shop/orders/" + id), editorToken, null);
        assertEquals("Ravi Kumar", detail.data().get("customer").get("name").asText());
        assertTrue(detail.data().get("next_statuses").toString().contains("CONFIRMED"));

        assertEquals("Cannot change order from Order placed to Delivered",
                call(put(SHOP + "/api/shop/orders/" + id + "/status"), editorToken, map("status", "DELIVERED")).message());
        assertEquals(400, call(put(SHOP + "/api/shop/orders/" + id + "/status"), editorToken, map("status", "FLYING")).status());
        assertEquals("CONFIRMED", call(put(SHOP + "/api/shop/orders/" + id + "/status"), editorToken, map("status", "CONFIRMED", "note", "Stock checked")).data().get("status").asText());
        assertEquals("Tracking link must be a valid URL (https://...)",
                call(put(SHOP + "/api/shop/orders/" + id + "/tracking"), editorToken, map("courier", "Delhivery", "tracking_no", "DL1", "tracking_url", "nope")).message());

        // customer cancel (CONFIRMED tak allowed) => stock wapas
        Res cancel = call(post(SHOP + "/api/store/orders/" + codOrderNo + "/cancel"), customerToken, map("reason", "Ordered by mistake"));
        assertEquals(200, cancel.status(), cancel.message());
        assertEquals("CANCELLED", cancel.data().get("status").asText());
        assertEquals(3, stock(mugId));
        assertEquals("This order can no longer be cancelled — please contact us",
                call(post(SHOP + "/api/store/orders/" + codOrderNo + "/cancel"), customerToken, map()).message());
        // cancelled order ka coupon phir se use ho sakta hai
        Res again = call(post(SHOP + "/api/public/store/quote"), customerToken, map("items", mug(2), "coupon", "WELCOME10"));
        assertEquals(100.0, again.data().get("discount").asDouble());
    }

    @Test
    @Order(9)
    void codDeliveryMarksPaid() throws Exception {
        Res ok = call(post(SHOP + "/api/store/checkout"), customerToken, map("items", mug(1), "paymentMethod", "COD", "addressId",
                call(get(SHOP + "/api/store/addresses"), customerToken, null).data().get(0).get("id").asLong()));
        assertEquals(200, ok.status(), ok.message());
        long id = ok.data().get("order").get("id").asLong();
        for (String s : List.of("CONFIRMED", "PACKED")) assertEquals(200, call(put(SHOP + "/api/shop/orders/" + id + "/status"), adminToken, map("status", s)).status());
        Res shipped = call(put(SHOP + "/api/shop/orders/" + id + "/status"), adminToken, map("status", "SHIPPED", "courier", "Delhivery", "tracking_no", "DL123"));
        assertEquals("DL123", shipped.data().get("tracking_no").asText());
        Res delivered = call(put(SHOP + "/api/shop/orders/" + id + "/status"), adminToken, map("status", "DELIVERED"));
        assertEquals("PAID", delivered.data().get("payment_status").asText());
        assertEquals(2, stock(mugId));
    }

    @Test
    @Order(10)
    void razorpaySettings() throws Exception {
        assertEquals("Razorpay Key ID must start with rzp_test_ or rzp_live_",
                call(put(SHOP + "/api/shop/settings"), adminToken, map("razorpay_enabled", true, "razorpay_key_id", "abc", "razorpay_key_secret", KEY_SECRET)).message());
        assertEquals("Razorpay Key Secret is required to enable Razorpay",
                call(put(SHOP + "/api/shop/settings"), adminToken, map("razorpay_enabled", true, "razorpay_key_id", "rzp_test_abc")).message());
        Res ok = call(put(SHOP + "/api/shop/settings"), adminToken, map("razorpay_enabled", true, "razorpay_key_id", "rzp_test_abc",
                "razorpay_key_secret", KEY_SECRET, "razorpay_webhook_secret", WEBHOOK_SECRET));
        assertEquals(200, ok.status(), ok.message());
        // secret kabhi wapas nahi aata
        assertFalse(ok.body().toString().contains(KEY_SECRET));
        assertTrue(ok.data().get("secretsSet").get("razorpay_key_secret").asBoolean());
        assertTrue(ok.data().get("webhookUrl").asText().endsWith("/api/public/store/razorpay/webhook"));
        // secret khaali bheja = purana rehta hai
        call(put(SHOP + "/api/shop/settings"), adminToken, map("razorpay_key_secret", "", "shipping_fee", "49"));
        Res cfg = call(get(SHOP + "/api/public/store/config"), null, null);
        assertTrue(cfg.data().get("razorpayEnabled").asBoolean());
        assertEquals("rzp_test_abc", cfg.data().get("razorpayKeyId").asText());
        assertFalse(cfg.body().toString().contains(KEY_SECRET));
    }

    @Test
    @Order(11)
    void razorpayCheckoutAndVerify() throws Exception {
        when(razorpay.createOrder(eq("rzp_test_abc"), eq(KEY_SECRET), anyLong(), anyString(), anyMap())).thenReturn("order_TEST1");
        Res ok = call(post(SHOP + "/api/store/checkout"), customerToken, map("items", mug(1), "paymentMethod", "RAZORPAY", "address", address()));
        assertEquals(200, ok.status(), ok.message());
        JsonNode pay = ok.data().get("payment");
        assertEquals("order_TEST1", pay.get("razorpayOrderId").asText());
        assertEquals(54900, pay.get("amount").asLong()); // (500 + 49) paise, COD charge nahi
        assertEquals("rzp_test_abc", pay.get("keyId").asText());
        paidOrderNo = ok.data().get("order").get("order_no").asText();
        assertEquals("PENDING_PAYMENT", ok.data().get("order").get("status").asText());
        assertEquals(1, stock(mugId)); // reserve ho gaya
        verify(razorpay).createOrder(eq("rzp_test_abc"), eq(KEY_SECRET), eq(54900L), eq(paidOrderNo), anyMap());

        Res bad = call(post(SHOP + "/api/store/orders/" + paidOrderNo + "/razorpay/verify"), customerToken,
                map("razorpay_order_id", "order_TEST1", "razorpay_payment_id", "pay_1", "razorpay_signature", "deadbeef"));
        assertEquals(400, bad.status());
        assertEquals("PENDING_PAYMENT", call(get(SHOP + "/api/store/orders/" + paidOrderNo), customerToken, null).data().get("status").asText());

        String sig = RazorpayGateway.hmac("order_TEST1|pay_1", KEY_SECRET);
        Map<String, Object> good = map("razorpay_order_id", "order_TEST1", "razorpay_payment_id", "pay_1", "razorpay_signature", sig);
        assertEquals(404, call(post(SHOP + "/api/store/orders/" + paidOrderNo + "/razorpay/verify"), otherCustomerToken, good).status());
        Res paid = call(post(SHOP + "/api/store/orders/" + paidOrderNo + "/razorpay/verify"), customerToken, good);
        assertEquals(200, paid.status(), paid.message());
        assertEquals("PLACED", paid.data().get("status").asText());
        assertEquals("PAID", paid.data().get("payment_status").asText());
        // dobara verify / webhook = kuch double nahi
        assertEquals(200, call(post(SHOP + "/api/store/orders/" + paidOrderNo + "/razorpay/verify"), customerToken, good).status());
        assertEquals(1L, shopDb().queryForObject("SELECT COUNT(*) FROM payments p JOIN orders o ON o.id = p.order_id WHERE o.order_no = ? AND p.status = 'PAID'",
                Long.class, paidOrderNo));
    }

    @Test
    @Order(12)
    void webhookMarksPaid() throws Exception {
        when(razorpay.createOrder(anyString(), anyString(), anyLong(), anyString(), anyMap())).thenReturn("order_TEST2");
        Res ok = call(post(SHOP + "/api/store/checkout"), customerToken, map("items", mug(1), "paymentMethod", "RAZORPAY", "address", address()));
        String no = ok.data().get("order").get("order_no").asText();
        String body = "{\"event\":\"payment.captured\",\"payload\":{\"payment\":{\"entity\":{\"id\":\"pay_2\",\"order_id\":\"order_TEST2\",\"amount\":54900}}}}";

        assertEquals("Invalid webhook signature", call(post(SHOP + "/api/public/store/razorpay/webhook").header("X-Razorpay-Signature", "bad"), null, body).message());
        Res hook = call(post(SHOP + "/api/public/store/razorpay/webhook").header("X-Razorpay-Signature", RazorpayGateway.hmac(body, WEBHOOK_SECRET)), null, body);
        assertEquals(200, hook.status(), hook.message());
        assertEquals("PAID", call(get(SHOP + "/api/store/orders/" + no), customerToken, null).data().get("payment_status").asText());
        call(post(SHOP + "/api/public/store/razorpay/webhook").header("X-Razorpay-Signature", RazorpayGateway.hmac(body, WEBHOOK_SECRET)), null, body);
        assertEquals(1L, shopDb().queryForObject("SELECT COUNT(*) FROM payments p JOIN orders o ON o.id = p.order_id WHERE o.order_no = ? AND p.status = 'PAID'", Long.class, no));
        assertEquals(0, stock(mugId));
    }

    @Test
    @Order(13)
    void adminCancelPaidOrderRefunds() throws Exception {
        when(razorpay.refund(anyString(), anyString(), eq("pay_1"), anyLong())).thenReturn("rfnd_1");
        long id = shopDb().queryForObject("SELECT id FROM orders WHERE order_no = ?", Long.class, paidOrderNo);
        Res r = call(put(SHOP + "/api/shop/orders/" + id + "/status"), adminToken, map("status", "CANCELLED", "note", "Customer called"));
        assertEquals(200, r.status(), r.message());
        assertEquals("REFUNDED", r.data().get("payment_status").asText());
        verify(razorpay).refund("rzp_test_abc", KEY_SECRET, "pay_1", 54900L);
        assertEquals(1, stock(mugId));
        assertEquals("Only paid online (Razorpay) orders can be refunded", call(post(SHOP + "/api/shop/orders/" + id + "/refund"), adminToken, null).message());
    }

    @Test
    @Order(14)
    void unpaidOrdersExpire() throws Exception {
        when(razorpay.createOrder(anyString(), anyString(), anyLong(), anyString(), anyMap())).thenReturn("order_TEST3");
        Res ok = call(post(SHOP + "/api/store/checkout"), customerToken, map("items", mug(1), "paymentMethod", "RAZORPAY", "address", address()));
        String no = ok.data().get("order").get("order_no").asText();
        assertEquals(0, stock(mugId));
        JdbcTemplate db = shopDb();
        assertEquals(0, checkoutService.expirePendingOrders(db, 30));
        db.update("UPDATE orders SET created_on = DATE_SUB(NOW(), INTERVAL 31 MINUTE) WHERE order_no = ?", no);
        assertEquals(1, checkoutService.expirePendingOrders(db, 30));
        assertEquals("CANCELLED", db.queryForObject("SELECT status FROM orders WHERE order_no = ?", String.class, no));
        assertEquals(1, stock(mugId));
    }

    @Test
    @Order(15)
    void reviewsWishlistAndSummary() throws Exception {
        assertEquals("Rating must be 1 to 5 stars", call(post(SHOP + "/api/store/products/" + mugId + "/reviews"), customerToken, map("rating", 6)).message());
        Res rv = call(post(SHOP + "/api/store/products/" + mugId + "/reviews"), customerToken, map("rating", 5, "title", "Lovely", "comment", "Great mug"));
        assertFalse(rv.data().get("approved").asBoolean());
        assertTrue(rv.data().get("verified").asBoolean()); // delivered order me tha
        assertEquals(0, call(get(SHOP + "/api/public/store/products/" + mugId + "/reviews"), null, null).data().get("count").asInt());
        long reviewId = call(get(SHOP + "/api/shop/reviews"), editorToken, null).data().get(0).get("id").asLong();
        assertEquals(200, call(put(SHOP + "/api/shop/reviews/" + reviewId), editorToken, map("is_approved", true)).status());
        Res pub = call(get(SHOP + "/api/public/store/products/" + mugId + "/reviews"), null, null);
        assertEquals(1, pub.data().get("count").asInt());
        assertEquals(5.0, pub.data().get("average").asDouble());

        assertEquals(200, call(post(SHOP + "/api/store/wishlist/" + mugId), customerToken, null).status());
        assertEquals(200, call(post(SHOP + "/api/store/wishlist/" + mugId), customerToken, null).status());
        assertEquals(1, call(get(SHOP + "/api/store/wishlist"), customerToken, null).data().size());
        call(delete(SHOP + "/api/store/wishlist/" + mugId), customerToken, null);
        assertEquals(0, call(get(SHOP + "/api/store/wishlist"), customerToken, null).data().size());
        assertEquals(404, call(post(SHOP + "/api/store/wishlist/999999"), customerToken, null).status());

        Res sum = call(get(SHOP + "/api/shop/summary"), editorToken, null);
        assertEquals(200, sum.status(), sum.message());
        assertTrue(sum.data().get("today").get("orders").asInt() >= 1);
        assertTrue(sum.data().get("customers").asInt() >= 2);
    }

    @Test
    @Order(16)
    void passwordResetAndDisable() throws Exception {
        assertEquals(200, call(post(SHOP + "/api/store/auth/forgot-password"), null, map("email", "nobody@example.com")).status());
        assertEquals(200, call(post(SHOP + "/api/store/auth/forgot-password"), null, map("email", "ravi@example.com")).status());
        assertNotNull(shopDb().queryForObject("SELECT reset_token_hash FROM customers WHERE email = 'ravi@example.com'", String.class));
        assertEquals("This reset link is invalid or has expired — please request a new one",
                call(post(SHOP + "/api/store/auth/reset-password"), null, map("token", "wrong", "password", "NewSecret@1")).message());

        long id = call(get(SHOP + "/api/shop/customers?q=ravi"), adminToken, null).data().get("items").get(0).get("id").asLong();
        assertEquals(200, call(put(SHOP + "/api/shop/customers/" + id + "/active"), adminToken, map("is_active", false)).status());
        assertEquals(401, call(get(SHOP + "/api/store/me"), customerToken, null).status());
        assertEquals(403, call(post(SHOP + "/api/store/auth/login"), null, map("email", "ravi@example.com", "password", "Secret@123")).status());
    }
}
