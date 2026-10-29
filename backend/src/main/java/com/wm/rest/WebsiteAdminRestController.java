package com.wm.rest;

import com.wm.common.ResponseFactory;
import com.wm.constant.ApiPathConstants;
import com.wm.service.activity_logs.ActivityLogService;
import com.wm.service.auth.WebsiteAuthService;
import com.wm.service.demo.DemoDataService;
import com.wm.service.files.FileUploadService;
import com.wm.service.settings.WebsiteSettingsService;
import com.wm.service.users.WebsiteUserService;
import com.wm.service.website_module.WebsiteModuleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

/** Website admin panel (abc.yourdomain.com/admin ya xyz.com/admin) ki saari APIs. */
@RestController
@RequestMapping(ApiPathConstants.Website.BASE)
public class WebsiteAdminRestController {

    @Autowired
    private ResponseFactory responseFactory;

    @Autowired
    private WebsiteAuthService websiteAuthService;

    @Autowired
    private WebsiteModuleService websiteModuleService;

    @Autowired
    private WebsiteSettingsService websiteSettingsService;

    @Autowired
    private WebsiteUserService websiteUserService;

    @Autowired
    private ActivityLogService activityLogService;

    @Autowired
    private FileUploadService fileUploadService;

    @Autowired
    private DemoDataService demoDataService;

    // ------------------------------------------------------------ auth

    @GetMapping(ApiPathConstants.Website.TENANT_INFO)
    public ResponseEntity<?> getTenantInfo() {
        return responseFactory.success(websiteAuthService.getTenantInfo());
    }

    @PostMapping(ApiPathConstants.Website.LOGIN)
    public ResponseEntity<?> login(@RequestBody Map<String, Object> param) {
        return responseFactory.success(websiteAuthService.login(param));
    }

    @PostMapping(ApiPathConstants.Website.REFRESH)
    public ResponseEntity<?> refresh(@RequestBody Map<String, Object> param) {
        return responseFactory.success(websiteAuthService.refresh(param));
    }

    @GetMapping(ApiPathConstants.Website.ME)
    public ResponseEntity<?> getMe() {
        return responseFactory.success(websiteAuthService.getMe());
    }

    @PostMapping(ApiPathConstants.Website.CHANGE_PASSWORD)
    public ResponseEntity<?> changePassword(@RequestBody Map<String, Object> param) {
        return responseFactory.success(websiteAuthService.changePassword(param));
    }

    @PostMapping(ApiPathConstants.Website.LOGOUT_ALL)
    public ResponseEntity<?> logoutAll() {
        websiteAuthService.logoutAll();
        return responseFactory.successMessage("Logged out from all devices");
    }

    // ------------------------------------------------------------ modules

    @GetMapping(ApiPathConstants.Website.MODULES)
    public ResponseEntity<?> getModules() {
        return responseFactory.success(websiteModuleService.getModules());
    }

    @GetMapping(ApiPathConstants.Website.DASHBOARD)
    public ResponseEntity<?> getDashboard() {
        return responseFactory.success(websiteModuleService.getDashboard());
    }

    @GetMapping(ApiPathConstants.Website.MODULE)
    public ResponseEntity<?> getList(@PathVariable String module, @RequestParam(required = false) Map<String, Object> param) {
        return responseFactory.success(websiteModuleService.getList(module, param, false));
    }

    @GetMapping(ApiPathConstants.Website.MODULE_OPTIONS)
    public ResponseEntity<?> getOptions(@PathVariable String module) {
        return responseFactory.success(websiteModuleService.getOptions(module));
    }

    @GetMapping(ApiPathConstants.Website.MODULE_RECORD)
    public ResponseEntity<?> getRecord(@PathVariable String module, @PathVariable long id) {
        return responseFactory.success(websiteModuleService.getRecord(module, id, false));
    }

