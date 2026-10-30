import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, Database, ExternalLink, Monitor, Paintbrush, Pencil, Plus, Smartphone, Trash2, Wand2 } from "lucide-react";
import { api, errorMessage } from "../lib/api";
import { useAuth } from "../lib/auth";
import { getSiteType, SITE_TYPES } from "../site/siteTypes";
import { getTemplate, TEMPLATES, TemplateConfig, templatesFor } from "../site/templates";
import { buildCustomTemplate, CustomTemplateRow, isCustomKey } from "../site/templates/options";
import { useReloadModules } from "../lib/modules";
import { baseInputClass, Button, Card, confirmDialog, ErrorBox, PageHeader, showToast } from "../components/ui";

export const previewUrl = (key: string) => `/?template=${encodeURIComponent(key)}&preview=1`;

interface DemoStatus {
  siteType: string;
  demoRows: number;
  hasDemo: boolean;
}

/** Asli website ko iframe me chhota (scale) karke dikhata hai — admin ke apne data ke saath (khaali ho to demo) */
export function LivePreview({ src, mobile = false }: { src: string; mobile?: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.3);
  const width = mobile ? 390 : 1280;
  const height = mobile ? 780 : 860;

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / width);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [width]);

  return (
    <div ref={box} className="relative w-full overflow-hidden bg-slate-100" style={{ height: height * scale }}>
      <iframe
        title="Template preview"
        src={src}
        loading="lazy"
        className="pointer-events-none absolute left-0 top-0 origin-top-left border-0"
        style={{ width, height, transform: `scale(${scale})` }}
      />
    </div>
  );
}

/** Demo content: import (WordPress jaisa one-click) / remove */
function DemoPanel({ status, onChange }: { status: DemoStatus | null; onChange: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!status) return null;
  const type = getSiteType(status.siteType);

  const run = async (fn: () => Promise<unknown>, done: string) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      showToast(done);
      onChange();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="mb-6 flex flex-wrap items-center gap-4 p-4">
      <span className={`rounded-xl p-3 ${status.hasDemo ? "bg-emerald-50 text-emerald-600" : "bg-brand-50 text-brand-600"}`}>
        <Database className="h-6 w-6" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="font-semibold text-slate-900">{status.hasDemo ? `Demo content is live (${status.demoRows} records)` : `${type.label} demo content`}</div>
        <p className="text-sm text-slate-500">
          {status.hasDemo
            ? "Replace it with your own content anytime. Removing demo keeps everything you added yourself."
            : "One click fills every admin menu — navbar menus, pages, sliders, gallery, videos, downloads and more — with sample content, photos and PDFs. Then just edit."}
        </p>
        <ErrorBox message={error} />
      </div>
      {status.hasDemo ? (
        <Button
          variant="secondary"
          disabled={busy}
          onClick={async () => {
            const ok = await confirmDialog({
              title: "Remove demo content?",
              message: `All ${status.demoRows} demo records, demo photos and demo settings will be removed. Everything you added yourself stays.`,
              confirmText: "Remove demo",
              danger: true
            });
            if (ok) run(() => api.delete("/demo"), "Demo content removed");
          }}
        >
          <Trash2 className="h-4 w-4" /> {busy ? "Removing…" : "Remove demo"}
        </Button>
      ) : (
        <Button disabled={busy} onClick={() => run(() => api.post("/demo/import"), "Demo content imported")}>
          <Wand2 className="h-4 w-4" /> {busy ? "Importing… (downloading photos)" : "Import demo content"}
        </Button>
      )}
    </Card>
  );
}

interface CardItem {
  tpl: TemplateConfig;
  /** custom template ki DB id (edit / delete ke liye) */
  customId?: number;
  baseName?: string;
}

