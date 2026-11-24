package com.janseva;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/**
 * Verifies non-destructive compatibility with the existing local.db SQLite database
 * by inspecting a temporary copy without modifying the live file.
 */
class LocalDbCompatibilityTest {

    @TempDir
    Path tempDir;

    @Test
    void existingLocalDbSchemaUsersAndBcryptHashesAreCompatible() throws Exception {
        Path sourceDb = Path.of("local.db").toAbsolutePath().normalize();
        if (!Files.exists(sourceDb)) {
            sourceDb = Path.of("..", "data", "local.db").toAbsolutePath().normalize();
        }
        if (!Files.exists(sourceDb)) {
            sourceDb = Path.of("..", "backend", "local.db").toAbsolutePath().normalize();
        }
        assertTrue(Files.exists(sourceDb), "Expected existing SQLite database at " + sourceDb);

        Path copyDb = tempDir.resolve("local-copy.db");
        Files.copy(sourceDb, copyDb);

        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(10);

        try (Connection conn = DriverManager.getConnection("jdbc:sqlite:" + copyDb);
             Statement stmt = conn.createStatement()) {

            ResultSet deptRs = stmt.executeQuery("SELECT COUNT(*) FROM departments");
            assertTrue(deptRs.next());
            assertTrue(deptRs.getInt(1) >= 9, "Expected at least 9 departments, found " + deptRs.getInt(1));

            ResultSet userRs = stmt.executeQuery(
                    "SELECT email, password_hash, role FROM users WHERE email IN ('citizen@sih.gov.in', 'officer@sih.gov.in', 'admin@sih.gov.in')");
            int matchedUsers = 0;
            while (userRs.next()) {
                String hash = userRs.getString("password_hash");
                assertTrue(encoder.matches("password123", hash),
                        "BCryptPasswordEncoder must verify existing password_hash for " + userRs.getString("email"));
                matchedUsers++;
            }
            assertEquals(3, matchedUsers);

            ResultSet grvRs = stmt.executeQuery("SELECT COUNT(*) FROM grievances");
            assertTrue(grvRs.next());
            assertTrue(grvRs.getInt(1) >= 5);
        }
    }
}
