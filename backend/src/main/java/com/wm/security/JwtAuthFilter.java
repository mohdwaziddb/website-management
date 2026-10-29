package com.wm.security;

import com.wm.common.ApiException;
import com.wm.tenant.Tenant;
import com.wm.tenant.TenantContext;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Bearer token padhta hai. Tenant token sirf usi subdomain par valid hai jiske liye bana tha
 * (abc ka token xyz par kaam nahi karega). Token me tenant code hota hai, isliye subdomain ya custom domain dono par chalta hai.
 */
public class JwtAuthFilter extends OncePerRequestFilter {
    private final JwtService jwt;
    private final SessionValidator sessions;

    public JwtAuthFilter(JwtService jwt, SessionValidator sessions) {
        this.jwt = jwt;
        this.sessions = sessions;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        String header = req.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            try {
                Claims claims = jwt.parse(header.substring(7), JwtService.TYPE_ACCESS);
                AuthPrincipal p = JwtService.toPrincipal(claims);
                // sahi website + user abhi bhi active + token_version same (disable / logout-all turant lage)
                if (belongsHere(p) && sessions.isCurrent(p, claims.get("ver", Integer.class))) {
                    var auth = new UsernamePasswordAuthenticationToken(p, null,
                            List.of(new SimpleGrantedAuthority("ROLE_" + p.role())));
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }
            } catch (ApiException ignored) {
                // invalid token = anonymous; protected route 401 dega
            }
        }
        chain.doFilter(req, res);
    }

    private boolean belongsHere(AuthPrincipal p) {
        Tenant current = TenantContext.get();
        if (AuthPrincipal.SCOPE_PLATFORM.equals(p.scope())) {
            return current == null;
        }
        return current != null && current.code().equals(p.tenant());
    }
}
