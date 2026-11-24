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

            // Helpful performance indexes
            stmt.execute("CREATE INDEX IF NOT EXISTS idx_grievances_citizen_id ON grievances(citizen_id)");
            stmt.execute("CREATE INDEX IF NOT EXISTS idx_grievances_officer_id ON grievances(assigned_officer_id)");
            stmt.execute("CREATE INDEX IF NOT EXISTS idx_grievances_status ON grievances(status)");
            stmt.execute("CREATE INDEX IF NOT EXISTS idx_grievances_department ON grievances(department)");
            stmt.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)");
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
        }
    }
}
