package com.janseva.config;

import java.io.File;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

/**
 * Loads backend-java/.env or root .env into Spring Environment before DataSource initialization.
 * Pure Java implementation with zero external dependencies.
 */
public class DotenvEnvironmentPostProcessor implements EnvironmentPostProcessor {

    private static final Logger log = LoggerFactory.getLogger(DotenvEnvironmentPostProcessor.class);
    private static final String PLACEHOLDER_PASSWORD = "PUT_ACTUAL_SUPABASE_DATABASE_PASSWORD_HERE";

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        try {
            File envFile = findEnvFile();
            Map<String, Object> props = loadEnvFile(envFile);
            if (!props.isEmpty()) {
                environment.getPropertySources().addFirst(new MapPropertySource("dotenvProperties", props));
                log.info("Dotenv: Applied {} properties to Spring Environment", props.size());
            }
        } catch (Exception ex) {
            log.warn("Dotenv: Failed to apply environment properties: {}", ex.getMessage());
        }
    }

    /**
     * Initializes environment variables into System.properties prior to SpringApplication.run().
     */
    public static void initEnvironment() {
        File envFile = findEnvFile();
        loadEnvFile(envFile);
    }

    public static Map<String, Object> loadEnvFile(File file) {
        Map<String, Object> map = new HashMap<>();
        if (file != null && file.exists()) {
            try {
                List<String> lines = Files.readAllLines(file.toPath(), StandardCharsets.UTF_8);
                for (String line : lines) {
                    line = line.trim();
                    if (line.isEmpty() || line.startsWith("#")) {
                        continue;
                    }
                    int eqIdx = line.indexOf('=');
                    if (eqIdx > 0) {
                        String key = line.substring(0, eqIdx).trim();
                        String val = line.substring(eqIdx + 1).trim();
                        if ((val.startsWith("\"") && val.endsWith("\"")) || (val.startsWith("'") && val.endsWith("'"))) {
                            val = val.substring(1, val.length() - 1);
                        }
                        map.put(key, val);
                    }
                }
            } catch (Exception e) {
                log.warn("Error parsing {}: {}", file.getName(), e.getMessage());
            }
        }

        String postgresPassword = (String) map.getOrDefault("POSTGRES_PASSWORD", System.getenv("POSTGRES_PASSWORD"));
        if (postgresPassword == null) {
            postgresPassword = System.getProperty("POSTGRES_PASSWORD");
        }

        boolean hasValidSupabasePassword = postgresPassword != null 
                && !postgresPassword.trim().isEmpty() 
                && !PLACEHOLDER_PASSWORD.equalsIgnoreCase(postgresPassword.trim());

        if (hasValidSupabasePassword) {
            String jdbcUrl = (String) map.getOrDefault("POSTGRES_JDBC_URL", 
                    "jdbc:postgresql://db.ihpodvncbkipopzxtpnn.supabase.co:5432/postgres?sslmode=require");
            String user = (String) map.getOrDefault("POSTGRES_USER", "postgres");
            
            map.put("POSTGRES_JDBC_URL", jdbcUrl);
            map.put("POSTGRES_USER", user);
            map.put("POSTGRES_PASSWORD", postgresPassword);
            map.put("POSTGRES_DRIVER", "org.postgresql.Driver");
            map.put("JPA_PLATFORM", "org.hibernate.dialect.PostgreSQLDialect");

            map.put("spring.datasource.url", jdbcUrl);
            map.put("spring.datasource.username", user);
            map.put("spring.datasource.password", postgresPassword);
            map.put("spring.datasource.driver-class-name", "org.postgresql.Driver");
            map.put("spring.jpa.database-platform", "org.hibernate.dialect.PostgreSQLDialect");

            System.setProperty("POSTGRES_JDBC_URL", jdbcUrl);
            System.setProperty("POSTGRES_USER", user);
            System.setProperty("POSTGRES_PASSWORD", postgresPassword);
            System.setProperty("POSTGRES_DRIVER", "org.postgresql.Driver");
            System.setProperty("JPA_PLATFORM", "org.hibernate.dialect.PostgreSQLDialect");
            System.setProperty("spring.datasource.url", jdbcUrl);
            System.setProperty("spring.datasource.username", user);
            System.setProperty("spring.datasource.password", postgresPassword);
            System.setProperty("spring.datasource.driver-class-name", "org.postgresql.Driver");
            System.setProperty("spring.jpa.database-platform", "org.hibernate.dialect.PostgreSQLDialect");
            log.info("Database Mode: Connected to Supabase PostgreSQL at {}", jdbcUrl);
        } else {
            // Intelligent fallback: when user hasn't set the actual Supabase password yet,
            // fall back to the existing local.db SQLite database so the app and login work out-of-the-box!
            String localDbPath = findSqliteDatabasePath();
            String sqliteUrl = "jdbc:sqlite:" + localDbPath;
            
            map.put("POSTGRES_JDBC_URL", sqliteUrl);
            map.put("POSTGRES_USER", "");
            map.put("POSTGRES_PASSWORD", "");
            map.put("POSTGRES_DRIVER", "org.sqlite.JDBC");
            map.put("JPA_PLATFORM", "org.hibernate.community.dialect.SQLiteDialect");

            map.put("spring.datasource.url", sqliteUrl);
            map.put("spring.datasource.username", "");
            map.put("spring.datasource.password", "");
            map.put("spring.datasource.driver-class-name", "org.sqlite.JDBC");
            map.put("spring.jpa.database-platform", "org.hibernate.community.dialect.SQLiteDialect");

            System.setProperty("POSTGRES_JDBC_URL", sqliteUrl);
            System.setProperty("POSTGRES_USER", "");
            System.setProperty("POSTGRES_PASSWORD", "");
            System.setProperty("POSTGRES_DRIVER", "org.sqlite.JDBC");
            System.setProperty("JPA_PLATFORM", "org.hibernate.community.dialect.SQLiteDialect");
            System.setProperty("spring.datasource.url", sqliteUrl);
            System.setProperty("spring.datasource.username", "");
            System.setProperty("spring.datasource.password", "");
            System.setProperty("spring.datasource.driver-class-name", "org.sqlite.JDBC");
            System.setProperty("spring.jpa.database-platform", "org.hibernate.community.dialect.SQLiteDialect");

            log.info("Database Mode: Offline local SQLite ({}). (Supabase password in .env is not yet set)", localDbPath);
        }

        // Apply remaining custom properties
        for (Map.Entry<String, Object> entry : map.entrySet()) {
            if (System.getProperty(entry.getKey()) == null && System.getenv(entry.getKey()) == null) {
                System.setProperty(entry.getKey(), String.valueOf(entry.getValue()));
            }
        }

        return map;
    }

    private static String findSqliteDatabasePath() {
        String userDir = System.getProperty("user.dir", ".");
        File[] candidates = {
                new File(userDir, "local.db"),
                new File(userDir, "backend-java" + File.separator + "local.db"),
                new File(userDir, "data" + File.separator + "local.db"),
                new File("local.db"),
                new File("backend-java", "local.db"),
                new File("..", "local.db"),
                new File("..", "backend-java" + File.separator + "local.db")
        };
        for (File f : candidates) {
            if (f.exists() && f.isFile()) {
                return f.getAbsolutePath().replace('\\', '/');
            }
        }
        return "local.db";
    }

    public static File findEnvFile() {
        String userDir = System.getProperty("user.dir", ".");
        File[] candidates = {
                new File(userDir, ".env"),
                new File(userDir, "backend-java" + File.separator + ".env"),
                new File("backend-java", ".env"),
                new File(".env"),
                new File("..", ".env"),
                new File("..", "backend-java" + File.separator + ".env")
        };
        for (File f : candidates) {
            if (f.exists() && f.isFile()) {
                return f;
            }
        }
        return null;
    }
}
