import { describe, expect, it } from "vitest";
import siteTypeCatalogJava from "../../../backend/src/main/java/com/wm/settings/SiteTypeCatalog.java?raw";
import { EXPLORE_PAGES, MODULE_HOME } from "./coverage";
import { homeSections, parseSection, TEMPLATES } from "./templates";

/** Backend SiteTypeCatalog se: type -> admin menu modules (COMMON + extra) */
function backendModules(): Record<string, string[]> {
  const common = [...siteTypeCatalogJava.match(/COMMON = List\.of\(([\s\S]*?)\);/)![1].matchAll(/"([a-z_]+)"/g)].map((m) => m[1]);
  const out: Record<string, string[]> = {};
  for (const m of siteTypeCatalogJava.matchAll(/add\("([a-z_]+)", "[^"]+",\s*List\.of\(([\s\S]*?)\),/g)) {
    out[m[1]] = [...common, ...[...m[2].matchAll(/"([a-z_]+)"/g)].map((x) => x[1])];
  }
  return out;
}

describe("har admin menu ka data public website par dikhta hai", () => {
  const modules = backendModules();

  it("backend ke saare modules ka public jagah define hai", () => {
    const all = new Set(Object.values(modules).flat());
    all.forEach((m) => expect(MODULE_HOME[m], m).toBeDefined());
  });

  it.each(TEMPLATES.map((t) => [t.key, t] as const))("%s: koi bhi menu bekaar nahi", (_, t) => {
    const sections = new Set(homeSections(t).map((s) => parseSection(s)[0]));
    const pages = new Set(EXPLORE_PAGES.map((p) => p.section));
    const missing: string[] = [];
    for (const m of modules[t.type]) {
      const home = MODULE_HOME[m];
      const visible = home === "global" || sections.has(home) || pages.has(home);
      if (!visible) missing.push(`${m} (${home})`);
    }
    expect(missing, `${t.key} me ye menus kahin nahi dikhte`).toEqual([]);
  });
});
