import csv
import os
import random

random.seed(42)

# Prefixes representing conversational filler phrases
fillers = [
    "", "", "",
    "i am rahul sharma i am fine so the problem is that ",
    "hello sir my name is rahul and ",
    "hi assistant i am fine, ",
    "good morning sir, ",
    "bhai listen ",
    "please help me, ",
    "i am reporting an issue that ",
    "in our area "
]

# Structured Template Specs for each department & subcategory
template_specs = {
    "Water Department": [
        # NO WATER SUPPLY
        ("there is no water supply in {loc}", "Water Supply", "No Water Supply", "HIGH"),
        ("no water supply in {loc} for {num} days", "Water Supply", "No Water Supply", "HIGH"),
        ("our taps have been completely dry in {loc} since {day}", "Water Supply", "No Water Supply", "HIGH"),
        ("water has stopped coming in {loc} since {day}", "Water Supply", "No Water Supply", "HIGH"),
        ("no water coming out of kitchen tap since {day}", "Water Supply", "No Water Supply", "HIGH"),
        ("there is a major water shortage in our colony near {loc}", "Water Supply", "No Water Supply", "HIGH"),
        ("bhai hamare area {loc} me {num} din se paani nahi aa raha hai", "Water Supply", "No Water Supply", "HIGH"),
        ("paani ki supply bilkul band hai {loc} me, please help karo", "Water Supply", "No Water Supply", "HIGH"),
        ("paani nahi aa raha ghar mein near {loc}", "Water Supply", "No Water Supply", "HIGH"),
        ("there is water everywhere on the road but our taps have no water near {loc}", "Water Supply", "No Water Supply", "HIGH"),
        
        # WATER PIPELINE LEAKAGE
        ("water pipe is leaking near {loc} and road is full of water", "Water Supply", "Water Pipeline Leakage", "HIGH"),
        ("pipeline burst near {loc} causing heavy water leakage on road", "Water Supply", "Water Pipeline Leakage", "HIGH"),
        ("there is a pipe that is leaking clean water near {loc}", "Water Supply", "Water Pipeline Leakage", "HIGH"),
        ("broken water pipeline is flooding the street in {loc}", "Water Supply", "Water Pipeline Leakage", "HIGH"),
        ("water is coming out of a broken pipe on the street near {loc}", "Water Supply", "Water Pipeline Leakage", "HIGH"),
        ("water pipe is leaking continuously near {loc}", "Water Supply", "Water Pipeline Leakage", "HIGH"),
        ("pipe leakage near {loc} wasting clean drinking water", "Water Supply", "Water Pipeline Leakage", "HIGH"),
        ("water is leaking from main underground pipeline near {loc}", "Water Supply", "Water Pipeline Leakage", "HIGH"),
        ("water pipe leak ho gaya hai {loc} market ke paas", "Water Supply", "Water Pipeline Leakage", "HIGH"),
        ("paani ki pipe leak ho gayi hai sadak par near {loc}", "Water Supply", "Water Pipeline Leakage", "HIGH"),
        ("pipeline phat gayi hai {loc} ke paas", "Water Supply", "Water Pipeline Leakage", "HIGH"),
        ("pipeline leak hai aur paani road par jama ho raha hai near {loc}", "Water Supply", "Water Pipeline Leakage", "HIGH"),

        # CONTAMINATED / DIRTY WATER
        ("dirty brown water is coming from the tap in {loc}", "Water Supply", "Contaminated / Dirty Water", "HIGH"),
        ("muddy dirty water coming out of water taps in {loc}", "Water Supply", "Contaminated / Dirty Water", "HIGH"),
        ("contaminated foul smelling water in supply line near {loc}", "Water Supply", "Contaminated / Dirty Water", "HIGH"),
        ("ganda paani aa raha hai tap me {loc} ke andar", "Water Supply", "Contaminated / Dirty Water", "HIGH"),
        ("tap se ganda peene ka paani aa raha hai near {loc}", "Water Supply", "Contaminated / Dirty Water", "HIGH"),

        # LOW WATER PRESSURE
        ("water pressure is extremely low in {loc}, cannot fill top tank", "Water Supply", "Low Water Pressure", "MEDIUM"),
        ("water comes with very poor low pressure in {loc}", "Water Supply", "Low Water Pressure", "MEDIUM"),
        ("water pressure is very low near {loc}", "Water Supply", "Low Water Pressure", "MEDIUM")
    ],
    "Public Works Department": [
        ("large deep potholes on road surface near {loc} causing accidents", "Roads / PWD", "Dangerous Pothole", "HIGH"),
        ("the asphalt road has huge deep potholes near {loc}", "Roads / PWD", "Dangerous Pothole", "HIGH"),
        ("road surface is cracked damaged and full of craters near {loc}", "Roads / PWD", "Road Repair Needed", "MEDIUM"),
        ("footpath tiles are broken and cracked near {loc}", "Roads / PWD", "Broken Footpath", "LOW"),
        ("road resurfacing construction work near {loc} has been left incomplete", "Roads / PWD", "Incomplete Road Construction", "MEDIUM"),
        ("open manhole on road near {loc} poses severe danger to pedestrians", "Roads / PWD", "Open Manhole Hazard", "CRITICAL"),
        ("tarred road is completely broken with deep craters near {loc}", "Roads / PWD", "Road Repair Needed", "MEDIUM"),
        ("bhai {loc} ke paas sadak tooti hui hai, bade bade gaddhe hain", "Roads / PWD", "Dangerous Pothole", "HIGH"),
        ("open manhole cover missing on road near {loc}", "Roads / PWD", "Open Manhole Hazard", "CRITICAL"),
        ("there is a huge pothole on the asphalt surface near {loc}", "Roads / PWD", "Dangerous Pothole", "HIGH"),
        ("big crater and pothole on damaged road causing bike accidents near {loc}", "Roads / PWD", "Dangerous Pothole", "HIGH"),
        ("damaged broken pavement and footpath tiles near {loc}", "Roads / PWD", "Broken Footpath", "LOW"),
        ("road pitch is worn out and needs resurfacing urgently near {loc}", "Roads / PWD", "Road Repair Needed", "MEDIUM"),
        ("sadak par bohot bade gaddhe hain, road repair chahiye near {loc}", "Roads / PWD", "Dangerous Pothole", "HIGH")
    ],
    "Electricity Department": [
        ("exposed live electrical wire hanging dangerously near {loc}", "Electricity", "Exposed Electrical Hazard", "CRITICAL"),
        ("live electric cable fallen on ground near {loc}", "Electricity", "Exposed Electrical Hazard", "CRITICAL"),
        ("power outage in {loc} area for more than {num} hours", "Electricity", "Power Outage", "HIGH"),
        ("severe voltage fluctuations and complete electricity cut in {loc}", "Electricity", "Power Outage", "HIGH"),
        ("electricity transformer near {loc} is sparking violently and smoking", "Electricity", "Transformer Sparking", "CRITICAL"),
        ("electric utility pole near {loc} is bent and about to collapse", "Electricity", "Damaged Electric Pole", "HIGH"),
        ("bijli chali gayi hai {num} ghante se {loc} me, power cut hai", "Electricity", "Power Outage", "HIGH"),
        ("transformer se chingari nikal rahi hai near {loc}", "Electricity", "Transformer Sparking", "CRITICAL"),
        ("live wire toota hua pada hai near {loc}", "Electricity", "Exposed Electrical Hazard", "CRITICAL")
    ],
    "Sanitation Department": [
        ("public toilet near {loc} is extremely filthy and choked", "Sanitation", "Public Toilet Cleaning", "MEDIUM"),
        ("sewage drainage chamber overflowing near {loc} spreading black water", "Sanitation", "Sewage Overflow", "HIGH"),
        ("severe foul stench coming from uncleaned public washroom near {loc}", "Sanitation", "Foul Smell / Unsanitary Area", "MEDIUM"),
        ("sewage ka ganda paani raste pe beh raha hai near {loc}", "Sanitation", "Sewage Overflow", "HIGH"),
        ("sewage manhole overflowing with toilet waste onto pavement near {loc}", "Sanitation", "Sewage Overflow", "HIGH"),
        ("unhygienic public toilet with broken taps near {loc}", "Sanitation", "Public Toilet Cleaning", "MEDIUM")
    ],
    "Municipal Drainage Department": [
        ("stormwater drainage gutter overflowing and inundating street in {loc}", "Drainage", "Drainage Overflow", "HIGH"),
        ("severe waterlogging in {loc} due to choked storm drainage system", "Drainage", "Waterlogging", "HIGH"),
        ("storm drain gutter is completely clogged with solid waste and silt near {loc}", "Drainage", "Clogged Gutter", "MEDIUM"),
        ("nali overflow kar rahi hai aur paani bhara hai {loc} me", "Drainage", "Drainage Overflow", "HIGH"),
        ("drain choked hone ki wajah se waterlogging ho gayi hai near {loc}", "Drainage", "Waterlogging", "HIGH"),
        ("monsoon waterlogging in {loc} road submerged under drain water", "Drainage", "Waterlogging", "HIGH")
    ],
    "Electrical & Lighting Department": [
        ("streetlights not working on main street near {loc} for {num} nights", "Street Lighting", "Streetlight Off", "MEDIUM"),
        ("streetlight pole lamp broken and unlit near {loc}", "Street Lighting", "Broken Lamp Pole", "MEDIUM"),
        ("entire road near {loc} is pitch dark because street lights are off", "Street Lighting", "Dark Road Safety Concern", "HIGH"),
        ("street light band padi hai andhere me accident ho rahe hain {loc} me", "Street Lighting", "Streetlight Off", "MEDIUM"),
        ("street lamps flickering and dead near {loc}", "Street Lighting", "Streetlight Off", "MEDIUM")
    ],
    "Sanitation & Waste Department": [
        ("garbage has not been collected from {loc} for {num} days", "Waste Management", "Uncollected Garbage", "MEDIUM"),
        ("huge pile of rotting trash and waste dumped openly near {loc}", "Waste Management", "Open Waste Dumping", "MEDIUM"),
        ("community municipal garbage dustbin overflowing near {loc}", "Waste Management", "Garbage Dustbin Overflow", "MEDIUM"),
        ("kachra 4 din se nahi uthaya gaya hai municipal truck nahi aayi {loc} se", "Waste Management", "Uncollected Garbage", "MEDIUM"),
        ("kachre ka dher pada hua hai road side near {loc}", "Waste Management", "Open Waste Dumping", "MEDIUM")
    ],
    "Public Health Department": [
        ("stagnant dirty water pool near {loc} becoming mosquito breeding ground", "Public Health", "Mosquito Breeding Hazard", "HIGH"),
        ("chemical mosquito fogging required urgently in {loc} to stop dengue", "Public Health", "Vector Disease Control", "HIGH"),
        ("machhar bohot zyada ho gaye hain fogging karwao {loc} me dengue phail raha hai", "Public Health", "Vector Disease Control", "HIGH"),
        ("dengue and malaria fever cases spreading rapidly near {loc}", "Public Health", "Disease Outbreak", "HIGH"),
        ("mosquito menace and vector born disease threat near {loc}", "Public Health", "Vector Disease Control", "HIGH")
    ],
    "Traffic / Parking Management": [
        # ILLEGAL PARKING / ROAD OBSTRUCTION
        ("there is a parking problem near {loc}, vehicles are blocking the road", "Traffic / Parking Management", "Illegal Parking / Road Obstruction", "HIGH"),
        ("illegal parking near {loc} entrance, cars and bikes are blocking the road", "Traffic / Parking Management", "Illegal Parking / Road Obstruction", "HIGH"),
        ("vehicles are parked illegally blocking the road near {loc}", "Traffic / Parking Management", "Illegal Parking / Road Obstruction", "HIGH"),
        ("cars and trucks are parked on both sides blocking the passage near {loc}", "Traffic / Parking Management", "Illegal Parking / Road Obstruction", "HIGH"),
        ("unauthorized parking is blocking vehicle movement near {loc}", "Traffic / Parking Management", "Illegal Parking / Road Obstruction", "HIGH"),
        ("scooters and cars parked in no parking zone blocking road near {loc}", "Traffic / Parking Management", "Illegal Parking / Road Obstruction", "HIGH"),
        ("vehicles blocking the main road and gate near {loc}", "Traffic / Parking Management", "Illegal Parking / Road Obstruction", "HIGH"),
        ("parking problem near {loc}, vehicles are obstructing traffic flow", "Traffic / Parking Management", "Illegal Parking / Road Obstruction", "HIGH"),
        ("gaadi raste par khadi karke road block kar diya hai near {loc}", "Traffic / Parking Management", "Illegal Parking / Road Obstruction", "HIGH"),
        ("illegal parking ki wajah se rasta band ho gaya hai {loc} me", "Traffic / Parking Management", "Illegal Parking / Road Obstruction", "HIGH"),
        ("sadak par gaadi park kar di hai traffic nikal nahi paa raha near {loc}", "Traffic / Parking Management", "Illegal Parking / Road Obstruction", "HIGH"),
        ("vehicles are blocking the road near main entrance {loc}", "Traffic / Parking Management", "Illegal Parking / Road Obstruction", "HIGH"),
        ("commercial vehicles parked illegally causing road obstruction near {loc}", "Traffic / Parking Management", "Illegal Parking / Road Obstruction", "HIGH"),

        # TRAFFIC CONGESTION
        ("heavy traffic congestion and vehicle gridlock near {loc}", "Traffic / Parking Management", "Traffic Congestion", "HIGH"),
        ("severe traffic jam near {loc} intersection for the past {num} hours", "Traffic / Parking Management", "Traffic Congestion", "HIGH"),
        ("traffic is completely choked and jammed near {loc} chowk", "Traffic / Parking Management", "Traffic Congestion", "HIGH"),
        ("bohot lamba traffic jam laga hua hai vehicles hili nahi rahi near {loc}", "Traffic / Parking Management", "Traffic Congestion", "HIGH"),
        ("massive traffic block and congestion on route near {loc}", "Traffic / Parking Management", "Traffic Congestion", "HIGH"),

        # BROKEN TRAFFIC SIGNAL
        ("traffic signal lights not working at major intersection near {loc}", "Traffic / Parking Management", "Broken Traffic Signal", "HIGH"),
        ("traffic lights are malfunctioning and stuck on red near {loc} junction", "Traffic / Parking Management", "Broken Traffic Signal", "HIGH"),
        ("broken traffic light signal causing chaotic vehicle movement near {loc}", "Traffic / Parking Management", "Broken Traffic Signal", "HIGH"),
        ("traffic signal kharab hai near {loc} chowk accident ho sakta hai", "Traffic / Parking Management", "Broken Traffic Signal", "HIGH"),
        ("traffic light kaam nahi kar rahi hai near {loc}", "Traffic / Parking Management", "Broken Traffic Signal", "HIGH")
    ],
    "Municipal Transport Department": [
        ("bus stop shelter shade damaged and rusted near {loc}", "Transport", "Bus Stop Damage", "LOW"),
        ("city bus service not arriving on time at {loc} bus stand", "Transport", "Bus Service Issue", "MEDIUM"),
        ("bus stop seating bench is broken near {loc}", "Transport", "Bus Stop Damage", "LOW"),
        ("city buses skipping bus stop near {loc} consistently", "Transport", "Bus Service Issue", "MEDIUM")
    ]
}

