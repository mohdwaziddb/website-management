// 47 templates (15 website types). Har template sirf config hai — sections (src/site/sections) sab me common,
// config rang, font, navbar, hero, card ka look aur sections ka order/style badalta hai.
// Backend me same keys: com.wm.settings.TemplateCatalog
import type { SiteTypeKey } from "../siteTypes";
import type { HeadingStyle, HeroVariant, NavVariant, SectionSpec, TemplateColors, TemplateConfig } from "./types";

export type { TemplateConfig, SectionSpec, HeroVariant, NavVariant } from "./types";
export { parseSection } from "./types";
import { parseSection } from "./types";

interface Def {
  key: string;
  name: string;
  description: string;
  dark?: boolean;
  colors: Partial<TemplateColors> & { primary: string; accent: string };
  fonts: [string, string];
  nav: NavVariant;
  hero: HeroVariant;
  card?: string;
  radius?: string;
  heading?: HeadingStyle;
  button?: TemplateConfig["button"];
  sections: SectionSpec[];
}

const LIGHT = { bg: "#ffffff", surface: "#ffffff", text: "#0f172a", muted: "#64748b" };
const DARK = { bg: "#0a0a0a", surface: "#141414", text: "#f5f5f5", muted: "#a3a3a3" };

function group(type: SiteTypeKey, defs: Def[]): TemplateConfig[] {
  return defs.map((d) => ({
    key: d.key,
    name: d.name,
    type,
    description: d.description,
    dark: !!d.dark,
    colors: { ...(d.dark ? DARK : LIGHT), heroText: "#ffffff", onPrimary: "#ffffff", onAccent: "#ffffff", ...d.colors },
    fonts: { heading: d.fonts[0], body: d.fonts[1] },
    nav: d.nav,
    hero: d.hero,
    card: d.card ?? (d.dark ? "ring-1 ring-white/10" : "border border-slate-200 shadow-sm"),
    radius: d.radius ?? "rounded-2xl",
    heading: d.heading ?? "center",
    button: d.button ?? "rounded-full",
    sections: d.sections
  }));
}

