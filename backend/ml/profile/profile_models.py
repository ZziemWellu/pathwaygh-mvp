"""
Pathway Profile Data Models
Defines the complete user profile structure
"""

from typing import List, Optional, Dict, Any
from enum import Enum
from dataclasses import dataclass, field
from datetime import datetime

class UserRole(Enum):
    STUDENT_BASIC = "student_basic"
    STUDENT_SHS = "student_shs"
    STUDENT_UNIVERSITY = "student_university"
    STUDENT_TVET = "student_tvet"
    PARENT = "parent"
    TEACHER = "teacher"
    COUNSELLOR = "counsellor"
    GRADUATE = "graduate"
    JOB_SEEKER = "job_seeker"
    ADMINISTRATOR = "administrator"

class EducationLevel(Enum):
    JHS = "jhs"
    SHS = "shs"
    TVET = "tvet"
    UNIVERSITY = "university"
    GRADUATE = "graduate"
    NONE = "none"

class Region(Enum):
    GREATER_ACCRA = "Greater Accra"
    ASHANTI = "Ashanti"
    NORTHERN = "Northern"
    VOLTA = "Volta"
    WESTERN = "Western"
    EASTERN = "Eastern"
    CENTRAL = "Central"
    BRONG_AHAFO = "Brong Ahafo"
    UPPER_EAST = "Upper East"
    UPPER_WEST = "Upper West"

class SchoolType(Enum):
    PUBLIC = "public"
    PRIVATE = "private"
    INTERNATIONAL = "international"

class Constraint(Enum):
    PUBLIC_ONLY = "public_universities_only"
    NEEDS_SCHOLARSHIP = "needs_scholarship"
    SHORT_DURATION = "prefers_short_programmes"
    LOCAL_EMPLOYMENT = "wants_local_employment"
    REMOTE_LEARNING = "open_to_remote_learning"
    TECH_FOCUS = "prefers_technology"
    HEALTHCARE_FOCUS = "prefers_healthcare"
    BUSINESS_FOCUS = "prefers_business"

@dataclass
class AcademicProfile:
    """Academic information"""
    aggregate: Optional[int] = None
    subjects: List[str] = field(default_factory=list)
    strong_subjects: List[str] = field(default_factory=list)
    weak_subjects: List[str] = field(default_factory=list)
    gpa: Optional[float] = None
    
    def to_dict(self) -> Dict:
        return {
            "aggregate": self.aggregate,
            "subjects": self.subjects,
            "strong_subjects": self.strong_subjects,
            "weak_subjects": self.weak_subjects,
            "gpa": self.gpa
        }

@dataclass
class CareerProfile:
    """Career interests and goals"""
    interests: List[str] = field(default_factory=list)
    target_careers: List[str] = field(default_factory=list)
    career_goal: Optional[str] = None
    backup_careers: List[str] = field(default_factory=list)
    
    def to_dict(self) -> Dict:
        return {
            "interests": self.interests,
            "target_careers": self.target_careers,
            "career_goal": self.career_goal,
            "backup_careers": self.backup_careers
        }

@dataclass
class GeographicContext:
    """Location and regional context"""
    region: Optional[str] = None
    district: Optional[str] = None
    urban_rural: Optional[str] = None  # "Urban", "Rural", "Peri-urban"
    preferred_location: List[str] = field(default_factory=list)
    
    def to_dict(self) -> Dict:
        return {
            "region": self.region,
            "district": self.district,
            "urban_rural": self.urban_rural,
            "preferred_location": self.preferred_location
        }

@dataclass
class FinancialContext:
    """Financial constraints and needs"""
    budget: Optional[float] = None
    needs_scholarship: bool = False
    can_pay_fees: bool = True
    constraints: List[str] = field(default_factory=list)
    
    def to_dict(self) -> Dict:
        return {
            "budget": self.budget,
            "needs_scholarship": self.needs_scholarship,
            "can_pay_fees": self.can_pay_fees,
            "constraints": self.constraints
        }

