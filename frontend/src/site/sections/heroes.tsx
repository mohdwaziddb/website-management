import { useEffect, useState } from "react";
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import type { Row } from "../../lib/types";
import { useList, useSite } from "../data";
import { getSiteType } from "../siteTypes";
import { Container, fadeUp, headingFont, MainCta, SiteButton, SmartImage, stagger, useFixedNav, useSetting } from "../ui";

// 10 hero styles — template config ka "hero" inme se ek chunta hai. Content: sliders + settings (naam, tagline, main button).

function useSlides(): Row[] {
  const { items } = useList("sliders", { size: 8 });
  const name = useSetting("site_name");
  const tagline = useSetting("tagline");
  // koi slider na ho to site naam wala ek slide
  return items.length ? items : ([{ id: 0, title: name || "Welcome", description: tagline, image: "" }] as Row[]);
}

function useAutoIndex(count: number, ms = 5500) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (count < 2) return;
    const t = setInterval(() => setI((p) => (p + 1) % count), ms);
    return () => clearInterval(t);
  }, [count, ms]);
  return [i % Math.max(count, 1), setI] as const;
}

/** Main button (settings) + type ka doosra page (Menu / Properties / Programs ...) */
function HeroButtons({ light = true, center = false }: { light?: boolean; center?: boolean }) {
  const { siteType } = useSite();
  const second = getSiteType(siteType).nav.find((n) => n.href !== "/" && n.href !== "/contact");
  return (
    <div className={`mt-8 flex flex-wrap gap-3 ${center ? "justify-center" : ""}`}>
      <MainCta />
      {second && (
        <SiteButton to={second.href} kind={light ? "outline-light" : "outline"}>
          {second.title}
        </SiteButton>
      )}
    </div>
  );
}

function Dots({ count, i, onPick, light = true }: { count: number; i: number; onPick: (n: number) => void; light?: boolean }) {
  if (count < 2) return null;
  return (
    <div className="flex gap-2">
      {Array.from({ length: count }, (_, n) => (
        <button key={n} aria-label={`Slide ${n + 1}`} onClick={() => onPick(n)} className={`h-2 rounded-full transition-all ${n === i ? "w-8 bg-[var(--accent)]" : `w-2 ${light ? "bg-white/60" : "bg-black/20"}`}`} />
      ))}
    </div>
  );
}

// ------------------------------------------------------------ 1. carousel — full width slider, text bottom-left

function CarouselHero() {
  const slides = useSlides();
  const [i, setI] = useAutoIndex(slides.length);
  const s = slides[i];
  return (
    <section className="relative h-[78vh] min-h-[460px] overflow-hidden bg-slate-900">
      <AnimatePresence mode="sync">
        <motion.div key={s.id} initial={{ opacity: 0, scale: 1.08 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.1 }} className="absolute inset-0">
          <SmartImage src={s.image} alt={String(s.title)} seed={i} className="h-full w-full" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        </motion.div>
      </AnimatePresence>
      <Container className="relative flex h-full flex-col justify-end pb-16">
        <motion.div key={"t" + s.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }} className="max-w-2xl">
          <h1 style={headingFont} className="text-4xl font-bold text-white sm:text-6xl">{String(s.title ?? "")}</h1>
          {!!s.description && <p className="mt-4 text-lg text-white/85">{String(s.description)}</p>}
          <HeroButtons />
        </motion.div>
        <div className="mt-8">
          <Dots count={slides.length} i={i} onPick={setI} />
        </div>
      </Container>
      {slides.length > 1 && (
        <>
          <button aria-label="Previous" onClick={() => setI((i - 1 + slides.length) % slides.length)} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white backdrop-blur hover:bg-white/30">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button aria-label="Next" onClick={() => setI((i + 1) % slides.length)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white backdrop-blur hover:bg-white/30">
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}
    </section>
  );
}

// ------------------------------------------------------------ 2. split — gradient, text left + floating image card right

