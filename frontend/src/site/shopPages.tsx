// Store pages: /shop, /shop/category/:slug, /product/:slug, /cart, /checkout
import { FormEvent, ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, ChevronLeft, ChevronRight, Heart, Lock, MapPin, Search, ShieldCheck, ShoppingBag, Star, Tag, Trash2, Truck, Zap } from "lucide-react";
import { api, errorMessage } from "../lib/api";
import type { Row } from "../lib/types";
import { showToast } from "../components/ui";
import { useBySlug, useList, useSite } from "./data";
import { Loading, NotFoundPage, useTitle } from "./pages";
import { AuthPanel } from "./accountPages";
import { Price, ProductCard, ProductGrid, QtyStepper, useStoreConfig } from "./sections/shop";
import { cart, cartPayload, openCartDrawer, payWithRazorpay, RazorpayPayment, rupees, storeApi, useCart, useCustomer } from "./store";
import { Container, EmptyState, headingFont, PageBanner, RichHtml, SmartImage } from "./ui";

const PAGE_SIZE = 24;

const SORTS: Record<string, { label: string; query: Record<string, string> }> = {
  "": { label: "Featured", query: {} },
  new: { label: "Newest first", query: { sort: "id", dir: "desc" } },
  "price-asc": { label: "Price: low to high", query: { sort: "price", dir: "asc" } },
  "price-desc": { label: "Price: high to low", query: { sort: "price", dir: "desc" } }
};

