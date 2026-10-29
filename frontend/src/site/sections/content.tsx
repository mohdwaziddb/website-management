import { ReactNode, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, CalendarDays, Clock, Download, FileText, Mail, MapPin, Phone, PlayCircle, Quote, Star, Trophy } from "lucide-react";
import { fileUrl } from "../../lib/api";
import type { Row } from "../../lib/types";
import { useList } from "../data";
import { Container, fadeUp, formatDate, headingFont, MainCta, RichHtml, Section, SiteCard, SmartImage, stagger, stripHtml, useSectionTitle, useSetting, youtubeId } from "../ui";

export type Variant = { variant?: string; all?: boolean };

/** Bina rukne wali horizontal patti (logos / testimonials / photos) */
export function Marquee({ children, speed = 40, reverse = false }: { children: ReactNode; speed?: number; reverse?: boolean }) {
  return (
    <div className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
      <motion.div className="flex w-max gap-6" animate={{ x: reverse ? ["-50%", "0%"] : ["0%", "-50%"] }} transition={{ duration: speed, repeat: Infinity, ease: "linear" }}>
        {children}
        {children}
      </motion.div>
    </div>
  );
}

// ------------------------------------------------------------ thought of the day

export function Thought() {
  const { items } = useList("thoughts", { size: 1 });
  if (!items.length) return null;
  const t = items[0];
  return (
    <motion.section initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="py-10" style={{ background: "linear-gradient(90deg, var(--primary), var(--accent))" }}>
      <Container className="flex items-center gap-4 text-white">
        <Quote className="h-10 w-10 shrink-0 opacity-60" />
        <div>
          <div className="text-xs uppercase tracking-widest text-white/70">{String(t.title || "Thought of the day")}</div>
          <p style={headingFont} className="mt-1 text-xl italic sm:text-2xl">“{String(t.description ?? "")}”</p>
        </div>
      </Container>
    </motion.section>
  );
}

// ------------------------------------------------------------ about (split = feature tiles, image = photo + text)

