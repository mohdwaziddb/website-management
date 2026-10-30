// News portal ke pages: /news (saari khabrein + search), /category/:slug, /news/:slug (poori khabar), /reporter/:id
import { FormEvent, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, ChevronLeft, ChevronRight, Clock, Facebook, Flame, Link2, MapPin, MessageCircle, Search, Twitter } from "lucide-react";
import type { Row } from "../lib/types";
import { useBySlug, useList, useRecord } from "./data";
import { Loading, NotFoundPage, useTitle } from "./pages";
import {
  AdSlot,
  BlockHeading,
  catColor,
  categoryHref,
  CategoryTag,
  PostCard,
  readMinutes,
  useCategories,
  useCategoryOf
} from "./sections/newsroom";
import { Container, EmptyState, formatDate, headingFont, PageBanner, RichHtml, SmartImage, stagger, stripHtml, youtubeId } from "./ui";

const PAGE_SIZE = 12;

function usePage(): [number, (p: number) => void] {
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number(params.get("page")) || 1);
  const go = (p: number) => {
    const next = new URLSearchParams(params);
    if (p > 1) next.set("page", String(p));
    else next.delete("page");
    setParams(next);
    window.scrollTo(0, 0);
  };
  return [page, go];
}

function Pager({ page, total, onChange }: { page: number; total: number; onChange: (p: number) => void }) {
  const pages = Math.ceil(total / PAGE_SIZE);
  if (pages <= 1) return null;
  const btn = "inline-flex items-center gap-1 rounded-lg border border-site-text/15 px-4 py-2 text-sm font-medium disabled:opacity-40 hover:bg-site-text/5";
  return (
    <div className="mt-10 flex items-center justify-center gap-3">
      <button className={btn} disabled={page <= 1} onClick={() => onChange(page - 1)}>
        <ChevronLeft className="h-4 w-4" /> Newer
      </button>
      <span className="text-sm text-[var(--muted)]">
        Page {page} of {pages}
      </span>
      <button className={btn} disabled={page >= pages} onClick={() => onChange(page + 1)}>
        Older <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

/** Right side: trending + sidebar ad + categories */
function NewsSidebar() {
  const trending = useList("news_posts", { is_trending: "true", size: 5 });
  const cats = useCategories();
  return (
    <aside className="space-y-10">
      {trending.items.length > 0 && (
        <div>
          <BlockHeading title="Trending" icon={<Flame className="h-5 w-5 text-orange-500" />} />
          <ol className="space-y-1">
            {trending.items.map((p, n) => (
              <li key={p.id} className="flex gap-3 border-b border-site-text/10 last:border-0">
                <span style={headingFont} className="pt-3 text-3xl font-black text-[var(--accent)] opacity-80">
                  {n + 1}
                </span>
                <PostCard post={p} kind="headline" />
              </li>
            ))}
          </ol>
        </div>
      )}
      <AdSlot position="Sidebar" />
      {cats.length > 0 && (
        <div>
          <BlockHeading title="Sections" />
          <div className="flex flex-wrap gap-2">
            {cats.map((c) => (
              <Link key={c.id} to={categoryHref(c)} className="rounded-full px-3 py-1 text-sm font-semibold text-white transition hover:opacity-85" style={{ background: catColor(c) }}>
                {String(c.title)}
              </Link>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}

/** Lead (badi) + baaki rows; neeche pager */
function StoryList({ items, total, page, onPage }: { items: Row[]; total: number; page: number; onPage: (p: number) => void }) {
  if (!items.length) return <EmptyState text="No stories yet." />;
  const [lead, ...rest] = items;
  return (
    <>
      <motion.div key={page} initial="hidden" animate="show" variants={stagger} className="space-y-7">
        {page === 1 ? <PostCard post={lead} kind="card" big summary n={0} /> : <PostCard post={lead} kind="row" summary n={0} />}
        <div className="space-y-6 border-t border-site-text/10 pt-7">
          {rest.map((p, n) => (
            <PostCard key={p.id} post={p} kind="row" summary n={n + 1} />
          ))}
        </div>
      </motion.div>
      <Pager page={page} total={total} onChange={onPage} />
    </>
  );
}

// ------------------------------------------------------------ /news

export function NewsListPage() {
  useTitle("Latest News");
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const [text, setText] = useState(q);
  const [page, setPage] = usePage();
  const query: Record<string, string | number> = { size: PAGE_SIZE, page };
  if (q) query.q = q;
  const { items, total, loading } = useList("news_posts", query);

  const search = (e: FormEvent) => {
    e.preventDefault();
    setParams(text.trim() ? { q: text.trim() } : {});
  };

  return (
    <>
      <PageBanner title={q ? `Search: “${q}”` : "Latest News"} subtitle={q ? `${total} stories found` : "All the stories, newest first"} />
      <Container className="grid gap-12 py-12 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <form onSubmit={search} className="mb-8 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
              <input
                aria-label="Search news"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Search headlines, tags…"
                className="w-full rounded-lg border border-site-text/15 bg-[var(--surface)] py-2.5 pl-9 pr-3 outline-none focus:border-[var(--primary)]"
              />
            </div>
            <button className="rounded-lg bg-[var(--primary)] px-5 font-semibold text-[var(--on-primary)]">Search</button>
          </form>
          {loading ? <Loading /> : <StoryList items={items} total={total} page={page} onPage={setPage} />}
        </div>
        <NewsSidebar />
      </Container>
    </>
  );
}

// ------------------------------------------------------------ /category/:slug

export function CategoryPage() {
  const { slug } = useParams();
  const cat = useBySlug("news_categories", slug);
  useTitle(cat ? String(cat.title) : "");
  if (cat === undefined) return <Loading />;
  if (cat === null) return <NotFoundPage />;
  return <CategoryStories key={String(cat.id)} cat={cat} />;
}

function CategoryStories({ cat }: { cat: Row }) {
  const [page, setPage] = usePage();
  const { items, total, loading } = useList("news_posts", { category_id: Number(cat.id), size: PAGE_SIZE, page });
  const color = catColor(cat);
  return (
    <>
      <div className="border-b border-site-text/10 py-10" style={{ background: `linear-gradient(90deg, color-mix(in srgb, ${color} 14%, transparent), transparent)` }}>
        <Container>
          <span className="mb-3 inline-block h-1.5 w-14 rounded" style={{ background: color }} />
          <h1 style={headingFont} className="text-4xl font-black sm:text-5xl">
            {String(cat.title)}
          </h1>
          {!!cat.description && <p className="mt-2 max-w-2xl text-[var(--muted)]">{String(cat.description)}</p>}
        </Container>
      </div>
      <Container className="grid gap-12 py-12 lg:grid-cols-3">
        <div className="lg:col-span-2">{loading ? <Loading /> : <StoryList items={items} total={total} page={page} onPage={setPage} />}</div>
        <NewsSidebar />
      </Container>
    </>
  );
}

// ------------------------------------------------------------ /news/:slug

function ShareBar({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  const url = window.location.href;
  const enc = encodeURIComponent;
  const links = [
    { label: "WhatsApp", icon: MessageCircle, href: `https://wa.me/?text=${enc(`${title} ${url}`)}`, bg: "#25d366" },
    { label: "Facebook", icon: Facebook, href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`, bg: "#1877f2" },
    { label: "X", icon: Twitter, href: `https://twitter.com/intent/tweet?text=${enc(title)}&url=${enc(url)}`, bg: "#111111" }
  ];
  const copy = () => {
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Share</span>
      {links.map((l) => (
        <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" aria-label={`Share on ${l.label}`} className="flex h-9 w-9 items-center justify-center rounded-full text-white transition hover:scale-110" style={{ background: l.bg }}>
          <l.icon className="h-4 w-4" />
        </a>
      ))}
      <button onClick={copy} aria-label="Copy link" className="flex h-9 items-center gap-1.5 rounded-full border border-site-text/15 px-3 text-xs font-semibold transition hover:bg-site-text/5">
        {copied ? <Check className="h-4 w-4 text-green-600" /> : <Link2 className="h-4 w-4" />} {copied ? "Copied" : "Copy link"}
      </button>
    </div>
  );
}

function ReporterBox({ id }: { id: unknown }) {
  const reporter = useRecord("team_members", id ? String(id) : undefined);
  if (!reporter) return null;
  return (
    <Link to={`/reporter/${reporter.id}`} className="group mt-10 flex items-center gap-4 rounded-xl border border-site-text/10 bg-[var(--surface)] p-5">
      <SmartImage src={reporter.photo} alt={String(reporter.title)} className="h-16 w-16 shrink-0 rounded-full" />
      <div className="min-w-0">
        <div className="text-xs uppercase tracking-wider text-[var(--muted)]">Written by</div>
        <div style={headingFont} className="text-lg font-bold group-hover:text-[var(--primary)]">
          {String(reporter.title)}
        </div>
        {!!reporter.designation && <div className="text-sm text-[var(--muted)]">{String(reporter.designation)}</div>}
        {!!reporter.bio && <p className="mt-1 text-sm">{stripHtml(reporter.bio, 160)}</p>}
      </div>
    </Link>
  );
}

function Related({ post }: { post: Row }) {
  const { items } = useList("news_posts", { category_id: Number(post.category_id), size: 4 });
  const more = items.filter((p) => p.id !== post.id).slice(0, 3);
  if (!more.length) return null;
  return (
    <div className="mt-14">
      <BlockHeading title="Related stories" />
      <motion.div initial="hidden" animate="show" variants={stagger} className="grid gap-6 sm:grid-cols-3">
        {more.map((p, n) => (
          <PostCard key={p.id} post={p} kind="card" n={n + 1} />
        ))}
      </motion.div>
    </div>
  );
}

export function ArticlePage() {
  const { slug } = useParams();
  const post = useBySlug("news_posts", slug);
  const catOf = useCategoryOf();
  const cat = post ? catOf(post) : undefined;
  useTitle(post ? String(post.title) : "", { description: post?.summary, image: post?.cover_image });
  if (post === undefined) return <Loading />;
  if (post === null) return <NotFoundPage />;
  const tags = typeof post.tags === "string" ? post.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];
  const video = youtubeId(post.video_url);
  return (
    <Container className="grid gap-12 py-10 lg:grid-cols-3">
      <article className="min-w-0 lg:col-span-2">
        <nav className="mb-4 flex items-center gap-1 text-sm text-[var(--muted)]">
          <Link to="/" className="hover:text-[var(--primary)]">
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          {cat ? (
            <Link to={categoryHref(cat)} className="font-semibold hover:underline" style={{ color: catColor(cat) }}>
              {String(cat.title)}
            </Link>
          ) : (
            <Link to="/news">News</Link>
          )}
        </nav>
        <div className="flex flex-wrap items-center gap-2">
          <CategoryTag post={post} cat={cat} link />
          {!!post.is_breaking && <span className="bg-red-600 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white">Breaking</span>}
        </div>
        <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={headingFont} className="mt-3 text-3xl font-black leading-tight sm:text-[2.75rem]">
          {String(post.title)}
        </motion.h1>
        {!!post.summary && <p className="mt-4 text-lg leading-relaxed text-[var(--muted)]">{String(post.summary)}</p>}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-y border-site-text/10 py-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            {!!post.reporter_id_label && (
              <Link to={`/reporter/${post.reporter_id}`} className="font-semibold hover:text-[var(--primary)]">
                By {String(post.reporter_id_label)}
              </Link>
            )}
            {!!post.location && (
              <span className="inline-flex items-center gap-1 text-[var(--muted)]">
                <MapPin className="h-3.5 w-3.5" /> {String(post.location)}
              </span>
            )}
            <span className="text-[var(--muted)]">{formatDate(post.published_date)}</span>
            <span className="inline-flex items-center gap-1 text-[var(--muted)]">
              <Clock className="h-3.5 w-3.5" /> {readMinutes(post.body)} min read
            </span>
          </div>
          <ShareBar title={String(post.title)} />
        </div>

        <figure className="mt-6">
          {video ? (
            <div className="aspect-video overflow-hidden rounded-lg bg-black">
              <iframe className="h-full w-full" src={`https://www.youtube.com/embed/${video}`} title={String(post.title)} allowFullScreen />
            </div>
          ) : (
            !!post.cover_image && <SmartImage src={post.cover_image} alt={String(post.image_caption ?? post.title)} className="aspect-[16/9] w-full rounded-lg" />
          )}
          {!!post.image_caption && <figcaption className="mt-2 text-sm italic text-[var(--muted)]">{String(post.image_caption)}</figcaption>}
        </figure>

        <RichHtml html={post.body || `<p>${post.summary ?? ""}</p>`} className="mt-8 text-[1.075rem] leading-8" />
        <AdSlot position="In Article" className="my-10" />

        {tags.length > 0 && (
          <div className="mt-8 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Tags</span>
            {tags.map((t) => (
              <Link key={t} to={`/news?q=${encodeURIComponent(t)}`} className="rounded-full bg-site-text/5 px-3 py-1 text-sm hover:bg-site-text/10">
                #{t}
              </Link>
            ))}
          </div>
        )}
        <div className="mt-8 border-t border-site-text/10 pt-6">
          <ShareBar title={String(post.title)} />
        </div>
        <ReporterBox id={post.reporter_id} />
        <Related post={post} />
      </article>
      <NewsSidebar />
    </Container>
  );
}

// ------------------------------------------------------------ /reporter/:id

export function ReporterPage() {
  const { id } = useParams();
  const reporter = useRecord("team_members", id);
  const [page, setPage] = usePage();
  const { items, total, loading } = useList("news_posts", { reporter_id: Number(id), size: PAGE_SIZE, page });
  useTitle(reporter ? String(reporter.title) : "");
  if (reporter === undefined) return <Loading />;
  if (reporter === null) return <NotFoundPage />;
  return (
    <>
      <div className="border-b border-site-text/10 bg-[var(--surface)] py-10">
        <Container className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
          <SmartImage src={reporter.photo} alt={String(reporter.title)} className="h-28 w-28 shrink-0 rounded-full ring-4 ring-[var(--accent)]" />
          <div>
            <h1 style={headingFont} className="text-3xl font-black">
              {String(reporter.title)}
            </h1>
            {!!reporter.designation && <div className="mt-1 font-semibold text-[var(--primary)]">{String(reporter.designation)}</div>}
            {!!reporter.bio && <p className="mt-2 max-w-2xl text-[var(--muted)]">{stripHtml(reporter.bio, 400)}</p>}
            <div className="mt-2 text-sm text-[var(--muted)]">{total} stories</div>
          </div>
        </Container>
      </div>
      <Container className="grid gap-12 py-12 lg:grid-cols-3">
        <div className="lg:col-span-2">{loading ? <Loading /> : <StoryList items={items} total={total} page={page} onPage={setPage} />}</div>
        <NewsSidebar />
      </Container>
    </>
  );
}


