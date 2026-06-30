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
    from ml.lazy_rag_system import rag
    
    class RAGRequest(BaseModel):
        query: str
        top_k: int = 5
    
    @app.post("/api/rag/search")
    async def rag_search(request: RAGRequest):
        """Semantic search using RAG"""
        results = rag.semantic_search(request.query, request.top_k)
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

@app.get("/health/detailed")
async def detailed_health():
    """Detailed health check for debugging"""
    from ml.lazy_rag_system import rag
    
    return {
        "status": "healthy",
        "version": "3.0.0",
        "environment": os.getenv("ENVIRONMENT", "development"),
        "careers_count": len(CAREERS),
        "universities_count": len(real_data.universities) if hasattr(real_data, 'universities') else 0,
        "cutoffs_count": len(real_data.admission_cutoffs) if hasattr(real_data, 'admission_cutoffs') else 0,
        "rag_loaded": rag.is_loaded,
        "rag_documents": rag.document_count if hasattr(rag, 'document_count') else 0
    }

# ============================================
# RAG Endpoint with Error Handling
# ============================================

@app.post("/api/rag/search")
async def rag_search(request: RAGRequest):
    """Semantic search using RAG with error handling"""
    try:
        results = rag.semantic_search(request.query, request.top_k)
        return {
            "query": request.query,
            "results": results,
            "method": "RAG with Sentence Transformers",
            "status": "success"
        }
    except Exception as e:
        return {
            "query": request.query,
            "results": [],
            "error": str(e),
            "method": "RAG with Sentence Transformers",
            "status": "error"
        }

# ============================================
# Admission Probability Predictor
# ============================================

class AdmissionRequest(BaseModel):
    career: str
    aggregate: int
    subjects: List[str]
    preferred_university: Optional[str] = None


@app.post("/api/admission-chance")
async def predict_admission(request: AdmissionRequest):
    """Predict admission probability for a career"""
    from ml.simple_admission_predictor import predict_admission_chance
    
    results = predict_admission_chance(
        career=request.career,
        aggregate=request.aggregate,
        subjects=request.subjects,
        preferred_university=request.preferred_university
    )
    
    return results

print("✅ Admission Predictor endpoint added!")

# ============================================
# Explainability Endpoint
# ============================================

from ml.explainability.explainer import explainer

class ExplainRequest(BaseModel):
    career: Dict
    student_profile: Dict


@app.post("/api/explain/recommendation")
async def explain_recommendation(request: ExplainRequest):
    """Get detailed explanation for a recommendation"""
    return explainer.explain_recommendation(
        career=request.career,
        student_profile=request.student_profile
    )

print("✅ Explainability endpoint added!")

# ============================================
# Career Roadmap Endpoint
# ============================================

from ml.roadmap.roadmap_generator import roadmap_generator


@app.get("/api/roadmap/{career_slug}")
async def get_career_roadmap(career_slug: str):
    """Get career roadmap for a specific career"""
    # Find career by slug
    for career in CAREERS:
        if career["slug"] == career_slug:
            return roadmap_generator.get_roadmap(career["name"])
    return {"error": "Career not found"}

print("✅ Roadmap endpoint added!")

# ============================================
# Conversational Memory Endpoints
# ============================================

from ml.conversation.memory import memory

class SessionRequest(BaseModel):
    session_id: Optional[str] = None
    message: str


@app.post("/api/conversation/session")
async def create_session():
    """Create a new conversation session"""
    session_id = memory.create_session()
    return {"session_id": session_id}


@app.post("/api/conversation/chat")
async def conversation_chat(request: SessionRequest):
    """Chat with memory-aware AI"""
    session_id = request.session_id
    if not session_id:
        session_id = memory.create_session()
    
    # Add user message to memory
    memory.add_message(session_id, "user", request.message)
    
    # Get context
    context = memory.get_context(session_id)
    
    # Generate response (using existing chatbot with context)
    msg_lower = request.message.lower()
    
    # Personalized response based on context
    reply = ""
    if "doctor" in msg_lower or "medicine" in msg_lower:
        reply = "To become a doctor in Ghana: Choose General Science in SHS, take Biology/Chemistry/Physics, target aggregate ≤ 12, apply to UG/KNUST/UHAS, complete 6-year MBChB, pass Medical Council exams."
    elif "engineer" in msg_lower:
        reply = "To become an engineer: Choose General Science, take Physics/Chemistry/Elective Maths, target aggregate ≤ 16, apply to KNUST/UG, complete 4-year BSc, register with GhIE."
    elif "lawyer" in msg_lower:
        reply = "To become a lawyer: Choose General Arts, take Government/Literature, target aggregate ≤ 12, apply to UG/KNUST Law, complete LLB, pass Ghana Bar exams."
    elif "aggregate" in msg_lower:
        reply = "WASSCE aggregate is best 6 subjects (4 cores + 2 electives). A1=1, B2=2, B3=3, C4=4, etc. Lower is better! Medicine needs ≤12, Engineering ≤16."
    elif "nursing" in msg_lower:
        reply = "To become a nurse: Choose General Science, take Biology/Chemistry, target aggregate ≤ 18, apply to UHAS/UG/UCC, complete 4-year BSc Nursing, pass Nursing Council exams."
    else:
        # Personalized greeting based on context
        if context.get("interests"):
            interests_str = ", ".join(context["interests"])
            reply = f"I see you're interested in {interests_str}. I can help you explore careers in these areas! Ask me about specific careers, university requirements, or admission cutoffs."
        else:
            reply = "I can help you explore careers! Tell me about your interests, subjects, or ask about specific careers like Doctor, Engineer, Lawyer, or Nurse."
    
    # Add context to reply if available
    if context.get("career_goal"):
        goal = context["career_goal"]
        if goal.lower() not in reply.lower():
            reply += f"\n\n🎯 You mentioned interest in {goal} - would you like more details about this career path?"
    
    # Add assistant message to memory
    memory.add_message(session_id, "assistant", reply)
    
    return {
        "reply": reply,
        "session_id": session_id,
        "context": context
    }


