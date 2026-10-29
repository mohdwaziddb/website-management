# Website Management (Multi-tenant)

Ek product, bahut saari websites. Har client website = **subdomain ya client ka apna domain** + apna **alag MySQL database**.

| URL | Kya khulta hai |
|---|---|
| `www.abc.com` (root) | Product ki marketing website (features, templates, contact) |
| `www.abc.com/admin` | Super admin — websites banao, domain jodo, band karo |
| `dbwebsite.abc.com` | Client ki **public website** (admin ka data + chosen template) |
| `dbwebsite.abc.com/admin` | Us website ka admin panel |
| `www.xyz.com` (client ka apna domain) | Uski public website (koi subdomain nahi) |
| `www.xyz.com/admin` | Uska admin panel |

Local me `abc.com` ki jagah `localhost` (`dbwebsite.localhost:5173`).

## Structure

```
backend/   Spring Boot 3.3, Java 21, JDBC, JWT, MySQL
  rest/            WebsiteAdminRestController, PublicWebsiteRestController, PlatformRestController
  service/<area>/  XService (interface) + XServiceImpl — saara logic yahan
  common/          DataTypeUtility (stringValue, longValue, booleanValue, dateValue ...),
                   ValidationUtility (requiredString, requiredEmail ...), GeneralResponse,
                   ResponseFactory, GlobalExceptionHandler, ApiException
  constant/        ApiPathConstants (saare API paths)
  module/          ModuleRegistry — saare modules ki definition
  tenant/          Host -> website pehchanna, DB pools, schema sync
frontend/  React 18 + Vite + TypeScript + Tailwind + framer-motion + CKEditor 5
  src/marketing/   root domain ki product website
  src/site/        client ki public website: sections (common) + 5 templates (sirf config)
  src/pages/       admin panel (TemplatesPage = 5 live previews + Apply)
  src/platform/    super admin
```

**Har API response:** `{ "success": true/false, "message": "...", "data": ... }`.
Controllers me try/catch nahi — service `ApiException` throw karti hai, `GlobalExceptionHandler` sahi status + message bhejta hai.

**Sab kuch common hai** — saare modules (Sliders, Pages, Menus, Gallery, Videos, Awards, Blogs, Tenders ...)
ek hi jagah: `backend/src/main/java/com/wm/module/ModuleRegistry.java`. Usi se DB table, CRUD API, sidebar, list aur form.
Naya module / field = registry me ek line → restart → har tenant DB me table/column auto.

## Website types + 47 templates

**15 website types** (`SiteTypeCatalog` / `frontend/src/site/siteTypes.ts`): School, Coaching, Portfolio, Business, Restaurant,
Gym, Real Estate, Hospital, Agency, Hotel/Travel, Landing Page, Photography, NGO, Interior, Construction.
- Type ke hisaab se admin menu badalta hai: common modules (Services, Team, Projects, Catalog, Pricing, FAQs, Stats, Partners …)
  har type me apne naam se — Restaurant: *Menu Items, Chefs*; Real Estate: *Properties, Agents*; Gym: *Programs, Trainers, Memberships*.
- Super admin website banate waqt type + template chunta hai; admin baad me Settings me type badal sakta hai.

**47 templates** (har type ke 3, school ke 5) — `frontend/src/site/templates/index.ts`, backend `TemplateCatalog`.
- Template = sirf config: rang, font, navbar (6 style), hero (10 style), card look, aur sections + unka style (`"services:icons"`, `"catalog:menu"` …).
- Sections (`src/site/sections/`) sab templates me common; har section ke 2-4 styles.
- Admin → **Templates** page → us type ke templates ka live preview (apne data ke saath, khaali jagah demo) → **Apply**.
- Marketing site par har template ka live demo: `www.abc.com/preview/<template>` (e.g. `/preview/noir`).

## Demo data (WordPress jaisa) + Reset

- Demo content: `backend/src/main/resources/demo/<type>.json` — **`python tools/gen_demo.py` se banta hai** (wahi edit karo, JSON nahi).
  Photos Unsplash ki (free license); import par website ke `uploads/<code>/demo/` me download hoti hain.
- Admin → Templates → **Import demo content** (ek click). Demo rows `is_demo = 1` hoti hain → **Remove demo** sirf unhe hatata hai;
  admin ka apna data (aur jis demo category me admin ne photo daali) bacha rehta hai. Settings sirf khaali hon tabhi bharti hain.
- Super admin website banate waqt "Import demo content" tick kar sakta hai.
- Admin → Settings → **Reset website**: website ka naam type karke confirm; saara content, uploads aur settings saaf
  (naam / type / template + users rehte hain). Option: reset ke baad fresh demo.

## Databases

- `wm_master` — `tenants` (code, subdomain, custom_domain ...), `super_admins`
- `wm_t_<code>` — har website ka: `users`, `activity_logs`, `site_settings` + module tables
- Purana master DB startup par apne aap upgrade (`MasterSchemaMigrator`).
- Hataye gaye modules (wings, sessions, classes, transfer_certificates) ke tables startup par har tenant DB se drop (`TenantSchemaService.REMOVED_TABLES`).

