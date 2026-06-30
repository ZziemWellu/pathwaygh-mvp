"""
Unified User Profile - Single Source of Truth
Every module depends on this profile
"""

from typing import List, Optional, Dict, Any
from enum import Enum
from dataclasses import dataclass, field
from datetime import datetime

class Role(Enum):
    STUDENT_BASIC = "student_basic"
    STUDENT_JHS = "student_jhs"
    STUDENT_SHS = "student_shs"
    STUDENT_TVET = "student_tvet"
    STUDENT_UNIVERSITY = "student_university"
    GRADUATE = "graduate"
    PARENT = "parent"
    TEACHER = "teacher"
    COUNSELLOR = "counsellor"
    ADMINISTRATOR = "administrator"
    JOB_SEEKER = "job_seeker"

class EducationLevel(Enum):
    BASIC = "basic"
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
    OTI = "Oti"
    SAVANNAH = "Savannah"
    NORTH_EAST = "North East"
    AHAFO = "Ahafo"
    BONO = "Bono"
    BONO_EAST = "Bono East"

class SchoolType(Enum):
    PUBLIC = "public"
    PRIVATE = "private"
    INTERNATIONAL = "international"
    MISSION = "mission"
    COMMUNITY = "community"

class IncomeCategory(Enum):
    LOW = "low"
    LOWER_MIDDLE = "lower_middle"
    MIDDLE = "middle"
    UPPER_MIDDLE = "upper_middle"
    HIGH = "high"

@dataclass
class AcademicProfile:
    aggregate: Optional[int] = None
    subjects: List[str] = field(default_factory=list)
    strong_subjects: List[str] = field(default_factory=list)
    weak_subjects: List[str] = field(default_factory=list)
    gpa: Optional[float] = None
    class_rank: Optional[int] = None
    school_type: Optional[str] = None
    has_repeated: bool = False
    repeat_subjects: List[str] = field(default_factory=list)
    
    def to_dict(self) -> Dict:
        return {
            "aggregate": self.aggregate,
            "subjects": self.subjects,
            "strong_subjects": self.strong_subjects,
            "weak_subjects": self.weak_subjects,
            "gpa": self.gpa,
            "class_rank": self.class_rank,
            "school_type": self.school_type,
            "has_repeated": self.has_repeated,
            "repeat_subjects": self.repeat_subjects
        }

@dataclass
class CareerProfile:
    interests: List[str] = field(default_factory=list)
    target_careers: List[str] = field(default_factory=list)
    career_goal: Optional[str] = None
    backup_careers: List[str] = field(default_factory=list)
    career_decision_history: List[Dict] = field(default_factory=list)
    preferred_work_environment: Optional[str] = None
    preferred_industry: Optional[str] = None
    
    def to_dict(self) -> Dict:
        return {
            "interests": self.interests,
            "target_careers": self.target_careers,
            "career_goal": self.career_goal,
            "backup_careers": self.backup_careers,
            "career_decision_history": self.career_decision_history,
            "preferred_work_environment": self.preferred_work_environment,
            "preferred_industry": self.preferred_industry
        }

@dataclass
class GeographicContext:
    region: Optional[str] = None
    district: Optional[str] = None
    urban_rural: Optional[str] = None  # "Urban", "Rural", "Peri-urban"
    nearest_town: Optional[str] = None
    preferred_location: List[str] = field(default_factory=list)
    can_relocate: bool = False
    preferred_relocation: List[str] = field(default_factory=list)
    
    def to_dict(self) -> Dict:
        return {
            "region": self.region,
            "district": self.district,
            "urban_rural": self.urban_rural,
            "nearest_town": self.nearest_town,
            "preferred_location": self.preferred_location,
            "can_relocate": self.can_relocate,
            "preferred_relocation": self.preferred_relocation
        }

@dataclass
class FinancialContext:
    income_category: Optional[str] = None
    budget: Optional[float] = None
    needs_scholarship: bool = False
    can_pay_fees: bool = True
    needs_accommodation: bool = False
    can_relocate_for_study: bool = False
    needs_transport: bool = False
    working_student: bool = False
    dependents: int = 0
    constraints: List[str] = field(default_factory=list)
    
    def to_dict(self) -> Dict:
        return {
            "income_category": self.income_category,
            "budget": self.budget,
            "needs_scholarship": self.needs_scholarship,
            "can_pay_fees": self.can_pay_fees,
            "needs_accommodation": self.needs_accommodation,
            "can_relocate_for_study": self.can_relocate_for_study,
            "needs_transport": self.needs_transport,
            "working_student": self.working_student,
            "dependents": self.dependents,
            "constraints": self.constraints
        }

@dataclass
class LearningPreferences:
    preferred_learning_style: Optional[str] = None  # visual, auditory, kinesthetic
    preferred_study_time: Optional[str] = None
    study_location: Optional[str] = None  # home, library, school
    study_group_preference: bool = False
    
    def to_dict(self) -> Dict:
        return {
            "preferred_learning_style": self.preferred_learning_style,
            "preferred_study_time": self.preferred_study_time,
            "study_location": self.study_location,
            "study_group_preference": self.study_group_preference
        }

