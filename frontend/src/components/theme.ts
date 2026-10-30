// Admin ka light / dark / system theme — html par "admin-dark" class (index.css me rang), browser me yaad
import { useEffect, useState } from "react";

export type ThemeMode = "light" | "dark" | "system";
export const THEME_KEY = "wm_admin_theme";
export const DARK_CLASS = "admin-dark";

export function readTheme(): ThemeMode {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return v === "dark" || v === "light" || v === "system" ? v : "light";
  } catch {
    return "light";
  }
}

/** system = OS ka setting */
export function isDark(mode: ThemeMode, systemDark: boolean): boolean {
  return mode === "dark" || (mode === "system" && systemDark);
}

export const NEXT_MODE: Record<ThemeMode, ThemeMode> = { light: "dark", dark: "system", system: "light" };

/** Admin me mounted rehte hue html par class; admin se bahar (unmount) class hata do */
export function useAdminTheme(): [ThemeMode, (m: ThemeMode) => void] {
  const [mode, setMode] = useState<ThemeMode>(readTheme);
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    const apply = () => document.documentElement.classList.toggle(DARK_CLASS, isDark(mode, !!mq?.matches));
    apply();
    mq?.addEventListener?.("change", apply);
    return () => {
      mq?.removeEventListener?.("change", apply);
      document.documentElement.classList.remove(DARK_CLASS);
    };
  }, [mode]);
  const set = (m: ThemeMode) => {
    setMode(m);
    try {
      localStorage.setItem(THEME_KEY, m);
    } catch {
      // ignore
    }
  };
  return [mode, set];
}
