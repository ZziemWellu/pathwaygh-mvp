"""
Knowledge Graph - Subjects → Skills → Careers
"""

from typing import Dict, List, Any, Optional
import json
from pathlib import Path
import logging

logger = logging.getLogger(__name__)


class KnowledgeGraph:
    """
    Educational Knowledge Graph
    Maps relationships between subjects, skills, and careers
    """
    
    def __init__(self):
        self.graph = self._build_graph()
    
    def _build_graph(self) -> Dict:
        """Build the knowledge graph"""
        return {
            "subjects": {
                "Biology": {
                    "skills": ["Cell Biology", "Genetics", "Ecology", "Anatomy"],
                    "careers": ["Medical Doctor", "Pharmacist", "Nurse", "Biochemist"],
                    "prerequisites": ["Basic Science"],
                    "difficulty": "Medium"
                },
                "Chemistry": {
                    "skills": ["Atomic Structure", "Chemical Bonding", "Organic Chemistry"],
                    "careers": ["Pharmacist", "Chemical Engineer", "Lab Technician"],
                    "prerequisites": ["Basic Science", "Mathematics"],
                    "difficulty": "Medium"
                },
                "Physics": {
                    "skills": ["Mechanics", "Thermodynamics", "Electricity", "Waves"],
                    "careers": ["Engineer", "Physicist", "Architect"],
                    "prerequisites": ["Mathematics"],
                    "difficulty": "Hard"
                },
                "Mathematics": {
                    "skills": ["Algebra", "Geometry", "Calculus", "Statistics"],
                    "careers": ["Accountant", "Data Scientist", "Engineer"],
                    "prerequisites": ["Basic Arithmetic"],
                    "difficulty": "Medium"
                },
                "English": {
                    "skills": ["Grammar", "Composition", "Literature", "Communication"],
                    "careers": ["Teacher", "Journalist", "Lawyer", "Writer"],
                    "prerequisites": [],
                    "difficulty": "Easy"
                },
                "ICT": {
                    "skills": ["Programming", "Networking", "Database", "Web Development"],
                    "careers": ["Software Engineer", "IT Specialist", "Data Analyst"],
                    "prerequisites": ["Mathematics"],
                    "difficulty": "Medium"
                }
            },
            "career_requirements": {
                "Medical Doctor": ["Biology", "Chemistry", "Physics"],
                "Software Engineer": ["ICT", "Mathematics"],
                "Lawyer": ["English", "Government", "Literature"],
                "Accountant": ["Mathematics", "Accounting"],
                "Engineer": ["Physics", "Mathematics", "Chemistry"]
            },
            "skill_relationships": {
                "Programming": ["Web Development", "Data Analysis", "Software Engineering"],
                "Mathematics": ["Physics", "Chemistry", "Engineering", "Data Science"],
                "Biology": ["Medicine", "Agriculture", "Environmental Science"]
            }
        }
    
    def get_subject_skills(self, subject: str) -> List[str]:
        """Get skills for a subject"""
        subject_data = self.graph["subjects"].get(subject, {})
        return subject_data.get("skills", [])
    
    def get_career_subjects(self, career: str) -> List[str]:
        """Get required subjects for a career"""
        return self.graph["career_requirements"].get(career, [])
    
    def get_related_skills(self, skill: str) -> List[str]:
        """Get related skills"""
        return self.graph["skill_relationships"].get(skill, [])
    
    def get_subject_prerequisites(self, subject: str) -> List[str]:
        """Get prerequisites for a subject"""
        subject_data = self.graph["subjects"].get(subject, {})
        return subject_data.get("prerequisites", [])
    
    def find_path(self, start: str, end: str) -> List[str]:
        """Find a path between two nodes in the graph"""
        # Simple path finding - in production, use proper graph algorithms
        if start == end:
            return [start]
        
        # Check if direct connection
        if start in self.graph["subjects"]:
            subject_data = self.graph["subjects"][start]
            if end in subject_data.get("skills", []):
                return [start, end]
        
        return [start, "intermediate", end]

# Singleton
knowledge_graph = KnowledgeGraph()
