package com.wm.tenant;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wm.common.ApiException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;

/**
 * /api/** (platform ke alawa) par tenant zaroori hai. Inactive / unknown tenant = 404.
 * Spring bean nahi hai (SecurityConfig me new hota hai) taaki do baar register na ho.
 */
public class TenantFilter extends OncePerRequestFilter {
    private final TenantResolver resolver;
    private final TenantRepository repository;
    private final ObjectMapper mapper;

    public TenantFilter(TenantResolver resolver, TenantRepository repository, ObjectMapper mapper) {
        this.resolver = resolver;
        this.repository = repository;
        this.mapper = mapper;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI().substring(request.getContextPath().length());
        return !path.startsWith("/api/") || path.startsWith("/api/platform/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        if ("OPTIONS".equalsIgnoreCase(req.getMethod())) {
            chain.doFilter(req, res);
            return;
        }
        try {
            Tenant tenant = resolve(req);
            if (tenant == null || !tenant.active()) {
                write(res, 404, "Website not found for this domain");
                return;
            }
            TenantContext.set(tenant);
            chain.doFilter(req, res);
        } catch (ApiException e) {
            write(res, e.getStatus().value(), e.getMessage());
        } finally {
            TenantContext.clear();
        }
    }

    private Tenant resolve(HttpServletRequest req) {
        TenantResolver.HostKey hostKey = resolver.fromHost(req.getServerName());
        String header = resolver.headerCode(req);
        if (hostKey == null) {
            return header == null ? null : repository.find(TenantRepository.Key.CODE, header).orElse(null);
        }
        Tenant t = repository.find(hostKey.key(), hostKey.value()).orElse(null);
        if (t != null && header != null && !header.equals(t.code())) throw ApiException.badRequest("Tenant mismatch");
        return t;
    }

    private void write(HttpServletResponse res, int status, String message) throws IOException {
        res.setStatus(status);
        res.setContentType("application/json");
        mapper.writeValue(res.getOutputStream(), Map.of("success", false, "message", message, "code", "TENANT"));
    }
}
