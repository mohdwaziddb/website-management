package com.wm.common;

import java.time.LocalDate;

/**
 * Strict getters: value galat / missing ho to ApiException 400 ("{label} is required" etc).
 * Values DataTypeUtility se hi nikalti hain.
 */
public final class ValidationUtility {

    private ValidationUtility() {
    }

    public static String requiredString(Object value, String label, int maxLength) {
        String s = DataTypeUtility.stringNullValue(value);
        if (s == null) throw ApiException.badRequest(label + " is required");
        return maxLength(s, maxLength, label);
    }

    /** Khaali => null; bhara ho to max length check */
    public static String optionalString(Object value, String label, int maxLength) {
        return maxLength(DataTypeUtility.stringNullValue(value), maxLength, label);
    }

    public static String maxLength(String value, int maxLength, String label) {
        if (value != null && value.length() > maxLength) {
            throw ApiException.badRequest(label + " is too long (max " + maxLength + ")");
        }
        return value;
    }

    public static String requiredEmail(Object value, String label) {
        String s = DataTypeUtility.lowerValue(value);
        if (s == null) throw ApiException.badRequest(label + " is required");
        if (!DataTypeUtility.isValidEmail(s)) throw ApiException.badRequest(label + " is not a valid email");
        return s;
    }

    public static String optionalEmail(Object value, String label) {
        String s = DataTypeUtility.lowerValue(value);
        if (s != null && !DataTypeUtility.isValidEmail(s)) throw ApiException.badRequest(label + " is not a valid email");
        return s;
    }

    /** 8-100 characters */
    public static String requiredPassword(Object value, String label) {
        String s = DataTypeUtility.stringNullValue(value);
        if (s == null) throw ApiException.badRequest(label + " is required");
        if (s.length() < 8 || s.length() > 100) throw ApiException.badRequest(label + " must be 8-100 characters");
        return s;
    }

    public static long requiredLong(Object value, String label) {
        if (DataTypeUtility.isEmpty(value)) throw ApiException.badRequest(label + " is required");
        Long l = DataTypeUtility.longValue(value);
        if (l == null) throw ApiException.badRequest(label + " must be a number");
        return l;
    }

    public static LocalDate requiredDate(Object value, String label) {
        if (DataTypeUtility.isEmpty(value)) throw ApiException.badRequest(label + " is required");
        LocalDate d = DataTypeUtility.dateValue(value);
        if (d == null) throw ApiException.badRequest(label + " must be a date (yyyy-mm-dd)");
        return d;
    }
}
