"""
Lazy RAG System with Hybrid Search, Prestige Scoring, and Context Awareness
"""

import os
import json
import re
from typing import List, Dict, Optional, Tuple
import numpy as np
from pathlib import Path
from collections import Counter
import math

class LazyRAGSystem:
    def __init__(self):
        self.model = None
        self.documents = []
        self.embeddings = None
        self.is_loaded = False
        self.load_error = None
        self.document_count = 0
        self.MIN_SIMILARITY = 0.40
        self.CONTEXT_WEIGHT = 0.10  # Weight for aggregate/context matching
        
        # Load prestige scores
        self.prestige_scores = self._load_prestige_scores()
        
        # Ghanaian university abbreviations mapping
        self.abbreviation_map = {
            'ug': 'university of ghana',
            'knust': 'kwame nkrumah university of science and technology',
            'uhas': 'university of health and allied sciences',
            'ucc': 'university of cape coast',
            'uew': 'university of education winneba',
            'upsa': 'university of professional studies accra',
            'gimpa': 'ghana institute of management and public administration',
            'ashesi': 'ashesi university',
            'central': 'central university',
            'gctu': 'ghana communication technology university',
            'ttu': 'takoradi technical university',
            'cctu': 'cape coast technical university'
        }
        
        # Common stopwords for better keyword extraction
        self.stopwords = {
            'i', 'want', 'to', 'study', 'in', 'ghana', 'the', 'a', 'an', 'of', 'for', 'at', 'on',
            'best', 'where', 'can', 'which', 'what', 'is', 'are', 'was', 'were', 'have', 'has',
            'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must'
        }
    
    def _load_prestige_scores(self) -> Dict:
        """Load university prestige scores"""
        prestige_file = Path("ml/prestige_scores.json")
        if prestige_file.exists():
            with open(prestige_file, 'r') as f:
                return json.load(f)
        return {}
    
    def _get_prestige_score(self, university: str) -> float:
        """Get prestige score for a university"""
        # Try exact match
        if university in self.prestige_scores:
            return self.prestige_scores[university] / 100.0
        
        # Try partial match
        for uni, score in self.prestige_scores.items():
            if uni.lower() in university.lower() or university.lower() in uni.lower():
                return score / 100.0
        
        return 0.5  # Default middle score
    
    def _normalize_query(self, query: str) -> Tuple[str, List[str], Dict]:
        """Normalize query by expanding abbreviations and extracting context"""
        query_lower = query.lower()
        
        # Replace abbreviations with full names
        for abbr, full_name in self.abbreviation_map.items():
            query_lower = query_lower.replace(abbr, full_name)
        
        # Extract keywords (remove stopwords)
        words = query_lower.split()
        keywords = [w for w in words if w not in self.stopwords and len(w) > 2]
        
        # Extract context (aggregate if mentioned)
        context = {}
        aggregate_match = re.search(r'aggregate\s*(\d+)', query_lower)
        if aggregate_match:
            context['aggregate'] = int(aggregate_match.group(1))
        
        # Check if "best" is mentioned for prestige weighting
        context['prestige_weight'] = 0.0
        if 'best' in query_lower or 'top' in query_lower:
            context['prestige_weight'] = 0.15  # Boost prestige for "best" queries
        
        return query_lower, keywords, context
    
    def _keyword_score(self, doc_content: str, keywords: List[str]) -> float:
        """Calculate keyword overlap score"""
        if not keywords:
            return 0.0
        
        doc_lower = doc_content.lower()
        matches = sum(1 for kw in keywords if kw in doc_lower)
        return matches / len(keywords) if keywords else 0.0
    
    def load(self):
        """Lazy load models only when first needed"""
        if self.is_loaded:
            return True
        
        if self.load_error:
            return False
        
        try:
            print("🚀 Loading RAG models (first use)...")
            
            from sentence_transformers import SentenceTransformer
            self.model = SentenceTransformer(
                'all-MiniLM-L6-v2',
                device='cpu'
            )
            
            self._load_all_documents()
            
            if self.documents and len(self.documents) > 0:
                texts = [doc['content'] for doc in self.documents]
                self.embeddings = self.model.encode(texts)
                self.document_count = len(self.documents)
                print(f"✅ RAG loaded: {self.document_count} documents")
            else:
                fallback_text = "Ghanaian university and career data available."
                self.documents = [{
                    "type": "fallback",
                    "content": fallback_text,
                    "metadata": {"source": "fallback"}
                }]
                self.embeddings = self.model.encode([fallback_text])
                self.document_count = 1
            
            self.is_loaded = True
            return True
            
        except Exception as e:
            self.load_error = str(e)
            print(f"⚠️ RAG load error: {e}")
            return False
    
    def _load_all_documents(self):
        """Load documents from all data sources"""
        self.documents = []
        
        # Load expanded program data
        prog_file = Path("data/programs/expanded_programs.json")
        if prog_file.exists():
            try:
                with open(prog_file, 'r') as f:
                    data = json.load(f)
                    for university, programs in data.items():
                        for program, details in programs.items():
                            text = f"""
                            University: {university}
                            Program: {program}
                            Cutoff: {details.get('cutoff', 'N/A')}
                            Duration: {details.get('duration', 'N/A')} years
                            Required Subjects: {', '.join(details.get('subjects', []))}
                            """
                            # Add prestige score to metadata
                            prestige = self._get_prestige_score(university)
                            self.documents.append({
                                "type": "university_program",
                                "content": text,
                                "metadata": {
                                    "university": university,
                                    "program": program,
                                    "cutoff": details.get('cutoff', 'N/A'),
                                    "duration": details.get('duration', 'N/A'),
                                    "subjects": details.get('subjects', []),
                                    "prestige": prestige
                                }
                            })
                print(f"📚 Loaded {len(self.documents)} expanded programs")
            except Exception as e:
                print(f"⚠️ Failed to load expanded programs: {e}")
        
        print(f"📚 Total: {len(self.documents)} documents for RAG")
    
    def semantic_search(self, query: str, top_k: int = 5) -> List[Dict]:
        """Search with hybrid scoring + prestige + context awareness"""
        
        if top_k is None or top_k < 1:
            top_k = 5
        
        if not self.load():
            return [{"error": "RAG system not available"}]
        
        if self.embeddings is None or len(self.embeddings) == 0:
            return [{"error": "No embeddings available"}]
        
        if not self.documents or len(self.documents) == 0:
            return [{"error": "No documents loaded"}]
        
        # Normalize query
        normalized_query, keywords, context = self._normalize_query(query)
        print(f"🔍 Query: '{query}' -> '{normalized_query}'")
        if keywords:
            print(f"🔑 Keywords: {keywords}")
        if context:
            print(f"📊 Context: {context}")
        
        # Encode query
        query_embedding = self.model.encode([normalized_query])[0]
        
        # Get semantic scores
        from sentence_transformers.util import cos_sim
        semantic_scores = cos_sim(query_embedding, self.embeddings)[0]
        
        # Convert to numpy
        if hasattr(semantic_scores, 'cpu'):
            semantic_scores = semantic_scores.cpu().numpy()
        semantic_scores = np.asarray(semantic_scores).flatten()
        
        # Calculate keyword scores
        keyword_scores = np.array([
            self._keyword_score(doc['content'], keywords) 
            for doc in self.documents
        ])
        
        # Calculate prestige scores
        prestige_scores = np.array([
            doc['metadata'].get('prestige', 0.5) 
            for doc in self.documents
        ])
        
        # Hybrid score: 60% semantic + 25% keyword + 15% prestige
        prestige_weight = context.get('prestige_weight', 0.0)
        if prestige_weight > 0:
            # Boost prestige for "best" queries
            prestige_weight = 0.20
            semantic_weight = 0.50
            keyword_weight = 0.30
        else:
            semantic_weight = 0.60
            keyword_weight = 0.25
            prestige_weight = 0.15
        
        hybrid_scores = (
            semantic_weight * semantic_scores +
            keyword_weight * keyword_scores +
            prestige_weight * prestige_scores
        )
        
        # Apply aggregate context if available
        if 'aggregate' in context:
            agg = context['aggregate']
            for i, doc in enumerate(self.documents):
                cutoff = doc['metadata'].get('cutoff', 'N/A')
                if isinstance(cutoff, (int, float)) and cutoff != 'N/A':
                    if agg <= cutoff:
                        hybrid_scores[i] += self.CONTEXT_WEIGHT * 0.5
                    elif agg <= cutoff + 2:
                        hybrid_scores[i] += self.CONTEXT_WEIGHT * 0.3
        
        # Filter by minimum similarity
        valid_indices = [i for i, score in enumerate(hybrid_scores) if score >= self.MIN_SIMILARITY]
        
        if not valid_indices:
            # If no results above threshold, return top 3 with message
            valid_indices = list(range(min(3, len(hybrid_scores))))
            results = []
            for idx in valid_indices:
                doc = self.documents[idx]
                results.append({
                    "type": doc.get("type", "unknown"),
                    "content": doc.get("content", ""),
                    "metadata": doc.get("metadata", {}),
                    "similarity_score": float(hybrid_scores[idx]),
                    "semantic_score": float(semantic_scores[idx]),
                    "keyword_score": float(keyword_scores[idx])
                })
            return results
        
        # Get top matches
        top_indices = sorted(valid_indices, key=lambda i: hybrid_scores[i], reverse=True)[:top_k]
        
        results = []
        for idx in top_indices:
            doc = self.documents[idx]
            results.append({
                "type": doc.get("type", "unknown"),
                "content": doc.get("content", ""),
                "metadata": doc.get("metadata", {}),
                "similarity_score": float(hybrid_scores[idx]),
                "semantic_score": float(semantic_scores[idx]),
                "keyword_score": float(keyword_scores[idx])
            })
        
        return results

# Singleton instance
rag = LazyRAGSystem()

def is_rag_available():
    return rag.is_loaded or rag.load()
