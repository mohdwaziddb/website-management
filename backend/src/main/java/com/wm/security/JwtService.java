package com.wm.security;

import com.wm.common.ApiException;
import com.wm.config.AppProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class JwtService {
    public static final String TYPE_ACCESS = "access";
    public static final String TYPE_REFRESH = "refresh";

    private final SecretKey key;
    private final Duration accessTtl;
    private final Duration refreshTtl;

    public JwtService(AppProperties props) {
        byte[] secret = props.jwt().secret().getBytes(StandardCharsets.UTF_8);
        if (secret.length < 32) throw new IllegalStateException("app.jwt.secret must be at least 32 bytes");
        this.key = Keys.hmacShaKeyFor(secret);
        this.accessTtl = Duration.ofMinutes(props.jwt().accessMinutes());
        this.refreshTtl = Duration.ofDays(props.jwt().refreshDays());
    }

    public Map<String, Object> issueTokens(AuthPrincipal p, int tokenVersion) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("accessToken", build(p, TYPE_ACCESS, accessTtl, tokenVersion));
        out.put("refreshToken", build(p, TYPE_REFRESH, refreshTtl, tokenVersion));
        out.put("expiresIn", accessTtl.toSeconds());
        out.put("user", p);
        return out;
    }

    private String build(AuthPrincipal p, String type, Duration ttl, int tokenVersion) {
        Instant now = Instant.now();
        var b = Jwts.builder()
                .subject(String.valueOf(p.userId()))
                .claim("typ", type)
                .claim("scope", p.scope())
                .claim("role", p.role())
                .claim("name", p.name())
                .claim("email", p.email())
                .claim("ver", tokenVersion)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(ttl)));
        if (p.tenant() != null) b.claim("tenant", p.tenant());
        return b.signWith(key).compact();
    }

    public Claims parse(String token, String expectedType) {
        try {
            Claims c = Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
            if (!expectedType.equals(c.get("typ", String.class))) throw ApiException.unauthorized("Invalid token type");
            return c;
        } catch (JwtException | IllegalArgumentException e) {
            throw ApiException.unauthorized("Invalid or expired token");
        }
    }

    public static AuthPrincipal toPrincipal(Claims c) {
        return new AuthPrincipal(
                Long.parseLong(c.getSubject()),
                c.get("name", String.class),
                c.get("email", String.class),
                c.get("role", String.class),
                c.get("scope", String.class),
                c.get("tenant", String.class));
    }
}
