package com.wm.service.platform;

import com.wm.common.DataTypeUtility;
import com.wm.security.AuthPrincipal;
import com.wm.security.SecurityConfig;
import com.wm.service.auth.AccountAuthSupport;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class PlatformAuthServiceImpl implements PlatformAuthService {
    private static final String TABLE = "super_admins";

    @Autowired
    private JdbcTemplate master;

    @Autowired
    private AccountAuthSupport accountAuthSupport;

    @Override
    public Map<String, Object> login(Map<String, Object> param) {
        return accountAuthSupport.login(master, TABLE, "platform", param, PlatformAuthServiceImpl::principal);
    }

    @Override
    public Map<String, Object> refresh(Map<String, Object> param) {
        return accountAuthSupport.refresh(master, TABLE, param, AuthPrincipal.SCOPE_PLATFORM, null, PlatformAuthServiceImpl::principal);
    }

    @Override
    public AuthPrincipal getMe() {
        return AuthPrincipal.current();
    }

    @Override
    public Map<String, Object> changePassword(Map<String, Object> param) {
        return accountAuthSupport.changePassword(master, TABLE, AuthPrincipal.current().userId(), param, PlatformAuthServiceImpl::principal);
    }

    private static AuthPrincipal principal(Map<String, Object> u) {
        return new AuthPrincipal(DataTypeUtility.longValue(u.get("id"), 0), DataTypeUtility.stringValue(u.get("name")),
                DataTypeUtility.stringValue(u.get("email")), SecurityConfig.SUPER_ADMIN, AuthPrincipal.SCOPE_PLATFORM, null);
    }
}
