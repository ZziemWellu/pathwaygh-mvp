"""
Unified Explainability Engine
Explains every decision transparently
"""

from typing import Dict, List, Any

class UnifiedExplainer:
    def __init__(self):
        self.weights = {
            "aggregate": 35,
            "subjects": 30,
            "interests": 20,
            "demand": 10,
            "location": 5
        }
    
    def explain_recommendation(self, career: Dict, profile: Dict) -> Dict:
        """Explain a career recommendation"""
        aggregate = profile.get("academic", {}).get("aggregate")
        subjects = profile.get("academic", {}).get("subjects", [])
        interests = profile.get("career", {}).get("interests", [])
        
        scores = {}
        reasons = []
        
        # Aggregate score
        cutoff = career.get("typical_aggregate", 24)
        if aggregate and aggregate <= cutoff:
            agg_score = min(100, 80 + (cutoff - aggregate) * 3)
            reasons.append(f"✅ Your aggregate ({aggregate}) meets the cutoff (≤{cutoff})")
        elif aggregate:
            agg_score = max(20, 60 - (aggregate - cutoff) * 5)
            reasons.append(f"⚠️ Your aggregate ({aggregate}) is above cutoff (≤{cutoff})")
        else:
            agg_score = 50
            reasons.append("❓ Aggregate not provided")
        scores["aggregate"] = agg_score
        
        # Subject score
        required = career.get("required_subjects", [])
        if required:
            matched = [s for s in subjects if s in required]
            subj_score = (len(matched) / len(required)) * 100
            if matched:
                reasons.append(f"✓ You have {len(matched)}/{len(required)} required subjects")
            else:
                reasons.append(f"✗ Missing required subjects: {', '.join(required)}")
        else:
            subj_score = 70
            reasons.append("✓ No specific subject requirements")
        scores["subjects"] = subj_score
        
        # Interest score
        career_interests = career.get("interests", [])
        if career_interests and interests:
            match = len(set(interests) & set(career_interests))
            int_score = (match / len(career_interests)) * 100
            if match > 0:
                reasons.append(f"✓ Your interests ({', '.join(interests)}) align with this career")
            else:
                reasons.append("⚠️ Your interests don't strongly align")
        else:
            int_score = 50
            reasons.append("❓ Interests not provided")
        scores["interests"] = int_score
        
        # Demand score
        demand = career.get("demand", "Medium")
        demand_map = {"Very High": 100, "High": 80, "Medium": 60, "Low": 30}
        scores["demand"] = demand_map.get(demand, 50)
        reasons.append(f"📈 {demand} demand in Ghana's job market")
        
        # Overall confidence
        weighted = (
            scores["aggregate"] * 0.35 +
            scores["subjects"] * 0.30 +
            scores["interests"] * 0.20 +
            scores["demand"] * 0.15
        )
        
        return {
            "career": career.get("career", "Unknown"),
            "confidence": round(weighted, 1),
            "breakdown": {
                "Aggregate Match": scores["aggregate"],
                "Subject Match": scores["subjects"],
                "Interest Fit": scores["interests"],
                "Job Demand": scores["demand"]
            },
            "reasons": reasons,
            "why_not": self._generate_why_not(career, profile),
            "improvement_tips": self._generate_tips(career, profile, scores)
        }
    
    def _generate_why_not(self, career: Dict, profile: Dict) -> List[str]:
        """Generate reasons why alternative careers might be better"""
        reasons = []
        aggregate = profile.get("academic", {}).get("aggregate")
        cutoff = career.get("typical_aggregate", 24)
        
        if aggregate and aggregate > cutoff:
            reasons.append(f"Your aggregate ({aggregate}) is above the typical cutoff ({cutoff})")
        
        subjects = profile.get("academic", {}).get("subjects", [])
        required = career.get("required_subjects", [])
        missing = [s for s in required if s not in subjects]
        if missing:
            reasons.append(f"Missing required subjects: {', '.join(missing)}")
        
        interests = profile.get("career", {}).get("interests", [])
        career_interests = career.get("interests", [])
        if interests and career_interests and not set(interests) & set(career_interests):
            reasons.append("Your interests don't align strongly with this career")
        
        return reasons
    
    def _generate_tips(self, career: Dict, profile: Dict, scores: Dict) -> List[str]:
        """Generate improvement tips"""
        tips = []
        aggregate = profile.get("academic", {}).get("aggregate")
        cutoff = career.get("typical_aggregate", 24)
        
        if aggregate and aggregate > cutoff:
            tips.append(f"Improve your aggregate from {aggregate} to {cutoff}")
        
        subjects = profile.get("academic", {}).get("subjects", [])
        required = career.get("required_subjects", [])
        missing = [s for s in required if s not in subjects]
        if missing:
            tips.append(f"Add required subjects: {', '.join(missing)}")
        
        if scores.get("subjects", 0) < 60:
            tips.append("Focus on improving your subject grades")
        
        if scores.get("interests", 0) < 50:
            tips.append("Explore this career more to see if it matches your interests")
        
        if not tips:
            tips.append("Maintain your current strong performance")
        
        return tips

unified_explainer = UnifiedExplainer()
