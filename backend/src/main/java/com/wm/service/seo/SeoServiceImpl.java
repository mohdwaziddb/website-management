package com.wm.service.seo;

import com.wm.common.DataTypeUtility;
import com.wm.service.settings.WebsiteSettingsService;
import com.wm.settings.SiteTypeCatalog;
import com.wm.tenant.TenantContext;
import com.wm.tenant.TenantDataSources;
import org.jsoup.Jsoup;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;

import java.util.*;

@Service
public class SeoServiceImpl implements SeoService {
    static final int MAX_URLS = 5000;

    /** module -> website URL prefix (slug wale detail pages) */
    static final Map<String, String> SLUG_PAGES = new LinkedHashMap<>();

    static {
        SLUG_PAGES.put("pages", "/page/");
        SLUG_PAGES.put("blogs", "/blog/");
        SLUG_PAGES.put("news_categories", "/category/");
        SLUG_PAGES.put("news_posts", "/news/");
        SLUG_PAGES.put("product_categories", "/shop/category/");
        SLUG_PAGES.put("products", "/product/");
    }

    @Autowired
    private TenantDataSources ds;

    @Autowired
    private WebsiteSettingsService websiteSettingsService;

    @Override
    public String sitemap(String baseUrl) {
        JdbcTemplate db = ds.current();
        SiteTypeCatalog.SiteType type = SiteTypeCatalog.get(websiteSettingsService.getSettings().get("site_type"));
        StringBuilder xml = new StringBuilder("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n");
        int count = 0;
        List<String> fixed = new ArrayList<>(List.of("/", "/contact", "/gallery", "/blogs"));
        if (type.modules().contains("products")) fixed.add("/shop");
        if (type.modules().contains("news_posts")) fixed.add("/news");
        for (String p : fixed) {
            url(xml, baseUrl + p, null, "/".equals(p) ? "1.0" : "0.6");
            count++;
        }
        for (var e : SLUG_PAGES.entrySet()) {
            // sirf is website type ke modules (school par products ka sitemap nahi)
            if (!type.modules().contains(e.getKey()) || count >= MAX_URLS) continue;
            for (Map<String, Object> r : db.queryForList("SELECT slug, COALESCE(updated_on, created_on) AS changed FROM `" + e.getKey()
                    + "` WHERE is_deleted = 0 AND is_active = 1 AND is_publish = 1 AND slug IS NOT NULL ORDER BY id DESC LIMIT ?", MAX_URLS - count)) {
                url(xml, baseUrl + e.getValue() + DataTypeUtility.stringValue(r.get("slug")), r.get("changed"), "0.8");
                count++;
            }
        }
        return xml.append("</urlset>\n").toString();
    }

    private static void url(StringBuilder xml, String loc, Object changed, String priority) {
        xml.append("  <url><loc>").append(HtmlUtils.htmlEscape(loc)).append("</loc>");
        if (changed != null) xml.append("<lastmod>").append(String.valueOf(changed), 0, 10).append("</lastmod>");
        xml.append("<priority>").append(priority).append("</priority></url>\n");
    }

    @Override
    public String robots(String baseUrl) {
        return "User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /account\nDisallow: /checkout\nDisallow: /cart\nDisallow: /login\n\nSitemap: " + baseUrl + "/sitemap.xml\n";
    }

    @Override
    public String shareHtml(String baseUrl, String path) {
        Map<String, String> s = websiteSettingsService.getSettings();
        String siteName = DataTypeUtility.stringValue(s.get("site_name"), TenantContext.require().name());
        String title = DataTypeUtility.stringValue(s.get("seo_title"), siteName);
        String description = DataTypeUtility.stringValue(s.get("seo_description"), DataTypeUtility.stringValue(s.get("tagline")));
        String image = DataTypeUtility.stringNullValue(s.get("share_image")) != null ? s.get("share_image") : s.get("logo");
        String clean = cleanPath(path);

        Map<String, Object> row = detailRow(clean);
        if (row != null) {
            title = DataTypeUtility.stringValue(row.get("title")) + " | " + siteName;
            String text = DataTypeUtility.stringNullValue(row.get("summary"));
            if (text == null) text = Jsoup.parse(DataTypeUtility.stringValue(row.get("body"))).text();
            if (!text.isBlank()) description = text.length() > 200 ? text.substring(0, 197) + "…" : text;
            if (row.get("image") != null) image = String.valueOf(row.get("image"));
        }
        String url = baseUrl + clean;
        String img = image == null ? null : image.startsWith("http") ? image : baseUrl + image;
        StringBuilder h = new StringBuilder("<!doctype html><html><head><meta charset=\"utf-8\">");
        h.append("<title>").append(e(title)).append("</title>");
        meta(h, "name", "description", description);
        meta(h, "property", "og:type", row != null ? "article" : "website");
        meta(h, "property", "og:site_name", siteName);
        meta(h, "property", "og:title", title);
        meta(h, "property", "og:description", description);
        meta(h, "property", "og:url", url);
        if (img != null) meta(h, "property", "og:image", img);
        meta(h, "name", "twitter:card", img != null ? "summary_large_image" : "summary");
        h.append("<link rel=\"canonical\" href=\"").append(e(url)).append("\">");
        // insaan khole to asli page par
        h.append("<meta http-equiv=\"refresh\" content=\"0;url=").append(e(url)).append("\">");
        h.append("</head><body><a href=\"").append(e(url)).append("\">").append(e(title)).append("</a></body></html>");
        return h.toString();
    }

    /** /news/abc?x=1#y -> /news/abc ; bahar ka URL / ajeeb path -> / */
    static String cleanPath(String path) {
        if (path == null || !path.startsWith("/") || path.startsWith("//")) return "/";
        String p = path.split("[?#]")[0];
        return p.matches("^/[A-Za-z0-9/_.-]*$") ? p : "/";
    }

    private Map<String, Object> detailRow(String path) {
        for (var e : SLUG_PAGES.entrySet()) {
            if (!path.startsWith(e.getValue())) continue;
            String slug = path.substring(e.getValue().length());
            if (slug.isEmpty() || slug.contains("/")) continue;
            String table = e.getKey();
            String cols = switch (table) {
                case "pages" -> "title, NULL AS summary, page_body AS body, banner_image AS image";
                case "blogs", "news_posts" -> "title, summary, body, cover_image AS image";
                case "products" -> "title, summary, description AS body, cover_image AS image";
                default -> "title, description AS summary, NULL AS body, " + ("product_categories".equals(table) ? "image" : "NULL") + " AS image";
            };
            List<Map<String, Object>> rows = ds.current().queryForList("SELECT " + cols + " FROM `" + table
                    + "` WHERE slug = ? AND is_deleted = 0 AND is_active = 1 AND is_publish = 1 LIMIT 1", slug);
            if (!rows.isEmpty()) return rows.get(0);
        }
        return null;
    }

    private static void meta(StringBuilder h, String attr, String key, String content) {
        if (content == null || content.isBlank()) return;
        h.append("<meta ").append(attr).append("=\"").append(key).append("\" content=\"").append(e(content)).append("\">");
    }

    private static String e(String s) {
        return HtmlUtils.htmlEscape(s == null ? "" : s);
    }
}
