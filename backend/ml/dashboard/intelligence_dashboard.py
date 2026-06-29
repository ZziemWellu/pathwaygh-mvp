"""
Pathway Intelligence Dashboard
Visual dashboard with scores and recommendations
"""

from typing import Dict, List, Any

class IntelligenceDashboard:
    def __init__(self):
        pass
    
    def generate_dashboard(self, profile: Dict, recommendations: List[Dict]) -> Dict:
        """Generate comprehensive intelligence dashboard"""
        
        # Calculate readiness scores
        scores = self._calculate_scores(profile, recommendations)
        
        # Get top recommendation
        top_rec = recommendations[0] if recommendations else None
        
        return {
            "profile_summary": self._summarize_profile(profile),
            "readiness_scores": scores,
            "top_recommendation": top_rec,
            "recommendations": recommendations[:3],
            "next_steps": self._get_next_steps(profile, top_rec),
            "visual_data": self._generate_visual_data(scores),
            "confidence_breakdown": self._get_confidence_breakdown(top_rec) if top_rec else {}
        }
    
    def _calculate_scores(self, profile: Dict, recommendations: List[Dict]) -> Dict:
        """Calculate readiness scores"""
        scores = {}
        
        # Academic readiness based on aggregate
        aggregate = profile.get("academic", {}).get("aggregate")
        if aggregate:
            if aggregate <= 12:
                scores["academic_readiness"] = 85
            elif aggregate <= 18:
                scores["academic_readiness"] = 65
            elif aggregate <= 24:
                scores["academic_readiness"] = 45
            else:
                scores["academic_readiness"] = 25
        else:
            scores["academic_readiness"] = 50
        
        # Admission probability based on top recommendation
        if recommendations:
            top = recommendations[0]
            cutoff = top.get("typical_aggregate", 24)
            if aggregate and aggregate <= cutoff:
                scores["admission_probability"] = min(95, 80 + (cutoff - aggregate) * 3)
            elif aggregate:
                scores["admission_probability"] = max(20, 60 - (aggregate - cutoff) * 5)
            else:
                scores["admission_probability"] = 50
        else:
            scores["admission_probability"] = 50
        
        # Career fit based on interests
        interests = profile.get("career", {}).get("interests", [])
        if interests and recommendations:
            top = recommendations[0]
            career_interests = top.get("interests", [])
            match = len(set(interests) & set(career_interests))
            scores["career_fit"] = min(95, 50 + match * 10)
        else:
            scores["career_fit"] = 50
        
        # Scholarship eligibility
        needs_scholarship = profile.get("financial", {}).get("needs_scholarship", False)
        if needs_scholarship:
            scores["scholarship_eligibility"] = 65
        else:
            scores["scholarship_eligibility"] = 40
        
        # Job demand
        if recommendations:
            top = recommendations[0]
            demand = top.get("demand", "Medium")
            demand_map = {"Very High": 95, "High": 80, "Medium": 60, "Low": 30}
            scores["job_demand"] = demand_map.get(demand, 50)
        else:
            scores["job_demand"] = 50
        
        # AI confidence
        scores["ai_confidence"] = self._calculate_ai_confidence(scores)
        
        return scores
    
    def _calculate_ai_confidence(self, scores: Dict) -> int:
        """Calculate overall AI confidence"""
        weights = {
            "academic_readiness": 0.20,
            "admission_probability": 0.25,
            "career_fit": 0.20,
            "job_demand": 0.15,
            "scholarship_eligibility": 0.10
        }
        
        total = 0
        for key, weight in weights.items():
            if key in scores:
                total += scores[key] * weight
        
        return int(total)
    
    def _summarize_profile(self, profile: Dict) -> Dict:
        """Summarize user profile"""
        return {
            "role": profile.get("role", "Student"),
            "education_level": profile.get("education_level", "SHS"),
            "region": profile.get("geographic", {}).get("region", "Unknown"),
            "aggregate": profile.get("academic", {}).get("aggregate"),
            "interests": profile.get("career", {}).get("interests", [])[:3]
        }
    
    def _get_next_steps(self, profile: Dict, top_rec: Dict) -> List[str]:
        """Get actionable next steps"""
        steps = []
        
        aggregate = profile.get("academic", {}).get("aggregate")
        if top_rec:
            cutoff = top_rec.get("typical_aggregate", 24)
            if aggregate and aggregate > cutoff:
                steps.append(f"Improve your aggregate from {aggregate} to {cutoff}")
            steps.append(f"Research {top_rec.get('career', '')} programs")
            steps.append("Prepare application materials")
        
        if profile.get("financial", {}).get("needs_scholarship"):
            steps.append("Apply for scholarships")
        
        if not steps:
            steps = ["Complete your profile", "Explore career options", "Check university requirements"]
        
        return steps[:3]
    
    def _generate_visual_data(self, scores: Dict) -> Dict:
        """Generate data for visual charts"""
        return {
            "categories": list(scores.keys()),
            "values": list(scores.values()),
            "max_value": 100
        }
    
    def _get_confidence_breakdown(self, top_rec: Dict) -> Dict:
        """Get confidence breakdown for top recommendation"""
        return {
            "overall": top_rec.get("confidence", 70),
            "breakdown": {
                "Aggregate Match": 35,
                "Subject Match": 30,
                "Interest Fit": 20,
                "Job Demand": 15
            }
        }

dashboard = IntelligenceDashboard()
