package com.wm.security;

import com.wm.common.ApiException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Public forms (contact / subscribe) par spam rokne ke liye: ek IP se window me itne hi request.
 * In-memory (ek server ke liye kaafi). Key me website code bhi, taaki ek site ka spam doosri ko na roke.
 */
@Component
public class PublicRateLimiter {

    private record Window(int count, Instant resetAt) {}

    private final ConcurrentHashMap<String, Window> windows = new ConcurrentHashMap<>();

    /** max se zyada = 429 */
    public void check(String key, int max, long windowSeconds) {
        Instant now = Instant.now();
        Window w = windows.compute(key, (k, old) -> old == null || old.resetAt().isBefore(now)
                ? new Window(1, now.plusSeconds(windowSeconds))
                : new Window(old.count() + 1, old.resetAt()));
        if (w.count() > max) throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "Too many requests — please try again in a few minutes.");
        if (windows.size() > 50_000) windows.entrySet().removeIf(e -> e.getValue().resetAt().isBefore(now));
    }

    /** nginx ke peeche asli IP (X-Real-IP / X-Forwarded-For ka pehla), warna socket ka */
    public static String clientIp(HttpServletRequest req) {
        String real = req.getHeader("X-Real-IP");
        if (real != null && !real.isBlank()) return real.trim();
        String fwd = req.getHeader("X-Forwarded-For");
        if (fwd != null && !fwd.isBlank()) return fwd.split(",")[0].trim();
        return req.getRemoteAddr();
    }
}
