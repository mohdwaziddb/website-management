import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertTriangle, ChevronDown, Eye, IndianRupee, PackageCheck, Printer, ShoppingBag, ShoppingCart } from "lucide-react";
import { api, errorMessage } from "../../lib/api";
import { PageResult } from "../../lib/types";
import DataTable, { Column, fetchAllPages } from "../../components/DataTable";
import { EmptyState, FormField, InfoBox, inputClass, PageHeader, SectionCard, showToast, StatCard, Tabs } from "../../components/ui";
import { formatDateTime, methodLabel, ORDER_STATUSES, PaymentBadge, rupee, statusMeta, StatusBadge } from "./shared";

const PAGE_SIZE = 20;

export type OrderRow = {
  id: number;
  order_no: string;
  status: string;
  status_label?: string;
  payment_method: string;
  payment_status: string;
  total: number | string;
  ship_name: string;
  ship_phone: string;
  ship_city: string;
  created_on: string;
  items: number;
};

type Summary = {
  today: { orders: number; revenue: number | string };
  month: { orders: number; revenue: number | string };
  allTime: { orders: number; revenue: number | string };
  byStatus: Record<string, number>;
  customers: number;
  pendingReviews: number;
  lowStockThreshold: number;
  lowStock: { id: number; title: string; variant: string | null; stock: number }[];
};

/** Orders ke columns — orders page aur customer popup dono me same */
export const ORDER_COLUMNS: Column<OrderRow>[] = [
  { key: "order_no", header: "Order", hideable: false, className: "whitespace-nowrap font-semibold text-brand-700", render: (o) => `#${o.order_no}`, exportValue: (o) => o.order_no },
  { key: "created_on", header: "Date", className: "whitespace-nowrap text-slate-500", render: (o) => formatDateTime(o.created_on), exportValue: (o) => formatDateTime(o.created_on) },
  {
    key: "customer",
    header: "Customer",
    render: (o) => (
      <>
        <div className="font-medium text-slate-900">{o.ship_name}</div>
        <div className="text-xs text-slate-500">
          {o.ship_phone}
          {o.ship_city ? ` · ${o.ship_city}` : ""}
        </div>
      </>
    ),
    exportValue: (o) => `${o.ship_name} (${o.ship_phone})`
  },
  { key: "items", header: "Items", align: "right", render: (o) => <span className="tabular-nums">{o.items}</span>, exportValue: (o) => Number(o.items) },
  { key: "total", header: "Total", align: "right", className: "whitespace-nowrap font-semibold tabular-nums text-slate-900", render: (o) => rupee(o.total), exportValue: (o) => Number(o.total) },
  {
    key: "payment",
    header: "Payment",
    render: (o) => (
      <div className="flex flex-col items-start gap-1">
        <span className="text-xs text-slate-500">{o.payment_method === "COD" ? "COD" : methodLabel(o.payment_method)}</span>
        <PaymentBadge status={o.payment_status} />
      </div>
    ),
    exportValue: (o) => `${methodLabel(o.payment_method)} · ${o.payment_status}`
  },
  { key: "status", header: "Status", render: (o) => <StatusBadge status={o.status} />, exportValue: (o) => statusMeta(o.status).label }
];

/** Chhoti list (customer popup) — pagination nahi */
export function OrdersTable({ items, onOpen, emptyText = "No orders yet" }: { items: OrderRow[] | null; onOpen: (o: OrderRow) => void; emptyText?: string }) {
  return (
    <DataTable<OrderRow>
      id="customer-orders"
      columns={ORDER_COLUMNS}
      rows={items}
      rowKey={(o) => o.id}
      onRowClick={onOpen}
      empty={<EmptyState icon={<ShoppingCart className="h-6 w-6" />} title={emptyText} />}
    />
  );
}

