package com.wm.common;

import org.junit.jupiter.api.Test;

import java.math.BigInteger;
import java.sql.Date;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

class DataTypeUtilityTest {

    @Test
    void stringValueTrimsAndHandlesNullWords() {
        assertEquals("", DataTypeUtility.stringValue(null));
        assertEquals("", DataTypeUtility.stringValue("null"));
        assertEquals("", DataTypeUtility.stringValue("undefined"));
        assertEquals("abc", DataTypeUtility.stringValue("  abc "));
        assertEquals("12", DataTypeUtility.stringValue(12));
        assertEquals("def", DataTypeUtility.stringValue("  ", "def"));
    }

    @Test
    void stringNullAndLowerValue() {
        assertNull(DataTypeUtility.stringNullValue("   "));
        assertEquals("x", DataTypeUtility.stringNullValue(" x "));
        assertNull(DataTypeUtility.lowerValue(""));
        assertEquals("admin@abc.com", DataTypeUtility.lowerValue(" Admin@ABC.com "));
        assertTrue(DataTypeUtility.isEmpty(" "));
        assertFalse(DataTypeUtility.isEmpty("a"));
    }

    @Test
    void slugify() {
        assertEquals("annual-day-2026", DataTypeUtility.slugify("  Annual Day 2026! "));
        assertEquals("a-b", DataTypeUtility.slugify("--A__b--"));
        assertNull(DataTypeUtility.slugify("!!!"));
        assertNull(DataTypeUtility.slugify(null));
    }

    @Test
    void longAndIntegerValues() {
        assertEquals(5L, DataTypeUtility.longValue("5"));
        assertEquals(5L, DataTypeUtility.longValue(5));
        assertEquals(7L, DataTypeUtility.longValue(BigInteger.valueOf(7)));
        assertEquals(3L, DataTypeUtility.longValue(3.9d));
        assertNull(DataTypeUtility.longValue("abc"));
        assertNull(DataTypeUtility.longValue(""));
        assertNull(DataTypeUtility.longValue("all"));
        assertEquals(9L, DataTypeUtility.longValue("x", 9));
        assertEquals(10, DataTypeUtility.integerNullValue("10"));
        assertNull(DataTypeUtility.integerNullValue("99999999999"));
        assertEquals(1, DataTypeUtility.integerValue(null, 1));
    }

    @Test
    void foreignKeyValue() {
        assertNull(DataTypeUtility.getForeignKeyValue(0));
        assertNull(DataTypeUtility.getForeignKeyValue("-4"));
        assertEquals(4L, DataTypeUtility.getForeignKeyValue("4"));
    }

    @Test
    void booleanValue() {
        assertTrue(DataTypeUtility.booleanValue("true"));
        assertTrue(DataTypeUtility.booleanValue("ON"));
        assertTrue(DataTypeUtility.booleanValue(1));
        assertTrue(DataTypeUtility.booleanValue("yes"));
        assertFalse(DataTypeUtility.booleanValue("false"));
        assertFalse(DataTypeUtility.booleanValue(0));
        assertFalse(DataTypeUtility.booleanValue(null));
        assertTrue(DataTypeUtility.booleanValue(null, true));
    }

    @Test
    void dateValueAndJson() {
        LocalDate d = LocalDate.of(2026, 10, 29);
        assertEquals(d, DataTypeUtility.dateValue("2026-10-29"));
        assertEquals(d, DataTypeUtility.dateValue("2026-10-29T10:15:00"));
        assertEquals(d, DataTypeUtility.dateValue(Date.valueOf(d)));
        assertEquals(d, DataTypeUtility.dateValue(Timestamp.valueOf(d.atStartOfDay())));
        assertNull(DataTypeUtility.dateValue("29/10/2026"));
        assertNull(DataTypeUtility.dateValue(""));
        assertEquals("2026-10-29", DataTypeUtility.getJsonValue(Date.valueOf(d)));
        assertEquals("2026-10-29T10:15", DataTypeUtility.getJsonValue(LocalDateTime.of(2026, 10, 29, 10, 15)));
        assertEquals(5, DataTypeUtility.getJsonValue(5));
    }

    @Test
    void formatChecks() {
        assertTrue(DataTypeUtility.isValidEmail("a.b@school.co.in"));
        assertFalse(DataTypeUtility.isValidEmail("a@b"));
        assertFalse(DataTypeUtility.isValidEmail(null));

        assertTrue(DataTypeUtility.isValidDomain("xyz.com"));
        assertTrue(DataTypeUtility.isValidDomain("my-school.co.in"));
        assertFalse(DataTypeUtility.isValidDomain("xyz"));
        assertFalse(DataTypeUtility.isValidDomain("bad domain.com"));
        assertFalse(DataTypeUtility.isValidDomain("-x.com"));

        assertTrue(DataTypeUtility.isValidUrl("https://youtube.com/watch?v=1"));
        assertTrue(DataTypeUtility.isValidUrl("/about-us"));
        assertFalse(DataTypeUtility.isValidUrl("//evil.com"));
        assertFalse(DataTypeUtility.isValidUrl("javascript:alert(1)"));
        assertFalse(DataTypeUtility.isValidUrl("ftp://x.com"));
    }
}
