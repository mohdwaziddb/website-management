package com.wm.security;

import com.wm.TestProps;
import com.wm.common.ApiException;
import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {
    private final JwtService jwt = new JwtService(TestProps.of("localhost"));

    @Test
    void issuesAndParsesTenantToken() {
        AuthPrincipal p = new AuthPrincipal(7, "Ram", "ram@x.com", "ADMIN", AuthPrincipal.SCOPE_TENANT, "demo");
        Map<String, Object> tokens = jwt.issueTokens(p, 3);
        assertEquals(3600L, tokens.get("expiresIn"));

        Claims c = jwt.parse((String) tokens.get("accessToken"), JwtService.TYPE_ACCESS);
        assertEquals(p, JwtService.toPrincipal(c));
        assertEquals(3, c.get("ver", Integer.class));
    }

    @Test
    void refreshTokenCannotBeUsedAsAccess() {
        AuthPrincipal p = new AuthPrincipal(1, "A", "a@x.com", "SUPER_ADMIN", AuthPrincipal.SCOPE_PLATFORM, null);
        String refresh = (String) jwt.issueTokens(p, 0).get("refreshToken");
        assertThrows(ApiException.class, () -> jwt.parse(refresh, JwtService.TYPE_ACCESS));
        assertNull(JwtService.toPrincipal(jwt.parse(refresh, JwtService.TYPE_REFRESH)).tenant());
    }

    @Test
    void rejectsTamperedOrForeignToken() {
        AuthPrincipal p = new AuthPrincipal(1, "A", "a@x.com", "ADMIN", AuthPrincipal.SCOPE_TENANT, "demo");
        String access = (String) jwt.issueTokens(p, 0).get("accessToken");
        String tampered = access.substring(0, access.length() - 3) + "abc";
        assertEquals(401, assertThrows(ApiException.class, () -> jwt.parse(tampered, JwtService.TYPE_ACCESS)).getStatus().value());
        assertThrows(ApiException.class, () -> jwt.parse("not-a-jwt", JwtService.TYPE_ACCESS));
    }
}
