package com.wm.service.website_module;

import com.wm.common.PageResult;
import com.wm.module.ModuleDef;

import java.util.List;
import java.util.Map;

/** Saare website modules (Sliders, Pages, Gallery ...) ka generic CRUD — ModuleRegistry se. */
public interface WebsiteModuleService {

    List<ModuleDef> getModules();

    List<Map<String, Object>> getDashboard();

    PageResult<Map<String, Object>> getList(String module, Map<String, Object> param, boolean publicMode);

    Map<String, Object> getRecord(String module, long id, boolean publicMode);

    Map<String, Object> getBySlug(String module, String slug);

    List<Map<String, Object>> getOptions(String module);

    Map<String, Object> addRecord(String module, Map<String, Object> param);

    Map<String, Object> updateRecord(String module, long id, Map<String, Object> param);

    void reorderRecords(String module, List<Map<String, Object>> items);

    void deleteRecord(String module, long id);

    /** Ek saath kai records: action = publish | draft | delete. Jo na ho paaye wo "skipped" me (wajah ke saath) */
    Map<String, Object> bulkAction(String module, Map<String, Object> param);
}
