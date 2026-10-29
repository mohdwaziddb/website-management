// Host se pehchano ki ye platform (hamara product) hai ya kisi client ki website — backend TenantResolver jaisa hi.
//   yourdomain.com, www.yourdomain.com, admin.yourdomain.com, IP, localhost -> platform (marketing site + /admin super admin)
//   abc.yourdomain.com                                                      -> client website (subdomain)
//   xyz.com / www.xyz.com                                                   -> client website (apna domain)
export const BASE_DOMAIN = (import.meta.env.VITE_BASE_DOMAIN || "localhost").toLowerCase();
const RESERVED = ["www", "admin", "api", "app", "mail"];

export function isPlatformHost(rawHost: string, baseDomain = BASE_DOMAIN): boolean {
  const host = rawHost.toLowerCase().replace(/\.$/, "");
  if (!host.includes(".") || /^[0-9.]+$/.test(host) || host.includes(":")) return true;
  if (host === baseDomain) return true;
  if (host.endsWith("." + baseDomain)) {
    let sub = host.slice(0, -(baseDomain.length + 1));
    if (sub.startsWith("www.")) sub = sub.slice(4);
    return RESERVED.includes(sub);
  }
  return false;
}

export const IS_PLATFORM = isPlatformHost(window.location.hostname);

/** /admin ke andar = admin panel (super admin ya website admin), baaki = public site / marketing site */
export const ADMIN_BASE = "/admin";

export function isAdminPath(pathname: string): boolean {
  return pathname === ADMIN_BASE || pathname.startsWith(ADMIN_BASE + "/");
}

/** Super admin panel se kisi website ka URL (subdomain pehle, warna custom domain). Dev me port saath. */
export function tenantUrl(t: { subdomain: string | null; customDomain: string | null }, path = "/"): string {
  const { protocol, port } = window.location;
  const host = t.subdomain ? `${t.subdomain}.${BASE_DOMAIN}` : `${t.customDomain}`;
  return `${protocol}//${host}${port ? ":" + port : ""}${path}`;
}
