"""
Recommendation Graph Builder
Creates visual career pathway graphs
"""

from typing import Dict, List, Any

class RecommendationGraphBuilder:
    def __init__(self):
        self.career_paths = {
            "Medical Doctor": {
                "nodes": [
                    {"id": "shs", "label": "General Science", "stage": "SHS", "duration": "3 years"},
                    {"id": "wasce", "label": "WASSCE", "stage": "Examination", "duration": "1 year"},
                    {"id": "university", "label": "MBChB Medicine", "stage": "University", "duration": "6 years"},
                    {"id": "housemanship", "label": "Housemanship", "stage": "Internship", "duration": "2 years"},
                    {"id": "licensing", "label": "Medical Council", "stage": "Licensing", "duration": "1 year"},
                    {"id": "career", "label": "Medical Doctor", "stage": "Career", "duration": "Ongoing"}
                ],
                "edges": [
                    {"from": "shs", "to": "wasce"},
                    {"from": "wasce", "to": "university"},
                    {"from": "university", "to": "housemanship"},
                    {"from": "housemanship", "to": "licensing"},
                    {"from": "licensing", "to": "career"}
                ],
                "requirements": {
                    "aggregate": 12,
                    "subjects": ["Biology", "Chemistry", "Physics"],
                    "universities": ["UG", "KNUST", "UHAS"]
                },
                "outcomes": {
                    "salary": "GH₵ 5,000 - 15,000",
                    "demand": "Very High",
                    "growth": "8% annually"
                }
            },
            "Software Engineer": {
                "nodes": [
                    {"id": "shs", "label": "General Science", "stage": "SHS", "duration": "3 years"},
                    {"id": "wasce", "label": "WASSCE", "stage": "Examination", "duration": "1 year"},
                    {"id": "university", "label": "BSc Computer Science", "stage": "University", "duration": "4 years"},
                    {"id": "career", "label": "Software Engineer", "stage": "Career", "duration": "Ongoing"}
                ],
                "edges": [
                    {"from": "shs", "to": "wasce"},
                    {"from": "wasce", "to": "university"},
                    {"from": "university", "to": "career"}
                ],
                "requirements": {
                    "aggregate": 18,
                    "subjects": ["Elective Mathematics"],
                    "universities": ["UG", "KNUST", "Ashesi"]
                },
                "outcomes": {
                    "salary": "GH₵ 3,000 - 12,000",
                    "demand": "Very High",
                    "growth": "18% annually"
                }
            },
            "Lawyer": {
                "nodes": [
                    {"id": "shs", "label": "General Arts", "stage": "SHS", "duration": "3 years"},
                    {"id": "wasce", "label": "WASSCE", "stage": "Examination", "duration": "1 year"},
                    {"id": "university", "label": "LLB Law", "stage": "University", "duration": "4 years"},
                    {"id": "law_school", "label": "Ghana School of Law", "stage": "Professional", "duration": "2 years"},
                    {"id": "career", "label": "Lawyer", "stage": "Career", "duration": "Ongoing"}
                ],
                "edges": [
                    {"from": "shs", "to": "wasce"},
                    {"from": "wasce", "to": "university"},
                    {"from": "university", "to": "law_school"},
                    {"from": "law_school", "to": "career"}
                ],
                "requirements": {
                    "aggregate": 12,
                    "subjects": ["Government", "Literature"],
                    "universities": ["UG", "KNUST"]
                },
                "outcomes": {
                    "salary": "GH₵ 5,000 - 20,000",
                    "demand": "High",
                    "growth": "6% annually"
                }
            }
        }
    
    def get_graph(self, career: str) -> Dict:
        """Get recommendation graph for a career"""
        if career not in self.career_paths:
            # Return default graph
            return {
                "nodes": [
                    {"id": "shs", "label": "SHS Education", "stage": "Education", "duration": "3 years"},
                    {"id": "wasce", "label": "WASSCE", "stage": "Examination", "duration": "1 year"},
                    {"id": "university", "label": "University", "stage": "Higher Education", "duration": "4 years"},
                    {"id": "career", "label": "Career", "stage": "Professional", "duration": "Ongoing"}
                ],
                "edges": [
                    {"from": "shs", "to": "wasce"},
                    {"from": "wasce", "to": "university"},
                    {"from": "university", "to": "career"}
                ],
                "requirements": {},
                "outcomes": {}
            }
        
        return self.career_paths[career]

graph_builder = RecommendationGraphBuilder()
