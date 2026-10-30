import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { History } from "lucide-react";
import { api, errorMessage } from "../lib/api";
import { useModules } from "../lib/modules";
import { relativeTime } from "../lib/time";
import { PageResult } from "../lib/types";
import DataTable, { Column, fetchAllPages } from "../components/DataTable";
import { Avatar, EmptyState, FormField, inputClass, PageHeader, Pill, showToast, Tone } from "../components/ui";
import { formatDateTime } from "./UsersPage";

type Log = { id: number; module: string; record_id: number | null; action: string; summary: string; user_name: string; created_on: string };

const ACTION_TONE: Record<string, Tone> = { CREATE: "green", UPDATE: "blue", DELETE: "rose", IMPORT: "violet", RESET: "amber", REORDER: "slate" };
const ACTIONS = ["CREATE", "UPDATE", "DELETE", "IMPORT", "RESET", "REORDER"];
const EXTRA_MODULES: Record<string, string> = { settings: "Website Settings", users: "Users", orders: "Orders", store_settings: "Store Settings", customers: "Customers", templates: "Templates" };
const PAGE_SIZE = 25;

export default function LogsPage() {
  const modules = useModules();
  const [params, setParams] = useSearchParams();
  const module = params.get("module") ?? "";
  const recordId = params.get("recordId") ?? "";
  const [action, setAction] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PageResult<Log> | null>(null);
  const [loading, setLoading] = useState(true);

  const label = (key: string) => modules.find((m) => m.key === key)?.label ?? EXTRA_MODULES[key] ?? key;

  const query = useCallback(
    (p: number, size: number) => ({ module: module || undefined, recordId: recordId || undefined, action: action || undefined, q: search || undefined, page: p, size }),
    [module, recordId, action, search]
  );

  useEffect(() => {
    setLoading(true);
    api
      .get<PageResult<Log>>("/logs", { params: query(page, PAGE_SIZE) })
      .then((r) => setData(r.data))
      .catch((e) => showToast(errorMessage(e), true))
      .finally(() => setLoading(false));
  }, [query, page]);

  const setModule = (v: string) => {
    setPage(1);
    setParams(v ? { module: v } : {});
  };

  const columns: Column<Log>[] = [
    {
      key: "when",
      header: "When",
      className: "whitespace-nowrap text-slate-500",
      render: (l) => <span title={formatDateTime(l.created_on)}>{relativeTime(l.created_on)}</span>,
      exportValue: (l) => formatDateTime(l.created_on)
    },
    { key: "module", header: "Section", render: (l) => <span className="font-medium text-slate-800">{label(l.module)}</span>, exportValue: (l) => label(l.module) },
    { key: "action", header: "Action", render: (l) => <Pill tone={ACTION_TONE[l.action] ?? "slate"}>{l.action.toLowerCase()}</Pill>, exportValue: (l) => l.action },
    { key: "summary", header: "Details", hideable: false, render: (l) => <span className="line-clamp-2 max-w-xl text-slate-700">{l.summary}</span>, exportValue: (l) => l.summary },
    {
      key: "user",
      header: "By",
      render: (l) => (
        <span className="flex items-center gap-2 whitespace-nowrap text-slate-700">
          <Avatar name={l.user_name || "System"} size="sm" /> {l.user_name || "System"}
        </span>
      ),
      exportValue: (l) => l.user_name || "System"
    }
  ];

  return (
    <div>
      <PageHeader icon={<History className="h-5 w-5" />} title="Activity Logs" subtitle={recordId ? `${label(module)} · record #${recordId}` : "Who changed what, and when"} />
      <DataTable<Log>
        id="logs"
        title="Activity"
        columns={columns}
        rows={data?.items ?? null}
        rowKey={(l) => l.id}
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
          placeholder: "Search details or user"
        }}
        filters={
          <>
            <FormField label="Section" htmlFor="flt-module">
              <select id="flt-module" className={inputClass} value={module} onChange={(e) => setModule(e.target.value)}>
                <option value="">All sections</option>
                {modules.map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.label}
                  </option>
                ))}
                {Object.entries(EXTRA_MODULES).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Action" htmlFor="flt-action">
              <select
                id="flt-action"
                className={inputClass}
                value={action}
                onChange={(e) => {
                  setPage(1);
                  setAction(e.target.value);
                }}
              >
                <option value="">All actions</option>
                {ACTIONS.map((a) => (
                  <option key={a} value={a}>
                    {a.charAt(0) + a.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </FormField>
          </>
        }
        activeFilters={[module, action].filter(Boolean).length}
        onClearFilters={() => {
          setAction("");
          setModule("");
        }}
        onExport={() => fetchAllPages((p, size) => api.get<PageResult<Log>>("/logs", { params: query(p, size) }).then((r) => r.data))}
        exportName="activity-logs"
        empty={<EmptyState icon={<History className="h-6 w-6" />} title="No activity found" text="Every add, edit and delete is recorded here." />}
      />
    </div>
  );
}
