package com.wm.tenant;

import com.wm.config.AppProperties;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import jakarta.annotation.PreDestroy;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.concurrent.ConcurrentHashMap;

/** Har tenant DB ka chhota Hikari pool, pehli request par lazily banta hai. */
@Component
public class TenantDataSources {
    private final AppProperties.TenantDb cfg;
    private final ConcurrentHashMap<String, HikariDataSource> pools = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, JdbcTemplate> templates = new ConcurrentHashMap<>();

    public TenantDataSources(AppProperties props) {
        this.cfg = props.tenantDb();
    }

    /** Current request ke tenant ka JdbcTemplate. */
    public JdbcTemplate current() {
        return forDb(TenantContext.require().dbName());
    }

    public JdbcTemplate forDb(String dbName) {
        return templates.computeIfAbsent(dbName, db -> new JdbcTemplate(pools.computeIfAbsent(db, this::createPool)));
    }

    public void close(String dbName) {
        templates.remove(dbName);
        HikariDataSource ds = pools.remove(dbName);
        if (ds != null) ds.close();
    }

    private HikariDataSource createPool(String dbName) {
        HikariConfig hc = new HikariConfig();
        hc.setPoolName("tenant-" + dbName);
        hc.setJdbcUrl(cfg.urlTemplate().replace("{db}", dbName));
        hc.setUsername(cfg.username());
        hc.setPassword(cfg.password());
        hc.setMaximumPoolSize(cfg.maxPoolSize());
        hc.setMinimumIdle(0);
        hc.setIdleTimeout(120_000);
        return new HikariDataSource(hc);
    }

    @PreDestroy
    void shutdown() {
        pools.values().forEach(HikariDataSource::close);
    }
}
