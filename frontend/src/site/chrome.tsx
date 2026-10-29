import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { AnimatePresence, motion, useScroll, useMotionValueEvent } from "framer-motion";
import { ChevronDown, Facebook, Instagram, Linkedin, Mail, Menu, Phone, Twitter, X, Youtube } from "lucide-react";
import { fileUrl } from "../lib/api";
import { MenuItem, useList, useSite } from "./data";
import { EXPLORE_PAGES } from "./coverage";
import { getSiteType, sectionTitle, TitledSection } from "./siteTypes";
import { Container, headingFont, RichHtml, SmartImage, useSetting } from "./ui";

/** Menus admin panel se aate hain; na hon to website type ke default links (Restaurant: Menu, Gym: Membership ...) */
function useDefaultLinks(): MenuItem[] {
  const { siteType } = useSite();
  return getSiteType(siteType).nav.map((n, i) => ({ id: -(i + 1), title: n.title, href: n.href, external: false, children: [] }));
}

/** In heroes ke upar photo / gradient hota hai — transparent navbar ka text safed */
const DARK_HEROES = ["carousel", "split", "fullscreen", "elegant", "centered", "kenburns"];

type LinkClass = string | ((s: { isActive: boolean }) => string);

function MenuLink({ item, className, onClick }: { item: MenuItem; className: LinkClass; onClick?: () => void }) {
  // na page na URL — sirf naam dikhao (URL me "#" na aaye)
  if (!item.href) return <span className={typeof className === "function" ? className({ isActive: false }) : className}>{item.title}</span>;
  if (item.external) {
    return (
      <a href={item.href} target="_blank" rel="noreferrer" className={typeof className === "function" ? className({ isActive: false }) : className} onClick={onClick}>
        {item.title}
      </a>
    );
  }
  return (
    <NavLink to={item.href} end={item.href === "/"} className={className} onClick={onClick}>
      {item.title}
    </NavLink>
  );
}

function Brand({ light }: { light: boolean }) {
  const name = useSetting("site_name");
  const logo = useSetting("logo");
  return (
    <Link to="/" className="flex min-w-0 items-center gap-3">
      {logo ? (
        <img src={fileUrl(logo)} alt="" className="h-10 w-10 object-contain" />
      ) : (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)] text-lg font-bold text-[var(--on-accent)]">
          {(name || "S").charAt(0)}
        </span>
      )}
      <span style={headingFont} className={`truncate text-lg font-bold ${light ? "text-white" : "text-[var(--text)]"}`}>
        {name || "Welcome"}
      </span>
    </Link>
  );
}

