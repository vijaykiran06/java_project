import os
import sys
import sqlite3
import psycopg2
from psycopg2.extras import RealDictCursor

def load_env(env_path):
    env_vars = {}
    if not os.path.exists(env_path):
        return env_vars
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" in line:
                k, v = line.split("=", 1)
                env_vars[k.strip()] = v.strip()
    return env_vars

TABLE_ORDER = [
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
]

DDL_POSTGRES = """
CREATE TABLE IF NOT EXISTS departments (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at VARCHAR(64) DEFAULT TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS')
);

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
);

CREATE TABLE IF NOT EXISTS grievance_categories (
    id BIGSERIAL PRIMARY KEY,
    department_id BIGINT REFERENCES departments(id),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    default_priority VARCHAR(50) DEFAULT 'MEDIUM',
    sla_hours INTEGER DEFAULT 48
);

CREATE TABLE IF NOT EXISTS sla_rules (
    id BIGSERIAL PRIMARY KEY,
    category VARCHAR(255) NOT NULL,
    priority VARCHAR(50) NOT NULL,
    sla_hours INTEGER NOT NULL,
    escalation_threshold_hours INTEGER DEFAULT 4,
    UNIQUE(category, priority)
);

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
);

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
);

CREATE TABLE IF NOT EXISTS incident_grievances (
    id BIGSERIAL PRIMARY KEY,
    incident_id BIGINT NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    grievance_id BIGINT NOT NULL REFERENCES grievances(id) ON DELETE CASCADE,
    created_at VARCHAR(64) DEFAULT TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS'),
    UNIQUE(incident_id, grievance_id)
);

CREATE TABLE IF NOT EXISTS escalations (
    id BIGSERIAL PRIMARY KEY,
    grievance_id BIGINT NOT NULL REFERENCES grievances(id) ON DELETE CASCADE,
    escalated_from_officer_id BIGINT REFERENCES users(id),
    escalated_to_officer_id BIGINT REFERENCES users(id),
    reason TEXT NOT NULL,
    level INTEGER DEFAULT 1,
    status VARCHAR(50) DEFAULT 'PENDING',
    created_at VARCHAR(64) DEFAULT TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS')
);

CREATE TABLE IF NOT EXISTS ai_analysis (
    id BIGSERIAL PRIMARY KEY,
    grievance_id BIGINT REFERENCES grievances(id) ON DELETE CASCADE,
    extracted_json TEXT NOT NULL,
    raw_prompt TEXT,
    confidence DOUBLE PRECISION DEFAULT 0.9,
    missing_info TEXT,
    created_at VARCHAR(64) DEFAULT TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS')
);

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
);

CREATE TABLE IF NOT EXISTS grievance_status_history (
    id BIGSERIAL PRIMARY KEY,
    grievance_id BIGINT NOT NULL REFERENCES grievances(id) ON DELETE CASCADE,
    previous_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by_user_id BIGINT REFERENCES users(id),
    notes TEXT,
    created_at VARCHAR(64) DEFAULT TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS')
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_name VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100),
    details TEXT,
    created_at VARCHAR(64) DEFAULT TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS')
);

CREATE INDEX IF NOT EXISTS idx_grievances_citizen_id ON grievances(citizen_id);
CREATE INDEX IF NOT EXISTS idx_grievances_officer_id ON grievances(assigned_officer_id);
CREATE INDEX IF NOT EXISTS idx_grievances_status ON grievances(status);
CREATE INDEX IF NOT EXISTS idx_grievances_department ON grievances(department);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
"""

RLS_SETUP = """
-- Enable Row Level Security (RLS) on sensitive tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE grievances ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE grievance_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_grievances ENABLE ROW LEVEL SECURITY;

-- Note: The postgres superuser/owner role used by Java Spring Boot backend bypasses RLS in PostgreSQL (BYPASSRLS).
-- These policies secure direct Supabase PostgREST access from unauthorized exposure.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'departments' AND policyname = 'allow_public_read_departments') THEN
        CREATE POLICY allow_public_read_departments ON departments FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'grievance_categories' AND policyname = 'allow_public_read_categories') THEN
        CREATE POLICY allow_public_read_categories ON grievance_categories FOR SELECT USING (true);
    END IF;
END $$;
"""

