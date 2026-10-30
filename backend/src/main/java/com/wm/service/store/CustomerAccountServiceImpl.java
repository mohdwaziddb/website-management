package com.wm.service.store;

import com.wm.common.ApiException;
import com.wm.common.DataTypeUtility;
import com.wm.common.ValidationUtility;
import com.wm.security.AuthPrincipal;
import com.wm.security.JwtService;
import com.wm.service.auth.AccountAuthSupport;
import com.wm.service.settings.WebsiteSettingsService;
import com.wm.tenant.Tenant;
import com.wm.tenant.TenantContext;
import com.wm.tenant.TenantDataSources;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.*;

@Service
public class CustomerAccountServiceImpl implements CustomerAccountService {
    private static final String TABLE = "customers";
    private static final int MAX_ADDRESSES = 10;
    private static final SecureRandom RANDOM = new SecureRandom();

    @Autowired
    private TenantDataSources ds;

    @Autowired
    private AccountAuthSupport accountAuthSupport;

    @Autowired
    private JwtService jwt;

    @Autowired
    private PasswordEncoder encoder;

    @Autowired
    private StoreSettingsService storeSettingsService;

    @Autowired
    private WebsiteSettingsService websiteSettingsService;

    @Autowired
    private StoreMailer mailer;

    // ------------------------------------------------------------ auth

    @Override
    public Map<String, Object> register(Map<String, Object> param) {
        Tenant t = TenantContext.require();
        String name = ValidationUtility.requiredString(param.get("name"), "Name", 150);
        String email = ValidationUtility.requiredEmail(param.get("email"), "Email");
        String phone = phone(param.get("phone"), false);
        String password = ValidationUtility.requiredPassword(param.get("password"), "Password");
        JdbcTemplate db = ds.current();
        if (db.queryForObject("SELECT COUNT(*) FROM customers WHERE email = ?", Long.class, email) > 0) {
            throw ApiException.badRequest("An account with this email already exists — please login");
        }
        try {
            db.update("INSERT INTO customers (name, email, phone, password_hash, last_login) VALUES (?, ?, ?, ?, NOW())", name, email, phone, encoder.encode(password));
        } catch (DuplicateKeyException e) {
            throw ApiException.badRequest("An account with this email already exists — please login");
        }
        Map<String, Object> u = db.queryForMap("SELECT * FROM customers WHERE email = ?", email);
        return jwt.issueTokens(principal(u, t), 0);
    }

    @Override
    public Map<String, Object> login(Map<String, Object> param) {
        Tenant t = TenantContext.require();
        Map<String, Object> tokens = accountAuthSupport.login(ds.current(), TABLE, t.code() + ":customer", param, u -> principal(u, t));
        ds.current().update("UPDATE customers SET last_login = NOW() WHERE email = ?", DataTypeUtility.lowerValue(param.get("email")));
        return tokens;
    }

    @Override
    public Map<String, Object> refresh(Map<String, Object> param) {
        Tenant t = TenantContext.require();
        return accountAuthSupport.refresh(ds.current(), TABLE, param, AuthPrincipal.SCOPE_CUSTOMER, t.code(), u -> principal(u, t));
    }

    @Override
    public Map<String, Object> getMe() {
        Map<String, Object> u = ds.current().queryForMap("SELECT id, name, email, phone, created_on FROM customers WHERE id = ?", me());
        u.put("orders", ds.current().queryForObject("SELECT COUNT(*) FROM orders WHERE customer_id = ?", Long.class, me()));
        return u;
    }

    @Override
    public Map<String, Object> updateMe(Map<String, Object> param) {
        String name = ValidationUtility.requiredString(param.get("name"), "Name", 150);
        String phone = phone(param.get("phone"), false);
        ds.current().update("UPDATE customers SET name = ?, phone = ? WHERE id = ?", name, phone, me());
        return getMe();
    }

