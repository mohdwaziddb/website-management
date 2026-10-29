package com.wm.security;

import com.wm.common.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;

/** 5 galat password ke baad 10 minute lock (per tenant + email). In-memory: ek server ke liye kaafi. */
@Component
public class LoginAttemptGuard {
    private static final int MAX_FAILS = 5;
    private static final long LOCK_SECONDS = 600;

    private record Attempts(int fails, Instant lockedUntil) {}

    private final ConcurrentHashMap<String, Attempts> attempts = new ConcurrentHashMap<>();

    public void check(String key) {
        Attempts a = attempts.get(key);
        if (a != null && a.lockedUntil() != null && a.lockedUntil().isAfter(Instant.now())) {
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "Too many failed attempts. Try again in 10 minutes.");
        }
    }

    public void failed(String key) {
        attempts.compute(key, (k, a) -> {
            int fails = (a == null || a.lockedUntil() != null) ? 1 : a.fails() + 1;
            Instant lock = fails >= MAX_FAILS ? Instant.now().plusSeconds(LOCK_SECONDS) : null;
            return new Attempts(fails, lock);
        });
    }

    public void succeeded(String key) {
        attempts.remove(key);
    }
}
