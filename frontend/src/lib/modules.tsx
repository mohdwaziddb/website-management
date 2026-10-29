import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { api } from "./api";
import type { ModuleDef } from "./types";

const ModulesContext = createContext<ModuleDef[] | null>(null);

/** Backend registry (/api/modules) ek baar load; sidebar, list, form sab isi se. */
export function ModulesProvider({ children }: { children: ReactNode }) {
  const [modules, setModules] = useState<ModuleDef[] | null>(null);
  useEffect(() => {
    api.get<ModuleDef[]>("/modules").then((r) => setModules(r.data)).catch(() => setModules([]));
  }, []);
  if (!modules) return <div className="p-10 text-center text-slate-500">Loading…</div>;
  return <ModulesContext.Provider value={modules}>{children}</ModulesContext.Provider>;
}

export function useModules(): ModuleDef[] {
  return useContext(ModulesContext) ?? [];
}

export function useModule(key: string | undefined): ModuleDef | undefined {
  return useModules().find((m) => m.key === key);
}
