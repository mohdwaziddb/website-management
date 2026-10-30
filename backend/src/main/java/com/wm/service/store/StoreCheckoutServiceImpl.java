package com.wm.service.store;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.wm.common.ApiException;
import com.wm.common.DataTypeUtility;
import com.wm.common.PageResult;
import com.wm.common.ValidationUtility;
import com.wm.security.AuthPrincipal;
import com.wm.service.settings.WebsiteSettingsService;
import com.wm.tenant.TenantContext;
import com.wm.tenant.TenantDataSources;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.*;

import static com.wm.service.store.OrderStatus.*;

@Service
public class StoreCheckoutServiceImpl implements StoreCheckoutService {
    private static final Logger log = LoggerFactory.getLogger(StoreCheckoutServiceImpl.class);

    @Autowired
    private TenantDataSources ds;

    @Autowired
    private StoreCart cart;

    @Autowired
    private StoreOrders orders;

    @Autowired
    private StoreOrderFlow flow;

    @Autowired
    private StoreSettingsService storeSettingsService;

    @Autowired
    private CustomerAccountService customerAccountService;

    @Autowired
    private WebsiteSettingsService websiteSettingsService;

    @Autowired
    private RazorpayGateway razorpay;

    @Autowired
    private ObjectMapper mapper;

    // ------------------------------------------------------------ quote

    @Override
    public Map<String, Object> quote(Map<String, Object> param) {
        JdbcTemplate db = ds.current();
        StoreConfig cfg = storeSettingsService.config();
        StoreCart.Resolved r = cart.resolve(db, param.get("items"));
        boolean cod = COD.equalsIgnoreCase(DataTypeUtility.stringValue(param.get("paymentMethod")));
        BigDecimal subtotal = PricingCalculator.compute(r.lines(), null, StoreCart.rules(cfg), false).subtotal();

        // coupon galat ho to cart tootna nahi chahiye — sirf couponError
        PricingCalculator.Coupon coupon = null;
        String couponError = null;
        try {
            coupon = cart.coupon(db, DataTypeUtility.stringNullValue(param.get("coupon")), currentCustomerId(), subtotal);
        } catch (ApiException e) {
            couponError = e.getMessage();
        }
        PricingCalculator.Quote q = PricingCalculator.compute(r.lines(), coupon, StoreCart.rules(cfg), cod);
        Map<String, Object> out = quoteView(q, r);
        out.put("couponError", couponError);
        out.put("issues", r.issues());
        String codBlock = codBlockedReason(cfg, PricingCalculator.compute(r.lines(), coupon, StoreCart.rules(cfg), true).total());
        out.put("codAvailable", codBlock == null);
        out.put("codReason", codBlock);
        out.put("razorpayAvailable", cfg.razorpayReady());
        return out;
    }

    private static Map<String, Object> quoteView(PricingCalculator.Quote q, StoreCart.Resolved r) {
        List<Map<String, Object>> lines = new ArrayList<>();
        for (int i = 0; i < q.lines().size(); i++) {
            PricingCalculator.PricedLine pl = q.lines().get(i);
            PricingCalculator.Line l = pl.line();
            Map<String, Object> m = new LinkedHashMap<>(r.view().get(i));
            m.put("title", l.title());
            m.put("variantTitle", l.variantTitle());
            m.put("image", l.image());
            m.put("unitPrice", l.unitPrice());
            m.put("qty", l.qty());
            m.put("gstRate", l.gstRate());
            m.put("lineTotal", pl.lineTotal());
            lines.add(m);
        }
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("lines", lines);
        out.put("subtotal", q.subtotal());
        out.put("discount", q.discount());
        out.put("couponCode", q.couponCode());
        out.put("tax", q.tax());
        out.put("pricesIncludeTax", q.pricesIncludeTax());
        out.put("shipping", q.shipping());
        out.put("codFee", q.codFee());
        out.put("total", q.total());
        return out;
    }

    /** null = COD chal sakta hai */
    private static String codBlockedReason(StoreConfig cfg, BigDecimal total) {
        if (!cfg.codEnabled()) return "Cash on Delivery is not available";
        if (cfg.codMaxOrder() != null && total.compareTo(cfg.codMaxOrder()) > 0) return "Cash on Delivery is available only up to ₹" + cfg.codMaxOrder();
        return null;
    }

