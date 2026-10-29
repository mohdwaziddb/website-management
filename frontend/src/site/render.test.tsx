import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Row } from "../lib/types";
import { TEMPLATES } from "./templates";

// Live API mock: blogs + catalog me data, baaki khaali
const get = vi.fn((url: string) => {
  const list = (items: unknown[]) => Promise.resolve({ data: { items, total: items.length, page: 1, size: 12 } });
  if (url.startsWith("/public/m/blogs")) return list([{ id: 1, title: "Sports Day Report", slug: "sports-day", summary: "Fun day", published_date: "2026-10-01" }]);
  if (url.startsWith("/public/m/catalog_items/5")) return Promise.resolve({ data: { id: 5, title: "Paneer Tikka", price: "₹420", summary: "Smoky" } });
  if (url.startsWith("/public/m/catalog_items")) return list([{ id: 5, title: "Paneer Tikka", price: "₹420", category: "Starters" }]);
  if (url.startsWith("/public/blogs/slug/sports-day")) return Promise.resolve({ data: { id: 1, title: "Sports Day Report", body: "<p>Full story here</p>" } });
  if (url.startsWith("/public/pages/slug/")) return Promise.reject({ response: { status: 404 } });
  return list([]);
});

vi.mock("../lib/api", async (importOriginal) => {
  const real = await importOriginal<typeof import("../lib/api")>();
  return { ...real, api: { get: (url: string) => get(url) } };
});

const { StaticSiteProvider, clearSiteCache } = await import("./data");
const { SiteLayout } = await import("./SiteApp");

/** Har module ke 3 demo rows — showcase mode me saare sections bharte hain */
const MODULES = ["sliders", "services", "team_members", "projects", "catalog_items", "pricing_plans", "faqs", "stats", "partners", "testimonials", "blogs", "image_gallery", "videos", "achievements", "thoughts", "attachments"];
const demo = {
  type: "x",
  settings: { site_name: "Demo Brand", tagline: "Best in town", cta_text: "Book Now", about_short: "<p>About us text</p>", phone: "123" },
  modules: Object.fromEntries(
    MODULES.map((m, i) => [
      m,
      [1, 2, 3].map((n) => ({ id: -(i * 10 + n), title: `${m} ${n}`, value: `${n * 100}+`, price: "₹99", features: "A\nB", slug: `${m}-${n}`, description: "d", answer: "yes", highlighted: n === 2 }) as Row)
    ])
  )
};

function renderSite(templateKey: string, path = "/", mode: "live" | "preview" | "showcase" = "live") {
  const template = TEMPLATES.find((t) => t.key === templateKey)!;
  const settings = { site_name: "Sunrise Academy", tagline: "Learn & Grow", phone: "12345", template: templateKey };
  return render(
    <MemoryRouter initialEntries={[path]}>
      <StaticSiteProvider
        value={{
          settings: mode === "showcase" ? demo.settings : settings,
          template,
          siteType: template.type,
          menus: [],
          preview: mode === "preview",
          showcase: mode === "showcase",
          demo: mode === "live" ? null : demo
        }}
      >
        <SiteLayout />
      </StaticSiteProvider>
    </MemoryRouter>
  );
}

describe("public website", () => {
  beforeEach(() => {
    clearSiteCache();
    get.mockClear();
  });

  it.each(TEMPLATES.map((t) => t.key))("%s template showcase me poora render hota hai", (key) => {
    const { container } = renderSite(key, "/", "showcase");
    expect(container.querySelector(`[data-template="${key}"]`)).not.toBeNull();
    expect(screen.getAllByText("Demo Brand").length).toBeGreaterThan(0);
    // template ke saare sections (hero ke alawa) me se kam se kam aadhe content dikhate hain
    expect(container.querySelectorAll("section").length).toBeGreaterThanOrEqual(Math.ceil(TEMPLATES.find((t) => t.key === key)!.sections.length / 2));
  });

  it("live: sirf asli data, khaali sections chhupe", async () => {
    renderSite("saffron");
    await waitFor(() => expect(screen.getByText("Paneer Tikka")).toBeInTheDocument());
    expect(screen.getByText("Our Menu")).toBeInTheDocument();
    expect(screen.queryByText("Meet the Chefs")).toBeNull();
  });

  it("preview: khaali sections demo se bharte hain", async () => {
    renderSite("iron", "/", "preview");
    await waitFor(() => expect(screen.getAllByText("team_members 1").length).toBeGreaterThan(0));
    expect(screen.getByText(/Preview · Iron/)).toBeInTheDocument();
  });

  it("type ke hisaab se navbar (restaurant: Menu, Reservations)", () => {
    renderSite("bistro", "/", "showcase");
    expect(screen.getAllByText("Menu").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Reservations").length).toBeGreaterThan(0);
  });

  it("list page + detail page", async () => {
    renderSite("prime", "/catalog", "showcase");
    expect(screen.getByText("Featured Properties")).toBeInTheDocument();
    renderSite("saffron", "/catalog/5");
    await waitFor(() => expect(screen.getAllByText("Paneer Tikka").length).toBeGreaterThan(0));
    renderSite("prime", "/catalog/-41", "showcase");
    expect(screen.getAllByText("catalog_items 1").length).toBeGreaterThan(0);
  });

  it("blog detail page", async () => {
    renderSite("classic", "/blog/sports-day");
    await waitFor(() => expect(screen.getByText("Full story here")).toBeInTheDocument());
  });

  it("unknown page => 404", async () => {
    renderSite("minimal", "/page/nope");
    await waitFor(() => expect(screen.getByText("404")).toBeInTheDocument());
  });
});
