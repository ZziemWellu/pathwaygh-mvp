"""
AI Explainability Engine
Breaks down WHY a recommendation was made
"""

from typing import Dict, List, Any

class ExplainabilityEngine:
    def __init__(self):
        self.weights = {
            "aggregate_match": 35,
            "subject_match": 30,
            "interest_match": 20,
            "job_demand": 10,
            "university_fit": 5
        }
    
    def explain_recommendation(self, career: Dict, student_profile: Dict) -> Dict:
        """Generate detailed explanation for a career recommendation"""
        
        aggregate = student_profile.get('aggregate', 0)
        subjects = student_profile.get('subjects', [])
        interests = student_profile.get('interests', [])
        
        # Calculate component scores
        aggregate_score = self._calculate_aggregate_score(aggregate, career)
        subject_score = self._calculate_subject_score(subjects, career)
        interest_score = self._calculate_interest_score(interests, career)
        demand_score = self._calculate_demand_score(career)
        university_score = self._calculate_university_score(career)
        
        # Total confidence
        total = (
            aggregate_score * self.weights["aggregate_match"] +
            subject_score * self.weights["subject_match"] +
            interest_score * self.weights["interest_match"] +
            demand_score * self.weights["job_demand"] +
            university_score * self.weights["university_fit"]
        ) / 100
        
        return {
            "career": career.get('career', 'Unknown'),
            "confidence": round(total * 100, 1),
            "breakdown": {
                "aggregate_match": {
                    "score": round(aggregate_score * 100, 1),
                    "weight": self.weights["aggregate_match"],
                    "details": self._get_aggregate_details(aggregate, career)
                },
                "subject_match": {
                    "score": round(subject_score * 100, 1),
                    "weight": self.weights["subject_match"],
                    "details": self._get_subject_details(subjects, career)
                },
                "interest_match": {
                    "score": round(interest_score * 100, 1),
                    "weight": self.weights["interest_match"],
                    "details": self._get_interest_details(interests, career)
                },
                "job_demand": {
                    "score": round(demand_score * 100, 1),
                    "weight": self.weights["job_demand"],
                    "details": self._get_demand_details(career)
                },
                "university_fit": {
                    "score": round(university_score * 100, 1),
                    "weight": self.weights["university_fit"],
                    "details": self._get_university_details(career)
                }
            },
            "why_not": self._generate_why_not(career, student_profile),
            "improvement_tips": self._generate_improvement_tips(career, student_profile)
        }
    
    def _calculate_aggregate_score(self, aggregate: int, career: Dict) -> float:
        cutoff = career.get('typical_aggregate', 24)
        if aggregate <= cutoff:
            return min(1.0, 0.8 + (cutoff - aggregate) * 0.05)
        else:
            return max(0.0, 0.6 - (aggregate - cutoff) * 0.08)
    
    def _calculate_subject_score(self, subjects: List[str], career: Dict) -> float:
        required = career.get('required_subjects', [])
        if not required:
            return 1.0
        matched = len([s for s in subjects if s in required])
        return matched / len(required) if required else 0
    
    def _calculate_interest_score(self, interests: List[str], career: Dict) -> float:
        career_interests = career.get('interests', [])
        if not career_interests:
            return 0.5
        matched = len(set(interests) & set(career_interests))
        return matched / len(career_interests) if career_interests else 0
    
    def _calculate_demand_score(self, career: Dict) -> float:
        demand = career.get('demand', 'Medium')
        demand_map = {'Very High': 1.0, 'High': 0.85, 'Medium': 0.6, 'Low': 0.3}
        return demand_map.get(demand, 0.5)
    
    def _calculate_university_score(self, career: Dict) -> float:
        universities = career.get('universities', [])
        return min(1.0, len(universities) / 4) if universities else 0.5
    
    def _get_aggregate_details(self, aggregate: int, career: Dict) -> str:
        cutoff = career.get('typical_aggregate', 24)
        if aggregate <= cutoff:
            return f"Your aggregate ({aggregate}) meets the cutoff (≤{cutoff})"
        else:
            return f"Your aggregate ({aggregate}) is above the cutoff (≤{cutoff})"
    
    def _get_subject_details(self, subjects: List[str], career: Dict) -> str:
        required = career.get('required_subjects', [])
        if not required:
            return "No specific subject requirements"
        matched = [s for s in subjects if s in required]
        missing = [s for s in required if s not in subjects]
        if matched and not missing:
            return f"You have all required subjects: {', '.join(matched)}"
        elif matched:
            return f"You have {len(matched)}/{len(required)} required subjects. Missing: {', '.join(missing)}"
        else:
            return f"None of your subjects match the requirements: {', '.join(required)}"
    
    def _get_interest_details(self, interests: List[str], career: Dict) -> str:
        career_interests = career.get('interests', [])
        if not interests:
            return "No interests provided"
        matched = set(interests) & set(career_interests)
        if matched:
            return f"Your interests ({', '.join(matched)}) align with this career"
        return "Your interests don't strongly align with this career"
    
    def _get_demand_details(self, career: Dict) -> str:
        demand = career.get('demand', 'Medium')
        return f"This career has {demand} demand in Ghana's job market"
    
    def _get_university_details(self, career: Dict) -> str:
        universities = career.get('universities', [])
        if universities:
            return f"Offered at: {', '.join(universities[:3])}"
        return "University information available"
    
    def _generate_why_not(self, career: Dict, student_profile: Dict) -> List[str]:
        """Generate reasons why alternative careers might be better"""
        aggregate = student_profile.get('aggregate', 0)
        cutoff = career.get('typical_aggregate', 24)
        
        reasons = []
        if aggregate > cutoff:
            reasons.append(f"Your aggregate ({aggregate}) may be above the typical cutoff ({cutoff})")
        
        subjects = student_profile.get('subjects', [])
        required = career.get('required_subjects', [])
        missing = [s for s in required if s not in subjects]
        if missing:
            reasons.append(f"Missing required subjects: {', '.join(missing)}")
        
        return reasons
    
    def _generate_improvement_tips(self, career: Dict, student_profile: Dict) -> List[str]:
        """Generate actionable improvement tips"""
        tips = []
        aggregate = student_profile.get('aggregate', 0)
        cutoff = career.get('typical_aggregate', 24)
        
        if aggregate > cutoff:
            tips.append(f"Improve your aggregate to ≤{cutoff}")
        
        subjects = student_profile.get('subjects', [])
        required = career.get('required_subjects', [])
        missing = [s for s in required if s not in subjects]
        if missing:
            tips.append(f"Add these subjects: {', '.join(missing)}")
        
        if not tips:
            tips.append("Maintain your current strong performance")
        
        return tips

explainer = ExplainabilityEngine()
