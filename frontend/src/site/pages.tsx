import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ChevronLeft, ChevronRight, MapPin, X } from "lucide-react";
import { fileUrl } from "../lib/api";
import type { Row } from "../lib/types";
import { useBySlug, useList, useRecord, useSite } from "./data";
import { TitledSection } from "./siteTypes";
import { Achievements, BlogCard, Catalog, ContactBlock, DownloadRow, Faq, LiveStreams, Pricing, Projects, SECTIONS, Services, Team, VideoCard } from "./sections";
import { homeSections, parseSection } from "./templates";
import {
  Container,
  EmptyState,
  fadeUp,
  formatDate,
  headingFont,
  MainCta,
  PageBanner,
  reveal,
  RichHtml,
  SiteCard,
  SmartImage,
  stagger,
  useSectionTitle
} from "./ui";

/** Home = template ke sections us order + style me jo template config me hai ("services:icons") */
export function HomePage() {
  const { template } = useSite();
  return (
    <>
      {homeSections(template).map((spec) => {
        const [key, variant] = parseSection(spec);
        const S = SECTIONS[key];
        return S ? <S key={spec} variant={variant} /> : null;
      })}
    </>
  );
}

function useTitle(title: string) {
  const name = useSite().settings.site_name;
  useEffect(() => {
    document.title = [title, name].filter(Boolean).join(" | ");
  }, [title, name]);
}

function Loading() {
  return (
    <div className="flex justify-center py-20">
      <motion.span className="h-10 w-10 rounded-full border-4 border-[var(--primary)] border-t-transparent" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }} />
    </div>
  );
}

/** Template me jo variant us section ka hai, list page par bhi wahi look */
function useVariant(section: string): string | undefined {
  const spec = useSite().template.sections.find((s) => parseSection(s)[0] === section);
  return spec ? parseSection(spec)[1] : undefined;
}

/** Services / Team / Projects / Catalog / Pricing / FAQ ki poori list — type ke hisaab se title */
export function ModulePage({ section }: { section: "services" | "team" | "projects" | "catalog" | "pricing" | "faq" }) {
  const [title, subtitle] = useSectionTitle(section as TitledSection);
  const variant = useVariant(section);
  useTitle(title);
  const C = { services: Services, team: Team, projects: Projects, catalog: Catalog, pricing: Pricing, faq: Faq }[section];
  return (
    <>
      <PageBanner title={title} subtitle={subtitle} />
      <C variant={variant} all />
      <EmptyIfNone section={section} />
    </>
  );
}

const MODULE_OF = { services: "services", team: "team_members", projects: "projects", catalog: "catalog_items", pricing: "pricing_plans", faq: "faqs" } as const;

function EmptyIfNone({ section }: { section: keyof typeof MODULE_OF }) {
  const { items, loading } = useList(MODULE_OF[section], { size: 60 });
  if (loading) return <Loading />;
  return items.length ? null : <EmptyState text="Nothing here yet." />;
}

