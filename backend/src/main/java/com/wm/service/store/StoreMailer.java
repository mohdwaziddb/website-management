package com.wm.service.store;

import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;
import org.springframework.web.util.HtmlUtils;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Order / password emails — har website ka apna SMTP (Store Settings). SMTP na ho to chupchap skip (order kabhi fail nahi).
 * Background thread me jaati hain, isliye config pehle hi (request thread me) le lo.
 */
@Component
public class StoreMailer {
    private static final Logger log = LoggerFactory.getLogger(StoreMailer.class);
    private final ExecutorService pool = Executors.newFixedThreadPool(2, r -> {
        Thread t = new Thread(r, "store-mail");
        t.setDaemon(true);
        return t;
    });

    /** Async. Return turant. */
    public void send(StoreConfig cfg, String to, String subject, String html) {
        if (!cfg.mailReady() || to == null || to.isBlank()) return;
        pool.submit(() -> {
            try {
                sendNow(cfg, to, subject, html);
            } catch (Exception e) {
                log.warn("Store email to {} failed: {}", to, e.getMessage());
            }
        });
    }

    /** Sync (Settings → "Send test email") — error admin ko dikhe */
    public void sendNow(StoreConfig cfg, String to, String subject, String html) throws Exception {
        JavaMailSenderImpl sender = new JavaMailSenderImpl();
        sender.setHost(cfg.smtpHost());
        sender.setPort(cfg.smtpPort());
        sender.setUsername(cfg.smtpUsername());
        sender.setPassword(cfg.smtpPassword());
        Properties p = sender.getJavaMailProperties();
        p.put("mail.smtp.auth", String.valueOf(cfg.smtpUsername() != null));
        p.put("mail.smtp.connectiontimeout", "10000");
        p.put("mail.smtp.timeout", "15000");
        if (cfg.smtpPort() == 465) p.put("mail.smtp.ssl.enable", "true");
        else p.put("mail.smtp.starttls.enable", "true");
        MimeMessage msg = sender.createMimeMessage();
        MimeMessageHelper h = new MimeMessageHelper(msg, "UTF-8");
        h.setFrom(cfg.smtpFrom(), cfg.businessName() != null ? cfg.businessName() : cfg.smtpFrom());
        h.setTo(to);
        h.setSubject(subject);
        h.setText(html, true);
        sender.send(msg);
    }

    // ------------------------------------------------------------ templates

    static String esc(Object v) {
        return v == null ? "" : HtmlUtils.htmlEscape(String.valueOf(v));
    }

    static String rupees(Object v) {
        BigDecimal d = v instanceof BigDecimal b ? b : new BigDecimal(String.valueOf(v == null ? "0" : v));
        return "₹" + String.format("%,.2f", d);
    }

    public static String layout(String storeName, String title, String body) {
        return "<div style=\"font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#0f172a\">"
                + "<h2 style=\"margin:0 0 4px\">" + esc(storeName) + "</h2>"
                + "<h3 style=\"margin:16px 0 8px;color:#334155\">" + esc(title) + "</h3>" + body
                + "<p style=\"color:#64748b;font-size:12px;margin-top:24px\">This is an automated email from " + esc(storeName) + ".</p></div>";
    }

    /** Order summary table (customer + admin dono ko) */
    static String orderTable(Map<String, Object> order, List<Map<String, Object>> items) {
        StringBuilder rows = new StringBuilder();
        for (Map<String, Object> it : items) {
            rows.append("<tr><td style=\"padding:6px;border-bottom:1px solid #e2e8f0\">").append(esc(it.get("title")))
                    .append(it.get("variant_title") != null ? " <small>(" + esc(it.get("variant_title")) + ")</small>" : "")
                    .append(" × ").append(esc(it.get("qty"))).append("</td><td style=\"padding:6px;text-align:right;border-bottom:1px solid #e2e8f0\">")
                    .append(rupees(it.get("line_total"))).append("</td></tr>");
        }
        StringBuilder t = new StringBuilder("<table style=\"width:100%;border-collapse:collapse;font-size:14px\">").append(rows);
        line(t, "Subtotal", order.get("subtotal"));
        if (new BigDecimal(String.valueOf(order.get("discount"))).signum() > 0) line(t, "Discount (" + esc(order.get("coupon_code")) + ")", "-" + rupees(order.get("discount")));
        line(t, "Shipping", order.get("shipping"));
        if (new BigDecimal(String.valueOf(order.get("cod_fee"))).signum() > 0) line(t, "COD charge", order.get("cod_fee"));
        line(t, "GST" + (Boolean.TRUE.equals(order.get("prices_include_tax")) || "1".equals(String.valueOf(order.get("prices_include_tax"))) || "true".equals(String.valueOf(order.get("prices_include_tax"))) ? " (included)" : ""), order.get("tax"));
        t.append("<tr><td style=\"padding:8px 6px;font-weight:bold\">Total</td><td style=\"padding:8px 6px;text-align:right;font-weight:bold\">")
                .append(rupees(order.get("total"))).append("</td></tr></table>");
        t.append("<p style=\"font-size:14px\"><b>Ship to:</b> ").append(esc(order.get("ship_name"))).append(", ").append(esc(order.get("ship_line1")))
                .append(order.get("ship_line2") != null ? ", " + esc(order.get("ship_line2")) : "").append(", ").append(esc(order.get("ship_city")))
                .append(", ").append(esc(order.get("ship_state"))).append(" - ").append(esc(order.get("ship_pincode")))
                .append("<br>Phone: ").append(esc(order.get("ship_phone"))).append("</p>");
        return t.toString();
    }

    private static void line(StringBuilder t, String label, Object amount) {
        String v = amount instanceof String s && s.startsWith("-") ? s : rupees(amount);
        t.append("<tr><td style=\"padding:4px 6px;color:#475569\">").append(label).append("</td><td style=\"padding:4px 6px;text-align:right\">").append(v).append("</td></tr>");
    }
}
