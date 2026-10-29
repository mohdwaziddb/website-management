package com.wm;

import com.wm.config.AppProperties;

import java.util.List;

/** Unit tests ke liye AppProperties (Spring ke bina). */
public final class TestProps {

    private TestProps() {
    }

    public static AppProperties of(String baseDomain) {
        return new AppProperties(baseDomain, List.of("www", "admin", "api", "app", "mail"), "target/test-uploads",
                new AppProperties.TenantDb("jdbc:mysql://localhost/{db}", "u", "p", "wmtest_t_", 2),
                new AppProperties.Jwt("unit-test-secret-key-that-is-at-least-32-bytes!!", 60, 7),
                new AppProperties.Platform("root@test.local", "Root@12345"),
                new AppProperties.Cors(List.of("http://localhost:5173")));
    }
}
