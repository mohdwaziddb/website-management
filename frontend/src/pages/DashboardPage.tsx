import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowRight, CheckCircle2, Circle, ExternalLink, IndianRupee, LayoutTemplate, PackageCheck, Plus, ShoppingCart } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useModules } from "../lib/modules";
import { rupee } from "../lib/money";
import { greeting, relativeTime } from "../lib/time";
import type { PageResult } from "../lib/types";
import { getSiteType } from "../site/siteTypes";
import { getTemplate } from "../site/templates";
import { ModuleIcon } from "../components/Icon";
import { Button, EmptyState, Pill, SectionCard, Skeleton, StatCard, Tone } from "../components/ui";

export type Stat = { key: string; label: string; group: string; icon: string; total: number; published: number | null };
type Log = { id: number; module: string; action: string; summary: string; user_name: string; created_on: string };
type Summary = { today: { orders: number; revenue: number }; month: { orders: number; revenue: number }; byStatus: Record<string, number>; lowStock: unknown[] };

export interface CheckItem {
  label: string;
  done: boolean;
  to: string;
}

/** Website kitni tayyar hai — logo, contact, slider, pages ... (testable) */
export function setupChecklist(values: Record<string, unknown>, stats: Stat[]): CheckItem[] {
  const has = (k: string) => typeof values[k] === "string" && (values[k] as string).trim() !== "";
  const count = (k: string) => stats.find((s) => s.key === k)?.total ?? 0;
  const items: CheckItem[] = [
    { label: "Upload your logo", done: has("logo"), to: "/settings" },
    { label: "Add phone & email", done: has("phone") && has("email"), to: "/settings" },
    { label: "Add your address", done: has("address"), to: "/settings" },
    { label: "Write a short About text", done: has("about_short"), to: "/settings" },
    { label: "Link a social profile", done: ["facebook", "instagram", "youtube", "twitter", "linkedin"].some(has), to: "/settings" }
  ];
  if (stats.some((s) => s.key === "sliders")) items.push({ label: "Add a home slider", done: count("sliders") > 0, to: "/m/sliders/new" });
  if (stats.some((s) => s.key === "pages")) items.push({ label: "Create a page (About, Admissions …)", done: count("pages") > 0, to: "/m/pages/new" });
  if (stats.some((s) => s.key === "products")) items.push({ label: "Add your first product", done: count("products") > 0, to: "/m/products/new" });
  return items;
}

const ACTION_TONE: Record<string, Tone> = { CREATE: "green", UPDATE: "blue", DELETE: "rose", IMPORT: "violet", RESET: "amber" };
const GROUP_DOTS = ["bg-brand-500", "bg-violet-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500", "bg-slate-400"];
const fade = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 } };

