import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { api, loadSession, saveSession } from "./api";
import { IS_PLATFORM } from "./tenant";
import type { AuthUser, Session } from "./types";

interface AuthState {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

const LOGIN_PATH = IS_PLATFORM ? "/platform/auth/login" : "/auth/login";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => loadSession()?.user ?? null);

  // api.ts session badle (refresh / 401 logout) to yahan bhi sync
  useEffect(() => {
    const sync = () => setUser(loadSession()?.user ?? null);
    window.addEventListener("wm-session", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("wm-session", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const login = async (email: string, password: string) => {
    const r = await api.post<Session>(LOGIN_PATH, { email, password });
    saveSession(r.data);
  };

  const logout = () => saveSession(null);

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth outside AuthProvider");
  return ctx;
}