def run_migration(env_file="backend-java/.env", sqlite_file="backend-java/local.db"):
    env = load_env(env_file)
    jdbc_url = env.get("POSTGRES_JDBC_URL", "")
    pg_user = env.get("POSTGRES_USER", "postgres")
    pg_pass = env.get("POSTGRES_PASSWORD", "")

    if not pg_pass or pg_pass == "PUT_ACTUAL_SUPABASE_DATABASE_PASSWORD_HERE":
        print("ERROR: Supabase password is not set in backend-java/.env.")
        print("Please enter the real password in backend-java/.env under POSTGRES_PASSWORD.")
        return False

    # Extract host, port, dbname from jdbc_url
    # e.g., jdbc:postgresql://db.ihpodvncbkipopzxtpnn.supabase.co:5432/postgres?sslmode=require
    clean_url = jdbc_url.replace("jdbc:postgresql://", "").split("?")[0]
    host_port, dbname = clean_url.split("/", 1)
    host, port = host_port.split(":", 1) if ":" in host_port else (host_port, 5432)

    print(f"Connecting to Supabase PostgreSQL at {host}:{port}/{dbname} (SSL required)...")

    try:
        pg_conn = psycopg2.connect(
            host=host,
            port=int(port),
            dbname=dbname,
            user=pg_user,
            password=pg_pass,
            sslmode="require",
            connect_timeout=10
        )
        pg_conn.autocommit = True
        print("Successfully connected to Supabase PostgreSQL!")
    except Exception as e:
        print(f"FAILED to connect to Supabase: {e}")
        return False

    # Connect to SQLite
    if not os.path.exists(sqlite_file):
        print(f"ERROR: SQLite database file not found at {sqlite_file}")
        return False

    sq_conn = sqlite3.connect(sqlite_file)
    sq_conn.row_factory = sqlite3.Row
    sq_cur = sq_conn.cursor()

    pg_cur = pg_conn.cursor()

    print("\n--- 1. Applying PostgreSQL DDL Schema ---")
    pg_cur.execute(DDL_POSTGRES)
    pg_cur.execute(RLS_SETUP)
    print("PostgreSQL tables, indexes, and RLS policies created/verified.")

    print("\n--- 2. Migrating Records from SQLite to PostgreSQL ---")
    migration_counts = {}

    for table in TABLE_ORDER:
        sq_cur.execute(f"SELECT * FROM {table}")
        rows = sq_cur.fetchall()
        sqlite_count = len(rows)

        if sqlite_count == 0:
            pg_cur.execute(f"SELECT COUNT(*) FROM {table}")
            pg_count = pg_cur.fetchone()[0]
            migration_counts[table] = {"sqlite": 0, "postgres": pg_count}
            print(f"Table '{table}': 0 records in SQLite (PostgreSQL has {pg_count})")
            continue

        columns = [desc[0] for desc in sq_cur.description]
        col_str = ", ".join(columns)
        placeholders = ", ".join(["%s"] * len(columns))

        # Build INSERT statement with ON CONFLICT DO NOTHING to ensure idempotence
        insert_sql = f"INSERT INTO {table} ({col_str}) VALUES ({placeholders}) ON CONFLICT (id) DO NOTHING"

        inserted = 0
        for r in rows:
            val_list = [r[c] for c in columns]
            pg_cur.execute(insert_sql, val_list)
            inserted += 1

        # Check total count in PostgreSQL
        pg_cur.execute(f"SELECT COUNT(*) FROM {table}")
        pg_count = pg_cur.fetchone()[0]
        migration_counts[table] = {"sqlite": sqlite_count, "postgres": pg_count}
        print(f"Table '{table}': Migrated {sqlite_count} rows -> PostgreSQL has {pg_count} total rows.")

    print("\n--- 3. Synchronizing PostgreSQL Identity Sequences ---")
    for table in TABLE_ORDER:
        try:
            seq_sql = f"SELECT setval(pg_get_serial_sequence('{table}', 'id'), COALESCE((SELECT MAX(id) FROM {table}), 1))"
            pg_cur.execute(seq_sql)
            curr_seq = pg_cur.fetchone()[0]
            print(f"Sequence for '{table}' synced to {curr_seq}")
        except Exception as e:
            print(f"Note on sequence for {table}: {e}")

    print("\n--- 4. Performing CRUD Verification Test ---")
    try:
        # Create dedicated test user
        test_email = "supabase_migration_test@sih.gov.in"
        pg_cur.execute("DELETE FROM users WHERE email = %s", (test_email,))
        pg_cur.execute(
            "INSERT INTO users (name, email, password_hash, role) VALUES (%s, %s, %s, %s) RETURNING id",
            ("Migration Test User", test_email, "$2a$10$abcdefghijklmnopqrstuvwxyz123456", "CITIZEN")
        )
        test_id = pg_cur.fetchone()[0]
        print(f"   [C] Create: Inserted test user ID {test_id}")

        pg_cur.execute("SELECT id, name, email FROM users WHERE id = %s", (test_id,))
        read_row = pg_cur.fetchone()
        assert read_row is not None and read_row[1] == "Migration Test User"
        print(f"   [R] Read: Successfully retrieved test user {read_row[1]}")

        pg_cur.execute("UPDATE users SET phone = %s WHERE id = %s", ("9999999999", test_id))
        pg_cur.execute("SELECT phone FROM users WHERE id = %s", (test_id,))
        updated_phone = pg_cur.fetchone()[0]
        assert updated_phone == "9999999999"
        print(f"   [U] Update: Verified updated phone {updated_phone}")

        pg_cur.execute("DELETE FROM users WHERE id = %s", (test_id,))
        pg_cur.execute("SELECT COUNT(*) FROM users WHERE id = %s", (test_id,))
        count_after = pg_cur.fetchone()[0]
        assert count_after == 0
        print("   [D] Delete: Cleanly deleted dedicated test user")
        print("CRUD Verification: 100% PASSED!")
    except Exception as e:
        print(f"CRUD verification FAILED: {e}")
        return False

    print("\n==========================================")
    print("      MIGRATION SUMMARY TABLE             ")
    print("==========================================")
    print(f"{'Table':<30} | {'SQLite Count':<15} | {'PostgreSQL Count':<15}")
    print("-" * 66)
    all_matched = True
    for t in TABLE_ORDER:
        counts = migration_counts[t]
        match = counts["postgres"] >= counts["sqlite"]
        match_symbol = "OK" if match else "WARN"
        print(f"{t:<30} | {counts['sqlite']:<15} | {counts['postgres']:<15} [{match_symbol}]")
        if not match:
            all_matched = False

    pg_conn.close()
    sq_conn.close()
    return all_matched

if __name__ == "__main__":
    success = run_migration()
    sys.exit(0 if success else 1)