/** Project / catalog item detail (negative id = demo) */
export function DetailPage({ module }: { module: "projects" | "catalog_items" }) {
  const { id } = useParams();
  const row = useRecord(module, id);
  useTitle(row ? String(row.title) : "");
  if (row === undefined) return <Loading />;
  if (row === null) return <NotFoundPage />;
  const image = module === "projects" ? row.cover_image : row.image;
  const back = module === "projects" ? "/projects" : "/catalog";
  const facts = (
    module === "projects"
      ? [["Category", row.category], ["Client", row.client], ["Location", row.location], ["Date", formatDate(row.project_date)]]
      : [["Category", row.category], ["Price", row.price], ["Location", row.location], ["Details", row.specs]]
  ).filter(([, v]) => v) as [string, unknown][];
  return (
    <>
      <div className="relative h-[60vh] min-h-[360px] overflow-hidden bg-black">
        <motion.div initial={{ scale: 1.1 }} animate={{ scale: 1 }} transition={{ duration: 1.4 }} className="absolute inset-0">
          <SmartImage src={image} alt={String(row.title)} className="h-full w-full opacity-80" />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 to-transparent" />
        <Container className="relative flex h-full flex-col justify-end pb-12">
          <Link to={back} className="mb-4 inline-flex items-center gap-1 text-sm text-white/80 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          {!!row.badge && <span className="mb-3 w-fit rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-bold text-[var(--on-accent)]">{String(row.badge)}</span>}
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={headingFont} className="text-4xl font-bold text-white sm:text-6xl">
            {String(row.title)}
          </motion.h1>
          {!!row.location && (
            <div className="mt-3 flex items-center gap-1.5 text-white/80">
              <MapPin className="h-4 w-4" /> {String(row.location)}
            </div>
          )}
        </Container>
      </div>
      <Container className="grid gap-10 py-14 md:grid-cols-[1fr_320px]">
        <div>
          <p className="text-xl leading-relaxed text-[var(--muted)]">{String(row.summary ?? "")}</p>
          <RichHtml html={row.description} className="mt-6" />
        </div>
        <SiteCard hover={false} className="h-fit p-6">
          <dl className="space-y-4">
            {facts.map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs uppercase tracking-wider text-[var(--muted)]">{k}</dt>
                <dd style={headingFont} className="mt-0.5 text-lg font-semibold">{String(v)}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-6">
            <MainCta kind="primary" className="w-full" />
          </div>
          {!!row.link_url && (
            <a href={String(row.link_url)} target="_blank" rel="noreferrer" className="mt-3 block text-center text-sm font-medium text-[var(--primary)]">
              Visit link →
            </a>
          )}
        </SiteCard>
      </Container>
    </>
  );
}

export function CmsPage() {
  const { slug } = useParams();
  const page = useBySlug("pages", slug);
  useTitle(page ? String(page.title) : "");
  if (page === undefined) return <Loading />;
  if (page === null) return <NotFoundPage />;
  return (
    <>
      <PageBanner title={String(page.page_heading || page.title)} />
      <Container className="py-12">
        {!!page.banner_image && <SmartImage src={page.banner_image} alt="" className="mb-8 max-h-96 w-full rounded-2xl" />}
        <RichHtml html={page.page_body} className="mx-auto max-w-3xl" />
      </Container>
    </>
  );
}

export function BlogListPage() {
  const [title, subtitle] = useSectionTitle("news");
  useTitle(title);
  const { items, loading } = useList("blogs", { size: 30 });
  return (
    <>
      <PageBanner title={title} subtitle={subtitle} />
      <Container className="py-12">
        {loading ? (
          <Loading />
        ) : !items.length ? (
          <EmptyState text="No posts yet." />
        ) : (
          <motion.div {...reveal} variants={stagger} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((b, n) => (
              <BlogCard key={b.id} b={b} n={n} />
            ))}
          </motion.div>
        )}
      </Container>
    </>
  );
}

export function BlogPage() {
  const { slug } = useParams();
  const blog = useBySlug("blogs", slug);
  useTitle(blog ? String(blog.title) : "");
  if (blog === undefined) return <Loading />;
  if (blog === null) return <NotFoundPage />;
  const tags = typeof blog.tags === "string" ? blog.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];
  return (
    <>
      <PageBanner title={String(blog.title)} subtitle={[formatDate(blog.published_date), blog.author].filter(Boolean).join(" · ")} />
      <Container className="max-w-3xl py-12">
        <Link to="/blogs" className="mb-6 inline-flex items-center gap-1 text-sm text-[var(--primary)]">
          <ArrowLeft className="h-4 w-4" /> All posts
        </Link>
        {!!blog.cover_image && <SmartImage src={blog.cover_image} alt="" className="mb-8 w-full rounded-2xl" />}
        <RichHtml html={blog.body || `<p>${blog.summary ?? ""}</p>`} />
        {tags.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2">
            {tags.map((t) => (
              <span key={t} className="rounded-full bg-[var(--text)]/5 px-3 py-1 text-xs">#{t}</span>
            ))}
          </div>
        )}
      </Container>
    </>
  );
}

function Lightbox({ items, index, onClose, onMove }: { items: Row[]; index: number; onClose: () => void; onMove: (i: number) => void }) {
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onMove((index + 1) % items.length);
      if (e.key === "ArrowLeft") onMove((index - 1 + items.length) % items.length);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [index, items.length, onClose, onMove]);
  const it = items[index];
  return (
    <motion.div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <button aria-label="Close" className="absolute right-4 top-4 text-white" onClick={onClose}>
        <X className="h-7 w-7" />
      </button>
      <button aria-label="Previous" className="absolute left-3 text-white" onClick={(e) => (e.stopPropagation(), onMove((index - 1 + items.length) % items.length))}>
        <ChevronLeft className="h-9 w-9" />
      </button>
      <motion.figure key={it.id} initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-4xl" onClick={(e) => e.stopPropagation()}>
        <SmartImage src={it.image} alt={String(it.title)} seed={index} className="max-h-[80vh] w-full rounded-lg object-contain" />
        <figcaption className="mt-3 text-center text-white">{String(it.title)}</figcaption>
      </motion.figure>
      <button aria-label="Next" className="absolute right-3 text-white" onClick={(e) => (e.stopPropagation(), onMove((index + 1) % items.length))}>
        <ChevronRight className="h-9 w-9" />
      </button>
    </motion.div>
  );
}

