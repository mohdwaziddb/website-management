package com.wm.service.platform;

import com.wm.security.AuthPrincipal;

import java.util.Map;

/** Root domain par super admin login (master DB super_admins). */
public interface PlatformAuthService {

    Map<String, Object> login(Map<String, Object> param);

    Map<String, Object> refresh(Map<String, Object> param);

    AuthPrincipal getMe();

    Map<String, Object> changePassword(Map<String, Object> param);
}
