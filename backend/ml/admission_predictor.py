"""
Admission Probability Predictor
Calculates chances of admission based on real Ghanaian university data
"""

import json
from pathlib import Path
from typing import Dict, List, Optional

class AdmissionPredictor:
    def __init__(self):
        self.university_data = self._load_university_data()
        self.career_weights = self._load_career_weights()
    
    def _load_university_data(self) -> Dict:
        """Load university admission data"""
        prog_file = Path("data/programs/expanded_programs.json")
        if prog_file.exists():
            with open(prog_file, 'r') as f:
                return json.load(f)
        return {}
    
    def _load_career_weights(self) -> Dict:
        """Load career competitiveness weights"""
        return {
            "Medical Doctor": 1.2,
            "Law": 1.15,
            "Engineering": 1.1,
            "Computer Science": 1.05,
            "Pharmacy": 1.0,
            "Nursing": 0.95,
            "Business Administration": 0.9,
            "Teacher": 0.8,
            "Accountant": 0.85,
            "Architect": 0.9
        }
    
    def predict_admission_chance(
        self,
        career: str,
        aggregate: int,
        subjects: List[str],
        preferred_university: Optional[str] = None
    ) -> Dict:
        """Calculate admission probability"""
        
        results = []
        career_weight = self.career_weights.get(career, 1.0)
        
        # Find universities offering this career
        universities = self._find_universities_for_career(career)
        
        for uni_name, programs in universities.items():
            for prog_name, details in programs.items():
                if prog_name.lower() == career.lower() or career.lower() in prog_name.lower():
                    cutoff = details.get('cutoff', 24)
                    
                    # Calculate base chance
                    if aggregate <= cutoff:
                        base_chance = 85 + (cutoff - aggregate) * 3
                    else:
                        base_chance = max(20, 60 - (aggregate - cutoff) * 8)
                    
                    # Subject match bonus
                    required_subjects = details.get('subjects', [])
                    subject_match = len([s for s in subjects if s in required_subjects])
                    subject_score = (subject_match / max(len(required_subjects), 1)) * 15
                    
                    # Career weight adjustment
                    weighted_chance = (base_chance * career_weight) + subject_score
                    
                    # Cap at 98%
                    final_chance = min(98, weighted_chance)
                    
                    results.append({
                        "university": uni_name,
                        "program": prog_name,
                        "cutoff": cutoff,
                        "your_aggregate": aggregate,
                        "admission_chance": round(final_chance, 1),
                        "status": self._get_status(final_chance),
                        "required_subjects": required_subjects,
                        "subject_match": f"{subject_match}/{len(required_subjects)}",
                        "competitive_score": "High" if cutoff <= 10 else "Medium" if cutoff <= 16 else "Standard"
                    })
        
        # Sort by chance
        results.sort(key=lambda x: x['admission_chance'], reverse=True)
        
        # Filter by preferred university if specified
        if preferred_university:
            results = [r for r in results if preferred_university.lower() in r['university'].lower()]
        
        # Get best recommendation
        best = results[0] if results else None
        
        return {
            "career": career,
            "aggregate": aggregate,
            "subjects": subjects,
            "predictions": results[:5],
            "best_match": best,
            "recommendation": best['university'] if best else "Check university websites for admission requirements"
        }
    
    def _find_universities_for_career(self, career: str) -> Dict:
        """Find universities offering a specific career"""
        result = {}
        for uni_name, programs in self.university_data.items():
            for prog_name in programs.keys():
                if career.lower() in prog_name.lower() or prog_name.lower() in career.lower():
                    if uni_name not in result:
                        result[uni_name] = {}
                    result[uni_name][prog_name] = programs[prog_name]
        return result
    
    def _get_status(self, chance: float) -> str:
        """Get status based on admission chance"""
        if chance >= 80:
            return "Very Likely"
        elif chance >= 60:
            return "Likely"
        elif chance >= 40:
            return "Possible"
        elif chance >= 25:
            return "Competitive"
        else:
            return "Challenging"

# Singleton instance
admission_predictor = AdmissionPredictor()
