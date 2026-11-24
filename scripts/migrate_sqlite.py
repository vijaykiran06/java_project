import sqlite3
import os

def migrate_db(db_path):
    if not os.path.exists(db_path):
        print(f"Skipping {db_path} (does not exist)")
        return
    print(f"Migrating {db_path}...")
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    # 1. Create grievance_assignment_history table if not exists
    cur.execute("""
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
        )
    """)

    # 2. Check and add missing columns to grievances
    existing_cols = {c[1].lower() for c in cur.execute("PRAGMA table_info(grievances)").fetchall()}
    new_cols = [
        ("assigned_by", "INTEGER REFERENCES users(id)"),
        ("assigned_at", "TEXT"),
        ("assignment_notes", "TEXT"),
        ("sla_status", "TEXT DEFAULT 'WITHIN_SLA'"),
        ("sla_breached_at", "TEXT"),
        ("resolved_by", "INTEGER REFERENCES users(id)"),
        ("resolution_summary", "TEXT"),
        ("work_performed", "TEXT"),
        ("actual_resolution_duration", "INTEGER")
    ]
    for col_name, col_type in new_cols:
        if col_name.lower() not in existing_cols:
            print(f"  Adding column {col_name}...")
            cur.execute(f"ALTER TABLE grievances ADD COLUMN {col_name} {col_type}")

    # 3. Update existing records with default sla_status if null
    cur.execute("""
        UPDATE grievances
        SET sla_status = CASE
            WHEN status IN ('RESOLVED', 'CLOSED', 'CITIZEN_VERIFIED') THEN 'RESOLVED_ON_TIME'
            WHEN is_escalated = 1 OR status = 'ESCALATED' THEN 'SLA_BREACHED'
            ELSE 'WITHIN_SLA'
        END
        WHERE sla_status IS NULL OR sla_status = ''
    """)

    # 4. Check if demo workers exist in users table
    demo_workers = [
        ("Manoj Kumar (Field Technician)", "water_worker@sih.gov.in", "OFFICER", 1, "9876543220", "Zone 1"),
        ("Anil Sharma (Road Supervisor)", "pwd_worker@sih.gov.in", "OFFICER", 2, "9876543221", "Zone 2"),
        ("Rakesh Verma (Lineman Senior)", "elec_worker@sih.gov.in", "OFFICER", 3, "9876543222", "Zone 3"),
        ("Suresh Rao (Sanitation Field Lead)", "sanitation_worker@sih.gov.in", "OFFICER", 4, "9876543224", "Zone 4"),
        ("Kamal Kant (Drainage Supervisor)", "drainage_worker@sih.gov.in", "OFFICER", 5, "9876543226", "Zone 3"),
        ("Alok Mathur (Lighting Inspector)", "lighting_officer@sih.gov.in", "OFFICER", 6, "9876543227", "Zone 1"),
        ("Kavita Reddy (Waste Management Lead)", "waste_officer@sih.gov.in", "OFFICER", 7, "9876543228", "Zone 4"),
        ("Dr. S. K. Mehra (Health Officer)", "health_officer@sih.gov.in", "OFFICER", 8, "9876543229", "Zone 2"),
        ("Jagdish Singh (Transit Inspector)", "transport_officer@sih.gov.in", "OFFICER", 9, "9876543230", "Zone 3"),
        ("Sanjay Yadav (Traffic Marshal)", "traffic_worker@sih.gov.in", "OFFICER", 10, "9876543231", "Zone 1")
    ]
    pwd_hash = "$2a$10$DWKuwUZElLsu2TWomQG4perHFtEjvJ2bpcsUTvzGjQOEjSyvFOyfm"
    for name, email, role, dept_id, phone, zone in demo_workers:
        user_exists = cur.execute("SELECT count(*) FROM users WHERE email = ?", (email,)).fetchone()[0]
        if not user_exists:
            cur.execute("""
                INSERT INTO users (name, email, password_hash, role, department_id, phone, zone)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (name, email, pwd_hash, role, dept_id, phone, zone))
            print(f"  Inserted demo worker: {name}")

    conn.commit()
    conn.close()
    print(f"Finished migrating {db_path} successfully.")

if __name__ == "__main__":
    migrate_db("backend-java/local.db")
    migrate_db("data/local.db")
