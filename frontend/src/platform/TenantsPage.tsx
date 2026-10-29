import { FormEvent, useEffect, useState } from "react";
import { ExternalLink, Globe, KeyRound, Pencil, Plus, Settings2 } from "lucide-react";
import { api, errorMessage } from "../lib/api";
import { BASE_DOMAIN, tenantUrl } from "../lib/tenant";
import { Tenant } from "../lib/types";
import { SITE_TYPES } from "../site/siteTypes";
import { templatesFor } from "../site/templates";
import { Badge, Button, Card, ErrorBox, inputClass, Modal, PageHeader, showToast } from "../components/ui";

type CreateForm = {
  subdomain: string;
  customDomain: string;
  code: string;
  name: string;
  contactEmail: string;
  siteType: string;
  template: string;
  importDemo: boolean;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
};
const EMPTY: CreateForm = {
  subdomain: "",
  customDomain: "",
  code: "",
  name: "",
  contactEmail: "",
  siteType: "school",
  template: "classic",
  importDemo: true,
  adminName: "",
  adminEmail: "",
  adminPassword: ""
};

const SUB_PATTERN = "[a-z0-9]([a-z0-9\\-]*[a-z0-9])?";

/** "https://www.Xyz.com/" -> "xyz.com" (backend bhi yahi karta hai, ye sirf typing aasan karta hai) */
export function cleanDomain(v: string): string {
  return v.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "");
}

/** Blank string backend ko null jaye */
const orNull = (v: string | null | undefined) => (v && v.trim() ? v.trim() : null);

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

