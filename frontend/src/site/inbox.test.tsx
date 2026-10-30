import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AxiosError } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StaticSiteProvider, type SiteState } from "./data";
import { getTemplate } from "./templates";

const post = vi.fn((_u: string, _b: unknown) => Promise.resolve({ data: {} }));
vi.mock("../lib/api", async (orig) => {
  const real = await orig<typeof import("../lib/api")>();
  return { ...real, api: { ...real.api, post: (u: string, b: unknown) => post(u, b) } };
});

const { EnquiryForm, SubscribeBox, WhatsAppButton, whatsappNumber } = await import("./inbox");
const { applySeo, loadAnalytics, seoText } = await import("./seo");

const site = (over: Partial<SiteState> = {}): SiteState => ({
  settings: { site_name: "Sunrise School", whatsapp: "+91 98765 43210" },
  template: getTemplate("classic"),
  siteType: "school",
  menus: [],
  preview: false,
  showcase: false,
  demo: null,
  ...over
});

const renderIn = (ui: JSX.Element, s = site()) =>
  render(
    <MemoryRouter initialEntries={["/contact"]}>
      <StaticSiteProvider value={s}>{ui}</StaticSiteProvider>
    </MemoryRouter>
  );

describe("contact form", () => {
  beforeEach(() => {
    post.mockClear();
  });

  it("bhejta hai (page ke saath) aur success dikhata hai", async () => {
    renderIn(<EnquiryForm />);
    fireEvent.change(screen.getByLabelText("Your name"), { target: { value: "Riya" } });
    fireEvent.change(screen.getByLabelText("Phone"), { target: { value: "9876543210" } });
    fireEvent.change(screen.getByLabelText("Message"), { target: { value: "Is admission open?" } });
    fireEvent.submit(screen.getByRole("form", { name: "Contact form" }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Thank you"));
    expect(post).toHaveBeenCalledWith("/public/enquiries", expect.objectContaining({ name: "Riya", phone: "9876543210", page: "/contact", website: "" }));
  });

  it("email ya phone zaroori; server error dikhe", async () => {
    renderIn(<EnquiryForm />);
    fireEvent.change(screen.getByLabelText("Your name"), { target: { value: "Riya" } });
    fireEvent.change(screen.getByLabelText("Message"), { target: { value: "Hello there" } });
    fireEvent.submit(screen.getByRole("form", { name: "Contact form" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("email or phone");
    expect(post).not.toHaveBeenCalled();

    const err = new AxiosError("429");
    err.response = { data: { message: "Too many requests — please try again in a few minutes." }, status: 429 } as AxiosError["response"];
    post.mockRejectedValueOnce(err);
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "r@x.com" } });
    fireEvent.submit(screen.getByRole("form", { name: "Contact form" }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Too many requests"));
  });

  it("preview me asli message nahi jaata", async () => {
    renderIn(<EnquiryForm />, site({ preview: true }));
    fireEvent.change(screen.getByLabelText("Your name"), { target: { value: "Riya" } });
    fireEvent.change(screen.getByLabelText("Phone"), { target: { value: "9876543210" } });
    fireEvent.change(screen.getByLabelText("Message"), { target: { value: "Hello there" } });
    fireEvent.submit(screen.getByRole("form", { name: "Contact form" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("preview");
    expect(post).not.toHaveBeenCalled();
  });

  it("newsletter subscribe", async () => {
    renderIn(<SubscribeBox />);
    fireEvent.change(screen.getByLabelText("Email for newsletter"), { target: { value: "fan@x.com" } });
    fireEvent.submit(screen.getByRole("form", { name: "Newsletter" }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("subscribed"));
    expect(post).toHaveBeenCalledWith("/public/subscribe", { email: "fan@x.com", source: "Footer", website: "" });
  });
});

describe("whatsapp", () => {
  it("number saaf", () => {
    expect(whatsappNumber("+91 98765 43210")).toBe("919876543210");
    expect(whatsappNumber("098765 43210")).toBe("919876543210");
    expect(whatsappNumber("9876543210")).toBe("919876543210");
    expect(whatsappNumber("00971 50 123 4567")).toBe("971501234567");
    expect(whatsappNumber("call me")).toBeNull();
    expect(whatsappNumber("")).toBeNull();
  });

  it("button: setting ho tabhi", () => {
    const { unmount } = renderIn(<WhatsAppButton />);
    expect(screen.getByLabelText("Chat on WhatsApp")).toHaveAttribute("href", expect.stringContaining("https://wa.me/919876543210?text=Hi%20Sunrise%20School"));
    unmount();
    renderIn(<WhatsAppButton />, site({ settings: { site_name: "X" } }));
    expect(screen.queryByLabelText("Chat on WhatsApp")).toBeNull();
  });
});

describe("seo", () => {
  it("meta tags + canonical", () => {
    applySeo({ title: "Admissions | Sunrise", description: "Apply now", image: "/files/demo/a.jpg" }, "https://sunrise.com", "/page/admissions");
    expect(document.title).toBe("Admissions | Sunrise");
    const meta = (sel: string) => document.head.querySelector(sel)?.getAttribute("content");
    expect(meta('meta[name="description"]')).toBe("Apply now");
    expect(meta('meta[property="og:image"]')).toBe("https://sunrise.com/files/demo/a.jpg");
    expect(meta('meta[property="og:url"]')).toBe("https://sunrise.com/page/admissions");
    expect(meta('meta[name="twitter:card"]')).toBe("summary_large_image");
    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe("https://sunrise.com/page/admissions");
    applySeo({ title: "Home" }, "https://sunrise.com", "/");
    expect(document.head.querySelector('meta[name="description"]')).toBeNull();
  });

  it("text 160 tak, html hata", () => {
    expect(seoText("<p>Hello&nbsp;<b>world</b></p>")).toBe("Hello world");
    expect(seoText("a".repeat(200)).length).toBe(160);
  });

  it("analytics: sahi id par hi, ek baar", () => {
    loadAnalytics("not-an-id");
    expect(document.getElementById("wm-gtag")).toBeNull();
    loadAnalytics("G-AB12CD34EF");
    loadAnalytics("G-AB12CD34EF");
    expect(document.querySelectorAll("#wm-gtag")).toHaveLength(1);
    expect(document.getElementById("wm-gtag")?.getAttribute("src")).toContain("id=G-AB12CD34EF");
    expect(typeof window.gtag).toBe("function");
  });
});
