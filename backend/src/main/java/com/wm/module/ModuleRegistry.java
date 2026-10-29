package com.wm.module;

import com.wm.common.ApiException;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static com.wm.module.FieldType.*;

/**
 * Saare website modules (reference: tsm WebsiteManagementMVCController).
 * Naya module = yahan ek entry. Table, API, admin list/form sab isi se bante hain.
 */
@Component
public class ModuleRegistry {
    public static final String SETUP = "Setup";
    public static final String CONTENT = "Content";
    public static final String MEDIA = "Gallery & Media";
    public static final String ACHIEVEMENTS = "Achievements";
    public static final String BUSINESS = "Business";

    /** Services / Stats ke icon (frontend site icon map me same naam) */
    public static final String[] ICONS = {
            "Star", "Heart", "Shield", "Zap", "Award", "Users", "Clock", "Phone", "MapPin", "Leaf", "Coffee", "Utensils",
            "Dumbbell", "Home", "Building2", "Stethoscope", "HeartPulse", "GraduationCap", "BookOpen", "Briefcase",
            "TrendingUp", "Megaphone", "Camera", "Palette", "Hammer", "HardHat", "Plane", "Hotel", "Globe", "Sparkles",
            "Target", "Rocket", "Code", "PenTool", "Smile", "Baby", "Bed", "Wifi", "Car", "Music", "Trophy", "Lightbulb",
            "HandHeart", "Sofa", "Ruler", "Truck", "Package", "CheckCircle"
    };

    private final Map<String, ModuleDef> modules = new LinkedHashMap<>();

