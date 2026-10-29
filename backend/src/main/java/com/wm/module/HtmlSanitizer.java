package com.wm.module;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.safety.Safelist;

/** Rich text (CKEditor) HTML se script/onclick jaisi cheezein hatata hai; formatting, images, tables, iframes (YouTube) rehte hain. */
public final class HtmlSanitizer {
    private static final Safelist SAFELIST = Safelist.relaxed()
            .addTags("figure", "figcaption", "iframe", "span", "hr", "mark", "s", "oembed")
            .addAttributes(":all", "style", "class")
            .addAttributes("a", "target", "rel")
            .addAttributes("iframe", "src", "width", "height", "frameborder", "allow", "allowfullscreen")
            .addAttributes("oembed", "url")
            .addProtocols("iframe", "src", "https");

    private HtmlSanitizer() {}

    public static String clean(String html) {
        if (html == null || html.isBlank()) return html;
        return Jsoup.clean(html, "", SAFELIST, new Document.OutputSettings().prettyPrint(false));
    }
}
