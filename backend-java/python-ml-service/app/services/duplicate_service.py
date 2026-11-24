import math
from typing import List, Optional

from app.schemas.ml_schemas import DuplicateMatch, GrievanceCandidate

STOPWORDS = {
    "in", "my", "the", "for", "is", "a", "an", "on", "at", "near",
    "and", "to", "has", "been", "there", "of",
}
KEYWORDS = [
    "water", "supply", "leak", "pothole", "light", "garbage",
    "drain", "electricity", "outage", "pipeline", "wire",
]


def haversine(
    lat1: Optional[float], lon1: Optional[float], lat2: Optional[float], lon2: Optional[float]
) -> float:
    """Calculate geographic distance in km between two lat/lon pairs."""
    if lat1 is None or lon1 is None or lat2 is None or lon2 is None:
        return 9999.0
    earth_radius_km = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2.0) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(max(0.0, 1.0 - a)))
    return earth_radius_km * c


def text_similarity(text1: str, text2: str) -> float:
    """Compute token Jaccard + keyword bonus similarity score."""
    if not text1 or not text2:
        return 0.0

    words1 = set(text1.lower().split()) - STOPWORDS
    words2 = set(text2.lower().split()) - STOPWORDS
    if not words1 or not words2:
        return 0.0

    intersection = words1.intersection(words2)
    union = words1.union(words2)
    jaccard = len(intersection) / len(union)

    t1_lower = text1.lower()
    t2_lower = text2.lower()
    kw_matches = sum(1 for kw in KEYWORDS if kw in t1_lower and kw in t2_lower)
    kw_bonus = min(0.3, kw_matches * 0.1)

    return min(1.0, jaccard + kw_bonus)


def detect_duplicates(
    target: GrievanceCandidate, candidates: List[GrievanceCandidate]
) -> List[DuplicateMatch]:
    """Detect potential duplicate complaints using exact legacy similarity scoring."""
    results: List[DuplicateMatch] = []

    for item in candidates:
        if item.id is not None and target.id is not None and item.id == target.id:
            continue

        category_match = item.category == target.category
        sim_score = text_similarity(target.description or "", item.description or "")
        geo_dist = haversine(target.latitude, target.longitude, item.latitude, item.longitude)

        geo_score = 1.0 if geo_dist < 1.0 else (0.7 if geo_dist < 5.0 else 0.2)
        if category_match:
            combined_confidence = (sim_score * 0.7) + (geo_score * 0.3)
        else:
            combined_confidence = sim_score * 0.4

        if combined_confidence >= 0.45 or (category_match and sim_score > 0.35):
            results.append(
                DuplicateMatch(
                    duplicate_grievance_id=item.id,
                    tracking_number=item.tracking_number,
                    category=item.category,
                    location_text=item.location_text,
                    description=item.description,
                    similarity_score=round(sim_score, 3),
                    geo_distance_km=round(geo_dist, 2) if geo_dist < 9000 else None,
                    confidence=round(combined_confidence, 3),
                    recommendation="POSSIBLE DUPLICATE",
                )
            )

    results.sort(key=lambda x: x.confidence, reverse=True)
    return results[:5]
