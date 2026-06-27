"""
Real Ghanaian Data Loader
Loads all data from official sources
"""

import json
import os
import csv
from typing import Dict, List, Any

class RealGhanaDataLoader:
    def __init__(self):
        self.universities = {}
        self.admission_cutoffs = {}
        self.job_market = {}
        self.wassce_data = {}
        self.program_requirements = {}
        self.load_all_data()
    
    def load_all_data(self):
        """Load all real data sources"""
        print("📚 Loading Real Ghanaian Data...")
        
        # Load university data
        uni_dir = "data/universities"
        if os.path.exists(uni_dir):
            for file in os.listdir(uni_dir):
                if file.endswith('.json'):
                    with open(os.path.join(uni_dir, file), 'r') as f:
                        uni_data = json.load(f)
                        self.universities[uni_data.get('abbreviation', file.replace('.json', ''))] = uni_data
                        print(f"  ✅ Loaded: {uni_data.get('name', file)}")
        
        # Load admission cutoffs
        cutoff_file = "data/admission_cutoffs.csv"
        if os.path.exists(cutoff_file):
            with open(cutoff_file, 'r') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    key = f"{row['career']}_{row['university']}"
                    self.admission_cutoffs[key] = row
            print(f"  ✅ Loaded: {len(self.admission_cutoffs)} admission cutoffs")
        
        # Load job market data
        job_file = "data/employment/job_market.json"
        if os.path.exists(job_file):
            with open(job_file, 'r') as f:
                self.job_market = json.load(f)
            print(f"  ✅ Loaded: Job market data")
        
        # Load WASSCE data
        wassce_file = "data/wassce/grading_system.json"
        if os.path.exists(wassce_file):
            with open(wassce_file, 'r') as f:
                self.wassce_data = json.load(f)
            print(f"  ✅ Loaded: WASSCE grading system")
        
        # Load program requirements
        prog_file = "data/programs/complete_requirements.json"
        if os.path.exists(prog_file):
            with open(prog_file, 'r') as f:
                self.program_requirements = json.load(f)
            print(f"  ✅ Loaded: Program requirements for {len(self.program_requirements)} careers")
        
        print(f"\n✅ Total loaded: {len(self.universities)} universities")
    
    def get_university_by_name(self, name: str) -> Dict:
        """Get university data by name"""
        for uni in self.universities.values():
            if name in uni.get('name', '') or name == uni.get('abbreviation', ''):
                return uni
        return None
    
    def get_cutoff(self, career: str, university: str) -> Dict:
        """Get admission cutoff for specific career and university"""
        key = f"{career}_{university}"
        return self.admission_cutoffs.get(key, {})
    
    def get_career_demand(self, career: str) -> Dict:
        """Get job market data for career"""
        career_key = career.replace("_", " ")
        return self.job_market.get('career_demand_data', {}).get(career_key, {})
    
    def calculate_aggregate_score(self, grades: Dict) -> int:
        """Calculate WASSCE aggregate using official method"""
        grade_points = {
            'A1': 1, 'B2': 2, 'B3': 3, 'C4': 4,
            'C5': 5, 'C6': 6, 'D7': 7, 'E8': 8, 'F9': 9
        }
        
        core_grades = []
        elective_grades = []
        
        for subject, grade in grades.items():
            points = grade_points.get(grade, 9)
            if subject in ['English', 'Core Mathematics', 'Integrated Science', 'Social Studies']:
                core_grades.append(points)
            else:
                elective_grades.append(points)
        
        elective_grades.sort()
        best_electives = elective_grades[:2]
        
        total = sum(core_grades) + sum(best_electives)
        return total
    
    def get_data_sources(self) -> List[Dict]:
        """Return all data sources used"""
        sources_file = "data/sources.json"
        if os.path.exists(sources_file):
            with open(sources_file, 'r') as f:
                return json.load(f).get('data_sources', [])
        return [
            {"name": "University of Ghana", "url": "https://admission.ug.edu.gh", "type": "University Admissions"},
            {"name": "KNUST", "url": "https://www.knust.edu.gh", "type": "University Admissions"},
            {"name": "UHAS", "url": "https://www.uhas.edu.gh", "type": "University Admissions"},
            {"name": "WAEC Ghana", "url": "https://waecgh.org", "type": "Examination Body"}
        ]
    
    def get_program_requirements(self, career: str) -> Dict:
        """Get comprehensive program requirements"""
        return self.program_requirements.get(career, {})

# Create singleton instance
real_data = RealGhanaDataLoader()
