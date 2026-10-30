// Online store ke sections: product card, home par products (Featured / New), categories, perks strip,
// navbar ke cart + account icons aur cart drawer.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Banknote, Minus, Plus, RotateCcw, ShieldCheck, ShoppingBag, Truck, User, X } from "lucide-react";
import { api } from "../../lib/api";
import type { Row } from "../../lib/types";
import { useList, useSite } from "../data";
import { cart, cartCount, openCartDrawer, percentOff, rupees, useCart, useCartDrawer, useCustomer } from "../store";
import { Container, fadeUp, headingFont, Section, SmartImage, stagger } from "../ui";
import type { Variant } from "./content";

export const productHref = (p: Row) => `/product/${p.slug}`;

export interface StoreConfig {
  pricesIncludeTax: boolean;
  shippingFee: number;
  freeShippingAbove: number | null;
  codEnabled: boolean;
  codFee: number;
  codMaxOrder: number | null;
  razorpayEnabled: boolean;
  razorpayKeyId: string | null;
}

const DEFAULT_CONFIG: StoreConfig = {
  pricesIncludeTax: true,
  shippingFee: 0,
  freeShippingAbove: null,
  codEnabled: true,
  codFee: 0,
  codMaxOrder: null,
  razorpayEnabled: false,
  razorpayKeyId: null
};

let configCache: Promise<StoreConfig> | null = null;

/** Payment / shipping settings (public, secret kuch nahi). Showcase (root domain) me default. */
export function useStoreConfig(): StoreConfig {
  const { showcase } = useSite();
  const [cfg, setCfg] = useState<StoreConfig>(DEFAULT_CONFIG);
  useEffect(() => {
    if (showcase) return;
    configCache ??= api
      .get<StoreConfig>("/public/store/config")
      .then((r) => ({ ...DEFAULT_CONFIG, ...r.data }))
      .catch(() => {
        configCache = null;
        return DEFAULT_CONFIG;
      });
    configCache.then(setCfg);
  }, [showcase]);
  return cfg;
}

export function Price({ price, mrp, big = false }: { price: unknown; mrp?: unknown; big?: boolean }) {
  const off = percentOff(price, mrp);
  return (
    <div className="flex flex-wrap items-baseline gap-x-2">
      <span className={`font-bold ${big ? "text-3xl" : "text-lg"}`}>{rupees(price)}</span>
      {off > 0 && (
        <>
          <span className={`text-[var(--muted)] line-through ${big ? "text-lg" : "text-sm"}`}>{rupees(mrp)}</span>
          <span className={`font-semibold text-emerald-600 ${big ? "text-lg" : "text-sm"}`}>{off}% off</span>
        </>
      )}
    </div>
  );
}

/** Product ka stock khatam? (variants wale ka pata product page par chalta hai) */
const soldOut = (p: Row) => p.stock !== null && p.stock !== undefined && p.stock !== "" && Number(p.stock) <= 0;

