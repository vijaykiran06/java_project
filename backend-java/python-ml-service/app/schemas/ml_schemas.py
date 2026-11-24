from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, field_validator


class GrievancePredictRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Grievance complaint description text")
    existing_location: Optional[str] = Field(default=None, description="Previously provided location text")

    @field_validator("text")
    @classmethod
    def validate_non_blank(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("text must not be empty or whitespace")
        return v


class GrievancePredictResponse(BaseModel):
    department: str
    category: str
    subcategory: str
    priority: str
    description: str
    location_text: Optional[str] = None
    language: str
    confidence: float
    subcategory_probabilities: Dict[str, float] = Field(default_factory=dict)
    missing_information: List[str] = Field(default_factory=list)
    needs_clarification: bool
    explainable_features: List[str] = Field(default_factory=list)
    safety_override: Optional[str] = None


class IntentPredictRequest(BaseModel):
    text: str = Field(..., min_length=1, description="User chat message text")

    @field_validator("text")
    @classmethod
    def validate_non_blank(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("text must not be empty or whitespace")
        return v


class IntentPredictResponse(BaseModel):
    intent: str
    confidence: float
    needs_clarification: bool = False


class GrievanceCandidate(BaseModel):
    id: Optional[int] = None
    tracking_number: Optional[str] = None
    category: Optional[str] = None
    description: str = ""
    location_text: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class DuplicateCheckRequest(BaseModel):
    target: GrievanceCandidate
    candidates: List[GrievanceCandidate] = Field(default_factory=list)


class DuplicateMatch(BaseModel):
    duplicate_grievance_id: Optional[int] = None
    tracking_number: Optional[str] = None
    category: Optional[str] = None
    location_text: Optional[str] = None
    description: str = ""
    similarity_score: float
    geo_distance_km: Optional[float] = None
    confidence: float
    recommendation: str


class DuplicateCheckResponse(BaseModel):
    success: bool = True
    count: int
    duplicates: List[DuplicateMatch] = Field(default_factory=list)


class ChatResponseRequest(BaseModel):
    intent: str
    extracted_data: Optional[Dict[str, Any]] = None
    awaiting_field: Optional[str] = None


class ChatResponseResult(BaseModel):
    ai_message: str


class HealthResponse(BaseModel):
    status: str
    models_loaded: bool
    models_dir: str
    grievance_model: Dict[str, Any] = Field(default_factory=dict)
    intent_model: Dict[str, Any] = Field(default_factory=dict)
    subcategory_models_count: int = 0
    errors: List[str] = Field(default_factory=list)