@dataclass
class PathwayProfile:
    """Complete user profile"""
    user_id: Optional[str] = None
    role: Optional[UserRole] = None
    education_level: Optional[EducationLevel] = None
    school_type: Optional[SchoolType] = None
    school_name: Optional[str] = None
    
    academic: AcademicProfile = field(default_factory=AcademicProfile)
    career: CareerProfile = field(default_factory=CareerProfile)
    geographic: GeographicContext = field(default_factory=GeographicContext)
    financial: FinancialContext = field(default_factory=FinancialContext)
    
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    
    def to_dict(self) -> Dict:
        return {
            "user_id": self.user_id,
            "role": self.role.value if self.role else None,
            "education_level": self.education_level.value if self.education_level else None,
            "school_type": self.school_type.value if self.school_type else None,
            "school_name": self.school_name,
            "academic": self.academic.to_dict(),
            "career": self.career.to_dict(),
            "geographic": self.geographic.to_dict(),
            "financial": self.financial.to_dict(),
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }
    
    @classmethod
    def from_dict(cls, data: Dict) -> 'PathwayProfile':
        """Create profile from dictionary"""
        profile = cls()
        
        if "role" in data:
            try:
                profile.role = UserRole(data["role"])
            except ValueError:
                pass
        
        if "education_level" in data:
            try:
                profile.education_level = EducationLevel(data["education_level"])
            except ValueError:
                pass
        
        if "school_type" in data:
            try:
                profile.school_type = SchoolType(data["school_type"])
            except ValueError:
                pass
        
        profile.school_name = data.get("school_name")
        
        if "academic" in data:
            ac = data["academic"]
            profile.academic.aggregate = ac.get("aggregate")
            profile.academic.subjects = ac.get("subjects", [])
            profile.academic.strong_subjects = ac.get("strong_subjects", [])
            profile.academic.weak_subjects = ac.get("weak_subjects", [])
            profile.academic.gpa = ac.get("gpa")
        
        if "career" in data:
            ca = data["career"]
            profile.career.interests = ca.get("interests", [])
            profile.career.target_careers = ca.get("target_careers", [])
            profile.career.career_goal = ca.get("career_goal")
            profile.career.backup_careers = ca.get("backup_careers", [])
        
        if "geographic" in data:
            geo = data["geographic"]
            profile.geographic.region = geo.get("region")
            profile.geographic.district = geo.get("district")
            profile.geographic.urban_rural = geo.get("urban_rural")
            profile.geographic.preferred_location = geo.get("preferred_location", [])
        
        if "financial" in data:
            fin = data["financial"]
            profile.financial.budget = fin.get("budget")
            profile.financial.needs_scholarship = fin.get("needs_scholarship", False)
            profile.financial.can_pay_fees = fin.get("can_pay_fees", True)
            profile.financial.constraints = fin.get("constraints", [])
        
        return profile

# Role-specific guidance templates
ROLE_GUIDANCE = {
    "student_basic": {
        "focus": "Subject selection and SHS programme choice",
        "tone": "Encouraging and age-appropriate",
        "resources": ["SHS Programme Guide", "Subject Selection Help", "Career Discovery Quiz"]
    },
    "student_shs": {
        "focus": "University admission, WASSCE preparation, career planning",
        "tone": "Supportive and practical",
        "resources": ["University Finder", "WASSCE Eligibility Checker", "Career Match Tool"]
    },
    "student_university": {
        "focus": "Career outcomes, job search, professional development",
        "tone": "Professional and practical",
        "resources": ["Career Planner", "Job Market Analysis", "Professional Licensing Guide"]
    },
    "student_tvet": {
        "focus": "Skills development, apprenticeship, self-employment",
        "tone": "Practical and empowering",
        "resources": ["Career Pathways", "Entrepreneurship Guide", "TVET Opportunities"]
    },
    "parent": {
        "focus": "Financial planning, student support, educational guidance",
        "tone": "Supportive and informative",
        "resources": ["Financial Aid Guide", "School Selection", "Student Support Resources"]
    },
    "teacher": {
        "focus": "Student guidance, teaching resources, school improvement",
        "tone": "Professional and collaborative",
        "resources": ["Counsellor Dashboard", "Student Analytics", "Career Resources"]
    },
    "counsellor": {
        "focus": "Professional guidance, career assessment, industry insights",
        "tone": "Professional and data-driven",
        "resources": ["Career Assessments", "Industry Reports", "Counselling Tools"]
    },
    "graduate": {
        "focus": "Job search, professional certification, career transition",
        "tone": "Professional and encouraging",
        "resources": ["Job Search Guide", "Certification Pathways", "Career Transition Resources"]
    },
    "job_seeker": {
        "focus": "Job search, skills development, interview preparation",
        "tone": "Practical and encouraging",
        "resources": ["Job Search Strategies", "Interview Preparation", "Skills Development"]
    }
}
