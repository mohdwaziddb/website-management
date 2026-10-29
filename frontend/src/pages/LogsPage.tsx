import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { useModules } from "../lib/modules";
import { PageResult } from "../lib/types";
import { baseInputClass, Card, PageHeader, Pagination } from "../components/ui";

type Log = { id: number; module: string; record_id: number | null; action: string; summary: string; user_name: string; created_on: string };

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-emerald-50 text-emerald-700",
  UPDATE: "bg-blue-50 text-blue-700",
  DELETE: "bg-red-50 text-red-700"
};

export default function LogsPage() {
  const modules = useModules();
  const [params, setParams] = useSearchParams();
  const module = params.get("module") ?? "";
  const recordId = params.get("recordId") ?? "";
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PageResult<Log> | null>(null);

  useEffect(() => {
    api
      .get<PageResult<Log>>("/logs", { params: { module: module || undefined, recordId: recordId || undefined, page, size: 25 } })
      .then((r) => setData(r.data));
  }, [module, recordId, page]);

  const label = (key: string) => modules.find((m) => m.key === key)?.label ?? key;

  return (
    <div>
      <PageHeader title="Activity Logs" subtitle={recordId ? `${label(module)} · record #${recordId}` : "Who changed what, and when"} />
      <Card>
        <div className="border-b border-slate-200 p-3">
          <select
            className={`${baseInputClass} w-64`}
            value={module}
            onChange={(e) => {
              setPage(1);
              setParams(e.target.value ? { module: e.target.value } : {});
            }}
          >
            <option value="">All modules</option>
            {modules.map((m) => (
              <option key={m.key} value={m.key}>
                {m.label}
              </option>
            ))}
            <option value="settings">Website Settings</option>
            <option value="users">Users</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2.5 font-medium">When</th>
                <th className="px-4 py-2.5 font-medium">Module</th>
                <th className="px-4 py-2.5 font-medium">Action</th>
                <th className="px-4 py-2.5 font-medium">Details</th>
                <th className="px-4 py-2.5 font-medium">By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.items.map((l) => (
                <tr key={l.id}>
                  <td className="whitespace-nowrap px-4 py-2.5 text-slate-500">{l.created_on.replace("T", " ").slice(0, 16)}</td>
                  <td className="px-4 py-2.5">{label(l.module)}</td>
                  <td className="px-4 py-2.5">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ACTION_COLORS[l.action] ?? "bg-slate-100 text-slate-600"}`}>
                      {l.action}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-slate-700">{l.summary}</td>
                  <td className="px-4 py-2.5 text-slate-600">{l.user_name}</td>
                </tr>
              ))}
              {data && data.items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                    No activity yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {data && <Pagination page={page} size={25} total={data.total} onPage={setPage} />}
      </Card>
    </div>
  );
}
