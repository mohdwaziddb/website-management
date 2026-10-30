package com.wm.module;

public enum FieldType {
    TEXT("VARCHAR(255)"),
    TEXTAREA("TEXT"),
    RICHTEXT("LONGTEXT"),
    URL("VARCHAR(500)"),
    IMAGE("VARCHAR(500)"),
    FILE("VARCHAR(500)"),
    NUMBER("BIGINT"),
    /** Paisa / price: 2 decimal */
    DECIMAL("DECIMAL(12,2)"),
    DATE("DATE"),
    MONTH("TINYINT"),
    BOOLEAN("TINYINT(1)"),
    REF("BIGINT"),
    SELECT("VARCHAR(50)");

    public final String sqlType;

    FieldType(String sqlType) {
        this.sqlType = sqlType;
    }
}
