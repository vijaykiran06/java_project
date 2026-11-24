import re
from typing import Optional

KNOWN_LOCALITIES = [
    "Model Town", "Sector 17", "Civil Lines", "Railway Station Road", "Vasant Kunj", 
    "Karol Bagh", "Lajpat Nagar", "Connaught Place", "Dwarka Sector 10", "Rohini Sector 7",
    "Janakpuri", "Saket Block C", "Rajouri Garden", "Pitampura", "Preet Vihar",
    "Mayur Vihar Phase 1", "Chandni Chowk", "GT Road", "Ring Road Junction", "Kashmere Gate",
    "Sector 4", "Gate 2", "Block B", "Gandhi Nagar", "Indira Nagar", "MG Road"
]

COMMON_LANDMARKS = [
    "library", "hospital", "dispensary", "school", "college", "university", 
    "metro station", "bus stand", "bus stop", "railway station", "train station",
    "entrance", "main entrance", "main gate", "entry gate", "exit gate",
    "market", "bazaar", "community center", "park", "playground", "garden",
    "temple", "mandir", "mosque", "masjid", "church", "gurudwara",
    "stadium", "mall", "shopping complex", "police station", "post office",
    "bank", "atm", "chowk", "circle", "roundabout", "flyover", "underpass",
    "bridge", "intersection", "junction", "crossroad", "petrol pump", "cng station"
]

def clean_location_str(s: str) -> str:
    if not s:
        return ""
    # Strip leading prepositions/articles
    s = re.sub(r'^(?:in|at|near|around|beside|behind|opposite(?:\s+to)?|next\s+to|in\s+front\s+of|the|a|an)\s+', '', s, flags=re.IGNORECASE).strip()
    s = re.sub(r'\s+(?:ke\s+paas|ke\s+samne|ke\s+piche|me|mein|par|pe)$', '', s, flags=re.IGNORECASE).strip()
    words = s.split()
    capitalized = " ".join(w.capitalize() if w.lower() not in {"of", "to", "the", "and"} else w.lower() for w in words)
    return capitalized

def extract_location(text: Optional[str], existing_location: Optional[str] = None) -> Optional[str]:
    if not text or not text.strip():
        return existing_location if (existing_location and existing_location.strip()) else None

    found_parts = []
    lower = text.lower()

    # 1. Check known localities
    for loc in KNOWN_LOCALITIES:
        if re.search(r'\b' + re.escape(loc) + r'\b', text, re.IGNORECASE):
            if loc not in found_parts:
                found_parts.append(loc)

    # 2. Check Sector / Block / Phase patterns (e.g. Sector 14, Block C, Phase 2)
    sec_matches = re.findall(r'\b(?:Sector|Block|Phase|Pocket)\s+[A-Za-z0-9\-]+', text, re.IGNORECASE)
    for sm in sec_matches:
        cleaned_sm = sm.title()
        if not any(cleaned_sm.lower() in p.lower() for p in found_parts):
            found_parts.append(cleaned_sm)

    # 3. Check English preposition + landmark / proper noun phrases
    prep_patterns = [
        r'(?:near|in\s+front\s+of|opposite(?:\s+to)?|behind|beside|next\s+to|at|around)\s+(?:the\s+)?([a-z0-9\s]{2,30}?)(?=[,.]|\s+(?:and|vehicles|road|is|there|are|cars|causing|since|from|blocking|facing|due|$))',
        r'([a-z0-9\s]{2,25})\s+(?:ke\s+paas|ke\s+samne|ke\s+piche|chowk\s+pe|mor\s+par)',
    ]

    for pat in prep_patterns:
        for m in re.finditer(pat, lower):
            phrase = m.group(1).strip()
            if re.match(r'^(?:problem|issue|complaint|trouble|accident|incident|water|electricity|road|light|garbage|here|there)$', phrase):
                continue
            cleaned = clean_location_str(phrase)
            if cleaned and len(cleaned) >= 3 and not any(cleaned.lower() in p.lower() for p in found_parts):
                found_parts.append(cleaned)

    # 4. Check explicit landmark names
    for lm in COMMON_LANDMARKS:
        if re.search(r'\b' + re.escape(lm) + r'\b', lower):
            cleaned_lm = lm.title()
            if not any(lm in p.lower() for p in found_parts):
                found_parts.append(cleaned_lm)

    # Combine with existing location if present
    if existing_location and existing_location.strip():
        existing_clean = existing_location.strip()
        new_parts = [p for p in found_parts if p.lower() not in existing_clean.lower()]
        if new_parts:
            combined = existing_clean + ", " + ", ".join(new_parts)
            return combined
        return existing_clean

    if found_parts:
        unique_parts = []
        for p in found_parts:
            if not any(p.lower() != other.lower() and p.lower() in other.lower() for other in found_parts):
                unique_parts.append(p)
        return ", ".join(unique_parts) if unique_parts else found_parts[0]

    return None
