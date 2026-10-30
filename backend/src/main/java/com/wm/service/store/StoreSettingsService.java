package com.wm.service.store;

import java.util.Map;

public interface StoreSettingsService {

    /** Admin: fields + values (secrets kabhi nahi, sirf "set hai ya nahi") + webhook URL */
    Map<String, Object> getSettings();

    Map<String, Object> updateSettings(Map<String, Object> param);

    /** Website checkout ke liye: COD / Razorpay on?, Key ID, shipping — secret kuch nahi */
    Map<String, Object> getPublicConfig();

    StoreConfig config();

    Map<String, Object> testRazorpay();

    Map<String, Object> testEmail(Map<String, Object> param);
}
