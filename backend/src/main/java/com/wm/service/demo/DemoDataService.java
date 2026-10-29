package com.wm.service.demo;

import com.wm.tenant.Tenant;

import java.util.Map;

/**
 * WordPress jaisa one-click demo content + website reset.
 * Demo rows is_demo = 1 hoti hain, isliye "Remove demo data" admin ka apna data nahi chhedta.
 */
public interface DemoDataService {

    /** { siteType, demoRows, hasDemo } — current website */
    Map<String, Object> getDemoStatus();

    /** Current website ke type ka demo data add karo (photos download hoti hain) */
    Map<String, Object> importDemo();

    /** Naya website banate waqt (super admin) — TenantContext ke bina */
    Map<String, Object> importDemo(Tenant tenant, String siteType);

    /** Sirf demo rows / demo settings / demo photos hatao */
    Map<String, Object> removeDemo();

    /** Saara content + settings saaf (users nahi). param: confirm = website ka naam, importDemo? */
    Map<String, Object> resetWebsite(Map<String, Object> param);

    /** Frontend preview ke liye demo data (bina login) */
    Map<String, Object> getPreview(String siteType);
}
