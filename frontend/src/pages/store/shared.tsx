import { ReactNode } from "react";
export { rupee } from "../../lib/money";
export { formatDateTime } from "../UsersPage";

export const ORDER_STATUSES = ["PENDING_PAYMENT", "PLACED", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

const STATUS_META: Record<string, { label: string; cls: string }> = {
  PENDING_PAYMENT: { label: "Awaiting payment", cls: "bg-amber-50 text-amber-700 ring-amber-200" },
  PLACED: { label: "Order placed", cls: "bg-sky-50 text-sky-700 ring-sky-200" },
  CONFIRMED: { label: "Confirmed", cls: "bg-indigo-50 text-indigo-700 ring-indigo-200" },
  PACKED: { label: "Packed", cls: "bg-violet-50 text-violet-700 ring-violet-200" },
  SHIPPED: { label: "Shipped", cls: "bg-blue-50 text-blue-700 ring-blue-200" },
  DELIVERED: { label: "Delivered", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  CANCELLED: { label: "Cancelled", cls: "bg-red-50 text-red-700 ring-red-200" },
  RETURNED: { label: "Returned", cls: "bg-orange-50 text-orange-700 ring-orange-200" }
};

const PAYMENT_META: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "Pending", cls: "bg-amber-50 text-amber-700 ring-amber-200" },
  PAID: { label: "Paid", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  FAILED: { label: "Failed", cls: "bg-red-50 text-red-700 ring-red-200" },
  REFUNDED: { label: "Refunded", cls: "bg-slate-100 text-slate-600 ring-slate-200" }
};

const UNKNOWN = "bg-slate-100 text-slate-600 ring-slate-200";

/** status -> { label, badge classes }; anjaan status = grey + raw naam */
export function statusMeta(status: string | null | undefined): { label: string; cls: string } {
  return STATUS_META[status ?? ""] ?? { label: status || "—", cls: UNKNOWN };
}

export function paymentMeta(status: string | null | undefined): { label: string; cls: string } {
  return PAYMENT_META[status ?? ""] ?? { label: status || "—", cls: UNKNOWN };
}

export function methodLabel(m: unknown): string {
  return m === "COD" ? "Cash on delivery" : m === "RAZORPAY" ? "Razorpay" : String(m ?? "—");
}

function Pill({ cls, children }: { cls: string; children: ReactNode }) {
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${cls}`}>{children}</span>;
}

export function StatusBadge({ status }: { status: string | null | undefined }) {
  const m = statusMeta(status);
  return <Pill cls={m.cls}>{m.label}</Pill>;
}

export function PaymentBadge({ status }: { status: string | null | undefined }) {
  const m = paymentMeta(status);
  return <Pill cls={m.cls}>{m.label}</Pill>;
}

/** Refund tabhi jab Razorpay se paid order cancel / return hua ho */
export function canRefund(o: { payment_method?: unknown; payment_status?: unknown; status?: unknown }): boolean {
  return o.payment_method === "RAZORPAY" && o.payment_status === "PAID" && (o.status === "CANCELLED" || o.status === "RETURNED");
}

export type SettingKind = "TEXT" | "EMAIL" | "DECIMAL" | "NUMBER" | "BOOLEAN";
export interface StoreSettingField {
  key: string;
  label: string;
  group: string;
  kind: SettingKind;
  secret: boolean;
  defaultValue: unknown;
  help: string | null;
}

/**
 * Sirf badle hue keys bhejo. Secret khaali = "purana rakho" (backend), to khaali secret kabhi mat bhejo.
 * Number inputs string dete hain — "10" aur 10 same maano.
 */
export function settingsDiff(fields: StoreSettingField[], original: Record<string, unknown>, current: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    const now = current[f.key];
    if (f.secret) {
      if (typeof now === "string" && now.trim() !== "") out[f.key] = now.trim();
      continue;
    }
    const before = original[f.key];
    const norm = (v: unknown) => (v == null ? "" : String(v));
    if (norm(now) !== norm(before)) out[f.key] = now ?? "";
  }
  return out;
}
