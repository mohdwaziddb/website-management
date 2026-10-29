package com.wm.common;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

class ValidationUtilityTest {

    private static String error(Runnable r) {
        ApiException e = assertThrows(ApiException.class, r::run);
        assertEquals(HttpStatus.BAD_REQUEST, e.getStatus());
        return e.getMessage();
    }

    @Test
    void requiredString() {
        assertEquals("abc", ValidationUtility.requiredString(" abc ", "Name", 10));
        assertEquals("Name is required", error(() -> ValidationUtility.requiredString(" ", "Name", 10)));
        assertEquals("Name is too long (max 3)", error(() -> ValidationUtility.requiredString("abcd", "Name", 3)));
        assertNull(ValidationUtility.optionalString("", "Name", 3));
    }

    @Test
    void email() {
        assertEquals("a@b.com", ValidationUtility.requiredEmail(" A@B.com ", "Email"));
        assertEquals("Email is required", error(() -> ValidationUtility.requiredEmail(null, "Email")));
        assertEquals("Email is not a valid email", error(() -> ValidationUtility.requiredEmail("abc", "Email")));
        assertNull(ValidationUtility.optionalEmail("", "Email"));
        error(() -> ValidationUtility.optionalEmail("x@", "Email"));
    }

    @Test
    void password() {
        assertEquals("Secret@123", ValidationUtility.requiredPassword("Secret@123", "Password"));
        assertEquals("Password must be 8-100 characters", error(() -> ValidationUtility.requiredPassword("short", "Password")));
        error(() -> ValidationUtility.requiredPassword("", "Password"));
    }

    @Test
    void numbersAndDates() {
        assertEquals(12L, ValidationUtility.requiredLong("12", "Year"));
        assertEquals("Year must be a number", error(() -> ValidationUtility.requiredLong("x", "Year")));
        assertEquals("Year is required", error(() -> ValidationUtility.requiredLong("", "Year")));
        assertEquals(LocalDate.of(2026, 1, 2), ValidationUtility.requiredDate("2026-01-02", "Date"));
        assertEquals("Date must be a date (yyyy-mm-dd)", error(() -> ValidationUtility.requiredDate("02-01-2026", "Date")));
    }
}
