package com.wm.service.store;

import com.wm.common.PageResult;

import java.util.List;
import java.util.Map;

/** Admin panel: orders, customers, reviews, dashboard */
public interface StoreAdminService {

    PageResult<Map<String, Object>> getOrders(Map<String, Object> param);

    Map<String, Object> getOrder(long id);

    Map<String, Object> updateStatus(long id, Map<String, Object> param);

    Map<String, Object> updateTracking(long id, Map<String, Object> param);

    Map<String, Object> addNote(long id, Map<String, Object> param);

    Map<String, Object> refund(long id);

    Map<String, Object> getSummary();

    PageResult<Map<String, Object>> getCustomers(Map<String, Object> param);

    Map<String, Object> getCustomer(long id);

    Map<String, Object> setCustomerActive(long id, Map<String, Object> param);

    List<Map<String, Object>> getReviews(Map<String, Object> param);

    Map<String, Object> setReviewApproved(long id, Map<String, Object> param);

    void deleteReview(long id);
}
