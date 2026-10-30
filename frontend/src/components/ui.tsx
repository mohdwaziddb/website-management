// Admin panel ka common design system — har page yahi pieces use kare (ek jaisa look + behaviour).
import { ButtonHTMLAttributes, ReactNode, useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, HelpCircle, ImageIcon, Info, Inbox, Loader2, X, XCircle } from "lucide-react";

// ------------------------------------------------------------ buttons

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "soft";

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className = "",
  children,
  disabled,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: "sm" | "md" | "lg"; loading?: boolean }) {
  const styles = {
    primary: "bg-brand-600 text-white shadow-sm shadow-brand-600/20 hover:bg-brand-700 disabled:bg-brand-600/50",
    secondary: "border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50 disabled:text-slate-400",
    danger: "bg-red-600 text-white shadow-sm shadow-red-600/20 hover:bg-red-700 disabled:bg-red-600/50",
    ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:text-slate-300",
    soft: "bg-brand-50 text-brand-700 hover:bg-brand-100 disabled:opacity-50"
  }[variant];
  const sizes = { sm: "px-2.5 py-1.5 text-xs", md: "px-3.5 py-2 text-sm", lg: "px-5 py-2.5 text-sm" }[size];
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:ring-offset-1 disabled:cursor-not-allowed ${styles} ${sizes} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

/** Chhota icon button (edit / delete / close) — title zaroori (tooltip + screen reader) */
export function IconButton({ title, tone = "default", className = "", ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { title: string; tone?: "default" | "danger" }) {
  const t = tone === "danger" ? "text-slate-400 hover:bg-red-50 hover:text-red-600" : "text-slate-400 hover:bg-slate-100 hover:text-slate-700";
  return <button type="button" title={title} aria-label={title} className={`inline-flex rounded-lg p-1.5 transition ${t} ${className}`} {...rest} />;
}

// ------------------------------------------------------------ inputs

// width ke bina — fixed width chahiye to `${baseInputClass} w-40`
export const baseInputClass =
  "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 disabled:bg-slate-50 disabled:text-slate-500";
export const inputClass = `w-full ${baseInputClass}`;

/** Label + input + help / error — har form me ek jaisa */
export function FormField({ label, required, help, error, htmlFor, children, className = "" }: {
  label: string;
  required?: boolean;
  help?: ReactNode;
  error?: string | null;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : help ? <p className="mt-1 text-xs text-slate-500">{help}</p> : null}
    </div>
  );
}

/** On / off toggle (checkbox ki jagah) */
export function Switch({ checked, onChange, label, description, disabled }: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
}) {
  const button = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 disabled:opacity-50 ${checked ? "bg-brand-600" : "bg-slate-300"}`}
    >
      <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition ${checked ? "translate-x-[22px]" : "translate-x-0.5"}`} />
    </button>
  );
  if (!label) return button;
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="text-sm font-medium text-slate-800">{label}</div>
        {description && <div className="text-xs text-slate-500">{description}</div>}
      </div>
      {button}
    </div>
  );
}

