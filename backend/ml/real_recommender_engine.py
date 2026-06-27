"""
Real Data Career Recommender Engine
Uses actual Ghanaian university and employment data
"""

from typing import List, Dict
from ml.real_data_loader import real_data

class RealCareerRecommender:
    def __init__(self):
        self.careers = self._build_career_profiles()
    
    def _build_career_profiles(self) -> List[Dict]:
        """Build career profiles from real data"""
        careers = [
            "Medical Doctor", "Software Engineer", "Lawyer", "Pharmacist",
            "Nurse", "Civil Engineer", "Architect", "Accountant",
            "Business Administrator", "Public Health Officer", "Computer Scientist"
        ]
        
        profiles = []
        for career in careers:
            profile = {
                'career': career,
                'universities': [],
                'cutoffs': [],
                'demand_data': real_data.get_career_demand(career)
            }
            
            # Get university data for this career
            for uni_name, uni_data in real_data.universities.items():
                if career in uni_data.get('programs', {}):
                    prog = uni_data['programs'][career]
                    profile['universities'].append({
                        'name': uni_data['name'],
                        'cutoff': prog.get('cutoff_aggregate', 24),
                        'duration': prog.get('duration_years', 4),
                        'required_subjects': prog.get('required_subjects', [])
                    })
                    profile['cutoffs'].append(prog.get('cutoff_aggregate', 24))
            
            profiles.append(profile)
        
        return profiles
    
    def recommend(self, aggregate: int, interests: List[str], subjects: List[str]) -> List[Dict]:
        """Generate recommendations based on real data"""
        
        scored = []
        
        for career_profile in self.careers:
            career = career_profile['career']
            score = 50  # Base score
            reasons = []
            
            # Check aggregate against university cutoffs
            cutoffs = career_profile['cutoffs']
            if cutoffs:
                avg_cutoff = sum(cutoffs) / len(cutoffs)
                if aggregate <= avg_cutoff:
                    score += 25
                    reasons.append(f"✅ Your aggregate {aggregate} meets typical cutoff of ≤{int(avg_cutoff)}")
                elif aggregate <= avg_cutoff + 3:
                    score += 12
                    reasons.append(f"⚠️ Your aggregate {aggregate} is close to {int(avg_cutoff)}")
                else:
                    reasons.append(f"❌ Typical cutoff is ≤{int(avg_cutoff)}")
            
            # Check subject requirements
            required_subjects = []
            for uni in career_profile['universities']:
                required_subjects.extend(uni.get('required_subjects', []))
            required_subjects = list(set(required_subjects))
            
            if required_subjects:
                matched = [s for s in subjects if s in required_subjects]
                subject_score = (len(matched) / len(required_subjects)) * 25
                score += subject_score
                if matched:
                    reasons.append(f"✓ Has {len(matched)}/{len(required_subjects)} required subjects")
                else:
                    reasons.append(f"✗ Missing required subjects: {', '.join(required_subjects[:3])}")
            
            # Check job market demand
            demand_data = career_profile['demand_data']
            if demand_data:
                demand_level = demand_data.get('demand_level', '')
                if demand_level in ['Very High', 'High']:
                    score += 15
                    reasons.append(f"📈 High demand in Ghana's job market")
            
            # Sort reasons by importance
            reasons.sort(key=lambda x: '✅' in x or '✓' in x or '📈' in x, reverse=True)
            
            # Get best university recommendation
            best_university = None
            if career_profile['universities']:
                uni_scores = []
                for uni in career_profile['universities']:
                    if aggregate <= uni['cutoff']:
                        uni_scores.append((uni, aggregate - uni['cutoff']))
                if uni_scores:
                    uni_scores.sort(key=lambda x: x[1])
                    best_university = uni_scores[0][0]
                else:
                    best_university = career_profile['universities'][0]
            
            scored.append({
                'career': career,
                'confidence': min(100, int(score)),
                'reasons': reasons[:4],
                'best_university': best_university,
                'required_subjects': required_subjects,
                'demand': demand_data.get('demand_level', 'Good'),
                'salary_range': f"GH₵ {demand_data.get('starting_salary', 2000)} - {demand_data.get('experienced_salary', 8000)}" if demand_data else "Competitive"
            })
        
        # Sort by confidence
        scored.sort(key=lambda x: x['confidence'], reverse=True)
        return scored[:6]

real_recommender = RealCareerRecommender()
