"""
Dynamic Persona Engine
Manages user personas and their specific behaviors
"""

from typing import Dict, List, Any

class DynamicPersonaEngine:
    def __init__(self):
        self.personas = {
            "student_basic": {
                "name": "Basic School Student",
                "emoji": "🧒",
                "description": "Student in basic education",
                "focus": ["Subject selection", "Career exploration", "SHS choice"],
                "tone": "Simple and encouraging"
            },
            "student_jhs": {
                "name": "JHS Student",
                "emoji": "📚",
                "description": "Student in Junior High School",
                "focus": ["BECE preparation", "SHS selection", "Career awareness"],
                "tone": "Supportive and practical"
            },
            "student_shs": {
                "name": "SHS Student",
                "emoji": "🎓",
                "description": "Student in Senior High School",
                "focus": ["University admission", "WASSCE preparation", "Career planning"],
                "tone": "Supportive and motivational"
            },
            "student_tvet": {
                "name": "TVET Student",
                "emoji": "🔧",
                "description": "Technical and Vocational Education student",
                "focus": ["Skills development", "Apprenticeship", "Self-employment"],
                "tone": "Practical and empowering"
            },
            "student_university": {
                "name": "University Student",
                "emoji": "🏫",
                "description": "Student in tertiary education",
                "focus": ["Career outcomes", "Job search", "Professional development"],
                "tone": "Professional and practical"
            },
            "graduate": {
                "name": "Graduate",
                "emoji": "🎓",
                "description": "Recent graduate",
                "focus": ["Job search", "Certification", "Career transition"],
                "tone": "Professional and encouraging"
            },
            "parent": {
                "name": "Parent / Guardian",
                "emoji": "👨‍👩‍👧‍👦",
                "description": "Parent or guardian of a student",
                "focus": ["Financial planning", "Student support", "Educational guidance"],
                "tone": "Supportive and informative"
            },
            "teacher": {
                "name": "Teacher",
                "emoji": "👨‍🏫",
                "description": "Teacher or educator",
                "focus": ["Student guidance", "Teaching resources", "School improvement"],
                "tone": "Professional and collaborative"
            },
            "counsellor": {
                "name": "Career Counsellor",
                "emoji": "💼",
                "description": "Professional career counsellor",
                "focus": ["Professional guidance", "Career assessment", "Industry insights"],
                "tone": "Professional and data-driven"
            },
            "administrator": {
                "name": "School Administrator",
                "emoji": "📊",
                "description": "School principal or administrator",
                "focus": ["School improvement", "Student outcomes", "Strategic planning"],
                "tone": "Professional and strategic"
            }
        }
    
    def get_persona(self, persona_id: str) -> Dict:
        """Get persona by ID"""
        return self.personas.get(persona_id, self.personas["student_shs"])
    
    def get_all_personas(self) -> List[Dict]:
        """Get all personas"""
        return [
            {"id": key, **value}
            for key, value in self.personas.items()
        ]
    
    def get_persona_journey(self, persona_id: str) -> List[str]:
        """Get the recommended journey for a persona"""
        journeys = {
            "student_shs": ["Career Match", "Universities", "Admission Predictor", "Action Plan"],
            "student_tvet": ["Skills Assessment", "Career Pathways", "Apprenticeships", "Entrepreneurship"],
            "parent": ["Child Progress", "Costs", "Scholarships", "Recommendations"],
            "teacher": ["Class Analytics", "Risk Students", "Recommendations"],
            "counsellor": ["School Dashboard", "Career Statistics", "Reports"],
            "graduate": ["Job Search", "Certification", "Career Transition"],
            "student_university": ["Career Outcomes", "Job Market", "Professional Development"]
        }
        return journeys.get(persona_id, ["Profile", "Explore", "Recommendations"])

persona_engine = DynamicPersonaEngine()