## Local run

```bash
# backend (MySQL localhost:3306, user root) — DB password: env DB_PASSWORD, ya backend/config/application.properties
# (git me nahi jaati) me:  spring.datasource.password=...  aur  app.tenant-db.password=...
cd backend
mvn spring-boot:run            # port 6900

# frontend
cd frontend
npm install
npm run dev                    # port 5173, /api + /files -> 6900 proxy
```

1. `http://localhost:5173` → marketing site; `http://localhost:5173/admin` → super admin `admin@platform.local` / `Admin@123` (**password turant badlein**)
2. "New Website" → subdomain `demo` → DB `wm_t_demo`
3. `http://demo.localhost:5173` → public website, `http://demo.localhost:5173/admin` → website admin

**Custom domain local test:** `C:\Windows\System32\drivers\etc\hosts` me `127.0.0.1 xyz.test www.xyz.test` (admin rights),
super admin me custom domain `xyz.test` daalo → `http://www.xyz.test:5173`.

## Tests

```bash
cd backend && mvn test        # 61 tests: unit + integration (local MySQL par alag wm_test_* DBs, test ke baad drop)
cd frontend && npm test       # 173 tests (vitest) — saare 47 templates render, backend keys sync, har menu ka data website par dikhta hai (coverage.test.ts)
```

## Login / Security flow

- Login → `accessToken` (60 min) + `refreshToken` (7 din). 401 par frontend apne aap refresh karta hai.
- Token me tenant `code` hota hai: `abc` ka token `xyz` par **reject**. Subdomain/domain badle to bhi code same, token chalta rahe.
- Super admin token sirf root domain par, tenant token sirf apni website par.
- Password change / user disable / role change → `token_version++` → purane sessions khatam.
- 5 galat password → 10 min lock. Roles: `ADMIN` (sab + users + settings + template), `EDITOR` (sirf content).
- Rich text HTML server par sanitize (jsoup); uploads me sirf safe extensions (SVG/HTML nahi).
- Delete = soft delete; jo record kahin use ho (category → gallery) wo delete nahi hota.

## Live deploy

1. DNS: `abc.com` + `*.abc.com` → server IP. Client ke domain (`xyz.com`, `www.xyz.com`) → same IP (A record / CNAME).
2. Backend env:
   ```
   BASE_DOMAIN=abc.com
   JWT_SECRET=<kam se kam 32 random characters>
   DB_USERNAME=... DB_PASSWORD=...
   MASTER_DB_URL=jdbc:mysql://db-host:3306/wm_master?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=Asia/Kolkata
   TENANT_DB_URL_TEMPLATE=jdbc:mysql://db-host:3306/{db}?useSSL=false&serverTimezone=Asia/Kolkata
   PLATFORM_ADMIN_PASSWORD=<strong password>
   UPLOAD_DIR=/var/wm/uploads
   ```
   DB user ko `CREATE DATABASE` permission chahiye.
3. Frontend: `VITE_BASE_DOMAIN=abc.com VITE_PRODUCT_NAME="Your Product" npm run build` → `dist/`
4. Web server — **Caddy** (custom domains ka SSL apne aap; sirf registered domains ko certificate milta hai):

```caddy
{
    on_demand_tls {
        ask http://127.0.0.1:6900/api/platform/domain-check
    }
}

https:// {
    tls {
        on_demand
    }
    encode gzip
    root * /var/www/wm/dist
    reverse_proxy /api/* 127.0.0.1:6900
    reverse_proxy /files/* 127.0.0.1:6900
    try_files {path} /index.html
    file_server
}
```

nginx use karna ho to `server_name _;` (default_server) block, `proxy_set_header Host $host;` zaroori, aur har custom domain ka certificate certbot se.
Backend **Host header** se hi website pehchanta hai.

## Main APIs

| Method | Path | Kaun |
|---|---|---|
| POST | `/api/platform/auth/login`, `/refresh` | public (root domain) |
| GET/POST/PUT | `/api/platform/tenants`, `/{id}/reset-admin` | super admin |
| GET | `/api/platform/domain-check?domain=` | public (Caddy SSL check) |
| GET | `/api/platform/demo/{type}` | public (template preview ka demo data) |
| GET / POST / DELETE | `/api/demo`, `/api/demo/import` | admin (demo status / import / remove) |
| POST | `/api/website/reset` | admin (`{ confirm, importDemo }`) |
| GET | `/api/tenant-info` | public (website domain) |
| POST | `/api/auth/login`, `/api/auth/refresh` | public (website domain) |
| GET | `/api/modules`, `/api/dashboard` | admin / editor |
| GET/POST/PUT/DELETE | `/api/m/{module}[/{id}]`, `/options`, `/reorder` | admin / editor |
| POST | `/api/files` | upload |
| GET / PUT | `/api/settings` (template bhi) | read: admin/editor, save: admin |
| GET | `/api/logs?module=&recordId=` | activity |
| CRUD | `/api/users` | admin |
| GET | `/api/public/settings`, `/api/public/m/{module}`, `/api/public/{pages\|blogs}/slug/{slug}` | public website |