    // ------------------------------------------------------------ checkout

    @Override
    public Map<String, Object> checkout(Map<String, Object> param) {
        AuthPrincipal me = customer();
        JdbcTemplate db = ds.current();
        StoreConfig cfg = storeSettingsService.config();

        StoreCart.Resolved r = cart.resolve(db, param.get("items"));
        if (!r.issues().isEmpty()) throw ApiException.badRequest(String.valueOf(r.issues().get(0).get("message")));
        String method = DataTypeUtility.stringValue(param.get("paymentMethod")).toUpperCase(Locale.ROOT);
        if (!COD.equals(method) && !RAZORPAY.equals(method)) throw ApiException.badRequest("Please choose a payment method");
        boolean cod = COD.equals(method);
        BigDecimal subtotal = PricingCalculator.compute(r.lines(), null, StoreCart.rules(cfg), false).subtotal();
        PricingCalculator.Coupon coupon = cart.coupon(db, DataTypeUtility.stringNullValue(param.get("coupon")), me.userId(), subtotal);
        PricingCalculator.Quote q = PricingCalculator.compute(r.lines(), coupon, StoreCart.rules(cfg), cod);
        if (cod) {
            String reason = codBlockedReason(cfg, q.total());
            if (reason != null) throw ApiException.badRequest(reason);
        } else if (!cfg.razorpayReady()) {
            throw ApiException.badRequest("Online payment is not available right now — please choose Cash on Delivery");
        }
        // client ne jo total dekha wahi charge ho (beech me price badla to customer ko batao)
        BigDecimal expected = expectedTotal(param.get("expectedTotal"));
        if (expected != null && expected.compareTo(q.total()) != 0) {
            throw ApiException.badRequest("Prices in your cart changed — new total is ₹" + q.total() + ". Please review and place the order again.");
        }

        Map<String, Object> address = address(param);
        String notes = ValidationUtility.optionalString(param.get("notes"), "Order notes", 500);
        String email = DataTypeUtility.stringValue(db.queryForObject("SELECT email FROM customers WHERE id = ?", String.class, me.userId()));

        long orderId = orders.inTransaction(db, () -> {
            long id = insertOrder(db, me.userId(), method, q, address, email, notes, cfg);
            for (PricingCalculator.PricedLine pl : q.lines()) {
                PricingCalculator.Line l = pl.line();
                if (!orders.reserve(db, l)) {
                    throw ApiException.badRequest(l.title() + (l.variantTitle() != null ? " (" + l.variantTitle() + ")" : "") + " just went out of stock — please update your cart");
                }
                db.update("INSERT INTO order_items (order_id, product_id, variant_id, title, variant_title, sku, image, unit_price, qty, gst_rate, discount, tax, line_total) "
                                + "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
                        id, l.productId(), l.variantId(), l.title(), l.variantTitle(), l.sku(), l.image(), l.unitPrice(), l.qty(), l.gstRate(),
                        pl.discount(), pl.tax(), pl.lineTotal());
            }
            orders.addEvent(db, id, cod ? PLACED : PENDING_PAYMENT, cod ? "Order placed — Cash on Delivery" : "Order created — waiting for online payment", me.name());
            if (DataTypeUtility.booleanValue(param.get("saveAddress")) && param.get("addressId") == null) saveAddress(db, me.userId(), address);
            return id;
        });

        Map<String, Object> order = orders.byId(db, orderId);
        Map<String, Object> out = new LinkedHashMap<>();
        if (cod) {
            flow.notifyPlaced(db, cfg, order);
        } else {
            try {
                out.put("payment", razorpayCheckout(db, cfg, order));
            } catch (ApiException e) {
                // gateway down: order mat latkao — cancel + stock wapas, customer ko sahi message
                flow.changeStatus(db, cfg, order, CANCELLED, "Payment gateway error: " + e.getMessage(), "System", false);
                throw e;
            }
            order = orders.byId(db, orderId);
        }
        out.put("order", orders.detail(db, order, false));
        return out;
    }

