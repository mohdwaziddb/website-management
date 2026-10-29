// Template ke fonts sirf us page par load hote hain (har font sab websites par load nahi).
// Value = Google Fonts css2 ka "family=" hissa (italic sirf un fonts ke jinke paas hai — galat axis par poori request fail hoti hai).
const GOOGLE: Record<string, string> = {
  Inter: "Inter:wght@400;500;600;700;800",
  Poppins: "Poppins:wght@400;500;600;700;800",
  Montserrat: "Montserrat:wght@400;500;600;700;800",
  Raleway: "Raleway:wght@400;500;600;700",
  Outfit: "Outfit:wght@400;500;600;700;800",
  Manrope: "Manrope:wght@400;500;600;700;800",
  "DM Sans": "DM+Sans:wght@400;500;700",
  Nunito: "Nunito:wght@400;600;700;800",
  "Josefin Sans": "Josefin+Sans:wght@400;600;700",
  "Space Grotesk": "Space+Grotesk:wght@400;500;600;700",
  Syne: "Syne:wght@500;600;700;800",
  Oswald: "Oswald:wght@400;500;600;700",
  "Bebas Neue": "Bebas+Neue",
  "Archivo Black": "Archivo+Black",
  "Baloo 2": "Baloo+2:wght@500;600;700;800",
  Merriweather: "Merriweather:ital,wght@0,400;0,700;1,400",
  Lora: "Lora:ital,wght@0,400;0,600;1,400",
  "Playfair Display": "Playfair+Display:ital,wght@0,500;0,600;0,700;1,500",
  "Cormorant Garamond": "Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500"
};

const SERIF = new Set(["Merriweather", "Lora", "Playfair Display", "Cormorant Garamond"]);

/** CSS font-family stack */
export function fontStack(name: string): string {
  return `'${name}', ${SERIF.has(name) ? "Georgia, serif" : "system-ui, sans-serif"}`;
}

export function googleFontsUrl(names: string[]): string | null {
  const fams = [...new Set(names)].map((n) => GOOGLE[n]).filter(Boolean);
  return fams.length ? `https://fonts.googleapis.com/css2?${fams.map((f) => "family=" + f).join("&")}&display=swap` : null;
}

export function isKnownFont(name: string): boolean {
  return name in GOOGLE;
}

/** <head> me ek hi <link id="wm-fonts"> — template badle to href badle */
export function loadFonts(names: string[]) {
  const url = googleFontsUrl(names);
  if (!url || typeof document === "undefined") return;
  let link = document.getElementById("wm-fonts") as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.id = "wm-fonts";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }
  if (link.href !== url) link.href = url;
}