// ------------------------------------------------------------ layout pieces

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${className}`}>{children}</div>;
}

/** Heading wala card (form sections, side panels) */
export function SectionCard({ title, description, actions, children, className = "", bodyClassName = "p-5" }: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <Card className={className}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <h2 className="font-semibold text-slate-900">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
        </div>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>
      <div className={bodyClassName}>{children}</div>
    </Card>
  );
}

export interface Crumb {
  label: string;
  to?: string;
}

export function PageHeader({ title, subtitle, actions, icon, crumbs }: { title: string; subtitle?: ReactNode; actions?: ReactNode; icon?: ReactNode; crumbs?: Crumb[] }) {
  return (
    <div className="mb-6">
      {crumbs && crumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-2 flex flex-wrap items-center gap-1 text-xs text-slate-500">
          {crumbs.map((c, i) => (
            <span key={i} className="flex items-center gap-1">
              {c.to ? (
                <Link to={c.to} className="hover:text-brand-600">
                  {c.label}
                </Link>
              ) : (
                <span>{c.label}</span>
              )}
              {i < crumbs.length - 1 && <ChevronRight className="h-3 w-3" />}
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {icon && <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">{icon}</span>}
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
            {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

const TONES = {
  blue: "bg-brand-50 text-brand-600 ring-brand-100",
  green: "bg-emerald-50 text-emerald-600 ring-emerald-100",
  amber: "bg-amber-50 text-amber-600 ring-amber-100",
  violet: "bg-violet-50 text-violet-600 ring-violet-100",
  rose: "bg-rose-50 text-rose-600 ring-rose-100",
  slate: "bg-slate-100 text-slate-600 ring-slate-200"
} as const;
export type Tone = keyof typeof TONES;

/** Dashboard ka number box */
export function StatCard({ label, value, hint, icon, tone = "blue", to, onClick, active = false }: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: Tone;
  to?: string;
  onClick?: () => void;
  active?: boolean;
}) {
  const body = (
    <Card className={`h-full p-4 text-left transition ${to || onClick ? "hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md" : ""} ${active ? "border-brand-300 ring-2 ring-brand-100" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm text-slate-500">{label}</div>
          <div className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 tabular-nums">{value}</div>
          {hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
        </div>
        {icon && <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${TONES[tone]}`}>{icon}</span>}
      </div>
    </Card>
  );
  if (to) {
    return (
      <Link to={to} className="block h-full">
        {body}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} aria-pressed={active} className="block h-full w-full">
        {body}
      </button>
    );
  }
  return body;
}

/** Rangeen chhota label (status, role ...) */
export function Pill({ tone = "slate", children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${TONES[tone]}`}>{children}</span>;
}

export function Badge({ on, onText, offText }: { on: boolean; onText: string; offText: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${on ? "bg-emerald-50 text-emerald-700 ring-emerald-100" : "bg-slate-100 text-slate-500 ring-slate-200"}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${on ? "bg-emerald-500" : "bg-slate-400"}`} />
      {on ? onText : offText}
    </span>
  );
}

/** Naam ke pehle akshar wala gola */
export function Avatar({ name, size = "md" }: { name?: string | null; size?: "sm" | "md" | "lg" }) {
  const initials = (name ?? "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
  const s = { sm: "h-7 w-7 text-[11px]", md: "h-9 w-9 text-xs", lg: "h-14 w-14 text-lg" }[size];
  return <span className={`inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-violet-500 font-semibold text-white ${s}`}>{initials || "?"}</span>;
}

export function Tabs<T extends string>({ value, onChange, items }: { value: T; onChange: (v: T) => void; items: { value: T; label: ReactNode; count?: number }[] }) {
  return (
    <div role="tablist" className="inline-flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1">
      {items.map((t) => (
        <button
          key={t.value}
          role="tab"
          type="button"
          aria-selected={value === t.value}
          onClick={() => onChange(t.value)}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${value === t.value ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
        >
          {t.label}
          {t.count !== undefined && <span className={`rounded-full px-1.5 text-[11px] ${value === t.value ? "bg-brand-50 text-brand-700" : "bg-slate-200 text-slate-600"}`}>{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function EmptyState({ icon, title, text, action }: { icon?: ReactNode; title: string; text?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">{icon ?? <Inbox className="h-6 w-6" />}</span>
      <h3 className="font-semibold text-slate-800">{title}</h3>
      {text && <p className="mt-1 max-w-sm text-sm text-slate-500">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/**
 * Chhoti photo (list / order items). Photo na ho ya load fail ho (link toota, network) to tooti image
 * ki jagah saaf image icon.
 */
export function Thumb({ src, alt = "", className = "h-10 w-14" }: { src?: string | null; alt?: string; className?: string }) {
  const [failed, setFailed] = useState<string | null>(null);
  if (src && failed !== src) {
    return <img src={src} alt={alt} loading="lazy" onError={() => setFailed(src)} className={`shrink-0 rounded-lg object-cover ring-1 ring-slate-200 ${className}`} />;
  }
  return (
    <span role="img" aria-label={alt || "No image"} className={`inline-flex shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400 ring-1 ring-slate-200 ${className}`}>
      <ImageIcon className="h-4 w-4" />
    </span>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200/70 ${className}`} />;
}

/** Table load hote waqt */
export function TableSkeleton({ rows = 6, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="divide-y divide-slate-100" aria-label="Loading">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 px-4 py-3.5">
          {Array.from({ length: cols }).map((__, c) => (
            <Skeleton key={c} className={`h-4 ${c === 0 ? "w-8" : c === 1 ? "flex-1" : "w-24"}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function ErrorBox({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
      <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

export function InfoBox({ children, tone = "blue" }: { children: ReactNode; tone?: "blue" | "amber" }) {
  const c = tone === "amber" ? "border-amber-200 bg-amber-50 text-amber-800" : "border-brand-100 bg-brand-50 text-brand-800";
  return (
    <div className={`flex items-start gap-2 rounded-xl border px-3.5 py-2.5 text-sm ${c}`}>
      <Info className="mt-0.5 h-4 w-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

/** 1 2 3 … 9 10 — pages ke number (testable) */
export function pageNumbers(page: number, pages: number): (number | "…")[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const out: (number | "…")[] = [1];
  const from = Math.max(2, page - 1);
  const to = Math.min(pages - 1, page + 1);
  if (from > 2) out.push("…");
  for (let i = from; i <= to; i++) out.push(i);
  if (to < pages - 1) out.push("…");
  out.push(pages);
  return out;
}

export function Pagination({ page, size, total, onPage }: { page: number; size: number; total: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / size));
  const from = total === 0 ? 0 : (page - 1) * size + 1;
  const to = Math.min(total, page * size);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-sm text-slate-500">
      <span>{total === 0 ? "No records" : `Showing ${from}–${to} of ${total} record${total === 1 ? "" : "s"}`}</span>
      {pages > 1 && (
        <div className="flex items-center gap-1">
          <IconButton title="Previous page" disabled={page <= 1} onClick={() => onPage(page - 1)} className="disabled:opacity-30">
            <ChevronLeft className="h-4 w-4" />
          </IconButton>
          {pageNumbers(page, pages).map((n, i) =>
            n === "…" ? (
              <span key={`e${i}`} className="px-1.5">
                …
              </span>
            ) : (
              <button
                key={n}
                type="button"
                aria-current={n === page ? "page" : undefined}
                onClick={() => onPage(n)}
                className={`h-8 min-w-8 rounded-lg px-2 text-sm font-medium transition ${n === page ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
              >
                {n}
              </button>
            )
          )}
          <IconButton title="Next page" disabled={page >= pages} onClick={() => onPage(page + 1)} className="disabled:opacity-30">
            <ChevronRight className="h-4 w-4" />
          </IconButton>
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------ toast

/** Chhota toast: showToast("Saved") kahin se bhi. */
type ToastMsg = { id: number; text: string; error?: boolean };
let pushToast: (t: ToastMsg) => void = () => {};

export function showToast(text: string, error = false) {
  pushToast({ id: Date.now() + Math.random(), text, error });
}

export function Toaster() {
  const [items, setItems] = useState<ToastMsg[]>([]);
  useEffect(() => {
    pushToast = (t) => {
      setItems((xs) => [...xs.slice(-3), t]);
      setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== t.id)), t.error ? 5000 : 3500);
    };
  }, []);
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[70] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2" aria-live="polite">
      <AnimatePresence>
        {items.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40 }}
            role={t.error ? "alert" : "status"}
            className="pointer-events-auto flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-lg shadow-slate-900/10"
          >
            {t.error ? <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />}
            <span className="flex-1">{t.text}</span>
            <button aria-label="Dismiss" className="text-slate-400 hover:text-slate-700" onClick={() => setItems((xs) => xs.filter((x) => x.id !== t.id))}>
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ------------------------------------------------------------ modal

/** Esc se band + background scroll lock — Modal / Confirm dono me common */
function useModalKeys(onClose: () => void, onEnter?: () => void) {
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Enter" && onEnter) {
        e.preventDefault();
        onEnter();
      }
    };
    window.addEventListener("keydown", key);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", key);
      document.body.style.overflow = overflow;
    };
  }, [onClose, onEnter]);
}

