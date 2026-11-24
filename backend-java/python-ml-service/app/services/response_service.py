import random
from typing import Any, Dict, Optional

GREETING_RESPONSES = [
    "Hello! 👋 I'm the Civic AI Assistant. I can help you report problems such as water supply, roads, electricity, sanitation, drainage, waste, street lights, health, or transport issues. What problem are you facing in your locality?",
    "Hello! 👋 How can I help you today? You can tell me about any civic issue in your locality.",
    "Hi! 👋 Please tell me what problem you're facing in your area.",
    "Good day! 👋 How can I assist you with a civic complaint today?",
]

CAPABILITIES_RESPONSES = [
    "I'm the Civic AI Assistant for grievance redressal. I can understand your complaint, identify the responsible department, estimate priority, and help you submit it. What issue would you like to report?",
    "I can help you lodge civic grievances across 9 government departments: Water, PWD (Roads), Electricity, Sanitation, Drainage, Street Lighting, Waste Management, Public Health, and Transport. Just describe your problem!",
]

THANKS_RESPONSES = [
    "You're welcome! 😊 Let me know if you need help reporting another issue.",
    "Glad to help! 😊 Feel free to report any other civic problems in your area.",
    "Happy to assist! Have a great day!",
]

DENIAL_RESPONSES = [
    "Understood. Please let me know what you would like to change or describe your grievance when you're ready.",
    "No problem! You can type a new complaint description or modify the details whenever you wish.",
]

UNKNOWN_RESPONSES = [
    "Please tell me the actual problem related to government or civic issues (like water, roads, electricity, etc.).",
    "I can only help with civic and government-related problems. Please describe a valid issue you are facing.",
    "That doesn't sound like a civic issue. Please describe an actual problem related to municipal or government services.",
]


def generate_response_for_intent(
    intent: str,
    extracted_data: Optional[Dict[str, Any]] = None,
    awaiting_field: Optional[str] = None,
) -> str:
    if intent == "GREETING":
        return random.choice(GREETING_RESPONSES)
    if intent == "CAPABILITIES":
        return random.choice(CAPABILITIES_RESPONSES)
    if intent == "THANKS":
        return random.choice(THANKS_RESPONSES)
    if intent == "DENIAL":
        return random.choice(DENIAL_RESPONSES)
    if intent == "UNKNOWN":
        return random.choice(UNKNOWN_RESPONSES)

    if intent == "GRIEVANCE" and extracted_data:
        category = extracted_data.get("category", "Civic Issue")
        subcategory = extracted_data.get("subcategory", "General Complaint")
        department = extracted_data.get("department", "Municipal Administration")
        priority = extracted_data.get("priority", "MEDIUM")
        location_text = extracted_data.get("location_text")
        missing_info = extracted_data.get("missing_information") or []

        if ("location_text" in missing_info or awaiting_field == "location_text") and not location_text:
            return (
                f"I understand you are reporting a {category} issue ({subcategory}). "
                "Where is this problem occurring? You can enter your locality, landmark, or street name."
            )

        return (
            f"Got it! Local AI classified your grievance for the **{department}** "
            f"({category} - {subcategory}) with **{priority}** priority at "
            f"**{location_text or 'your locality'}**. Please confirm to submit."
        )

    return "Hello! How can I help you report a civic issue today?"
