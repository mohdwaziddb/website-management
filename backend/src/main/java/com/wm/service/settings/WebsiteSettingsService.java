package com.wm.service.settings;

import java.util.Map;

/** Website ki general info + template (site_settings key-value table). */
public interface WebsiteSettingsService {

    /** Saari known keys (jo save nahi hui wo null) */
    Map<String, String> getSettings();

    /** Admin form ke liye: { fields, values } */
    Map<String, Object> getSettingsForm();

    /** Sirf param me aayi known keys validate karke save; baaki ignore */
    Map<String, String> saveSettings(Map<String, Object> param);
}
