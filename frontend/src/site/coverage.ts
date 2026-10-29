// Admin ka har module public website par kahan dikhta hai.
//   "global"  = har page par (navbar menus, popups, pages via menus, hero sliders)
//   <section> = home page ka section (template me ho to) — aur agar EXPLORE_PAGES me hai to apna page bhi
// coverage.test.ts check karta hai ki har template me har menu ka data kahin na kahin dikhe (koi menu bekaar na ho).

export const MODULE_HOME: Record<string, string> = {
  menus: "global",
  pages: "global",
  popups: "global",
  sliders: "global",
  testimonials: "testimonials",
  faqs: "faq",
  stats: "stats",
  partners: "partners",
  blogs: "news",
  gallery_categories: "gallery",
  image_gallery: "gallery",
  videos: "videos",
  video_categories: "videos",
  livestreams: "videos",
  attachments: "downloads",
  magazines: "downloads",
  magazine_categories: "downloads",
  magazine_thumbnails: "downloads",
  services: "services",
  team_members: "team",
  projects: "projects",
  catalog_items: "catalog",
  pricing_plans: "pricing",
  thoughts: "thought",
  achievements: "achievements",
  awards: "achievements",
  award_categories: "achievements",
  activities: "achievements",
  press_releases: "notices",
  tenders: "notices"
};

/**
 * Jin sections ka apna page hai — footer "Explore" me link tab dikhta hai jab us module me kuch published ho.
 * Isse template me section na ho tab bhi data bekaar nahi jaata.
 */
export const EXPLORE_PAGES: { section: string; href: string; module: string; label?: string }[] = [
  { section: "services", href: "/services", module: "services" },
  { section: "catalog", href: "/catalog", module: "catalog_items" },
  { section: "projects", href: "/projects", module: "projects" },
  { section: "team", href: "/team", module: "team_members" },
  { section: "pricing", href: "/pricing", module: "pricing_plans" },
  { section: "achievements", href: "/achievements", module: "achievements", label: "Achievements" },
  { section: "news", href: "/blogs", module: "blogs" },
  { section: "gallery", href: "/gallery", module: "image_gallery" },
  { section: "achievements", href: "/achievements", module: "awards", label: "Awards" },
  { section: "achievements", href: "/achievements", module: "activities", label: "Activities" },
  { section: "videos", href: "/videos", module: "videos", label: "Videos" },
  { section: "videos", href: "/videos", module: "livestreams", label: "Live Streams" },
  { section: "downloads", href: "/downloads", module: "attachments", label: "Downloads" },
  { section: "downloads", href: "/downloads", module: "magazines", label: "E-Magazines" },
  { section: "notices", href: "/press", module: "press_releases", label: "Press Releases" },
  { section: "notices", href: "/tenders", module: "tenders", label: "Tenders" },
  { section: "faq", href: "/faq", module: "faqs" }
];
