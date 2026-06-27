"""
Complete RAG System for Ghana Career Guidance
Uses real data from all sources
"""

import json
import os
from typing import List, Dict
from sentence_transformers import SentenceTransformer
import numpy as np

class CompleteRAGSystem:
    def __init__(self):
        print("🚀 Initializing Complete RAG System...")
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        self.documents = []
        self.embeddings = []
        self.load_all_data()
        self.create_embeddings()
        print(f"✅ Ready with {len(self.documents)} knowledge documents")
    
    def load_all_data(self):
        """Load all real Ghanaian data sources"""
        
        # Load career data
        career_dir = "data/careers"
        if os.path.exists(career_dir):
            for file in os.listdir(career_dir):
                if file.endswith('.json'):
                    with open(os.path.join(career_dir, file), 'r') as f:
                        data = json.load(f)
                        self.documents.append({
                            "type": "career",
                            "content": json.dumps(data),
                            "metadata": {"career": data.get('career', file)}
                        })
        
        # Load university data
        uni_dir = "data/universities"
        if os.path.exists(uni_dir):
            for file in os.listdir(uni_dir):
                if file.endswith('.json'):
                    with open(os.path.join(uni_dir, file), 'r') as f:
                        data = json.load(f)
                        self.documents.append({
                            "type": "university",
                            "content": json.dumps(data),
                            "metadata": {"university": data.get('name', file)}
                        })
        
        # Load SHS pathways
        shs_file = "data/shs_pathways.json"
        if os.path.exists(shs_file):
            with open(shs_file, 'r') as f:
                data = json.load(f)
                self.documents.append({
                    "type": "shs_pathways",
                    "content": json.dumps(data),
                    "metadata": {"type": "shs_programmes"}
                })
        
        # Load employment data
        emp_file = "data/employment/graduate_stats.json"
        if os.path.exists(emp_file):
            with open(emp_file, 'r') as f:
                data = json.load(f)
                self.documents.append({
                    "type": "employment",
                    "content": json.dumps(data),
                    "metadata": {"type": "employment_stats"}
                })
        
        # Load WASSCE data
        wassce_file = "data/wassce/grading_system.json"
        if os.path.exists(wassce_file):
            with open(wassce_file, 'r') as f:
                data = json.load(f)
                self.documents.append({
                    "type": "wasce",
                    "content": json.dumps(data),
                    "metadata": {"type": "grading_system"}
                })
        
        print(f"  📚 Loaded {len(self.documents)} knowledge documents")
    
    def create_embeddings(self):
        """Create vector embeddings for all documents"""
        texts = [doc['content'] for doc in self.documents]
        self.embeddings = self.model.encode(texts)
    
    def semantic_search(self, query: str, top_k: int = 5) -> List[Dict]:
        """Search for relevant information using vector similarity"""
        query_embedding = self.model.encode([query])[0]
        
        similarities = np.dot(self.embeddings, query_embedding) / (
            np.linalg.norm(self.embeddings, axis=1) * np.linalg.norm(query_embedding)
        )
        
        top_indices = np.argsort(similarities)[-top_k:][::-1]
        
        results = []
        for idx in top_indices:
            results.append({
                "document": self.documents[idx],
                "similarity": float(similarities[idx])
            })
        
        return results
    
    def get_career_guidance(self, aggregate: int, interests: List[str], subjects: List[str]) -> Dict:
        """Get comprehensive career guidance using RAG"""
        
        query = f"""
        Student Profile:
        - WASSCE Aggregate: {aggregate}
        - Interests: {', '.join(interests)}
        - Subjects: {', '.join(subjects)}
        
        Find relevant career information, university requirements, and job market data.
        """
        
        relevant_docs = self.semantic_search(query, top_k=5)
        
        return {
            "aggregate": aggregate,
            "interests": interests,
            "subjects": subjects,
            "retrieved_knowledge": relevant_docs,
            "data_sources": ["UG", "KNUST", "UHAS", "UCC", "UEW", "UPSA", "WAEC", "GSS"]
        }

rag_system = CompleteRAGSystem()