export default function OrdersPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [data, setData] = useState<PageResult<OrderRow> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState(params.get("status") ?? "");
  const [payStatus, setPayStatus] = useState("");
  const [method, setMethod] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");
  const [showLow, setShowLow] = useState(false);
  // Customers page ka "View orders" (?customer=5)
  const customer = params.get("customer") ?? "";

  useEffect(() => {
    api
      .get<Summary>("/shop/summary")
      .then((r) => setSummary(r.data))
      .catch((e) => showToast(errorMessage(e), true));
  }, []);

  const query = useCallback(
    (p: number, size: number) => {
      const out: Record<string, string | number> = { page: p, size };
      // khaali filter mat bhejo
      if (status) out.status = status;
      if (payStatus) out.payment_status = payStatus;
      if (method) out.payment_method = method;
      if (search) out.q = search;
      if (from) out.from = from;
      if (to) out.to = to;
      if (customer) out.customer_id = customer;
      return out;
    },
    [status, payStatus, method, search, from, to, customer]
  );

  const load = useCallback(() => {
    setLoading(true);
    api
      .get<PageResult<OrderRow>>("/shop/orders", { params: query(page, PAGE_SIZE) })
      .then((r) => setData(r.data))
      .catch((e) => showToast(errorMessage(e), true))
      .finally(() => setLoading(false));
  }, [page, query]);

  useEffect(load, [load]);

  // filter badla => page 1
  const filter = (set: (v: string) => void) => (v: string) => {
    setPage(1);
    set(v);
  };

  const by = summary?.byStatus ?? {};
  const allCount = Object.values(by).reduce((a, b) => a + Number(b || 0), 0);
  const toShip = Number(by.PLACED || 0) + Number(by.CONFIRMED || 0) + Number(by.PACKED || 0);
  const activeFilters = [payStatus, method, from, to].filter(Boolean).length;
  const filtered = activeFilters > 0 || !!search || !!status || !!customer;

  return (
    <div>
      <PageHeader icon={<ShoppingCart className="h-5 w-5" />} title="Orders" subtitle="Online store orders — track, ship and manage payments" />

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={<ShoppingBag className="h-5 w-5" />} label="Today" value={summary ? rupee(summary.today.revenue) : "…"} hint={summary ? `${summary.today.orders} order${summary.today.orders === 1 ? "" : "s"}` : undefined} />
        <StatCard
          icon={<IndianRupee className="h-5 w-5" />}
          tone="green"
          label="This month"
          value={summary ? rupee(summary.month.revenue) : "…"}
          hint={summary ? `${summary.month.orders} orders · all time ${rupee(summary.allTime.revenue)}` : undefined}
        />
        <StatCard
          icon={<PackageCheck className="h-5 w-5" />}
          label="Pending to ship"
          tone="violet"
          value={summary ? toShip : "…"}
          hint="Placed + confirmed + packed"
          active={status === "PLACED"}
          onClick={() => filter(setStatus)("PLACED")}
        />
        <StatCard
          icon={<AlertTriangle className="h-5 w-5" />}
          label="Low stock"
          tone={summary?.lowStock.length ? "amber" : "slate"}
          value={summary ? summary.lowStock.length : "…"}
          hint={summary ? `Stock ≤ ${summary.lowStockThreshold} · click to view` : undefined}
          active={showLow}
          onClick={() => setShowLow((s) => !s)}
        />
      </motion.div>

      {summary && showLow && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mb-5">
          <SectionCard
            title="Low stock products"
            actions={
              <button className="rounded p-1 text-slate-400 hover:bg-slate-100" onClick={() => setShowLow(false)} aria-label="Hide low stock">
                <ChevronDown className="h-4 w-4 rotate-180" />
              </button>
            }
            bodyClassName="p-0"
          >
            <DataTable
              id="low-stock"
              columns={[
                { key: "title", header: "Product", hideable: false, render: (p) => <Link to={`/m/products/${p.id}`} className="font-medium text-brand-600 hover:underline">{p.title}</Link>, exportValue: (p) => p.title },
                { key: "variant", header: "Variant", render: (p) => p.variant ?? "—", exportValue: (p) => p.variant },
                {
                  key: "stock",
                  header: "Stock",
                  align: "right",
                  render: (p) => <span className={`font-semibold tabular-nums ${Number(p.stock) <= 0 ? "text-red-600" : "text-amber-600"}`}>{Number(p.stock) <= 0 ? "Out of stock" : p.stock}</span>,
                  exportValue: (p) => p.stock
                }
              ]}
              rows={summary.lowStock}
              rowKey={(p) => `${p.id}-${p.variant ?? ""}`}
              onExport={() => Promise.resolve(summary.lowStock)}
              exportName="low-stock"
              empty={<EmptyState title="All products are well stocked" />}
            />
          </SectionCard>
        </motion.div>
      )}

      {customer && (
        <div className="mb-3">
          <InfoBox>
            Showing orders of one customer.{" "}
            <Link to="/store/orders" className="font-semibold underline">
              Show all orders
            </Link>
          </InfoBox>
        </div>
      )}
      <div className="mb-3 overflow-x-auto">
        <Tabs
          value={status}
          onChange={filter(setStatus)}
          items={["", ...ORDER_STATUSES].map((s) => ({ value: s, label: s ? statusMeta(s).label : "All", count: summary ? (s ? Number(by[s] || 0) : allCount) : undefined }))}
        />
      </div>

      <DataTable<OrderRow>
        id="orders"
        title="Orders"
        columns={ORDER_COLUMNS}
        rows={data?.items ?? null}
        rowKey={(o) => o.id}
        loading={loading}
        total={data?.total ?? 0}
        page={page}
        size={PAGE_SIZE}
        onPage={setPage}
        search={{ value: search, onChange: filter(setSearch), placeholder: "Order no, name, phone or email" }}
        filters={
          <>
            <FormField label="Payment status" htmlFor="flt-pay">
              <select id="flt-pay" className={inputClass} value={payStatus} onChange={(e) => filter(setPayStatus)(e.target.value)}>
                <option value="">Any</option>
                <option value="PENDING">Pending</option>
                <option value="PAID">Paid</option>
                <option value="FAILED">Failed</option>
                <option value="REFUNDED">Refunded</option>
              </select>
            </FormField>
            <FormField label="Payment method" htmlFor="flt-method">
              <select id="flt-method" className={inputClass} value={method} onChange={(e) => filter(setMethod)(e.target.value)}>
                <option value="">Any</option>
                <option value="COD">Cash on delivery</option>
                <option value="RAZORPAY">Razorpay</option>
              </select>
            </FormField>
            <div className="grid grid-cols-2 gap-2">
              <FormField label="From" htmlFor="flt-from">
                <input id="flt-from" type="date" className={inputClass} value={from} max={to || undefined} onChange={(e) => filter(setFrom)(e.target.value)} />
              </FormField>
              <FormField label="To" htmlFor="flt-to">
                <input id="flt-to" type="date" className={inputClass} value={to} min={from || undefined} onChange={(e) => filter(setTo)(e.target.value)} />
              </FormField>
            </div>
          </>
        }
        activeFilters={activeFilters}
        onClearFilters={() => {
          setPage(1);
          setPayStatus("");
          setMethod("");
          setFrom("");
          setTo("");
        }}
        onExport={() => fetchAllPages((p, size) => api.get<PageResult<OrderRow>>("/shop/orders", { params: query(p, size) }).then((r) => r.data))}
        exportName="orders"
        onRowClick={(o) => navigate(`/store/orders/${o.id}`)}
        rowActions={() => [
          { label: "View order", icon: <Eye className="h-4 w-4" />, to: (o) => `/store/orders/${o.id}` },
          { label: "Print invoice", icon: <Printer className="h-4 w-4" />, to: (o) => `/store/orders/${o.id}?print=1` }
        ]}
        empty={<EmptyState icon={<ShoppingCart className="h-6 w-6" />} title={filtered ? "No orders match these filters" : "No orders yet"} text={filtered ? "Try another status or clear the filters." : "New orders from your website will appear here."} />}
      />
    </div>
  );
}
