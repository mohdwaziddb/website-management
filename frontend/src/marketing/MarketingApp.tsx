// Product ki main website (root domain): naye client ko dikhana ki kya milta hai + live template demos
import { ReactNode, useEffect, useState } from "react";
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeIndianRupee,
  Bell,
  Briefcase,
  Building2,
  Camera,
  CheckCircle2,
  ChevronDown,
  Dumbbell,
  Globe,
  GraduationCap,
  HandHeart,
  HardHat,
  Hotel,
  LayoutTemplate,
  Lock,
  Mail,
  Megaphone,
  Menu,
  MessageCircle,
  Monitor,
  Moon,
  MousePointerClick,
  Newspaper,
  Palette,
  Rocket,
  Search,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Sofa,
  Sparkles,
  Stethoscope,
  UserRound,
  Users,
  UtensilsCrossed,
  Wand2,
  X,
  Zap
} from "lucide-react";
import { BASE_DOMAIN } from "../lib/tenant";
import { TEMPLATES, templatesFor } from "../site/templates";
import { getSiteType, SITE_TYPES } from "../site/siteTypes";
import { LivePreview } from "../pages/TemplatesPage";

export const PRODUCT_NAME = import.meta.env.VITE_PRODUCT_NAME || "Website Manager";
const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL || "hello@" + (BASE_DOMAIN === "localhost" ? "example.com" : BASE_DOMAIN);

const EASE = [0.22, 1, 0.36, 1] as const;
const fadeUp = { hidden: { opacity: 0, y: 28 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.09 } } };
const reveal = { initial: "hidden", whileInView: "show", viewport: { once: true, margin: "-80px" } } as const;

/** Website type -> icon */
export const TYPE_ICONS: Record<string, typeof Globe> = {
  school: GraduationCap,
  coaching: GraduationCap,
  portfolio: UserRound,
  business: Briefcase,
  restaurant: UtensilsCrossed,
  gym: Dumbbell,
  real_estate: Building2,
  hospital: Stethoscope,
  agency: Megaphone,
  hotel_travel: Hotel,
  landing: Rocket,
  photography: Camera,
  ngo: HandHeart,
  interior: Sofa,
  construction: HardHat,
  news: Newspaper,
  ecommerce: ShoppingBag
};

/** "Hotel / Travel" -> "Hotel" (chhote chips ke liye) */
export const shortLabel = (key: string) => getSiteType(key).label.split(" /")[0].replace(" Institute", "").replace(" Company", "").replace(" Agency", "");

/** Hero ke browser frame me ghoomne wale live demos */
export const HERO_DEMOS = ["shopfront", "saffron", "classic", "herald", "iron", "prime"].filter((k) => TEMPLATES.some((t) => t.key === k));
const ROTATING = ["schools", "restaurants", "online stores", "clinics", "news portals", "gyms", "agencies", "hotels"];

export const FAQS: [string, string][] = [
  ["Do I need to know coding?", "Not at all. You get a simple admin panel — add pages, photos, products or news like filling a form. Switch the whole design in one click."],
  ["Can I use my own domain?", `Yes. You get a free address like yourname.${BASE_DOMAIN}, or connect www.yourbusiness.com — the SSL (https) certificate is set up automatically.`],
  ["Can I sell online and take payments?", "Yes. The Online Store type has products with sizes / colours, cart, coupons, GST, shipping, Cash on Delivery and Razorpay (UPI, cards, netbanking)."],
  ["Will it show on Google?", "Every page has proper titles and descriptions, a sitemap, robots.txt, share previews for WhatsApp / Facebook and Google Analytics support."],
  ["Can I change the template later?", "Anytime. Your content stays — only the design changes. You can even make your own custom template with your colours and fonts."],
  ["Is my data safe?", "Each website has its own separate database, logins are protected against password guessing, and every change is recorded in the activity log."]
];

/** Section par smooth scroll — URL me "#..." nahi aata */
export function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - (id === "top" ? 0 : 72);
  window.scrollTo({ top, behavior: "smooth" });
}

function ScrollLink({ to, className, children, onClick }: { to: string; className?: string; children: ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        onClick?.();
        scrollToSection(to);
      }}
    >
      {children}
    </button>
  );
}

function Logo() {
  return (
    <span className="flex items-center gap-2.5 font-bold text-white">
      <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-400 shadow-lg shadow-indigo-500/30">
        <LayoutTemplate className="h-[18px] w-[18px]" />
      </span>
      <span className="text-lg tracking-tight">{PRODUCT_NAME}</span>
    </span>
  );
}

