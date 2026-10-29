// Website types — backend com.wm.settings.SiteTypeCatalog me same keys.
// Har type: public site ka default navbar, section ke titles, aur list pages ke naam.

export type SiteTypeKey =
  | "school"
  | "coaching"
  | "portfolio"
  | "business"
  | "restaurant"
  | "gym"
  | "real_estate"
  | "hospital"
  | "agency"
  | "hotel_travel"
  | "landing"
  | "photography"
  | "ngo"
  | "interior"
  | "construction";

/** Home page sections jinke title type ke hisaab se badalte hain */
export type TitledSection = "services" | "team" | "projects" | "catalog" | "pricing" | "stats" | "faq" | "partners" | "testimonials" | "gallery" | "news" | "about" | "contact";

export interface SiteType {
  key: SiteTypeKey;
  label: string;
  description: string;
  /** Navbar jab admin ne Menus na banaye hon */
  nav: { title: string; href: string }[];
  titles: Partial<Record<TitledSection, [string, string]>>; // [title, subtitle]
}

const T = (title: string, subtitle: string): [string, string] => [title, subtitle];

export const SITE_TYPES: SiteType[] = [
  {
    key: "school",
    label: "School",
    description: "Admissions, faculty, achievements, notices & gallery",
    nav: [
      { title: "Home", href: "/" },
      { title: "Facilities", href: "/services" },
      { title: "News", href: "/blogs" },
      { title: "Gallery", href: "/gallery" },
      { title: "Downloads", href: "/downloads" },
      { title: "Contact", href: "/contact" }
    ],
    titles: { services: T("Our Facilities", "Campus"), team: T("Our Faculty", "Mentors"), testimonials: T("What Parents Say", "Testimonials") }
  },
  {
    key: "coaching",
    label: "Coaching Institute",
    description: "Courses, batches & fees, toppers and faculty",
    nav: [
      { title: "Home", href: "/" },
      { title: "Courses", href: "/services" },
      { title: "Fees", href: "/pricing" },
      { title: "Faculty", href: "/team" },
      { title: "Results", href: "/gallery" },
      { title: "Contact", href: "/contact" }
    ],
    titles: { services: T("Our Courses", "Programs"), team: T("Expert Faculty", "Learn from the best"), pricing: T("Batches & Fees", "Invest in your future"), testimonials: T("Student Stories", "Results") }
  },
  {
    key: "portfolio",
    label: "Portfolio",
    description: "Personal brand, projects, skills & contact",
    nav: [
      { title: "Home", href: "/" },
      { title: "Work", href: "/projects" },
      { title: "Services", href: "/services" },
      { title: "Blog", href: "/blogs" },
      { title: "Contact", href: "/contact" }
    ],
    titles: { projects: T("Selected Work", "Portfolio"), services: T("What I Do", "Skills"), testimonials: T("Kind Words", "Clients") }
  },
  {
    key: "business",
    label: "Business / Company",
    description: "Services, case studies, products and team",
    nav: [
      { title: "Home", href: "/" },
      { title: "Services", href: "/services" },
      { title: "Case Studies", href: "/projects" },
      { title: "Products", href: "/catalog" },
      { title: "About", href: "/team" },
      { title: "Contact", href: "/contact" }
    ],
    titles: { services: T("What We Do", "Services"), projects: T("Case Studies", "Our work"), catalog: T("Our Products", "Solutions"), team: T("Leadership", "Our people"), partners: T("Trusted By", "Clients") }
  },
  {
    key: "restaurant",
    label: "Restaurant / Cafe",
    description: "Menu with prices, ambience gallery, chefs & reservations",
    nav: [
      { title: "Home", href: "/" },
      { title: "Menu", href: "/catalog" },
      { title: "Gallery", href: "/gallery" },
      { title: "Chefs", href: "/team" },
      { title: "Reservations", href: "/contact" }
    ],
    titles: { catalog: T("Our Menu", "Taste the difference"), services: T("Experiences", "More than a meal"), team: T("Meet the Chefs", "Kitchen"), gallery: T("Ambience", "Gallery"), testimonials: T("Guest Reviews", "Loved by foodies") }
  },
  {
    key: "gym",
    label: "Gym / Fitness",
    description: "Programs, trainers, membership plans & classes",
    nav: [
      { title: "Home", href: "/" },
      { title: "Programs", href: "/services" },
      { title: "Membership", href: "/pricing" },
      { title: "Trainers", href: "/team" },
      { title: "Gallery", href: "/gallery" },
      { title: "Contact", href: "/contact" }
    ],
    titles: { services: T("Our Programs", "Train smarter"), pricing: T("Membership Plans", "No hidden fees"), team: T("Expert Trainers", "Coaches"), testimonials: T("Transformations", "Member stories") }
  },
  {
    key: "real_estate",
    label: "Real Estate",
    description: "Property listings with prices, agents & projects",
    nav: [
      { title: "Home", href: "/" },
      { title: "Properties", href: "/catalog" },
      { title: "Projects", href: "/projects" },
      { title: "Services", href: "/services" },
      { title: "Agents", href: "/team" },
      { title: "Contact", href: "/contact" }
    ],
    titles: { catalog: T("Featured Properties", "Handpicked homes"), services: T("How We Help", "Services"), team: T("Our Agents", "Experts"), projects: T("New Projects", "Launches") }
  },
  {
    key: "hospital",
    label: "Hospital / Clinic",
    description: "Departments, doctors, health packages & appointments",
    nav: [
      { title: "Home", href: "/" },
      { title: "Departments", href: "/services" },
      { title: "Doctors", href: "/team" },
      { title: "Packages", href: "/pricing" },
      { title: "Health Blog", href: "/blogs" },
      { title: "Contact", href: "/contact" }
    ],
    titles: { services: T("Our Departments", "Specialities"), team: T("Our Doctors", "Specialists"), pricing: T("Health Packages", "Preventive care"), testimonials: T("Patient Stories", "Testimonials") }
  },
  {
    key: "agency",
    label: "Digital Marketing Agency",
    description: "Services, case studies, packages and clients",
    nav: [
      { title: "Home", href: "/" },
      { title: "Services", href: "/services" },
      { title: "Work", href: "/projects" },
      { title: "Pricing", href: "/pricing" },
      { title: "Blog", href: "/blogs" },
      { title: "Contact", href: "/contact" }
    ],
    titles: { services: T("What We Do", "Services"), projects: T("Case Studies", "Results"), pricing: T("Packages", "Simple pricing"), partners: T("Brands We Grow", "Clients"), team: T("The Crew", "Team") }
  },
  {
    key: "hotel_travel",
    label: "Hotel / Travel Agency",
    description: "Rooms & tour packages, amenities and bookings",
    nav: [
      { title: "Home", href: "/" },
      { title: "Rooms & Packages", href: "/catalog" },
      { title: "Amenities", href: "/services" },
      { title: "Gallery", href: "/gallery" },
      { title: "Contact", href: "/contact" }
    ],
    titles: { catalog: T("Rooms & Packages", "Stay & explore"), services: T("Amenities", "Comfort"), gallery: T("Moments", "Gallery"), testimonials: T("Guest Love", "Reviews") }
  },
  {
    key: "landing",
    label: "Landing Page",
    description: "Product / app launch: features, pricing, FAQ",
    nav: [
      { title: "Features", href: "/services" },
      { title: "Pricing", href: "/pricing" },
      { title: "FAQ", href: "/faq" },
      { title: "Contact", href: "/contact" }
    ],
    titles: { services: T("Everything you need", "Features"), pricing: T("Simple, honest pricing", "Pricing"), partners: T("Trusted by teams at", "Customers"), faq: T("Questions? Answers.", "FAQ") }
  },
  {
    key: "photography",
    label: "Photography / Wedding",
    description: "Portfolio, packages and love stories",
    nav: [
      { title: "Home", href: "/" },
      { title: "Portfolio", href: "/projects" },
      { title: "Packages", href: "/pricing" },
      { title: "Gallery", href: "/gallery" },
      { title: "Contact", href: "/contact" }
    ],
    titles: { projects: T("Love Stories", "Portfolio"), services: T("What We Shoot", "Services"), pricing: T("Packages", "Investment"), testimonials: T("Kind Words", "Couples") }
  },
  {
    key: "ngo",
    label: "NGO / Charity",
    description: "Causes, campaigns, impact & donations",
    nav: [
      { title: "Home", href: "/" },
      { title: "Our Causes", href: "/services" },
      { title: "Campaigns", href: "/projects" },
      { title: "Stories", href: "/blogs" },
      { title: "Donate", href: "/contact" }
    ],
    titles: { services: T("Our Causes", "Where you help"), projects: T("Campaigns", "Impact"), stats: T("Our Impact", "Numbers"), team: T("The Team", "People"), partners: T("Our Partners", "Together") }
  },
  {
    key: "interior",
    label: "Interior Design",
    description: "Project portfolio, services and designers",
    nav: [
      { title: "Home", href: "/" },
      { title: "Projects", href: "/projects" },
      { title: "Services", href: "/services" },
      { title: "Studio", href: "/team" },
      { title: "Contact", href: "/contact" }
    ],
    titles: { projects: T("Featured Projects", "Portfolio"), services: T("Our Services", "What we do"), team: T("The Studio", "Designers") }
  },
  {
    key: "construction",
    label: "Construction / Builder",
    description: "Projects, services, safety & team",
    nav: [
      { title: "Home", href: "/" },
      { title: "Projects", href: "/projects" },
      { title: "Services", href: "/services" },
      { title: "Team", href: "/team" },
      { title: "Contact", href: "/contact" }
    ],
    titles: { projects: T("Our Projects", "Built to last"), services: T("What We Build", "Services"), team: T("Leadership", "Team"), partners: T("Material Partners", "Partners") }
  }
];

const DEFAULT_TITLES: Record<TitledSection, [string, string]> = {
  services: T("Our Services", "What we offer"),
  team: T("Our Team", "People"),
  projects: T("Our Work", "Projects"),
  catalog: T("Explore", "Catalog"),
  pricing: T("Pricing", "Plans"),
  stats: T("By the Numbers", "Impact"),
  faq: T("Frequently Asked Questions", "FAQ"),
  partners: T("Our Partners", "Trusted by"),
  testimonials: T("What People Say", "Testimonials"),
  gallery: T("Gallery", "Moments"),
  news: T("Latest News", "From our blog"),
  about: T("About Us", "Who we are"),
  contact: T("Contact Us", "We'd love to hear from you")
};

export function getSiteType(key: string | null | undefined): SiteType {
  return SITE_TYPES.find((t) => t.key === key) ?? SITE_TYPES[0];
}

export function sectionTitle(type: SiteTypeKey, section: TitledSection): [string, string] {
  return getSiteType(type).titles[section] ?? DEFAULT_TITLES[section];
}
