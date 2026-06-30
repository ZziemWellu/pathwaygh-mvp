"""
National Education Knowledge Graph
Connects all education ecosystem entities
"""

from typing import Dict, List, Any

class NationalKnowledgeGraph:
    def __init__(self):
        self.nodes = {}
        self.edges = []
        self._build_graph()
    
    def _build_graph(self):
        """Build the complete education knowledge graph"""
        
        # WAEC node
        self.nodes["waec"] = {
            "id": "waec",
            "type": "exam_body",
            "name": "WAEC Ghana",
            "description": "West African Examinations Council"
        }
        
        # SHS Programmes
        self.nodes["shs_general_science"] = {
            "id": "shs_general_science",
            "type": "shs_programme",
            "name": "General Science",
            "subjects": ["Biology", "Chemistry", "Physics", "Elective Mathematics"]
        }
        self.nodes["shs_general_arts"] = {
            "id": "shs_general_arts",
            "type": "shs_programme",
            "name": "General Arts",
            "subjects": ["Government", "Literature", "History", "Economics"]
        }
        
        # Universities
        self.nodes["ug"] = {
            "id": "ug",
            "type": "university",
            "name": "University of Ghana",
            "location": "Greater Accra",
            "type_public": True
        }
        self.nodes["knust"] = {
            "id": "knust",
            "type": "university",
            "name": "KNUST",
            "location": "Ashanti",
            "type_public": True
        }
        self.nodes["uhas"] = {
            "id": "uhas",
            "type": "university",
            "name": "UHAS",
            "location": "Volta",
            "type_public": True
        }
        self.nodes["ucc"] = {
            "id": "ucc",
            "type": "university",
            "name": "University of Cape Coast",
            "location": "Central",
            "type_public": True
        }
        self.nodes["ashesi"] = {
            "id": "ashesi",
            "type": "university",
            "name": "Ashesi University",
            "location": "Eastern",
            "type_public": False
        }
        
        # Careers
        self.nodes["medicine"] = {
            "id": "medicine",
            "type": "career",
            "name": "Medical Doctor",
            "field": "Healthcare",
            "demand": "Very High"
        }
        self.nodes["engineering"] = {
            "id": "engineering",
            "type": "career",
            "name": "Engineer",
            "field": "Engineering",
            "demand": "High"
        }
        self.nodes["law"] = {
            "id": "law",
            "type": "career",
            "name": "Lawyer",
            "field": "Legal",
            "demand": "High"
        }
        self.nodes["software"] = {
            "id": "software",
            "type": "career",
            "name": "Software Engineer",
            "field": "Technology",
            "demand": "Very High"
        }
        
        # Professional Bodies
        self.nodes["mdc"] = {
            "id": "mdc",
            "type": "professional_body",
            "name": "Medical and Dental Council",
            "sector": "Healthcare"
        }
        self.nodes["ghie"] = {
            "id": "ghie",
            "type": "professional_body",
            "name": "Ghana Institution of Engineers",
            "sector": "Engineering"
        }
        self.nodes["gba"] = {
            "id": "gba",
            "type": "professional_body",
            "name": "Ghana Bar Association",
            "sector": "Legal"
        }
        
        # Scholarships
        self.nodes["getfund"] = {
            "id": "getfund",
            "type": "scholarship",
            "name": "GETFund",
            "provider": "Government of Ghana",
            "eligibility": "All Ghanaian students"
        }
        
        # Add edges
        self.edges = [
            # SHS → University
            {"from": "shs_general_science", "to": "ug", "relationship": "feeds_into"},
            {"from": "shs_general_science", "to": "knust", "relationship": "feeds_into"},
            {"from": "shs_general_arts", "to": "ug", "relationship": "feeds_into"},
            {"from": "shs_general_arts", "to": "knust", "relationship": "feeds_into"},
            
            # University → Career
            {"from": "ug", "to": "medicine", "relationship": "offers"},
            {"from": "ug", "to": "law", "relationship": "offers"},
            {"from": "ug", "to": "software", "relationship": "offers"},
            {"from": "knust", "to": "engineering", "relationship": "offers"},
            {"from": "knust", "to": "medicine", "relationship": "offers"},
            {"from": "uhas", "to": "medicine", "relationship": "offers"},
            
            # Career → Professional Body
            {"from": "medicine", "to": "mdc", "relationship": "regulated_by"},
            {"from": "engineering", "to": "ghie", "relationship": "regulated_by"},
            {"from": "law", "to": "gba", "relationship": "regulated_by"},
            
            # Scholarship → University
            {"from": "getfund", "to": "ug", "relationship": "covers"},
            {"from": "getfund", "to": "knust", "relationship": "covers"},
            {"from": "getfund", "to": "uhas", "relationship": "covers"}
        ]
    
    def get_node(self, node_id: str) -> Dict:
        """Get a node by ID"""
        return self.nodes.get(node_id, {})
    
    def get_edges(self, node_id: str) -> List[Dict]:
        """Get edges connected to a node"""
        result = []
        for edge in self.edges:
            if edge["from"] == node_id or edge["to"] == node_id:
                result.append(edge)
        return result
    
    def get_path(self, from_id: str, to_id: str) -> List[str]:
        """Find a path between two nodes"""
        visited = set()
        path = []
        
        def dfs(current, target, path):
            if current == target:
                return True
            visited.add(current)
            for edge in self.edges:
                if edge["from"] == current and edge["to"] not in visited:
                    path.append(edge["to"])
                    if dfs(edge["to"], target, path):
                        return True
                    path.pop()
                if edge["to"] == current and edge["from"] not in visited:
                    path.append(edge["from"])
                    if dfs(edge["from"], target, path):
                        return True
                    path.pop()
            return False
        
        if dfs(from_id, to_id, [from_id]):
            return path
        return []
    
    def get_career_pathway(self, career_id: str) -> List[Dict]:
        """Get full career pathway from SHS to career"""
        pathway = []
        
        # Find SHS nodes
        shs_nodes = [n for n in self.nodes.values() if n.get("type") == "shs_programme"]
        
        # Find university nodes that offer this career
        uni_nodes = []
        for edge in self.edges:
            if edge["to"] == career_id and edge["relationship"] == "offers":
                uni_nodes.append(self.nodes.get(edge["from"], {}))
        
        # Find professional body
        prof_body = None
        for edge in self.edges:
            if edge["from"] == career_id and edge["relationship"] == "regulated_by":
                prof_body = self.nodes.get(edge["to"], {})
        
        return {
            "career": self.nodes.get(career_id, {}),
            "shs_programmes": shs_nodes,
            "universities": uni_nodes,
            "professional_body": prof_body,
            "full_path": self.get_path(shs_nodes[0]["id"] if shs_nodes else "", career_id) if shs_nodes else []
        }
    
    def explain_connection(self, from_id: str, to_id: str) -> str:
        """Explain the connection between two nodes"""
        path = self.get_path(from_id, to_id)
        if not path:
            return "No direct connection found"
        
        explanation = []
        for i in range(len(path) - 1):
            node1 = self.nodes.get(path[i], {})
            node2 = self.nodes.get(path[i + 1], {})
            explanation.append(f"{node1.get('name', path[i])} → {node2.get('name', path[i + 1])}")
        
        return " → ".join(explanation)

knowledge_graph = NationalKnowledgeGraph()
