import { describe, expect, it } from "vitest";
import { hexToRgb } from "./ui";

// Tailwind 3 CSS variable par opacity nahi laga sakta: "bg-[var(--text)]/5" build me banti hi nahi (chupchap gayab).
// Iski jagah "bg-site-text/5" use karo (tailwind.config.js -> site colours).
const files = import.meta.glob("./**/*.tsx", { query: "?raw", import: "default", eager: true }) as Record<string, string>;

describe("site styles", () => {
  it("koi bhi [var(--x)]/opacity class nahi", () => {
    const bad = Object.entries(files).flatMap(([f, src]) => (src.match(/\[var\(--[a-z-]+\)\]\/\d+/g) ?? []).map((m) => `${f}: ${m}`));
    expect(bad).toEqual([]);
  });

  it("hexToRgb", () => {
    expect(hexToRgb("#1d4ed8")).toBe("29 78 216");
    expect(hexToRgb("#ffffff")).toBe("255 255 255");
  });
});
