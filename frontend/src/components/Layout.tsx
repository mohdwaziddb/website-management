import { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronRight, ExternalLink, LogOut, Menu as MenuIcon, Monitor, Moon, PanelLeftClose, PanelLeftOpen, Search, Sun, UserCircle, X } from "lucide-react";
import { api, fileUrl } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useModules } from "../lib/modules";
import { ModuleIcon } from "./Icon";
import CommandPalette from "./CommandPalette";
import NotificationBell from "./NotificationBell";
import { NEXT_MODE, useAdminTheme } from "./theme";
import { activeNav, buildNav, flatNav, MAIN, NavSection } from "./nav";
import { Avatar, confirmDialog } from "./ui";

const COLLAPSED_KEY = "wm_nav_collapsed";
/** Desktop sidebar: poora ya sirf icons (browser me yaad rehta hai) */
export const MINI_KEY = "wm_nav_mini";

function readMini(): boolean {
  try {
    return localStorage.getItem(MINI_KEY) === "1";
  } catch {
    return false;
  }
}

function readCollapsed(): string[] {
  try {
    return JSON.parse(localStorage.getItem(COLLAPSED_KEY) ?? "[]");
  } catch {
    return [];
  }
}

const linkClass = (mini: boolean) => ({ isActive }: { isActive: boolean }) =>
  `group relative flex items-center gap-3 rounded-lg py-2 text-sm transition ${mini ? "justify-center px-2" : "px-3"} ${
    isActive ? "bg-white/10 font-medium text-white" : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
  }`;