function SplitHero() {
  const slides = useSlides();
  const [i] = useAutoIndex(slides.length, 4000);
  const name = useSetting("site_name");
  const tagline = useSetting("tagline");
  return (
    <section className="relative overflow-hidden pb-20 pt-32" style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))" }}>
      <motion.div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-white/10 blur-2xl" animate={{ y: [0, 30, 0] }} transition={{ duration: 8, repeat: Infinity }} />
      <motion.div className="absolute -right-10 bottom-0 h-96 w-96 rounded-full bg-white/10 blur-3xl" animate={{ y: [0, -30, 0] }} transition={{ duration: 10, repeat: Infinity }} />
      <Container className="relative grid items-center gap-12 lg:grid-cols-2">
        <motion.div initial="hidden" animate="show" variants={stagger}>
          {tagline && (
            <motion.span variants={fadeUp} className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm text-white backdrop-blur">
              <Sparkles className="h-4 w-4" /> {tagline}
            </motion.span>
          )}
          <motion.h1 variants={fadeUp} style={headingFont} className="mt-5 text-4xl font-extrabold leading-tight text-white sm:text-6xl">
            {name || String(slides[0].title)}
          </motion.h1>
          <motion.p variants={fadeUp} className="mt-5 max-w-lg text-lg text-white/85">
            {String(slides[i].description || slides[i].title || "")}
          </motion.p>
          <motion.div variants={fadeUp}>
            <HeroButtons />
          </motion.div>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 60, rotate: 3 }} animate={{ opacity: 1, x: 0, rotate: 0 }} transition={{ duration: 0.8 }} className="relative">
          <div className="overflow-hidden rounded-3xl border-4 border-white/30 shadow-2xl">
            <AnimatePresence mode="wait">
              <motion.div key={slides[i].id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }}>
                <SmartImage src={slides[i].image} alt={String(slides[i].title)} seed={i + 1} className="aspect-[4/3] w-full" />
              </motion.div>
            </AnimatePresence>
          </div>
          <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity }} className="absolute -bottom-6 -left-6 rounded-2xl bg-white p-4 shadow-xl">
            <div className="text-xs text-slate-500">Now showing</div>
            <div className="max-w-[12rem] truncate font-semibold text-slate-900">{String(slides[i].title)}</div>
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
}

// ------------------------------------------------------------ 3. minimal — huge type, thin line, 3 images

function MinimalHero() {
  const slides = useSlides();
  const name = useSetting("site_name");
  const tagline = useSetting("tagline");
  return (
    <section className="pb-12 pt-24">
      <Container>
        <motion.h1 initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} style={headingFont} className="max-w-4xl text-5xl font-semibold tracking-tight text-[var(--hero-text)] sm:text-7xl">
          {name || String(slides[0].title)}
          <span className="text-[var(--accent)]">.</span>
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-6 max-w-xl text-lg text-[var(--muted)]">
          {tagline || String(slides[0].description ?? "")}
        </motion.p>
        <HeroButtons light={false} />
        <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.5, duration: 0.8 }} className="mt-10 h-px origin-left bg-[var(--text)]/15" />
        <motion.div initial="hidden" animate="show" variants={stagger} className="mt-10 grid gap-4 sm:grid-cols-3">
          {slides.slice(0, 3).map((s, n) => (
            <motion.div key={s.id} variants={fadeUp} className="group">
              <div className="overflow-hidden rounded-md">
                <SmartImage src={s.image} alt={String(s.title)} seed={n} className="aspect-[4/3] w-full transition duration-700 group-hover:scale-105" />
              </div>
              <div className="mt-2 text-sm text-[var(--muted)]">{String(s.title)}</div>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </section>
  );
}

// ------------------------------------------------------------ 4. fullscreen — sliding images, bouncy centered text

function FullscreenHero() {
  const slides = useSlides();
  const [i, setI] = useAutoIndex(slides.length, 5000);
  const s = slides[i];
  return (
    <section className="relative h-[92vh] min-h-[500px] overflow-hidden bg-black">
      <AnimatePresence>
        <motion.div key={s.id} initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "-30%", opacity: 0 }} transition={{ duration: 0.9, ease: [0.65, 0, 0.35, 1] }} className="absolute inset-0">
          <SmartImage src={s.image} alt={String(s.title)} seed={i + 2} className="h-full w-full" />
          <div className="absolute inset-0 bg-black/45" />
        </motion.div>
      </AnimatePresence>
      <Container className="relative flex h-full flex-col items-center justify-center text-center">
        <motion.h1 key={"h" + s.id} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 160, damping: 12 }} style={headingFont} className="max-w-4xl text-5xl font-extrabold text-white drop-shadow-lg sm:text-7xl">
          {String(s.title)}
        </motion.h1>
        {!!s.description && <p className="mt-4 max-w-xl text-lg text-white/90">{String(s.description)}</p>}
        <HeroButtons center />
        <div className="mt-8">
          <Dots count={slides.length} i={i} onPick={setI} />
        </div>
      </Container>
    </section>
  );
}

