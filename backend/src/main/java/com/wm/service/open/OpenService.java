package com.wm.service.open;

public interface OpenService {

    /** Domain hamara hai? (root domain, ya kisi active website ka subdomain / custom domain) */
    boolean isKnownDomain(String domain);
}
