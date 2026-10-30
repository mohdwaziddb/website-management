package com.wm.rest;

import com.wm.common.ResponseFactory;
import com.wm.constant.ApiPathConstants;
import com.wm.service.store.StoreAdminService;
import com.wm.service.store.StoreSettingsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/** Admin panel: orders, customers, reviews, store dashboard + settings (settings sirf ADMIN — SecurityConfig) */
@RestController
@RequestMapping(ApiPathConstants.Shop.BASE)
public class StoreAdminRestController {

    @Autowired
    private ResponseFactory responseFactory;

    @Autowired
    private StoreAdminService storeAdminService;

    @Autowired
    private StoreSettingsService storeSettingsService;

    @GetMapping(ApiPathConstants.Shop.SUMMARY)
    public ResponseEntity<?> getSummary() {
        return responseFactory.success(storeAdminService.getSummary());
    }

    // ------------------------------------------------------------ orders

    @GetMapping(ApiPathConstants.Shop.ORDERS)
    public ResponseEntity<?> getOrders(@RequestParam(required = false) Map<String, Object> param) {
        return responseFactory.success(storeAdminService.getOrders(param));
    }

    @GetMapping(ApiPathConstants.Shop.ORDER)
    public ResponseEntity<?> getOrder(@PathVariable long id) {
        return responseFactory.success(storeAdminService.getOrder(id));
    }

    @PutMapping(ApiPathConstants.Shop.ORDER_STATUS)
    public ResponseEntity<?> updateStatus(@PathVariable long id, @RequestBody Map<String, Object> param) {
        return responseFactory.success(storeAdminService.updateStatus(id, param));
    }

    @PutMapping(ApiPathConstants.Shop.ORDER_TRACKING)
    public ResponseEntity<?> updateTracking(@PathVariable long id, @RequestBody Map<String, Object> param) {
        return responseFactory.success(storeAdminService.updateTracking(id, param));
    }

    @PostMapping(ApiPathConstants.Shop.ORDER_NOTE)
    public ResponseEntity<?> addNote(@PathVariable long id, @RequestBody Map<String, Object> param) {
        return responseFactory.success(storeAdminService.addNote(id, param));
    }

    @PostMapping(ApiPathConstants.Shop.ORDER_REFUND)
    public ResponseEntity<?> refund(@PathVariable long id) {
        return responseFactory.success(storeAdminService.refund(id));
    }

    // ------------------------------------------------------------ customers

    @GetMapping(ApiPathConstants.Shop.CUSTOMERS)
    public ResponseEntity<?> getCustomers(@RequestParam(required = false) Map<String, Object> param) {
        return responseFactory.success(storeAdminService.getCustomers(param));
    }

    @GetMapping(ApiPathConstants.Shop.CUSTOMER)
    public ResponseEntity<?> getCustomer(@PathVariable long id) {
        return responseFactory.success(storeAdminService.getCustomer(id));
    }

    @PutMapping(ApiPathConstants.Shop.CUSTOMER_ACTIVE)
    public ResponseEntity<?> setCustomerActive(@PathVariable long id, @RequestBody Map<String, Object> param) {
        return responseFactory.success(storeAdminService.setCustomerActive(id, param));
    }

    // ------------------------------------------------------------ reviews

    @GetMapping(ApiPathConstants.Shop.REVIEWS)
    public ResponseEntity<?> getReviews(@RequestParam(required = false) Map<String, Object> param) {
        return responseFactory.success(storeAdminService.getReviews(param));
    }

    @PutMapping(ApiPathConstants.Shop.REVIEW)
    public ResponseEntity<?> setReviewApproved(@PathVariable long id, @RequestBody Map<String, Object> param) {
        return responseFactory.success(storeAdminService.setReviewApproved(id, param));
    }

    @DeleteMapping(ApiPathConstants.Shop.REVIEW)
    public ResponseEntity<?> deleteReview(@PathVariable long id) {
        storeAdminService.deleteReview(id);
        return responseFactory.successMessage("Review deleted");
    }

    // ------------------------------------------------------------ settings (ADMIN)

    @GetMapping(ApiPathConstants.Shop.SETTINGS)
    public ResponseEntity<?> getSettings() {
        return responseFactory.success(storeSettingsService.getSettings());
    }

    @PutMapping(ApiPathConstants.Shop.SETTINGS)
    public ResponseEntity<?> updateSettings(@RequestBody Map<String, Object> param) {
        return responseFactory.success(storeSettingsService.updateSettings(param));
    }

    @PostMapping(ApiPathConstants.Shop.SETTINGS_TEST_RAZORPAY)
    public ResponseEntity<?> testRazorpay() {
        return responseFactory.success(storeSettingsService.testRazorpay());
    }

    @PostMapping(ApiPathConstants.Shop.SETTINGS_TEST_EMAIL)
    public ResponseEntity<?> testEmail(@RequestBody Map<String, Object> param) {
        return responseFactory.success(storeSettingsService.testEmail(param));
    }
}
