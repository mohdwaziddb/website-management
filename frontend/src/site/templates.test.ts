import { describe, expect, it } from "vitest";
import type { Row } from "../lib/types";
import { buildMenuTree, demoList } from "./data";
import { SECTIONS } from "./sections";
import { getSiteType, sectionTitle, SITE_TYPES } from "./siteTypes";
import { getTemplate, isHexColor, parseSection, TEMPLATES, templatesFor } from "./templates";
import { googleFontsUrl, isKnownFont } from "./templates/fonts";
// backend ki Java files text ki tarah (Vite ?raw) — keys sync check
import templateCatalogJava from "../../../backend/src/main/java/com/wm/settings/TemplateCatalog.java?raw";
import siteTypeCatalogJava from "../../../backend/src/main/java/com/wm/settings/SiteTypeCatalog.java?raw";

/** Har section ke valid styles — template config me typo yahin pakda jaata hai */
const VARIANTS: Record<string, (string | undefined)[]> = {
  about: [undefined, "image"],
  news: [undefined, "list"],
  gallery: [undefined, "strip"],
  testimonials: [undefined, "grid", "marquee"],
  services: [undefined, "cards", "icons", "list", "alternating"],
  catalog: [undefined, "cards", "menu", "listing"],
  projects: [undefined, "grid", "masonry", "showcase"],
  team: [undefined, "cards", "circles", "overlay"],
  pricing: [undefined, "cards", "bold"],
  stats: [undefined, "band", "cards", "inline"],
  faq: [undefined, "accordion", "two-col"],
  partners: [undefined, "marquee", "grid"],
  cta: [undefined, "band", "split"],
  latest: [undefined, "grid", "list"],
  categories: [undefined, "blocks", "columns"],
  trending: [undefined, "numbered", "cards"],
  products: [undefined, "grid", "carousel"],
  shop_categories: [undefined, "tiles", "circles"]
};

describe("templates", () => {
  it("backend TemplateCatalog ke saath same keys aur types", () => {
    const backend: Record<string, string> = {};
    for (const m of templateCatalogJava.matchAll(/add\("([a-z_]+)", ((?:"[a-z]+",?\s*)+)\)/g)) {
      for (const k of m[2].match(/"([a-z]+)"/g)!) backend[k.replace(/"/g, "")] = m[1];
    }
    const frontend = Object.fromEntries(TEMPLATES.map((t) => [t.key, t.type]));
    expect(frontend).toEqual(backend);
    expect(TEMPLATES).toHaveLength(53);
  });

  it("backend SiteTypeCatalog ke saath same website types", () => {
    const backend = [...siteTypeCatalogJava.matchAll(/add\("([a-z_]+)", "/g)].map((m) => m[1]);
    expect(SITE_TYPES.map((t) => t.key)).toEqual(backend);
  });

  it.each(TEMPLATES.map((t) => [t.key, t] as const))("%s valid hai", (_, t) => {
    expect(parseSection(t.sections[0])[0]).toBe("hero");
    expect(new Set(t.sections.map((s) => parseSection(s)[0])).size).toBe(t.sections.length);
    for (const spec of t.sections) {
      const [key, variant] = parseSection(spec);
      expect(SECTIONS[key], spec).toBeDefined();
      if (variant !== undefined) expect(VARIANTS[key], spec).toContain(variant);
    }
    Object.values(t.colors).forEach((c) => expect(isHexColor(c), c).toBe(true));
    expect(isKnownFont(t.fonts.heading), t.fonts.heading).toBe(true);
    expect(isKnownFont(t.fonts.body), t.fonts.body).toBe(true);
    expect(t.name.length).toBeGreaterThan(2);
  });

  it("har type ke kam se kam 3 alag-alag templates", () => {
    for (const type of SITE_TYPES) {
      const list = templatesFor(type.key);
      expect(list.length, type.key).toBeGreaterThanOrEqual(3);
      // ek hi type ke templates me hero + palette repeat na ho
      expect(new Set(list.map((t) => t.hero)).size, type.key + " heroes").toBe(list.length);
      expect(new Set(list.map((t) => t.colors.primary + t.colors.accent)).size).toBe(list.length);
    }
    expect(new Set(TEMPLATES.map((t) => t.name)).size).toBe(TEMPLATES.length);
  });

  it("unknown key => classic; hex check", () => {
    expect(getTemplate("hacker").key).toBe("classic");
    expect(getTemplate(null).key).toBe("classic");
    expect(getTemplate("noir").type).toBe("restaurant");
    expect(isHexColor("#1d4ed8")).toBe(true);
    expect(isHexColor("#1d4ed8;background:url(x)")).toBe(false);
  });

  it("google fonts url", () => {
    expect(googleFontsUrl(["Oswald", "Inter", "Inter"])).toBe(
      "https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&display=swap"
    );
    expect(googleFontsUrl(["Comic Sans"])).toBeNull();
  });
});

describe("site types", () => {
  it("type ke hisaab se titles aur nav", () => {
    expect(sectionTitle("restaurant", "catalog")[0]).toBe("Our Menu");
    expect(sectionTitle("gym", "pricing")[0]).toBe("Membership Plans");
    expect(sectionTitle("landing", "about")[0]).toBe("About Us");
    expect(getSiteType("real_estate").nav.map((n) => n.href)).toContain("/catalog");
    expect(getSiteType("casino").key).toBe("school");
  });
});

describe("buildMenuTree", () => {
  const menus = [
    { id: 1, title: "Home", custom_url: "/" },
    { id: 2, title: "About" },
    { id: 3, title: "Our Team", parent_id: 2 },
    { id: 4, title: "Portal", custom_url: "https://erp.example.com" },
    { id: 5, title: "Empty" }
  ] as Row[];
  const pages = [
    { id: 10, slug: "about-us", menu_id: 2 },
    { id: 11, slug: "team", menu_id: 3 }
  ] as Row[];

  it("custom url, phir menu ka page, warna khaali (link nahi)", () => {
    const tree = buildMenuTree(menus, pages);
    expect(tree.map((m) => m.title)).toEqual(["Home", "About", "Portal", "Empty"]);
    expect(tree[1].href).toBe("/page/about-us");
    expect(tree[1].children[0]).toMatchObject({ title: "Our Team", href: "/page/team" });
    expect(tree[2]).toMatchObject({ href: "https://erp.example.com", external: true });
    expect(tree[3].href).toBe("");
  });
});

describe("demoList", () => {
  const demo = { type: "x", settings: {}, modules: { image_gallery: [1, 2, 3, 4].map((i) => ({ id: -i, title: "p" + i, category_id: i % 2 ? -10 : -11 }) as Row) } };
  it("filter + size API jaisa", () => {
    expect(demoList(demo, "image_gallery", { size: 2 })).toHaveLength(2);
    expect(demoList(demo, "image_gallery", { category_id: -10, size: 10 }).map((r) => r.title)).toEqual(["p1", "p3"]);
    expect(demoList(null, "image_gallery")).toEqual([]);
    expect(demoList(demo, "unknown")).toEqual([]);
  });
});