function DomainFields({ subdomain, customDomain, onChange }: { subdomain: string; customDomain: string; onChange: (p: { subdomain?: string; customDomain?: string }) => void }) {
  return (
    <div className="space-y-3 rounded-lg border border-slate-200 p-3">
      <div className="text-xs text-slate-500">Kam se kam ek chahiye. Client ka apna domain ho to subdomain khaali chhod sakte hain.</div>
      <Field label="Subdomain">
        <div className="flex items-center gap-2">
          <input pattern={SUB_PATTERN} className={inputClass} value={subdomain} placeholder="dbwebsite" onChange={(e) => onChange({ subdomain: e.target.value.toLowerCase().trim() })} />
          <span className="whitespace-nowrap text-sm text-slate-500">.{BASE_DOMAIN}</span>
        </div>
      </Field>
      <Field label="Custom domain (client ka apna)" hint="DNS: client ka domain (A record / CNAME) hamare server par point hona chahiye.">
        <input className={inputClass} value={customDomain} placeholder="xyz.com" onChange={(e) => onChange({ customDomain: e.target.value })} onBlur={(e) => onChange({ customDomain: cleanDomain(e.target.value) })} />
      </Field>
    </div>
  );
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [create, setCreate] = useState<CreateForm | null>(null);
  const [edit, setEdit] = useState<Tenant | null>(null);
  const [reset, setReset] = useState<{ tenant: Tenant; email: string; password: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () => api.get<Tenant[]>("/platform/tenants").then((r) => setTenants(r.data));
  useEffect(() => {
    load();
  }, []);

  const run = async (fn: () => Promise<unknown>, done: string) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      showToast(done);
      setCreate(null);
      setEdit(null);
      setReset(null);
      load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const submitCreate = (e: FormEvent) => {
    e.preventDefault();
    const c = create!;
    if (!c.subdomain.trim() && !c.customDomain.trim()) {
      setError("Subdomain or custom domain is required");
      return;
    }
    run(
      () =>
        api.post("/platform/tenants", {
          ...c,
          code: orNull(c.code),
          subdomain: orNull(c.subdomain),
          customDomain: orNull(cleanDomain(c.customDomain)),
          contactEmail: orNull(c.contactEmail)
        }),
      "Website created"
    );
  };

  const submitEdit = (e: FormEvent) => {
    e.preventDefault();
    const t = edit!;
    run(
      () =>
        api.put(`/platform/tenants/${t.id}`, {
          name: t.name,
          contactEmail: orNull(t.contactEmail),
          subdomain: orNull(t.subdomain),
          customDomain: orNull(cleanDomain(t.customDomain ?? "")),
          active: t.active
        }),
      "Saved"
    );
  };

  const submitReset = (e: FormEvent) => {
    e.preventDefault();
    run(() => api.post(`/platform/tenants/${reset!.tenant.id}/reset-admin`, { email: reset!.email, password: reset!.password }), "Admin password reset");
  };

  return (
    <div>
      <PageHeader
        title="Websites (Tenants)"
        subtitle={`Subdomain (*.${BASE_DOMAIN}) ya client ka apna domain — har website ka alag database`}
        actions={
          <Button onClick={() => { setError(null); setCreate({ ...EMPTY }); }}>
            <Plus className="h-4 w-4" /> New Website
          </Button>
        }
      />
      <Card className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2.5 font-medium">Website</th>
              <th className="px-4 py-2.5 font-medium">Address</th>
              <th className="px-4 py-2.5 font-medium">Database</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium">Created</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tenants.map((t) => (
              <tr key={t.id}>
                <td className="px-4 py-2.5">
                  <div className="font-medium text-slate-800">{t.name}</div>
                  <div className="text-xs text-slate-500">{t.contactEmail}</div>
                </td>
                <td className="space-y-0.5 px-4 py-2.5">
                  {t.subdomain && (
                    <a href={tenantUrl({ subdomain: t.subdomain, customDomain: null })} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-brand-600 hover:underline">
                      {t.subdomain}.{BASE_DOMAIN} <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                  {t.customDomain && (
                    <a href={tenantUrl({ subdomain: null, customDomain: t.customDomain })} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-emerald-700 hover:underline">
                      <Globe className="h-3.5 w-3.5" /> {t.customDomain}
                    </a>
                  )}
                  <a href={tenantUrl(t, "/admin")} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-slate-500 hover:underline">
                    <Settings2 className="h-3 w-3" /> admin panel
                  </a>
                </td>
                <td className="px-4 py-2.5 font-mono text-xs text-slate-500">{t.dbName}</td>
                <td className="px-4 py-2.5">
                  <Badge on={t.active} onText="Active" offText="Suspended" />
                </td>
                <td className="px-4 py-2.5 text-slate-500">{t.createdOn.slice(0, 10)}</td>
                <td className="whitespace-nowrap px-4 py-2.5 text-right">
                  <button className="rounded p-1.5 text-slate-500 hover:bg-slate-100" title="Edit" onClick={() => { setError(null); setEdit({ ...t }); }}>
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    className="rounded p-1.5 text-slate-500 hover:bg-slate-100"
                    title="Reset admin password"
                    onClick={() => { setError(null); setReset({ tenant: t, email: "", password: "" }); }}
                  >
                    <KeyRound className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
            {tenants.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                  No websites yet — create the first one
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      {create && (
        <Modal title="New Website" onClose={() => setCreate(null)}>
          <form onSubmit={submitCreate} className="space-y-4">
            <ErrorBox message={error} />
            <Field label="Website / School name">
              <input required maxLength={200} className={inputClass} value={create.name} onChange={(e) => setCreate({ ...create, name: e.target.value })} />
            </Field>
            <DomainFields subdomain={create.subdomain} customDomain={create.customDomain} onChange={(p) => setCreate({ ...create, ...p })} />
            <Field label="Code (optional)" hint={`Database ka naam: wm_t_<code>. Khaali = subdomain / domain se ban jayega. Baad me nahi badalta.`}>
              <input pattern={SUB_PATTERN} className={inputClass} value={create.code} onChange={(e) => setCreate({ ...create, code: e.target.value.toLowerCase().trim() })} />
            </Field>
            <Field label="Contact email">
              <input type="email" className={inputClass} value={create.contactEmail} onChange={(e) => setCreate({ ...create, contactEmail: e.target.value })} />
            </Field>
            <Field label="Website type" hint="Admin panel ke menus (Menu Items, Properties, Doctors …) isi se.">
              <select
                className={inputClass}
                value={create.siteType}
                onChange={(e) => setCreate({ ...create, siteType: e.target.value, template: templatesFor(e.target.value)[0].key })}
              >
                {SITE_TYPES.map((t) => (
                  <option key={t.key} value={t.key}>{t.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Starting template" hint="Website admin baad me Templates page se badal sakta hai.">
              <select className={inputClass} value={create.template} onChange={(e) => setCreate({ ...create, template: e.target.value })}>
                {templatesFor(create.siteType).map((t) => (
                  <option key={t.key} value={t.key}>{t.name} — {t.description}</option>
                ))}
              </select>
            </Field>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={create.importDemo} onChange={(e) => setCreate({ ...create, importDemo: e.target.checked })} />
              Import demo content (sample text + photos, admin baad me hata sakta hai)
            </label>
            <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500">First admin of this website</div>
            <Field label="Admin name">
              <input required maxLength={150} className={inputClass} value={create.adminName} onChange={(e) => setCreate({ ...create, adminName: e.target.value })} />
            </Field>
            <Field label="Admin email">
              <input required type="email" className={inputClass} value={create.adminEmail} onChange={(e) => setCreate({ ...create, adminEmail: e.target.value })} />
            </Field>
            <Field label="Admin password (min 8)">
              <input required type="password" minLength={8} maxLength={100} className={inputClass} value={create.adminPassword} onChange={(e) => setCreate({ ...create, adminPassword: e.target.value })} />
            </Field>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setCreate(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? (create.importDemo ? "Creating website + demo…" : "Creating database…") : "Create"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {edit && (
        <Modal title={`Edit ${edit.name}`} onClose={() => setEdit(null)}>
          <form onSubmit={submitEdit} className="space-y-4">
            <ErrorBox message={error} />
            <Field label="Name">
              <input required maxLength={200} className={inputClass} value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
            </Field>
            <DomainFields subdomain={edit.subdomain ?? ""} customDomain={edit.customDomain ?? ""} onChange={(p) => setEdit({ ...edit, ...p })} />
            <Field label="Contact email">
              <input type="email" className={inputClass} value={edit.contactEmail ?? ""} onChange={(e) => setEdit({ ...edit, contactEmail: e.target.value })} />
            </Field>
            <p className="text-xs text-slate-500">
              Code <b>{edit.code}</b> / DB <b>{edit.dbName}</b> kabhi nahi badalte.
            </p>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={edit.active} onChange={(e) => setEdit({ ...edit, active: e.target.checked })} />
              Active (unchecked = website + admin panel band)
            </label>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setEdit(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={busy}>
                Save
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {reset && (
        <Modal title={`Reset admin · ${reset.tenant.name}`} onClose={() => setReset(null)}>
          <form onSubmit={submitReset} className="space-y-4">
            <ErrorBox message={error} />
            <p className="text-sm text-slate-500">Existing user ka password badlega; email na mile to naya Admin banega.</p>
            <Field label="Admin email">
              <input required type="email" className={inputClass} value={reset.email} onChange={(e) => setReset({ ...reset, email: e.target.value })} />
            </Field>
            <Field label="New password (min 8)">
              <input required type="password" minLength={8} maxLength={100} className={inputClass} value={reset.password} onChange={(e) => setReset({ ...reset, password: e.target.value })} />
            </Field>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setReset(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={busy}>
                Reset
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