locations = [
    "Model Town", "Sector 17", "Civil Lines", "Railway Station Road", "Vasant Kunj", 
    "Karol Bagh", "Lajpat Nagar", "Connaught Place", "Dwarka Sector 10", "Rohini Sector 7",
    "the library", "main entrance", "City Hospital", "Central Market", "Metro Station",
    "College Gate", "Bus Stand", "Sector 14 Chowk", "Public Park", "Gandhi Nagar"
]

num_days = ["2", "3", "4", "5", "7"]
days_list = ["Monday", "Tuesday", "yesterday", "last night", "this morning"]

records = []

for dept, items in template_specs.items():
    count_for_dept = 0
    # 220 samples per department -> 2,200 total records
    while count_for_dept < 220:
        tmpl, cat, subcat, prio = random.choice(items)
        filler = random.choice(fillers)
        loc = random.choice(locations)
        num = random.choice(num_days)
        day = random.choice(days_list)

        body = tmpl.format(loc=loc, num=num, day=day)
        text = (filler + body).strip()

        if random.random() < 0.15:
            text = text.lower()

        records.append({
            "text": text,
            "department": dept,
            "category": cat,
            "subcategory": subcat,
            "priority": prio
        })
        count_for_dept += 1

random.shuffle(records)

data_dir = os.path.join(os.path.dirname(__file__), "data")
os.makedirs(data_dir, exist_ok=True)
csv_path = os.path.join(data_dir, "grievance_dataset.csv")

with open(csv_path, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=["text", "department", "category", "subcategory", "priority"])
    writer.writeheader()
    writer.writerows(records)

print(f"Generated {len(records)} correlated civic grievance dataset records in {csv_path}")