// ------------------------------------------------------------ 5. elegant — slow crossfade, letter-spaced serif

function ElegantHero() {
  const slides = useSlides();
  const [i] = useAutoIndex(slides.length, 7000);
  const name = useSetting("site_name");
  const tagline = useSetting("tagline");
  return (
    <section className="relative h-[85vh] min-h-[480px] overflow-hidden bg-black">
      <AnimatePresence>
        <motion.div key={slides[i].id} initial={{ opacity: 0 }} animate={{ opacity: 0.55 }} exit={{ opacity: 0 }} transition={{ duration: 2 }} className="absolute inset-0">
          <SmartImage src={slides[i].image} alt={String(slides[i].title)} seed={i + 3} className="h-full w-full" />
        </motion.div>
      </AnimatePresence>
      <Container className="relative flex h-full flex-col items-center justify-center text-center">
        {tagline && (
          <motion.div initial={{ opacity: 0, letterSpacing: "0.6em" }} animate={{ opacity: 1, letterSpacing: "0.3em" }} transition={{ duration: 1.4 }} className="text-xs uppercase text-[var(--accent)]">
            {tagline}
          </motion.div>
        )}
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 1 }} style={headingFont} className="mt-5 max-w-4xl text-5xl text-white sm:text-7xl">
          {name || String(slides[0].title)}
        </motion.h1>
        <motion.div initial={{ width: 0 }} animate={{ width: 120 }} transition={{ delay: 1, duration: 1 }} className="mt-6 h-px bg-[var(--accent)]" />
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} className="mt-6 max-w-xl italic text-white/80">
          {String(slides[i].description || slides[i].title || "")}
        </motion.p>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}>
          <HeroButtons center />
        </motion.div>
      </Container>
    </section>
  );
}

// ------------------------------------------------------------ 6. typewriter — dark glow, words type themselves

function useTypewriter(words: string[], speed = 70, hold = 1800) {
  const [w, setW] = useState(0);
  const [n, setN] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const word = words[w % Math.max(words.length, 1)] ?? "";
  useEffect(() => {
    if (!words.length) return;
    const t = setTimeout(
      () => {
        if (!deleting && n < word.length) setN(n + 1);
        else if (!deleting) setDeleting(true);
        else if (n > 0) setN(n - 1);
        else {
          setDeleting(false);
          setW((x) => x + 1);
        }
      },
      !deleting && n === word.length ? hold : deleting ? speed / 2 : speed
    );
    return () => clearTimeout(t);
  }, [n, deleting, word, words.length, speed, hold]);
  return word.slice(0, n);
}

function TypewriterHero() {
  const slides = useSlides();
  const name = useSetting("site_name");
  const tagline = useSetting("tagline");
  const typed = useTypewriter(slides.map((s) => String(s.title)));
  const fixedNav = useFixedNav();
  return (
    <section className={`relative overflow-hidden pb-24 ${fixedNav ? "pt-36" : "pt-24"}`} style={{ background: "radial-gradient(ellipse at top, color-mix(in srgb, var(--primary) 35%, var(--bg)), var(--bg) 60%)" }}>
      <div className="pointer-events-none absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "linear-gradient(var(--text) 1px, transparent 1px), linear-gradient(90deg, var(--text) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
      <motion.div className="absolute left-1/2 top-24 h-80 w-80 -translate-x-1/2 rounded-full blur-3xl" style={{ background: "var(--accent)", opacity: 0.25 }} animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 7, repeat: Infinity }} />
      <Container className="relative text-center">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 rounded-full border border-[var(--text)]/15 px-4 py-1.5 text-sm text-[var(--muted)]">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--primary)]" /> {tagline || name}
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} style={headingFont} className="mx-auto mt-6 max-w-4xl text-5xl font-bold leading-tight text-[var(--text)] sm:text-7xl">
          {name}
          <br />
          <span className="bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] bg-clip-text text-transparent">{typed}</span>
          <span className="ml-1 inline-block w-[3px] animate-pulse bg-[var(--primary)]">&nbsp;</span>
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mx-auto mt-6 max-w-xl text-lg text-[var(--muted)]">
          {String(slides[0].description ?? "")}
        </motion.p>
        <HeroButtons light={false} center />
        {!!slides[0].image && (
          <motion.div initial={{ opacity: 0, y: 60, rotateX: 25 }} animate={{ opacity: 1, y: 0, rotateX: 0 }} transition={{ delay: 0.5, duration: 0.9 }} className="mx-auto mt-14 max-w-4xl overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/10" style={{ perspective: 1000 }}>
            <SmartImage src={slides[0].image} alt="" className="aspect-[16/8] w-full" />
          </motion.div>
        )}
      </Container>
    </section>
  );
}

