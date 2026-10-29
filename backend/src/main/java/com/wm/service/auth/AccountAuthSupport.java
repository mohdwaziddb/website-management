package com.wm.service.auth;

import com.wm.common.ApiException;
import com.wm.common.DataTypeUtility;
import com.wm.common.ValidationUtility;
import com.wm.security.AuthPrincipal;
import com.wm.security.JwtService;
import com.wm.security.LoginAttemptGuard;
import io.jsonwebtoken.Claims;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.function.Function;

/**
 * Login / refresh / change-password ka common logic. Website users (tenant DB "users") aur
 * super admins (master DB "super_admins") dono isi se chalte hain — dono tables me
 * id, name, email, password_hash, token_version, is_active columns hain.
 */
@Component
public class AccountAuthSupport {
    private final JwtService jwt;
    private final PasswordEncoder encoder;
    private final LoginAttemptGuard guard;
    // user na mile tab bhi bcrypt chale, taaki response time se email guess na ho
    private final String dummyHash;

    public AccountAuthSupport(JwtService jwt, PasswordEncoder encoder, LoginAttemptGuard guard) {
        this.jwt = jwt;
        this.encoder = encoder;
        this.guard = guard;
        this.dummyHash = encoder.encode("not-a-real-password");
    }

    /** table naam sirf code se aata hai ("users" / "super_admins"), user input se kabhi nahi */
    public Map<String, Object> login(JdbcTemplate db, String table, String guardPrefix, Map<String, Object> param,
                                     Function<Map<String, Object>, AuthPrincipal> principal) {
        String email = ValidationUtility.requiredEmail(param.get("email"), "Email");
        String password = ValidationUtility.requiredString(param.get("password"), "Password", 100);
        String guardKey = guardPrefix + ":" + email;
        guard.check(guardKey);

        List<Map<String, Object>> rows = db.queryForList("SELECT * FROM " + table + " WHERE email = ?", email);
        Map<String, Object> u = rows.isEmpty() ? null : rows.get(0);
        boolean ok = encoder.matches(password, u == null ? dummyHash : DataTypeUtility.stringValue(u.get("password_hash")));
        if (u == null || !ok) {
            guard.failed(guardKey);
            throw ApiException.unauthorized("Invalid email or password");
        }
        if (!DataTypeUtility.booleanValue(u.get("is_active"))) throw ApiException.forbidden("Account is disabled");
        guard.succeeded(guardKey);
        return jwt.issueTokens(principal.apply(u), version(u));
    }

    /** Refresh token valid + same scope/tenant + user active + token_version same => naye tokens */
    public Map<String, Object> refresh(JdbcTemplate db, String table, Map<String, Object> param, String scope, String tenantCode,
                                       Function<Map<String, Object>, AuthPrincipal> principal) {
        String token = ValidationUtility.requiredString(param.get("refreshToken"), "Refresh token", 4000);
        Claims c = jwt.parse(token, JwtService.TYPE_REFRESH);
        if (!scope.equals(c.get("scope", String.class))) throw ApiException.unauthorized("Invalid token");
        if (tenantCode != null && !tenantCode.equals(c.get("tenant", String.class))) throw ApiException.unauthorized("Invalid token");

        Map<String, Object> u = load(db, table, DataTypeUtility.longValue(c.getSubject(), -1));
        int ver = version(u);
        if (!DataTypeUtility.booleanValue(u.get("is_active")) || ver != DataTypeUtility.integerValue(c.get("ver"), -1)) {
            throw ApiException.unauthorized("Session expired, please login again");
        }
        return jwt.issueTokens(principal.apply(u), ver);
    }

    /** Password change = token_version++ => baaki saare devices logout. Naye tokens wapas milte hain. */
    public Map<String, Object> changePassword(JdbcTemplate db, String table, long userId, Map<String, Object> param,
                                              Function<Map<String, Object>, AuthPrincipal> principal) {
        String current = ValidationUtility.requiredString(param.get("currentPassword"), "Current password", 100);
        String next = ValidationUtility.requiredPassword(param.get("newPassword"), "New password");
        Map<String, Object> u = load(db, table, userId);
        if (!encoder.matches(current, DataTypeUtility.stringValue(u.get("password_hash")))) {
            throw ApiException.badRequest("Current password is wrong");
        }
        db.update("UPDATE " + table + " SET password_hash = ?, token_version = token_version + 1 WHERE id = ?", encoder.encode(next), userId);
        Map<String, Object> updated = load(db, table, userId);
        return jwt.issueTokens(principal.apply(updated), version(updated));
    }

    public void logoutAll(JdbcTemplate db, String table, long userId) {
        db.update("UPDATE " + table + " SET token_version = token_version + 1 WHERE id = ?", userId);
    }

    private static Map<String, Object> load(JdbcTemplate db, String table, long id) {
        return db.queryForList("SELECT * FROM " + table + " WHERE id = ?", id).stream().findFirst()
                .orElseThrow(() -> ApiException.unauthorized("User not found"));
    }

    private static int version(Map<String, Object> u) {
        return DataTypeUtility.integerValue(u.get("token_version"), 0);
    }
}
