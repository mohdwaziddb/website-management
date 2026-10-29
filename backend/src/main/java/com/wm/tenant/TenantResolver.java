package com.wm.tenant;

import com.wm.common.ApiException;
import com.wm.common.DataTypeUtility;
import com.wm.config.AppProperties;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;

import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Host header se tenant pehchanta hai (nginx / vite proxy Host forward karte hain):
 *   yourdomain.com, www.yourdomain.com, admin.yourdomain.com -> null (platform: marketing site + super admin)
 *   abc.yourdomain.com / www.abc.yourdomain.com            -> SUBDOMAIN "abc"
 *   xyz.com / www.xyz.com (koi bhi aur domain)              -> DOMAIN "xyz.com"  (client ka apna domain)
 *   IP / "localhost" (bina dot)                             -> null
 * X-Tenant header (tenant code) sirf tab use hota hai jab host se kuch na mile (curl / tools).
 */
@Component
public class TenantResolver {
    public static final String HEADER = "X-Tenant";
    public static final Pattern SUBDOMAIN = Pattern.compile("^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$");
    private static final Pattern IP = Pattern.compile("^[0-9.]+$|.*:.*");

    public record HostKey(TenantRepository.Key key, String value) {}

    private final String baseDomain;
    private final Set<String> reserved;

    public TenantResolver(AppProperties props) {
        this.baseDomain = props.baseDomain().toLowerCase(Locale.ROOT);
        this.reserved = Set.copyOf(props.reservedSubdomains());
    }

    /** @return null = platform host (root domain / IP), warna lookup key */
    public HostKey fromHost(String rawHost) {
        String host = normalizeHost(rawHost);
        if (host == null || !host.contains(".") || IP.matcher(host).matches()) return null;
        if (host.equals(baseDomain)) return null;

        String suffix = "." + baseDomain;
        if (host.endsWith(suffix)) {
            String sub = host.substring(0, host.length() - suffix.length());
            if (sub.startsWith("www.")) sub = sub.substring(4);
            if (reserved.contains(sub)) return null;
            return new HostKey(TenantRepository.Key.SUBDOMAIN, sub);
        }
        return new HostKey(TenantRepository.Key.DOMAIN, normalizeDomain(host));
    }

    /** X-Tenant header = tenant code; galat format => 400. */
    public String headerCode(HttpServletRequest request) {
        String code = DataTypeUtility.lowerValue(request.getHeader(HEADER));
        if (code == null) return null;
        if (!SUBDOMAIN.matcher(code).matches()) throw ApiException.badRequest("Invalid tenant");
        return code;
    }

    /** subdomain / code format sahi hai aur reserved nahi hai */
    public boolean valid(String sub) {
        return sub != null && SUBDOMAIN.matcher(sub).matches() && !reserved.contains(sub);
    }

    public boolean isReserved(String sub) {
        return reserved.contains(sub);
    }

    /** custom domain hamare base domain ka hissa nahi ho sakta (wo subdomain se handle hota hai) */
    public boolean isOwnDomain(String domain) {
        return domain.equals(baseDomain) || domain.endsWith("." + baseDomain);
    }

    public String baseDomain() {
        return baseDomain;
    }

    /** "WWW.Xyz.com." -> "xyz.com" */
    public static String normalizeDomain(String raw) {
        String d = normalizeHost(raw);
        if (d == null) return null;
        if (d.startsWith("www.")) d = d.substring(4);
        return d;
    }

    private static String normalizeHost(String raw) {
        String h = DataTypeUtility.lowerValue(raw);
        if (h == null) return null;
        if (h.endsWith(".")) h = h.substring(0, h.length() - 1);
        return h.isEmpty() ? null : h;
    }
}