export function About({ variant }: Variant) {
  const about = useSetting("about_short");
  const name = useSetting("site_name");
  const hours = useSetting("opening_hours");
  const { items } = useList("image_gallery", { size: 2 });
  const [, sub] = useSectionTitle("about");
  if (!about) return null;
  if (variant === "image") {
    return (
      <Section id="about" alt>
        <div className="grid items-center gap-12 md:grid-cols-2">
          <motion.div variants={fadeUp} className="relative">
            <SmartImage src={items[0]?.image} alt={name} className="aspect-[4/5] w-full rounded-[inherit] object-cover shadow-2xl" />
            {items[1] && (
              <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }} className="absolute -bottom-8 -right-6 hidden w-1/2 overflow-hidden border-8 border-[var(--surface)] shadow-xl sm:block">
                <SmartImage src={items[1].image} alt="" className="aspect-square w-full" />
              </motion.div>
            )}
          </motion.div>
          <motion.div variants={fadeUp}>
            <div className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--accent)]">{sub}</div>
            <h2 style={headingFont} className="mt-3 text-4xl font-bold">{name}</h2>
            <RichHtml html={about} className="mt-5 text-lg leading-relaxed text-[var(--muted)]" />
            {hours && (
              <div className="mt-6 flex gap-3 rounded-xl border border-[var(--text)]/10 p-4">
                <Clock className="h-5 w-5 shrink-0 text-[var(--accent)]" />
                <div className="whitespace-pre-line text-sm">{hours}</div>
              </div>
            )}
            <div className="mt-8">
              <MainCta kind="primary" />
            </div>
          </motion.div>
        </div>
      </Section>
    );
  }
  return (
    <Section id="about" title={`About ${name || "us"}`} subtitle={sub} alt>
      <div className="grid items-center gap-10 md:grid-cols-2">
        <motion.div variants={fadeUp}>
          <RichHtml html={about} className="text-lg leading-relaxed text-[var(--muted)]" />
          <Link to="/contact" className="mt-6 inline-flex items-center gap-2 font-semibold text-[var(--primary)] hover:gap-3">
            Get in touch <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
        <motion.div variants={fadeUp} className="grid grid-cols-2 gap-4">
          {(items.length ? items : [{ id: 0 } as Row, { id: 1 } as Row]).slice(0, 2).map((g, n) => (
            <motion.div key={g.id} whileHover={{ scale: 1.03 }} className={`overflow-hidden rounded-2xl shadow-lg ${n ? "mt-10" : ""}`}>
              <SmartImage src={g.image} alt="" seed={n} className="aspect-[3/4] w-full" />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </Section>
  );
}

// ------------------------------------------------------------ school: achievements, notices

// ------------------------------------------------------------ school: achievements + awards + activities (tabs)

const ACH_TABS = [
  { module: "achievements", label: "Achievements", date: "achievement_date" },
  { module: "awards", label: "Awards", date: "award_date" },
  { module: "activities", label: "Activities", date: "activity_date" }
] as const;

function AchievementCard({ a, n, dateField }: { a: Row; n: number; dateField: string }) {
  const file = fileUrl(a.attachment);
  return (
    <SiteCard>
      <SmartImage src={a.image} alt={String(a.title)} seed={n} className="aspect-video w-full" />
      <div className="p-5">
        <div className="flex items-center gap-1.5 text-xs text-[var(--accent)]">
          <Trophy className="h-3.5 w-3.5" /> {formatDate(a[dateField])} {a.category_id_label ? `· ${a.category_id_label}` : ""}
        </div>
        <h3 style={headingFont} className="mt-2 text-lg font-semibold">{String(a.title)}</h3>
        <p className="mt-2 text-sm text-[var(--muted)]">{stripHtml(a.description, 110)}</p>
        {file && (
          <a href={file} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[var(--primary)]">
            <Download className="h-4 w-4" /> Attachment
          </a>
        )}
      </div>
    </SiteCard>
  );
}

/** Achievements / Awards / Activities — sirf jin tabs me data hai wahi dikhte hain */
export function Achievements({ all }: Variant) {
  const lists = {
    achievements: useList("achievements", { size: all ? 60 : 6 }),
    awards: useList("awards", { size: all ? 60 : 6 }),
    activities: useList("activities", { size: all ? 60 : 6 })
  };
  const tabs = ACH_TABS.filter((t) => lists[t.module].items.length);
  const [tab, setTab] = useState<string>("");
  const [cat, setCat] = useState("");
  if (!tabs.length) return null;
  const active = tabs.find((t) => t.module === tab) ?? tabs[0];
  let items = lists[active.module].items;
  const cats = active.module === "awards" ? [...new Set(items.map((a) => String(a.category_id_label ?? "")).filter(Boolean))] : [];
  if (cat && active.module === "awards") items = items.filter((a) => a.category_id_label === cat);
  return (
    <Section id="achievements" title={all ? "" : "Achievements"} subtitle="Proud moments">
      {(tabs.length > 1 || cats.length > 1) && (
        <motion.div variants={fadeUp} className="mb-8 flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t.module}
              onClick={() => {
                setTab(t.module);
                setCat("");
              }}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${active.module === t.module ? "bg-[var(--primary)] text-[var(--on-primary)]" : "bg-[var(--text)]/5 hover:bg-[var(--text)]/10"}`}
            >
              {t.label}
            </button>
          ))}
          {cats.length > 1 && <span className="mx-2 w-px bg-[var(--text)]/15" />}
          {cats.length > 1 &&
            ["", ...cats].map((c) => (
              <button key={c || "all"} onClick={() => setCat(c)} className={`rounded-full border px-3 py-1 text-xs transition ${cat === c ? "border-[var(--accent)] text-[var(--accent)]" : "border-[var(--text)]/15"}`}>
                {c || "All awards"}
              </button>
            ))}
        </motion.div>
      )}
      {/* tab / category badle to naye cards bhi animate hon (warna whileInView ek hi baar chalta hai aur naye cards chhupe rehte) */}
      <motion.div key={active.module + cat} initial="hidden" animate="show" variants={stagger} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((a, n) => (
          <AchievementCard key={`${active.module}-${a.id}`} a={a} n={n} dateField={active.date} />
        ))}
      </motion.div>
      {!all && (
        <div className="mt-8 text-center">
          <Link to="/achievements" className="inline-flex items-center gap-2 font-semibold text-[var(--primary)]">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </Section>
  );
}

function NoticeList({ title, module, dateField, link }: { title: string; module: string; dateField: string; link: string }) {
  const { items } = useList(module, { size: 5 });
  if (!items.length) return null;
  return (
    <SiteCard hover={false} className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 style={headingFont} className="text-xl font-semibold">{title}</h3>
        <Link to={link} className="text-sm font-medium text-[var(--primary)]">View all</Link>
      </div>
      <ul className="divide-y divide-[var(--text)]/10">
        {items.map((n) => (
          <li key={n.id} className="flex items-start gap-3 py-3">
            <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" />
            <div>
              <div className="font-medium">{String(n.title)}</div>
              <div className="text-xs text-[var(--muted)]">{formatDate(n[dateField])}</div>
            </div>
          </li>
        ))}
      </ul>
    </SiteCard>
  );
}

export function Notices() {
  const press = useList("press_releases", { size: 5 });
  const tenders = useList("tenders", { size: 5 });
  if (!press.items.length && !tenders.items.length) return null;
  return (
    <Section id="notices" title="Notices & Updates" subtitle="Stay informed" alt>
      <div className="grid gap-6 md:grid-cols-2">
        <NoticeList title="Press Releases" module="press_releases" dateField="release_date" link="/press" />
        <NoticeList title="Tenders" module="tenders" dateField="end_date" link="/tenders" />
      </div>
    </Section>
  );
}

// ------------------------------------------------------------ news (cards | list)

export function BlogCard({ b, n }: { b: Row; n: number }) {
  return (
    <SiteCard>
      <Link to={`/blog/${b.slug}`} className="group block">
        <div className="overflow-hidden">
          <SmartImage src={b.cover_image} alt={String(b.title)} seed={n + 1} className="aspect-[16/10] w-full transition duration-700 group-hover:scale-105" />
        </div>
        <div className="p-5">
          <div className="text-xs text-[var(--muted)]">
            {formatDate(b.published_date)} {b.author ? `· ${b.author}` : ""}
          </div>
          <h3 style={headingFont} className="mt-2 text-lg font-semibold group-hover:text-[var(--primary)]">{String(b.title)}</h3>
          <p className="mt-2 text-sm text-[var(--muted)]">{stripHtml(b.summary, 120)}</p>
        </div>
      </Link>
    </SiteCard>
  );
}

export function News({ variant }: Variant) {
  const { items } = useList("blogs", { size: 3 });
  if (!items.length) return null;
  return (
    <Section id="news" titled="news" alt>
      {variant === "list" ? (
        <motion.div variants={fadeUp} className="divide-y divide-[var(--text)]/10 border-y border-[var(--text)]/10">
          {items.map((b) => (
            <Link key={b.id} to={`/blog/${b.slug}`} className="group flex flex-col gap-1 py-6 sm:flex-row sm:items-baseline sm:gap-8">
              <span className="w-32 shrink-0 text-sm text-[var(--muted)]">{formatDate(b.published_date)}</span>
              <span style={headingFont} className="flex-1 text-xl font-semibold group-hover:text-[var(--primary)]">{String(b.title)}</span>
              <ArrowRight className="hidden h-5 w-5 transition group-hover:translate-x-1 sm:block" />
            </Link>
          ))}
        </motion.div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {items.map((b, n) => (
            <BlogCard key={b.id} b={b} n={n} />
          ))}
        </div>
      )}
      <div className="mt-8 text-center">
        <Link to="/blogs" className="inline-flex items-center gap-2 font-semibold text-[var(--primary)]">
          All posts <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </Section>
  );
}

// ------------------------------------------------------------ gallery (masonry bento | strip marquee)

export function GallerySection({ variant }: Variant) {
  const { items } = useList("image_gallery", { size: 8 });
  if (!items.length) return null;
  if (variant === "strip") {
    return (
      <Section id="gallery" titled="gallery">
        <Marquee speed={50}>
          {items.map((g, n) => (
            <div key={g.id} className="group relative h-64 w-80 shrink-0 overflow-hidden rounded-xl">
              <SmartImage src={g.image} alt={String(g.title)} seed={n} className="h-full w-full transition duration-700 group-hover:scale-110" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 p-3 text-sm text-white">{String(g.title)}</div>
            </div>
          ))}
        </Marquee>
      </Section>
    );
  }
  return (
    <Section id="gallery" titled="gallery">
      <div className="grid auto-rows-[170px] grid-cols-2 gap-3 md:grid-cols-4">
        {items.map((g, n) => (
          <motion.div key={g.id} variants={fadeUp} className={`group relative overflow-hidden rounded-xl ${n % 5 === 0 ? "row-span-2" : ""}`}>
            <SmartImage src={g.image} alt={String(g.title)} seed={n} className="h-full w-full transition duration-700 group-hover:scale-110" />
            <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/70 to-transparent p-3 opacity-0 transition group-hover:opacity-100">
              <span className="text-sm font-medium text-white">{String(g.title)}</span>
            </div>
          </motion.div>
        ))}
      </div>
      <div className="mt-8 text-center">
        <Link to="/gallery" className="inline-flex items-center gap-2 font-semibold text-[var(--primary)]">
          View full gallery <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </Section>
  );
}

// ------------------------------------------------------------ videos

export function VideoCard({ v, n }: { v: Row; n: number }) {
  const id = youtubeId(v.video_url);
  return (
    <SiteCard>
      <a href={String(v.video_url)} target="_blank" rel="noreferrer" className="group relative block">
        {id ? (
          <img src={`https://img.youtube.com/vi/${id}/hqdefault.jpg`} alt={String(v.title)} loading="lazy" className="aspect-video w-full object-cover" />
        ) : (
          <SmartImage alt={String(v.title)} seed={n} className="aspect-video w-full" />
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-black/20 transition group-hover:bg-black/40">
          <PlayCircle className="h-14 w-14 text-white drop-shadow-lg transition group-hover:scale-110" />
        </span>
      </a>
      <div className="p-4">
        <h3 className="font-semibold">{String(v.title)}</h3>
        <div className="text-xs text-[var(--muted)]">{formatDate(v.video_date)}</div>
      </div>
    </SiteCard>
  );
}

/** Live streams: aaj = LIVE, aage = Upcoming, peeche = Watch recording */
export function LiveStreams({ all }: { all?: boolean }) {
  const { items } = useList("livestreams", { size: all ? 30 : 4 });
  if (!items.length) return null;
  const today = new Date().toISOString().slice(0, 10);
  const sorted = [...items].sort((a, b) => String(b.event_date ?? "").localeCompare(String(a.event_date ?? "")));
  return (
    <motion.div variants={fadeUp} className="mb-8 grid gap-3 md:grid-cols-2">
      {sorted.map((l) => {
        const d = String(l.event_date ?? "");
        const state = d === today ? "LIVE" : d > today ? "Upcoming" : "Recorded";
        return (
          <a key={l.id} href={String(l.event_url)} target="_blank" rel="noreferrer" className="group flex items-center gap-4 rounded-2xl bg-[var(--surface)] p-4 ring-1 ring-[var(--text)]/10 transition hover:shadow-lg">
            <span className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${state === "LIVE" ? "bg-red-600 text-white" : "bg-[var(--primary)] text-[var(--on-primary)]"}`}>
              {state === "LIVE" && <span className="absolute inset-0 animate-ping rounded-full bg-red-600 opacity-40" />}
              <PlayCircle className="relative h-6 w-6" />
            </span>
            <div className="min-w-0 flex-1">
              <div className={`text-xs font-bold uppercase tracking-wider ${state === "LIVE" ? "text-red-600" : "text-[var(--accent)]"}`}>{state === "LIVE" ? "● Live today" : state}</div>
              <div className="truncate font-semibold group-hover:text-[var(--primary)]">{String(l.title)}</div>
              <div className="text-xs text-[var(--muted)]">{formatDate(l.event_date)}</div>
            </div>
            <ArrowRight className="h-5 w-5 text-[var(--muted)] transition group-hover:translate-x-1" />
          </a>
        );
      })}
    </motion.div>
  );
}

export function Videos() {
  const { items } = useList("videos", { size: 3 });
  const live = useList("livestreams", { size: 4 });
  if (!items.length && !live.items.length) return null;
  return (
    <Section id="videos" title="Videos" subtitle="Watch & enjoy" alt>
      <LiveStreams />
      <div className="grid gap-6 md:grid-cols-3">
        {items.map((v, n) => (
          <VideoCard key={v.id} v={v} n={n} />
        ))}
      </div>
      {items.length > 0 && (
        <div className="mt-8 text-center">
          <Link to="/videos" className="inline-flex items-center gap-2 font-semibold text-[var(--primary)]">
            All videos <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </Section>
  );
}

// ------------------------------------------------------------ testimonials (carousel | grid | marquee)

function Stars() {
  return (
    <div className="flex gap-0.5 text-[var(--accent)]">
      {[0, 1, 2, 3, 4].map((i) => (
        <Star key={i} className="h-4 w-4 fill-current" />
      ))}
    </div>
  );
}

function Person({ t }: { t: Row }) {
  return (
    <div className="flex items-center gap-3">
      {t.photo ? <img src={fileUrl(t.photo)} alt="" className="h-11 w-11 rounded-full object-cover" /> : <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--primary)] font-bold text-[var(--on-primary)]">{String(t.parent_name || t.title || "?").charAt(0)}</span>}
      <div className="text-left">
        <div className="font-semibold">{String(t.parent_name || t.title)}</div>
        <div className="text-xs text-[var(--muted)]">{String(t.child_name ?? "")}</div>
      </div>
    </div>
  );
}

function TestimonialCard({ t, className = "" }: { t: Row; className?: string }) {
  return (
    <SiteCard hover={false} className={`flex flex-col gap-4 p-6 ${className}`}>
      <Stars />
      <p className="flex-1 leading-relaxed">“{String(t.description ?? "")}”</p>
      <Person t={t} />
    </SiteCard>
  );
}

export function Testimonials({ variant }: Variant) {
  const { items } = useList("testimonials", { size: 10 });
  const [i, setI] = useState(0);
  useEffect(() => {
    if (variant || items.length < 2) return;
    const t = setInterval(() => setI((p) => (p + 1) % items.length), 6000);
    return () => clearInterval(t);
  }, [items.length, variant]);
  if (!items.length) return null;

  if (variant === "grid") {
    return (
      <Section id="testimonials" titled="testimonials" alt>
        <div className="grid gap-6 md:grid-cols-3">
          {items.slice(0, 6).map((t) => (
            <TestimonialCard key={t.id} t={t} />
          ))}
        </div>
      </Section>
    );
  }
  if (variant === "marquee") {
    return (
      <Section id="testimonials" titled="testimonials" alt>
        <Marquee speed={45}>
          {items.map((t) => (
            <TestimonialCard key={t.id} t={t} className="w-80 shrink-0" />
          ))}
        </Marquee>
      </Section>
    );
  }
  const t = items[i % items.length];
  return (
    <Section id="testimonials" titled="testimonials">
      <div className="mx-auto max-w-3xl text-center">
        <AnimatePresence mode="wait">
          <motion.div key={t.id} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.45 }}>
            <Quote className="mx-auto h-10 w-10 text-[var(--accent)]" />
            <p style={headingFont} className="mt-4 text-xl leading-relaxed sm:text-2xl">“{String(t.description ?? "")}”</p>
            <div className="mt-6 flex justify-center">
              <Person t={t} />
            </div>
          </motion.div>
        </AnimatePresence>
        {items.length > 1 && (
          <div className="mt-6 flex justify-center gap-2">
            {items.map((x, n) => (
              <button key={x.id} aria-label={`Testimonial ${n + 1}`} onClick={() => setI(n)} className={`h-2 rounded-full transition-all ${n === i % items.length ? "w-6 bg-[var(--primary)]" : "w-2 bg-[var(--muted)]/40"}`} />
            ))}
          </div>
        )}
      </div>
    </Section>
  );
}

// ------------------------------------------------------------ downloads

export function DownloadRow({ d }: { d: Row }) {
  const href = fileUrl(d.attachment);
  const cls = "flex items-center gap-3 rounded-xl border border-[var(--text)]/10 bg-[var(--surface)] p-4 transition hover:-translate-y-0.5 hover:shadow-md";
  const body = (
    <>
      <FileText className="h-8 w-8 text-[var(--primary)]" />
      <span className="flex-1 font-medium">{String(d.title)}</span>
      <Download className="h-4 w-4 text-[var(--muted)]" />
    </>
  );
  // file na ho (demo) to link nahi — URL me "#" na aaye
  if (!href) return <div className={cls}>{body}</div>;
  return (
    <a href={href} target="_blank" rel="noreferrer" className={cls}>
      {body}
    </a>
  );
}

export function Downloads() {
  const { items } = useList("attachments", { size: 6 });
  if (!items.length) return null;
  return (
    <Section id="downloads" title="Downloads" subtitle="Forms & documents">
      <motion.div variants={fadeUp} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((d) => (
          <DownloadRow key={d.id} d={d} />
        ))}
      </motion.div>
    </Section>
  );
}

// ------------------------------------------------------------ contact

export function ContactBlock() {
  const phone = useSetting("phone");
  const email = useSetting("email");
  const address = useSetting("address");
  const hours = useSetting("opening_hours");
  const map = useSetting("map_embed_url");
  const rows = [
    { icon: MapPin, label: "Address", value: address },
    { icon: Phone, label: "Phone", value: phone, href: phone ? `tel:${phone.replace(/\s/g, "")}` : "" },
    { icon: Mail, label: "Email", value: email, href: email ? `mailto:${email}` : "" },
    { icon: Clock, label: "Hours", value: hours }
  ].filter((r) => r.value);
  return (
    <div className="grid gap-8 md:grid-cols-2">
      <motion.div variants={fadeUp} className="space-y-5">
        {rows.map((r) => (
          <div key={r.label} className="flex items-start gap-4">
            <span className="rounded-xl bg-[var(--primary)] p-3 text-[var(--on-primary)]">
              <r.icon className="h-5 w-5" />
            </span>
            <div>
              <div className="text-sm text-[var(--muted)]">{r.label}</div>
              {r.href ? (
                <a href={r.href} className="font-medium hover:text-[var(--primary)]">{r.value}</a>
              ) : (
                <div className="whitespace-pre-line font-medium">{r.value}</div>
              )}
            </div>
          </div>
        ))}
        {!rows.length && <p className="text-[var(--muted)]">Contact details coming soon.</p>}
        <div className="pt-2">
          <MainCta />
        </div>
      </motion.div>
      <motion.div variants={fadeUp} className="min-h-[280px] overflow-hidden rounded-2xl">
        {map && /^https:\/\/(www\.)?google\.[a-z.]+\/maps/.test(map) ? (
          <iframe title="Map" src={map} className="h-full min-h-[280px] w-full border-0" loading="lazy" />
        ) : (
          <div className="relative flex h-full min-h-[280px] items-center justify-center overflow-hidden" style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))" }}>
            <motion.div className="absolute h-40 w-40 rounded-full border-2 border-white/30" animate={{ scale: [1, 2.2], opacity: [0.6, 0] }} transition={{ duration: 2.5, repeat: Infinity }} />
            <MapPin className="relative h-12 w-12 text-white" />
          </div>
        )}
      </motion.div>
    </div>
  );
}

export function Contact() {
  return (
    <Section id="contact" titled="contact" alt>
      <ContactBlock />
    </Section>
  );
}
