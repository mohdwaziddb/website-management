import { FormEvent, useState } from "react";
import { KeyRound, LogOut, ShieldCheck } from "lucide-react";
import { api, errorMessage, saveSession } from "../lib/api";
import { useAuth } from "../lib/auth";
import { IS_PLATFORM } from "../lib/tenant";
import { Session } from "../lib/types";
import { Avatar, Button, Card, confirmDialog, ErrorBox, FormField, inputClass, PageHeader, Pill, SectionCard, showToast } from "../components/ui";

/** 0-4: lambai + bade/chhote akshar + number + symbol */
export function passwordStrength(p: string): number {
  if (p.length < 8) return 0;
  let s = 1;
  if (/[a-z]/.test(p) && /[A-Z]/.test(p)) s++;
  if (/\d/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p) || p.length >= 14) s++;
  return s;
}

const STRENGTH = [
  { label: "Too short", bar: "bg-slate-200" },
  { label: "Weak", bar: "bg-red-500" },
  { label: "Okay", bar: "bg-amber-500" },
  { label: "Good", bar: "bg-emerald-500" },
  { label: "Strong", bar: "bg-emerald-600" }
];

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const base = IS_PLATFORM ? "/platform/auth" : "/auth";
  const strength = passwordStrength(next);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (next !== confirm) {
      setError("New passwords do not match");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const r = await api.post<Session>(`${base}/change-password`, { currentPassword: current, newPassword: next });
      saveSession(r.data);
      setCurrent("");
      setNext("");
      setConfirm("");
      showToast("Password changed. Other devices are logged out.");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const logoutAll = async () => {
    const ok = await confirmDialog({
      title: "Log out from all devices?",
      message: "You will be signed out everywhere, including this browser, and will need to log in again.",
      confirmText: "Log out everywhere",
      danger: true
    });
    if (!ok) return;
    await api.post("/auth/logout-all");
    logout();
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="My Profile" subtitle="Your account and security" />
      <Card className="mb-6 flex flex-wrap items-center gap-4 p-5">
        <Avatar name={user?.name} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="text-lg font-semibold text-slate-900">{user?.name}</div>
          <div className="text-sm text-slate-500">{user?.email}</div>
        </div>
        <Pill tone={user?.role === "ADMIN" || user?.role === "SUPER_ADMIN" ? "violet" : "blue"}>
          <ShieldCheck className="h-3.5 w-3.5" /> {user?.role === "ADMIN" ? "Administrator" : user?.role === "EDITOR" ? "Editor" : "Super admin"}
        </Pill>
      </Card>

      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_260px]">
        <SectionCard title={<span className="flex items-center gap-2"><KeyRound className="h-4 w-4 text-brand-600" /> Change password</span>} description="Changing it signs you out on other devices">
          <form onSubmit={submit} className="space-y-4">
            <ErrorBox message={error} />
            <FormField label="Current password" htmlFor="pw-current">
              <input id="pw-current" type="password" required autoComplete="current-password" className={inputClass} value={current} onChange={(e) => setCurrent(e.target.value)} />
            </FormField>
            <FormField label="New password" htmlFor="pw-new" help="At least 8 characters. Mix letters, numbers and symbols.">
              <input id="pw-new" type="password" required minLength={8} autoComplete="new-password" className={inputClass} value={next} onChange={(e) => setNext(e.target.value)} />
            </FormField>
            {next && (
              <div aria-label={`Password strength: ${STRENGTH[strength].label}`}>
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= strength ? STRENGTH[strength].bar : "bg-slate-200"}`} />
                  ))}
                </div>
                <p className="mt-1 text-xs text-slate-500">{STRENGTH[strength].label}</p>
              </div>
            )}
            <FormField label="Confirm new password" htmlFor="pw-confirm" error={confirm && confirm !== next ? "Passwords do not match" : null}>
              <input id="pw-confirm" type="password" required autoComplete="new-password" className={inputClass} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </FormField>
            <Button type="submit" loading={busy}>
              Update password
            </Button>
          </form>
        </SectionCard>

        {!IS_PLATFORM && (
          <SectionCard title="Sessions" description="Lost a device or shared your password?">
            <Button variant="secondary" className="w-full" onClick={logoutAll}>
              <LogOut className="h-4 w-4" /> Log out all devices
            </Button>
          </SectionCard>
        )}
      </div>
    </div>
  );
}