export default function TemplatesPage() {
  const { user } = useAuth();
  const canEdit = user?.role === "ADMIN";
  const navigate = useNavigate();
  const [current, setCurrent] = useState<string | null>(null);
  const [siteType, setSiteType] = useState<string>("school");
  const [showType, setShowType] = useState<string | null>(null);
  const [demo, setDemo] = useState<DemoStatus | null>(null);
  const [custom, setCustom] = useState<CustomTemplateRow[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mobile, setMobile] = useState(false);
  const [frameKey, setFrameKey] = useState(0);
  const reloadModules = useReloadModules();

  const loadDemo = () => {
    if (canEdit) api.get<DemoStatus>("/demo").then((r) => setDemo(r.data)).catch(() => setDemo(null));
  };
  const loadCustom = () =>
    api
      .get<CustomTemplateRow[]>("/templates/custom")
      .then((r) => setCustom(Array.isArray(r.data) ? r.data : []))
      .catch(() => setCustom([]));

  useEffect(() => {
    api
      .get("/settings")
      .then((r) => {
        setCurrent(r.data.values.template);
        setSiteType(r.data.values.site_type);
      })
      .catch((e) => setError(errorMessage(e)));
    loadDemo();
    loadCustom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const customItems: CardItem[] = custom.map((c) => ({ tpl: buildCustomTemplate(c), customId: c.id, baseName: getTemplate(c.baseTemplate).name }));
  const byKey = (key: string): TemplateConfig => customItems.find((c) => c.tpl.key === key)?.tpl ?? getTemplate(key);

  const apply = async (key: string) => {
    const tpl = byKey(key);
    // dusre type ka template => website ka type bhi badlega (admin menus, section titles, navbar)
    if (tpl.type !== siteType) {
      const ok = await confirmDialog({
        title: `Switch to ${getSiteType(tpl.type).label}?`,
        message: (
          <>
            <b>{tpl.name}</b> is a {getSiteType(tpl.type).label} template. Applying it will change your website type from{" "}
            <b>{getSiteType(siteType).label}</b> to <b>{getSiteType(tpl.type).label}</b> — admin menus and website sections will change to match.
            Your existing content is not deleted.
          </>
        ),
        confirmText: "Apply & switch type"
      });
      if (!ok) return;
    }
    setBusy(key);
    setError(null);
    try {
      const r = await api.put("/settings", { template: key });
      setCurrent(r.data.template);
      if (r.data.site_type !== siteType) {
        setSiteType(r.data.site_type);
        setShowType(null);
        await reloadModules();
        loadDemo();
        showToast(`Template applied — website type is now ${getSiteType(r.data.site_type).label}`);
      } else {
        showToast("Template applied — your website is updated");
      }
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const remove = async (item: CardItem) => {
    const ok = await confirmDialog({
      title: `Delete "${item.tpl.name}"?`,
      message: "This custom template will be deleted. Your website content is not affected.",
      confirmText: "Delete template",
      danger: true
    });
    if (!ok) return;
    try {
      await api.delete(`/templates/custom/${item.customId}`);
      showToast("Template deleted");
      loadCustom();
    } catch (e) {
      showToast(errorMessage(e), true);
    }
  };

  const type = showType ?? siteType;
  const matches = (t: TemplateConfig) => type === "all" || t.type === type;
  // "all" = saare templates (har card par uska type)
  const builtIn: CardItem[] = (type === "all" ? TEMPLATES : templatesFor(type)).map((tpl) => ({ tpl }));
  const mine = customItems.filter((c) => matches(c.tpl));
  // "Add template" kis design se shuru ho: abhi laga built-in, warna is type ka pehla
  const startFrom = current && !isCustomKey(current) ? current : (templatesFor(type === "all" ? siteType : type)[0]?.key ?? "classic");

  const renderCard = (item: CardItem, n: number) => {
    const t = item.tpl;
    const active = current === t.key;
    const isCustom = item.customId !== undefined;
    const iconBtn = "inline-flex flex-1 items-center justify-center rounded-lg border border-slate-300 px-2 py-1.5 text-slate-700 hover:bg-slate-50";
    return (
      <motion.div key={t.key + frameKey} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(n, 8) * 0.06 }}>
        <Card className={`overflow-hidden ${active ? "ring-2 ring-brand-500" : ""}`}>
          <div className={mobile ? "mx-auto max-w-[260px] p-3" : ""}>
            <LivePreview src={previewUrl(t.key)} mobile={mobile} />
          </div>
          <div className="flex items-start gap-3 border-t border-slate-200 p-4">
            <div className="flex gap-1 pt-1">
              {[t.colors.primary, t.colors.accent].map((c, i) => (
                <span key={i} className="h-4 w-4 rounded-full ring-1 ring-black/10" style={{ background: c }} />
              ))}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 font-semibold text-slate-900">
                {t.name}
                {isCustom && <span className="rounded bg-violet-50 px-1.5 py-0.5 text-[10px] font-medium text-violet-700">CUSTOM</span>}
                {t.dark && <span className="rounded bg-slate-900 px-1.5 py-0.5 text-[10px] font-medium text-white">DARK</span>}
                {type === "all" && (
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${t.type === siteType ? "bg-brand-50 text-brand-700" : "bg-slate-100 text-slate-600"}`}>
                    {getSiteType(t.type).label}
                  </span>
                )}
                {active && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Active
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-sm text-slate-500">{isCustom ? `Based on ${item.baseName}` : t.description}</p>
            </div>
            <div className="flex shrink-0 flex-col gap-2">
              {canEdit && !active && (
                <Button onClick={() => apply(t.key)} disabled={busy !== null}>
                  {busy === t.key ? "Applying…" : "Apply"}
                </Button>
              )}
              <div className="flex gap-1">
                <a href={previewUrl(t.key)} target="_blank" rel="noreferrer" title="Open preview" aria-label={`Preview ${t.name}`} className={iconBtn}>
                  <ExternalLink className="h-4 w-4" />
                </a>
                {canEdit && isCustom && (
                  <Link to={`/templates/${item.customId}`} title="Edit" aria-label={`Edit ${t.name}`} className={iconBtn}>
                    <Pencil className="h-4 w-4" />
                  </Link>
                )}
                {canEdit && isCustom && !active && (
                  <button title="Delete" aria-label={`Delete ${t.name}`} onClick={() => remove(item)} className="inline-flex flex-1 items-center justify-center rounded-lg border border-red-200 px-2 py-1.5 text-red-600 hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
                {canEdit && !isCustom && (
                  <Link to={`/templates/new?base=${t.key}`} title="Customize — make your own copy" aria-label={`Customize ${t.name}`} className={iconBtn}>
                    <Paintbrush className="h-4 w-4" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  };

  const grid = `grid gap-6 ${mobile ? "sm:grid-cols-2 xl:grid-cols-3" : "lg:grid-cols-2"}`;
  return (
    <div>
      <PageHeader
        title="Website Templates"
        subtitle="Live preview with your own content (empty sections show demo content). Pick one — the public website changes instantly."
        actions={
          <>
            <select aria-label="Website type" className={`${baseInputClass} w-56`} value={type} onChange={(e) => setShowType(e.target.value)}>
              <option value="all">All types ({TEMPLATES.length + custom.length} templates)</option>
              {SITE_TYPES.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label} {t.key === siteType ? "(your type)" : ""}
                </option>
              ))}
            </select>
            <div className="flex rounded-lg border border-slate-300 bg-white p-0.5">
              <button aria-label="Desktop preview" onClick={() => setMobile(false)} className={`rounded-md p-1.5 ${!mobile ? "bg-slate-900 text-white" : "text-slate-500"}`}>
                <Monitor className="h-4 w-4" />
              </button>
              <button aria-label="Mobile preview" onClick={() => setMobile(true)} className={`rounded-md p-1.5 ${mobile ? "bg-slate-900 text-white" : "text-slate-500"}`}>
                <Smartphone className="h-4 w-4" />
              </button>
            </div>
            {canEdit && (
              <Button onClick={() => navigate(`/templates/new?base=${startFrom}`)}>
                <Plus className="h-4 w-4" /> Add template
              </Button>
            )}
          </>
        }
      />
      <ErrorBox message={error} />
      {canEdit ? (
        <DemoPanel
          status={demo}
          onChange={() => {
            loadDemo();
            setFrameKey((k) => k + 1);
          }}
        />
      ) : (
        <p className="mb-4 text-sm text-amber-700">Only admins can change the template.</p>
      )}
      {type !== siteType && type !== "all" && (
        <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          These templates are for <b>{getSiteType(type).label}</b> websites. Your website is <b>{getSiteType(siteType).label}</b> — applying one will switch
          your website type to {getSiteType(type).label} (admin menus and website sections change with it).
        </p>
      )}
      {mine.length > 0 && (
        <>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">My templates</h2>
          <div className={`${grid} mb-8`}>{mine.map(renderCard)}</div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Ready-made templates</h2>
        </>
      )}
      <div className={grid}>{builtIn.map(renderCard)}</div>
    </div>
  );
}
