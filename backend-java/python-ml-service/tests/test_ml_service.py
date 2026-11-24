from pathlib import Path
from fastapi import HTTPException
from pydantic import ValidationError
import pytest

from app.main import (
    app,
    chat_response_endpoint,
    check_duplicates_endpoint,
    health_check,
    predict_grievance_endpoint,
    predict_intent_endpoint,
)
from app.schemas.ml_schemas import (
    ChatResponseRequest,
    DuplicateCheckRequest,
    GrievanceCandidate,
    GrievancePredictRequest,
    IntentPredictRequest,
)
from app.services.model_loader import model_registry


@pytest.fixture(scope="module", autouse=True)
def load_models_once():
    model_registry.load()


def test_ml_health_and_routes_registered():
    routes = {route.path for route in app.routes}
    assert "/ml/health" in routes
    assert "/ml/grievance/predict" in routes
    assert "/ml/intent/predict" in routes
    assert "/ml/duplicate/check" in routes
    assert "/ml/chat/response" in routes

    body = health_check()
    assert body.status == "HEALTHY"
    assert body.models_loaded is True
    assert body.subcategory_models_count >= 9
    assert body.grievance_model["model_name"] == "JanSeva Hierarchical Grievance Classifier"
    assert body.intent_model["model_name"] == "JanSeva Local Intent Detector"


def test_grievance_prediction_parking_and_traffic():
    data = predict_grievance_endpoint(
        GrievancePredictRequest(
            text="There is a parking problem near the library. Near the main entrance, vehicles are blocking the road.",
            existing_location=None,
        )
    )
    assert data.category == "Traffic / Parking Management"
    assert data.department == "Traffic / Parking Management"
    assert data.subcategory == "Illegal Parking / Road Obstruction"
    assert "Library" in data.location_text
    assert "Main Entrance" in data.location_text



def test_grievance_prediction_water_supply():
    data = predict_grievance_endpoint(
        GrievancePredictRequest(
            text="There has been no water supply in my locality for three days.",
            existing_location="Model Town",
        )
    )
    assert data.category == "Water Supply"
    assert data.department == "Water Department"
    assert data.priority == "HIGH"
    assert data.location_text == "Model Town"
    assert data.missing_information == []
    assert data.confidence > 0.5


def test_grievance_missing_location_and_safety_override():
    d1 = predict_grievance_endpoint(
        GrievancePredictRequest(text="No water supply for three days.")
    )
    assert "location_text" in d1.missing_information
    assert d1.needs_clarification is True

    d2 = predict_grievance_endpoint(
        GrievancePredictRequest(
            text="Exposed live wire dangling near school gate in Civil Lines"
        )
    )
    assert d2.priority == "CRITICAL"
    assert d2.safety_override is not None


def test_intent_prediction_all_classes():
    r_greet = predict_intent_endpoint(IntentPredictRequest(text="hello"))
    assert r_greet.intent == "GREETING"

    r_thanks = predict_intent_endpoint(IntentPredictRequest(text="thank you"))
    assert r_thanks.intent == "THANKS"

    r_grv = predict_intent_endpoint(
        IntentPredictRequest(text="There is a huge pothole on Railway Station Road")
    )
    assert r_grv.intent == "GRIEVANCE"


def test_duplicate_check_and_chat_response():
    dup_body = check_duplicates_endpoint(
        DuplicateCheckRequest(
            target=GrievanceCandidate(
                id=999,
                category="Water Supply",
                description="No water supply available in locality for 3 days near market",
                location_text="Model Town Market",
                latitude=28.7041,
                longitude=77.1025,
            ),
            candidates=[
                GrievanceCandidate(
                    id=1,
                    tracking_number="GRV-2026-111111",
                    category="Water Supply",
                    description="No water supply in Model Town locality for three days near market",
                    location_text="Model Town Market",
                    latitude=28.7045,
                    longitude=77.1028,
                )
            ],
        )
    )
    assert dup_body.success is True
    assert dup_body.count == 1
    assert dup_body.duplicates[0].duplicate_grievance_id == 1

    chat_res = chat_response_endpoint(ChatResponseRequest(intent="GREETING"))
    assert len(chat_res.ai_message) > 10


def test_invalid_input_and_missing_models_error():
    with pytest.raises(ValidationError):
        GrievancePredictRequest(text="   ")

    model_registry.load(Path("nonexistent_models_dir_12345"))
    try:
        health = health_check()
        assert health.models_loaded is False
        with pytest.raises(HTTPException) as exc:
            predict_grievance_endpoint(GrievancePredictRequest(text="Water problem"))
        assert exc.value.status_code == 503
    finally:
        model_registry.load()
