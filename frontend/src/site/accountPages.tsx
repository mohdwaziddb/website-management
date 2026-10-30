// Customer account: /login, /register, /forgot-password, /reset-password, /account (orders, wishlist, addresses, profile), /account/orders/:orderNo
import { ChangeEvent, FormEvent, ReactNode, useCallback, useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, CheckCircle2, Clock, Heart, LogOut, MapPin, Package, Truck, User, XCircle } from "lucide-react";
import { errorMessage } from "../lib/api";
import type { Row } from "../lib/types";
import { confirmDialog, showToast } from "../components/ui";
import { useSite } from "./data";
import { Loading, NotFoundPage, useTitle } from "./pages";
import { AddressFields, fieldCls } from "./shopPages";
import { Price } from "./sections/shop";
import { customerLogin, customerLogout, ORDER_STEPS, payWithRazorpay, RazorpayPayment, rupees, saveCustomer, storeApi, useCustomer } from "./store";
import { Container, formatDate, headingFont, SmartImage } from "./ui";

function SubmitBtn({ children, busy }: { children: ReactNode; busy: boolean }) {
  const { template } = useSite();
  return (
    <button type="submit" disabled={busy} className={`w-full bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-[var(--on-primary)] transition hover:brightness-110 disabled:opacity-50 ${template.button}`}>
      {children}
    </button>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium">{label}</span>
      {children}
    </label>
  );
}

// ------------------------------------------------------------ login / signup

/** Login + Sign up tabs (checkout page me bhi) */
export function AuthPanel({ initial = "login", onDone }: { initial?: "login" | "register"; onDone?: () => void }) {
  const [mode, setMode] = useState(initial);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const body = mode === "login" ? { email: form.email, password: form.password } : form;
      const u = await customerLogin(mode, body);
      showToast(mode === "login" ? `Welcome back, ${u.name}!` : `Welcome, ${u.name}! Your account is ready.`);
      onDone?.();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl bg-[var(--surface)] p-6 shadow-sm ring-1 ring-site-text/10">
      <div className="mb-5 grid grid-cols-2 rounded-lg bg-site-text/5 p-1 text-sm font-semibold">
        {(["login", "register"] as const).map((m) => (
          <button key={m} type="button" onClick={() => setMode(m)} className={`rounded-md py-2 transition ${mode === m ? "bg-[var(--bg)] shadow" : "text-[var(--muted)]"}`}>
            {m === "login" ? "Login" : "Create account"}
          </button>
        ))}
      </div>
      <form onSubmit={submit} className="space-y-3">
        {mode === "register" && (
          <>
            <Field label="Full name">
              <input required maxLength={150} autoComplete="name" value={form.name} onChange={set("name")} className={fieldCls} />
            </Field>
            <Field label="Mobile number (optional)">
              <input inputMode="tel" autoComplete="tel" value={form.phone} onChange={set("phone")} className={fieldCls} />
            </Field>
          </>
        )}
        <Field label="Email">
          <input required type="email" autoComplete="email" value={form.email} onChange={set("email")} className={fieldCls} />
        </Field>
        <Field label="Password">
          <input
            required
            type="password"
            minLength={mode === "register" ? 8 : undefined}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            value={form.password}
            onChange={set("password")}
            className={fieldCls}
          />
        </Field>
        {mode === "register" && <p className="text-xs text-[var(--muted)]">At least 8 characters.</p>}
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <SubmitBtn busy={busy}>{busy ? "Please wait…" : mode === "login" ? "Login" : "Create account"}</SubmitBtn>
        {mode === "login" && (
          <Link to="/forgot-password" className="block text-center text-sm text-[var(--muted)] underline">
            Forgot password?
          </Link>
        )}
      </form>
    </div>
  );
}

export function LoginPage({ mode = "login" }: { mode?: "login" | "register" }) {
  useTitle(mode === "login" ? "Login" : "Create account");
  const customer = useCustomer();
  const [params] = useSearchParams();
  const next = params.get("next");
  const target = next && next.startsWith("/") && !next.startsWith("//") ? next : "/account";
  if (customer) return <Navigate to={target} replace />;
  return (
    <Container className="max-w-md py-14">
      <h1 style={headingFont} className="mb-6 text-center text-3xl font-bold">
        {mode === "login" ? "Welcome back" : "Join us"}
      </h1>
      <AuthPanel initial={mode} />
    </Container>
  );
}

