"""
Explore Module Service
Handles career exploration, university data, and scholarships
"""

import json
import os
from typing import List, Dict, Any, Optional

class ExploreService:
    """Service for career and university exploration"""
    
    def __init__(self):
        self.data_dir = "backend/data/explore"
        self.careers_file = f"{self.data_dir}/careers.json"
        self.universities_file = f"{self.data_dir}/universities.json"
        self.scholarships_file = f"{self.data_dir}/scholarships.json"
        self._ensure_data_dir()
        self.careers = self._load_json(self.careers_file)
        self.universities = self._load_json(self.universities_file)
        self.scholarships = self._load_json(self.scholarships_file)
    
    def _ensure_data_dir(self):
        """Ensure the data directory exists"""
        os.makedirs(self.data_dir, exist_ok=True)
    
    def _load_json(self, file_path: str) -> Dict[str, Any]:
        """Load JSON data from file"""
        try:
            with open(file_path, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            default = {"careers": [], "universities": [], "scholarships": []}
            self._save_json(file_path, default)
            return default
        except json.JSONDecodeError:
            return {"careers": [], "universities": [], "scholarships": []}
    
    def _save_json(self, file_path: str, data: Dict[str, Any]) -> None:
        """Save JSON data to file"""
        try:
            with open(file_path, 'w') as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            print(f"⚠️ Error saving to {file_path}: {e}")
    
    def get_careers(self) -> List[Dict[str, Any]]:
        """Get all careers"""
        return self.careers.get("careers", [])
    
    def get_career_by_id(self, career_id: str) -> Optional[Dict[str, Any]]:
        """Get a career by ID"""
        for career in self.get_careers():
            if career.get("id") == career_id:
                return career
        return None
    
    def search_careers(self, query: str) -> List[Dict[str, Any]]:
        """Search careers by title or category"""
        query_lower = query.lower()
        results = []
        for career in self.get_careers():
            if (query_lower in career.get("title", "").lower() or
                query_lower in career.get("category", "").lower()):
                results.append(career)
        return results
    
    def get_recommended_careers(self, subjects: List[str], aggregate: int) -> List[Dict[str, Any]]:
        """Get career recommendations based on subjects and aggregate"""
        recommended = []
        for career in self.get_careers():
            required = career.get("required_subjects", [])
            min_aggr = career.get("min_aggregate", 20)
            matches = sum(1 for s in required if s in subjects)
            subject_match = matches >= 2
            aggregate_match = aggregate <= min_aggr
            if subject_match and aggregate_match:
                recommended.append({**career, "match_score": matches})
        recommended.sort(key=lambda x: x.get("match_score", 0), reverse=True)
        return recommended
