"""
PathwayGH RAG (Retrieval-Augmented Generation) Career Guidance System
Uses Sentence Transformers for embeddings + ChromaDB for vector search + LLM for reasoning
"""

import json
import os
from typing import List, Dict, Any
import numpy as np

# Import RAG components
from sentence_transformers import SentenceTransformer
import chromadb
from chromadb.utils import embedding_functions

class RAGCareerSystem:
    """
    Hybrid RAG system for career guidance:
    1. Career knowledge base stored as embeddings
    2. Semantic search to retrieve relevant careers
    3. LLM (GPT/Gemini) to generate personalized guidance
    """
    
    def __init__(self, use_llm: bool = True):
        # Embedding model (runs locally, no API key needed for search)
        self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        
        # Initialize ChromaDB (vector database)
        self.chroma_client = chromadb.PersistentClient(path="ml/chroma_db")
        
        # Load career knowledge base
        self.career_knowledge = self._load_career_knowledge()
        
        # Create or get collection
        self.collection = self._setup_vector_store()
        
        # LLM configuration (optional - requires API key)
        self.use_llm = use_llm
        self.llm_enabled = bool(os.getenv('OPENAI_API_KEY')) or bool(os.getenv('GEMINI_API_KEY'))
        
        print(f"✅ RAG System initialized")
        print(f"   Embedding model: all-MiniLM-L6-v2")
        print(f"   Vector store: ChromaDB ({self.collection.count()} documents)")
        print(f"   LLM enabled: {self.llm_enabled}")
    
    def _load_career_knowledge(self) -> List[Dict]:
        """Load Ghana-specific career knowledge base"""
        
        return [
            {
                "id": "med_001",
                "career": "Medical Doctor",
                "field": "Healthcare",
                "description": "Diagnose and treat illnesses in hospitals and clinics. Requires MBChB degree.",
                "requirements": "WASSCE aggregate ≤ 12 with A/B in Biology, Chemistry, Physics. General Science SHS programme.",
                "universities": ["University of Ghana (UG)", "KNUST", "UHAS", "UDS"],
                "duration": "6 years MBChB + 1 year housemanship",
                "salary_range": "GH₵ 5,000 - 15,000/month",
                "licensing": "Medical and Dental Council of Ghana",
                "keywords": "doctor physician healthcare hospital clinical medicine surgery"
            },
            {
                "id": "sw_001",
                "career": "Software Engineer",
                "field": "Technology",
                "description": "Design, develop, and maintain software applications. High demand in Ghana's tech sector.",
                "requirements": "WASSCE aggregate ≤ 18 with good grades in Elective Mathematics. General Science or ICT background.",
                "universities": ["University of Ghana", "KNUST", "Ashesi University", "Academic City"],
                "duration": "4 years BSc Computer Science",
                "salary_range": "GH₵ 3,000 - 12,000/month",
                "licensing": "Optional: Ghana Computer Society certification",
                "keywords": "programmer developer coding tech software engineering computer science"
            },
            {
                "id": "law_001",
                "career": "Lawyer",
                "field": "Legal",
                "description": "Represent clients in court, provide legal advice, draft legal documents.",
                "requirements": "WASSCE aggregate ≤ 12 with strong grades in Government, Literature, History. General Arts SHS programme.",
                "universities": ["University of Ghana School of Law", "KNUST Faculty of Law", "Central University", "GIMPA"],
                "duration": "4 years LLB + 1 year pupillage + Bar exams",
                "salary_range": "GH₵ 5,000 - 20,000/month",
                "licensing": "Ghana Bar Association",
                "keywords": "law legal attorney advocate court justice litigation"
            },
            {
                "id": "eng_001",
                "career": "Civil Engineer",
                "field": "Engineering",
                "description": "Design and supervise construction of infrastructure: roads, bridges, buildings, water systems.",
                "requirements": "WASSCE aggregate ≤ 16 with strong grades in Physics, Chemistry, Elective Mathematics. General Science SHS programme.",
                "universities": ["KNUST", "University of Ghana", "All Nations University"],
                "duration": "4 years BSc Civil Engineering",
                "salary_range": "GH₵ 4,000 - 12,000/month",
                "licensing": "Ghana Institution of Engineers (GhIE)",
                "keywords": "civil engineering construction infrastructure building roads bridges"
            },
            {
                "id": "nurse_001",
                "career": "Nurse",
                "field": "Healthcare",
                "description": "Provide patient care, administer medications, support doctors in hospitals and clinics.",
                "requirements": "WASSCE aggregate ≤ 18 with good grades in Biology, Chemistry. General Science or Home Economics SHS programme.",
                "universities": ["University of Ghana", "UHAS", "UCC", "Nursing Training Colleges"],
                "duration": "4 years BSc Nursing",
                "salary_range": "GH₵ 2,500 - 8,000/month",
                "licensing": "Nursing and Midwifery Council of Ghana",
                "keywords": "nursing healthcare patient care hospital clinical"
            },
            {
                "id": "pharm_001",
                "career": "Pharmacist",
                "field": "Healthcare",
                "description": "Dispense medications, counsel patients on drug use, ensure pharmaceutical safety.",
                "requirements": "WASSCE aggregate ≤ 15 with good grades in Biology, Chemistry. General Science SHS programme.",
                "universities": ["KNUST", "University of Ghana", "UCC", "Central University"],
                "duration": "6 years Doctor of Pharmacy (PharmD)",
                "salary_range": "GH₵ 4,000 - 10,000/month",
                "licensing": "Pharmacy Council of Ghana",
                "keywords": "pharmacy drugs medications healthcare clinical pharmacist"
            },
            {
                "id": "acc_001",
                "career": "Accountant",
                "field": "Business",
                "description": "Manage financial records, prepare tax returns, conduct audits, advise on financial matters.",
                "requirements": "WASSCE aggregate ≤ 20 with good grades in Accounting, Business Management, Mathematics. Business SHS programme.",
                "universities": ["University of Ghana Business School", "UPSA", "KNUST School of Business", "Ashesi"],
                "duration": "4 years BSc Accounting + ICAG certification",
                "salary_range": "GH₵ 3,000 - 15,000/month",
                "licensing": "ICAG (Institute of Chartered Accountants Ghana)",
                "keywords": "accounting finance audit tax bookkeeping numbers"
            },
            {
                "id": "arch_001",
                "career": "Architect",
                "field": "Creative Arts",
                "description": "Design buildings and structures, create blueprints, oversee construction projects.",
                "requirements": "WASSCE aggregate ≤ 14 with General Knowledge in Art. Visual Arts or General Science SHS programme.",
                "universities": ["KNUST", "University of Ghana", "Central University"],
                "duration": "4-6 years BSc Architecture + internship",
                "salary_range": "GH₵ 4,000 - 15,000/month",
                "licensing": "Ghana Institute of Architects (GhIA)",
                "keywords": "architecture design building construction blueprint drawing"
            },
            {
                "id": "teacher_001",
                "career": "Teacher",
                "field": "Education",
                "description": "Educate students at basic, secondary, or tertiary levels. Shape young minds.",
                "requirements": "WASSCE aggregate ≤ 24 with good grades in relevant subjects. Any SHS programme accepted.",
                "universities": ["University of Education Winneba (UEW)", "University of Cape Coast (UCC)", "University of Ghana"],
                "duration": "4 years B.Ed + Teacher Licensure Examination",
                "salary_range": "GH₵ 1,500 - 5,000/month",
                "licensing": "National Teaching Council (NTC)",
                "keywords": "teaching education instructor professor school"
            },
            {
                "id": "agri_001",
                "career": "Agricultural Scientist",
                "field": "Agriculture",
                "description": "Research crop production, soil management, sustainable farming. Improve food security.",
                "requirements": "WASSCE aggregate ≤ 20 with good grades in Biology, Chemistry, Agriculture. Agricultural Science SHS programme.",
                "universities": ["University of Ghana", "KNUST", "UDS", "University of Cape Coast"],
                "duration": "4 years BSc Agriculture",
                "salary_range": "GH₵ 3,000 - 8,000/month",
                "licensing": "CSIR affiliation for researchers",
                "keywords": "agriculture farming crops research science food security"
            }
        ]
    
    def _setup_vector_store(self):
        """Setup ChromaDB collection with career embeddings"""
        
        # Create embedding function
        embedding_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name="all-MiniLM-L6-v2"
        )
        
        # Get or create collection
        try:
            collection = self.chroma_client.get_collection("careers")
        except:
            collection = self.chroma_client.create_collection(
                name="careers",
                embedding_function=embedding_fn,
                metadata={"hnsw:space": "cosine"}
            )
            # Add career documents to collection
            for career in self.career_knowledge:
                # Create document text
                doc_text = f"""
                Career: {career['career']}
                Field: {career['field']}
                Description: {career['description']}
                Requirements: {career['requirements']}
                Universities: {', '.join(career['universities'])}
                Keywords: {career['keywords']}
                """
                
                collection.add(
                    ids=[career['id']],
                    documents=[doc_text],
                    metadatas=[{
                        "career": career['career'],
                        "field": career['field'],
                        "universities": json.dumps(career['universities']),
                        "salary_range": career['salary_range'],
                        "duration": career['duration']
                    }]
                )
        
        return collection
    
    def semantic_search(self, query: str, top_k: int = 5) -> List[Dict]:
        """Search for careers using natural language"""
        
        results = self.collection.query(
            query_texts=[query],
            n_results=top_k
        )
        
        careers = []
        if results['ids'] and results['ids'][0]:
            for i, career_id in enumerate(results['ids'][0]):
                # Find matching career in knowledge base
                career_data = next(
                    (c for c in self.career_knowledge if c['id'] == career_id),
                    None
                )
                if career_data:
                    careers.append({
                        "career": career_data['career'],
                        "field": career_data['field'],
                        "description": career_data['description'],
                        "requirements": career_data['requirements'],
                        "universities": career_data['universities'],
                        "salary_range": career_data['salary_range'],
                        "duration": career_data['duration'],
                        "similarity_score": float(1 - results['distances'][0][i]) if results.get('distances') else 1.0
                    })
        
        return careers
    
    def get_recommendations(self, aggregate: int, interests: List[str], subjects: List[str]) -> Dict:
        """Get career recommendations using RAG + optional LLM"""
        
        # Build search query from student profile
        query = f"""
        Student profile:
        - WASSCE aggregate: {aggregate}
        - Interests: {', '.join(interests)}
        - Subjects taken: {', '.join(subjects)}
        
        Find careers suitable for this student.
        """
        
        # Semantic search for relevant careers
        relevant_careers = self.semantic_search(query, top_k=5)
        
        # Score careers based on aggregate compatibility
        for career in relevant_careers:
            # Extract typical aggregate from career data
            req_text = career.get('requirements', '')
            import re
            aggregate_match = re.search(r'aggregate[≤<](\d+)', req_text.lower())
            if aggregate_match:
                required_aggregate = int(aggregate_match.group(1))
                if aggregate <= required_aggregate:
                    career['aggregate_match'] = '✅ Eligible'
                    career['match_score'] = max(50, 100 - (aggregate / required_aggregate) * 10)
                else:
                    career['aggregate_match'] = f'⚠️ Need {required_aggregate} or better'
                    career['match_score'] = max(20, 50 - (aggregate - required_aggregate) * 5)
            else:
                career['aggregate_match'] = 'Check requirements'
                career['match_score'] = 70
        
        # Sort by match score
        relevant_careers.sort(key=lambda x: x.get('match_score', 0), reverse=True)
        
        return {
            "aggregate": aggregate,
            "interests": interests,
            "subjects": subjects,
            "recommendations": relevant_careers[:5],
            "total_matches": len(relevant_careers)
        }

# Singleton
rag_system = RAGCareerSystem()