export function ProductCard({ p, n = 0 }: { p: Row; n?: number }) {
  const { template } = useSite();
  const off = percentOff(p.price, p.compare_price);
  return (
    <motion.div variants={fadeUp} className="group">
      <Link to={productHref(p)} className="block">
        <div className={`relative overflow-hidden bg-[var(--surface)] ${template.radius} ${template.card}`}>
          <SmartImage src={p.cover_image} alt={String(p.title)} seed={n} className="aspect-[4/5] w-full transition duration-700 group-hover:scale-105" />
          {!!p.image_2 && (
            <SmartImage src={p.image_2} alt="" seed={n + 1} className="absolute inset-0 h-full w-full opacity-0 transition duration-500 group-hover:opacity-100" />
          )}
          <div className="absolute left-3 top-3 flex flex-col gap-1">
            {off > 0 && <span className="rounded-full bg-[var(--accent)] px-2.5 py-1 text-xs font-bold text-[var(--on-accent)]">-{off}%</span>}
            {soldOut(p) && <span className="rounded-full bg-black/75 px-2.5 py-1 text-xs font-semibold text-white">Sold out</span>}
          </div>
        </div>
        <div className="mt-3 px-1">
          {!!p.brand && <div className="text-xs uppercase tracking-wider text-[var(--muted)]">{String(p.brand)}</div>}
          <h3 style={headingFont} className="mt-0.5 line-clamp-2 font-semibold leading-snug group-hover:text-[var(--primary)]">
            {String(p.title)}
          </h3>
          <div className="mt-1">
            <Price price={p.price} mrp={p.compare_price} />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function ProductGrid({ items, className = "" }: { items: Row[]; className?: string }) {
  return (
    <motion.div initial="hidden" animate="show" variants={stagger} className={`grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4 ${className}`}>
      {items.map((p, n) => (
        <ProductCard key={p.id} p={p} n={n} />
      ))}
    </motion.div>
  );
}

// ------------------------------------------------------------ home: products (Featured / New arrivals)

const TABS = [
  { key: "featured", label: "Featured", query: { is_featured: "true" } },
  { key: "new", label: "New Arrivals", query: { sort: "id", dir: "desc" } },
  { key: "deals", label: "Best Prices", query: { sort: "price", dir: "asc" } }
] as const;

export function Products({ variant = "grid" }: Variant) {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("featured");
  const active = TABS.find((t) => t.key === tab)!;
  const { items } = useList("products", { size: 8, ...active.query });
  const all = useList("products", { size: 1 });
  if (!all.items.length) return null;
  return (
    <Section id="products" title="Shop the collection" subtitle="Trending now">
      <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition ${tab === t.key ? "bg-[var(--primary)] text-[var(--on-primary)]" : "bg-site-text/5 hover:bg-site-text/10"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {variant === "carousel" ? (
        <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-4 [scrollbar-width:thin]">
          {items.map((p, n) => (
            <div key={p.id} className="w-56 shrink-0 snap-start sm:w-64">
              <ProductCard p={p} n={n} />
            </div>
          ))}
        </div>
      ) : (
        <ProductGrid key={tab} items={items} />
      )}
      <div className="mt-10 text-center">
        <Link to="/shop" className="inline-flex items-center gap-2 rounded-full border border-current px-6 py-2.5 text-sm font-semibold hover:bg-site-text/5">
          View all products
        </Link>
      </div>
    </Section>
  );
}

// ------------------------------------------------------------ categories (tiles | circles)

export function ShopCategories({ variant = "tiles" }: Variant) {
  const { items } = useList("product_categories", { show_on_home: "true", size: 12 });
  const { template } = useSite();
  if (!items.length) return null;
  if (variant === "circles") {
    return (
      <Section id="categories" title="Shop by category" subtitle="Categories">
        <div className="flex snap-x gap-6 overflow-x-auto pb-2 sm:justify-center">
          {items.map((c, n) => (
            <motion.div key={c.id} variants={fadeUp} className="shrink-0 snap-start">
              <Link to={`/shop/category/${c.slug}`} className="group flex w-24 flex-col items-center gap-2 text-center sm:w-28">
                <span className="block h-24 w-24 overflow-hidden rounded-full ring-2 ring-site-text/10 transition group-hover:ring-[var(--accent)] sm:h-28 sm:w-28">
                  <SmartImage src={c.image} alt={String(c.title)} seed={n} className="h-full w-full transition duration-500 group-hover:scale-110" />
                </span>
                <span className="text-sm font-semibold">{String(c.title)}</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </Section>
    );
  }
  return (
    <Section id="categories" title="Shop by category" subtitle="Categories">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {items.slice(0, 6).map((c, n) => (
          <motion.div key={c.id} variants={fadeUp} className={n === 0 ? "md:row-span-2" : ""}>
            <Link to={`/shop/category/${c.slug}`} className={`group relative block h-full min-h-[11rem] overflow-hidden ${template.radius}`}>
              <SmartImage src={c.image} alt={String(c.title)} seed={n} className="absolute inset-0 h-full w-full transition duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                <div style={headingFont} className="text-xl font-bold">
                  {String(c.title)}
                </div>
                <div className="text-sm text-white/80 transition group-hover:translate-x-1">Shop now →</div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

// ------------------------------------------------------------ perks (free shipping, COD, secure, returns)

export function Perks() {
  const cfg = useStoreConfig();
  const perks = [
    { icon: Truck, title: cfg.freeShippingAbove ? `Free shipping above ${rupees(cfg.freeShippingAbove)}` : "Fast delivery", text: "Across India" },
    cfg.codEnabled ? { icon: Banknote, title: "Cash on Delivery", text: "Pay when it arrives" } : null,
    { icon: ShieldCheck, title: "Secure payments", text: cfg.razorpayEnabled ? "UPI, cards & netbanking via Razorpay" : "100% safe checkout" },
    { icon: RotateCcw, title: "Easy returns", text: "Hassle-free support" }
  ].filter(Boolean) as { icon: typeof Truck; title: string; text: string }[];
  return (
    <section className="border-y border-site-text/10 bg-[var(--surface)] py-8">
      <Container className="grid grid-cols-2 gap-6 lg:grid-cols-4">
        {perks.map((p) => (
          <div key={p.title} className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-site-accent/15 text-[var(--accent)]">
              <p.icon className="h-5 w-5" />
            </span>
            <div>
              <div className="text-sm font-semibold">{p.title}</div>
              <div className="text-xs text-[var(--muted)]">{p.text}</div>
            </div>
          </div>
        ))}
      </Container>
    </section>
  );
}

// ------------------------------------------------------------ navbar: cart + account

export function StoreIcons({ light }: { light: boolean }) {
  const { siteType } = useSite();
  const items = useCart();
  const customer = useCustomer();
  if (siteType !== "ecommerce") return null;
  const count = cartCount(items);
  const cls = `relative rounded-full p-2 transition ${light ? "text-white hover:bg-white/15" : "text-[var(--text)] hover:bg-site-text/5"}`;
  return (
    <div className="ml-auto flex items-center gap-1 lg:ml-2">
      <Link to={customer ? "/account" : "/login"} className={cls} aria-label={customer ? "My account" : "Login"} title={customer ? customer.name : "Login / Sign up"}>
        <User className="h-5 w-5" />
      </Link>
      <button onClick={openCartDrawer} className={cls} aria-label={`Cart (${count} items)`}>
        <ShoppingBag className="h-5 w-5" />
        {count > 0 && (
          <motion.span
            key={count}
            initial={{ scale: 0.4 }}
            animate={{ scale: 1 }}
            className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--accent)] px-1 text-[11px] font-bold text-[var(--on-accent)]"
          >
            {count}
          </motion.span>
        )}
      </button>
    </div>
  );
}

/** Right side se khulne wala cart (Add to cart ke baad bhi) */
export function CartDrawer() {
  const { siteType, template } = useSite();
  const [open, setOpen] = useCartDrawer();
  const items = useCart();
  if (siteType !== "ecommerce") return null;
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[70] bg-black/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)}>
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-[var(--bg)] text-[var(--text)] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Shopping cart"
          >
            <div className="flex items-center justify-between border-b border-site-text/10 px-5 py-4">
              <h2 style={headingFont} className="text-lg font-bold">
                Your cart ({cartCount(items)})
              </h2>
              <button aria-label="Close cart" onClick={() => setOpen(false)} className="rounded-full p-1.5 hover:bg-site-text/5">
                <X className="h-5 w-5" />
              </button>
            </div>
            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center text-[var(--muted)]">
                <ShoppingBag className="h-12 w-12 opacity-40" />
                <p>Your cart is empty.</p>
                <Link to="/shop" onClick={() => setOpen(false)} className={`bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-[var(--on-primary)] ${template.button}`}>
                  Start shopping
                </Link>
              </div>
            ) : (
              <>
                <ul className="flex-1 divide-y divide-site-text/10 overflow-y-auto px-5">
                  {items.map((i) => (
                    <li key={`${i.productId}:${i.variantId}`} className="flex gap-3 py-4">
                      <SmartImage src={i.image} alt={i.title} className="h-20 w-16 shrink-0 rounded-md" />
                      <div className="min-w-0 flex-1">
                        <Link to={i.slug ? `/product/${i.slug}` : "/shop"} onClick={() => setOpen(false)} className="line-clamp-2 text-sm font-semibold hover:text-[var(--primary)]">
                          {i.title}
                        </Link>
                        {i.variantTitle && <div className="text-xs text-[var(--muted)]">{i.variantTitle}</div>}
                        <div className="mt-2 flex items-center justify-between">
                          <QtyStepper value={i.qty} onChange={(q) => cart.setQty(i, q)} small />
                          <span className="text-sm font-semibold">{rupees(i.price * i.qty)}</span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="space-y-3 border-t border-site-text/10 p-5">
                  <div className="flex justify-between font-semibold">
                    <span>Subtotal</span>
                    <span>{rupees(subtotal)}</span>
                  </div>
                  <p className="text-xs text-[var(--muted)]">Shipping, coupons and taxes are calculated at checkout.</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Link to="/cart" onClick={() => setOpen(false)} className={`border border-current px-4 py-3 text-center text-sm font-semibold ${template.button}`}>
                      View cart
                    </Link>
                    <Link to="/checkout" onClick={() => setOpen(false)} className={`bg-[var(--primary)] px-4 py-3 text-center text-sm font-semibold text-[var(--on-primary)] ${template.button}`}>
                      Checkout
                    </Link>
                  </div>
                </div>
              </>
            )}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function QtyStepper({ value, onChange, max = 99, small = false }: { value: number; onChange: (v: number) => void; max?: number; small?: boolean }) {
  const btn = `flex items-center justify-center ${small ? "h-7 w-7" : "h-10 w-10"} disabled:opacity-30 hover:bg-site-text/5`;
  return (
    <div className="inline-flex items-center rounded-lg border border-site-text/15">
      <button type="button" aria-label="Decrease quantity" className={btn} onClick={() => onChange(value - 1)}>
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className={`text-center font-semibold ${small ? "w-7 text-sm" : "w-10"}`}>{value}</span>
      <button type="button" aria-label="Increase quantity" className={btn} disabled={value >= max} onClick={() => onChange(Math.min(max, value + 1))}>
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