export function ForgotPasswordPage() {
  useTitle("Forgot password");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await storeApi.post("/store/auth/forgot-password", { email });
      setDone(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Container className="max-w-md py-14">
      <h1 style={headingFont} className="mb-6 text-center text-3xl font-bold">
        Reset password
      </h1>
      <div className="rounded-2xl bg-[var(--surface)] p-6 ring-1 ring-site-text/10">
        {done ? (
          <p className="text-center">If an account exists for <b>{email}</b>, we've emailed a reset link. It works for 1 hour.</p>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <Field label="Email">
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={fieldCls} />
            </Field>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <SubmitBtn busy={busy}>Send reset link</SubmitBtn>
          </form>
        )}
        <Link to="/login" className="mt-4 block text-center text-sm text-[var(--muted)] underline">
          Back to login
        </Link>
      </div>
    </Container>
  );
}

export function ResetPasswordPage() {
  useTitle("Set new password");
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await storeApi.post("/store/auth/reset-password", { token: params.get("token"), password });
      showToast("Password changed — please login");
      navigate("/login");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Container className="max-w-md py-14">
      <h1 style={headingFont} className="mb-6 text-center text-3xl font-bold">
        Set a new password
      </h1>
      <form onSubmit={submit} className="space-y-3 rounded-2xl bg-[var(--surface)] p-6 ring-1 ring-site-text/10">
        <Field label="New password">
          <input required type="password" minLength={8} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={fieldCls} />
        </Field>
        <Field label="Confirm password">
          <input required type="password" minLength={8} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={fieldCls} />
        </Field>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <SubmitBtn busy={busy}>Save password</SubmitBtn>
      </form>
    </Container>
  );
}

// ------------------------------------------------------------ /account

const STATUS_STYLE: Record<string, string> = {
  PENDING_PAYMENT: "bg-amber-100 text-amber-800",
  PLACED: "bg-sky-100 text-sky-800",
  CONFIRMED: "bg-indigo-100 text-indigo-800",
  PACKED: "bg-violet-100 text-violet-800",
  SHIPPED: "bg-blue-100 text-blue-800",
  DELIVERED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-red-100 text-red-700",
  RETURNED: "bg-slate-200 text-slate-700"
};

export function StatusBadge({ status, label }: { status: string; label?: unknown }) {
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLE[status] ?? "bg-slate-100"}`}>{String(label ?? status)}</span>;
}

const TABS = [
  { key: "orders", label: "Orders", icon: Package },
  { key: "wishlist", label: "Wishlist", icon: Heart },
  { key: "addresses", label: "Addresses", icon: MapPin },
  { key: "profile", label: "Profile", icon: User }
] as const;

export function AccountPage() {
  useTitle("My account");
  const customer = useCustomer();
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") ?? "orders";
  if (!customer) return <Navigate to="/login?next=/account" replace />;
  return (
    <Container className="py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 style={headingFont} className="text-3xl font-bold">
            Hi, {customer.name.split(" ")[0]}
          </h1>
          <p className="text-[var(--muted)]">{customer.email}</p>
        </div>
        <button
          onClick={async () => {
            if (await confirmDialog({ title: "Log out?", message: "Your cart stays saved on this device.", confirmText: "Log out" })) customerLogout();
          }}
          className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-red-600"
        >
          <LogOut className="h-4 w-4" /> Log out
        </button>
      </div>
      <div className="grid gap-8 lg:grid-cols-[200px_1fr]">
        <nav className="flex gap-1 overflow-x-auto lg:flex-col">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setParams({ tab: t.key })}
              className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium ${tab === t.key ? "bg-[var(--primary)] text-[var(--on-primary)]" : "hover:bg-site-text/5"}`}
            >
              <t.icon className="h-4 w-4" /> {t.label}
            </button>
          ))}
        </nav>
        <div>
          {tab === "orders" && <MyOrders />}
          {tab === "wishlist" && <MyWishlist />}
          {tab === "addresses" && <MyAddresses />}
          {tab === "profile" && <MyProfile />}
        </div>
      </div>
    </Container>
  );
}