export function Modal({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  useModalKeys(onClose);
  return (
    <motion.div
      className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 pt-16 backdrop-blur-[2px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 380, damping: 30 }}
        className={`w-full rounded-2xl bg-white shadow-2xl ${wide ? "max-w-3xl" : "max-w-lg"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-900">{title}</h2>
          <IconButton title="Close" onClick={onClose}>
            <X className="h-5 w-5" />
          </IconButton>
        </div>
        <div className="p-5">{children}</div>
      </motion.div>
    </motion.div>
  );
}

// ------------------------------------------------------------ confirm dialog (browser ke confirm() ki jagah, poore admin me common)

export interface ConfirmOptions {
  title: string;
  message: ReactNode;
  confirmText?: string;
  cancelText?: string;
  /** Delete / reset jaise kaam: laal button + warning icon */
  danger?: boolean;
}

type ConfirmRequest = ConfirmOptions & { resolve: (ok: boolean) => void };
let pushConfirm: ((r: ConfirmRequest) => void) | null = null;

/** `if (!(await confirmDialog({ title, message }))) return;` — kahin se bhi. <ConfirmHost /> layout me mounted hona chahiye. */
export function confirmDialog(opts: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    if (!pushConfirm) {
      // host mount nahi (tests) — safe default: browser confirm
      resolve(window.confirm(typeof opts.message === "string" ? `${opts.title}\n\n${opts.message}` : opts.title));
      return;
    }
    pushConfirm({ ...opts, resolve });
  });
}

function ConfirmBox({ req, onDone }: { req: ConfirmRequest; onDone: (ok: boolean) => void }) {
  const cancel = useCallback(() => onDone(false), [onDone]);
  const ok = useCallback(() => onDone(true), [onDone]);
  useModalKeys(cancel, ok);
  return (
    <motion.div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={cancel}>
      <motion.div
        role="alertdialog"
        aria-modal="true"
        aria-label={req.title}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex gap-4">
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${req.danger ? "bg-red-50 text-red-600" : "bg-brand-50 text-brand-600"}`}>
            {req.danger ? <AlertTriangle className="h-5 w-5" /> : <HelpCircle className="h-5 w-5" />}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-slate-900">{req.title}</h2>
            <div className="mt-1.5 text-sm leading-relaxed text-slate-600">{req.message}</div>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={cancel}>
            {req.cancelText ?? "Cancel"}
          </Button>
          <Button variant={req.danger ? "danger" : "primary"} onClick={ok} autoFocus>
            {req.confirmText ?? "Confirm"}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/** Admin layout me ek baar (Toaster ke saath) */
export function ConfirmHost() {
  const [req, setReq] = useState<ConfirmRequest | null>(null);
  useEffect(() => {
    pushConfirm = (r) => setReq(r);
    return () => {
      pushConfirm = null;
    };
  }, []);
  const done = useCallback(
    (ok: boolean) => {
      req?.resolve(ok);
      setReq(null);
    },
    [req]
  );
  return <AnimatePresence>{req && <ConfirmBox key={req.title} req={req} onDone={done} />}</AnimatePresence>;
}