function Btn({ children, onClick, disabled, kind = "primary", type = "button", className = "" }: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  kind?: "primary" | "accent" | "outline";
  type?: "button" | "submit";
  className?: string;
}) {
  const { template } = useSite();
  const k = {
    primary: "bg-[var(--primary)] text-[var(--on-primary)] hover:brightness-110",
    accent: "bg-[var(--accent)] text-[var(--on-accent)] hover:brightness-110",
    outline: "border border-current hover:bg-site-text/5"
  }[kind];
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${template.button} ${k} ${className}`}>
      {children}
    </button>
  );
}

export const fieldCls = "w-full rounded-lg border border-site-text/15 bg-[var(--surface)] px-3 py-2.5 outline-none transition focus:border-[var(--primary)]";

// ------------------------------------------------------------ /shop

export function ShopPage() {
  const { slug } = useParams();
  const [params, setParams] = useSearchParams();
  const sort = params.get("sort") ?? "";
  const q = params.get("q") ?? "";
  const page = Math.max(1, Number(params.get("page")) || 1);
  const [text, setText] = useState(q);
  const cats = useList("product_categories", { size: 100 });
  const category = slug ? cats.items.find((c) => c.slug === slug) : undefined;
  useTitle(category ? String(category.title) : "Shop");

  const query: Record<string, string | number> = { size: PAGE_SIZE, page, ...(SORTS[sort]?.query ?? {}) };
  if (q) query.q = q;
  if (category) query.category_id = Number(category.id);
  const waiting = !!slug && cats.loading;
  const { items, total, loading } = useList("products", waiting ? { size: 1, category_id: -999999 } : query);

  const set = (patch: Record<string, string>) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    if (!("page" in patch)) next.delete("page");
    setParams(next);
  };
  const pages = Math.ceil(total / PAGE_SIZE);
  const roots = cats.items.filter((c) => !c.parent_id);

  if (slug && !cats.loading && !category) return <NotFoundPage />;
  return (
    <>
      <PageBanner title={category ? String(category.title) : q ? `Results for “${q}”` : "Shop"} subtitle={category?.description ? String(category.description) : `${total} products`} />
      <Container className="grid gap-10 py-10 lg:grid-cols-[220px_1fr]">
        <aside className="space-y-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              set({ q: text.trim() });
            }}
            className="relative"
          >
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
            <input aria-label="Search products" value={text} onChange={(e) => setText(e.target.value)} placeholder="Search products…" className={`${fieldCls} pl-9`} />
          </form>
          <div>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Categories</h3>
            <nav className="flex flex-wrap gap-2 lg:flex-col lg:gap-0.5">
              <Link to={`/shop${q ? `?q=${encodeURIComponent(q)}` : ""}`} className={`rounded-lg px-3 py-1.5 text-sm ${!slug ? "bg-site-text/10 font-semibold" : "hover:bg-site-text/5"}`}>
                All products
              </Link>
              {roots.map((c) => (
                <div key={c.id}>
                  <Link to={`/shop/category/${c.slug}`} className={`block rounded-lg px-3 py-1.5 text-sm ${slug === c.slug ? "bg-site-text/10 font-semibold" : "hover:bg-site-text/5"}`}>
                    {String(c.title)}
                  </Link>
                  {cats.items
                    .filter((s) => String(s.parent_id) === String(c.id))
                    .map((s) => (
                      <Link key={s.id} to={`/shop/category/${s.slug}`} className={`ml-3 block rounded-lg px-3 py-1 text-sm ${slug === s.slug ? "font-semibold" : "text-[var(--muted)] hover:text-[var(--text)]"}`}>
                        {String(s.title)}
                      </Link>
                    ))}
                </div>
              ))}
            </nav>
          </div>
        </aside>
        <div>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm text-[var(--muted)]">{loading ? "Loading…" : `${total} products`}</span>
            <select aria-label="Sort products" value={sort} onChange={(e) => set({ sort: e.target.value })} className={`${fieldCls} w-auto py-2 text-sm`}>
              {Object.entries(SORTS).map(([k, s]) => (
                <option key={k} value={k}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          {loading || waiting ? <Loading /> : !items.length ? <EmptyState text="No products found." /> : <ProductGrid key={`${slug}${sort}${q}${page}`} items={items} />}
          {pages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-3">
              <Btn kind="outline" disabled={page <= 1} onClick={() => set({ page: String(page - 1) })}>
                <ChevronLeft className="h-4 w-4" /> Previous
              </Btn>
              <span className="text-sm text-[var(--muted)]">
                Page {page} of {pages}
              </span>
              <Btn kind="outline" disabled={page >= pages} onClick={() => set({ page: String(page + 1) })}>
                Next <ChevronRight className="h-4 w-4" />
              </Btn>
            </div>
          )}
        </div>
      </Container>
    </>
  );
}

// ------------------------------------------------------------ /product/:slug

function Stars({ value, size = "h-4 w-4" }: { value: number; size?: string }) {
  return (
    <span className="inline-flex text-amber-500" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`${size} ${i <= Math.round(value) ? "fill-current" : "opacity-30"}`} />
      ))}
    </span>
  );
}

interface Reviews {
  items: Row[];
  count: number;
  average: number;
}

export function ProductPage() {
  const { slug } = useParams();
  const p = useBySlug("products", slug);
  useTitle(p ? String(p.title) : "", { description: p?.summary, image: p?.cover_image });
  if (p === undefined) return <Loading />;
  if (p === null) return <NotFoundPage />;
  return <ProductView key={String(p.id)} p={p} />;
}

function ProductView({ p }: { p: Row }) {
  const navigate = useNavigate();
  const customer = useCustomer();
  const cfg = useStoreConfig();
  const demo = Number(p.id) < 0;
  const variants = useList("product_variants", { product_id: Number(p.id), size: 100 }).items;
  const related = useList("products", { category_id: Number(p.category_id), size: 5 }).items.filter((r) => r.id !== p.id).slice(0, 4);
  const [opt1, setOpt1] = useState<string | null>(null);
  const [opt2, setOpt2] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [imgIndex, setImgIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Reviews>({ items: [], count: 0, average: 0 });
  const [wished, setWished] = useState(false);

  const loadReviews = useCallback(() => {
    if (demo) return;
    api.get<Reviews>(`/public/store/products/${p.id}/reviews`).then((r) => setReviews(r.data)).catch(() => {});
  }, [p.id, demo]);
  useEffect(loadReviews, [loadReviews]);
  useEffect(() => {
    if (!customer || demo) return;
    storeApi.get<Row[]>("/store/wishlist").then((r) => setWished(r.data.some((w) => w.id === p.id))).catch(() => {});
  }, [customer, p.id, demo]);

  const values1 = [...new Set(variants.map((v) => v.option1).filter(Boolean).map(String))];
  const values2 = [...new Set(variants.map((v) => v.option2).filter(Boolean).map(String))];
  const variant = variants.length
    ? variants.find((v) => (values1.length ? String(v.option1) === opt1 : true) && (values2.length ? String(v.option2) === opt2 : true)) ?? null
    : null;
  const price = variant?.price ?? p.price;
  const mrp = variant?.compare_price ?? p.compare_price;
  const stockRaw = variant ? variant.stock : variants.length ? null : p.stock;
  const stock = stockRaw === null || stockRaw === undefined || stockRaw === "" ? null : Number(stockRaw);
  const out = stock !== null && stock <= 0;
  const images = [variant?.image, p.cover_image, p.image_2, p.image_3, p.image_4].filter(Boolean);
  const uniqueImages = [...new Set(images.map(String))];

  // option ka koi combination available hai?
  const available = (o1: string | null, o2: string | null) =>
    variants.some((v) => (o1 === null || String(v.option1) === o1) && (o2 === null || String(v.option2) === o2) && (v.stock === null || v.stock === undefined || Number(v.stock) > 0));

  const add = (buyNow: boolean) => {
    setError(null);
    if (demo) {
      setError("This is a template preview — cart works on your live website.");
      return;
    }
    if (variants.length && !variant) {
      setError(`Please select ${[values1.length && p.option1_name, values2.length && p.option2_name].filter(Boolean).join(" and ") || "an option"}`);
      return;
    }
    cart.add({
      productId: Number(p.id),
      variantId: variant ? Number(variant.id) : null,
      qty,
      title: String(p.title),
      variantTitle: variant ? String(variant.title) : null,
      price: Number(price),
      image: variant?.image || p.cover_image,
      slug: String(p.slug)
    });
    if (buyNow) navigate("/checkout");
    else openCartDrawer();
  };

  const toggleWish = async () => {
    if (!customer) {
      navigate(`/login?next=${encodeURIComponent(`/product/${p.slug}`)}`);
      return;
    }
    try {
      if (wished) await storeApi.delete(`/store/wishlist/${p.id}`);
      else await storeApi.post(`/store/wishlist/${p.id}`);
      setWished(!wished);
      showToast(wished ? "Removed from wishlist" : "Saved to wishlist");
    } catch (e) {
      showToast(errorMessage(e), true);
    }
  };

  const Options = ({ label, values, value, onPick, isAvail }: { label: string; values: string[]; value: string | null; onPick: (v: string) => void; isAvail: (v: string) => boolean }) => (
    <div>
      <div className="mb-2 text-sm font-semibold">
        {label}: <span className="font-normal text-[var(--muted)]">{value ?? "Select"}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {values.map((v) => {
          const ok = isAvail(v);
          return (
            <button
              key={v}
              type="button"
              onClick={() => onPick(v)}
              aria-pressed={value === v}
              className={`min-w-12 rounded-lg border px-3 py-2 text-sm font-medium transition ${value === v ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--on-primary)]" : "border-site-text/20 hover:border-[var(--primary)]"} ${ok ? "" : "line-through opacity-40"}`}
            >
              {v}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <Container className="py-10">
      <nav className="mb-6 flex items-center gap-1 text-sm text-[var(--muted)]">
        <Link to="/shop" className="hover:text-[var(--primary)]">
          Shop
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="truncate">{String(p.title)}</span>
      </nav>
      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <motion.div key={uniqueImages[imgIndex]} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }} className="overflow-hidden rounded-2xl bg-[var(--surface)]">
            <SmartImage src={uniqueImages[imgIndex] ?? p.cover_image} alt={String(p.title)} className="aspect-square w-full" />
          </motion.div>
          {uniqueImages.length > 1 && (
            <div className="mt-3 flex gap-3">
              {uniqueImages.map((img, i) => (
                <button key={img} onClick={() => setImgIndex(i)} aria-label={`Image ${i + 1}`} className={`overflow-hidden rounded-lg ring-2 ${i === imgIndex ? "ring-[var(--primary)]" : "ring-transparent"}`}>
                  <SmartImage src={img} alt="" className="h-20 w-20" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          {!!p.brand && <div className="text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">{String(p.brand)}</div>}
          <h1 style={headingFont} className="mt-1 text-3xl font-bold leading-tight sm:text-4xl">
            {String(p.title)}
          </h1>
          {reviews.count > 0 && (
            <a href="#reviews" className="mt-2 inline-flex items-center gap-2 text-sm">
              <Stars value={reviews.average} /> {reviews.average} · {reviews.count} reviews
            </a>
          )}
          <div className="mt-4">
            <Price price={price} mrp={mrp} big />
            <div className="mt-1 text-xs text-[var(--muted)]">{cfg.pricesIncludeTax ? "Inclusive of all taxes" : `+ GST ${p.gst_rate}%`}</div>
          </div>
          {!!p.summary && <p className="mt-4 text-[var(--muted)]">{String(p.summary)}</p>}

          <div className="mt-6 space-y-5">
            {values1.length > 0 && (
              <Options label={String(p.option1_name || "Option")} values={values1} value={opt1} onPick={setOpt1} isAvail={(v) => available(v, values2.length ? opt2 : null)} />
            )}
            {values2.length > 0 && (
              <Options label={String(p.option2_name || "Option")} values={values2} value={opt2} onPick={setOpt2} isAvail={(v) => available(values1.length ? opt1 : null, v)} />
            )}
            <div className="text-sm font-semibold">
              {out ? (
                <span className="text-red-600">Out of stock</span>
              ) : stock !== null && stock <= 5 ? (
                <span className="text-amber-600">Hurry — only {stock} left!</span>
              ) : variants.length && !variant ? null : (
                <span className="text-emerald-600">In stock</span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <QtyStepper value={qty} onChange={(v) => setQty(Math.max(1, v))} max={stock !== null ? Math.max(1, Math.min(99, stock)) : 99} />
              <Btn onClick={() => add(false)} disabled={out} className="flex-1">
                <ShoppingBag className="h-4 w-4" /> Add to cart
              </Btn>
              <Btn kind="accent" onClick={() => add(true)} disabled={out} className="flex-1">
                <Zap className="h-4 w-4" /> Buy now
              </Btn>
              <button onClick={toggleWish} aria-label={wished ? "Remove from wishlist" : "Add to wishlist"} className="rounded-full border border-site-text/15 p-3 transition hover:bg-site-text/5">
                <Heart className={`h-5 w-5 ${wished ? "fill-red-500 text-red-500" : ""}`} />
              </button>
            </div>
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <ul className="grid gap-2 rounded-xl bg-[var(--surface)] p-4 text-sm sm:grid-cols-2">
              <li className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-[var(--accent)]" /> {cfg.freeShippingAbove ? `Free delivery above ${rupees(cfg.freeShippingAbove)}` : "Fast delivery"}
              </li>
              {cfg.codEnabled && (
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[var(--accent)]" /> Cash on Delivery available
                </li>
              )}
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[var(--accent)]" /> Secure checkout
              </li>
              {!!p.sku && <li className="text-[var(--muted)]">SKU: {String(variant?.sku ?? p.sku)}</li>}
            </ul>
          </div>
        </div>
      </div>

      {!!p.description && (
        <section className="mt-14 max-w-3xl">
          <h2 style={headingFont} className="mb-4 text-2xl font-bold">
            Product details
          </h2>
          <RichHtml html={p.description} />
        </section>
      )}

      <ReviewsBlock productId={Number(p.id)} reviews={reviews} onAdded={loadReviews} demo={demo} slug={String(p.slug)} />

      {related.length > 0 && (
        <section className="mt-16">
          <h2 style={headingFont} className="mb-6 text-2xl font-bold">
            You may also like
          </h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
            {related.map((r, n) => (
              <ProductCard key={r.id} p={r} n={n} />
            ))}
          </div>
        </section>
      )}
    </Container>
  );
}

function ReviewsBlock({ productId, reviews, onAdded, demo, slug }: { productId: number; reviews: Reviews; onAdded: () => void; demo: boolean; slug: string }) {
  const customer = useCustomer();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const r = await storeApi.post<{ message: string }>(`/store/products/${productId}/reviews`, { rating, title, comment });
      setMsg(r.data.message);
      setTitle("");
      setComment("");
      onAdded();
    } catch (err) {
      setMsg(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section id="reviews" className="mt-16 grid gap-10 lg:grid-cols-[1fr_380px]">
      <div>
        <h2 style={headingFont} className="mb-4 text-2xl font-bold">
          Customer reviews {reviews.count > 0 && <span className="text-base font-normal text-[var(--muted)]">({reviews.count})</span>}
        </h2>
        {reviews.count > 0 && (
          <div className="mb-6 flex items-center gap-3">
            <span className="text-4xl font-bold">{reviews.average}</span>
            <Stars value={reviews.average} size="h-5 w-5" />
          </div>
        )}
        {!reviews.items.length ? (
          <p className="text-[var(--muted)]">No reviews yet — be the first to review this product.</p>
        ) : (
          <ul className="divide-y divide-site-text/10">
            {reviews.items.map((r) => (
              <li key={r.id} className="py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Stars value={Number(r.rating)} />
                  {!!r.title && <span className="font-semibold">{String(r.title)}</span>}
                </div>
                {!!r.comment && <p className="mt-1 text-sm">{String(r.comment)}</p>}
                <div className="mt-1 text-xs text-[var(--muted)]">
                  {String(r.customer_name)} {r.is_verified ? "· ✓ Verified purchase" : ""}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="rounded-2xl bg-[var(--surface)] p-5">
        <h3 className="mb-3 font-semibold">Write a review</h3>
        {demo ? (
          <p className="text-sm text-[var(--muted)]">Reviews work on your live website.</p>
        ) : !customer ? (
          <p className="text-sm">
            <Link to={`/login?next=${encodeURIComponent(`/product/${slug}#reviews`)}`} className="font-semibold text-[var(--primary)] underline">
              Login
            </Link>{" "}
            to write a review.
          </p>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <div className="flex gap-1" role="radiogroup" aria-label="Rating">
              {[1, 2, 3, 4, 5].map((i) => (
                <button key={i} type="button" role="radio" aria-checked={rating === i} aria-label={`${i} stars`} onClick={() => setRating(i)}>
                  <Star className={`h-7 w-7 text-amber-500 ${i <= rating ? "fill-current" : "opacity-30"}`} />
                </button>
              ))}
            </div>
            <input aria-label="Review title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={150} placeholder="Title (optional)" className={fieldCls} />
            <textarea aria-label="Review" value={comment} onChange={(e) => setComment(e.target.value)} maxLength={2000} rows={4} placeholder="What did you like or dislike?" className={fieldCls} />
            <Btn type="submit" disabled={busy} className="w-full">
              {busy ? "Submitting…" : "Submit review"}
            </Btn>
            {msg && <p className="text-sm">{msg}</p>}
          </form>
        )}
      </div>
    </section>
  );
}

// ------------------------------------------------------------ quote (cart + checkout)

export interface QuoteLine {
  productId: number;
  variantId: number | null;
  slug: string;
  stock: number | null;
  title: string;
  variantTitle: string | null;
  image: string | null;
  unitPrice: number;
  qty: number;
  lineTotal: number;
}

export interface Quote {
  lines: QuoteLine[];
  issues: { productId: number; variantId: number | null; message: string }[];
  subtotal: number;
  discount: number;
  couponCode: string | null;
  couponError: string | null;
  tax: number;
  pricesIncludeTax: boolean;
  shipping: number;
  codFee: number;
  total: number;
  codAvailable: boolean;
  codReason: string | null;
  razorpayAvailable: boolean;
}

const COUPON_KEY = "wm_coupon";
export const savedCoupon = () => {
  try {
    return sessionStorage.getItem(COUPON_KEY) ?? "";
  } catch {
    return "";
  }
};
const saveCoupon = (c: string) => {
  try {
    if (c) sessionStorage.setItem(COUPON_KEY, c);
    else sessionStorage.removeItem(COUPON_KEY);
  } catch {
    // ignore
  }
};

/** Server se hisaab (price / stock / coupon / shipping) — cart badle to dobara */
function useQuote(coupon: string, paymentMethod: string) {
  const items = useCart();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const key = JSON.stringify(cartPayload(items));
  useEffect(() => {
    if (!items.length) {
      setQuote(null);
      return;
    }
    let alive = true;
    const t = setTimeout(() => {
      storeApi
        .post<Quote>("/public/store/quote", { items: cartPayload(items), coupon: coupon || null, paymentMethod })
        .then((r) => {
          if (alive) {
            setQuote(r.data);
            setError(null);
          }
        })
        .catch((e) => alive && setError(errorMessage(e)));
    }, 150);
    return () => {
      alive = false;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, coupon, paymentMethod]);
  return { items, quote, error };
}

function Summary({ quote, children }: { quote: Quote; children?: ReactNode }) {
  const row = (label: string, value: string, cls = "") => (
    <div className={`flex justify-between text-sm ${cls}`}>
      <span className="text-[var(--muted)]">{label}</span>
      <span>{value}</span>
    </div>
  );
  return (
    <div className="space-y-2 rounded-2xl bg-[var(--surface)] p-5">
      <h2 className="mb-2 font-semibold">Order summary</h2>
      {row("Subtotal", rupees(quote.subtotal))}
      {quote.discount > 0 && row(`Discount (${quote.couponCode})`, `−${rupees(quote.discount)}`, "text-emerald-600")}
      {row("Shipping", quote.shipping > 0 ? rupees(quote.shipping) : "FREE")}
      {quote.codFee > 0 && row("Cash on Delivery charge", rupees(quote.codFee))}
      {row(quote.pricesIncludeTax ? "GST (included)" : "GST", rupees(quote.tax))}
      <div className="flex justify-between border-t border-site-text/10 pt-3 text-lg font-bold">
        <span>Total</span>
        <span>{rupees(quote.total)}</span>
      </div>
      {children}
    </div>
  );
}

// ------------------------------------------------------------ /cart

export function CartPage() {
  useTitle("Cart");
  const navigate = useNavigate();
  const [coupon, setCoupon] = useState(savedCoupon);
  const [couponText, setCouponText] = useState(savedCoupon);
  const { items, quote, error } = useQuote(coupon, "");
  const issueOf = (l: { productId: number; variantId: number | null }) =>
    quote?.issues.find((i) => i.productId === l.productId && (i.variantId ?? null) === (l.variantId ?? null))?.message;

  // server ka asli price cart me bhi (drawer sahi dikhe)
  useEffect(() => {
    quote?.lines.forEach((l) => {
      const it = items.find((i) => i.productId === l.productId && (i.variantId ?? null) === (l.variantId ?? null));
      if (it && it.price !== Number(l.unitPrice)) cart.add({ ...it, qty: 0, price: Number(l.unitPrice) });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quote]);

  const apply = (e: FormEvent) => {
    e.preventDefault();
    const c = couponText.trim().toUpperCase();
    setCoupon(c);
    saveCoupon(c);
  };

  if (!items.length) {
    return (
      <Container className="flex flex-col items-center gap-4 py-24 text-center">
        <ShoppingBag className="h-14 w-14 text-[var(--muted)]" />
        <h1 style={headingFont} className="text-3xl font-bold">
          Your cart is empty
        </h1>
        <Link to="/shop" className="font-semibold text-[var(--primary)] underline">
          Continue shopping
        </Link>
      </Container>
    );
  }
  return (
    <Container className="py-10">
      <h1 style={headingFont} className="mb-8 text-3xl font-bold">
        Shopping cart
      </h1>
      <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
        <ul className="divide-y divide-site-text/10 border-y border-site-text/10">
          {items.map((i) => {
            const issue = issueOf(i);
            return (
              <li key={`${i.productId}:${i.variantId}`} className="flex gap-4 py-5">
                <SmartImage src={i.image} alt={i.title} className="h-28 w-24 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between gap-3">
                    <div>
                      <Link to={i.slug ? `/product/${i.slug}` : "/shop"} className="font-semibold hover:text-[var(--primary)]">
                        {i.title}
                      </Link>
                      {i.variantTitle && <div className="text-sm text-[var(--muted)]">{i.variantTitle}</div>}
                      <div className="text-sm text-[var(--muted)]">{rupees(i.price)} each</div>
                    </div>
                    <span className="font-semibold">{rupees(i.price * i.qty)}</span>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <QtyStepper value={i.qty} onChange={(q) => cart.setQty(i, q)} small />
                    <button onClick={() => cart.remove(i)} className="inline-flex items-center gap-1 text-sm text-[var(--muted)] hover:text-red-600">
                      <Trash2 className="h-4 w-4" /> Remove
                    </button>
                  </div>
                  {issue && <p className="mt-2 rounded-md bg-red-50 px-2 py-1 text-sm text-red-700">{issue}</p>}
                </div>
              </li>
            );
          })}
        </ul>
        <div className="space-y-4">
          <form onSubmit={apply} className="flex gap-2">
            <div className="relative flex-1">
              <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
              <input aria-label="Coupon code" value={couponText} onChange={(e) => setCouponText(e.target.value)} placeholder="Coupon code" className={`${fieldCls} pl-9 uppercase`} />
            </div>
            <Btn kind="outline" type="submit">
              Apply
            </Btn>
          </form>
          {quote?.couponError && <p className="text-sm text-red-600">{quote.couponError}</p>}
          {quote?.couponCode && (
            <p className="flex items-center justify-between text-sm text-emerald-600">
              <span>
                <Check className="mr-1 inline h-4 w-4" />
                {quote.couponCode} applied
              </span>
              <button
                className="text-[var(--muted)] underline"
                onClick={() => {
                  setCoupon("");
                  setCouponText("");
                  saveCoupon("");
                }}
              >
                Remove
              </button>
            </p>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          {quote && (
            <Summary quote={quote}>
              <Btn className="mt-3 w-full" disabled={quote.issues.length > 0 || !quote.lines.length} onClick={() => navigate("/checkout")}>
                <Lock className="h-4 w-4" /> Checkout
              </Btn>
              {quote.issues.length > 0 && <p className="text-xs text-red-600">Fix the items marked above to continue.</p>}
            </Summary>
          )}
        </div>
      </div>
    </Container>
  );
}

// ------------------------------------------------------------ /checkout

const EMPTY_ADDRESS = { name: "", phone: "", line1: "", line2: "", city: "", state: "", pincode: "" };
export const STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh",
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

export function AddressFields({ value, onChange }: { value: typeof EMPTY_ADDRESS; onChange: (v: typeof EMPTY_ADDRESS) => void }) {
  const f = (k: keyof typeof EMPTY_ADDRESS, label: string, props: Record<string, unknown> = {}) => (
    <label className="block text-sm">
      <span className="mb-1 block font-medium">{label}</span>
      <input value={value[k]} onChange={(e) => onChange({ ...value, [k]: e.target.value })} className={fieldCls} {...props} />
    </label>
  );
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {f("name", "Full name", { required: true, maxLength: 150, autoComplete: "name" })}
      {f("phone", "Mobile number", { required: true, inputMode: "tel", minLength: 10, maxLength: 16, autoComplete: "tel" })}
      <div className="sm:col-span-2">{f("line1", "House no, building, street", { required: true, maxLength: 255, autoComplete: "address-line1" })}</div>
      <div className="sm:col-span-2">{f("line2", "Area, landmark (optional)", { maxLength: 255, autoComplete: "address-line2" })}</div>
      {f("city", "City", { required: true, maxLength: 100, autoComplete: "address-level2" })}
      {f("pincode", "PIN code", { required: true, inputMode: "numeric", pattern: "[1-9][0-9]{5}", title: "6-digit PIN code", autoComplete: "postal-code" })}
      <label className="block text-sm sm:col-span-2">
        <span className="mb-1 block font-medium">State</span>
        <select required value={value.state} onChange={(e) => onChange({ ...value, state: e.target.value })} className={fieldCls}>
          <option value="">Select state</option>
          {STATES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </label>
    </div>
  );
}

export function CheckoutPage() {
  useTitle("Checkout");
  const customer = useCustomer();
  if (!customer) {
    return (
      <Container className="max-w-md py-14">
        <h1 style={headingFont} className="mb-2 text-center text-3xl font-bold">
          Checkout
        </h1>
        <p className="mb-6 text-center text-[var(--muted)]">Login or create an account to place your order. Your cart is saved.</p>
        <AuthPanel />
      </Container>
    );
  }
  return <CheckoutForm />;
}

function CheckoutForm() {
  const navigate = useNavigate();
  const { template } = useSite();
  const cfg = useStoreConfig();
  const [addresses, setAddresses] = useState<Row[] | null>(null);
  const [addressId, setAddressId] = useState<number | "new">("new");
  const [address, setAddress] = useState(EMPTY_ADDRESS);
  const [saveAddress, setSaveAddress] = useState(true);
  const [method, setMethod] = useState<"COD" | "RAZORPAY" | "">("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const coupon = useMemo(savedCoupon, []);
  const { items, quote, error: quoteError } = useQuote(coupon, method);

  useEffect(() => {
    storeApi
      .get<Row[]>("/store/addresses")
      .then((r) => {
        setAddresses(r.data);
        if (r.data.length) setAddressId(Number(r.data[0].id));
      })
      .catch(() => setAddresses([]));
  }, []);

  // default payment: online (agar on) warna COD
  useEffect(() => {
    if (method || !quote) return;
    setMethod(quote.razorpayAvailable ? "RAZORPAY" : quote.codAvailable ? "COD" : "");
  }, [quote, method]);

  if (!items.length) {
    return (
      <Container className="py-24 text-center">
        <p className="mb-4 text-[var(--muted)]">Your cart is empty.</p>
        <Link to="/shop" className="font-semibold text-[var(--primary)] underline">
          Continue shopping
        </Link>
      </Container>
    );
  }

  const place = async (e: FormEvent) => {
    e.preventDefault();
    if (!quote || !method) return;
    setBusy(true);
    setError(null);
    try {
      const body: Record<string, unknown> = { items: cartPayload(items), coupon: coupon || null, paymentMethod: method, notes, expectedTotal: quote.total };
      if (addressId === "new") Object.assign(body, { address, saveAddress });
      else body.addressId = addressId;
      const r = await storeApi.post<{ order: Row; payment?: RazorpayPayment }>("/store/checkout", body);
      const orderNo = String(r.data.order.order_no);
      // order ban gaya (stock reserve) — cart khaali, payment chahe baad me ho
      cart.clear();
      saveCoupon("");
      if (r.data.payment) {
        const result = await payWithRazorpay(r.data.payment, template.colors.primary).catch((err: Error) => {
          showToast(err.message, true);
          return null;
        });
        if (result) {
          await storeApi.post(`/store/orders/${orderNo}/razorpay/verify`, result);
          navigate(`/account/orders/${orderNo}?placed=1`);
        } else {
          navigate(`/account/orders/${orderNo}?pending=1`);
        }
      } else {
        navigate(`/account/orders/${orderNo}?placed=1`);
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Container className="py-10">
      <h1 style={headingFont} className="mb-8 text-3xl font-bold">
        Checkout
      </h1>
      <form onSubmit={place} className="grid gap-10 lg:grid-cols-[1fr_380px]">
        <div className="space-y-8">
          <section>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <MapPin className="h-5 w-5 text-[var(--accent)]" /> Delivery address
            </h2>
            {addresses === null ? (
              <Loading />
            ) : (
              <div className="space-y-3">
                {addresses.map((a) => (
                  <label key={a.id} className={`flex cursor-pointer gap-3 rounded-xl border p-4 ${addressId === Number(a.id) ? "border-[var(--primary)] bg-[var(--surface)]" : "border-site-text/15"}`}>
                    <input type="radio" name="address" checked={addressId === Number(a.id)} onChange={() => setAddressId(Number(a.id))} className="mt-1" />
                    <span className="text-sm">
                      <b>{String(a.name)}</b> · {String(a.phone)}
                      <br />
                      {[a.line1, a.line2, a.city, a.state, a.pincode].filter(Boolean).join(", ")}
                    </span>
                  </label>
                ))}
                {addresses.length > 0 && (
                  <label className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 ${addressId === "new" ? "border-[var(--primary)]" : "border-site-text/15"}`}>
                    <input type="radio" name="address" checked={addressId === "new"} onChange={() => setAddressId("new")} /> Deliver to a new address
                  </label>
                )}
                {addressId === "new" && (
                  <div className="rounded-xl border border-site-text/10 p-4">
                    <AddressFields value={address} onChange={setAddress} />
                    <label className="mt-3 flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} /> Save this address for next time
                    </label>
                  </div>
                )}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <ShieldCheck className="h-5 w-5 text-[var(--accent)]" /> Payment
            </h2>
            <div className="space-y-3">
              {cfg.razorpayEnabled && (
                <label className={`flex cursor-pointer gap-3 rounded-xl border p-4 ${method === "RAZORPAY" ? "border-[var(--primary)] bg-[var(--surface)]" : "border-site-text/15"}`}>
                  <input type="radio" name="pay" checked={method === "RAZORPAY"} onChange={() => setMethod("RAZORPAY")} className="mt-1" />
                  <span>
                    <b>Pay online</b> — UPI, cards, netbanking, wallets
                    <span className="block text-xs text-[var(--muted)]">Secured by Razorpay</span>
                  </span>
                </label>
              )}
              {cfg.codEnabled && (
                <label
                  className={`flex gap-3 rounded-xl border p-4 ${quote && !quote.codAvailable ? "cursor-not-allowed opacity-50" : "cursor-pointer"} ${method === "COD" ? "border-[var(--primary)] bg-[var(--surface)]" : "border-site-text/15"}`}
                >
                  <input type="radio" name="pay" disabled={!!quote && !quote.codAvailable} checked={method === "COD"} onChange={() => setMethod("COD")} className="mt-1" />
                  <span>
                    <b>Cash on Delivery</b> {cfg.codFee > 0 && <span className="text-sm text-[var(--muted)]">(+{rupees(cfg.codFee)})</span>}
                    {quote && !quote.codAvailable && quote.codReason && <span className="block text-xs text-red-600">{quote.codReason}</span>}
                  </span>
                </label>
              )}
              {!cfg.codEnabled && !cfg.razorpayEnabled && <p className="text-sm text-red-600">No payment method is available right now. Please contact us.</p>}
            </div>
          </section>

          <label className="block text-sm">
            <span className="mb-1 block font-medium">Order notes (optional)</span>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} rows={2} placeholder="Delivery instructions…" className={fieldCls} />
          </label>
        </div>

        <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <ul className="space-y-3 rounded-2xl bg-[var(--surface)] p-5">
            {(quote?.lines ?? []).map((l) => (
              <li key={`${l.productId}:${l.variantId}`} className="flex items-center gap-3 text-sm">
                <span className="relative">
                  <SmartImage src={l.image} alt={l.title} className="h-14 w-12 rounded-md" />
                  <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--primary)] text-[10px] font-bold text-[var(--on-primary)]">{l.qty}</span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-1 font-medium">{l.title}</span>
                  {l.variantTitle && <span className="text-xs text-[var(--muted)]">{l.variantTitle}</span>}
                </span>
                <span>{rupees(l.lineTotal)}</span>
              </li>
            ))}
          </ul>
          {quote && (
            <Summary quote={quote}>
              {quote.issues.map((i) => (
                <p key={`${i.productId}:${i.variantId}`} className="text-sm text-red-600">
                  {i.message}
                </p>
              ))}
              {quote.couponError && <p className="text-sm text-red-600">{quote.couponError}</p>}
              {(error || quoteError) && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error || quoteError}</p>}
              <Btn type="submit" className="mt-3 w-full" disabled={busy || !method || quote.issues.length > 0 || !quote.lines.length}>
                <Lock className="h-4 w-4" /> {busy ? "Placing order…" : method === "RAZORPAY" ? `Pay ${rupees(quote.total)}` : `Place order · ${rupees(quote.total)}`}
              </Btn>
              <Link to="/cart" className="block text-center text-sm text-[var(--muted)] underline">
                Back to cart
              </Link>
            </Summary>
          )}
        </div>
      </form>
    </Container>
  );
}
