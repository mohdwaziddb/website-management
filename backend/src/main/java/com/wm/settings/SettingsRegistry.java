package com.wm.settings;

import com.wm.module.FieldDef;
import com.wm.module.FieldType;

import java.util.List;

/** Website ki general info (reference: websiteSchoolInfo). Key-value me save hoti hai. */
public final class SettingsRegistry {
    public static final List<FieldDef> FIELDS = List.of(
            f("site_name", "Website Name", FieldType.TEXT),
            f("tagline", "Tagline", FieldType.TEXT),
            FieldDef.of("site_type", "Website Type", FieldType.SELECT)
                    .options(SiteTypeCatalog.keys().toArray(String[]::new))
                    .help("Admin panel ke menus aur templates isi se").build(),
            f("cta_text", "Main Button Text", FieldType.TEXT),
            f("cta_link", "Main Button Link", FieldType.URL),
            f("opening_hours", "Opening Hours", FieldType.TEXTAREA),
            f("logo", "Logo", FieldType.IMAGE),
            f("favicon", "Favicon", FieldType.IMAGE),
            f("email", "Email", FieldType.TEXT),
            f("phone", "Phone", FieldType.TEXT),
            f("whatsapp", "WhatsApp", FieldType.TEXT),
            f("address", "Address", FieldType.TEXTAREA),
            f("map_embed_url", "Google Map Embed URL", FieldType.URL),
            f("affiliation_no", "Affiliation No", FieldType.TEXT),
            f("facebook", "Facebook URL", FieldType.URL),
            f("instagram", "Instagram URL", FieldType.URL),
            f("youtube", "YouTube URL", FieldType.URL),
            f("twitter", "X / Twitter URL", FieldType.URL),
            f("linkedin", "LinkedIn URL", FieldType.URL),
            f("primary_color", "Theme Color", FieldType.TEXT),
            f("footer_text", "Footer Text", FieldType.TEXTAREA),
            // SEO + Google (Google search / WhatsApp-Facebook share preview)
            FieldDef.of("seo_title", "Search Title (SEO)", FieldType.TEXT).help("Google me dikhne wala title — khaali = Website Name").build(),
            FieldDef.of("seo_description", "Search Description (SEO)", FieldType.TEXTAREA).help("150-160 characters — Google aur share preview me").build(),
            FieldDef.of("share_image", "Share Image", FieldType.IMAGE).help("WhatsApp / Facebook par link share karne par dikhne wali photo (1200×630)").build(),
            FieldDef.of("google_analytics_id", "Google Analytics ID", FieldType.TEXT).help("e.g. G-AB12CD34EF").build(),
            FieldDef.of("google_site_verification", "Google Search Console Code", FieldType.TEXT).help("Search Console → HTML tag ka content=\"…\" wala code").build(),
            f("about_short", "About (short)", FieldType.RICHTEXT),
            FieldDef.of("template", "Website Template", FieldType.SELECT)
                    .options(TemplateCatalog.KEYS.toArray(String[]::new))
                    .help("Templates page se preview dekh kar badlein").build()
    );

    private SettingsRegistry() {
    }

    private static FieldDef f(String name, String label, FieldType type) {
        return FieldDef.of(name, label, type).build();
    }

    public static boolean isKnown(String key) {
        return FIELDS.stream().anyMatch(f -> f.name().equals(key));
    }
}
