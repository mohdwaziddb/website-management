import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Clock, Save } from "lucide-react";
import { api, errorMessage } from "../lib/api";
import { useModule } from "../lib/modules";
import { relativeTime } from "../lib/time";
import { ModuleDef, Row } from "../lib/types";
import FieldInput, { clearOptionCache } from "../components/FieldInput";
import { ModuleIcon } from "../components/Icon";
import { Button, confirmDialog, EmptyState, ErrorBox, FormField, inputClass, PageHeader, SectionCard, showToast, Skeleton, Switch } from "../components/ui";

type Values = Record<string, unknown>;

/** Server ko sirf module ke fields + flags (id, created_on etc. nahi) — testable */
export function formBody(m: ModuleDef, values: Values): Values {
  const body: Values = {};
  m.fields.forEach((f) => (body[f.name] = values[f.name] ?? null));
  if (m.publishable) body.is_publish = values.is_publish === true;
  body.is_active = values.is_active !== false;
  if (m.sortable) body.sort_order = values.sort_order ?? 0;
  return body;
}

/** Kuch badla hai? (unsaved changes warning) */
export function isDirty(m: ModuleDef, initial: Values | null, current: Values | null): boolean {
  if (!initial || !current) return false;
  const norm = (v: unknown) => (v === undefined || v === "" ? null : typeof v === "number" ? String(v) : v);
  const a = formBody(m, initial);
  const b = formBody(m, current);
  return Object.keys(b).some((k) => JSON.stringify(norm(a[k])) !== JSON.stringify(norm(b[k])));
}

export default function ModuleFormPage() {
  const { key, id } = useParams();
  const isNew = id === "new";
  const m = useModule(key);
  const navigate = useNavigate();
  const initial = useRef<Values | null>(isNew ? { is_publish: true, is_active: true, sort_order: 0 } : null);
  const [values, setValues] = useState<Values | null>(initial.current);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!m || isNew) return;
    api
      .get<Row>(`/m/${m.key}/${id}`)
      .then((r) => {
        initial.current = r.data;
        setValues(r.data);
      })
      .catch((e) => setError(errorMessage(e)));
  }, [m, id, isNew]);

  const dirty = !!m && isDirty(m, initial.current, values);

  // tab band / refresh par unsaved warning
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  // Ctrl+S = save
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        formRef.current?.requestSubmit();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);

  const back = useCallback(async () => {
    if (!m) return;
    if (dirty && !(await confirmDialog({ title: "Discard changes?", message: "You have unsaved changes on this page.", confirmText: "Discard", cancelText: "Keep editing", danger: true }))) return;
    navigate(`/m/${m.key}`);
  }, [dirty, m, navigate]);

  if (!m) return <EmptyState title="Menu not found" text="This section is not available for your website type." />;

  const set = (name: string, v: unknown) => setValues((prev) => ({ ...prev, [name]: v }));
  const singular = m.label.replace(/s$/, "");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!values) return;
    setBusy(true);
    setError(null);
    try {
      const body = formBody(m, values);
      if (isNew) await api.post(`/m/${m.key}`, body);
      else await api.put(`/m/${m.key}/${id}`, body);
      clearOptionCache(m.key);
      initial.current = values;
      showToast(isNew ? `${singular} added` : "Changes saved");
      navigate(`/m/${m.key}`);
    } catch (err) {
      setError(errorMessage(err));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setBusy(false);
    }
  };

  const title = values && !isNew ? String(values[m.titleField] ?? "") : "";

  return (
    <div>
      <PageHeader
        icon={<ModuleIcon name={m.icon} className="h-5 w-5" />}
        crumbs={[{ label: m.label, to: `/m/${m.key}` }, { label: isNew ? "New" : "Edit" }]}
        title={isNew ? `Add ${singular}` : title || `Edit ${singular}`}
        subtitle={dirty ? <span className="font-medium text-amber-600">● Unsaved changes</span> : isNew ? "Fill the details and save" : "Edit the details and save"}
        actions={
          <Button variant="ghost" onClick={back}>
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        }
      />
      {!values ? (
        error ? (
          <ErrorBox message={error} />
        ) : (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
            <Skeleton className="h-96" />
            <Skeleton className="h-48" />
          </div>
        )
      ) : (
        <form ref={formRef} onSubmit={submit} className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
          <SectionCard title="Details" description={`Fields marked * are required`} bodyClassName="space-y-5 p-5">
            <ErrorBox message={error} />
            {m.fields.map((f) => (
              <FormField key={f.name} label={f.label} required={f.required} help={f.help}>
                <FieldInput field={f} value={values[f.name]} onChange={(v) => set(f.name, v)} excludeId={isNew ? undefined : Number(id)} />
              </FormField>
            ))}
          </SectionCard>

          <div className="space-y-4 xl:sticky xl:top-24">
            <SectionCard title="Publishing" bodyClassName="space-y-4 p-5">
              {m.publishable && (
                <Switch label="Publish on website" description={values.is_publish === true ? "Visible to visitors" : "Saved as draft"} checked={values.is_publish === true} onChange={(v) => set("is_publish", v)} />
              )}
              <Switch label="Active" description="Inactive records are hidden everywhere" checked={values.is_active !== false} onChange={(v) => set("is_active", v)} />
              {m.sortable && (
                <FormField label="Display order" help="Smaller number shows first">
                  <input type="number" aria-label="Display order" className={inputClass} value={String(values.sort_order ?? 0)} onChange={(e) => set("sort_order", e.target.value)} />
                </FormField>
              )}
              {!isNew && !!values.updated_on && (
                <p className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Clock className="h-3.5 w-3.5" /> Last updated {relativeTime(String(values.updated_on))}
                </p>
              )}
              <div className="flex flex-col gap-2 border-t border-slate-100 pt-4">
                <Button type="submit" size="lg" loading={busy}>
                  <Save className="h-4 w-4" /> {busy ? "Saving…" : "Save"}
                </Button>
                <Button type="button" variant="secondary" onClick={back}>
                  Cancel
                </Button>
                <p className="text-center text-[11px] text-slate-400">Tip: press Ctrl + S to save</p>
              </div>
            </SectionCard>
          </div>
        </form>
      )}
    </div>
  );
}
