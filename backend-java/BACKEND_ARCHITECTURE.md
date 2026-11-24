# JanSeva AI — Backend Architecture

## 1. System Architecture
```
+-----------------------+       REST / JSON       +----------------------------------+
|   React + Vite UI     | ----------------------> |   Java Spring Boot (Port 8080)   |
|   (frontend/)         | <---------------------- |   - Spring Security (JWT/BCrypt) |
+-----------------------+   Proxy /api -> :8080   |   - Controllers & Services       |
                                                  |   - Spring Data JPA + JDBC       |
                                                  |   - @Scheduled SLA Escalations   |
                                                  +-----------------+----------------+
                                                                    |
                                    +-------------------------------+-------------------------------+
                                    |                                                               |
                                    v                                                               v
                     +------------------------------+                             +------------------------------------+
                     |  SQLite Database             |                             |  Python FastAPI ML Service         |
                     |  (../backend/local.db)       |                             |  (127.0.0.1:8001)                  |
                     |  or PostgreSQL profile       |                             |  - /ml/health                      |
                     +------------------------------+                             |  - /ml/grievance/predict           |
                                                                                  |  - /ml/intent/predict              |
                                                                                  |  - /ml/duplicate/check             |
                                                                                  |  - /ml/chat/response               |
                                                                                  +-----------------+------------------+
                                                                                                    |
                                                                                                    v
                                                                                  +------------------------------------+
                                                                                  |  Pre-trained Scikit-Learn Models   |
                                                                                  |  (../backend/ml/models/*.joblib)   |
                                                                                  +------------------------------------+
```

## 2. Responsibility Boundaries
1. **React Frontend (`frontend/`)**: Handles UI rendering, voice/geolocation capture, role-based portals (Citizen, Officer, Admin), and calls `/api/*`. Never communicates directly with Python.
2. **Java Spring Boot (`backend-java/`)**: Owns all application HTTP endpoints, JWT authentication, BCrypt password verification, role-based access control (`@PreAuthorize`), database persistence across all 12 tables, officer workload routing, SLA deadline & escalation scheduling, duplicate incident clustering, and executive analytics.
3. **Python FastAPI ML Microservice (`backend-java/python-ml-service/`)**: Loads existing `.joblib` models once on startup and exposes internal ML inference endpoints (`/ml/*`). Contains zero database or auth logic.

## 3. Grievance Submission & AI Inference Flow
1. Citizen sends chat input -> `POST /api/ai/parse-complaint` (Java `AiController`).
2. `ConversationAiService` checks `conversation_state` (`awaitingField`) and translates non-ASCII regional/Hindi text via `GoogleTranslationService` if needed.
3. `PythonMLService.predictIntent` calls `POST http://127.0.0.1:8001/ml/intent/predict` (Model 2: TF-IDF + Calibrated LogisticRegression).
4. If intent is `GRIEVANCE`, `PythonMLService.predictGrievance` calls `POST http://127.0.0.1:8001/ml/grievance/predict` (Model 1: TF-IDF + Hierarchical Calibrated LinearSVC + safety overrides + regex location extraction).
5. `PythonMLService.generateChatResponse` calls `POST http://127.0.0.1:8001/ml/chat/response` for template-based reply text.
6. Citizen reviews preview card and confirms -> `POST /api/grievances` (Java `GrievanceController`).
7. `GrievanceService` generates `GRV-YYYY-XXXXXX`, persists `grievances`, `locations`, `ai_analysis`, `grievance_status_history`, and `audit_logs`, sets SLA deadline (`SlaService`), assigns least-loaded department officer (`RoutingService`), and runs duplicate detection (`DuplicateService` -> Python `POST /ml/duplicate/check`).
