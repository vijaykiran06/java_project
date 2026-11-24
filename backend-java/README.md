# JanSeva AI — Java Spring Boot Backend & Python FastAPI ML Service

This directory contains the migrated **Java Spring Boot** primary backend (`src/main/java/com/janseva`) and the decoupled **Python FastAPI ML Microservice** (`python-ml-service/`), preserving all existing functionality, frontend UI, database records (`../backend/local.db`), and trained Scikit-Learn Joblib models (`../backend/ml/models/`).

## Architecture Overview
```
React + Vite Frontend (port 3000)
        │  REST API / JSON (Bearer JWT)
        ▼
Java Spring Boot Backend (port 8080)
  ├── Spring Security + JWT + BCrypt
  ├── Spring Data JPA + SQLite (../backend/local.db) / Optional PostgreSQL profile
  ├── SLA Scheduler (@Scheduled every 30s)
  └── MLService RestClient (http://127.0.0.1:8001)
        │  Internal REST API
        ▼
Python FastAPI ML Microservice (port 8001)
        │
        ▼
Existing Scikit-Learn Joblib Models (../backend/ml/models/)
```

## Prerequisites
- **Java**: JDK 21+ (verified with JDK 23.0.1)
- **Maven**: Apache Maven 3.9+
- **Python**: Python 3.10+ (verified with Python 3.13.5) with packages from `python-ml-service/requirements.txt`
- **Node.js**: 18+ (for `frontend/`)

## Environment Configuration
Copy `.env.example` and adjust environment variables as needed:
- `PORT=8080`
- `DB_URL=jdbc:sqlite:../backend/local.db`
- `ML_SERVICE_URL=http://127.0.0.1:8001`
- `ML_MODELS_DIR=../backend/ml/models`
- `JWT_SECRET=<your_256bit_secret>`

## Startup Instructions

### 1. Start the Python FastAPI ML Microservice (port 8001)
```bash
cd backend-java/python-ml-service
uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
```

### 2. Start the Java Spring Boot Backend (port 8080)
```bash
cd backend-java
mvn spring-boot:run
```
*(Optional PostgreSQL profile: `mvn spring-boot:run -Dspring-boot.run.profiles=postgres`)*

### 3. Start the React + Vite Frontend (port 3000)
```bash
cd frontend
npm run dev
```
Vite proxies `/api/*` requests to `http://localhost:8080` (configurable via `VITE_API_BASE_URL`).

## Running Tests
- **Java Backend (JUnit 5 + Mockito + MockMvc)**:
  ```bash
  mvn -f backend-java/pom.xml test
  ```
- **Python ML Microservice (Pytest)**:
  ```bash
  python -m pytest -c backend-java/python-ml-service/pytest.ini backend-java/python-ml-service/tests/test_ml_service.py -v
  ```
