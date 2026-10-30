import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowUpDown, Eye, EyeOff, History, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { api, errorMessage, fileUrl } from "../lib/api";
import { useModule } from "../lib/modules";
import { formatDecimal } from "../lib/money";
import { FieldDef, MONTHS, PageResult, Row } from "../lib/types";
import { clearOptionCache } from "../components/FieldInput";
import { ModuleIcon } from "../components/Icon";
import DataTable, { BulkAction, Column, fetchAllPages } from "../components/DataTable";
import ReorderList, { orderPayload } from "../components/ReorderList";
import { Badge, Button, confirmDialog, EmptyState, FormField, inputClass, PageHeader, showToast, Switch, Thumb } from "../components/ui";

const PAGE_SIZE = 20;

function Cell({ field, row }: { field: FieldDef; row: Row }) {
  const v = row[field.name];
  if (v == null || v === "") return <span className="text-slate-300">—</span>;
  switch (field.type) {
    case "IMAGE":
      return <Thumb src={fileUrl(v)} />;
    case "FILE":
      return (
        <a href={fileUrl(v)} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="font-medium text-brand-600 hover:underline">
          View file
        </a>
      );
    case "URL":
      return (
        <a href={String(v)} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="block max-w-[200px] truncate text-brand-600 hover:underline">
          {String(v)}
        </a>
      );
    case "REF":
      return <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-700">{String(row[`${field.name}_label`] ?? `#${v}`)}</span>;
    case "MONTH":
      return <>{MONTHS[Number(v) - 1]}</>;
    case "BOOLEAN":
      return v ? <span className="text-emerald-600">Yes</span> : <span className="text-slate-400">No</span>;
    case "DECIMAL":
      return <span className="whitespace-nowrap tabular-nums">{formatDecimal(field.label, v)}</span>;
    default:
      return <span className="line-clamp-2 max-w-xs">{String(v)}</span>;
  }
}

/** Excel me cell ki value (label / Yes-No / mahina naam) */
export function exportValue(field: FieldDef, row: Row): string | number | null {
  const v = row[field.name];
  if (v == null || v === "") return null;
  switch (field.type) {
    case "REF":
      return String(row[`${field.name}_label`] ?? v);
    case "MONTH":
      return MONTHS[Number(v) - 1] ?? String(v);
    case "BOOLEAN":
      return v ? "Yes" : "No";
    case "IMAGE":
    case "FILE":
      return fileUrl(v);
    case "RICHTEXT":
      return String(v).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    default:
      return typeof v === "number" ? v : String(v);
  }
}

type Status = "" | "true" | "false";

type BulkResult = { done: number; skipped: { id: number; reason: string }[] };

/** "3 deleted · 1 skipped (Cannot delete: used in 2 Image Gallery record(s))" */
export function bulkMessage(action: "publish" | "draft" | "delete", r: BulkResult): string {
  const verb = { publish: "published", draft: "moved to draft", delete: "deleted" }[action];
  const head = `${r.done} ${verb}`;
  if (!r.skipped.length) return head;
  return `${head} · ${r.skipped.length} skipped (${r.skipped[0].reason})`;
}

