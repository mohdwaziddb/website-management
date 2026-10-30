import { describe, expect, it } from "vitest";
import type { ModuleDef } from "../lib/types";
import { activeNav, buildNav, flatNav, searchNav } from "./nav";

const mod = (key: string, label: string, group: string): ModuleDef => ({
  key,
  label,
  group,
  icon: "circle",
  titleField: "title",
  publishable: true,
  sortable: false,
  fields: []
});

const SCHOOL = [mod("pages", "Pages", "Content"), mod("sliders", "Home Sliders", "Content"), mod("image_gallery", "Image Gallery", "Gallery & Media")];
const STORE = [...SCHOOL, mod("products", "Products", "Store"), mod("coupons", "Coupons", "Store")];

describe("admin nav", () => {
  it("groups + system, editor ko Users nahi", () => {
    const nav = buildNav(SCHOOL, "EDITOR");
    expect(nav.map((s) => s.title)).toEqual(["Main", "Content", "Gallery & Media", "System"]);
    const labels = flatNav(nav).map((i) => i.label);
    expect(labels).not.toContain("Users");
    expect(labels).not.toContain("Orders");
    expect(flatNav(buildNav(SCHOOL, "ADMIN")).map((i) => i.label)).toContain("Users");
  });

  it("store website: orders / customers / reviews, settings sirf admin", () => {
    const store = buildNav(STORE, "ADMIN").find((s) => s.title === "Store")!;
    expect(store.items.map((i) => i.label)).toEqual(["Orders", "Customers", "Reviews", "Products", "Coupons", "Store Settings"]);
    const editorStore = buildNav(STORE, "EDITOR").find((s) => s.title === "Store")!;
    expect(editorStore.items.map((i) => i.label)).not.toContain("Store Settings");
  });

  it("quick search: naam se shuru wale pehle, group se bhi milta hai", () => {
    const items = flatNav(buildNav(STORE, "ADMIN"));
    expect(searchNav(items, "settings").map((i) => i.label)).toEqual(["Store Settings", "Website Settings"]);
    expect(searchNav(items, "pro")[0].label).toBe("Products");
    expect(searchNav(items, "gallery & media").map((i) => i.label)).toEqual(["Image Gallery"]);
    expect(searchNav(items, "zzz")).toEqual([]);
    expect(searchNav(items, "  ")).toHaveLength(items.length);
  });

  it("activeNav: sabse lamba match (/m/pages/12 => Pages, / => Dashboard)", () => {
    const items = flatNav(buildNav(STORE, "ADMIN"));
    expect(activeNav(items, "/m/pages/12")?.label).toBe("Pages");
    expect(activeNav(items, "/store/orders/5")?.label).toBe("Orders");
    expect(activeNav(items, "/")?.label).toBe("Dashboard");
    expect(activeNav(items, "/unknown")).toBeUndefined();
  });
});
