package com.wm.service.store;

import java.util.List;
import java.util.Map;

/** Website ke customer (shopper) — admin users se bilkul alag table (customers) aur role CUSTOMER */
public interface CustomerAccountService {

    Map<String, Object> register(Map<String, Object> param);

    Map<String, Object> login(Map<String, Object> param);

    Map<String, Object> refresh(Map<String, Object> param);

    Map<String, Object> getMe();

    Map<String, Object> updateMe(Map<String, Object> param);

    Map<String, Object> changePassword(Map<String, Object> param);

    /** Hamesha same jawab (email exist kare ya nahi — koi email guess na kar sake) */
    void forgotPassword(Map<String, Object> param);

    void resetPassword(Map<String, Object> param);

    List<Map<String, Object>> getAddresses();

    Map<String, Object> addAddress(Map<String, Object> param);

    Map<String, Object> updateAddress(long id, Map<String, Object> param);

    void deleteAddress(long id);

    /** Checkout ke liye: customer ka apna address (dusre ka id = 404) */
    Map<String, Object> getOwnAddress(long id);

    /** Address validate karke clean map (checkout ka naya address bhi isi se) */
    Map<String, Object> cleanAddress(Map<String, Object> param);

    List<Map<String, Object>> getWishlist();

    void addToWishlist(long productId);

    void removeFromWishlist(long productId);

    Map<String, Object> addReview(long productId, Map<String, Object> param);

    /** Public: approved reviews + average */
    Map<String, Object> getProductReviews(long productId);
}
