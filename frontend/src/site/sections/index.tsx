import { ComponentType } from "react";
import { Hero } from "./heroes";
import { About, Achievements, Contact, Downloads, GallerySection, News, Notices, Testimonials, Thought, Variant, Videos } from "./content";
import { Catalog, Cta, Faq, Partners, Pricing, Projects, Services, Stats, Team } from "./business";
import { CategoryBlocks, HomeAd, Latest, PhotoAlbums, Trending } from "./newsroom";
import { Perks, Products, ShopCategories } from "./shop";

export { Achievements, ContactBlock, DownloadRow, LiveStreams, VideoCard, BlogCard } from "./content";
export { Catalog, Faq, Pricing, Projects, Services, Team } from "./business";
export { SiteIcon } from "./icons";
export type { Variant } from "./content";

/** Template ke "sections" list ka har naam yahan ek component hai ("services:icons" => Services variant="icons") */
export const SECTIONS: Record<string, ComponentType<Variant>> = {
  hero: Hero,
  thought: Thought,
  about: About,
  stats: Stats,
  achievements: Achievements,
  news: News,
  gallery: GallerySection,
  videos: Videos,
  testimonials: Testimonials,
  notices: Notices,
  downloads: Downloads,
  contact: Contact,
  services: Services,
  catalog: Catalog,
  projects: Projects,
  team: Team,
  pricing: Pricing,
  faq: Faq,
  partners: Partners,
  cta: Cta,
  latest: Latest,
  categories: CategoryBlocks,
  trending: Trending,
  photos: PhotoAlbums,
  ad: HomeAd,
  products: Products,
  shop_categories: ShopCategories,
  perks: Perks
};