// ------------------------------------------------------------ 7. collage — text left, 3 tilted photos right

function CollageHero() {
  const slides = useSlides();
  const name = useSetting("site_name");
  const tagline = useSetting("tagline");
  const fixedNav = useFixedNav();
  const pics = [slides[0], slides[1] ?? slides[0], slides[2] ?? slides[0]];
  return (
    <section className={`relative overflow-hidden pb-20 ${fixedNav ? "pt-32" : "pt-16"}`}>
      <div className="absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full opacity-20 blur-3xl" style={{ background: "var(--accent)" }} />
      <Container className="relative grid items-center gap-12 lg:grid-cols-2">
        <motion.div initial="hidden" animate="show" variants={stagger}>
          {tagline && (
            <motion.div variants={fadeUp} className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
              {tagline}
            </motion.div>
          )}
          <motion.h1 variants={fadeUp} style={headingFont} className="mt-4 text-5xl font-bold leading-[1.05] text-[var(--text)] sm:text-6xl">
            {String(slides[0].title)}
          </motion.h1>
          <motion.p variants={fadeUp} className="mt-5 max-w-lg text-lg text-[var(--muted)]">
            {String(slides[0].description ?? name)}
          </motion.p>
          <motion.div variants={fadeUp}>
            <HeroButtons light={false} />
          </motion.div>
        </motion.div>
        <div className="relative h-[420px] sm:h-[480px]">
          {pics.map((p, n) => (
            <motion.div
              key={n}
              initial={{ opacity: 0, y: 40, rotate: 0 }}
              animate={{ opacity: 1, y: 0, rotate: [-6, 4, -2][n] }}
              transition={{ delay: 0.2 + n * 0.15, type: "spring", stiffness: 90 }}
              whileHover={{ rotate: 0, scale: 1.04, zIndex: 10 }}
              className="absolute overflow-hidden rounded-2xl border-4 border-[var(--surface)] shadow-2xl"
              style={[{ left: "0%", top: "8%", width: "58%" }, { right: "0%", top: "0%", width: "50%" }, { left: "25%", bottom: "0%", width: "55%" }][n]}
            >
              <SmartImage src={p.image} alt={String(p.title)} seed={n} className="aspect-[4/3] w-full" />
            </motion.div>
          ))}
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="absolute -left-4 bottom-10 h-20 w-20 rounded-full border-2 border-dashed border-[var(--accent)]" />
        </div>
      </Container>
    </section>
  );
}

// ------------------------------------------------------------ 8. centered — big bold text over image with gradient wash

function CenteredHero() {
  const slides = useSlides();
  const [i] = useAutoIndex(slides.length, 6000);
  const name = useSetting("site_name");
  const tagline = useSetting("tagline");
  return (
    <section className="relative flex min-h-[86vh] items-center overflow-hidden">
      <AnimatePresence>
        <motion.div key={slides[i].id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.2 }} className="absolute inset-0">
          <SmartImage src={slides[i].image} alt="" seed={i} className="h-full w-full" />
        </motion.div>
      </AnimatePresence>
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, color-mix(in srgb, var(--primary) 55%, transparent), color-mix(in srgb, #000 75%, var(--primary)))" }} />
      <Container className="relative py-28 text-center">
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="mx-auto inline-block rounded-full bg-white/15 px-5 py-1.5 text-sm font-medium uppercase tracking-widest text-white backdrop-blur">
          {tagline || name}
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.7 }} style={headingFont} className="mx-auto mt-6 max-w-5xl text-5xl font-black uppercase leading-none text-white sm:text-8xl">
          {String(slides[i].title)}
        </motion.h1>
        {!!slides[i].description && <p className="mx-auto mt-6 max-w-xl text-lg text-white/85">{String(slides[i].description)}</p>}
        <HeroButtons center />
      </Container>
    </section>
  );
}

