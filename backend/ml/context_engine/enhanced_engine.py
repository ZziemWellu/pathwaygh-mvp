"""
Enhanced AI Context Engine
Sits before ALL AI features - filters retrieval, personalizes EVERY response
"""

from typing import Dict, List, Any, Optional
from ml.profile.profile_models import PathwayProfile, ROLE_GUIDANCE

class EnhancedContextEngine:
    def __init__(self):
        self.profiles = {}
    
    def get_profile(self, user_id: str) -> Optional[PathwayProfile]:
        return self.profiles.get(user_id)
    
    def set_profile(self, user_id: str, profile: PathwayProfile):
        self.profiles[user_id] = profile
    
    def build_context(self, user_id: str, feature: str, query: str = "") -> Dict:
        """Build context for ANY feature - not just chat"""
        profile = self.get_profile(user_id)
        
        context = {
            "feature": feature,
            "query": query,
            "profile": profile.to_dict() if profile else None,
            "role_guidance": None,
            "filters": {},
            "priority": {},
            "explanation": []
        }
        
        if profile:
            # Build role guidance
            role_id = profile.role.value if profile.role else None
            if role_id in ROLE_GUIDANCE:
                context["role_guidance"] = ROLE_GUIDANCE[role_id]
                context["explanation"].append(f"User is a {role_id.replace('_', ' ')}")
            
            # Build filters for retrieval
            filters = {}
            
            # Academic filters
            if profile.academic.aggregate:
                filters["max_aggregate"] = profile.academic.aggregate
                context["explanation"].append(f"Aggregate: {profile.academic.aggregate}")
            
            if profile.academic.subjects:
                filters["subjects"] = profile.academic.subjects
                context["explanation"].append(f"Subjects: {', '.join(profile.academic.subjects)}")
            
            # Career filters
            if profile.career.career_goal:
                filters["career_goal"] = profile.career.career_goal
                context["explanation"].append(f"Career goal: {profile.career.career_goal}")
            
            if profile.career.interests:
                filters["interests"] = profile.career.interests
                context["explanation"].append(f"Interests: {', '.join(profile.career.interests)}")
            
            # Geographic filters
            if profile.geographic.region:
                filters["region"] = profile.geographic.region
                context["explanation"].append(f"Region: {profile.geographic.region}")
            
            # Financial filters
            if profile.financial.needs_scholarship:
                filters["needs_scholarship"] = True
                context["explanation"].append("Scholarship needed")
            
            if profile.financial.constraints:
                filters["constraints"] = profile.financial.constraints
                context["explanation"].append(f"Constraints: {', '.join(profile.financial.constraints)}")
            
            # Education level filter
            if profile.education_level:
                filters["education_level"] = profile.education_level.value
                context["explanation"].append(f"Education level: {profile.education_level.value}")
            
            context["filters"] = filters
            
            # Set priority based on feature
            context["priority"] = self._get_feature_priority(feature, profile)
        
        return context
    
    def filter_retrieval(self, context: Dict, documents: List[Dict]) -> List[Dict]:
        """Filter retrieved documents based on context"""
        filters = context.get("filters", {})
        if not filters:
            return documents
        
        filtered = []
        for doc in documents:
            score = 0
            max_score = len(filters)
            
            # Check aggregate filter
            if "max_aggregate" in filters:
                cutoff = doc.get("cutoff", 99)
                if filters["max_aggregate"] <= cutoff:
                    score += 1
            
            # Check subject filter
            if "subjects" in filters:
                doc_subjects = doc.get("subjects", [])
                if any(s in doc_subjects for s in filters["subjects"]):
                    score += 1
            
            # Check region filter
            if "region" in filters:
                doc_regions = doc.get("regions", [])
                if filters["region"] in doc_regions or not doc_regions:
                    score += 1
            
            # Check scholarship filter
            if "needs_scholarship" in filters and filters["needs_scholarship"]:
                if doc.get("scholarship_available", False):
                    score += 1
            
            # Check career goal filter
            if "career_goal" in filters:
                doc_careers = doc.get("careers", [])
                if filters["career_goal"] in doc_careers:
                    score += 1
            
            # Calculate relevance
            relevance = score / max_score if max_score > 0 else 0.5
            doc["context_relevance"] = relevance
            doc["context_score"] = score
            
            if relevance > 0.4:  # Threshold
                filtered.append(doc)
        
        # Sort by relevance
        filtered.sort(key=lambda x: x.get("context_relevance", 0), reverse=True)
        return filtered
    
    def _get_feature_priority(self, feature: str, profile: PathwayProfile) -> Dict:
        """Get priority weights for different features"""
        priorities = {
            "careers": {
                "aggregate_match": 40,
                "subject_match": 30,
                "interest_match": 20,
                "demand": 10
            },
            "admission": {
                "aggregate_match": 50,
                "subject_match": 30,
                "region_match": 10,
                "scholarship": 10
            },
            "scholarships": {
                "needs_scholarship": 40,
                "field_match": 30,
                "region_match": 20,
                "deadline": 10
            },
            "university": {
                "aggregate_match": 40,
                "location": 30,
                "program_fit": 20,
                "cost": 10
            }
        }
        return priorities.get(feature, priorities["careers"])
    
    def explain_context(self, context: Dict) -> List[str]:
        """Generate human-readable explanation of context"""
        explanations = context.get("explanation", [])
        if not explanations:
            return ["No context available"]
        
        formatted = ["🧠 Context applied to this recommendation:"]
        for exp in explanations:
            formatted.append(f"  • {exp}")
        
        return formatted
    
    def get_role_guidance(self, context: Dict) -> Dict:
        """Get role-specific guidance"""
        return context.get("role_guidance", {})

# Singleton
enhanced_context_engine = EnhancedContextEngine()
