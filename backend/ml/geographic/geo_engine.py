"""
Geographic Intelligence Engine
Provides location-specific recommendations
"""

from typing import Dict, List, Any

class GeographicIntelligence:
    def __init__(self):
        self.regional_data = {
            "Greater Accra": {
                "universities": ["University of Ghana", "Ashesi University", "GIMPA", "UPSA"],
                "tvets": ["Accra Technical University"],
                "shs": ["Presec Legon", "Achimota School", "St. Thomas Aquinas"],
                "industries": ["Finance", "Technology", "Government", "Hospitality"],
                "scholarships": ["GETFund", "Mastercard Foundation", "Ashesi Scholarships"],
                "cost_of_living": "High"
            },
            "Ashanti": {
                "universities": ["KNUST"],
                "tvets": ["Kumasi Technical University"],
                "shs": ["Opoku Ware", "Prempeh College", "Yaa Asantewaa"],
                "industries": ["Manufacturing", "Mining", "Agriculture", "Tourism"],
                "scholarships": ["GETFund", "KNUST Scholarships"],
                "cost_of_living": "Medium"
            },
            "Northern": {
                "universities": ["UDS"],
                "tvets": ["Tamale Technical University"],
                "shs": ["Tamale SHS", "Ghana SHS"],
                "industries": ["Agriculture", "Trade", "Education"],
                "scholarships": ["GETFund", "Northern Development Scholarships"],
                "cost_of_living": "Low"
            },
            "Volta": {
                "universities": ["UHAS"],
                "tvets": ["Ho Technical University"],
                "shs": ["Kpando SHS", "Ho SHS"],
                "industries": ["Healthcare", "Education", "Agriculture"],
                "scholarships": ["GETFund", "UHAS Scholarships"],
                "cost_of_living": "Medium"
            },
            "Western": {
                "universities": ["University of Mines and Technology"],
                "tvets": ["Takoradi Technical University"],
                "shs": ["Wesley Girls", "Mfantsipim"],
                "industries": ["Mining", "Oil & Gas", "Fishing"],
                "scholarships": ["GETFund"],
                "cost_of_living": "Medium"
            },
            "Eastern": {
                "universities": ["Ashesi University"],
                "tvets": ["Koforidua Technical University"],
                "shs": ["Koforidua SHS"],
                "industries": ["Agriculture", "Education", "Tourism"],
                "scholarships": ["GETFund"],
                "cost_of_living": "Medium"
            },
            "Central": {
                "universities": ["UCC"],
                "tvets": ["Cape Coast Technical University"],
                "shs": ["Mfantsipim School", "St. Augustine's"],
                "industries": ["Education", "Fishing", "Tourism"],
                "scholarships": ["GETFund", "UCC Scholarships"],
                "cost_of_living": "Medium"
            }
        }
    
    def get_region_data(self, region: str) -> Dict:
        """Get data for a specific region"""
        return self.regional_data.get(region, {
            "universities": ["University of Ghana", "KNUST"],
            "tvets": ["Technical University"],
            "shs": ["SHS"],
            "industries": ["Education", "Services"],
            "scholarships": ["GETFund"],
            "cost_of_living": "Medium"
        })
    
    def get_recommendations(self, profile: Dict) -> Dict:
        """Get location-based recommendations"""
        region = profile.get("geographic", {}).get("region")
        if not region:
            return {}
        
        data = self.get_region_data(region)
        
        return {
            "region": region,
            "nearby_universities": data.get("universities", [])[:3],
            "nearby_tvets": data.get("tvets", [])[:2],
            "local_industries": data.get("industries", [])[:3],
            "local_scholarships": data.get("scholarships", [])[:3],
            "cost_of_living": data.get("cost_of_living", "Medium"),
            "nearest_shs": data.get("shs", [])[:2]
        }
    
    def get_distance_advice(self, home_region: str, target_university: str) -> Dict:
        """Get relocation advice"""
        advice = {
            "can_relocate": True,
            "distance": "Unknown",
            "recommendation": "Consider relocation if you can afford it"
        }
        
        # Check if university is in same region
        for region, data in self.regional_data.items():
            if target_university in data.get("universities", []):
                if region == home_region:
                    advice["distance"] = "Local"
                    advice["recommendation"] = "You can stay at home or nearby"
                else:
                    advice["distance"] = "Different region"
                    advice["recommendation"] = "Consider accommodation options"
                break
        
        return advice

geo_intelligence = GeographicIntelligence()
