import { CSSProperties, ReactNode, useState } from "react";
import { Link } from "react-router-dom";
import { motion, Variants } from "framer-motion";
import { ArrowRight, ImageIcon } from "lucide-react";
import { fileUrl } from "../lib/api";
import { useSite } from "./data";
import { sectionTitle, TitledSection } from "./siteTypes";
import { fontStack } from "./templates/fonts";
import type { TemplateConfig } from "./templates";

// ------------------------------------------------------------ motion (sab sections yahi variants use karte hain)

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } }
};

export const fadeIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.6 } }
};

export const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } }
};

/** Scroll karke screen me aate hi animate (ek baar) */
export const reveal = { initial: "hidden", whileInView: "show", viewport: { once: true, margin: "-60px" } } as const;

// ------------------------------------------------------------ theme

/** "#1d4ed8" -> "29 78 216" (CSS rgb() channels) */
export function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) || 0).join(" ");
}

/** Template ke rang/fonts CSS variables me — components var(--primary) jaisa use karte hain */
export function themeStyle(t: TemplateConfig): CSSProperties {
  return {
    "--primary": t.colors.primary,
    "--accent": t.colors.accent,
    "--bg": t.colors.bg,
    "--surface": t.colors.surface,
    "--text": t.colors.text,
    "--muted": t.colors.muted,
    "--hero-text": t.colors.heroText,
    "--on-primary": t.colors.onPrimary,
    "--on-accent": t.colors.onAccent,
    // rgb channels: Tailwind "site-*" colours opacity ke saath (bg-site-text/5)
    "--primary-rgb": hexToRgb(t.colors.primary),
    "--accent-rgb": hexToRgb(t.colors.accent),
    "--text-rgb": hexToRgb(t.colors.text),
    "--muted-rgb": hexToRgb(t.colors.muted),
    "--bg-rgb": hexToRgb(t.colors.bg),
    "--surface-rgb": hexToRgb(t.colors.surface),
    "--font-heading": fontStack(t.fonts.heading),
    "--font-body": fontStack(t.fonts.body),
    background: t.colors.bg,
    color: t.colors.text,
    fontFamily: fontStack(t.fonts.body),
    colorScheme: t.dark ? "dark" : "light"
  } as CSSProperties;
}

export const headingFont: CSSProperties = { fontFamily: "var(--font-heading)" };

/** Setting value; preview / showcase me khaali ho to demo value */
export function useSetting(key: string): string {
  const { settings, preview, showcase, demo } = useSite();
  const v = settings[key];
  if (v && v.trim()) return v;
  return preview || showcase ? demo?.settings[key] ?? "" : "";
}

/** Website type ke hisaab se section title: Restaurant "Our Menu", Gym "Membership Plans" */
export function useSectionTitle(section: TitledSection): [string, string] {
  return sectionTitle(useSite().siteType, section);
}

