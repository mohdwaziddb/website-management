import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { api } from "../lib/api";
import type { PageResult, Row } from "../lib/types";
import { getSiteType, SiteTypeKey } from "./siteTypes";
import { getTemplate, isHexColor, TemplateConfig } from "./templates";
import { buildCustomTemplate, CustomTemplateRow, isCustomKey } from "./templates/options";

export type Settings = Record<string, string | null>;

export interface MenuItem {
  id: number;
  title: string;
  href: string;
  external: boolean;
  children: MenuItem[];
}

/** Backend /api/platform/demo/{type} — template preview / showcase ke liye sample content */
export interface DemoData {
  type: string;
  settings: Record<string, string>;
  modules: Record<string, Row[]>;
}

export interface SiteState {
  settings: Settings;
  template: TemplateConfig;
  siteType: SiteTypeKey;
  menus: MenuItem[];
  /** Admin ka template preview (?template=x&preview=1): khaali sections demo content se bharte hain */
  preview: boolean;
  /** Root domain /preview/<template>: saara content demo se (koi website nahi) */
  showcase: boolean;
  demo: DemoData | null;
}

const SiteContext = createContext<SiteState | null>(null);

// iframe ke andar navigate karne par query chali jati hai, isliye pehli load par hi padh lo
const params = new URLSearchParams(window.location.search);
export const PREVIEW = params.get("preview") === "1";
const PREVIEW_TEMPLATE = PREVIEW ? params.get("template") : null;

// ------------------------------------------------------------ fetch + cache

const cache = new Map<string, Promise<unknown>>();

function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  if (!cache.has(key)) {
    cache.set(
      key,
      load().catch((e) => {
        cache.delete(key);
        throw e;
      })
    );
  }
  return cache.get(key) as Promise<T>;
}

export function fetchList(module: string, query: Record<string, string | number> = {}): Promise<PageResult<Row>> {
  const qs = new URLSearchParams(Object.entries({ size: 12, ...query }).map(([k, v]) => [k, String(v)])).toString();
  return cached(`${module}?${qs}`, () => api.get<PageResult<Row>>(`/public/m/${module}?${qs}`).then((r) => r.data));
}

export type SlugModule = "pages" | "blogs" | "news_posts" | "news_categories" | "products" | "product_categories";

export function fetchBySlug(module: SlugModule, slug: string): Promise<Row> {
  return cached(`${module}/slug/${slug}`, () => api.get<Row>(`/public/${module}/slug/${encodeURIComponent(slug)}`).then((r) => r.data));
}

function fetchRecord(module: string, id: string | number): Promise<Row> {
  return cached(`${module}/${id}`, () => api.get<Row>(`/public/m/${module}/${id}`).then((r) => r.data));
}

export function fetchDemo(type: string): Promise<DemoData> {
  return cached(`demo:${type}`, () => api.get<DemoData>(`/platform/demo/${type}`).then((r) => r.data));
}

export function clearSiteCache() {
  cache.clear();
}

/** Demo rows par wahi filter / size jo API karti (category_id, slug ...) */
export function demoList(demo: DemoData | null, module: string, query: Record<string, string | number> = {}): Row[] {
  let items = demo?.modules[module] ?? [];
  Object.entries(query).forEach(([k, v]) => {
    if (["size", "page", "sort", "dir", "q"].includes(k)) return;
    items = items.filter((r) => String(r[k]) === String(v));
  });
  return items.slice(0, Number(query.size ?? 12));
}

// ------------------------------------------------------------ hooks

export interface ListState {
  items: Row[];
  total: number;
  loading: boolean;
  error: boolean;
  /** true = asli data nahi tha, demo dikh raha hai */
  demo: boolean;
}

function fromDemo(items: Row[]): ListState {
  return { items, total: items.length, loading: false, error: false, demo: true };
}

