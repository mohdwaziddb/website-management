package com.wm.service.platform;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class CodeFromDomainTest {

    @Test
    void derivesCodeFromDomain() {
        assertEquals("xyz", PlatformTenantServiceImpl.codeFromDomain("xyz.com"));
        assertEquals("my-school-co", PlatformTenantServiceImpl.codeFromDomain("my-school.co.in"));
        assertEquals(40, PlatformTenantServiceImpl.codeFromDomain("a".repeat(60) + ".com").length());
    }
}
