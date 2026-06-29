"""
Simple Admission Probability Predictor
"""

def predict_admission_chance(career, aggregate, subjects, preferred_university=None):
    """Predict admission chances based on university cutoffs"""
    
    university_data = {
        "Medical Doctor": {
            "University of Ghana": {"cutoff": 8, "program": "MBChB Medicine", "subjects": ["Biology", "Chemistry", "Physics"]},
            "KNUST": {"cutoff": 9, "program": "MBChB Medicine", "subjects": ["Biology", "Chemistry", "Physics"]},
            "UHAS": {"cutoff": 10, "program": "MBChB Medicine", "subjects": ["Biology", "Chemistry", "Physics"]}
        },
        "Software Engineer": {
            "University of Ghana": {"cutoff": 15, "program": "BSc Computer Science", "subjects": ["Elective Mathematics"]},
            "KNUST": {"cutoff": 14, "program": "BSc Computer Science", "subjects": ["Elective Mathematics"]},
            "Ashesi": {"cutoff": 12, "program": "BSc Computer Science", "subjects": ["Elective Mathematics"]}
        },
        "Lawyer": {
            "University of Ghana": {"cutoff": 8, "program": "LLB Law", "subjects": ["Government", "Literature"]},
            "KNUST": {"cutoff": 9, "program": "LLB Law", "subjects": ["Government", "Literature"]}
        },
        "Nurse": {
            "University of Ghana": {"cutoff": 14, "program": "BSc Nursing", "subjects": ["Biology", "Chemistry"]},
            "UHAS": {"cutoff": 12, "program": "BSc Nursing", "subjects": ["Biology", "Chemistry"]},
            "UCC": {"cutoff": 13, "program": "BSc Nursing", "subjects": ["Biology", "Chemistry"]}
        },
        "Pharmacist": {
            "KNUST": {"cutoff": 10, "program": "BPharm Pharmacy", "subjects": ["Biology", "Chemistry"]},
            "University of Ghana": {"cutoff": 11, "program": "BPharm Pharmacy", "subjects": ["Biology", "Chemistry"]}
        },
        "Civil Engineer": {
            "KNUST": {"cutoff": 12, "program": "BSc Civil Engineering", "subjects": ["Physics", "Chemistry", "Elective Mathematics"]},
            "University of Ghana": {"cutoff": 14, "program": "BSc Civil Engineering", "subjects": ["Physics", "Chemistry", "Elective Mathematics"]}
        }
    }
    
    results = []
    
    # Get universities for this career
    uni_data = university_data.get(career, {})
    
    if not uni_data:
        return {
            "career": career,
            "aggregate": aggregate,
            "subjects": subjects,
            "predictions": [],
            "best_match": None,
            "recommendation": f"Career '{career}' not found in database"
        }
    
    for uni, details in uni_data.items():
        cutoff = details.get("cutoff", 24)
        
        # Calculate chance
        if aggregate <= cutoff:
            chance = min(95, 80 + (cutoff - aggregate) * 3)
        else:
            chance = max(20, 60 - (aggregate - cutoff) * 5)
        
        # Subject match
        required = details.get("subjects", [])
        matched = len([s for s in subjects if s in required])
        subject_match = f"{matched}/{len(required)}" if required else "N/A"
        
        status = "Very Likely" if chance >= 80 else "Likely" if chance >= 60 else "Possible" if chance >= 40 else "Competitive"
        
        results.append({
            "university": uni,
            "program": details.get("program", career),
            "cutoff": cutoff,
            "your_aggregate": aggregate,
            "admission_chance": round(chance, 1),
            "status": status,
            "required_subjects": required,
            "subject_match": subject_match,
            "competitive_score": "High" if cutoff <= 10 else "Medium" if cutoff <= 16 else "Standard"
        })
    
    # Sort by chance
    results.sort(key=lambda x: x['admission_chance'], reverse=True)
    
    # Filter by preferred university if specified
    if preferred_university:
        results = [r for r in results if preferred_university.lower() in r['university'].lower()]
    
    best = results[0] if results else None
    
    return {
        "career": career,
        "aggregate": aggregate,
        "subjects": subjects,
        "predictions": results[:5],
        "best_match": best,
        "recommendation": best['university'] if best else "Check university websites for admission requirements"
    }