/** Section / page ke liye list. Showcase = demo; preview me khaali ho to demo. */
export function useList(module: string, query: Record<string, string | number> = {}): ListState {
  const { preview, showcase, demo } = useSite();
  const key = module + JSON.stringify(query);
  const [state, setState] = useState<ListState>(() =>
    showcase ? fromDemo(demoList(demo, module, query)) : { items: [], total: 0, loading: true, error: false, demo: false }
  );

  useEffect(() => {
    if (showcase) {
      setState(fromDemo(demoList(demo, module, query)));
      return;
    }
    let alive = true;
    const fallback = () => (preview ? demoList(demo, module, query) : []);
    fetchList(module, query)
      .then((r) => {
        if (!alive) return;
        if (r.items.length === 0 && preview) setState(fromDemo(fallback()));
        else setState({ items: r.items, total: r.total, loading: false, error: false, demo: false });
      })
      .catch(() => {
        if (alive) setState({ ...fromDemo(fallback()), error: !preview });
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, preview, showcase, demo]);

  return state;
}

/** Ek record id se (projects / catalog detail) — negative id = demo row */
export function useRecord(module: string, id: string | undefined): Row | null | undefined {
  const { demo } = useSite();
  const [row, setRow] = useState<Row | null | undefined>(undefined);
  useEffect(() => {
    if (!id) return;
    setRow(undefined);
    if (Number(id) < 0) {
      setRow(demo?.modules[module]?.find((r) => String(r.id) === id) ?? null);
      return;
    }
    fetchRecord(module, id)
      .then(setRow)
      .catch(() => setRow(null));
  }, [module, id, demo]);
  return row;
}

/** Page / blog slug se; demo me ho to wahan se */
export function useBySlug(module: SlugModule, slug: string | undefined): Row | null | undefined {
  const { demo, showcase } = useSite();
  const [row, setRow] = useState<Row | null | undefined>(undefined);
  useEffect(() => {
    if (!slug) return;
    setRow(undefined);
    const fromDemoRow = demo?.modules[module]?.find((r) => r.slug === slug);
    if (fromDemoRow || showcase) {
      setRow(fromDemoRow ?? null);
      return;
    }
    fetchBySlug(module, slug)
      .then(setRow)
      .catch(() => setRow(null));
  }, [module, slug, demo, showcase]);
  return row;
}

export function useSite(): SiteState {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error("useSite outside SiteProvider");
  return ctx;
}

// ------------------------------------------------------------ providers

/** Menus + pages se navbar tree: menu ka custom_url, warna us menu se juda pehla page, warna "" (sirf text, link nahi) */
export function buildMenuTree(menus: Row[], pages: Row[]): MenuItem[] {
  const pageByMenu = new Map<number, Row>();
  pages.forEach((p) => {
    const mid = Number(p.menu_id);
    if (mid && !pageByMenu.has(mid)) pageByMenu.set(mid, p);
  });
  const toItem = (m: Row): MenuItem => {
    const custom = typeof m.custom_url === "string" ? m.custom_url.trim() : "";
    const page = pageByMenu.get(m.id);
    const href = custom || (page ? `/page/${page.slug}` : "");
    return { id: m.id, title: String(m.title ?? ""), href, external: /^https?:\/\//i.test(href) || !!m.open_new_tab, children: [] };
  };
  const byId = new Map<number, MenuItem>();
  menus.forEach((m) => byId.set(m.id, toItem(m)));
  const roots: MenuItem[] = [];
  menus.forEach((m) => {
    const item = byId.get(m.id)!;
    const parent = m.parent_id ? byId.get(Number(m.parent_id)) : undefined;
    if (parent) parent.children.push(item);
    else roots.push(item);
  });
  return roots;
}

/** Settings ka theme color (#hex) template ka primary override karta hai (preview me nahi) */
function withThemeColor(t: TemplateConfig, color: unknown): TemplateConfig {
  return isHexColor(color) ? { ...t, colors: { ...t.colors, primary: color } } : t;
}

export type LoadState = "loading" | "ready" | "missing" | "error";

/** Client website (live / admin preview) */
export function SiteProvider({ children }: { children: (state: LoadState) => ReactNode }) {
  const [value, setValue] = useState<SiteState | null>(null);
  const [state, setState] = useState<LoadState>("loading");

  useEffect(() => {
    Promise.all([
      api.get<Settings>("/public/settings").then((r) => r.data),
      fetchList("menus", { size: 100 }).catch(() => ({ items: [] as Row[] })),
      fetchList("pages", { size: 100 }).catch(() => ({ items: [] as Row[] }))
    ])
      .then(async ([settings, menus, pages]) => {
        // "draft" = template editor ka unsaved design (postMessage se aata hai); tab tak website ka current template
        const wanted = PREVIEW_TEMPLATE && PREVIEW_TEMPLATE !== "draft" ? PREVIEW_TEMPLATE : settings.template;
        const template = await resolveTemplate(wanted, PREVIEW_TEMPLATE ? null : settings.primary_color);
        // dusre type ka template preview ho raha ho to us type ke naam / nav
        const siteType = PREVIEW_TEMPLATE ? template.type : getSiteType(settings.site_type).key;
        const demo = PREVIEW ? await fetchDemo(template.type).catch(() => null) : null;
        setValue({ settings, template, siteType, menus: buildMenuTree(menus.items, pages.items), preview: PREVIEW, showcase: false, demo });
        setState("ready");
      })
      .catch((e) => setState(e?.response?.status === 404 ? "missing" : "error"));
  }, []);

  // Template editor (admin) iframe ko unsaved design bhejta hai — sirf same website (origin) se
  useEffect(() => {
    if (PREVIEW_TEMPLATE !== "draft" || state !== "ready") return;
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.data?.type !== DRAFT_MESSAGE) return;
      const draft = buildCustomTemplate(e.data.template);
      setValue((v) => (v ? { ...v, template: draft, siteType: draft.type } : v));
      fetchDemo(draft.type)
        .then((demo) => setValue((v) => (v ? { ...v, demo } : v)))
        .catch(() => {});
    };
    window.addEventListener("message", onMessage);
    // editor ko batao ki iframe tayyar hai (wo turant current draft bhej de)
    window.parent?.postMessage({ type: DRAFT_READY }, window.location.origin);
    return () => window.removeEventListener("message", onMessage);
  }, [state]);

  if (!value) return <>{children(state)}</>;
  return <SiteContext.Provider value={value}>{children(state)}</SiteContext.Provider>;
}

export const DRAFT_MESSAGE = "wm-template-draft";
export const DRAFT_READY = "wm-template-draft-ready";

/** Built-in key ya "custom-<id>" -> TemplateConfig. Custom na mile to type ka default. */
async function resolveTemplate(key: string | null | undefined, themeColor: unknown): Promise<TemplateConfig> {
  if (isCustomKey(key)) {
    try {
      const row = await api.get<CustomTemplateRow>(`/public/custom-templates/${key}`).then((r) => r.data);
      return buildCustomTemplate(row);
    } catch {
      return getTemplate(null);
    }
  }
  return themeColor === null ? getTemplate(key) : withThemeColor(getTemplate(key), themeColor);
}

/** Root domain showcase: /preview/<template> — website nahi, sirf demo content */
export function ShowcaseProvider({ templateKey, children }: { templateKey: string; children: (state: LoadState) => ReactNode }) {
  const [value, setValue] = useState<SiteState | null>(null);
  const [state, setState] = useState<LoadState>("loading");

  useEffect(() => {
    const template = getTemplate(templateKey);
    if (template.key !== templateKey) {
      setState("missing");
      return;
    }
    fetchDemo(template.type)
      .then((demo) => {
        setValue({ settings: { ...demo.settings, template: template.key }, template, siteType: template.type, menus: [], preview: false, showcase: true, demo });
        setState("ready");
      })
      .catch(() => setState("error"));
  }, [templateKey]);

  if (!value) return <>{children(state)}</>;
  return <SiteContext.Provider value={value}>{children(state)}</SiteContext.Provider>;
}

/** Test ke liye seedha value */
export function StaticSiteProvider({ value, children }: { value: SiteState; children: ReactNode }) {
  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}
