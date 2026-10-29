import { useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  FileText,
  Globe,
  Image,
  LayoutTemplate,
  Lock,
  Mail,
  Menu,
  MonitorSmartphone,
  Newspaper,
  Palette,
  ShieldCheck,
  Users,
  Video,
  X
} from "lucide-react";
import { BASE_DOMAIN } from "../lib/tenant";
import { TEMPLATES, TemplateConfig, templatesFor } from "../site/templates";
import { getSiteType, SITE_TYPES } from "../site/siteTypes";
import { LivePreview } from "../pages/TemplatesPage";

export const PRODUCT_NAME = import.meta.env.VITE_PRODUCT_NAME || "Website Manager";
const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL || "hello@" + (BASE_DOMAIN === "localhost" ? "example.com" : BASE_DOMAIN);

const fadeUp = { hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.6 } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const reveal = { initial: "hidden", whileInView: "show", viewport: { once: true, margin: "-80px" } } as const;

export const FEATURES = [
  { icon: LayoutTemplate, title: `${TEMPLATES.length} Industry Templates`, text: "Restaurants, gyms, clinics, real estate, agencies, schools and more — each with its own look." },
  { icon: BookOpen, title: "One-click Demo Content", text: "Import sample text and photos like WordPress, then just replace with yours." },
  { icon: Image, title: "Sliders & Gallery", text: "Home page banners, photo albums with categories and a lightbox." },
  { icon: FileText, title: "Menus, Properties, Plans", text: "Menu cards with prices, property listings, membership plans, doctors and courses." },
  { icon: Newspaper, title: "Blogs & Pages", text: "Unlimited pages with a rich text editor, nested menus and SEO friendly URLs." },
  { icon: Video, title: "Videos & Testimonials", text: "YouTube galleries, reviews, FAQs, counters and client logos." },
  { icon: Globe, title: "Your Own Domain", text: "Free subdomain or connect www.yourbusiness.com with automatic SSL." },
  { icon: Users, title: "Roles & Logs", text: "Admin / Editor roles, a full activity log and one-click website reset." },
  { icon: ShieldCheck, title: "Secure by default", text: "JWT login, lockout on wrong passwords, sanitised content." }
];

const STEPS = [
  { icon: Globe, title: "Get your address", text: `We create yourschool.${BASE_DOMAIN} — or connect your own domain like www.yourschool.com.` },
  { icon: Lock, title: "Log in to /admin", text: "Your own admin panel with every menu ready. Add sliders, pages, gallery and news." },
  { icon: Palette, title: "Pick a template", text: "Choose from 3+ designs made for your industry, import demo content in one click, switch anytime." }
];