// ------------------------------------------------------------ 9. kenburns — slow zoom + pan, text bottom-left, slide counter

function KenBurnsHero() {
  const slides = useSlides();
  const [i, setI] = useAutoIndex(slides.length, 7000);
  const s = slides[i];
  const tagline = useSetting("tagline");
  return (
    <section className="relative h-[90vh] min-h-[500px] overflow-hidden bg-black">
      <AnimatePresence>
        <motion.div key={s.id} initial={{ opacity: 0, scale: 1 }} animate={{ opacity: 1, scale: 1.15, x: i % 2 ? -30 : 30 }} exit={{ opacity: 0 }} transition={{ opacity: { duration: 1.5 }, scale: { duration: 8, ease: "linear" }, x: { duration: 8, ease: "linear" } }} className="absolute inset-0">
          <SmartImage src={s.image} alt={String(s.title)} seed={i} className="h-full w-full" />
        </motion.div>
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
      <Container className="relative flex h-full flex-col justify-center">
        {tagline && <div className="mb-4 h-px w-16 bg-[var(--accent)]" />}
        {tagline && <div className="text-sm uppercase tracking-[0.3em] text-white/70">{tagline}</div>}
        <motion.h1 key={"h" + s.id} initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} style={headingFont} className="mt-4 max-w-2xl text-5xl font-bold leading-tight text-white sm:text-7xl">
          {String(s.title)}
        </motion.h1>
        {!!s.description && <p className="mt-5 max-w-lg text-lg text-white/80">{String(s.description)}</p>}
        <HeroButtons />
      </Container>
      {slides.length > 1 && (
        <div className="absolute bottom-8 right-8 flex items-center gap-4 text-white">
          <span style={headingFont} className="text-3xl font-bold">
            {String(i + 1).padStart(2, "0")}
          </span>
          <span className="h-px w-12 bg-white/50" />
          <span className="text-white/60">{String(slides.length).padStart(2, "0")}</span>
          <button aria-label="Next" onClick={() => setI((i + 1) % slides.length)} className="ml-2 rounded-full border border-white/40 p-2 hover:bg-white/10">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </section>
  );
}

// ------------------------------------------------------------ 10. magazine — oversized editorial type + framed photo, parallax

function MagazineHero() {
  const slides = useSlides();
  const name = useSetting("site_name");
  const tagline = useSetting("tagline");
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 600], [0, -80]);
  const fixedNav = useFixedNav();
  return (
    <section className={`relative overflow-hidden pb-16 ${fixedNav ? "pt-32" : "pt-12"}`}>
      <Container>
        <div className="flex items-end justify-between border-b-2 border-[var(--hero-text)] pb-4 text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
          <span>{tagline || "Portfolio"}</span>
          <span>Est. {new Date().getFullYear() - 8}</span>
        </div>
        <motion.h1 initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} style={headingFont} className="mt-6 text-[13vw] font-black uppercase leading-[0.85] tracking-tight text-[var(--hero-text)] lg:text-[9rem]">
          {(name || String(slides[0].title)).split(" ").slice(0, 3).join(" ")}
        </motion.h1>
        <div className="mt-10 grid gap-8 md:grid-cols-[1fr_1.4fr]">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            <p className="text-xl leading-relaxed text-[var(--text)]">{String(slides[0].description ?? "")}</p>
            <HeroButtons light={false} />
          </motion.div>
          <motion.div style={{ y }} className="overflow-hidden">
            <motion.div initial={{ clipPath: "inset(0 100% 0 0)" }} animate={{ clipPath: "inset(0 0% 0 0)" }} transition={{ duration: 1.2, delay: 0.2, ease: [0.65, 0, 0.35, 1] }}>
              <SmartImage src={slides[0].image} alt="" className="aspect-[16/10] w-full" />
            </motion.div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}

const HEROES = {
  carousel: CarouselHero,
  split: SplitHero,
  minimal: MinimalHero,
  fullscreen: FullscreenHero,
  elegant: ElegantHero,
  typewriter: TypewriterHero,
  collage: CollageHero,
  centered: CenteredHero,
  kenburns: KenBurnsHero,
  magazine: MagazineHero
};

export function Hero() {
  const { template } = useSite();
  const H = HEROES[template.hero] ?? CarouselHero;
  return <H />;
}
