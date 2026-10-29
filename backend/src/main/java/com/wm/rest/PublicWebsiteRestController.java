package com.wm.rest;

import com.wm.common.ResponseFactory;
import com.wm.constant.ApiPathConstants;
import com.wm.service.settings.WebsiteSettingsService;
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
