import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, RotateCcw, Settings as SettingsIcon } from "lucide-react";
import { api, errorMessage } from "../lib/api";
import { useAuth } from "../lib/auth";
import { FieldDef } from "../lib/types";
import { getSiteType } from "../site/siteTypes";
import { getTemplate, templatesFor } from "../site/templates";
import type { CustomTemplateRow } from "../site/templates/options";
import { useReloadModules } from "../lib/modules";
import FieldInput from "../components/FieldInput";
import { Button, Card, ErrorBox, InfoBox, inputClass, Modal, PageHeader, SectionCard, showToast } from "../components/ui";

/** Website Type / Template dropdown me key ki jagah naam */
const OPTION_LABELS: Record<string, (o: string) => string> = {
  site_type: (o) => getSiteType(o).label,
  template: (o) => {
    const t = getTemplate(o);
    return `${t.name} — ${t.description}`;
  }
};

/** Template field Website Type ke theek neeche, aur dropdown me sirf usi type ke templates (custom bhi) */
function arrangeFields(fields: FieldDef[], siteType: string, custom: CustomTemplateRow[]): FieldDef[] {
  const template = fields.find((f) => f.name === "template");
  const rest = fields.filter((f) => f.name !== "template");
  if (!template) return fields;
  const options = [...custom.filter((c) => c.type === siteType).map((c) => c.key), ...templatesFor(siteType).map((t) => t.key)];
  const filtered = { ...template, options };
  const at = rest.findIndex((f) => f.name === "site_type");
  return [...rest.slice(0, at + 1), filtered, ...rest.slice(at + 1)];
}