export const TEMPLATES: TemplateConfig[] = [
  // ------------------------------------------------------------ School (purane 5)
  ...group("school", [
    {
      key: "classic", name: "Classic School", description: "Traditional navy & gold — trusted, formal look with a big image slider.",
      colors: { primary: "#1e3a8a", accent: "#f59e0b", bg: "#f8fafc", onAccent: "#1c1917" }, fonts: ["Merriweather", "Inter"], nav: "classic", hero: "carousel",
      radius: "rounded-lg", heading: "underline",
      sections: ["hero", "thought", "about", "stats:band", "services:icons", "achievements", "news", "gallery", "team:cards", "testimonials", "notices", "downloads", "contact"]
    },
    {
      key: "modern", name: "Modern Gradient", description: "Bold gradients, glassy cards and smooth motion — feels fresh and techy.",
      colors: { primary: "#6d28d9", accent: "#06b6d4", bg: "#faf5ff", text: "#1e1b4b", muted: "#6b7280" }, fonts: ["Poppins", "Inter"], nav: "floating", hero: "split",
      card: "shadow-lg shadow-violet-200/50 ring-1 ring-violet-100", radius: "rounded-3xl", heading: "eyebrow",
      sections: ["hero", "stats:cards", "about", "services:cards", "achievements", "gallery", "news", "testimonials:marquee", "videos", "thought", "notices", "downloads", "contact"]
    },
    {
      key: "minimal", name: "Clean Minimal", description: "Lots of white space, black & white type — content first, zero clutter.",
      colors: { primary: "#111827", accent: "#10b981", heroText: "#111827" }, fonts: ["Inter", "Inter"], nav: "light", hero: "minimal",
      card: "border border-gray-200", radius: "rounded-md", button: "rounded-lg",
      sections: ["hero", "about", "news:list", "gallery", "achievements", "services:list", "notices", "downloads", "testimonials:grid", "contact"]
    },
    {
      key: "vibrant", name: "Vibrant Kids", description: "Playful colours and rounded shapes — perfect for play schools & primary.",
      colors: { primary: "#ea580c", accent: "#16a34a", bg: "#fff7ed", text: "#1c1917", muted: "#78716c" }, fonts: ["Baloo 2", "Nunito"], nav: "solid", hero: "fullscreen",
      card: "shadow-md ring-2 ring-orange-100", radius: "rounded-[1.75rem]", heading: "badge",
      sections: ["hero", "thought", "stats:band", "gallery", "services:cards", "achievements", "videos", "about", "team:circles", "testimonials", "news", "notices", "downloads", "contact"]
    },
    {
      key: "elegant", name: "Elegant Heritage", description: "Deep green with serif headings — premium, heritage institution feel.",
      colors: { primary: "#14532d", accent: "#b45309", bg: "#fbfaf7", text: "#1f2937", muted: "#6b7280" }, fonts: ["Playfair Display", "Lora"], nav: "centered", hero: "elegant",
      card: "border border-stone-200 shadow-sm", radius: "rounded-none", heading: "serif", button: "rounded-none",
      sections: ["hero", "about:image", "thought", "achievements", "news", "gallery", "team:overlay", "testimonials:grid", "videos", "notices", "downloads", "contact"]
    }
  ]),

  // ------------------------------------------------------------ Coaching
  ...group("coaching", [
    {
      key: "achiever", name: "Achiever", description: "Bold red & navy with results front and centre — built to convert admissions.",
      colors: { primary: "#1e293b", accent: "#dc2626", bg: "#f8fafc" }, fonts: ["Poppins", "Inter"], nav: "classic", hero: "carousel", heading: "underline", radius: "rounded-xl",
      sections: ["hero", "stats:band", "services:cards", "achievements", "pricing:cards", "team:cards", "testimonials", "faq", "cta:band", "news", "contact"]
    },
    {
      key: "focus", name: "Focus", description: "Calm teal, clean grid and lots of breathing room — premium and academic.",
      colors: { primary: "#0f766e", accent: "#f59e0b", bg: "#f0fdfa", onAccent: "#1c1917" }, fonts: ["DM Sans", "DM Sans"], nav: "light", hero: "collage", heading: "eyebrow",
      sections: ["hero", "services:list", "stats:inline", "team:circles", "pricing:bold", "testimonials:grid", "faq:two-col", "contact"]
    },
    {
      key: "toppers", name: "Toppers", description: "Electric purple-pink gradients and typing hero — feels young and energetic.",
      colors: { primary: "#7c3aed", accent: "#ec4899", bg: "#faf5ff" }, fonts: ["Outfit", "Outfit"], nav: "floating", hero: "typewriter", radius: "rounded-3xl", heading: "badge",
      card: "shadow-xl shadow-purple-200/60", sections: ["hero", "partners:marquee", "services:icons", "achievements", "stats:cards", "testimonials:marquee", "pricing:cards", "cta:split", "faq", "contact"]
    }
  ]),

  // ------------------------------------------------------------ Portfolio
  ...group("portfolio", [
    {
      key: "mono", name: "Mono", description: "Black & white editorial with huge type — lets your work speak.",
      colors: { primary: "#111111", accent: "#ef4444", heroText: "#111111" }, fonts: ["Syne", "Inter"], nav: "light", hero: "magazine", radius: "rounded-none", button: "rounded-none",
      card: "border border-black/10", heading: "eyebrow", sections: ["hero", "projects:showcase", "services:list", "stats:inline", "testimonials:grid", "cta:band", "contact"]
    },
    {
      key: "neon", name: "Neon Dev", description: "Dark mode with neon green glow — perfect for developers and creators.",
      dark: true, colors: { primary: "#22c55e", accent: "#a855f7", onPrimary: "#052e16" }, fonts: ["Space Grotesk", "Space Grotesk"], nav: "dark", hero: "typewriter", radius: "rounded-xl",
      heading: "eyebrow", sections: ["hero", "services:icons", "projects:grid", "stats:band", "testimonials:marquee", "faq", "contact"]
    },
    {
      key: "canvas", name: "Canvas", description: "Pastel peach and violet with playful collage — for designers & artists.",
      colors: { primary: "#f97316", accent: "#8b5cf6", bg: "#fff7ed" }, fonts: ["Outfit", "DM Sans"], nav: "floating", hero: "collage", radius: "rounded-3xl", heading: "badge",
      sections: ["hero", "projects:masonry", "services:cards", "testimonials", "partners:grid", "contact"]
    }
  ]),

  // ------------------------------------------------------------ Business
  ...group("business", [
    {
      key: "corporate", name: "Corporate", description: "Professional blue, structured layout — trustworthy for any company.",
      colors: { primary: "#1d4ed8", accent: "#0ea5e9", bg: "#f8fafc" }, fonts: ["Montserrat", "Inter"], nav: "classic", hero: "carousel", heading: "underline", radius: "rounded-lg", button: "rounded-lg",
      sections: ["hero", "about:image", "services:cards", "stats:band", "projects:grid", "team:cards", "testimonials", "partners:marquee", "faq", "cta:band", "news", "contact"]
    },
    {
      key: "summit", name: "Summit", description: "Dark navy with gold highlights and cinematic hero — premium enterprise.",
      dark: true, colors: { primary: "#f59e0b", accent: "#38bdf8", bg: "#0b1120", surface: "#111a2e", text: "#e2e8f0", muted: "#94a3b8", onPrimary: "#111827" },
      fonts: ["Manrope", "Manrope"], nav: "dark", hero: "kenburns", heading: "eyebrow", radius: "rounded-xl",
      sections: ["hero", "services:alternating", "stats:inline", "projects:showcase", "team:overlay", "testimonials:grid", "partners:grid", "cta:split", "contact"]
    },
    {
      key: "fresh", name: "Fresh", description: "Friendly green and rounded cards — great for startups and SMEs.",
      colors: { primary: "#16a34a", accent: "#f59e0b", bg: "#f7fee7", onAccent: "#1c1917" }, fonts: ["Outfit", "Outfit"], nav: "floating", hero: "split", radius: "rounded-3xl", heading: "badge",
      sections: ["hero", "services:icons", "catalog:cards", "stats:cards", "projects:grid", "testimonials:marquee", "faq:two-col", "contact"]
    }
  ]),

  // ------------------------------------------------------------ Restaurant
  ...group("restaurant", [
    {
      key: "saffron", name: "Saffron", description: "Warm maroon & saffron with a classic menu card — Indian fine dining feel.",
      colors: { primary: "#7f1d1d", accent: "#f59e0b", bg: "#fffbeb", text: "#292524", muted: "#78716c", onAccent: "#1c1917" }, fonts: ["Playfair Display", "DM Sans"], nav: "centered", hero: "kenburns",
      heading: "serif", radius: "rounded-xl",
      sections: ["hero", "about:image", "catalog:menu", "services:cards", "gallery:strip", "team:circles", "testimonials", "stats:band", "cta:band", "contact"]
    },
    {
      key: "bistro", name: "Bistro", description: "Cream paper, forest green and elegant serif — a cosy European cafe.",
      colors: { primary: "#14532d", accent: "#d97706", bg: "#fdf8f1", text: "#1c1917", muted: "#78716c" }, fonts: ["Cormorant Garamond", "Raleway"], nav: "light", hero: "collage",
      heading: "serif", radius: "rounded-none", button: "rounded-none", card: "border border-stone-300",
      sections: ["hero", "about", "catalog:menu", "gallery", "testimonials:grid", "faq", "contact"]
    },
    {
      key: "noir", name: "Noir", description: "Moody black & gold, full-screen food photography — luxury dining.",
      dark: true, colors: { primary: "#d4a373", accent: "#b91c1c", bg: "#0c0a09", surface: "#1c1917", text: "#f5f5f4", muted: "#a8a29e", onPrimary: "#1c1917" },
      fonts: ["Cormorant Garamond", "Josefin Sans"], nav: "dark", hero: "fullscreen", heading: "serif", radius: "rounded-none", button: "rounded-none",
      sections: ["hero", "catalog:cards", "about:image", "gallery:strip", "team:overlay", "testimonials:marquee", "cta:split", "contact"]
    }
  ]),

  // ------------------------------------------------------------ Gym
  ...group("gym", [
    {
      key: "iron", name: "Iron", description: "Aggressive black & red with condensed type — hardcore strength gym.",
      dark: true, colors: { primary: "#dc2626", accent: "#f97316" }, fonts: ["Oswald", "Inter"], nav: "dark", hero: "centered", heading: "eyebrow", radius: "rounded-none", button: "rounded-none",
      sections: ["hero", "services:cards", "stats:band", "pricing:bold", "team:overlay", "gallery:strip", "testimonials", "cta:band", "contact"]
    },
    {
      key: "pulse", name: "Pulse", description: "Midnight blue with lime neon and typing hero — modern HIIT studio.",
      dark: true, colors: { primary: "#a3e635", accent: "#22d3ee", bg: "#050816", surface: "#0d1326", onPrimary: "#1a2e05", onAccent: "#083344" },
      fonts: ["Bebas Neue", "Inter"], nav: "floating", hero: "typewriter", heading: "eyebrow", radius: "rounded-2xl",
      sections: ["hero", "services:icons", "pricing:cards", "stats:inline", "team:cards", "testimonials:marquee", "faq", "contact"]
    },
    {
      key: "zenfit", name: "Zen Fit", description: "Soft sage and earthy tones — yoga, pilates and wellness studios.",
      colors: { primary: "#4d7c0f", accent: "#d97706", bg: "#f6f7f2", text: "#1a2e05", muted: "#6b7280" }, fonts: ["Josefin Sans", "Nunito"], nav: "light", hero: "split",
      radius: "rounded-3xl", heading: "center",
      sections: ["hero", "services:alternating", "team:circles", "pricing:cards", "testimonials:grid", "gallery", "faq:two-col", "contact"]
    }
  ]),

  // ------------------------------------------------------------ Real estate
  ...group("real_estate", [
    {
      key: "prime", name: "Prime Estates", description: "Navy & gold luxury with property listings and slow-zoom hero.",
      colors: { primary: "#0b1f3a", accent: "#c9a227", bg: "#fafaf7", onAccent: "#0b1f3a" }, fonts: ["Playfair Display", "Montserrat"], nav: "centered", hero: "kenburns", heading: "serif",
      radius: "rounded-md", button: "rounded-none",
      sections: ["hero", "catalog:listing", "services:icons", "stats:band", "projects:showcase", "team:cards", "testimonials", "partners:marquee", "contact"]
    },
    {
      key: "urban", name: "Urban", description: "Charcoal and orange with bold blocky type — modern city apartments.",
      colors: { primary: "#18181b", accent: "#ea580c", heroText: "#18181b" }, fonts: ["Archivo Black", "Inter"], nav: "light", hero: "magazine", heading: "eyebrow", radius: "rounded-none",
      button: "rounded-none", card: "border border-zinc-200",
      sections: ["hero", "catalog:cards", "services:list", "stats:inline", "team:overlay", "faq", "cta:band", "contact"]
    },
    {
      key: "haven", name: "Haven", description: "Fresh teal and coral, friendly and family focused.",
      colors: { primary: "#0f766e", accent: "#fb7185", bg: "#f0fdfa" }, fonts: ["Outfit", "Nunito"], nav: "floating", hero: "split", radius: "rounded-3xl", heading: "badge",
      sections: ["hero", "catalog:cards", "services:cards", "testimonials:marquee", "team:circles", "faq:two-col", "contact"]
    }
  ]),

  // ------------------------------------------------------------ Hospital
  ...group("hospital", [
    {
      key: "care", name: "Care Plus", description: "Clinical blue & teal, clear departments and doctor profiles.",
      colors: { primary: "#0369a1", accent: "#14b8a6", bg: "#f8fafc", onAccent: "#042f2e" }, fonts: ["Poppins", "Inter"], nav: "classic", hero: "carousel", heading: "underline", radius: "rounded-xl",
      sections: ["hero", "services:icons", "stats:band", "team:cards", "pricing:cards", "testimonials", "faq", "news", "contact"]
    },
    {
      key: "vital", name: "Vital", description: "Healthy green with photo collage — modern multispeciality clinic.",
      colors: { primary: "#047857", accent: "#0ea5e9", bg: "#f0fdf4" }, fonts: ["Manrope", "Manrope"], nav: "light", hero: "collage", heading: "eyebrow",
      sections: ["hero", "services:cards", "team:circles", "stats:cards", "pricing:bold", "testimonials:grid", "faq:two-col", "cta:band", "contact"]
    },
    {
      key: "wellness", name: "Wellness", description: "Soft lavender and pink — dental, skin and wellness clinics.",
      colors: { primary: "#7c3aed", accent: "#f472b6", bg: "#faf5ff" }, fonts: ["Outfit", "Nunito"], nav: "floating", hero: "centered", radius: "rounded-3xl", heading: "badge",
      sections: ["hero", "services:alternating", "team:overlay", "pricing:cards", "testimonials:marquee", "faq", "contact"]
    }
  ]),

  // ------------------------------------------------------------ Agency
  ...group("agency", [
    {
      key: "growth", name: "Growth", description: "Dark canvas with violet-pink glow and typing hero — performance agency.",
      dark: true, colors: { primary: "#8b5cf6", accent: "#ec4899", bg: "#0b0b1a", surface: "#14142b" }, fonts: ["Syne", "Inter"], nav: "dark", hero: "typewriter", heading: "eyebrow",
      sections: ["hero", "partners:marquee", "services:icons", "projects:grid", "stats:band", "pricing:cards", "testimonials:marquee", "team:overlay", "cta:split", "contact"]
    },
    {
      key: "pixel", name: "Pixel Pop", description: "Neo-brutalist yellow & black with chunky shadows — bold creative studio.",
      colors: { primary: "#111827", accent: "#facc15", bg: "#fffbeb", heroText: "#111827", onAccent: "#111827" }, fonts: ["Archivo Black", "Space Grotesk"], nav: "light", hero: "magazine",
      card: "border-2 border-black shadow-[6px_6px_0_#000]", radius: "rounded-none", button: "rounded-none", heading: "badge",
      sections: ["hero", "services:list", "projects:masonry", "stats:inline", "pricing:bold", "testimonials:grid", "faq:two-col", "contact"]
    },
    {
      key: "orbit", name: "Orbit", description: "Clean tech blue and cyan with floating nav — SaaS-style agency.",
      colors: { primary: "#2563eb", accent: "#06b6d4", bg: "#f8fafc", onAccent: "#082f49" }, fonts: ["Space Grotesk", "Inter"], nav: "floating", hero: "split", heading: "eyebrow",
      sections: ["hero", "services:cards", "projects:showcase", "team:cards", "pricing:cards", "stats:cards", "partners:grid", "testimonials", "faq", "contact"]
    }
  ]),

  // ------------------------------------------------------------ Hotel / travel
  ...group("hotel_travel", [
    {
      key: "paradise", name: "Paradise", description: "Turquoise lagoon colours and full-screen slides — beach resorts.",
      colors: { primary: "#0891b2", accent: "#f59e0b", bg: "#f0fdfa", onAccent: "#1c1917" }, fonts: ["Playfair Display", "Poppins"], nav: "centered", hero: "fullscreen", heading: "serif",
      sections: ["hero", "catalog:cards", "services:icons", "gallery:strip", "testimonials", "stats:band", "faq", "contact"]
    },
    {
      key: "voyage", name: "Voyage", description: "Sunset orange and sky blue with photo collage — travel agencies.",
      colors: { primary: "#ea580c", accent: "#0ea5e9", bg: "#fff7ed" }, fonts: ["Montserrat", "Montserrat"], nav: "floating", hero: "collage", heading: "badge", radius: "rounded-3xl",
      sections: ["hero", "catalog:listing", "services:cards", "stats:inline", "gallery", "testimonials:marquee", "cta:band", "contact"]
    },
    {
      key: "grand", name: "Grand", description: "Black & gold five-star elegance with serif type — luxury hotels.",
      dark: true, colors: { primary: "#d4af37", accent: "#a16207", bg: "#0c0a09", surface: "#1c1917", onPrimary: "#1c1917" }, fonts: ["Cormorant Garamond", "Raleway"], nav: "dark", hero: "elegant",
      heading: "serif", radius: "rounded-none", button: "rounded-none",
      sections: ["hero", "about:image", "catalog:listing", "services:alternating", "gallery:strip", "testimonials:grid", "cta:split", "contact"]
    }
  ]),

  // ------------------------------------------------------------ Landing
  ...group("landing", [
    {
      key: "launch", name: "Launch", description: "Indigo SaaS landing with product shot, features and pricing.",
      colors: { primary: "#4f46e5", accent: "#06b6d4", onAccent: "#082f49" }, fonts: ["Outfit", "Inter"], nav: "floating", hero: "split", heading: "eyebrow",
      sections: ["hero", "partners:marquee", "services:icons", "stats:band", "pricing:cards", "testimonials:grid", "faq", "cta:band"]
    },
    {
      key: "spark", name: "Spark", description: "Dark with rose-amber glow and typing headline — apps & launches.",
      dark: true, colors: { primary: "#f43f5e", accent: "#f59e0b", bg: "#09090b", surface: "#18181b" }, fonts: ["Space Grotesk", "Inter"], nav: "dark", hero: "typewriter", heading: "eyebrow",
      sections: ["hero", "services:cards", "stats:inline", "testimonials:marquee", "pricing:bold", "faq:two-col", "cta:split"]
    },
    {
      key: "clean", name: "Clean", description: "Minimal white with emerald accents — simple single-page product.",
      colors: { primary: "#059669", accent: "#6366f1", heroText: "#0f172a" }, fonts: ["Manrope", "Manrope"], nav: "light", hero: "minimal", radius: "rounded-xl", button: "rounded-lg",
      sections: ["hero", "services:list", "partners:grid", "pricing:cards", "testimonials", "faq", "cta:band"]
    }
  ]),

  // ------------------------------------------------------------ Photography
  ...group("photography", [
    {
      key: "lens", name: "Lens", description: "Pure dark gallery with full-bleed photos — photographers' showcase.",
      dark: true, colors: { primary: "#fafafa", accent: "#eab308", onPrimary: "#0a0a0a", onAccent: "#0a0a0a" }, fonts: ["Josefin Sans", "Inter"], nav: "dark", hero: "fullscreen",
      heading: "center", radius: "rounded-none", button: "rounded-none",
      sections: ["hero", "projects:masonry", "services:list", "pricing:bold", "testimonials:marquee", "contact"]
    },
    {
      key: "vows", name: "Vows", description: "Blush-to-gold gradient, framed photos and romantic serif — wedding stories.",
      colors: { primary: "#be185d", accent: "#d4a373", bg: "#fdf2f8", text: "#3f0d24", muted: "#9d6b84" }, fonts: ["Cormorant Garamond", "Raleway"], nav: "floating", hero: "split",
      heading: "serif", radius: "rounded-none", button: "rounded-full",
      sections: ["hero", "projects:grid", "services:alternating", "pricing:cards", "testimonials", "gallery", "faq", "contact"]
    },
    {
      key: "frame", name: "Frame", description: "White editorial magazine layout — fashion & portrait studios.",
      colors: { primary: "#1c1917", accent: "#b45309", bg: "#fafaf9", heroText: "#1c1917" }, fonts: ["Playfair Display", "Inter"], nav: "light", hero: "magazine", heading: "serif",
      radius: "rounded-none", button: "rounded-none", card: "border border-stone-200",
      sections: ["hero", "projects:showcase", "gallery:strip", "services:cards", "testimonials:grid", "contact"]
    }
  ]),

  // ------------------------------------------------------------ NGO
  ...group("ngo", [
    {
      key: "hope", name: "Hope", description: "Warm orange and green, impact numbers up front — charities.",
      colors: { primary: "#ea580c", accent: "#16a34a", bg: "#fffbeb" }, fonts: ["Poppins", "Nunito"], nav: "classic", hero: "carousel", heading: "underline",
      sections: ["hero", "stats:band", "services:cards", "projects:grid", "testimonials", "team:circles", "cta:band", "partners:marquee", "contact"]
    },
    {
      key: "earth", name: "Earth", description: "Leafy green and mustard with serif headings — environment & rural NGOs.",
      colors: { primary: "#166534", accent: "#ca8a04", bg: "#f7fee7" }, fonts: ["Lora", "Nunito"], nav: "light", hero: "split", heading: "serif",
      sections: ["hero", "services:alternating", "stats:cards", "projects:showcase", "testimonials:grid", "faq", "cta:split", "contact"]
    },
    {
      key: "unity", name: "Unity", description: "Trustworthy blue with rose highlights — foundations & trusts.",
      colors: { primary: "#1d4ed8", accent: "#f43f5e", bg: "#f8fafc" }, fonts: ["Montserrat", "Inter"], nav: "floating", hero: "centered", heading: "eyebrow",
      sections: ["hero", "services:icons", "stats:inline", "projects:masonry", "team:overlay", "testimonials:marquee", "faq:two-col", "contact"]
    }
  ]),

  // ------------------------------------------------------------ Interior
  ...group("interior", [
    {
      key: "loft", name: "Loft", description: "Warm beige, taupe and serif type — calm, high-end interiors.",
      colors: { primary: "#3f3a34", accent: "#b08968", bg: "#f5f0e8", heroText: "#3f3a34", text: "#2b2622", muted: "#7c7066" }, fonts: ["Cormorant Garamond", "DM Sans"], nav: "light",
      hero: "magazine", heading: "serif", radius: "rounded-none", button: "rounded-none", card: "border border-stone-300/70",
      sections: ["hero", "projects:masonry", "services:list", "stats:inline", "testimonials:grid", "team:circles", "contact"]
    },
    {
      key: "nordic", name: "Nordic", description: "Bright Scandinavian white with honey accents — minimal studios.",
      colors: { primary: "#1f2937", accent: "#d97706", heroText: "#1f2937" }, fonts: ["Josefin Sans", "Inter"], nav: "light", hero: "minimal", radius: "rounded-lg", button: "rounded-lg",
      sections: ["hero", "projects:grid", "services:icons", "gallery", "testimonials", "faq:two-col", "contact"]
    },
    {
      key: "luxe", name: "Luxe", description: "Deep emerald with gold and slow fades — luxury design houses.",
      dark: true, colors: { primary: "#d4af37", accent: "#34d399", bg: "#06201c", surface: "#0b2c27", text: "#ecfdf5", muted: "#9ca3af", onPrimary: "#06201c", onAccent: "#06201c" },
      fonts: ["Playfair Display", "Raleway"], nav: "dark", hero: "elegant", heading: "serif", radius: "rounded-none", button: "rounded-none",
      sections: ["hero", "projects:showcase", "services:alternating", "gallery:strip", "testimonials:marquee", "cta:split", "contact"]
    }
  ]),

  // ------------------------------------------------------------ Construction
  ...group("construction", [
    {
      key: "builder", name: "Builder", description: "Hi-vis yellow and black, strong condensed type — contractors.",
      colors: { primary: "#111827", accent: "#facc15", bg: "#f9fafb", onAccent: "#111827" }, fonts: ["Oswald", "Inter"], nav: "solid", hero: "centered", heading: "underline",
      radius: "rounded-none", button: "rounded-none",
      sections: ["hero", "services:cards", "stats:band", "projects:grid", "team:cards", "testimonials", "partners:marquee", "cta:band", "contact"]
    },
    {
      key: "steel", name: "Steel", description: "Industrial navy and safety orange with zoom hero — infrastructure firms.",
      colors: { primary: "#1e3a5f", accent: "#f97316", bg: "#f8fafc" }, fonts: ["Montserrat", "Inter"], nav: "classic", hero: "kenburns", heading: "eyebrow", radius: "rounded-md",
      button: "rounded-lg", sections: ["hero", "services:alternating", "projects:showcase", "stats:inline", "team:overlay", "faq", "contact"]
    },
    {
      key: "skyline", name: "Skyline", description: "Cool slate and sky blue with collage hero — architecture & builders.",
      colors: { primary: "#334155", accent: "#0ea5e9", bg: "#f8fafc" }, fonts: ["Space Grotesk", "Inter"], nav: "floating", hero: "collage", heading: "eyebrow",
      sections: ["hero", "projects:masonry", "services:icons", "stats:cards", "testimonials:grid", "partners:grid", "cta:split", "contact"]
    }
  ]),

  // ------------------------------------------------------------ News / Magazine
  ...group("news", [
    {
      key: "herald", name: "Herald", description: "Classic newspaper front page — serif headlines, black & crimson, dense and trusted.",
      colors: { primary: "#111111", accent: "#c8102e", muted: "#525252", text: "#111111" }, fonts: ["Playfair Display", "Inter"], nav: "light", hero: "headlines",
      card: "border-b border-black/10", radius: "rounded-none", heading: "underline", button: "rounded-none",
      sections: ["hero", "ad", "latest:grid", "categories:blocks", "trending:numbered", "photos", "videos", "news:list"]
    },
    {
      key: "flash", name: "Flash 24×7", description: "Dark TV-news channel look — red & yellow, bold condensed type, trending first.",
      dark: true, colors: { primary: "#e11d48", accent: "#facc15", bg: "#0b0b0f", surface: "#16161d", onAccent: "#111111" }, fonts: ["Oswald", "Inter"], nav: "dark", hero: "spotlight",
      radius: "rounded-md", heading: "badge", button: "rounded-lg",
      sections: ["hero", "trending:cards", "latest:list", "ad", "categories:columns", "videos", "photos", "news"]
    },
    {
      key: "digest", name: "Digest", description: "Modern digital magazine — airy, colourful category columns and soft cards.",
      colors: { primary: "#1d4ed8", accent: "#f97316", bg: "#f8fafc" }, fonts: ["Manrope", "Inter"], nav: "solid", hero: "mosaic",
      card: "shadow-md shadow-slate-200/70 ring-1 ring-slate-100", radius: "rounded-2xl", heading: "eyebrow",
      sections: ["hero", "categories:columns", "trending:numbered", "ad", "latest:grid", "photos", "news", "videos"]
    }
  ]),

  // ------------------------------------------------------------ Online store
  ...group("ecommerce", [
    {
      key: "shopfront", name: "Shopfront", description: "Clean modern store — big split hero, round category icons and tabbed products.",
      colors: { primary: "#111827", accent: "#6366f1", bg: "#ffffff", surface: "#f8fafc" }, fonts: ["Manrope", "Inter"], nav: "light", hero: "split",
      card: "ring-1 ring-slate-200", radius: "rounded-2xl", heading: "center", button: "rounded-full",
      sections: ["hero", "shop_categories:circles", "products:grid", "perks", "testimonials:marquee", "partners:marquee", "news", "faq:two-col"]
    },
    {
      key: "boutique", name: "Boutique", description: "Fashion boutique — warm cream, serif headings, editorial tiles and scrolling products.",
      colors: { primary: "#1c1917", accent: "#b45309", bg: "#faf7f2", surface: "#f3ede4", text: "#1c1917", muted: "#78716c" }, fonts: ["Cormorant Garamond", "Josefin Sans"],
      nav: "centered", hero: "elegant", card: "", radius: "rounded-none", heading: "serif", button: "rounded-none",
      sections: ["hero", "shop_categories:tiles", "products:carousel", "about:image", "perks", "testimonials:grid", "news", "faq"]
    },
    {
      key: "megamart", name: "MegaMart", description: "Marketplace style — bold blue & orange, slider hero, deals grid and brand logos.",
      colors: { primary: "#1e40af", accent: "#f97316", bg: "#f1f5f9", surface: "#ffffff" }, fonts: ["Poppins", "Inter"], nav: "classic", hero: "carousel",
      card: "shadow-sm ring-1 ring-slate-200", radius: "rounded-lg", heading: "underline", button: "rounded-lg",
      sections: ["hero", "perks", "shop_categories:circles", "products:grid", "partners:grid", "stats:band", "testimonials", "faq:two-col"]
    }
  ])
];