/** Gradient border wala glass card */
function Glass({ className = "", children }: { className?: string; children: ReactNode }) {
  return (
    <div className={`relative rounded-3xl bg-gradient-to-b from-white/15 to-white/5 p-px ${className}`}>
      <div className="h-full rounded-[23px] bg-slate-900/80 backdrop-blur-xl">{children}</div>
    </div>
  );
}

function BrowserBar({ host }: { host: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-white/10 bg-slate-900/90 px-4 py-2.5">
      <span className="flex gap-1.5">
        <span className="h-3 w-3 rounded-full bg-rose-400/80" />
        <span className="h-3 w-3 rounded-full bg-amber-400/80" />
        <span className="h-3 w-3 rounded-full bg-emerald-400/80" />
      </span>
      <span className="mx-auto flex min-w-0 items-center gap-1.5 truncate rounded-md bg-white/5 px-3 py-1 text-xs text-slate-400">
        <Lock className="h-3 w-3 shrink-0 text-emerald-400" /> {host}
      </span>
    </div>
  );
}

// ------------------------------------------------------------ nav

function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 20);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  const links = [
    ["Showcase", "showcase"],
    ["Features", "features"],
    ["Online Store", "store"],
    ["How it works", "how"],
    ["FAQ", "faq"]
  ];
  return (
    <header className={`fixed inset-x-0 top-0 z-40 transition-all duration-300 ${scrolled ? "border-b border-white/10 bg-slate-950/80 backdrop-blur-xl" : "bg-transparent"}`}>
      <div className="mx-auto flex h-[72px] max-w-7xl items-center gap-8 px-4 sm:px-6">
        <ScrollLink to="top">
          <Logo />
        </ScrollLink>
        <nav className="hidden flex-1 justify-center gap-1 text-sm text-slate-300 lg:flex" aria-label="Main">
          {links.map(([l, h]) => (
            <ScrollLink key={h} to={h} className="rounded-full px-4 py-2 transition hover:bg-white/10 hover:text-white">
              {l}
            </ScrollLink>
          ))}
        </nav>
        <div className="ml-auto hidden items-center gap-2 lg:ml-0 lg:flex">
          <a href="/admin" className="rounded-full px-4 py-2 text-sm font-medium text-slate-200 transition hover:text-white">
            Admin login
          </a>
          <ScrollLink to="contact" className="inline-flex items-center gap-1.5 rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-900 shadow-lg shadow-white/10 transition hover:bg-indigo-50">
            Get started <ArrowRight className="h-4 w-4" />
          </ScrollLink>
        </div>
        <button aria-label="Menu" className="ml-auto rounded-lg p-2 text-white lg:hidden" onClick={() => setOpen(!open)}>
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-white/10 bg-slate-950/95 backdrop-blur lg:hidden">
            <div className="space-y-1 px-4 py-4">
              {links.map(([l, h]) => (
                <ScrollLink key={h} to={h} onClick={() => setOpen(false)} className="block w-full rounded-lg px-3 py-2.5 text-left text-slate-200 hover:bg-white/10">
                  {l}
                </ScrollLink>
              ))}
              <a href="/admin" className="block rounded-lg px-3 py-2.5 text-slate-200 hover:bg-white/10">
                Admin login
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

// ------------------------------------------------------------ hero

function RotatingWord() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % ROTATING.length), 2200);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="relative block h-[1.25em] overflow-hidden whitespace-nowrap" aria-live="polite">
      <AnimatePresence mode="wait">
        <motion.span
          key={ROTATING[i]}
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "-100%", opacity: 0 }}
          transition={{ duration: 0.45, ease: EASE }}
          className="absolute left-0 top-0 bg-gradient-to-r from-indigo-300 via-violet-300 to-cyan-300 bg-clip-text pb-[0.1em] text-transparent"
        >
          {ROTATING[i]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function FloatCard({ className, icon, title, text, delay }: { className: string; icon: ReactNode; title: string; text: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: [0, -8, 0], scale: 1 }}
      transition={{ opacity: { delay, duration: 0.5 }, scale: { delay, duration: 0.5 }, y: { delay: delay + 0.5, duration: 5, repeat: Infinity, ease: "easeInOut" } }}
      className={`absolute z-20 hidden items-center gap-3 rounded-2xl border border-white/60 bg-white/95 px-4 py-3 shadow-2xl shadow-indigo-950/40 backdrop-blur sm:flex ${className}`}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 text-white">{icon}</span>
      <span>
        <span className="block text-sm font-semibold text-slate-900">{title}</span>
        <span className="block text-xs text-slate-500">{text}</span>
      </span>
    </motion.div>
  );
}