/** Saara content + settings saaf — website ka naam type karke confirm (GitHub jaisa) */
function ResetWebsite({ siteName }: { siteName: string }) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [importDemo, setImportDemo] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.post("/website/reset", { confirm, importDemo });
      showToast(importDemo ? "Website reset with fresh demo content" : "Website reset — it's a blank slate now");
      setOpen(false);
      setTimeout(() => window.location.reload(), 600);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="mt-8 border-red-200 bg-red-50/30 p-5">
      <div className="flex flex-wrap items-center gap-4">
        <span className="rounded-xl bg-red-50 p-3 text-red-600">
          <AlertTriangle className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-slate-900">Reset website</div>
          <p className="text-sm text-slate-500">Deletes all content (sliders, pages, gallery, blogs …), uploaded files and settings. Users and logins stay. This cannot be undone.</p>
        </div>
        <Button
          type="button"
          variant="danger"
          onClick={() => {
            setConfirm("");
            setError(null);
            setOpen(true);
          }}
        >
          <RotateCcw className="h-4 w-4" /> Reset website
        </Button>
      </div>
      {open && (
        <Modal title="Reset website?" onClose={() => setOpen(false)}>
          <form onSubmit={reset} className="space-y-4">
            <ErrorBox message={error} />
            <p className="text-sm text-slate-600">
              Type <b className="select-all text-slate-900">{siteName}</b> to confirm.
            </p>
            <input autoFocus className={inputClass} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder={siteName} />
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={importDemo} onChange={(e) => setImportDemo(e.target.checked)} />
              Start again with fresh demo content
            </label>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="danger" disabled={busy || confirm.trim().toLowerCase() !== siteName.trim().toLowerCase()}>
                {busy ? "Resetting…" : "I understand, reset"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </Card>
  );
}

/** Settings ko sections me baanto (form lamba na lage) — jo kisi section me nahi wo "More" me */
export const SETTING_SECTIONS: { title: string; description: string; fields: string[] }[] = [
  { title: "Website & design", description: "Name, type, template and branding", fields: ["site_name", "tagline", "site_type", "template", "primary_color", "logo", "favicon", "about_short"] },
  { title: "Contact details", description: "Shown in the header, footer and contact page", fields: ["email", "phone", "whatsapp", "address", "map_embed_url", "opening_hours", "affiliation_no"] },
  { title: "Social media", description: "Icons in the footer link to these", fields: ["facebook", "instagram", "youtube", "twitter", "linkedin"] },
  { title: "Buttons & footer", description: "Main call-to-action and footer note", fields: ["cta_text", "cta_link", "footer_text"] },
  {
    title: "SEO & Google",
    description: "How your website looks on Google and when shared on WhatsApp / Facebook",
    fields: ["seo_title", "seo_description", "share_image", "google_analytics_id", "google_site_verification"]
  }
];

export function groupSettings(fields: FieldDef[]): { title: string; description: string; fields: FieldDef[] }[] {
  const used = new Set(SETTING_SECTIONS.flatMap((x) => x.fields));
  const out = SETTING_SECTIONS.map((sec) => ({ ...sec, fields: fields.filter((f) => sec.fields.includes(f.name)) }));
  const rest = fields.filter((f) => !used.has(f.name));
  if (rest.length) out.push({ title: "More", description: "Other settings", fields: rest });
  return out.filter((x) => x.fields.length);
}

export default function SettingsPage() {
  const { user } = useAuth();
  const canEdit = user?.role === "ADMIN";
  const [fields, setFields] = useState<FieldDef[]>([]);
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [savedType, setSavedType] = useState<string>("");
  const [custom, setCustom] = useState<CustomTemplateRow[]>([]);
  const reloadModules = useReloadModules();

  useEffect(() => {
    api.get("/settings").then((r) => {
      setFields(r.data.fields);
      setValues(r.data.values);
      setSavedType(r.data.values.site_type);
    });
    api
      .get<CustomTemplateRow[]>("/templates/custom")
      .then((r) => setCustom(Array.isArray(r.data) ? r.data : []))
      .catch(() => setCustom([]));
  }, []);

  const change = (name: string, v: unknown) =>
    setValues((p) => {
      const next = { ...p, [name]: v };
      // type badla => template us type ka pehla (agar pehle se usi type ka na ho)
      const currentType = custom.find((c) => c.key === p.template)?.type ?? getTemplate(String(p.template)).type;
      if (name === "site_type" && typeof v === "string" && currentType !== v) {
        next.template = templatesFor(v)[0]?.key;
      }
      return next;
    });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await api.put("/settings", values);
      setValues(r.data);
      if (r.data.site_type !== savedType) {
        setSavedType(r.data.site_type);
        await reloadModules();
        showToast(`Website type is now ${getSiteType(r.data.site_type).label} — admin menus updated`);
      } else {
        showToast("Settings saved");
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <form onSubmit={submit}>
        <PageHeader icon={<SettingsIcon className="h-5 w-5" />} title="Website Settings" subtitle="Website info shown on the public site" />
        <div className="space-y-6">
          <ErrorBox message={error} />
          {!canEdit && <InfoBox tone="amber">Only admins can change settings.</InfoBox>}
          {groupSettings(arrangeFields(fields, String(values.site_type ?? ""), custom)).map((sec) => (
          <SectionCard key={sec.title} title={sec.title} description={sec.description}>
          <fieldset disabled={!canEdit} className="grid min-w-0 grid-cols-1 gap-5 sm:grid-cols-2">
            {sec.fields.map((f) => (
              <div key={f.name} className={f.type === "RICHTEXT" || f.type === "TEXTAREA" ? "sm:col-span-2" : ""}>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">{f.label}</label>
                <FieldInput
                  field={f}
                  value={values[f.name]}
                  optionLabel={f.name === "template" ? (o) => custom.find((c) => c.key === o)?.name.concat(" (custom)") ?? OPTION_LABELS.template(o) : OPTION_LABELS[f.name]}
                  onChange={(v) => change(f.name, v)}
                />
                {f.name === "template" ? (
                  <p className="mt-1 text-xs text-slate-500">
                    Sirf {getSiteType(String(values.site_type)).label} ke templates.{" "}
                    <Link to="/templates" className="font-medium text-brand-600 underline">
                      Live preview dekho
                    </Link>
                  </p>
                ) : (
                  f.help && <p className="mt-1 text-xs text-slate-500">{f.help}</p>
                )}
              </div>
            ))}
          </fieldset>
          </SectionCard>
          ))}
        </div>
        {canEdit && (
          <div className="sticky bottom-0 z-10 -mx-4 mt-6 flex items-center justify-end gap-3 border-t border-slate-200 bg-white/90 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border">
            <span className="mr-auto hidden text-sm text-slate-500 sm:block">Changes go live on your website as soon as you save.</span>
            <Button type="submit" size="lg" loading={busy}>
              {busy ? "Saving…" : "Save Settings"}
            </Button>
          </div>
        )}
      </form>
      {canEdit && <ResetWebsite siteName={String(values.site_name ?? "")} />}
    </div>
  );
}