@dataclass
class UnifiedProfile:
    """Complete user profile - single source of truth"""
    user_id: Optional[str] = None
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    
    role: Optional[Role] = None
    education_level: Optional[EducationLevel] = None
    school_type: Optional[SchoolType] = None
    school_name: Optional[str] = None
    
    academic: AcademicProfile = field(default_factory=AcademicProfile)
    career: CareerProfile = field(default_factory=CareerProfile)
    geographic: GeographicContext = field(default_factory=GeographicContext)
    financial: FinancialContext = field(default_factory=FinancialContext)
    learning: LearningPreferences = field(default_factory=LearningPreferences)
    
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    last_active: datetime = field(default_factory=datetime.now)
    
    decision_history: List[Dict] = field(default_factory=list)
    feedback_history: List[Dict] = field(default_factory=list)
    
    def to_dict(self) -> Dict:
        return {
            "user_id": self.user_id,
            "name": self.name,
            "email": self.email,
            "phone": self.phone,
            "role": self.role.value if self.role else None,
            "education_level": self.education_level.value if self.education_level else None,
            "school_type": self.school_type.value if self.school_type else None,
            "school_name": self.school_name,
            "academic": self.academic.to_dict(),
            "career": self.career.to_dict(),
            "geographic": self.geographic.to_dict(),
            "financial": self.financial.to_dict(),
            "learning": self.learning.to_dict(),
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "last_active": self.last_active.isoformat(),
            "decision_history": self.decision_history[-10:],
            "feedback_history": self.feedback_history[-10:]
        }
    
    @classmethod
    def from_dict(cls, data: Dict) -> 'UnifiedProfile':
        profile = cls()
        
        # Basic info
        profile.user_id = data.get("user_id")
        profile.name = data.get("name")
        profile.email = data.get("email")
        profile.phone = data.get("phone")
        
        # Role and education
        if "role" in data:
            try:
                profile.role = Role(data["role"])
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
        
        # Academic
        if "academic" in data:
            ac = data["academic"]
            profile.academic.aggregate = ac.get("aggregate")
            profile.academic.subjects = ac.get("subjects", [])
            profile.academic.strong_subjects = ac.get("strong_subjects", [])
            profile.academic.weak_subjects = ac.get("weak_subjects", [])
            profile.academic.gpa = ac.get("gpa")
            profile.academic.class_rank = ac.get("class_rank")
            profile.academic.school_type = ac.get("school_type")
            profile.academic.has_repeated = ac.get("has_repeated", False)
            profile.academic.repeat_subjects = ac.get("repeat_subjects", [])
        
        # Career
        if "career" in data:
            ca = data["career"]
            profile.career.interests = ca.get("interests", [])
            profile.career.target_careers = ca.get("target_careers", [])
            profile.career.career_goal = ca.get("career_goal")
            profile.career.backup_careers = ca.get("backup_careers", [])
            profile.career.career_decision_history = ca.get("career_decision_history", [])
            profile.career.preferred_work_environment = ca.get("preferred_work_environment")
            profile.career.preferred_industry = ca.get("preferred_industry")
        
        # Geographic
        if "geographic" in data:
            geo = data["geographic"]
            profile.geographic.region = geo.get("region")
            profile.geographic.district = geo.get("district")
            profile.geographic.urban_rural = geo.get("urban_rural")
            profile.geographic.nearest_town = geo.get("nearest_town")
            profile.geographic.preferred_location = geo.get("preferred_location", [])
            profile.geographic.can_relocate = geo.get("can_relocate", False)
            profile.geographic.preferred_relocation = geo.get("preferred_relocation", [])
        
        # Financial
        if "financial" in data:
            fin = data["financial"]
            profile.financial.income_category = fin.get("income_category")
            profile.financial.budget = fin.get("budget")
            profile.financial.needs_scholarship = fin.get("needs_scholarship", False)
            profile.financial.can_pay_fees = fin.get("can_pay_fees", True)
            profile.financial.needs_accommodation = fin.get("needs_accommodation", False)
            profile.financial.can_relocate_for_study = fin.get("can_relocate_for_study", False)
            profile.financial.needs_transport = fin.get("needs_transport", False)
            profile.financial.working_student = fin.get("working_student", False)
            profile.financial.dependents = fin.get("dependents", 0)
            profile.financial.constraints = fin.get("constraints", [])
        
        # Learning
        if "learning" in data:
            le = data["learning"]
            profile.learning.preferred_learning_style = le.get("preferred_learning_style")
            profile.learning.preferred_study_time = le.get("preferred_study_time")
            profile.learning.study_location = le.get("study_location")
            profile.learning.study_group_preference = le.get("study_group_preference", False)
        
        return profile
