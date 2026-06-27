"""
Semantic Career Search using Sentence Transformers
Converts natural language queries to career matches
"""

from sentence_transformers import SentenceTransformer, util
import numpy as np
import json

class SemanticCareerSearch:
    """Embedding-based semantic search for careers"""
    
    def __init__(self):
        # Load model (lightweight, runs on CPU)
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        
        # Career documents with descriptions
        self.careers = [
            {
                'name': 'Medical Doctor',
                'description': 'Diagnose and treat illnesses in hospitals. Help sick people recover. Work in healthcare settings. Strong science background needed.',
                'keywords': 'doctor physician healthcare hospital medicine clinical'
            },
            {
                'name': 'Software Engineer',
                'description': 'Write computer programs and build websites. Work with technology and coding. Create mobile apps and software solutions.',
                'keywords': 'programmer developer coder tech computer programming'
            },
            {
                'name': 'Nurse',
                'description': 'Care for patients in hospitals. Help doctors treat sick people. Provide comfort and medical assistance to patients.',
                'keywords': 'nursing healthcare hospital patient care medical'
            },
            {
                'name': 'Lawyer',
                'description': 'Represent clients in court. Give legal advice. Work with laws and regulations. Defend or prosecute cases.',
                'keywords': 'legal attorney advocate court justice law'
            },
            {
                'name': 'Accountant',
                'description': 'Manage financial records. Prepare tax returns. Work with numbers and budgets. Ensure financial compliance.',
                'keywords': 'accounting finance auditor bookkeeper numbers tax'
            },
            {
                'name': 'Architect',
                'description': 'Design buildings and structures. Create blueprints. Work with clients and construction teams.',
                'keywords': 'architectural design buildings construction blueprint'
            },
            {
                'name': 'Civil Engineer',
                'description': 'Build roads, bridges, and infrastructure. Work on construction projects. Design public works.',
                'keywords': 'construction infrastructure building roads bridges'
            },
            {
                'name': 'Teacher',
                'description': 'Educate students in schools. Prepare lessons and grade work. Help young people learn and grow.',
                'keywords': 'education instructor professor school teaching'
            },
            {
                'name': 'Pharmacist',
                'description': 'Dispense medications. Advise on drug safety. Work in pharmacies and hospitals.',
                'keywords': 'pharmacy drugs medicine prescriptions healthcare'
            },
            {
                'name': 'Agricultural Scientist',
                'description': 'Research crop production. Improve farming methods. Work with plants and soil. Help food security.',
                'keywords': 'agriculture farming crops plants research science'
            }
        ]
        
        # Pre-compute embeddings for all careers
        self.career_texts = [f"{c['name']}. {c['description']} {c['keywords']}" for c in self.careers]
        self.career_embeddings = self.model.encode(self.career_texts, convert_to_tensor=True)
    
    def search(self, query: str, top_k: int = 5) -> list:
        """Search for careers matching natural language query"""
        
        # Encode query
        query_embedding = self.model.encode(query, convert_to_tensor=True)
        
        # Compute cosine similarity
        cosine_scores = util.cos_sim(query_embedding, self.career_embeddings)[0]
        
        # Get top results
        top_results = torch.topk(cosine_scores, k=top_k)
        
        results = []
        for idx, score in zip(top_results.indices, top_results.values):
            results.append({
                'career': self.careers[idx]['name'],
                'similarity_score': float(score),
                'description': self.careers[idx]['description']
            })
        
        return results

# Note: Requires torch. If not installed, fallback to simple matching
import torch

semantic_search = SemanticCareerSearch()