export default function DashboardPage() {
  const { user } = useAuth();
  const modules = useModules();
  const [stats, setStats] = useState<Stat[] | null>(null);
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [logs, setLogs] = useState<Log[] | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const store = modules.some((m) => m.key === "products");

  useEffect(() => {
    api.get<Stat[]>("/dashboard").then((r) => setStats(r.data)).catch(() => setStats([]));
    api.get("/settings").then((r) => setValues(r.data?.values ?? {})).catch(() => {});
    api
      .get<PageResult<Log>>("/logs", { params: { page: 1, size: 7 } })
      .then((r) => setLogs(r.data.items))
      .catch(() => setLogs([]));
  }, []);
  useEffect(() => {
    if (store) api.get<Summary>("/shop/summary").then((r) => setSummary(r.data)).catch(() => {});
  }, [store]);

  const siteType = getSiteType(String(values.site_type ?? ""));
  const template = String(values.template ?? "").startsWith("custom-") ? null : getTemplate(String(values.template ?? ""));
  const checklist = stats ? setupChecklist(values, stats) : [];
  const done = checklist.filter((c) => c.done).length;
  const pct = checklist.length ? Math.round((done / checklist.length) * 100) : 0;
  const groups = stats ? [...new Set(stats.map((s) => s.group))] : [];
  const has = (k: string) => modules.some((m) => m.key === k);
  const quick = [
    has("products") && { to: "/m/products/new", label: "Add product", icon: "shopping-bag" },
    has("news_posts") && { to: "/m/news_posts/new", label: "Write news", icon: "newspaper" },
    has("pages") && { to: "/m/pages/new", label: "New page", icon: "file-text" },
    has("sliders") && { to: "/m/sliders/new", label: "Add slider", icon: "images" },
    has("blogs") && { to: "/m/blogs/new", label: "Write blog", icon: "pen-square" },
    has("image_gallery") && { to: "/m/image_gallery/new", label: "Upload photo", icon: "image" }
  ]
    .filter(Boolean)
    .slice(0, 4) as { to: string; label: string; icon: string }[];

  return (
    <div className="space-y-6">
      <motion.div {...fade} className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-brand-900 to-brand-700 p-6 text-white shadow-xl sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-brand-400/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-60 w-60 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <p className="text-sm text-brand-100">{greeting()},</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">{user?.name?.split(" ")[0] ?? "there"}</h1>
            <p className="mt-2 text-sm text-slate-300">
              Manage your <b className="text-white">{siteType.label}</b> website — content, design and settings, all in one place.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <a href="/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow hover:bg-brand-50">
                <ExternalLink className="h-4 w-4" /> View website
              </a>
              <Link to="/templates" className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/20 hover:bg-white/15">
                <LayoutTemplate className="h-4 w-4" /> Change design
              </Link>
            </div>
          </div>
          <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur">
            <div className="text-xs uppercase tracking-wider text-brand-100">Current template</div>
            <div className="mt-1 flex items-center gap-2 text-lg font-semibold">
              {template && (
                <span className="flex gap-1">
                  {[template.colors.primary, template.colors.accent].map((c) => (
                    <span key={c} className="h-3.5 w-3.5 rounded-full ring-2 ring-white/40" style={{ background: c }} />
                  ))}
                </span>
              )}
              {template ? template.name : "Custom template"}
            </div>
            <div className="text-xs text-slate-300">{siteType.label}</div>
          </div>
        </div>
      </motion.div>

      {store && summary && (
        <motion.div {...fade} transition={{ delay: 0.05 }} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Orders today" value={summary.today.orders} hint={rupee(summary.today.revenue)} icon={<ShoppingCart className="h-5 w-5" />} to="/store/orders" />
          <StatCard label="Revenue this month" value={rupee(summary.month.revenue)} hint={`${summary.month.orders} orders`} icon={<IndianRupee className="h-5 w-5" />} tone="green" to="/store/orders" />
          <StatCard
            label="To ship"
            value={(summary.byStatus.PLACED ?? 0) + (summary.byStatus.CONFIRMED ?? 0) + (summary.byStatus.PACKED ?? 0)}
            hint="Placed · confirmed · packed"
            icon={<PackageCheck className="h-5 w-5" />}
            tone="violet"
            to="/store/orders"
          />
          <StatCard label="Low stock" value={summary.lowStock.length} hint="Products running out" icon={<AlertTriangle className="h-5 w-5" />} tone={summary.lowStock.length ? "amber" : "slate"} to="/store/orders" />
        </motion.div>
      )}

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          {quick.length > 0 && (
            <motion.div {...fade} transition={{ delay: 0.08 }} className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {quick.map((q) => (
                <Link
                  key={q.to}
                  to={q.to}
                  className="group flex items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3.5 text-sm font-medium text-slate-700 transition hover:border-brand-400 hover:bg-brand-50/50 hover:text-brand-700"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition group-hover:bg-brand-100 group-hover:text-brand-600">
                    <ModuleIcon name={q.icon} />
                  </span>
                  <span className="flex-1">{q.label}</span>
                  <Plus className="h-4 w-4 text-slate-300 group-hover:text-brand-500" />
                </Link>
              ))}
            </motion.div>
          )}

          <SectionCard title="Website content" description="Everything on your website, by section" bodyClassName="p-2">
            {!stats ? (
              <div className="space-y-2 p-3">
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-10" />
                ))}
              </div>
            ) : !stats.length ? (
              <EmptyState title="Nothing here yet" text="Your website has no content sections." />
            ) : (
              <div className="grid gap-x-6 sm:grid-cols-2">
                {groups.map((g, gi) => (
                  <div key={g} className="p-3">
                    <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      <span className={`h-2 w-2 rounded-full ${GROUP_DOTS[gi % GROUP_DOTS.length]}`} />
                      {g}
                    </div>
                    <ul>
                      {stats
                        .filter((s) => s.group === g)
                        .map((s) => {
                          const share = s.published != null && s.total > 0 ? Math.round((s.published / s.total) * 100) : null;
                          return (
                            <li key={s.key}>
                              <Link to={`/m/${s.key}`} className="group flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-slate-50">
                                <ModuleIcon name={s.icon} className="h-4 w-4 text-slate-400 group-hover:text-brand-600" />
                                <span className="flex-1 truncate text-sm text-slate-700">{s.label}</span>
                                {share !== null && (
                                  <span className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-slate-100 sm:block" title={`${s.published} of ${s.total} published`}>
                                    <span className="block h-full rounded-full bg-emerald-400" style={{ width: `${share}%` }} />
                                  </span>
                                )}
                                <span className="w-8 text-right text-sm font-semibold tabular-nums text-slate-900">{s.total}</span>
                              </Link>
                            </li>
                          );
                        })}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard
            title="Website setup"
            description={pct === 100 ? "All done — your website looks complete!" : `${done} of ${checklist.length} done`}
            actions={<Pill tone={pct === 100 ? "green" : "blue"}>{pct}%</Pill>}
          >
            <div className="mb-4 h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Setup progress">
              <motion.div className={`h-full rounded-full ${pct === 100 ? "bg-emerald-500" : "bg-brand-500"}`} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6 }} />
            </div>
            <ul className="space-y-1">
              {checklist.map((c) => (
                <li key={c.label}>
                  <Link to={c.to} className={`flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition hover:bg-slate-50 ${c.done ? "text-slate-400" : "text-slate-700"}`}>
                    {c.done ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Circle className="h-4 w-4 text-slate-300" />}
                    <span className={`flex-1 ${c.done ? "line-through" : ""}`}>{c.label}</span>
                    {!c.done && <ArrowRight className="h-3.5 w-3.5 text-slate-300" />}
                  </Link>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard
            title="Recent activity"
            actions={
              <Link to="/logs">
                <Button variant="ghost" size="sm">
                  View all
                </Button>
              </Link>
            }
            bodyClassName="px-5 py-4"
          >
            {!logs ? (
              <Skeleton className="h-24" />
            ) : !logs.length ? (
              <EmptyState title="No activity yet" text="Changes you make will show up here." />
            ) : (
              <ol className="relative space-y-4 border-l border-slate-200 pl-4">
                {logs.map((l) => (
                  <li key={l.id} className="relative">
                    <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-white ring-2 ring-brand-400" />
                    <div className="flex items-center gap-2">
                      <Pill tone={ACTION_TONE[l.action] ?? "slate"}>{l.action.toLowerCase()}</Pill>
                      <span className="text-xs text-slate-400">{relativeTime(l.created_on)}</span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-700">{l.summary}</p>
                    <p className="text-xs text-slate-400">by {l.user_name || "System"}</p>
                  </li>
                ))}
              </ol>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
