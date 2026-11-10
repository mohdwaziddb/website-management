package com.wm.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

@ConfigurationProperties(prefix = "app")
public record AppProperties(
        String baseDomain,
        List<String> reservedSubdomains,
        String uploadDir,
        TenantDb tenantDb,
        Jwt jwt,
        Cors cors
) {
    public record TenantDb(String urlTemplate, String username, String password, int maxPoolSize) {}

    public record Jwt(String secret, long accessMinutes, long refreshDays) {}

    public record Cors(List<String> allowedOriginPatterns) {}
}
