import { FormEvent, useEffect, useState } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { api, errorMessage } from "../lib/api";
import { useAuth } from "../lib/auth";
import { FieldDef } from "../lib/types";
import { getSiteType } from "../site/siteTypes";
import { getTemplate } from "../site/templates";
import FieldInput from "../components/FieldInput";
import { Button, Card, ErrorBox, inputClass, Modal, PageHeader, showToast } from "../components/ui";

/** Website Type / Template dropdown me key ki jagah naam */
const OPTION_LABELS: Record<string, (o: string) => string> = {
  site_type: (o) => getSiteType(o).label,
  template: (o) => {
    const t = getTemplate(o);
    return `${t.name} (${getSiteType(t.type).label})`;
  }
};

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
    <Card className="mt-8 border-red-200 p-5">
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

export default function SettingsPage() {
  const { user } = useAuth();
  const canEdit = user?.role === "ADMIN";
  const [fields, setFields] = useState<FieldDef[]>([]);
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get("/settings").then((r) => {
      setFields(r.data.fields);
      setValues(r.data.values);
    });
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await api.put("/settings", values);
      setValues(r.data);
      showToast("Settings saved");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <form onSubmit={submit}>
        <PageHeader title="Website Settings" subtitle="Website info shown on the public site" />
        <Card className="space-y-5 p-5">
          <ErrorBox message={error} />
          {!canEdit && <p className="text-sm text-amber-700">Only admins can change settings.</p>}
          <fieldset disabled={!canEdit} className="grid gap-5 sm:grid-cols-2">
            {fields.map((f) => (
              <div key={f.name} className={f.type === "RICHTEXT" || f.type === "TEXTAREA" ? "sm:col-span-2" : ""}>
                <label className="mb-1 block text-sm font-medium text-slate-700">{f.label}</label>
                <FieldInput field={f} value={values[f.name]} optionLabel={OPTION_LABELS[f.name]} onChange={(v) => setValues((p) => ({ ...p, [f.name]: v }))} />
                {f.help && <p className="mt-1 text-xs text-slate-500">{f.help}</p>}
              </div>
            ))}
          </fieldset>
        </Card>
        {canEdit && (
          <div className="mt-4 flex justify-end">
            <Button type="submit" disabled={busy}>
              {busy ? "Saving…" : "Save Settings"}
            </Button>
          </div>
        )}
      </form>
      {canEdit && <ResetWebsite siteName={String(values.site_name ?? "")} />}
    </div>
  );
}