    private static BigDecimal expectedTotal(Object raw) {
        String s = DataTypeUtility.stringNullValue(raw);
        if (s == null) return null;
        try {
            return new BigDecimal(s).setScale(2, java.math.RoundingMode.HALF_UP);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> address(Map<String, Object> param) {
        Object id = param.get("addressId");
        if (!DataTypeUtility.isEmpty(id)) {
            Map<String, Object> a = customerAccountService.getOwnAddress(ValidationUtility.requiredLong(id, "Address"));
            return customerAccountService.cleanAddress(a);
        }
        if (!(param.get("address") instanceof Map<?, ?> a)) throw ApiException.badRequest("Please add a delivery address");
        return customerAccountService.cleanAddress((Map<String, Object>) a);
    }

    private void saveAddress(JdbcTemplate db, long customerId, Map<String, Object> a) {
        long count = db.queryForObject("SELECT COUNT(*) FROM customer_addresses WHERE customer_id = ?", Long.class, customerId);
        if (count >= 10) return;
        db.update("INSERT INTO customer_addresses (customer_id, name, phone, line1, line2, city, state, pincode, is_default) VALUES (?,?,?,?,?,?,?,?,?)",
                customerId, a.get("name"), a.get("phone"), a.get("line1"), a.get("line2"), a.get("city"), a.get("state"), a.get("pincode"), count == 0);
    }

    private long insertOrder(JdbcTemplate db, long customerId, String method, PricingCalculator.Quote q, Map<String, Object> a, String email, String notes, StoreConfig cfg) {
        GeneratedKeyHolder keys = new GeneratedKeyHolder();
        Object[] args = {customerId, COD.equals(method) ? PLACED : PENDING_PAYMENT, method, PAY_PENDING, q.subtotal(), q.discount(), q.couponCode(), q.tax(),
                q.pricesIncludeTax(), q.shipping(), q.codFee(), q.total(), a.get("name"), a.get("phone"), email, a.get("line1"), a.get("line2"), a.get("city"),
                a.get("state"), a.get("pincode"), notes};
        db.update(con -> {
            PreparedStatement ps = con.prepareStatement("INSERT INTO orders (customer_id, status, payment_method, payment_status, subtotal, discount, coupon_code, tax, "
                    + "prices_include_tax, shipping, cod_fee, total, ship_name, ship_phone, ship_email, ship_line1, ship_line2, ship_city, ship_state, ship_pincode, notes) "
                    + "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", Statement.RETURN_GENERATED_KEYS);
            for (int i = 0; i < args.length; i++) ps.setObject(i + 1, args[i]);
            return ps;
        }, keys);
        long id = Objects.requireNonNull(keys.getKey()).longValue();
        // ORD100001, ORD100002 ... (id se — kabhi duplicate nahi)
        db.update("UPDATE orders SET order_no = ? WHERE id = ?", cfg.orderPrefix().toUpperCase(Locale.ROOT) + (100000 + id), id);
        return id;
    }

    /** Razorpay order banao (ya pehle wala) + checkout.js ke options */
    private Map<String, Object> razorpayCheckout(JdbcTemplate db, StoreConfig cfg, Map<String, Object> order) {
        String rzpOrder = DataTypeUtility.stringNullValue(order.get("razorpay_order_id"));
        long paise = PricingCalculator.toPaise((BigDecimal) order.get("total"));
        if (rzpOrder == null) {
            rzpOrder = razorpay.createOrder(cfg.razorpayKeyId(), cfg.razorpayKeySecret(), paise, String.valueOf(order.get("order_no")),
                    Map.of("order_no", String.valueOf(order.get("order_no")), "website", TenantContext.require().code()));
            db.update("UPDATE orders SET razorpay_order_id = ? WHERE id = ?", rzpOrder, order.get("id"));
            orders.addPayment(db, StoreOrderFlow.id(order), RAZORPAY, "PAYMENT", rzpOrder, null, (BigDecimal) order.get("total"), "CREATED", "Razorpay order created");
        }
        Map<String, Object> prefill = new LinkedHashMap<>();
        prefill.put("name", order.get("ship_name"));
        prefill.put("email", order.get("ship_email"));
        prefill.put("contact", order.get("ship_phone"));
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("provider", RAZORPAY);
        out.put("keyId", cfg.razorpayKeyId());
        out.put("razorpayOrderId", rzpOrder);
        out.put("amount", paise);
        out.put("currency", "INR");
        out.put("name", DataTypeUtility.stringValue(websiteSettingsService.getSettings().get("site_name"), TenantContext.require().name()));
        out.put("description", "Order " + order.get("order_no"));
        out.put("orderNo", order.get("order_no"));
        out.put("prefill", prefill);
        return out;
    }

    // ------------------------------------------------------------ my orders

    @Override
    public PageResult<Map<String, Object>> getMyOrders(Map<String, Object> param) {
        long me = customer().userId();
        int page = Math.max(DataTypeUtility.integerValue(param.get("page"), 1), 1);
        int size = Math.min(Math.max(DataTypeUtility.integerValue(param.get("size"), 10), 1), 50);
        JdbcTemplate db = ds.current();
        long total = db.queryForObject("SELECT COUNT(*) FROM orders WHERE customer_id = ?", Long.class, me);
        List<Map<String, Object>> rows = db.queryForList("SELECT o.id, o.order_no, o.status, o.payment_method, o.payment_status, o.total, o.created_on, "
                + "(SELECT COUNT(*) FROM order_items i WHERE i.order_id = o.id) AS item_count, "
                + "(SELECT i.image FROM order_items i WHERE i.order_id = o.id ORDER BY i.id LIMIT 1) AS image "
                + "FROM orders o WHERE o.customer_id = ? ORDER BY o.id DESC LIMIT ? OFFSET ?", me, size, (long) (page - 1) * size);
        rows.forEach(o -> {
            o.put("status_label", label(String.valueOf(o.get("status"))));
            o.remove("id");
        });
        return new PageResult<>(rows, total, page, size);
    }

    @Override
    public Map<String, Object> getMyOrder(String orderNo) {
        JdbcTemplate db = ds.current();
        return orders.detail(db, orders.byNo(db, orderNo, customer().userId()), false);
    }

    @Override
    public Map<String, Object> cancelMyOrder(String orderNo, Map<String, Object> param) {
        AuthPrincipal me = customer();
        JdbcTemplate db = ds.current();
        Map<String, Object> order = orders.byNo(db, orderNo, me.userId());
        if (!CUSTOMER_CANCELLABLE.contains(String.valueOf(order.get("status")))) {
            throw ApiException.badRequest("This order can no longer be cancelled — please contact us");
        }
        String reason = DataTypeUtility.stringValue(ValidationUtility.optionalString(param.get("reason"), "Reason", 300), "Cancelled by customer");
        // paid online => paisa apne aap wapas
        flow.changeStatus(db, storeSettingsService.config(), order, CANCELLED, reason, me.name(), true);
        return getMyOrder(orderNo);
    }

    // ------------------------------------------------------------ Razorpay

    @Override
    public Map<String, Object> verifyRazorpay(String orderNo, Map<String, Object> param) {
        AuthPrincipal me = customer();
        JdbcTemplate db = ds.current();
        StoreConfig cfg = storeSettingsService.config();
        Map<String, Object> order = orders.byNo(db, orderNo, me.userId());
        if (PAY_PAID.equals(order.get("payment_status"))) return getMyOrder(orderNo);
        String rzpOrder = ValidationUtility.requiredString(param.get("razorpay_order_id"), "Razorpay order id", 60);
        String paymentId = ValidationUtility.requiredString(param.get("razorpay_payment_id"), "Razorpay payment id", 60);
        String signature = ValidationUtility.requiredString(param.get("razorpay_signature"), "Razorpay signature", 200);
        if (!rzpOrder.equals(order.get("razorpay_order_id")) || !RazorpayGateway.verifyPayment(rzpOrder, paymentId, signature, cfg.razorpayKeySecret())) {
            orders.addPayment(db, StoreOrderFlow.id(order), RAZORPAY, "PAYMENT", rzpOrder, paymentId, (BigDecimal) order.get("total"), PAY_FAILED, "Signature mismatch");
            orders.addEvent(db, StoreOrderFlow.id(order), null, "Payment verification failed (signature mismatch)", "System");
            throw ApiException.badRequest("Payment could not be verified. If money was deducted it will be auto-refunded by your bank / Razorpay.");
        }
        flow.markPaid(db, cfg, order, paymentId, "Checkout");
        return getMyOrder(orderNo);
    }

    @Override
    public Map<String, Object> retryPayment(String orderNo) {
        JdbcTemplate db = ds.current();
        StoreConfig cfg = storeSettingsService.config();
        Map<String, Object> order = orders.byNo(db, orderNo, customer().userId());
        if (!PENDING_PAYMENT.equals(order.get("status")) || !RAZORPAY.equals(order.get("payment_method"))) {
            throw ApiException.badRequest("This order does not need payment");
        }
        if (!cfg.razorpayReady()) throw ApiException.badRequest("Online payment is not available right now");
        return Map.of("payment", razorpayCheckout(db, cfg, order), "order", getMyOrder(orderNo));
    }

    @Override
    public Map<String, Object> handleWebhook(String body, String signature) {
        JdbcTemplate db = ds.current();
        StoreConfig cfg = storeSettingsService.config();
        if (cfg.razorpayWebhookSecret() == null) throw ApiException.badRequest("Webhook secret is not set in Store Settings");
        if (!RazorpayGateway.verifyWebhook(body, signature, cfg.razorpayWebhookSecret())) throw ApiException.badRequest("Invalid webhook signature");
        JsonNode json;
        try {
            json = mapper.readTree(body);
        } catch (Exception e) {
            throw ApiException.badRequest("Invalid webhook body");
        }
        String event = json.path("event").asText();
        JsonNode payment = json.path("payload").path("payment").path("entity");
        String rzpOrder = payment.path("order_id").asText(null);
        String paymentId = payment.path("id").asText(null);
        if (rzpOrder == null) return Map.of("ok", true, "ignored", event);
        List<Map<String, Object>> rows = db.queryForList("SELECT * FROM orders WHERE razorpay_order_id = ?", rzpOrder);
        if (rows.isEmpty()) return Map.of("ok", true, "ignored", "unknown order");
        Map<String, Object> order = rows.get(0);
        switch (event) {
            case "payment.captured", "order.paid" -> {
                long amount = payment.path("amount").asLong(-1);
                if (amount >= 0 && amount != PricingCalculator.toPaise((BigDecimal) order.get("total"))) {
                    log.warn("Webhook amount {} != order {} total", amount, order.get("order_no"));
                    orders.addEvent(db, StoreOrderFlow.id(order), null, "Webhook amount mismatch (" + amount + " paise) — please check", "Razorpay");
                    return Map.of("ok", true, "ignored", "amount mismatch");
                }
                flow.markPaid(db, cfg, order, paymentId, "Webhook " + event);
            }
            case "payment.failed" -> {
                if (!PAY_PAID.equals(order.get("payment_status"))) {
                    String reason = payment.path("error_description").asText("Payment failed");
                    orders.addPayment(db, StoreOrderFlow.id(order), RAZORPAY, "PAYMENT", rzpOrder, paymentId, (BigDecimal) order.get("total"), PAY_FAILED, reason);
                    orders.addEvent(db, StoreOrderFlow.id(order), null, "Payment attempt failed: " + reason, "Razorpay");
                }
            }
            default -> {
                return Map.of("ok", true, "ignored", event);
            }
        }
        return Map.of("ok", true);
    }

    @Override
    public int expirePendingOrders(JdbcTemplate db, int minutes) {
        List<Long> ids = db.queryForList("SELECT id FROM orders WHERE status = 'PENDING_PAYMENT' AND created_on < DATE_SUB(NOW(), INTERVAL ? MINUTE)", Long.class, minutes);
        int n = 0;
        for (long id : ids) {
            Integer done = orders.inTransaction(db, () -> {
                int u = db.update("UPDATE orders SET status = 'CANCELLED', payment_status = 'FAILED', cancel_reason = ?, updated_on = NOW() "
                        + "WHERE id = ? AND status = 'PENDING_PAYMENT'", "Payment not completed in " + minutes + " minutes", id);
                if (u == 0) return 0;
                orders.restock(db, id);
                orders.addEvent(db, id, CANCELLED, "Payment not completed in " + minutes + " minutes — order cancelled", "System");
                return 1;
            });
            n += done == null ? 0 : done;
        }
        return n;
    }

    // ------------------------------------------------------------ helpers

    private static AuthPrincipal customer() {
        AuthPrincipal p = AuthPrincipal.current();
        if (!AuthPrincipal.SCOPE_CUSTOMER.equals(p.scope())) throw ApiException.forbidden("Please login to continue");
        return p;
    }

    /** Public quote: login ho to customer id (per-customer coupon limit) */
    private static Long currentCustomerId() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof AuthPrincipal p && AuthPrincipal.SCOPE_CUSTOMER.equals(p.scope())) return p.userId();
        return null;
    }
}