function Sidebar({ sections, brand, onNavigate, onSearch, onExpand, mini = false }: {
  sections: NavSection[];
  brand: { name: string; logo: string | null };
  onNavigate: () => void;
  onSearch: () => void;
  mini?: boolean;
  /** chhote sidebar me logo click = poora sidebar khol do */
  onExpand?: () => void;
}) {
  const [collapsed, setCollapsed] = useState<string[]>(readCollapsed);
  const toggle = (title: string) => {
    const next = collapsed.includes(title) ? collapsed.filter((t) => t !== title) : [...collapsed, title];
    setCollapsed(next);
    try {
      localStorage.setItem(COLLAPSED_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  };
  return (
    <div className="flex h-full flex-col bg-slate-950 text-slate-300">
      <Link
        to="/"
        onClick={(e) => {
          if (mini && onExpand) {
            e.preventDefault();
            onExpand();
            return;
          }
          onNavigate();
        }}
        title={mini ? `${brand.name} — show sidebar` : undefined}
        aria-label={mini ? "Show sidebar" : undefined}
        className={`flex items-center gap-3 py-4 ${mini ? "justify-center px-2" : "px-4"}`}
      >
        {brand.logo ? (
          <img src={fileUrl(brand.logo)} alt="" className="h-10 w-10 rounded-xl bg-white object-contain p-1" />
        ) : (
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-500 text-lg font-bold text-white shadow-lg shadow-brand-900/40">
            {(brand.name || "W").charAt(0).toUpperCase()}
          </span>
        )}
        <span className={`min-w-0 ${mini ? "sr-only" : ""}`}>
          <span className="block truncate font-semibold text-white">{brand.name || "Website Admin"}</span>
          <span className="block text-xs text-slate-500">Admin panel</span>
        </span>
      </Link>
      <div className={mini ? "px-2 pb-2" : "px-3 pb-2"}>
        <button
          type="button"
          onClick={onSearch}
          title="Search menus (Ctrl K)"
          aria-label="Search menus"
          className={`flex w-full items-center gap-2 rounded-lg border border-white/10 bg-white/5 py-2 text-sm text-slate-400 transition hover:border-white/20 hover:text-slate-200 ${mini ? "justify-center px-2" : "px-3"}`}
        >
          <Search className="h-4 w-4" />
          {!mini && <span className="flex-1 text-left">Search menus…</span>}
          {!mini && <kbd className="rounded border border-white/15 px-1.5 text-[10px]">Ctrl K</kbd>}
        </button>
      </div>
      <nav className={`flex-1 space-y-4 overflow-y-auto pb-6 pt-2 [scrollbar-width:thin] ${mini ? "px-2" : "px-3"}`} aria-label="Admin menu">
        {sections.map((s) => {
          // chhote sidebar me group band nahi hote (sirf icons + beech me line)
          const shut = !mini && s.title !== MAIN && collapsed.includes(s.title);
          return (
            <div key={s.title}>
              {mini && s.title !== MAIN && <div className="mx-2 mb-2 border-t border-white/10" />}
              {!mini && s.title !== MAIN && (
                <button
                  type="button"
                  onClick={() => toggle(s.title)}
                  aria-expanded={!shut}
                  className="flex w-full items-center justify-between px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-300"
                >
                  {s.title}
                  {shut ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>
              )}
              {!shut && (
                <div className="space-y-0.5">
                  {s.items.map((item) => (
                    <NavLink key={item.to} to={item.to} end={item.to === "/"} className={linkClass(mini)} onClick={onNavigate} title={mini ? item.label : undefined} aria-label={mini ? item.label : undefined}>
                      {({ isActive }) => (
                        <>
                          {isActive && <span className="absolute inset-y-1.5 left-0 w-1 rounded-r-full bg-brand-400" />}
                          <ModuleIcon name={item.icon} className={`h-4 w-4 ${isActive ? "text-brand-300" : "text-slate-500 group-hover:text-slate-300"}`} />
                          {!mini && <span className="truncate">{item.label}</span>}
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}

function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  const doLogout = async () => {
    setOpen(false);
    if (await confirmDialog({ title: "Log out?", message: "You will need to sign in again to manage the website.", confirmText: "Log out" })) logout();
  };
  return (
    <div ref={box} className="relative">
      <button type="button" onClick={() => setOpen(!open)} aria-haspopup="menu" aria-expanded={open} aria-label="Account menu" className="flex items-center gap-2 rounded-xl py-1 pl-1 pr-2 transition hover:bg-slate-100">
        <Avatar name={user?.name} size="sm" />
        <span className="hidden text-left sm:block">
          <span className="block text-sm font-medium leading-tight text-slate-800">{user?.name}</span>
          <span className="block text-[11px] leading-tight text-slate-500">{user?.role === "ADMIN" ? "Administrator" : "Editor"}</span>
        </span>
        <ChevronDown className="h-4 w-4 text-slate-400" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6 }}
            className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl"
          >
            <div className="border-b border-slate-100 px-4 py-3">
              <div className="truncate text-sm font-medium text-slate-900">{user?.name}</div>
              <div className="truncate text-xs text-slate-500">{user?.email}</div>
            </div>
            <Link role="menuitem" to="/profile" onClick={() => setOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
              <UserCircle className="h-4 w-4" /> My profile
            </Link>
            <a role="menuitem" href="/" target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
              <ExternalLink className="h-4 w-4" /> View website
            </a>
            <button role="menuitem" type="button" onClick={doLogout} className="flex w-full items-center gap-2 border-t border-slate-100 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
              <LogOut className="h-4 w-4" /> Log out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Layout() {
  const { user } = useAuth();
  const modules = useModules();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(false);
  const [mini, setMini] = useState(readMini);
  const [theme, setTheme] = useAdminTheme();
  const toggleMini = () => {
    setMini((v) => {
      try {
        localStorage.setItem(MINI_KEY, v ? "0" : "1");
      } catch {
        // ignore
      }
      return !v;
    });
  };
  const [brand, setBrand] = useState<{ name: string; logo: string | null }>({ name: "", logo: null });

  useEffect(() => {
    api
      .get("/tenant-info")
      .then((r) => setBrand({ name: r.data.name, logo: r.data.logo ?? null }))
      .catch(() => {});
  }, []);

  // Ctrl+K / ⌘K = quick search
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearch(true);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  const sections = useMemo(() => buildNav(modules, user?.role), [modules, user?.role]);
  const items = useMemo(() => flatNav(sections), [sections]);
  const current = activeNav(items, pathname);

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className={`fixed inset-y-0 left-0 z-30 hidden transition-[width] duration-200 lg:block ${mini ? "w-[72px]" : "w-64"}`}>
        <Sidebar sections={sections} brand={brand} mini={mini} onExpand={toggleMini} onNavigate={() => {}} onSearch={() => setSearch(true)} />
      </aside>

      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-40 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-slate-900/50" onClick={() => setOpen(false)} />
            <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: "spring", damping: 28, stiffness: 280 }} className="absolute inset-y-0 left-0 w-72">
              <Sidebar sections={sections} brand={brand} onNavigate={() => setOpen(false)} onSearch={() => setSearch(true)} />
              <button aria-label="Close menu" onClick={() => setOpen(false)} className="absolute -right-11 top-3 rounded-lg bg-white p-2 text-slate-700 shadow">
                <X className="h-5 w-5" />
              </button>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`transition-[padding] duration-200 ${mini ? "lg:pl-[72px]" : "lg:pl-64"}`}>
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200/80 bg-white/80 px-4 backdrop-blur-md sm:px-6">
          <button className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={() => setOpen(true)} aria-label="Menu">
            <MenuIcon className="h-5 w-5" />
          </button>
          <button
            className="hidden rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 lg:inline-flex"
            onClick={toggleMini}
            aria-label={mini ? "Show sidebar" : "Hide sidebar"}
            title={mini ? "Show sidebar" : "Hide sidebar"}
          >
            {mini ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          </button>
          <nav aria-label="Location" className="hidden min-w-0 items-center gap-1.5 text-sm sm:flex">
            <Link to="/" className="text-slate-500 hover:text-slate-800">
              {brand.name || "Admin"}
            </Link>
            {current && current.to !== "/" && (
              <>
                <ChevronRight className="h-4 w-4 text-slate-300" />
                {current.group !== MAIN && <span className="text-slate-400">{current.group}</span>}
                {current.group !== MAIN && <ChevronRight className="h-4 w-4 text-slate-300" />}
                <Link to={current.to} className="truncate font-medium text-slate-800">
                  {current.label}
                </Link>
              </>
            )}
          </nav>
          <div className="flex-1" />
          <button type="button" onClick={() => setSearch(true)} aria-label="Search menus" className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-500 shadow-sm hover:border-slate-300">
            <Search className="h-4 w-4" />
            <span className="hidden md:inline">Search</span>
            <kbd className="hidden rounded border border-slate-200 px-1 text-[10px] md:inline">Ctrl K</kbd>
          </button>
          <button
            type="button"
            onClick={() => setTheme(NEXT_MODE[theme])}
            aria-label={`Theme: ${theme} (click to change)`}
            title={theme === "light" ? "Light mode — click for dark" : theme === "dark" ? "Dark mode — click to follow your system" : "System theme — click for light"}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
          >
            {theme === "light" ? <Sun className="h-5 w-5" /> : theme === "dark" ? <Moon className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
          </button>
          <NotificationBell />
          <a href="/" target="_blank" rel="noreferrer" className="hidden items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-brand-600 hover:bg-brand-50 sm:flex">
            <ExternalLink className="h-4 w-4" /> View website
          </a>
          <UserMenu />
        </header>
        <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
          <motion.div key={pathname} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>
            <Outlet />
          </motion.div>
        </main>
      </div>
      <CommandPalette items={items} open={search} onClose={() => setSearch(false)} />
    </div>
  );
}
