"""
Financial Intelligence Engine
Provides budget-aware recommendations
"""

from typing import Dict, List

class FinancialIntelligence:
    def __init__(self):
        self.university_costs = {
            "University of Ghana": {"tuition": 5000, "accommodation": 2000, "living": 1500},
            "KNUST": {"tuition": 4500, "accommodation": 1800, "living": 1200},
            "UHAS": {"tuition": 4000, "accommodation": 1600, "living": 1200},
            "UCC": {"tuition": 3800, "accommodation": 1500, "living": 1100},
            "Ashesi": {"tuition": 25000, "accommodation": 5000, "living": 3000},
            "UPSA": {"tuition": 4500, "accommodation": 2000, "living": 1500},
            "GIMPA": {"tuition": 6000, "accommodation": 2500, "living": 1800}
        }
    
    def get_cost_advice(self, profile: Dict, universities: List[str]) -> Dict:
        """Get financial advice for university choices"""
        financial = profile.get("financial", {})
        budget = financial.get("budget")
        needs_scholarship = financial.get("needs_scholarship", False)
        
        advice = []
        
        for uni in universities:
            if uni in self.university_costs:
                cost = self.university_costs[uni]
                total = cost["tuition"] + cost["accommodation"] + cost["living"]
                
                status = "Affordable"
                if budget and total > budget:
                    status = "Expensive"
                    if needs_scholarship:
                        status = "Scholarship needed"
                
                advice.append({
                    "university": uni,
                    "total_cost": total,
                    "tuition": cost["tuition"],
                    "accommodation": cost["accommodation"],
                    "living": cost["living"],
                    "status": status,
                    "needs_scholarship": needs_scholarship,
                    "recommendation": "Apply for scholarships" if needs_scholarship else "Consider budget planning"
                })
        
        # Sort by total cost
        advice.sort(key=lambda x: x["total_cost"])
        
        return {
            "recommendations": advice[:3],
            "cheapest": advice[0]["university"] if advice else None,
            "most_expensive": advice[-1]["university"] if advice else None
        }
    
    def get_scholarship_advice(self, profile: Dict) -> List[Dict]:
        """Get scholarship recommendations based on profile"""
        financial = profile.get("financial", {})
        needs_scholarship = financial.get("needs_scholarship", False)
        
        if not needs_scholarship:
            return [{"name": "GETFund", "description": "Government scholarship", "priority": "Low"}]
        
        return [
            {"name": "GETFund", "description": "Government of Ghana scholarship", "priority": "High"},
            {"name": "Mastercard Foundation", "description": "Full tuition + living expenses", "priority": "High"},
            {"name": "University-specific", "description": "Check with your target university", "priority": "Medium"}
        ]
    
    def get_affordable_options(self, profile: Dict, career: str) -> List[Dict]:
        """Get affordable career/education options"""
        financial = profile.get("financial", {})
        budget = financial.get("budget")
        
        options = []
        
        if career == "Medical Doctor":
            options = [
                {"program": "MBChB at UG", "cost": 5000, "duration": 6, "scholarship": True},
                {"program": "MBChB at KNUST", "cost": 4500, "duration": 6, "scholarship": True},
                {"program": "MBChB at UHAS", "cost": 4000, "duration": 6, "scholarship": True}
            ]
        elif career == "Software Engineer":
            options = [
                {"program": "BSc CS at UG", "cost": 5000, "duration": 4, "scholarship": True},
                {"program": "BSc CS at KNUST", "cost": 4500, "duration": 4, "scholarship": True},
                {"program": "BSc CS at Ashesi", "cost": 25000, "duration": 4, "scholarship": True}
            ]
        
        # Filter by budget
        if budget:
            options = [o for o in options if o["cost"] <= budget or o["scholarship"]]
        
        # Add affordability note
        for opt in options:
            if budget and opt["cost"] > budget:
                opt["note"] = "Scholarship recommended"
            else:
                opt["note"] = "Affordable"
        
        return options

financial_intelligence = FinancialIntelligence()
