import { FormEvent, KeyboardEvent, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Eye, EyeOff, LayoutTemplate, LockKeyhole, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { api, errorMessage, fileUrl } from "../lib/api";
import { useAuth } from "../lib/auth";
import { IS_PLATFORM } from "../lib/tenant";
import { Button, ErrorBox, inputClass } from "../components/ui";

const REMEMBER_KEY = "wm_login_email";

function remembered(): string {
  try {
    return localStorage.getItem(REMEMBER_KEY) ?? "";
  } catch {
    return "";
  }
}

const FEATURES = [
  { icon: LayoutTemplate, title: "Beautiful templates", text: "Switch your website design in one click." },
  { icon: Sparkles, title: "Easy content", text: "Pages, sliders, gallery, news and more." },
  { icon: ShieldCheck, title: "Safe & secure", text: "Every change is logged and reversible." }
];

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState(remembered);
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(() => remembered() !== "");
  const [show, setShow] = useState(false);
  const [caps, setCaps] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [brand, setBrand] = useState<{ name: string; logo: string | null }>({ name: IS_PLATFORM ? "Platform Admin" : "", logo: null });

  useEffect(() => {
    if (!IS_PLATFORM) api.get("/tenant-info").then((r) => setBrand({ name: r.data.name, logo: r.data.logo ?? null })).catch(() => {});
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(email.trim(), password);
      try {
        if (remember) localStorage.setItem(REMEMBER_KEY, email.trim());
        else localStorage.removeItem(REMEMBER_KEY);
      } catch {
        // ignore
      }
    } catch (err) {
      setError(errorMessage(err));
      setPassword("");
    } finally {
      setBusy(false);
    }
  };

  const capsCheck = (e: KeyboardEvent<HTMLInputElement>) => setCaps(e.getModifierState?.("CapsLock") ?? false);

  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <aside className="relative hidden overflow-hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col">
        <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-brand-600/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 right-0 h-[28rem] w-[28rem] rounded-full bg-violet-600/30 blur-3xl" />
        <div className="relative flex items-center gap-3">
          {brand.logo ? (
            <img src={fileUrl(brand.logo)} alt="" className="h-11 w-11 rounded-xl bg-white object-contain p-1" />
          ) : (
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-500 text-lg font-bold">{(brand.name || "W").charAt(0)}</span>
          )}
          <span className="text-lg font-semibold">{brand.name || "Website"}</span>
        </div>
        <div className="relative my-auto max-w-md">
          <h2 className="text-4xl font-semibold leading-tight tracking-tight">
            Your website,
            <br />
            <span className="bg-gradient-to-r from-brand-300 to-violet-300 bg-clip-text text-transparent">beautifully managed.</span>
          </h2>
          <ul className="mt-10 space-y-6">
            {FEATURES.map((f, i) => (
              <motion.li key={f.title} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.1 }} className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
                  <f.icon className="h-5 w-5 text-brand-200" />
                </span>
                <span>
                  <span className="block font-medium">{f.title}</span>
                  <span className="text-sm text-slate-400">{f.text}</span>
                </span>
              </motion.li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-slate-500">© {new Date().getFullYear()} {brand.name || "Website"} · Admin panel</p>
      </aside>

      <main className="flex items-center justify-center p-6 sm:p-10">
        <motion.form initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} onSubmit={submit} className="w-full max-w-sm" aria-label="Sign in">
          <div className="mb-8">
            <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100 lg:hidden">
              <LockKeyhole className="h-6 w-6" />
            </span>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{IS_PLATFORM ? "Welcome back" : `Sign in to ${brand.name || "your website"}`}</h1>
            <p className="mt-1 text-sm text-slate-500">{IS_PLATFORM ? "Super admin sign in" : "Website admin sign in"}</p>
          </div>

          <div className="space-y-4">
            <ErrorBox message={error} />
            <div>
              <label htmlFor="login-email" className="mb-1.5 block text-sm font-medium text-slate-700">
                Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="login-email"
                  type="email"
                  required
                  autoFocus={!email}
                  autoComplete="username"
                  className={`${inputClass} py-2.5 pl-9`}
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label htmlFor="login-password" className="mb-1.5 block text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="login-password"
                  type={show ? "text" : "password"}
                  required
                  autoFocus={!!email}
                  autoComplete="current-password"
                  className={`${inputClass} py-2.5 pl-9 pr-10`}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyUp={capsCheck}
                  onKeyDown={capsCheck}
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  aria-label={show ? "Hide password" : "Show password"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 hover:text-slate-700"
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {caps && <p className="mt-1 text-xs text-amber-600">Caps Lock is on</p>}
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-brand-600" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
              Remember my email
            </label>
            <Button type="submit" size="lg" className="w-full" loading={busy}>
              {busy ? "Signing in…" : "Sign in"}
            </Button>
          </div>

          {!IS_PLATFORM && (
            <a href="/" className="mt-8 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-600">
              <ArrowLeft className="h-4 w-4" /> Back to website
            </a>
          )}
          <p className="mt-6 text-xs text-slate-400">Forgot your password? Ask your website administrator to reset it.</p>
        </motion.form>
      </main>
    </div>
  );
}