    @Override
    public Map<String, Object> changePassword(Map<String, Object> param) {
        Tenant t = TenantContext.require();
        return accountAuthSupport.changePassword(ds.current(), TABLE, me(), param, u -> principal(u, t));
    }

    @Override
    public void forgotPassword(Map<String, Object> param) {
        String email = ValidationUtility.requiredEmail(param.get("email"), "Email");
        JdbcTemplate db = ds.current();
        List<Map<String, Object>> rows = db.queryForList("SELECT id, name FROM customers WHERE email = ? AND is_active = 1", email);
        if (rows.isEmpty()) return;
        byte[] raw = new byte[32];
        RANDOM.nextBytes(raw);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(raw);
        db.update("UPDATE customers SET reset_token_hash = ?, reset_expires = DATE_ADD(NOW(), INTERVAL 1 HOUR) WHERE id = ?", sha256(token), rows.get(0).get("id"));
        String link = ServletUriComponentsBuilder.fromCurrentContextPath().path("/reset-password").queryParam("token", token).toUriString();
        String store = siteName();
        mailer.send(storeSettingsService.config(), email, "Reset your password — " + store, StoreMailer.layout(store, "Reset your password",
                "<p>Hi " + StoreMailer.esc(rows.get(0).get("name")) + ",</p><p>Click the button below to set a new password. This link works for 1 hour.</p>"
                        + "<p><a href=\"" + StoreMailer.esc(link) + "\" style=\"background:#0f172a;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none\">Set new password</a></p>"
                        + "<p style=\"color:#64748b;font-size:13px\">Didn't ask for this? Just ignore this email.</p>"));
    }

    @Override
    public void resetPassword(Map<String, Object> param) {
        String token = ValidationUtility.requiredString(param.get("token"), "Reset link", 200);
        String password = ValidationUtility.requiredPassword(param.get("password"), "New password");
        // token_version++ => purane saare logins band
        int n = ds.current().update("UPDATE customers SET password_hash = ?, token_version = token_version + 1, reset_token_hash = NULL, reset_expires = NULL "
                + "WHERE reset_token_hash = ? AND reset_expires > NOW()", encoder.encode(password), sha256(token));
        if (n == 0) throw ApiException.badRequest("This reset link is invalid or has expired — please request a new one");
    }

    // ------------------------------------------------------------ addresses

    @Override
    public List<Map<String, Object>> getAddresses() {
        return ds.current().queryForList("SELECT * FROM customer_addresses WHERE customer_id = ? ORDER BY is_default DESC, id DESC", me());
    }

    @Override
    public Map<String, Object> addAddress(Map<String, Object> param) {
        Map<String, Object> a = cleanAddress(param);
        JdbcTemplate db = ds.current();
        long count = db.queryForObject("SELECT COUNT(*) FROM customer_addresses WHERE customer_id = ?", Long.class, me());
        if (count >= MAX_ADDRESSES) throw ApiException.badRequest("You can save up to " + MAX_ADDRESSES + " addresses");
        boolean isDefault = count == 0 || DataTypeUtility.booleanValue(param.get("isDefault"));
        if (isDefault) db.update("UPDATE customer_addresses SET is_default = 0 WHERE customer_id = ?", me());
        GeneratedKeyHolder keys = new GeneratedKeyHolder();
        db.update(con -> {
            PreparedStatement ps = con.prepareStatement("INSERT INTO customer_addresses (customer_id, name, phone, line1, line2, city, state, pincode, is_default) "
                    + "VALUES (?,?,?,?,?,?,?,?,?)", Statement.RETURN_GENERATED_KEYS);
            ps.setLong(1, me());
            int i = 2;
            for (String k : List.of("name", "phone", "line1", "line2", "city", "state", "pincode")) ps.setObject(i++, a.get(k));
            ps.setBoolean(i, isDefault);
            return ps;
        }, keys);
        return getOwnAddress(Objects.requireNonNull(keys.getKey()).longValue());
    }

