import sys
import os
import json
import pytest

# Ensure app is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import predict_grievance_endpoint
from app.schemas.ml_schemas import GrievancePredictRequest
from app.services.model_loader import model_registry
from app.services.response_service import generate_response_for_intent
from app.utils.location_extractor import extract_location

@pytest.fixture(scope="module", autouse=True)
def setup_models():
    model_registry.load()

TEST_CASES = [
    # 1. Parking issues
    {
        "id": 1,
        "name": "Parking problem near library",
        "text": "There is a parking problem near the library. Near the main entrance, vehicles are blocking the road.",
        "expected_dept": "Traffic / Parking Management",
        "expected_cat": "Traffic / Parking Management",
        "expected_subcat": "Illegal Parking / Road Obstruction",
        "expected_loc_substr": ["Library", "Main Entrance"],
    },
    {
        "id": 2,
        "name": "Illegal parking blocking gate",
        "text": "Illegal parking of cars and bikes near Civil Lines hospital gate, passage is completely blocked.",
        "expected_dept": "Traffic / Parking Management",
        "expected_cat": "Traffic / Parking Management",
        "expected_subcat": "Illegal Parking / Road Obstruction",
        "expected_loc_substr": ["Civil Lines"],
    },
    {
        "id": 3,
        "name": "Vehicles blocking road (Hinglish)",
        "text": "Gaadi raste par khadi karke road block kar diya hai near Model Town market.",
        "expected_dept": "Traffic / Parking Management",
        "expected_cat": "Traffic / Parking Management",
        "expected_subcat": "Illegal Parking / Road Obstruction",
        "expected_loc_substr": ["Model Town"],
    },
    # 2. Road damage and potholes
    {
        "id": 4,
        "name": "Dangerous potholes on road",
        "text": "Large deep potholes on main road near Sector 17 causing severe accidents.",
        "expected_dept": "Public Works Department",
        "expected_cat": "Roads / PWD",
        "expected_subcat": "Dangerous Pothole",
        "expected_loc_substr": ["Sector 17"],
    },
    {
        "id": 5,
        "name": "Broken road surface",
        "text": "The asphalt road condition is completely damaged and broken near Karol Bagh.",
        "expected_dept": "Public Works Department",
        "expected_cat": "Roads / PWD",
        "expected_subcat": "Road Repair Needed",
        "expected_loc_substr": ["Karol Bagh"],
    },
    {
        "id": 6,
        "name": "Broken footpath pavement",
        "text": "Footpath tiles are broken and cracked near Vasant Kunj metro station.",
        "expected_dept": "Public Works Department",
        "expected_cat": "Roads / PWD",
        "expected_subcat": "Broken Footpath",
        "expected_loc_substr": ["Vasant Kunj"],
    },
    # 3. Traffic congestion & signals
    {
        "id": 7,
        "name": "Heavy traffic jam congestion",
        "text": "Severe traffic congestion and gridlock near Connaught Place intersection for 3 hours.",
        "expected_dept": "Traffic / Parking Management",
        "expected_cat": "Traffic / Parking Management",
        "expected_subcat": "Traffic Congestion",
        "expected_loc_substr": ["Connaught Place"],
    },
    {
        "id": 8,
        "name": "Broken traffic light signal",
        "text": "Traffic signal light not working and broken at Lajpat Nagar chowk.",
        "expected_dept": "Traffic / Parking Management",
        "expected_cat": "Traffic / Parking Management",
        "expected_subcat": "Broken Traffic Signal",
        "expected_loc_substr": ["Lajpat Nagar"],
    },
    # 4. Garbage and waste management
    {
        "id": 9,
        "name": "Uncollected garbage dump",
        "text": "Huge pile of uncollected rotting garbage dumped openly near Rohini Sector 7.",
        "expected_dept": "Sanitation & Waste Department",
        "expected_cat": "Waste Management",
        "expected_subcat": "Uncollected Garbage",
        "expected_loc_substr": ["Rohini Sector 7"],
    },
    {
        "id": 10,
        "name": "Overflowing dustbin (Hinglish)",
        "text": "Kachra 4 din se nahi uthaya gaya hai, community dustbin overflow ho raha hai near Preet Vihar.",
        "expected_dept": "Sanitation & Waste Department",
        "expected_cat": "Waste Management",
        "expected_subcat": "Garbage Dustbin Overflow",
        "expected_loc_substr": ["Preet Vihar"],
    },
    # 5. Water supply issues
    {
        "id": 11,
        "name": "No water supply for days",
        "text": "Our taps have been completely dry with no water supply in Janakpuri for 3 days.",
        "expected_dept": "Water Department",
        "expected_cat": "Water Supply",
        "expected_subcat": "No Water Supply",
        "expected_loc_substr": ["Janakpuri"],
    },
    {
        "id": 12,
        "name": "Water pipe burst and leaking",
        "text": "Clean drinking water pipeline burst and leaking continuously near Saket Block C.",
        "expected_dept": "Water Department",
        "expected_cat": "Water Supply",
        "expected_subcat": "Water Pipeline Leakage",
        "expected_loc_substr": ["Saket Block C"],
    },
    {
        "id": 13,
        "name": "Dirty contaminated water",
        "text": "Muddy dirty contaminated tap water coming into our homes near Pitampura.",
        "expected_dept": "Water Department",
        "expected_cat": "Water Supply",
        "expected_subcat": "Contaminated / Dirty Water",
        "expected_loc_substr": ["Pitampura"],
    },
    # 6. Drainage and waterlogging
    {
        "id": 14,
        "name": "Drainage gutter overflowing",
        "text": "Stormwater drainage gutter overflowing and inundating street in Rajouri Garden.",
        "expected_dept": "Municipal Drainage Department",
        "expected_cat": "Drainage",
        "expected_subcat": "Drainage Overflow",
        "expected_loc_substr": ["Rajouri Garden"],
    },
    {
        "id": 15,
        "name": "Monsoon waterlogging",
        "text": "Severe waterlogging due to clogged drains near Dwarka Sector 10.",
        "expected_dept": "Municipal Drainage Department",
        "expected_cat": "Drainage",
        "expected_subcat": "Waterlogging",
        "expected_loc_substr": ["Dwarka Sector 10"],
    },
    # 7. Electricity and power cuts
    {
        "id": 16,
        "name": "Power cut outage",
        "text": "Total electricity power outage in Mayur Vihar Phase 1 for more than 5 hours.",
        "expected_dept": "Electricity Department",
        "expected_cat": "Electricity",
        "expected_subcat": "Power Outage",
        "expected_loc_substr": ["Mayur Vihar Phase 1"],
    },
    {
        "id": 17,
        "name": "Sparking transformer hazard",
        "text": "Electricity transformer sparking violently with smoke near Chandni Chowk.",
        "expected_dept": "Electricity Department",
        "expected_cat": "Electricity",
        "expected_subcat": "Transformer Sparking",
        "expected_loc_substr": ["Chandni Chowk"],
    },
    {
        "id": 18,
        "name": "Exposed live wire safety hazard",
        "text": "Exposed live wire hanging dangerously near school entrance at GT Road.",
        "expected_dept": "Electricity Department",
        "expected_cat": "Electricity",
        "expected_subcat": "Exposed Electrical Hazard",
        "expected_loc_substr": ["GT Road"],
    },
    # 8. Streetlights
    {
        "id": 19,
        "name": "Streetlights off dark road",
        "text": "All streetlights are turned off and road is pitch dark near Kashmere Gate.",
        "expected_dept": "Electrical & Lighting Department",
        "expected_cat": "Street Lighting",
        "expected_subcat": "Streetlight Off",
        "expected_loc_substr": ["Kashmere Gate"],
    },
    {
        "id": 20,
        "name": "Broken streetlight lamp pole",
        "text": "Streetlight pole broken and hanging lamp unlit near Ring Road Junction.",
        "expected_dept": "Electrical & Lighting Department",
        "expected_cat": "Street Lighting",
        "expected_subcat": "Broken Lamp Pole",
        "expected_loc_substr": ["Ring Road Junction"],
    },
    # 9. Short & Misspelled queries
    {
        "id": 21,
        "name": "Misspelled traffic and parking",
        "text": "traffick jam and parkin problem near library",
        "expected_dept": "Traffic / Parking Management",
        "expected_cat": "Traffic / Parking Management",
        "expected_subcat": "Traffic Congestion",
        "expected_loc_substr": ["Library"],
    },
    {
        "id": 22,
        "name": "Misspelled potholes",
        "text": "huge pothol on road near sector 4",
        "expected_dept": "Public Works Department",
        "expected_cat": "Roads / PWD",
        "expected_subcat": "Dangerous Pothole",
        "expected_loc_substr": ["Sector 4"],
    }
]

