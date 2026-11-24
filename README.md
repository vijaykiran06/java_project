# JanSeva AI — Unified Multi-Department Grievance Redressal Platform

> **AI-Powered Civic Grievance Lodging, Classification, and Redressal System**  
> *"Enabling citizens to lodge, track, and resolve civic grievances across multiple government departments using an enterprise Java Spring Boot backend, a 100% local self-trained machine learning model, and an intuitive React interface."*

---

## 🏛️ System Architecture

JanSeva AI is structured as a modern, decoupled multi-service system:

```text
       React + Vite Frontend (Port 5173 / 3000)
                         │
                         ▼ (REST / JSON via Vite Proxy)
      Java Spring Boot 3.4 Backend (Port 8080)
        ├── Spring Security + HS256 JWT Authentication
        ├── Spring Data JPA & Hibernate
        ├── Supabase PostgreSQL / SQLite Relational Database
        ├── Automated SLA Escalation Engine (@Scheduled every 30s)
        ├── Intelligent Officer Workload Balancing & Routing
        └── Internal REST Client (RestClient)
                         │
                         ▼ (Internal REST API)
     Python FastAPI ML Microservice (Port 8001)
        ├── Scikit-Learn TF-IDF + LinearSVC Pipeline (Joblib)
        ├── 10 Multi-Department & Subcategory Classifiers
        ├── Deterministic Life-Hazard Safety Override Layer
        └── Cosine Similarity Duplicate Detector
```

---

## 🚀 Key Architectural Highlights

1. **Enterprise Java Spring Boot Backend (`backend-java/`)**:
   - Built on **Java 21/23** and **Spring Boot 3.4.x**.
   - Strict MVC architecture: Entities, Repositories, Services, DTOs, Controllers, Security Filters, and Global Exception Handlers.
   - Core OOP design: Inheritance (`BaseEntity`, `TimestampedEntity`), Encapsulation, Polymorphism, and Service Abstractions.
   - Secure environment management via `.env` property injection (no hardcoded credentials).

2. **100% Local Self-Trained Machine Learning Microservice (`backend-java/python-ml-service/`)**:
   - Grievance & intent classification operate **100% locally and offline** using a custom scikit-learn pipeline (`TF-IDF + LinearSVC`).
   - **No external AI API keys required** (Zero dependency on OpenAI, Gemini, or cloud LLMs).
   - **Sub-15ms inference latency** directly in memory via FastAPI.
   - **Safety First**: Deterministic safety overrides for life hazards (live wires, sparking transformers, gas leaks, open manholes).
   - Accurately distinguishes road damage from illegal parking, vehicle blockage, and traffic congestion.

3. **Modern React Frontend (`frontend/`)**:
   - Built with **React 18**, **Vite 6**, **Lucide-React**, and clean responsive styles.
   - Interactive conversational AI Grievance Assistant with voice and text input.
   - Real-time previews, tracking timelines, GIS location mapping, and officer dashboards.

---

## 🔑 Demo Credentials & Roles

| Role | Email | Password | Access Rights & Responsibilities |
| :--- | :--- | :--- | :--- |
| **Citizen** | `citizen@sih.gov.in` | `password123` | Conversational Lodging, My Grievances, Resolution Verification |
| **Water Officer** | `officer@sih.gov.in` | `password123` | Water Department Workflow, Status Updates, Resolution Proof |
| **PWD Officer** | `pwd_officer@sih.gov.in` | `password123` | Road / PWD Department Workflow, Pothole Redressal |
| **Electricity Officer** | `elec_officer@sih.gov.in` | `password123` | Electricity Outages, Live Wire & Transformer Redressal |
| **Super Admin** | `admin@sih.gov.in` | `password123` | Executive KPI Overview, Duplicate Cluster Manager, GIS Map, AI Analyst |

---

## 💻 How to Run the Application

### Step 1: Start the Python ML Microservice (Port 8001)
```bash
cd backend-java/python-ml-service
pip install -r requirements.txt
python -m uvicorn app.main:app --port 8001
```
*Health Check: `http://localhost:8001/ml/health`*

### Step 2: Start the Java Spring Boot Backend (Port 8080)
```bash
cd backend-java
mvn spring-boot:run
```
*Runs on `http://localhost:8080` (Loads environment variables from `backend-java/.env`).*

### Step 3: Start the React Frontend (Port 5173 / 3000)
```bash
cd frontend
npm install
npm run dev
```
*Access the application in your browser at `http://localhost:5173`.*

---

## 🧪 Running Verification Tests

### 1. Java Spring Boot Backend Tests (JUnit 5 & Mockito)
```bash
cd backend-java
mvn test
```
*Runs all 13 controller, security, repository, and SLA integration tests.*

### 2. Python ML Microservice Tests (Pytest)
```bash
cd backend-java/python-ml-service
python -m pytest tests/ -v
```
*Validates model inference, intent prediction, duplicate detection, and 22 diverse grievance classification tests.*

### 3. Frontend Production Build
```bash
cd frontend
npm run build
```
*Verifies complete client-side compilation and bundle generation.*

---

## 📡 REST API Reference

| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | System status and database connectivity check |
| `POST` | `/api/auth/register` | Public | Register new citizen account |
| `POST` | `/api/auth/login` | Public | Authenticate user & return JWT token |
| `GET` | `/api/auth/me` | Authenticated | Get current authenticated user profile |
| `POST` | `/api/ai/parse-complaint` | Authenticated | Conversational AI multi-turn grievance extraction |
| `POST` | `/api/ai/admin-assistant` | Officer / Admin | Database-grounded analytics queries |
| `POST` | `/api/grievances` | Citizen | Submit verified civic grievance |
| `GET` | `/api/grievances` | Authenticated | List grievances filtered by user role / department |
| `GET` | `/api/grievances/{id}` | Authenticated | Detailed view with status timeline history |
| `PATCH` | `/api/grievances/{id}/status` | Officer / Admin | Update grievance status (Assigned, In Progress, Resolved) |
| `POST` | `/api/grievances/{id}/verify` | Citizen | Verify resolution or reopen grievance |
| `GET` | `/api/departments` | Public | List available departments and grievance categories |
| `GET` | `/api/incidents` | Authenticated | View clustered incident groups |
| `POST` | `/api/incidents/cluster-duplicates` | Admin | Cluster duplicate grievances into master incidents |

---

## 📂 Project Directory Structure

```text
jansevai/
│
├── frontend/                        # React 18 + Vite frontend
│   ├── src/                         # Components, pages, context
│   ├── public/                      # Static assets
│   └── package.json                 # Frontend dependencies & scripts
│
├── backend-java/                    # Java Spring Boot 3.4 Backend
│   ├── src/main/java/com/janseva/   # Controllers, services, entities, security
│   ├── src/main/resources/          # application.properties
│   ├── python-ml-service/           # FastAPI microservice & Scikit-Learn models
│   ├── .env                         # Database & secret credentials (ignored in git)
│   ├── .env.example                 # Example environment template
│   └── pom.xml                      # Maven build configuration
│
├── data/                            # Database storage and backups
├── ml/                              # Standalone Python model training scripts
├── scripts/                         # Database migration scripts
├── .gitignore                       # Git ignore configuration
└── README.md                        # Master project documentation
```