    @Override
    public Map<String, Object> updateAddress(long id, Map<String, Object> param) {
        getOwnAddress(id);
        Map<String, Object> a = cleanAddress(param);
        JdbcTemplate db = ds.current();
        if (DataTypeUtility.booleanValue(param.get("isDefault"))) db.update("UPDATE customer_addresses SET is_default = 0 WHERE customer_id = ?", me());
        db.update("UPDATE customer_addresses SET name=?, phone=?, line1=?, line2=?, city=?, state=?, pincode=?"
                        + (DataTypeUtility.booleanValue(param.get("isDefault")) ? ", is_default = 1" : "") + " WHERE id = ? AND customer_id = ?",
                a.get("name"), a.get("phone"), a.get("line1"), a.get("line2"), a.get("city"), a.get("state"), a.get("pincode"), id, me());
        return getOwnAddress(id);
    }

    @Override
    public void deleteAddress(long id) {
        Map<String, Object> a = getOwnAddress(id);
        JdbcTemplate db = ds.current();
        db.update("DELETE FROM customer_addresses WHERE id = ? AND customer_id = ?", id, me());
        // default hataya to sabse naya default bane
        if (DataTypeUtility.booleanValue(a.get("is_default"))) {
            db.update("UPDATE customer_addresses SET is_default = 1 WHERE customer_id = ? ORDER BY id DESC LIMIT 1", me());
        }
    }

    @Override
    public Map<String, Object> getOwnAddress(long id) {
        List<Map<String, Object>> rows = ds.current().queryForList("SELECT * FROM customer_addresses WHERE id = ? AND customer_id = ?", id, me());
        if (rows.isEmpty()) throw ApiException.notFound("Address not found");
        return rows.get(0);
    }

    @Override
    public Map<String, Object> cleanAddress(Map<String, Object> param) {
        Map<String, Object> a = new LinkedHashMap<>();
        a.put("name", ValidationUtility.requiredString(param.get("name"), "Full name", 150));
        a.put("phone", phone(param.get("phone"), true));
        a.put("line1", ValidationUtility.requiredString(param.get("line1"), "Address line 1", 255));
        a.put("line2", ValidationUtility.optionalString(param.get("line2"), "Address line 2", 255));
        a.put("city", ValidationUtility.requiredString(param.get("city"), "City", 100));
        a.put("state", ValidationUtility.requiredString(param.get("state"), "State", 100));
        String pin = ValidationUtility.requiredString(param.get("pincode"), "PIN code", 10);
        if (!pin.matches("[1-9]\\d{5}")) throw ApiException.badRequest("PIN code must be 6 digits");
        a.put("pincode", pin);
        return a;
    }

    /** Indian mobile: 10 digit, 6-9 se shuru (+91 / 0 / spaces hata ke) */
    static String phone(Object raw, boolean required) {
        String s = DataTypeUtility.stringNullValue(raw);
        if (s == null) {
            if (required) throw ApiException.badRequest("Phone is required");
            return null;
        }
        String digits = s.replaceAll("[\\s-]", "").replaceFirst("^(\\+91|0091|0)", "");
        if (!digits.matches("[6-9]\\d{9}")) throw ApiException.badRequest("Phone must be a valid 10-digit mobile number");
        return digits;
    }

    // ------------------------------------------------------------ wishlist

    @Override
    public List<Map<String, Object>> getWishlist() {
        return ds.current().queryForList("SELECT p.id, p.title, p.slug, p.price, p.compare_price, p.cover_image, p.stock, w.created_on FROM wishlist w "
                + "JOIN products p ON p.id = w.product_id AND p.is_deleted = 0 AND p.is_active = 1 AND p.is_publish = 1 WHERE w.customer_id = ? ORDER BY w.created_on DESC", me());
    }

    @Override
    public void addToWishlist(long productId) {
        requireProduct(productId);
        ds.current().update("INSERT IGNORE INTO wishlist (customer_id, product_id) VALUES (?, ?)", me(), productId);
    }