/** Browser frame: asli templates ke live demos, apne aap badalte */
function HeroShowcase() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActive((x) => (x + 1) % HERO_DEMOS.length), 4500);
    return () => clearInterval(t);
  }, []);
  const tpl = TEMPLATES.find((t) => t.key === HERO_DEMOS[active])!;
  return (
    <div className="relative">
      <motion.div
        className="absolute -inset-8 rounded-[2.5rem] bg-gradient-to-tr from-indigo-500/40 via-violet-500/25 to-cyan-400/40 blur-3xl"
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 6, repeat: Infinity }}
      />
      <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-slate-900 shadow-2xl shadow-black/60">
        <BrowserBar host={`${shortLabel(tpl.type).toLowerCase().replace(/\s+/g, "")}.${BASE_DOMAIN}`} />
        <div className="relative aspect-[16/11] bg-white">
          {HERO_DEMOS.map((key, i) => (
            <motion.div key={key} className="absolute inset-0" initial={false} animate={{ opacity: i === active ? 1 : 0 }} transition={{ duration: 0.35 }} aria-hidden={i !== active}>
              <LivePreview src={`/preview/${key}`} />
            </motion.div>
          ))}
        </div>
      </div>
      <div className="relative mt-4 flex flex-wrap justify-center gap-2">
        {HERO_DEMOS.map((key, i) => {
          const t = TEMPLATES.find((x) => x.key === key)!;
          const Icon = TYPE_ICONS[t.type] ?? Globe;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActive(i)}
              aria-pressed={i === active}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${i === active ? "bg-white text-slate-900 shadow-lg shadow-white/20" : "bg-white/5 text-slate-300 ring-1 ring-white/10 hover:bg-white/10"}`}
            >
              <Icon className="h-3.5 w-3.5" /> {shortLabel(t.type)}
            </button>
          );
        })}
      </div>
      <FloatCard className="-left-8 top-16" icon={<BadgeIndianRupee className="h-5 w-5" />} title="New order · ₹3,997" text="Paid via UPI · just now" delay={0.9} />
      <FloatCard className="-right-6 top-1/2" icon={<Mail className="h-5 w-5" />} title="New enquiry" text="“Is admission open?”" delay={1.3} />
      <FloatCard className="bottom-24 left-6" icon={<Search className="h-5 w-5" />} title="Google ready" text="Sitemap · SEO · share preview" delay={1.7} />
    </div>
  );
}

function Hero() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 600], [0, 60]);
  return (
    <section id="top" className="relative overflow-hidden bg-slate-950 pb-24 pt-32 text-white sm:pt-40">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" />
      <motion.div className="pointer-events-none absolute -left-40 -top-20 h-[560px] w-[560px] rounded-full bg-indigo-600/30 blur-3xl" animate={{ x: [0, 60, 0], y: [0, 30, 0] }} transition={{ duration: 14, repeat: Infinity }} />
      <motion.div className="pointer-events-none absolute -right-40 top-40 h-[560px] w-[560px] rounded-full bg-cyan-500/20 blur-3xl" animate={{ x: [0, -60, 0], y: [0, -30, 0] }} transition={{ duration: 16, repeat: Infinity }} />
      <motion.div className="pointer-events-none absolute left-1/2 top-1/2 h-[400px] w-[400px] rounded-full bg-violet-600/20 blur-3xl" animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 10, repeat: Infinity }} />

      <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <motion.div initial="hidden" animate="show" variants={stagger}>
          <motion.span variants={fadeUp} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-slate-300 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" /> Designer templates · One-click setup · Live the same day
          </motion.span>
          <motion.h1 variants={fadeUp} className="mt-6 text-[2.6rem] font-extrabold leading-[1.08] tracking-tight sm:text-6xl xl:text-7xl">
            Beautiful websites for
            <RotatingWord />
          </motion.h1>
          <motion.p variants={fadeUp} className="mt-6 max-w-xl text-lg leading-relaxed text-slate-300">
            Pick a design made for your business, import demo content in one click, and manage everything — pages, products, orders, news and enquiries — from one simple admin panel.
          </motion.p>
          <motion.div variants={fadeUp} className="mt-9 flex flex-wrap gap-3">
            <ScrollLink to="contact" className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-400 px-7 py-3.5 font-semibold text-white shadow-xl shadow-indigo-500/30 transition hover:shadow-indigo-500/50">
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              Get your website <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </ScrollLink>
            <ScrollLink to="showcase" className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-7 py-3.5 font-semibold text-white backdrop-blur transition hover:bg-white/10">
              <MousePointerClick className="h-4 w-4" /> Try live demos
            </ScrollLink>
          </motion.div>
          <motion.ul variants={fadeUp} className="mt-10 grid max-w-lg grid-cols-2 gap-x-6 gap-y-3 text-sm text-slate-300">
            {["No coding needed", "Free subdomain + your domain", "UPI, cards & Cash on Delivery", "Google & WhatsApp ready"].map((x) => (
              <li key={x} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" /> {x}
              </li>
            ))}
          </motion.ul>
        </motion.div>
        <motion.div style={{ y }} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.2 }}>
          <HeroShowcase />
        </motion.div>
      </div>
    </section>
  );
}

// ------------------------------------------------------------ industries marquee

function Industries() {
  const items = [...SITE_TYPES, ...SITE_TYPES];
  return (
    <section className="border-b border-white/10 bg-slate-950 py-8" aria-label="Industries">
      <p className="mb-5 text-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Made for every kind of business</p>
      <div className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]">
        <motion.div className="flex w-max gap-3" animate={{ x: ["0%", "-50%"] }} transition={{ duration: 45, repeat: Infinity, ease: "linear" }}>
          {items.map((t, i) => {
            const Icon = TYPE_ICONS[t.key] ?? Globe;
            return (
              <span key={`${t.key}-${i}`} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200">
                <Icon className="h-4 w-4 text-cyan-300" /> {t.label}
              </span>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

// ------------------------------------------------------------ showcase (industry -> bada live demo + designs + desktop/mobile)

function Showcase() {
  const [type, setType] = useState<string>("ecommerce");
  const list = templatesFor(type);
  const [tplKey, setTplKey] = useState(list[0]?.key);
  const [mobile, setMobile] = useState(false);
  const tpl = TEMPLATES.find((t) => t.key === tplKey) ?? list[0];
  const st = getSiteType(type);

  const pick = (k: string) => {
    setType(k);
    setTplKey(templatesFor(k)[0]?.key);
  };

  return (
    <section id="showcase" className="relative overflow-hidden bg-slate-950 py-28 text-white">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-indigo-600/15 blur-3xl" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHead light eyebrow="Live showcase" title="Pick your industry. See it live." text="Real pages, real animations, filled with sample content. Switch designs — your content stays exactly where it is." />

        <div className="mt-12 flex flex-wrap justify-center gap-2" role="tablist" aria-label="Industry">
          {SITE_TYPES.map((x) => {
            const Icon = TYPE_ICONS[x.key] ?? Globe;
            const on = type === x.key;
            return (
              <button
                key={x.key}
                role="tab"
                aria-selected={on}
                onClick={() => pick(x.key)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${on ? "bg-white text-slate-900 shadow-lg shadow-white/20" : "bg-white/5 text-slate-300 ring-1 ring-white/10 hover:bg-white/10 hover:text-white"}`}
              >
                <Icon className="h-4 w-4" /> {x.label}
              </button>
            );
          })}
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          {/* bada preview */}
          <motion.div key={tpl?.key + (mobile ? "m" : "d")} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }} className="relative">
            <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-tr from-indigo-500/25 via-violet-500/15 to-cyan-400/25 blur-2xl" />
            <div className={`relative mx-auto overflow-hidden border border-white/15 bg-slate-900 shadow-2xl shadow-black/60 ${mobile ? "w-full max-w-[300px] rounded-[2.2rem] p-2.5" : "rounded-2xl"}`}>
              {mobile ? (
                <>
                  <div className="mx-auto mb-2 h-1.5 w-20 rounded-full bg-white/20" />
                  <div className="overflow-hidden rounded-[1.6rem] bg-white">
                    <LivePreview src={`/preview/${tpl?.key}`} mobile />
                  </div>
                </>
              ) : (
                <>
                  <BrowserBar host={`www.your${shortLabel(type).toLowerCase().replace(/\s+/g, "")}.com`} />
                  <div className="bg-white">
                    <LivePreview src={`/preview/${tpl?.key}`} />
                  </div>
                </>
              )}
            </div>
          </motion.div>

          {/* side panel */}
          <div className="space-y-4">
            <Glass>
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Designs for {shortLabel(type)}</span>
                  <span className="inline-flex rounded-lg bg-white/5 p-0.5 ring-1 ring-white/10" role="group" aria-label="Device">
                    <button type="button" aria-label="Desktop view" aria-pressed={!mobile} onClick={() => setMobile(false)} className={`rounded-md p-1.5 transition ${!mobile ? "bg-white text-slate-900" : "text-slate-400 hover:text-white"}`}>
                      <Monitor className="h-4 w-4" />
                    </button>
                    <button type="button" aria-label="Mobile view" aria-pressed={mobile} onClick={() => setMobile(true)} className={`rounded-md p-1.5 transition ${mobile ? "bg-white text-slate-900" : "text-slate-400 hover:text-white"}`}>
                      <Smartphone className="h-4 w-4" />
                    </button>
                  </span>
                </div>
                <div className="mt-4 space-y-2">
                  {list.map((t) => {
                    const on = t.key === tpl?.key;
                    return (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() => setTplKey(t.key)}
                        aria-pressed={on}
                        className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left transition ${on ? "bg-white text-slate-900 shadow-lg" : "bg-white/5 text-slate-200 hover:bg-white/10"}`}
                      >
                        <span className="h-10 w-14 shrink-0 rounded-lg ring-1 ring-black/10" style={{ background: `linear-gradient(135deg, ${t.colors.primary}, ${t.colors.accent})` }} />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2 text-sm font-semibold">
                            {t.name}
                            {t.dark && <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${on ? "bg-slate-900 text-white" : "bg-white/10 text-slate-300"}`}>DARK</span>}
                          </span>
                          <span className={`block truncate text-xs ${on ? "text-slate-500" : "text-slate-400"}`}>{t.description}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
                <a href={`/preview/${tpl?.key}`} target="_blank" rel="noreferrer" className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-400 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:shadow-indigo-500/50">
                  Open full demo <ArrowUpRight className="h-4 w-4" />
                </a>
              </div>
            </Glass>
            <Glass>
              <div className="p-5">
                <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Comes with</span>
                <p className="mt-2 text-sm text-slate-300">{st.description}</p>
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {st.nav
                    .filter((n) => n.href !== "/")
                    .map((n) => (
                      <li key={n.href} className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-slate-200 ring-1 ring-white/10">
                        {n.title}
                      </li>
                    ))}
                  <li className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-slate-200 ring-1 ring-white/10">Admin panel</li>
                </ul>
              </div>
            </Glass>
          </div>
        </div>
      </div>
    </section>
  );
}