    public ModuleRegistry() {
        // ---------- Setup (master lists) ----------
        add(ModuleDef.of("gallery_categories", "Gallery Categories", SETUP, "folder-open").publishable().sortable()
                .field(text("title", "Name").required().listed().searchable())
                .field(date("event_date", "Event Date").listed())
                .field(image("cover_image", "Cover Image").listed())
                .field(textarea("description", "Description")));
        add(simpleName("award_categories", "Award Categories", "tag"));
        add(simpleName("video_categories", "Video Categories", "tags"));
        add(simpleName("magazine_categories", "Magazine Categories", "bookmark"));

        // ---------- Content ----------
        add(ModuleDef.of("menus", "Menus", CONTENT, "menu").publishable().sortable()
                .field(text("title", "Menu Name").required().listed().searchable())
                .field(ref("parent_id", "Parent Menu", "menus").listed().help("Khaali = main menu"))
                .field(text("custom_url", "Custom URL").listed().help("Page link ke liye khaali chhodein, ya /about, https://..."))
                .field(bool("open_new_tab", "Open in new tab")));
        add(ModuleDef.of("pages", "Pages", CONTENT, "file-text").publishable()
                .field(text("title", "Page Title").required().listed().searchable())
                .field(text("slug", "Slug (URL)").required().unique().listed().searchable().help("e.g. about-us"))
                .field(text("page_heading", "Page Heading"))
                .field(ref("menu_id", "Menu", "menus").listed())
                .field(image("banner_image", "Banner Image"))
                .field(richtext("page_body", "Page Content"))
                .field(text("meta_keywords", "Meta Keywords"))
                .field(textarea("meta_description", "Meta Description")));
        add(ModuleDef.of("sliders", "Home Sliders", CONTENT, "images").publishable().sortable()
                .field(text("title", "Title").required().listed().searchable())
                .field(image("image", "Slider Image").required().listed())
                .field(url("link_url", "Link URL"))
                .field(textarea("description", "Description")));
        add(ModuleDef.of("popups", "Popups", CONTENT, "message-square").publishable()
                .field(text("title", "Title").required().listed().searchable())
                .field(date("from_date", "From Date").listed())
                .field(date("to_date", "To Date").listed())
                .field(image("image", "Image").listed())
                .field(file("attachment", "Attachment"))
                .field(richtext("description", "Description")));
        add(ModuleDef.of("thoughts", "Thought of the Day", CONTENT, "lightbulb").publishable()
                .field(text("title", "Title").required().listed().searchable())
                .field(date("thought_date", "Date").listed())
                .field(textarea("description", "Thought").required()));
        add(ModuleDef.of("testimonials", "Testimonials", CONTENT, "quote").publishable().sortable()
                .field(text("title", "Title").required().listed().searchable())
                .field(text("parent_name", "Name").listed().searchable())
                .field(text("child_name", "Designation / Info").listed().help("e.g. Parent of Riya (Class 5), CEO at Acme"))
                .field(date("testimonial_date", "Date"))
                .field(image("photo", "Photo"))
                .field(textarea("description", "Testimonial").required()));
        add(ModuleDef.of("press_releases", "Press Releases", CONTENT, "newspaper").publishable()
                .field(text("title", "Heading").required().listed().searchable())
                .field(date("release_date", "Release Date").listed())
                .field(image("image", "Image").listed())
                .field(file("attachment", "Attachment"))
                .field(richtext("description", "Description")));
        add(ModuleDef.of("blogs", "Blogs", CONTENT, "pen-square").publishable()
                .field(text("title", "Title").required().listed().searchable())
                .field(text("slug", "Slug (URL)").required().unique().listed().help("e.g. annual-day-2026"))
                .field(text("author", "Author").listed().searchable())
                .field(date("published_date", "Published Date").listed())
                .field(image("cover_image", "Cover Image"))
                .field(text("tags", "Tags").help("Comma separated"))
                .field(textarea("summary", "Summary"))
                .field(richtext("body", "Content")));
        add(ModuleDef.of("tenders", "Tenders", CONTENT, "file-signature").publishable()
                .field(text("title", "Title").required().listed().searchable())
                .field(text("tender_no", "Tender No").listed().searchable())
                .field(date("start_date", "Start Date").listed())
                .field(date("end_date", "Last Date").listed())
                .field(file("attachment", "Attachment"))
                .field(richtext("description", "Description")));
        add(ModuleDef.of("livestreams", "Live Streams", CONTENT, "radio").publishable()
                .field(text("title", "Title").required().listed().searchable())
                .field(url("event_url", "Event URL").required().listed())
                .field(date("event_date", "Event Date").listed()));
        add(ModuleDef.of("attachments", "Downloads", CONTENT, "paperclip").publishable().sortable()
                .field(text("title", "Title").required().listed().searchable())
                .field(file("attachment", "File").required().listed())
                .field(textarea("description", "Description")));

        // ---------- Gallery & Media ----------
        add(ModuleDef.of("image_gallery", "Image Gallery", MEDIA, "image").publishable().sortable()
                .field(text("title", "Title").required().listed().searchable())
                .field(ref("category_id", "Category", "gallery_categories").required().listed())
                .field(image("image", "Image").required().listed())
                .field(date("event_date", "Date").listed())
                .field(textarea("description", "Description")));
        add(ModuleDef.of("videos", "Video Gallery", MEDIA, "video").publishable().sortable()
                .field(text("title", "Title").required().listed().searchable())
                .field(ref("category_id", "Category", "video_categories").listed())
                .field(url("video_url", "Video URL").required().listed().help("YouTube / Vimeo link"))
                .field(date("video_date", "Date").listed()));
        add(ModuleDef.of("magazines", "E-Magazines", MEDIA, "book-open").publishable()
                .field(text("title", "Title").required().listed().searchable())
                .field(ref("category_id", "Category", "magazine_categories").listed())
                .field(number("year", "Year").listed())
                .field(month("month", "Month").listed())
                .field(number("page_no", "Page No"))
                .field(image("cover_image", "Cover"))
                .field(file("file", "Magazine File (PDF)").required()));
        add(ModuleDef.of("magazine_thumbnails", "Magazine Thumbnails", MEDIA, "layout-grid").publishable()
                .field(text("title", "Title").required().listed().searchable())
                .field(number("year", "Year").listed())
                .field(month("month", "Month").listed())
                .field(image("thumbnail", "Thumbnail").required().listed()));

        // ---------- Achievements ----------
        add(ModuleDef.of("awards", "Awards", ACHIEVEMENTS, "award").publishable().sortable()
                .field(text("title", "Title").required().listed().searchable())
                .field(ref("category_id", "Category", "award_categories").listed())
                .field(date("award_date", "Date").listed())
                .field(image("image", "Image").listed())
                .field(file("attachment", "Attachment"))
                .field(richtext("description", "Description")));
        add(ModuleDef.of("achievements", "Achievements", ACHIEVEMENTS, "trophy").publishable().sortable()
                .field(text("title", "Title").required().listed().searchable())
                .field(date("achievement_date", "Date").listed())
                .field(image("image", "Image").listed())
                .field(file("attachment", "Attachment"))
                .field(richtext("description", "Description")));
        add(ModuleDef.of("activities", "Activities", ACHIEVEMENTS, "activity").publishable()
                .field(text("title", "Title").required().listed().searchable())
                .field(date("activity_date", "Date").listed())
                .field(image("image", "Image"))
                .field(file("attachment", "Attachment"))
                .field(richtext("description", "Description")));

        // ---------- Business (har website type me alag naam se: Services = Courses / Programs / Departments ...) ----------
        add(ModuleDef.of("services", "Services", BUSINESS, "sparkles").publishable().sortable()
                .field(text("title", "Title").required().listed().searchable())
                .field(select("icon", "Icon", ICONS).listed())
                .field(image("image", "Image").listed())
                .field(text("price", "Price / Duration").help("e.g. ₹999, 6 months"))
                .field(textarea("summary", "Short Description"))
                .field(richtext("description", "Details")));
        add(ModuleDef.of("team_members", "Team", BUSINESS, "users").publishable().sortable()
                .field(text("title", "Name").required().listed().searchable())
                .field(text("designation", "Designation").listed().searchable())
                .field(image("photo", "Photo").listed())
                .field(textarea("bio", "Bio"))
                .field(text("email", "Email"))
                .field(text("phone", "Phone"))
                .field(url("social_url", "Profile Link")));
        add(ModuleDef.of("projects", "Projects", BUSINESS, "briefcase").publishable().sortable()
                .field(text("title", "Title").required().listed().searchable())
                .field(text("category", "Category").listed().searchable())
                .field(text("client", "Client"))
                .field(text("location", "Location"))
                .field(image("cover_image", "Cover Image").required().listed())
                .field(date("project_date", "Date").listed())
                .field(textarea("summary", "Short Description"))
                .field(richtext("description", "Details"))
                .field(url("link_url", "Link")));
        add(ModuleDef.of("catalog_items", "Catalog", BUSINESS, "package").publishable().sortable()
                .field(text("title", "Title").required().listed().searchable())
                .field(text("category", "Category").listed().searchable())
                .field(text("price", "Price").listed())
                .field(text("old_price", "Old Price"))
                .field(image("image", "Image").listed())
                .field(text("badge", "Badge").help("e.g. New, Best Seller, For Sale"))
                .field(text("location", "Location"))
                .field(text("specs", "Specs").help("e.g. 3 Beds · 2 Baths · 1,800 sqft"))
                .field(textarea("summary", "Short Description"))
                .field(richtext("description", "Details"))
                .field(url("link_url", "Link")));
        add(ModuleDef.of("pricing_plans", "Pricing Plans", BUSINESS, "tag").publishable().sortable()
                .field(text("title", "Plan Name").required().listed().searchable())
                .field(text("price", "Price").required().listed())
                .field(text("period", "Period").listed().help("e.g. /month, /year, one time"))
                .field(text("badge", "Badge").help("e.g. Most Popular"))
                .field(bool("highlighted", "Highlight this plan").listed())
                .field(textarea("features", "Features").help("Ek line = ek feature"))
                .field(text("button_text", "Button Text"))
                .field(url("button_link", "Button Link")));
        add(ModuleDef.of("faqs", "FAQs", CONTENT, "help-circle").publishable().sortable()
                .field(text("title", "Question").required().listed().searchable())
                .field(textarea("answer", "Answer").required()));
        add(ModuleDef.of("stats", "Counters / Stats", CONTENT, "bar-chart").publishable().sortable()
                .field(text("title", "Label").required().listed().searchable())
                .field(text("value", "Value").required().listed().help("e.g. 500+, 25 Years, 4.9★"))
                .field(select("icon", "Icon", ICONS).listed()));
        add(ModuleDef.of("partners", "Clients / Partners", CONTENT, "handshake").publishable().sortable()
                .field(text("title", "Name").required().listed().searchable())
                .field(image("logo", "Logo").listed())
                .field(url("link_url", "Website")));

        validateRefs();
    }

