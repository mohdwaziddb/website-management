import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Database, ExternalLink, Monitor, Smartphone, Trash2, Wand2 } from "lucide-react";
import { api, errorMessage } from "../lib/api";
import { useAuth } from "../lib/auth";
import { getSiteType, SITE_TYPES } from "../site/siteTypes";
import { templatesFor } from "../site/templates";
import { baseInputClass, Button, Card, ErrorBox, PageHeader, showToast } from "../components/ui";

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
            : "One click fills sliders, services, team, gallery, testimonials, FAQs and more with sample content and photos — then just edit."}
        </p>
        <ErrorBox message={error} />
      </div>
      {status.hasDemo ? (
        <Button variant="secondary" disabled={busy} onClick={() => confirm("Remove all demo content? Your own content stays.") && run(() => api.delete("/demo"), "Demo content removed")}>
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

export default function TemplatesPage() {
  const { user } = useAuth();
  const canEdit = user?.role === "ADMIN";
  const [current, setCurrent] = useState<string | null>(null);
  const [siteType, setSiteType] = useState<string>("school");
  const [showType, setShowType] = useState<string | null>(null);
  const [demo, setDemo] = useState<DemoStatus | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mobile, setMobile] = useState(false);
  const [frameKey, setFrameKey] = useState(0);

  const loadDemo = () => {
    if (canEdit) api.get<DemoStatus>("/demo").then((r) => setDemo(r.data)).catch(() => setDemo(null));
  };

  useEffect(() => {
    api
      .get("/settings")
      .then((r) => {
        setCurrent(r.data.values.template);
        setSiteType(r.data.values.site_type);
      })
      .catch((e) => setError(errorMessage(e)));
    loadDemo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const apply = async (key: string) => {
    setBusy(key);
    setError(null);
    try {
      const r = await api.put("/settings", { template: key });
      setCurrent(r.data.template);
      showToast("Template applied — your website is updated");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const type = showType ?? siteType;
  const list = templatesFor(type);

  return (
    <div>
      <PageHeader
        title="Website Templates"
        subtitle="Live preview with your own content (empty sections show demo content). Pick one — the public website changes instantly."
        actions={
          <>
            <select aria-label="Website type" className={`${baseInputClass} w-56`} value={type} onChange={(e) => setShowType(e.target.value)}>
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
      {type !== siteType && (
        <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          These templates are designed for <b>{getSiteType(type).label}</b> websites. Your website type is <b>{getSiteType(siteType).label}</b> — change it in Website Settings to get matching menus.
        </p>
      )}
      <div className={`grid gap-6 ${mobile ? "sm:grid-cols-2 xl:grid-cols-3" : "lg:grid-cols-2"}`}>
        {list.map((t, n) => {
          const active = current === t.key;
          return (
            <motion.div key={t.key + frameKey} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: n * 0.06 }}>
              <Card className={`overflow-hidden ${active ? "ring-2 ring-brand-500" : ""}`}>
                <div className={mobile ? "mx-auto max-w-[260px] p-3" : ""}>
                  <LivePreview src={previewUrl(t.key)} mobile={mobile} />
                </div>
                <div className="flex items-start gap-3 border-t border-slate-200 p-4">
                  <div className="flex gap-1 pt-1">
                    {[t.colors.primary, t.colors.accent].map((c) => (
                      <span key={c} className="h-4 w-4 rounded-full ring-1 ring-black/10" style={{ background: c }} />
                    ))}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 font-semibold text-slate-900">
                      {t.name}
                      {t.dark && <span className="rounded bg-slate-900 px-1.5 py-0.5 text-[10px] font-medium text-white">DARK</span>}
                      {active && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Active
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-slate-500">{t.description}</p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-2">
                    <a href={previewUrl(t.key)} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
                      <ExternalLink className="h-3.5 w-3.5" /> Preview
                    </a>
                    {canEdit && !active && (
                      <Button onClick={() => apply(t.key)} disabled={busy !== null}>
                        {busy === t.key ? "Applying…" : "Apply"}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