function MyOrders() {
  const [orders, setOrders] = useState<Row[] | null>(null);
  useEffect(() => {
    storeApi
      .get<{ items: Row[] }>("/store/orders", { params: { size: 50 } })
      .then((r) => setOrders(r.data.items))
      .catch(() => setOrders([]));
  }, []);
  if (!orders) return <Loading />;
  if (!orders.length) {
    return (
      <div className="rounded-2xl bg-[var(--surface)] p-10 text-center">
        <Package className="mx-auto mb-3 h-10 w-10 text-[var(--muted)]" />
        <p className="mb-3">No orders yet.</p>
        <Link to="/shop" className="font-semibold text-[var(--primary)] underline">
          Start shopping
        </Link>
      </div>
    );
  }
  return (
    <ul className="space-y-3">
      {orders.map((o) => (
        <li key={String(o.order_no)}>
          <Link to={`/account/orders/${o.order_no}`} className="flex items-center gap-4 rounded-xl border border-site-text/10 p-4 transition hover:border-[var(--primary)]">
            <SmartImage src={o.image} alt="" className="h-16 w-14 shrink-0 rounded-md" />
            <div className="min-w-0 flex-1">
              <div className="font-semibold">{String(o.order_no)}</div>
              <div className="text-sm text-[var(--muted)]">
                {formatDate(o.created_on)} · {String(o.item_count)} item{Number(o.item_count) === 1 ? "" : "s"}
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold">{rupees(o.total)}</div>
              <StatusBadge status={String(o.status)} label={o.status_label} />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function MyWishlist() {
  const [items, setItems] = useState<Row[] | null>(null);
  const load = useCallback(() => {
    storeApi
      .get<Row[]>("/store/wishlist")
      .then((r) => setItems(r.data))
      .catch(() => setItems([]));
  }, []);
  useEffect(load, [load]);
  if (!items) return <Loading />;
  if (!items.length) return <p className="rounded-2xl bg-[var(--surface)] p-10 text-center text-[var(--muted)]">Your wishlist is empty. Tap ♥ on any product to save it.</p>;
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
      {items.map((p) => (
        <div key={p.id} className="group relative">
          <Link to={`/product/${p.slug}`}>
            <SmartImage src={p.cover_image} alt={String(p.title)} className="aspect-[4/5] w-full rounded-xl" />
            <div className="mt-2 line-clamp-2 text-sm font-semibold">{String(p.title)}</div>
            <Price price={p.price} mrp={p.compare_price} />
          </Link>
          <button
            aria-label={`Remove ${String(p.title)} from wishlist`}
            onClick={() => storeApi.delete(`/store/wishlist/${p.id}`).then(load)}
            className="absolute right-2 top-2 rounded-full bg-white/90 p-2 text-red-500 shadow"
          >
            <Heart className="h-4 w-4 fill-current" />
          </button>
        </div>
      ))}
    </div>
  );
}

const EMPTY = { name: "", phone: "", line1: "", line2: "", city: "", state: "", pincode: "" };

function MyAddresses() {
  const [items, setItems] = useState<Row[] | null>(null);
  const [editing, setEditing] = useState<number | "new" | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(() => {
    storeApi
      .get<Row[]>("/store/addresses")
      .then((r) => setItems(r.data))
      .catch(() => setItems([]));
  }, []);
  useEffect(load, [load]);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (editing === "new") await storeApi.post("/store/addresses", form);
      else await storeApi.put(`/store/addresses/${editing}`, form);
      setEditing(null);
      load();
      showToast("Address saved");
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  if (!items) return <Loading />;
  if (editing !== null) {
    return (
      <form onSubmit={save} className="space-y-4 rounded-2xl border border-site-text/10 p-5">
        <h2 className="font-semibold">{editing === "new" ? "Add address" : "Edit address"}</h2>
        <AddressFields value={form} onChange={setForm} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button type="submit" className="rounded-lg bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-[var(--on-primary)]">
            Save
          </button>
          <button type="button" onClick={() => setEditing(null)} className="rounded-lg px-5 py-2.5 text-sm">
            Cancel
          </button>
        </div>
      </form>
    );
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map((a) => (
        <div key={a.id} className="rounded-xl border border-site-text/10 p-4 text-sm">
          <div className="mb-1 flex items-center gap-2 font-semibold">
            {String(a.name)} {!!a.is_default && <span className="rounded bg-site-text/10 px-1.5 text-[10px] uppercase">Default</span>}
          </div>
          <p className="text-[var(--muted)]">{[a.line1, a.line2, a.city, a.state, a.pincode].filter(Boolean).join(", ")}</p>
          <p className="text-[var(--muted)]">{String(a.phone)}</p>
          <div className="mt-3 flex gap-3 text-sm">
            <button
              onClick={() => {
                setForm({ ...EMPTY, ...Object.fromEntries(Object.keys(EMPTY).map((k) => [k, String(a[k] ?? "")])) });
                setEditing(Number(a.id));
              }}
              className="font-semibold text-[var(--primary)]"
            >
              Edit
            </button>
            {!a.is_default && (
              <button onClick={() => storeApi.put(`/store/addresses/${a.id}`, { ...a, isDefault: true }).then(load)} className="text-[var(--muted)]">
                Make default
              </button>
            )}
            <button
              onClick={async () => {
                if (await confirmDialog({ title: "Delete this address?", message: "It will be removed from your saved addresses.", confirmText: "Delete", danger: true })) storeApi.delete(`/store/addresses/${a.id}`).then(load);
              }}
              className="text-red-600"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
      <button
        onClick={() => {
          setForm(EMPTY);
          setEditing("new");
        }}
        className="flex min-h-32 items-center justify-center rounded-xl border-2 border-dashed border-site-text/15 text-sm font-semibold text-[var(--muted)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
      >
        + Add new address
      </button>
    </div>
  );
}

function MyProfile() {
  const [me, setMe] = useState({ name: "", phone: "" });
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "" });
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    storeApi.get<Row>("/store/me").then((r) => setMe({ name: String(r.data.name ?? ""), phone: String(r.data.phone ?? "") }));
  }, []);
  const saveProfile = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await storeApi.put("/store/me", me);
      showToast("Profile updated");
    } catch (err) {
      setMsg(errorMessage(err));
    }
  };
  const savePassword = async (e: FormEvent) => {
    e.preventDefault();
    setMsg(null);
    try {
      // password badla = baaki devices logout, is device ke naye tokens
      const r = await storeApi.post("/store/auth/change-password", pw);
      if (r.data?.accessToken) saveCustomer(r.data);
      setPw({ currentPassword: "", newPassword: "" });
      showToast("Password changed");
    } catch (err) {
      setMsg(errorMessage(err));
    }
  };
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <form onSubmit={saveProfile} className="space-y-3 rounded-2xl border border-site-text/10 p-5">
        <h2 className="font-semibold">Profile</h2>
        <Field label="Name">
          <input required maxLength={150} value={me.name} onChange={(e) => setMe({ ...me, name: e.target.value })} className={fieldCls} />
        </Field>
        <Field label="Mobile">
          <input inputMode="tel" value={me.phone} onChange={(e) => setMe({ ...me, phone: e.target.value })} className={fieldCls} />
        </Field>
        <button className="rounded-lg bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-[var(--on-primary)]">Save</button>
      </form>
      <form onSubmit={savePassword} className="space-y-3 rounded-2xl border border-site-text/10 p-5">
        <h2 className="font-semibold">Change password</h2>
        <Field label="Current password">
          <input required type="password" autoComplete="current-password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} className={fieldCls} />
        </Field>
        <Field label="New password">
          <input required type="password" minLength={8} autoComplete="new-password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} className={fieldCls} />
        </Field>
        <button className="rounded-lg bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-[var(--on-primary)]">Change password</button>
      </form>
      {msg && <p className="text-sm text-red-600 md:col-span-2">{msg}</p>}
    </div>
  );
}

