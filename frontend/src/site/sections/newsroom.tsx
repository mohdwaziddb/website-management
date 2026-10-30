// News / Magazine portal ke sections: headlines hero, latest, category blocks, trending, photo albums, ads,
// breaking ticker + category patti (har page par). Data: news_posts, news_categories, sponsors, gallery_categories.
import { ReactNode, useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ChevronRight, Clock, Flame, Images, Zap } from "lucide-react";
import type { Row } from "../../lib/types";
import { useList, useSite } from "../data";
import { Container, fadeUp, formatDate, headingFont, SmartImage, stagger, stripHtml, useFixedNav, useSectionTitle } from "../ui";
import { Marquee, Variant } from "./content";

/** Backend ModuleRegistry.CATEGORY_COLORS -> rang */
export const CATEGORY_HEX: Record<string, string> = {
  red: "#dc2626",
  orange: "#ea580c",
  amber: "#d97706",
  green: "#16a34a",
  teal: "#0d9488",
  blue: "#2563eb",
  indigo: "#4f46e5",
  violet: "#7c3aed",
  pink: "#db2777",
  slate: "#475569"
};

export const newsHref = (p: Row) => `/news/${p.slug}`;
export const categoryHref = (c: Row) => `/category/${c.slug}`;

export function catColor(c: Row | undefined): string {
  return CATEGORY_HEX[String(c?.color ?? "")] ?? "var(--accent)";
}

/** Saari categories (cache hoti hain — har card dobara fetch nahi karta) */
export function useCategories(): Row[] {
  return useList("news_categories", { size: 50 }).items;
}

/** post -> uski category row (rang + slug ke liye) */
export function useCategoryOf(): (p: Row) => Row | undefined {
  const cats = useCategories();
  return (p) => cats.find((c) => String(c.id) === String(p.category_id));
}

/** "2 hours ago" / "28 Oct 2026" */
export function timeAgo(v: unknown): string {
  if (!v) return "";
  const d = new Date(String(v).length <= 10 ? `${v}T00:00:00` : String(v));
  if (Number.isNaN(d.getTime())) return "";
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return formatDate(v);
}

export function readMinutes(html: unknown): number {
  return Math.max(1, Math.round(stripHtml(html, 100_000).split(/\s+/).length / 200));
}

/** Rangeen category label. link=false jab card khud link ho (a ke andar a nahi) */
export function CategoryTag({ post, cat, link = false }: { post: Row; cat?: Row; link?: boolean }) {
  const label = cat?.title ?? post.category_id_label;
  if (!label) return null;
  const tag = (
    <span className="inline-block px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white" style={{ background: catColor(cat) }}>
      {String(label)}
    </span>
  );
  return link && cat?.slug ? <Link to={categoryHref(cat)}>{tag}</Link> : tag;
}

