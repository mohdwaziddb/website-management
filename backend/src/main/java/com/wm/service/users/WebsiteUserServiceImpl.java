package com.wm.service.users;

import com.wm.common.ApiException;
import com.wm.common.DataTypeUtility;
import com.wm.common.ValidationUtility;
import com.wm.security.AuthPrincipal;
import com.wm.security.SecurityConfig;
import com.wm.service.activity_logs.ActivityLogService;
import com.wm.tenant.TenantDataSources;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class WebsiteUserServiceImpl implements WebsiteUserService {
    private static final String COLUMNS = "id, name, email, role, is_active, last_login, created_on";
    private static final Set<String> ROLES = Set.of(SecurityConfig.ADMIN, SecurityConfig.EDITOR);

    @Autowired
    private TenantDataSources ds;

    @Autowired
    private PasswordEncoder encoder;

    @Autowired
    private ActivityLogService activityLogService;

    @Override
    public List<Map<String, Object>> getUsers() {
        List<Map<String, Object>> rows = ds.current().queryForList("SELECT " + COLUMNS + " FROM users ORDER BY id");
        rows.forEach(r -> r.replaceAll((k, v) -> DataTypeUtility.getJsonValue(v)));
        return rows;
    }

    @Override
    public Map<String, Object> addUser(Map<String, Object> param) {
        String name = ValidationUtility.requiredString(param.get("name"), "Name", 150);
        String email = ValidationUtility.requiredEmail(param.get("email"), "Email");
        String role = role(param.get("role"));
        String password = ValidationUtility.requiredPassword(param.get("password"), "Password");
        boolean active = DataTypeUtility.booleanValue(param.get("isActive"), true);
        try {
            ds.current().update("INSERT INTO users (name, email, password_hash, role, is_active) VALUES (?,?,?,?,?)",
                    name, email, encoder.encode(password), role, active);
        } catch (DuplicateKeyException e) {
            throw ApiException.badRequest("Email already exists");
        }
        activityLogService.addLog("users", null, "CREATE", "Created user " + email);
        return findByEmail(email);
    }

    /**
     * Role / active / email / password badle to token_version++ => us user ke purane sessions khatam.
     * Sirf naam badla to sessions chalte rahte hain (warna apna naam edit karte hi admin logout ho jata).
     * Apna password Profile page se badlo (wahan naye tokens milte hain) — yahan se nahi.
     */
    @Override
    public Map<String, Object> updateUser(long id, Map<String, Object> param) {
        String name = ValidationUtility.requiredString(param.get("name"), "Name", 150);
        String email = ValidationUtility.requiredEmail(param.get("email"), "Email");
        String role = role(param.get("role"));
        boolean active = DataTypeUtility.booleanValue(param.get("isActive"), true);
        String password = DataTypeUtility.isEmpty(param.get("password")) ? null : ValidationUtility.requiredPassword(param.get("password"), "Password");

        Map<String, Object> before = findById(id);
        boolean self = AuthPrincipal.current().userId() == id;
        if (self && (!active || !SecurityConfig.ADMIN.equals(role))) {
            throw ApiException.badRequest("You cannot disable or demote yourself");
        }
        if (self && password != null) {
            throw ApiException.badRequest("Change your own password from the Profile page");
        }
        boolean wasActiveAdmin = SecurityConfig.ADMIN.equals(before.get("role")) && DataTypeUtility.booleanValue(before.get("is_active"));
        if (wasActiveAdmin && (!active || !SecurityConfig.ADMIN.equals(role)) && countActiveAdmins() <= 1) {
            throw ApiException.badRequest("At least one active admin is required");
        }
        boolean securityChange = !role.equals(before.get("role")) || active != DataTypeUtility.booleanValue(before.get("is_active"))
                || !email.equals(before.get("email")) || password != null;
        try {
            ds.current().update("UPDATE users SET name = ?, email = ?, role = ?, is_active = ?" + (securityChange ? ", token_version = token_version + 1" : "")
                    + " WHERE id = ?", name, email, role, active, id);
        } catch (DuplicateKeyException e) {
            throw ApiException.badRequest("Email already exists");
        }
        if (password != null) {
            ds.current().update("UPDATE users SET password_hash = ? WHERE id = ?", encoder.encode(password), id);
        }
        activityLogService.addLog("users", id, "UPDATE", "Updated user " + email + (securityChange ? " (sessions signed out)" : ""));
        return findById(id);
    }

    @Override
    public void deleteUser(long id) {
        if (AuthPrincipal.current().userId() == id) throw ApiException.badRequest("You cannot delete yourself");
        Map<String, Object> u = findById(id);
        if (SecurityConfig.ADMIN.equals(u.get("role")) && DataTypeUtility.booleanValue(u.get("is_active")) && countActiveAdmins() <= 1) {
            throw ApiException.badRequest("At least one active admin is required");
        }
        ds.current().update("DELETE FROM users WHERE id = ?", id);
        activityLogService.addLog("users", id, "DELETE", "Deleted user " + u.get("email"));
    }

    private Map<String, Object> findById(long id) {
        List<Map<String, Object>> rows = ds.current().queryForList("SELECT " + COLUMNS + " FROM users WHERE id = ?", id);
        if (rows.isEmpty()) throw ApiException.notFound("User not found");
        Map<String, Object> row = rows.get(0);
        row.replaceAll((k, v) -> DataTypeUtility.getJsonValue(v));
        return row;
    }

    private long countActiveAdmins() {
        Long n = ds.current().queryForObject("SELECT COUNT(*) FROM users WHERE role = ? AND is_active = 1", Long.class, SecurityConfig.ADMIN);
        return n == null ? 0 : n;
    }

    private Map<String, Object> findByEmail(String email) {
        Map<String, Object> row = ds.current().queryForMap("SELECT " + COLUMNS + " FROM users WHERE email = ?", email);
        row.replaceAll((k, v) -> DataTypeUtility.getJsonValue(v));
        return row;
    }

    private static String role(Object value) {
        String role = DataTypeUtility.stringValue(value).toUpperCase(java.util.Locale.ROOT);
        if (!ROLES.contains(role)) throw ApiException.badRequest("Role must be ADMIN or EDITOR");
        return role;
    }
}
