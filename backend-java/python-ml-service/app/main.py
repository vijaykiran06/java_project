from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, status

from app.schemas.ml_schemas import (
    ChatResponseRequest,
    ChatResponseResult,
    DuplicateCheckRequest,
    DuplicateCheckResponse,
    GrievancePredictRequest,
    GrievancePredictResponse,
    HealthResponse,
    IntentPredictRequest,
    IntentPredictResponse,
)
from app.services.duplicate_service import detect_duplicates
from app.services.grievance_predictor import predict_grievance
from app.services.intent_predictor import predict_intent
from app.services.model_loader import model_registry
from app.services.response_service import generate_response_for_intent


@asynccontextmanager
async def lifespan(app: FastAPI):
    model_registry.load()
    yield


app = FastAPI(
    title="JanSeva AI Local ML Inference Service",
    description="Internal FastAPI microservice wrapping JanSeva's trained Scikit-Learn Joblib models.",
    version="2.0.0",
    lifespan=lifespan,
)


@app.get("/ml/health", response_model=HealthResponse)
def health_check():
    models = model_registry.get()
    return HealthResponse(
        status="HEALTHY" if models.is_ready else "DEGRADED",
        models_loaded=models.is_ready,
        models_dir=str(models.models_dir),
        grievance_model=models.grievance_metadata,
        intent_model=models.intent_metadata,
        subcategory_models_count=len(models.subcategory_classifiers),
        errors=models.errors,
    )


@app.post("/ml/grievance/predict", response_model=GrievancePredictResponse)
def predict_grievance_endpoint(req: GrievancePredictRequest):
    models = model_registry.get()
    if not models.is_grievance_ready:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Grievance ML models unavailable: " + "; ".join(models.errors),
        )
    return predict_grievance(models, req.text, req.existing_location)


@app.post("/ml/intent/predict", response_model=IntentPredictResponse)
def predict_intent_endpoint(req: IntentPredictRequest):
    models = model_registry.get()
    if not models.is_intent_ready:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Intent ML model unavailable: " + "; ".join(models.errors),
        )
    return predict_intent(models, req.text)


@app.post("/ml/duplicate/check", response_model=DuplicateCheckResponse)
def check_duplicates_endpoint(req: DuplicateCheckRequest):
    duplicates = detect_duplicates(req.target, req.candidates)
    return DuplicateCheckResponse(
        success=True,
        count=len(duplicates),
        duplicates=duplicates,
    )


@app.post("/ml/chat/response", response_model=ChatResponseResult)
def chat_response_endpoint(req: ChatResponseRequest):
    message = generate_response_for_intent(
        intent=req.intent,
        extracted_data=req.extracted_data,
        awaiting_field=req.awaiting_field,
    )
    return ChatResponseResult(ai_message=message)