export function PostMeta({ post, light = false }: { post: Row; light?: boolean }) {
  return (
    <div className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-xs ${light ? "text-white/75" : "text-[var(--muted)]"}`}>
      {!!post.reporter_id_label && <span className="font-semibold">{String(post.reporter_id_label)}</span>}
      {!!post.reporter_id_label && <span>·</span>}
      <span className="inline-flex items-center gap-1">
        <Clock className="h-3 w-3" /> {timeAgo(post.published_date)}
      </span>
    </div>
  );
}

type CardKind = "overlay" | "card" | "row" | "headline";

/** Ek khabar: overlay (photo par headline), card (photo upar), row (chhoti photo side me), headline (sirf text) */
export function PostCard({ post, kind = "card", n = 0, big = false, summary = false }: { post: Row; kind?: CardKind; n?: number; big?: boolean; summary?: boolean }) {
  const { template } = useSite();
  const cat = useCategoryOf()(post);
  const r = template.radius;
  const title = (
    <h3 style={headingFont} className={`font-bold leading-snug transition group-hover:text-[var(--primary)] ${big ? "text-2xl sm:text-3xl" : kind === "row" || kind === "headline" ? "text-base" : "text-lg"}`}>
      {String(post.title)}
    </h3>
  );

  if (kind === "overlay") {
    return (
      <motion.div variants={fadeUp} className="h-full">
        <Link to={newsHref(post)} className={`group relative block h-full min-h-[18rem] overflow-hidden ${r}`}>
          <SmartImage src={post.cover_image} alt={String(post.title)} seed={n} className="absolute inset-0 h-full w-full transition duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
            <CategoryTag post={post} cat={cat} />
            <h3 style={headingFont} className={`mt-3 font-bold leading-tight text-white ${big ? "text-2xl sm:text-4xl" : "text-xl"}`}>
              {String(post.title)}
            </h3>
            {big && !!post.summary && <p className="mt-3 hidden max-w-2xl text-white/80 sm:block">{stripHtml(post.summary, 180)}</p>}
            <div className="mt-3">
              <PostMeta post={post} light />
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  if (kind === "row") {
    return (
      <motion.div variants={fadeUp}>
        <Link to={newsHref(post)} className="group flex gap-4">
          <div className={`w-28 shrink-0 overflow-hidden sm:w-36 ${r}`}>
            <SmartImage src={post.cover_image} alt={String(post.title)} seed={n} className="aspect-[4/3] w-full transition duration-500 group-hover:scale-105" />
          </div>
          <div className="min-w-0">
            <CategoryTag post={post} cat={cat} />
            <div className="mt-1.5">{title}</div>
            {summary && !!post.summary && <p className="mt-1 hidden text-sm text-[var(--muted)] sm:block">{stripHtml(post.summary, 140)}</p>}
            <div className="mt-1.5">
              <PostMeta post={post} />
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  if (kind === "headline") {
    return (
      <motion.div variants={fadeUp}>
        <Link to={newsHref(post)} className="group block py-3">
          <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider" style={{ color: catColor(cat) }}>
            {String(cat?.title ?? post.category_id_label ?? "")}
          </span>
          {title}
          <div className="mt-1.5">
            <PostMeta post={post} />
          </div>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div variants={fadeUp} className={`overflow-hidden bg-[var(--surface)] ${template.card} ${r}`}>
      <Link to={newsHref(post)} className="group block">
        <div className="relative overflow-hidden">
          <SmartImage src={post.cover_image} alt={String(post.title)} seed={n} className={`w-full transition duration-700 group-hover:scale-105 ${big ? "aspect-[16/9]" : "aspect-[16/10]"}`} />
          <div className="absolute left-3 top-3">
            <CategoryTag post={post} cat={cat} />
          </div>
        </div>
        <div className="p-4">
          {title}
          {(summary || big) && !!post.summary && <p className="mt-2 text-sm text-[var(--muted)]">{stripHtml(post.summary, big ? 200 : 120)}</p>}
          <div className="mt-3">
            <PostMeta post={post} />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function unique(rows: Row[]): Row[] {
  const seen = new Set<unknown>();
  return rows.filter((r) => (seen.has(r.id) ? false : (seen.add(r.id), true)));
}

function MoreLink({ to, children = "More stories" }: { to: string; children?: ReactNode }) {
  return (
    <Link to={to} className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--primary)] hover:gap-2">
      {children} <ChevronRight className="h-4 w-4" />
    </Link>
  );
}

/** News section ka heading: rangeen patti + naam + "More" */
export function BlockHeading({ title, color = "var(--accent)", to, icon }: { title: string; color?: string; to?: string; icon?: ReactNode }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-3 border-b-2 pb-2" style={{ borderColor: color }}>
      <h2 style={headingFont} className="flex items-center gap-2 text-xl font-bold uppercase tracking-wide sm:text-2xl">
        {icon}
        {title}
      </h2>
      {to && <MoreLink to={to} />}
    </div>
  );
}

// ------------------------------------------------------------ heroes: top stories

/** Top stories (pehle "Top Story" wali, phir latest). null = abhi load ho raha hai */
function useTopStories(size: number): Row[] | null {
  const top = useList("news_posts", { is_featured: "true", size });
  const latest = useList("news_posts", { size });
  if (top.loading || latest.loading) return null;
  return unique([...top.items, ...latest.items]).slice(0, size);
}

function useHeroPad(): string {
  const { siteType } = useSite();
  // news site par category patti nav ke neeche hai; dusre type me fixed nav ke liye jagah
  return useFixedNav() && siteType !== "news" ? "pt-24" : "pt-6";
}

/** TV-news jaisa: ek badi top story apne aap badalti hai, neeche thumbnails se chuno */
export function SpotlightHero({ fallback }: { fallback: ReactNode }) {
  const stories = useTopStories(5);
  const pad = useHeroPad();
  const [index, setIndex] = useState(0);
  const count = stories?.length ?? 0;
  useEffect(() => {
    if (count < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % count), 6000);
    return () => clearInterval(t);
  }, [count, index]);
  if (!stories) return <div className="min-h-[70vh]" />;
  if (!stories.length) return <>{fallback}</>;
  const lead = stories[index % count];
  return (
    <section className={`${pad} pb-10`}>
      <Container>
        <div className="relative overflow-hidden rounded-lg">
          <AnimatePresence mode="wait">
            <motion.div key={lead.id} initial={{ opacity: 0, scale: 1.03 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }}>
              <Link to={newsHref(lead)} className="group relative block aspect-[4/5] sm:aspect-[21/9]">
                <SmartImage src={lead.cover_image} alt={String(lead.title)} seed={index} className="absolute inset-0 h-full w-full" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/10" />
                <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10">
                  <span className="mb-3 inline-flex items-center gap-1.5 bg-[var(--primary)] px-2.5 py-1 text-xs font-black uppercase tracking-widest text-[var(--on-primary)]">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-white" /> Top story
                  </span>
                  <h2 style={headingFont} className="max-w-4xl text-3xl font-bold uppercase leading-tight text-white sm:text-5xl">
                    {String(lead.title)}
                  </h2>
                  {!!lead.summary && <p className="mt-3 hidden max-w-3xl text-lg text-white/80 sm:block">{stripHtml(lead.summary, 200)}</p>}
                  <div className="mt-4">
                    <PostMeta post={lead} light />
                  </div>
                </div>
              </Link>
            </motion.div>
          </AnimatePresence>
        </div>
        {count > 1 && (
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {stories.map((p, i) => (
              <button
                key={p.id}
                onClick={() => setIndex(i)}
                className={`relative overflow-hidden rounded-md border-t-4 bg-[var(--surface)] p-3 text-left text-sm font-semibold leading-snug transition ${i === index % count ? "border-[var(--accent)]" : "border-transparent opacity-70 hover:opacity-100"}`}
              >
                <span className="line-clamp-3">{String(p.title)}</span>
              </button>
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}

/** Magazine jaisa photo mosaic: 1 badi + 4 chhoti */
export function MosaicHero({ fallback }: { fallback: ReactNode }) {
  const stories = useTopStories(5);
  const pad = useHeroPad();
  if (!stories) return <div className="min-h-[70vh]" />;
  if (!stories.length) return <>{fallback}</>;
  const [lead, ...rest] = stories;
  return (
    <section className={`${pad} pb-10`}>
      <Container>
        <motion.div initial="hidden" animate="show" variants={stagger} className="grid gap-4 md:grid-cols-4 md:grid-rows-2">
          <div className="md:col-span-2 md:row-span-2 md:min-h-[32rem]">
            <PostCard post={lead} kind="overlay" big n={0} />
          </div>
          {rest.map((p, i) => (
            <div key={p.id} className="min-h-[15rem]">
              <PostCard post={p} kind="overlay" n={i + 1} />
            </div>
          ))}
        </motion.div>
      </Container>
    </section>
  );
}

/** Badi lead story + 2 side stories + "Latest" timeline. Khabar na ho to fallback (slider) */
export function HeadlinesHero({ fallback }: { fallback: ReactNode }) {
  const stories = useTopStories(3);
  const latest = useList("news_posts", { size: 10 });
  const pad = useHeroPad();
  if (!stories) return <div className="min-h-[70vh]" />;
  if (!stories.length) return <>{fallback}</>;
  const [lead, ...side] = stories;
  const used = new Set(stories.map((p) => p.id));
  const timeline = latest.items.filter((p) => !used.has(p.id)).slice(0, 6);
  return (
    <section className={`${pad} pb-10`}>
      <Container>
        <motion.div initial="hidden" animate="show" variants={stagger} className="grid gap-5 lg:grid-cols-12">
          <div className="lg:col-span-6 lg:min-h-[30rem]">
            <PostCard post={lead} kind="overlay" big n={0} />
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:col-span-3 lg:grid-cols-1">
            {side.map((p, i) => (
              <PostCard key={p.id} post={p} kind="card" n={i + 1} />
            ))}
          </div>
          {timeline.length > 0 && (
            <motion.aside variants={fadeUp} className="lg:col-span-3">
              <div className="mb-2 flex items-center gap-2 border-b-2 border-[var(--accent)] pb-2 text-sm font-bold uppercase tracking-wider">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-600" />
                </span>
                Latest updates
              </div>
              <ol className="relative ml-1 border-l border-site-text/15">
                {timeline.map((p) => (
                  <li key={p.id} className="relative pl-4">
                    <span className="absolute -left-[5px] top-5 h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
                    <PostCard post={p} kind="headline" />
                  </li>
                ))}
              </ol>
              <div className="mt-2">
                <MoreLink to="/news">All latest news</MoreLink>
              </div>
            </motion.aside>
          )}
        </motion.div>
      </Container>
    </section>
  );
}

// ------------------------------------------------------------ latest (grid | list)

export function Latest({ variant = "grid" }: Variant) {
  const { items } = useList("news_posts", { size: 9 });
  if (!items.length) return null;
  return (
    <motion.section {...{ initial: "hidden", whileInView: "show", viewport: { once: true, margin: "-60px" } }} variants={stagger} className="py-10">
      <Container>
        <BlockHeading title="Latest News" to="/news" icon={<Zap className="h-5 w-5 text-[var(--accent)]" />} />
        {variant === "list" ? (
          <div className="grid gap-x-10 gap-y-6 md:grid-cols-2">
            {items.slice(0, 8).map((p, n) => (
              <PostCard key={p.id} post={p} kind="row" n={n} summary />
            ))}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((p, n) => (
              <PostCard key={p.id} post={p} kind="card" n={n} />
            ))}
          </div>
        )}
      </Container>
    </motion.section>
  );
}

// ------------------------------------------------------------ category blocks (blocks | columns)

function CategoryBlock({ cat, columns }: { cat: Row; columns: boolean }) {
  const { items } = useList("news_posts", { category_id: Number(cat.id), size: 4 });
  if (!items.length) return null;
  const [lead, ...rest] = items;
  const color = catColor(cat);
  if (columns) {
    return (
      <motion.div variants={fadeUp}>
        <BlockHeading title={String(cat.title)} color={color} to={categoryHref(cat)} />
        <PostCard post={lead} kind="card" n={Number(cat.id)} />
        <div className="mt-2 divide-y divide-site-text/10">
          {rest.map((p) => (
            <PostCard key={p.id} post={p} kind="headline" />
          ))}
        </div>
      </motion.div>
    );
  }
  return (
    <motion.div variants={fadeUp} className="mb-12 last:mb-0">
      <BlockHeading title={String(cat.title)} color={color} to={categoryHref(cat)} />
      <div className="grid gap-6 md:grid-cols-5">
        <div className="md:col-span-3">
          <PostCard post={lead} kind="card" big n={Number(cat.id)} />
        </div>
        <div className="space-y-5 md:col-span-2">
          {rest.map((p, n) => (
            <PostCard key={p.id} post={p} kind="row" n={n + 2} />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export function CategoryBlocks({ variant = "blocks" }: Variant) {
  const { items } = useList("news_categories", { show_on_home: "true", size: 9 });
  if (!items.length) return null;
  const columns = variant === "columns";
  return (
    <motion.section initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} variants={stagger} className="py-10">
      <Container className={columns ? "grid gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3" : ""}>
        {items.map((c) => (
          <CategoryBlock key={c.id} cat={c} columns={columns} />
        ))}
      </Container>
    </motion.section>
  );
}

// ------------------------------------------------------------ trending (numbered | cards)

export function Trending({ variant = "numbered" }: Variant) {
  const { items } = useList("news_posts", { is_trending: "true", size: variant === "cards" ? 4 : 5 });
  if (!items.length) return null;
  return (
    <motion.section initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} variants={stagger} className="bg-[var(--surface)] py-12">
      <Container>
        <BlockHeading title="Trending Now" icon={<Flame className="h-5 w-5 text-orange-500" />} />
        {variant === "cards" ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((p, n) => (
              <div key={p.id} className="relative">
                <span className="absolute -left-2 -top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent)] text-sm font-black text-[var(--on-accent)] shadow-lg">
                  {n + 1}
                </span>
                <PostCard post={p} kind="overlay" n={n} />
              </div>
            ))}
          </div>
        ) : (
          <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {items.map((p, n) => (
              <motion.li key={p.id} variants={fadeUp} className="flex gap-3">
                <span style={headingFont} className="text-5xl font-black leading-none text-[var(--accent)] opacity-80">
                  {n + 1}
                </span>
                <div className="min-w-0 border-l border-site-text/10 pl-3">
                  <PostCard post={p} kind="headline" />
                </div>
              </motion.li>
            ))}
          </ol>
        )}
      </Container>
    </motion.section>
  );
}

// ------------------------------------------------------------ photo albums

export function PhotoAlbums() {
  const [title, subtitle] = useSectionTitle("gallery");
  const albums = useList("gallery_categories", { size: 6 });
  const photos = useList("image_gallery", { size: 40 });
  if (!albums.items.length) return null;
  const count = (c: Row) => photos.items.filter((p) => String(p.category_id) === String(c.id)).length;
  const coverOf = (c: Row) => c.cover_image || photos.items.find((p) => String(p.category_id) === String(c.id))?.image;
  return (
    <section className="py-14 text-white" style={{ background: "color-mix(in srgb, var(--primary) 25%, #09090b)" }}>
      <Container>
        <div className="mb-6 flex items-end justify-between gap-3 border-b-2 border-[var(--accent)] pb-2">
          <h2 style={headingFont} className="flex items-center gap-2 text-xl font-bold uppercase tracking-wide sm:text-2xl">
            <Images className="h-5 w-5 text-[var(--accent)]" /> {title}
          </h2>
          <Link to="/gallery" className="inline-flex items-center gap-1 text-sm font-semibold text-white/80 hover:text-white">
            {subtitle} <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {albums.items.map((c, n) => (
            <motion.div key={c.id} variants={fadeUp}>
              <Link to={`/gallery?category=${c.id}`} className="group relative block overflow-hidden rounded-lg">
                <SmartImage src={coverOf(c)} alt={String(c.title)} seed={n} className="aspect-[4/3] w-full transition duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-4">
                  <span style={headingFont} className="text-lg font-bold">
                    {String(c.title)}
                  </span>
                  {count(c) > 0 && (
                    <span className="flex shrink-0 items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-xs">
                      <Images className="h-3.5 w-3.5" /> {count(c)}
                    </span>
                  )}
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </section>
  );
}

// ------------------------------------------------------------ advertisements

export type AdPosition = "Header" | "Home Page" | "Sidebar" | "In Article";

const AD_SIZE: Record<AdPosition, string> = {
  Header: "mx-auto h-[90px] max-w-[728px]",
  "Home Page": "aspect-[970/250] max-h-[250px]",
  Sidebar: "aspect-[6/5]",
  "In Article": "aspect-[970/250] max-h-[220px]"
};

/** Admin ke "Advertisements": position + date range ke hisaab se ek banner (sort order me pehla) */
export function AdSlot({ position, className = "" }: { position: AdPosition; className?: string }) {
  const { items } = useList("sponsors", { position, size: 10 });
  const today = new Date().toISOString().slice(0, 10);
  const ad = items.find((a) => (!a.from_date || String(a.from_date).slice(0, 10) <= today) && (!a.to_date || String(a.to_date).slice(0, 10) >= today));
  if (!ad) return null;
  const inner = (
    <>
      <SmartImage src={ad.image} alt={String(ad.title)} className="absolute inset-0 h-full w-full" />
      {!!ad.headline && (
        <div className="absolute inset-0 flex items-center justify-between gap-4 bg-gradient-to-r from-black/80 via-black/50 to-transparent px-5 text-white">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-white/70">{String(ad.title)}</div>
            <div style={headingFont} className={`font-bold leading-tight ${position === "Header" || position === "Sidebar" ? "text-base" : "text-xl sm:text-2xl"}`}>
              {String(ad.headline)}
            </div>
          </div>
          {position !== "Sidebar" && (
            <span className="hidden shrink-0 items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-black sm:inline-flex">
              Know more <ArrowRight className="h-3.5 w-3.5" />
            </span>
          )}
        </div>
      )}
    </>
  );
  const box = `relative block w-full overflow-hidden rounded ${AD_SIZE[position]}`;
  return (
    <div className={className}>
      <div className="mb-1 text-center text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">Advertisement</div>
      {ad.link_url ? (
        <a href={String(ad.link_url)} target="_blank" rel="noopener noreferrer sponsored" className={box}>
          {inner}
        </a>
      ) : (
        <div className={box}>{inner}</div>
      )}
    </div>
  );
}

/** Home page section "ad" */
export function HomeAd() {
  return (
    <Container className="py-6">
      <AdSlot position="Home Page" />
    </Container>
  );
}

// ------------------------------------------------------------ har page: categories patti + breaking ticker + header ad

function BreakingTicker() {
  const { items } = useList("news_posts", { is_breaking: "true", size: 8 });
  if (!items.length) return null;
  return (
    <div className="flex items-stretch overflow-hidden bg-[var(--surface)] text-sm shadow-sm">
      <span className="flex shrink-0 items-center gap-1.5 bg-red-600 px-3 py-2 text-xs font-black uppercase tracking-wider text-white">
        <span className="h-2 w-2 animate-pulse rounded-full bg-white" /> Breaking
      </span>
      <div className="min-w-0 flex-1 py-2">
        <Marquee speed={Math.max(25, items.length * 9)}>
          {items.map((p) => (
            <Link key={p.id} to={newsHref(p)} className="flex shrink-0 items-center gap-3 font-medium hover:text-[var(--primary)]">
              <span className="h-1.5 w-1.5 rounded-full bg-red-600" /> {String(p.title)}
            </Link>
          ))}
        </Marquee>
      </div>
    </div>
  );
}

/** Sirf News website par: navbar ke neeche categories, breaking ticker, header ad */
export function NewsStrip() {
  const { siteType } = useSite();
  // home par fixed navbar ke neeche jagah yahin; baaki pages par SiteLayout ka spacer
  const { pathname } = useLocation();
  const fixedNav = useFixedNav() && pathname === "/";
  const cats = useCategories();
  if (siteType !== "news") return null;
  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  return (
    <div className={fixedNav ? "pt-20" : ""}>
      <div className="border-b border-site-text/10 bg-[var(--surface)]">
        <Container className="flex items-center gap-4">
          <span className="hidden shrink-0 py-2.5 text-xs text-[var(--muted)] xl:block">{today}</span>
          <nav className="-mx-1 flex min-w-0 flex-1 gap-1 overflow-x-auto py-1.5 [scrollbar-width:none]">
            {cats.map((c) => (
              <NavLink
                key={c.id}
                to={categoryHref(c)}
                className={({ isActive }) =>
                  `shrink-0 border-b-2 px-3 py-1.5 text-sm font-semibold transition ${isActive ? "" : "border-transparent text-site-text/70 hover:text-[var(--text)]"}`
                }
                style={({ isActive }) => (isActive ? { borderColor: catColor(c), color: catColor(c) } : undefined)}
              >
                {String(c.title)}
              </NavLink>
            ))}
          </nav>
        </Container>
      </div>
      <Container className="pt-3">
        <BreakingTicker />
        <AdSlot position="Header" className="mt-3 hidden md:block" />
      </Container>
    </div>
  );
}
