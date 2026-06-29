"""
Personalized Action Plan Generator
Creates detailed study and admission plans for students
"""

from typing import Dict, List, Any
import json
from pathlib import Path

class ActionPlanGenerator:
    def __init__(self):
        self.load_recommendations()
    
    def load_recommendations(self):
        """Load improvement recommendations"""
        self.improvement_tips = {
            "Biology": [
                "Focus on understanding cell biology and genetics",
                "Practice past WAEC questions regularly",
                "Join a study group for practical sessions",
                "Watch online tutorials for difficult concepts"
            ],
            "Chemistry": [
                "Master stoichiometry and chemical equations",
                "Learn periodic table trends",
                "Practice organic chemistry mechanisms",
                "Use flashcards for chemical formulas"
            ],
            "Physics": [
                "Understand fundamental laws and principles",
                "Practice problem-solving daily",
                "Learn to draw and interpret diagrams",
                "Study worked examples carefully"
            ],
            "Mathematics": [
                "Practice past questions daily",
                "Learn key formulas and derivations",
                "Focus on algebra and trigonometry",
                "Use online resources for additional practice"
            ],
            "English": [
                "Read widely to improve vocabulary",
                "Practice essay writing regularly",
                "Study grammar rules thoroughly",
                "Improve comprehension skills"
            ]
        }
        
        self.university_notes = {
            "University of Ghana": "Public research university, known for Medicine and Law",
            "KNUST": "Top engineering and architecture school in Ghana",
            "UHAS": "Specialized health sciences university",
            "UCC": "Strong education and nursing programs",
            "Ashesi": "Private university with strong computer science program",
            "UPSA": "Best for accounting and professional studies"
        }
    
    def generate_plan(self, career: str, aggregate: int, subjects: List[str], interests: List[str]) -> Dict:
        """Generate a comprehensive action plan"""
        
        # Calculate current eligibility
        cutoff = self._get_cutoff(career)
        eligibility = self._calculate_eligibility(aggregate, cutoff)
        
        # Identify gaps
        gaps = self._identify_gaps(career, subjects)
        
        # Get recommendations
        recommendations = self._get_recommendations(career, aggregate, subjects, gaps)
        
        # Get backup careers
        backups = self._get_backup_careers(career, subjects, interests)
        
        # Get timeline
        timeline = self._get_timeline(aggregate, cutoff)
        
        return {
            "career": career,
            "current_aggregate": aggregate,
            "target_cutoff": cutoff,
            "eligibility_percentage": eligibility,
            "eligibility_status": self._get_status(eligibility),
            "gaps": gaps,
            "recommendations": recommendations,
            "backup_careers": backups,
            "timeline": timeline,
            "university_recommendations": self._get_university_recommendations(career, aggregate),
            "actionable_steps": self._get_actionable_steps(aggregate, cutoff, gaps)
        }
    
    def _get_cutoff(self, career: str) -> int:
        """Get typical cutoff for career"""
        cutoffs = {
            "Medical Doctor": 12,
            "Pharmacist": 15,
            "Nurse": 18,
            "Software Engineer": 18,
            "Civil Engineer": 16,
            "Lawyer": 12,
            "Accountant": 16,
            "Architect": 14,
            "Teacher": 24,
            "Agricultural Scientist": 20
        }
        return cutoffs.get(career, 20)
    
    def _calculate_eligibility(self, aggregate: int, cutoff: int) -> int:
        """Calculate eligibility percentage"""
        if aggregate <= cutoff:
            return min(95, 80 + (cutoff - aggregate) * 5)
        else:
            return max(20, 60 - (aggregate - cutoff) * 8)
    
    def _get_status(self, percentage: int) -> str:
        """Get eligibility status"""
        if percentage >= 80:
            return "Very Likely"
        elif percentage >= 60:
            return "Likely"
        elif percentage >= 40:
            return "Possible"
        elif percentage >= 25:
            return "Competitive"
        else:
            return "Challenging"
    
    def _identify_gaps(self, career: str, subjects: List[str]) -> List[Dict]:
        """Identify subject gaps"""
        required = {
            "Medical Doctor": ["Biology", "Chemistry", "Physics"],
            "Pharmacist": ["Biology", "Chemistry"],
            "Nurse": ["Biology", "Chemistry"],
            "Software Engineer": ["Elective Mathematics"],
            "Civil Engineer": ["Physics", "Chemistry", "Elective Mathematics"],
            "Lawyer": ["Government", "Literature in English"],
            "Accountant": ["Accounting", "Business Management"],
            "Architect": ["General Knowledge in Art"]
        }
        
        required_subjects = required.get(career, [])
        gaps = []
        
        for subject in required_subjects:
            if subject not in subjects:
                gaps.append({
                    "subject": subject,
                    "importance": "Required",
                    "tip": self.improvement_tips.get(subject, ["Focus on this subject"])[0]
                })
            else:
                gaps.append({
                    "subject": subject,
                    "importance": "Completed",
                    "tip": "Maintain your current performance"
                })
        
        return gaps
    
    def _get_recommendations(self, career: str, aggregate: int, subjects: List[str], gaps: List[Dict]) -> List[str]:
        """Get improvement recommendations"""
        recommendations = []
        
        cutoff = self._get_cutoff(career)
        
        if aggregate > cutoff:
            recommendations.append(f"Improve your aggregate from {aggregate} to {cutoff} by focusing on your weakest subjects")
        
        missing_subjects = [g['subject'] for g in gaps if g['importance'] == 'Required']
        if missing_subjects:
            recommendations.append(f"Add these required subjects: {', '.join(missing_subjects)}")
        
        recommendations.append("Practice past WAEC questions regularly")
        recommendations.append("Join study groups for collaborative learning")
        
        if career in ["Medical Doctor", "Pharmacist", "Nurse"]:
            recommendations.append("Volunteer at health facilities for exposure")
        elif career in ["Software Engineer", "Computer Science"]:
            recommendations.append("Start learning programming online (Python, JavaScript)")
        
        return recommendations
    
    def _get_backup_careers(self, career: str, subjects: List[str], interests: List[str]) -> List[Dict]:
        """Get backup career options"""
        backups = {
            "Medical Doctor": [
                {"career": "Nurse", "reason": "Similar healthcare focus, lower cutoff (18)"},
                {"career": "Pharmacist", "reason": "Healthcare field, cutoff 15"},
                {"career": "Medical Laboratory", "reason": "Healthcare support, cutoff 14"}
            ],
            "Software Engineer": [
                {"career": "Information Technology", "reason": "Similar tech focus, lower cutoff"},
                {"career": "Data Analyst", "reason": "Growing field, good opportunities"}
            ]
        }
        
        return backups.get(career, [
            {"career": "Education", "reason": "Teaching is always in demand"},
            {"career": "Business Administration", "reason": "Versatile career option"}
        ])
    
    def _get_timeline(self, aggregate: int, cutoff: int) -> List[Dict]:
        """Get action timeline"""
        if aggregate <= cutoff:
            return [
                {"phase": "Current", "action": "You're already competitive", "timeline": "Now"},
                {"phase": "Application", "action": "Apply to your target universities", "timeline": "Next admission cycle"},
                {"phase": "Preparation", "action": "Prepare for interviews and exams", "timeline": "3-6 months"}
            ]
        else:
            gap = aggregate - cutoff
            return [
                {"phase": "Immediate", "action": f"Focus on improving {gap} points in your aggregate", "timeline": "3-6 months"},
                {"phase": "Mid-term", "action": "Retake WASSCE subjects if needed", "timeline": "1 year"},
                {"phase": "Long-term", "action": "Apply to universities after improvement", "timeline": "Next cycle"}
            ]
    
    def _get_university_recommendations(self, career: str, aggregate: int) -> List[Dict]:
        """Get university recommendations"""
        uni_data = {
            "Medical Doctor": {
                "University of Ghana": 8,
                "KNUST": 9,
                "UHAS": 10
            },
            "Nurse": {
                "UHAS": 12,
                "University of Ghana": 14,
                "UCC": 13
            },
            "Software Engineer": {
                "Ashesi": 12,
                "KNUST": 14,
                "University of Ghana": 15
            }
        }
        
        unis = uni_data.get(career, {"University of Ghana": 12, "KNUST": 14})
        
        recommendations = []
        for uni, cutoff in unis.items():
            if aggregate <= cutoff:
                status = "Likely"
            elif aggregate <= cutoff + 3:
                status = "Possible"
            else:
                status = "Competitive"
            
            recommendations.append({
                "university": uni,
                "cutoff": cutoff,
                "status": status,
                "note": self.university_notes.get(uni, "")
            })
        
        return recommendations
    
    def _get_actionable_steps(self, aggregate: int, cutoff: int, gaps: List[Dict]) -> List[str]:
        """Get actionable next steps"""
        steps = []
        
        if aggregate > cutoff:
            steps.append(f"📚 Focus on improving your weakest subjects to reach cutoff of {cutoff}")
        
        missing = [g['subject'] for g in gaps if g['importance'] == 'Required']
        if missing:
            steps.append(f"📝 Add these subjects: {', '.join(missing)}")
        
        steps.append("📖 Practice WAEC past questions daily")
        steps.append("🤝 Join study groups for collaborative learning")
        steps.append("🎯 Set weekly study targets")
        
        return steps[:5]

planner = ActionPlanGenerator()
