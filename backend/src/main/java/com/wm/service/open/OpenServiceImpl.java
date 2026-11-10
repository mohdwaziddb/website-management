package com.wm.service.open;

import com.wm.tenant.Tenant;
import com.wm.tenant.TenantRepository;
import com.wm.tenant.TenantResolver;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class OpenServiceImpl implements OpenService {

    @Autowired
    private TenantRepository tenantRepository;

    @Autowired
    private TenantResolver resolver;

    @Override
    public boolean isKnownDomain(String domain) {
        String d = TenantResolver.normalizeDomain(domain);
        if (d == null) return false;
        TenantResolver.HostKey key = resolver.fromHost(d);
        if (key == null) return d.equals(resolver.baseDomain());
        return tenantRepository.find(key.key(), key.value()).filter(Tenant::active).isPresent();
    }
}
