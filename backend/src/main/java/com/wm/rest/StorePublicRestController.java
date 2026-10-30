package com.wm.rest;

import com.wm.common.ResponseFactory;
import com.wm.constant.ApiPathConstants;
import com.wm.service.store.CustomerAccountService;
import com.wm.service.store.StoreCheckoutService;
import com.wm.service.store.StoreSettingsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/** Online store — bina login: checkout config, cart ka hisaab, product reviews, Razorpay webhook */
@RestController
@RequestMapping(ApiPathConstants.StorePublic.BASE)
public class StorePublicRestController {

    @Autowired
    private ResponseFactory responseFactory;

    @Autowired
    private StoreSettingsService storeSettingsService;

    @Autowired
    private StoreCheckoutService storeCheckoutService;

    @Autowired
    private CustomerAccountService customerAccountService;

    @GetMapping(ApiPathConstants.StorePublic.CONFIG)
    public ResponseEntity<?> getConfig() {
        return responseFactory.success(storeSettingsService.getPublicConfig());
    }

    @PostMapping(ApiPathConstants.StorePublic.QUOTE)
    public ResponseEntity<?> quote(@RequestBody Map<String, Object> param) {
        return responseFactory.success(storeCheckoutService.quote(param));
    }

    @GetMapping(ApiPathConstants.StorePublic.REVIEWS)
    public ResponseEntity<?> getReviews(@PathVariable long productId) {
        return responseFactory.success(customerAccountService.getProductReviews(productId));
    }

    /** Razorpay Dashboard → Webhooks: is URL par payment.captured / payment.failed / order.paid */
    @PostMapping(ApiPathConstants.StorePublic.WEBHOOK)
    public ResponseEntity<?> webhook(@RequestBody String body, @RequestHeader(value = "X-Razorpay-Signature", required = false) String signature) {
        return responseFactory.success(storeCheckoutService.handleWebhook(body, signature));
    }
}
