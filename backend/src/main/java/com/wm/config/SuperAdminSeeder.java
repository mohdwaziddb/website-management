package com.wm.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Locale;

/** Pehli baar chalane par ek super admin bana deta hai (agar koi na ho). */
@Component
public class SuperAdminSeeder implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(SuperAdminSeeder.class);

    private final JdbcTemplate master;
    private final PasswordEncoder encoder;
    private final AppProperties props;

    public SuperAdminSeeder(JdbcTemplate master, PasswordEncoder encoder, AppProperties props) {
        this.master = master;
        this.encoder = encoder;
        this.props = props;
    }

    @Override
    public void run(ApplicationArguments args) {
        Long count = master.queryForObject("SELECT COUNT(*) FROM super_admins", Long.class);
        if (count != null && count > 0) return;
        String email = props.platform().adminEmail().trim().toLowerCase(Locale.ROOT);
        master.update("INSERT INTO super_admins (name, email, password_hash) VALUES (?,?,?)",
                "Super Admin", email, encoder.encode(props.platform().adminPassword()));
        log.warn("Created first super admin {} — login karke password turant badlein", email);
    }
}
