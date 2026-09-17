package com.erdtool.backend.generator;

public class typeMapper {
    public static String toJavaType(String dataType) {
        return switch (dataType.toUpperCase()) {
            case "VARCHAR", "TEXT" -> "String";
            case "INTEGER" -> "Integer";
            case "BOOLEAN" -> "Boolean";
            case "DATE" -> "LocalDate";
            case "TIMESTAMP" -> "LocalDateTime";
            case "DECIMAL" -> "BigDecimal";
            case "UUID" -> "UUID";
            default -> "String";
        };
    }

    public static String toSqlType(String dataType) {
        return switch (dataType.toUpperCase()) {
            case "VARCHAR" -> "VARCHAR(255)";
            case "TEXT" -> "TEXT";
            case "INTEGER" -> "INTEGER";
            case "BOOLEAN" -> "BOOLEAN";
            case "DATE" -> "DATE";
            case "TIMESTAMP" -> "TIMESTAMP";
            case "DECIMAL" -> "DECIMAL(12,2)";
            case "UUID" -> "UUID";
            default -> "VARCHAR(255)";
        };
    }

    public static String toJavaImport(String javaType) {
        return switch (javaType) {
            case "LocalDate" -> "java.time.LocalDate";
            case "LocalDateTime" -> "java.time.LocalDateTime";
            case "BigDecimal" -> "java.math.BigDecimal";
            case "UUID" -> "java.util.UUID";
            default -> null;
        };
    }
}