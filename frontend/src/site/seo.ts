// SEO: har page ka title / description / share photo (meta + og: + twitter:), Google Analytics, Search Console code.
// Note: WhatsApp / Facebook bots JS nahi chalate — unke liye backend /api/public/share (nginx bot rule, README).
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { fileUrl } from "../lib/api";
import { useSite } from "./data";

export interface SeoInfo {
  title: string;
  description?: string;
  image?: string | null;
}

function setMeta(attr: "name" | "property", key: string, content: string | null | undefined) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!content) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

/** 160 akshar tak, HTML hata ke */
export function seoText(v: unknown, max = 160): string {
  const s = String(v ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return s.length > max ? s.slice(0, max - 1).trimEnd() + "…" : s;
}

/** DOM me tags lagao (testable) */
export function applySeo(info: SeoInfo, origin = window.location.origin, path = window.location.pathname) {
  document.title = info.title;
  const image = info.image ? (/^https?:\/\//.test(info.image) ? info.image : origin + fileUrl(info.image)) : null;
  setMeta("name", "description", info.description);
  setMeta("property", "og:title", info.title);
  setMeta("property", "og:description", info.description);
  setMeta("property", "og:image", image);
  setMeta("property", "og:url", origin + path);
  setMeta("property", "og:type", "website");
  setMeta("name", "twitter:card", image ? "summary_large_image" : "summary");
  let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.rel = "canonical";
    document.head.appendChild(canonical);
  }
  canonical.href = origin + path;
}

/** Page ka title + description + photo; khaali ho to website ke SEO settings */
export function useSeo(title: string, extra: { description?: unknown; image?: unknown } = {}) {
  const { settings } = useSite();
  const { pathname } = useLocation();
  const name = settings.site_name ?? "";
  const description = seoText(extra.description) || seoText(settings.seo_description) || seoText(settings.tagline);
  const image = (typeof extra.image === "string" && extra.image) || settings.share_image || settings.logo || null;
  const full = title ? [title, name].filter(Boolean).join(" | ") : settings.seo_title || name;
  useEffect(() => {
    applySeo({ title: full, description, image }, window.location.origin, pathname);
  }, [full, description, image, pathname]);
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/** G-XXXX ka gtag.js ek baar load (testable) */
export function loadAnalytics(id: string) {
  if (!/^(G|GT|UA)-[A-Z0-9-]{4,20}$/.test(id) || document.getElementById("wm-gtag")) return;
  const s = document.createElement("script");
  s.id = "wm-gtag";
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };
  window.gtag("js", new Date());
  // page_view hum khud bhejte hain (SPA route change)
  window.gtag("config", id, { send_page_view: false });
}

/** SiteLayout me ek baar: Analytics (sirf live site), Search Console code, har route par page_view */
export function useSiteHead() {
  const { settings, preview, showcase } = useSite();
  const { pathname, search } = useLocation();
  const ga = settings.google_analytics_id;
  const live = !preview && !showcase;

  useEffect(() => {
    setMeta("name", "google-site-verification", settings.google_site_verification);
  }, [settings.google_site_verification]);

  useEffect(() => {
    if (live && ga) loadAnalytics(ga);
  }, [live, ga]);

  useEffect(() => {
    if (!live || !ga || !window.gtag) return;
    window.gtag("event", "page_view", { page_path: pathname + search, page_location: window.location.href, page_title: document.title });
  }, [live, ga, pathname, search]);
}
