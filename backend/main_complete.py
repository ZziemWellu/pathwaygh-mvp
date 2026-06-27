"""
PathwayGH Backend - COMPLETE Main Application
Includes ALL endpoints: Careers, Quiz, Eligibility, Chatbot, Smart Recommender, AI Copilot, RAG, Real Data
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
import logging
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============================================
# FastAPI App
# ============================================

app = FastAPI(
    title="PathwayGH API",
    description="AI-Powered Career Guidance for Ghanaian Students",
    version="3.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# In-Memory Career Data (10 careers)
# ============================================

CAREERS = [
    {
        "id": 1,
        "slug": "medical-doctor",
        "name": "Medical Doctor",
        "field": "Healthcare",
        "description": "Diagnoses and treats illnesses. Requires MBChB degree from UG, KNUST, or UHAS.",
        "salary_range": "GH₵ 5,000 - 15,000",
        "duration_years": 10,
        "typical_aggregate": 12,
        "required_subjects": ["Biology", "Chemistry", "Physics"],
        "universities": ["University of Ghana", "KNUST", "UHAS"]
    },
    {
        "id": 2,
        "slug": "software-engineer",
        "name": "Software Engineer",
        "field": "Technology",
        "description": "Designs and develops software applications. High demand in Ghana's growing tech sector.",
        "salary_range": "GH₵ 3,000 - 12,000",
        "duration_years": 4,
        "typical_aggregate": 18,
        "required_subjects": ["Elective Mathematics"],
        "universities": ["University of Ghana", "KNUST", "Ashesi"]
    },
    {
        "id": 3,
        "slug": "civil-engineer",
        "name": "Civil Engineer",
        "field": "Engineering",
        "description": "Designs infrastructure like roads, bridges, and buildings.",
        "salary_range": "GH₵ 4,000 - 12,000",
        "duration_years": 5,
        "typical_aggregate": 16,
        "required_subjects": ["Physics", "Chemistry", "Elective Mathematics"],
        "universities": ["KNUST", "University of Ghana"]
    },
    {
        "id": 4,
        "slug": "lawyer",
        "name": "Lawyer",
        "field": "Legal",
        "description": "Represents clients in legal matters. Requires LLB and Ghana Bar exams.",
        "salary_range": "GH₵ 5,000 - 20,000",
        "duration_years": 7,
        "typical_aggregate": 12,
        "required_subjects": ["Government", "Literature"],
        "universities": ["University of Ghana", "KNUST", "Central University"]
    },
    {
        "id": 5,
        "slug": "accountant",
        "name": "Accountant",
        "field": "Business",
        "description": "Manages financial records and audits. ICAG certification available.",
        "salary_range": "GH₵ 3,000 - 15,000",
        "duration_years": 4,
        "typical_aggregate": 16,
        "required_subjects": ["Financial Accounting", "Business Management"],
        "universities": ["University of Ghana", "UPSA", "KNUST"]
    },
    {
        "id": 6,
        "slug": "architect",
        "name": "Architect",
        "field": "Creative Arts",
        "description": "Designs buildings and structures. Requires portfolio for KNUST admission.",
        "salary_range": "GH₵ 4,000 - 15,000",
        "duration_years": 6,
        "typical_aggregate": 14,
        "required_subjects": ["General Knowledge in Art"],
        "universities": ["KNUST", "University of Ghana"]
    },
    {
        "id": 7,
        "slug": "nurse",
        "name": "Nurse",
        "field": "Healthcare",
        "description": "Provides patient care in hospitals and clinics across Ghana.",
        "salary_range": "GH₵ 2,500 - 8,000",
        "duration_years": 4,
        "typical_aggregate": 18,
        "required_subjects": ["Biology", "Chemistry"],
        "universities": ["University of Ghana", "UHAS", "UCC"]
    },
    {
        "id": 8,
        "slug": "teacher",
        "name": "Teacher",
        "field": "Education",
        "description": "Educates students at basic and senior high school levels.",
        "salary_range": "GH₵ 1,500 - 5,000",
        "duration_years": 4,
        "typical_aggregate": 24,
        "required_subjects": [],
        "universities": ["University of Education", "UCC", "UEW"]
    },
    {
        "id": 9,
        "slug": "pharmacist",
        "name": "Pharmacist",
        "field": "Healthcare",
        "description": "Dispenses medications and advises on drug safety.",
        "salary_range": "GH₵ 4,000 - 10,000",
        "duration_years": 6,
        "typical_aggregate": 15,
        "required_subjects": ["Biology", "Chemistry"],
        "universities": ["KNUST", "University of Ghana", "UCC"]
    },
    {
        "id": 10,
        "slug": "agricultural-scientist",
        "name": "Agricultural Scientist",
        "field": "Agriculture",
        "description": "Researches crop production and sustainable farming.",
        "salary_range": "GH₵ 3,000 - 8,000",
        "duration_years": 5,
        "typical_aggregate": 20,
        "required_subjects": ["Biology", "Chemistry"],
        "universities": ["University of Ghana", "KNUST", "UDS"]
    }
]

# ============================================
# Health Check
# ============================================

@app.get("/")
async def root():
    return {"message": "PathwayGH API", "status": "operational", "version": "3.0", "docs": "/api/docs"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "pathwaygh-backend", "careers_count": len(CAREERS)}

# ============================================
# Careers Endpoints
# ============================================

@app.get("/api/careers")
async def get_careers(search: Optional[str] = None):
    if search:
        results = [c for c in CAREERS if search.lower() in c["name"].lower()]
        return results
    return CAREERS

@app.get("/api/careers/{slug}")
async def get_career_by_slug(slug: str):
    for career in CAREERS:
        if career["slug"] == slug:
            return career
    raise HTTPException(status_code=404, detail="Career not found")

# ============================================
# Eligibility Checker
# ============================================

class GradeInput(BaseModel):
    english: str
    math: str
    science: str
    social: str
    electives: Dict[str, str]

@app.post("/api/eligibility/check")
async def check_eligibility(grades: GradeInput):
    grade_map = {"A1": 1, "B2": 2, "B3": 3, "C4": 4, "C5": 5, "C6": 6, "D7": 7, "E8": 8, "F9": 9}
    
    all_grades = [
        grade_map.get(grades.english, 9),
        grade_map.get(grades.math, 9),
        grade_map.get(grades.science, 9),
        grade_map.get(grades.social, 9),
    ]
    for grade in grades.electives.values():
        all_grades.append(grade_map.get(grade, 9))
    
    all_grades.sort()
    aggregate = sum(all_grades[:6])
    
    programmes = [
        {"name": "Medicine (MBChB)", "cutoff": 12, "universities": ["UG", "KNUST", "UHAS"]},
        {"name": "Engineering", "cutoff": 16, "universities": ["KNUST", "UG"]},
        {"name": "Computer Science", "cutoff": 18, "universities": ["UG", "KNUST", "Ashesi"]},
        {"name": "Law (LLB)", "cutoff": 12, "universities": ["UG", "KNUST"]},
        {"name": "Business Administration", "cutoff": 20, "universities": ["UG", "UPSA", "KNUST"]},
        {"name": "Nursing", "cutoff": 18, "universities": ["UG", "UHAS", "UCC"]},
    ]
    
    eligible = [p for p in programmes if aggregate <= p["cutoff"]]
    
    return {
        "aggregate": aggregate,
        "eligible_programmes": eligible[:5],
        "total_eligible": len(eligible)
    }

# ============================================
# Quiz Endpoints
# ============================================

class QuizAnswers(BaseModel):
    q1: str
    q2: str
    q3: str
    q4: str
    q5: str

@app.get("/api/quiz/questions")
async def get_quiz_questions():
    return {
        "questions": [
            {"id": "q1", "text": "What interests you most?", "options": ["Helping people", "Technology", "Business", "Creative work", "Working outdoors"]},
            {"id": "q2", "text": "What is your strongest subject?", "options": ["Science", "Mathematics", "Arts/Literature", "Business", "Technical"]},
            {"id": "q3", "text": "How do you prefer to work?", "options": ["Office", "Hospital", "Remote", "Field/Outdoors"]},
            {"id": "q4", "text": "What matters most in a career?", "options": ["High income", "Making impact", "Job security", "Creativity"]},
            {"id": "q5", "text": "Your current stage?", "options": ["JHS", "SHS", "University", "TVET"]}
        ]
    }

@app.post("/api/quiz/submit")
async def submit_quiz(answers: QuizAnswers):
    interest = answers.q1.lower()
    strength = answers.q2.lower()
    
    if "helping" in interest or "science" in strength:
        primary = CAREERS[0]
    elif "technology" in interest or "math" in strength:
        primary = CAREERS[1]
    elif "business" in interest:
        primary = CAREERS[4]
    else:
        primary = CAREERS[0]
    
    return {
        "primary_career": {
            "name": primary["name"],
            "field": primary["field"],
            "description": primary["description"],
            "typical_aggregate": primary["typical_aggregate"]
        },
        "alternatives": [CAREERS[2], CAREERS[3], CAREERS[6]],
        "confidence": "High",
        "explanation": f"Your interest in {answers.q1} and strength in {answers.q2} aligns well with {primary['name']}."
    }

# ============================================
# Chatbot Endpoint
# ============================================

class ChatMessage(BaseModel):
    message: str
    session_id: Optional[str] = None

@app.post("/api/chatbot/chat")
async def chat(message: ChatMessage):
    msg_lower = message.message.lower()
    
    if "doctor" in msg_lower or "medicine" in msg_lower:
        reply = "To become a doctor in Ghana: Choose General Science in SHS, take Biology/Chemistry/Physics, target aggregate ≤ 12, apply to UG/KNUST/UHAS, complete 6-year MBChB, pass Medical Council exams."
    elif "engineer" in msg_lower:
        reply = "To become an engineer: Choose General Science, take Physics/Chemistry/Elective Maths, target aggregate ≤ 16, apply to KNUST/UG, complete 4-year BSc, register with GhIE."
    elif "lawyer" in msg_lower:
        reply = "To become a lawyer: Choose General Arts, take Government/Literature, target aggregate ≤ 12, apply to UG/KNUST Law, complete LLB, pass Ghana Bar exams."
    elif "aggregate" in msg_lower:
        reply = "WASSCE aggregate is best 6 subjects (4 cores + 2 electives). A1=1, B2=2, B3=3, C4=4, etc. Lower is better! Medicine needs ≤12, Engineering ≤16."
    else:
        reply = "I can help you with career guidance! Ask me about becoming a Doctor, Engineer, Lawyer, or check WASSCE requirements. Try our Career Search or take the Quiz!"
    
    return {"reply": reply, "session_id": message.session_id or "new-session"}

# ============================================
# Smart Recommender Endpoint
# ============================================

class SmartRequest(BaseModel):
    aggregate: int
    subjects: Dict[str, int]
    interests: Dict[str, int]

@app.post("/api/smart/recommend")
async def smart_recommend(request: SmartRequest):
    """Smart career recommendation based on real Ghanaian career data"""
    from ml.smart_recommender import recommender
    
    results = recommender.recommend(
        aggregate=request.aggregate,
        subjects=request.subjects,
        interests=request.interests
    )
    
    return results

# ============================================
# Real Ghana Data System
# ============================================

print("📚 Loading Real Ghanaian Data...")
from ml.real_data_loader import real_data
from ml.real_recommender_engine import real_recommender

class RealDataRequest(BaseModel):
    aggregate: int
    interests: List[str]
    subjects: List[str]

@app.post("/api/real-data/recommend")
async def real_data_recommend(request: RealDataRequest):
    """Recommend careers using REAL Ghanaian university and employment data"""
    
    recommendations = real_recommender.recommend(
        aggregate=request.aggregate,
        interests=request.interests,
        subjects=request.subjects
    )
    
    # Get detailed program requirements for each recommendation
    for rec in recommendations:
        program_data = real_data.get_program_requirements(rec['career'])
        rec['career_description'] = program_data.get('career_description', '')
        rec['licensing_body'] = program_data.get('licensing_body', '')
        rec['job_growth_rate'] = program_data.get('growth_rate', '')
    
    return {
        "student_profile": {
            "aggregate": request.aggregate,
            "interests": request.interests,
            "subjects": request.subjects
        },
        "recommendations": recommendations,
        "data_sources": real_data.get_data_sources(),
        "methodology": "Recommendations based on actual university admission requirements, WASSCE grading from WAEC Ghana, and labor market data from Ghana Statistical Service"
    }

@app.get("/api/real-data/sources")
async def get_sources():
    """Get all data sources used by PathwayGH"""
    return {
        "sources": real_data.get_data_sources(),
        "total_universities": len(real_data.universities),
        "total_cutoffs": len(real_data.admission_cutoffs)
    }

@app.get("/api/real-data/universities")
async def get_all_universities():
    """Get all Ghanaian universities data"""
    return list(real_data.universities.keys())

@app.get("/api/real-data/wassce-info")
async def get_wassce_info():
    """Get WASSCE grading information"""
    return real_data.wassce_data

# ============================================
# RAG Career System
# ============================================

try:
    from ml.complete_rag_system import rag_system
    
    class RAGRequest(BaseModel):
        query: str
        top_k: int = 5
    
    @app.post("/api/rag/search")
    async def rag_search(request: RAGRequest):
        """Semantic search using RAG"""
        results = rag_system.semantic_search(request.query, request.top_k)
        return {"query": request.query, "results": results, "method": "RAG with Sentence Transformers"}
    
    print("✅ RAG system loaded")
except Exception as e:
    print(f"⚠️ RAG system not available: {e}")

# ============================================
# AI Career Copilot (Optional - needs OpenAI key)
# ============================================

try:
    from ml.career_copilot import copilot
    
    class CopilotRequest(BaseModel):
        aggregate: int
        interests: List[str]
        strong_subjects: List[str]
    
    @app.post("/api/copilot/advise")
    async def copilot_advise(request: CopilotRequest):
        """AI Career Copilot - personalized guidance"""
        from ml.smart_recommender import recommender
        
        subjects_dict = {s: 85 for s in request.strong_subjects}
        interests_dict = {i: 8 for i in request.interests}
        
        recommendations = recommender.recommend(
            aggregate=request.aggregate,
            subjects=subjects_dict,
            interests=interests_dict
        )
        
        student_profile = {
            "aggregate": request.aggregate,
            "interests": request.interests,
            "strong_subjects": request.strong_subjects
        }
        
        guidance = copilot.get_guidance(student_profile, recommendations.get('predictions', []))
        
        return {
            "recommendations": recommendations.get('predictions', [])[:3],
            "guidance": guidance,
            "student_profile": student_profile
        }
    
    print("✅ AI Career Copilot loaded")
except Exception as e:
    print(f"⚠️ AI Career Copilot not available: {e}")

# ============================================
# Summary
# ============================================

print("=" * 50)
print("✅ PATHWAYGH API - COMPLETE")
print("=" * 50)
print("Available Endpoints:")
print("  GET  / - Root")
print("  GET  /health - Health check")
print("  GET  /api/careers - Browse careers")
print("  GET  /api/careers/{slug} - Career details")
print("  POST /api/eligibility/check - WASSCE checker")
print("  GET  /api/quiz/questions - Quiz questions")
print("  POST /api/quiz/submit - Submit quiz")
print("  POST /api/chatbot/chat - Chatbot")
print("  POST /api/smart/recommend - Smart recommendations")
print("  POST /api/real-data/recommend - REAL Ghana data recommendations")
print("  GET  /api/real-data/sources - Data sources")
print("  GET  /api/real-data/universities - All universities")
print("  GET  /api/real-data/wassce-info - WASSCE info")
print("  POST /api/rag/search - RAG semantic search")
print("  POST /api/copilot/advise - AI Career Copilot")
print("=" * 50)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main_complete:app", host="0.0.0.0", port=8001, reload=True)
