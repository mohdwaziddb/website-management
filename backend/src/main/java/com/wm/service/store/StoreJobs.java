package com.wm.service.store;

import com.wm.tenant.Tenant;
import com.wm.tenant.TenantDataSources;
import com.wm.tenant.TenantRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** Har 5 min: har website ke 30 min purane unpaid (online) orders cancel + stock wapas */
@Component
public class StoreJobs {
    private static final Logger log = LoggerFactory.getLogger(StoreJobs.class);
    public static final int PAYMENT_WINDOW_MINUTES = 30;

    @Value("${app.store.jobs-enabled:true}")
    private boolean enabled;

    @Autowired
    private TenantRepository tenants;

    @Autowired
    private TenantDataSources ds;

    @Autowired
    private StoreCheckoutService storeCheckoutService;

    @Scheduled(fixedDelayString = "${app.store.expire-every-ms:300000}", initialDelay = 60_000)
    public void expireUnpaidOrders() {
        if (!enabled) return;
        for (Tenant t : tenants.findAll()) {
            if (!t.active()) continue;
            try {
                int n = storeCheckoutService.expirePendingOrders(ds.forDb(t.dbName()), PAYMENT_WINDOW_MINUTES);
                if (n > 0) log.info("{}: cancelled {} unpaid orders", t.code(), n);
            } catch (Exception e) {
                log.warn("{}: order expiry failed: {}", t.code(), e.getMessage());
            }
        }
    }
}
