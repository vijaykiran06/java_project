# JanSeva Python ML Microservice

Internal FastAPI service wrapping JanSeva AI's pre-trained `scikit-learn` Joblib models (`backend/ml/models/`).

## Endpoints
- `GET /ml/health` — Model load status and metadata
- `POST /ml/grievance/predict` — Department, category, subcategory, priority, location, explainability
- `POST /ml/intent/predict` — Conversational intent detection (`GRIEVANCE`, `GREETING`, `THANKS`, `DENIAL`, `CONFIRMATION`, `CORRECTION`, `CAPABILITIES`, `UNKNOWN`)
- `POST /ml/duplicate/check` — Jaccard + Haversine duplicate detection
- `POST /ml/chat/response` — Template-based response generation

## Run Locally
```bash
uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
```

## Run Tests
```bash
pytest
```
