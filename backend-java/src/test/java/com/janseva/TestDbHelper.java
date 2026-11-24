package com.janseva;

import java.sql.Connection;
import java.sql.Statement;
import javax.sql.DataSource;

public final class TestDbHelper {

    private TestDbHelper() {}

    public static void cleanAllTables(DataSource dataSource) throws Exception {
        try (Connection conn = dataSource.getConnection(); Statement stmt = conn.createStatement()) {
            stmt.execute("DELETE FROM audit_logs");
            stmt.execute("DELETE FROM grievance_status_history");
            stmt.execute("DELETE FROM ai_analysis");
            stmt.execute("DELETE FROM locations");
            stmt.execute("DELETE FROM incident_grievances");
            stmt.execute("DELETE FROM escalations");
            stmt.execute("DELETE FROM incidents");
            stmt.execute("DELETE FROM grievances");
            stmt.execute("DELETE FROM sla_rules");
            stmt.execute("DELETE FROM grievance_categories");
            stmt.execute("DELETE FROM users");
            stmt.execute("DELETE FROM departments");
        }
    }
}
