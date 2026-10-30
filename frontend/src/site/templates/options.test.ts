import { describe, expect, it } from "vitest";
import optionsJava from "../../../../backend/src/main/java/com/wm/settings/TemplateOptions.java?raw";
import { TEMPLATES } from "./index";
import { isKnownFont } from "./fonts";
import {
  BUTTON_OPTIONS,
  buildCustomTemplate,
  CARD_OPTIONS,
  configFromTemplate,
  FONT_OPTIONS,
  HEADING_OPTIONS,
  HERO_OPTIONS,
  isCustomKey,
  NAV_OPTIONS,
  RADIUS_OPTIONS,
  SECTION_OPTIONS
} from "./options";

/** Java: public static final List<String> NAME = List.of("a", "b"); */
function javaList(name: string): string[] {
  const m = optionsJava.match(new RegExp(`${name} = List\\.of\\(([\\s\\S]*?)\\);`));
  return [...m![1].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
}

function javaSections(): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const m of optionsJava.matchAll(/SECTIONS\.put\("([a-z_]+)", List\.of\(([^)]*)\)\)/g)) out[m[1]] = [...m[2].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
  return out;
}

const values = (o: { value: string }[]) => o.map((x) => x.value).sort();

describe("custom template options = backend TemplateOptions", () => {
  it("lists match", () => {
    expect(values(NAV_OPTIONS)).toEqual(javaList("NAV").sort());
    expect(values(HERO_OPTIONS)).toEqual(javaList("HERO").sort());
    expect(values(HEADING_OPTIONS)).toEqual(javaList("HEADING").sort());
    expect(values(BUTTON_OPTIONS)).toEqual(javaList("BUTTON").sort());
    expect(values(RADIUS_OPTIONS)).toEqual(javaList("RADIUS").sort());
    expect(values(CARD_OPTIONS)).toEqual(javaList("CARD").sort());
    expect([...FONT_OPTIONS].sort()).toEqual(javaList("FONTS").sort());
    FONT_OPTIONS.forEach((f) => expect(isKnownFont(f), f).toBe(true));
  });

  it("sections + styles match", () => {
    const java = javaSections();
    expect(Object.keys(SECTION_OPTIONS).sort()).toEqual(Object.keys(java).sort());
    for (const [key, opt] of Object.entries(SECTION_OPTIONS)) {
      expect(opt.variants.map((v) => v.value).filter(Boolean).sort(), key).toEqual([...java[key]].sort());
    }
  });
});

describe("Customize: built-in -> config -> template", () => {
  it.each(TEMPLATES.map((t) => [t.key, t] as const))("%s same dikhe", (_, t) => {
    const cfg = configFromTemplate(t);
    const back = buildCustomTemplate({ key: "custom-1", name: "Mine", baseTemplate: t.key, config: cfg });
    expect(back.key).toBe("custom-1");
    expect(back.type).toBe(t.type);
    expect(back.hero).toBe(t.hero);
    expect(back.nav).toBe(t.nav);
    expect(back.colors).toEqual(t.colors);
    expect(back.fonts).toEqual(t.fonts);
    expect(back.sections).toEqual(t.sections);
    // editor ki values backend validation pass karein
    expect(values(RADIUS_OPTIONS)).toContain(cfg.radius);
    expect(values(CARD_OPTIONS)).toContain(cfg.card);
  });

  it("custom key", () => {
    expect(isCustomKey("custom-12")).toBe(true);
    expect(isCustomKey("classic")).toBe(false);
    expect(isCustomKey(null)).toBe(false);
  });
});
