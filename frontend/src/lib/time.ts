/** "just now", "5 min ago", "3 h ago", "Yesterday", "12 Oct 2026" (admin me har jagah same) */
export function relativeTime(v: string | null | undefined, now: Date = new Date()): string {
  if (!v) return "";
  const d = new Date(v.includes("T") || v.length <= 10 ? v : v.replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return "";
  const sec = Math.round((now.getTime() - d.getTime()) / 1000);
  if (sec < 45) return "just now";
  if (sec < 3600) return `${Math.max(1, Math.round(sec / 60))} min ago`;
  if (sec < 86_400) return `${Math.round(sec / 3600)} h ago`;
  const days = Math.floor(sec / 86_400);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/** Subah / dopahar / shaam ke hisaab se */
export function greeting(now: Date = new Date()): string {
  const h = now.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}