// ------------------------------------------------------------ features (bento)

function Bento({ className = "", icon, title, text, children, tone = "indigo" }: { className?: string; icon: ReactNode; title: string; text: string; children?: ReactNode; tone?: "indigo" | "emerald" | "amber" | "rose" | "cyan" | "violet" }) {
  const tones = {
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600",
    cyan: "bg-cyan-50 text-cyan-600",
    violet: "bg-violet-50 text-violet-600"
  };
  return (
    <motion.div variants={fadeUp} whileHover={{ y: -6 }} className={`group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition hover:shadow-xl ${className}`}>
      <span className={`inline-flex rounded-2xl p-3 ${tones[tone]}`}>{icon}</span>
      <h3 className="mt-5 text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-500">{text}</p>
      {children}
    </motion.div>
  );
}

function Features() {
  return (
    <section id="features" className="bg-slate-50 py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHead eyebrow="Features" title="Everything your website needs" text="Every module comes ready in your admin panel — just fill in your content. No plugins, no coding, no headaches." />
        <motion.div {...reveal} variants={stagger} className="mt-16 grid gap-5 md:grid-cols-2 lg:grid-cols-6">
          <Bento className="lg:col-span-4" icon={<LayoutTemplate className="h-6 w-6" />} title="A design for every industry" text="Schools, restaurants, gyms, clinics, real estate, agencies, news portals, online stores and more — each with its own layout, colours and fonts. Switch anytime, your content stays.">
            <div className="mt-6 flex gap-2 overflow-hidden [mask-image:linear-gradient(90deg,#000_70%,transparent)]">
              {TEMPLATES.slice(0, 10).map((t) => (
                <span key={t.key} className="h-16 w-24 shrink-0 rounded-xl ring-1 ring-black/5" style={{ background: `linear-gradient(135deg, ${t.colors.primary}, ${t.colors.accent})` }} />
              ))}
            </div>
          </Bento>
          <Bento className="lg:col-span-2" tone="violet" icon={<Wand2 className="h-6 w-6" />} title="One-click demo content" text="Like WordPress — import sample text, photos and menus, then just replace with yours. Remove demo anytime." />
          <Bento className="lg:col-span-2" tone="emerald" icon={<ShoppingBag className="h-6 w-6" />} title="Online store built in" text="Products with sizes & colours, cart, coupons, GST, shipping, COD and Razorpay — plus orders, invoices and customers." />
          <Bento className="lg:col-span-2" tone="amber" icon={<Search className="h-6 w-6" />} title="Google & social ready" text="SEO titles, sitemap, robots.txt, Google Analytics and beautiful link previews on WhatsApp & Facebook." />
          <Bento className="lg:col-span-2" tone="rose" icon={<MessageCircle className="h-6 w-6" />} title="Leads on autopilot" text="Contact form with spam protection, newsletter sign-ups, WhatsApp chat button and email alerts for every enquiry." />
          <Bento className="lg:col-span-3" tone="cyan" icon={<Globe className="h-6 w-6" />} title="Your own domain, secure" text={`Start free on yourname.${BASE_DOMAIN} or connect www.yourbusiness.com — https is set up automatically.`}>
            <div className="mt-5 space-y-2 font-mono text-xs">
              <div className="rounded-lg bg-slate-50 px-3 py-2 text-indigo-600 ring-1 ring-slate-200">yourschool.{BASE_DOMAIN}</div>
              <div className="rounded-lg bg-slate-50 px-3 py-2 text-slate-600 ring-1 ring-slate-200">www.yourschool.com</div>
            </div>
          </Bento>
          <Bento className="lg:col-span-3" icon={<Users className="h-6 w-6" />} title="Built for teams" text="Admin & Editor roles, activity log of every change, bulk actions, drag & drop ordering, notifications and dark mode.">
            <div className="mt-5 flex flex-wrap gap-2">
              {[
                [Bell, "Notifications"],
                [Moon, "Dark mode"],
                [ShieldCheck, "Secure login"],
                [Zap, "Bulk actions"]
              ].map(([Icon, label]) => {
                const I = Icon as typeof Bell;
                return (
                  <span key={label as string} className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                    <I className="h-3.5 w-3.5" /> {label as string}
                  </span>
                );
              })}
            </div>
          </Bento>
        </motion.div>
      </div>
    </section>
  );
}

