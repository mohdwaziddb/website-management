import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { api, errorMessage } from "../lib/api";
import { useModule } from "../lib/modules";
import { Row } from "../lib/types";
import FieldInput, { clearOptionCache } from "../components/FieldInput";
import { baseInputClass, Button, Card, ErrorBox, PageHeader, showToast } from "../components/ui";

type Values = Record<string, unknown>;

export default function ModuleFormPage() {
  const { key, id } = useParams();
  const isNew = id === "new";
  const m = useModule(key);
  const navigate = useNavigate();
  const [values, setValues] = useState<Values | null>(isNew ? { is_publish: true, is_active: true, sort_order: 0 } : null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!m || isNew) return;
    api
      .get<Row>(`/m/${m.key}/${id}`)
      .then((r) => setValues(r.data))
      .catch((e) => setError(errorMessage(e)));
  }, [m, id, isNew]);

  if (!m) return <div className="text-slate-500">Module not found</div>;

  const set = (name: string, v: unknown) => setValues((prev) => ({ ...prev, [name]: v }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!values) return;
    // sirf module ke fields + flags bhejo (id, created_on etc. nahi)
    const body: Values = {};
    m.fields.forEach((f) => (body[f.name] = values[f.name] ?? null));
    if (m.publishable) body.is_publish = values.is_publish === true;
    body.is_active = values.is_active !== false;
    if (m.sortable) body.sort_order = values.sort_order ?? 0;

    setBusy(true);
    setError(null);
    try {
      if (isNew) await api.post(`/m/${m.key}`, body);
      else await api.put(`/m/${m.key}/${id}`, body);
      clearOptionCache(m.key);
      showToast("Saved");
      navigate(`/m/${m.key}`);
    } catch (err) {
      setError(errorMessage(err));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title={`${isNew ? "Add" : "Edit"} ${m.label}`}
        actions={
          <Link to={`/m/${m.key}`}>
            <Button variant="ghost">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          </Link>
        }
      />
      {!values ? (
        error ? <ErrorBox message={error} /> : <div className="text-slate-500">Loading…</div>
      ) : (
        <form onSubmit={submit}>
          <Card className="space-y-5 p-5">
            <ErrorBox message={error} />
            {m.fields.map((f) => (
              <div key={f.name}>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  {f.label}
                  {f.required && <span className="text-red-500"> *</span>}
                </label>
                <FieldInput field={f} value={values[f.name]} onChange={(v) => set(f.name, v)} excludeId={isNew ? undefined : Number(id)} />
                {f.help && <p className="mt-1 text-xs text-slate-500">{f.help}</p>}
              </div>
            ))}

            <div className="flex flex-wrap items-center gap-6 border-t border-slate-200 pt-4">
              {m.sortable && (
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  Display order
                  <input
                    type="number"
                    className={`${baseInputClass} w-24`}
                    value={String(values.sort_order ?? 0)}
                    onChange={(e) => set("sort_order", e.target.value)}
                  />
                </label>
              )}
              {m.publishable && (
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" className="h-4 w-4" checked={values.is_publish === true} onChange={(e) => set("is_publish", e.target.checked)} />
                  Publish on website
                </label>
              )}
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" className="h-4 w-4" checked={values.is_active !== false} onChange={(e) => set("is_active", e.target.checked)} />
                Active
              </label>
            </div>
          </Card>
          <div className="mt-4 flex justify-end gap-2">
            <Link to={`/m/${m.key}`}>
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={busy}>
              {busy ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
