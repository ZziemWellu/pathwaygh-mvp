"""
Smart Career Recommender - Rule-based with intelligent scoring
No synthetic ML needed - uses real career data
"""

class SmartRecommender:
    def __init__(self):
        self.careers = self._load_career_data()
    
    def _load_career_data(self):
        return [
            {
                "career": "Medical Doctor",
                "field": "Healthcare",
                "description": "Diagnose and treat illnesses. High demand in Ghana.",
                "universities": ["University of Ghana", "KNUST", "UHAS"],
                "salary_range": "GH₵5,000-15,000",
                "duration_years": 10,
                "typical_aggregate": 12,
                "required_subjects": ["Biology", "Chemistry", "Physics"],
                "interests": ["helping", "science", "healthcare"],
                "keywords": "doctor physician hospital medicine"
            },
            {
                "career": "Software Engineer",
                "field": "Technology",
                "description": "Build software and apps. Ghana's tech sector is growing fast.",
                "universities": ["University of Ghana", "KNUST", "Ashesi"],
                "salary_range": "GH₵3,000-12,000",
                "duration_years": 4,
                "typical_aggregate": 18,
                "required_subjects": ["Elective Mathematics"],
                "interests": ["technology", "math", "problemsolving"],
                "keywords": "programmer developer coding tech"
            },
            {
                "career": "Civil Engineer",
                "field": "Engineering",
                "description": "Design roads, bridges, buildings. Ghana needs infrastructure experts.",
                "universities": ["KNUST", "University of Ghana"],
                "salary_range": "GH₵4,000-12,000",
                "duration_years": 5,
                "typical_aggregate": 16,
                "required_subjects": ["Physics", "Chemistry", "Elective Mathematics"],
                "interests": ["building", "math", "physics"],
                "keywords": "civil engineering construction building"
            },
            {
                "career": "Lawyer",
                "field": "Legal",
                "description": "Represent clients, provide legal advice. Respected profession in Ghana.",
                "universities": ["University of Ghana", "KNUST", "Central University"],
                "salary_range": "GH₵5,000-20,000",
                "duration_years": 7,
                "typical_aggregate": 12,
                "required_subjects": ["Government", "Literature"],
                "interests": ["debating", "reading", "justice"],
                "keywords": "law legal attorney advocate court"
            },
            {
                "career": "Accountant",
                "field": "Business",
                "description": "Manage finances, prepare taxes. Essential for every business.",
                "universities": ["University of Ghana", "UPSA", "KNUST"],
                "salary_range": "GH₵3,000-15,000",
                "duration_years": 4,
                "typical_aggregate": 16,
                "required_subjects": ["Accounting", "Business Management"],
                "interests": ["numbers", "business", "organization"],
                "keywords": "accounting finance audit tax"
            },
            {
                "career": "Pharmacist",
                "field": "Healthcare",
                "description": "Dispense medications, advise on drug safety. Essential healthcare role.",
                "universities": ["KNUST", "University of Ghana", "UCC"],
                "salary_range": "GH₵4,000-10,000",
                "duration_years": 6,
                "typical_aggregate": 15,
                "required_subjects": ["Biology", "Chemistry"],
                "interests": ["science", "healthcare", "helping"],
                "keywords": "pharmacy drugs medications healthcare"
            },
            {
                "career": "Nurse",
                "field": "Healthcare",
                "description": "Care for patients in hospitals. High demand across Ghana.",
                "universities": ["University of Ghana", "UHAS", "UCC"],
                "salary_range": "GH₵2,500-8,000",
                "duration_years": 4,
                "typical_aggregate": 18,
                "required_subjects": ["Biology", "Chemistry"],
                "interests": ["helping", "caring", "healthcare"],
                "keywords": "nursing healthcare patient care"
            },
            {
                "career": "Architect",
                "field": "Creative Arts",
                "description": "Design buildings and structures. Combine creativity with technical skills.",
                "universities": ["KNUST", "University of Ghana"],
                "salary_range": "GH₵4,000-15,000",
                "duration_years": 6,
                "typical_aggregate": 14,
                "required_subjects": ["General Knowledge in Art"],
                "interests": ["design", "drawing", "creative"],
                "keywords": "architecture design building construction"
            }
        ]
    
    def recommend(self, aggregate: int, subjects: dict, interests: dict):
        """Recommend careers based on aggregate and profile"""
        
        student_interests = [k for k, v in interests.items() if v >= 5]
        student_subjects = [k for k, v in subjects.items() if v >= 65]
        
        scored = []
        
        for career in self.careers:
            score = 50
            
            if aggregate <= career["typical_aggregate"]:
                score += 30
                agg_status = "✅ Eligible"
            elif aggregate <= career["typical_aggregate"] + 3:
                score += 15
                agg_status = f"⚠️ Close to {career['typical_aggregate']}"
            else:
                agg_status = f"❌ Need ≤{career['typical_aggregate']}"
            
            interest_match = len(set(student_interests) & set(career["interests"]))
            score += interest_match * 10
            
            required_found = [s for s in career["required_subjects"] if s in student_subjects]
            score += (len(required_found) / max(len(career["required_subjects"]), 1)) * 20
            
            score = min(100, score)
            
            scored.append({
                **career,
                "confidence": round(score, 1),
                "aggregate_match": agg_status,
                "matched_subjects": required_found
            })
        
        scored.sort(key=lambda x: x["confidence"], reverse=True)
        
        return {
            "aggregate": aggregate,
            "predictions": scored[:5],
            "gpt_guidance": None
        }

recommender = SmartRecommender()
