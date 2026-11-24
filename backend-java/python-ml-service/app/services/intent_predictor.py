import numpy as np

from app.schemas.ml_schemas import IntentPredictResponse
from app.services.model_loader import LoadedModels

EXACT_GREETINGS = {
    "hi", "hello", "hey", "hii", "hiii", "hello there", "hey there",
    "good morning", "good afternoon", "good evening", "namaste", "namaskar",
}
EXACT_THANKS = {
    "thanks", "thank you", "thankyou", "thanks a lot", "thank you so much", "dhanyawad", "shukriya",
}
EXACT_CONFIRMATIONS = {
    "yes", "yeah", "yep", "correct", "confirm", "proceed", "submit it", "ha", "haan",
}
EXACT_DENIALS = {
    "no", "nope", "incorrect", "cancel", "stop", "na", "nahi",
}


def predict_intent(models: LoadedModels, text: str) -> IntentPredictResponse:
    if not models.is_intent_ready:
        raise RuntimeError(
            "Intent ML model is not loaded: " + "; ".join(models.errors or ["unknown error"])
        )

    cleaned = text.lower().strip()

    if cleaned in EXACT_GREETINGS:
        return IntentPredictResponse(intent="GREETING", confidence=0.99, needs_clarification=False)
    if cleaned in EXACT_THANKS:
        return IntentPredictResponse(intent="THANKS", confidence=0.99, needs_clarification=False)
    if cleaned in EXACT_CONFIRMATIONS:
        return IntentPredictResponse(intent="CONFIRMATION", confidence=0.99, needs_clarification=False)
    if cleaned in EXACT_DENIALS:
        return IntentPredictResponse(intent="DENIAL", confidence=0.99, needs_clarification=False)

    X = models.intent_vectorizer.transform([cleaned])
    predicted_intent = str(models.intent_classifier.predict(X)[0])

    if hasattr(models.intent_classifier, "predict_proba"):
        probs = models.intent_classifier.predict_proba(X)[0]
        confidence = float(np.max(probs))
    else:
        confidence = 0.90

    needs_clarification = False
    if predicted_intent == "GRIEVANCE":
        if confidence < 0.40:
            predicted_intent = "UNKNOWN"
        elif confidence < 0.65:
            needs_clarification = True
    else:
        if confidence < 0.65:
            predicted_intent = "UNKNOWN"

    return IntentPredictResponse(
        intent=predicted_intent,
        confidence=round(confidence, 2),
        needs_clarification=needs_clarification,
    )