    @PostMapping(ApiPathConstants.Website.MODULE)
    public ResponseEntity<?> addRecord(@PathVariable String module, @RequestBody Map<String, Object> param) {
        return responseFactory.success(websiteModuleService.addRecord(module, param));
    }

    @PutMapping(ApiPathConstants.Website.MODULE_REORDER)
    public ResponseEntity<?> reorderRecords(@PathVariable String module, @RequestBody List<Map<String, Object>> items) {
        websiteModuleService.reorderRecords(module, items);
        return responseFactory.successMessage("Order Saved Successfully");
    }

    @PutMapping(ApiPathConstants.Website.MODULE_RECORD)
    public ResponseEntity<?> updateRecord(@PathVariable String module, @PathVariable long id, @RequestBody Map<String, Object> param) {
        return responseFactory.success(websiteModuleService.updateRecord(module, id, param));
    }

    @DeleteMapping(ApiPathConstants.Website.MODULE_RECORD)
    public ResponseEntity<?> deleteRecord(@PathVariable String module, @PathVariable long id) {
        websiteModuleService.deleteRecord(module, id);
        return responseFactory.successMessage("Data Deleted Successfully");
    }

    // ------------------------------------------------------------ settings / template

    @GetMapping(ApiPathConstants.Website.SETTINGS)
    public ResponseEntity<?> getSettings() {
        return responseFactory.success(websiteSettingsService.getSettingsForm());
    }

    @PutMapping(ApiPathConstants.Website.SETTINGS)
    public ResponseEntity<?> saveSettings(@RequestBody Map<String, Object> param) {
        return responseFactory.success(websiteSettingsService.saveSettings(param));
    }

    // ------------------------------------------------------------ logs / files

    @GetMapping(ApiPathConstants.Website.LOGS)
    public ResponseEntity<?> getLogs(@RequestParam(required = false) Map<String, Object> param) {
        return responseFactory.success(activityLogService.getLogs(param));
    }

    @PostMapping(ApiPathConstants.Website.FILES)
    public ResponseEntity<?> uploadFile(@RequestParam("file") MultipartFile file) throws IOException {
        return responseFactory.success(fileUploadService.uploadFile(file));
    }

    // ------------------------------------------------------------ users (ADMIN only — SecurityConfig)

    @GetMapping(ApiPathConstants.Website.USERS)
    public ResponseEntity<?> getUsers() {
        return responseFactory.success(websiteUserService.getUsers());
    }

    @PostMapping(ApiPathConstants.Website.USERS)
    public ResponseEntity<?> addUser(@RequestBody Map<String, Object> param) {
        return responseFactory.success(websiteUserService.addUser(param));
    }

    @PutMapping(ApiPathConstants.Website.USER)
    public ResponseEntity<?> updateUser(@PathVariable long id, @RequestBody Map<String, Object> param) {
        return responseFactory.success(websiteUserService.updateUser(id, param));
    }

    @DeleteMapping(ApiPathConstants.Website.USER)
    public ResponseEntity<?> deleteUser(@PathVariable long id) {
        websiteUserService.deleteUser(id);
        return responseFactory.successMessage("Data Deleted Successfully");
    }

    // ------------------------------------------------------------ demo data / reset (ADMIN only — SecurityConfig)

    @GetMapping(ApiPathConstants.Website.DEMO)
    public ResponseEntity<?> getDemoStatus() {
        return responseFactory.success(demoDataService.getDemoStatus());
    }

    @PostMapping(ApiPathConstants.Website.DEMO_IMPORT)
    public ResponseEntity<?> importDemo() {
        return responseFactory.success(demoDataService.importDemo());
    }

    @DeleteMapping(ApiPathConstants.Website.DEMO)
    public ResponseEntity<?> removeDemo() {
        return responseFactory.success(demoDataService.removeDemo());
    }

    @PostMapping(ApiPathConstants.Website.RESET)
    public ResponseEntity<?> resetWebsite(@RequestBody Map<String, Object> param) {
        return responseFactory.success(demoDataService.resetWebsite(param));
    }
}