export function GalleryPage() {
  const [title, subtitle] = useSectionTitle("gallery");
  useTitle(title);
  const [params, setParams] = useSearchParams();
  const category = params.get("category") ?? "";
  const cats = useList("gallery_categories", { size: 50 });
  const { items, loading } = useList("image_gallery", category ? { size: 60, category_id: category } : { size: 60 });
  const [open, setOpen] = useState<number | null>(null);
  return (
    <>
      <PageBanner title={title} subtitle={subtitle} />
      <Container className="py-12">
        {cats.items.length > 1 && (
          <div className="mb-8 flex flex-wrap gap-2">
            {[{ id: 0, title: "All" } as Row, ...cats.items].map((c) => {
              const active = String(c.id || "") === category;
              return (
                <button
                  key={c.id}
                  onClick={() => setParams(c.id ? { category: String(c.id) } : {})}
                  className={`rounded-full px-4 py-1.5 text-sm transition ${active ? "bg-[var(--primary)] text-[var(--on-primary)]" : "bg-[var(--text)]/5 hover:bg-[var(--text)]/10"}`}
                >
                  {String(c.title)}
                </button>
              );
            })}
          </div>
        )}
        {loading ? (
          <Loading />
        ) : !items.length ? (
          <EmptyState text="No photos yet." />
        ) : (
          <motion.div key={category} initial="hidden" animate="show" variants={stagger} className="columns-2 gap-3 md:columns-4">
            {items.map((g, n) => (
              <motion.button key={g.id} variants={fadeUp} onClick={() => setOpen(n)} className="group mb-3 block w-full overflow-hidden rounded-xl">
                <SmartImage src={g.image} alt={String(g.title)} seed={n} className={`w-full transition duration-500 group-hover:scale-105 ${n % 3 ? "aspect-square" : "aspect-[3/4]"}`} />
              </motion.button>
            ))}
          </motion.div>
        )}
      </Container>
      <AnimatePresence>{open !== null && items[open] && <Lightbox items={items} index={open} onClose={() => setOpen(null)} onMove={setOpen} />}</AnimatePresence>
    </>
  );
}

export function VideosPage() {
  useTitle("Videos");
  const [cat, setCat] = useState("");
  const cats = useList("video_categories", { size: 50 });
  const { items, loading } = useList("videos", cat ? { size: 60, category_id: cat } : { size: 60 });
  const live = useList("livestreams", { size: 1 });
  return (
    <>
      <PageBanner title="Videos" subtitle={live.items.length ? "Live streams & video gallery" : undefined} />
      <Container className="py-12">
        <LiveStreams all />
        {cats.items.length > 1 && (
          <div className="mb-8 flex flex-wrap gap-2">
            {[{ id: 0, title: "All" } as Row, ...cats.items].map((c) => (
              <button
                key={c.id}
                onClick={() => setCat(c.id ? String(c.id) : "")}
                className={`rounded-full px-4 py-1.5 text-sm transition ${String(c.id || "") === cat ? "bg-[var(--primary)] text-[var(--on-primary)]" : "bg-[var(--text)]/5 hover:bg-[var(--text)]/10"}`}
              >
                {String(c.title)}
              </button>
            ))}
          </div>
        )}
        {loading ? (
          <Loading />
        ) : !items.length ? (
          live.items.length ? null : <EmptyState text="No videos yet." />
        ) : (
          <motion.div key={cat} initial="hidden" animate="show" variants={stagger} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((v, n) => (
              <VideoCard key={v.id} v={v} n={n} />
            ))}
          </motion.div>
        )}
      </Container>
    </>
  );
}

