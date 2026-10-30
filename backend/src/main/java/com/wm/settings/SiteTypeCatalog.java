package com.wm.settings;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Website types (School, Restaurant, Gym ...). Har type ko kaunse modules dikhenge aur unke naam kya honge
 * (Services = Courses / Programs / Departments, Catalog = Menu Items / Properties / Rooms ...).
 * Frontend me same keys: frontend/src/site/siteTypes.ts
 */
public final class SiteTypeCatalog {

    public record SiteType(String key, String label, List<String> modules, Map<String, String> labels) {
        public String labelOf(String module, String fallback) {
            return labels.getOrDefault(module, fallback);
        }
    }

    public static final String DEFAULT = "school";

    /** Har type me ye modules */
    private static final List<String> COMMON = List.of(
            "menus", "pages", "sliders", "popups", "testimonials", "faqs", "stats", "partners",
            "blogs", "gallery_categories", "image_gallery", "videos", "attachments", "enquiries", "subscribers");

    private static final Map<String, SiteType> TYPES = new LinkedHashMap<>();

    static {
        add("school", "School",
                List.of("services", "team_members", "thoughts", "press_releases", "tenders", "livestreams", "award_categories", "awards",
                        "achievements", "activities", "video_categories", "magazine_categories", "magazines", "magazine_thumbnails"),
                Map.of("services", "Facilities", "team_members", "Faculty"));
        add("coaching", "Coaching Institute",
                List.of("services", "team_members", "pricing_plans", "achievements", "livestreams"),
                Map.of("services", "Courses", "team_members", "Faculty", "pricing_plans", "Batches & Fees", "achievements", "Results / Toppers"));
        add("portfolio", "Portfolio",
                List.of("projects", "services"),
                Map.of("projects", "Projects", "services", "Skills & Services"));
        add("business", "Business / Company",
                List.of("services", "team_members", "projects", "catalog_items"),
                Map.of("projects", "Case Studies", "catalog_items", "Products"));
        add("restaurant", "Restaurant / Cafe",
                List.of("catalog_items", "services", "team_members"),
                Map.of("catalog_items", "Menu Items", "services", "Specialities", "team_members", "Chefs"));
        add("gym", "Gym / Fitness",
                List.of("services", "team_members", "pricing_plans"),
                Map.of("services", "Programs", "team_members", "Trainers", "pricing_plans", "Memberships"));
        add("real_estate", "Real Estate",
                List.of("catalog_items", "services", "team_members", "projects"),
                Map.of("catalog_items", "Properties", "team_members", "Agents", "projects", "Projects"));
        add("hospital", "Hospital / Clinic",
                List.of("services", "team_members", "pricing_plans"),
                Map.of("services", "Departments", "team_members", "Doctors", "pricing_plans", "Health Packages"));
        add("agency", "Digital Marketing Agency",
                List.of("services", "team_members", "projects", "pricing_plans"),
                Map.of("projects", "Case Studies", "pricing_plans", "Packages"));
        add("hotel_travel", "Hotel / Travel Agency",
                List.of("catalog_items", "services", "team_members"),
                Map.of("catalog_items", "Rooms & Packages", "services", "Amenities"));
        add("landing", "Landing Page",
                List.of("services", "pricing_plans"),
                Map.of("services", "Features", "pricing_plans", "Pricing"));
        add("photography", "Photography / Wedding",
                List.of("projects", "services", "pricing_plans"),
                Map.of("projects", "Portfolio", "pricing_plans", "Packages"));
        add("ngo", "NGO / Charity",
                List.of("services", "projects", "team_members"),
                Map.of("services", "Our Causes", "projects", "Campaigns", "team_members", "Team"));
        add("interior", "Interior Design",
                List.of("projects", "services", "team_members"),
                Map.of("projects", "Projects", "team_members", "Designers"));
        add("construction", "Construction / Builder",
                List.of("projects", "services", "team_members"),
                Map.of("projects", "Projects", "team_members", "Team"));
        add("news", "News / Magazine Portal",
                List.of("news_categories", "news_posts", "sponsors", "team_members", "livestreams", "video_categories",
                        "magazine_categories", "magazines", "magazine_thumbnails"),
                Map.ofEntries(Map.entry("team_members", "Reporters"), Map.entry("blogs", "Opinion & Columns"),
                        Map.entry("gallery_categories", "Photo Albums"), Map.entry("image_gallery", "Photo Gallery"),
                        Map.entry("livestreams", "Live TV"), Map.entry("magazines", "E-Paper"),
                        Map.entry("magazine_categories", "E-Paper Editions"), Map.entry("magazine_thumbnails", "E-Paper Pages")));
        add("ecommerce", "Online Store / E-commerce",
                List.of("product_categories", "products", "product_variants", "coupons"),
                Map.of("blogs", "Blog", "testimonials", "Customer Reviews"));
    }

    private SiteTypeCatalog() {
    }

    private static void add(String key, String label, List<String> extra, Map<String, String> labels) {
        List<String> modules = new ArrayList<>(COMMON);
        modules.addAll(extra);
        TYPES.put(key, new SiteType(key, label, List.copyOf(modules), labels));
    }

    public static List<SiteType> all() {
        return List.copyOf(TYPES.values());
    }

    public static List<String> keys() {
        return List.copyOf(TYPES.keySet());
    }

    public static boolean isValid(String key) {
        return key != null && TYPES.containsKey(key);
    }

    /** Unknown / null => school (purani websites school thi) */
    public static SiteType get(String key) {
        return TYPES.getOrDefault(key, TYPES.get(DEFAULT));
    }
}
