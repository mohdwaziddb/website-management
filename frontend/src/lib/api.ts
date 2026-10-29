import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { IS_PLATFORM } from "./tenant";
import type { Session } from "./types";

const SESSION_KEY = "wm_session";
const FILES_BASE = import.meta.env.VITE_FILES_BASE_URL || "";

// localStorage har origin (domain) ka alag hota hai, to abc ka session xyz par nahi dikhega
export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function saveSession(s: Session | null) {
  if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  else localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event("wm-session"));
}

// Same-origin /api: dev me vite proxy, live me nginx — Host header se backend website pehchanta hai
const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

/** Backend har response { success, message, data } me bhejta hai — components ko seedha data milta hai. */
export function unwrap<T = unknown>(r: AxiosResponse): AxiosResponse<T> {
  const body = r.data as { success?: unknown; data?: unknown } | null;
  if (body && typeof body === "object" && typeof body.success === "boolean" && "data" in body) {
    r.data = body.data;
  }
  return r as AxiosResponse<T>;
}

export const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((cfg) => {
  const s = loadSession();
  if (s?.accessToken) cfg.headers.set("Authorization", `Bearer ${s.accessToken}`);
  return cfg;
});

const REFRESH_PATH = IS_PLATFORM ? "/platform/auth/refresh" : "/auth/refresh";
let refreshing: Promise<string | null> | null = null;

/** Ek saath kai 401 aaye to bhi refresh sirf ek baar chale. */
function refreshAccessToken(): Promise<string | null> {
  if (!refreshing) {
    const s = loadSession();
    // plain axios (interceptors ke bina) taaki refresh fail hone par loop na bane
    refreshing = (s?.refreshToken
      ? axios
          .post(API_BASE + REFRESH_PATH, { refreshToken: s.refreshToken })
          .then((r) => {
            const session = unwrap<Session>(r).data;
            saveSession(session);
            return session.accessToken;
          })
          .catch(() => null)
      : Promise.resolve(null)
    ).finally(() => {
      refreshing = null;
    });
  }
  return refreshing;
}

api.interceptors.response.use(
  (r) => unwrap(r),
  async (error: AxiosError) => {
    const cfg = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
    const isAuthCall = cfg?.url?.includes("/auth/login");
    if (error.response?.status === 401 && cfg && !cfg._retried && !isAuthCall) {
      cfg._retried = true;
      const token = await refreshAccessToken();
      if (token) {
        cfg.headers.set("Authorization", `Bearer ${token}`);
        return api(cfg);
      }
      saveSession(null);
    }
    return Promise.reject(error);
  }
);

export function errorMessage(e: unknown): string {
  if (axios.isAxiosError(e)) {
    const data = e.response?.data as { message?: string } | undefined;
    if (data?.message) return data.message;
    if (!e.response) return "Server not reachable";
  }
  return "Something went wrong";
}

/** Backend "/files/..." deta hai; API alag domain par ho to us origin ke saath. */
export function fileUrl(path: unknown): string {
  if (typeof path !== "string" || !path) return "";
  return path.startsWith("/files/") ? FILES_BASE + path : path;
}

export async function uploadFile(file: File): Promise<{ url: string; name: string }> {
  const form = new FormData();
  form.append("file", file);
  const r = await api.post("/files", form);
  return r.data;
}
