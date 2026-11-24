import re
from typing import Dict, List, Optional, Tuple
import numpy as np

from app.schemas.ml_schemas import GrievancePredictResponse
from app.services.model_loader import LoadedModels
from app.utils.location_extractor import extract_location


CRITICAL_KEYWORDS = [
    "exposed live wire",
    "live wire",
    "sparking transformer",
    "transformer sparking",
    "electrical fire",
    "gas leak",
    "bridge collapse",
    "building collapse",
    "live electrical wire",
    "open manhole hazard",
]


def sanitize_filename(name: str) -> str:
    return re.sub(r"[^a-zA-Z0-9]", "_", name)


def normalize_text(text: str) -> str:
    if not text:
        return ""
    t = text.lower()
    typo_map = {
        r"\btraffick\b": "traffic",
        r"\bparkin\b": "parking",
        r"\bparkng\b": "parking",
        r"\bvechiles?\b": "vehicle",
        r"\bvehcle\b": "vehicle",
        r"\bblockin\b": "blocking",
        r"\bstret\b": "street",
        r"\bstreat\b": "street",
        r"\bpothol\b": "pothole",
        r"\belectrcty\b": "electricity",
        r"\belectrcity\b": "electricity",
        r"\bsewarge\b": "sewage",
        r"\bsewerage\b": "sewage",
        r"\blightng\b": "lighting",
        r"\bgarbag\b": "garbage",
        r"\bdranage\b": "drainage",
        r"\bdrainge\b": "drainage",
        r"\bwatr\b": "water",
        r"\bcommin\b": "coming",
        r"\bcomming\b": "coming",
    }
    for pat, rep in typo_map.items():
        t = re.sub(pat, rep, t)
    return t


def get_top_features(text: str, vectorizer, top_n: int = 4) -> List[str]:
    feature_names = np.array(vectorizer.get_feature_names_out())
    tfidf_matrix = vectorizer.transform([text.lower()])
    feature_index = tfidf_matrix.nonzero()[1]
    tfidf_scores = tfidf_matrix.data

    sorted_items = sorted(zip(feature_index, tfidf_scores), key=lambda x: x[1], reverse=True)
    return [str(feature_names[i]) for i, _ in sorted_items[:top_n]]


def check_safety_overrides(text: str, current_priority: str) -> Tuple[str, Optional[str]]:
    lower = text.lower()
    for kw in CRITICAL_KEYWORDS:
        if kw in lower:
            return "CRITICAL", f"Safety Override Triggered: Detected high-risk pattern '{kw}'"
    return current_priority, None


def apply_semantic_disambiguation(
    text: str, category: str, department: str, subcategory: str, priority: str
) -> Tuple[str, str, str, str]:
    lower = normalize_text(text)

    # 1. Electricity Outage / Transformer Sparking / Live Wire (Checked first to avoid substring false matches)
    if any(
        k in lower
        for k in [
            "transformer",
            "spark",
            "sparking",
            "live wire",
            "exposed wire",
            "electric pole",
            "power cut",
            "power outage",
            "bijli",
            "voltage",
        ]
    ):
        subcat = "Power Outage"
        prio = "HIGH"
        if "transformer" in lower or "spark" in lower:
            subcat = "Transformer Sparking"
            prio = "CRITICAL"
        elif "live wire" in lower or "exposed wire" in lower:
            subcat = "Exposed Electrical Hazard"
            prio = "CRITICAL"
        elif "pole" in lower:
            subcat = "Damaged Electric Pole"
        return (
            "Electricity",
            "Electricity Department",
            subcat,
            prio,
        )

    # 2. Traffic Signals
    if any(
        k in lower
        for k in [
            "traffic light",
            "traffic signal",
            "signal light",
            "red light is broken",
            "signal not working",
            "signal kharab",
        ]
    ):
        return (
            "Traffic / Parking Management",
            "Traffic / Parking Management",
            "Broken Traffic Signal",
            "HIGH",
        )

    # 3. Traffic Congestion
    if any(
        k in lower
        for k in [
            "traffic jam",
            "congestion",
            "gridlock",
            "traffic congestion",
            "choked traffic",
            "heavy traffic",
            "traffic block",
            "jam laga",
        ]
    ):
        return (
            "Traffic / Parking Management",
            "Traffic / Parking Management",
            "Traffic Congestion",
            "HIGH",
        )

    # 4. Illegal Parking / Road Obstruction by vehicles (Using word-boundary patterns)
    has_parking_word = bool(re.search(r"\b(parking|parked|park)\b", lower))
    has_blocking_pattern = any(
        k in lower
        for k in [
            "blocking the road",
            "blocking road",
            "vehicles blocking",
            "cars blocking",
            "blocking entrance",
            "blocking the passage",
            "passage blocked",
            "gaadi raste par",
            "rasta block",
            "illegal parking",
            "no parking zone",
            "gaadi park",
            "cars and bikes",
            "unauthorized parking",
            "passage is completely blocked",
        ]
    )

    if has_parking_word or has_blocking_pattern:
        if not any(
            k in lower
            for k in [
                "pothole",
                "potholes",
                "gaddha",
                "gaddhe",
                "crater",
                "broken road",
                "asphalt cracked",
            ]
        ):
            return (
                "Traffic / Parking Management",
                "Traffic / Parking Management",
                "Illegal Parking / Road Obstruction",
                "HIGH",
            )

    # 5. Street Lighting
    if any(
        k in lower
        for k in [
            "streetlight",
            "street light",
            "street lamp",
            "lamp pole",
            "dark road",
            "street lights are off",
            "street light band",
            "street light kharab",
        ]
    ):
        return (
            "Street Lighting",
            "Electrical & Lighting Department",
            "Streetlight Off" if "broken" not in lower else "Broken Lamp Pole",
            "MEDIUM",
        )

    # 6. Garbage / Waste Management
    if any(
        k in lower
        for k in [
            "garbage",
            "trash",
            "waste",
            "kachra",
            "dustbin",
            "rubbish",
            "dumping",
            "uncollected garbage",
        ]
    ):
        return (
            "Waste Management",
            "Sanitation & Waste Department",
            "Uncollected Garbage" if "dustbin" not in lower else "Garbage Dustbin Overflow",
            "MEDIUM",
        )

    # 7. Drainage / Waterlogging
    if any(
        k in lower
        for k in [
            "drainage",
            "waterlogging",
            "gutter overflow",
            "clogged gutter",
            "storm drain",
            "stormwater",
            "drain overflow",
            "nali overflow",
            "waterlogging ho gayi",
        ]
    ):
        return (
            "Drainage",
            "Municipal Drainage Department",
            "Waterlogging" if "waterlog" in lower else "Drainage Overflow",
            "HIGH",
        )

    # 8. Sewage / Public Toilet (Sanitation)
    if any(
        k in lower
        for k in [
            "public toilet",
            "sewage",
            "sewer line",
            "foul smell",
            "stench",
            "toilet waste",
            "restroom",
        ]
    ):
        return (
            "Sanitation",
            "Sanitation Department",
            "Public Toilet Cleaning" if "toilet" in lower else "Sewage Overflow",
            "HIGH" if "sewage" in lower else "MEDIUM",
        )

    # 9. Water Supply
    if any(
        k in lower
        for k in [
            "no water supply",
            "paani nahi",
            "drinking water",
            "water pipe leak",
            "pipeline leak",
            "tap dry",
            "taps dry",
            "pipeline burst",
            "low water pressure",
            "dirty water",
            "ganda paani",
        ]
    ):
        subcat = "No Water Supply"
        if "leak" in lower or "burst" in lower:
            subcat = "Water Pipeline Leakage"
        elif "dirty" in lower or "ganda" in lower:
            subcat = "Contaminated / Dirty Water"
        elif "pressure" in lower:
            subcat = "Low Water Pressure"
        return (
            "Water Supply",
            "Water Department",
            subcat,
            "HIGH",
        )

    # 10. Road Damage / Potholes (Public Works Department)
    if any(
        k in lower
        for k in [
            "pothole",
            "potholes",
            "gaddha",
            "gaddhe",
            "road damage",
            "road repair",
            "crater",
            "broken road",
            "footpath",
            "manhole",
        ]
    ):
        subcat = (
            "Dangerous Pothole" if ("pothole" in lower or "gaddh" in lower) else "Road Repair Needed"
        )
        if "footpath" in lower:
            subcat = "Broken Footpath"
        elif "manhole" in lower:
            subcat = "Open Manhole Hazard"
        return (
            "Roads / PWD",
            "Public Works Department",
            subcat,
            "HIGH" if ("pothole" in lower or "manhole" in lower) else "MEDIUM",
        )

    return category, department, subcategory, priority


