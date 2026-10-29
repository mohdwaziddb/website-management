package com.wm.tenant;

import com.wm.TestProps;
import org.junit.jupiter.api.Test;

import static com.wm.tenant.TenantRepository.Key.DOMAIN;
import static com.wm.tenant.TenantRepository.Key.SUBDOMAIN;
import static org.junit.jupiter.api.Assertions.*;

class TenantResolverTest {
    private final TenantResolver live = new TenantResolver(TestProps.of("abc.com"));
    private final TenantResolver local = new TenantResolver(TestProps.of("localhost"));

    @Test
    void rootAndWwwArePlatform() {
        assertNull(live.fromHost("abc.com"));
        assertNull(live.fromHost("www.abc.com"));
        assertNull(live.fromHost("ABC.com."));
        assertNull(live.fromHost("admin.abc.com"));
        assertNull(local.fromHost("localhost"));
    }

    @Test
    void ipAndBareHostsArePlatform() {
        assertNull(live.fromHost("127.0.0.1"));
        assertNull(live.fromHost("::1"));
        assertNull(live.fromHost("localhost"));
        assertNull(live.fromHost(null));
        assertNull(live.fromHost(" "));
    }

    @Test
    void subdomain() {
        assertEquals(new TenantResolver.HostKey(SUBDOMAIN, "dbwebsite"), live.fromHost("dbwebsite.abc.com"));
        assertEquals(new TenantResolver.HostKey(SUBDOMAIN, "dbwebsite"), live.fromHost("www.dbwebsite.abc.com"));
        assertEquals(new TenantResolver.HostKey(SUBDOMAIN, "demo"), local.fromHost("Demo.localhost"));
    }

    @Test
    void customDomainStripsWww() {
        assertEquals(new TenantResolver.HostKey(DOMAIN, "xyz.com"), live.fromHost("www.xyz.com"));
        assertEquals(new TenantResolver.HostKey(DOMAIN, "xyz.com"), live.fromHost("XYZ.com"));
        assertEquals(new TenantResolver.HostKey(DOMAIN, "school.co.in"), local.fromHost("school.co.in"));
        // abc.com.evil.net hamara subdomain nahi hai
        assertEquals(DOMAIN, live.fromHost("abc.com.evil.net").key());
    }

    @Test
    void validation() {
        assertTrue(live.valid("my-school1"));
        assertFalse(live.valid("www"));
        assertFalse(live.valid("-bad"));
        assertFalse(live.valid("Bad"));
        assertFalse(live.valid("a_b"));
        assertFalse(live.valid(null));
        assertTrue(live.isOwnDomain("x.abc.com"));
        assertTrue(live.isOwnDomain("abc.com"));
        assertFalse(live.isOwnDomain("xabc.com"));
    }

    @Test
    void normalizeDomain() {
        assertEquals("xyz.com", TenantResolver.normalizeDomain(" WWW.Xyz.com. "));
        assertNull(TenantResolver.normalizeDomain(""));
    }
}
