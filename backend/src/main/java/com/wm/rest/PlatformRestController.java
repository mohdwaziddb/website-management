package com.wm.rest;

import com.wm.common.ApiException;
import com.wm.common.ResponseFactory;
import com.wm.constant.ApiPathConstants;
import com.wm.service.demo.DemoCatalog;
import com.wm.service.demo.DemoDataService;
import com.wm.service.platform.PlatformAuthService;
import com.wm.service.platform.PlatformTenantService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/** Super admin (www.yourdomain.com/admin): login + websites banao / edit / band karo. */
@RestController
@RequestMapping(ApiPathConstants.Platform.BASE)
public class PlatformRestController {

    @Autowired
    private ResponseFactory responseFactory;

    @Autowired
    private PlatformAuthService platformAuthService;

    @Autowired
    private PlatformTenantService platformTenantService;

    @Autowired
    private DemoDataService demoDataService;

    @Autowired
    private DemoCatalog demoCatalog;

    // ------------------------------------------------------------ auth

    @PostMapping(ApiPathConstants.Platform.LOGIN)
    public ResponseEntity<?> login(@RequestBody Map<String, Object> param) {
        return responseFactory.success(platformAuthService.login(param));
    }

    @PostMapping(ApiPathConstants.Platform.REFRESH)
    public ResponseEntity<?> refresh(@RequestBody Map<String, Object> param) {
        return responseFactory.success(platformAuthService.refresh(param));
    }

    @GetMapping(ApiPathConstants.Platform.ME)
    public ResponseEntity<?> getMe() {
        return responseFactory.success(platformAuthService.getMe());
    }

    @PostMapping(ApiPathConstants.Platform.CHANGE_PASSWORD)
    public ResponseEntity<?> changePassword(@RequestBody Map<String, Object> param) {
        return responseFactory.success(platformAuthService.changePassword(param));
    }

    // ------------------------------------------------------------ websites

    @GetMapping(ApiPathConstants.Platform.TENANTS)
    public ResponseEntity<?> getTenants() {
        return responseFactory.success(platformTenantService.getTenants());
    }

    @PostMapping(ApiPathConstants.Platform.TENANTS)
    public ResponseEntity<?> addTenant(@RequestBody Map<String, Object> param) {
        return responseFactory.success(platformTenantService.addTenant(param));
    }

    /** active=false => website turant band (404). DB delete nahi hota. */
    @PutMapping(ApiPathConstants.Platform.TENANT)
    public ResponseEntity<?> updateTenant(@PathVariable long id, @RequestBody Map<String, Object> param) {
        return responseFactory.success(platformTenantService.updateTenant(id, param));
    }

    @PostMapping(ApiPathConstants.Platform.TENANT_RESET_ADMIN)
    public ResponseEntity<?> resetTenantAdmin(@PathVariable long id, @RequestBody Map<String, Object> param) {
        platformTenantService.resetTenantAdmin(id, param);
        return responseFactory.successMessage("Admin password reset successfully");
    }

    /**
     * Live server par Caddy "on-demand TLS" ka ask endpoint (bina login): SSL certificate tabhi bane
     * jab domain hamara registered aur active ho. 200 = allowed, 404 = nahi.
     */
    @GetMapping(ApiPathConstants.Platform.DOMAIN_CHECK)
    public ResponseEntity<?> domainCheck(@RequestParam(required = false) String domain) {
        if (!platformTenantService.isKnownDomain(domain)) throw ApiException.notFound("Unknown domain");
        return responseFactory.successMessage("Allowed");
    }

    /** Template preview / marketing showcase ke liye demo data (public) */
    @GetMapping(ApiPathConstants.Platform.DEMO_PREVIEW)
    public ResponseEntity<?> getDemoPreview(@PathVariable String type) {
        return responseFactory.success(demoDataService.getPreview(type));
    }

    /** Demo PDF (template preview me Downloads / E-Magazine) */
    @GetMapping(ApiPathConstants.Platform.DEMO_FILE)
    public ResponseEntity<?> getDemoFile(@PathVariable String name) {
        return ResponseEntity.ok().contentType(MediaType.APPLICATION_PDF).cacheControl(CacheControl.maxAge(java.time.Duration.ofDays(1)))
                .body(demoCatalog.getFile(name));
    }
}