// ------------------------------------------------------------ building blocks

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-6xl px-4 sm:px-6 ${className}`}>{children}</div>;
}

export function SectionTitle({ title, subtitle, light = false }: { title: string; subtitle?: string; light?: boolean }) {
  const { template } = useSite();
  const h = template.heading;
  const text = light ? "text-white" : "text-[var(--text)]";
  return (
    <motion.div variants={fadeUp} className={`mb-10 ${h === "underline" || h === "eyebrow" ? "text-left" : "text-center"}`}>
      {h === "eyebrow" && <div className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--accent)]">{subtitle ?? "Explore"}</div>}
      {h === "badge" && (
        <span className="mb-3 inline-block rounded-full bg-[var(--accent)] px-4 py-1 text-xs font-bold uppercase tracking-wide text-[var(--on-accent)]">{subtitle ?? "Explore"}</span>
      )}
      <h2 style={headingFont} className={`text-3xl font-bold sm:text-4xl ${text} ${h === "serif" ? "italic" : ""}`}>
        {title}
      </h2>
      {h === "underline" && <div className="mt-3 h-1 w-16 rounded bg-[var(--accent)]" />}
      {h === "serif" && (
        <div className="mx-auto mt-4 flex items-center justify-center gap-3 text-[var(--accent)]">
          <span className="h-px w-12 bg-current" />◆<span className="h-px w-12 bg-current" />
        </div>
      )}
      {(h === "center" || h === "serif" || h === "underline") && subtitle && <p className={`mt-3 ${light ? "text-white/70" : "text-[var(--muted)]"}`}>{subtitle}</p>}
    </motion.div>
  );
}

/** Ek home page section: scroll-reveal + title. titled = type ke hisaab se title, alt = halka alag background */
export function Section({
  id,
  titled,
  title,
  subtitle,
  children,
  alt = false,
  className = ""
}: {
  id: string;
  titled?: TitledSection;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  alt?: boolean;
  className?: string;
}) {
  const auto = useSectionTitle(titled ?? "about");
  const t = title ?? (titled ? auto[0] : undefined);
  const s = subtitle ?? (titled ? auto[1] : undefined);
  return (
    <motion.section id={id} {...reveal} variants={stagger} className={`py-16 sm:py-24 ${alt ? "bg-[var(--surface)]" : ""} ${className}`}>
      <Container>
        {t && <SectionTitle title={t} subtitle={s} />}
        {children}
      </Container>
    </motion.section>
  );
}

/** Template ke hisaab se card */
export function SiteCard({ children, className = "", hover = true }: { children: ReactNode; className?: string; hover?: boolean }) {
  const { template } = useSite();
  return (
    <motion.div
      variants={fadeUp}
      whileHover={hover ? { y: -6 } : undefined}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className={`overflow-hidden bg-[var(--surface)] ${template.card} ${template.radius} ${className}`}
    >
      {children}
    </motion.div>
  );
}

type BtnKind = "accent" | "primary" | "outline" | "outline-light";

/** Template ke shape (pill / square) wala button; internal path => Link, http => <a> */
export function SiteButton({ to, kind = "accent", children, className = "" }: { to: string; kind?: BtnKind; children: ReactNode; className?: string }) {
  const { template } = useSite();
  const styles: Record<BtnKind, string> = {
    accent: "bg-[var(--accent)] text-[var(--on-accent)] shadow-lg hover:brightness-110",
    primary: "bg-[var(--primary)] text-[var(--on-primary)] shadow-lg hover:brightness-110",
    outline: "border border-current text-[var(--text)] hover:bg-black/5",
    "outline-light": "border border-white/60 text-white hover:bg-white/10"
  };
  const cls = `inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold transition ${template.button} ${styles[kind]} ${className}`;
  if (/^https?:\/\//i.test(to)) {
    return (
      <a href={to} target="_blank" rel="noreferrer" className={cls}>
        {children}
      </a>
    );
  }
  return (
    <Link to={to || "/contact"} className={cls}>
      {children}
    </Link>
  );
}

/** Settings ka "Main Button" (Book a Table / Donate Now ...) */
export function MainCta({ kind = "accent", className = "" }: { kind?: BtnKind; className?: string }) {
  const text = useSetting("cta_text") || "Contact Us";
  const link = useSetting("cta_link") || "/contact";
  return (
    <SiteButton to={link} kind={kind} className={className}>
      {text} <ArrowRight className="h-4 w-4" />
    </SiteButton>
  );
}

const GRADIENTS = [
  "linear-gradient(135deg, var(--primary), var(--accent))",
  "linear-gradient(135deg, var(--accent), var(--primary))",
  "linear-gradient(160deg, var(--primary), #0f172a)",
  "linear-gradient(200deg, var(--accent), var(--primary) 70%)"
];

/** Image na ho to template ke rang ka gradient */
export function SmartImage({ src, alt, className = "", seed = 0 }: { src?: unknown; alt: string; className?: string; seed?: number }) {
  const url = fileUrl(src);
  // photo load na ho (link toota / network) to bhi tooti image ki jagah gradient
  const [failed, setFailed] = useState<string | null>(null);
  if (url && failed !== url) return <img src={url} alt={alt} loading="lazy" onError={() => setFailed(url)} className={`object-cover ${className}`} />;
  return (
    <div className={`flex items-center justify-center text-white/70 ${className}`} style={{ background: GRADIENTS[Math.abs(seed) % GRADIENTS.length] }} aria-label={alt} role="img">
      <ImageIcon className="h-8 w-8" />
    </div>
  );
}

export function formatDate(v: unknown): string {
  if (typeof v !== "string" || !v) return "";
  const d = new Date(v.length === 10 ? v + "T00:00:00" : v);
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/** YouTube link se video id (thumbnail / embed ke liye) */
export function youtubeId(url: unknown): string | null {
  if (typeof url !== "string") return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/))([\w-]{11})/);
  return m ? m[1] : null;
}

/** CKEditor HTML (backend sanitize kar chuka hai) */
export function RichHtml({ html, className = "" }: { html: unknown; className?: string }) {
  if (typeof html !== "string" || !html) return null;
  return <div className={`site-prose ${className}`} dangerouslySetInnerHTML={{ __html: html }} />;
}

export function stripHtml(html: unknown, max = 160): string {
  if (typeof html !== "string") return "";
  const text = html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
  return text.length > max ? text.slice(0, max - 1) + "…" : text;
}

/** "a\nb\nc" -> ["a","b","c"] (pricing features) */
export function lines(v: unknown): string[] {
  return typeof v === "string" ? v.split(/\r?\n/).map((s) => s.trim()).filter(Boolean) : [];
}

/** Floating / centered navbar fixed hota hai — page ka pehla block uske neeche na chhupe */
export function useFixedNav(): boolean {
  const n = useSite().template.nav;
  return n === "floating" || n === "centered";
}

/** Navbar fixed (upar tairta) hai => uski height jitni jagah. Home par hero khud sambhalta hai (hero navbar ke peeche) */
export const NAV_SPACER = "h-20";

export function PageBanner({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div
      className="relative overflow-hidden pb-16 pt-16"
      style={{ background: "linear-gradient(120deg, color-mix(in srgb, var(--primary) 80%, #000), color-mix(in srgb, var(--accent) 65%, #000))" }}
    >
      <motion.div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-2xl" animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 8, repeat: Infinity }} />
      <Container className="relative">
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={headingFont} className="text-3xl font-bold text-white sm:text-5xl">
          {title}
        </motion.h1>
        {subtitle && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mt-3 text-white/80">
            {subtitle}
          </motion.p>
        )}
      </Container>
    </div>
  );
}

export function EmptyState({ text }: { text: string }) {
  return <p className="py-10 text-center text-[var(--muted)]">{text}</p>;
}