@app.get("/api/conversation/context/{session_id}")
async def get_conversation_context(session_id: str):
    """Get conversation context"""
    context = memory.get_context(session_id)
    history = memory.get_history(session_id)
    return {"context": context, "history": history[-5:]}

print("✅ Conversational Memory endpoints added!")


# ============================================
# Action Plan Endpoint
# ============================================

from ml.action_plan.planner import planner

class ActionPlanRequest(BaseModel):
    career: str
    aggregate: int
    subjects: List[str]
    interests: List[str]


@app.post("/api/action-plan/generate")
async def generate_action_plan(request: ActionPlanRequest):
    """Generate personalized action plan"""
    return planner.generate_plan(
        career=request.career,
        aggregate=request.aggregate,
        subjects=request.subjects,
        interests=request.interests
    )

print("✅ Action Plan endpoint added!")


# ============================================
# Scholarship Endpoints
# ============================================

from ml.scholarship.data import find_scholarships_for_career, get_scholarships

class ScholarshipRequest(BaseModel):
    career: str


@app.post("/api/scholarship/find")
async def find_scholarships(request: ScholarshipRequest):
    """Find scholarships for a career"""
    return find_scholarships_for_career(request.career)


@app.get("/api/scholarship/all")
async def all_scholarships(field: str = None, level: str = None):
    """Get all scholarships with filters"""
    from ml.scholarship.data import get_scholarships
    return get_scholarships(field, level)

print("✅ Scholarship endpoints added!")


# ============================================
# Feedback Endpoint
# ============================================

class FeedbackRequest(BaseModel):
    recommendation_id: str
    career: str
    feedback_type: str
    timestamp: str


@app.post("/api/feedback/submit")
async def submit_feedback(request: FeedbackRequest):
    """Submit feedback for a recommendation"""
    print(f"📝 Feedback received: {request.feedback_type} for {request.career}")
    return {
        "status": "success",
        "message": "Thank you for your feedback!",
        "feedback": {
            "type": request.feedback_type,
            "career": request.career
        }
    }

print("✅ Feedback endpoint added!")


# ============================================
# Dashboard Endpoint
# ============================================

@app.get("/api/dashboard/stats")
async def get_dashboard_stats():
    """Get dashboard statistics"""
    return {
        "total_careers": len(CAREERS),
        "total_universities": len(real_data.universities) if hasattr(real_data, 'universities') else 12,
        "total_programs": 66,
        "total_sources": len(real_data.get_data_sources()) if hasattr(real_data, 'get_data_sources') else 13,
        "top_careers": ["Medical Doctor", "Software Engineer", "Lawyer", "Nurse", "Pharmacist"]
    }

print("✅ Dashboard endpoint added!")

# ============================================
# AI Context Engine Endpoints
# ============================================

from ml.context_engine.engine import context_engine
from ml.profile.profile_models import PathwayProfile, UserRole, EducationLevel, Region

class ProfileRequest(BaseModel):
    user_id: str
    profile: Dict


class ContextRequest(BaseModel):
    user_id: str
    query: str


@app.post("/api/profile/create")
async def create_profile(request: ProfileRequest):
    """Create a user profile"""
    profile = context_engine.create_profile(request.user_id, request.profile)
    return {
        "status": "success",
        "profile": profile.to_dict()
    }


@app.post("/api/profile/update")
async def update_profile(request: ProfileRequest):
    """Update a user profile"""
    profile = context_engine.update_profile(request.user_id, request.profile)
    if not profile:
        return {"status": "error", "message": "Profile not found"}
    return {
        "status": "success",
        "profile": profile.to_dict()
    }


