import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { History, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { api, errorMessage, fileUrl } from "../lib/api";
import { useModule } from "../lib/modules";
import { FieldDef, MONTHS, PageResult, Row } from "../lib/types";
import { clearOptionCache } from "../components/FieldInput";
import { Badge, baseInputClass, Button, Card, inputClass, PageHeader, Pagination, showToast } from "../components/ui";

const PAGE_SIZE = 20;

function Cell({ field, row }: { field: FieldDef; row: Row }) {
  const v = row[field.name];
  if (v == null || v === "") return <span className="text-slate-300">—</span>;
  switch (field.type) {
    case "IMAGE":
      return <img src={fileUrl(v)} alt="" className="h-10 w-14 rounded object-cover" />;
    case "FILE":
      return (
        <a href={fileUrl(v)} target="_blank" rel="noreferrer" className="text-brand-600 underline">
          View
        </a>
      );
    case "URL":
      return (
        <a href={String(v)} target="_blank" rel="noreferrer" className="block max-w-[200px] truncate text-brand-600 underline">
          {String(v)}
        </a>
      );
    case "REF":
      return <>{String(row[`${field.name}_label`] ?? `#${v}`)}</>;
    case "MONTH":
      return <>{MONTHS[Number(v) - 1]}</>;
    case "BOOLEAN":
      return <>{v ? "Yes" : "No"}</>;
    default:
      return <span className="line-clamp-2 max-w-xs">{String(v)}</span>;
  }
}

export default function ModuleListPage() {
  const { key } = useParams();
  const m = useModule(key);
  const [data, setData] = useState<PageResult<Row> | null>(null);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const load = useCallback(() => {
    if (!m) return;
    const params: Record<string, string | number> = { page, size: PAGE_SIZE, q: search };
    if (status) params.is_publish = status;
    api
      .get<PageResult<Row>>(`/m/${m.key}`, { params })
      .then((r) => setData(r.data))
      .catch((e) => showToast(errorMessage(e), true));
  }, [m, page, search, status]);

  useEffect(load, [load]);

  if (!m) return <div className="text-slate-500">Module not found</div>;

  const columns = m.fields.filter((f) => f.listed);

  const togglePublish = async (row: Row) => {
    try {
      await api.put(`/m/${m.key}/${row.id}`, { is_publish: !row.is_publish });
      load();
    } catch (e) {
      showToast(errorMessage(e), true);
    }
  };

  const remove = async (row: Row) => {
    if (!confirm(`Delete "${String(row[m.titleField] ?? row.id)}"?`)) return;
    try {
      await api.delete(`/m/${m.key}/${row.id}`);
      clearOptionCache(m.key);
      showToast("Deleted");
      load();
    } catch (e) {
      showToast(errorMessage(e), true);
    }
  };

  return (
    <div>
      <PageHeader
        title={m.label}
        actions={
          <>
            <Link to={`/logs?module=${m.key}`}>
              <Button variant="secondary">
                <History className="h-4 w-4" /> Logs
              </Button>
            </Link>
            <Link to={`/m/${m.key}/new`}>
              <Button>
                <Plus className="h-4 w-4" /> Add New
              </Button>
            </Link>
          </>
        }
      />
      <Card>
        <div className="flex flex-wrap gap-2 border-b border-slate-200 p-3">
          <form
            className="relative min-w-[200px] flex-1"
            onSubmit={(e) => {
              e.preventDefault();
              setPage(1);
              setSearch(q);
            }}
          >
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input className={`${inputClass} pl-9`} placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
          </form>
          {m.publishable && (
            <select
              className={`${baseInputClass} w-40`}
              value={status}
              onChange={(e) => {
                setPage(1);
                setStatus(e.target.value);
              }}
            >
              <option value="">All</option>
              <option value="true">Published</option>
              <option value="false">Draft</option>
            </select>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2.5 font-medium">#</th>
                {columns.map((f) => (
                  <th key={f.name} className="px-4 py-2.5 font-medium">
                    {f.label}
                  </th>
                ))}
                {m.sortable && <th className="px-4 py-2.5 font-medium">Order</th>}
                {m.publishable && <th className="px-4 py-2.5 font-medium">Status</th>}
                <th className="px-4 py-2.5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.items.map((row, i) => (
                <tr key={row.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-2.5 text-slate-400">{(page - 1) * PAGE_SIZE + i + 1}</td>
                  {columns.map((f) => (
                    <td key={f.name} className="px-4 py-2.5 text-slate-700">
                      <Cell field={f} row={row} />
                    </td>
                  ))}
                  {m.sortable && <td className="px-4 py-2.5 text-slate-500">{String(row.sort_order ?? 0)}</td>}
                  {m.publishable && (
                    <td className="px-4 py-2.5">
                      <button onClick={() => togglePublish(row)} title="Click to toggle">
                        <Badge on={row.is_publish === true} onText="Published" offText="Draft" />
                      </button>
                    </td>
                  )}
                  <td className="whitespace-nowrap px-4 py-2.5 text-right">
                    <Link to={`/m/${m.key}/${row.id}`} className="inline-flex rounded p-1.5 text-slate-500 hover:bg-slate-100" title="Edit">
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <Link
                      to={`/logs?module=${m.key}&recordId=${row.id}`}
                      className="inline-flex rounded p-1.5 text-slate-500 hover:bg-slate-100"
                      title="History"
                    >
                      <History className="h-4 w-4" />
                    </Link>
                    <button onClick={() => remove(row)} className="inline-flex rounded p-1.5 text-red-500 hover:bg-red-50" title="Delete">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {data && data.items.length === 0 && (
                <tr>
                  <td colSpan={columns.length + 4} className="px-4 py-10 text-center text-slate-400">
                    No records yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {data && <Pagination page={page} size={PAGE_SIZE} total={data.total} onPage={setPage} />}
      </Card>
    </div>
  );
}