export function AchievementsPage() {
  useTitle("Achievements");
  return (
    <>
      <PageBanner title="Achievements" subtitle="Awards, results and activities we are proud of" />
      <Achievements all />
    </>
  );
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const period = (r: Row) => [r.month ? MONTHS[Number(r.month) - 1] : "", r.year ?? ""].filter(Boolean).join(" ");

export function DownloadsPage() {
  useTitle("Downloads");
  const { items, loading } = useList("attachments", { size: 60 });
  const mags = useList("magazines", { size: 60 });
  const thumbs = useList("magazine_thumbnails", { size: 60 });
  const empty = !items.length && !mags.items.length && !thumbs.items.length;
  return (
    <>
      <PageBanner title="Downloads" subtitle="Forms, circulars and magazines" />
      <Container className="space-y-12 py-12">
        {loading ? <Loading /> : empty ? <EmptyState text="Nothing to download yet." /> : null}
        {items.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((d) => (
              <DownloadRow key={d.id} d={d} />
            ))}
          </div>
        )}
        {mags.items.length > 0 && (
          <div>
            <h2 style={headingFont} className="mb-5 text-2xl font-bold">E-Magazines</h2>
            <motion.div {...reveal} variants={stagger} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {mags.items.map((m, n) => (
                <SiteCard key={m.id}>
                  <a href={fileUrl(m.file) || undefined} target="_blank" rel="noreferrer" className="group block">
                    <SmartImage src={m.cover_image} alt={String(m.title)} seed={n} className="aspect-[3/4] w-full transition duration-500 group-hover:scale-105" />
                    <div className="p-4">
                      <div className="text-xs text-[var(--accent)]">{[m.category_id_label, period(m)].filter(Boolean).join(" · ")}</div>
                      <div className="mt-1 font-semibold">{String(m.title)}</div>
                      <div className="mt-2 text-sm font-medium text-[var(--primary)]">Read / download →</div>
                    </div>
                  </a>
                </SiteCard>
              ))}
            </motion.div>
          </div>
        )}
        {thumbs.items.length > 0 && (
          <div>
            <h2 style={headingFont} className="mb-5 text-2xl font-bold">Magazine Covers</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
              {thumbs.items.map((t, n) => (
                <figure key={t.id}>
                  <SmartImage src={t.thumbnail} alt={String(t.title)} seed={n} className="aspect-[3/4] w-full rounded-lg shadow-md" />
                  <figcaption className="mt-2 text-center text-xs text-[var(--muted)]">
                    {String(t.title)} {period(t) && `· ${period(t)}`}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        )}
      </Container>
    </>
  );
}

/** Press releases / tenders jaisi date wali list */
export function NoticePage({ module, title, dateField }: { module: string; title: string; dateField: string }) {
  useTitle(title);
  const { items, loading } = useList(module, { size: 50 });
  return (
    <>
      <PageBanner title={title} />
      <Container className="max-w-4xl py-12">
        {loading ? (
          <Loading />
        ) : !items.length ? (
          <EmptyState text="Nothing published yet." />
        ) : (
          <motion.div {...reveal} variants={stagger} className="space-y-4">
            {items.map((n) => (
              <SiteCard key={n.id} hover={false} className="p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 style={headingFont} className="text-lg font-semibold">{String(n.title)}</h2>
                  <span className="text-sm text-[var(--muted)]">{formatDate(n[dateField])}</span>
                </div>
                {!!n.tender_no && <div className="text-xs text-[var(--muted)]">No. {String(n.tender_no)}</div>}
                <RichHtml html={n.description} className="mt-2 text-sm" />
                {!!n.attachment && (
                  <a href={fileUrl(n.attachment)} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-medium text-[var(--primary)]">
                    Download attachment →
                  </a>
                )}
              </SiteCard>
            ))}
          </motion.div>
        )}
      </Container>
    </>
  );
}

export function ContactPage() {
  const [title, subtitle] = useSectionTitle("contact");
  useTitle(title);
  return (
    <>
      <PageBanner title={title} subtitle={subtitle} />
      <motion.div {...reveal} variants={stagger}>
        <Container className="py-12">
          <ContactBlock />
        </Container>
      </motion.div>
    </>
  );
}

export function NotFoundPage() {
  useTitle("Not found");
  return (
    <Container className="py-24 text-center">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={headingFont} className="text-7xl font-bold text-[var(--primary)]">
        404
      </motion.div>
      <p className="mt-3 text-[var(--muted)]">This page does not exist.</p>
      <Link to="/" className="mt-6 inline-block rounded-full bg-[var(--primary)] px-6 py-2.5 text-sm font-semibold text-[var(--on-primary)]">
        Go home
      </Link>
    </Container>
  );
}
