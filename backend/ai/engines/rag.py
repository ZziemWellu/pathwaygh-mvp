"""
RAG Engine - Retrieval-Augmented Generation
"""

from typing import List, Dict, Any
import logging
from core.logging.logger import logger

logger = logging.getLogger(__name__)


class RAGEngine:
    """RAG-powered knowledge retrieval"""
    
    def __init__(self):
        self.is_loaded = False
        self.knowledge_base = []
    
    def load(self):
        """Load knowledge base"""
        try:
            # Load knowledge base from data
            self.knowledge_base = self._load_knowledge()
            self.is_loaded = True
            logger.info(f"RAGEngine loaded with {len(self.knowledge_base)} documents")
        except Exception as e:
            logger.error(f"Failed to load RAGEngine: {e}")
    
    def _load_knowledge(self) -> List[Dict]:
        """Load knowledge base documents"""
        knowledge = []
        
        # Load career information
        try:
            from services.data_service import data_service
            careers = data_service.get_careers()
            for career in careers:
                knowledge.append({
                    "type": "career",
                    "content": f"{career.get('name')}: {career.get('description')}",
                    "metadata": career
                })
        except Exception as e:
            logger.warning(f"Could not load career knowledge: {e}")
        
        # Add default knowledge if empty
        if not knowledge:
            knowledge = [
                {"type": "career", "content": "Medical Doctor: Diagnoses and treats illnesses", "metadata": {}},
                {"type": "career", "content": "Software Engineer: Designs and develops software", "metadata": {}},
                {"type": "career", "content": "Lawyer: Represents clients in legal matters", "metadata": {}}
            ]
        
        return knowledge
    
    def search(self, query: str, top_k: int = 5) -> List[Dict]:
        """Search knowledge base"""
        if not self.is_loaded:
            self.load()
        
        if not self.knowledge_base:
            return []
        
        # Simple keyword search (will be replaced with embeddings later)
        query_lower = query.lower()
        results = []
        
        for doc in self.knowledge_base:
            content = doc.get("content", "").lower()
            score = 0
            
            # Simple scoring based on keyword matches
            for word in query_lower.split():
                if word in content:
                    score += 1
            
            if score > 0:
                results.append({
                    **doc,
                    "score": score,
                    "similarity": score / max(len(query_lower.split()), 1)
                })
        
        results.sort(key=lambda x: x.get("score", 0), reverse=True)
        return results[:top_k]
