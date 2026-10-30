// Custom template builder: admin kya-kya chun sakta hai + config -> TemplateConfig.
// Backend me same values: com.wm.settings.TemplateOptions (options.test.ts sync check karta hai).
import { getTemplate } from "./index";
import type { HeadingStyle, HeroVariant, NavVariant, SectionSpec, TemplateColors, TemplateConfig } from "./types";
import { parseSection } from "./types";

export type Opt<T extends string = string> = { value: T; label: string };

export const NAV_OPTIONS: Opt<NavVariant>[] = [
  { value: "classic", label: "Classic — colour bar + top info strip" },
  { value: "solid", label: "Solid colour bar" },
  { value: "light", label: "Light / glass bar" },
  { value: "floating", label: "Floating rounded bar" },
  { value: "centered", label: "Centered, transparent over hero" },
  { value: "dark", label: "Dark glass bar" }
];

export const HERO_OPTIONS: Opt<HeroVariant>[] = [
  { value: "carousel", label: "Image slider" },
  { value: "kenburns", label: "Cinematic slow zoom" },
  { value: "fullscreen", label: "Full-screen slides" },
  { value: "elegant", label: "Elegant fade + serif" },
  { value: "centered", label: "Bold centred text" },
  { value: "split", label: "Gradient + photo card" },
  { value: "collage", label: "Photo collage" },
  { value: "typewriter", label: "Typing headline" },
  { value: "magazine", label: "Magazine / editorial" },
  { value: "minimal", label: "Minimal big text" },
  { value: "headlines", label: "News: top stories + latest" },
  { value: "spotlight", label: "News: rotating top story (TV)" },
  { value: "mosaic", label: "News: photo mosaic" }
];

export const HEADING_OPTIONS: Opt<HeadingStyle>[] = [
  { value: "center", label: "Centred" },
  { value: "underline", label: "Left + underline" },
  { value: "eyebrow", label: "Small label above" },
  { value: "badge", label: "Colour badge" },
  { value: "serif", label: "Italic + ornament" }
];

export const BUTTON_OPTIONS: Opt<TemplateConfig["button"]>[] = [
  { value: "rounded-full", label: "Pill" },
  { value: "rounded-lg", label: "Rounded" },
  { value: "rounded-none", label: "Square" }
];

/** Corners: key -> Tailwind class */
export const RADIUS_OPTIONS: (Opt & { cls: string })[] = [
  { value: "none", label: "Sharp", cls: "rounded-none" },
  { value: "small", label: "Small", cls: "rounded-md" },
  { value: "medium", label: "Medium", cls: "rounded-xl" },
  { value: "large", label: "Large", cls: "rounded-3xl" }
];

/** Card look: key -> Tailwind classes (template ke rang ke saath) */
export const CARD_OPTIONS: (Opt & { cls: string })[] = [
  { value: "border", label: "Thin border", cls: "border border-site-text/10 shadow-sm" },
  { value: "shadow", label: "Soft shadow", cls: "shadow-lg shadow-black/10" },
  { value: "glow", label: "Colour glow", cls: "shadow-xl shadow-site-primary/20 ring-1 ring-site-primary/15" },
  { value: "flat", label: "Flat", cls: "ring-1 ring-site-text/5" }
];

export const FONT_OPTIONS = [
  "Inter", "Poppins", "Montserrat", "Raleway", "Outfit", "Manrope", "DM Sans", "Nunito", "Josefin Sans",
  "Space Grotesk", "Syne", "Oswald", "Bebas Neue", "Archivo Black", "Baloo 2", "Merriweather", "Lora", "Playfair Display", "Cormorant Garamond"
];

export const COLOR_FIELDS: { key: keyof TemplateColors; label: string; help: string }[] = [
  { key: "primary", label: "Primary", help: "Navbar, headings, main buttons" },
  { key: "accent", label: "Accent", help: "Highlights, badges, second button" },
  { key: "bg", label: "Page background", help: "" },
  { key: "surface", label: "Cards", help: "Card / section background" },
  { key: "text", label: "Text", help: "" },
  { key: "muted", label: "Light text", help: "Descriptions, dates" },
  { key: "heroText", label: "Hero text", help: "Text on minimal / magazine hero" },
  { key: "onPrimary", label: "Text on primary", help: "Button text on primary" },
  { key: "onAccent", label: "Text on accent", help: "Button text on accent" }
];

