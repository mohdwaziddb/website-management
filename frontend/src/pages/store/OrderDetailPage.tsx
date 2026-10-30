import { FormEvent, ReactNode, useCallback, useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, CreditCard, ExternalLink, MapPin, MessageSquarePlus, Pencil, Printer, RotateCcw, Truck, UserRound } from "lucide-react";
import { api, errorMessage, fileUrl } from "../../lib/api";
import { Button, Card, confirmDialog, ErrorBox, inputClass, Modal, PageHeader, showToast, Thumb } from "../../components/ui";
import Invoice from "./Invoice";
import { canRefund, formatDateTime, methodLabel, PaymentBadge, rupee, statusMeta, StatusBadge } from "./shared";

type Money = number | string | null;

export interface OrderItem {
  product_id: number | null;
  variant_id: number | null;
  title: string;
  variant_title: string | null;
  sku: string | null;
  image: string | null;
  unit_price: Money;
  qty: number;
  gst_rate: Money;
  discount: Money;
  tax: Money;
  line_total: Money;
}

export interface OrderDetail {
  id: number;
  order_no: string;
  status: string;
  status_label?: string;
  payment_method: string;
  payment_status: string;
  subtotal: Money;
  discount: Money;
  coupon_code: string | null;
  tax: Money;
  prices_include_tax: boolean | number;
  shipping: Money;
  cod_fee: Money;
  total: Money;
  ship_name: string;
  ship_phone: string;
  ship_email: string | null;
  ship_line1: string | null;
  ship_line2: string | null;
  ship_city: string | null;
  ship_state: string | null;
  ship_pincode: string | null;
  notes: string | null;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  courier: string | null;
  tracking_no: string | null;
  tracking_url: string | null;
  cancel_reason: string | null;
  paid_on: string | null;
  created_on: string;
  customer_id: number | null;
  items: OrderItem[];
  events: { status: string | null; note: string | null; by_name: string | null; created_on: string }[];
  payments: { provider: string; kind: "PAYMENT" | "REFUND"; provider_order_id: string | null; provider_payment_id: string | null; amount: Money; status: string; note: string | null; created_on: string }[];
  next_statuses: string[];
  customer: { id: number; name: string; email: string; phone: string } | null;
  seller: { businessName: string; gstin: string; address: string } | null;
  can_cancel: boolean;
  can_pay: boolean;
}

type TrackingForm = { mode: "ship" | "edit"; courier: string; tracking_no: string; tracking_url: string; note: string };

function Section({ icon, title, action, children }: { icon: ReactNode; title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
        <div className="flex items-center gap-2 font-medium text-slate-900">
          <span className="text-brand-600">{icon}</span>
          {title}
        </div>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </Card>
  );
}

