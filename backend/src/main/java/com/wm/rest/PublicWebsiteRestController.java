package com.wm.rest;

import com.wm.common.ResponseFactory;
import com.wm.constant.ApiPathConstants;
import com.wm.service.settings.WebsiteSettingsService;
import com.wm.service.templates.CustomTemplateService;
import com.wm.security.PublicRateLimiter;
import com.wm.service.inbox.InboxService;
import com.wm.service.seo.SeoService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.MediaType;
import com.wm.service.website_module.WebsiteModuleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Public website (abc.yourdomain.com / xyz.com) ke liye read-only API. Login nahi chahiye,
 * sirf published + active records milte hain.
 */
@RestController
@RequestMapping(ApiPathConstants.PublicSite.BASE)
public class PublicWebsiteRestController {

    @Autowired
    private ResponseFactory responseFactory;

    @Autowired
    private WebsiteModuleService websiteModuleService;

    @Autowired
    private WebsiteSettingsService websiteSettingsService;

    @Autowired
    private CustomTemplateService customTemplateService;

    @Autowired
    private InboxService inboxService;

    @Autowired
    private SeoService seoService;

    @PostMapping(ApiPathConstants.PublicSite.ENQUIRIES)
    public ResponseEntity<?> submitEnquiry(@RequestBody Map<String, Object> param, HttpServletRequest request) {
        inboxService.submitEnquiry(param, PublicRateLimiter.clientIp(request));
        return responseFactory.successMessage("Thank you! We have received your message and will get back to you soon.");
    }

    @PostMapping(ApiPathConstants.PublicSite.SUBSCRIBE)
    public ResponseEntity<?> subscribe(@RequestBody Map<String, Object> param, HttpServletRequest request) {
        inboxService.subscribe(param, PublicRateLimiter.clientIp(request));
        return responseFactory.successMessage("You're subscribed — thank you!");
    }

    @GetMapping(value = ApiPathConstants.PublicSite.SITEMAP, produces = "application/xml")
    public ResponseEntity<String> sitemap(HttpServletRequest request) {
        return ResponseEntity.ok().contentType(MediaType.APPLICATION_XML).body(seoService.sitemap(baseUrl(request)));
    }

    @GetMapping(value = ApiPathConstants.PublicSite.ROBOTS, produces = "text/plain")
    public ResponseEntity<String> robots(HttpServletRequest request) {
        return ResponseEntity.ok().contentType(MediaType.TEXT_PLAIN).body(seoService.robots(baseUrl(request)));
    }

    @GetMapping(value = ApiPathConstants.PublicSite.SHARE, produces = "text/html")
    public ResponseEntity<String> share(@RequestParam(required = false) String path, HttpServletRequest request) {
        return ResponseEntity.ok().contentType(MediaType.TEXT_HTML).body(seoService.shareHtml(baseUrl(request), path));
    }

    /** https://abc.com — nginx ke peeche X-Forwarded-Proto / Host */
    static String baseUrl(HttpServletRequest req) {
        String proto = req.getHeader("X-Forwarded-Proto");
        if (proto == null || proto.isBlank()) proto = req.getScheme();
        String host = req.getHeader("X-Forwarded-Host");
        if (host == null || host.isBlank()) host = req.getHeader("Host");
        if (host == null || !host.matches("^[A-Za-z0-9.-]+(:\\d+)?$")) host = req.getServerName();
        return proto.split(",")[0].trim() + "://" + host.split(",")[0].trim();
    }

    @GetMapping(ApiPathConstants.PublicSite.CUSTOM_TEMPLATE)
    public ResponseEntity<?> getCustomTemplate(@PathVariable String key) {
        return responseFactory.success(customTemplateService.getCustomTemplate(key));
    }

    @GetMapping(ApiPathConstants.PublicSite.SETTINGS)
    public ResponseEntity<?> getSettings() {
        return responseFactory.success(websiteSettingsService.getSettings());
    }

    @GetMapping(ApiPathConstants.PublicSite.MODULE)
    public ResponseEntity<?> getList(@PathVariable String module, @RequestParam(required = false) Map<String, Object> param) {
        return responseFactory.success(websiteModuleService.getList(module, param, true));
    }

    @GetMapping(ApiPathConstants.PublicSite.MODULE_RECORD)
    public ResponseEntity<?> getRecord(@PathVariable String module, @PathVariable long id) {
        return responseFactory.success(websiteModuleService.getRecord(module, id, true));
    }

    /** /api/public/pages/slug/about-us , /api/public/blogs/slug/annual-day */
    @GetMapping(ApiPathConstants.PublicSite.BY_SLUG)
    public ResponseEntity<?> getBySlug(@PathVariable String module, @PathVariable String slug) {
        return responseFactory.success(websiteModuleService.getBySlug(module, slug));
    }
}
