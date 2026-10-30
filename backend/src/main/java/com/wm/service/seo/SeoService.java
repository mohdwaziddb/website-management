package com.wm.service.seo;

/** Google + social share: sitemap.xml, robots.txt, bots ke liye OG tags wala HTML. baseUrl = https://abc.com (request ka host) */
public interface SeoService {

    String sitemap(String baseUrl);

    String robots(String baseUrl);

    /** WhatsApp / Facebook bots JS nahi chalate — unhe path ke hisaab se title / description / photo wala HTML */
    String shareHtml(String baseUrl, String path);
}
