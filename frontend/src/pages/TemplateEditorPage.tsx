import { FormEvent, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowDown, ArrowLeft, ArrowUp, Monitor, Save, Smartphone, Sparkles } from "lucide-react";
import { api, errorMessage } from "../lib/api";
import { useReloadModules } from "../lib/modules";
import { DRAFT_MESSAGE, DRAFT_READY } from "../site/data";
import { getSiteType, SITE_TYPES } from "../site/siteTypes";
import { getTemplate, parseSection, templatesFor } from "../site/templates";
import { loadFonts } from "../site/templates/fonts";
import {
  BUTTON_OPTIONS,
  CARD_OPTIONS,
  COLOR_FIELDS,
  configFromTemplate,
  CustomConfig,
  CustomTemplateRow,
  FONT_OPTIONS,
  HEADING_OPTIONS,
  HERO_OPTIONS,
  NAV_OPTIONS,
  Opt,
  RADIUS_OPTIONS,
  SECTION_OPTIONS
} from "../site/templates/options";
import { baseInputClass, Button, Card, confirmDialog, ErrorBox, inputClass, PageHeader, showToast } from "../components/ui";

type SectionRow = { key: string; variant: string; on: boolean };

/** config.sections -> editor rows (saare sections, jo off hain wo neeche) */
function toRows(sections: string[]): SectionRow[] {
  const rows: SectionRow[] = sections.map((s) => {
    const [key, variant] = parseSection(s);
    return { key, variant: variant ?? "", on: true };
  });
  Object.keys(SECTION_OPTIONS).forEach((key) => {
    if (!rows.some((r) => r.key === key)) rows.push({ key, variant: SECTION_OPTIONS[key].variants[0]?.value ?? "", on: false });
  });
  return rows.filter((r) => r.key in SECTION_OPTIONS);
}

function toSections(rows: SectionRow[]): string[] {
  return rows.filter((r) => r.on).map((r) => (r.variant ? `${r.key}:${r.variant}` : r.key));
}

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

function Select<T extends string>({ value, options, onChange, label }: { value: T; options: Opt<T>[]; onChange: (v: T) => void; label: string }) {
  return (
    <select aria-label={label} className={inputClass} value={value} onChange={(e) => onChange(e.target.value as T)}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h2>
      <div className="space-y-4">{children}</div>
    </Card>
  );
}

/** Unsaved design ka live preview: iframe /?template=draft&preview=1 ko postMessage se config */
function DraftPreview({ draft, mobile }: { draft: { key: string; name: string; baseTemplate: string; config: CustomConfig }; mobile: boolean }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);
  const width = mobile ? 390 : 1280;
  const height = mobile ? 780 : 820;

  const send = useCallback(() => {
    frame.current?.contentWindow?.postMessage({ type: DRAFT_MESSAGE, template: draft }, window.location.origin);
  }, [draft]);

  useEffect(() => {
    const t = setTimeout(send, 120);
    return () => clearTimeout(t);
  }, [send]);

  useEffect(() => {
    const onReady = (e: MessageEvent) => {
      if (e.origin === window.location.origin && e.data?.type === DRAFT_READY) send();
    };
    window.addEventListener("message", onReady);
    return () => window.removeEventListener("message", onReady);
  }, [send]);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const update = () => setScale(Math.min(1, el.clientWidth / width));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [width]);

  return (
    <div ref={box} className={`relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100 ${mobile ? "mx-auto max-w-[390px]" : ""}`} style={{ height: height * scale }}>
      <iframe ref={frame} title="Live preview" src="/?template=draft&preview=1" className="absolute left-0 top-0 origin-top-left border-0" style={{ width, height, transform: `scale(${scale})` }} />
    </div>
  );
}

