import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Pencil, Plus, ShieldCheck, Trash2, UserRound, Users as UsersIcon } from "lucide-react";
import { api, errorMessage, loadSession, saveSession } from "../lib/api";
import { useAuth } from "../lib/auth";
import { Avatar, Badge, Button, confirmDialog, EmptyState, ErrorBox, inputClass, Modal, PageHeader, Pill, showToast } from "../components/ui";
import DataTable, { Column } from "../components/DataTable";
import { relativeTime } from "../lib/time";

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
  const [search, setSearch] = useState("");
  const q = search.toLowerCase();
  const visible = users && (q ? users.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) : users);

  const edit = (u: User) => {
    setError(null);
    setForm({ id: u.id, name: u.name, email: u.email, role: u.role, isActive: u.is_active, password: "" });
  };

  const columns: Column<User>[] = [
    {
      key: "name",
      header: "User",
      hideable: false,
      render: (u) => (
        <span className="flex items-center gap-3">
          <Avatar name={u.name} size="sm" />
          <span>
            <span className="flex items-center gap-2 font-medium text-slate-900">
              {u.name}
              {u.id === me?.userId && <Pill tone="blue">You</Pill>}
            </span>
            <span className="block text-xs text-slate-500">{u.email}</span>
          </span>
        </span>
      ),
      exportValue: (u) => u.name
    },
    { key: "email", header: "Email", render: (u) => u.email, exportValue: (u) => u.email },
    { key: "role", header: "Role", render: (u) => <Pill tone={u.role === "ADMIN" ? "violet" : "slate"}>{u.role === "ADMIN" ? "Admin" : "Editor"}</Pill>, exportValue: (u) => (u.role === "ADMIN" ? "Admin" : "Editor") },
    { key: "status", header: "Status", align: "center", render: (u) => <Badge on={u.is_active} onText="Active" offText="Disabled" />, exportValue: (u) => (u.is_active ? "Active" : "Disabled") },
    {
      key: "last_login",
      header: "Last login",
      className: "whitespace-nowrap text-slate-500",
      render: (u) => <span title={u.last_login ? formatDateTime(u.last_login) : undefined}>{u.last_login ? relativeTime(u.last_login) : "Never"}</span>,
      exportValue: (u) => (u.last_login ? formatDateTime(u.last_login) : "Never")
    },
    { key: "created_on", header: "Created", className: "whitespace-nowrap text-slate-500", render: (u) => formatDateTime(u.created_on).split(",")[0], exportValue: (u) => formatDateTime(u.created_on).split(",")[0] }
  ];

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
    const ok = await confirmDialog({
      title: `Delete ${u.name}?`,
      message: `${u.email} will no longer be able to log in to this admin panel. This cannot be undone.`,
      confirmText: "Delete user",
      danger: true
    });
    if (!ok) return;
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
        icon={<UsersIcon className="h-5 w-5" />}
        title="Users"
        subtitle="People who can log in to this admin panel"
      />
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        {Object.entries(ROLE_HELP).map(([role, text]) => (
          <div key={role} className="flex items-start gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
            {role === "ADMIN" ? <ShieldCheck className="mt-0.5 h-4 w-4 text-brand-600" /> : <UserRound className="mt-0.5 h-4 w-4 text-slate-500" />}
            <span>
              <b>{role === "ADMIN" ? "Admin" : "Editor"}</b> <span className="text-slate-500">— {text.split(" — ")[1]}</span>
            </span>
          </div>
        ))}
      </div>
      <DataTable<User>
        id="users"
        title="Admin users"
        columns={columns}
        rows={visible}
        rowKey={(u) => u.id}
        loading={users === null}
        search={{ value: search, onChange: setSearch, placeholder: "Search name or email" }}
        toolbar={
          <Button
            onClick={() => {
              setError(null);
              setForm({ ...EMPTY });
            }}
          >
            <Plus className="h-4 w-4" /> Add User
          </Button>
        }
        onExport={() => Promise.resolve(visible ?? [])}
        exportName="users"
        rowClassName={(u) => (u.is_active ? "" : "opacity-60")}
        rowActions={(u) => [
          { label: u.id === me?.userId ? "Edit my account" : "Edit", icon: <Pencil className="h-4 w-4" />, onClick: edit },
          { label: "Delete", icon: <Trash2 className="h-4 w-4" />, onClick: remove, danger: true, hidden: () => u.id === me?.userId }
        ]}
        empty={<EmptyState title={search ? "No users match your search" : "No users yet"} />}
      />

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
