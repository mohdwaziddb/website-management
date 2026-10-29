import { FormEvent, useEffect, useState } from "react";
import { LockKeyhole } from "lucide-react";
import { api, errorMessage, fileUrl } from "../lib/api";
import { useAuth } from "../lib/auth";
import { IS_PLATFORM } from "../lib/tenant";
import { Button, ErrorBox, inputClass } from "../components/ui";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [brand, setBrand] = useState<{ name: string; logo: string | null }>({
    name: IS_PLATFORM ? "Platform Admin" : "",
    logo: null
  });

  useEffect(() => {
    if (!IS_PLATFORM) api.get("/tenant-info").then((r) => setBrand(r.data)).catch(() => {});
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(email, password);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-white to-slate-100 p-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-2xl border border-slate-200 bg-white p-7 shadow-xl">
        <div className="text-center">
          {brand.logo ? (
            <img src={fileUrl(brand.logo)} alt="" className="mx-auto mb-3 h-14 object-contain" />
          ) : (
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white">
              <LockKeyhole className="h-6 w-6" />
            </div>
          )}
          <h1 className="text-lg font-semibold text-slate-900">{brand.name}</h1>
          <p className="text-sm text-slate-500">{IS_PLATFORM ? "Super admin sign in" : "Website admin sign in"}</p>
          {!IS_PLATFORM && (
            <a href="/" className="mt-1 inline-block text-xs text-brand-600 hover:underline">
              ← Back to website
            </a>
          )}
        </div>
        <ErrorBox message={error} />
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
          <input type="email" required autoFocus className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
          <input type="password" required className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </div>
  );
}
