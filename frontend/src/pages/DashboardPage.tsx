import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { ModuleIcon } from "../components/Icon";
import { PageHeader } from "../components/ui";

type Stat = { key: string; label: string; group: string; icon: string; total: number; published: number | null };

export default function DashboardPage() {
  const [stats, setStats] = useState<Stat[]>([]);
  useEffect(() => {
    api.get<Stat[]>("/dashboard").then((r) => setStats(r.data));
  }, []);
  const groups = [...new Set(stats.map((s) => s.group))];

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Website content at a glance" />
      {groups.map((g) => (
        <section key={g} className="mb-6">
          <h2 className="mb-2 text-sm font-semibold text-slate-500">{g}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {stats
              .filter((s) => s.group === g)
              .map((s) => (
                <Link
                  key={s.key}
                  to={`/m/${s.key}`}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-brand-500 hover:shadow"
                >
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <ModuleIcon name={s.icon} className="h-4 w-4 text-brand-600" />
                    <span className="truncate">{s.label}</span>
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-slate-900">{s.total}</div>
                  {s.published != null && <div className="text-xs text-slate-500">{s.published} published</div>}
                </Link>
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}
