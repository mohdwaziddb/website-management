import { ReactNode, useEffect } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { fileUrl } from "../lib/api";
import { LoadState, ShowcaseProvider, SiteProvider, useSite } from "./data";
import { Footer, Navbar, Popup } from "./chrome";
import { NewsStrip } from "./sections/newsroom";
import { ArticlePage, CategoryPage, NewsListPage, ReporterPage } from "./newsPages";
import { CartPage, CheckoutPage, ProductPage, ShopPage } from "./shopPages";
import { AccountPage, CustomerOrderPage, ForgotPasswordPage, LoginPage, ResetPasswordPage } from "./accountPages";
import { CartDrawer } from "./sections/shop";
import { ConfirmHost, Toaster } from "../components/ui";
import {
  AchievementsPage,
  BlogListPage,
  BlogPage,
  CmsPage,
  ContactPage,
  DetailPage,
  DownloadsPage,
  GalleryPage,
  HomePage,
  ModulePage,
  NoticePage,
  NotFoundPage,
  VideosPage
} from "./pages";
import { loadFonts } from "./templates/fonts";
import { NAV_SPACER, themeStyle, useFixedNav } from "./ui";
import { useSiteHead } from "./seo";
import { WhatsAppButton } from "./inbox";

function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

/** Template ke theme ke saath layout + page transition */
export function SiteLayout() {
  const { template, settings, preview, showcase } = useSite();
  const location = useLocation();
  // fixed navbar (floating / centered) ke neeche content na chhupe — home ke alawa har page par common jagah
  const navOffset = useFixedNav() && location.pathname !== "/";

  useEffect(() => {
    loadFonts([template.fonts.heading, template.fonts.body]);
  }, [template.fonts.heading, template.fonts.body]);

  // title / description: har page useSeo se; yahan Analytics + Search Console
  useSiteHead();

  useEffect(() => {
    const icon = fileUrl(settings.favicon);
    if (icon) {
      let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = icon;
    }
  }, [settings.favicon]);

  return (
    <div className="flex min-h-screen flex-col" style={themeStyle(template)} data-template={template.key}>
      <ScrollTop />
      {preview && (
        <div className="pointer-events-none fixed bottom-3 left-1/2 z-[80] -translate-x-1/2 rounded-full bg-black/75 px-4 py-1.5 text-xs text-white">
          Preview · {template.name}
        </div>
      )}
      {showcase && <ShowcaseBar />}
      <Navbar />
      {navOffset && <div aria-hidden className={NAV_SPACER} data-nav-spacer />}
      <NewsStrip />
      <AnimatePresence mode="wait">
        <motion.main key={location.pathname} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="flex-1">
          <Routes location={location}>
            <Route index element={<HomePage />} />
            <Route path="page/:slug" element={<CmsPage />} />
            <Route path="blogs" element={<BlogListPage />} />
            <Route path="blog/:slug" element={<BlogPage />} />
            <Route path="gallery" element={<GalleryPage />} />
            <Route path="videos" element={<VideosPage />} />
            <Route path="downloads" element={<DownloadsPage />} />
            <Route path="achievements" element={<AchievementsPage />} />
            <Route path="services" element={<ModulePage section="services" />} />
            <Route path="team" element={<ModulePage section="team" />} />
            <Route path="projects" element={<ModulePage section="projects" />} />
            <Route path="projects/:id" element={<DetailPage module="projects" />} />
            <Route path="catalog" element={<ModulePage section="catalog" />} />
            <Route path="catalog/:id" element={<DetailPage module="catalog_items" />} />
            <Route path="pricing" element={<ModulePage section="pricing" />} />
            <Route path="faq" element={<ModulePage section="faq" />} />
            <Route path="press" element={<NoticePage module="press_releases" title="Press Releases" dateField="release_date" />} />
            <Route path="tenders" element={<NoticePage module="tenders" title="Tenders" dateField="end_date" />} />
            <Route path="news" element={<NewsListPage />} />
            <Route path="news/:slug" element={<ArticlePage />} />
            <Route path="category/:slug" element={<CategoryPage />} />
            <Route path="reporter/:id" element={<ReporterPage />} />
            <Route path="shop" element={<ShopPage />} />
            <Route path="shop/category/:slug" element={<ShopPage />} />
            <Route path="product/:slug" element={<ProductPage />} />
            <Route path="cart" element={<CartPage />} />
            <Route path="checkout" element={<CheckoutPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<LoginPage mode="register" />} />
            <Route path="forgot-password" element={<ForgotPasswordPage />} />
            <Route path="reset-password" element={<ResetPasswordPage />} />
            <Route path="account" element={<AccountPage />} />
            <Route path="account/orders/:orderNo" element={<CustomerOrderPage />} />
            <Route path="contact" element={<ContactPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </motion.main>
      </AnimatePresence>
      <Footer />
      <Popup />
      <CartDrawer />
      <WhatsAppButton />
      <Toaster />
      <ConfirmHost />
    </div>
  );
}

/** Showcase (marketing site ka live demo) ke upar patli patti: template naam + wapas */
function ShowcaseBar() {
  const { template } = useSite();
  return (
    <div className="fixed bottom-4 left-1/2 z-[80] flex -translate-x-1/2 items-center gap-3 rounded-full bg-black/85 py-1.5 pl-4 pr-1.5 text-sm text-white shadow-2xl backdrop-blur">
      <span>
        Live demo · <b>{template.name}</b>
      </span>
      <a href="/" className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-black">
        All templates
      </a>
    </div>
  );
}

function Splash() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <motion.div className="h-12 w-12 rounded-full border-4 border-slate-300 border-t-slate-800" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }} />
    </div>
  );
}

export function WebsiteNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-slate-50 p-6 text-center">
      <h1 className="text-2xl font-semibold text-slate-900">Website not found</h1>
      <p className="text-slate-500">
        <b>{window.location.hostname}</b> is not registered or is suspended.
      </p>
    </div>
  );
}

function ByState({ state, missing }: { state: LoadState; missing: ReactNode }) {
  if (state === "ready") return <SiteLayout />;
  if (state === "missing") return <>{missing}</>;
  if (state === "error") return <div className="flex min-h-screen items-center justify-center text-slate-500">Website is temporarily unavailable. Please try again.</div>;
  return <Splash />;
}

/** Client ki public website: abc.yourdomain.com ya xyz.com */
export default function SiteApp() {
  return (
    <BrowserRouter>
      <SiteProvider>{(state) => <ByState state={state} missing={<WebsiteNotFound />} />}</SiteProvider>
    </BrowserRouter>
  );
}

/** Root domain: /preview/<template> — marketing site se kisi bhi template ka live demo (demo content ke saath) */
export function ShowcaseApp({ templateKey }: { templateKey: string }) {
  const missing = (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
      <h1 className="text-2xl font-semibold">Template not found</h1>
      <a href="/" className="text-indigo-600 underline">
        See all templates
      </a>
    </div>
  );
  return (
    <BrowserRouter basename={`/preview/${templateKey}`}>
      <ShowcaseProvider templateKey={templateKey}>{(state) => <ByState state={state} missing={missing} />}</ShowcaseProvider>
    </BrowserRouter>
  );
}
