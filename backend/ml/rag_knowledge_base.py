"""
RAG Knowledge Base for Ghanaian Careers
Stores and retrieves Ghana-specific career information
"""

import json
from typing import List, Dict, Any

class RAGKnowledgeBase:
    """Knowledge base for Ghanaian career information"""
    
    def __init__(self):
        self.careers = self._load_career_data()
        self.universities = self._load_university_data()
    
    def _load_career_data(self):
        return {
            "Medical Doctor": {
                "description": "Diagnose and treat illnesses in hospitals and clinics.",
                "requirements": "WASSCE aggregate ≤ 12 with A/B in Biology, Chemistry, Physics. General Science SHS programme.",
                "universities": ["University of Ghana (UG)", "KNUST", "UHAS", "UDS"],
                "duration": "6 years MBChB + 1 year housemanship",
                "salary_range": "GH₵ 5,000 - 15,000 per month",
                "licensing": "Medical and Dental Council of Ghana",
                "job_outlook": "High demand - Ghana needs more doctors, especially in rural areas",
                "typical_subjects": ["Biology", "Chemistry", "Physics", "Elective Mathematics"]
            },
            "Pharmacist": {
                "description": "Dispense medications, counsel patients on drug use, ensure pharmaceutical safety.",
                "requirements": "WASSCE aggregate ≤ 15 with good grades in Biology, Chemistry. General Science SHS programme.",
                "universities": ["KNUST", "University of Ghana", "UCC", "Central University"],
                "duration": "6 years Doctor of Pharmacy (PharmD)",
                "salary_range": "GH₵ 4,000 - 10,000 per month",
                "licensing": "Pharmacy Council of Ghana",
                "job_outlook": "Growing demand - pharmacists essential in hospitals and community pharmacies",
                "typical_subjects": ["Biology", "Chemistry", "Mathematics"]
            },
            "Software Engineer": {
                "description": "Design, develop, and maintain software applications and systems.",
                "requirements": "WASSCE aggregate ≤ 18 with strong grades in Elective Mathematics. General Science or ICT background.",
                "universities": ["University of Ghana", "KNUST", "Ashesi University", "Academic City"],
                "duration": "4 years BSc Computer Science",
                "salary_range": "GH₵ 3,000 - 12,000 per month",
                "licensing": "Optional: Ghana Computer Society certification",
                "job_outlook": "Very high demand - Ghana's tech sector is growing rapidly",
                "typical_subjects": ["Elective Mathematics", "ICT", "Physics"]
            },
            "Civil Engineer": {
                "description": "Design and supervise construction of infrastructure: roads, bridges, buildings.",
                "requirements": "WASSCE aggregate ≤ 16 with strong grades in Physics, Chemistry, Elective Mathematics.",
                "universities": ["KNUST", "University of Ghana", "All Nations University"],
                "duration": "4 years BSc Civil Engineering",
                "salary_range": "GH₵ 4,000 - 12,000 per month",
                "licensing": "Ghana Institution of Engineers (GhIE)",
                "job_outlook": "High demand - Ghana's infrastructure development continues",
                "typical_subjects": ["Physics", "Chemistry", "Elective Mathematics"]
            },
            "Lawyer": {
                "description": "Represent clients in court, provide legal advice, draft legal documents.",
                "requirements": "WASSCE aggregate ≤ 12 with strong grades in Government, Literature, History.",
                "universities": ["University of Ghana School of Law", "KNUST Faculty of Law", "Central University", "GIMPA"],
                "duration": "4 years LLB + 1 year pupillage + Bar exams",
                "salary_range": "GH₵ 5,000 - 20,000 per month",
                "licensing": "Ghana Bar Association",
                "job_outlook": "Competitive - top graduates find excellent opportunities",
                "typical_subjects": ["Government", "Literature in English", "History"]
            },
            "Nurse": {
                "description": "Provide patient care, administer medications, support doctors in hospitals.",
                "requirements": "WASSCE aggregate ≤ 18 with good grades in Biology, Chemistry.",
                "universities": ["University of Ghana", "UHAS", "UCC", "Nursing Training Colleges"],
                "duration": "4 years BSc Nursing",
                "salary_range": "GH₵ 2,500 - 8,000 per month",
                "licensing": "Nursing and Midwifery Council of Ghana",
                "job_outlook": "Very high demand - nurses needed across all regions",
                "typical_subjects": ["Biology", "Chemistry", "Integrated Science"]
            },
            "Accountant": {
                "description": "Manage financial records, prepare tax returns, conduct audits.",
                "requirements": "WASSCE aggregate ≤ 20 with good grades in Accounting, Business Management.",
                "universities": ["University of Ghana Business School", "UPSA", "KNUST School of Business"],
                "duration": "4 years BSc Accounting + ICAG certification",
                "salary_range": "GH₵ 3,000 - 15,000 per month",
                "licensing": "ICAG (Institute of Chartered Accountants Ghana)",
                "job_outlook": "Stable demand - every organization needs accountants",
                "typical_subjects": ["Accounting", "Business Management", "Economics"]
            },
            "Architect": {
                "description": "Design buildings and structures, create blueprints, oversee construction.",
                "requirements": "WASSCE aggregate ≤ 14 with General Knowledge in Art.",
                "universities": ["KNUST", "University of Ghana", "Central University"],
                "duration": "4-6 years BSc Architecture + internship",
                "salary_range": "GH₵ 4,000 - 15,000 per month",
                "licensing": "Ghana Institute of Architects (GhIA)",
                "job_outlook": "Growing demand - construction boom in Ghana",
                "typical_subjects": ["General Knowledge in Art", "Mathematics", "Physics"]
            }
        }
    
    def _load_university_data(self):
        return {
            "University of Ghana": {
                "cutoffs": {"Medical Doctor": 8, "Lawyer": 9, "Computer Science": 15},
                "location": "Legon, Accra",
                "ranking": "1st in Ghana"
            },
            "KNUST": {
                "cutoffs": {"Medical Doctor": 9, "Engineering": 12, "Architecture": 10},
                "location": "Kumasi, Ashanti Region",
                "ranking": "2nd in Ghana"
            },
            "UHAS": {
                "cutoffs": {"Medical Doctor": 10, "Nursing": 14},
                "location": "Ho, Volta Region",
                "ranking": "Top health sciences university"
            }
        }
    
    def retrieve_career_info(self, career_name: str) -> Dict:
        """Retrieve detailed information about a specific career"""
        return self.careers.get(career_name, {})
    
    def get_university_recommendations(self, career: str, aggregate: int) -> List[Dict]:
        """Recommend universities based on career and aggregate"""
        recommendations = []
        
        career_info = self.careers.get(career, {})
        universities = career_info.get("universities", [])
        
        for uni in universities[:3]:
            recommendations.append({
                "university": uni,
                "career": career,
                "estimated_chance": "High" if aggregate <= 14 else "Medium" if aggregate <= 18 else "Competitive",
                "notes": f"Check specific requirements for {career} at {uni}"
            })
        
        return recommendations

rag_kb = RAGKnowledgeBase()