export function Navbar() {
  const { template, menus } = useSite();
  const defaults = useDefaultLinks();
  const links = menus.length ? menus : defaults;
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  const { pathname } = useLocation();
  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 40));
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const v = template.nav;
  // hero ke upar transparent navbar sirf home par, scroll hone tak
  const overHero = pathname === "/" && !scrolled && (v === "floating" || v === "centered");
  const heroDark = DARK_HEROES.includes(template.hero);
  // surface rang ka glass (dark templates me bhi sahi)
  const glass = { background: "color-mix(in srgb, var(--surface) 88%, transparent)" };

  const shell =
    v === "floating"
      ? `fixed inset-x-0 top-3 z-40 mx-auto w-[calc(100%-1.5rem)] max-w-6xl rounded-2xl backdrop-blur transition-all ${overHero ? (heroDark ? "bg-white/10" : "") : "shadow-lg"}`
      : v === "centered"
        ? `fixed inset-x-0 top-0 z-40 transition-all ${scrolled || pathname !== "/" ? "shadow-md" : "bg-transparent"}`
        : v === "light" || v === "dark"
          ? "sticky top-0 z-40 border-b border-[var(--text)]/10 backdrop-blur"
          : "sticky top-0 z-40 shadow-md";
  const shellStyle =
    v === "solid" || v === "classic" || (v === "centered" && (scrolled || pathname !== "/"))
      ? { background: "var(--primary)" }
      : (v === "floating" && !overHero) || v === "light" || v === "dark"
        ? glass
        : undefined;
  const textLight = (overHero && heroDark) || v === "solid" || v === "classic" || (v === "centered" && (scrolled || pathname !== "/"));
  const linkCls = ({ isActive }: { isActive: boolean }) =>
    `rounded-full px-3 py-2 text-sm font-medium transition ${
      textLight ? (isActive ? "bg-white/20 text-white" : "text-white/85 hover:text-white") : isActive ? "text-[var(--primary)]" : "text-[var(--text)]/75 hover:text-[var(--primary)]"
    }`;
  const navLinks = (
    <>
      {links.map((m) =>
        m.children.length ? (
          <div key={m.id} className="group relative">
            <button className={linkCls({ isActive: false }) + " inline-flex items-center gap-1"}>
              {m.title} <ChevronDown className="h-3.5 w-3.5" />
            </button>
            <div className="invisible absolute left-0 top-full z-50 min-w-48 translate-y-2 rounded-xl bg-white p-2 opacity-0 shadow-xl transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
              {m.children.map((c) => (
                <MenuLink key={c.id} item={c} className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100" />
              ))}
            </div>
          </div>
        ) : (
          <MenuLink key={m.id} item={m} className={linkCls} />
        )
      )}
    </>
  );

  return (
    <>
      {v === "classic" && <TopBar />}
      <header className={shell} style={shellStyle}>
        <Container className={`flex h-16 items-center gap-4 ${v === "centered" ? "lg:h-20" : ""}`}>
          <Brand light={textLight} />
          <nav className={`hidden flex-1 items-center gap-1 lg:flex ${v === "centered" ? "justify-center" : "justify-end"}`}>{navLinks}</nav>
          <button aria-label="Menu" className={`ml-auto rounded-lg p-2 lg:hidden ${textLight ? "text-white" : "text-[var(--text)]"}`} onClick={() => setOpen(true)}>
            <Menu className="h-6 w-6" />
          </button>
        </Container>
      </header>
      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-50 bg-black/40 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)}>
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 260 }}
              className="absolute inset-y-0 right-0 w-72 overflow-y-auto bg-white p-5"
              onClick={(e) => e.stopPropagation()}
            >
              <button aria-label="Close" className="mb-4 ml-auto block rounded-lg p-2 text-slate-600" onClick={() => setOpen(false)}>
                <X className="h-5 w-5" />
              </button>
              {links.map((m) => (
                <div key={m.id}>
                  <MenuLink item={m} className="block rounded-lg px-3 py-2.5 font-medium text-slate-800 hover:bg-slate-100" />
                  {m.children.map((c) => (
                    <MenuLink key={c.id} item={c} className="block rounded-lg px-6 py-2 text-sm text-slate-600 hover:bg-slate-100" />
                  ))}
                </div>
              ))}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function TopBar() {
  const phone = useSetting("phone");
  const email = useSetting("email");
  const affiliation = useSetting("affiliation_no");
  if (!phone && !email && !affiliation) return null;
  return (
    <div className="text-xs text-white/80" style={{ background: "color-mix(in srgb, var(--primary) 70%, #000)" }}>
      <Container className="flex h-9 items-center gap-5">
        {phone && (
          <span className="flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5" /> {phone}
          </span>
        )}
        {email && (
          <span className="hidden items-center gap-1.5 sm:flex">
            <Mail className="h-3.5 w-3.5" /> {email}
          </span>
        )}
        {affiliation && <span className="ml-auto">Affiliation No: {affiliation}</span>}
      </Container>
    </div>
  );
}

const SOCIAL = [
  { key: "facebook", icon: Facebook },
  { key: "instagram", icon: Instagram },
  { key: "youtube", icon: Youtube },
  { key: "twitter", icon: Twitter },
  { key: "linkedin", icon: Linkedin }
];

