"""
AI Context Engine
Builds context from user profile and tailors responses
"""

from typing import Dict, List, Any, Optional
from ml.profile.profile_models import PathwayProfile, ROLE_GUIDANCE, UserRole

class AIContextEngine:
    def __init__(self):
        self.profiles = {}  # In-memory storage (replace with DB in production)
    
    def create_profile(self, user_id: str, data: Dict) -> PathwayProfile:
        """Create a new profile for a user"""
        profile = PathwayProfile.from_dict(data)
        profile.user_id = user_id
        self.profiles[user_id] = profile
        return profile
    
    def get_profile(self, user_id: str) -> Optional[PathwayProfile]:
        """Get profile by user ID"""
        return self.profiles.get(user_id)
    
    def update_profile(self, user_id: str, data: Dict) -> Optional[PathwayProfile]:
        """Update an existing profile"""
        if user_id not in self.profiles:
            return None
        
        profile = self.profiles[user_id]
        updated = PathwayProfile.from_dict(data)
        
        # Merge updates
        if updated.role:
            profile.role = updated.role
        if updated.education_level:
            profile.education_level = updated.education_level
        if updated.school_type:
            profile.school_type = updated.school_type
        if updated.school_name:
            profile.school_name = updated.school_name
        
        # Merge academic data
        if updated.academic.aggregate is not None:
            profile.academic.aggregate = updated.academic.aggregate
        if updated.academic.subjects:
            profile.academic.subjects = updated.academic.subjects
        if updated.academic.strong_subjects:
            profile.academic.strong_subjects = updated.academic.strong_subjects
        if updated.academic.weak_subjects:
            profile.academic.weak_subjects = updated.academic.weak_subjects
        
        # Merge career data
        if updated.career.interests:
            profile.career.interests = updated.career.interests
        if updated.career.target_careers:
            profile.career.target_careers = updated.career.target_careers
        if updated.career.career_goal:
            profile.career.career_goal = updated.career.career_goal
        
        # Merge geographic data
        if updated.geographic.region:
            profile.geographic.region = updated.geographic.region
        if updated.geographic.district:
            profile.geographic.district = updated.geographic.district
        
        # Merge financial data
        if updated.financial.constraints:
            profile.financial.constraints = updated.financial.constraints
        if updated.financial.needs_scholarship:
            profile.financial.needs_scholarship = updated.financial.needs_scholarship
        
        profile.updated_at = datetime.now()
        self.profiles[user_id] = profile
        return profile
    
    def build_context(self, user_id: str, query: str) -> Dict:
        """Build rich context from profile and query"""
        profile = self.get_profile(user_id)
        
        context = {
            "query": query,
            "profile": None,
            "guidance": None,
            "regional_context": None,
            "academic_context": None,
            "career_context": None,
            "financial_context": None,
            "conversation_memory": None
        }
        
        if profile:
            context["profile"] = profile.to_dict()
            
            # Get role guidance
            role_id = profile.role.value if profile.role else None
            if role_id in ROLE_GUIDANCE:
                context["guidance"] = ROLE_GUIDANCE[role_id]
            
            # Build regional context
            if profile.geographic.region:
                context["regional_context"] = self._build_regional_context(profile.geographic.region)
            
            # Build academic context
            if profile.academic.aggregate or profile.academic.subjects:
                context["academic_context"] = self._build_academic_context(profile)
            
            # Build career context
            if profile.career.interests or profile.career.career_goal:
                context["career_context"] = self._build_career_context(profile)
            
            # Build financial context
            if profile.financial.constraints or profile.financial.needs_scholarship:
                context["financial_context"] = self._build_financial_context(profile)
        
        return context
    
    def _build_regional_context(self, region: str) -> Dict:
        """Build regional context for recommendations"""
        regional_data = {
            "Greater Accra": {
                "universities": ["University of Ghana", "Ashesi", "GIMPA", "UPSA"],
                "tvets": ["Accra Technical University"],
                "employment_hubs": ["Accra", "Tema"],
                "scholarships": ["GETFund", "Mastercard Foundation"]
            },
            "Ashanti": {
                "universities": ["KNUST"],
                "tvets": ["Kumasi Technical University"],
                "employment_hubs": ["Kumasi", "Obuasi"],
                "scholarships": ["GETFund", "KNUST Scholarships"]
            },
            "Volta": {
                "universities": ["UHAS"],
                "tvets": ["Ho Technical University"],
                "employment_hubs": ["Ho", "Hohoe"],
                "scholarships": ["GETFund", "UHAS Scholarships"]
            },
            "Northern": {
                "universities": ["UDS"],
                "tvets": ["Tamale Technical University"],
                "employment_hubs": ["Tamale", "Yendi"],
                "scholarships": ["GETFund", "Northern Development Scholarships"]
            }
        }
        return regional_data.get(region, {})
    
    def _build_academic_context(self, profile: PathwayProfile) -> Dict:
        """Build academic context"""
        return {
            "aggregate": profile.academic.aggregate,
            "subjects": profile.academic.subjects,
            "strong_subjects": profile.academic.strong_subjects,
            "weak_subjects": profile.academic.weak_subjects,
            "education_level": profile.education_level.value if profile.education_level else None
        }
    
    def _build_career_context(self, profile: PathwayProfile) -> Dict:
        """Build career context"""
        return {
            "interests": profile.career.interests,
            "target_careers": profile.career.target_careers,
            "career_goal": profile.career.career_goal,
            "backup_careers": profile.career.backup_careers
        }
    
    def _build_financial_context(self, profile: PathwayProfile) -> Dict:
        """Build financial context"""
        return {
            "needs_scholarship": profile.financial.needs_scholarship,
            "constraints": profile.financial.constraints,
            "budget": profile.financial.budget
        }
    
    def generate_contextual_prompt(self, context: Dict) -> str:
        """Generate a prompt with full context"""
        prompt_parts = []
        
        # Add profile context
        profile = context.get("profile")
        if profile:
            role = profile.get("role", "user")
            prompt_parts.append(f"User Role: {role}")
            
            if "education_level" in profile:
                prompt_parts.append(f"Education Level: {profile['education_level']}")
        
        # Add academic context
        academic = context.get("academic_context", {})
        if academic:
            agg = academic.get("aggregate")
            if agg:
                prompt_parts.append(f"WASSCE Aggregate: {agg}")
            subjects = academic.get("subjects", [])
            if subjects:
                prompt_parts.append(f"Subjects: {', '.join(subjects)}")
            strong = academic.get("strong_subjects", [])
            if strong:
                prompt_parts.append(f"Strong Subjects: {', '.join(strong)}")
        
        # Add career context
        career = context.get("career_context", {})
        if career:
            interests = career.get("interests", [])
            if interests:
                prompt_parts.append(f"Career Interests: {', '.join(interests)}")
            goal = career.get("career_goal")
            if goal:
                prompt_parts.append(f"Career Goal: {goal}")
        
        # Add financial context
        financial = context.get("financial_context", {})
        if financial:
            if financial.get("needs_scholarship"):
                prompt_parts.append("Needs Scholarship")
            constraints = financial.get("constraints", [])
            if constraints:
                prompt_parts.append(f"Constraints: {', '.join(constraints)}")
        
        # Add query
        query = context.get("query", "")
        prompt_parts.append(f"Question: {query}")
        
        return "\n".join(prompt_parts)

context_engine = AIContextEngine()
