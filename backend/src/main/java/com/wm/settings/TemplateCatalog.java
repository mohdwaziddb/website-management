package com.wm.settings;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Public website templates: key -> website type. Design React me hai (frontend/src/site/templates/*),
 * yahan sirf keys (validation + website type ke default template ke liye).
 */
public final class TemplateCatalog {
    public static final String DEFAULT = "classic";

    private static final Map<String, String> TYPE_OF = new LinkedHashMap<>();

    static {
        add("school", "classic", "modern", "minimal", "vibrant", "elegant");
        add("coaching", "achiever", "focus", "toppers");
        add("portfolio", "mono", "neon", "canvas");
        add("business", "corporate", "summit", "fresh");
        add("restaurant", "saffron", "bistro", "noir");
        add("gym", "iron", "pulse", "zenfit");
        add("real_estate", "prime", "urban", "haven");
        add("hospital", "care", "vital", "wellness");
        add("agency", "growth", "pixel", "orbit");
        add("hotel_travel", "paradise", "voyage", "grand");
        add("landing", "launch", "spark", "clean");
        add("photography", "lens", "vows", "frame");
        add("ngo", "hope", "earth", "unity");
        add("interior", "loft", "nordic", "luxe");
        add("construction", "builder", "steel", "skyline");
    }

    public static final List<String> KEYS = List.copyOf(TYPE_OF.keySet());

    private TemplateCatalog() {
    }

    private static void add(String type, String... keys) {
        for (String k : keys) TYPE_OF.put(k, type);
    }

    public static boolean isValid(String key) {
        return key != null && TYPE_OF.containsKey(key);
    }

    public static String typeOf(String key) {
        return TYPE_OF.get(key);
    }

    /** Us type ka pehla template */
    public static String defaultFor(String siteType) {
        return TYPE_OF.entrySet().stream().filter(e -> e.getValue().equals(siteType)).map(Map.Entry::getKey).findFirst().orElse(DEFAULT);
    }
}
