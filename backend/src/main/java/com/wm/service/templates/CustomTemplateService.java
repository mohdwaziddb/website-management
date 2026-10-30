package com.wm.service.templates;

import java.util.List;
import java.util.Map;

/**
 * Website admin ke apne templates: kisi built-in template ko base lekar rang, font, navbar, hero,
 * sections (order / style / on-off) badalna. Key = "custom-<id>", website type = base template ka type.
 */
public interface CustomTemplateService {

    String KEY_PREFIX = "custom-";

    List<Map<String, Object>> getCustomTemplates();

    /** Public site / preview ke liye — { key, name, baseTemplate, type, config } */
    Map<String, Object> getCustomTemplate(String key);

    /** param: name, baseTemplate, config { dark, colors, fonts, nav, hero, heading, button, radius, card, sections } */
    Map<String, Object> addCustomTemplate(Map<String, Object> param);

    Map<String, Object> updateCustomTemplate(long id, Map<String, Object> param);

    /** Website par laga hua template delete nahi hota */
    void deleteCustomTemplate(long id);

    /** Built-in ya custom template ka website type; template hi na ho to null */
    String typeOf(String templateKey);
}
