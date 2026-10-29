package com.wm.common;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.Locale;
import java.util.regex.Pattern;

/**
 * Common value getters. Request param / DB row se value hamesha isi se nikalo, taaki
 * null / "null" / "undefined" / blank / trim ka behaviour poore project me same rahe.
 * Ye methods kabhi exception nahi dete — galat value par "" / null milta hai.
 * Zaroori field (400 error) ke liye ValidationUtility use karo.
 */
public final class DataTypeUtility {
    private static final Pattern EMAIL = Pattern.compile("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");
    private static final Pattern DOMAIN = Pattern.compile("^(?=.{4,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\\.)+[a-z]{2,63}$");
    private static final Pattern URL = Pattern.compile("(?i)^(https?://\\S+|/(?!/)\\S*)$");

    private DataTypeUtility() {
    }

    // ------------------------------------------------------------ string

    /** null / "null" / "undefined" => "", warna trim kiya hua string */
    public static String stringValue(Object value) {
        if (value == null || value.toString().equalsIgnoreCase("undefined") || value.toString().equalsIgnoreCase("null")) {
            return "";
        }
        return value.toString().trim();
    }

    /** stringValue jaisa, par blank => null (DB me NULL save karne ke liye) */
    public static String stringNullValue(Object value) {
        String s = stringValue(value);
        return s.isEmpty() ? null : s;
    }

    /** trim + lowercase, blank => null (email / domain / subdomain) */
    public static String lowerValue(Object value) {
        String s = stringNullValue(value);
        return s == null ? null : s.toLowerCase(Locale.ROOT);
    }

    public static String stringValue(Object value, String defaultValue) {
        String s = stringNullValue(value);
        return s == null ? defaultValue : s;
    }

    public static boolean isEmpty(Object value) {
        return stringValue(value).isEmpty();
    }

    /** "Annual Day 2026!" => "annual-day-2026"; kuch na bache to null */
    public static String slugify(Object value) {
        String s = lowerValue(value);
        if (s == null) return null;
        s = s.replaceAll("[^a-z0-9]+", "-").replaceAll("(^-+|-+$)", "");
        return s.isEmpty() ? null : s;
    }

    // ------------------------------------------------------------ numbers

    /** Number / numeric string => Long; blank / galat => null */
    public static Long longValue(Object value) {
        if (value instanceof Long l) return l;
        if (value instanceof Integer i) return (long) i;
        if (value instanceof BigInteger b) return b.longValue();
        if (value instanceof BigDecimal b) return b.longValue();
        if (value instanceof Number n) return (long) n.doubleValue();
        String s = stringValue(value);
        if (s.isEmpty() || s.equalsIgnoreCase("all")) return null;
        try {
            return Long.parseLong(s);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    public static long longValue(Object value, long defaultValue) {
        Long l = longValue(value);
        return l == null ? defaultValue : l;
    }

    public static Integer integerNullValue(Object value) {
        Long l = longValue(value);
        if (l == null || l > Integer.MAX_VALUE || l < Integer.MIN_VALUE) return null;
        return l.intValue();
    }

    public static int integerValue(Object value, int defaultValue) {
        Integer i = integerNullValue(value);
        return i == null ? defaultValue : i;
    }

    /** id / foreign key: 0 ya negative => null */
    public static Long getForeignKeyValue(Object value) {
        Long l = longValue(value);
        return l == null || l <= 0 ? null : l;
    }

    // ------------------------------------------------------------ boolean

    /** true / 1 / on / yes => true; baaki sab (null bhi) false */
    public static boolean booleanValue(Object value) {
        if (value instanceof Boolean b) return b;
        if (value instanceof Number n) return n.intValue() != 0;
        String s = stringValue(value).toLowerCase(Locale.ROOT);
        return s.equals("true") || s.equals("1") || s.equals("on") || s.equals("yes");
    }

    public static boolean booleanValue(Object value, boolean defaultValue) {
        return value == null ? defaultValue : booleanValue(value);
    }

    // ------------------------------------------------------------ dates

    /** "2026-10-29", "2026-10-29T10:00", sql Date/Timestamp, LocalDate(Time) => LocalDate; galat => null */
    public static LocalDate dateValue(Object value) {
        if (value instanceof LocalDate d) return d;
        if (value instanceof LocalDateTime t) return t.toLocalDate();
        if (value instanceof java.sql.Date d) return d.toLocalDate();
        if (value instanceof java.sql.Timestamp t) return t.toLocalDateTime().toLocalDate();
        String s = stringValue(value);
        if (s.isEmpty()) return null;
        try {
            return LocalDate.parse(s.length() > 10 ? s.substring(0, 10) : s);
        } catch (DateTimeParseException e) {
            return null;
        }
    }

    /** DB value ko JSON-friendly banao: Date => "yyyy-MM-dd", Timestamp => ISO; baaki as-is */
    public static Object getJsonValue(Object value) {
        if (value instanceof java.sql.Date d) return d.toLocalDate().toString();
        if (value instanceof java.sql.Timestamp t) return t.toLocalDateTime().toString();
        if (value instanceof LocalDateTime t) return t.toString();
        if (value instanceof LocalDate d) return d.toString();
        return value;
    }

    // ------------------------------------------------------------ format checks

    public static boolean isValidEmail(Object value) {
        String s = stringValue(value);
        return s.length() <= 200 && EMAIL.matcher(s).matches();
    }

    /** xyz.com / my-school.co.in (lowercase) */
    public static boolean isValidDomain(Object value) {
        return DOMAIN.matcher(stringValue(value)).matches();
    }

    /** http(s)://... ya site ka relative path /about ( //evil.com nahi ) */
    public static boolean isValidUrl(Object value) {
        return URL.matcher(stringValue(value)).matches();
    }
}
