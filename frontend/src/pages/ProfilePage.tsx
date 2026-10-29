import { FormEvent, useState } from "react";
import { api, errorMessage, saveSession } from "../lib/api";
import { useAuth } from "../lib/auth";
import { IS_PLATFORM } from "../lib/tenant";
import { Session } from "../lib/types";
import { Button, Card, ErrorBox, inputClass, PageHeader, showToast } from "../components/ui";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [error, setError] = useState<string | null>(null);
  const base = IS_PLATFORM ? "/platform/auth" : "/auth";

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const r = await api.post<Session>(`${base}/change-password`, { currentPassword: current, newPassword: next });
      saveSession(r.data);
      setCurrent("");
      setNext("");
      showToast("Password changed. Other devices are logged out.");
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const logoutAll = async () => {
    if (!confirm("Logout from all devices?")) return;
    await api.post("/auth/logout-all");
    logout();
  };

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader title="My Profile" subtitle={`${user?.name} · ${user?.email}`} />
      <Card className="p-5">
        <form onSubmit={submit} className="space-y-4">
          <h2 className="font-medium text-slate-900">Change password</h2>
          <ErrorBox message={error} />
          <input type="password" required placeholder="Current password" className={inputClass} value={current} onChange={(e) => setCurrent(e.target.value)} />
          <input
            type="password"
            required
            minLength={8}
            placeholder="New password (min 8)"
            className={inputClass}
            value={next}
            onChange={(e) => setNext(e.target.value)}
          />
          <Button type="submit">Update password</Button>
        </form>
      </Card>
      {!IS_PLATFORM && (
        <Card className="mt-4 flex items-center justify-between p-5">
          <span className="text-sm text-slate-600">Sign out everywhere</span>
          <Button variant="secondary" onClick={logoutAll}>
            Logout all devices
          </Button>
        </Card>
      )}
    </div>
  );
}
