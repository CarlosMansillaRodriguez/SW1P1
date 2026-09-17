package com.erdtool.backend.generator;

public class nameUtils {
    public static String toClassName(String raw) {
        String[] parts = raw.replaceAll("[^a-zA-Z0-9]", "_").split("_");
        StringBuilder sb = new StringBuilder();
        for (String p : parts) {
            if (p.isEmpty()) continue;
            sb.append(Character.toUpperCase(p.charAt(0))).append(p.substring(1).toLowerCase());
        }
        return sb.length() == 0 ? "Entity" : sb.toString();
    }

    public static String toFieldName(String raw) {
        String className = toClassName(raw);
        return Character.toLowerCase(className.charAt(0)) + className.substring(1);
    }

    public static String toTableName(String raw) {
        return raw.replaceAll("[^a-zA-Z0-9]", "_").toLowerCase();
    }
}