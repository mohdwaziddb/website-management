package com.wm.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wm.config.AppProperties;
import com.wm.tenant.TenantFilter;
import com.wm.tenant.TenantRepository;
import com.wm.tenant.TenantResolver;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;
import java.util.Map;

@Configuration
public class SecurityConfig {
    public static final String ADMIN = "ADMIN";
    public static final String EDITOR = "EDITOR";
    public static final String SUPER_ADMIN = "SUPER_ADMIN";
    public static final String CUSTOMER = "CUSTOMER";

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, TenantResolver resolver, TenantRepository tenants,
                                           JwtService jwt, SessionValidator sessions, ObjectMapper mapper) throws Exception {
        TenantFilter tenantFilter = new TenantFilter(resolver, tenants, mapper);
        JwtAuthFilter jwtFilter = new JwtAuthFilter(jwt, sessions);

        http.csrf(AbstractHttpConfigurer::disable)
                .cors(c -> {})
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(a -> a
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        // public
                        .requestMatchers("/api/platform/auth/login", "/api/platform/auth/refresh").permitAll()
                        .requestMatchers("/api/auth/login", "/api/auth/refresh", "/api/tenant-info").permitAll()
                        .requestMatchers("/api/public/**", "/files/**", "/api/platform/domain-check", "/api/platform/demo/**").permitAll()
                        // online store: shopper (customer) — signup / login khula, baaki customer login
                        .requestMatchers("/api/store/auth/register", "/api/store/auth/login", "/api/store/auth/refresh",
                                "/api/store/auth/forgot-password", "/api/store/auth/reset-password").permitAll()
                        .requestMatchers("/api/store/**").hasRole(CUSTOMER)
                        // store admin: payment keys / SMTP sirf ADMIN
                        .requestMatchers("/api/shop/settings/**", "/api/shop/settings").hasRole(ADMIN)
                        // super admin (root domain)
                        .requestMatchers("/api/platform/**").hasRole(SUPER_ADMIN)
                        // tenant admin only
                        .requestMatchers("/api/users/**").hasRole(ADMIN)
                        .requestMatchers(HttpMethod.PUT, "/api/settings").hasRole(ADMIN)
                        .requestMatchers("/api/demo/**", "/api/website/**").hasRole(ADMIN)
                        .requestMatchers(HttpMethod.POST, "/api/templates/**").hasRole(ADMIN)
                        .requestMatchers(HttpMethod.PUT, "/api/templates/**").hasRole(ADMIN)
                        .requestMatchers(HttpMethod.DELETE, "/api/templates/**").hasRole(ADMIN)
                        // tenant admin + editor
                        .requestMatchers("/api/**").hasAnyRole(ADMIN, EDITOR)
                        .anyRequest().denyAll())
                .exceptionHandling(e -> e
                        .authenticationEntryPoint((req, res, ex) -> writeError(mapper, res, HttpStatus.UNAUTHORIZED, "Login required"))
                        .accessDeniedHandler((req, res, ex) -> writeError(mapper, res, HttpStatus.FORBIDDEN, "Access denied")))
                .addFilterBefore(tenantFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterAfter(jwtFilter, TenantFilter.class);
        return http.build();
    }

    private static void writeError(ObjectMapper mapper, jakarta.servlet.http.HttpServletResponse res,
                                   HttpStatus status, String msg) throws java.io.IOException {
        res.setStatus(status.value());
        res.setContentType("application/json");
        mapper.writeValue(res.getOutputStream(), Map.of("success", false, "message", msg));
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource(AppProperties props) {
        CorsConfiguration cfg = new CorsConfiguration();
        cfg.setAllowedOriginPatterns(props.cors().allowedOriginPatterns());
        cfg.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        cfg.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-Tenant"));
        cfg.setMaxAge(3600L);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", cfg);
        return source;
    }
}
