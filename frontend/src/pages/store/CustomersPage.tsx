import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Eye, Mail, MapPin, Phone, ShoppingCart, UserCheck, UserRound, UserX } from "lucide-react";
import { api, errorMessage } from "../../lib/api";
import { PageResult } from "../../lib/types";
import { Avatar, Badge, confirmDialog, EmptyState, ErrorBox, Modal, PageHeader, showToast } from "../../components/ui";
import DataTable, { Column, fetchAllPages } from "../../components/DataTable";
import { OrdersTable, type OrderRow } from "./OrdersPage";
import { formatDateTime, rupee } from "./shared";

const PAGE_SIZE = 20;

type Customer = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
  created_on: string;
  last_login: string | null;
  orders: number;
  spent: number | string;
};

type Address = Record<string, unknown> & { id?: number };
type CustomerDetail = Customer & { addresses: Address[]; orders: OrderRow[] | number };

function addressLines(a: Address): string[] {
  const s = (k: string) => (a[k] == null ? "" : String(a[k]));
  return [s("name"), s("line1"), s("line2"), [s("city"), s("state")].filter(Boolean).join(", "), s("pincode"), s("phone")].filter(Boolean);
}

/** Customer ka popup: details + addresses + orders */
function CustomerModal({ id, onClose, onToggle }: { id: number; onClose: () => void; onToggle: (c: Customer) => Promise<boolean> }) {
  const navigate = useNavigate();
  const [c, setC] = useState<CustomerDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<CustomerDetail>(`/shop/customers/${id}`)
      .then((r) => setC(r.data))
      .catch((e) => setError(errorMessage(e)));
  }, [id]);

  const orders = c && Array.isArray(c.orders) ? c.orders : [];

  return (
    <Modal title={c ? c.name : "Customer"} onClose={onClose} wide>
      <ErrorBox message={error} />
      {!c && !error && <p className="py-6 text-center text-sm text-slate-400">Loading…</p>}
      {c && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-slate-400" /> {c.email}
              </div>
              {c.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-slate-400" /> {c.phone}
                </div>
              )}
              <div className="text-xs text-slate-400">
                Joined {formatDateTime(c.created_on)} · Last login {c.last_login ? formatDateTime(c.last_login) : "never"}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                title="Click to toggle"
                onClick={async () => {
                  if (await onToggle(c)) setC({ ...c, is_active: !c.is_active });
                }}
              >
                <Badge on={c.is_active} onText="Active" offText="Disabled" />
              </button>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-700">Addresses</h3>
            {c.addresses.length === 0 ? (
              <p className="text-sm text-slate-400">No saved addresses</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {c.addresses.map((a, i) => (
                  <div key={a.id ?? i} className="flex gap-2 rounded-lg border border-slate-200 p-3 text-sm text-slate-600">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                    <div>
                      {addressLines(a).map((l, j) => (
                        <div key={j} className={j === 0 ? "font-medium text-slate-800" : ""}>
                          {l}
                        </div>
                      ))}
                      {(a.is_default === true || a.is_default === 1) && <span className="mt-1 inline-flex rounded bg-brand-50 px-1.5 text-[11px] font-medium text-brand-700">Default</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-700">Orders</h3>
            <div className="rounded-lg border border-slate-200">
              <OrdersTable items={orders} onOpen={(o) => navigate(`/store/orders/${o.id}`)} />
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

export default function CustomersPage() {
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState<PageResult<Customer> | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  // ?id=5 = seedha us customer ka popup (order detail se link)
  const openId = Number(params.get("id")) || null;

  const query = useCallback(
    (p: number, size: number) => {
      const out: Record<string, string | number> = { page: p, size };
      if (search) out.q = search;
      return out;
    },
    [search]
  );

  const load = useCallback(() => {
    setLoading(true);
    api
      .get<PageResult<Customer>>("/shop/customers", { params: query(page, PAGE_SIZE) })
      .then((r) => setData(r.data))
      .catch((e) => showToast(errorMessage(e), true))
      .finally(() => setLoading(false));
  }, [page, query]);

  useEffect(load, [load]);

  /** Disable par confirm (logout ho jaayega); enable seedha */
  const toggle = async (c: Customer): Promise<boolean> => {
    const next = !c.is_active;
    if (!next) {
      const ok = await confirmDialog({
        title: `Disable ${c.name}?`,
        message: `${c.email} will be logged out and won't be able to sign in or place orders until enabled again.`,
        confirmText: "Disable",
        danger: true
      });
      if (!ok) return false;
    }
    try {
      await api.put(`/shop/customers/${c.id}/active`, { is_active: next });
      showToast(next ? "Customer enabled" : "Customer disabled");
      setData((d) => d && { ...d, items: d.items.map((x) => (x.id === c.id ? { ...x, is_active: next } : x)) });
      return true;
    } catch (e) {
      showToast(errorMessage(e), true);
      return false;
    }
  };

  const columns: Column<Customer>[] = [
    {
      key: "name",
      header: "Customer",
      hideable: false,
      render: (c) => (
        <span className="flex items-center gap-3">
          <Avatar name={c.name} size="sm" />
          <span>
            <span className="block font-medium text-slate-900">{c.name}</span>
            <span className="block text-xs text-slate-500">{c.phone || c.email}</span>
          </span>
        </span>
      ),
      exportValue: (c) => c.name
    },
    { key: "email", header: "Email", render: (c) => c.email, exportValue: (c) => c.email },
    { key: "phone", header: "Phone", render: (c) => c.phone || "—", exportValue: (c) => c.phone },
    { key: "orders", header: "Orders", align: "right", render: (c) => <span className="tabular-nums">{c.orders}</span>, exportValue: (c) => Number(c.orders) },
    { key: "spent", header: "Total Spent", align: "right", className: "whitespace-nowrap font-semibold tabular-nums text-slate-900", render: (c) => rupee(c.spent), exportValue: (c) => Number(c.spent) },
    { key: "created_on", header: "Joined", className: "whitespace-nowrap text-slate-500", render: (c) => formatDateTime(c.created_on).split(",")[0], exportValue: (c) => formatDateTime(c.created_on).split(",")[0] },
    { key: "status", header: "Status", align: "center", render: (c) => <Badge on={c.is_active} onText="Active" offText="Disabled" />, exportValue: (c) => (c.is_active ? "Active" : "Disabled") }
  ];

  const open = (id: number | null) => {
    const p = new URLSearchParams(params);
    if (id) p.set("id", String(id));
    else p.delete("id");
    setParams(p, { replace: true });
  };

  return (
    <div>
      <PageHeader icon={<UserRound className="h-5 w-5" />} title="Customers" subtitle="Shoppers who created an account on your store" />
      <DataTable<Customer>
        id="customers"
        title="Customers"
        columns={columns}
        rows={data?.items ?? null}
        rowKey={(c) => c.id}
        loading={loading}
        total={data?.total ?? 0}
        page={page}
        size={PAGE_SIZE}
        onPage={setPage}
        search={{
          value: search,
          onChange: (v) => {
            setPage(1);
            setSearch(v);
          },
          placeholder: "Search customer — name, email or phone"
        }}
        onExport={() => fetchAllPages((p, size) => api.get<PageResult<Customer>>("/shop/customers", { params: query(p, size) }).then((r) => r.data))}
        exportName="customers"
        onRowClick={(c) => open(c.id)}
        rowClassName={(c) => (c.is_active ? "" : "opacity-60")}
        rowActions={(c) => [
          { label: "View details", icon: <Eye className="h-4 w-4" />, onClick: (x) => open(x.id) },
          { label: "View orders", icon: <ShoppingCart className="h-4 w-4" />, onClick: (x) => navigate(`/store/orders?customer=${x.id}`), hidden: () => !c.orders },
          c.is_active
            ? { label: "Disable", icon: <UserX className="h-4 w-4" />, onClick: (x) => toggle(x), danger: true }
            : { label: "Enable", icon: <UserCheck className="h-4 w-4" />, onClick: (x) => toggle(x) }
        ]}
        empty={<EmptyState icon={<UserRound className="h-6 w-6" />} title={search ? "No customers match your search" : "No customers yet"} text={search ? undefined : "Customers appear here when they sign up on your store."} />}
      />
      {openId && <CustomerModal key={openId} id={openId} onClose={() => open(null)} onToggle={toggle} />}
    </div>
  );
}