def predict_grievance(
    models: LoadedModels, text: str, existing_location: Optional[str] = None
) -> GrievancePredictResponse:
    if not models.is_grievance_ready:
        raise RuntimeError(
            "Grievance ML models are not loaded: " + "; ".join(models.errors or ["unknown error"])
        )

    norm_text = normalize_text(text)
    cleaned = norm_text.strip()
    X = models.vectorizer.transform([cleaned])

    category = str(models.global_classifiers["category"].predict(X)[0])
    department = str(models.global_classifiers["department"].predict(X)[0])
    priority = str(models.global_classifiers["priority"].predict(X)[0])

    cat_clf = models.global_classifiers["category"]
    if hasattr(cat_clf, "predict_proba"):
        cat_probs = cat_clf.predict_proba(X)[0]
        category_confidence = float(np.max(cat_probs))
    else:
        category_confidence = 0.90

    subcategory = "General Complaint"
    subcat_probs: Dict[str, float] = {}

    sanitized_cat = sanitize_filename(category)
    model_fname = f"{sanitized_cat}_subcategory_clf.joblib"

    if model_fname in models.subcategory_classifiers:
        sub_clf = models.subcategory_classifiers[model_fname]
        subcategory = str(sub_clf.predict(X)[0])

        if hasattr(sub_clf, "predict_proba"):
            classes = sub_clf.classes_
            probs = sub_clf.predict_proba(X)[0]
            for cls, prob in zip(classes, probs):
                subcat_probs[str(cls)] = round(float(prob), 4)
            subcat_probs = dict(
                sorted(subcat_probs.items(), key=lambda item: item[1], reverse=True)
            )

    category, department, subcategory, priority = apply_semantic_disambiguation(
        text, category, department, subcategory, priority
    )

    final_priority, override_reason = check_safety_overrides(text, priority)
    extracted_loc = extract_location(text, existing_location)
    top_terms = get_top_features(norm_text, models.vectorizer, top_n=4)

    missing_info: List[str] = []
    if not extracted_loc:
        missing_info.append("location_text")

    needs_clarification = (category_confidence < 0.65 and not override_reason) or len(missing_info) > 0
    language = "hi" if any("\u0900" <= c <= "\u097f" for c in text) else "en"

    return GrievancePredictResponse(
        department=department,
        category=category,
        subcategory=subcategory,
        priority=final_priority,
        description=text.strip(),
        location_text=extracted_loc,
        language=language,
        confidence=round(category_confidence, 2),
        subcategory_probabilities=subcat_probs,
        missing_information=missing_info,
        needs_clarification=needs_clarification,
        explainable_features=top_terms,
        safety_override=override_reason,
    )
