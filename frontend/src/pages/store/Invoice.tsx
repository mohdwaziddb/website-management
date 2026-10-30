import { createPortal } from "react-dom";
import { rupee } from "./shared";
import type { OrderDetail } from "./OrderDetailPage";

// Print ke waqt sirf invoice dikhe — baaki poora admin chhup jaaye (body ke direct children me sirf yeh)
const PRINT_CSS = `
.wm-invoice { display: none; }
@media print {
  body > *:not(.wm-invoice) { display: none !important; }
  .wm-invoice { display: block !important; }
  body { background: #fff !important; }
  @page { margin: 12mm; }
}
`;

function fmtDate(v: string | null | undefined): string {
  if (!v) return "—";
  const d = new Date(v);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/** Tax invoice — screen par hidden, window.print() par sirf yahi chhapta hai */
export default function Invoice({ order: o, siteName }: { order: OrderDetail; siteName: string }) {
  const seller = o.seller ?? { businessName: "", gstin: "", address: "" };
  const inclusive = o.prices_include_tax === true || o.prices_include_tax === 1;
  const address = [o.ship_line1, o.ship_line2, [o.ship_city, o.ship_state].filter(Boolean).join(", "), o.ship_pincode].filter(Boolean);
  const th = "border-b border-slate-300 px-2 py-1.5 text-left font-semibold";
  const td = "border-b border-slate-200 px-2 py-1.5 align-top";

  return createPortal(
    <div className="wm-invoice p-2 text-[12px] text-black">
      <style>{PRINT_CSS}</style>
      <div className="flex items-start justify-between border-b-2 border-black pb-3">
        <div>
          <div className="text-lg font-bold">{seller.businessName || siteName}</div>
          {seller.address && <div className="max-w-xs whitespace-pre-line">{seller.address}</div>}
          {seller.gstin && <div>GSTIN: {seller.gstin}</div>}
        </div>
        <div className="text-right">
          <div className="text-xl font-bold uppercase tracking-wide">Tax Invoice</div>
          <div>Invoice / Order: #{o.order_no}</div>
          <div>Date: {fmtDate(o.created_on)}</div>
          <div>
            Payment: {o.payment_method === "COD" ? "Cash on delivery" : "Online (Razorpay)"} · {o.payment_status}
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-6">
        <div>
          <div className="font-semibold uppercase">Bill to</div>
          <div>{o.customer?.name || o.ship_name}</div>
          {(o.customer?.email || o.ship_email) && <div>{o.customer?.email || o.ship_email}</div>}
          <div>{o.customer?.phone || o.ship_phone}</div>
        </div>
        <div>
          <div className="font-semibold uppercase">Ship to</div>
          <div>{o.ship_name}</div>
          {address.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
          <div>Phone: {o.ship_phone}</div>
        </div>
      </div>

      <table className="mt-4 w-full border-collapse">
        <thead>
          <tr>
            <th className={th}>#</th>
            <th className={th}>Item</th>
            <th className={`${th} text-right`}>Qty</th>
            <th className={`${th} text-right`}>Rate</th>
            <th className={`${th} text-right`}>Discount</th>
            <th className={`${th} text-right`}>GST %</th>
            <th className={`${th} text-right`}>GST</th>
            <th className={`${th} text-right`}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {o.items.map((it, i) => (
            <tr key={i}>
              <td className={td}>{i + 1}</td>
              <td className={td}>
                {it.title}
                {it.variant_title && <span> — {it.variant_title}</span>}
                {it.sku && <div className="text-[10px] text-slate-600">SKU: {it.sku}</div>}
              </td>
              <td className={`${td} text-right`}>{it.qty}</td>
              <td className={`${td} text-right`}>{rupee(it.unit_price)}</td>
              <td className={`${td} text-right`}>{Number(it.discount) ? rupee(it.discount) : "—"}</td>
              <td className={`${td} text-right`}>{it.gst_rate != null ? `${Number(it.gst_rate)}%` : "—"}</td>
              <td className={`${td} text-right`}>{rupee(it.tax)}</td>
              <td className={`${td} text-right`}>{rupee(it.line_total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-3 flex justify-end">
        <table className="w-64">
          <tbody>
            <InvRow label="Subtotal" value={rupee(o.subtotal)} />
            {Number(o.discount) > 0 && <InvRow label={`Discount${o.coupon_code ? ` (${o.coupon_code})` : ""}`} value={`− ${rupee(o.discount)}`} />}
            <InvRow label={inclusive ? "GST (included)" : "GST"} value={rupee(o.tax)} />
            <InvRow label="Shipping" value={Number(o.shipping) > 0 ? rupee(o.shipping) : "Free"} />
            {Number(o.cod_fee) > 0 && <InvRow label="COD charge" value={rupee(o.cod_fee)} />}
            <tr className="border-t-2 border-black text-sm font-bold">
              <td className="py-1.5">Total</td>
              <td className="py-1.5 text-right">{rupee(o.total)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      {inclusive && <p className="mt-2">Prices are inclusive of GST.</p>}
      <p className="mt-8 text-center text-[10px] text-slate-600">This is a computer generated invoice and does not require a signature.</p>
    </div>,
    document.body
  );
}

function InvRow({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td className="py-0.5">{label}</td>
      <td className="py-0.5 text-right">{value}</td>
    </tr>
  );
}
