// Top bar ki bell: nayi enquiries, ship karne wale orders, pending reviews, low stock — har 60 sec + page badalne par
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, CheckCircle2, ChevronRight, Mail } from "lucide-react";
import { api } from "../lib/api";
import { relativeTime } from "../lib/time";
import { Pill, Tone } from "./ui";

export interface Notifications {
  total: number;
  items: { key: string; label: string; count: number; to: string; tone: Tone }[];
  recentEnquiries: { id: number; name: string; subject: string | null; created_on: string }[];
}

export const POLL_MS = 60_000;

/** 0 => kuch nahi, 1-99, 99+ */
export function badgeText(n: number): string {
  if (n <= 0) return "";
  return n > 99 ? "99+" : String(n);
}

export default function NotificationBell() {
  const [data, setData] = useState<Notifications | null>(null);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();

  const load = useCallback(() => {
    api
      .get<Notifications>("/notifications")
      .then((r) => setData(r.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, POLL_MS);
    return () => clearInterval(t);
  }, [load]);
  // kaam karke lauto (enquiry padhi, order ship kiya) to count turant sahi
  useEffect(load, [pathname, load]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const total = data?.total ?? 0;
  const badge = badgeText(total);
  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label={badge ? `Notifications (${badge})` : "Notifications"}
        aria-expanded={open}
        className="relative rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
      >
        <Bell className="h-5 w-5" />
        {badge && (
          <motion.span
            key={badge}
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white"
          >
            {badge}
          </motion.span>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="Notifications"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="absolute right-0 top-full z-50 mt-2 w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <span className="font-semibold text-slate-900">Notifications</span>
              {total > 0 && <Pill tone="rose">{badge} pending</Pill>}
            </div>
            {!data || data.items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-6 py-10 text-center text-sm text-slate-500">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                All caught up — nothing needs your attention.
              </div>
            ) : (
              <>
                <ul className="divide-y divide-slate-100">
                  {data.items.map((i) => (
                    <li key={i.key}>
                      <Link to={i.to} onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-50">
                        <Pill tone={i.tone}>{i.count}</Pill>
                        <span className="flex-1">{i.label}</span>
                        <ChevronRight className="h-4 w-4 text-slate-300" />
                      </Link>
                    </li>
                  ))}
                </ul>
                {data.recentEnquiries.length > 0 && (
                  <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-3">
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Latest enquiries</div>
                    <ul className="space-y-1">
                      {data.recentEnquiries.map((e) => (
                        <li key={e.id}>
                          <Link to={`/m/enquiries/${e.id}`} onClick={() => setOpen(false)} className="flex items-start gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-white">
                            <Mail className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate font-medium text-slate-800">{e.name}</span>
                              <span className="block truncate text-xs text-slate-500">{e.subject || "No subject"}</span>
                            </span>
                            <span className="shrink-0 text-xs text-slate-400">{relativeTime(e.created_on)}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