export function Footer() {
  const { settings } = useSite();
  const name = useSetting("site_name");
  const address = useSetting("address");
  const phone = useSetting("phone");
  const email = useSetting("email");
  const footer = useSetting("footer_text");
  const quickLinks = useDefaultLinks().filter((l) => l.href !== "/");
  return (
    <footer className="mt-auto text-white/80" style={{ background: "linear-gradient(160deg, color-mix(in srgb, var(--primary) 45%, #0b0b12), #07070c)" }}>
      <Container className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div style={headingFont} className="text-xl font-bold text-white">{name || "Welcome"}</div>
          {footer && <p className="mt-3 whitespace-pre-line text-sm">{footer}</p>}
          <div className="mt-4 flex gap-2">
            {SOCIAL.filter((s) => settings[s.key]).map((s) => (
              <a key={s.key} href={settings[s.key] ?? undefined} target="_blank" rel="noreferrer" aria-label={s.key} className="rounded-full bg-white/10 p-2 transition hover:bg-[var(--accent)]">
                <s.icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-3 font-semibold text-white">Quick links</div>
          <ul className="space-y-2 text-sm">
            {quickLinks.map((l) => (
              <li key={l.id}>
                <Link to={l.href} className="hover:text-white">{l.title}</Link>
              </li>
            ))}
          </ul>
        </div>
        <ExploreLinks exclude={new Set(quickLinks.map((l) => l.href))} />
        <div className="space-y-2 text-sm">
          <div className="mb-3 font-semibold text-white">Reach us</div>
          {address && <p className="whitespace-pre-line">{address}</p>}
          {phone && <p>{phone}</p>}
          {email && <p>{email}</p>}
        </div>
      </Container>
      <div className="border-t border-white/10 py-4 text-center text-xs text-white/50">
        © {new Date().getFullYear()} {name || "Welcome"}. All rights reserved.
      </div>
    </footer>
  );
}

/** Ek explore link — sirf tab jab us module me kuch published ho */
function ExploreLink({ page }: { page: (typeof EXPLORE_PAGES)[number] }) {
  const { siteType } = useSite();
  const { items } = useList(page.module, { size: 1 });
  if (!items.length) return null;
  const label = page.label ?? sectionTitle(siteType, page.section as TitledSection)[0];
  return (
    <li>
      <Link to={page.href} className="hover:text-white">
        {label}
      </Link>
    </li>
  );
}

/**
 * Footer "Explore": har us page ka link jisme content hai (Videos, Downloads, Achievements, FAQ ...).
 * Isse template me section na ho tab bhi admin ka daala data website par pahunchta hai (coverage.ts).
 */
function ExploreLinks({ exclude }: { exclude: Set<string> }) {
  const pages = EXPLORE_PAGES.filter((p) => !exclude.has(p.href));
  return (
    <div>
      <div className="mb-3 font-semibold text-white">Explore</div>
      <ul className="space-y-2 text-sm">
        {pages.map((p) => (
          <ExploreLink key={p.href + p.module} page={p} />
        ))}
      </ul>
    </div>
  );
}

/** Aaj ki date ke andar wala published popup — har session me ek baar */
export function Popup() {
  const { items } = useList("popups", { size: 5 });
  const { preview } = useSite();
  const [closed, setClosed] = useState(() => {
    try {
      return sessionStorage.getItem("wm_popup_closed") === "1";
    } catch {
      return false;
    }
  });
  const today = new Date().toISOString().slice(0, 10);
  const popup = items.find((p) => (!p.from_date || String(p.from_date) <= today) && (!p.to_date || String(p.to_date) >= today));
  if (!popup || closed || preview) return null;
  const close = () => {
    setClosed(true);
    try {
      sessionStorage.setItem("wm_popup_closed", "1");
    } catch {
      /* private mode */
    }
  };
  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={close}>
        <motion.div initial={{ scale: 0.8, y: 30 }} animate={{ scale: 1, y: 0 }} className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white" onClick={(e) => e.stopPropagation()}>
          <button aria-label="Close" onClick={close} className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-1.5 text-slate-700 shadow">
            <X className="h-4 w-4" />
          </button>
          {!!popup.image && <SmartImage src={popup.image} alt={String(popup.title)} className="w-full" />}
          <div className="p-5">
            <h3 style={headingFont} className="text-xl font-bold text-slate-900">{String(popup.title)}</h3>
            <RichHtml html={popup.description} className="mt-2 text-slate-600" />
            {!!popup.attachment && (
              <a href={fileUrl(popup.attachment)} target="_blank" rel="noreferrer" className="mt-4 inline-block rounded-full bg-[var(--primary)] px-5 py-2 text-sm font-semibold text-[var(--on-primary)]">
                Open attachment
              </a>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
