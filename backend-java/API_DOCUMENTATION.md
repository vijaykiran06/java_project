# JanSeva AI — API Documentation

## Public & Auth Endpoints (Java Spring Boot — Port 8080)

### `GET /api/health`
Health check endpoint.
- **Auth**: Public
- **Response (`200`)**: `{ "status": "HEALTHY", "platform": "SIH AI Multi-Department Grievance Platform", "backend": "Java Spring Boot", "timestamp": "..." }`

### `POST /api/auth/register`
Registers a new `CITIZEN` account with BCrypt password hashing and returns a 7-day JWT.
- **Auth**: Public
- **Request**: `{ "name": "Rahul", "email": "rahul@example.com", "password": "password123", "phone": "9876543210" }`
- **Response (`201`)**: `{ "message": "Citizen account registered successfully.", "token": "...", "user": { "id": 1, "name": "Rahul", "email": "rahul@example.com", "role": "CITIZEN" } }`

### `POST /api/auth/login`
Authenticates an existing user.
- **Auth**: Public
- **Request**: `{ "email": "citizen@sih.gov.in", "password": "password123" }`
- **Response (`200`)**: `{ "message": "Login successful.", "token": "...", "user": { "id": 1, "name": "...", "email": "...", "role": "...", "department_id": null } }`

### `GET /api/auth/me`
Returns the authenticated user profile.
- **Auth**: Bearer JWT
- **Response (`200`)**: `{ "user": { "id": 1, "name": "...", "email": "...", "role": "...", "department_id": null } }`

### `GET /api/departments`
Returns all seeded departments, categories, `valid_categories`, and `category_to_department`.
- **Auth**: Public

---

## Grievance Lifecycle Endpoints

### `POST /api/grievances`
Creates a confirmed grievance, logs history/audit trail, computes SLA deadline, auto-assigns least-loaded officer, and checks for duplicates.
- **Auth**: Bearer JWT
- **Response (`201`)**: `{ "message": "...", "tracking_number": "GRV-2026-XXXXXX", "grievance": { ... }, "duplicates_detected": [ ... ] }`

### `GET /api/grievances`
Lists grievances scoped by caller role (`CITIZEN`: own; `OFFICER`: assigned or department; `DEPARTMENT_ADMIN`/`SUPER_ADMIN`: all).
- **Auth**: Bearer JWT

### `GET /api/grievances/{id}`
Retrieves a grievance by numeric `id` or `tracking_number`, along with `history` timeline. Citizens can only access their own complaints (`403` otherwise).
- **Auth**: Bearer JWT

### `PATCH /api/grievances/{id}/status`
Updates grievance status (`ACKNOWLEDGED`, `IN_PROGRESS`, `RESOLVED`, `REJECTED`), sets `resolved_at` when `RESOLVED`, and logs history/audit trail.
- **Auth**: Bearer JWT (`OFFICER`, `DEPARTMENT_ADMIN`, `SUPER_ADMIN`)

### `POST /api/grievances/{id}/verify`
Citizen resolution feedback loop. `verified: true` marks `CITIZEN_VERIFIED`; `verified: false` marks `REOPENED`, sets `is_escalated = 1`, `escalation_level = 2`, increments `reopen_count`, and records an `escalations` row.
- **Auth**: Bearer JWT (Complaint author only)

---

## AI & Analytics Endpoints

### `POST /api/ai/parse-complaint`
Conversational multi-turn grievance parser delegating intent detection, classification, and template reply generation to the Python FastAPI ML service.
- **Auth**: Bearer JWT

### `POST /api/ai/admin-assistant`
Database-grounded live metrics Q&A for officers and admins.
- **Auth**: Bearer JWT (`DEPARTMENT_ADMIN`, `SUPER_ADMIN`, `OFFICER`)

### `POST /api/ai/semantic-search`
Keyword relevance search across grievances (top 15).
- **Auth**: Bearer JWT

---

## Incident Clustering Endpoints

### `GET /api/incidents`
Lists clustered master incidents.
- **Auth**: Bearer JWT

### `POST /api/incidents/cluster-duplicates`
Scans unclustered grievances via Python duplicate check and creates `INCIDENT-XXXX` master tickets.
- **Auth**: Bearer JWT (`DEPARTMENT_ADMIN`, `SUPER_ADMIN`, `OFFICER`)

---

## Internal Python FastAPI ML Microservice Endpoints (Port 8001)
- `GET /ml/health` — Model load status, models directory, metadata, and subcategory model count
- `POST /ml/grievance/predict` — Department, category, subcategory, priority, location, explainability, safety override
- `POST /ml/intent/predict` — Intent classification (`GRIEVANCE`, `GREETING`, `THANKS`, `DENIAL`, `CONFIRMATION`, `CORRECTION`, `CAPABILITIES`, `UNKNOWN`)
- `POST /ml/duplicate/check` — Jaccard + Haversine duplicate scoring
- `POST /ml/chat/response` — Template-based response generation
