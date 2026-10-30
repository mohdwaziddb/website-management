// Admin ka navigation ek jagah se — sidebar, breadcrumb aur Ctrl+K quick search teeno yahi use karte hain.
import type { ModuleDef } from "../lib/types";

export interface NavItem {
  to: string;
  label: string;
  /** Icon.tsx ka naam (backend module icons + admin pages) */
  icon: string;
  group: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const MAIN = "Main";
export const SYSTEM = "System";

/** Modules (website type ke hisaab se) + role => sidebar sections */
export function buildNav(modules: ModuleDef[], role: string | undefined): NavSection[] {
  const isAdmin = role === "ADMIN";
  const sections: NavSection[] = [{ title: MAIN, items: [{ to: "/", label: "Dashboard", icon: "layout-dashboard", group: MAIN }] }];
  // online store (products module) => usi group me orders / customers / reviews / settings
  const storeGroup = modules.find((m) => m.key === "products")?.group;
  for (const group of [...new Set(modules.map((m) => m.group))]) {
    const items: NavItem[] = [];
    if (group === storeGroup) {
      items.push(
        { to: "/store/orders", label: "Orders", icon: "shopping-cart", group },
        { to: "/store/customers", label: "Customers", icon: "user-round", group },
        { to: "/store/reviews", label: "Reviews", icon: "star", group }
      );
    }
    modules.filter((m) => m.group === group).forEach((m) => items.push({ to: `/m/${m.key}`, label: m.label, icon: m.icon, group }));
    if (group === storeGroup && isAdmin) items.push({ to: "/store/settings", label: "Store Settings", icon: "sliders-horizontal", group });
    sections.push({ title: group, items });
  }
  const system: NavItem[] = [
    { to: "/settings", label: "Website Settings", icon: "settings", group: SYSTEM },
    { to: "/templates", label: "Templates", icon: "layout-template", group: SYSTEM }
  ];
  if (isAdmin) system.push({ to: "/users", label: "Users", icon: "users", group: SYSTEM });
  system.push({ to: "/logs", label: "Activity Logs", icon: "history", group: SYSTEM }, { to: "/profile", label: "My Profile", icon: "user-circle", group: SYSTEM });
  sections.push({ title: SYSTEM, items: system });
  return sections;
}

export const flatNav = (sections: NavSection[]) => sections.flatMap((s) => s.items);

/** Quick search: naam / group me milta ho; naam se shuru hone wale upar */
export function searchNav(items: NavItem[], query: string): NavItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  const hits = items.filter((i) => i.label.toLowerCase().includes(q) || i.group.toLowerCase().includes(q));
  const rank = (i: NavItem) => (i.label.toLowerCase().startsWith(q) ? 0 : i.label.toLowerCase().includes(q) ? 1 : 2);
  return hits.sort((a, b) => rank(a) - rank(b));
}

/** Current URL kis menu ka hai (/m/pages/12 => Pages) — sabse lamba match */
export function activeNav(items: NavItem[], pathname: string): NavItem | undefined {
  return items
    .filter((i) => (i.to === "/" ? pathname === "/" : pathname === i.to || pathname.startsWith(i.to + "/")))
    .sort((a, b) => b.to.length - a.to.length)[0];
}