    @Override
    public void removeFromWishlist(long productId) {
        ds.current().update("DELETE FROM wishlist WHERE customer_id = ? AND product_id = ?", me(), productId);
    }

    // ------------------------------------------------------------ reviews

    @Override
    public Map<String, Object> addReview(long productId, Map<String, Object> param) {
        requireProduct(productId);
        int rating = DataTypeUtility.integerValue(param.get("rating"), 0);
        if (rating < 1 || rating > 5) throw ApiException.badRequest("Rating must be 1 to 5 stars");
        String title = ValidationUtility.optionalString(param.get("title"), "Title", 150);
        String comment = ValidationUtility.optionalString(param.get("comment"), "Review", 2000);
        JdbcTemplate db = ds.current();
        // jisne ye product khareeda aur deliver hua = "Verified purchase"
        boolean verified = db.queryForObject("SELECT COUNT(*) FROM orders o JOIN order_items i ON i.order_id = o.id "
                + "WHERE o.customer_id = ? AND i.product_id = ? AND o.status = 'DELIVERED'", Long.class, me(), productId) > 0;
        boolean approved = storeSettingsService.config().reviewsAutoApprove();
        String name = db.queryForObject("SELECT name FROM customers WHERE id = ?", String.class, me());
        // ek customer ka ek product par ek review — dobara likhe to update (aur phir se approval)
        db.update("INSERT INTO product_reviews (product_id, customer_id, customer_name, rating, title, comment, is_verified, is_approved) VALUES (?,?,?,?,?,?,?,?) "
                        + "ON DUPLICATE KEY UPDATE rating = VALUES(rating), title = VALUES(title), comment = VALUES(comment), is_verified = VALUES(is_verified), "
                        + "is_approved = VALUES(is_approved), created_on = NOW()",
                productId, me(), name, rating, title, comment, verified, approved);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("approved", approved);
        out.put("verified", verified);
        out.put("message", approved ? "Thanks! Your review is live." : "Thanks! Your review will appear after approval.");
        return out;
    }

    @Override
    public Map<String, Object> getProductReviews(long productId) {
        JdbcTemplate db = ds.current();
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("items", db.queryForList("SELECT id, customer_name, rating, title, comment, is_verified, created_on FROM product_reviews "
                + "WHERE product_id = ? AND is_approved = 1 ORDER BY created_on DESC LIMIT 50", productId));
        Map<String, Object> agg = db.queryForMap("SELECT COUNT(*) AS count, COALESCE(ROUND(AVG(rating), 1), 0) AS average FROM product_reviews WHERE product_id = ? AND is_approved = 1", productId);
        out.putAll(agg);
        return out;
    }

    // ------------------------------------------------------------ helpers

    private void requireProduct(long productId) {
        if (ds.current().queryForObject("SELECT COUNT(*) FROM products WHERE id = ? AND is_deleted = 0 AND is_active = 1 AND is_publish = 1", Long.class, productId) == 0) {
            throw ApiException.notFound("Product not found");
        }
    }

    private static long me() {
        AuthPrincipal p = AuthPrincipal.current();
        if (!AuthPrincipal.SCOPE_CUSTOMER.equals(p.scope())) throw ApiException.forbidden("Customer login required");
        return p.userId();
    }

    private String siteName() {
        return DataTypeUtility.stringValue(websiteSettingsService.getSettings().get("site_name"), TenantContext.require().name());
    }

    static AuthPrincipal principal(Map<String, Object> u, Tenant t) {
        return new AuthPrincipal(DataTypeUtility.longValue(u.get("id"), 0), DataTypeUtility.stringValue(u.get("name")),
                DataTypeUtility.stringValue(u.get("email")), AuthPrincipal.ROLE_CUSTOMER, AuthPrincipal.SCOPE_CUSTOMER, t.code());
    }

    private static String sha256(String s) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(s.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}