function Line({ label, children, strong = false }: { label: ReactNode; children: ReactNode; strong?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 py-1 ${strong ? "border-t border-slate-200 pt-2 text-base font-semibold text-slate-900" : "text-sm text-slate-600"}`}>
      <span>{label}</span>
      <span className="tabular-nums">{children}</span>
    </div>
  );
}

function Mono({ children }: { children: ReactNode }) {
  return <span className="break-all font-mono text-xs text-slate-700">{children}</span>;
}

export default function OrderDetailPage() {
  const { id } = useParams();
  const [o, setO] = useState<OrderDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [tracking, setTracking] = useState<TrackingForm | null>(null);
  const [trackError, setTrackError] = useState<string | null>(null);
  const [siteName, setSiteName] = useState("");

  const load = useCallback(() => {
    api
      .get<OrderDetail>(`/shop/orders/${id}`)
      .then((r) => setO(r.data))
      .catch((e) => setLoadError(errorMessage(e)));
  }, [id]);

  useEffect(load, [load]);
  useEffect(() => {
    api.get("/tenant-info").then((r) => setSiteName(r.data.name)).catch(() => {});
  }, []);

  // list ke "Print invoice" se aaye (?print=1) => order load hote hi print, phir URL saaf
  const [params, setParams] = useSearchParams();
  const wantPrint = params.get("print") === "1";
  useEffect(() => {
    if (!wantPrint || !o) return;
    const t = setTimeout(() => {
      window.print();
      setParams({}, { replace: true });
    }, 400);
    return () => clearTimeout(t);
  }, [wantPrint, o, setParams]);

  /** Har action detail wapas deta hai — wahi set karo */
  const run = async (call: () => Promise<{ data: OrderDetail }>, done: string) => {
    setBusy(true);
    try {
      const r = await call();
      setO(r.data);
      showToast(done);
      return true;
    } catch (e) {
      showToast(errorMessage(e), true);
      return false;
    } finally {
      setBusy(false);
    }
  };

  if (loadError) {
    return (
      <div className="space-y-4">
        <Link to="/store/orders" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
          <ArrowLeft className="h-4 w-4" /> Orders
        </Link>
        <ErrorBox message={loadError} />
      </div>
    );
  }
  if (!o) return <div className="p-10 text-center text-slate-500">Loading…</div>;

  const paidOnline = o.payment_method === "RAZORPAY" && o.payment_status === "PAID";

  const moveTo = async (next: string) => {
    const label = statusMeta(next).label;
    if (next === "SHIPPED") {
      setTrackError(null);
      setTracking({ mode: "ship", courier: o.courier ?? "", tracking_no: o.tracking_no ?? "", tracking_url: o.tracking_url ?? "", note: "" });
      return;
    }
    if (next === "CANCELLED" || next === "RETURNED") {
      // confirm box ke andar ke inputs — closure variables me value
      let reason = "";
      let refund = true;
      const ok = await confirmDialog({
        title: next === "CANCELLED" ? `Cancel order #${o.order_no}?` : `Mark order #${o.order_no} as returned?`,
        message: (
          <div className="space-y-3">
            <p>{next === "CANCELLED" ? "The customer will see this order as cancelled. Stock goes back to inventory." : "The order will be marked as returned. Stock goes back to inventory."}</p>
            <input className={inputClass} placeholder="Reason (optional)" aria-label="Reason" maxLength={500} onChange={(e) => (reason = e.target.value)} onKeyDown={(e) => e.key === "Enter" && e.stopPropagation()} />
            {paidOnline && (
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" defaultChecked onChange={(e) => (refund = e.target.checked)} />
                Refund {rupee(o.total)} to the customer via Razorpay
              </label>
            )}
          </div>
        ),
        confirmText: next === "CANCELLED" ? "Cancel order" : "Mark returned",
        cancelText: "Keep",
        danger: true
      });
      if (!ok) return;
      const body: Record<string, unknown> = { status: next, refund };
      if (reason.trim()) body.note = reason.trim();
      await run(() => api.put(`/shop/orders/${o.id}/status`, body), `Order ${label.toLowerCase()}`);
      return;
    }
    await run(() => api.put(`/shop/orders/${o.id}/status`, { status: next }), `Marked ${label.toLowerCase()}`);
  };

  const saveTracking = async (e: FormEvent) => {
    e.preventDefault();
    if (!tracking) return;
    setTrackError(null);
    setBusy(true);
    const t = { courier: tracking.courier.trim(), tracking_no: tracking.tracking_no.trim(), tracking_url: tracking.tracking_url.trim() };
    try {
      const r =
        tracking.mode === "ship"
          ? await api.put<OrderDetail>(`/shop/orders/${o.id}/status`, { status: "SHIPPED", ...t, ...(tracking.note.trim() ? { note: tracking.note.trim() } : {}) })
          : await api.put<OrderDetail>(`/shop/orders/${o.id}/tracking`, t);
      setO(r.data);
      setTracking(null);
      showToast(tracking.mode === "ship" ? "Marked shipped" : "Tracking updated");
    } catch (err) {
      setTrackError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const addNote = async (e: FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;
    if (await run(() => api.post(`/shop/orders/${o.id}/notes`, { note: note.trim() }), "Note added")) setNote("");
  };

  const refund = async () => {
    const ok = await confirmDialog({
      title: `Refund ${rupee(o.total)}?`,
      message: "The full amount will be refunded to the customer's original payment method via Razorpay. This cannot be undone.",
      confirmText: "Refund",
      danger: true
    });
    if (ok) await run(() => api.post(`/shop/orders/${o.id}/refund`), "Refund initiated");
  };

  const hasTracking = !!(o.courier || o.tracking_no || o.tracking_url);
  const shippedish = o.status === "SHIPPED" || o.status === "DELIVERED" || hasTracking;
  const address = [o.ship_line1, o.ship_line2, [o.ship_city, o.ship_state].filter(Boolean).join(", "), o.ship_pincode].filter(Boolean);

  return (
    <div>
      <Link to="/store/orders" className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> Orders
      </Link>
      <PageHeader
        title={`Order #${o.order_no}`}
        subtitle={`Placed ${formatDateTime(o.created_on)} · ${o.items.length} item${o.items.length === 1 ? "" : "s"}`}
        actions={
          <Button variant="secondary" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Print invoice
          </Button>
        }
      />

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="mb-5 flex flex-wrap items-center gap-3 p-4">
          <span className="text-sm text-slate-500">Status</span>
          <StatusBadge status={o.status} />
          <PaymentBadge status={o.payment_status} />
          {o.cancel_reason && <span className="text-sm text-slate-500">Reason: {o.cancel_reason}</span>}
          <div className="ml-auto flex flex-wrap gap-2">
            {o.next_statuses.map((s) => (
              <Button key={s} variant={s === "CANCELLED" || s === "RETURNED" ? "danger" : "primary"} disabled={busy} onClick={() => moveTo(s)}>
                {s === "CANCELLED" ? "Cancel order" : s === "RETURNED" ? "Mark returned" : `Mark ${statusMeta(s).label.toLowerCase()}`}
              </Button>
            ))}
            {canRefund(o) && (
              <Button variant="danger" disabled={busy} onClick={refund}>
                <RotateCcw className="h-4 w-4" /> Refund
              </Button>
            )}
            {o.next_statuses.length === 0 && !canRefund(o) && <span className="text-sm text-slate-400">No further actions</span>}
          </div>
        </Card>

        <div className="grid gap-5 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            <Card className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Item</th>
                    <th className="px-4 py-2.5 font-medium">SKU</th>
                    <th className="px-4 py-2.5 text-right font-medium">Qty</th>
                    <th className="px-4 py-2.5 text-right font-medium">Price</th>
                    <th className="px-4 py-2.5 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {o.items.map((it, i) => (
                    <tr key={i}>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-3">
                          {it.image ? (
                            <Thumb src={fileUrl(it.image)} className="h-12 w-12" />
                          ) : (
                            <div className="h-12 w-12 shrink-0 rounded-lg bg-slate-100" />
                          )}
                          <div className="min-w-0">
                            {it.product_id ? (
                              <Link to={`/m/products/${it.product_id}`} className="font-medium text-slate-800 hover:text-brand-600 hover:underline">
                                {it.title}
                              </Link>
                            ) : (
                              <span className="font-medium text-slate-800">{it.title}</span>
                            )}
                            {it.variant_title && <div className="text-xs text-slate-500">{it.variant_title}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-slate-500">{it.sku || "—"}</td>
                      <td className="px-4 py-2.5 text-right">{it.qty}</td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums">{rupee(it.unit_price)}</td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-right font-medium tabular-nums">{rupee(it.line_total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-end border-t border-slate-200 p-4">
                <div className="w-full max-w-xs">
                  <Line label="Subtotal">{rupee(o.subtotal)}</Line>
                  {Number(o.discount) > 0 && (
                    <Line label={<>Discount{o.coupon_code && <span className="ml-1 rounded bg-emerald-50 px-1.5 py-0.5 font-mono text-xs text-emerald-700">{o.coupon_code}</span>}</>}>
                      − {rupee(o.discount)}
                    </Line>
                  )}
                  <Line label="Shipping">{Number(o.shipping) > 0 ? rupee(o.shipping) : "Free"}</Line>
                  {Number(o.cod_fee) > 0 && <Line label="COD charge">{rupee(o.cod_fee)}</Line>}
                  <Line label={o.prices_include_tax ? "GST (included)" : "GST"}>{rupee(o.tax)}</Line>
                  <Line label="Total" strong>
                    {rupee(o.total)}
                  </Line>
                </div>
              </div>
            </Card>

            <Section icon={<MessageSquarePlus className="h-4 w-4" />} title="Timeline">
              <form onSubmit={addNote} className="mb-4 flex gap-2">
                <input className={inputClass} placeholder="Add an internal note (not shown to customer)…" maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} />
                <Button type="submit" disabled={busy || !note.trim()}>
                  Add
                </Button>
              </form>
              {o.notes && <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">Customer note: {o.notes}</p>}
              <ol className="relative space-y-4 border-l border-slate-200 pl-5">
                {o.events.map((ev, i) => (
                  <li key={i} className="relative">
                    <span className={`absolute -left-[25px] top-1 h-2.5 w-2.5 rounded-full ring-4 ring-white ${ev.status ? "bg-brand-600" : "bg-slate-300"}`} />
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      {ev.status ? <StatusBadge status={ev.status} /> : <span className="font-medium text-slate-700">Note</span>}
                      <span className="text-xs text-slate-400">
                        {formatDateTime(ev.created_on)}
                        {ev.by_name ? ` · ${ev.by_name}` : ""}
                      </span>
                    </div>
                    {ev.note && <p className="mt-1 whitespace-pre-line text-sm text-slate-600">{ev.note}</p>}
                  </li>
                ))}
                {o.events.length === 0 && <li className="text-sm text-slate-400">No events yet</li>}
              </ol>
            </Section>
          </div>

          <div className="space-y-5">
            <Section
              icon={<UserRound className="h-4 w-4" />}
              title="Customer"
              action={
                o.customer && (
                  <Link to={`/store/customers?id=${o.customer.id}`} className="text-sm font-medium text-brand-600 hover:underline">
                    View
                  </Link>
                )
              }
            >
              {o.customer ? (
                <div className="text-sm">
                  <div className="font-medium text-slate-800">{o.customer.name}</div>
                  <div className="text-slate-500">{o.customer.email}</div>
                  <div className="text-slate-500">{o.customer.phone}</div>
                </div>
              ) : (
                <p className="text-sm text-slate-500">Guest checkout</p>
              )}
            </Section>

            <Section icon={<MapPin className="h-4 w-4" />} title="Shipping address">
              <div className="text-sm text-slate-600">
                <div className="font-medium text-slate-800">{o.ship_name}</div>
                {address.map((l, i) => (
                  <div key={i}>{l}</div>
                ))}
                <div className="mt-1">
                  <a href={`tel:${o.ship_phone}`} className="text-brand-600 hover:underline">
                    {o.ship_phone}
                  </a>
                </div>
                {o.ship_email && (
                  <a href={`mailto:${o.ship_email}`} className="text-brand-600 hover:underline">
                    {o.ship_email}
                  </a>
                )}
              </div>
            </Section>

            {shippedish && (
              <Section
                icon={<Truck className="h-4 w-4" />}
                title="Shipment"
                action={
                  <button
                    className="inline-flex items-center gap-1 rounded p-1 text-sm text-slate-500 hover:bg-slate-100"
                    onClick={() => {
                      setTrackError(null);
                      setTracking({ mode: "edit", courier: o.courier ?? "", tracking_no: o.tracking_no ?? "", tracking_url: o.tracking_url ?? "", note: "" });
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                }
              >
                {hasTracking ? (
                  <div className="space-y-1 text-sm">
                    <div>
                      <span className="text-slate-500">Courier:</span> {o.courier || "—"}
                    </div>
                    <div>
                      <span className="text-slate-500">Tracking no:</span> <Mono>{o.tracking_no || "—"}</Mono>
                    </div>
                    {o.tracking_url && (
                      <a href={o.tracking_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-brand-600 hover:underline">
                        Track shipment <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">No tracking details yet</p>
                )}
              </Section>
            )}

            <Section icon={<CreditCard className="h-4 w-4" />} title="Payment">
              <div className="space-y-1.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">{methodLabel(o.payment_method)}</span>
                  <PaymentBadge status={o.payment_status} />
                </div>
                {o.paid_on && <div className="text-xs text-slate-500">Paid {formatDateTime(o.paid_on)}</div>}
                {o.razorpay_order_id && (
                  <div>
                    <span className="text-slate-500">Razorpay order:</span> <Mono>{o.razorpay_order_id}</Mono>
                  </div>
                )}
                {o.razorpay_payment_id && (
                  <div>
                    <span className="text-slate-500">Payment id:</span> <Mono>{o.razorpay_payment_id}</Mono>
                  </div>
                )}
              </div>
              {o.payments.length > 0 && (
                <ul className="mt-3 divide-y divide-slate-100 border-t border-slate-100">
                  {o.payments.map((p, i) => (
                    <li key={i} className="py-2 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`font-medium ${p.kind === "REFUND" ? "text-orange-700" : "text-slate-800"}`}>
                          {p.kind === "REFUND" ? "Refund" : "Payment"} · {rupee(p.amount)}
                        </span>
                        <span className="text-xs uppercase text-slate-500">{p.status}</span>
                      </div>
                      <div className="text-xs text-slate-400">
                        {formatDateTime(p.created_on)} · {p.provider}
                      </div>
                      {p.provider_payment_id && <Mono>{p.provider_payment_id}</Mono>}
                      {p.note && <div className="text-xs text-slate-500">{p.note}</div>}
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          </div>
        </div>
      </motion.div>

      {tracking && (
        <Modal title={tracking.mode === "ship" ? "Mark as shipped" : "Edit tracking"} onClose={() => setTracking(null)}>
          <form onSubmit={saveTracking} className="space-y-4">
            <ErrorBox message={trackError} />
            <div>
              <label htmlFor="t-courier" className="mb-1 block text-sm font-medium text-slate-700">Courier</label>
              <input id="t-courier" className={inputClass} maxLength={100} placeholder="e.g. Delhivery, Blue Dart, India Post" value={tracking.courier} onChange={(e) => setTracking({ ...tracking, courier: e.target.value })} />
            </div>
            <div>
              <label htmlFor="t-no" className="mb-1 block text-sm font-medium text-slate-700">Tracking number</label>
              <input id="t-no" className={inputClass} maxLength={100} value={tracking.tracking_no} onChange={(e) => setTracking({ ...tracking, tracking_no: e.target.value })} />
            </div>
            <div>
              <label htmlFor="t-url" className="mb-1 block text-sm font-medium text-slate-700">
                Tracking link <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <input id="t-url" type="url" className={inputClass} maxLength={500} placeholder="https://…" value={tracking.tracking_url} onChange={(e) => setTracking({ ...tracking, tracking_url: e.target.value })} />
            </div>
            {tracking.mode === "ship" && (
              <div>
                <label htmlFor="t-note" className="mb-1 block text-sm font-medium text-slate-700">
                  Note <span className="font-normal text-slate-400">(optional)</span>
                </label>
                <input id="t-note" className={inputClass} maxLength={500} value={tracking.note} onChange={(e) => setTracking({ ...tracking, note: e.target.value })} />
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setTracking(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? "Saving…" : tracking.mode === "ship" ? "Mark shipped" : "Save"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      <Invoice order={o} siteName={siteName} />
    </div>
  );
}