export default function ModuleListPage() {
  const { key } = useParams();
  const m = useModule(key);
  const navigate = useNavigate();
  const [data, setData] = useState<PageResult<Row> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<Status>("");
  // drag & drop order mode (sirf sortable modules)
  const [ordering, setOrdering] = useState<Row[] | null>(null);

  // menu badla (/m/pages -> /m/sliders) => filters reset
  useEffect(() => {
    setData(null);
    setPage(1);
    setSearch("");
    setStatus("");
    setOrdering(null);
  }, [key]);

  const params = useCallback(
    (p: number, size: number) => {
      const out: Record<string, string | number> = { page: p, size, q: search };
      if (status) out.is_publish = status;
      return out;
    },
    [search, status]
  );

  const load = useCallback(() => {
    if (!m) return;
    setLoading(true);
    api
      .get<PageResult<Row>>(`/m/${m.key}`, { params: params(page, PAGE_SIZE) })
      .then((r) => setData(r.data))
      .catch((e) => showToast(errorMessage(e), true))
      .finally(() => setLoading(false));
  }, [m, page, params]);

  useEffect(load, [load]);

  if (!m) return <EmptyState title="Menu not found" text="This section is not available for your website type." />;

  const singular = m.label.replace(/s$/, "");

  const togglePublish = async (row: Row) => {
    try {
      await api.put(`/m/${m.key}/${row.id}`, { is_publish: !row.is_publish });
      showToast(row.is_publish ? "Moved to draft" : "Published on website");
      load();
    } catch (e) {
      showToast(errorMessage(e), true);
    }
  };

  const remove = async (row: Row) => {
    const ok = await confirmDialog({
      title: `Delete this ${singular.toLowerCase()}?`,
      message: (
        <>
          <b>{String(row[m.titleField] ?? row.id)}</b> will be removed from the website.
        </>
      ),
      confirmText: "Delete",
      danger: true
    });
    if (!ok) return;
    try {
      await api.delete(`/m/${m.key}/${row.id}`);
      clearOptionCache(m.key);
      showToast("Deleted");
      load();
    } catch (e) {
      showToast(errorMessage(e), true);
    }
  };

  const bulk = async (action: "publish" | "draft" | "delete", rows: Row[]) => {
    if (action === "delete") {
      const ok = await confirmDialog({
        title: `Delete ${rows.length} ${rows.length === 1 ? singular.toLowerCase() : m.label.toLowerCase()}?`,
        message: "They will be removed from the website. Records used elsewhere (e.g. a category with photos) are skipped.",
        confirmText: `Delete ${rows.length}`,
        danger: true
      });
      if (!ok) return;
    }
    try {
      const r = await api.post<BulkResult>(`/m/${m.key}/bulk`, { ids: rows.map((x) => x.id), action });
      if (action === "delete") clearOptionCache(m.key);
      showToast(bulkMessage(action, r.data), r.data.done === 0);
      load();
    } catch (e) {
      showToast(errorMessage(e), true);
    }
  };

  const bulkActions: BulkAction<Row>[] = [
    ...(m.publishable
      ? [
          { label: "Publish", icon: <Eye className="h-4 w-4" />, onClick: (rows: Row[]) => bulk("publish", rows) },
          { label: "Move to draft", icon: <EyeOff className="h-4 w-4" />, onClick: (rows: Row[]) => bulk("draft", rows) }
        ]
      : []),
    { label: "Delete", icon: <Trash2 className="h-4 w-4" />, danger: true, onClick: (rows: Row[]) => bulk("delete", rows) }
  ];

  const startOrdering = async () => {
    try {
      const r = await api.get<PageResult<Row>>(`/m/${m.key}`, { params: { page: 1, size: 100, sort: "sort_order", dir: "asc" } });
      setOrdering(r.data.items);
      if (r.data.total > 100) showToast("Only the first 100 records can be reordered here", true);
    } catch (e) {
      showToast(errorMessage(e), true);
    }
  };

  const saveOrder = async (items: Row[]) => {
    try {
      await api.put(`/m/${m.key}/reorder`, orderPayload(items));
      showToast("Order saved — your website shows the new order");
      setOrdering(null);
      load();
    } catch (e) {
      showToast(errorMessage(e), true);
    }
  };

  const columns: Column<Row>[] = [
    ...m.fields
      .filter((f) => f.listed)
      .map<Column<Row>>((f) => ({
        key: f.name,
        header: f.label,
        hideable: f.name !== m.titleField,
        align: f.type === "DECIMAL" || f.type === "NUMBER" ? "right" : "left",
        className: f.name === m.titleField ? "font-medium text-slate-900" : undefined,
        render: (row) => <Cell field={f} row={row} />,
        exportValue: (row) => exportValue(f, row)
      }))
  ];
  if (m.sortable) columns.push({ key: "sort_order", header: "Order", align: "right", render: (r) => <span className="tabular-nums text-slate-500">{String(r.sort_order ?? 0)}</span>, exportValue: (r) => Number(r.sort_order ?? 0) });
  if (m.publishable) {
    columns.push({
      key: "is_publish",
      header: "Status",
      align: "center",
      render: (r) => (
        <span onClick={(e) => e.stopPropagation()} className="inline-flex">
          <Switch checked={r.is_publish === true} onChange={() => togglePublish(r)} label={undefined} />
        </span>
      ),
      exportValue: (r) => (r.is_publish ? "Published" : "Draft")
    });
  }
  if (!m.publishable) columns.push({ key: "is_active", header: "Active", align: "center", render: (r) => <Badge on={r.is_active !== false} onText="Active" offText="Inactive" />, exportValue: (r) => (r.is_active !== false ? "Yes" : "No") });

  const filtered = search !== "" || status !== "";

  return (
    <div>
      <PageHeader
        icon={<ModuleIcon name={m.icon} className="h-5 w-5" />}
        title={m.label}
        subtitle={data ? `${data.total} record${data.total === 1 ? "" : "s"} · ${m.group}` : m.group}
        actions={
          <>
            {m.sortable && !ordering && (
              <Button variant="secondary" onClick={startOrdering}>
                <ArrowUpDown className="h-4 w-4" /> Reorder
              </Button>
            )}
            <Link to={`/logs?module=${m.key}`}>
              <Button variant="secondary">
                <History className="h-4 w-4" /> History
              </Button>
            </Link>
          </>
        }
      />
      {ordering ? (
        <ReorderList<Row>
          items={ordering}
          onCancel={() => setOrdering(null)}
          onSave={saveOrder}
          render={(r) => {
            const img = m.fields.find((f) => f.type === "IMAGE" && f.listed);
            return (
              <span className="flex items-center gap-3">
                {img && <Thumb src={fileUrl(r[img.name])} className="h-9 w-12" />}
                <span className="truncate font-medium text-slate-800">{String(r[m.titleField] ?? `#${r.id}`)}</span>
                {m.publishable && !r.is_publish && <Badge on={false} onText="" offText="Draft" />}
              </span>
            );
          }}
        />
      ) : (
      <DataTable<Row>
        id={`m-${m.key}`}
        title={m.label}
        columns={columns}
        rows={data?.items ?? null}
        rowKey={(r) => r.id}
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
          placeholder: `Search ${m.label.toLowerCase()}`
        }}
        filters={
          m.publishable ? (
            <FormField label="Status" htmlFor="flt-status">
              <select
                id="flt-status"
                className={inputClass}
                value={status}
                onChange={(e) => {
                  setPage(1);
                  setStatus(e.target.value as Status);
                }}
              >
                <option value="">All</option>
                <option value="true">Published</option>
                <option value="false">Draft</option>
              </select>
            </FormField>
          ) : undefined
        }
        activeFilters={status ? 1 : 0}
        onClearFilters={() => {
          setPage(1);
          setStatus("");
        }}
        toolbar={
          <Link to={`/m/${m.key}/new`}>
            <Button>
              <Plus className="h-4 w-4" /> Add {singular}
            </Button>
          </Link>
        }
        onExport={() => fetchAllPages((p, size) => api.get<PageResult<Row>>(`/m/${m.key}`, { params: params(p, size) }).then((r) => r.data))}
        exportName={m.key}
        onRowClick={(r) => navigate(`/m/${m.key}/${r.id}`)}
        bulkActions={bulkActions}
        rowActions={(r) => [
          { label: "Edit", icon: <Pencil className="h-4 w-4" />, to: (x) => `/m/${m.key}/${x.id}` },
          ...(m.publishable
            ? [{ label: r.is_publish ? "Move to draft" : "Publish", icon: r.is_publish ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />, onClick: togglePublish }]
            : []),
          { label: "History", icon: <History className="h-4 w-4" />, to: (x) => `/logs?module=${m.key}&recordId=${x.id}` },
          { label: "Delete", icon: <Trash2 className="h-4 w-4" />, onClick: remove, danger: true }
        ]}
        empty={
          filtered ? (
            <EmptyState
              icon={<Search className="h-6 w-6" />}
              title="No matching records"
              text="Try a different search or filter."
              action={
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSearch("");
                    setStatus("");
                    setPage(1);
                  }}
                >
                  Clear filters
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={<ModuleIcon name={m.icon} className="h-6 w-6" />}
              title={`No ${m.label.toLowerCase()} yet`}
              text="Add your first one — it will appear on your website once published."
              action={
                <Link to={`/m/${m.key}/new`}>
                  <Button>
                    <Plus className="h-4 w-4" /> Add {singular}
                  </Button>
                </Link>
              }
            />
          )
        }
      />
      )}
    </div>
  );
}