    public List<ModuleDef> all() {
        return List.copyOf(modules.values());
    }

    public ModuleDef get(String key) {
        ModuleDef m = modules.get(key);
        if (m == null) throw ApiException.notFound("Unknown module: " + key);
        return m;
    }

    private void add(ModuleDef.Builder b) {
        ModuleDef m = b.build();
        modules.put(m.key(), m);
    }

    private void validateRefs() {
        for (ModuleDef m : modules.values()) {
            for (FieldDef f : m.fields()) {
                if (f.type() == REF && !modules.containsKey(f.ref())) {
                    throw new IllegalStateException(m.key() + "." + f.name() + " refers unknown module " + f.ref());
                }
            }
            if (m.field(m.titleField()).isEmpty()) {
                throw new IllegalStateException(m.key() + " has no title field " + m.titleField());
            }
        }
    }

    private static ModuleDef.Builder simpleName(String key, String label, String icon) {
        return ModuleDef.of(key, label, SETUP, icon).sortable()
                .field(text("title", "Name").required().listed().searchable());
    }

    private static FieldDef.Builder text(String n, String l) { return FieldDef.of(n, l, TEXT); }
    private static FieldDef.Builder textarea(String n, String l) { return FieldDef.of(n, l, TEXTAREA); }
    private static FieldDef.Builder richtext(String n, String l) { return FieldDef.of(n, l, RICHTEXT); }
    private static FieldDef.Builder url(String n, String l) { return FieldDef.of(n, l, URL); }
    private static FieldDef.Builder image(String n, String l) { return FieldDef.of(n, l, IMAGE); }
    private static FieldDef.Builder file(String n, String l) { return FieldDef.of(n, l, FILE); }
    private static FieldDef.Builder number(String n, String l) { return FieldDef.of(n, l, NUMBER); }
    private static FieldDef.Builder date(String n, String l) { return FieldDef.of(n, l, DATE); }
    private static FieldDef.Builder month(String n, String l) { return FieldDef.of(n, l, MONTH); }
    private static FieldDef.Builder bool(String n, String l) { return FieldDef.of(n, l, BOOLEAN); }
    private static FieldDef.Builder select(String n, String l, String... options) { return FieldDef.of(n, l, SELECT).options(options); }
    private static FieldDef.Builder ref(String n, String l, String module) { return FieldDef.of(n, l, REF).ref(module); }
}
