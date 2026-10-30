package com.wm.settings;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Custom template me admin kya-kya chun sakta hai (validation ke liye).
 * Frontend me same list: frontend/src/site/templates/options.ts (sync test wahan hai).
 */
public final class TemplateOptions {

    public static final List<String> NAV = List.of("solid", "light", "centered", "floating", "classic", "dark");
    public static final List<String> HERO = List.of("carousel", "split", "minimal", "fullscreen", "elegant", "typewriter", "collage", "centered", "kenburns", "magazine", "headlines", "spotlight", "mosaic");
    public static final List<String> HEADING = List.of("underline", "center", "eyebrow", "serif", "badge");
    public static final List<String> BUTTON = List.of("rounded-full", "rounded-lg", "rounded-none");
    public static final List<String> RADIUS = List.of("none", "small", "medium", "large");
    public static final List<String> CARD = List.of("border", "shadow", "glow", "flat");
    public static final List<String> COLORS = List.of("primary", "accent", "bg", "surface", "text", "muted", "heroText", "onPrimary", "onAccent");
    public static final List<String> FONTS = List.of("Inter", "Poppins", "Montserrat", "Raleway", "Outfit", "Manrope", "DM Sans", "Nunito", "Josefin Sans",
            "Space Grotesk", "Syne", "Oswald", "Bebas Neue", "Archivo Black", "Baloo 2", "Merriweather", "Lora", "Playfair Display", "Cormorant Garamond");

    /** Home page section -> uske styles (khaali = ek hi style) */
    public static final Map<String, List<String>> SECTIONS = new LinkedHashMap<>();

    static {
        SECTIONS.put("hero", List.of());
        SECTIONS.put("about", List.of("image"));
        SECTIONS.put("services", List.of("cards", "icons", "list", "alternating"));
        SECTIONS.put("catalog", List.of("cards", "menu", "listing"));
        SECTIONS.put("projects", List.of("grid", "masonry", "showcase"));
        SECTIONS.put("team", List.of("cards", "circles", "overlay"));
        SECTIONS.put("pricing", List.of("cards", "bold"));
        SECTIONS.put("stats", List.of("band", "cards", "inline"));
        SECTIONS.put("testimonials", List.of("grid", "marquee"));
        SECTIONS.put("gallery", List.of("strip"));
        SECTIONS.put("news", List.of("list"));
        SECTIONS.put("faq", List.of("accordion", "two-col"));
        SECTIONS.put("partners", List.of("marquee", "grid"));
        SECTIONS.put("cta", List.of("band", "split"));
        SECTIONS.put("videos", List.of());
        SECTIONS.put("achievements", List.of());
        SECTIONS.put("thought", List.of());
        SECTIONS.put("notices", List.of());
        SECTIONS.put("downloads", List.of());
        SECTIONS.put("contact", List.of());
        SECTIONS.put("latest", List.of("grid", "list"));
        SECTIONS.put("categories", List.of("blocks", "columns"));
        SECTIONS.put("trending", List.of("numbered", "cards"));
        SECTIONS.put("photos", List.of());
        SECTIONS.put("ad", List.of());
        SECTIONS.put("products", List.of("grid", "carousel"));
        SECTIONS.put("shop_categories", List.of("tiles", "circles"));
        SECTIONS.put("perks", List.of());
    }

    private TemplateOptions() {
    }
}
