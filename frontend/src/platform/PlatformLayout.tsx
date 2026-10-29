import { NavLink, Outlet } from "react-router-dom";
import { Building2, LogOut, UserCircle } from "lucide-react";
import { useAuth } from "../lib/auth";

export default function PlatformLayout() {
  const { user, logout } = useAuth();
  const link = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm ${isActive ? "bg-white/15 text-white" : "text-slate-300 hover:text-white"}`;
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-900">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
          <span className="font-semibold text-white">Platform Admin</span>
          <nav className="flex gap-1">
            <NavLink to="/" end className={link}>
              <Building2 className="h-4 w-4" /> Websites
            </NavLink>
            <NavLink to="/profile" className={link}>
              <UserCircle className="h-4 w-4" /> {user?.name}
            </NavLink>
          </nav>
          <div className="flex-1" />
          <button className="rounded-lg p-2 text-slate-300 hover:text-white" onClick={logout} title="Logout">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl p-4 sm:p-6">
        <Outlet />
      </main>
    </div>
  );
}
