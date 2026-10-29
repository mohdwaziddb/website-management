import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { ExternalLink, History, LayoutDashboard, LayoutTemplate, LogOut, Menu as MenuIcon, Settings, UserCircle, Users } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useModules } from "../lib/modules";
import { ModuleIcon } from "./Icon";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm ${
    isActive ? "bg-brand-50 font-medium text-brand-700" : "text-slate-600 hover:bg-slate-100"
  }`;

export default function Layout() {
  const { user, logout } = useAuth();
  const modules = useModules();
  const [open, setOpen] = useState(false);
  const [siteName, setSiteName] = useState("");

  useEffect(() => {
    api.get("/tenant-info").then((r) => setSiteName(r.data.name)).catch(() => {});
  }, []);

  const groups = [...new Set(modules.map((m) => m.group))];
  const isAdmin = user?.role === "ADMIN";

  return (
    <div className="min-h-screen bg-slate-50">
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 overflow-y-auto border-r border-slate-200 bg-white transition-transform lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="border-b border-slate-200 px-5 py-4">
          <div className="truncate font-semibold text-slate-900">{siteName || "Website Admin"}</div>
          <div className="text-xs text-slate-500">Website Management</div>
        </div>
        <nav className="space-y-4 p-3" onClick={() => setOpen(false)}>
          <div className="space-y-0.5">
            <NavLink to="/" end className={linkClass}>
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </NavLink>
          </div>
          {groups.map((g) => (
            <div key={g}>
              <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{g}</div>
              <div className="space-y-0.5">
                {modules
                  .filter((m) => m.group === g)
                  .map((m) => (
                    <NavLink key={m.key} to={`/m/${m.key}`} className={linkClass}>
                      <ModuleIcon name={m.icon} /> {m.label}
                    </NavLink>
                  ))}
              </div>
            </div>
          ))}
          <div>
            <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">System</div>
            <div className="space-y-0.5">
              <NavLink to="/settings" className={linkClass}>
                <Settings className="h-4 w-4" /> Website Settings
              </NavLink>
              <NavLink to="/templates" className={linkClass}>
                <LayoutTemplate className="h-4 w-4" /> Templates
              </NavLink>
              {isAdmin && (
                <NavLink to="/users" className={linkClass}>
                  <Users className="h-4 w-4" /> Users
                </NavLink>
              )}
              <NavLink to="/logs" className={linkClass}>
                <History className="h-4 w-4" /> Activity Logs
              </NavLink>
            </div>
          </div>
        </nav>
      </aside>

      {open && <div className="fixed inset-0 z-20 bg-slate-900/30 lg:hidden" onClick={() => setOpen(false)} />}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur">
          <button className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={() => setOpen(true)} aria-label="Menu">
            <MenuIcon className="h-5 w-5" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-brand-600 hover:bg-brand-50">
              <ExternalLink className="h-4 w-4" />
              <span className="hidden sm:inline">View website</span>
            </a>
            <NavLink to="/profile" className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-100">
              <UserCircle className="h-5 w-5" />
              <span className="hidden sm:inline">{user?.name}</span>
              <span className="rounded bg-slate-100 px-1.5 text-[11px] text-slate-500">{user?.role}</span>
            </NavLink>
            <button className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" onClick={logout} title="Logout">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>
        <main className="mx-auto max-w-7xl p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