export const DEFAULT_TEMPLATE = "classic";

/**
 * In modules ka apna page nahi hai — template me section na ho to admin ka data kahin na dikhta.
 * Isliye har template ke home par ye zaroor aate hain (Contact / CTA se pehle). Khaali ho to section khud chhup jata hai.
 */
const ALWAYS: Record<string, SectionSpec> = { testimonials: "testimonials", stats: "stats:inline", partners: "partners:marquee" };
const SCHOOL_ALWAYS: Record<string, SectionSpec> = { thought: "thought" };

export function homeSections(t: TemplateConfig): SectionSpec[] {
  const have = new Set(t.sections.map((s) => parseSection(s)[0]));
  const extra = Object.entries({ ...ALWAYS, ...(t.type === "school" ? SCHOOL_ALWAYS : {}) })
    .filter(([key]) => !have.has(key))
    .map(([, spec]) => spec);
  if (!extra.length) return t.sections;
  const tail = t.sections.findIndex((s) => ["cta", "contact"].includes(parseSection(s)[0]));
  const at = tail < 0 ? t.sections.length : tail;
  return [...t.sections.slice(0, at), ...extra, ...t.sections.slice(at)];
}

export function getTemplate(key: string | null | undefined): TemplateConfig {
  return TEMPLATES.find((t) => t.key === key) ?? TEMPLATES[0];
}

export function templatesFor(type: string): TemplateConfig[] {
  return TEMPLATES.filter((t) => t.type === type);
}

/** "#1d4ed8" jaisa valid hex hi theme color override kare */
export function isHexColor(v: unknown): v is string {
  return typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v);
}
