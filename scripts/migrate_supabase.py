import psycopg2

def migrate_supabase():
    print("Connecting to Supabase PostgreSQL at aws-0-ap-southeast-1.pooler.supabase.com:5432...")
    conn = psycopg2.connect(
        host="aws-0-ap-southeast-1.pooler.supabase.com",
        port=5432,
        user="postgres.ihpodvncbkipopzxtpnn",
        password="Jansevaai123",
        dbname="postgres",
        sslmode="require"
    )
    cur = conn.cursor()

    # 1. Create grievance_assignment_history table
    print("Creating grievance_assignment_history table in Supabase...")
    cur.execute("""
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
        );
    """)

    # 2. Add columns to grievances
    print("Adding columns to grievances table in Supabase...")
    cur.execute("ALTER TABLE grievances ADD COLUMN IF NOT EXISTS assigned_by BIGINT REFERENCES users(id);")
    cur.execute("ALTER TABLE grievances ADD COLUMN IF NOT EXISTS assigned_at VARCHAR(64);")
    cur.execute("ALTER TABLE grievances ADD COLUMN IF NOT EXISTS assignment_notes TEXT;")
    cur.execute("ALTER TABLE grievances ADD COLUMN IF NOT EXISTS sla_status VARCHAR(50) DEFAULT 'WITHIN_SLA';")
    cur.execute("ALTER TABLE grievances ADD COLUMN IF NOT EXISTS sla_breached_at VARCHAR(64);")
    cur.execute("ALTER TABLE grievances ADD COLUMN IF NOT EXISTS resolved_by BIGINT REFERENCES users(id);")
    cur.execute("ALTER TABLE grievances ADD COLUMN IF NOT EXISTS resolution_summary TEXT;")
    cur.execute("ALTER TABLE grievances ADD COLUMN IF NOT EXISTS work_performed TEXT;")
    cur.execute("ALTER TABLE grievances ADD COLUMN IF NOT EXISTS actual_resolution_duration BIGINT;")

    # 3. Update existing grievances sla_status
    print("Updating sla_status on existing grievances...")
    cur.execute("""
        UPDATE grievances
        SET sla_status = CASE
            WHEN status IN ('RESOLVED', 'CLOSED', 'CITIZEN_VERIFIED') THEN 'RESOLVED_ON_TIME'
            WHEN is_escalated = 1 OR status = 'ESCALATED' THEN 'SLA_BREACHED'
            ELSE 'WITHIN_SLA'
        END
        WHERE sla_status IS NULL OR sla_status = '';
    """)

    # 4. Check if demo workers exist
    print("Checking and seeding demo workers in Supabase...")
    cur.execute("SELECT name, id FROM departments")
    dept_map = {row[0].strip(): row[1] for row in cur.fetchall()}

    demo_workers = [
        ("Manoj Kumar (Field Technician)", "water_worker@sih.gov.in", "OFFICER", "Water Department", "9876543220", "Zone 1"),
        ("Anil Sharma (Road Supervisor)", "pwd_worker@sih.gov.in", "OFFICER", "Public Works Department", "9876543221", "Zone 2"),
        ("Rakesh Verma (Lineman Senior)", "elec_worker@sih.gov.in", "OFFICER", "Electricity Department", "9876543222", "Zone 3"),
        ("Suresh Rao (Sanitation Field Lead)", "sanitation_worker@sih.gov.in", "OFFICER", "Sanitation Department", "9876543224", "Zone 4"),
        ("Kamal Kant (Drainage Supervisor)", "drainage_worker@sih.gov.in", "OFFICER", "Municipal Drainage Department", "9876543226", "Zone 3"),
        ("Alok Mathur (Lighting Inspector)", "lighting_officer@sih.gov.in", "OFFICER", "Electrical & Lighting Department", "9876543227", "Zone 1"),
        ("Kavita Reddy (Waste Management Lead)", "waste_officer@sih.gov.in", "OFFICER", "Sanitation & Waste Department", "9876543228", "Zone 4"),
        ("Dr. S. K. Mehra (Health Officer)", "health_officer@sih.gov.in", "OFFICER", "Public Health Department", "9876543229", "Zone 2"),
        ("Jagdish Singh (Transit Inspector)", "transport_officer@sih.gov.in", "OFFICER", "Municipal Transport Department", "9876543230", "Zone 3")
    ]
    pwd_hash = "$2a$10$DWKuwUZElLsu2TWomQG4perHFtEjvJ2bpcsUTvzGjQOEjSyvFOyfm"
    for name, email, role, dept_name, phone, zone in demo_workers:
        cur.execute("SELECT count(*) FROM users WHERE email = %s", (email,))
        if cur.fetchone()[0] == 0:
            dept_id = dept_map.get(dept_name)
            cur.execute("""
                INSERT INTO users (name, email, password_hash, role, department_id, phone, zone)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (name, email, pwd_hash, role, dept_id, phone, zone))
            print(f"  Inserted worker: {name} in {dept_name} (ID: {dept_id})")

    conn.commit()
    conn.close()
    print("Supabase migration completed successfully!")

if __name__ == "__main__":
    migrate_supabase()
