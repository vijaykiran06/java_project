package com.janseva.util;

import java.util.List;
import java.util.Map;

public final class DomainConstants {

    private DomainConstants() {}

    public static final List<String> VALID_CATEGORIES = List.of(
            "Water Supply",
            "Roads / PWD",
            "Electricity",
            "Sanitation",
            "Drainage",
            "Street Lighting",
            "Waste Management",
            "Public Health",
            "Transport",
            "Traffic / Parking Management"
    );

    public static final Map<String, String> CATEGORY_TO_DEPARTMENT = Map.ofEntries(
            Map.entry("Water Supply", "Water Department"),
            Map.entry("Roads / PWD", "Public Works Department"),
            Map.entry("Electricity", "Electricity Department"),
            Map.entry("Sanitation", "Sanitation Department"),
            Map.entry("Drainage", "Municipal Drainage Department"),
            Map.entry("Street Lighting", "Electrical & Lighting Department"),
            Map.entry("Waste Management", "Sanitation & Waste Department"),
            Map.entry("Public Health", "Public Health Department"),
            Map.entry("Transport", "Municipal Transport Department"),
            Map.entry("Traffic / Parking Management", "Traffic / Parking Management")
    );

    public static final List<String> VALID_PRIORITIES = List.of("LOW", "MEDIUM", "HIGH", "CRITICAL");

    public static final Map<String, Integer> DEFAULT_SLA_HOURS = Map.of(
            "CRITICAL", 6,
            "HIGH", 24,
            "MEDIUM", 48,
            "LOW", 72
    );

    public static final List<String> PENDING_STATUSES = List.of(
            "SUBMITTED", "ASSIGNED", "ACKNOWLEDGED", "IN_PROGRESS", "REOPENED"
    );

    public static final List<String> RESOLVED_STATUSES = List.of(
            "RESOLVED", "CITIZEN_VERIFIED", "CLOSED"
    );
}
