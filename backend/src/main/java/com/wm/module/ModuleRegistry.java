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
    public static final String NEWSROOM = "Newsroom";
    public static final String STORE = "Store";
    public static final String INBOX = "Inbox";

    /** Website ke contact form se aaye message ka haal */
    public static final String[] ENQUIRY_STATUS = {"New", "Read", "Replied", "Spam"};

    /** Product par GST % (India) */
    public static final String[] GST_RATES = {"0", "5", "12", "18", "28"};
    public static final String COUPON_PERCENT = "Percent";
    public static final String COUPON_FLAT = "Flat";

    /** News category label ke rang (frontend site/sections/newsroom.tsx me same naam -> hex) */
    public static final String[] CATEGORY_COLORS = {"red", "orange", "amber", "green", "teal", "blue", "indigo", "violet", "pink", "slate"};

    /** Advertisement kahan dikhe */
    public static final String[] AD_POSITIONS = {"Header", "Home Page", "Sidebar", "In Article"};

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

        // ---------- Newsroom (News / Magazine portal) ----------
        add(ModuleDef.of("news_categories", "News Categories", NEWSROOM, "layers").publishable().sortable()
                .field(text("title", "Category Name").required().listed().searchable())
                .field(text("slug", "Slug (URL)").required().unique().listed().help("e.g. sports — website par /category/sports"))
                .field(select("color", "Label Colour", CATEGORY_COLORS).listed())
                .field(bool("show_on_home", "Show block on home page").listed())
                .field(textarea("description", "Description")));
        add(ModuleDef.of("news_posts", "News Posts", NEWSROOM, "newspaper").publishable()
                .field(text("title", "Headline").required().listed().searchable())
                .field(text("slug", "Slug (URL)").required().unique().help("e.g. india-wins-series — website par /news/<slug>"))
                .field(ref("category_id", "Category", "news_categories").required().listed())
                .field(ref("reporter_id", "Reporter", "team_members").listed())
                .field(date("published_date", "Published Date").required().listed())
                .field(image("cover_image", "Cover Photo").listed())
                .field(text("image_caption", "Photo Caption"))
                .field(text("location", "Dateline / Location").help("e.g. New Delhi"))
                .field(textarea("summary", "Summary").help("2-3 lines — lists, share aur Google me dikhta hai"))
                .field(richtext("body", "Full Story"))
                .field(text("tags", "Tags").searchable().help("Comma separated, e.g. cricket, world cup"))
                .field(url("video_url", "Video URL").help("YouTube link (optional) — story ke upar video"))
                .field(bool("is_breaking", "Breaking News").listed().help("Website ke upar laal ticker me chalega"))
                .field(bool("is_featured", "Top Story").listed().help("Home page ki badi headline"))
                .field(bool("is_trending", "Trending").listed()));
        // key "sponsors": "ads" naam ad-blockers block kar dete hain
        add(ModuleDef.of("sponsors", "Advertisements", NEWSROOM, "megaphone").publishable().sortable()
                .field(text("title", "Advertiser").required().listed().searchable())
                .field(select("position", "Position", AD_POSITIONS).required().listed()
                        .help("Header 728×90 · Home Page / In Article 970×250 · Sidebar 300×250"))
                .field(image("image", "Banner Image").required().listed())
                .field(text("headline", "Banner Text").help("Optional — banner par likha dikhe (image me text na ho to)"))
                .field(url("link_url", "Click URL"))
                .field(date("from_date", "Show From").listed().help("Khaali = abhi se"))
                .field(date("to_date", "Show Till").listed().help("Khaali = hamesha")));

        // ---------- Store (Online shop) — orders / customers / payments apne tables me (service/store) ----------
        add(ModuleDef.of("product_categories", "Product Categories", STORE, "folder-tree").publishable().sortable()
                .field(text("title", "Category Name").required().listed().searchable())
                .field(text("slug", "Slug (URL)").required().unique().listed().help("e.g. men-shirts — website par /shop/category/men-shirts"))
                .field(ref("parent_id", "Parent Category", "product_categories").listed().help("Khaali = main category"))
                .field(image("image", "Image").listed())
                .field(bool("show_on_home", "Show on home page").listed())
                .field(textarea("description", "Description")));
        add(ModuleDef.of("products", "Products", STORE, "shopping-bag").publishable().sortable()
                .field(text("title", "Product Name").required().listed().searchable())
                .field(text("slug", "Slug (URL)").required().unique().help("e.g. cotton-polo-tshirt — website par /product/<slug>"))
                .field(ref("category_id", "Category", "product_categories").required().listed())
                .field(text("brand", "Brand").searchable())
                .field(text("sku", "SKU").searchable())
                .field(decimal("price", "Selling Price (₹)").required().min(0).listed())
                .field(decimal("compare_price", "MRP (₹)").min(0).help("Price se zyada ho to website par ~~MRP~~ aur % OFF dikhega"))
                .field(select("gst_rate", "GST %", GST_RATES).required())
                .field(number("stock", "Stock").min(0).listed().help("Khaali = unlimited. Variants ho to har variant ka apna stock"))
                .field(image("cover_image", "Main Image").required().listed())
                .field(image("image_2", "Image 2"))
                .field(image("image_3", "Image 3"))
                .field(image("image_4", "Image 4"))
                .field(textarea("summary", "Short Description"))
                .field(richtext("description", "Full Description"))
                .field(text("option1_name", "Option 1 Name").help("Variants ke liye, e.g. Size"))
                .field(text("option2_name", "Option 2 Name").help("e.g. Colour"))
                .field(bool("is_featured", "Featured").listed())
                .field(text("tags", "Tags").searchable().help("Comma separated"))
                .validator(ModuleRegistry::validateProduct));
        add(ModuleDef.of("product_variants", "Product Variants", STORE, "boxes").publishable().sortable()
                .field(ref("product_id", "Product", "products").required().listed())
                .field(text("title", "Variant Name").required().listed().searchable().help("e.g. M / Black"))
                .field(text("option1", "Option 1 Value").listed().help("e.g. M"))
                .field(text("option2", "Option 2 Value").listed().help("e.g. Black"))
                .field(text("sku", "SKU").searchable())
                .field(decimal("price", "Price (₹)").min(0).listed().help("Khaali = product ka price"))
                .field(decimal("compare_price", "MRP (₹)").min(0))
                .field(number("stock", "Stock").min(0).listed().help("Khaali = unlimited"))
                .field(image("image", "Image").help("Is variant ki photo (optional)"))
                .validator(ModuleRegistry::validateProduct));
        add(ModuleDef.of("coupons", "Coupons", STORE, "ticket-percent").publishable().internal()
                .titleField("code")
                .field(text("code", "Coupon Code").required().unique().listed().searchable().help("e.g. WELCOME10 — customer yahi type karega"))
                .field(select("discount_type", "Discount Type", COUPON_PERCENT, COUPON_FLAT).required().listed())
                .field(decimal("value", "Discount Value").required().min(0).listed().help("Percent: 10 = 10% · Flat: ₹ amount"))
                .field(decimal("min_order", "Minimum Order (₹)").min(0))
                .field(decimal("max_discount", "Max Discount (₹)").min(0).help("Percent coupon par discount ki upper limit"))
                .field(date("starts_on", "Valid From").listed())
                .field(date("expires_on", "Valid Till").listed())
                .field(number("usage_limit", "Total Uses Allowed").min(1).help("Khaali = unlimited"))
                .field(number("per_customer_limit", "Uses per Customer").min(1).help("Khaali = unlimited"))
                .field(textarea("description", "Note"))
                .validator(ModuleRegistry::validateCoupon));

        // ---------- Inbox (website ke contact form / newsletter se — public sirf bhej sakta hai, dekh nahi sakta) ----------
        add(ModuleDef.of("enquiries", "Enquiries", INBOX, "mail").internal()
                .titleField("name")
                .field(text("name", "Name").required().listed().searchable())
                .field(text("email", "Email").listed().searchable())
                .field(text("phone", "Phone").listed().searchable())
                .field(text("subject", "Subject").listed().searchable())
                .field(textarea("message", "Message").required())
                .field(text("page", "Sent From Page").help("Website ka kaunsa page"))
                .field(select("status", "Status", ENQUIRY_STATUS).required().listed()));
        add(ModuleDef.of("subscribers", "Newsletter Subscribers", INBOX, "at-sign").internal()
                .titleField("email")
                .field(text("email", "Email").required().unique().listed().searchable())
                .field(text("source", "Signed Up From").listed().help("e.g. Footer")));

        validateRefs();
    }

    /** MRP price se kam nahi ho sakta */
    static void validateProduct(Map<String, Object> v) {
        java.math.BigDecimal price = decimalOf(v.get("price"));
        java.math.BigDecimal mrp = decimalOf(v.get("compare_price"));
        if (price != null && mrp != null && mrp.compareTo(price) < 0) throw ApiException.badRequest("MRP cannot be less than the selling price");
    }

    static void validateCoupon(Map<String, Object> v) {
        String code = String.valueOf(v.get("code"));
        if (!code.matches("[A-Za-z0-9_-]{3,30}")) throw ApiException.badRequest("Coupon Code: 3-30 letters / numbers, no spaces");
        java.math.BigDecimal value = decimalOf(v.get("value"));
        if (value == null || value.signum() <= 0) throw ApiException.badRequest("Discount Value must be more than 0");
        if (COUPON_PERCENT.equals(v.get("discount_type")) && value.compareTo(java.math.BigDecimal.valueOf(100)) > 0) {
            throw ApiException.badRequest("Percent discount cannot be more than 100");
        }
        java.time.LocalDate from = com.wm.common.DataTypeUtility.dateValue(v.get("starts_on"));
        java.time.LocalDate till = com.wm.common.DataTypeUtility.dateValue(v.get("expires_on"));
        if (from != null && till != null && till.isBefore(from)) throw ApiException.badRequest("Valid Till cannot be before Valid From");
    }

    private static java.math.BigDecimal decimalOf(Object o) {
        if (o == null || String.valueOf(o).isBlank()) return null;
        return o instanceof java.math.BigDecimal d ? d : new java.math.BigDecimal(String.valueOf(o));
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
    private static FieldDef.Builder decimal(String n, String l) { return FieldDef.of(n, l, DECIMAL); }
    private static FieldDef.Builder date(String n, String l) { return FieldDef.of(n, l, DATE); }
    private static FieldDef.Builder month(String n, String l) { return FieldDef.of(n, l, MONTH); }
    private static FieldDef.Builder bool(String n, String l) { return FieldDef.of(n, l, BOOLEAN); }
    private static FieldDef.Builder select(String n, String l, String... options) { return FieldDef.of(n, l, SELECT).options(options); }
    private static FieldDef.Builder ref(String n, String l, String module) { return FieldDef.of(n, l, REF).ref(module); }
}