// ------------------------------------------------------------ /account/orders/:orderNo

export function CustomerOrderPage() {
  const { orderNo } = useParams();
  const customer = useCustomer();
  const { template } = useSite();
  const [params] = useSearchParams();
  const [order, setOrder] = useState<Row | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  useTitle(`Order ${orderNo}`);

  const load = useCallback(() => {
    storeApi
      .get<Row>(`/store/orders/${orderNo}`)
      .then((r) => setOrder(r.data))
      .catch(() => setOrder(null));
  }, [orderNo]);
  useEffect(() => {
    if (customer) load();
  }, [customer, load]);

  if (!customer) return <Navigate to={`/login?next=/account/orders/${orderNo}`} replace />;
  if (order === undefined) return <Loading />;
  if (order === null) return <NotFoundPage />;

  const status = String(order.status);
  const items = (order.items as Row[]) ?? [];
  const events = (order.events as Row[]) ?? [];
  const step = ORDER_STEPS.indexOf(status as (typeof ORDER_STEPS)[number]);

  const pay = async () => {
    setBusy(true);
    try {
      const r = await storeApi.post<{ payment: RazorpayPayment }>(`/store/orders/${orderNo}/pay`);
      const result = await payWithRazorpay(r.data.payment, template.colors.primary);
      if (result) {
        await storeApi.post(`/store/orders/${orderNo}/razorpay/verify`, result);
        showToast("Payment successful — thank you!");
      }
      load();
    } catch (err) {
      showToast(errorMessage(err), true);
    } finally {
      setBusy(false);
    }
  };

  const cancel = async () => {
    const paid = order.payment_status === "PAID";
    const ok = await confirmDialog({
      title: `Cancel order ${orderNo}?`,
      message: paid ? "Your payment will be refunded to the original payment method in 5-7 working days." : "This cannot be undone.",
      confirmText: "Cancel order",
      cancelText: "Keep order",
      danger: true
    });
    if (!ok) return;
    setBusy(true);
    try {
      const r = await storeApi.post<Row>(`/store/orders/${orderNo}/cancel`, { reason: "Cancelled by customer" });
      setOrder(r.data);
      showToast("Order cancelled");
    } catch (err) {
      showToast(errorMessage(err), true);
    } finally {
      setBusy(false);
    }
  };

  const row = (label: string, value: string) => (
    <div className="flex justify-between text-sm">
      <span className="text-[var(--muted)]">{label}</span>
      <span>{value}</span>
    </div>
  );

  return (
    <Container className="py-10">
      {params.get("placed") && status !== "PENDING_PAYMENT" && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-center gap-3 rounded-2xl bg-emerald-50 p-5 text-emerald-800">
          <CheckCircle2 className="h-8 w-8 shrink-0" />
          <div>
            <div className="text-lg font-bold">Thank you! Your order is placed.</div>
            <div className="text-sm">We've sent the details to {String(order.ship_email)}.</div>
          </div>
        </motion.div>
      )}
      {status === "PENDING_PAYMENT" && (
        <div className="mb-8 flex flex-wrap items-center gap-3 rounded-2xl bg-amber-50 p-5 text-amber-900">
          <Clock className="h-7 w-7 shrink-0" />
          <div className="flex-1">
            <div className="font-bold">Payment pending</div>
            <div className="text-sm">Complete the payment within 30 minutes, otherwise the order is cancelled automatically.</div>
          </div>
          <button disabled={busy} onClick={pay} className={`bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-[var(--on-primary)] disabled:opacity-50 ${template.button}`}>
            Pay {rupees(order.total)} now
          </button>
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/account" className="text-sm text-[var(--muted)] hover:text-[var(--primary)]">
            ← My orders
          </Link>
          <h1 style={headingFont} className="text-2xl font-bold sm:text-3xl">
            Order {String(order.order_no)}
          </h1>
          <div className="text-sm text-[var(--muted)]">Placed on {formatDate(order.created_on)}</div>
        </div>
        <StatusBadge status={status} label={order.status_label} />
      </div>

      {step >= 0 && (
        <ol className="mb-10 grid grid-cols-5 gap-1">
          {ORDER_STEPS.map((s, i) => (
            <li key={s} className="text-center">
              <div className={`h-1.5 rounded-full ${i <= step ? "bg-[var(--accent)]" : "bg-site-text/10"}`} />
              <div className={`mt-2 flex items-center justify-center gap-1 text-xs ${i <= step ? "font-semibold" : "text-[var(--muted)]"}`}>
                {i <= step && <Check className="h-3 w-3" />}
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </div>
            </li>
          ))}
        </ol>
      )}
      {(status === "CANCELLED" || status === "RETURNED") && (
        <div className="mb-8 flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-700">
          <XCircle className="h-5 w-5" /> {status === "CANCELLED" ? "This order was cancelled" : "This order was returned"}
          {order.cancel_reason ? ` — ${String(order.cancel_reason)}` : ""}.{order.payment_status === "REFUNDED" && " Your refund has been started."}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <ul className="divide-y divide-site-text/10 rounded-2xl border border-site-text/10 px-4">
            {items.map((it) => (
              <li key={it.id} className="flex items-center gap-4 py-4">
                <SmartImage src={it.image} alt={String(it.title)} className="h-20 w-16 shrink-0 rounded-md" />
                <div className="min-w-0 flex-1 text-sm">
                  <div className="font-semibold">{String(it.title)}</div>
                  {!!it.variant_title && <div className="text-[var(--muted)]">{String(it.variant_title)}</div>}
                  <div className="text-[var(--muted)]">
                    {rupees(it.unit_price)} × {String(it.qty)}
                  </div>
                </div>
                <span className="font-semibold">{rupees(it.line_total)}</span>
              </li>
            ))}
          </ul>
          {!!order.tracking_no && (
            <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-[var(--surface)] p-5 text-sm">
              <Truck className="h-5 w-5 text-[var(--accent)]" />
              <span>
                Shipped via <b>{String(order.courier)}</b> · Tracking no <b>{String(order.tracking_no)}</b>
              </span>
              {!!order.tracking_url && (
                <a href={String(order.tracking_url)} target="_blank" rel="noreferrer" className="font-semibold text-[var(--primary)] underline">
                  Track package
                </a>
              )}
            </div>
          )}
          <div>
            <h2 className="mb-3 font-semibold">Order updates</h2>
            <ol className="relative ml-2 space-y-4 border-l border-site-text/15 pl-5">
              {events
                .slice()
                .reverse()
                .map((e, i) => (
                  <li key={i} className="relative text-sm">
                    <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full bg-[var(--accent)]" />
                    <div className="font-medium">{String(e.note ?? e.status ?? "")}</div>
                    <div className="text-xs text-[var(--muted)]">{formatDate(e.created_on)}</div>
                  </li>
                ))}
            </ol>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2 rounded-2xl bg-[var(--surface)] p-5">
            {row("Subtotal", rupees(order.subtotal))}
            {Number(order.discount) > 0 && row(`Discount (${String(order.coupon_code)})`, `−${rupees(order.discount)}`)}
            {row("Shipping", Number(order.shipping) > 0 ? rupees(order.shipping) : "FREE")}
            {Number(order.cod_fee) > 0 && row("COD charge", rupees(order.cod_fee))}
            {row(order.prices_include_tax ? "GST (included)" : "GST", rupees(order.tax))}
            <div className="flex justify-between border-t border-site-text/10 pt-3 font-bold">
              <span>Total</span>
              <span>{rupees(order.total)}</span>
            </div>
            <div className="pt-2 text-sm text-[var(--muted)]">
              {order.payment_method === "COD" ? "Cash on Delivery" : "Paid online (Razorpay)"} · {String(order.payment_status).toLowerCase()}
            </div>
          </div>
          <div className="rounded-2xl bg-[var(--surface)] p-5 text-sm">
            <div className="mb-1 font-semibold">Delivery address</div>
            <p>
              {String(order.ship_name)} · {String(order.ship_phone)}
            </p>
            <p className="text-[var(--muted)]">{[order.ship_line1, order.ship_line2, order.ship_city, order.ship_state, order.ship_pincode].filter(Boolean).join(", ")}</p>
          </div>
          {!!order.can_cancel && (
            <button disabled={busy} onClick={cancel} className="w-full rounded-lg border border-red-300 px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50">
              Cancel order
            </button>
          )}
        </div>
      </div>
    </Container>
  );
}
