package com.janseva.migration;

import com.janseva.config.DotenvEnvironmentPostProcessor;
import java.io.File;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Native Java command-line migrator from SQLite local.db to Supabase PostgreSQL.
 * Reads credentials strictly from backend-java/.env or environment variables.
 */
public class SqliteToSupabaseMigrator {

    private static final Logger log = LoggerFactory.getLogger(SqliteToSupabaseMigrator.class);

    private static final String[] TABLE_ORDER = {
            "departments",
            "users",
            "grievance_categories",
            "sla_rules",
            "incidents",
            "grievances",
            "incident_grievances",
            "escalations",
            "ai_analysis",
            "locations",
            "grievance_status_history",
            "audit_logs"
    };

    public static void main(String[] args) {
        File envFile = DotenvEnvironmentPostProcessor.findEnvFile();
        Map<String, Object> env = DotenvEnvironmentPostProcessor.loadEnvFile(envFile);

        String pgUrl = getVal(env, "POSTGRES_JDBC_URL");
        String pgUser = getVal(env, "POSTGRES_USER", "postgres");
        String pgPass = getVal(env, "POSTGRES_PASSWORD");

        if (pgPass == null || pgPass.isBlank() || pgPass.contains("PUT_ACTUAL")) {
            System.err.println("ERROR: Supabase password is not set in backend-java/.env.");
            System.err.println("Please set POSTGRES_PASSWORD in backend-java/.env before running migration.");
            System.exit(1);
        }

        String sqlitePath = "backend-java/local.db";
        if (!new File(sqlitePath).exists()) {
            sqlitePath = "local.db";
        }

        System.out.println("Starting Java-based SQLite to Supabase PostgreSQL Migration...");
        try (Connection sqConn = DriverManager.getConnection("jdbc:sqlite:" + sqlitePath);
             Connection pgConn = DriverManager.getConnection(pgUrl, pgUser, pgPass)) {

            System.out.println("Connected to SQLite (" + sqlitePath + ") and Supabase PostgreSQL!");

            for (String table : TABLE_ORDER) {
                migrateTable(sqConn, pgConn, table);
                syncSequence(pgConn, table);
            }

            System.out.println("\nAll tables migrated successfully to Supabase PostgreSQL!");
        } catch (Exception ex) {
            System.err.println("Migration failed: " + ex.getMessage());
            ex.printStackTrace();
            System.exit(1);
        }
    }

    private static void migrateTable(Connection sqConn, Connection pgConn, String table) throws Exception {
        try (Statement sqStmt = sqConn.createStatement();
             ResultSet rs = sqStmt.executeQuery("SELECT * FROM " + table)) {

            ResultSetMetaData meta = rs.getMetaData();
            int colCount = meta.getColumnCount();
            List<String> colNames = new ArrayList<>();
            List<String> placeholders = new ArrayList<>();

            for (int i = 1; i <= colCount; i++) {
                colNames.add(meta.getColumnName(i));
                placeholders.add("?");
            }

            String insertSql = "INSERT INTO " + table + " (" + String.join(", ", colNames) + ") "
                    + "VALUES (" + String.join(", ", placeholders) + ") ON CONFLICT (id) DO NOTHING";

            int count = 0;
            try (PreparedStatement pgStmt = pgConn.prepareStatement(insertSql)) {
                while (rs.next()) {
                    for (int i = 1; i <= colCount; i++) {
                        pgStmt.setObject(i, rs.getObject(i));
                    }
                    pgStmt.executeUpdate();
                    count++;
                }
            }

            try (Statement pgCheckStmt = pgConn.createStatement();
                 ResultSet pgRs = pgCheckStmt.executeQuery("SELECT COUNT(*) FROM " + table)) {
                if (pgRs.next()) {
                    System.out.println("Table '" + table + "': Migrated " + count + " rows -> Total in PostgreSQL: " + pgRs.getLong(1));
                }
            }
        }
    }

    private static void syncSequence(Connection pgConn, String table) {
        try (Statement stmt = pgConn.createStatement()) {
            stmt.execute("SELECT setval(pg_get_serial_sequence('" + table + "', 'id'), COALESCE((SELECT MAX(id) FROM " + table + "), 1))");
        } catch (Exception ignored) {
        }
    }

    private static String getVal(Map<String, Object> env, String key) {
        return getVal(env, key, null);
    }

    private static String getVal(Map<String, Object> env, String key, String defaultVal) {
        Object val = env.get(key);
        if (val != null && !val.toString().isBlank()) {
            return val.toString();
        }
        String sysEnv = System.getenv(key);
        if (sysEnv != null && !sysEnv.isBlank()) {
            return sysEnv;
        }
        String sysProp = System.getProperty(key);
        if (sysProp != null && !sysProp.isBlank()) {
            return sysProp;
        }
        return defaultVal;
    }
}
