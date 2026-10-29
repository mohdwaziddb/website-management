import type { SiteTypeKey } from "../siteTypes";

/** Home page ka ek section + uska style, e.g. "services:icons", "catalog:menu", "contact" */
export type SectionSpec = string;

export type HeroVariant = "carousel" | "split" | "minimal" | "fullscreen" | "elegant" | "typewriter" | "collage" | "centered" | "kenburns" | "magazine";
export type NavVariant = "solid" | "light" | "centered" | "floating" | "classic" | "dark";
export type HeadingStyle = "underline" | "center" | "eyebrow" | "serif" | "badge";

export interface TemplateColors {
  primary: string;
  accent: string;
  bg: string;
  surface: string;
  text: string;
  muted: string;
  heroText: string;
  /** primary / accent rang ke upar text (yellow button par kaala text) */
  onPrimary: string;
  onAccent: string;
}

export interface TemplateConfig {
  key: string;
  name: string;
  type: SiteTypeKey;
  description: string;
  dark: boolean;
  colors: TemplateColors;
  fonts: { heading: string; body: string };
  nav: NavVariant;
  hero: HeroVariant;
  /** Har card par lagne wali Tailwind classes */
  card: string;
  radius: string;
  heading: HeadingStyle;
  /** Buttons ka shape */
  button: "rounded-full" | "rounded-lg" | "rounded-none";
  sections: SectionSpec[];
}

/** "services:icons" -> ["services", "icons"] */
export function parseSection(spec: SectionSpec): [string, string | undefined] {
  const [key, variant] = spec.split(":");
  return [key, variant];
}