@app.get("/api/profile/{user_id}")
async def get_profile(user_id: str):
    """Get a user profile"""
    profile = context_engine.get_profile(user_id)
    if not profile:
        return {"status": "error", "message": "Profile not found"}
    return {
        "status": "success",
        "profile": profile.to_dict()
    }


@app.post("/api/context/query")
async def context_query(request: ContextRequest):
    """Process a query with full context"""
    # Build context
    context = context_engine.build_context(request.user_id, request.query)

    # Generate contextual prompt
    prompt = context_engine.generate_contextual_prompt(context)

    # Get appropriate guidance - handle None safely
    guidance = context.get("guidance")
    if guidance is None:
        guidance = {}

    # Generate response based on context
    response = _generate_contextual_response(context, request.query)

    return {
        "context": context,
        "prompt": prompt,
        "response": response,
        "guidance": guidance.get("resources", []),
        "focus": guidance.get("focus", "Career guidance")
    }
@app.get("/api/profile/roles")
async def get_roles():
    """Get all available roles"""
    return {
        "roles": [
            {"id": "student_basic", "name": "Basic School Student", "emoji": "🧒"},
            {"id": "student_shs", "name": "SHS Student", "emoji": "🎓"},
            {"id": "student_university", "name": "University Student", "emoji": "🏫"},
            {"id": "student_tvet", "name": "TVET Student", "emoji": "🔧"},
            {"id": "parent", "name": "Parent / Guardian", "emoji": "👨‍👩‍👧‍👦"},
            {"id": "teacher", "name": "Teacher", "emoji": "👨‍🏫"},
            {"id": "counsellor", "name": "School Counsellor", "emoji": "💼"},
            {"id": "graduate", "name": "Graduate", "emoji": "🎓"},
            {"id": "job_seeker", "name": "Job Seeker", "emoji": "💪"}
        ]
    }


@app.get("/api/profile/regions")
async def get_regions():
    """Get all regions"""
    return {
        "regions": ["Greater Accra", "Ashanti", "Northern", "Volta", "Western", "Eastern", "Central", "Brong Ahafo", "Upper East", "Upper West"]
    }


def _generate_contextual_response(context: Dict, query: str) -> str:
    """Generate a response based on context"""
    profile = context.get("profile")
    
    # Handle case where profile is None
    if profile is None:
        return "I notice you don't have a profile set up yet. Please create your profile first by clicking the Profile tab above, then ask me again!"
    
    role = profile.get("role", "student")
    
    # Base response based on role
    role_responses = {
        "student_basic": "I'll help you explore careers in a simple way! Let's find out what you enjoy doing and what subjects you like.",
        "student_shs": "I'll help you plan your future! Based on your subjects and interests, let's find the best university paths.",
        "student_university": "Let's explore career opportunities and professional development for your future!",
        "student_tvet": "Your skills are valuable! Let me help you find the best career opportunities for your training.",
        "parent": "I'll help you support your child's educational journey with practical guidance and financial planning.",
        "teacher": "I'll help you guide your students with the best career resources and teaching strategies.",
        "counsellor": "Let me help you provide professional career guidance with data-driven insights.",
        "graduate": "Let's explore your career options and professional certification pathways.",
        "job_seeker": "I'll help you prepare for the job market with practical advice and resources."
    }
    
    base = role_responses.get(role, "I'm here to help with your career and education questions.")
    
    # Add academic context if available
    academic = context.get("academic_context", {})
    if academic and academic.get("aggregate"):
        agg = academic["aggregate"]
        base = base + "\n\n📊 With your aggregate of " + str(agg) + ", you have several options to explore."
    
    # Add career context if available
    career = context.get("career_context", {})
    if career and career.get("career_goal"):
        goal = career["career_goal"]
        base = base + "\n\n🎯 You mentioned interest in " + goal + " - let's explore this path!"
    
    # Add financial context if available
    financial = context.get("financial_context", {})
    if financial and financial.get("needs_scholarship"):
        base = base + "\n\n💰 I'll prioritize scholarship opportunities in my recommendations."
    
    # Add regional context if available
    regional = context.get("regional_context", {})
    if regional:
        base = base + "\n\n📍 I'll consider opportunities in your region."
    
    # Add query-specific response
    query_lower = query.lower()
    if "medicine" in query_lower or "doctor" in query_lower:
        base = base + "\n\nMedicine is a competitive but rewarding field. You'll need strong performance in Biology, Chemistry, and Physics."
    elif "engineering" in query_lower:
        base = base + "\n\nEngineering offers many opportunities. Civil, Mechanical, and Electrical engineering are in high demand."
    elif "law" in query_lower:
        base = base + "\n\nLaw is a respected profession. You'll need strong performance in Government and Literature."
    elif "nursing" in query_lower:
        base = base + "\n\nNursing is in very high demand across Ghana. It's a stable and rewarding career."
    elif "university" in query_lower or "school" in query_lower:
        base = base + "\n\nI can help you find universities that match your profile. Which career are you interested in?"
    
    return base