export default function TemplateEditorPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const reloadModules = useReloadModules();
  const editing = id !== undefined;

  const [name, setName] = useState("");
  const [base, setBase] = useState(params.get("base") ?? "classic");
  const [config, setConfig] = useState<CustomConfig>(() => configFromTemplate(getTemplate(params.get("base"))));
  const [rows, setRows] = useState<SectionRow[]>(() => toRows(configFromTemplate(getTemplate(params.get("base"))).sections));
  const [loaded, setLoaded] = useState(!editing);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    if (!editing) {
      setName(`My ${getTemplate(base).name}`);
      return;
    }
    api
      .get<CustomTemplateRow[]>("/templates/custom")
      .then((r) => {
        const row = r.data.find((t) => String(t.id) === id);
        if (!row) throw new Error("Template not found");
        setName(row.name);
        setBase(row.baseTemplate);
        setConfig(row.config);
        setRows(toRows(row.config.sections));
        setLoaded(true);
      })
      .catch((e) => setError(errorMessage(e) === "Something went wrong" ? String(e.message) : errorMessage(e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // editor me font dropdown ke saath naam usi font me dikhe
  useEffect(() => loadFonts([config.fonts.heading, config.fonts.body]), [config.fonts.heading, config.fonts.body]);

  const fullConfig: CustomConfig = useMemo(() => ({ ...config, sections: toSections(rows) }), [config, rows]);
  const draft = useMemo(() => ({ key: "draft", name: name || "Draft", baseTemplate: base, config: fullConfig }), [name, base, fullConfig]);

  const set = <K extends keyof CustomConfig>(k: K, v: CustomConfig[K]) => setConfig((c) => ({ ...c, [k]: v }));
  const setColor = (k: keyof CustomConfig["colors"], v: string) => setConfig((c) => ({ ...c, colors: { ...c.colors, [k]: v } }));

  const move = (i: number, dir: -1 | 1) =>
    setRows((r) => {
      const j = i + dir;
      if (j < 1 || j >= r.length) return r; // hero (0) hamesha pehla
      const next = [...r];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const loadBase = async (key: string) => {
    const ok = await confirmDialog({
      title: `Start from ${getTemplate(key).name}?`,
      message: "Colours, fonts, layout and sections will be replaced with this template's design.",
      confirmText: "Load design"
    });
    if (!ok) return;
    const c = configFromTemplate(getTemplate(key));
    setConfig(c);
    setRows(toRows(c.sections));
  };

  const save = async (e: FormEvent, apply = false) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const body = { name: name.trim(), baseTemplate: base, config: fullConfig };
    try {
      const r = editing ? await api.put<CustomTemplateRow>(`/templates/custom/${id}`, body) : await api.post<CustomTemplateRow>("/templates/custom", body);
      if (apply) {
        await api.put("/settings", { template: r.data.key });
        await reloadModules();
        showToast(`"${r.data.name}" is now live on your website`);
      } else {
        showToast(editing ? "Template saved" : "Template created");
      }
      navigate("/templates");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (!loaded) return error ? <ErrorBox message={error} /> : <div className="p-10 text-center text-slate-500">Loading…</div>;

  const type = getTemplate(base).type;
  return (
    <form onSubmit={(e) => save(e)}>
      <PageHeader
        title={editing ? `Edit template · ${name}` : "New template"}
        subtitle="Change anything — the preview updates live. Your content stays the same."
        actions={
          <>
            <Link to="/templates" className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100">
              <ArrowLeft className="h-4 w-4" /> Templates
            </Link>
            <Button type="button" variant="secondary" disabled={busy} onClick={(e) => save(e as unknown as FormEvent, true)}>
              <Sparkles className="h-4 w-4" /> Save & apply
            </Button>
            <Button type="submit" disabled={busy}>
              <Save className="h-4 w-4" /> {busy ? "Saving…" : "Save"}
            </Button>
          </>
        }
      />
      <ErrorBox message={error} />
      <div className="mt-4 grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <div className="space-y-5">
          <Panel title="Basics">
            <Field label="Template name">
              <input required maxLength={100} className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="Based on" hint={`Website type: ${getSiteType(type).label} — admin menus follow this when the template is applied.`}>
              <div className="flex gap-2">
                <select aria-label="Base template" className={inputClass} value={base} onChange={(e) => setBase(e.target.value)}>
                  {SITE_TYPES.map((t) => (
                    <optgroup key={t.key} label={t.label}>
                      {templatesFor(t.key).map((tpl) => (
                        <option key={tpl.key} value={tpl.key}>
                          {tpl.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <Button type="button" variant="secondary" className="shrink-0" onClick={() => loadBase(base)} title="Load this template's design">
                  Load design
                </Button>
              </div>
            </Field>
          </Panel>

          <Panel title="Colours">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={config.dark} onChange={(e) => set("dark", e.target.checked)} /> Dark theme
            </label>
            <div className="grid grid-cols-2 gap-3">
              {COLOR_FIELDS.map((f) => (
                <div key={f.key}>
                  <div className="mb-1 text-xs font-medium text-slate-600" title={f.help}>
                    {f.label}
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white p-1">
                    <input aria-label={`${f.label} colour`} type="color" className="h-8 w-9 shrink-0 cursor-pointer rounded border-0 bg-transparent p-0" value={config.colors[f.key]} onChange={(e) => setColor(f.key, e.target.value)} />
                    <input
                      aria-label={`${f.label} hex`}
                      className="w-full min-w-0 border-0 px-1 font-mono text-xs outline-none"
                      value={config.colors[f.key]}
                      pattern="#[0-9a-fA-F]{6}"
                      onChange={(e) => setColor(f.key, e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Fonts">
            {(["heading", "body"] as const).map((k) => (
              <Field key={k} label={k === "heading" ? "Headings" : "Body text"}>
                <select aria-label={`${k} font`} className={inputClass} value={config.fonts[k]} onChange={(e) => set("fonts", { ...config.fonts, [k]: e.target.value })} style={{ fontFamily: config.fonts[k] }}>
                  {FONT_OPTIONS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </Field>
            ))}
            <p className="rounded-lg bg-slate-50 p-3 text-slate-700">
              <span className="block text-xl font-bold" style={{ fontFamily: config.fonts.heading }}>
                {name || "Your website"}
              </span>
              <span className="text-sm" style={{ fontFamily: config.fonts.body }}>
                The quick brown fox jumps over the lazy dog.
              </span>
            </p>
          </Panel>

          <Panel title="Layout">
            <Field label="Top banner (hero)">
              <Select label="Hero style" value={config.hero} options={HERO_OPTIONS} onChange={(v) => set("hero", v)} />
            </Field>
            <Field label="Navbar">
              <Select label="Navbar style" value={config.nav} options={NAV_OPTIONS} onChange={(v) => set("nav", v)} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Section titles">
                <Select label="Heading style" value={config.heading} options={HEADING_OPTIONS} onChange={(v) => set("heading", v)} />
              </Field>
              <Field label="Buttons">
                <Select label="Button shape" value={config.button} options={BUTTON_OPTIONS} onChange={(v) => set("button", v)} />
              </Field>
              <Field label="Corners">
                <Select label="Corners" value={config.radius} options={RADIUS_OPTIONS} onChange={(v) => set("radius", v)} />
              </Field>
              <Field label="Cards">
                <Select label="Card style" value={config.card} options={CARD_OPTIONS} onChange={(v) => set("card", v)} />
              </Field>
            </div>
          </Panel>

          <Panel title="Home page sections">
            <p className="-mt-2 text-xs text-slate-500">Tick to show, pick a style, use arrows to reorder. Sections with no content hide themselves.</p>
            <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
              {rows.map((r, i) => {
                const opt = SECTION_OPTIONS[r.key];
                const hero = r.key === "hero";
                return (
                  <li key={r.key} className={`flex items-center gap-2 px-3 py-2 ${r.on ? "" : "bg-slate-50 opacity-70"}`}>
                    <input
                      type="checkbox"
                      aria-label={`Show ${opt.label}`}
                      checked={r.on}
                      disabled={hero}
                      onChange={(e) => setRows((rs) => rs.map((x) => (x.key === r.key ? { ...x, on: e.target.checked } : x)))}
                    />
                    <span className="min-w-0 flex-1 truncate text-sm text-slate-800">{opt.label}</span>
                    {opt.variants.length > 1 && (
                      <select
                        aria-label={`${opt.label} style`}
                        className={`${baseInputClass} w-36 py-1 text-xs`}
                        value={r.variant}
                        disabled={!r.on}
                        onChange={(e) => setRows((rs) => rs.map((x) => (x.key === r.key ? { ...x, variant: e.target.value } : x)))}
                      >
                        {opt.variants.map((v) => (
                          <option key={v.value} value={v.value}>
                            {v.label}
                          </option>
                        ))}
                      </select>
                    )}
                    <button type="button" aria-label={`Move ${opt.label} up`} disabled={hero || i <= 1} onClick={() => move(i, -1)} className="rounded p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-30">
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button type="button" aria-label={`Move ${opt.label} down`} disabled={hero || i === rows.length - 1} onClick={() => move(i, 1)} className="rounded p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-30">
                      <ArrowDown className="h-4 w-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </Panel>
        </div>

        <div className="xl:sticky xl:top-20 xl:self-start">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-600">Live preview (your content; empty sections show demo)</span>
            <div className="flex rounded-lg border border-slate-300 bg-white p-0.5">
              <button type="button" aria-label="Desktop preview" onClick={() => setMobile(false)} className={`rounded-md p-1.5 ${!mobile ? "bg-slate-900 text-white" : "text-slate-500"}`}>
                <Monitor className="h-4 w-4" />
              </button>
              <button type="button" aria-label="Mobile preview" onClick={() => setMobile(true)} className={`rounded-md p-1.5 ${mobile ? "bg-slate-900 text-white" : "text-slate-500"}`}>
                <Smartphone className="h-4 w-4" />
              </button>
            </div>
          </div>
          <DraftPreview draft={draft} mobile={mobile} />
        </div>
      </div>
    </form>
  );
}

export { toRows, toSections };
