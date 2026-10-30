package com.wm.rest;

import com.wm.common.ResponseFactory;
import com.wm.constant.ApiPathConstants;
import com.wm.service.store.CustomerAccountService;
import com.wm.service.store.StoreCheckoutService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/** Online store ka customer (shopper): account, addresses, wishlist, checkout, orders. Role CUSTOMER. */
@RestController
@RequestMapping(ApiPathConstants.Store.BASE)
public class StoreCustomerRestController {

    @Autowired
    private ResponseFactory responseFactory;

    @Autowired
    private CustomerAccountService customerAccountService;

    @Autowired
    private StoreCheckoutService storeCheckoutService;

    // ------------------------------------------------------------ auth (register / login / forgot khule)

    @PostMapping(ApiPathConstants.Store.REGISTER)
    public ResponseEntity<?> register(@RequestBody Map<String, Object> param) {
        return responseFactory.success(customerAccountService.register(param));
    }

    @PostMapping(ApiPathConstants.Store.LOGIN)
    public ResponseEntity<?> login(@RequestBody Map<String, Object> param) {
        return responseFactory.success(customerAccountService.login(param));
    }

    @PostMapping(ApiPathConstants.Store.REFRESH)
    public ResponseEntity<?> refresh(@RequestBody Map<String, Object> param) {
        return responseFactory.success(customerAccountService.refresh(param));
    }

    @PostMapping(ApiPathConstants.Store.FORGOT_PASSWORD)
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, Object> param) {
        customerAccountService.forgotPassword(param);
        return responseFactory.successMessage("If an account exists for this email, a reset link has been sent");
    }

    @PostMapping(ApiPathConstants.Store.RESET_PASSWORD)
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, Object> param) {
        customerAccountService.resetPassword(param);
        return responseFactory.successMessage("Password changed — please login");
    }

    @PostMapping(ApiPathConstants.Store.CHANGE_PASSWORD)
    public ResponseEntity<?> changePassword(@RequestBody Map<String, Object> param) {
        return responseFactory.success(customerAccountService.changePassword(param));
    }

    @GetMapping(ApiPathConstants.Store.ME)
    public ResponseEntity<?> getMe() {
        return responseFactory.success(customerAccountService.getMe());
    }

    @PutMapping(ApiPathConstants.Store.ME)
    public ResponseEntity<?> updateMe(@RequestBody Map<String, Object> param) {
        return responseFactory.success(customerAccountService.updateMe(param));
    }

    // ------------------------------------------------------------ addresses

    @GetMapping(ApiPathConstants.Store.ADDRESSES)
    public ResponseEntity<?> getAddresses() {
        return responseFactory.success(customerAccountService.getAddresses());
    }

    @PostMapping(ApiPathConstants.Store.ADDRESSES)
    public ResponseEntity<?> addAddress(@RequestBody Map<String, Object> param) {
        return responseFactory.success(customerAccountService.addAddress(param));
    }

    @PutMapping(ApiPathConstants.Store.ADDRESS)
    public ResponseEntity<?> updateAddress(@PathVariable long id, @RequestBody Map<String, Object> param) {
        return responseFactory.success(customerAccountService.updateAddress(id, param));
    }

    @DeleteMapping(ApiPathConstants.Store.ADDRESS)
    public ResponseEntity<?> deleteAddress(@PathVariable long id) {
        customerAccountService.deleteAddress(id);
        return responseFactory.successMessage("Address deleted");
    }

    // ------------------------------------------------------------ wishlist + reviews

    @GetMapping(ApiPathConstants.Store.WISHLIST)
    public ResponseEntity<?> getWishlist() {
        return responseFactory.success(customerAccountService.getWishlist());
    }

    @PostMapping(ApiPathConstants.Store.WISHLIST_ITEM)
    public ResponseEntity<?> addToWishlist(@PathVariable long productId) {
        customerAccountService.addToWishlist(productId);
        return responseFactory.successMessage("Added to wishlist");
    }

    @DeleteMapping(ApiPathConstants.Store.WISHLIST_ITEM)
    public ResponseEntity<?> removeFromWishlist(@PathVariable long productId) {
        customerAccountService.removeFromWishlist(productId);
        return responseFactory.successMessage("Removed from wishlist");
    }

    @PostMapping(ApiPathConstants.Store.REVIEWS)
    public ResponseEntity<?> addReview(@PathVariable long productId, @RequestBody Map<String, Object> param) {
        return responseFactory.success(customerAccountService.addReview(productId, param));
    }

    // ------------------------------------------------------------ checkout + orders

    @PostMapping(ApiPathConstants.Store.CHECKOUT)
    public ResponseEntity<?> checkout(@RequestBody Map<String, Object> param) {
        return responseFactory.success(storeCheckoutService.checkout(param));
    }

    @GetMapping(ApiPathConstants.Store.ORDERS)
    public ResponseEntity<?> getMyOrders(@RequestParam(required = false) Map<String, Object> param) {
        return responseFactory.success(storeCheckoutService.getMyOrders(param));
    }

    @GetMapping(ApiPathConstants.Store.ORDER)
    public ResponseEntity<?> getMyOrder(@PathVariable String orderNo) {
        return responseFactory.success(storeCheckoutService.getMyOrder(orderNo));
    }

    @PostMapping(ApiPathConstants.Store.ORDER_CANCEL)
    public ResponseEntity<?> cancelMyOrder(@PathVariable String orderNo, @RequestBody(required = false) Map<String, Object> param) {
        return responseFactory.success(storeCheckoutService.cancelMyOrder(orderNo, param == null ? Map.of() : param));
    }

    @PostMapping(ApiPathConstants.Store.ORDER_PAY)
    public ResponseEntity<?> retryPayment(@PathVariable String orderNo) {
        return responseFactory.success(storeCheckoutService.retryPayment(orderNo));
    }

    @PostMapping(ApiPathConstants.Store.ORDER_VERIFY)
    public ResponseEntity<?> verifyRazorpay(@PathVariable String orderNo, @RequestBody Map<String, Object> param) {
        return responseFactory.success(storeCheckoutService.verifyRazorpay(orderNo, param));
    }
}