/** Template ka chhota animated mockup (marketing cards ke liye, bina iframe) */
export function TemplateMock({ t }: { t: TemplateConfig }) {
  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-black/5" style={{ fontFamily: t.fonts.body }}>
      <div className="flex items-center gap-2 px-3 py-2" style={{ background: t.nav === "light" ? "#fff" : t.colors.primary }}>
        <span className="h-3 w-3 rounded-full" style={{ background: t.colors.accent }} />
        <span className="h-2 w-16 rounded" style={{ background: t.nav === "light" ? t.colors.text : "#ffffff", opacity: 0.8 }} />
        <span className="ml-auto flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-1.5 w-6 rounded" style={{ background: t.nav === "light" ? t.colors.muted : "#ffffff", opacity: 0.6 }} />
          ))}
        </span>
      </div>
      <div className="relative h-24 overflow-hidden" style={{ background: t.hero === "minimal" ? t.colors.bg : `linear-gradient(135deg, ${t.colors.primary}, ${t.colors.accent})` }}>
        <motion.div className="absolute left-4 top-6 h-3 w-32 rounded" style={{ background: t.hero === "minimal" ? t.colors.text : "#fff" }} animate={{ width: [80, 128, 80] }} transition={{ duration: 4, repeat: Infinity }} />
        <div className="absolute left-4 top-12 h-2 w-24 rounded opacity-60" style={{ background: t.hero === "minimal" ? t.colors.muted : "#fff" }} />
        <div className="absolute bottom-4 left-4 h-4 w-14 rounded-full" style={{ background: t.colors.accent }} />
      </div>
      <div className="grid grid-cols-3 gap-2 p-3" style={{ background: t.colors.bg }}>
        {[0, 1, 2].map((i) => (
          <div key={i} className={`overflow-hidden bg-white ${t.radius === "rounded-none" ? "" : "rounded-md"} ring-1 ring-black/5`}>
            <div className="h-8" style={{ background: i === 1 ? t.colors.accent : t.colors.primary, opacity: 0.85 }} />
            <div className="space-y-1 p-1.5">
              <div className="h-1.5 w-full rounded bg-slate-200" />
              <div className="h-1.5 w-2/3 rounded bg-slate-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Section par smooth scroll — URL me "#..." nahi aata */
export function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - (id === "top" ? 0 : 64);
  window.scrollTo({ top, behavior: "smooth" });
}

function ScrollLink({ to, className, children, onClick }: { to: string; className?: string; children: React.ReactNode; onClick?: () => void }) {
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

function Nav() {
  const [open, setOpen] = useState(false);
  const links = [
    ["Features", "features"],
    ["Templates", "templates"],
    ["How it works", "how"],
    ["Contact", "contact"]
  ];
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-slate-950/70 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4">
        <ScrollLink to="top" className="flex items-center gap-2 font-bold text-white">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400">
            <LayoutTemplate className="h-4 w-4" />
          </span>
          {PRODUCT_NAME}
        </ScrollLink>
        <nav className="ml-auto hidden gap-6 text-sm text-slate-300 md:flex">
          {links.map(([l, h]) => (
            <ScrollLink key={h} to={h} className="hover:text-white">{l}</ScrollLink>
          ))}
        </nav>
        <a href="/admin" className="hidden rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-slate-900 hover:bg-slate-200 md:inline-block">
          Admin login
        </a>
        <button aria-label="Menu" className="ml-auto text-white md:hidden" onClick={() => setOpen(!open)}>
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      {open && (
        <div className="space-y-1 border-t border-white/10 px-4 py-3 md:hidden">
          {links.map(([l, h]) => (
            <ScrollLink key={h} to={h} onClick={() => setOpen(false)} className="block w-full py-2 text-left text-slate-200">{l}</ScrollLink>
          ))}
          <a href="/admin" className="block py-2 text-slate-200">Admin login</a>
        </div>
      )}
    </header>
  );
}

function Hero() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 80]);
  return (
    <section id="top" className="relative overflow-hidden bg-slate-950 pb-24 pt-36 text-white">
      <motion.div className="absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-indigo-600/30 blur-3xl" animate={{ x: [0, 60, 0] }} transition={{ duration: 14, repeat: Infinity }} />
      <motion.div className="absolute -right-40 bottom-0 h-[500px] w-[500px] rounded-full bg-cyan-500/20 blur-3xl" animate={{ x: [0, -60, 0] }} transition={{ duration: 16, repeat: Infinity }} />
      <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 lg:grid-cols-2">
        <motion.div initial="hidden" animate="show" variants={stagger}>
          <motion.span variants={fadeUp} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-slate-300">
            <MonitorSmartphone className="h-3.5 w-3.5" /> Schools, restaurants, gyms, clinics, agencies & more — ready in minutes
          </motion.span>
          <motion.h1 variants={fadeUp} className="mt-6 text-4xl font-extrabold leading-tight sm:text-6xl">
            Your website,{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-cyan-300 bg-clip-text text-transparent">managed in one place.</span>
          </motion.h1>
          <motion.p variants={fadeUp} className="mt-6 max-w-lg text-lg text-slate-300">
            Get a beautiful website on your own subdomain or domain, an easy admin panel for your team, and {TEMPLATES.length} designer templates across {SITE_TYPES.length} industries.
          </motion.p>
          <motion.div variants={fadeUp} className="mt-8 flex flex-wrap gap-3">
            <ScrollLink to="contact" className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 px-6 py-3 font-semibold text-white shadow-lg shadow-indigo-500/30">
              Get your website <ArrowRight className="h-4 w-4" />
            </ScrollLink>
            <ScrollLink to="templates" className="rounded-full border border-white/20 px-6 py-3 font-semibold text-white hover:bg-white/10">
              See templates
            </ScrollLink>
          </motion.div>
        </motion.div>
        <motion.div style={{ y }} className="relative h-[360px]">
          {TEMPLATES.slice(0, 3).map((t, i) => (
            <motion.div
              key={t.key}
              className="absolute w-[78%]"
              style={{ left: `${i * 11}%`, top: i * 52, zIndex: 3 - i }}
              initial={{ opacity: 0, y: 60, rotate: -6 + i * 6 }}
              animate={{ opacity: 1, y: 0, rotate: -4 + i * 4 }}
              transition={{ delay: 0.3 + i * 0.15, duration: 0.8 }}
              whileHover={{ rotate: 0, scale: 1.04, zIndex: 10 }}
            >
              <TemplateMock t={t} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="features" className="bg-white py-24">
      <div className="mx-auto max-w-6xl px-4">
        <motion.div {...reveal} variants={fadeUp} className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">Everything your website needs</h2>
          <p className="mt-3 text-slate-500">Every module comes ready in your admin panel — just fill in your content.</p>
        </motion.div>
        <motion.div {...reveal} variants={stagger} className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <motion.div key={f.title} variants={fadeUp} whileHover={{ y: -6 }} className="rounded-2xl border border-slate-200 p-6 transition hover:shadow-xl">
              <span className="inline-flex rounded-xl bg-indigo-50 p-3 text-indigo-600">
                <f.icon className="h-6 w-6" />
              </span>
              <h3 className="mt-4 font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{f.text}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function Templates() {
  const [type, setType] = useState<string>("restaurant");
  const list = templatesFor(type);
  return (
    <section id="templates" className="bg-slate-50 py-24">
      <div className="mx-auto max-w-6xl px-4">
        <motion.div {...reveal} variants={fadeUp} className="text-center">
          <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">{TEMPLATES.length} templates for {SITE_TYPES.length} kinds of websites</h2>
          <p className="mt-3 text-slate-500">Pick your industry, open a live demo, and switch designs any time — your content stays.</p>
        </motion.div>
        <div className="mt-10 flex flex-wrap justify-center gap-2">
          {SITE_TYPES.map((x) => (
            <button
              key={x.key}
              onClick={() => setType(x.key)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${type === x.key ? "bg-slate-900 text-white shadow-lg" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100"}`}
            >
              {x.label}
            </button>
          ))}
        </div>
        <p className="mt-6 text-center text-sm text-slate-500">{getSiteType(type).description}</p>
        <motion.div key={type} initial="hidden" animate="show" variants={stagger} className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {list.map((t) => (
            <motion.div key={t.key} variants={fadeUp} whileHover={{ y: -8 }} className="overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-slate-200">
              <a href={`/preview/${t.key}`} target="_blank" rel="noreferrer" className="block">
                <LivePreview src={`/preview/${t.key}`} />
              </a>
              <div className="flex items-start gap-3 p-4">
                <div className="flex gap-1 pt-1">
                  {[t.colors.primary, t.colors.accent].map((c) => (
                    <span key={c} className="h-4 w-4 rounded-full ring-1 ring-black/10" style={{ background: c }} />
                  ))}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-slate-900">{t.name}</div>
                  <p className="text-sm text-slate-500">{t.description}</p>
                </div>
              </div>
              <div className="border-t border-slate-100 p-3">
                <a href={`/preview/${t.key}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-2 text-sm font-semibold text-white hover:bg-slate-800">
                  Open live demo <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </motion.div>
          ))}
        </motion.div>
        <ul className="mt-12 flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-slate-600">
          {["Mobile friendly & fast", "Smooth animations", "One-click demo content", "Live preview before applying"].map((x) => (
            <li key={x} className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> {x}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function How() {
  return (
    <section id="how" className="bg-white py-24">
      <div className="mx-auto max-w-6xl px-4">
        <motion.h2 {...reveal} variants={fadeUp} className="text-center text-3xl font-bold text-slate-900 sm:text-4xl">
          Live in 3 simple steps
        </motion.h2>
        <motion.div {...reveal} variants={stagger} className="mt-14 grid gap-8 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <motion.div key={s.title} variants={fadeUp} className="relative rounded-2xl bg-slate-50 p-7">
              <span className="absolute -top-4 left-7 rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-white">Step {i + 1}</span>
              <s.icon className="h-8 w-8 text-indigo-600" />
              <h3 className="mt-4 text-lg font-semibold text-slate-900">{s.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{s.text}</p>
            </motion.div>
          ))}
        </motion.div>
        <motion.div {...reveal} variants={fadeUp} className="mt-14 grid gap-4 rounded-2xl border border-slate-200 p-6 text-sm sm:grid-cols-2">
          <div>
            <div className="font-semibold text-slate-900">Free subdomain</div>
            <code className="mt-1 block text-indigo-600">yourschool.{BASE_DOMAIN}</code>
            <code className="block text-slate-500">yourschool.{BASE_DOMAIN}/admin</code>
          </div>
          <div>
            <div className="font-semibold text-slate-900">Or your own domain</div>
            <code className="mt-1 block text-indigo-600">www.yourschool.com</code>
            <code className="block text-slate-500">www.yourschool.com/admin</code>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Contact() {
  return (
    <section id="contact" className="relative overflow-hidden bg-slate-950 py-24 text-white">
      <motion.div className="absolute inset-0 bg-gradient-to-r from-indigo-600/30 to-cyan-500/20" animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 6, repeat: Infinity }} />
      <motion.div {...reveal} variants={fadeUp} className="relative mx-auto max-w-2xl px-4 text-center">
        <h2 className="text-3xl font-bold sm:text-4xl">Ready to launch your website?</h2>
        <p className="mt-3 text-slate-300">Tell us your school name — we will set up your website and admin login.</p>
        <a href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("New website request")}`} className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 font-semibold text-slate-900 hover:bg-slate-200">
          <Mail className="h-4 w-4" /> {CONTACT_EMAIL}
        </a>
      </motion.div>
    </section>
  );
}

export default function MarketingApp() {
  return (
    <div className="min-h-screen font-sans">
      <Nav />
      <Hero />
      <Features />
      <Templates />
      <How />
      <Contact />
      <footer className="bg-slate-950 py-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} {PRODUCT_NAME}
      </footer>
    </div>
  );
}