function SectionHead({ eyebrow, title, text, light = false }: { eyebrow: string; title: string; text?: string; light?: boolean }) {
  return (
    <motion.div {...reveal} variants={fadeUp} className="mx-auto max-w-2xl text-center">
      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest ${light ? "bg-white/10 text-indigo-200" : "bg-indigo-50 text-indigo-600"}`}>{eyebrow}</span>
      <h2 className={`mt-4 text-3xl font-extrabold tracking-tight sm:text-5xl ${light ? "text-white" : "text-slate-900"}`}>{title}</h2>
      {text && <p className={`mt-4 text-lg ${light ? "text-slate-300" : "text-slate-500"}`}>{text}</p>}
    </motion.div>
  );
}

// ------------------------------------------------------------ store + admin showcase

function StoreShowcase() {
  return (
    <section id="store" className="relative overflow-hidden bg-white py-28">
      <div className="pointer-events-none absolute -right-40 top-0 h-[480px] w-[480px] rounded-full bg-violet-200/50 blur-3xl" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-4 sm:px-6 lg:grid-cols-2">
        <motion.div {...reveal} variants={stagger}>
          <motion.span variants={fadeUp} className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-indigo-600">
            Online store & admin
          </motion.span>
          <motion.h2 variants={fadeUp} className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            Sell online. Manage everything from one dashboard.
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-5 text-lg text-slate-500">
            Orders, payments, stock, customers, reviews and invoices — and for every other site, your pages, news, gallery and enquiries. Your team will actually enjoy using it.
          </motion.p>
          <motion.ul variants={stagger} className="mt-8 grid gap-4 sm:grid-cols-2">
            {[
              [BadgeIndianRupee, "Razorpay + Cash on Delivery", "UPI, cards, netbanking. Auto refunds on cancel."],
              [ShoppingBag, "Products with variants", "Sizes, colours, stock per variant, low-stock alerts."],
              [Palette, "Coupons, GST & shipping", "Percent / flat coupons, GST invoices, free shipping limits."],
              [Bell, "Never miss an order", "Email alerts, notifications bell, order tracking for customers."]
            ].map(([Icon, title, text]) => {
              const I = Icon as typeof Bell;
              return (
                <motion.li key={title as string} variants={fadeUp} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <I className="h-6 w-6 text-indigo-600" />
                  <div className="mt-3 font-semibold text-slate-900">{title as string}</div>
                  <div className="mt-1 text-sm text-slate-500">{text as string}</div>
                </motion.li>
              );
            })}
          </motion.ul>
        </motion.div>

        {/* chhota admin mock */}
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="relative">
          <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-tr from-indigo-500/20 via-violet-500/10 to-cyan-400/20 blur-2xl" />
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 shadow-2xl shadow-indigo-900/20">
            <div className="flex">
              <div className="hidden w-40 shrink-0 space-y-2 border-r border-white/10 bg-slate-950 p-4 sm:block">
                <div className="mb-4 h-6 w-24 rounded bg-gradient-to-r from-indigo-500 to-cyan-400" />
                {["Dashboard", "Orders", "Products", "Customers", "Reviews", "Settings"].map((x, i) => (
                  <div key={x} className={`rounded-lg px-2 py-1.5 text-xs ${i === 1 ? "bg-white/10 text-white" : "text-slate-500"}`}>
                    {x}
                  </div>
                ))}
              </div>
              <div className="min-w-0 flex-1 space-y-4 bg-slate-50 p-5 text-slate-900">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    ["Today", "₹18,450"],
                    ["Orders", "42"],
                    ["To ship", "7"]
                  ].map(([l, v]) => (
                    <div key={l} className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
                      <div className="text-[11px] text-slate-500">{l}</div>
                      <div className="mt-1 text-lg font-bold">{v}</div>
                    </div>
                  ))}
                </div>
                <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
                  {[
                    ["#ORD100042", "Ritika S.", "₹2,499", "Paid", "bg-emerald-100 text-emerald-700"],
                    ["#ORD100041", "Arjun N.", "₹3,997", "COD", "bg-amber-100 text-amber-700"],
                    ["#ORD100040", "Sneha P.", "₹649", "Shipped", "bg-sky-100 text-sky-700"],
                    ["#ORD100039", "Imran K.", "₹1,899", "Delivered", "bg-violet-100 text-violet-700"]
                  ].map(([no, name, amt, st, cls], i) => (
                    <motion.div
                      key={no}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + i * 0.12 }}
                      className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 text-xs last:border-0"
                    >
                      <span className="font-semibold text-indigo-600">{no}</span>
                      <span className="flex-1 text-slate-600">{name}</span>
                      <span className="font-semibold">{amt}</span>
                      <span className={`rounded-full px-2 py-0.5 font-medium ${cls}`}>{st}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.9 }}
            className="absolute -bottom-6 -left-4 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-slate-900 shadow-2xl ring-1 ring-slate-200 sm:-left-8"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white">
              <CheckCircle2 className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-semibold">Payment received</span>
              <span className="block text-xs text-slate-500">₹2,499 via UPI</span>
            </span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ------------------------------------------------------------ how + faq + cta

const STEPS = [
  { icon: Globe, title: "Get your address", text: `We create yourname.${BASE_DOMAIN} — or connect your own domain like www.yourbusiness.com.` },
  { icon: Palette, title: "Pick a design", text: "Choose a template made for your industry and import demo content in one click." },
  { icon: Rocket, title: "Add your content & go live", text: "Replace the demo text and photos from your admin panel. Your website is live instantly." }
];

function How() {
  return (
    <section id="how" className="bg-slate-50 py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHead eyebrow="How it works" title="From idea to live — the same day" text="No developer, no waiting weeks. Pick, fill, publish." />
        <motion.div {...reveal} variants={stagger} className="relative mt-16 grid gap-8 md:grid-cols-3">
          <div className="pointer-events-none absolute left-[16%] right-[16%] top-10 hidden h-px bg-gradient-to-r from-indigo-200 via-violet-300 to-cyan-200 md:block" />
          {STEPS.map((s) => (
            <motion.div key={s.title} variants={fadeUp} className="relative text-center">
              <span className="relative z-10 mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-400 text-white shadow-xl shadow-indigo-500/30">
                <s.icon className="h-8 w-8" />
              </span>
              <h3 className="mt-6 text-lg font-semibold text-slate-900">{s.title}</h3>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-slate-500">{s.text}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="bg-white py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <SectionHead eyebrow="FAQ" title="Questions? Answers." />
        <motion.div {...reveal} variants={stagger} className="mt-12 space-y-3">
          {FAQS.map(([q, a], i) => (
            <motion.div key={q} variants={fadeUp} className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
              <button type="button" onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i} className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left font-semibold text-slate-900">
                {q}
                <ChevronDown className={`h-5 w-5 shrink-0 text-slate-400 transition ${open === i ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <p className="px-6 pb-5 text-slate-600">{a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function Contact() {
  const body = encodeURIComponent("Hi,\n\nI'd like a website.\n\nBusiness name:\nType (school / restaurant / store …):\nPhone:\n");
  return (
    <section id="contact" className="bg-white px-4 pb-24 sm:px-6">
      <motion.div
        {...reveal}
        variants={fadeUp}
        className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-600 via-violet-600 to-cyan-500 px-6 py-16 text-center text-white shadow-2xl shadow-indigo-500/30 sm:px-16"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.25),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.15),transparent_40%)]" />
        <div className="relative">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl">Ready to launch your website?</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-indigo-50">Tell us your business name — we will set up your website and admin login, usually the same day.</p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <a href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("New website request")}&body=${body}`} className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 font-semibold text-slate-900 shadow-xl transition hover:bg-indigo-50">
              <Mail className="h-4 w-4" /> {CONTACT_EMAIL}
            </a>
            <ScrollLink to="showcase" className="inline-flex items-center gap-2 rounded-full border border-white/40 px-7 py-3.5 font-semibold text-white transition hover:bg-white/10">
              Browse designs <ArrowRight className="h-4 w-4" />
            </ScrollLink>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-slate-950 pt-16 text-slate-400">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 md:grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,1fr))]">
        <div>
          <Logo />
          <p className="mt-4 max-w-sm text-sm leading-relaxed">Beautiful, fast websites with an easy admin panel — for schools, businesses, stores, news portals and more.</p>
        </div>
        <div>
          <div className="mb-3 text-sm font-semibold text-white">Product</div>
          <ul className="space-y-2 text-sm">
            {[
              ["Showcase", "showcase"],
              ["Features", "features"],
              ["Online Store", "store"],
              ["FAQ", "faq"]
            ].map(([l, h]) => (
              <li key={h}>
                <ScrollLink to={h} className="hover:text-white">
                  {l}
                </ScrollLink>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="mb-3 text-sm font-semibold text-white">Popular demos</div>
          <ul className="space-y-2 text-sm">
            {HERO_DEMOS.slice(0, 4).map((k) => {
              const t = TEMPLATES.find((x) => x.key === k)!;
              return (
                <li key={k}>
                  <a href={`/preview/${k}`} target="_blank" rel="noreferrer" className="hover:text-white">
                    {t.name} · {shortLabel(t.type)}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
        <div>
          <div className="mb-3 text-sm font-semibold text-white">Contact</div>
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-sm hover:text-white">
            {CONTACT_EMAIL}
          </a>
          <div className="mt-3">
            <a href="/admin" className="text-sm hover:text-white">
              Admin login
            </a>
          </div>
        </div>
      </div>
      <div className="mt-14 border-t border-white/10 py-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} {PRODUCT_NAME}. All rights reserved.
      </div>
    </footer>
  );
}

export default function MarketingApp() {
  useEffect(() => {
    document.title = `${PRODUCT_NAME} — Beautiful websites for every business`;
    // live demo frames me template ka welcome popup na aaye
    try {
      sessionStorage.setItem("wm_popup_closed", "1");
    } catch {
      // ignore
    }
  }, []);
  return (
    <div className="min-h-screen overflow-x-hidden font-sans">
      <Nav />
      <Hero />
      <Industries />
      <Showcase />
      <Features />
      <StoreShowcase />
      <How />
      <Faq />
      <Contact />
      <Footer />
    </div>
  );
}
