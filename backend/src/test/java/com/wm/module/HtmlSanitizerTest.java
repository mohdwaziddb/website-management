package com.wm.module;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class HtmlSanitizerTest {

    @Test
    void removesScriptsAndHandlers() {
        String out = HtmlSanitizer.clean("<p onclick=\"x()\">Hi<script>alert(1)</script></p><a href=\"javascript:alert(1)\">x</a>");
        assertFalse(out.contains("script"));
        assertFalse(out.contains("onclick"));
        assertFalse(out.contains("javascript"));
        assertTrue(out.contains("<p>Hi</p>"));
    }

    @Test
    void keepsFormattingAndYoutube() {
        String html = "<h2>T</h2><p><strong>b</strong></p><figure class=\"image\"><img src=\"/files/a.png\"></figure>"
                + "<iframe src=\"https://www.youtube.com/embed/x\"></iframe>";
        String out = HtmlSanitizer.clean(html);
        assertTrue(out.contains("<strong>b</strong>"));
        assertTrue(out.contains("<iframe src=\"https://www.youtube.com/embed/x\">"));
        assertTrue(out.contains("class=\"image\""));
    }

    @Test
    void blocksHttpIframe() {
        assertFalse(HtmlSanitizer.clean("<iframe src=\"http://evil.com\"></iframe>").contains("evil.com"));
    }
}
