package com.janseva.config;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Statement;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/**
 * Ensures required tables and indexes exist in Supabase PostgreSQL or SQLite without altering or deleting existing records.
 */
@Component
public class DatabaseSchemaVerifier implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DatabaseSchemaVerifier.class);
    private final DataSource dataSource;

    public DatabaseSchemaVerifier(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public void run(String... args) {
        try (Connection conn = dataSource.getConnection()) {
            String url = conn.getMetaData().getURL();
            if (url != null && url.startsWith("jdbc:postgresql:")) {
                verifyPostgreSqlSchema(conn);
                log.info("Verified Supabase PostgreSQL database schema at {}", url);
            } else if (url != null && url.startsWith("jdbc:sqlite:")) {
                verifySqliteSchema(conn);
                log.info("Verified SQLite database schema at {}", url);
            }
        } catch (Exception e) {
            log.warn("Database schema verification notice: {}", e.getMessage());
        }
    }

    private void verifyPostgreSqlSchema(Connection conn) throws Exception {
        try (Statement stmt = conn.createStatement()) {
            stmt.execute("""
                CREATE TABLE IF NOT EXISTS departments (
                    id BIGSERIAL PRIMARY KEY,
                    name VARCHAR(255) NOT NULL UNIQUE,
                    code VARCHAR(50) NOT NULL UNIQUE,
                    description TEXT,
                    created_at VARCHAR(64) DEFAULT TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS')
                )""");

            stmt.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id BIGSERIAL PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    email VARCHAR(255) NOT NULL UNIQUE,
                    password_hash VARCHAR(255) NOT NULL,
                    role VARCHAR(50) NOT NULL DEFAULT 'CITIZEN',
                    department_id BIGINT REFERENCES departments(id),
                    phone VARCHAR(50),
                    zone VARCHAR(50) DEFAULT 'Zone 1',
                    created_at VARCHAR(64) DEFAULT TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS')
                )""");

            stmt.execute("""
                CREATE TABLE IF NOT EXISTS grievance_categories (
                    id BIGSERIAL PRIMARY KEY,
                    department_id BIGINT REFERENCES departments(id),
                    name VARCHAR(255) NOT NULL UNIQUE,
                    description TEXT,
                    default_priority VARCHAR(50) DEFAULT 'MEDIUM',
                    sla_hours INTEGER DEFAULT 48
                )""");

            stmt.execute("""
                CREATE TABLE IF NOT EXISTS sla_rules (
                    id BIGSERIAL PRIMARY KEY,
                    category VARCHAR(255) NOT NULL,
                    priority VARCHAR(50) NOT NULL,
                    sla_hours INTEGER NOT NULL,
                    escalation_threshold_hours INTEGER DEFAULT 4,
                    UNIQUE(category, priority)
                )""");

            stmt.execute("""
                CREATE TABLE IF NOT EXISTS incidents (
                    id BIGSERIAL PRIMARY KEY,
                    incident_number VARCHAR(100) UNIQUE NOT NULL,
                    title VARCHAR(255) NOT NULL,
                    description TEXT,
                    category VARCHAR(255) NOT NULL,
                    department VARCHAR(255) NOT NULL,
                    priority VARCHAR(50) NOT NULL DEFAULT 'HIGH',
                    status VARCHAR(50) DEFAULT 'OPEN',
                    primary_location VARCHAR(255),
                    affected_citizens_count INTEGER DEFAULT 1,
                    assigned_officer_id BIGINT REFERENCES users(id),
                    created_at VARCHAR(64) DEFAULT TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS')
                )""");

            stmt.execute("""
                CREATE TABLE IF NOT EXISTS grievances (
                    id BIGSERIAL PRIMARY KEY,
                    tracking_number VARCHAR(100) UNIQUE NOT NULL,
                    citizen_id BIGINT NOT NULL REFERENCES users(id),
                    category VARCHAR(255) NOT NULL,
                    subcategory VARCHAR(255),
                    department VARCHAR(255) NOT NULL,
                    priority VARCHAR(50) NOT NULL DEFAULT 'MEDIUM',
                    description TEXT NOT NULL,
                    location_text TEXT,
                    latitude DOUBLE PRECISION,
                    longitude DOUBLE PRECISION,
                    language VARCHAR(10) DEFAULT 'en',
                    status VARCHAR(50) NOT NULL DEFAULT 'SUBMITTED',
                    ai_confidence DOUBLE PRECISION DEFAULT 0.90,
                    assigned_officer_id BIGINT REFERENCES users(id),
                    sla_deadline VARCHAR(64),
                    is_escalated INTEGER DEFAULT 0,
                    escalation_level INTEGER DEFAULT 0,
                    incident_id BIGINT REFERENCES incidents(id) ON DELETE SET NULL,
                    is_duplicate INTEGER DEFAULT 0,
                    duplicate_of_id BIGINT REFERENCES grievances(id),
                    duplicate_confidence DOUBLE PRECISION DEFAULT 0.0,
                    reopen_count INTEGER DEFAULT 0,
                    reopen_reason TEXT,
                    resolution_notes TEXT,
                    resolved_at VARCHAR(64),
                    verified_at VARCHAR(64),
                    image_url TEXT,
                    created_at VARCHAR(64) DEFAULT TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS'),
                    updated_at VARCHAR(64) DEFAULT TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS')
                )""");

            stmt.execute("""
                CREATE TABLE IF NOT EXISTS incident_grievances (
                    id BIGSERIAL PRIMARY KEY,
                    incident_id BIGINT NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
                    grievance_id BIGINT NOT NULL REFERENCES grievances(id) ON DELETE CASCADE,
                    created_at VARCHAR(64) DEFAULT TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS'),
                    UNIQUE(incident_id, grievance_id)
                )""");

            stmt.execute("""
                CREATE TABLE IF NOT EXISTS escalations (
                    id BIGSERIAL PRIMARY KEY,
                    grievance_id BIGINT NOT NULL REFERENCES grievances(id) ON DELETE CASCADE,
                    escalated_from_officer_id BIGINT REFERENCES users(id),
                    escalated_to_officer_id BIGINT REFERENCES users(id),
                    reason TEXT NOT NULL,
                    level INTEGER DEFAULT 1,
                    status VARCHAR(50) DEFAULT 'PENDING',
                    created_at VARCHAR(64) DEFAULT TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS')
                )""");

            stmt.execute("""
                CREATE TABLE IF NOT EXISTS ai_analysis (
                    id BIGSERIAL PRIMARY KEY,
                    grievance_id BIGINT REFERENCES grievances(id) ON DELETE CASCADE,
                    extracted_json TEXT NOT NULL,
                    raw_prompt TEXT,
                    confidence DOUBLE PRECISION DEFAULT 0.9,
                    missing_info TEXT,
                    created_at VARCHAR(64) DEFAULT TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS')
                )""");

            stmt.execute("""
                CREATE TABLE IF NOT EXISTS locations (
                    id BIGSERIAL PRIMARY KEY,
                    grievance_id BIGINT UNIQUE REFERENCES grievances(id) ON DELETE CASCADE,
                    location_text TEXT NOT NULL,
                    latitude DOUBLE PRECISION,
                    longitude DOUBLE PRECISION,
                    address TEXT,
                    city VARCHAR(100),
                    state VARCHAR(100),
                    created_at VARCHAR(64) DEFAULT TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS')
                )""");

            stmt.execute("""
                CREATE TABLE IF NOT EXISTS grievance_status_history (
                    id BIGSERIAL PRIMARY KEY,
                    grievance_id BIGINT NOT NULL REFERENCES grievances(id) ON DELETE CASCADE,
                    previous_status VARCHAR(50),
                    new_status VARCHAR(50) NOT NULL,
                    changed_by_user_id BIGINT REFERENCES users(id),
                    notes TEXT,
                    created_at VARCHAR(64) DEFAULT TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS')
                )""");

            stmt.execute("""
                CREATE TABLE IF NOT EXISTS audit_logs (
                    id BIGSERIAL PRIMARY KEY,
                    user_id BIGINT REFERENCES users(id),
                    action VARCHAR(100) NOT NULL,
                    entity_name VARCHAR(100) NOT NULL,
                    entity_id VARCHAR(100),
                    details TEXT,
                    created_at VARCHAR(64) DEFAULT TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS')
                )""");

            stmt.execute("""
                CREATE TABLE IF NOT EXISTS grievance_assignment_history (
                    id BIGSERIAL PRIMARY KEY,
                    grievance_id BIGINT NOT NULL REFERENCES grievances(id) ON DELETE CASCADE,
                    worker_id BIGINT NOT NULL REFERENCES users(id),
                    assigned_by BIGINT REFERENCES users(id),
                    assigned_at VARCHAR(64),
                    previous_worker_id BIGINT REFERENCES users(id),
                    assignment_notes TEXT,
                    status VARCHAR(50) DEFAULT 'ACTIVE',
                    created_at VARCHAR(64) DEFAULT TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS')
                )""");

            stmt.execute("ALTER TABLE grievances ADD COLUMN IF NOT EXISTS assigned_by BIGINT REFERENCES users(id)");
            stmt.execute("ALTER TABLE grievances ADD COLUMN IF NOT EXISTS assigned_at VARCHAR(64)");
            stmt.execute("ALTER TABLE grievances ADD COLUMN IF NOT EXISTS assignment_notes TEXT");
            stmt.execute("ALTER TABLE grievances ADD COLUMN IF NOT EXISTS sla_status VARCHAR(50) DEFAULT 'WITHIN_SLA'");
            stmt.execute("ALTER TABLE grievances ADD COLUMN IF NOT EXISTS sla_breached_at VARCHAR(64)");
            stmt.execute("ALTER TABLE grievances ADD COLUMN IF NOT EXISTS resolved_by BIGINT REFERENCES users(id)");
            stmt.execute("ALTER TABLE grievances ADD COLUMN IF NOT EXISTS resolution_summary TEXT");
            stmt.execute("ALTER TABLE grievances ADD COLUMN IF NOT EXISTS work_performed TEXT");
            stmt.execute("ALTER TABLE grievances ADD COLUMN IF NOT EXISTS actual_resolution_duration BIGINT");

            String[] alterCols = {
                "ALTER TABLE grievances ALTER COLUMN created_at TYPE VARCHAR(64) USING created_at::text",
                "ALTER TABLE grievances ALTER COLUMN updated_at TYPE VARCHAR(64) USING updated_at::text",
                "ALTER TABLE grievances ALTER COLUMN sla_deadline TYPE VARCHAR(64) USING sla_deadline::text",
                "ALTER TABLE grievances ALTER COLUMN resolved_at TYPE VARCHAR(64) USING resolved_at::text",
                "ALTER TABLE grievances ALTER COLUMN verified_at TYPE VARCHAR(64) USING verified_at::text",
                "ALTER TABLE grievance_status_history ALTER COLUMN created_at TYPE VARCHAR(64) USING created_at::text",
                "ALTER TABLE audit_logs ALTER COLUMN created_at TYPE VARCHAR(64) USING created_at::text"
            };
            for (String sql : alterCols) {
                try {
                    stmt.execute(sql);
                } catch (Exception ignored) {}
            }

            // Helpful performance indexes
            stmt.execute("CREATE INDEX IF NOT EXISTS idx_grievances_citizen_id ON grievances(citizen_id)");
            stmt.execute("CREATE INDEX IF NOT EXISTS idx_grievances_officer_id ON grievances(assigned_officer_id)");
            stmt.execute("CREATE INDEX IF NOT EXISTS idx_grievances_status ON grievances(status)");
            stmt.execute("CREATE INDEX IF NOT EXISTS idx_grievances_department ON grievances(department)");
            stmt.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)");
            stmt.execute("CREATE INDEX IF NOT EXISTS idx_grievance_assignment_grievance ON grievance_assignment_history(grievance_id)");
        }
    }

    private void verifySqliteSchema(Connection conn) throws Exception {
        try (Statement stmt = conn.createStatement()) {
            stmt.execute("""
                CREATE TABLE IF NOT EXISTS departments (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL UNIQUE,
                    code TEXT NOT NULL UNIQUE,
                    description TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )""");
            stmt.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    email TEXT NOT NULL UNIQUE,
                    password_hash TEXT NOT NULL,
                    role TEXT CHECK(role IN ('CITIZEN', 'OFFICER', 'DEPARTMENT_ADMIN', 'SUPER_ADMIN')) NOT NULL DEFAULT 'CITIZEN',
                    department_id INTEGER REFERENCES departments(id),
                    phone TEXT,
                    zone TEXT DEFAULT 'Zone 1',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )""");
            stmt.execute("""
                CREATE TABLE IF NOT EXISTS grievance_categories (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    department_id INTEGER REFERENCES departments(id),
                    name TEXT NOT NULL UNIQUE,
                    description TEXT,
                    default_priority TEXT CHECK(default_priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')) DEFAULT 'MEDIUM',
                    sla_hours INTEGER DEFAULT 48
                )""");
            stmt.execute("""
                CREATE TABLE IF NOT EXISTS sla_rules (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    category TEXT NOT NULL,
                    priority TEXT NOT NULL,
                    sla_hours INTEGER NOT NULL,
                    escalation_threshold_hours INTEGER DEFAULT 4,
                    UNIQUE(category, priority)
                )""");
            stmt.execute("""
                CREATE TABLE IF NOT EXISTS incidents (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    incident_number TEXT UNIQUE NOT NULL,
                    title TEXT NOT NULL,
                    description TEXT,
                    category TEXT NOT NULL,
                    department TEXT NOT NULL,
                    priority TEXT NOT NULL DEFAULT 'HIGH',
                    status TEXT DEFAULT 'OPEN',
                    primary_location TEXT,
                    affected_citizens_count INTEGER DEFAULT 1,
                    assigned_officer_id INTEGER REFERENCES users(id),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )""");
            stmt.execute("""
                CREATE TABLE IF NOT EXISTS grievances (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    tracking_number TEXT UNIQUE NOT NULL,
                    citizen_id INTEGER NOT NULL REFERENCES users(id),
                    category TEXT NOT NULL,
                    subcategory TEXT,
                    department TEXT NOT NULL,
                    priority TEXT CHECK(priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')) NOT NULL DEFAULT 'MEDIUM',
                    description TEXT NOT NULL,
                    location_text TEXT,
                    latitude REAL,
                    longitude REAL,
                    language TEXT DEFAULT 'en',
                    status TEXT CHECK(status IN ('SUBMITTED', 'AI_PROCESSED', 'ASSIGNED', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'CITIZEN_VERIFIED', 'CLOSED', 'ESCALATED', 'REOPENED', 'REJECTED')) NOT NULL DEFAULT 'SUBMITTED',
                    ai_confidence REAL DEFAULT 0.90,
                    assigned_officer_id INTEGER REFERENCES users(id),
                    sla_deadline TIMESTAMP,
                    is_escalated INTEGER DEFAULT 0,
                    escalation_level INTEGER DEFAULT 0,
                    incident_id INTEGER REFERENCES incidents(id) ON DELETE SET NULL,
                    is_duplicate INTEGER DEFAULT 0,
                    duplicate_of_id INTEGER REFERENCES grievances(id),
                    duplicate_confidence REAL DEFAULT 0.0,
                    reopen_count INTEGER DEFAULT 0,
                    reopen_reason TEXT,
                    resolution_notes TEXT,
                    resolved_at TIMESTAMP,
                    verified_at TIMESTAMP,
                    image_url TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )""");
            stmt.execute("""
                CREATE TABLE IF NOT EXISTS incident_grievances (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    incident_id INTEGER NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
                    grievance_id INTEGER NOT NULL REFERENCES grievances(id) ON DELETE CASCADE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(incident_id, grievance_id)
                )""");
            stmt.execute("""
                CREATE TABLE IF NOT EXISTS escalations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    grievance_id INTEGER NOT NULL REFERENCES grievances(id) ON DELETE CASCADE,
                    escalated_from_officer_id INTEGER REFERENCES users(id),
                    escalated_to_officer_id INTEGER REFERENCES users(id),
                    reason TEXT NOT NULL,
                    level INTEGER DEFAULT 1,
                    status TEXT DEFAULT 'PENDING',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )""");
            stmt.execute("""
                CREATE TABLE IF NOT EXISTS ai_analysis (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    grievance_id INTEGER REFERENCES grievances(id) ON DELETE CASCADE,
                    extracted_json TEXT NOT NULL,
                    raw_prompt TEXT,
                    confidence REAL DEFAULT 0.9,
                    missing_info TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )""");
            stmt.execute("""
                CREATE TABLE IF NOT EXISTS locations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    grievance_id INTEGER UNIQUE REFERENCES grievances(id) ON DELETE CASCADE,
                    location_text TEXT NOT NULL,
                    latitude REAL,
                    longitude REAL,
                    address TEXT,
                    city TEXT,
                    state TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )""");
            stmt.execute("""
                CREATE TABLE IF NOT EXISTS grievance_status_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    grievance_id INTEGER NOT NULL REFERENCES grievances(id) ON DELETE CASCADE,
                    previous_status TEXT,
                    new_status TEXT NOT NULL,
                    changed_by_user_id INTEGER REFERENCES users(id),
                    notes TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )""");
            stmt.execute("""
                CREATE TABLE IF NOT EXISTS audit_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER REFERENCES users(id),
                    action TEXT NOT NULL,
                    entity_name TEXT NOT NULL,
                    entity_id TEXT,
                    details TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )""");

            stmt.execute("""
                CREATE TABLE IF NOT EXISTS grievance_assignment_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    grievance_id INTEGER NOT NULL REFERENCES grievances(id) ON DELETE CASCADE,
                    worker_id INTEGER NOT NULL REFERENCES users(id),
                    assigned_by INTEGER REFERENCES users(id),
                    assigned_at TEXT,
                    previous_worker_id INTEGER REFERENCES users(id),
                    assignment_notes TEXT,
                    status TEXT DEFAULT 'ACTIVE',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )""");

            addSqliteColumnIfNotExists(conn, "grievances", "assigned_by", "INTEGER REFERENCES users(id)");
            addSqliteColumnIfNotExists(conn, "grievances", "assigned_at", "TEXT");
            addSqliteColumnIfNotExists(conn, "grievances", "assignment_notes", "TEXT");
            addSqliteColumnIfNotExists(conn, "grievances", "sla_status", "TEXT DEFAULT 'WITHIN_SLA'");
            addSqliteColumnIfNotExists(conn, "grievances", "sla_breached_at", "TEXT");
            addSqliteColumnIfNotExists(conn, "grievances", "resolved_by", "INTEGER REFERENCES users(id)");
            addSqliteColumnIfNotExists(conn, "grievances", "resolution_summary", "TEXT");
            addSqliteColumnIfNotExists(conn, "grievances", "work_performed", "TEXT");
            addSqliteColumnIfNotExists(conn, "grievances", "actual_resolution_duration", "INTEGER");

            seedDemoWorkersIfMissing(conn);
        }
    }

    private void addSqliteColumnIfNotExists(Connection conn, String tableName, String columnName, String columnDef) {
        try (Statement checkStmt = conn.createStatement();
             java.sql.ResultSet rs = checkStmt.executeQuery("PRAGMA table_info(" + tableName + ")")) {
            boolean exists = false;
            while (rs.next()) {
                if (columnName.equalsIgnoreCase(rs.getString("name"))) {
                    exists = true;
                    break;
                }
            }
            if (!exists) {
                try (Statement alterStmt = conn.createStatement()) {
                    alterStmt.execute("ALTER TABLE " + tableName + " ADD COLUMN " + columnName + " " + columnDef);
                    log.info("Added column {}.{}", tableName, columnName);
                }
            }
        } catch (Exception ex) {
            log.warn("Could not check/add SQLite column {}.{}: {}", tableName, columnName, ex.getMessage());
        }
    }

    private void seedDemoWorkersIfMissing(Connection conn) {
        // Ensure default departments 1-10 exist so foreign keys resolve cleanly
        Object[][] depts = {
            {1, "Water Department", "WATER", "Municipal Water Supply and Sewage Management"},
            {2, "Public Works Department", "PWD", "Roads, Bridges, and Public Infrastructure"},
            {3, "Electricity Department", "ELEC", "Power Grid, Transformers, and Supply Lines"},
            {4, "Sanitation Department", "SAN", "Public Cleanliness and Garbage Collection"},
            {5, "Municipal Drainage Department", "DRAIN", "Storm Water, Drains, and Sewer Lines"},
            {6, "Electrical & Lighting Department", "LIGHT", "Streetlights and Public Area Illuminations"},
            {7, "Sanitation & Waste Department", "WASTE", "Solid Waste Management and Landfills"},
            {8, "Public Health Department", "HEALTH", "Public Health, Sanitation, and Vector Control"},
            {9, "Municipal Transport Department", "TRANS", "Public Transit and Bus Shelters"},
            {10, "Traffic / Parking Management", "TRAFFIC", "Traffic Signals, Parking, and Road Obstructions"}
        };
        for (Object[] d : depts) {
            try (java.sql.PreparedStatement insertDept = conn.prepareStatement(
                    "INSERT OR IGNORE INTO departments (id, name, code, description) VALUES (?, ?, ?, ?)")) {
                insertDept.setInt(1, (Integer) d[0]);
                insertDept.setString(2, (String) d[1]);
                insertDept.setString(3, (String) d[2]);
                insertDept.setString(4, (String) d[3]);
                insertDept.executeUpdate();
            } catch (Exception ignored) {}
        }

        String pwdHash = "$2a$10$DWKuwUZElLsu2TWomQG4perHFtEjvJ2bpcsUTvzGjQOEjSyvFOyfm"; // password123
        Object[][] demoWorkers = {
            // name, email, role, department_id, phone, zone
            {"Manoj Kumar (Field Technician)", "water_worker@sih.gov.in", "OFFICER", 1, "9876543220", "Zone 1"},
            {"Anil Sharma (Road Supervisor)", "pwd_worker@sih.gov.in", "OFFICER", 2, "9876543221", "Zone 2"},
            {"Rakesh Verma (Lineman Senior)", "elec_worker@sih.gov.in", "OFFICER", 3, "9876543222", "Zone 3"},
            {"Ramesh Chand (Sanitation Officer)", "sanitation_officer@sih.gov.in", "OFFICER", 4, "9876543223", "Zone 1"},
            {"Suresh Rao (Sanitation Field Lead)", "sanitation_worker@sih.gov.in", "OFFICER", 4, "9876543224", "Zone 4"},
            {"Eng. Deepa Rao (Drainage Executive)", "drainage_officer@sih.gov.in", "OFFICER", 5, "9876543225", "Zone 2"},
            {"Kamal Kant (Drainage Supervisor)", "drainage_worker@sih.gov.in", "OFFICER", 5, "9876543226", "Zone 3"},
            {"Alok Mathur (Lighting Inspector)", "lighting_officer@sih.gov.in", "OFFICER", 6, "9876543227", "Zone 1"},
            {"Kavita Reddy (Waste Management Lead)", "waste_officer@sih.gov.in", "OFFICER", 7, "9876543228", "Zone 4"},
            {"Dr. S. K. Mehra (Health Officer)", "health_officer@sih.gov.in", "OFFICER", 8, "9876543229", "Zone 2"},
            {"Jagdish Singh (Transit Inspector)", "transport_officer@sih.gov.in", "OFFICER", 9, "9876543230", "Zone 3"},
            {"Sanjay Yadav (Traffic Marshal)", "traffic_worker@sih.gov.in", "OFFICER", 10, "9876543231", "Zone 1"}
        };

        for (Object[] worker : demoWorkers) {
            String email = (String) worker[1];
            try (java.sql.PreparedStatement ps = conn.prepareStatement("SELECT id FROM users WHERE email = ?")) {
                ps.setString(1, email);
                try (java.sql.ResultSet rs = ps.executeQuery()) {
                    if (!rs.next()) {
                        try (java.sql.PreparedStatement insert = conn.prepareStatement(
                                "INSERT INTO users (name, email, password_hash, role, department_id, phone, zone) VALUES (?, ?, ?, ?, ?, ?, ?)")) {
                            insert.setString(1, (String) worker[0]);
                            insert.setString(2, (String) worker[1]);
                            insert.setString(3, pwdHash);
                            insert.setString(4, (String) worker[2]);
                            insert.setInt(5, (Integer) worker[3]);
                            insert.setString(6, (String) worker[4]);
                            insert.setString(7, (String) worker[5]);
                            insert.executeUpdate();
                            log.info("Seeded demo worker: {} ({})", worker[0], email);
                        }
                    }
                }
            } catch (Exception ex) {
                log.warn("Could not seed worker {}: {}", email, ex.getMessage());
            }
        }
    }
}
