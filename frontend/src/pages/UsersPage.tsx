import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Pencil, Plus, ShieldCheck, Trash2, UserRound } from "lucide-react";
import { api, errorMessage, loadSession, saveSession } from "../lib/api";
import { useAuth } from "../lib/auth";
import { Badge, Button, Card, ErrorBox, inputClass, Modal, PageHeader, showToast } from "../components/ui";

type User = { id: number; name: string; email: string; role: "ADMIN" | "EDITOR"; is_active: boolean; last_login: string | null; created_on: string | null };
type Form = { id?: number; name: string; email: string; role: string; isActive: boolean; password: string };

const EMPTY: Form = { name: "", email: "", role: "EDITOR", isActive: true, password: "" };

const ROLE_HELP: Record<string, string> = {
  ADMIN: "Full access — content, settings, templates, users, demo & reset",
  EDITOR: "Content only — cannot change settings, templates or users"
};

/** "2026-10-29T15:47:01" -> "29 Oct 2026, 3:47 pm" */
export function formatDateTime(v: string | null): string {
  if (!v) return "—";
  const d = new Date(v.length === 10 ? v + "T00:00:00" : v);
  return isNaN(d.getTime()) ? "—" : d.toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function UsersPage() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<User[] | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () =>
    api
      .get<User[]>("/users")
      .then((r) => setUsers(r.data))
      .catch((e) => showToast(errorMessage(e), true));
  useEffect(() => {
    load();
  }, []);

  const isSelf = form?.id !== undefined && form.id === me?.userId;

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setBusy(true);
    setError(null);
    const body = { name: form.name.trim(), email: form.email.trim(), role: form.role, isActive: form.isActive, password: form.password || null };
    try {
      if (form.id) await api.put(`/users/${form.id}`, body);
      else await api.post("/users", body);
      if (isSelf) {
        // apna naam / email header me turant dikhe
        const s = loadSession();
        if (s) saveSession({ ...s, user: { ...s.user, name: body.name, email: body.email.toLowerCase() } });
      }
      setForm(null);
      showToast(form.id ? "User updated" : "User added");
      load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (u: User) => {
    if (!confirm(`Delete ${u.name} (${u.email})? They will not be able to log in.`)) return;
    try {
      await api.delete(`/users/${u.id}`);
      showToast("User deleted");
      load();
    } catch (err) {
      showToast(errorMessage(err), true);
    }
  };

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle="People who can log in to this admin panel"
        actions={
          <Button onClick={() => { setError(null); setForm({ ...EMPTY }); }}>
            <Plus className="h-4 w-4" /> Add User
          </Button>
        }
      />
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        {Object.entries(ROLE_HELP).map(([role, text]) => (
          <div key={role} className="flex items-start gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
            {role === "ADMIN" ? <ShieldCheck className="mt-0.5 h-4 w-4 text-brand-600" /> : <UserRound className="mt-0.5 h-4 w-4 text-slate-500" />}
            <span>
              <b>{role === "ADMIN" ? "Admin" : "Editor"}</b> <span className="text-slate-500">— {text.split(" — ")[1]}</span>
            </span>
          </div>
        ))}
      </div>
      <Card className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2.5 font-medium">Name</th>
              <th className="px-4 py-2.5 font-medium">Email</th>
              <th className="px-4 py-2.5 font-medium">Role</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium">Last login</th>
              <th className="px-4 py-2.5 font-medium">Created</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(users ?? []).map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-2.5 font-medium text-slate-800">
                  {u.name}
                  {u.id === me?.userId && <span className="ml-2 rounded bg-brand-50 px-1.5 py-0.5 text-[11px] font-medium text-brand-700">You</span>}
                </td>
                <td className="px-4 py-2.5 text-slate-600">{u.email}</td>
                <td className="px-4 py-2.5">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${u.role === "ADMIN" ? "bg-brand-50 text-brand-700" : "bg-slate-100 text-slate-600"}`}>
                    {u.role === "ADMIN" ? "Admin" : "Editor"}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <Badge on={u.is_active} onText="Active" offText="Disabled" />
                </td>
                <td className="px-4 py-2.5 text-slate-500">{u.last_login ? formatDateTime(u.last_login) : "Never"}</td>
                <td className="px-4 py-2.5 text-slate-500">{formatDateTime(u.created_on).split(",")[0]}</td>
                <td className="whitespace-nowrap px-4 py-2.5 text-right">
                  <button
                    title="Edit"
                    aria-label={`Edit ${u.name}`}
                    className="rounded p-1.5 text-slate-500 hover:bg-slate-100"
                    onClick={() => { setError(null); setForm({ id: u.id, name: u.name, email: u.email, role: u.role, isActive: u.is_active, password: "" }); }}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  {u.id !== me?.userId && (
                    <button title="Delete" aria-label={`Delete ${u.name}`} className="rounded p-1.5 text-red-500 hover:bg-red-50" onClick={() => remove(u)}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {users === null && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                  Loading…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      {form && (
        <Modal title={form.id ? (isSelf ? "Edit your account" : "Edit User") : "Add User"} onClose={() => setForm(null)}>
          <form onSubmit={save} className="space-y-4">
            <ErrorBox message={error} />
            <div>
              <label htmlFor="u-name" className="mb-1 block text-sm font-medium text-slate-700">Name</label>
              <input id="u-name" required maxLength={150} className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label htmlFor="u-email" className="mb-1 block text-sm font-medium text-slate-700">Email (login)</label>
              <input id="u-email" required type="email" maxLength={200} className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              {form.id && <p className="mt-1 text-xs text-slate-500">Changing email, role or status signs this user out of all devices.</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="u-role" className="mb-1 block text-sm font-medium text-slate-700">Role</label>
                <select id="u-role" disabled={isSelf} className={inputClass} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  <option value="EDITOR">Editor</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <label className={`mt-6 flex items-center gap-2 text-sm ${isSelf ? "text-slate-400" : "text-slate-700"}`}>
                <input type="checkbox" disabled={isSelf} checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Active
              </label>
            </div>
            <p className="-mt-2 text-xs text-slate-500">{ROLE_HELP[form.role]}</p>
            {isSelf ? (
              <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
                To change your own password use{" "}
                <Link to="/profile" className="font-medium text-brand-600 underline">
                  Profile
                </Link>
                .
              </p>
            ) : (
              <div>
                <label htmlFor="u-pass" className="mb-1 block text-sm font-medium text-slate-700">
                  Password {form.id ? <span className="font-normal text-slate-400">(blank = no change)</span> : <span className="font-normal text-slate-400">(min 8 characters)</span>}
                </label>
                <input
                  id="u-pass"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={100}
                  required={!form.id}
                  className={inputClass}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setForm(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? "Saving…" : "Save"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