def test_twenty_different_grievance_examples():
    results = []
    print("\n=======================================================")
    print("      TESTING 22 COMPREHENSIVE GRIEVANCE EXAMPLES      ")
    print("=======================================================")
    
    passed = 0
    for case in TEST_CASES:
        res = predict_grievance_endpoint(GrievancePredictRequest(text=case["text"]))
        
        dept_match = res.department == case["expected_dept"]
        cat_match = res.category == case["expected_cat"]
        subcat_match = res.subcategory == case["expected_subcat"]
        
        loc_match = False
        if res.location_text:
            loc_match = any(sub.lower() in res.location_text.lower() for sub in case["expected_loc_substr"])
            
        case_passed = dept_match and cat_match and loc_match
        if case_passed:
            passed += 1
            status_str = "PASS"
        else:
            status_str = f"FAIL (dept={dept_match}, cat={cat_match}, loc={loc_match})"
            
        print(f"[{status_str}] Case #{case['id']}: {case['name']}")
        print(f"   Input: '{case['text']}'")
        print(f"   => Dept: '{res.department}', Cat: '{res.category}', Subcat: '{res.subcategory}', Loc: '{res.location_text}'")
        
        assert dept_match, f"Case {case['id']} Department mismatch: expected {case['expected_dept']}, got {res.department}"
        assert cat_match, f"Case {case['id']} Category mismatch: expected {case['expected_cat']}, got {res.category}"
        assert loc_match, f"Case {case['id']} Location missing expected substring {case['expected_loc_substr']}, got {res.location_text}"

    print(f"\nSummary: {passed}/{len(TEST_CASES)} cases PASSED!")

def test_multi_turn_conversation_memory():
    print("\n--- TESTING MULTI-TURN CONVERSATION MEMORY ---")
    # Turn 1: User mentions problem near library
    t1_text = "There is a parking problem near the library."
    t1_loc = extract_location(t1_text, None)
    assert t1_loc is not None
    assert "Library" in t1_loc

    # Turn 2: User adds details: vehicles blocking road near main entrance
    t2_text = "Vehicles are blocking the road near the main entrance."
    combined_loc = extract_location(t2_text, t1_loc)
    assert "Library" in combined_loc
    assert "Main Entrance" in combined_loc

    # Combined prediction
    full_text = t1_text + ". " + t2_text
    res = predict_grievance_endpoint(GrievancePredictRequest(text=full_text, existing_location=combined_loc))
    assert res.category == "Traffic / Parking Management"
    assert res.subcategory == "Illegal Parking / Road Obstruction"
    assert "Library" in res.location_text
    assert "Main Entrance" in res.location_text
    assert len(res.missing_information) == 0
    print("Multi-turn context retention & landmark fusion: PASSED!")
