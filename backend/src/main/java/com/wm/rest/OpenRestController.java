package com.wm.rest;

import com.wm.common.ApiException;
import com.wm.common.ResponseFactory;
import com.wm.constant.ApiPathConstants;
import com.wm.service.demo.DemoCatalog;
import com.wm.service.demo.DemoDataService;
import com.wm.service.open.OpenService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/** Bina login + bina tenant (root domain / koi bhi domain): template preview demo, Caddy domain check. */
@RestController
@RequestMapping(ApiPathConstants.Open.BASE)
public class OpenRestController {

    @Autowired
    private ResponseFactory responseFactory;

    @Autowired
    private OpenService openService;

    @Autowired
    private DemoDataService demoDataService;

    @Autowired
    private DemoCatalog demoCatalog;

    /**
     * Live server par Caddy "on-demand TLS" ka ask endpoint: SSL certificate tabhi bane
     * jab domain hamara registered aur active ho. 200 = allowed, 404 = nahi.
     */
    @GetMapping(ApiPathConstants.Open.DOMAIN_CHECK)
    public ResponseEntity<?> domainCheck(@RequestParam(required = false) String domain) {
        if (!openService.isKnownDomain(domain)) throw ApiException.notFound("Unknown domain");
        return responseFactory.successMessage("Allowed");
    }

    /** Template preview / marketing showcase ke liye demo data */
    @GetMapping(ApiPathConstants.Open.DEMO_PREVIEW)
    public ResponseEntity<?> getDemoPreview(@PathVariable String type) {
        return responseFactory.success(demoDataService.getPreview(type));
    }

    /** Demo PDF (template preview me Downloads / E-Magazine) */
    @GetMapping(ApiPathConstants.Open.DEMO_FILE)
    public ResponseEntity<?> getDemoFile(@PathVariable String name) {
        return ResponseEntity.ok().contentType(MediaType.APPLICATION_PDF).cacheControl(CacheControl.maxAge(java.time.Duration.ofDays(1)))
                .body(demoCatalog.getFile(name));
    }
}
