import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, animate, motion, useInView } from "framer-motion";
import { ArrowRight, ArrowUpRight, Check, MapPin, Phone, Plus } from "lucide-react";
import type { Row } from "../../lib/types";
import { useList } from "../data";
import { Container, fadeIn, fadeUp, headingFont, lines, MainCta, reveal, Section, SectionTitle, SiteButton, SiteCard, SmartImage, stagger, stripHtml, useSectionTitle, useSetting } from "../ui";
import { Marquee, Variant } from "./content";
import { SiteIcon } from "./icons";

const size = (all: boolean | undefined, n: number) => ({ size: all ? 60 : n });

function ViewAll({ to, all, label = "View all" }: { to: string; all?: boolean; label?: string }) {
  if (all) return null;
  return (
    <div className="mt-10 text-center">
      <Link to={to} className="inline-flex items-center gap-2 font-semibold text-[var(--primary)] hover:gap-3">
        {label} <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

// ================================================================ SERVICES (cards | icons | list | alternating)

export function Services({ variant = "cards", all }: Variant) {
  const { items } = useList("services", size(all, 6));
  if (!items.length) return null;

  if (variant === "icons") {
    return (
      <Section id="services" titled="services" title={all ? "" : undefined}>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((s, n) => (
            <SiteCard key={s.id} className="group p-7">
              <motion.span whileHover={{ rotate: 8, scale: 1.1 }} className="inline-flex rounded-2xl p-3.5 text-[var(--on-primary)]" style={{ background: n % 2 ? "var(--accent)" : "var(--primary)" }}>
                <SiteIcon name={s.icon} />
              </motion.span>
              <h3 style={headingFont} className="mt-5 text-xl font-semibold">{String(s.title)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{String(s.summary ?? "")}</p>
              {!!s.price && <div className="mt-4 text-sm font-semibold text-[var(--primary)]">{String(s.price)}</div>}
            </SiteCard>
          ))}
        </div>
      </Section>
    );
  }

  if (variant === "list") {
    return (
      <Section id="services" titled="services" title={all ? "" : undefined}>
        <motion.div variants={stagger} className="grid border-t border-[var(--text)]/10 md:grid-cols-2 md:gap-x-12">
          {items.map((s, n) => (
            <motion.div key={s.id} variants={fadeUp} className="group flex gap-6 border-b border-[var(--text)]/10 py-7">
              <span style={headingFont} className="text-4xl font-bold text-[var(--accent)] opacity-70 transition group-hover:opacity-100">
                {String(n + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 style={headingFont} className="text-xl font-semibold">{String(s.title)}</h3>
                <p className="mt-2 text-[var(--muted)]">{String(s.summary ?? "")}</p>
                {!!s.price && <div className="mt-2 text-sm font-semibold">{String(s.price)}</div>}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </Section>
    );
  }

  if (variant === "alternating") {
    return (
      <Section id="services" titled="services" title={all ? "" : undefined}>
        <div className="space-y-16">
          {items.map((s, n) => (
            <motion.div key={s.id} variants={fadeUp} className={`grid items-center gap-10 md:grid-cols-2 ${n % 2 ? "md:[&>*:first-child]:order-2" : ""}`}>
              <div className="overflow-hidden rounded-3xl shadow-xl">
                {s.image ? (
                  <SmartImage src={s.image} alt={String(s.title)} seed={n} className="aspect-[4/3] w-full transition duration-700 hover:scale-105" />
                ) : (
                  // photo nahi to bada icon gradient par (khaali placeholder nahi)
                  <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden text-white" style={{ background: n % 2 ? "linear-gradient(135deg, var(--accent), var(--primary))" : "linear-gradient(135deg, var(--primary), var(--accent))" }}>
                    <motion.div className="absolute h-64 w-64 rounded-full bg-white/10" animate={{ scale: [1, 1.25, 1] }} transition={{ duration: 6, repeat: Infinity }} />
                    <SiteIcon name={s.icon} className="relative h-24 w-24 drop-shadow-lg" />
                  </div>
                )}
              </div>
              <div>
                <span className="inline-flex rounded-full bg-[var(--accent)]/15 p-3 text-[var(--accent)]">
                  <SiteIcon name={s.icon} />
                </span>
                <h3 style={headingFont} className="mt-4 text-3xl font-semibold">{String(s.title)}</h3>
                <p className="mt-3 text-lg text-[var(--muted)]">{String(s.summary ?? "")}</p>
                {!!s.price && <div className="mt-4 font-semibold text-[var(--primary)]">{String(s.price)}</div>}
              </div>
            </motion.div>
          ))}
        </div>
      </Section>
    );
  }

  // cards — image card, icon badge on image
  return (
    <Section id="services" titled="services" title={all ? "" : undefined} alt>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((s, n) => (
          <SiteCard key={s.id} className="group">
            <div className="relative overflow-hidden">
              <SmartImage src={s.image} alt={String(s.title)} seed={n} className="aspect-[16/10] w-full transition duration-700 group-hover:scale-110" />
              <span className="absolute bottom-0 left-5 translate-y-1/2 rounded-xl bg-[var(--accent)] p-3 text-[var(--on-accent)] shadow-lg">
                <SiteIcon name={s.icon} className="h-5 w-5" />
              </span>
            </div>
            <div className="p-6 pt-8">
              <h3 style={headingFont} className="text-xl font-semibold">{String(s.title)}</h3>
              <p className="mt-2 text-sm text-[var(--muted)]">{String(s.summary ?? "")}</p>
              {!!s.price && <div className="mt-3 text-sm font-semibold text-[var(--primary)]">{String(s.price)}</div>}
            </div>
          </SiteCard>
        ))}
      </div>
      <ViewAll to="/services" all={all} />
    </Section>
  );
}

// ================================================================ CATALOG — menu items / properties / rooms / products (cards | menu | listing)

function PriceTag({ r }: { r: Row }) {
  return (
    <span className="flex items-baseline gap-2">
      {!!r.price && <span className="font-bold text-[var(--primary)]">{String(r.price)}</span>}
      {!!r.old_price && <span className="text-sm text-[var(--muted)] line-through">{String(r.old_price)}</span>}
    </span>
  );
}

export function Catalog({ variant = "cards", all }: Variant) {
  const { items } = useList("catalog_items", size(all, variant === "menu" ? 12 : 6));
  const [cat, setCat] = useState<string>("");
  if (!items.length) return null;
  const cats = [...new Set(items.map((i) => String(i.category ?? "")).filter(Boolean))];

  if (variant === "menu") {
    const shown = cat ? items.filter((i) => i.category === cat) : items;
    return (
      <Section id="catalog" titled="catalog" title={all ? "" : undefined}>
        {cats.length > 1 && (
          <motion.div variants={fadeUp} className="mb-10 flex flex-wrap justify-center gap-2">
            {["", ...cats].map((c) => (
              <button key={c || "all"} onClick={() => setCat(c)} className={`rounded-full px-5 py-2 text-sm font-medium transition ${cat === c ? "bg-[var(--primary)] text-[var(--on-primary)]" : "border border-[var(--text)]/15 hover:border-[var(--primary)]"}`}>
                {c || "All"}
              </button>
            ))}
          </motion.div>
        )}
        <motion.div key={cat} initial="hidden" animate="show" variants={stagger} className="grid gap-x-12 gap-y-8 md:grid-cols-2">
          {shown.map((m, n) => (
            <motion.div key={m.id} variants={fadeUp} className="flex gap-4">
              <SmartImage src={m.image} alt={String(m.title)} seed={n} className="h-20 w-20 shrink-0 rounded-full shadow-md" />
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <h3 style={headingFont} className="text-lg font-semibold">{String(m.title)}</h3>
                  {!!m.badge && <span className="rounded-full bg-[var(--accent)] px-2 py-0.5 text-[10px] font-bold uppercase text-[var(--on-accent)]">{String(m.badge)}</span>}
                  <span className="mx-1 flex-1 border-b-2 border-dotted border-[var(--text)]/20" />
                  <PriceTag r={m} />
                </div>
                <p className="mt-1 text-sm text-[var(--muted)]">{String(m.summary ?? "")}</p>
                {!!m.specs && <p className="mt-1 text-xs uppercase tracking-wide text-[var(--accent)]">{String(m.specs)}</p>}
              </div>
            </motion.div>
          ))}
        </motion.div>
        <ViewAll to="/catalog" all={all} label="Full menu" />
      </Section>
    );
  }

  if (variant === "listing") {
    return (
      <Section id="catalog" titled="catalog" title={all ? "" : undefined} alt>
        <div className="space-y-6">
          {items.map((p, n) => (
            <SiteCard key={p.id} className="group grid md:grid-cols-[1.1fr_1fr]">
              <Link to={`/catalog/${p.id}`} className="relative block overflow-hidden">
                <SmartImage src={p.image} alt={String(p.title)} seed={n} className="h-full min-h-[240px] w-full transition duration-700 group-hover:scale-105" />
                {!!p.badge && <span className="absolute left-4 top-4 bg-[var(--accent)] px-3 py-1 text-xs font-bold uppercase tracking-wide text-[var(--on-accent)]">{String(p.badge)}</span>}
              </Link>
              <div className="flex flex-col justify-center p-7">
                {!!p.category && <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">{String(p.category)}</div>}
                <Link to={`/catalog/${p.id}`}>
                  <h3 style={headingFont} className="mt-2 text-2xl font-semibold hover:text-[var(--primary)]">{String(p.title)}</h3>
                </Link>
                {!!p.location && (
                  <div className="mt-2 flex items-center gap-1.5 text-sm text-[var(--muted)]">
                    <MapPin className="h-4 w-4" /> {String(p.location)}
                  </div>
                )}
                <p className="mt-3 text-[var(--muted)]">{String(p.summary ?? "")}</p>
                {!!p.specs && <div className="mt-4 border-t border-[var(--text)]/10 pt-4 text-sm font-medium">{String(p.specs)}</div>}
                <div className="mt-5 flex items-center justify-between">
                  <span className="text-2xl">
                    <PriceTag r={p} />
                  </span>
                  <Link to={`/catalog/${p.id}`} className="rounded-full border border-[var(--text)]/15 p-2.5 transition group-hover:bg-[var(--primary)] group-hover:text-[var(--on-primary)]">
                    <ArrowUpRight className="h-5 w-5" />
                  </Link>
                </div>
              </div>
            </SiteCard>
          ))}
        </div>
        <ViewAll to="/catalog" all={all} />
      </Section>
    );
  }

  // cards
  return (
    <Section id="catalog" titled="catalog" title={all ? "" : undefined} alt>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((p, n) => (
          <SiteCard key={p.id} className="group">
            <Link to={`/catalog/${p.id}`} className="block">
              <div className="relative overflow-hidden">
                <SmartImage src={p.image} alt={String(p.title)} seed={n} className="aspect-[4/3] w-full transition duration-700 group-hover:scale-110" />
                {!!p.badge && <span className="absolute left-3 top-3 rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-bold text-[var(--on-accent)] shadow">{String(p.badge)}</span>}
                {!!p.price && <span className="absolute bottom-3 right-3 rounded-full bg-[var(--surface)] px-3 py-1 text-sm font-bold shadow-lg"><PriceTag r={p} /></span>}
              </div>
              <div className="p-5">
                {!!p.category && <div className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">{String(p.category)}</div>}
                <h3 style={headingFont} className="mt-1 text-lg font-semibold group-hover:text-[var(--primary)]">{String(p.title)}</h3>
                {!!p.location && (
                  <div className="mt-1 flex items-center gap-1 text-xs text-[var(--muted)]">
                    <MapPin className="h-3.5 w-3.5" /> {String(p.location)}
                  </div>
                )}
                <p className="mt-2 text-sm text-[var(--muted)]">{String(p.specs || p.summary || "")}</p>
              </div>
            </Link>
          </SiteCard>
        ))}
      </div>
      <ViewAll to="/catalog" all={all} />
    </Section>
  );
}

// ================================================================ PROJECTS / PORTFOLIO (grid | masonry | showcase)

export function ProjectCard({ p, n, tall = false }: { p: Row; n: number; tall?: boolean }) {
  return (
    <motion.div variants={fadeIn} className="group relative overflow-hidden rounded-[inherit]">
      <Link to={`/projects/${p.id}`} className="block">
        <SmartImage src={p.cover_image} alt={String(p.title)} seed={n} className={`w-full transition duration-700 group-hover:scale-110 ${tall ? "aspect-[3/4]" : "aspect-[4/3]"}`} />
        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/85 via-black/20 to-transparent p-5 opacity-90 transition group-hover:opacity-100">
          {!!p.category && <span className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">{String(p.category)}</span>}
          <h3 style={headingFont} className="mt-1 text-xl font-semibold text-white">{String(p.title)}</h3>
          <p className="mt-1 max-h-0 overflow-hidden text-sm text-white/80 transition-all duration-500 group-hover:max-h-20">{stripHtml(p.summary, 100)}</p>
        </div>
      </Link>
    </motion.div>
  );
}

export function Projects({ variant = "grid", all }: Variant) {
  const { items } = useList("projects", size(all, 6));
  const [cat, setCat] = useState("");
  if (!items.length) return null;
  const cats = [...new Set(items.map((i) => String(i.category ?? "")).filter(Boolean))];
  const shown = cat ? items.filter((i) => i.category === cat) : items;

  if (variant === "showcase") {
    return (
      <Section id="projects" titled="projects" title={all ? "" : undefined}>
        <div className="space-y-20">
          {items.map((p, n) => (
            <motion.div key={p.id} variants={fadeUp} className="grid items-center gap-10 md:grid-cols-12">
              <Link to={`/projects/${p.id}`} className={`group overflow-hidden md:col-span-7 ${n % 2 ? "md:order-2" : ""}`}>
                <SmartImage src={p.cover_image} alt={String(p.title)} seed={n} className="aspect-[16/10] w-full transition duration-1000 group-hover:scale-105" />
              </Link>
              <div className="md:col-span-5">
                <span style={headingFont} className="text-6xl font-bold text-[var(--text)]/10">{String(n + 1).padStart(2, "0")}</span>
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">{[p.category, p.location].filter(Boolean).join(" · ")}</div>
                <h3 style={headingFont} className="mt-2 text-3xl font-semibold">{String(p.title)}</h3>
                <p className="mt-3 text-lg text-[var(--muted)]">{String(p.summary ?? "")}</p>
                <Link to={`/projects/${p.id}`} className="mt-5 inline-flex items-center gap-2 font-semibold text-[var(--primary)] hover:gap-3">
                  View project <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
        <ViewAll to="/projects" all={all} />
      </Section>
    );
  }

  return (
    <Section id="projects" titled="projects" title={all ? "" : undefined} alt={variant === "grid"}>
      {cats.length > 1 && (
        <motion.div variants={fadeUp} className="mb-8 flex flex-wrap gap-2">
          {["", ...cats].map((c) => (
            <button key={c || "all"} onClick={() => setCat(c)} className={`rounded-full px-4 py-1.5 text-sm transition ${cat === c ? "bg-[var(--primary)] text-[var(--on-primary)]" : "bg-[var(--text)]/5 hover:bg-[var(--text)]/10"}`}>
              {c || "All"}
            </button>
          ))}
        </motion.div>
      )}
      <AnimatePresence mode="wait">
        <motion.div key={cat} initial="hidden" animate="show" variants={stagger} className={variant === "masonry" ? "columns-1 gap-5 sm:columns-2 lg:columns-3 [&>*]:mb-5" : "grid gap-5 sm:grid-cols-2 lg:grid-cols-3"}>
          {shown.map((p, n) => (
            <div key={p.id} className="overflow-hidden rounded-2xl">
              <ProjectCard p={p} n={n} tall={variant === "masonry" && n % 3 === 0} />
            </div>
          ))}
        </motion.div>
      </AnimatePresence>
      <ViewAll to="/projects" all={all} />
    </Section>
  );
}

// ================================================================ TEAM (cards | circles | overlay)

export function Team({ variant = "cards", all }: Variant) {
  const { items } = useList("team_members", size(all, 8));
  if (!items.length) return null;

  if (variant === "circles") {
    return (
      <Section id="team" titled="team" title={all ? "" : undefined}>
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {items.map((t, n) => (
            <motion.div key={t.id} variants={fadeUp} className="text-center">
              <motion.div whileHover={{ scale: 1.05, rotate: 2 }} className="mx-auto h-36 w-36 overflow-hidden rounded-full p-1" style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))" }}>
                <SmartImage src={t.photo} alt={String(t.title)} seed={n} className="h-full w-full rounded-full border-4 border-[var(--bg)]" />
              </motion.div>
              <h3 style={headingFont} className="mt-4 text-lg font-semibold">{String(t.title)}</h3>
              <div className="text-sm text-[var(--accent)]">{String(t.designation ?? "")}</div>
              <p className="mt-2 text-sm text-[var(--muted)]">{String(t.bio ?? "")}</p>
            </motion.div>
          ))}
        </div>
      </Section>
    );
  }

  if (variant === "overlay") {
    return (
      <Section id="team" titled="team" title={all ? "" : undefined} alt>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {items.map((t, n) => (
            <motion.div key={t.id} variants={fadeUp} className="group relative overflow-hidden">
              <SmartImage src={t.photo} alt={String(t.title)} seed={n} className="aspect-[3/4] w-full grayscale transition duration-700 group-hover:scale-105 group-hover:grayscale-0" />
              <div className="absolute inset-x-0 bottom-0 translate-y-6 bg-gradient-to-t from-black/90 to-transparent p-4 transition duration-500 group-hover:translate-y-0">
                <h3 style={headingFont} className="font-semibold text-white">{String(t.title)}</h3>
                <div className="text-sm text-[var(--accent)]">{String(t.designation ?? "")}</div>
                <p className="mt-1 text-xs text-white/70 opacity-0 transition group-hover:opacity-100">{String(t.bio ?? "")}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </Section>
    );
  }

  return (
    <Section id="team" titled="team" title={all ? "" : undefined}>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((t, n) => (
          <SiteCard key={t.id} className="text-center">
            <SmartImage src={t.photo} alt={String(t.title)} seed={n} className="aspect-square w-full" />
            <div className="p-5">
              <h3 style={headingFont} className="text-lg font-semibold">{String(t.title)}</h3>
              <div className="text-sm font-medium text-[var(--accent)]">{String(t.designation ?? "")}</div>
              <p className="mt-2 text-sm text-[var(--muted)]">{String(t.bio ?? "")}</p>
            </div>
          </SiteCard>
        ))}
      </div>
    </Section>
  );
}

// ================================================================ PRICING (cards | bold)

export function Pricing({ variant = "cards", all }: Variant) {
  const { items } = useList("pricing_plans", size(all, 6));
  if (!items.length) return null;
  const bold = variant === "bold";
  return (
    <Section id="pricing" titled="pricing" title={all ? "" : undefined} alt={!bold}>
      <div className={`grid items-stretch gap-6 ${items.length >= 3 ? "lg:grid-cols-3" : "md:grid-cols-2"}`}>
        {items.map((p) => {
          const hi = !!p.highlighted && p.highlighted !== "false" && p.highlighted !== 0;
          return (
            <motion.div
              key={p.id}
              variants={fadeUp}
              whileHover={{ y: -8 }}
              className={`relative flex flex-col p-8 ${hi ? "z-10 shadow-2xl lg:scale-105" : ""} ${bold ? "border-2 border-[var(--text)]" : "rounded-3xl"} ${
                hi ? "bg-[var(--primary)] text-[var(--on-primary)]" : "bg-[var(--surface)] ring-1 ring-[var(--text)]/10"
              }`}
            >
              {!!p.badge && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--accent)] px-4 py-1 text-xs font-bold uppercase tracking-wide text-[var(--on-accent)] shadow">{String(p.badge)}</span>}
              <h3 style={headingFont} className="text-xl font-semibold">{String(p.title)}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span style={headingFont} className={`font-bold ${bold ? "text-6xl" : "text-5xl"}`}>{String(p.price)}</span>
                <span className={hi ? "opacity-80" : "text-[var(--muted)]"}>{String(p.period ?? "")}</span>
              </div>
              <ul className="mt-6 flex-1 space-y-3">
                {lines(p.features).map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className={`mt-0.5 h-4 w-4 shrink-0 ${hi ? "" : "text-[var(--accent)]"}`} /> {f}
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <SiteButton to={String(p.button_link || "/contact")} kind={hi ? "accent" : "primary"} className="w-full">
                  {String(p.button_text || "Get Started")}
                </SiteButton>
              </div>
            </motion.div>
          );
        })}
      </div>
    </Section>
  );
}

// ================================================================ STATS (band | cards | inline) — counters animate on scroll

/** "1,200+" -> 1200 count up, prefix/suffix rakhta hai */
function Counter({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const m = value.match(/^([^\d]*)([\d,.]+)(.*)$/);
  const target = m ? parseFloat(m[2].replace(/,/g, "")) : NaN;
  const decimals = m && m[2].includes(".") ? m[2].split(".")[1].length : 0;
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!inView || isNaN(target)) return;
    const c = animate(0, target, { duration: 1.8, ease: "easeOut", onUpdate: setV });
    return () => c.stop();
  }, [inView, target]);
  if (!m || isNaN(target)) return <span>{value}</span>;
  const shown = decimals ? v.toFixed(decimals) : Math.round(v).toLocaleString("en-IN");
  return (
    <span ref={ref}>
      {m[1]}
      {shown}
      {m[3]}
    </span>
  );
}

// Tailwind ko poori class string dikhni chahiye (dynamic `md:grid-cols-${n}` build me nahi aati)
const COLS = ["md:grid-cols-1", "md:grid-cols-2", "md:grid-cols-3", "md:grid-cols-4"];

export function Stats({ variant = "band" }: Variant) {
  const { items } = useList("stats", { size: 8 });
  const [title, sub] = useSectionTitle("stats");
  if (!items.length) return null;

  if (variant === "band") {
    return (
      <motion.section {...reveal} variants={stagger} className="relative overflow-hidden py-16" style={{ background: "linear-gradient(120deg, var(--primary), color-mix(in srgb, var(--primary) 60%, var(--accent)))" }}>
        <div className="pointer-events-none absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "22px 22px" }} />
        <Container className={`relative grid grid-cols-2 gap-8 text-center text-[var(--on-primary)] ${COLS[Math.min(items.length, 4) - 1]}`}>
          {items.map((s) => (
            <motion.div key={s.id} variants={fadeUp}>
              <SiteIcon name={s.icon} className="mx-auto h-8 w-8 opacity-80" />
              <div style={headingFont} className="mt-3 text-4xl font-bold sm:text-5xl">
                <Counter value={String(s.value)} />
              </div>
              <div className="mt-1 text-sm uppercase tracking-wider opacity-80">{String(s.title)}</div>
            </motion.div>
          ))}
        </Container>
      </motion.section>
    );
  }

  if (variant === "inline") {
    return (
      <motion.section {...reveal} variants={stagger} className="py-14">
        <Container className="grid grid-cols-2 divide-[var(--text)]/10 md:grid-cols-4 md:divide-x">
          {items.map((s) => (
            <motion.div key={s.id} variants={fadeUp} className="px-6 py-4">
              <div style={headingFont} className="text-5xl font-bold text-[var(--primary)]">
                <Counter value={String(s.value)} />
              </div>
              <div className="mt-2 text-sm text-[var(--muted)]">{String(s.title)}</div>
            </motion.div>
          ))}
        </Container>
      </motion.section>
    );
  }

  return (
    <Section id="stats" title={title} subtitle={sub}>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {items.map((s, n) => (
          <SiteCard key={s.id} className="p-6 text-center">
            <span className="inline-flex rounded-2xl p-3 text-[var(--on-primary)]" style={{ background: n % 2 ? "var(--accent)" : "var(--primary)" }}>
              <SiteIcon name={s.icon} />
            </span>
            <div style={headingFont} className="mt-4 text-4xl font-bold">
              <Counter value={String(s.value)} />
            </div>
            <div className="mt-1 text-sm text-[var(--muted)]">{String(s.title)}</div>
          </SiteCard>
        ))}
      </div>
    </Section>
  );
}

// ================================================================ FAQ (accordion | two-col)

function FaqItem({ q, a, open, onToggle }: { q: string; a: string; open: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-[var(--text)]/10">
      <button onClick={onToggle} className="flex w-full items-center justify-between gap-4 py-5 text-left">
        <span style={headingFont} className="text-lg font-semibold">{q}</span>
        <motion.span animate={{ rotate: open ? 45 : 0 }} className="shrink-0 rounded-full bg-[var(--primary)] p-1.5 text-[var(--on-primary)]">
          <Plus className="h-4 w-4" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <p className="pb-5 text-[var(--muted)]">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Faq({ variant = "accordion", all }: Variant) {
  const { items } = useList("faqs", size(all, 8));
  const [open, setOpen] = useState<number | null>(0);
  const [title, sub] = useSectionTitle("faq");
  if (!items.length) return null;
  const list = (
    <motion.div variants={fadeUp}>
      {items.map((f, n) => (
        <FaqItem key={f.id} q={String(f.title)} a={String(f.answer ?? "")} open={open === n} onToggle={() => setOpen(open === n ? null : n)} />
      ))}
    </motion.div>
  );
  if (variant === "two-col") {
    return (
      <motion.section id="faq" {...reveal} variants={stagger} className="py-16 sm:py-24">
        <Container className="grid gap-12 md:grid-cols-[1fr_1.6fr]">
          <div>
            <SectionTitle title={title} subtitle={sub} />
            <motion.p variants={fadeUp} className="-mt-4 text-[var(--muted)]">
              Can't find an answer? We're happy to help.
            </motion.p>
            <motion.div variants={fadeUp} className="mt-6">
              <MainCta kind="primary" />
            </motion.div>
          </div>
          {list}
        </Container>
      </motion.section>
    );
  }
  return (
    <Section id="faq" title={title} subtitle={sub}>
      <div className="mx-auto max-w-3xl">{list}</div>
    </Section>
  );
}

// ================================================================ PARTNERS / CLIENTS (marquee | grid) — logo na ho to naam wordmark

function Logo({ p }: { p: Row }) {
  return p.logo ? (
    <SmartImage src={p.logo} alt={String(p.title)} className="h-10 w-auto object-contain opacity-70 grayscale transition hover:opacity-100 hover:grayscale-0" />
  ) : (
    <span style={headingFont} className="whitespace-nowrap text-2xl font-bold text-[var(--text)] opacity-40 transition hover:text-[var(--primary)] hover:opacity-100">
      {String(p.title)}
    </span>
  );
}

export function Partners({ variant = "marquee" }: Variant) {
  const { items } = useList("partners", { size: 12 });
  const [title] = useSectionTitle("partners");
  if (!items.length) return null;
  if (variant === "grid") {
    return (
      <Section id="partners" titled="partners">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-[var(--text)]/10 sm:grid-cols-3 lg:grid-cols-6">
          {items.map((p) => (
            <motion.div key={p.id} variants={fadeUp} className="flex h-28 items-center justify-center bg-[var(--bg)] px-4">
              <Logo p={p} />
            </motion.div>
          ))}
        </div>
      </Section>
    );
  }
  return (
    <section className="border-y border-[var(--text)]/10 py-10">
      <Container>
        <div className="mb-6 text-center text-xs font-semibold uppercase tracking-[0.25em] text-[var(--muted)]">{title}</div>
        <Marquee speed={30}>
          {items.map((p) => (
            <div key={p.id} className="flex items-center px-8">
              <Logo p={p} />
            </div>
          ))}
        </Marquee>
      </Container>
    </section>
  );
}

// ================================================================ CTA (band | split)

export function Cta({ variant = "band" }: Variant) {
  const name = useSetting("site_name");
  const tagline = useSetting("tagline");
  const phone = useSetting("phone");
  const ctaText = useSetting("cta_text") || "Contact Us";
  const ctaLink = useSetting("cta_link") || "/contact";
  const { items } = useList("sliders", { size: 1 });
  if (variant === "split") {
    return (
      <motion.section {...reveal} variants={stagger} className="py-16">
        <Container>
          <motion.div variants={fadeUp} className="grid overflow-hidden rounded-3xl bg-[var(--surface)] shadow-2xl ring-1 ring-[var(--text)]/10 md:grid-cols-2">
            <div className="p-10 sm:p-14">
              <h2 style={headingFont} className="text-3xl font-bold sm:text-4xl">Ready to get started with {name}?</h2>
              <p className="mt-4 text-[var(--muted)]">{tagline}</p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <MainCta kind="primary" />
                {phone && (
                  <a href={`tel:${phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-2 font-semibold">
                    <Phone className="h-4 w-4 text-[var(--accent)]" /> {phone}
                  </a>
                )}
              </div>
            </div>
            <SmartImage src={items[0]?.image} alt="" className="h-full min-h-[260px] w-full" />
          </motion.div>
        </Container>
      </motion.section>
    );
  }
  return (
    <motion.section {...reveal} variants={stagger} className="relative overflow-hidden py-20" style={{ background: "linear-gradient(120deg, var(--accent), var(--primary))" }}>
      <motion.div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-white/10" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 6, repeat: Infinity }} />
      <motion.div className="absolute -bottom-24 right-10 h-64 w-64 rounded-full bg-white/10" animate={{ scale: [1.2, 1, 1.2] }} transition={{ duration: 7, repeat: Infinity }} />
      <Container className="relative text-center text-white">
        <motion.h2 variants={fadeUp} style={headingFont} className="text-3xl font-bold sm:text-5xl">
          {tagline || name}
        </motion.h2>
        <motion.p variants={fadeUp} className="mx-auto mt-4 max-w-xl text-white/85">
          {phone ? `Call us at ${phone} or reach out online — we reply fast.` : "Reach out today — we reply fast."}
        </motion.p>
        <motion.div variants={fadeUp} className="mt-8 flex justify-center">
          <SiteButton to={ctaLink} kind="outline-light" className="bg-white/10 backdrop-blur">
            {ctaText} <ArrowRight className="h-4 w-4" />
          </SiteButton>
        </motion.div>
      </Container>
    </motion.section>
  );
}
