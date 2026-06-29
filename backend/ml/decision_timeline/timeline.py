"""
AI Decision Timeline Generator
Creates dynamic timelines from current state to career
"""

from typing import Dict, List

class DecisionTimelineGenerator:
    def __init__(self):
        self.timeline_templates = {
            "Medical Doctor": [
                {"phase": "SHS Programme Selection", "action": "Choose General Science", "timeline": "Now"},
                {"phase": "WASSCE Preparation", "action": "Focus on Biology, Chemistry, Physics", "timeline": "1-2 years"},
                {"phase": "University Application", "action": "Apply to UG, KNUST, UHAS", "timeline": "After WASSCE"},
                {"phase": "Medical School", "action": "Complete 6-year MBChB", "timeline": "6 years"},
                {"phase": "Housemanship", "action": "Complete 2-year internship", "timeline": "2 years"},
                {"phase": "Licensing", "action": "Pass Medical Council exams", "timeline": "1 year"},
                {"phase": "Career", "action": "Specialize or work as GP", "timeline": "Ongoing"}
            ],
            "Software Engineer": [
                {"phase": "SHS Programme Selection", "action": "Choose General Science with Elective Maths", "timeline": "Now"},
                {"phase": "WASSCE Preparation", "action": "Focus on Mathematics and ICT", "timeline": "1-2 years"},
                {"phase": "University Application", "action": "Apply to UG, KNUST, Ashesi", "timeline": "After WASSCE"},
                {"phase": "Computer Science", "action": "Complete 4-year BSc", "timeline": "4 years"},
                {"phase": "Career", "action": "Start as Software Engineer", "timeline": "Ongoing"}
            ],
            "Lawyer": [
                {"phase": "SHS Programme Selection", "action": "Choose General Arts", "timeline": "Now"},
                {"phase": "WASSCE Preparation", "action": "Focus on Government, Literature", "timeline": "1-2 years"},
                {"phase": "University Application", "action": "Apply to UG Law or KNUST Law", "timeline": "After WASSCE"},
                {"phase": "LLB Law", "action": "Complete 4-year degree", "timeline": "4 years"},
                {"phase": "Law School", "action": "Complete 2-year Professional Law Course", "timeline": "2 years"},
                {"phase": "Career", "action": "Practice as Lawyer", "timeline": "Ongoing"}
            ]
        }
    
    def generate_timeline(self, career: str, current_aggregate: int = None) -> Dict:
        """Generate a personalized timeline"""
        timeline = self.timeline_templates.get(career, [
            {"phase": "Education", "action": "Complete your education", "timeline": "Now"},
            {"phase": "Career", "action": "Start your career journey", "timeline": "Ongoing"}
        ])
        
        # Add personalized notes based on aggregate
        if current_aggregate:
            for step in timeline:
                if "WASSCE" in step["phase"] and "Preparation" in step["phase"]:
                    if current_aggregate <= 12:
                        step["note"] = "✅ Your current aggregate is competitive!"
                    elif current_aggregate <= 18:
                        step["note"] = "📈 Good! You're on track."
                    else:
                        step["note"] = "💪 Focus on improving your aggregate."
        
        return {
            "career": career,
            "timeline": timeline,
            "total_duration": self._calculate_total_duration(timeline)
        }
    
    def _calculate_total_duration(self, timeline: List) -> str:
        """Calculate total duration from timeline"""
        total = 0
        for step in timeline:
            duration = step.get("timeline", "")
            if "years" in duration:
                try:
                    num = int(duration.split()[0])
                    total += num
                except:
                    pass
        return f"{total}+ years"
    
    def get_next_steps(self, timeline: Dict) -> List[str]:
        """Get immediate next steps from timeline"""
        steps = []
        for step in timeline.get("timeline", []):
            if step.get("timeline") == "Now":
                steps.append(step["action"])
        return steps

timeline_generator = DecisionTimelineGenerator()