/** Home page sections: label + styles (pehla style = default). Hero hamesha pehla. */
export const SECTION_OPTIONS: Record<string, { label: string; variants: Opt[] }> = {
  hero: { label: "Hero (top banner)", variants: [] },
  about: { label: "About", variants: [{ value: "", label: "Photos + text" }, { value: "image", label: "Big photo" }] },
  services: {
    label: "Services / Courses / Programs",
    variants: [
      { value: "cards", label: "Image cards" },
      { value: "icons", label: "Icon cards" },
      { value: "list", label: "Numbered list" },
      { value: "alternating", label: "Zig-zag" }
    ]
  },
  catalog: {
    label: "Menu / Properties / Rooms / Products",
    variants: [
      { value: "cards", label: "Cards with price" },
      { value: "menu", label: "Menu card (dotted prices)" },
      { value: "listing", label: "Listing rows" }
    ]
  },
  projects: {
    label: "Projects / Portfolio",
    variants: [
      { value: "grid", label: "Grid" },
      { value: "masonry", label: "Masonry" },
      { value: "showcase", label: "Big showcase" }
    ]
  },
  team: {
    label: "Team / Faculty / Doctors",
    variants: [
      { value: "cards", label: "Cards" },
      { value: "circles", label: "Round photos" },
      { value: "overlay", label: "Photo overlay" }
    ]
  },
  pricing: { label: "Pricing / Plans / Fees", variants: [{ value: "cards", label: "Cards" }, { value: "bold", label: "Bold boxes" }] },
  stats: {
    label: "Counters",
    variants: [
      { value: "band", label: "Colour band" },
      { value: "cards", label: "Cards" },
      { value: "inline", label: "Inline numbers" }
    ]
  },
  testimonials: {
    label: "Testimonials",
    variants: [
      { value: "", label: "Slider" },
      { value: "grid", label: "Grid" },
      { value: "marquee", label: "Scrolling" }
    ]
  },
  gallery: { label: "Gallery", variants: [{ value: "", label: "Mosaic" }, { value: "strip", label: "Scrolling strip" }] },
  news: { label: "News / Blog", variants: [{ value: "", label: "Cards" }, { value: "list", label: "List" }] },
  faq: { label: "FAQ", variants: [{ value: "accordion", label: "Accordion" }, { value: "two-col", label: "Two columns" }] },
  partners: { label: "Clients / Partners", variants: [{ value: "marquee", label: "Scrolling logos" }, { value: "grid", label: "Logo grid" }] },
  cta: { label: "Call to action", variants: [{ value: "band", label: "Colour band" }, { value: "split", label: "Card with photo" }] },
  videos: { label: "Videos & Live", variants: [] },
  achievements: { label: "Achievements / Awards", variants: [] },
  thought: { label: "Thought of the day", variants: [] },
  notices: { label: "Press & Tenders", variants: [] },
  downloads: { label: "Downloads", variants: [] },
  contact: { label: "Contact", variants: [] },
  latest: { label: "News: Latest stories", variants: [{ value: "grid", label: "Grid" }, { value: "list", label: "List with photos" }] },
  categories: { label: "News: Category blocks", variants: [{ value: "blocks", label: "Wide blocks" }, { value: "columns", label: "Columns" }] },
  trending: { label: "News: Trending", variants: [{ value: "numbered", label: "Numbered" }, { value: "cards", label: "Photo cards" }] },
  photos: { label: "News: Photo albums", variants: [] },
  ad: { label: "Advertisement (Home Page)", variants: [] },
  products: { label: "Store: Products (Featured / New)", variants: [{ value: "grid", label: "Grid" }, { value: "carousel", label: "Scrolling row" }] },
  shop_categories: { label: "Store: Shop by category", variants: [{ value: "tiles", label: "Photo tiles" }, { value: "circles", label: "Round icons" }] },
  perks: { label: "Store: Free shipping / COD strip", variants: [] }
};

/** Backend ko jaata hai / DB me save hota hai */
export interface CustomConfig {
  dark: boolean;
  colors: TemplateColors;
  fonts: { heading: string; body: string };
  nav: NavVariant;
  hero: HeroVariant;
  heading: HeadingStyle;
  button: TemplateConfig["button"];
  radius: string;
  card: string;
  sections: SectionSpec[];
}

export interface CustomTemplateRow {
  id: number;
  key: string;
  name: string;
  baseTemplate: string;
  type: string;
  config: CustomConfig;
  updatedOn?: string;
}

const RADIUS_BY_CLASS: Record<string, string> = { "rounded-none": "none", "rounded-md": "small", "rounded-lg": "small", "rounded-xl": "medium", "rounded-2xl": "medium" };

/** Built-in template se editor ka shuruaati config ("Customize") */
export function configFromTemplate(t: TemplateConfig): CustomConfig {
  const card = t.card.includes("ring-2") || t.card.includes("shadow-xl") ? "glow" : t.card.includes("shadow-lg") || t.card.includes("shadow-md") ? "shadow" : t.card.includes("border") ? "border" : "flat";
  return {
    dark: t.dark,
    colors: { ...t.colors },
    fonts: { ...t.fonts },
    nav: t.nav,
    hero: t.hero,
    heading: t.heading,
    button: t.button,
    radius: RADIUS_BY_CLASS[t.radius] ?? "large",
    card,
    sections: t.sections.filter((s) => parseSection(s)[0] in SECTION_OPTIONS)
  };
}

/** Saved custom template -> TemplateConfig (public site isi se render hoti hai) */
export function buildCustomTemplate(row: Pick<CustomTemplateRow, "key" | "name" | "baseTemplate" | "config">): TemplateConfig {
  const base = getTemplate(row.baseTemplate);
  const c = row.config;
  return {
    ...base,
    key: row.key,
    name: row.name,
    description: `Custom · based on ${base.name}`,
    dark: !!c.dark,
    colors: { ...base.colors, ...c.colors },
    fonts: { ...base.fonts, ...c.fonts },
    nav: c.nav ?? base.nav,
    hero: c.hero ?? base.hero,
    heading: c.heading ?? base.heading,
    button: c.button ?? base.button,
    radius: RADIUS_OPTIONS.find((r) => r.value === c.radius)?.cls ?? base.radius,
    card: CARD_OPTIONS.find((o) => o.value === c.card)?.cls ?? base.card,
    sections: c.sections?.length ? c.sections : base.sections
  };
}

export const isCustomKey = (key: unknown): key is string => typeof key === "string" && key.startsWith("custom-");
