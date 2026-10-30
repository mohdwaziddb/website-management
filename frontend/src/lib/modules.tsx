import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { api } from "./api";
import type { ModuleDef } from "./types";

interface ModulesState {
  modules: ModuleDef[];
  /** Website type badle to sidebar ke menus dobara laao (Restaurant -> Menu Items ...) */
  reload: () => Promise<void>;
}

const ModulesContext = createContext<ModulesState | null>(null);

/** Backend registry (/api/modules) — website type ke hisaab se; sidebar, list, form sab isi se. */
export function ModulesProvider({ children }: { children: ReactNode }) {
  const [modules, setModules] = useState<ModuleDef[] | null>(null);
  const reload = useCallback(
    () =>
      api
        .get<ModuleDef[]>("/modules")
        .then((r) => setModules(r.data))
        .catch(() => setModules((m) => m ?? [])),
    []
  );
  useEffect(() => {
    reload();
  }, [reload]);
  if (!modules) return <div className="p-10 text-center text-slate-500">Loading…</div>;
  return <ModulesContext.Provider value={{ modules, reload }}>{children}</ModulesContext.Provider>;
}

export function useModules(): ModuleDef[] {
  return useContext(ModulesContext)?.modules ?? [];
}

export function useReloadModules(): () => Promise<void> {
  return useContext(ModulesContext)?.reload ?? (() => Promise.resolve());
}

export function useModule(key: string | undefined): ModuleDef | undefined {
  return useModules().find((m) => m.key === key);
}
