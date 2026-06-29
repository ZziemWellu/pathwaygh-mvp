"""
Career Roadmap Generator
Creates visual pathway from SHS to career
"""

from typing import Dict, List

class RoadmapGenerator:
    def __init__(self):
        self.career_pathways = {
            "Medical Doctor": {
                "stages": [
                    {"stage": "SHS", "title": "General Science", "duration": "3 years", "description": "Focus on Biology, Chemistry, Physics"},
                    {"stage": "WASSCE", "title": "Examination", "duration": "1 year", "description": "Target aggregate ≤ 12"},
                    {"stage": "University", "title": "MBChB Medicine", "duration": "6 years", "description": "University of Ghana, KNUST, or UHAS"},
                    {"stage": "Housemanship", "title": "Internship", "duration": "2 years", "description": "Rotational training in hospitals"},
                    {"stage": "Licensing", "title": "Medical & Dental Council", "duration": "1 year", "description": "Pass licensing examination"},
                    {"stage": "Career", "title": "Medical Doctor", "duration": "Ongoing", "description": "Specialize or work as GP"}
                ]
            },
            "Software Engineer": {
                "stages": [
                    {"stage": "SHS", "title": "General Science", "duration": "3 years", "description": "Focus on Elective Mathematics, ICT"},
                    {"stage": "WASSCE", "title": "Examination", "duration": "1 year", "description": "Target aggregate ≤ 18"},
                    {"stage": "University", "title": "BSc Computer Science", "duration": "4 years", "description": "UG, KNUST, or Ashesi"},
                    {"stage": "Career", "title": "Software Engineer", "duration": "Ongoing", "description": "Build software, apps, and systems"}
                ]
            },
            "Lawyer": {
                "stages": [
                    {"stage": "SHS", "title": "General Arts", "duration": "3 years", "description": "Focus on Government, Literature"},
                    {"stage": "WASSCE", "title": "Examination", "duration": "1 year", "description": "Target aggregate ≤ 12"},
                    {"stage": "University", "title": "LLB Law", "duration": "4 years", "description": "University of Ghana or KNUST"},
                    {"stage": "Law School", "title": "Professional Law Course", "duration": "2 years", "description": "Ghana School of Law"},
                    {"stage": "Career", "title": "Lawyer", "duration": "Ongoing", "description": "Practice in corporate, criminal, or human rights law"}
                ]
            }
        }
    
    def get_roadmap(self, career: str) -> Dict:
        """Get career roadmap for a specific career"""
        return self.career_pathways.get(career, {
            "stages": [
                {"stage": "SHS", "title": "Complete SHS", "duration": "3 years", "description": "Choose relevant subjects"},
                {"stage": "WASSCE", "title": "Complete WASSCE", "duration": "1 year", "description": "Achieve competitive grades"},
                {"stage": "University", "title": "University Education", "duration": "4 years", "description": "Study at a Ghanaian university"},
                {"stage": "Career", "title": "Career Start", "duration": "Ongoing", "description": "Begin your professional journey"}
            ]
        })

roadmap_generator = RoadmapGenerator()
